-- Run in Supabase Dashboard → SQL Editor
-- Adds is_online toggle to profiles; defaults everyone to active.

alter table public.profiles
  add column if not exists is_online boolean not null default true;

-- Flip existing rows that were inserted before this migration (default was false)
update public.profiles set is_online = true;
