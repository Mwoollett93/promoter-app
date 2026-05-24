-- Sprint 2: Artist booking fee columns (if missing from artist-management.sql)

alter table public.artists
  add column if not exists typical_fee_cents integer not null default 0,
  add column if not exists deposit_required boolean not null default false,
  add column if not exists deposit_amount_cents integer not null default 0,
  add column if not exists booking_notes text;
