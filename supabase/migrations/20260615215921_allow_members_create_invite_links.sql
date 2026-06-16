-- Let any active community member create a shareable invite link for that
-- community. The link is the access grant for private communities; creating it
-- still requires membership, and the inviter_id must be the signed-in user.

drop policy if exists "Community admins create invite links" on public.invite_links;
drop policy if exists "Community members create invite links" on public.invite_links;

create policy "Community members create invite links"
  on public.invite_links
  for insert
  to authenticated
  with check (
    inviter_id = auth.uid()
    and exists (
      select 1
      from public.community_memberships cm
      where cm.community_id = invite_links.community_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
    )
  );
