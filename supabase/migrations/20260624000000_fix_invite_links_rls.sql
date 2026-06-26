-- Fix overly-broad invite_links UPDATE policy (security hardening)
-- Replaces the single "using (true)" policy with two scoped ones.

drop policy if exists "Authenticated users update invite links" on invite_links;
drop policy if exists "Owners update invite links" on invite_links;
drop policy if exists "Members increment invite link uses_count" on invite_links;

-- 1. Community admins/owners/moderators (and the link creator) can fully update
create policy "Owners update invite links"
  on invite_links for update
  to authenticated
  using (
    inviter_id = auth.uid()
    or exists (
      select 1 from community_memberships
      where community_id = invite_links.community_id
        and user_id = auth.uid()
        and role in ('admin', 'moderator', 'owner')
        and status = 'active'
    )
  )
  with check (
    inviter_id = auth.uid()
    or exists (
      select 1 from community_memberships
      where community_id = invite_links.community_id
        and user_id = auth.uid()
        and role in ('admin', 'moderator', 'owner')
        and status = 'active'
    )
  );

-- 2. Join flow increments are handled through a SECURITY DEFINER RPC instead
-- of a broad row UPDATE policy. RLS cannot reliably express "only this one
-- column changed" by comparing column_name = column_name inside WITH CHECK.
create or replace function public.increment_invite_link_use(p_invite_id uuid)
returns public.invite_links
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invite_links;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_invite
  from public.invite_links
  where id = p_invite_id
  for update;

  if v_invite.id is null then
    raise exception 'Invite link not found';
  end if;
  if v_invite.is_active is not true then
    raise exception 'Invite link is not active';
  end if;
  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    update public.invite_links
    set is_active = false,
        updated_at = now()
    where id = p_invite_id
    returning * into v_invite;
    raise exception 'Invite link has expired';
  end if;
  if v_invite.max_uses is not null and v_invite.uses_count >= v_invite.max_uses then
    update public.invite_links
    set is_active = false,
        updated_at = now()
    where id = p_invite_id
    returning * into v_invite;
    raise exception 'Invite link has reached its use limit';
  end if;

  update public.invite_links
  set uses_count = uses_count + 1,
      is_active = case
        when max_uses is not null and uses_count + 1 >= max_uses then false
        else is_active
      end,
      updated_at = now()
  where id = p_invite_id
  returning * into v_invite;

  return v_invite;
end;
$$;

revoke all on function public.increment_invite_link_use(uuid) from public, anon;
grant execute on function public.increment_invite_link_use(uuid) to authenticated;
