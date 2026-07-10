-- Allow half-star ratings (0.5 steps, e.g. 2.5, 3.5).
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query)
-- on the existing database. New databases only need schema.sql.

alter table public.records drop constraint if exists records_rating_check;

alter table public.records
  alter column rating type numeric using rating::numeric;

alter table public.records
  add constraint records_rating_check
  check (rating between 0.5 and 5 and mod(rating * 2, 1) = 0);
