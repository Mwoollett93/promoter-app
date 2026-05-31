-- Team member display names and profile photos visible to all workspace members.
-- Run in Supabase SQL editor after collaboration.sql.

alter table public.workspace_members
  add column if not exists avatar_url text;

-- Allow each member to update their own profile fields (display name, avatar).
drop policy if exists workspace_members_update_self on public.workspace_members;
create policy workspace_members_update_self on public.workspace_members for update
  using (
    user_id = auth.uid()
    and status = 'active'
  )
  with check (
    user_id = auth.uid()
    and status = 'active'
  );
