import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function usePendingFriendsCount(userId?: string) {
  const [count, setCount] = useState(0);

  const fetch = useCallback(async () => {
    if (!userId) return;
    const { count: c } = await supabase
      .from('connections')
      .select('id', { count: 'exact', head: true })
      .eq('to_user_id', userId)
      .eq('status', 'pending');
    setCount(c ?? 0);
  }, [userId]);

  useEffect(() => {
    fetch();
    if (!userId) return;
    const channel = supabase
      .channel(`pending-friends-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections', filter: `to_user_id=eq.${userId}` }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch, userId]);

  return count;
}

export function usePendingRoomsCount(userId?: string) {
  const [count, setCount] = useState(0);

  const fetch = useCallback(async () => {
    if (!userId) return;
    // Get rooms owned by this user
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id')
      .eq('user_id', userId);

    const roomIds = (rooms ?? []).map((r: any) => r.id);
    if (!roomIds.length) { setCount(0); return; }

    const { count: c } = await supabase
      .from('join_requests')
      .select('id', { count: 'exact', head: true })
      .in('room_id', roomIds)
      .eq('status', 'pending');
    setCount(c ?? 0);
  }, [userId]);

  useEffect(() => {
    fetch();
    if (!userId) return;
    const channel = supabase
      .channel(`pending-rooms-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'join_requests' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch, userId]);

  return count;
}
