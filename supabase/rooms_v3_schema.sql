-- Run this in Supabase Dashboard → SQL Editor
-- Adds location pin, itinerary, and custom social links to rooms

alter table public.rooms
  add column if not exists location_lat   float8,
  add column if not exists location_lng   float8,
  add column if not exists location_name  text,
  add column if not exists itinerary      jsonb not null default '[]'::jsonb,
  add column if not exists other_socials  jsonb not null default '[]'::jsonb;
