# `components/`

UI building blocks for the Vinyl Archive app. These are the React components the
App Router pages in `app/` compose together: the collection grid, the album
cards, the hero stat counters, the top nav, and the admin record form. Pure
presentation/typing logic lives here; data fetching happens in the server
components under `app/` and is passed down as props.

Stack notes: Next.js 16 App Router, React 19, TypeScript (strict), Tailwind v4.
Color/spacing tokens like `bg-card`, `border-line`, `text-muted`, `text-ink`,
`bg-canvas` are project Tailwind theme colors.

## Files at a glance

| File | Client? | Default export | Role |
| --- | --- | --- | --- |
| `GenreDot.tsx` | server-safe | `GenreDot` | Colored dot keyed to a genre |
| `StarRating.tsx` | server-safe | `StarRating` | Read-only 5-star display |
| `AlbumCard.tsx` | `"use client"` | `AlbumCard` | Linkable gallery card (grid + featured hero) |
| `HeroStats.tsx` | `"use client"` | `HeroStats` | Animated hero stat line |
| `WishlistButton.tsx` | `"use client"` | `WishlistButton` | Heart toggle backed by localStorage |
| `Nav.tsx` | `"use client"` | `Nav` | Top nav; active link + owner-only "+ Add LP" |
| `CollectionView.tsx` | `"use client"` | `CollectionView` | Search/filter/sort gallery + stats band |
| `admin/RecordForm.tsx` | `"use client"` | `RecordForm` | Controlled create/edit form + Spotify lookup |

`GenreDot` and `StarRating` carry no `"use client"` directive and no
client-only hooks of their own, so they render fine in either a server or
client component. `AlbumCard` is a client component: it drives its own
scroll-reveal (`useReveal`) and, in featured mode, parallax (`useParallax`).

## Per-file reference

### `GenreDot.tsx`
`GenreDot({ genre, size = 9 })` — an `inline-block` rounded `<span>` whose
`backgroundColor` is `GENRE_COLORS[genre]` (falling back to `GENRE_COLORS.other`)
and whose `title` tooltip is `GENRE_LABELS[genre] ?? genre`. `size` (px) sets
both width and height. No text content.

### `StarRating.tsx`
`StarRating({ value, size = 14, className = "" })` — read-only display of five
star SVGs. `value: number | null`; `rating = value ?? 0`. A star is "filled"
(`fill="#141412"`, full opacity) when its index `n <= rating`, otherwise
`fill="none"` at 25% opacity. The wrapper carries an `aria-label`:
`"{value} out of 5 stars"` when truthy, else `"Not rated"`. `className` is
appended to the wrapper. This component is display-only; it has no click
handlers.

### `AlbumCard.tsx` (client)
`AlbumCard({ record, featured = false, index = 0, eyebrow = "Latest addition" })`
— a `next/link` to `/record/{id}` styled as a gallery piece: a square cover
floating on a layered `shadow-cover*` shadow (radius 2px), no card border/bg.
- Cover: renders `record.cover_url` as an `<img>` (alt `"{title} cover"`,
  lazy in grid mode / eager in featured mode), or a `♪` glyph placeholder.
  On hover the cover lifts 6px and its shadow deepens (`group-hover`).
- Top-right corner overlays a `WishlistButton` (17px icon featured / 15px grid).
- Grid mode: below the cover — uppercase artist, title (`<h3>`),
  `{year ?? "—"} · {GENRE_LABELS[genre] ?? genre}`, and a 12px `StarRating` on
  the right. No 등록-date line in grid mode.
- `featured` (the lead/hero slot): two-column grid on `lg`
  (`minmax(0,660px) 1fr`, stacked on smaller screens) — large parallaxed cover
  (`useParallax`) beside an info column with the `eyebrow` kicker
  (`"{eyebrow} · {genre}"`), the title as an `<h2>`, an italic-serif
  `"{artist}, {year}"` line, a 14px `StarRating`, and
  `등록 {formatKST(created_at)}` (KST = Asia/Seoul, +9h).
- Every card fades/rises in on scroll via `useReveal`; `index` staggers grid
  items by `(index % 3) * 80ms` of transition delay.

### `HeroStats.tsx` (client)
`HeroStats({ total, avg, totalValue })` — renders a single baseline-aligned line:
`<n> records`, `<n> avg rating` (`toFixed(1)`), and (only when `totalValue > 0`)
`<formatKRW> total value`. Each number is animated via `useCountUp` (durations
1200/1400/1600 ms). `total` is shown `Math.round`ed; `totalValue` is rounded
before `formatKRW`.

### `WishlistButton.tsx` (client)
`WishlistButton({ id, size = 18 })` — a heart `<button>` driven by the
`useWishlist` hook. `active = has(id)`. On click it calls
`e.preventDefault()` + `e.stopPropagation()` (so the click does not trigger the
enclosing `AlbumCard` link) then `toggle(id)`. Exposes `aria-pressed={active}`
and an `aria-label` of `"Remove from wishlist"` / `"Add to wishlist"`. The heart
SVG is filled red (`#b34a3a`) when active, otherwise unfilled.

### `Nav.tsx` (client)
`Nav()` — sticky, borderless top header (blurred canvas background). Always
shows the `Vinyl Archive` wordmark (→ `/`), `Collection` (→ `/`), and `Stats`
(→ `/stats`); the link matching `usePathname()` renders in ink, the rest in
muted. The right-hand admin entry is owner-gated: it renders the prominent `+ Add LP` button when the signed-in
Supabase user's email equals `process.env.NEXT_PUBLIC_OWNER_EMAIL`, otherwise a
plain `Admin` link. Both point to `/admin`. On mount it calls
`createClient()` (from `@/lib/supabase/client`); if that returns `null`
(Supabase not configured) it bails out and stays in the non-owner state. It
subscribes to `auth.onAuthStateChange` and unsubscribes on unmount.

### `CollectionView.tsx` (client)
`CollectionView({ records })` — the main collection screen. Local state:
`query` (search), `filter` (`Genre | "all"`), `sort` (`SortKey`). Reads
`wishlistCount` from `useWishlist`.
- **`visible`** (memoized): filters by genre (`filter === "all"` or
  `r.genre === filter`) **and** a case-insensitive substring match of the
  trimmed query against artist or title, then sorts:
  - `year` → `b.year - a.year` (nulls treated as 0), descending
  - `rating` → `b.rating - a.rating` (nulls as 0), descending
  - `artist` → `a.artist.localeCompare(b.artist)`, ascending
  - `recent` (default) → newest `created_at` first
- Renders the first visible record as the `featured` hero `AlbumCard` (its
  eyebrow comes from the local `LEAD_EYEBROWS` map keyed by the active sort,
  e.g. `recent → "Latest addition"`, `rating → "Highest rated"`), then the rest
  in a responsive gallery grid (1 → 2 → 3 columns). Empty states:
  `"No records yet…"` when `records` is empty, `"No records match your
  search."` when a filter/search hides everything.
- Filter pills are plain text (no dots): an `"All {total}"` pill plus one pill
  per **present** genre with its count; the active pill is bold with a 1.5px
  bottom border. The search input is the inline icon + `"Search"` affordance
  (aria-label `"Search artist or title"`, expands on focus); the sort control
  reads `"Sorted by — {select}"`.
- **`stats`** (memoized): spreads `collectionStats(records)` from `@/lib/stats`
  (`total`, average `rating` over rated records, `totalValue` = sum of
  `purchase_price`) and adds locally-computed per-genre counts (`byGenre`,
  genres with count 0 omitted). Rendered in a centered "By the numbers · 통계"
  band (large serif numerals over small uppercase labels, plus a
  `GenreDot` legend) only when `records.length > 0`, using the local
  `CountUpStat` helper (which wraps `useCountUp`). The "On wishlist" stat uses
  `wishlistCount` from `useWishlist`, not part of `stats`.

`CountUpStat({ label, target, format, valueClassName, duration })` is a small
private component in this file — not exported.

### `admin/RecordForm.tsx` (client)
`RecordForm({ initial?, onSubmit, onCancel?, saving? })` — a fully controlled
form for creating or editing a record.
- State seeds from `EMPTY` (a blank `RecordInput`, genre `"other"`) or, when
  `initial` is given, from `fromRecord(initial)` (strips `id` + `created_at`).
- Fields: Artist*, Title* (required text), Year (number), Genre (select), Rating
  (select; `""`→`null`, otherwise `Number`), Condition (select; `""`→`null`),
  Purchase price (number, step 0.01), Purchase date (`<input type="date">`,
  `""`→`null`), Cover URL (`""`→`null`), Notes (textarea, `""`→`null`).
- **Spotify lookup**: typing a query and pressing Search (or Enter) calls
  `GET /api/spotify-search?q=<encoded>`. On `res.ok` it lists results; clicking
  a result fills artist/title/year/cover_url and clears the search. On a non-ok
  response it shows `data.error ?? "Search failed."`; on a thrown fetch it shows
  `"Could not reach the search service."`. A blank query is a no-op.
- Submit calls `e.preventDefault()` then `onSubmit(values)` — the parent owns
  persistence. The submit button shows `Saving…` (disabled) when `saving`, else
  `Save changes` (edit) or `Add record` (create). `Cancel` renders only when
  `onCancel` is supplied.

`TextField` / `NumberField` / `SelectField` are private helpers in this file.

## Data flow

```
app/page.tsx (server)         app/admin/page.tsx (client)
  fetch records  ─────────┐     fetch one record ──┐
                          ▼                          ▼
   <HeroStats …/>   <CollectionView records>   <RecordForm initial onSubmit …>
                          │                          │
                          ▼                          └─ POST/UPDATE via Supabase
                     <AlbumCard featured? index eyebrow> (owned by the page)
                          ├─ useReveal / useParallax (scroll motion)
                          ├─ <StarRating>
                          └─ <WishlistButton> ── useWishlist (localStorage)
```

`Record` / `RecordInput` / `Genre` / `Condition` / `SortKey` and the
`GENRES`, `GENRE_LABELS`, `GENRE_COLORS`, `CONDITIONS`, `SORT_OPTIONS` tables all
come from `@/lib/types`. Formatting helpers: `formatKRW` (`@/lib/format`),
`formatKST` (`@/lib/date`). Collection figures: `collectionStats`
(`@/lib/stats`). Animation: `useCountUp` (`@/lib/useCountUp`).
Wishlist state: `useWishlist` (`@/lib/useWishlist`). Scroll motion:
`useReveal` / `useParallax` (`@/lib/useReveal`, `@/lib/useParallax`). Auth:
`createClient` (`@/lib/supabase/client`).

## Gotchas / risks

- **Owner email is captured at import time.** `Nav` reads
  `process.env.NEXT_PUBLIC_OWNER_EMAIL` into a module-level constant, so it is
  baked in at build/first-import. Tests that vary it must reset the module
  registry before importing `Nav` (see `Nav.test.tsx`).
- **`useCountUp` uses `setTimeout`, not `requestAnimationFrame`.** This is
  deliberate (rAF freezes in hidden tabs and in some preview environments). In
  tests, drive it with `vi.useFakeTimers()` and advance past the longest
  duration (≈2000 ms covers all current callers). When `target === 0` it
  short-circuits to 0 with no timer; it also jumps straight to target under
  `prefers-reduced-motion`.
- **`WishlistButton` must stop event propagation.** It lives inside the
  `AlbumCard` `<Link>`; without `preventDefault`/`stopPropagation` a heart click
  would navigate to the record page.
- **`useWishlist` reads `localStorage` and dispatches a custom `wishlist-change`
  event** to keep components in sync within a tab; it is `useSyncExternalStore`
  based. Mock it in component tests rather than relying on real storage.
- **Number inputs expose the ARIA role `spinbutton`, not `textbox`.** Relevant
  when querying `Year` / `Purchase price` in `RecordForm` tests.
- **Genre lookups fall back to the raw value** (`GENRE_LABELS[g] ?? g`), so an
  unknown value renders verbatim instead of blank — defensive against DB drift.
- **`useReveal`/`useParallax` avoid rAF and bare IntersectionObserver.** Both
  fall back to setTimeout / scroll-event checks because IO callbacks and rAF
  don't fire in hidden tabs or the Claude Preview tab (see the hooks' docs in
  `lib/`). Cards therefore never stay invisible in jsdom tests either — the
  no-IO path reveals them on a 0ms timer.
- **Sorting treats null `year`/`rating` as 0**, so unrated/undated records sink
  to the bottom of those sorts.
- **`RecordForm` does not persist anything itself** — it only calls `onSubmit`.
  Validation is limited to the `required` Artist/Title inputs (native HTML
  validation); everything else is optional.
- **`<img>` is a raw element** (ESLint `no-img-element` is suppressed inline),
  not `next/image`, in both `AlbumCard` and `RecordForm` result rows.

## Tests

Colocated `*.test.tsx` files cover each component with React Testing Library +
`@testing-library/user-event`. Supabase, `next/link`, `useWishlist`, and
`global.fetch` are mocked; tests never touch the network or a real DB. Run them
with:

```bash
npx vitest run components/
```
