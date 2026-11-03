-- Eeny Meeny Eats: starter schema
-- Run in the Supabase SQL editor (or via the Supabase CLI).
--
-- RLS is enabled on every table with no policies, so only the service role
-- (used in Netlify Functions) can read or write. Add policies later if the
-- browser ever needs direct access through the anon key.

-- Cached Geoapify results per area (e.g. a rounded lat/lon grid cell or city name)
create table if not exists public.places_cache (
  id          bigint generated always as identity primary key,
  area_key    text not null unique,
  results     jsonb not null,
  fetched_at  timestamptz not null default now()
);

create index if not exists places_cache_fetched_at_idx on public.places_cache (fetched_at);

-- Cached Google ratings per place
create table if not exists public.ratings_cache (
  place_id      text primary key,
  rating        numeric(2, 1),
  rating_count  integer,
  fetched_at    timestamptz not null default now()
);

create index if not exists ratings_cache_fetched_at_idx on public.ratings_cache (fetched_at);

-- User-submitted problem reports about a place
create table if not exists public.reports (
  id           bigint generated always as identity primary key,
  place_id     text not null,
  report_type  text not null check (report_type in ('closed', 'wrong_info', 'wrong_location', 'other')),
  message      text,
  created_at   timestamptz not null default now()
);

create index if not exists reports_place_id_idx on public.reports (place_id);

alter table public.places_cache  enable row level security;
alter table public.ratings_cache enable row level security;
alter table public.reports       enable row level security;
