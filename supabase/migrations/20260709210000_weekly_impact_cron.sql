-- Schedule the weekly-impact Edge Function on Sunday evenings.
-- 23:00 UTC Sunday is 6-7pm US Eastern — a natural week-in-review moment.
-- Same vault-secret pattern as streak-at-risk and event-reminders.

create extension if not exists pg_cron with schema extensions;
grant usage on schema cron to postgres;

select cron.schedule(
  'weekly-impact',
  '0 23 * * 0',
  $$
  select
    net.http_post(
      url     := (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_URL') || '/functions/v1/weekly-impact',
      headers := jsonb_build_object(
        'Content-Type',    'application/json',
        'x-cron-secret',   (select decrypted_secret from vault.decrypted_secrets where name = 'CRON_SECRET'),
        'Authorization',   'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SERVICE_ROLE_KEY')
      ),
      body    := '{}'::jsonb
    )
  $$
)
where not exists (
  select 1 from cron.job where jobname = 'weekly-impact'
);
