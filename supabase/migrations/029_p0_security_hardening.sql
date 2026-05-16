-- 029_p0_security_hardening.sql
--
-- Records the P0 production-readiness repairs applied during stabilization:
-- - private communities are no longer readable by non-members
-- - anonymous users cannot execute security-definer RPCs intended for signed-in users
--
-- This migration is idempotent and does not remove user data.

drop policy if exists "Communities are readable" on public.communities;
drop policy if exists "communities are readable by everyone" on public.communities;
drop policy if exists "Public communities and member communities are readable" on public.communities;

create policy "Public communities and member communities are readable"
  on public.communities
  for select
  using (
    lower(coalesce(privacy, 'public')) = 'public'
    or public.is_active_community_member(id)
  );

drop policy if exists "logged in users can create communities" on public.communities;

revoke execute on function public.accept_friend_request(uuid) from public, anon;
grant execute on function public.accept_friend_request(uuid) to authenticated;

revoke execute on function public.can_access_community(uuid) from public, anon;
grant execute on function public.can_access_community(uuid) to authenticated;

revoke execute on function public.can_manage_community(uuid) from public, anon;
grant execute on function public.can_manage_community(uuid) to authenticated;

revoke execute on function public.cancel_community_deletion(uuid) from public, anon;
grant execute on function public.cancel_community_deletion(uuid) to authenticated;

revoke execute on function public.cancel_friend_request(uuid) from public, anon;
grant execute on function public.cancel_friend_request(uuid) to authenticated;

revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.check_rate_limit(text, integer, integer) to authenticated;

revoke execute on function public.create_feed_reply(uuid, text, uuid, uuid, text, text, jsonb) from public, anon;
grant execute on function public.create_feed_reply(uuid, text, uuid, uuid, text, text, jsonb) to authenticated;

revoke execute on function public.decline_friend_request(uuid) from public, anon;
grant execute on function public.decline_friend_request(uuid) to authenticated;

revoke execute on function public.ensure_community_creator_membership() from public, anon;

revoke execute on function public.increment_counter(text, text, uuid, integer) from public, anon;
grant execute on function public.increment_counter(text, text, uuid, integer) to authenticated;

revoke execute on function public.initiate_community_deletion(uuid) from public, anon;
grant execute on function public.initiate_community_deletion(uuid) to authenticated;

revoke execute on function public.is_active_community_member(uuid) from public, anon;
grant execute on function public.is_active_community_member(uuid) to authenticated;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

revoke execute on function public.remove_community_member(uuid, uuid, text, text) from public, anon;
grant execute on function public.remove_community_member(uuid, uuid, text, text) to authenticated;

revoke execute on function public.remove_friendship(uuid) from public, anon;
grant execute on function public.remove_friendship(uuid) to authenticated;

revoke execute on function public.review_community_appeal(uuid, text, text) from public, anon;
grant execute on function public.review_community_appeal(uuid, text, text) to authenticated;

revoke execute on function public.send_friend_request(uuid) from public, anon;
grant execute on function public.send_friend_request(uuid) to authenticated;

revoke execute on function public.submit_community_appeal(uuid, text) from public, anon;
grant execute on function public.submit_community_appeal(uuid, text) to authenticated;

revoke execute on function public.toggle_post_like(uuid) from public, anon;
grant execute on function public.toggle_post_like(uuid) to authenticated;

revoke execute on function public.update_community_member_role(uuid, uuid, text) from public, anon;
grant execute on function public.update_community_member_role(uuid, uuid, text) to authenticated;

revoke execute on function public.vote_on_community_deletion(uuid, boolean) from public, anon;
grant execute on function public.vote_on_community_deletion(uuid, boolean) to authenticated;
