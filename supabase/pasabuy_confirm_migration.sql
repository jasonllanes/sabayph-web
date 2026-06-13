-- Run in Supabase Dashboard → SQL Editor
-- 1. Creates room_messages table (group chat for all room types)
-- 2. Allows 'confirmed' as a valid room status for PasaBuy booking confirmation

-- ── room_messages table ──────────────────────────────────────────────────────

create table if not exists public.room_messages (
  id          uuid        primary key default gen_random_uuid(),
  room_id     uuid        not null references public.rooms(id) on delete cascade,
  sender_id   uuid        references auth.users(id) on delete set null,
  sender_name text,
  content     text        not null,
  is_system   boolean     not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_room_messages_room_created
  on public.room_messages(room_id, created_at desc);

alter table public.room_messages enable row level security;

-- Room owner + approved members can read messages
drop policy if exists "room members can read room messages" on public.room_messages;
create policy "room members can read room messages"
  on public.room_messages for select
  using (
    exists (select 1 from public.rooms where id = room_id and user_id = auth.uid())
    or
    exists (select 1 from public.room_members where room_id = room_messages.room_id and user_id = auth.uid())
  );

-- Room owner + approved members can send messages
drop policy if exists "room members can send messages" on public.room_messages;
create policy "room members can send messages"
  on public.room_messages for insert
  with check (
    auth.uid() = sender_id and (
      exists (select 1 from public.rooms where id = room_id and user_id = auth.uid())
      or
      exists (select 1 from public.room_members where room_id = room_messages.room_id and user_id = auth.uid())
    )
  );

-- ── rooms.status: allow 'confirmed' ─────────────────────────────────────────

alter table public.rooms
  drop constraint if exists rooms_status_check;

alter table public.rooms
  add constraint rooms_status_check
  check (status in ('live', 'soon', 'confirmed'));
