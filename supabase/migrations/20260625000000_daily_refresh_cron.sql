-- Enable pg_cron extension (no-op if already enabled)
create extension if not exists pg_cron with schema extensions;
grant usage on schema cron to postgres;

-- ── 1. Schedule the daily-refresh Edge Function at 12:00 UTC = 8:00 AM ET ──
--    pg_cron calls the function via HTTP using the service-role key and
--    the CRON_SECRET header so the auth gate passes.

select cron.schedule(
  'daily-refresh',                              -- job name (unique)
  '0 12 * * *',                                 -- 12:00 UTC = 08:00 ET (DST aware)
  $$
  select
    net.http_post(
      url     := (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_URL') || '/functions/v1/daily-refresh',
      headers := jsonb_build_object(
        'Content-Type',    'application/json',
        'x-cron-secret',   (select decrypted_secret from vault.decrypted_secrets where name = 'CRON_SECRET'),
        'Authorization',   'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SERVICE_ROLE_KEY')
      ),
      body    := '{}'::jsonb
    )
  $$
);

-- ── 2. Also keep daily_content seeded 30 days ahead via pure SQL ────────────
--    This is a safety net in case the Edge Function call is skipped.

select cron.schedule(
  'seed-daily-content',
  '5 12 * * *',   -- 5 minutes after daily-refresh
  $$
  insert into public.daily_content (date, mitzvah_text, torah_text)
  select
    (current_date at time zone 'America/New_York') + offset_days::int,
    case (extract(doy from (current_date at time zone 'America/New_York') + offset_days::int)::int % 7)
      when 0 then 'Call or message someone who may appreciate being remembered today.'
      when 1 then 'Give tzedakah, even a small amount, before your next errand.'
      when 2 then 'Offer practical help to a neighbor, friend, or family member.'
      when 3 then 'Share a warm greeting with someone you usually pass quickly.'
      when 4 then 'Prepare one thing early that will make Shabbos calmer for someone else.'
      when 5 then 'Thank a teacher, volunteer, parent, or local helper for what they do.'
      else        'Choose one small act of chesed and do it quietly, without recognition.'
    end,
    case (extract(doy from (current_date at time zone 'America/New_York') + offset_days::int)::int % 7)
      when 0 then 'A day becomes holy when ordinary moments are used for kindness.'
      when 1 then 'Torah asks us to notice the person in front of us, not only the task ahead.'
      when 2 then 'Small mitzvahs done consistently can shape the whole atmosphere of a home.'
      when 3 then 'Peace in a community begins with patient words and generous assumptions.'
      when 4 then 'Preparing for Shabbos is also preparing space for gratitude.'
      when 5 then 'Jewish strength is often built through steady, unseen acts of care.'
      else        'Every person can add light to the place where they live.'
    end
  from generate_series(0, 30) as offset_days
  on conflict (date) do nothing;
  $$
);
