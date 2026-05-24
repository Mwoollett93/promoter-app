-- Optional one-time fix: show names instead of emails for existing team members.
update public.workspace_members
set display_name = initcap(replace(split_part(lower(trim(invited_email)), '@', 1), '.', ' '))
where
  (display_name is null or trim(display_name) = '' or display_name like '%@%')
  and invited_email is not null
  and trim(invited_email) <> '';
