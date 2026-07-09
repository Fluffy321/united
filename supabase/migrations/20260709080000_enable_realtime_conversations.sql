-- Enable Supabase Realtime for the conversations table.
--
-- DM read receipts (master-plan item 11) work off unread_count: the
-- recipient's markAsRead zeroes their counter, and the sender's ChatView
-- subscribes to the conversation row UPDATE to flip its last message to
-- "Seen". Same idempotent pattern as 20260709073000 (chat tables).

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
end $$;
