-- Run this once in Supabase Dashboard → SQL Editor
-- Adds ALL columns introduced in v2 + v3 migrations.
-- Safe to run even if some columns already exist.

alter table public.rooms
  add column if not exists join_code       text unique,
  add column if not exists is_private      boolean      not null default false,
  add column if not exists password        text,
  add column if not exists event_date      timestamptz,
  add column if not exists facebook_url    text,
  add column if not exists instagram_url   text,
  add column if not exists twitter_url     text,
  add column if not exists location_lat    float8,
  add column if not exists location_lng    float8,
  add column if not exists location_name   text,
  add column if not exists itinerary       jsonb not null default '[]'::jsonb,
  add column if not exists other_socials   jsonb not null default '[]'::jsonb;

-- Backfill join codes for rooms that don't have one yet
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
        -- retry
      end;
    end loop;
  end loop;
end;
$$;

-- Profiles table (skip if it already exists)
create table if not exists public.profiles (
  id             uuid references auth.users(id) on delete cascade primary key,
  facebook_url   text,
  instagram_url  text,
  twitter_url    text,
  updated_at     timestamptz default now() not null
);

alter table public.profiles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Profiles are viewable by everyone') then
    create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can insert their own profile') then
    create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can update their own profile') then
    create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
  end if;
end $$;
