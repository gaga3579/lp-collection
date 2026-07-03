# `app/` — Next.js App Router

This directory is the routing and rendering root for the Vinyl Archive app
(Next.js 16.2.6, App Router, React 19, Tailwind v4, Supabase). It defines the
document shell, the public pages (collection, stats, record detail), the owner
admin page, and a single server-side API route that proxies Spotify album
search.

> **Heads-up:** this project runs a *modified* Next.js. APIs may differ from
> upstream — see `AGENTS.md`. Everything below was verified against the bundled
> docs under `node_modules/next/dist/docs/`.

## Route tree

| Route            | File                          | Kind                         | Segment config           |
| ---------------- | ----------------------------- | ---------------------------- | ------------------------ |
| (shell)          | `layout.tsx`                  | Sync Server Component        | —                        |
| `/`              | `page.tsx`                    | **async** Server Component   | `dynamic = "force-dynamic"` |
| `/stats`         | `stats/page.tsx`              | **async** Server Component   | `dynamic = "force-dynamic"` |
| `/record/[id]`   | `record/[id]/page.tsx`        | **async** Server Component   | `dynamic = "force-dynamic"` |
| `/admin`         | `admin/page.tsx`              | Client Component (`"use client"`) | —                  |
| `/api/spotify-search` | `api/spotify-search/route.ts` | Route Handler (`GET`)   | (uncached by default)    |

Global styles live in `globals.css`.

## Why `force-dynamic`?

All three public pages export `export const dynamic = "force-dynamic"`. This
forces request-time rendering so Supabase is queried with **runtime** env vars
instead of being baked into a build-time static prerender (which previously
produced empty pages on the host). This pairs with `lib/supabase/public.ts`,
which deliberately avoids `cookies()` so the route's static/dynamic nature does
not depend on env-var presence at build time. `force-dynamic` is a valid route
segment config here because Cache Components is **not** enabled in
`next.config.ts` (when Cache Components is on, this Next version removes the
`dynamic` option).

## Per-file breakdown

### `layout.tsx` — root document shell

- **Default export** `RootLayout({ children })` — a synchronous Server
  Component returning `<html lang="en">…<body>{children}</body></html>`.
- Loads two Google fonts via `next/font/google` (`Instrument_Sans` →
  `--font-instrument-sans`, `Instrument_Serif` weight 400 in normal + italic
  styles → `--font-instrument-serif`) and attaches their CSS-variable class
  names to `<html>`. `<html>` also gets `h-full`, `<body>` gets `min-h-full`.
- **Named export** `metadata: Metadata` — `{ title: "Vinyl Archive",
  description: "A personal collection of LP vinyl records." }`.

### `page.tsx` — home / collection (`/`)

- **Default export** `HomePage()` — async Server Component.
- Data flow: computes `configured` from the presence of
  `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`; calls
  `getRecords()` (`lib/records.ts`) to load all records newest-first.
- Derives hero stats via the **extracted, exported** `collectionStats(records)`
  helper (`lib/stats.ts`), which returns `{ total, avg, totalValue }`: `avg` =
  mean `rating` over records where `rating != null` (0 when none rated);
  `totalValue` = sum of `purchase_price ?? 0`; `total` = record count. The page
  itself contains no inline stats math — the logic is centralized in
  `lib/stats.ts` and shared with `components/CollectionView.tsx`.
- Renders `<Nav>`, an optional Korean "Supabase not configured" notice when
  `!configured`, the "Modern Gallery" title block (eyebrow, an H1 that spells
  the record count out via a local `countPhrase` helper — words up to twenty,
  numerals beyond — with the count phrase set in italic serif), a
  `<HeroStats total avg totalValue>` stat line, and `<CollectionView records>`.

### `stats/page.tsx` — statistics (`/stats`)

- **Default export** `StatsPage()` — async Server Component; calls
  `getRecords()`.
- Aggregations computed inline:
  - **By genre:** for each genre in `GENRES`, count matching records; keep only
    counts > 0; `maxGenre = Math.max(1, …)` is the bar-scale denominator.
  - **By decade:** bucket records by `Math.floor(year / 10) * 10` (skipping
    `year == null`), sorted ascending; `maxDecade` scales the bars.
  - **Top rated:** records with `rating != null`, sorted by rating desc, first
    5.
- Renders genre bar chart (colors from `GENRE_COLORS`), decade column chart, and
  a top-rated list linking to `/record/[id]`. Shows an empty state when there
  are no records.

### `record/[id]/page.tsx` — record detail (`/record/[id]`)

- **Default export** `RecordPage({ params })` — async Server Component.
  - **`params` is a `Promise`** (`Promise<{ id: string }>`) and is **awaited**:
    `const { id } = await params;`. This is the async-params convention in this
    Next version — do not read `params.id` synchronously.
- Calls `getRecord(id)` (`lib/records.ts`); calls `notFound()` from
  `next/navigation` when the record is missing (renders the 404 boundary).
- Maps `condition` to a label via `CONDITIONS`; falls back to the raw value then
  `"—"`. Formats price with `formatKRW` (`lib/format.ts`) and the created-at
  timestamp with `formatKST` (`lib/date.ts`, Asia/Seoul). Renders cover art (or a
  ♪ placeholder), a `<WishlistButton>`, star rating, and a definition list of
  fields. Defines a local non-exported `Field` helper.

### `admin/page.tsx` — owner admin (`/admin`)

- **`"use client"`** component. **Default export** `AdminPage()`.
- Creates a browser Supabase client once via `createClient()`
  (`lib/supabase/client.ts`); degrades gracefully to a "not configured" notice
  when it returns `null`.
- **Auth/ownership:** reads the current user with `supabase.auth.getUser()` and
  subscribes via `onAuthStateChange`. `isOwner` is true only when the signed-in
  `user.email === process.env.NEXT_PUBLIC_OWNER_EMAIL`. Sign-in uses Google
  OAuth (`signInWithOAuth`) with `redirectTo: window.location.href`.
- **CRUD (owner only):** `loadRecords` selects `records` ordered by
  `created_at` desc. `handleSubmit` inserts (or updates by `id` when `editing`)
  via `<RecordForm>`; `handleDelete` confirms then deletes. Errors surface in a
  `Notice`. Defines a local non-exported `Notice` helper.

### `api/spotify-search/route.ts` — Spotify album search proxy

- **Named export** `GET(request: NextRequest)` — Route Handler. Reads the query
  via `request.nextUrl.searchParams.get("q")?.trim()`.
- Behavior / responses (all JSON via `NextResponse.json`):
  - **Empty/whitespace `q`** → `200 { results: [] }` (no upstream call).
  - **Missing/failed token** → `501 { error: "Spotify is not configured on the
    server." }`. A token is obtained via the **client-credentials** flow against
    `accounts.spotify.com`; `getToken()` returns `null` when
    `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` are absent **or** when the
    token request is not `ok`.
  - **Upstream search not `ok`** → `NextResponse.json({ error: "Spotify search
    failed." }, { status: res.status })` (propagates the upstream status, e.g.
    429).
  - **Success** → `200 { results: [...] }`, where each item is
    `{ artist, title, year, cover_url }`. `artist` joins all album artist names
    with `", "`; `year` is `parseInt(release_date.slice(0,4))` or `null` when the
    date is empty; `cover_url` is the first image URL or `null`. Reads up to 8
    albums (`limit=8`, `type=album`).
- **Token cache:** the client-credentials token is cached in **module scope**
  (`cachedToken`) and reused while it is ≥ 5s from expiry — saving a token round
  trip on subsequent requests within the same server process.

### `globals.css` — theme tokens

Tailwind v4 (`@import "tailwindcss"`) with a `@theme` block defining the "Modern
Gallery" palette and fonts (from the Claude Design handoff):

- Colors: `--color-canvas #fcfcfb`, `--color-card #ffffff`,
  `--color-ink #141412`, `--color-muted #8c8a84`, `--color-line #eceae4`
  (exposed as Tailwind utilities like `bg-canvas`, `text-ink`, `border-line`).
- Cover shadows: `--shadow-cover(-hover)` and `--shadow-cover-lg(-hover)` —
  layered soft shadows for grid/hero album covers (`shadow-cover*` utilities);
  the `-hover` variants are the deepened hover state.
- Fonts: `--font-serif` (Instrument Serif stack) and `--font-sans`
  (Instrument Sans stack), bound to the CSS variables set in `layout.tsx`.
- Base rules set the page background/ink color; `.font-display` applies the
  serif face at weight 400.
- `.gutter` — the shared horizontal page padding every section aligns to
  (24px → 48px @48rem → 120px @80rem, matching the handoff's 120px gutter on a
  1440px frame).

## Gotchas / risks

- **Module-scoped token cache** in the Spotify route persists across requests
  *and* across tests in the same worker. Tests must `vi.resetModules()` +
  re-import `route.ts` per case to isolate the cache (see
  `route.test.ts`).
- **`params` is async** in `record/[id]/page.tsx` — must be awaited.
- **Async Server Components are not unit-renderable** under Vitest (this Next
  version's async components can't be rendered in jsdom). `page.tsx`,
  `stats/page.tsx`, and `record/[id]/page.tsx` are covered by E2E, not unit
  tests. `page.tsx`'s hero-stat math is the exception: it is **extracted into
  the pure, exported `collectionStats()`** (`lib/stats.ts`), which is unit-
  testable on its own (its test lives in `lib/`, outside this directory). The
  inline aggregations in `stats/page.tsx` (genre/decade/top-rated) and the field
  mapping in `record/[id]/page.tsx` remain non-exported and E2E-covered.
- **`RootLayout` renders `<html>`/`<body>`**, which jsdom strips when mounted
  into a `<div>` via RTL. The layout test inspects the returned React element
  tree directly rather than the DOM.
- **`force-dynamic`** is required for correct runtime Supabase reads; removing it
  risks empty static prerenders on the host.
- The owner gate is **client-side** (`NEXT_PUBLIC_OWNER_EMAIL`); actual write
  authorization must be enforced by Supabase RLS, not by this UI check.

## Tests in this directory

- `api/spotify-search/route.test.ts` — exercises `GET` directly with mocked
  `global.fetch` and env: missing/whitespace query, missing creds (501), token
  request failure (501), success mapping (artist join, year parse, cover
  fallback), missing `albums` field, upstream-error status propagation, and
  module-scope token-cache reuse.
- `layout.test.tsx` — asserts `metadata`, and inspects the returned element tree
  for the `<html>`/`<body>` shell, font CSS variables, sizing classes, and
  child forwarding (`next/font/google` and `globals.css` are mocked).

Run them with: `npx vitest run app/`
