-- Run in Supabase Dashboard → SQL Editor
-- Adds contact_phone to the profiles table (no OTP — user-entered contact number).

alter table public.profiles
  add column if not exists contact_phone text;
