# `lib/` — shared library

Framework-agnostic helpers and Supabase wiring shared across the App Router
pages (`app/`) and UI (`components/`). Three concerns live here:

1. **Pure utilities** — formatting and derivation logic with no I/O
   (`date.ts`, `format.ts`, `stats.ts`).
2. **Domain model** — the canonical `Record` type and the constant maps that
   drive every dropdown, chart colour, and label (`types.ts`).
3. **Data access** — the three Supabase client factories (`supabase/`) and the
   record-fetching helpers built on top of them (`records.ts`).
4. **Client hooks** — small React hooks for the browser (`useCountUp.ts`,
   `useWishlist.ts`, `useReveal.ts`, `useParallax.ts`). These are
   `"use client"` modules.

Import alias: `@/*` maps to the repo root, so files reference each other as
`@/lib/types`, `@/lib/supabase/public`, etc.

---

## Per-file breakdown

### `types.ts` — domain model & constant maps

The single source of truth for the data model. No runtime logic, only types and
constant tables.

- `type Genre` — union of nine genre slugs (`"jazz" | "rock" | … | "other"`).
- `type Condition` — `"mint" | "vg+" | "vg" | "g"`.
- `interface Record` — a vinyl row: `id`, `artist`, `title`, `year`, `genre`,
  `rating`, `notes`, `cover_url`, `purchase_price`, `purchase_date`,
  `condition`, `created_at`. Many fields are nullable (`year`, `rating`,
  `purchase_price`, `condition`, …). **Note:** this shadows the global DOM
  `Record` utility type within this module's importers — always the LP row here.
- `type RecordInput = Omit<Record, "id" | "created_at">` — shape used by the
  admin insert/update form (server generates the omitted fields).
- `GENRES: Genre[]` — ordered list of all genres; drives the genre dropdown.
- `GENRE_LABELS: { [K in Genre]: string }` — display labels. Exists because some
  slugs don't capitalize cleanly (e.g. `rnb` → `"R&B"`).
- `GENRE_COLORS: { [K in Genre]: string }` — one distinct hex colour per genre,
  used for chart bars and colour dots.
- `CONDITIONS: { value: Condition; label: string }[]` — grade options,
  best-to-worst, with human labels (e.g. `{ value: "vg+", label: "Very Good Plus (VG+)" }`).
- `type SortKey` — `"recent" | "year" | "rating" | "artist"`.
- `SORT_OPTIONS: { value: SortKey; label: string }[]` — sort dropdown options.

The `{ [K in Genre]: string }` mapped types make `GENRE_LABELS` and
`GENRE_COLORS` total at compile time — the compiler rejects a missing genre key.
The tests additionally assert there are no *extra* keys and that all maps stay
aligned with `GENRES` at runtime.

### `format.ts` — currency formatting

- `formatKRW(value: number): string` — `Math.round(value)` then
  `.toLocaleString("ko-KR")`, prefixed with `"₩ "`. E.g. `1250000 → "₩ 1,250,000"`.
  Rounding uses `Math.round`, which rounds halves toward `+Infinity`
  (`2.5 → 3`, `-1000.5 → -1000`). Negatives render as `"₩ -1,500"`.

### `date.ts` — KST timestamp formatting

- `formatKST(iso: string): string` — formats an ISO timestamp in **Asia/Seoul**
  (UTC+9) as `"YYYY. MM. DD HH:mm"` (e.g. `"2026. 05. 31 01:23"`). Uses
  `Intl.DateTimeFormat` with an explicit `timeZone`, so output is identical on
  server and client regardless of host timezone (avoids hydration mismatch).
  Uses a 24-hour clock (`hourCycle: "h23"`). Returns `""` for an unparseable
  date (`Number.isNaN(date.getTime())`).

### `stats.ts` — collection aggregates

- `interface CollectionStats` — `{ total, avg, totalValue }`.
- `collectionStats(records: Record[]): CollectionStats` — pure aggregation
  shared by the home hero (`app/page.tsx`) and the stats band
  (`components/CollectionView.tsx`) so the math can't drift between them.
  - `total` = record count.
  - `avg` = mean `rating` over **rated** records only (null ratings excluded);
    `0` when none are rated.
  - `totalValue` = sum of `purchase_price`, treating null as `0`.

### `records.ts` — record data access

Async server helpers that read records through the **public** Supabase client.
Both degrade gracefully (empty/null) when Supabase isn't configured or a query
fails, so public pages always render.

- `getRecords(): Promise<Record[]>` — selects all records ordered
  `created_at` descending (newest first). Returns `[]` when the client is `null`
  or on error (error is `console.error`-logged). Coerces null data to `[]`.
- `getRecord(id: string): Promise<Record | null>` — selects a single record by
  `id` via `.eq("id", id).single()`. Returns `null` when unconfigured or on
  error (e.g. not found).

### `supabase/` — the three clients

Each factory reads `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
and returns `null` when either is missing, so the app degrades instead of
throwing. They differ in **how** they authenticate and **where** they may run:

| File        | Factory               | Underlying        | Cookies?            | Used by / role |
|-------------|-----------------------|-------------------|---------------------|----------------|
| `client.ts` | `createClient()`      | `@supabase/ssr` `createBrowserClient` | Browser-managed | `"use client"`. Client Components: auth + admin mutations. |
| `public.ts` | `createPublicClient()`| `@supabase/supabase-js` `createClient` | **None** (cookie-free) | Public read-only data (collection / detail / stats). |
| `server.ts` | `createClient()`      | `@supabase/ssr` `createServerClient`  | Next `cookies()` | Server Components / Route Handlers needing the auth session. |

- **`client.ts`** — `createClient()` builds a browser client with
  `createBrowserClient(url, key)`, returning `null` when either env var is
  missing. This is the module's only export.
- **`public.ts`** — `createPublicClient()` builds a plain client with
  `{ auth: { persistSession: false, autoRefreshToken: false } }`. It needs **no
  request cookies** — public reads are governed purely by RLS. Avoiding
  `cookies()` decouples a route's static/dynamic nature from env-var presence at
  build time, which previously caused pages to prerender empty on the host.
- **`server.ts`** — `createClient()` is **async**: it `await`s Next's
  `cookies()` store and wires `getAll`/`setAll` so auth sessions persist.
  `setAll` is wrapped in `try/catch` because it may be called from a Server
  Component where the cookie store is read-only — that error is intentionally
  swallowed (middleware refreshes sessions there).

### `useCountUp.ts` — count-up animation hook (`"use client"`)

- `useCountUp(target: number, duration = 1400): number` — animates a number from
  `0` to `target` on mount with an ease-out-cubic curve. Returns the current
  value (a float until it lands exactly on `target`).
  - Deliberately uses **`setTimeout`, not `requestAnimationFrame`** — rAF is
    paused while a tab is hidden (and, per project memory, does not fire in the
    Claude Preview tab), which would freeze the value at `0`. The setTimeout loop
    is keyed on wall-clock elapsed time (`Date.now()`), so it always completes.
  - `target === 0` short-circuits to `0`.
  - Honours `prefers-reduced-motion: reduce` by jumping straight to `target`.
  - Cleans up its pending timer on unmount.

### `useReveal.ts` — scroll-reveal hook (`"use client"`)

- `useReveal<T>()` → `{ ref, revealed }` — attach `ref` to an element;
  `revealed` flips to `true` (once, permanently) when it enters the viewport.
  Callers style the fade/rise transition and stagger via `transition-delay`.
  - Primary driver is `IntersectionObserver` (rootMargin `0 0 -8% 0`), but
    elements already in the viewport on mount reveal via a 0ms `setTimeout`,
    and a passive `scroll` listener re-runs the viewport check — IO callbacks
    don't fire in hidden tabs / the Claude Preview tab.
  - Missing `IntersectionObserver` (jsdom) or `prefers-reduced-motion` reveals
    immediately. All listeners/observers are cleaned up after reveal/unmount.

### `useParallax.ts` — scroll parallax hook (`"use client"`)

- `useParallax<T>(rate = 0.12)` → `ref` — translates the element down by
  `rate × scrollY` via a passive scroll listener writing `translate3d` inline,
  so it climbs at `(1 − rate)×` scroll speed (the hero cover drift). No rAF
  (paused in hidden tabs). Disabled under `prefers-reduced-motion`; clears the
  inline transform on unmount. The handoff suggested 0.3–0.5× but that drives
  the lead cover into the grid below — 0.12 keeps the drift collision-free.

### `useWishlist.ts` — localStorage wishlist hook (`"use client"`)

- `useWishlist()` → `{ ids: string[]; count: number; toggle(id); has(id) }` — a
  `localStorage`-backed set of record ids under key
  `"vinyl-archive:wishlist"`, shared across all components on the page.
  - Built on `useSyncExternalStore` with a module-level cached `snapshot` (kept
    referentially stable between changes so React doesn't loop).
  - `toggle(id)` adds/removes the id and persists; `has(id)` is a membership
    check; `count` is `ids.length`.
  - Cross-component sync within one tab is achieved by dispatching a custom
    `"wishlist-change"` event on write; the subscriber also listens to the
    native `"storage"` event for cross-tab sync.
  - SSR-safe: `read()` returns `[]` when `window` is undefined, and corrupt
    stored JSON falls back to `[]` (try/catch).

---

## Data flow

```
Supabase (Postgres + RLS)
        │
        ├── public.ts  createPublicClient() ──► records.ts (getRecords/getRecord)
        │                                              │
        │                                              ▼
        │                                   app/ Server Components (page, record/[id], stats)
        │                                              │
        │                                       collectionStats() (stats.ts)
        │                                              ▼
        │                                   components/ (CollectionView, HeroStats, AlbumCard …)
        │                                       format* / formatKST render values
        │
        ├── server.ts  createClient()  ──► Server Components / Route Handlers needing the session
        │
        └── client.ts  createClient()  ──► Client Components (auth, admin mutations)

Browser-only state (no Supabase):
  useWishlist()  ──► localStorage "vinyl-archive:wishlist"  (cross-component + cross-tab sync)
  useCountUp()   ──► animated stat counters in the hero
  useReveal()    ──► fade/rise-in of gallery cards on scroll
  useParallax()  ──► slow drift of the lead album cover
```

---

## Gotchas / risks

- **`Record` name clash.** `types.ts` exports an interface named `Record`,
  shadowing TypeScript's built-in `Record<K, V>` utility type wherever it's
  imported. Files that need the utility type must avoid importing this one.
- **`NEXT_PUBLIC_*` are inlined at build time.** Vite/Next statically replace
  `process.env.NEXT_PUBLIC_*` references during transform. The three client
  factories read env inside the function body, i.e. at *call* time, so under
  Vitest they respond to `vi.stubEnv(...)` and behave correctly per environment.
  Any *module-level* const derived from `NEXT_PUBLIC_*` would instead be frozen
  at transform time and could not be unit-tested — so the configured/unconfigured
  branch is exercised only through the call-time factories (which the tests do
  cover, asserting both the `null` and constructed-client paths).
- **`server.ts createClient()` is async** (it `await`s `cookies()`), unlike the
  other two factories. Callers must `await` it.
- **`server.ts` swallows `setAll` errors by design** — a thrown read-only-cookie
  error in a Server Component context is expected and intentionally ignored.
- **`getRecords`/`getRecord` never throw on DB failure** — they return `[]` /
  `null` so public pages always render. A real outage looks like an empty
  collection, not an error page (errors are `console.error`-logged only).
- **`useWishlist` keeps module-level mutable state** (`snapshot`). It's required
  by `useSyncExternalStore`'s referential-stability contract, but it means the
  cached snapshot is shared process-wide — fine in the browser, and primed on
  every `subscribe`.
- **`useCountUp` is `Date.now()`-driven.** Tests must pin the clock
  (`vi.useFakeTimers()` + `vi.setSystemTime`) and advance timers to drive the
  count; the last committed value reflects the most recent ~16ms tick, not the
  exact elapsed time.

---

## Testing

Colocated Vitest suites (`*.test.ts`) cover every testable unit:

| Suite | Covers |
|-------|--------|
| `date.test.ts` | TZ-stable `formatKST` output + invalid-date branch |
| `format.test.ts` | `formatKRW` rounding, zero, large, negative (extends the original smoke test) |
| `types.test.ts` | `GENRES`/`GENRE_LABELS`/`GENRE_COLORS` key alignment; `CONDITIONS`/`SORT_OPTIONS` shape |
| `stats.test.ts` | `collectionStats` total / avg (rated-only) / totalValue |
| `records.test.ts` | `getRecords`/`getRecord` query shape + null/error fallbacks (Supabase mocked) |
| `useCountUp.test.ts` | fake-timer-driven count-up, reduced-motion, unmount cleanup |
| `useWishlist.test.ts` | add/remove/persist/read, multi-instance sync, corrupt-JSON fallback |
| `useReveal.test.ts` | no-IO fallback reveal path (fake timers), one-way latch |
| `useParallax.test.tsx` | rate × scrollY transform, mount offset, unmount cleanup, reduced-motion |
| `supabase/{client,public,server}.test.ts` | each factory constructs with the right URL/key/cookie config (deps + env mocked) |

All network and Supabase access is mocked (`vi.mock`) — tests never hit the real
DB. Run them with:

```bash
npx vitest run lib/
```
