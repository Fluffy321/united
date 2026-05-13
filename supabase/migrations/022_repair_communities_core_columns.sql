-- 022_repair_communities_core_columns.sql
--
-- Production drift repair for the communities table.
-- The app and 001_core.sql expect these columns, but the live Supabase table
-- was missing them. Add them idempotently without removing existing data.

alter table public.communities
  add column if not exists follower_count integer not null default 0,
  add column if not exists type text,
  add column if not exists location text;

-- Preserve existing city/neighborhood data as the app-facing location value.
update public.communities
set location = coalesce(location, city, neighborhood)
where location is null
  and (city is not null or neighborhood is not null);

-- Useful for the app's common list('-follower_count') queries.
create index if not exists communities_follower_count_idx
  on public.communities (follower_count desc);
