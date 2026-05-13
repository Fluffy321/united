-- 024_community_admin_center.sql
-- Adds: community_member_removals, community_member_appeals,
--       community_admin_audit_log plus 4 security-definer RPCs.

-- ─── community_member_removals ───────────────────────────────────────────────
create table if not exists public.community_member_removals (
  id                  uuid        primary key default gen_random_uuid(),
  community_id        uuid        not null references public.communities(id) on delete cascade,
  removed_user_id     uuid        not null references public.profiles(id)   on delete cascade,
  removed_by_user_id  uuid                 references public.profiles(id)   on delete set null,
  community_privacy   text        not null default 'Public',
  reason_code         text        not null,
  reason_note         text,
  removed_at          timestamptz not null default now(),
  appeal_allowed      boolean     not null default true,
  created_at          timestamptz not null default now()
);

alter table public.community_member_removals enable row level security;

create index if not exists cmr_community_idx    on public.community_member_removals (community_id);
create index if not exists cmr_removed_user_idx on public.community_member_removals (removed_user_id);
create index if not exists cmr_removed_at_idx   on public.community_member_removals (removed_at desc);

create policy "Removed user can view their own removal"
  on public.community_member_removals for select
  using (removed_user_id = auth.uid());

create policy "Community admins can view removals"
  on public.community_member_removals for select
  using (
    exists (
      select 1 from public.community_memberships cm
      where cm.community_id = community_member_removals.community_id
        and cm.user_id      = auth.uid()
        and lower(cm.role)  in ('owner', 'admin', 'moderator')
        and cm.status       = 'active'
    )
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ─── community_member_appeals ────────────────────────────────────────────────
create table if not exists public.community_member_appeals (
  id                  uuid        primary key default gen_random_uuid(),
  community_id        uuid        not null references public.communities(id) on delete cascade,
  removal_id          uuid        not null references public.community_member_removals(id) on delete cascade,
  appellant_user_id   uuid        not null references public.profiles(id)   on delete cascade,
  message             text        not null,
  status              text        not null default 'pending',
  reviewed_by_user_id uuid                 references public.profiles(id)   on delete set null,
  review_note         text,
  created_at          timestamptz not null default now(),
  reviewed_at         timestamptz,
  unique (removal_id)
);

alter table public.community_member_appeals enable row level security;

create index if not exists cma_community_idx on public.community_member_appeals (community_id);
create index if not exists cma_appellant_idx on public.community_member_appeals (appellant_user_id);
create index if not exists cma_status_idx    on public.community_member_appeals (status);

create policy "Appellant can view their own appeal"
  on public.community_member_appeals for select
  using (appellant_user_id = auth.uid());

create policy "Community admins can view appeals"
  on public.community_member_appeals for select
  using (
    exists (
      select 1 from public.community_memberships cm
      where cm.community_id = community_member_appeals.community_id
        and cm.user_id      = auth.uid()
        and lower(cm.role)  in ('owner', 'admin', 'moderator')
        and cm.status       = 'active'
    )
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ─── community_admin_audit_log ───────────────────────────────────────────────
create table if not exists public.community_admin_audit_log (
  id              uuid        primary key default gen_random_uuid(),
  community_id    uuid        not null references public.communities(id) on delete cascade,
  actor_user_id   uuid                 references public.profiles(id) on delete set null,
  target_user_id  uuid                 references public.profiles(id) on delete set null,
  action_type     text        not null,
  metadata        jsonb       not null default '{}',
  created_at      timestamptz not null default now()
);

alter table public.community_admin_audit_log enable row level security;

create index if not exists caal_community_idx on public.community_admin_audit_log (community_id);
create index if not exists caal_created_idx   on public.community_admin_audit_log (created_at desc);

create policy "Community admins can read audit log"
  on public.community_admin_audit_log for select
  using (
    exists (
      select 1 from public.community_memberships cm
      where cm.community_id = community_admin_audit_log.community_id
        and cm.user_id      = auth.uid()
        and lower(cm.role)  in ('owner', 'admin', 'moderator')
        and cm.status       = 'active'
    )
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ─── RPC: remove_community_member ────────────────────────────────────────────
create or replace function public.remove_community_member(
  p_community_id  uuid,
  p_user_id       uuid,
  p_reason_code   text,
  p_reason_note   text default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_caller_id         uuid    := auth.uid();
  v_caller_role       text;
  v_community_privacy text;
  v_removal_id        uuid;
  v_membership_id     uuid;
begin
  if v_caller_id is null then raise exception 'Not authenticated'; end if;

  select lower(role) into v_caller_role
  from public.community_memberships
  where community_id = p_community_id and user_id = v_caller_id and status = 'active';

  if v_caller_role is null or v_caller_role not in ('admin','owner','moderator') then
    if not exists (select 1 from public.profiles where id = v_caller_id and role = 'admin') then
      raise exception 'Not authorized to remove members from this community';
    end if;
  end if;

  if exists (select 1 from public.communities where id = p_community_id and created_by_user_id = p_user_id) then
    raise exception 'Cannot remove the community owner';
  end if;
  if p_user_id = v_caller_id then
    raise exception 'Cannot remove yourself from the community';
  end if;

  select coalesce(privacy,'Public') into v_community_privacy
  from public.communities where id = p_community_id;

  if lower(coalesce(v_community_privacy,'public')) = 'public' then
    if p_reason_code is null or trim(p_reason_code) = '' then
      raise exception 'A removal reason is required for public communities';
    end if;
    if p_reason_code = 'other' and (p_reason_note is null or trim(p_reason_note) = '') then
      raise exception 'A written explanation is required when using the "Other" reason';
    end if;
  end if;

  select id into v_membership_id from public.community_memberships
  where community_id = p_community_id and user_id = p_user_id and status = 'active';
  if v_membership_id is null then
    raise exception 'User is not an active member of this community';
  end if;

  insert into public.community_member_removals
    (community_id, removed_user_id, removed_by_user_id, community_privacy, reason_code, reason_note, appeal_allowed)
  values
    (p_community_id, p_user_id, v_caller_id, v_community_privacy, p_reason_code, p_reason_note, true)
  returning id into v_removal_id;

  delete from public.community_memberships where id = v_membership_id;

  update public.communities
  set follower_count = greatest(0, coalesce(follower_count,0) - 1)
  where id = p_community_id;

  insert into public.community_admin_audit_log
    (community_id, actor_user_id, target_user_id, action_type, metadata)
  values
    (p_community_id, v_caller_id, p_user_id, 'member_removed',
     jsonb_build_object('reason_code', p_reason_code, 'removal_id', v_removal_id::text));

  return jsonb_build_object('success', true, 'removal_id', v_removal_id);
end; $$;

revoke all on function public.remove_community_member(uuid,uuid,text,text) from public;
grant execute on function public.remove_community_member(uuid,uuid,text,text) to authenticated;

-- ─── RPC: submit_community_appeal ────────────────────────────────────────────
create or replace function public.submit_community_appeal(
  p_removal_id  uuid,
  p_message     text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_caller_id uuid := auth.uid();
  v_removal   public.community_member_removals%rowtype;
  v_appeal_id uuid;
begin
  if v_caller_id is null then raise exception 'Not authenticated'; end if;
  if trim(coalesce(p_message,'')) = '' then raise exception 'Appeal message cannot be empty'; end if;

  select * into v_removal from public.community_member_removals where id = p_removal_id;
  if not found then raise exception 'Removal record not found'; end if;
  if v_removal.removed_user_id <> v_caller_id then raise exception 'Not authorized to submit this appeal'; end if;
  if not v_removal.appeal_allowed then raise exception 'Appeals are not allowed for this removal'; end if;
  if exists (select 1 from public.community_member_appeals where removal_id = p_removal_id) then
    raise exception 'An appeal has already been submitted for this removal';
  end if;

  insert into public.community_member_appeals
    (community_id, removal_id, appellant_user_id, message)
  values
    (v_removal.community_id, p_removal_id, v_caller_id, trim(p_message))
  returning id into v_appeal_id;

  insert into public.community_admin_audit_log
    (community_id, actor_user_id, target_user_id, action_type, metadata)
  values
    (v_removal.community_id, v_caller_id, v_caller_id, 'appeal_submitted',
     jsonb_build_object('appeal_id', v_appeal_id::text, 'removal_id', p_removal_id::text));

  return jsonb_build_object('success', true, 'appeal_id', v_appeal_id);
end; $$;

revoke all on function public.submit_community_appeal(uuid,text) from public;
grant execute on function public.submit_community_appeal(uuid,text) to authenticated;

-- ─── RPC: review_community_appeal ────────────────────────────────────────────
create or replace function public.review_community_appeal(
  p_appeal_id   uuid,
  p_decision    text,
  p_review_note text default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_caller_id   uuid := auth.uid();
  v_caller_role text;
  v_appeal      public.community_member_appeals%rowtype;
  v_user_name   text;
begin
  if v_caller_id is null then raise exception 'Not authenticated'; end if;
  if p_decision not in ('approved','denied') then raise exception 'Decision must be approved or denied'; end if;

  select * into v_appeal from public.community_member_appeals
  where id = p_appeal_id and status = 'pending';
  if not found then raise exception 'Appeal not found or already reviewed'; end if;

  select lower(role) into v_caller_role from public.community_memberships
  where community_id = v_appeal.community_id and user_id = v_caller_id and status = 'active';

  if v_caller_role is null or v_caller_role not in ('admin','owner','moderator') then
    if not exists (select 1 from public.profiles where id = v_caller_id and role = 'admin') then
      raise exception 'Not authorized to review appeals for this community';
    end if;
  end if;

  update public.community_member_appeals
  set status = p_decision, reviewed_by_user_id = v_caller_id,
      review_note = p_review_note, reviewed_at = now()
  where id = p_appeal_id;

  if p_decision = 'approved' then
    select coalesce(display_name, email, 'Member') into v_user_name
    from public.profiles where id = v_appeal.appellant_user_id;

    if not exists (
      select 1 from public.community_memberships
      where community_id = v_appeal.community_id and user_id = v_appeal.appellant_user_id
    ) then
      insert into public.community_memberships (community_id, user_id, role, status, user_name)
      values (v_appeal.community_id, v_appeal.appellant_user_id, 'member', 'active', v_user_name);

      update public.communities
      set follower_count = coalesce(follower_count,0) + 1
      where id = v_appeal.community_id;
    end if;
  end if;

  insert into public.community_admin_audit_log
    (community_id, actor_user_id, target_user_id, action_type, metadata)
  values
    (v_appeal.community_id, v_caller_id, v_appeal.appellant_user_id,
     case when p_decision='approved' then 'appeal_approved' else 'appeal_denied' end,
     jsonb_build_object('appeal_id', p_appeal_id::text, 'decision', p_decision));

  return jsonb_build_object('success', true, 'decision', p_decision);
end; $$;

revoke all on function public.review_community_appeal(uuid,text,text) from public;
grant execute on function public.review_community_appeal(uuid,text,text) to authenticated;

-- ─── RPC: update_community_member_role ───────────────────────────────────────
create or replace function public.update_community_member_role(
  p_community_id  uuid,
  p_user_id       uuid,
  p_new_role      text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_caller_id   uuid := auth.uid();
  v_caller_role text;
  v_action_type text;
begin
  if v_caller_id is null then raise exception 'Not authenticated'; end if;
  if lower(p_new_role) not in ('member','moderator','admin') then
    raise exception 'Invalid role. Must be member, moderator, or admin';
  end if;

  if exists (select 1 from public.communities where id = p_community_id and created_by_user_id = p_user_id) then
    raise exception 'Cannot change the community owner''s role';
  end if;

  select lower(role) into v_caller_role from public.community_memberships
  where community_id = p_community_id and user_id = v_caller_id and status = 'active';

  if v_caller_role not in ('admin','owner') then
    if not exists (select 1 from public.profiles where id = v_caller_id and role = 'admin') then
      raise exception 'Only owners and admins can manage member roles';
    end if;
  end if;

  update public.community_memberships
  set role = lower(p_new_role), updated_at = now()
  where community_id = p_community_id and user_id = p_user_id and status = 'active';

  if not found then raise exception 'User is not an active member of this community'; end if;

  v_action_type := case when lower(p_new_role) in ('admin','moderator') then 'role_promoted' else 'role_demoted' end;

  insert into public.community_admin_audit_log
    (community_id, actor_user_id, target_user_id, action_type, metadata)
  values
    (p_community_id, v_caller_id, p_user_id, v_action_type,
     jsonb_build_object('new_role', lower(p_new_role)));

  return jsonb_build_object('success', true, 'new_role', lower(p_new_role));
end; $$;

revoke all on function public.update_community_member_role(uuid,uuid,text) from public;
grant execute on function public.update_community_member_role(uuid,uuid,text) to authenticated;
