-- Schedule the streak-at-risk Edge Function in the evening.
-- 23:30 UTC is evening in the US Eastern production market.

create extension if not exists pg_cron with schema extensions;
grant usage on schema cron to postgres;

select cron.schedule(
  'streak-at-risk',
  '30 23 * * *',
  $$
  select
    net.http_post(
      url     := (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_URL') || '/functions/v1/streak-at-risk',
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
  select 1 from cron.job where jobname = 'streak-at-risk'
);
