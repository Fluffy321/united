-- Communities Professionalization Phase 1
-- - Treat announcements as official community posts.
-- - Keep pinned/featured posts guarded by community manager permissions.
-- - Make the can_manage_community helper match the product role model:
--   creator/owner/admin/moderator/platform admin.

create or replace function public.can_manage_community(p_community_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    case when auth.uid() is null then false else public.is_admin() end
    or exists (
      select 1
      from public.communities c
      where c.id = p_community_id
        and c.created_by_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.community_memberships cm
      where cm.community_id = p_community_id
        and cm.user_id = auth.uid()
        and lower(cm.status) = 'active'
        and lower(cm.role) in ('owner', 'admin', 'moderator')
    ),
    false
  )
$$;

revoke all on function public.can_manage_community(uuid) from public;
grant execute on function public.can_manage_community(uuid) to authenticated;

create or replace function public.sync_post_compat_and_guard_pins()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_new_official boolean;
  v_old_official boolean;
begin
  NEW.body := coalesce(NEW.body, NEW.content);
  NEW.content := coalesce(NEW.content, NEW.body);
  NEW.post_type := coalesce(NEW.post_type, NEW.type);
  NEW.type := coalesce(NEW.type, NEW.post_type, 'post');
  NEW.post_kind := coalesce(NEW.post_kind, NEW.post_type, NEW.type, 'standard');
  NEW.user_id := coalesce(NEW.user_id, NEW.author_user_id);
  NEW.author_user_id := coalesce(NEW.author_user_id, NEW.user_id);

  v_new_official :=
    NEW.community_id is not null
    and (
      lower(coalesce(NEW.post_kind, '')) in ('announcement', 'official_update', 'local_update')
      or lower(coalesce(NEW.post_type, '')) in ('announcement', 'official_update')
      or lower(coalesce(NEW.type, '')) in ('announcement', 'official_update')
      or coalesce(NEW.is_official, false) is true
    );

  if TG_OP = 'UPDATE' then
    v_old_official :=
      OLD.community_id is not null
      and (
        lower(coalesce(OLD.post_kind, '')) in ('announcement', 'official_update', 'local_update')
        or lower(coalesce(OLD.post_type, '')) in ('announcement', 'official_update')
        or lower(coalesce(OLD.type, '')) in ('announcement', 'official_update')
        or coalesce(OLD.is_official, false) is true
      );
  else
    v_old_official := false;
  end if;

  if TG_OP = 'INSERT' and v_new_official then
    if not public.can_manage_community(NEW.community_id) then
      raise exception 'Only community managers can create official announcements'
        using errcode = 'insufficient_privilege';
    end if;
  end if;

  if TG_OP = 'UPDATE' and (v_new_official or v_old_official) then
    if not public.can_manage_community(coalesce(NEW.community_id, OLD.community_id)) then
      raise exception 'Only community managers can change official announcements'
        using errcode = 'insufficient_privilege';
    end if;
  end if;

  if TG_OP = 'INSERT' and NEW.is_pinned is true then
    if NEW.community_id is null or not public.can_manage_community(NEW.community_id) then
      raise exception 'Only community managers can create pinned posts'
        using errcode = 'insufficient_privilege';
    end if;
    NEW.pinned_at := coalesce(NEW.pinned_at, now());
    NEW.pinned_by := coalesce(NEW.pinned_by, auth.uid());
  end if;

  if TG_OP = 'UPDATE' and (
    NEW.is_pinned is distinct from OLD.is_pinned
    or NEW.pinned_at is distinct from OLD.pinned_at
    or NEW.pinned_by is distinct from OLD.pinned_by
  ) then
    if NEW.community_id is null or not public.can_manage_community(NEW.community_id) then
      raise exception 'Only community managers can change pinned posts'
        using errcode = 'insufficient_privilege';
    end if;
  end if;

  if NEW.is_pinned is true then
    NEW.pinned_at := coalesce(NEW.pinned_at, now());
    NEW.pinned_by := coalesce(NEW.pinned_by, auth.uid());
  else
    NEW.pinned_at := null;
    NEW.pinned_by := null;
  end if;

  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists trg_sync_post_compat_and_guard_pins on public.posts;
create trigger trg_sync_post_compat_and_guard_pins
  before insert or update on public.posts
  for each row
  execute function public.sync_post_compat_and_guard_pins();

comment on function public.sync_post_compat_and_guard_pins() is
  'Keeps post compatibility fields aligned and prevents non-managers from forging official announcements or pinned posts.';
