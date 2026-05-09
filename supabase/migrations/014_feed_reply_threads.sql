-- Migration 014: Persistent feed reply threads
-- Comments already store feed replies. This migration makes that intent explicit
-- and adds indexes used by the mini-chat reply sheet.

alter table public.comments
  add column if not exists thread_type text not null default 'feed_reply';

alter table public.comments
  add column if not exists client_context jsonb not null default '{}'::jsonb;

create index if not exists comments_post_created_idx
  on public.comments (post_id, created_at);

create index if not exists comments_reply_parent_idx
  on public.comments (reply_to_comment_id)
  where reply_to_comment_id is not null;

create index if not exists comments_thread_type_idx
  on public.comments (thread_type);
