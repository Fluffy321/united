-- ─────────────────────────────────────────────────────────────────────────────
-- 008_admin_rls.sql
--
-- Closes the P0 security gap where admin UI gates were enforced client-side
-- only.  This migration:
--
--   1. Creates a stable is_admin() helper used by all policies below.
--   2. Creates three new tables required by admin pages:
--        reports, claim_requests, moderation_audit_logs
--   3. Adds missing columns to existing tables.
--   4. Adds admin-bypass RLS policies on every table the admin pages touch.
--   5. Adds the missing UPDATE policy on public.communities (needed by both
--      community admins and platform admins — currently no update policy
--      exists, so community settings writes silently fail or rely on a
--      permissive Supabase anon key).
--
-- Safe to re-run: all DDL uses IF NOT EXISTS / OR REPLACE / DROP IF EXISTS.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─── 1. ADMIN HELPER FUNCTION ────────────────────────────────────────────────
--
-- security definer: runs with the function owner's privileges, bypassing RLS
-- on public.profiles so the lookup is always valid regardless of future policy
-- changes on that table.
--
-- stable: result may be cached within a single statement — safe because role
-- doesn't change mid-query.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  )
$$;

-- Restrict execution to authenticated callers only.
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;


-- ─── 2. NEW TABLES ───────────────────────────────────────────────────────────

-- 2a. reports — user-submitted content/user flags, reviewed by admins.
create table if not exists public.reports (
  id                uuid        primary key default gen_random_uuid(),
  reporter_id       uuid        not null references public.profiles(id) on delete cascade,
  reported_content_id text      not null,
  content_type      text        not null,   -- 'post' | 'comment' | 'user' | 'request'
  content_preview   text,
  target_user_id    uuid        references public.profiles(id) on delete set null,
  reason            text        not null,
  details           text,
  priority          text        not null default 'medium',
  ai_flagged        boolean     not null default false,
  resolved          boolean     not null default false,
  resolved_at       timestamptz,
  resolved_by       uuid        references public.profiles(id) on delete set null,
  resolution_note   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists reports_resolved_created_at_idx
  on public.reports (resolved, created_at desc);
create index if not exists reports_reporter_id_idx
  on public.reports (reporter_id);
create index if not exists reports_target_user_id_idx
  on public.reports (target_user_id);

alter table public.reports enable row level security;

-- Users can file reports.
drop policy if exists "Users can create reports" on public.reports;
create policy "Users can create reports"
  on public.reports
  for insert
  with check (auth.uid() = reporter_id);

-- Users can see their own submitted reports.
drop policy if exists "Users can read their own reports" on public.reports;
create policy "Users can read their own reports"
  on public.reports
  for select
  using (auth.uid() = reporter_id);

-- Admins can read all reports.
drop policy if exists "Admins can read all reports" on public.reports;
create policy "Admins can read all reports"
  on public.reports
  for select
  using (public.is_admin());

-- Admins can update reports (resolve, add notes).
drop policy if exists "Admins can update reports" on public.reports;
create policy "Admins can update reports"
  on public.reports
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- Admins can delete reports (false positives, duplicates).
drop policy if exists "Admins can delete reports" on public.reports;
create policy "Admins can delete reports"
  on public.reports
  for delete
  using (public.is_admin());

comment on table public.reports is
  'User-submitted flags on posts, comments, or users. Reviewed by platform admins.';


-- 2b. claim_requests — organisations requesting verified status on a community.
create table if not exists public.claim_requests (
  id              uuid        primary key default gen_random_uuid(),
  community_id    uuid        not null references public.communities(id) on delete cascade,
  community_name  text,
  requester_id    uuid        not null references public.profiles(id) on delete cascade,
  requester_name  text,
  org_email       text,
  role_at_org     text,
  notes           text,
  status          text        not null default 'pending',  -- 'pending' | 'approved' | 'rejected'
  reviewed_by     uuid        references public.profiles(id) on delete set null,
  reviewed_at     timestamptz,
  review_note     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists claim_requests_status_created_at_idx
  on public.claim_requests (status, created_at desc);
create index if not exists claim_requests_requester_id_idx
  on public.claim_requests (requester_id);
create index if not exists claim_requests_community_id_idx
  on public.claim_requests (community_id);

alter table public.claim_requests enable row level security;

-- Users can submit claims.
drop policy if exists "Users can submit claim requests" on public.claim_requests;
create policy "Users can submit claim requests"
  on public.claim_requests
  for insert
  with check (auth.uid() = requester_id);

-- Users can see their own claim requests.
drop policy if exists "Users can read their own claim requests" on public.claim_requests;
create policy "Users can read their own claim requests"
  on public.claim_requests
  for select
  using (auth.uid() = requester_id);

-- Admins can read all claim requests.
drop policy if exists "Admins can read all claim requests" on public.claim_requests;
create policy "Admins can read all claim requests"
  on public.claim_requests
  for select
  using (public.is_admin());

-- Admins can update claim requests (approve/reject).
drop policy if exists "Admins can update claim requests" on public.claim_requests;
create policy "Admins can update claim requests"
  on public.claim_requests
  for update
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.claim_requests is
  'Organisation requests to receive verified status on a community listing.';


-- 2c. moderation_audit_logs — immutable trail of every admin action.
create table if not exists public.moderation_audit_logs (
  id              uuid        primary key default gen_random_uuid(),
  admin_id        uuid        not null references public.profiles(id) on delete cascade,
  admin_name      text,
  action          text        not null,
  report_id       uuid        references public.reports(id) on delete set null,
  community_id    uuid        references public.communities(id) on delete set null,
  target_user_id  uuid        references public.profiles(id) on delete set null,
  reason          text,
  metadata        jsonb       not null default '{}'::jsonb,
  performed_at    timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index if not exists moderation_audit_logs_admin_id_idx
  on public.moderation_audit_logs (admin_id, performed_at desc);
create index if not exists moderation_audit_logs_target_user_id_idx
  on public.moderation_audit_logs (target_user_id);
create index if not exists moderation_audit_logs_community_id_idx
  on public.moderation_audit_logs (community_id);

alter table public.moderation_audit_logs enable row level security;

-- Only admins can write audit log entries.
drop policy if exists "Admins can create audit log entries" on public.moderation_audit_logs;
create policy "Admins can create audit log entries"
  on public.moderation_audit_logs
  for insert
  with check (public.is_admin() and auth.uid() = admin_id);

-- Only admins can read the audit log.
drop policy if exists "Admins can read audit log" on public.moderation_audit_logs;
create policy "Admins can read audit log"
  on public.moderation_audit_logs
  for select
  using (public.is_admin());

-- Audit log rows are never updated or deleted — immutable by policy.

comment on table public.moderation_audit_logs is
  'Immutable record of every platform-admin moderation action. No UPDATE/DELETE policies are defined intentionally.';


-- ─── 3. SCHEMA ADDITIONS TO EXISTING TABLES ──────────────────────────────────

-- mitzvah_requests: hidden flag used by AdminModerationQueue.
alter table public.mitzvah_requests
  add column if not exists is_hidden boolean not null default false;

create index if not exists mitzvah_requests_is_hidden_idx
  on public.mitzvah_requests (is_hidden)
  where is_hidden = true;

-- communities: verification and claim columns used by AdminModerationQueue.
alter table public.communities
  add column if not exists is_verified     boolean not null default false,
  add column if not exists is_claimed      boolean not null default false,
  add column if not exists claimed_org_id  uuid    references public.profiles(id) on delete set null,
  add column if not exists is_seeded       boolean not null default false,
  add column if not exists post_count      integer not null default 0,
  add column if not exists category        text,
  add column if not exists neighborhood    text,
  add column if not exists privacy         text    not null default 'public',
  add column if not exists created_by_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists created_by_name text,
  add column if not exists website         text,
  add column if not exists phone           text,
  add column if not exists address         text,
  add column if not exists hours           text,
  add column if not exists donation_url    text,
  add column if not exists description_short text;


-- ─── 4. ADMIN RLS POLICIES ON EXISTING TABLES ────────────────────────────────
--
-- Strategy: each restricted table gets a dedicated "Admins can …" policy that
-- evaluates is_admin().  Existing user-scoped policies are left untouched —
-- they continue to protect data from non-admin users.  The admin policies add
-- an OR-equivalent bypass that only activates for accounts with role = 'admin'.
--
-- Tables covered:
--   profiles, communities, posts, community_memberships,
--   mitzvah_requests, conversations, messages,
--   comments, reactions, notifications


-- profiles ──────────────────────────────────────────────────────────────────

-- Admin needs to list all users for analytics and moderation.
-- SELECT is already public (using (true)), so no extra admin select policy needed.
-- UPDATE: allow admins to modify any profile (role changes, account suspension).
drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- DELETE: allow admins to delete accounts when legally required.
drop policy if exists "Admins can delete any profile" on public.profiles;
create policy "Admins can delete any profile"
  on public.profiles
  for delete
  using (public.is_admin());


-- communities ───────────────────────────────────────────────────────────────

-- SELECT is already public (using (true)).

-- UPDATE: currently no update policy exists at all on communities.
-- Community-level admins (membership.role = 'admin') need to edit their own.
-- Platform admins need to edit any community (is_verified, is_claimed, etc.).
drop policy if exists "Community admins can update their community" on public.communities;
create policy "Community admins can update their community"
  on public.communities
  for update
  using (
    exists (
      select 1 from public.community_memberships
      where community_memberships.community_id = communities.id
        and community_memberships.user_id = auth.uid()
        and community_memberships.role = 'admin'
        and community_memberships.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.community_memberships
      where community_memberships.community_id = communities.id
        and community_memberships.user_id = auth.uid()
        and community_memberships.role = 'admin'
        and community_memberships.status = 'active'
    )
  );

drop policy if exists "Platform admins can update any community" on public.communities;
create policy "Platform admins can update any community"
  on public.communities
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- DELETE: only platform admins may delete communities.
drop policy if exists "Platform admins can delete communities" on public.communities;
create policy "Platform admins can delete communities"
  on public.communities
  for delete
  using (public.is_admin());


-- posts ─────────────────────────────────────────────────────────────────────

-- SELECT is already public.

-- UPDATE: currently no update policy exists on posts.
-- Authors can update their own posts; admins can update any (moderation).
drop policy if exists "Authors can update their own posts" on public.posts;
create policy "Authors can update their own posts"
  on public.posts
  for update
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

drop policy if exists "Admins can update any post" on public.posts;
create policy "Admins can update any post"
  on public.posts
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- DELETE: authors and admins.
drop policy if exists "Authors can delete their own posts" on public.posts;
create policy "Authors can delete their own posts"
  on public.posts
  for delete
  using (auth.uid()::text = user_id);

drop policy if exists "Admins can delete any post" on public.posts;
create policy "Admins can delete any post"
  on public.posts
  for delete
  using (public.is_admin());


-- community_memberships ─────────────────────────────────────────────────────

-- Existing SELECT policy is `status = 'active'` only.
-- Admins need to see all memberships (including inactive/pending) for analytics.
drop policy if exists "Admins can read all community memberships" on public.community_memberships;
create policy "Admins can read all community memberships"
  on public.community_memberships
  for select
  using (public.is_admin());

-- Admins can update membership roles/statuses (promote, ban, etc.).
drop policy if exists "Admins can update any community membership" on public.community_memberships;
create policy "Admins can update any community membership"
  on public.community_memberships
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- Admins can remove any member.
drop policy if exists "Admins can delete any community membership" on public.community_memberships;
create policy "Admins can delete any community membership"
  on public.community_memberships
  for delete
  using (public.is_admin());


-- mitzvah_requests ──────────────────────────────────────────────────────────

-- Existing SELECT policy hides non-public requests from non-participants.
-- Admins need to see everything (including is_hidden = true requests).
drop policy if exists "Admins can read all mitzvah requests" on public.mitzvah_requests;
create policy "Admins can read all mitzvah requests"
  on public.mitzvah_requests
  for select
  using (public.is_admin());

-- Admins can update any request (set is_hidden, force-complete, etc.).
drop policy if exists "Admins can update any mitzvah request" on public.mitzvah_requests;
create policy "Admins can update any mitzvah request"
  on public.mitzvah_requests
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- Admins can delete requests (extreme moderation cases).
drop policy if exists "Admins can delete any mitzvah request" on public.mitzvah_requests;
create policy "Admins can delete any mitzvah request"
  on public.mitzvah_requests
  for delete
  using (public.is_admin());


-- conversations ─────────────────────────────────────────────────────────────

-- Existing SELECT policy restricts to participants.
-- Admins need read access for safety investigations.
drop policy if exists "Admins can read all conversations" on public.conversations;
create policy "Admins can read all conversations"
  on public.conversations
  for select
  using (public.is_admin());


-- messages ──────────────────────────────────────────────────────────────────

-- Existing SELECT policy restricts to conversation participants.
-- Admins need read access for safety investigations.
drop policy if exists "Admins can read all messages" on public.messages;
create policy "Admins can read all messages"
  on public.messages
  for select
  using (public.is_admin());

-- Admins can delete messages (CSAM, harassment, legal takedowns).
drop policy if exists "Admins can delete any message" on public.messages;
create policy "Admins can delete any message"
  on public.messages
  for delete
  using (public.is_admin());


-- comments ──────────────────────────────────────────────────────────────────

-- SELECT already public.

-- Admins can update comments (soft-delete, mark as removed).
drop policy if exists "Admins can update any comment" on public.comments;
create policy "Admins can update any comment"
  on public.comments
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- Admins can hard-delete comments.
drop policy if exists "Admins can delete any comment" on public.comments;
create policy "Admins can delete any comment"
  on public.comments
  for delete
  using (public.is_admin());


-- reactions ─────────────────────────────────────────────────────────────────

-- SELECT already public.

-- Admins can remove any reaction (moderation edge case).
drop policy if exists "Admins can delete any reaction" on public.reactions;
create policy "Admins can delete any reaction"
  on public.reactions
  for delete
  using (public.is_admin());


-- notifications ─────────────────────────────────────────────────────────────

-- Admins can read any notification (supports debugging, safety audits).
drop policy if exists "Admins can read all notifications" on public.notifications;
create policy "Admins can read all notifications"
  on public.notifications
  for select
  using (public.is_admin());

-- Admins can create notifications (system announcements, broadcast messages).
drop policy if exists "Admins can create any notification" on public.notifications;
create policy "Admins can create any notification"
  on public.notifications
  for insert
  with check (public.is_admin());

-- Admins can delete notifications (remove harmful content sent via notifications).
drop policy if exists "Admins can delete any notification" on public.notifications;
create policy "Admins can delete any notification"
  on public.notifications
  for delete
  using (public.is_admin());
