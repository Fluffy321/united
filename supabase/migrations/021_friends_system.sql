-- ─────────────────────────────────────────────────────────────────────────────
-- 021_friends_system.sql
--
-- Introduces a real Friends system:
--   • friend_requests  — pending/accepted/declined/cancelled requests
--   • friendships      — accepted pairs (two directional rows per pair)
--   • 5 SECURITY DEFINER RPCs for all mutations
--   • Updated mitzvah_requests SELECT policy enforcing friends_only visibility
--
-- Safe to re-run: CREATE TABLE uses IF NOT EXISTS; policies are dropped/recreated.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─── FRIEND REQUESTS ─────────────────────────────────────────────────────────

create table if not exists public.friend_requests (
  id           uuid        primary key default gen_random_uuid(),
  requester_id uuid        not null references public.profiles(id) on delete cascade,
  recipient_id uuid        not null references public.profiles(id) on delete cascade,
  status       text        not null default 'pending'
                           check (status in ('pending','accepted','declined','cancelled')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint friend_requests_no_self
    check (requester_id <> recipient_id),
  -- At most one non-cancelled/declined request per ordered pair at a time.
  -- We handle uniqueness via application logic + the RPC; the unique index below
  -- covers only pending requests so a re-request after decline/cancel is allowed.
  constraint friend_requests_one_active_per_direction
    unique (requester_id, recipient_id)
);

create index if not exists friend_requests_requester_status_idx
  on public.friend_requests (requester_id, status);
create index if not exists friend_requests_recipient_status_idx
  on public.friend_requests (recipient_id, status);

alter table public.friend_requests enable row level security;

-- Participants can see their own requests
drop policy if exists "Participants can read their own friend requests" on public.friend_requests;
create policy "Participants can read their own friend requests"
  on public.friend_requests for select to authenticated
  using (
    (select auth.uid()) = requester_id
    or (select auth.uid()) = recipient_id
  );

-- Clients can only insert where they are the requester (RPC validates further)
drop policy if exists "Users can insert friend requests as themselves" on public.friend_requests;
create policy "Users can insert friend requests as themselves"
  on public.friend_requests for insert to authenticated
  with check ((select auth.uid()) = requester_id);

-- Participants can update status (RPC enforces who can do what)
drop policy if exists "Participants can update friend request status" on public.friend_requests;
create policy "Participants can update friend request status"
  on public.friend_requests for update to authenticated
  using (
    (select auth.uid()) = requester_id
    or (select auth.uid()) = recipient_id
  )
  with check (
    (select auth.uid()) = requester_id
    or (select auth.uid()) = recipient_id
  );

-- No direct deletes — use status transitions
drop policy if exists "No direct delete of friend requests" on public.friend_requests;


-- ─── FRIENDSHIPS ─────────────────────────────────────────────────────────────
-- Stored as two directional rows so "SELECT WHERE user_id = me" gives all friends.

create table if not exists public.friendships (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  friend_id  uuid        not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint friendships_no_self  check (user_id <> friend_id),
  unique (user_id, friend_id)
);

create index if not exists friendships_user_id_idx   on public.friendships (user_id);
create index if not exists friendships_friend_id_idx on public.friendships (friend_id);

alter table public.friendships enable row level security;

-- Users can see friendships they are part of
drop policy if exists "Users can read their own friendships" on public.friendships;
create policy "Users can read their own friendships"
  on public.friendships for select to authenticated
  using (
    (select auth.uid()) = user_id
    or (select auth.uid()) = friend_id
  );

-- Direct inserts from clients are blocked — only SECURITY DEFINER RPCs insert here.
-- (SECURITY DEFINER functions run as the function owner who has bypassrls, so they
-- are unaffected by this policy.)
drop policy if exists "Block direct friendship inserts" on public.friendships;
create policy "Block direct friendship inserts"
  on public.friendships for insert to authenticated
  with check (false);

-- Users can remove their own side of a friendship (triggers the other direction
-- to be cleaned up by the remove_friendship RPC)
drop policy if exists "Users can delete their own friendships" on public.friendships;
create policy "Users can delete their own friendships"
  on public.friendships for delete to authenticated
  using (
    (select auth.uid()) = user_id
    or (select auth.uid()) = friend_id
  );


-- ─── RPC: send_friend_request ─────────────────────────────────────────────────

create or replace function public.send_friend_request(p_recipient_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid          uuid := (select auth.uid());
  v_rev          record;
  v_new          record;
begin
  if v_uid is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  if v_uid = p_recipient_id then
    return jsonb_build_object('error', 'cannot_friend_self');
  end if;

  -- Reject if either party has blocked the other
  if exists(
    select 1 from public.user_blocks
    where (blocker_id = v_uid    and blocked_id = p_recipient_id)
       or (blocker_id = p_recipient_id and blocked_id = v_uid)
  ) then
    return jsonb_build_object('error', 'blocked');
  end if;

  -- Already friends?
  if exists(
    select 1 from public.friendships
    where user_id = v_uid and friend_id = p_recipient_id
  ) then
    return jsonb_build_object('error', 'already_friends');
  end if;

  -- Existing pending request in this direction?
  if exists(
    select 1 from public.friend_requests
    where requester_id = v_uid
      and recipient_id = p_recipient_id
      and status = 'pending'
  ) then
    return jsonb_build_object('error', 'request_already_sent');
  end if;

  -- Mutual request: recipient already sent a pending request to us → auto-accept
  select * into v_rev
  from public.friend_requests
  where requester_id = p_recipient_id
    and recipient_id = v_uid
    and status = 'pending';

  if found then
    update public.friend_requests
      set status = 'accepted', updated_at = now()
    where id = v_rev.id;

    insert into public.friendships (user_id, friend_id) values
      (v_uid,          p_recipient_id),
      (p_recipient_id, v_uid)
    on conflict do nothing;

    return jsonb_build_object('status', 'auto_accepted', 'request_id', v_rev.id);
  end if;

  -- Insert new pending request (upsert to handle race on unique constraint)
  insert into public.friend_requests (requester_id, recipient_id, status)
  values (v_uid, p_recipient_id, 'pending')
  on conflict (requester_id, recipient_id) do update
    set status     = case
          when public.friend_requests.status in ('declined','cancelled')
          then 'pending'
          else public.friend_requests.status
        end,
        updated_at = now()
  returning * into v_new;

  return jsonb_build_object('status', 'pending', 'request_id', v_new.id);
end;
$$;


-- ─── RPC: accept_friend_request ──────────────────────────────────────────────

create or replace function public.accept_friend_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_req record;
begin
  if v_uid is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  select * into v_req
  from public.friend_requests
  where id          = p_request_id
    and recipient_id = v_uid
    and status       = 'pending';

  if not found then
    return jsonb_build_object('error', 'request_not_found_or_not_pending');
  end if;

  update public.friend_requests
    set status = 'accepted', updated_at = now()
  where id = p_request_id;

  insert into public.friendships (user_id, friend_id) values
    (v_req.requester_id, v_uid),
    (v_uid,              v_req.requester_id)
  on conflict do nothing;

  return jsonb_build_object('status', 'accepted', 'friend_id', v_req.requester_id);
end;
$$;


-- ─── RPC: decline_friend_request ─────────────────────────────────────────────

create or replace function public.decline_friend_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  update public.friend_requests
    set status = 'declined', updated_at = now()
  where id          = p_request_id
    and recipient_id = v_uid
    and status       = 'pending';

  if not found then
    return jsonb_build_object('error', 'request_not_found');
  end if;

  return jsonb_build_object('status', 'declined');
end;
$$;


-- ─── RPC: cancel_friend_request ──────────────────────────────────────────────

create or replace function public.cancel_friend_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  update public.friend_requests
    set status = 'cancelled', updated_at = now()
  where id           = p_request_id
    and requester_id  = v_uid
    and status        = 'pending';

  if not found then
    return jsonb_build_object('error', 'request_not_found');
  end if;

  return jsonb_build_object('status', 'cancelled');
end;
$$;


-- ─── RPC: remove_friendship ───────────────────────────────────────────────────

create or replace function public.remove_friendship(p_friend_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  delete from public.friendships
  where (user_id = v_uid       and friend_id = p_friend_id)
     or (user_id = p_friend_id and friend_id = v_uid);

  -- Clean up any lingering pending requests between the two users
  update public.friend_requests
    set status = 'cancelled', updated_at = now()
  where status = 'pending'
    and (
      (requester_id = v_uid       and recipient_id = p_friend_id)
      or (requester_id = p_friend_id and recipient_id = v_uid)
    );

  return jsonb_build_object('status', 'removed');
end;
$$;


-- ─── Grant RPC execution to authenticated users ───────────────────────────────

grant execute on function public.send_friend_request(uuid)     to authenticated;
grant execute on function public.accept_friend_request(uuid)   to authenticated;
grant execute on function public.decline_friend_request(uuid)  to authenticated;
grant execute on function public.cancel_friend_request(uuid)   to authenticated;
grant execute on function public.remove_friendship(uuid)       to authenticated;


-- ─── UPDATE mitzvah_requests SELECT policy ────────────────────────────────────
-- The old policy exposed any open request regardless of visibility.
-- New policy gates friends_only requests behind the friendships table.

drop policy if exists "Users can read visible mitzvah requests" on public.mitzvah_requests;
create policy "Users can read visible mitzvah requests"
  on public.mitzvah_requests for select
  using (
    -- Owner always sees their own request
    (select auth.uid()) = requester_id
    or (select auth.uid()) = created_by_user_id
    or (select auth.uid()) = claimed_by_user_id

    -- Community-visible open requests (default behaviour)
    or (
      status in ('open', 'volunteer_offered')
      and coalesce(visibility, 'community') = 'community'
    )

    -- Explicitly public requests
    or coalesce(visibility, 'community') = 'public'

    -- Friends-only: viewer must be an accepted friend of the requester
    or (
      coalesce(visibility, 'community') = 'friends_only'
      and exists(
        select 1 from public.friendships f
        where f.user_id   = (select auth.uid())
          and f.friend_id = coalesce(
            nullif(requester_id,       '00000000-0000-0000-0000-000000000000'::uuid),
            created_by_user_id
          )
      )
    )
  );

-- Constrain the visibility column to known values
alter table public.mitzvah_requests
  drop constraint if exists mitzvah_requests_visibility_values;
alter table public.mitzvah_requests
  add constraint mitzvah_requests_visibility_values
    check (coalesce(visibility, 'community') in ('community', 'friends_only', 'public'));


-- ─── Table comments ──────────────────────────────────────────────────────────

comment on table public.friend_requests is
  'One row per directed friend request. Status: pending → accepted | declined | cancelled.';
comment on table public.friendships is
  'Accepted friendships stored as two directional rows (A→B and B→A) for simple querying.';
