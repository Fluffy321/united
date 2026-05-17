-- Aggregation columns
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS aggregate_key   text,
  ADD COLUMN IF NOT EXISTS aggregate_count int NOT NULL DEFAULT 1;

-- Partial index: only index unread aggregatable rows (the lookup is always scoped to is_read=false)
CREATE INDEX IF NOT EXISTS notifications_agg_lookup_idx
  ON notifications (user_id, aggregate_key)
  WHERE aggregate_key IS NOT NULL AND is_read = false;

-- RPC: atomic upsert that either merges into an existing unread notification or inserts fresh.
-- SECURITY DEFINER is required because the actor (auth.uid() = actor_id) cannot UPDATE
-- the recipient's row under the existing RLS policy (which requires auth.uid() = user_id).
-- The function validates the caller is the actor before performing any write.
CREATE OR REPLACE FUNCTION upsert_aggregated_notification(
  p_user_id            uuid,
  p_actor_id           uuid,
  p_actor_display_name text,
  p_actor_avatar_url   text,
  p_type               text,
  p_title              text,
  p_body               text,
  p_link_url           text,
  p_post_id            uuid,
  p_conversation_id    uuid,
  p_data               jsonb,
  p_aggregate_key      text
)
RETURNS notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing   notifications;
  v_new_count  int;
  v_others     int;
  v_others_str text;
  v_new_body   text;
  v_result     notifications;
BEGIN
  -- Caller must be the actor (system notifications with null actor_id are allowed through)
  IF p_actor_id IS NOT NULL AND auth.uid() IS DISTINCT FROM p_actor_id THEN
    RAISE EXCEPTION 'unauthorized: caller is not the notification actor';
  END IF;

  -- Self-notification guard (mirrors the JS-side guard)
  IF p_user_id = p_actor_id THEN
    RETURN NULL;
  END IF;

  -- Look for an existing unread notification with the same aggregate key
  SELECT * INTO v_existing
  FROM notifications
  WHERE user_id       = p_user_id
    AND aggregate_key = p_aggregate_key
    AND is_read       = false
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    v_new_count  := COALESCE(v_existing.aggregate_count, 1) + 1;
    v_others     := v_new_count - 1;
    v_others_str := v_others::text || CASE WHEN v_others = 1 THEN ' other' ELSE ' others' END;

    v_new_body := CASE p_type
      WHEN 'post_liked'         THEN p_actor_display_name || ' and ' || v_others_str || ' liked your post.'
      WHEN 'post_commented'     THEN p_actor_display_name || ' and ' || v_others_str || ' commented on your post.'
      WHEN 'comment_reply'      THEN p_actor_display_name || ' and ' || v_others_str || ' replied in your thread.'
      WHEN 'community_activity' THEN p_actor_display_name || ' and ' || v_others_str || ' posted in your community.'
      ELSE                           p_actor_display_name || ' and ' || v_others_str || ' had activity.'
    END;

    UPDATE notifications
    SET
      aggregate_count    = v_new_count,
      actor_display_name = p_actor_display_name,
      actor_avatar_url   = p_actor_avatar_url,
      body               = v_new_body,
      is_read            = false,
      updated_at         = now()
    WHERE id = v_existing.id
    RETURNING * INTO v_result;

    RETURN v_result;
  END IF;

  -- No existing row to aggregate into — insert fresh
  INSERT INTO notifications (
    user_id, actor_id, actor_display_name, actor_avatar_url,
    type, title, body, link_url, post_id, conversation_id, data,
    aggregate_key, aggregate_count, is_read
  ) VALUES (
    p_user_id, p_actor_id, p_actor_display_name, p_actor_avatar_url,
    p_type, p_title, p_body, p_link_url, p_post_id, p_conversation_id, p_data,
    p_aggregate_key, 1, false
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;
