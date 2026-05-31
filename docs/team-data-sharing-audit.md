# Team data sharing audit

**Date:** 2026-05-21  
**Intended model:** All team members share venues, artists, events, kanban/tasks, and related resources. Records scoped to **team**, attributed to **creator**. No cross-team leakage.

**Terminology in this codebase:** There is no `team_id` column. **Team = workspace.** Use `workspace_id` everywhere (equivalent to your `team_id`). Creator = `created_by` / `owner_id` / `actor_id` depending on table.

---

## Executive summary

| Domain | Shared today? | Filter key | Creator stored? | Creator in UI? |
|--------|---------------|------------|-----------------|----------------|
| **Events** | Yes | `workspace_id` | `created_by` | No (stripped in mapper) |
| **Tasks / Kanban** | Yes | `workspace_id` | `created_by` | No |
| **Comments / Activity** | Yes | `workspace_id` | `author_id` / `actor_id` | Yes |
| **Artists** | **No** | `owner_id` (RLS) | `owner_id` only | No |
| **Venues** | **No** | Unknown / per-user | Not in app inserts | No |
| **Seasons** | **No** | localStorage only | N/A | N/A |
| **Templates** | Partial | DB has `workspace_id`; app uses localStorage | N/A | N/A |

**Events and tasks are correctly workspace-shared.** Artists and venues are the main gaps. Creator attribution exists in DB for events/tasks but is not shown in list/card UI.

---

## 1. Schema

### Already correct (do not change)

**`workspaces`** — `supabase/collaboration.sql`  
- `created_by` → workspace creator

**`workspace_members`** — membership = team roster  
- `workspace_id`, `user_id`, `role`, `display_name`

**`events`** — `workspace_id NOT NULL`, `created_by NOT NULL`  
- Index: `events_workspace_id_idx`

**`tasks`** — `workspace_id NOT NULL`, `created_by NOT NULL`  
- Index: `tasks_workspace_column_idx`

**`activity_log`** — `workspace_id`, `actor_id`  
**`comments`** — `workspace_id`, `author_id`  
**`task_attachments`** — `workspace_id`, `uploaded_by`

### Partial / broken

**`artists`** — `supabase/artist-management.sql` + `collaboration.sql` ALTER  
- `owner_id NOT NULL` (default `auth.uid()`) — **per-user ownership**
- `workspace_id` added nullable in `collaboration.sql` line 263 — **never set by app on create**
- RLS: members can SELECT/UPDATE if `workspace_id IS NOT NULL`, but INSERT only checks `owner_id = auth.uid()` — new rows stay invisible to teammates unless backfilled

**`artist_social_links` / `artist_documents`** — `owner_id` only; no workspace path

**`venues`** — **No SQL in repo.** Client assumes `venues` table with no `workspace_id` / `created_by` in `venueDraftToRow()` (`lib/lib/supabase/browser.ts`, `VenueManagementPage.tsx`)

**`seasons`** — `supabase/seasons.sql` has `workspace_id` but **no RLS**; app uses **localStorage** only (`lib/data/seasons.ts`)

**`task_templates` / `event_templates` / `automation_rules`** — schema is workspace-scoped; app reads/writes **localStorage** (`lib/collaboration/templates.ts`)

---

## 2. Queries & mutations

### Events — OK

| Operation | File | Filter / insert |
|-----------|------|-----------------|
| List | `lib/supabase/events.ts` | `events?workspace_id=eq.${workspaceId}` |
| Create | same | `workspace_id`, `created_by: session.user.id` |
| Batched load | `lib/server/workspace-data.ts` | via workspace context |

**Gap:** `workspaceEventToManaged()` drops `createdBy` when mapping to UI type (`lib/supabase/events.ts` ~91–115).

### Tasks / Kanban — OK

| Operation | File | Filter / insert |
|-----------|------|-----------------|
| List | `lib/collaboration/tasks.ts` | `tasks?workspace_id=eq.${workspaceId}` |
| Create | same | `workspace_id`, `created_by: session.user.id` |
| Board | `KanbanBoard.tsx` | loads from `WorkspaceContext.tasks` |

**Gap:** `TaskKanbanCard.tsx` / `TaskDetailDrawer.tsx` show assignee, not creator.

### Artists — NOT workspace-scoped

| Operation | File | Issue |
|-----------|------|--------|
| List | `lib/supabase/browser.ts` | `artists?...&order=created_at.desc` — **no `workspace_id` filter** |
| Create | `createArtist()` / `artistDraftToRow()` | **No `workspace_id`**; DB sets `owner_id = auth.uid()` |
| Pages | `ArtistManagementPage.tsx`, wizard lineup | fetch with session only, **not** `useWorkspace()` |

### Venues — NOT workspace-scoped

| Operation | File | Issue |
|-----------|------|--------|
| List | `lib/lib/supabase/browser.ts`, `venue-summaries.ts`, `VenueManagementPage.tsx`, event wizard | **no `workspace_id` filter** |
| Create | `venueDraftToRow()` | **no `workspace_id` or `created_by`** |
| Pages | `VenueManagementPage.tsx`, `AddVenuePage.tsx` | no workspace context |

### Other client silos (bypass team sharing)

| Mechanism | File | Impact |
|-----------|------|--------|
| Local collaboration mode | `lib/collaboration/storage-mode.ts` | Per-user offline; data not shared |
| Local store | `lib/collaboration/local-store.ts` | Events/tasks in browser only |
| Managed events cache | `lib/data/events.ts` | Legacy per-browser events |
| Seasons | `lib/data/seasons.ts` | localStorage, not Supabase |
| Event permission overrides | `lib/supabase/event-permissions.ts` | global localStorage key |

---

## 3. RLS (Supabase)

### Correct — workspace member checks

- `events`, `tasks`, `activity_log`, `comments`, `task_attachments`, `notifications` (insert), templates, automations — `user_workspace_ids()` / `is_workspace_member()`

### Problematic

**Artists** — conflicting policies:
- `artist-management.sql`: `FOR ALL` on `owner_id = auth.uid()`
- `collaboration.sql`: workspace-aware SELECT/UPDATE but INSERT still `owner_id = auth.uid()` only

**Venues** — not in `SECURITY.md` RLS checklist; policies unknown / likely owner-only

**Seasons** — table exists, RLS not enabled in repo

---

## 4. UI — creator attribution

| Surface | Status |
|---------|--------|
| Activity feed | Shows actor name |
| Comments | Shows author |
| Events list/cards | **Missing** — `createdBy` not on `ManagedEventRecord` |
| Task cards / drawer | **Missing** — `Task.createdBy` exists, unused |
| Artist / venue rows | **Missing** — no owner/creator on types |

Helper exists: `getWorkspaceMemberLabel()` in `lib/collaboration/member-display.ts` — reuse for “Added by Sarah”.

---

## 5. Required migrations (new SQL files)

Apply in order after backup. **Do not run on production without staging test.**

### `supabase/migrations/team-sharing-venues.sql` (new)

```sql
-- Add team (workspace) scope + creator to venues
alter table public.venues
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists venues_workspace_id_idx on public.venues(workspace_id);

-- Backfill: assign each venue to creator's primary workspace (adjust to your data model)
-- update public.venues v set workspace_id = (...), created_by = v.owner_id where workspace_id is null;

alter table public.venues enable row level security;

create policy venues_select on public.venues for select
  using (workspace_id in (select public.user_workspace_ids()));

create policy venues_insert on public.venues for insert
  with check (
    workspace_id in (select public.user_workspace_ids())
    and created_by = auth.uid()
  );

create policy venues_update on public.venues for update
  using (workspace_id in (select public.user_workspace_ids()));
```

*(Adjust if `venues` uses `owner_id` instead of `created_by` in production.)*

### `supabase/migrations/team-sharing-artists.sql` (new)

```sql
-- Enforce workspace sharing on artists
-- 1. Backfill workspace_id from owner's active workspace membership
-- 2. Make workspace_id NOT NULL
-- 3. Replace owner-only policies with workspace policies
-- 4. Keep owner_id as creator attribution (rename conceptually to created_by)

drop policy if exists "Artists are owned by the current user" on public.artists;
drop policy if exists artists_workspace_select on public.artists;
drop policy if exists artists_workspace_insert on public.artists;
drop policy if exists artists_workspace_update on public.artists;

create policy artists_select on public.artists for select
  using (workspace_id in (select public.user_workspace_ids()));

create policy artists_insert on public.artists for insert
  with check (
    workspace_id in (select public.user_workspace_ids())
    and owner_id = auth.uid()
  );

create policy artists_update on public.artists for update
  using (workspace_id in (select public.user_workspace_ids()));

-- Child tables: allow access when parent artist is in user's workspace
-- (add policies on artist_social_links, artist_documents)
```

### `supabase/migrations/team-sharing-seasons-rls.sql` (new)

- Enable RLS on `seasons` with `workspace_id in user_workspace_ids()`
- Wire app off localStorage (`lib/data/seasons.ts`)

### Data backfill script (one-time)

- For each artist/venue with `workspace_id IS NULL`, set from creating user's `workspace_members` row
- Verify no row ends up in wrong workspace before `NOT NULL` constraint

---

## 6. Application changes (when you implement)

**Do not modify** event/task/workspace RLS or list queries — already correct.

### Artists & venues (high priority)

1. Pass `workspace.id` from `useWorkspace()` into `createArtist` / `createVenue`
2. Include `workspace_id` (+ `created_by` for venues) in POST body
3. Change `listArtists` / `listVenues` to `...&workspace_id=eq.${workspaceId}`
4. Refactor artist/venue pages to require workspace ready (like dashboard)

### Creator attribution (medium priority)

1. Add `createdBy?: string` to `ManagedEventRecord`; preserve in `workspaceEventToManaged()`
2. Resolve display name via members list + `getWorkspaceMemberLabel()`
3. Show “Added by …” on event rows, task cards (secondary line)
4. Add `createdBy` / `ownerId` to artist & venue profile types after migration

### Optional / later

- Migrate seasons + templates from localStorage to Supabase workspace tables
- Tighten local collaboration fallback so production teams don’t silently silo
- Fix SWR cache key to use `workspace.id` not `user.id` (`workspace-data-client.ts`)

---

## 7. Verification checklist

After migrations + app changes:

- [ ] User A creates artist → User B (same workspace) sees it on `/artists`
- [ ] User A creates venue → User B sees it in wizard venue dropdown
- [ ] User C (different workspace) sees **none** of A/B artists or venues (RLS + query)
- [ ] Event/task sharing still works unchanged
- [ ] New records show “Added by {name}” where implemented
- [ ] Cross-workspace API probe returns empty (see `SECURITY.md` §3)

---

## 8. Files reference

| Area | Paths |
|------|-------|
| Schema / RLS | `supabase/collaboration.sql`, `artist-management.sql`, `seasons.sql` |
| Events | `lib/supabase/events.ts`, `lib/data/events.ts` |
| Tasks | `lib/collaboration/tasks.ts`, `app/components/tasks/KanbanBoard.tsx` |
| Artists | `lib/supabase/browser.ts`, `app/components/artists/*` |
| Venues | `lib/lib/supabase/browser.ts`, `app/components/venues/*` |
| Workspace load | `lib/server/workspace-data.ts`, `lib/collaboration/WorkspaceContext.tsx` |
| Member labels | `lib/collaboration/member-display.ts` |
