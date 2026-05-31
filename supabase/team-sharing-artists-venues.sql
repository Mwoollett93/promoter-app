-- Team (workspace) sharing for artists and venues.
-- Run in Supabase SQL editor after collaboration.sql and artist-management.sql.
-- Backfill assigns existing rows to the creator's first active workspace membership.

-- ---------------------------------------------------------------------------
-- Venues: workspace scope + creator
-- ---------------------------------------------------------------------------

alter table public.venues
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists venues_workspace_id_idx on public.venues(workspace_id);

-- Backfill venues: prefer created_by, else first column named owner_id if present
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'venues' and column_name = 'owner_id'
  ) then
    update public.venues v
    set created_by = coalesce(v.created_by, v.owner_id)
    where v.created_by is null and v.owner_id is not null;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'venues' and column_name = 'owner_id'
  ) then
    update public.venues v
    set workspace_id = sub.workspace_id
    from (
      select distinct on (v2.id)
        v2.id as venue_id,
        wm.workspace_id
      from public.venues v2
      join public.workspace_members wm
        on wm.user_id = coalesce(v2.created_by, v2.owner_id)
       and wm.status = 'active'
      where v2.workspace_id is null
      order by v2.id, wm.joined_at asc nulls last
    ) sub
    where v.id = sub.venue_id
      and v.workspace_id is null;
  else
    update public.venues v
    set workspace_id = sub.workspace_id
    from (
      select distinct on (v2.id)
        v2.id as venue_id,
        wm.workspace_id
      from public.venues v2
      join public.workspace_members wm
        on wm.user_id = v2.created_by
       and wm.status = 'active'
      where v2.workspace_id is null
        and v2.created_by is not null
      order by v2.id, wm.joined_at asc nulls last
    ) sub
    where v.id = sub.venue_id
      and v.workspace_id is null;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Artists: backfill workspace_id from owner
-- ---------------------------------------------------------------------------

update public.artists a
set workspace_id = sub.workspace_id
from (
  select distinct on (a2.id)
    a2.id as artist_id,
    wm.workspace_id
  from public.artists a2
  join public.workspace_members wm
    on wm.user_id = a2.owner_id
   and wm.status = 'active'
  where a2.workspace_id is null
  order by a2.id, wm.joined_at asc nulls last
) sub
where a.id = sub.artist_id
  and a.workspace_id is null;

-- ---------------------------------------------------------------------------
-- Artists RLS (workspace-scoped; owner_id retained as creator)
-- ---------------------------------------------------------------------------

drop policy if exists "Artists are owned by the current user" on public.artists;
drop policy if exists artists_workspace_select on public.artists;
drop policy if exists artists_workspace_insert on public.artists;
drop policy if exists artists_workspace_update on public.artists;

create policy artists_select on public.artists for select
  using (
    workspace_id in (select public.user_workspace_ids())
    or (workspace_id is null and owner_id = auth.uid())
  );

create policy artists_insert on public.artists for insert
  with check (
    owner_id = auth.uid()
    and workspace_id in (select public.user_workspace_ids())
  );

create policy artists_update on public.artists for update
  using (
    workspace_id in (select public.user_workspace_ids())
    or (workspace_id is null and owner_id = auth.uid())
  );

create policy artists_delete on public.artists for delete
  using (
    workspace_id in (select public.user_workspace_ids())
    or (workspace_id is null and owner_id = auth.uid())
  );

-- Artist child tables: access via parent workspace
drop policy if exists "Artist social links are owned by the current user" on public.artist_social_links;
drop policy if exists "Artist documents are owned by the current user" on public.artist_documents;

create policy artist_social_links_all on public.artist_social_links for all
  using (
    exists (
      select 1 from public.artists a
      where a.id = artist_social_links.artist_id
        and (
          a.workspace_id in (select public.user_workspace_ids())
          or (a.workspace_id is null and a.owner_id = auth.uid())
        )
    )
  )
  with check (
    owner_id = auth.uid()
    and exists (
      select 1 from public.artists a
      where a.id = artist_social_links.artist_id
        and (
          a.workspace_id in (select public.user_workspace_ids())
          or (a.workspace_id is null and a.owner_id = auth.uid())
        )
    )
  );

create policy artist_documents_all on public.artist_documents for all
  using (
    exists (
      select 1 from public.artists a
      where a.id = artist_documents.artist_id
        and (
          a.workspace_id in (select public.user_workspace_ids())
          or (a.workspace_id is null and a.owner_id = auth.uid())
        )
    )
  )
  with check (
    owner_id = auth.uid()
    and exists (
      select 1 from public.artists a
      where a.id = artist_documents.artist_id
        and (
          a.workspace_id in (select public.user_workspace_ids())
          or (a.workspace_id is null and a.owner_id = auth.uid())
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Venues RLS
-- ---------------------------------------------------------------------------

alter table public.venues enable row level security;

drop policy if exists venues_select on public.venues;
drop policy if exists venues_insert on public.venues;
drop policy if exists venues_update on public.venues;
drop policy if exists venues_delete on public.venues;
drop policy if exists "Venues are owned by the current user" on public.venues;

create policy venues_select on public.venues for select
  using (
    workspace_id in (select public.user_workspace_ids())
    or (workspace_id is null and created_by = auth.uid())
  );

create policy venues_insert on public.venues for insert
  with check (
    created_by = auth.uid()
    and workspace_id in (select public.user_workspace_ids())
  );

create policy venues_update on public.venues for update
  using (
    workspace_id in (select public.user_workspace_ids())
    or (workspace_id is null and created_by = auth.uid())
  );

create policy venues_delete on public.venues for delete
  using (
    workspace_id in (select public.user_workspace_ids())
    or (workspace_id is null and created_by = auth.uid())
  );

-- Venue documents (if table exists)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'venue_documents'
  ) then
    alter table public.venue_documents enable row level security;

    execute 'drop policy if exists "Venue documents are owned by the current user" on public.venue_documents';
    execute 'drop policy if exists venue_documents_all on public.venue_documents';

    execute $policy$
      create policy venue_documents_all on public.venue_documents for all
      using (
        exists (
          select 1 from public.venues v
          where v.id = venue_documents.venue_id
            and (
              v.workspace_id in (select public.user_workspace_ids())
              or (v.workspace_id is null and v.created_by = auth.uid())
            )
        )
      )
      with check (
        exists (
          select 1 from public.venues v
          where v.id = venue_documents.venue_id
            and (
              v.workspace_id in (select public.user_workspace_ids())
              or (v.workspace_id is null and v.created_by = auth.uid())
            )
        )
      )
    $policy$;
  end if;
end $$;
