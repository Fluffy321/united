create extension if not exists pgcrypto;

create table if not exists invite_links (
  id              uuid        primary key default gen_random_uuid(),
  community_id    uuid        not null references communities(id) on delete cascade,
  inviter_id      uuid        not null references auth.users(id) on delete cascade,
  inviter_name    text,
  code            text        not null unique default encode(gen_random_bytes(8), 'hex'),
  is_active       boolean     not null default true,
  expires_at      timestamptz,
  max_uses        integer,
  uses_count      integer     not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists invite_links_code_idx             on invite_links(code);
create index if not exists invite_links_community_inviter_idx on invite_links(community_id, inviter_id);

alter table invite_links enable row level security;

-- Unauthenticated users can look up a code on the acceptance page
create policy "Public read invite links"
  on invite_links for select
  using (true);

-- Admins and moderators of the community can create invite links
create policy "Community admins create invite links"
  on invite_links for insert
  to authenticated
  with check (
    exists (
      select 1 from community_memberships
      where community_id = invite_links.community_id
        and user_id = auth.uid()
        and role in ('admin', 'moderator', 'owner')
        and status = 'active'
    )
  );

-- Only the community admin/moderator/owner who created the link can update it fully
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

-- Any authenticated user may increment uses_count only (for join flow)
create policy "Members increment invite link uses_count"
  on invite_links for update
  to authenticated
  using (status = 'active')
  with check (
    -- only uses_count may change; all other columns stay the same
    community_id    = community_id
    and created_by  = created_by
    and code        = code
    and max_uses    = max_uses
    and status      = status
    and expires_at  = expires_at
  );
