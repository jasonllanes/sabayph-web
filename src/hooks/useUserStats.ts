import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface UserStats {
  roomsJoined: number;
  eventsAttended: number;
  kasamaRating: number | null;
  ratingCount: number;
  loading: boolean;
}

export function useUserStats(userId: string | undefined): UserStats {
  const [stats, setStats] = useState<UserStats>({
    roomsJoined: 0,
    eventsAttended: 0,
    kasamaRating: null,
    ratingCount: 0,
    loading: true,
  });

  useEffect(() => {
    if (!userId) { setStats(s => ({ ...s, loading: false })); return; }

    (async () => {
      const [membersRes, profileRes] = await Promise.all([
        supabase
          .from('room_members')
          .select('room_id, attended, rooms!inner(event_date)')
          .eq('user_id', userId),
        supabase
          .from('profiles')
          .select('kasama_rating, rating_count')
          .eq('id', userId)
          .single(),
      ]);

      const members = membersRes.data ?? [];
      const now = new Date();

      const eventsAttended = members.filter(m => {
        const eventDate = (m.rooms as any)?.event_date;
        return m.attended || (eventDate && new Date(eventDate) < now);
      }).length;

      setStats({
        roomsJoined: members.length,
        eventsAttended,
        kasamaRating: profileRes.data?.kasama_rating ?? null,
        ratingCount: profileRes.data?.rating_count ?? 0,
        loading: false,
      });
    })();
  }, [userId]);

  return stats;
}
