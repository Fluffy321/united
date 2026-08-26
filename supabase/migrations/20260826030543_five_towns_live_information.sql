-- Five Towns live information
--
-- Adds the post metadata already consumed by the personalized Feed, registers
-- a conservative set of public/official Five Towns sources, and invokes the
-- hardened ingestion Edge Function every 30 minutes.

alter table public.posts
  add column if not exists post_subtype text,
  add column if not exists category text,
  add column if not exists urgency text;

-- Official-post triggers call can_manage_community(). The ingestion function
-- uses the server-only service role, which has no profile auth.uid(), so allow
-- that signed role while preserving the existing human manager rules.
create or replace function public.can_manage_community(p_community_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    auth.jwt() ->> 'role' = 'service_role'
    or case when auth.uid() is null then false else public.is_admin() end
    or exists (
      select 1
      from public.communities c
      where c.id = p_community_id
        and c.created_by_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.community_memberships cm
      where cm.community_id = p_community_id
        and cm.user_id = auth.uid()
        and lower(cm.status) = 'active'
        and lower(cm.role) in ('owner', 'admin', 'moderator')
    ),
    false
  )
$$;

revoke all on function public.can_manage_community(uuid) from public;
grant execute on function public.can_manage_community(uuid) to authenticated;

create index if not exists posts_verified_source_created_idx
  on public.posts (created_at desc)
  where verified is true and source_url is not null;

create unique index if not exists posts_local_update_origin_unique_idx
  on public.posts (migrated_from)
  where migrated_from like 'local-update:%';

with target_community as (
  select id
  from public.communities
  where lower(name) in ('five towns news & updates', 'five towns')
     or lower(name) like '%five towns%'
  order by
    case lower(name)
      when 'five towns news & updates' then 0
      when 'five towns' then 1
      else 2
    end,
    created_at desc
  limit 1
)
insert into public.local_update_sources (
  community_id,
  name,
  source_type,
  source_url,
  category,
  enabled,
  requires_review,
  auto_publish
)
select
  target_community.id,
  source.name,
  source.source_type,
  source.source_url,
  source.category,
  true,
  false,
  true
from target_community
cross join (
  values
    (
      'The 5T Brief',
      'rss',
      'https://5tbrief.com/feed.xml',
      'Local News'
    ),
    (
      'Village of Cedarhurst News',
      'rss',
      'https://www.cedarhurst.gov/feed/',
      'Village News'
    ),
    (
      'Village of Cedarhurst Events',
      'rss',
      'https://www.cedarhurst.gov/events/feed/',
      'Community Events'
    ),
    (
      'JCCRP Community Calendar',
      'rss',
      'https://calendar.jccrp.org/events/feed/',
      'Community Events'
    ),
    (
      'Town of Hempstead News Flash',
      'rss',
      'https://hempsteadny.gov/RSSFeed.aspx?ModID=1&CID=All-newsflash.xml',
      'Town Updates'
    ),
    (
      'Town of Hempstead Alert Center',
      'rss',
      'https://hempsteadny.gov/RSSFeed.aspx?ModID=63&CID=All-0',
      'Town Updates'
    ),
    (
      'National Weather Service - Nassau County Alerts',
      'api',
      'https://api.weather.gov/alerts/active?zone=NYC059',
      'Weather Alerts'
    ),
    (
      'Vaad Hakashrus News',
      'rss',
      'https://vaadhakashrus.org/feed/',
      'Kashrus Updates'
    )
) as source(name, source_type, source_url, category)
on conflict (community_id, source_url) do update
set name = excluded.name,
    source_type = excluded.source_type,
    category = excluded.category,
    enabled = true,
    requires_review = false,
    auto_publish = true,
    updated_at = now();

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
grant usage on schema cron to postgres;

select cron.unschedule(jobid)
from cron.job
where jobname = 'five-towns-live-information';

select cron.schedule(
  'five-towns-live-information',
  '*/30 * * * *',
  $schedule$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_URL')
      || '/functions/v1/ingest-local-updates',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'local_updates_cron_secret'),
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SERVICE_ROLE_KEY')
    ),
    body := '{}'::jsonb
  )
  $schedule$
);

comment on column public.posts.post_subtype is
  'Fine-grained Feed subtype, including local_update, local_event, and alert.';
comment on column public.posts.category is
  'Personalization category used by the Five Towns dashboard.';
comment on column public.posts.urgency is
  'Urgency marker; emergency is reserved for verified immediate/severe alerts.';
