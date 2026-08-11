-- 20260701200000_security_hardening_content_rls.sql
--
-- Security hardening batch (2026-07-01 full-app review):
--
-- 1. posts / comments / reactions were world-readable (`USING (true)`, including
--    anon), so private-community content leaked to everyone. SELECT is now
--    scoped to signed-in users and community visibility. Also removes
--    live-only duplicate permissive policies found on posts — including a loose
--    INSERT policy that bypassed the community posting_mode restrictions added
--    in 20260515182824.
-- 2. invite_links had a public SELECT policy that let anyone (incl. anon) list
--    every invite code for every community. Reads are now scoped to the inviter
--    and community managers; the /join page looks codes up through the new
--    get_invite_link_by_code RPC (possessing the code is the capability).
-- 3. posts_feed_view was a definer view, bypassing RLS on posts/profiles/
--    communities (profiles is deliberately owner-read-only per 20260612202229).
--    Recreated as security_invoker joining public_profiles instead.
-- 4. refuah_requests (names + free-text medical condition) was readable by
--    anon. Reads now require a signed-in user.

-- ── 1a. posts ────────────────────────────────────────────────────────────────

drop policy if exists "Posts are readable" on public.posts;
drop policy if exists "posts are readable by everyone" on public.posts;

create policy "Posts readable in accessible communities"
  on public.posts
  for select
  to authenticated
  using (
    community_id is null
    or public.can_access_community(community_id)
  );

-- Live-only duplicates that weakened or duplicated file-tracked policies:
-- the loose INSERT policy OR'd with the posting_mode policy and defeated it.
drop policy if exists "logged in users can create posts" on public.posts;
drop policy if exists "users can update own posts" on public.posts;
drop policy if exists "users can delete own posts" on public.posts;

-- ── 1b. comments ─────────────────────────────────────────────────────────────

drop policy if exists "Comments are readable" on public.comments;

-- Visibility piggybacks on posts RLS: the subquery runs as the querying user,
-- so a comment is readable exactly when its post is.
create policy "Comments readable on accessible posts"
  on public.comments
  for select
  to authenticated
  using (
    exists (select 1 from public.posts p where p.id = comments.post_id)
  );

-- ── 1c. reactions ────────────────────────────────────────────────────────────

drop policy if exists "Reactions are readable" on public.reactions;

create policy "Reactions readable on accessible content"
  on public.reactions
  for select
  to authenticated
  using (
    (post_id is not null
      and exists (select 1 from public.posts p where p.id = reactions.post_id))
    or
    (comment_id is not null
      and exists (select 1 from public.comments c where c.id = reactions.comment_id))
  );

-- ── 2. invite_links ──────────────────────────────────────────────────────────

drop policy if exists "Public read invite links" on public.invite_links;

create policy "Inviters and community managers read invite links"
  on public.invite_links
  for select
  to authenticated
  using (
    inviter_id = auth.uid()
    or exists (
      select 1
      from public.community_memberships cm
      where cm.community_id = invite_links.community_id
        and cm.user_id = auth.uid()
        and cm.role in ('admin', 'moderator', 'owner')
        and cm.status = 'active'
    )
  );

-- Join-page lookup. Returns only the fields the invite preview needs, plus a
-- community preview (works for private communities, whose rows the invitee
-- cannot read directly). Granted to anon so a logged-out invite recipient can
-- still see the preview before signing in.
create or replace function public.get_invite_link_by_code(p_code text)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_invite public.invite_links%rowtype;
  v_community public.communities%rowtype;
begin
  if p_code is null or length(trim(p_code)) = 0 then
    return jsonb_build_object('status', 'not_found');
  end if;

  select * into v_invite
  from public.invite_links
  where code = trim(p_code)
  limit 1;

  if v_invite.id is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  if v_invite.is_active is not true
     or (v_invite.expires_at is not null and v_invite.expires_at < now())
     or (v_invite.max_uses is not null and v_invite.uses_count >= v_invite.max_uses) then
    return jsonb_build_object('status', 'expired');
  end if;

  select * into v_community
  from public.communities
  where id = v_invite.community_id;

  if v_community.id is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  return jsonb_build_object(
    'status', 'active',
    'invite', jsonb_build_object(
      'id', v_invite.id,
      'community_id', v_invite.community_id,
      'inviter_id', v_invite.inviter_id,
      'inviter_name', v_invite.inviter_name,
      'is_active', v_invite.is_active,
      'expires_at', v_invite.expires_at,
      'max_uses', v_invite.max_uses,
      'uses_count', v_invite.uses_count
    ),
    'community', jsonb_build_object(
      'id', v_community.id,
      'name', v_community.name,
      'logo_url', v_community.logo_url,
      'cover_image_url', v_community.cover_url,
      'type', v_community.type,
      'category', v_community.category,
      'description', v_community.description,
      'description_short', v_community.description_short,
      'follower_count', v_community.follower_count,
      'neighborhood', v_community.neighborhood
    )
  );
end;
$$;

revoke all on function public.get_invite_link_by_code(text) from public;
grant execute on function public.get_invite_link_by_code(text) to authenticated, anon;

-- ── 3. posts_feed_view ───────────────────────────────────────────────────────

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
left join public.public_profiles pr on pr.id::text = p.user_id
left join public.communities c on c.id::text = p.community_id;

revoke all on public.posts_feed_view from public, anon;
grant select on public.posts_feed_view to authenticated;

-- ── 4. refuah_requests ───────────────────────────────────────────────────────

drop policy if exists "Anyone reads refuah" on public.refuah_requests;

create policy "Signed-in users read refuah requests"
  on public.refuah_requests
  for select
  to authenticated
  using (true);
