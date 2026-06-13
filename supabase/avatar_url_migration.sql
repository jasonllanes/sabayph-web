-- Run in Supabase Dashboard → SQL Editor
-- Adds avatar_url column to profiles and backfills from Google/OAuth metadata
-- so existing users see their real profile photo in Discover cards.

alter table public.profiles
  add column if not exists avatar_url text;

-- Backfill existing Google/OAuth users from auth.users metadata
update public.profiles p
set avatar_url = u.raw_user_meta_data->>'avatar_url'
from auth.users u
where u.id = p.id
  and p.avatar_url is null
  and u.raw_user_meta_data->>'avatar_url' is not null;
