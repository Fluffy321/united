-- Server-side account deletion / anonymization RPC.
--
-- Design: we do NOT hard-delete the public.profiles row. Several NOT NULL
-- author/owner columns (comments.author_id, community_group_chats.author_id,
-- group_posts.user_id, mitzvah_request_comments.author_id, mitzvah_requests.requester_id, ...)
-- are declared ON DELETE CASCADE, so deleting profiles would silently wipe out
-- posts/replies that other members are actively participating in. Instead we
-- scrub the profile in place (profiles.deleted_at + PII columns nulled) so every
-- join to profiles.display_name/avatar_url already renders as "Deleted User"
-- with no code changes elsewhere, then walk every other table that references
-- the account and either delete or null the reference, mirroring each FK's own
-- delete_rule (CASCADE -> delete the row, SET NULL -> null the column) except
-- where a table holds public content other members depend on (posts, comments,
-- group chats/posts, mitzvah request comments, mitzvah requests, messages) --
-- those are anonymized in place instead of deleted. Audit-trail tables
-- (moderation_audit_logs, community_admin_audit_log, community_member_removals)
-- are intentionally left untouched to preserve moderation history.

alter table public.profiles add column if not exists deleted_at timestamptz;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_uid_text text;
begin
  if v_uid is null then
    raise exception 'Must be signed in to delete an account';
  end if;

  v_uid_text := v_uid::text;

  -- ── Public content: anonymize in place, do not delete ──────────────────
  update public.posts
    set user_id = case when user_id = v_uid then null else user_id end,
        author_user_id = case when author_user_id = v_uid then null else author_user_id end,
        submitted_by = case when submitted_by = v_uid then null else submitted_by end,
        pinned_by = case when pinned_by = v_uid then null else pinned_by end,
        author_name = case when user_id = v_uid or author_user_id = v_uid then null else author_name end,
        author_avatar_url = case when user_id = v_uid or author_user_id = v_uid then null else author_avatar_url end
    where user_id = v_uid or author_user_id = v_uid or submitted_by = v_uid or pinned_by = v_uid;

  update public.comments
    set body = '[deleted]',
        is_deleted = true,
        author_name = null,
        author_avatar_url = null
    where author_id = v_uid;

  update public.community_group_chats
    set message = '[deleted]',
        body = null,
        is_deleted = true,
        author_name = null,
        author_avatar_url = null
    where author_id = v_uid;

  update public.group_posts
    set body = '[deleted]',
        user_name = null
    where user_id = v_uid;

  update public.mitzvah_request_comments
    set body = '[deleted]',
        author_name = null,
        author_avatar_url = null
    where author_id = v_uid;

  update public.mitzvah_requests
    set requester_name = case when requester_id = v_uid then null else requester_name end,
        claimed_by_name = case when claimed_by_user_id = v_uid then null else claimed_by_name end,
        claimed_by_user_id = case when claimed_by_user_id = v_uid then null else claimed_by_user_id end,
        created_by_name = case when created_by_user_id = v_uid then null else created_by_name end,
        created_by_user_id = case when created_by_user_id = v_uid then null else created_by_user_id end,
        submitted_by_name = case when submitted_by = v_uid then null else submitted_by_name end,
        submitted_by = case when submitted_by = v_uid then null else submitted_by end
    where requester_id = v_uid or claimed_by_user_id = v_uid or created_by_user_id = v_uid or submitted_by = v_uid;

  update public.business_reviews
    set reviewer_id = null,
        reviewer_name = null
    where reviewer_id = v_uid;

  -- Legacy DM tables (sender_id/recipient_id/participant_ids stored as text)
  update public.messages
    set content = '[deleted]',
        sender_name = null,
        sender_avatar_url = null
    where sender_id = v_uid_text;

  update public.conversations c
    set participant_names = (
          select array_agg(case when pid = v_uid_text then 'Deleted User' else pname end)
          from unnest(c.participant_ids, c.participant_names) as t(pid, pname)
        ),
        participant_avatars = (
          select array_agg(case when pid = v_uid_text then null else pav end)
          from unnest(c.participant_ids, c.participant_avatars) as t(pid, pav)
        )
    where v_uid_text = any (c.participant_ids);

  -- ── Denormalized "who acted" attributions: null, keep the row (SET NULL) ─
  update public.notifications set actor_id = null, actor_display_name = null, actor_avatar_url = null where actor_id = v_uid;
  update public.communities set created_by = null where created_by = v_uid;
  update public.communities set created_by_user_id = null, created_by_name = null where created_by_user_id = v_uid;
  update public.communities set submitted_by = null, submitted_by_name = null where submitted_by = v_uid;
  update public.communities set claimed_org_id = null where claimed_org_id = v_uid;
  update public.community_events set created_by = null where created_by = v_uid;
  update public.community_resources set created_by = null where created_by = v_uid;
  update public.community_resources set uploaded_by_id = null where uploaded_by_id = v_uid;
  update public.community_groups set created_by_user_id = null where created_by_user_id = v_uid;
  update public.community_member_appeals set reviewed_by_user_id = null where reviewed_by_user_id = v_uid;
  update public.community_plan_subscriptions set purchaser_user_id = null where purchaser_user_id = v_uid;
  update public.business_listings set submitted_by = null, submitted_by_name = null where submitted_by = v_uid;
  update public.business_listings set reviewed_by = null where reviewed_by = v_uid;
  update public.business_listings set verified_owner_id = null where verified_owner_id = v_uid;
  update public.business_managers set approved_by = null where approved_by = v_uid;
  update public.business_claim_requests set reviewed_by = null where reviewed_by = v_uid;
  update public.claim_requests set reviewed_by = null where reviewed_by = v_uid;
  update public.local_update_items set approved_by = null where approved_by = v_uid;
  update public.local_update_items set rejected_by = null where rejected_by = v_uid;
  update public.meal_slots set claimed_by = null, claimed_by_name = null, claimed_at = null where claimed_by = v_uid;
  update public.refuah_requests set submitted_by = null where submitted_by = v_uid;
  update public.reports set resolved_by = null where resolved_by = v_uid;
  update public.reports set target_user_id = null, target_user_name = null where target_user_id = v_uid;
  update public.retention_events set user_id = null where user_id = v_uid;
  update public.transactions set user_id = null where user_id = v_uid;
  update public.chesed_hours_logs set verifier_id = null, verifier_name = null, verifier_email = null, verifier_phone = null where verifier_id = v_uid;
  update public.verification_requests set verifier_id = null, verifier_name = null where verifier_id = v_uid;

  -- ── Purely personal data: delete outright (mirrors each FK's own CASCADE) ─
  delete from public.user_blocks where blocker_id = v_uid or blocked_id = v_uid;
  delete from public.friend_requests where requester_id = v_uid or recipient_id = v_uid;
  delete from public.friendships where user_id = v_uid or friend_id = v_uid;
  delete from public.community_memberships where user_id = v_uid;
  delete from public.community_event_rsvps where user_id = v_uid;
  delete from public.reactions where user_id = v_uid;
  delete from public.post_likes where user_id = v_uid;
  delete from public.poll_votes where user_id = v_uid;
  delete from public.bookmarks where user_id = v_uid;
  delete from public.notifications where user_id = v_uid;
  delete from public.push_subscriptions where user_id = v_uid;
  delete from public.feed_user_preferences where user_id = v_uid;
  delete from public.feed_engagement_events where user_id = v_uid;
  delete from public.message_requests where sender_id = v_uid or recipient_id = v_uid;
  delete from public.mitzvah_actions where user_id = v_uid;
  delete from public.mitzvah_logs where user_id = v_uid;
  delete from public.mitzvah_points where user_id = v_uid;
  delete from public.user_streaks where user_id = v_uid;
  delete from public.group_members where user_id = v_uid;
  delete from public.group_join_requests where user_id = v_uid;
  delete from public.community_last_visits where user_id = v_uid;
  delete from public.subscriptions where user_id = v_uid;
  delete from public.business_managers where user_id = v_uid;
  delete from public.business_claim_requests where requester_id = v_uid;
  delete from public.claim_requests where requester_id = v_uid;
  delete from public.community_member_appeals where appellant_user_id = v_uid;
  delete from public.community_listings where seller_id = v_uid;
  delete from public.community_orders where buyer_id = v_uid;
  delete from public.meal_train_requests where created_by = v_uid;
  delete from public.yahrzeits where user_id = v_uid;
  delete from public.chesed_hours_logs where volunteer_id = v_uid or user_id = v_uid;
  delete from public.verification_requests where volunteer_id = v_uid;
  delete from public.mitzvah_offers where volunteer_id = v_uid or helper_user_id = v_uid or user_id = v_uid;
  delete from public.mitzvah_completions where volunteer_id = v_uid or requester_id = v_uid;

  -- ── Raw PII sidecar row ─────────────────────────────────────────────────
  delete from public.account_private where id = v_uid;

  -- ── Anonymize the profile itself last, so every join above still resolved
  --    to the real name/avatar while this function was redacting content ──
  update public.profiles
    set display_name = 'Deleted User',
        email = null,
        username = null,
        avatar_url = null,
        cover_url = null,
        bio = null,
        city = null,
        neighborhood = null,
        public_community = null,
        age_range = null,
        interests = null,
        notification_settings = null,
        message_settings = null,
        app_settings = null,
        community_settings = null,
        notification_preferences = '{}'::jsonb,
        notifications_enabled = false,
        shul_preference = null,
        school_preference = null,
        personalization_profile = '{}'::jsonb,
        stripe_customer_id = null,
        is_verified = false,
        verified_type = null,
        deleted_at = now()
    where id = v_uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
