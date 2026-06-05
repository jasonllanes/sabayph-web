-- Run in Supabase Dashboard → SQL Editor
-- Adds a short unique kasama_tag to profiles (e.g. ksm-a4k9mz).

alter table public.profiles
  add column if not exists kasama_tag text unique;

-- Generate tags for existing completed profiles that don't have one yet.
-- Uses a random 6-char lowercase alphanumeric string (no ambiguous chars).
do $$
declare
  rec record;
  tag text;
  charset text := 'abcdefghjkmnpqrstuvwxyz23456789';
  attempts int;
begin
  for rec in select id from public.profiles where kasama_tag is null and profile_completed = true loop
    attempts := 0;
    loop
      tag := 'ksm-';
      for i in 1..6 loop
        tag := tag || substr(charset, floor(random() * length(charset) + 1)::int, 1);
      end loop;
      begin
        update public.profiles set kasama_tag = tag where id = rec.id;
        exit; -- success, no conflict
      exception when unique_violation then
        attempts := attempts + 1;
        if attempts > 50 then raise exception 'Too many tag collisions for user %', rec.id; end if;
      end;
    end loop;
  end loop;
end $$;
