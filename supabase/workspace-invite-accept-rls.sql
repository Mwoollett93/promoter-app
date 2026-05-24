-- Run in Supabase SQL editor so invited users can accept team invites on sign-in.
-- Without these policies, invite rows are invisible to the invitee and accept never runs.

drop policy if exists workspace_members_select_invited on public.workspace_members;
create policy workspace_members_select_invited on public.workspace_members for select
  using (
    status = 'invited'
    and user_id is null
    and lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists workspace_members_accept_invite on public.workspace_members;
create policy workspace_members_accept_invite on public.workspace_members for update
  using (
    status = 'invited'
    and user_id is null
    and lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (
    user_id = auth.uid()
    and status = 'active'
  );

drop policy if exists workspace_invites_select_invitee on public.workspace_invites;
create policy workspace_invites_select_invitee on public.workspace_invites for select
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists workspace_invites_accept on public.workspace_invites;
create policy workspace_invites_accept on public.workspace_invites for update
  using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and accepted_at is null
  )
  with check (accepted_at is not null);
