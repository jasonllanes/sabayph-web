-- Run in Supabase Dashboard → SQL Editor
-- Enables Supabase Realtime for room_messages so all participants receive
-- INSERT events in real-time. Also sets replica identity so RLS can be
-- evaluated correctly on each incoming row.

-- 1. Full replica identity — required for Realtime RLS filtering
alter table public.room_messages replica identity full;

-- 2. Add table to the Supabase Realtime publication
--    (safe to run multiple times — skips if already present)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'room_messages'
  ) then
    alter publication supabase_realtime add table public.room_messages;
  end if;
end $$;
