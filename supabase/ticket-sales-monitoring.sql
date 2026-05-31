-- Ticket sales monitoring (manual checkpoints, CSV imports, future API/email).
-- Run in Supabase SQL editor when ready to persist sales data server-side.

create table if not exists public.sales_sources (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  provider text not null check (provider in ('ra', 'eventbrite', 'humanitix', 'other')),
  source_type text not null check (source_type in ('manual', 'csv', 'api', 'email')),
  status text not null default 'not_connected'
    check (status in ('active', 'connected', 'not_connected', 'placeholder')),
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sales_sources_event_id_idx on public.sales_sources (event_id);

create table if not exists public.sales_checkpoints (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  source_id uuid references public.sales_sources (id) on delete set null,
  provider text not null check (provider in ('ra', 'eventbrite', 'humanitix', 'other')),
  tickets_sold integer not null default 0 check (tickets_sold >= 0),
  capacity integer not null default 0 check (capacity >= 0),
  gross_revenue numeric(12, 2) not null default 0,
  net_revenue numeric(12, 2) not null default 0,
  fees numeric(12, 2) not null default 0,
  checked_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists sales_checkpoints_event_id_idx on public.sales_checkpoints (event_id);
create index if not exists sales_checkpoints_checked_at_idx on public.sales_checkpoints (checked_at);

create table if not exists public.ticket_sales_imports (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  source_id uuid references public.sales_sources (id) on delete set null,
  filename text not null,
  imported_at timestamptz not null default now(),
  raw_rows jsonb not null default '[]'::jsonb,
  mapped_fields jsonb not null default '{}'::jsonb,
  total_tickets integer not null default 0,
  gross_revenue numeric(12, 2) not null default 0,
  net_revenue numeric(12, 2) not null default 0,
  fees numeric(12, 2) not null default 0
);

create index if not exists ticket_sales_imports_event_id_idx on public.ticket_sales_imports (event_id);

create table if not exists public.ticket_tiers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  source_id uuid references public.sales_sources (id) on delete set null,
  name text not null,
  price numeric(12, 2) not null default 0,
  capacity integer not null default 0,
  sold integer not null default 0,
  revenue numeric(12, 2) not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists ticket_tiers_event_id_idx on public.ticket_tiers (event_id);

-- RLS: scope via event → workspace membership (mirror events table policies when enabling).
alter table public.sales_sources enable row level security;
alter table public.sales_checkpoints enable row level security;
alter table public.ticket_sales_imports enable row level security;
alter table public.ticket_tiers enable row level security;
