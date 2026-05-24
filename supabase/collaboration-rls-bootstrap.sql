-- Run this if you already applied collaboration.sql and see empty Team / read-only role.
-- Fixes bootstrap: workspace creators can read their workspace and insert the first admin member.

drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces for select
  using (
    id in (select public.user_workspace_ids())
    or created_by = auth.uid()
  );

drop policy if exists workspace_members_insert on public.workspace_members;
create policy workspace_members_insert on public.workspace_members for insert
  with check (
    public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[])
    or (
      user_id = auth.uid()
      and exists (
        select 1 from public.workspaces w
        where w.id = workspace_id and w.created_by = auth.uid()
      )
    )
  );

-- Backfill: add yourself as admin on workspaces you created but have no membership row.
insert into public.workspace_members (
  workspace_id,
  user_id,
  role,
  status,
  display_name,
  joined_at
)
select
  w.id,
  w.created_by,
  'admin'::public.workspace_role,
  'active'::public.member_status,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  now()
from public.workspaces w
join auth.users u on u.id = w.created_by
where not exists (
  select 1 from public.workspace_members wm
  where wm.workspace_id = w.id and wm.user_id = w.created_by and wm.status = 'active'
);
