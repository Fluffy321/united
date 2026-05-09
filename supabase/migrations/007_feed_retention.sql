-- Feed retention and personalization layer.
-- These tables support the Five Towns daily brief, daily prompts,
-- per-user feed preferences, and lightweight engagement tracking.

create table if not exists public.feed_user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary_network text not null default 'Five Towns',
  neighborhoods text[] not null default array[]::text[],
  interests text[] not null default array[]::text[],
  preferred_post_types text[] not null default array[]::text[],
  muted_post_types text[] not null default array[]::text[],
  shabbos_digest_enabled boolean not null default true,
  smart_notifications_enabled boolean not null default true,
  last_seen_brief_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.feed_engagement_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  community_id uuid references public.communities(id) on delete set null,
  event_type text not null,
  post_type text,
  post_subtype text,
  neighborhood text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_feed_prompts (
  id uuid primary key default gen_random_uuid(),
  prompt_date date not null,
  network text not null default 'Five Towns',
  prompt_type text not null default 'general',
  question text not null,
  cta_label text not null default 'Post',
  suggested_post_type text not null default 'feed',
  suggested_post_subtype text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (prompt_date, network, prompt_type)
);

create table if not exists public.five_towns_briefs (
  id uuid primary key default gen_random_uuid(),
  brief_date date not null,
  network text not null default 'Five Towns',
  title text not null,
  urgent_chesed_count integer not null default 0,
  events_count integer not null default 0,
  active_threads_count integer not null default 0,
  lost_found_count integer not null default 0,
  shul_updates_count integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brief_date, network)
);

create index if not exists feed_user_preferences_user_id_idx
  on public.feed_user_preferences (user_id);
create index if not exists feed_engagement_events_user_id_created_at_idx
  on public.feed_engagement_events (user_id, created_at desc);
create index if not exists feed_engagement_events_post_id_idx
  on public.feed_engagement_events (post_id);
create index if not exists daily_feed_prompts_date_network_idx
  on public.daily_feed_prompts (prompt_date, network, active);
create index if not exists five_towns_briefs_date_network_idx
  on public.five_towns_briefs (brief_date, network);

alter table public.feed_user_preferences enable row level security;
alter table public.feed_engagement_events enable row level security;
alter table public.daily_feed_prompts enable row level security;
alter table public.five_towns_briefs enable row level security;

drop policy if exists "Users can read their feed preferences" on public.feed_user_preferences;
create policy "Users can read their feed preferences"
  on public.feed_user_preferences
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can upsert their feed preferences" on public.feed_user_preferences;
create policy "Users can upsert their feed preferences"
  on public.feed_user_preferences
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their feed preferences" on public.feed_user_preferences;
create policy "Users can update their feed preferences"
  on public.feed_user_preferences
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read their feed events" on public.feed_engagement_events;
create policy "Users can read their feed events"
  on public.feed_engagement_events
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their feed events" on public.feed_engagement_events;
create policy "Users can create their feed events"
  on public.feed_engagement_events
  for insert
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Daily feed prompts are readable" on public.daily_feed_prompts;
create policy "Daily feed prompts are readable"
  on public.daily_feed_prompts
  for select
  using (active = true);

drop policy if exists "Five Towns briefs are readable" on public.five_towns_briefs;
create policy "Five Towns briefs are readable"
  on public.five_towns_briefs
  for select
  using (true);

insert into public.daily_feed_prompts (prompt_date, network, prompt_type, question, cta_label, suggested_post_type, suggested_post_subtype)
values
  (current_date, 'Five Towns', 'shabbos', 'What do you need or what can you offer before Shabbos?', 'Post Shabbos need', 'help', 'shabbos'),
  (current_date, 'Five Towns', 'recommendation', 'Who do you recommend locally this week?', 'Ask or recommend', 'feed', 'recommendation'),
  (current_date, 'Five Towns', 'connection', 'Looking for a chavrusa, host, ride, meetup, or new local circle?', 'Connect locally', 'feed', 'connection')
on conflict (prompt_date, network, prompt_type) do nothing;
