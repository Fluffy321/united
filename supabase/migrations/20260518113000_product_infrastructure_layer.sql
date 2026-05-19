-- Product infrastructure layer: trust metadata, unified activity shape,
-- personalization preferences, and retention-friendly indexes.
-- Additive/idempotent so older app records continue to work.

alter table public.posts
  add column if not exists activity_kind text,
  add column if not exists unified_kind text,
  add column if not exists canonical_type text,
  add column if not exists privacy_level text not null default 'public',
  add column if not exists visibility text not null default 'public',
  add column if not exists replies_enabled boolean not null default true,
  add column if not exists reactions_enabled boolean not null default true,
  add column if not exists map_enabled boolean not null default false,
  add column if not exists post_to_map boolean not null default false,
  add column if not exists location_text text,
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision,
  add column if not exists trust_status text not null default 'unverified',
  add column if not exists verified boolean not null default false,
  add column if not exists last_verified_at timestamptz,
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists submitted_by uuid references public.profiles(id) on delete set null,
  add column if not exists submitted_by_name text,
  add column if not exists needs_review boolean not null default false;

alter table public.mitzvah_requests
  add column if not exists trust_status text not null default 'community_submitted',
  add column if not exists verified boolean not null default false,
  add column if not exists last_verified_at timestamptz,
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists submitted_by uuid references public.profiles(id) on delete set null,
  add column if not exists submitted_by_name text,
  add column if not exists needs_review boolean not null default false,
  add column if not exists comments_count integer not null default 0,
  add column if not exists reactions_count integer not null default 0;

alter table public.communities
  add column if not exists trust_status text not null default 'community_submitted',
  add column if not exists verified boolean not null default false,
  add column if not exists last_verified_at timestamptz,
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists submitted_by uuid references public.profiles(id) on delete set null,
  add column if not exists submitted_by_name text,
  add column if not exists needs_review boolean not null default false,
  add column if not exists allow_anonymous_posts boolean not null default false,
  add column if not exists hide_member_list boolean not null default false,
  add column if not exists requires_post_review boolean not null default false;

alter table public.business_listings
  add column if not exists trust_status text not null default 'unverified',
  add column if not exists verified boolean not null default false,
  add column if not exists last_verified_at timestamptz,
  add column if not exists source_name text,
  add column if not exists submitted_by_name text,
  add column if not exists needs_review boolean not null default false;

alter table public.profiles
  add column if not exists shul_preference text,
  add column if not exists school_preference text,
  add column if not exists privacy_preference text not null default 'friends',
  add column if not exists personalization_profile jsonb not null default '{}'::jsonb;

create table if not exists public.retention_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  route_path text,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.retention_events enable row level security;
grant select, insert on public.retention_events to authenticated;

drop policy if exists "Users can write their own retention events" on public.retention_events;
create policy "Users can write their own retention events"
  on public.retention_events
  for insert
  to authenticated
  with check (user_id = auth.uid() or user_id is null);

drop policy if exists "Admins can read retention events" on public.retention_events;
create policy "Admins can read retention events"
  on public.retention_events
  for select
  to authenticated
  using (public.is_admin());

create index if not exists posts_unified_kind_created_idx on public.posts (activity_kind, created_at desc);
create index if not exists posts_map_enabled_idx on public.posts (map_enabled, location_lat, location_lng) where map_enabled = true;
create index if not exists posts_trust_review_idx on public.posts (needs_review, trust_status, created_at desc);
create index if not exists mitzvah_requests_trust_review_idx on public.mitzvah_requests (needs_review, trust_status, created_at desc);
create index if not exists communities_trust_review_idx on public.communities (needs_review, trust_status, created_at desc);
create index if not exists business_listings_trust_review_idx on public.business_listings (needs_review, trust_status, updated_at desc);
create index if not exists retention_events_type_created_idx on public.retention_events (event_type, created_at desc);
create index if not exists retention_events_user_created_idx on public.retention_events (user_id, created_at desc);
