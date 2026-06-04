import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { DiscoverProfile } from '@/types';

const FULL_COLS =
  'id, display_name, age_range, location, bio, gender, profile_tags, kasama_rating, rating_count, is_online, profile_completed, contact_phone, home_lat';

const BASE_COLS =
  'id, display_name, age_range, location, bio, gender, kasama_rating, rating_count, profile_completed, home_lat';

function normalise(rows: any[]): DiscoverProfile[] {
  return rows.map(r => ({
    id:               r.id,
    display_name:     r.display_name ?? null,
    age_range:        r.age_range ?? null,
    location:         r.location ?? null,
    bio:              r.bio ?? null,
    gender:           r.gender ?? null,
    profile_tags:     r.profile_tags ?? null,
    kasama_rating:    r.kasama_rating ?? null,
    rating_count:     r.rating_count ?? 0,
    is_online:        r.is_online ?? false,
    profile_completed: r.profile_completed ?? false,
    contact_phone:    r.contact_phone ?? null,
    home_lat:         r.home_lat ?? null,
  }));
}

async function queryPeople(cols: string, currentUserId?: string) {
  let q = supabase
    .from('profiles')
    .select(cols)
    .eq('show_in_discover', true)
    .eq('profile_completed', true)
    .limit(60);
  if (currentUserId) q = q.neq('id', currentUserId);
  return q;
}

export function useDiscoverPeople(currentUserId?: string) {
  const [people, setPeople] = useState<DiscoverProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);

    // Try full column set first (all migrations must be run)
    const { data: full, error: fullErr } = await queryPeople(FULL_COLS, currentUserId);
    if (!fullErr && full) {
      setPeople(normalise(full));
      setLoading(false);
      return;
    }

    // Fallback: stable base columns only
    const { data: base } = await queryPeople(BASE_COLS, currentUserId);
    setPeople(normalise(base ?? []));
    setLoading(false);
  }, [currentUserId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { people, loading, refresh: fetch };
}
