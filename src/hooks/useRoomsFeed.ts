import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface FeedRoom {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  host_name: string;
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
          .or(`event_date.gte.${now},event_date.is.null`)
          .order('created_at', { ascending: false })
          .range(from, from + PAGE_SIZE - 1);

        if (cancelled) return;
        if (!error) {
          const rows = (data ?? []) as FeedRoom[];
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
