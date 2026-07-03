# `supabase/`

Database schema for the Vinyl Archive app. This directory holds the **single
source of truth for the Postgres / Supabase backend**: the `records` table that
every page reads from and the admin form writes to, plus the Row Level Security
(RLS) policies that make the collection publicly readable while restricting
writes to the owner.

There is no migration runner here. The schema is applied by hand — copy
`schema.sql` into the Supabase **SQL Editor** (Project → SQL Editor → New query)
and run it. The script is idempotent on the table (`create table if not
exists`) but **not** on the policies (see [Gotchas](#gotchas--risks)).

## Files

| File             | Purpose                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| `schema.sql`     | DDL for `public.records`, enables RLS, and declares all four policies.   |
| `schema.test.ts` | Vitest guard that reads `schema.sql` as text and asserts its structure. |
| `README.md`      | This document.                                                          |

## `schema.sql`

A plain SQL script (no exported symbols). It does three things, in order:

1. Creates the `public.records` table.
2. Enables Row Level Security on it.
3. Declares one public-read policy and three owner-only write policies.

### Table: `public.records`

One row per vinyl record. Columns, in declaration order:

| Column           | Type          | Null?    | Default              | Constraint                              |
| ---------------- | ------------- | -------- | -------------------- | --------------------------------------- |
| `id`             | `uuid`        | not null | `gen_random_uuid()`  | **primary key**                         |
| `artist`         | `text`        | not null | —                    | —                                       |
| `title`          | `text`        | not null | —                    | —                                       |
| `year`           | `integer`     | nullable | —                    | —                                       |
| `genre`          | `text`        | not null | `'other'`            | free text (see note)                    |
| `rating`         | `integer`     | nullable | —                    | `check (rating between 1 and 5)`        |
| `notes`          | `text`        | nullable | —                    | —                                       |
| `cover_url`      | `text`        | nullable | —                    | —                                       |
| `purchase_price` | `numeric`     | nullable | —                    | —                                       |
| `purchase_date`  | `date`        | nullable | —                    | —                                       |
| `condition`      | `text`        | nullable | —                    | `check (condition in ('mint','vg+','vg','g'))` |
| `created_at`     | `timestamptz` | not null | `now()`              | —                                       |

Notes:

- **`genre` is free text, not an enum or check constraint.** The database will
  accept any string. The application *conventionally* uses the nine values
  `jazz, rock, soul, rnb, rap, pop, electronic, classical, other` (mirrored in
  `lib/types.ts`), but nothing in the schema enforces this. A bad genre value
  will pass the DB and only surface as a type mismatch / missing color/label in
  the UI.
- **`condition` is the only string column with a DB-enforced allow-list.** The
  four grades come straight from the Discogs-style grading scale.
- **No explicit indexes** are declared beyond the implicit primary-key index on
  `id`. The hottest query, `order by created_at desc` (see Data flow), runs
  without a supporting index. Fine at small collection sizes; revisit if the
  table grows large.

### Row Level Security

RLS is **enabled** on `public.records`, so with RLS on and no matching policy a
request sees nothing. Four policies are declared:

| Policy name                                  | Command  | Role            | Rule                                                  |
| -------------------------------------------- | -------- | --------------- | ----------------------------------------------------- |
| `Public records are viewable by everyone`    | `SELECT` | (all / `public`)| `using (true)` — unconditional read                   |
| `Owner can insert records`                   | `INSERT` | `authenticated` | `with check (auth.jwt() ->> 'email' = '<owner>')`     |
| `Owner can update records`                   | `UPDATE` | `authenticated` | `using (...) with check (...)` on the owner email      |
| `Owner can delete records`                   | `DELETE` | `authenticated` | `using (auth.jwt() ->> 'email' = '<owner>')`          |

- **Reads are wide open.** The `SELECT` policy is `using (true)` with no role
  restriction, so anonymous (anon-key) clients can read every row. This is
  intentional — the collection, detail, and stats pages are public and fetch
  with the anon key.
- **Writes are owner-gated by JWT email.** All three write policies require the
  `authenticated` role *and* that the JWT's `email` claim equals the hard-coded
  owner address (`hijun2952@gmail.com`). `INSERT` uses `with check`, `DELETE`
  uses `using`, and `UPDATE` uses both (so a row must pass the owner check both
  before and after the update).
- The owner email is **hard-coded in four places** in the SQL. Changing the
  owner means editing all of them (and re-running the policies — see Gotchas).

## How it maps to `lib/types.ts`

The TypeScript `Record` interface is the in-app shape of one table row. The
mapping is 1:1, with nullability matching the DB:

| DB column        | DB nullability | `Record` field   | TS type            |
| ---------------- | -------------- | ---------------- | ------------------ |
| `id`             | not null       | `id`             | `string`           |
| `artist`         | not null       | `artist`         | `string`           |
| `title`          | not null       | `title`          | `string`           |
| `year`           | nullable       | `year`           | `number \| null`   |
| `genre`          | not null       | `genre`          | `Genre`            |
| `rating`         | nullable       | `rating`         | `number \| null`   |
| `notes`          | nullable       | `notes`          | `string \| null`   |
| `cover_url`      | nullable       | `cover_url`      | `string \| null`   |
| `purchase_price` | nullable       | `purchase_price` | `number \| null`   |
| `purchase_date`  | nullable       | `purchase_date`  | `string \| null`   |
| `condition`      | nullable       | `condition`      | `Condition \| null`|
| `created_at`     | not null       | `created_at`     | `string`           |

- **`Genre`** (`"jazz" | "rock" | "soul" | "rnb" | "rap" | "pop" |
  "electronic" | "classical" | "other"`) is a TypeScript-only union. The DB
  column is plain `text` defaulting to `"other"`, so the union is **narrower
  than the DB allows** — the type is a developer convention, not a guarantee the
  data conforms.
- **`Condition`** (`"mint" | "vg+" | "vg" | "g"`) **exactly matches** the DB
  `check (condition in (...))` allow-list. These two must be kept in sync; the
  test asserts the SQL side.
- `purchase_date` is a SQL `date` but typed as `string` in TS because Supabase
  returns dates as ISO strings.
- `RecordInput` (in `lib/types.ts`) is `Omit<Record, "id" | "created_at">` —
  the admin form omits the two server-generated columns, matching the DB
  defaults (`gen_random_uuid()` and `now()`).

## Data flow

- **Public reads** — `lib/records.ts`:
  - `getRecords()` → `from("records").select("*").order("created_at", {
    ascending: false })` — every row, newest first. Returns `[]` on
    error/unconfigured client so pages still render.
  - `getRecord(id)` → `from("records").select("*").eq("id", id).single()` —
    one row by primary key, or `null` if missing.
  - Both use `createPublicClient()` (anon key), which is why the `SELECT`
    policy must allow anonymous reads.
- **Owner writes** — `app/admin/page.tsx` uses an authenticated Supabase client
  to `insert`, `update(...).eq("id", ...)`, and `delete().eq("id", ...)`. These
  succeed only when the signed-in user's JWT email matches the owner policy.

## Gotchas / risks

- **Policies are not idempotent.** The table uses `create table if not exists`,
  but each `create policy` has no `if not exists` / `or replace` guard.
  Re-running `schema.sql` against a database that already has the policies will
  error (`policy ... already exists`). To re-apply, `drop policy` first or run
  only the table block.
- **`genre` has no DB-level validation.** Any string is accepted. Keep
  `lib/types.ts` `GENRES` and the app's writes as the only guard; consider a
  `check` constraint if data integrity matters.
- **Owner email is hard-coded in four spots.** Rotating the owner requires
  editing all four policy bodies and re-applying them. There is no
  parameterization.
- **Reads are fully public (anon).** Anyone with the anon key (which ships to
  the browser) can `select *` from `records`. Do not store anything sensitive
  in this table — `notes`, `purchase_price`, and `purchase_date` are all
  world-readable.
- **No `updated_at` column.** Only `created_at` exists; there's no audit trail
  of edits.
- **No supporting index for the default sort.** `order by created_at desc` does
  a sort without an index.

## Tests (`schema.test.ts`)

`schema.test.ts` reads `schema.sql` **as text** with `fs.readFileSync` (path
resolved from `import.meta.url`, so it's cwd-independent) and asserts structural
expectations against a whitespace-normalized, lower-cased copy. It hits **no
database and no network** — it is a pure regression guard over the SQL source.

It verifies:

- exactly one table, `public.records`, created with `if not exists`;
- all 12 expected columns are present with their declared types (the 1:1 set
  behind the `Record` type);
- `id` is the `gen_random_uuid()` primary key; `artist`/`title` are `NOT NULL`;
  `genre` defaults to `'other'` and `created_at` defaults to `now()`, both
  `NOT NULL`;
- the `rating between 1 and 5` and `condition in ('mint','vg+','vg','g')` check
  constraints, including that the condition list exactly matches the
  `Condition` union in `lib/types.ts`;
- RLS is enabled; the public `SELECT using (true)` policy exists; and the three
  `authenticated`-only write policies (`insert`/`update`/`delete`) exist and
  gate on the owner's JWT email claim (4 references total).

Run them with:

```sh
npx vitest run supabase/
```
