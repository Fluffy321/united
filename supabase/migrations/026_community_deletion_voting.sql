-- Migration 026: Community deletion with multi-admin voting
-- Admins can initiate a deletion vote. All owner/admin members must approve
-- before the community is permanently deleted.

-- ─── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE public.community_deletion_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id  uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  initiated_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'cancelled')),
  total_admins  int  NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

CREATE INDEX ON public.community_deletion_requests(community_id, status);

CREATE TABLE public.community_deletion_votes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id     uuid NOT NULL REFERENCES public.community_deletion_requests(id) ON DELETE CASCADE,
  community_id   uuid NOT NULL,
  admin_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote           boolean NOT NULL,
  voted_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, admin_user_id)
);

CREATE INDEX ON public.community_deletion_votes(request_id);

-- ─── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.community_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_deletion_votes    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_deletion_requests" ON public.community_deletion_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_memberships
      WHERE community_id = community_deletion_requests.community_id
        AND user_id = auth.uid()
        AND status  = 'active'
        AND role    IN ('owner', 'admin')
    )
  );

CREATE POLICY "admins_read_deletion_votes" ON public.community_deletion_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_memberships
      WHERE community_id = community_deletion_votes.community_id
        AND user_id = auth.uid()
        AND status  = 'active'
        AND role    IN ('owner', 'admin')
    )
  );

-- ─── RPC: initiate_community_deletion ─────────────────────────────────────────
-- Creates a pending deletion request. If only 1 admin exists, deletes immediately.
-- Returns: { status, request_id?, total_admins, votes_in_favor }

CREATE OR REPLACE FUNCTION public.initiate_community_deletion(p_community_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id    uuid := auth.uid();
  v_request_id   uuid;
  v_total_admins int;
BEGIN
  -- Authorization
  IF NOT EXISTS (
    SELECT 1 FROM community_memberships
    WHERE community_id = p_community_id
      AND user_id      = v_caller_id
      AND status       = 'active'
      AND role         IN ('owner', 'admin')
  ) AND NOT EXISTS (
    SELECT 1 FROM communities
    WHERE id = p_community_id AND created_by_user_id = v_caller_id
  ) THEN
    RAISE EXCEPTION 'Not authorized to initiate deletion';
  END IF;

  -- Block duplicate pending requests
  IF EXISTS (
    SELECT 1 FROM community_deletion_requests
    WHERE community_id = p_community_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'A deletion vote is already in progress';
  END IF;

  -- Count voting-eligible admins (owner + admin in memberships)
  SELECT COUNT(*) INTO v_total_admins
  FROM community_memberships
  WHERE community_id = p_community_id
    AND status = 'active'
    AND role   IN ('owner', 'admin');

  -- Include creator if not already in memberships
  IF NOT EXISTS (
    SELECT 1 FROM community_memberships
    WHERE community_id = p_community_id
      AND user_id      = v_caller_id
      AND status       = 'active'
  ) THEN
    v_total_admins := v_total_admins + 1;
  END IF;

  -- Single admin: delete immediately (UI already confirmed intent via 2-step modal)
  IF v_total_admins <= 1 THEN
    DELETE FROM communities WHERE id = p_community_id;
    RETURN jsonb_build_object('status', 'deleted', 'total_admins', 1, 'votes_in_favor', 1);
  END IF;

  -- Multiple admins: create pending vote request
  INSERT INTO community_deletion_requests (community_id, initiated_by, total_admins)
  VALUES (p_community_id, v_caller_id, v_total_admins)
  RETURNING id INTO v_request_id;

  -- Record initiator's automatic yes vote
  INSERT INTO community_deletion_votes (request_id, community_id, admin_user_id, vote)
  VALUES (v_request_id, p_community_id, v_caller_id, true);

  RETURN jsonb_build_object(
    'status',         'pending',
    'request_id',     v_request_id,
    'total_admins',   v_total_admins,
    'votes_in_favor', 1
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.initiate_community_deletion(uuid) TO authenticated;

-- ─── RPC: vote_on_community_deletion ──────────────────────────────────────────
-- Records an admin's yes/no vote. Any no vote cancels the request.
-- If all admins vote yes, the community is deleted.
-- Returns: { status, votes_in_favor, total_admins }

CREATE OR REPLACE FUNCTION public.vote_on_community_deletion(
  p_request_id uuid,
  p_vote       boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id    uuid := auth.uid();
  v_community_id uuid;
  v_total_admins int;
  v_status       text;
  v_yes_votes    int;
BEGIN
  SELECT community_id, total_admins, status
  INTO   v_community_id, v_total_admins, v_status
  FROM   community_deletion_requests
  WHERE  id = p_request_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Deletion request not found'; END IF;
  IF v_status <> 'pending' THEN RAISE EXCEPTION 'Deletion request is no longer pending'; END IF;

  -- Authorization
  IF NOT EXISTS (
    SELECT 1 FROM community_memberships
    WHERE community_id = v_community_id
      AND user_id      = v_caller_id
      AND status       = 'active'
      AND role         IN ('owner', 'admin')
  ) AND NOT EXISTS (
    SELECT 1 FROM communities
    WHERE id = v_community_id AND created_by_user_id = v_caller_id
  ) THEN
    RAISE EXCEPTION 'Not authorized to vote on deletion';
  END IF;

  -- Upsert vote
  INSERT INTO community_deletion_votes (request_id, community_id, admin_user_id, vote)
  VALUES (p_request_id, v_community_id, v_caller_id, p_vote)
  ON CONFLICT (request_id, admin_user_id) DO UPDATE SET vote = p_vote, voted_at = now();

  -- Any no vote cancels the whole request
  IF NOT p_vote THEN
    UPDATE community_deletion_requests SET status = 'cancelled' WHERE id = p_request_id;
    RETURN jsonb_build_object('status', 'cancelled', 'votes_in_favor', 0, 'total_admins', v_total_admins);
  END IF;

  -- Count yes votes
  SELECT COUNT(*) INTO v_yes_votes
  FROM community_deletion_votes
  WHERE request_id = p_request_id AND vote = true;

  -- Unanimous yes → delete
  IF v_yes_votes >= v_total_admins THEN
    UPDATE community_deletion_requests SET status = 'approved' WHERE id = p_request_id;
    DELETE FROM communities WHERE id = v_community_id;
    RETURN jsonb_build_object('status', 'deleted', 'votes_in_favor', v_yes_votes, 'total_admins', v_total_admins);
  END IF;

  RETURN jsonb_build_object(
    'status',         'pending',
    'request_id',     p_request_id,
    'votes_in_favor', v_yes_votes,
    'total_admins',   v_total_admins
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.vote_on_community_deletion(uuid, boolean) TO authenticated;

-- ─── RPC: cancel_community_deletion ───────────────────────────────────────────
-- Any admin can cancel a pending deletion request outright.

CREATE OR REPLACE FUNCTION public.cancel_community_deletion(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id    uuid := auth.uid();
  v_community_id uuid;
BEGIN
  SELECT community_id INTO v_community_id
  FROM community_deletion_requests
  WHERE id = p_request_id AND status = 'pending';

  IF NOT FOUND THEN RAISE EXCEPTION 'No active deletion request found'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM community_memberships
    WHERE community_id = v_community_id
      AND user_id      = v_caller_id
      AND status       = 'active'
      AND role         IN ('owner', 'admin')
  ) AND NOT EXISTS (
    SELECT 1 FROM communities
    WHERE id = v_community_id AND created_by_user_id = v_caller_id
  ) THEN
    RAISE EXCEPTION 'Not authorized to cancel deletion';
  END IF;

  UPDATE community_deletion_requests SET status = 'cancelled' WHERE id = p_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_community_deletion(uuid) TO authenticated;
