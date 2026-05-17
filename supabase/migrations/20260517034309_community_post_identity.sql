-- Community post identity
-- (1) Update publish_local_update_item to denormalize community name + logo
--     into author_name / author_avatar_url at publish time so feed cards
--     show the community as the post author without a JOIN.
-- (2) Backfill any already-published local_update posts that are missing
--     author_name.

create or replace function public.publish_local_update_item(
  p_item_id uuid,
  p_title text default null,
  p_short_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item        public.local_update_items;
  v_comm_name   text;
  v_comm_logo   text;
  v_post_id     uuid;
  v_title       text;
  v_summary     text;
  v_content     text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select *
    into v_item
  from public.local_update_items
  where id = p_item_id
  for update;

  if not found then
    raise exception 'Local update item not found' using errcode = 'P0002';
  end if;

  if not public.can_manage_community(v_item.community_id) then
    raise exception 'Not allowed to publish this local update item' using errcode = '42501';
  end if;

  if v_item.status <> 'pending' then
    raise exception 'Only pending local update items can be published' using errcode = '23514';
  end if;

  -- Denormalize community identity for the post card
  select name, logo_url
    into v_comm_name, v_comm_logo
  from public.communities
  where id = v_item.community_id;

  v_title   := coalesce(nullif(trim(p_title), ''), v_item.title);
  v_summary := coalesce(nullif(trim(p_short_description), ''), v_item.short_description, '');
  v_content := trim(concat_ws(E'\n\n',
    v_summary,
    'Source: ' || v_item.source_name,
    'Read source: ' || v_item.source_url
  ));

  insert into public.posts (
    user_id,
    author_user_id,
    community_id,
    title,
    body,
    content,
    type,
    post_type,
    post_kind,
    is_official,
    author_name,
    author_avatar_url
  )
  values (
    auth.uid(),
    auth.uid(),
    v_item.community_id,
    v_title,
    v_content,
    v_content,
    'announcement',
    'announcement',
    'local_update',
    true,
    v_comm_name,
    v_comm_logo
  )
  returning id into v_post_id;

  update public.local_update_items
  set title              = v_title,
      short_description  = nullif(v_summary, ''),
      status             = 'published',
      approved_by        = auth.uid(),
      approved_at        = now(),
      published_post_id  = v_post_id
  where id = p_item_id;

  return v_post_id;
end;
$$;

-- Backfill existing published local_update posts that are missing author_name
update public.posts p
set
  author_name       = c.name,
  author_avatar_url = c.logo_url
from public.communities c
where p.community_id = c.id
  and p.post_kind    = 'local_update'
  and p.author_name  is null;
