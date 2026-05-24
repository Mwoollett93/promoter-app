-- Sprint 2: Stripe billing per workspace (run after collaboration.sql)

create table if not exists public.workspace_billing (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null default 'Starter' check (plan in ('Starter', 'Professional', 'Enterprise')),
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_billing_customer_idx on public.workspace_billing(stripe_customer_id);

drop trigger if exists workspace_billing_set_updated_at on public.workspace_billing;
create trigger workspace_billing_set_updated_at
before update on public.workspace_billing
for each row execute function public.set_updated_at();

alter table public.workspace_billing enable row level security;

drop policy if exists workspace_billing_select on public.workspace_billing;
create policy workspace_billing_select on public.workspace_billing
for select using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = workspace_billing.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'admin')
  )
);

-- Inserts/updates from app use service role (webhook + checkout API).
