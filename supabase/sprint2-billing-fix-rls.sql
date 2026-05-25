-- Re-run if sprint2-billing.sql failed on workspace_role 'owner' (use admin only).
-- Safe to run after table already exists.

drop policy if exists workspace_billing_select on public.workspace_billing;

create policy workspace_billing_select on public.workspace_billing
for select using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = workspace_billing.workspace_id
      and wm.user_id = auth.uid()
      and wm.role = 'admin'::public.workspace_role
  )
);
