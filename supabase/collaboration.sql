-- PromoSync collaboration schema: workspaces, events, tasks, activity, comments, notifications.
-- Run after artist-management.sql in Supabase SQL editor.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.workspace_role as enum (
    'admin', 'promoter', 'marketing', 'finance', 'guest_list', 'read_only'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.member_status as enum ('invited', 'active');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.event_status as enum ('draft', 'active', 'canceled', 'completed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.task_column as enum (
    'backlog', 'todo', 'in_progress', 'waiting', 'complete'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.comment_target as enum ('event', 'artist', 'venue', 'task');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.activity_entity as enum (
    'event', 'artist', 'venue', 'task', 'finance', 'lineup', 'comment'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_type as enum (
    'task_assigned', 'mention', 'artist_updated', 'forecast_negative',
    'venue_contract_uploaded', 'event_deadline', 'venue_changed', 'lineup_incomplete'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Workspaces
-- ---------------------------------------------------------------------------

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text,
  role public.workspace_role not null default 'promoter',
  status public.member_status not null default 'invited',
  display_name text,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id),
  unique (workspace_id, invited_email)
);

create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role public.workspace_role not null default 'promoter',
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status public.event_status not null default 'draft',
  venue_id uuid,
  venue_name text not null default 'Venue TBD',
  description text,
  date_key text,
  start_time text,
  starts_at timestamptz,
  artist_count integer not null default 0,
  slot_count integer not null default 0,
  b2b_count integer not null default 0,
  ticket_inventory integer not null default 0,
  expected_revenue numeric(12,2) not null default 0,
  total_costs numeric(12,2) not null default 0,
  projected_profit numeric(12,2) not null default 0,
  schedule_json jsonb not null default '[]'::jsonb,
  finance_json jsonb not null default '{}'::jsonb,
  planning_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_workspace_id_idx on public.events(workspace_id);
create index if not exists events_starts_at_idx on public.events(starts_at);

create table if not exists public.event_member_overrides (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  can_edit_finance boolean,
  can_edit_lineup boolean,
  can_upload_docs boolean,
  comment_only boolean not null default false,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Collaboration: activity, comments, tasks, notifications
-- ---------------------------------------------------------------------------

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  entity_type public.activity_entity not null,
  entity_id text,
  actor_id uuid not null references auth.users(id) on delete cascade,
  verb text not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_workspace_created_idx
  on public.activity_log(workspace_id, created_at desc);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  target_type public.comment_target not null,
  target_id text not null,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null,
  mention_user_ids uuid[] not null default '{}',
  author_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  artist_id uuid,
  venue_id uuid,
  booking_id uuid,
  board_column public.task_column not null default 'backlog',
  position integer not null default 0,
  title text not null,
  description text,
  assignee_id uuid references auth.users(id) on delete set null,
  due_at timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  labels text[] not null default '{}',
  checklist jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_workspace_column_idx on public.tasks(workspace_id, board_column, position);

create table if not exists public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size integer not null default 0,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  link_path text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications(user_id, created_at desc) where read_at is null;

create table if not exists public.notification_settings (
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  event_reminders boolean not null default true,
  lineup_changes boolean not null default true,
  financial_alerts boolean not null default true,
  weekly_digest boolean not null default false,
  marketing_emails boolean not null default false,
  email_enabled boolean not null default true,
  primary key (user_id, workspace_id)
);

create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  trigger_key text not null,
  conditions jsonb not null default '{}'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.task_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  tasks_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.event_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  template_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- workspace_id on artists (optional migration)
alter table public.artists add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
create index if not exists artists_workspace_id_idx on public.artists(workspace_id);

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------

create or replace function public.user_workspace_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id
  from public.workspace_members
  where user_id = auth.uid() and status = 'active';
$$;

create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.has_workspace_role(p_workspace_id uuid, p_roles public.workspace_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id
      and user_id = auth.uid()
      and status = 'active'
      and role = any(p_roles)
  );
$$;

create or replace function public.can_access_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id
      and public.is_workspace_member(e.workspace_id)
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invites enable row level security;
alter table public.events enable row level security;
alter table public.event_member_overrides enable row level security;
alter table public.activity_log enable row level security;
alter table public.comments enable row level security;
alter table public.tasks enable row level security;
alter table public.task_attachments enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_settings enable row level security;
alter table public.automation_rules enable row level security;
alter table public.task_templates enable row level security;
alter table public.event_templates enable row level security;

-- workspaces
drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces for select
  using (id in (select public.user_workspace_ids()));

drop policy if exists workspaces_insert on public.workspaces;
create policy workspaces_insert on public.workspaces for insert
  with check (created_by = auth.uid());

drop policy if exists workspaces_update on public.workspaces;
create policy workspaces_update on public.workspaces for update
  using (public.has_workspace_role(id, array['admin']::public.workspace_role[]));

-- workspace_members
drop policy if exists workspace_members_select on public.workspace_members;
create policy workspace_members_select on public.workspace_members for select
  using (workspace_id in (select public.user_workspace_ids()));

drop policy if exists workspace_members_insert on public.workspace_members;
create policy workspace_members_insert on public.workspace_members for insert
  with check (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));

drop policy if exists workspace_members_update on public.workspace_members;
create policy workspace_members_update on public.workspace_members for update
  using (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));

drop policy if exists workspace_members_delete on public.workspace_members;
create policy workspace_members_delete on public.workspace_members for delete
  using (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));

-- workspace_invites
drop policy if exists workspace_invites_select on public.workspace_invites;
create policy workspace_invites_select on public.workspace_invites for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists workspace_invites_insert on public.workspace_invites;
create policy workspace_invites_insert on public.workspace_invites for insert
  with check (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));

-- events
drop policy if exists events_select on public.events;
create policy events_select on public.events for select
  using (workspace_id in (select public.user_workspace_ids()));

drop policy if exists events_insert on public.events;
create policy events_insert on public.events for insert
  with check (
    workspace_id in (select public.user_workspace_ids())
    and created_by = auth.uid()
  );

drop policy if exists events_update on public.events;
create policy events_update on public.events for update
  using (workspace_id in (select public.user_workspace_ids()));

drop policy if exists events_delete on public.events;
create policy events_delete on public.events for delete
  using (public.has_workspace_role(workspace_id, array['admin', 'promoter']::public.workspace_role[]));

-- event_member_overrides
drop policy if exists event_overrides_all on public.event_member_overrides;
create policy event_overrides_all on public.event_member_overrides for all
  using (public.can_access_event(event_id))
  with check (public.can_access_event(event_id));

-- activity_log
drop policy if exists activity_log_select on public.activity_log;
create policy activity_log_select on public.activity_log for select
  using (workspace_id in (select public.user_workspace_ids()));

drop policy if exists activity_log_insert on public.activity_log;
create policy activity_log_insert on public.activity_log for insert
  with check (
    workspace_id in (select public.user_workspace_ids())
    and actor_id = auth.uid()
  );

-- comments
drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments for select
  using (workspace_id in (select public.user_workspace_ids()));

drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments for insert
  with check (
    workspace_id in (select public.user_workspace_ids())
    and author_id = auth.uid()
  );

drop policy if exists comments_update on public.comments;
create policy comments_update on public.comments for update
  using (author_id = auth.uid());

-- tasks
drop policy if exists tasks_all on public.tasks;
create policy tasks_all on public.tasks for all
  using (workspace_id in (select public.user_workspace_ids()))
  with check (workspace_id in (select public.user_workspace_ids()));

-- task_attachments
drop policy if exists task_attachments_all on public.task_attachments;
create policy task_attachments_all on public.task_attachments for all
  using (workspace_id in (select public.user_workspace_ids()))
  with check (workspace_id in (select public.user_workspace_ids()));

-- notifications
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select
  using (user_id = auth.uid());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update
  using (user_id = auth.uid());

drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications for insert
  with check (workspace_id in (select public.user_workspace_ids()));

-- notification_settings
drop policy if exists notification_settings_all on public.notification_settings;
create policy notification_settings_all on public.notification_settings for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- templates & automations (workspace members)
drop policy if exists automation_rules_all on public.automation_rules;
create policy automation_rules_all on public.automation_rules for all
  using (workspace_id in (select public.user_workspace_ids()))
  with check (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));

drop policy if exists task_templates_select on public.task_templates;
create policy task_templates_select on public.task_templates for select
  using (workspace_id in (select public.user_workspace_ids()));

drop policy if exists event_templates_select on public.event_templates;
create policy event_templates_select on public.event_templates for select
  using (workspace_id in (select public.user_workspace_ids()));

-- Artists: allow workspace members to read/write workspace artists
drop policy if exists artists_workspace_select on public.artists;
create policy artists_workspace_select on public.artists for select
  using (
    owner_id = auth.uid()
    or (workspace_id is not null and public.is_workspace_member(workspace_id))
  );

drop policy if exists artists_workspace_insert on public.artists;
create policy artists_workspace_insert on public.artists for insert
  with check (owner_id = auth.uid());

drop policy if exists artists_workspace_update on public.artists;
create policy artists_workspace_update on public.artists for update
  using (
    owner_id = auth.uid()
    or (workspace_id is not null and public.is_workspace_member(workspace_id))
  );

-- move_task RPC
create or replace function public.move_task(
  p_task_id uuid,
  p_column public.task_column,
  p_position integer
)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.tasks;
begin
  select * into v_task from public.tasks where id = p_task_id;
  if v_task.id is null then
    raise exception 'Task not found';
  end if;
  if not public.is_workspace_member(v_task.workspace_id) then
    raise exception 'Not allowed';
  end if;

  update public.tasks
  set board_column = p_column, position = p_position, updated_at = now()
  where id = p_task_id
  returning * into v_task;

  return v_task;
end;
$$;

grant execute on function public.move_task(uuid, public.task_column, integer) to authenticated;
