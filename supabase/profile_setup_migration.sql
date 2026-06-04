-- Run in Supabase Dashboard → SQL Editor
-- Adds profile setup fields to the profiles table.

alter table public.profiles
  add column if not exists display_name      text,
  add column if not exists age_range         text,
  add column if not exists location          text,
  add column if not exists bio               text,
  add column if not exists gender            text,
  add column if not exists profile_completed boolean not null default false,
  add column if not exists privacy_level     text    not null default 'public',
  add column if not exists show_in_discover  boolean not null default true;
