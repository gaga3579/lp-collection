# Vinyl Archive

A personal LP vinyl record collection website — a "Modern Archive" editorial design built with **Next.js 16 (App Router)**, **Tailwind CSS v4**, **TypeScript**, and **Supabase**.

## Features

- **Public collection** (`/`) — hero stats, real-time search, genre filter chips, sort (recently added / year / rating / artist), responsive album grid (4 cols desktop / 2 mobile), and a bottom stats panel.
- **Record detail** (`/record/[id]`) — large cover, full metadata (year, genre, rating, condition, price, purchase date, notes).
- **Admin** (`/admin`) — Google sign-in, owner-only. Add/edit/delete records with a **Spotify lookup** that auto-fills cover art, year, artist, and title.
- **Stats** (`/stats`) — genre bar chart, records-by-decade chart, and a top-rated list.
- **Wishlist** — visitors heart records; stored in `localStorage`.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example file and fill in your keys:

```bash
cp .env.local.example .env.local
```

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SPOTIFY_CLIENT_ID` | [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) |
| `SPOTIFY_CLIENT_SECRET` | Spotify Developer Dashboard |
| `NEXT_PUBLIC_OWNER_EMAIL` | The Google account email allowed into `/admin` |

> The app runs without these set — pages render with empty data and the admin/Spotify
> tools show a friendly "not configured" notice — so you can develop incrementally.

### 3. Create the database

In the Supabase SQL editor, run [`supabase/schema.sql`](supabase/schema.sql). It creates the
`records` table and Row Level Security policies (public read; owner-only writes). Replace
`OWNER_EMAIL_HERE` in that file with your owner email before running.

### 4. Enable Google auth

In Supabase → Authentication → Providers, enable **Google** and add your OAuth credentials.
Add your site URL to the allowed redirect URLs.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture notes

This project targets **Next.js 16**, which differs from older versions:

- Middleware is now [`proxy.ts`](proxy.ts) — used here to refresh Supabase auth sessions.
- Route `params` / `searchParams` are **Promises** and must be awaited.
- Tailwind v4 is configured purely in CSS via `@theme` in [`app/globals.css`](app/globals.css).

Data access lives in [`lib/records.ts`](lib/records.ts); Supabase clients are split into
browser ([`lib/supabase/client.ts`](lib/supabase/client.ts)) and server
([`lib/supabase/server.ts`](lib/supabase/server.ts)) variants.
