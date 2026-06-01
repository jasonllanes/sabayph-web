-- Run this in Supabase Dashboard → SQL Editor
-- Adds join code, password, event date, social links to rooms
-- Also creates the profiles table for user social links

-- ── 1. Alter rooms table ──────────────────────────────────────────────────────

alter table public.rooms
  add column if not exists join_code   text unique,
  add column if not exists is_private  boolean not null default false,
  add column if not exists password    text,
  add column if not exists event_date  timestamptz,
  add column if not exists facebook_url  text,
  add column if not exists instagram_url text,
  add column if not exists twitter_url   text;

-- Backfill join codes for any existing rooms that don't have one
do $$
declare
  r    record;
  code text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
begin
  for r in select id from public.rooms where join_code is null loop
    loop
      code := 'KRM-';
      for i in 1..6 loop
        code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
      end loop;
      begin
        update public.rooms set join_code = code where id = r.id;
        exit;
      exception when unique_violation then
        -- retry with a new code
      end;
    end loop;
  end loop;
end;
$$;

-- ── 2. Profiles table ────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id             uuid references auth.users(id) on delete cascade primary key,
  facebook_url   text,
  instagram_url  text,
  twitter_url    text,
  updated_at     timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);
