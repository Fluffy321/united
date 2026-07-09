-- Enable Supabase Realtime (postgres_changes) for the chat tables.
--
-- ChatView (DMs) and GroupChatSection both subscribe via
-- supabase.channel().on('postgres_changes', ...), but no migration ever added
-- these tables to the supabase_realtime publication -- delivery silently
-- depended on a dashboard toggle. DMs have no polling fallback, and group
-- chat's poll was relaxed to a 30s self-heal on 2026-07-09, so make the
-- publication membership explicit and reproducible.
--
-- Idempotent: safe to run whether or not the tables were already added.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'community_group_chats'
  ) then
    alter publication supabase_realtime add table public.community_group_chats;
  end if;
end $$;
