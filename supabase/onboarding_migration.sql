-- Run in Supabase Dashboard → SQL Editor
-- Adds onboarding_completed flag to profiles.
-- Existing users who already finished profile setup are marked as done
-- so they don't see onboarding again after the migration.

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

-- Mark existing completed profiles so they skip onboarding
update public.profiles
  set onboarding_completed = true
  where profile_completed = true;
