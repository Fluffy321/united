-- Recreate the trigger function that was never created in the live DB despite
-- being specified in migration 023. Also backfills all existing creator
-- memberships to admin and fixes the UPDATE RLS on communities.

-- 1. Trigger function: ensures every new community's creator gets role=admin
CREATE OR REPLACE FUNCTION public.ensure_community_creator_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.community_memberships (
    community_id, user_id, role, status, user_name, created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.created_by_user_id, 'admin', 'active', NEW.created_by_name, now(), now()
  )
  ON CONFLICT (community_id, user_id) DO UPDATE
  SET
    role = CASE
      WHEN lower(COALESCE(public.community_memberships.role, '')) IN ('owner', 'admin')
      THEN public.community_memberships.role
      ELSE 'admin'
    END,
    status = 'active',
    user_name = COALESCE(public.community_memberships.user_name, excluded.user_name),
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_community_creator_membership_trigger ON public.communities;
CREATE TRIGGER ensure_community_creator_membership_trigger
  AFTER INSERT ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_community_creator_membership();

REVOKE ALL ON FUNCTION public.ensure_community_creator_membership() FROM public;

-- 2. Backfill: promote all existing creator memberships that are still 'member'
INSERT INTO public.community_memberships (
  community_id, user_id, role, status, user_name, created_at, updated_at
)
SELECT c.id, c.created_by_user_id, 'admin', 'active', c.created_by_name, now(), now()
FROM public.communities c
WHERE c.created_by_user_id IS NOT NULL
ON CONFLICT (community_id, user_id) DO UPDATE
SET
  role = CASE
    WHEN lower(COALESCE(public.community_memberships.role, '')) IN ('owner', 'admin')
    THEN public.community_memberships.role
    ELSE 'admin'
  END,
  status = 'active',
  user_name = COALESCE(public.community_memberships.user_name, excluded.user_name),
  updated_at = now();

-- 3. Fix UPDATE RLS on communities.
--    Old policy used exact role='admin' match with no creator bypass.
--    "community creators can update communities" checked 'created_by' which
--    does not exist (correct column is created_by_user_id) — always blocked.
--    Replace both with one correct policy.
DROP POLICY IF EXISTS "Community admins can update their community" ON public.communities;
DROP POLICY IF EXISTS "community creators can update communities" ON public.communities;

CREATE POLICY "Community admins and creators can update their community"
  ON public.communities
  FOR UPDATE
  USING (
    created_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.community_memberships
      WHERE community_memberships.community_id = communities.id
        AND community_memberships.user_id = auth.uid()
        AND lower(community_memberships.role) IN ('owner', 'admin', 'moderator')
        AND community_memberships.status = 'active'
    )
  )
  WITH CHECK (
    created_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.community_memberships
      WHERE community_memberships.community_id = communities.id
        AND community_memberships.user_id = auth.uid()
        AND lower(community_memberships.role) IN ('owner', 'admin', 'moderator')
        AND community_memberships.status = 'active'
    )
  );
