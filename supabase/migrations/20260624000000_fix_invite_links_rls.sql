-- Fix overly-broad invite_links UPDATE policy (security hardening)
-- Replaces the single "using (true)" policy with two scoped ones.

drop policy if exists "Authenticated users update invite links" on invite_links;

-- 1. Community admins/owners/moderators (and the link creator) can fully update
create policy "Owners update invite links"
  on invite_links for update
  to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from community_memberships
      where community_id = invite_links.community_id
        and user_id = auth.uid()
        and role in ('admin', 'moderator', 'owner')
        and status = 'active'
    )
  )
  with check (
    created_by = auth.uid()
    or exists (
      select 1 from community_memberships
      where community_id = invite_links.community_id
        and user_id = auth.uid()
        and role in ('admin', 'moderator', 'owner')
        and status = 'active'
    )
  );

-- 2. Any authenticated user can increment uses_count only (join flow)
--    The with check ensures no other column changes.
create policy "Members increment invite link uses_count"
  on invite_links for update
  to authenticated
  using (status = 'active')
  with check (
    community_id = community_id
    and created_by = created_by
    and code       = code
    and max_uses   = max_uses
    and status     = status
    and expires_at = expires_at
  );
