-- 018_feed_reply_chains.sql
-- Atomic backend support for persistent feed reply chains.

alter table public.comments
  add column if not exists parent_comment_id uuid references public.comments(id) on delete cascade;

alter table public.comments
  add column if not exists reply_to_comment_id uuid references public.comments(id) on delete cascade;

alter table public.comments
  add column if not exists thread_type text not null default 'feed_reply';

alter table public.comments
  add column if not exists client_context jsonb not null default '{}'::jsonb;

create index if not exists comments_post_parent_created_idx
  on public.comments (post_id, parent_comment_id, created_at);

create index if not exists comments_reply_to_comment_id_idx
  on public.comments (reply_to_comment_id)
  where reply_to_comment_id is not null;

create or replace function public.create_feed_reply(
  p_post_id uuid,
  p_body text,
  p_parent_comment_id uuid default null,
  p_reply_to_comment_id uuid default null,
  p_author_name text default null,
  p_author_avatar_url text default null,
  p_client_context jsonb default '{}'::jsonb
)
returns public.comments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_parent_id uuid := coalesce(p_parent_comment_id, p_reply_to_comment_id);
  v_reply_to_id uuid := coalesce(p_reply_to_comment_id, p_parent_comment_id);
  v_comment public.comments;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if length(trim(coalesce(p_body, ''))) = 0 then
    raise exception 'Reply body is required';
  end if;

  if not exists (select 1 from public.posts where id = p_post_id) then
    raise exception 'Post not found';
  end if;

  if v_parent_id is not null and not exists (
    select 1 from public.comments
    where id = v_parent_id and post_id = p_post_id and is_deleted = false
  ) then
    raise exception 'Parent reply not found on this post';
  end if;

  if v_reply_to_id is not null and not exists (
    select 1 from public.comments
    where id = v_reply_to_id and post_id = p_post_id and is_deleted = false
  ) then
    raise exception 'Reply target not found on this post';
  end if;

  insert into public.comments (
    post_id,
    author_id,
    parent_comment_id,
    reply_to_comment_id,
    author_name,
    author_avatar_url,
    body,
    thread_type,
    client_context
  )
  values (
    p_post_id,
    v_user_id,
    v_parent_id,
    v_reply_to_id,
    nullif(trim(p_author_name), ''),
    p_author_avatar_url,
    trim(p_body),
    'feed_reply',
    coalesce(p_client_context, '{}'::jsonb)
  )
  returning * into v_comment;

  update public.posts
  set comments_count = coalesce(comments_count, 0) + 1,
      updated_at = now()
  where id = p_post_id;

  return v_comment;
end;
$$;

grant execute on function public.create_feed_reply(uuid, text, uuid, uuid, text, text, jsonb) to authenticated;
