import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Connection, ConnectionStatus } from '@/types';

export function useConnections(userId?: string) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableReady, setTableReady] = useState<boolean | null>(null); // null = unknown

  const fetch = useCallback(async () => {
    if (!userId) return;
    const { data, error: err } = await supabase
      .from('connections')
      .select('*')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);

    if (err) {
      setTableReady(false);
      return;
    }
    setTableReady(true);
    setConnections((data as Connection[]) ?? []);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  const getStatus = useCallback((otherUserId: string): ConnectionStatus => {
    const c = connections.find(
      x => (x.from_user_id === userId && x.to_user_id === otherUserId) ||
           (x.from_user_id === otherUserId && x.to_user_id === userId),
    );
    if (!c) return 'none';
    if (c.status === 'accepted') return 'accepted';
    if (c.from_user_id === userId) return 'pending_sent';
    return 'pending_received';
  }, [connections, userId]);

  const getConnection = useCallback((otherUserId: string) =>
    connections.find(
      x => (x.from_user_id === userId && x.to_user_id === otherUserId) ||
           (x.from_user_id === otherUserId && x.to_user_id === userId),
    ),
  [connections, userId]);

  const sendRequest = useCallback(async (toUserId: string): Promise<string | null> => {
    if (!userId) return 'Not signed in.';
    if (tableReady === false) return 'Connections feature not set up yet — run the connections migration in Supabase.';

    setError(null);
    setLoading(true);

    // Optimistic update — show pending immediately
    const optimistic: Connection = {
      id: `__opt_${Date.now()}`,
      from_user_id: userId,
      to_user_id: toUserId,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    setConnections(prev => [...prev.filter(
      c => !(c.from_user_id === userId && c.to_user_id === toUserId)
    ), optimistic]);

    const { error: err } = await supabase
      .from('connections')
      .insert({ from_user_id: userId, to_user_id: toUserId, status: 'pending' });

    if (err) {
      // Roll back optimistic update
      setConnections(prev => prev.filter(c => c.id !== optimistic.id));
      const msg = err.message ?? 'Failed to send request.';
      setError(msg);
      setLoading(false);
      return msg;
    }

    await fetch();
    setLoading(false);
    return null;
  }, [userId, tableReady, fetch]);

  const acceptRequest = useCallback(async (connectionId: string): Promise<string | null> => {
    setLoading(true);
    setError(null);

    // Optimistic
    setConnections(prev => prev.map(c => c.id === connectionId ? { ...c, status: 'accepted' } : c));

    const { error: err } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', connectionId);

    if (err) {
      await fetch(); // revert
      setError(err.message);
      setLoading(false);
      return err.message;
    }

    await fetch();
    setLoading(false);
    return null;
  }, [fetch]);

  const removeConnection = useCallback(async (connectionId: string): Promise<string | null> => {
    setLoading(true);
    setError(null);

    // Optimistic
    setConnections(prev => prev.filter(c => c.id !== connectionId));

    const { error: err } = await supabase
      .from('connections')
      .delete()
      .eq('id', connectionId);

    if (err) {
      await fetch(); // revert
      setError(err.message);
      setLoading(false);
      return err.message;
    }

    setLoading(false);
    return null;
  }, [fetch]);

  return {
    connections,
    loading,
    error,
    tableReady,
    getStatus,
    getConnection,
    sendRequest,
    acceptRequest,
    removeConnection,
    refresh: fetch,
  };
}
