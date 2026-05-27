-- Optional: persist seasons in Supabase (app currently uses localStorage per workspace).
-- Link events via events.planning_json->>'seasonId' until a dedicated column is added.

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  start_date_key text not null,
  end_date_key text not null,
  description text,
  target_profit numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seasons_workspace_idx on public.seasons (workspace_id);
