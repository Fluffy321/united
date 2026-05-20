-- Custom Community Titles & Key Contacts
-- Adds contact_title and contact_order to community_memberships.
-- A security-definer RPC restricts writes to community managers only,
-- keeping the existing UPDATE RLS policy (user = self) unchanged.

ALTER TABLE public.community_memberships
  ADD COLUMN IF NOT EXISTS contact_title  TEXT,
  ADD COLUMN IF NOT EXISTS contact_order  SMALLINT;

COMMENT ON COLUMN public.community_memberships.contact_title IS
  'Optional custom display title set by community managers (e.g. "Rabbi", "President").';
COMMENT ON COLUMN public.community_memberships.contact_order IS
  'Sort order for key contacts panel; lower values appear first.';

-- ── RPC: set_member_contact_title ─────────────────────────────────────────────
-- Lets community managers assign or clear a contact title for any active member.
-- Only updates contact_title and contact_order — cannot change role or status.

CREATE OR REPLACE FUNCTION public.set_member_contact_title(
  p_community_id UUID,
  p_user_id      UUID,
  p_title        TEXT,          -- NULL to clear the title
  p_order        SMALLINT DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_manage_community(p_community_id) THEN
    RAISE EXCEPTION 'Only community managers can set contact titles'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.community_memberships
  SET
    contact_title = p_title,
    contact_order = CASE WHEN p_title IS NULL THEN NULL ELSE COALESCE(p_order, 0) END,
    updated_at    = now()
  WHERE community_id = p_community_id
    AND user_id      = p_user_id
    AND status       = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active membership not found'
      USING ERRCODE = 'no_data_found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_member_contact_title(UUID, UUID, TEXT, SMALLINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_member_contact_title(UUID, UUID, TEXT, SMALLINT) TO authenticated;

COMMENT ON FUNCTION public.set_member_contact_title IS
  'Security-definer helper: lets community managers assign or clear a custom display title (contact_title, contact_order) for an active member. Enforces can_manage_community() — regular members cannot call this.';
