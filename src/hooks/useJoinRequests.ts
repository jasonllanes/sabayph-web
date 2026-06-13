import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { createNotification } from '@/hooks/useNotifications';

export interface JoinRequest {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string | null;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

/** Fetch all pending requests for rooms the current user owns. */
export function useRoomJoinRequests(ownedRoomIds: string[]) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!ownedRoomIds.length) { setRequests([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('join_requests')
      .select('*')
      .in('room_id', ownedRoomIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    setRequests((data as JoinRequest[]) ?? []);
    setLoading(false);
  }, [ownedRoomIds.join(',')]);

  useEffect(() => { refresh(); }, [refresh]);

  const approveRequest = async (req: JoinRequest) => {
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch the room name before making changes
    const { data: roomRow } = await supabase.from('rooms').select('name').eq('id', req.room_id).single();
    const roomName = roomRow?.name ?? 'the room';

    await Promise.all([
      supabase.from('join_requests').update({ status: 'approved' }).eq('id', req.id),
      supabase.from('room_members').upsert({ room_id: req.room_id, user_id: req.user_id }, { onConflict: 'room_id,user_id' }),
      supabase.rpc('increment_member_count', { room_id_input: req.room_id }).then(({ error }) => {
        if (error) return supabase.from('rooms').select('member_count').eq('id', req.room_id).single().then(({ data }) =>
          supabase.from('rooms').update({ member_count: (data?.member_count ?? 0) + 1 }).eq('id', req.room_id)
        );
      }),
      // Close the room — no new applications accepted after this
      supabase.from('rooms').update({ status: 'confirmed' }).eq('id', req.room_id),
    ]);

    // Post the system message that bootstraps the tracking group chat
    if (user?.id) {
      await supabase.from('room_messages').insert({
        room_id: req.room_id,
        sender_id: user.id,
        sender_name: 'SabayPH',
        content: `✅ ${req.display_name ?? 'A kasama'} has been accepted and joined the room! Use this group chat to coordinate.`,
        is_system: true,
      });
    }

    // Notify the requester that they've been accepted
    await createNotification(
      req.user_id,
      'accepted',
      "You've been accepted! 🎉",
      `${req.display_name ?? 'You'} got accepted into "${roomName}". Welcome to the kasama!`,
      { room_id: req.room_id, room_name: roomName },
    );
    await createNotification(
      req.user_id,
      'gc_established',
      'Group chat is ready!',
      `A group chat has been set up for "${roomName}". Tap to open and coordinate with your kasama.`,
      { room_id: req.room_id, room_name: roomName },
    );

    await refresh();
  };

  const rejectRequest = async (reqId: string) => {
    await supabase.from('join_requests').update({ status: 'rejected' }).eq('id', reqId);
    await refresh();
  };

  return { requests, loading, refresh, approveRequest, rejectRequest };
}

/** Check whether the current user has already requested to join a room. */
export async function getMyRequestStatus(
  userId: string,
  roomId: string,
): Promise<'none' | 'pending' | 'approved' | 'rejected'> {
  const { data } = await supabase
    .from('join_requests')
    .select('status')
    .eq('user_id', userId)
    .eq('room_id', roomId)
    .maybeSingle();
  return (data?.status as JoinRequest['status']) ?? 'none';
}

/** Submit a join request. */
export async function submitJoinRequest(
  userId: string,
  roomId: string,
  displayName: string,
  message?: string,
) {
  const { error } = await supabase.from('join_requests').upsert(
    { room_id: roomId, user_id: userId, display_name: displayName, message: message ?? null, status: 'pending' },
    { onConflict: 'room_id,user_id' },
  );
  if (!error) {
    // Notify the room owner about the new join request
    const { data: roomRow } = await supabase.from('rooms').select('user_id, name').eq('id', roomId).single();
    if (roomRow) {
      await createNotification(
        roomRow.user_id,
        'join_request',
        'New join request',
        `${displayName} wants to join your room "${roomRow.name}".`,
        { room_id: roomId, room_name: roomRow.name, requester_name: displayName },
      );
    }
  }
  return { error: error?.message ?? null };
}
