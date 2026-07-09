-- Schedule the event-reminders Edge Function every morning.
-- 13:30 UTC is 8:30-9:30am US Eastern — morning-of reminders for users
-- with a going/maybe/interested RSVP on an event dated today.
-- Same vault-secret pattern as streak-at-risk (20260708210000).

create extension if not exists pg_cron with schema extensions;
grant usage on schema cron to postgres;

select cron.schedule(
  'event-reminders',
  '30 13 * * *',
  $$
  select
    net.http_post(
      url     := (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_URL') || '/functions/v1/event-reminders',
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
  select 1 from cron.job where jobname = 'event-reminders'
);
