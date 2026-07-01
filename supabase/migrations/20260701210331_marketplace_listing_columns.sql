-- Marketplace listing persistence (master plan item 1).
-- The /Marketplace page and the Feed composer's "Sell / Give" flow both
-- produce activity_kind='marketplace_listing' posts, but the posts table had
-- no commerce columns — price/marketplace_category/pickup_option/image_urls
-- were being silently dropped by the client's schema-retry loop.

alter table public.posts
  add column if not exists price text,
  add column if not exists marketplace_category text,
  add column if not exists condition text,
  add column if not exists pickup_option text,
  add column if not exists listing_urgency text,
  add column if not exists listing_section text,
  add column if not exists listing_status text not null default 'available',
  add column if not exists image_urls text[];

alter table public.posts drop constraint if exists posts_listing_status_check;
alter table public.posts add constraint posts_listing_status_check
  check (listing_status in ('available', 'pending', 'sold', 'closed'));

create index if not exists posts_marketplace_status_idx
  on public.posts (listing_status, created_at desc)
  where activity_kind = 'marketplace_listing';
