-- Reliable invite acceptance on sign-in (bypasses fragile client-side RLS patches).
-- Run in Supabase SQL editor after collaboration.sql + workspace-invite-accept-rls.sql.

create or replace function public.accept_my_workspace_invites()
returns table(workspace_id uuid, member_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  v_uid uuid := auth.uid();
begin
  if v_email = '' or v_uid is null then
    return;
  end if;

  return query
  with updated as (
    update public.workspace_members wm
    set
      user_id = v_uid,
      status = 'active'::public.member_status,
      joined_at = coalesce(wm.joined_at, now()),
      display_name = coalesce(
        nullif(trim(wm.display_name), ''),
        nullif(split_part(lower(trim(wm.invited_email)), '@', 1), ''),
        'Member'
      )
    where
      wm.status = 'invited'::public.member_status
      and wm.user_id is null
      and lower(trim(wm.invited_email)) = v_email
    returning wm.id, wm.workspace_id
  )
  select u.workspace_id, u.id from updated u;

  update public.workspace_invites wi
  set accepted_at = now()
  where
    wi.accepted_at is null
    and lower(trim(wi.email)) = v_email;
end;
$$;

revoke all on function public.accept_my_workspace_invites() from public;
grant execute on function public.accept_my_workspace_invites() to authenticated;
