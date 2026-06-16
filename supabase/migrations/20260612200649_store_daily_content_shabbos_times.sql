alter table public.daily_content
  add column if not exists candle_lighting_at timestamptz,
  add column if not exists havdalah_at timestamptz;

with shabbos_times(date, candle_lighting_at, havdalah_at) as (
  values
  ('2026-06-12'::date, '2026-06-13T00:08:00.000Z'::timestamptz, '2026-06-14T01:17:00.000Z'::timestamptz),
  ('2026-06-13'::date, '2026-06-13T00:08:00.000Z'::timestamptz, '2026-06-14T01:17:00.000Z'::timestamptz),
  ('2026-06-14'::date, '2026-06-20T00:10:00.000Z'::timestamptz, '2026-06-21T01:20:00.000Z'::timestamptz),
  ('2026-06-15'::date, '2026-06-20T00:10:00.000Z'::timestamptz, '2026-06-21T01:20:00.000Z'::timestamptz),
  ('2026-06-16'::date, '2026-06-20T00:10:00.000Z'::timestamptz, '2026-06-21T01:20:00.000Z'::timestamptz),
  ('2026-06-17'::date, '2026-06-20T00:10:00.000Z'::timestamptz, '2026-06-21T01:20:00.000Z'::timestamptz),
  ('2026-06-18'::date, '2026-06-20T00:10:00.000Z'::timestamptz, '2026-06-21T01:20:00.000Z'::timestamptz),
  ('2026-06-19'::date, '2026-06-20T00:10:00.000Z'::timestamptz, '2026-06-21T01:20:00.000Z'::timestamptz),
  ('2026-06-20'::date, '2026-06-20T00:10:00.000Z'::timestamptz, '2026-06-21T01:20:00.000Z'::timestamptz),
  ('2026-06-21'::date, '2026-06-27T00:11:00.000Z'::timestamptz, '2026-06-28T01:20:00.000Z'::timestamptz),
  ('2026-06-22'::date, '2026-06-27T00:11:00.000Z'::timestamptz, '2026-06-28T01:20:00.000Z'::timestamptz),
  ('2026-06-23'::date, '2026-06-27T00:11:00.000Z'::timestamptz, '2026-06-28T01:20:00.000Z'::timestamptz),
  ('2026-06-24'::date, '2026-06-27T00:11:00.000Z'::timestamptz, '2026-06-28T01:20:00.000Z'::timestamptz),
  ('2026-06-25'::date, '2026-06-27T00:11:00.000Z'::timestamptz, '2026-06-28T01:20:00.000Z'::timestamptz)
)
update public.daily_content dc
set
  candle_lighting_at = st.candle_lighting_at,
  havdalah_at = st.havdalah_at
from shabbos_times st
where dc.date = st.date;
