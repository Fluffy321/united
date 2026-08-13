alter table public.feed_user_preferences
  add column if not exists interest_groups text[] not null default array[]::text[],
  add column if not exists category_preferences jsonb not null default '{}'::jsonb,
  add column if not exists catch_up_windows text[] not null default array[]::text[],
  add column if not exists preference_setup_version integer not null default 0,
  add column if not exists preference_setup_completed_at timestamptz;

alter table public.feed_user_preferences
  drop constraint if exists feed_user_preferences_catch_up_windows_check;

alter table public.feed_user_preferences
  add constraint feed_user_preferences_catch_up_windows_check
  check (catch_up_windows <@ array['morning','daytime','evening','important_only']::text[]);

alter table public.feed_user_preferences
  drop constraint if exists feed_user_preferences_setup_version_check;

alter table public.feed_user_preferences
  add constraint feed_user_preferences_setup_version_check
  check (preference_setup_version >= 0);
