-- Run in Supabase Dashboard → SQL Editor
-- Adds profile_tags array to the profiles table for pronouns / interest tags.

alter table public.profiles
  add column if not exists profile_tags text[] default '{}';
