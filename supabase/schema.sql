-- Vinyl Archive — Supabase schema
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).

create table if not exists public.records (
  id uuid primary key default gen_random_uuid(),
  artist text not null,
  title text not null,
  year integer,
  -- Free text, but the app uses: jazz, rock, soul, rnb, rap, pop,
  -- electronic, classical, other.
  genre text not null default 'other',
  -- Half-star steps allowed: 0.5, 1, 1.5, ... 5.
  rating numeric check (rating between 0.5 and 5 and mod(rating * 2, 1) = 0),
  notes text,
  cover_url text,
  purchase_price numeric,
  purchase_date date,
  condition text check (condition in ('mint', 'vg+', 'vg', 'g')),
  created_at timestamptz not null default now()
);

-- Row Level Security: anyone may read; only the owner may write.
alter table public.records enable row level security;

-- Public read access for the collection / detail / stats pages.
create policy "Public records are viewable by everyone"
  on public.records for select
  using (true);

-- Writes are restricted to the owner: authenticated users whose JWT email
-- matches. Update the email here if the owner ever changes.
create policy "Owner can insert records"
  on public.records for insert
  to authenticated
  with check (auth.jwt() ->> 'email' = 'hijun2952@gmail.com');

create policy "Owner can update records"
  on public.records for update
  to authenticated
  using (auth.jwt() ->> 'email' = 'hijun2952@gmail.com')
  with check (auth.jwt() ->> 'email' = 'hijun2952@gmail.com');

create policy "Owner can delete records"
  on public.records for delete
  to authenticated
  using (auth.jwt() ->> 'email' = 'hijun2952@gmail.com');
