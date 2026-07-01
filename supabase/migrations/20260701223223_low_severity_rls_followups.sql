-- Low-severity RLS follow-ups (master plan Phase 1, item 5 / roadmap
-- low-severity-rls-followups), plus two live bugs found while verifying
-- against pg_policies:
--   * community_groups_update contained `gm.group_id = gm.id` (self-compare),
--     so group admins could never edit their group
--   * the group join-request approval flow inserts a group_members row for
--     ANOTHER user, which `WITH CHECK (user_id = auth.uid())` rejected
-- Also: error_logs had a recorded migration (20260613215838) but the table no
-- longer existed in live — all client error logging was silently failing.
-- Recreated hardened (authenticated-only, size caps) per the roadmap option.

-- Helpers: group checks without RLS self-recursion
create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = auth.uid()
  );
$$;
revoke all on function public.is_group_member(uuid) from public;
grant execute on function public.is_group_member(uuid) to authenticated;

create or replace function public.is_group_manager(p_group_id uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = auth.uid()
      and gm.role in ('owner', 'admin')
  );
$$;
revoke all on function public.is_group_manager(uuid) from public;
grant execute on function public.is_group_manager(uuid) to authenticated;

-- 1. group_members SELECT: was USING (true) — any signed-in user could
-- enumerate every group's membership. Now: own rows, fellow group members,
-- active members of the parent community, or platform admins. Standalone
-- groups (community_id null) are visible to their own members only.
drop policy if exists "group_members_select" on public.group_members;
create policy "group_members_select"
  on public.group_members for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or public.is_group_member(group_id)
    or exists (
      select 1 from public.community_groups cg
      where cg.id = group_members.group_id
        and cg.community_id is not null
        and public.is_active_community_member(cg.community_id)
    )
  );

-- 1b. Managers may add members (fixes the approval flow)
drop policy if exists "group_members_insert" on public.group_members;
create policy "group_members_insert"
  on public.group_members for insert to authenticated
  with check (
    (
      user_id = auth.uid()
      and (
        role = 'member'
        or (role = 'admin' and exists (
          select 1 from public.community_groups cg
          where cg.id = group_members.group_id and cg.created_by_user_id = auth.uid()
        ))
      )
    )
    or (role = 'member' and (public.is_group_manager(group_id) or public.is_admin()))
  );

-- 1c. Rewrite self-referencing update/delete policies via the definer helpers
-- (required: the new SELECT policy would otherwise recurse through them)
drop policy if exists "group_members_update" on public.group_members;
create policy "group_members_update"
  on public.group_members for update to authenticated
  using (public.is_admin() or public.is_group_manager(group_id))
  with check (role in ('member', 'admin') and (public.is_admin() or public.is_group_manager(group_id)));

drop policy if exists "group_members_delete" on public.group_members;
create policy "group_members_delete"
  on public.group_members for delete to authenticated
  using (user_id = auth.uid() or public.is_admin() or public.is_group_manager(group_id));

-- 2. Fix the self-compare bug so group owners/admins can edit their group
drop policy if exists "community_groups_update" on public.community_groups;
create policy "community_groups_update"
  on public.community_groups for update to authenticated
  using (created_by_user_id = auth.uid() or public.is_admin() or public.is_group_manager(id))
  with check (created_by_user_id = auth.uid() or public.is_admin() or public.is_group_manager(id));

-- 3. chesed_challenge_completions: reads require sign-in (the only consumer,
-- ChesedChallenge.jsx, lives behind ProtectedRoute; aggregate count queries
-- across users still work for authenticated)
drop policy if exists "Anyone can read challenge completions" on public.chesed_challenge_completions;
create policy "Signed-in users read challenge completions"
  on public.chesed_challenge_completions for select to authenticated
  using (true);

-- 4. Recreate error_logs, hardened. Pre-auth (user_id null) inserts are no
-- longer accepted — Landing/login errors go to Sentry when configured.
create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  route text,
  message text not null check (length(message) <= 2000),
  stack text check (stack is null or length(stack) <= 8000),
  user_agent text check (user_agent is null or length(user_agent) <= 500)
);
create index if not exists idx_error_logs_created_at on public.error_logs(created_at desc);
create index if not exists idx_error_logs_user_id on public.error_logs(user_id);
alter table public.error_logs enable row level security;

drop policy if exists "error_logs_insert" on public.error_logs;
create policy "error_logs_insert"
  on public.error_logs for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "error_logs_admin_select" on public.error_logs;
create policy "error_logs_admin_select"
  on public.error_logs for select to authenticated
  using (public.is_admin());

revoke all on public.error_logs from anon;
grant insert on public.error_logs to authenticated;
grant select on public.error_logs to authenticated;

-- 5. Storage: owner-scoped DELETE for the public image buckets (parity with
-- the existing owner-scoped UPDATE). Per-user path prefixes intentionally NOT
-- enforced: all 15+ upload sites use flat Date.now() paths, uploads are
-- authenticated-only with a bucket allowlist, and overwrites already require
-- owner-scoped UPDATE.
drop policy if exists "Users can delete their own uploads" on storage.objects;
create policy "Users can delete their own uploads"
  on storage.objects for delete to authenticated
  using (
    owner = auth.uid()
    and bucket_id in ('avatars', 'post-images', 'community-images', 'profile-covers', 'community-resources')
  );
