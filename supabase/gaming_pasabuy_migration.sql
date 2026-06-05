-- Run in Supabase Dashboard → SQL Editor
-- Adds gaming-specific and PasaBuy-specific fields to the rooms table.

alter table public.rooms
  -- Gaming: game title + per-game player identifier
  add column if not exists game_name    text,
  add column if not exists game_id      text,

  -- PasaBuy v2: structured item list (jsonb array of {id,name,qty,unit,brand,max_price,substitute})
  add column if not exists items        jsonb not null default '[]'::jsonb,

  -- PasaBuy v2: separate goods budget + service fee
  add column if not exists goods_budget numeric(10,2),
  add column if not exists service_fee_mode   text check (service_fee_mode in ('fixed','negotiable','distance_based')),
  add column if not exists service_fee_amount numeric(10,2),

  -- PasaBuy v2: dropoff location (separate from meetup pickup location)
  add column if not exists dropoff_lat  float8,
  add column if not exists dropoff_lng  float8,
  add column if not exists dropoff_name text,

  -- PasaBuy v2: deadline
  add column if not exists needed_by    timestamptz,

  -- PasaBuy v2: overage / reimbursement rule
  add column if not exists overage_rule text check (overage_rule in ('hard_cap','allow_over','reimburse')) default 'reimburse',

  -- PasaBuy v2: approval mode
  add column if not exists approval_mode text check (approval_mode in ('auto','manual')) default 'auto';
