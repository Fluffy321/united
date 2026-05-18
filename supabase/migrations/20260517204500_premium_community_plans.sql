-- Premium Community Plans
--
-- Community-scoped Stripe Billing subscriptions. This is intentionally
-- separate from the user-level supporter subscriptions table.

alter table public.communities
  add column if not exists plan_key text not null default 'free',
  add column if not exists plan_status text not null default 'free',
  add column if not exists plan_current_period_end timestamptz;

alter table public.communities
  drop constraint if exists communities_plan_key_check,
  add constraint communities_plan_key_check
    check (plan_key in ('free', 'community_premium'));

alter table public.communities
  drop constraint if exists communities_plan_status_check,
  add constraint communities_plan_status_check
    check (plan_status in ('free', 'active', 'trialing', 'past_due', 'canceled', 'incomplete'));

create or replace function public.can_manage_community_billing(p_community_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    case when auth.uid() is null then false else public.is_admin() end
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
        and lower(coalesce(cm.status, '')) = 'active'
        and lower(coalesce(cm.role, '')) in ('owner', 'admin')
    ),
    false
  )
$$;

revoke all on function public.can_manage_community_billing(uuid) from public;
grant execute on function public.can_manage_community_billing(uuid) to authenticated;

create table if not exists public.community_plan_subscriptions (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  purchaser_user_id uuid references public.profiles(id) on delete set null,
  stripe_customer_id text not null,
  stripe_subscription_id text unique not null,
  stripe_price_id text,
  plan_key text not null default 'community_premium'
    check (plan_key in ('community_premium')),
  billing_interval text not null
    check (billing_interval in ('monthly', 'annual')),
  status text not null default 'active'
    check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  stripe_status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_plan_subscriptions enable row level security;

create or replace function public.set_community_plan_subscription_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists community_plan_subscriptions_updated_at on public.community_plan_subscriptions;
create trigger community_plan_subscriptions_updated_at
  before update on public.community_plan_subscriptions
  for each row execute function public.set_community_plan_subscription_updated_at();

drop policy if exists "community_plan_subscriptions_managers_read" on public.community_plan_subscriptions;
create policy "community_plan_subscriptions_managers_read"
  on public.community_plan_subscriptions
  for select
  using (public.can_manage_community_billing(community_id));

drop policy if exists "community_plan_subscriptions_platform_admin_read" on public.community_plan_subscriptions;
create policy "community_plan_subscriptions_platform_admin_read"
  on public.community_plan_subscriptions
  for select
  using (public.is_admin());

-- No frontend insert/update/delete policies. Stripe Edge Functions write with
-- the service role after verifying community billing permissions.

create index if not exists community_plan_subscriptions_community_idx
  on public.community_plan_subscriptions (community_id, created_at desc);

create index if not exists community_plan_subscriptions_purchaser_idx
  on public.community_plan_subscriptions (purchaser_user_id, created_at desc);

create index if not exists community_plan_subscriptions_stripe_sub_idx
  on public.community_plan_subscriptions (stripe_subscription_id);

create index if not exists community_plan_subscriptions_status_idx
  on public.community_plan_subscriptions (status, community_id);

comment on table public.community_plan_subscriptions is
  'Stripe Billing subscriptions for Premium Community Plans. Separate from user supporter subscriptions.';
