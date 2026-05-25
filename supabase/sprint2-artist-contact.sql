-- Sprint 2: Artist booking/contact detail columns
alter table public.artists
  add column if not exists booking_email text,
  add column if not exists management_email text,
  add column if not exists press_email text,
  add column if not exists contact_page text,
  add column if not exists contact_source_urls text[] not null default '{}',
  add column if not exists contact_confidence text check (contact_confidence in ('low', 'medium', 'high'));
