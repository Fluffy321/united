alter table public.communities
  add column if not exists posting_mode text not null default 'open'
  constraint communities_posting_mode_check
    check (posting_mode in ('open', 'admin_only'));

drop policy if exists "Signed in users can create posts" on public.posts;
create policy "Signed in users can create posts"
  on public.posts for insert to authenticated
  with check (
    auth.uid()::text = user_id
    and (
      community_id is null
      or exists (
        select 1 from public.communities c
        where c.id = posts.community_id
          and (
            c.posting_mode = 'open'
            or c.created_by_user_id = auth.uid()
            or exists (
              select 1 from public.community_memberships cm
              where cm.community_id = c.id
                and cm.user_id = auth.uid()
                and cm.role in ('owner', 'admin', 'moderator')
            )
          )
      )
    )
  );
