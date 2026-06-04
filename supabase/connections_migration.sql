-- Run in Supabase Dashboard → SQL Editor
-- Creates the connections (friend requests) table.

create table if not exists public.connections (
  id          uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id   uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending',   -- 'pending' | 'accepted' | 'rejected'
  created_at   timestamptz not null default now(),
  unique (from_user_id, to_user_id)
);

alter table public.connections enable row level security;

-- Users can read connections they are part of
create policy "read own connections"
  on public.connections for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- Users can send a request (insert where they are the sender)
create policy "send connection request"
  on public.connections for insert
  with check (auth.uid() = from_user_id);

-- Recipient can accept / reject
create policy "respond to request"
  on public.connections for update
  using (auth.uid() = to_user_id);

-- Either party can delete (cancel / unfriend)
create policy "delete connection"
  on public.connections for delete
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);
