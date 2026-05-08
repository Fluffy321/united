-- Core feature tables for real community, social, notification, and
-- Mitzvah / Chesed workflows.
--
-- Existing tables this connects to:
-- - profiles: app users
-- - communities: shuls, schools, groups, organizations
-- - posts: feed posts and event/help-style posts
-- - conversations/messages: direct messaging, created in 002_messages.sql

create table if not exists public.community_memberships (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active',
  user_name text,
  notifications_enabled boolean not null default true,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  author_name text,
  author_avatar_url text,
  body text not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reaction_type text not null default 'like',
  emoji text,
  created_at timestamptz not null default now(),
  constraint reactions_one_target check (
    (post_id is not null and comment_id is null)
    or
    (post_id is null and comment_id is not null)
  )
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null,
  title text not null,
  body text,
  link_url text,
  post_id uuid references public.posts(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.mitzvah_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  community_id uuid references public.communities(id) on delete set null,
  title text not null,
  description text,
  category text,
  location_label text,
  neighborhood text,
  estimated_hours numeric(5,2),
  request_kind text not null default 'volunteer',
  amount_cents integer,
  urgency text not null default 'medium',
  status text not null default 'open',
  visibility text not null default 'community',
  is_anonymous boolean not null default false,
  requester_name text,
  claimed_by_user_id uuid references public.profiles(id) on delete set null,
  claimed_by_name text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mitzvah_offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.mitzvah_requests(id) on delete cascade,
  volunteer_id uuid not null references public.profiles(id) on delete cascade,
  volunteer_name text,
  note text,
  status text not null default 'offered',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, volunteer_id)
);

create table if not exists public.mitzvah_completions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.mitzvah_requests(id) on delete cascade,
  offer_id uuid references public.mitzvah_offers(id) on delete set null,
  volunteer_id uuid not null references public.profiles(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  hours_completed numeric(5,2),
  volunteer_notes text,
  requester_notes text,
  status text not null default 'pending_verification',
  completed_at timestamptz not null default now(),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, volunteer_id)
);

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  completion_id uuid references public.mitzvah_completions(id) on delete cascade,
  request_id uuid references public.mitzvah_requests(id) on delete cascade,
  volunteer_id uuid not null references public.profiles(id) on delete cascade,
  verifier_id uuid references public.profiles(id) on delete set null,
  verifier_name text,
  verifier_email text,
  status text not null default 'pending',
  message text,
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chesed_hours_logs (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid references public.mitzvah_requests(id) on delete set null,
  completion_id uuid references public.mitzvah_completions(id) on delete set null,
  verification_request_id uuid references public.verification_requests(id) on delete set null,
  volunteer_name text,
  task_title text not null,
  category text,
  date_completed date not null default current_date,
  hours_completed numeric(5,2) not null default 0,
  verifier_id uuid references public.profiles(id) on delete set null,
  verifier_name text,
  verification_status text not null default 'pending',
  description text,
  school_report_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compatibility aliases used by current frontend code.
alter table public.community_memberships add column if not exists created_date timestamptz;
alter table public.community_memberships add column if not exists community_name text;
alter table public.comments add column if not exists reply_to_comment_id uuid references public.comments(id) on delete cascade;
alter table public.mitzvah_requests add column if not exists created_by_user_id uuid references public.profiles(id) on delete cascade;
alter table public.mitzvah_requests add column if not exists created_by_name text;
alter table public.mitzvah_requests add column if not exists community_name text;

-- Fix typo-safe location columns for current app-style payloads.
alter table public.mitzvah_requests add column if not exists approx_lat double precision;
alter table public.mitzvah_requests add column if not exists approx_lng double precision;
alter table public.mitzvah_requests add column if not exists location_label_legacy text;
alter table public.chesed_hours_logs add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.chesed_hours_logs add column if not exists user_name text;
alter table public.chesed_hours_logs add column if not exists title text;
alter table public.chesed_hours_logs add column if not exists date date;
alter table public.chesed_hours_logs add column if not exists hours numeric(5,2);
alter table public.chesed_hours_logs add column if not exists notes text;
alter table public.chesed_hours_logs add column if not exists source text;
alter table public.chesed_hours_logs add column if not exists verifier_email text;
alter table public.chesed_hours_logs add column if not exists verifier_phone text;

-- Basic indexes.
create index if not exists community_memberships_user_id_idx
  on public.community_memberships (user_id);
create index if not exists community_memberships_community_id_idx
  on public.community_memberships (community_id);
create index if not exists community_memberships_status_idx
  on public.community_memberships (status);

create index if not exists comments_post_id_created_at_idx
  on public.comments (post_id, created_at);
create index if not exists comments_author_id_idx
  on public.comments (author_id);
create index if not exists comments_parent_comment_id_idx
  on public.comments (parent_comment_id);

create index if not exists reactions_post_id_idx
  on public.reactions (post_id);
create index if not exists reactions_comment_id_idx
  on public.reactions (comment_id);
create unique index if not exists reactions_unique_post_user_type_idx
  on public.reactions (post_id, user_id, reaction_type)
  where post_id is not null;
create unique index if not exists reactions_unique_comment_user_type_idx
  on public.reactions (comment_id, user_id, reaction_type)
  where comment_id is not null;

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_id_read_at_idx
  on public.notifications (user_id, read_at);

create index if not exists mitzvah_requests_status_created_at_idx
  on public.mitzvah_requests (status, created_at desc);
create index if not exists mitzvah_requests_requester_id_idx
  on public.mitzvah_requests (requester_id);
create index if not exists mitzvah_requests_community_id_idx
  on public.mitzvah_requests (community_id);

create index if not exists mitzvah_offers_request_id_idx
  on public.mitzvah_offers (request_id);
create index if not exists mitzvah_offers_volunteer_id_idx
  on public.mitzvah_offers (volunteer_id);

create index if not exists mitzvah_completions_request_id_idx
  on public.mitzvah_completions (request_id);
create index if not exists mitzvah_completions_volunteer_id_idx
  on public.mitzvah_completions (volunteer_id);
create index if not exists mitzvah_completions_requester_id_idx
  on public.mitzvah_completions (requester_id);

create index if not exists verification_requests_volunteer_id_idx
  on public.verification_requests (volunteer_id);
create index if not exists verification_requests_verifier_id_idx
  on public.verification_requests (verifier_id);
create index if not exists verification_requests_status_idx
  on public.verification_requests (status);

create index if not exists chesed_hours_logs_volunteer_id_date_idx
  on public.chesed_hours_logs (volunteer_id, date_completed desc);
create index if not exists chesed_hours_logs_verification_status_idx
  on public.chesed_hours_logs (verification_status);

alter table public.community_memberships enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.notifications enable row level security;
alter table public.mitzvah_requests enable row level security;
alter table public.mitzvah_offers enable row level security;
alter table public.mitzvah_completions enable row level security;
alter table public.verification_requests enable row level security;
alter table public.chesed_hours_logs enable row level security;

-- RLS: community memberships.
drop policy if exists "Authenticated users can read active community memberships" on public.community_memberships;
create policy "Authenticated users can read active community memberships"
  on public.community_memberships
  for select
  using (auth.uid() is not null and status = 'active');

drop policy if exists "Users can join communities as themselves" on public.community_memberships;
create policy "Users can join communities as themselves"
  on public.community_memberships
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own community membership" on public.community_memberships;
create policy "Users can update their own community membership"
  on public.community_memberships
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS: comments and reactions are readable with public posts.
drop policy if exists "Comments are readable" on public.comments;
create policy "Comments are readable"
  on public.comments
  for select
  using (true);

drop policy if exists "Users can create their own comments" on public.comments;
create policy "Users can create their own comments"
  on public.comments
  for insert
  with check (auth.uid() = author_id);

drop policy if exists "Users can update their own comments" on public.comments;
create policy "Users can update their own comments"
  on public.comments
  for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "Reactions are readable" on public.reactions;
create policy "Reactions are readable"
  on public.reactions
  for select
  using (true);

drop policy if exists "Users can create their own reactions" on public.reactions;
create policy "Users can create their own reactions"
  on public.reactions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own reactions" on public.reactions;
create policy "Users can delete their own reactions"
  on public.reactions
  for delete
  using (auth.uid() = user_id);

-- RLS: notifications are private to the recipient.
drop policy if exists "Users can read their own notifications" on public.notifications;
create policy "Users can read their own notifications"
  on public.notifications
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can mark their own notifications" on public.notifications;
create policy "Users can mark their own notifications"
  on public.notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can create notifications they caused" on public.notifications;
create policy "Users can create notifications they caused"
  on public.notifications
  for insert
  with check (auth.uid() = actor_id or auth.uid() = user_id);

-- RLS: Mitzvah requests are visible when open, public, or participant-owned.
drop policy if exists "Users can read visible mitzvah requests" on public.mitzvah_requests;
create policy "Users can read visible mitzvah requests"
  on public.mitzvah_requests
  for select
  using (
    status in ('open', 'volunteer_offered')
    or visibility = 'public'
    or auth.uid() = requester_id
    or auth.uid() = claimed_by_user_id
  );

drop policy if exists "Users can create their own mitzvah requests" on public.mitzvah_requests;
create policy "Users can create their own mitzvah requests"
  on public.mitzvah_requests
  for insert
  with check (auth.uid() = requester_id);

drop policy if exists "Requesters and accepted helpers can update mitzvah requests" on public.mitzvah_requests;
create policy "Requesters and accepted helpers can update mitzvah requests"
  on public.mitzvah_requests
  for update
  using (
    auth.uid() = requester_id
    or auth.uid() = claimed_by_user_id
  )
  with check (
    auth.uid() = requester_id
    or auth.uid() = claimed_by_user_id
  );

-- RLS: offers are visible only to requester and helper.
drop policy if exists "Requesters and volunteers can read mitzvah offers" on public.mitzvah_offers;
create policy "Requesters and volunteers can read mitzvah offers"
  on public.mitzvah_offers
  for select
  using (
    auth.uid() = volunteer_id
    or exists (
      select 1 from public.mitzvah_requests
      where mitzvah_requests.id = mitzvah_offers.request_id
      and mitzvah_requests.requester_id = auth.uid()
    )
  );

drop policy if exists "Users can offer themselves for mitzvah requests" on public.mitzvah_offers;
create policy "Users can offer themselves for mitzvah requests"
  on public.mitzvah_offers
  for insert
  with check (auth.uid() = volunteer_id);

drop policy if exists "Requesters and volunteers can update mitzvah offers" on public.mitzvah_offers;
create policy "Requesters and volunteers can update mitzvah offers"
  on public.mitzvah_offers
  for update
  using (
    auth.uid() = volunteer_id
    or exists (
      select 1 from public.mitzvah_requests
      where mitzvah_requests.id = mitzvah_offers.request_id
      and mitzvah_requests.requester_id = auth.uid()
    )
  )
  with check (
    auth.uid() = volunteer_id
    or exists (
      select 1 from public.mitzvah_requests
      where mitzvah_requests.id = mitzvah_offers.request_id
      and mitzvah_requests.requester_id = auth.uid()
    )
  );

-- RLS: completions and verification are participant-only.
drop policy if exists "Participants can read mitzvah completions" on public.mitzvah_completions;
create policy "Participants can read mitzvah completions"
  on public.mitzvah_completions
  for select
  using (auth.uid() = volunteer_id or auth.uid() = requester_id);

drop policy if exists "Volunteers can create completion records" on public.mitzvah_completions;
create policy "Volunteers can create completion records"
  on public.mitzvah_completions
  for insert
  with check (auth.uid() = volunteer_id);

drop policy if exists "Requesters can verify completion records" on public.mitzvah_completions;
create policy "Requesters can verify completion records"
  on public.mitzvah_completions
  for update
  using (auth.uid() = requester_id)
  with check (auth.uid() = requester_id);

drop policy if exists "Participants can read verification requests" on public.verification_requests;
create policy "Participants can read verification requests"
  on public.verification_requests
  for select
  using (auth.uid() = volunteer_id or auth.uid() = verifier_id);

drop policy if exists "Volunteers can request verification" on public.verification_requests;
create policy "Volunteers can request verification"
  on public.verification_requests
  for insert
  with check (auth.uid() = volunteer_id);

drop policy if exists "Verifiers can respond to verification requests" on public.verification_requests;
create policy "Verifiers can respond to verification requests"
  on public.verification_requests
  for update
  using (auth.uid() = verifier_id)
  with check (auth.uid() = verifier_id);

-- RLS: Chesed hour logs are private to the volunteer and verifier.
drop policy if exists "Volunteers and verifiers can read chesed hour logs" on public.chesed_hours_logs;
create policy "Volunteers and verifiers can read chesed hour logs"
  on public.chesed_hours_logs
  for select
  using (auth.uid() = volunteer_id or auth.uid() = verifier_id);

drop policy if exists "Volunteers can create their own chesed hour logs" on public.chesed_hours_logs;
create policy "Volunteers can create their own chesed hour logs"
  on public.chesed_hours_logs
  for insert
  with check (auth.uid() = volunteer_id or auth.uid() = verifier_id);

drop policy if exists "Volunteers and verifiers can update chesed hour logs" on public.chesed_hours_logs;
create policy "Volunteers and verifiers can update chesed hour logs"
  on public.chesed_hours_logs
  for update
  using (auth.uid() = volunteer_id or auth.uid() = verifier_id)
  with check (auth.uid() = volunteer_id or auth.uid() = verifier_id);

comment on table public.community_memberships is 'Connects profiles to communities. Used for joining, roles, and community member lists.';
comment on table public.comments is 'Comments on posts. Connects to posts and profile authors.';
comment on table public.reactions is 'Likes/reactions on posts or comments. Connects to profiles plus either posts or comments.';
comment on table public.notifications is 'Private in-app notifications for a single recipient profile.';
comment on table public.mitzvah_requests is 'Help requests posted by a profile, optionally inside a community.';
comment on table public.mitzvah_offers is 'Volunteer offers on Mitzvah requests.';
comment on table public.mitzvah_completions is 'Completion records created after a volunteer finishes a Mitzvah request.';
comment on table public.verification_requests is 'Requests for a poster/verifier to confirm completed volunteer service.';
comment on table public.chesed_hours_logs is 'Verified or pending volunteer-hour records for school/community reports.';
