-- Run in Supabase Dashboard → SQL Editor
-- Adds 'completed' and 'cancelled' room statuses and a booking_ratings table
-- with per-category scores, auto-updating the ratee's kasama_rating on insert.

-- ── 1. Widen rooms.status ────────────────────────────────────────────────────

alter table public.rooms drop constraint if exists rooms_status_check;
alter table public.rooms
  add constraint rooms_status_check
  check (status in ('live', 'soon', 'confirmed', 'completed', 'cancelled'));

-- ── 2. booking_ratings table ─────────────────────────────────────────────────

create table if not exists public.booking_ratings (
  id                 uuid        primary key default gen_random_uuid(),
  room_id            uuid        not null references public.rooms(id) on delete cascade,
  rater_id           uuid        references auth.users(id) on delete set null,
  ratee_id           uuid        references auth.users(id) on delete set null,
  overall_score      integer     not null check (overall_score      between 1 and 5),
  communication_score integer    check (communication_score between 1 and 5),
  timeliness_score   integer     check (timeliness_score    between 1 and 5),
  reliability_score  integer     check (reliability_score   between 1 and 5),
  comment            text,
  created_at         timestamptz not null default now(),
  unique (room_id, rater_id)
);

alter table public.booking_ratings enable row level security;

-- Public read (for profile rating display)
drop policy if exists "public can read ratings" on public.booking_ratings;
create policy "public can read ratings"
  on public.booking_ratings for select using (true);

-- Only the rater can insert their own rating
drop policy if exists "rater can insert rating" on public.booking_ratings;
create policy "rater can insert rating"
  on public.booking_ratings for insert
  with check (auth.uid() = rater_id);

-- ── 3. Trigger: update kasama_rating on new rating ───────────────────────────

create or replace function public.refresh_kasama_rating()
returns trigger language plpgsql security definer as $$
begin
  update public.profiles
  set
    kasama_rating = (
      select round(avg(overall_score)::numeric, 2)
      from public.booking_ratings
      where ratee_id = new.ratee_id
    ),
    rating_count = (
      select count(*) from public.booking_ratings where ratee_id = new.ratee_id
    )
  where id = new.ratee_id;
  return new;
end $$;

drop trigger if exists trg_refresh_kasama_rating on public.booking_ratings;
create trigger trg_refresh_kasama_rating
  after insert on public.booking_ratings
  for each row execute procedure public.refresh_kasama_rating();
