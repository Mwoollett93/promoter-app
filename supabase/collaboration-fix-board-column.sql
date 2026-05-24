-- Run ONLY if you applied an older collaboration.sql that used reserved name "column".
-- Safe to skip on fresh installs (current collaboration.sql uses board_column).

do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'column'
  ) then
    alter table public.tasks rename column "column" to board_column;
  end if;
end $$;

drop index if exists public.tasks_workspace_column_idx;
create index if not exists tasks_workspace_column_idx
  on public.tasks(workspace_id, board_column, position);
