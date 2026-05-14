-- PromoSync artist management schema.
-- Run this in your Supabase SQL editor after confirming Supabase Auth is enabled.

create extension if not exists "pgcrypto";

create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  artist_type text not null,
  genres text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  classification text,
  city text,
  country text,
  reach text not null default 'local' check (reach in ('local', 'national', 'international')),
  bio text,
  promo_image_url text,
  contact_name text,
  contact_role text,
  email text,
  phone text,
  preferred_contact_method text,
  agency_name text,
  management_company text,
  territory text,
  represented_artists text[] not null default '{}',
  internal_notes text,
  reliability_rating integer check (reliability_rating between 0 and 5),
  tags text[] not null default '{}',
  added_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artist_social_links (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'tiktok', 'spotify', 'soundcloud', 'youtube')),
  url text not null,
  created_at timestamptz not null default now(),
  unique (artist_id, platform)
);

create table if not exists public.artist_documents (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  file_size bigint not null default 0,
  uploaded_at timestamptz not null default now()
);

create index if not exists artists_owner_created_idx on public.artists(owner_id, created_at desc);
create index if not exists artists_owner_status_idx on public.artists(owner_id, status);
create index if not exists artists_search_idx on public.artists using gin (
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(artist_type, '') || ' ' || array_to_string(genres, ' ') || ' ' || array_to_string(tags, ' '))
);
create index if not exists artist_social_links_artist_idx on public.artist_social_links(artist_id);
create index if not exists artist_documents_artist_idx on public.artist_documents(artist_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists artists_set_updated_at on public.artists;
create trigger artists_set_updated_at
before update on public.artists
for each row execute function public.set_updated_at();

alter table public.artists enable row level security;
alter table public.artist_social_links enable row level security;
alter table public.artist_documents enable row level security;

drop policy if exists "Artists are owned by the current user" on public.artists;
create policy "Artists are owned by the current user"
on public.artists
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Artist social links are owned by the current user" on public.artist_social_links;
create policy "Artist social links are owned by the current user"
on public.artist_social_links
for all
using (
  owner_id = auth.uid()
  and exists (
    select 1 from public.artists
    where artists.id = artist_social_links.artist_id
    and artists.owner_id = auth.uid()
  )
)
with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.artists
    where artists.id = artist_social_links.artist_id
    and artists.owner_id = auth.uid()
  )
);

drop policy if exists "Artist documents are owned by the current user" on public.artist_documents;
create policy "Artist documents are owned by the current user"
on public.artist_documents
for all
using (
  owner_id = auth.uid()
  and exists (
    select 1 from public.artists
    where artists.id = artist_documents.artist_id
    and artists.owner_id = auth.uid()
  )
)
with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.artists
    where artists.id = artist_documents.artist_id
    and artists.owner_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('artist-documents', 'artist-documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('artist-media', 'artist-media', true)
on conflict (id) do nothing;

drop policy if exists "Users can read their own artist files" on storage.objects;
create policy "Users can read their own artist files"
on storage.objects
for select
using (
  bucket_id = 'artist-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Artist media is publicly readable" on storage.objects;
create policy "Artist media is publicly readable"
on storage.objects
for select
using (bucket_id = 'artist-media');

drop policy if exists "Users can upload their own artist media" on storage.objects;
create policy "Users can upload their own artist media"
on storage.objects
for insert
with check (
  bucket_id = 'artist-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update their own artist media" on storage.objects;
create policy "Users can update their own artist media"
on storage.objects
for update
using (
  bucket_id = 'artist-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'artist-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their own artist media" on storage.objects;
create policy "Users can delete their own artist media"
on storage.objects
for delete
using (
  bucket_id = 'artist-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can upload their own artist files" on storage.objects;
create policy "Users can upload their own artist files"
on storage.objects
for insert
with check (
  bucket_id = 'artist-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update their own artist files" on storage.objects;
create policy "Users can update their own artist files"
on storage.objects
for update
using (
  bucket_id = 'artist-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'artist-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their own artist files" on storage.objects;
create policy "Users can delete their own artist files"
on storage.objects
for delete
using (
  bucket_id = 'artist-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
