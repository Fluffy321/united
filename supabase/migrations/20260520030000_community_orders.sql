-- community_orders: tracks purchase intent / future Stripe Connect transactions
-- Payment processing is intentionally stubbed until stripe-connect-payout-foundation ships.

create table if not exists public.community_orders (
  id                              uuid primary key default gen_random_uuid(),
  community_id                    uuid not null references public.communities(id) on delete cascade,
  listing_id                      uuid not null references public.community_listings(id) on delete cascade,
  buyer_id                        uuid not null references public.profiles(id) on delete cascade,
  buyer_name                      text,
  amount_cents                    integer not null check (amount_cents >= 0),
  currency                        text not null default 'USD',
  status                          text not null default 'pending'
                                    check (status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  stripe_checkout_session_id      text,
  stripe_payment_intent_id        text,
  destination_connected_account_id text,
  application_fee_amount          integer check (application_fee_amount is null or application_fee_amount >= 0),
  notes                           text,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

create index if not exists community_orders_community_idx
  on public.community_orders (community_id, created_at desc);
create index if not exists community_orders_listing_idx
  on public.community_orders (listing_id, created_at desc);
create index if not exists community_orders_buyer_idx
  on public.community_orders (buyer_id, created_at desc);
create index if not exists community_orders_status_idx
  on public.community_orders (community_id, status);

-- updated_at trigger
create or replace function public.set_community_orders_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists trg_community_orders_updated_at on public.community_orders;
create trigger trg_community_orders_updated_at
  before update on public.community_orders
  for each row execute function public.set_community_orders_updated_at();

alter table public.community_orders enable row level security;

-- Community managers can see all orders for their community
drop policy if exists "Managers can read community orders" on public.community_orders;
create policy "Managers can read community orders"
  on public.community_orders for select
  using (can_manage_community(community_id));

-- Buyers can see their own orders
drop policy if exists "Buyers can read own orders" on public.community_orders;
create policy "Buyers can read own orders"
  on public.community_orders for select
  using (buyer_id = auth.uid());

-- Only managers can update orders (e.g. mark paid/refunded manually)
drop policy if exists "Managers can update community orders" on public.community_orders;
create policy "Managers can update community orders"
  on public.community_orders for update
  using (can_manage_community(community_id));

-- No direct INSERT from clients — only via future Stripe Connect RPC
-- No DELETE policy — orders are permanent records

comment on table public.community_orders is 'Community store order records. Direct INSERT is blocked; rows will be created by the stripe-connect checkout RPC once stripe-connect-payout-foundation ships.';
