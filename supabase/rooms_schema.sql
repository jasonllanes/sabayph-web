-- Run this in Supabase Dashboard → SQL Editor

create table public.rooms (
  id           uuid        default gen_random_uuid() primary key,
  created_at   timestamptz default now() not null,
  user_id      uuid        references auth.users(id) on delete cascade not null,
  host_name    text        not null,
  name         text        not null,
  description  text,
  category     text        not null default 'rotary',
  max_members  integer     not null default 20,
  member_count integer     not null default 1,
  next_event   text,
  status       text        not null default 'soon' check (status in ('live', 'soon'))
);

alter table public.rooms enable row level security;

create policy "Rooms are viewable by everyone"
  on public.rooms for select using (true);

create policy "Authenticated users can create rooms"
  on public.rooms for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own rooms"
  on public.rooms for update
  using (auth.uid() = user_id);

create policy "Users can delete their own rooms"
  on public.rooms for delete
  using (auth.uid() = user_id);
