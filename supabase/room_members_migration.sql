-- Run in Supabase Dashboard → SQL Editor
-- Creates room_members table for tracking joins and event attendance.

create table if not exists public.room_members (
  id          uuid default gen_random_uuid() primary key,
  room_id     uuid references public.rooms(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  joined_at   timestamptz default now() not null,
  attended    boolean not null default false,
  unique(room_id, user_id)
);

alter table public.room_members enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'room_members' and policyname = 'Room members are viewable by everyone') then
    create policy "Room members are viewable by everyone" on public.room_members for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'room_members' and policyname = 'Users can join rooms') then
    create policy "Users can join rooms" on public.room_members for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'room_members' and policyname = 'Users can leave rooms') then
    create policy "Users can leave rooms" on public.room_members for delete using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'room_members' and policyname = 'Room hosts can mark attendance') then
    create policy "Room hosts can mark attendance" on public.room_members for update using (
      exists (select 1 from public.rooms where id = room_id and user_id = auth.uid())
    );
  end if;
end $$;

-- Add kasama_rating column to profiles for future rating system
alter table public.profiles
  add column if not exists kasama_rating numeric(3,1) default null,
  add column if not exists rating_count  integer default 0;
