create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  plan public.app_plan not null default 'free',
  status public.subscription_status not null default 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_profile_id_unique unique (profile_id),
  constraint subscriptions_stripe_customer_id_unique unique (stripe_customer_id),
  constraint subscriptions_stripe_subscription_id_unique unique (stripe_subscription_id)
);

create index subscriptions_status_idx on public.subscriptions (status);
create index subscriptions_plan_idx on public.subscriptions (plan);

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();

create or replace function public.create_subscription_for_profile()
returns trigger
language plpgsql
as $$
begin
  insert into public.subscriptions (profile_id, plan, status)
  values (new.id, new.plan, 'inactive')
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

create trigger profiles_create_subscription
after insert on public.profiles
for each row
execute function public.create_subscription_for_profile();
