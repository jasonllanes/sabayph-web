-- Run in Supabase Dashboard → SQL Editor
-- Adds self-attested ID verification fields to profiles.
-- We store ONLY the ID type + last 4 chars — never the full ID number or images.

alter table public.profiles
  add column if not exists id_type     text,
  add column if not exists id_last4    text,
  add column if not exists id_verified boolean not null default false;
