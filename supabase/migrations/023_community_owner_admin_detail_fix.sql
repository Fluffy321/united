-- 023_community_owner_admin_detail_fix.sql
--
-- Repairs community ownership/admin behavior:
-- - creator memberships are admin memberships
-- - community update policies accept owner/admin/moderator case-insensitively
-- - creators cannot accidentally leave and orphan their community
-- - future community inserts automatically create an admin membership for the creator

alter table public.communities
  add column if not exists description_long text;

-- Backfill creator memberships that were previously created as plain members.
insert into public.community_memberships (
  community_id,
  user_id,
  role,
  status,
  user_name,
  created_at,
  updated_at
)
select
  c.id,
  c.created_by_user_id,
  'admin',
  'active',
  c.created_by_name,
  now(),
  now()
from public.communities c
where c.created_by_user_id is not null
on conflict (community_id, user_id) do update
set
  role = case
    when lower(coalesce(public.community_memberships.role, '')) in ('owner', 'admin') then public.community_memberships.role
    else 'admin'
  end,
  status = 'active',
  user_name = coalesce(public.community_memberships.user_name, excluded.user_name),
  updated_at = now();

drop policy if exists "Community admins can update their community" on public.communities;
create policy "Community admins can update their community"
  on public.communities
  for update
  using (
    created_by_user_id = auth.uid()
    or exists (
      select 1
      from public.community_memberships
      where community_memberships.community_id = communities.id
        and community_memberships.user_id = auth.uid()
        and lower(community_memberships.role) in ('owner', 'admin', 'moderator')
        and community_memberships.status = 'active'
    )
  )
  with check (
    created_by_user_id = auth.uid()
    or exists (
      select 1
      from public.community_memberships
      where community_memberships.community_id = communities.id
        and community_memberships.user_id = auth.uid()
        and lower(community_memberships.role) in ('owner', 'admin', 'moderator')
        and community_memberships.status = 'active'
    )
  );

drop policy if exists "Users can leave non-owned communities" on public.community_memberships;
create policy "Users can leave non-owned communities"
  on public.community_memberships
  for delete
  using (
    auth.uid() = user_id
    and not exists (
      select 1
      from public.communities
      where communities.id = community_memberships.community_id
        and communities.created_by_user_id = auth.uid()
    )
  );

create or replace function public.ensure_community_creator_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.created_by_user_id is null then
    return NEW;
  end if;

  insert into public.community_memberships (
    community_id,
    user_id,
    role,
    status,
    user_name,
    created_at,
    updated_at
  )
  values (
    NEW.id,
    NEW.created_by_user_id,
    'admin',
    'active',
    NEW.created_by_name,
    now(),
    now()
  )
  on conflict (community_id, user_id) do update
  set
    role = case
      when lower(coalesce(public.community_memberships.role, '')) in ('owner', 'admin') then public.community_memberships.role
      else 'admin'
    end,
    status = 'active',
    user_name = coalesce(public.community_memberships.user_name, excluded.user_name),
    updated_at = now();

  return NEW;
end;
$$;

drop trigger if exists ensure_community_creator_membership_trigger on public.communities;
create trigger ensure_community_creator_membership_trigger
  after insert on public.communities
  for each row
  execute function public.ensure_community_creator_membership();

revoke all on function public.ensure_community_creator_membership() from public;
