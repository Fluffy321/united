-- Add incognito and hide_membership columns that the join flow has always sent
-- but were never created in the original schema, causing HTTP 400 on all joins.
ALTER TABLE public.community_memberships
  ADD COLUMN IF NOT EXISTS incognito       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hide_membership boolean NOT NULL DEFAULT false;
