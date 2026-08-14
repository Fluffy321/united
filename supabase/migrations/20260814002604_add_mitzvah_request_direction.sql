alter table public.mitzvah_requests
  add column if not exists direction text not null default 'need';

alter table public.mitzvah_requests
  drop constraint if exists mitzvah_requests_direction_check;

alter table public.mitzvah_requests
  add constraint mitzvah_requests_direction_check
  check (direction in ('need', 'offer'));

comment on column public.mitzvah_requests.direction is
  'Public post direction. need asks the community for help; offer publicly offers help. Private responses remain in mitzvah_offers.';
