-- Run in Supabase Dashboard → SQL Editor
-- Creates join_requests table for room membership approval flow.

create table if not exists public.join_requests (
  id           uuid default gen_random_uuid() primary key,
  room_id      uuid references public.rooms(id) on delete cascade not null,
  user_id      uuid references auth.users(id) on delete cascade not null,
  display_name text,
  message      text,
  status       text not null default 'pending',   -- 'pending' | 'approved' | 'rejected'
  created_at   timestamptz default now() not null,
  unique(room_id, user_id)
);

alter table public.join_requests enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='join_requests' and policyname='Requesters can insert own requests') then
    create policy "Requesters can insert own requests" on public.join_requests
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='join_requests' and policyname='Requesters can view own requests') then
    create policy "Requesters can view own requests" on public.join_requests
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='join_requests' and policyname='Room owners can view requests') then
    create policy "Room owners can view requests" on public.join_requests
      for select using (
        exists (select 1 from public.rooms where id = room_id and user_id = auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='join_requests' and policyname='Room owners can update requests') then
    create policy "Room owners can update requests" on public.join_requests
      for update using (
        exists (select 1 from public.rooms where id = room_id and user_id = auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='join_requests' and policyname='Requesters can delete own requests') then
    create policy "Requesters can delete own requests" on public.join_requests
      for delete using (auth.uid() = user_id);
  end if;
end $$;
