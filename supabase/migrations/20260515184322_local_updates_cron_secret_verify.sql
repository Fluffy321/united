-- Verify the local updates Cron secret inside Postgres, where Vault is
-- available. The Edge Function calls this with a server-side Supabase key.

create or replace function public.verify_local_updates_cron_secret(p_secret text)
returns boolean
language sql
security definer
set search_path = public, vault
as $$
  select exists (
    select 1
    from vault.decrypted_secrets
    where name = 'local_updates_cron_secret'
      and decrypted_secret = p_secret
      and p_secret is not null
      and length(p_secret) >= 24
  );
$$;

revoke all on function public.verify_local_updates_cron_secret(text) from public;
grant execute on function public.verify_local_updates_cron_secret(text) to service_role;

comment on function public.verify_local_updates_cron_secret(text)
  is 'Server-only helper used by ingest-local-updates to verify the Cron Vault secret without exposing it.';
