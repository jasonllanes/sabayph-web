-- Run in Supabase Dashboard → SQL Editor
-- Adds home location coordinates to profiles for Explore default center.

alter table public.profiles
  add column if not exists home_lat float8,
  add column if not exists home_lng float8;
