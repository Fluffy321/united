-- Revised Free vs Premium Community limits
--
-- Free communities:
-- - Up to 3 upcoming published events.
-- - Up to 10 total resources.
-- Premium communities have no cap for these two features.

create or replace function public.community_has_premium_plan(p_community_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.communities c
      where c.id = p_community_id
        and c.plan_key = 'community_premium'
        and c.plan_status in ('active', 'trialing', 'past_due')
    ),
    false
  )
$$;

revoke all on function public.community_has_premium_plan(uuid) from public;
grant execute on function public.community_has_premium_plan(uuid) to authenticated;

create or replace function public.community_event_start_at(
  p_starts_at timestamptz,
  p_start_date date,
  p_start_time text,
  p_event_date date,
  p_event_time text
)
returns timestamptz
language sql
stable
as $$
  select coalesce(
    p_starts_at,
    case
      when p_start_date is not null then
        (p_start_date::text || ' ' || coalesce(nullif(p_start_time, ''), '00:00'))::timestamptz
      else null
    end,
    case
      when p_event_date is not null then
        (p_event_date::text || ' ' || coalesce(nullif(p_event_time, ''), '00:00'))::timestamptz
      else null
    end
  )
$$;

create or replace function public.enforce_free_community_event_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_start timestamptz;
  v_existing_count integer;
begin
  v_new_start := public.community_event_start_at(
    NEW.starts_at,
    NEW.start_date,
    NEW.start_time,
    NEW.event_date,
    NEW.event_time
  );

  -- The Free cap counts only member-visible upcoming events.
  -- Draft, cancelled, archived, and past events do not count.
  if lower(coalesce(NEW.status, 'published')) <> 'published'
     or v_new_start is null
     or v_new_start < now()
     or public.community_has_premium_plan(NEW.community_id) then
    return NEW;
  end if;

  select count(*)
  into v_existing_count
  from public.community_events e
  where e.community_id = NEW.community_id
    and e.id <> NEW.id
    and lower(coalesce(e.status, 'published')) = 'published'
    and public.community_event_start_at(
      e.starts_at,
      e.start_date,
      e.start_time,
      e.event_date,
      e.event_time
    ) >= now();

  if v_existing_count >= 3 then
    raise exception 'Free communities can have up to 3 upcoming published events. Upgrade to Premium for unlimited events.'
      using errcode = 'check_violation';
  end if;

  return NEW;
end;
$$;

drop trigger if exists zzz_enforce_free_community_event_limit on public.community_events;
create trigger zzz_enforce_free_community_event_limit
  before insert or update on public.community_events
  for each row
  execute function public.enforce_free_community_event_limit();

create or replace function public.enforce_free_community_resource_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_count integer;
begin
  if public.community_has_premium_plan(NEW.community_id) then
    return NEW;
  end if;

  -- Updating a resource inside the same community does not change the total.
  if TG_OP = 'UPDATE' and OLD.community_id = NEW.community_id then
    return NEW;
  end if;

  select count(*)
  into v_existing_count
  from public.community_resources r
  where r.community_id = NEW.community_id;

  if v_existing_count >= 10 then
    raise exception 'Free communities can share up to 10 resources. Upgrade to Premium for an unlimited resource library.'
      using errcode = 'check_violation';
  end if;

  return NEW;
end;
$$;

drop trigger if exists zzz_enforce_free_community_resource_limit on public.community_resources;
create trigger zzz_enforce_free_community_resource_limit
  before insert or update on public.community_resources
  for each row
  execute function public.enforce_free_community_resource_limit();
