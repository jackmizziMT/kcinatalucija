-- Migration: Add bookings table to store per-product booking quantity and notes
-- Run this SQL in the Supabase SQL editor (or include in your migration pipeline)

create table if not exists public.bookings (
  sku text primary key,
  quantity integer not null default 0,
  note text,
  updated_at timestamptz not null default now()
);

comment on table public.bookings is 'Stores per-product booking quantity and optional notes';
comment on column public.bookings.sku is 'Product SKU (foreign key to items.sku)';
comment on column public.bookings.quantity is 'Booked quantity for the SKU';
comment on column public.bookings.note is 'Optional note describing the booking';

alter table public.bookings
  add constraint bookings_sku_fkey
  foreign key (sku) references public.items (sku)
  on delete cascade;

-- Enable RLS and allow authenticated users to read and modify bookings
alter table public.bookings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'bookings'
      and policyname = 'Authenticated users manage bookings'
  ) then
    create policy "Authenticated users manage bookings"
      on public.bookings
      using (auth.role() = 'authenticated')
      with check (auth.role() = 'authenticated');
  end if;
end
$$;
