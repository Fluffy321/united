-- Harden direct messages so profile/message buttons can create chats and
-- message rows can carry sender avatars consistently.

alter table public.conversations
  add column if not exists request_title text;

alter table public.messages
  add column if not exists sender_avatar_url text;

create index if not exists conversations_updated_at_idx
  on public.conversations (updated_at desc);
