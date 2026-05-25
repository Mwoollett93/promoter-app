-- Sprint 2: Third-party integration tokens (workspace-scoped)

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null check (provider in ('google', 'spotify', 'mailchimp', 'stripe')),
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  account_label text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider)
);

create index if not exists integration_connections_workspace_idx
  on public.integration_connections(workspace_id);

drop trigger if exists integration_connections_set_updated_at on public.integration_connections;
create trigger integration_connections_set_updated_at
before update on public.integration_connections
for each row execute function public.set_updated_at();

alter table public.integration_connections enable row level security;

drop policy if exists integration_connections_select on public.integration_connections;
create policy integration_connections_select on public.integration_connections
for select using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = integration_connections.workspace_id
      and wm.user_id = auth.uid()
      and wm.role = 'admin'::public.workspace_role
  )
);

-- Writes via service role from OAuth callback routes.
