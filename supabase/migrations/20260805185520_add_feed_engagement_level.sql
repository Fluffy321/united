alter table public.feed_user_preferences
  add column if not exists engagement_level text not null default 'balanced';

alter table public.feed_user_preferences
  drop constraint if exists feed_user_preferences_engagement_level_check;

alter table public.feed_user_preferences
  add constraint feed_user_preferences_engagement_level_check
  check (engagement_level in ('quiet', 'balanced', 'active', 'all_in'));
