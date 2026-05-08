create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_ids text[] not null default '{}',
  participant_names text[] not null default '{}',
  participant_ages text[] not null default '{}',
  participant_avatars text[] not null default '{}',
  last_message text default '',
  last_message_at timestamptz,
  unread_count jsonb not null default '{}'::jsonb,
  request_type text,
  request_id text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id text not null,
  sender_name text,
  sender_age_range text,
  recipient_id text,
  content text not null default '',
  attachment jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_participant_ids_idx
  on public.conversations using gin (participant_ids);

create index if not exists messages_conversation_id_created_at_idx
  on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'conversations'
    and policyname = 'Users can read their conversations'
  ) then
    create policy "Users can read their conversations"
      on public.conversations
      for select
      using (auth.uid()::text = any(participant_ids));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'conversations'
    and policyname = 'Users can create their conversations'
  ) then
    create policy "Users can create their conversations"
      on public.conversations
      for insert
      with check (auth.uid()::text = any(participant_ids));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'conversations'
    and policyname = 'Users can update their conversations'
  ) then
    create policy "Users can update their conversations"
      on public.conversations
      for update
      using (auth.uid()::text = any(participant_ids))
      with check (auth.uid()::text = any(participant_ids));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'messages'
    and policyname = 'Users can read conversation messages'
  ) then
    create policy "Users can read conversation messages"
      on public.messages
      for select
      using (
        exists (
          select 1
          from public.conversations
          where conversations.id = messages.conversation_id
          and auth.uid()::text = any(conversations.participant_ids)
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'messages'
    and policyname = 'Users can send conversation messages'
  ) then
    create policy "Users can send conversation messages"
      on public.messages
      for insert
      with check (
        auth.uid()::text = sender_id
        and exists (
          select 1
          from public.conversations
          where conversations.id = messages.conversation_id
          and auth.uid()::text = any(conversations.participant_ids)
        )
      );
  end if;
end $$;
