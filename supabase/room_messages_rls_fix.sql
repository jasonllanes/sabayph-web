-- Run in Supabase Dashboard → SQL Editor
-- Widens room_messages RLS to also allow accepted couriers (via join_requests)
-- to read and write messages. The room_members path has proven unreliable for
-- realtime delivery; join_requests is the authoritative accepted-state source.

-- ── SELECT (read + realtime delivery) ───────────────────────────────────────

drop policy if exists "room members can read room messages" on public.room_messages;
create policy "room members can read room messages"
  on public.room_messages for select
  using (
    -- Room owner
    exists (select 1 from public.rooms       where id      = room_id                     and user_id = auth.uid())
    or
    -- Approved member (room_members table)
    exists (select 1 from public.room_members where room_id = room_messages.room_id      and user_id = auth.uid())
    or
    -- Accepted courier (join_requests — reliable RLS fallback)
    exists (select 1 from public.join_requests where room_id = room_messages.room_id     and user_id = auth.uid() and status = 'approved')
  );

-- ── INSERT (send messages) ───────────────────────────────────────────────────

drop policy if exists "room members can send messages"      on public.room_messages;
drop policy if exists "room owner can post system messages" on public.room_messages;

create policy "room members can send messages"
  on public.room_messages for insert
  with check (
    auth.uid() = sender_id
    and (
      exists (select 1 from public.rooms        where id      = room_id                  and user_id = auth.uid())
      or
      exists (select 1 from public.room_members  where room_id = room_messages.room_id   and user_id = auth.uid())
      or
      exists (select 1 from public.join_requests where room_id = room_messages.room_id   and user_id = auth.uid() and status = 'approved')
    )
  );
