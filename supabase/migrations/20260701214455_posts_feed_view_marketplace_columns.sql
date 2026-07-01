-- posts_feed_view was created before 20260701210331 added the marketplace
-- columns; `select p.*` is expanded at view-creation time, so the feed could
-- not see price / listing_status / image_urls etc. Recreate with the same
-- security posture as 20260701204247.
-- (Recovered from remote schema_migrations on 2026-07-01: applied via MCP but
-- the local file was never committed.)

drop view if exists public.posts_feed_view;

create view public.posts_feed_view
with (security_invoker = true)
as
select
  p.*,
  pr.display_name   as profile_display_name,
  pr.avatar_url     as profile_avatar_url,
  c.name            as community_name_fresh,
  c.logo_url        as community_logo_fresh
from public.posts p
left join public.public_profiles pr on pr.id = p.user_id
left join public.communities c on c.id = p.community_id;

revoke all on public.posts_feed_view from public, anon;
grant select on public.posts_feed_view to authenticated;
