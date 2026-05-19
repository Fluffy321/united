-- Batch check: which of the current user's joined communities have
-- new posts or events since their last visit?
-- Called from the Communities list page to drive per-card "new activity" dots.
-- Returns only communities where the user is still a member.

create or replace function public.get_communities_with_new_activity()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select distinct clv.community_id
  from public.community_last_visits clv
  -- only currently-joined communities (guard against stale visit rows after a leave)
  join public.community_memberships cm
    on cm.community_id = clv.community_id
    and cm.user_id = clv.user_id
  where clv.user_id = auth.uid()
    and (
      -- new posts since last visit
      exists (
        select 1 from public.posts p
        where p.community_id = clv.community_id
          and p.created_at > clv.visited_at
      )
      or
      -- new events since last visit
      exists (
        select 1 from public.community_events e
        where e.community_id = clv.community_id
          and e.created_at > clv.visited_at
      )
    )
$$;

revoke all on function public.get_communities_with_new_activity() from public;
grant execute on function public.get_communities_with_new_activity() to authenticated;
