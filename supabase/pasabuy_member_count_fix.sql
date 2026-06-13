-- Run in Supabase Dashboard → SQL Editor
-- Fixes existing PasaBuy rooms where member_count was incorrectly set to 1
-- (the requester is not a buyer/agent — only actual applicants should count).

update public.rooms
set member_count = 0
where category = 'pasabuy'
  and member_count = 1
  and (
    select count(*) from public.room_members
    where room_members.room_id = rooms.id
  ) = 0;
if booking is confirmed or the requester already accepted someone to be the courier or agent it will now then close the room, also could you make sure that the requestor could stalk to the applier or the agent before he/she accepts. Also make sure that there will be a group chat created for Rotary Tracking GC # Room ID something like that