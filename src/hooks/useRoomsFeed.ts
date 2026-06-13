import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface FeedRoom {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  host_name: string;
  host_avatar_url: string | null;
  host_gender: string | null;
  host_tags: string[] | null;
  member_count: number;
  max_members: number;
  event_date: string | null;
  next_event: string | null;
  location_name: string | null;
  is_private: boolean;
  status: string;
  created_at: string;
  join_code: string | null;
}

const SELECT =
  'id, user_id, name, description, category, host_name, member_count, max_members, event_date, next_event, location_name, is_private, status, created_at, join_code';
const PAGE_SIZE = 10;

export function useRoomsFeed() {
  const [rooms, setRooms] = useState<FeedRoom[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const from = page * PAGE_SIZE;
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from('rooms')
          .select(SELECT)
          .in('status', ['live', 'soon'])
          .or(`event_date.gte.${now},event_date.is.null`)
          .order('created_at', { ascending: false })
          .range(from, from + PAGE_SIZE - 1);

        if (cancelled) return;
        if (!error) {
          const rawRows = (data ?? []) as any[];

          // Batch-fetch host profiles by user_id (rooms.user_id → profiles.id)
          const hostIds = [...new Set(rawRows.map(r => r.user_id).filter(Boolean))];
          let profileMap = new Map<string, { avatar_url: string | null; gender: string | null; profile_tags: string[] | null }>();
          if (hostIds.length) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, avatar_url, gender, profile_tags')
              .in('id', hostIds);
            (profiles ?? []).forEach((p: any) => profileMap.set(p.id, p));
          }

          const rows = rawRows.map((r): FeedRoom => ({
            id: r.id,
            user_id: r.user_id,
            name: r.name,
            description: r.description ?? null,
            category: r.category,
            host_name: r.host_name,
            host_avatar_url: profileMap.get(r.user_id)?.avatar_url ?? null,
            host_gender: profileMap.get(r.user_id)?.gender ?? null,
            host_tags: profileMap.get(r.user_id)?.profile_tags ?? null,
            member_count: r.member_count,
            max_members: r.max_members,
            event_date: r.event_date ?? null,
            next_event: r.next_event ?? null,
            location_name: r.location_name ?? null,
            is_private: r.is_private,
            status: r.status,
            created_at: r.created_at,
            join_code: r.join_code ?? null,
          }));
          setRooms(prev => (page === 0 ? rows : [...prev, ...rows]));
          setHasMore(rows.length === PAGE_SIZE);
        } else {
          setHasMore(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };
    run();
    return () => { cancelled = true; };
  }, [page]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) setPage(p => p + 1);
  }, [loading, hasMore]);

  return { rooms, loading, initialized, hasMore, loadMore };
}
