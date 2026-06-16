-- community_last_visits: index community_id so admins can query
-- all visitors to a given community without a full table scan.
CREATE INDEX IF NOT EXISTS community_last_visits_community_id_idx
  ON public.community_last_visits (community_id);

-- post_likes: PK is (post_id, user_id), but feed queries look up
-- all posts liked by a specific user, which requires user_id first.
CREATE INDEX IF NOT EXISTS post_likes_user_id_idx
  ON public.post_likes (user_id);

-- rate_limit_ledger: rate-check queries filter on (user_id, action, window_start).
-- Without this index every rate check is a full table scan.
CREATE INDEX IF NOT EXISTS rate_limit_ledger_user_action_window_idx
  ON public.rate_limit_ledger (user_id, action, window_start);
