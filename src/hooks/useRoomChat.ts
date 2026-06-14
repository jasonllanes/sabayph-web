import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface RoomMessage {
  id: string;
  room_id: string;
  sender_id: string | null;
  sender_name: string | null;
  content: string;
  is_system: boolean;
  created_at: string;
  edited_at?: string | null;
}

export interface RoomChatSummary {
  room_id: string;
  room_name: string;
  join_code: string;
  last_message: string;
  last_message_at: string;
}

export function useRoomMessages(roomId?: string) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!roomId) { setLoading(false); return; }
    const { data } = await supabase
      .from('room_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    setMessages((data as RoomMessage[]) ?? []);
    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    setMessages([]);
    setLoading(true);
    refresh();
    if (!roomId) return;
    const channel = supabase
      .channel(`room-chat-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'room_messages',
        filter: `room_id=eq.${roomId}`,
      }, payload => {
        const incoming = payload.new as RoomMessage;
        setMessages(prev => {
          const idx = prev.findIndex(m => m.id.startsWith('opt-') && m.sender_id === incoming.sender_id && m.content === incoming.content);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = incoming;
            return next;
          }
          return prev.some(m => m.id === incoming.id) ? prev : [...prev, incoming];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'room_messages',
        filter: `room_id=eq.${roomId}`,
      }, payload => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new as RoomMessage : m));
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'room_messages',
        filter: `room_id=eq.${roomId}`,
      }, payload => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refresh, roomId]);

  const sendMessage = useCallback(async (userId: string, senderName: string, content: string) => {
    if (!roomId || !content.trim()) return;
    // Optimistic update — show the message immediately for the sender
    const optimistic: RoomMessage = {
      id: `opt-${Date.now()}`,
      room_id: roomId,
      sender_id: userId,
      sender_name: senderName,
      content: content.trim(),
      is_system: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    const { data: inserted, error } = await supabase.from('room_messages').insert({
      room_id: roomId,
      sender_id: userId,
      sender_name: senderName,
      content: content.trim(),
      is_system: false,
    }).select().single();
    if (inserted) {
      // Replace the optimistic entry with the real DB row
      setMessages(prev => prev.map(m => m.id === optimistic.id ? inserted as RoomMessage : m));
    } else if (error) {
      // Remove optimistic entry on failure
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    }
  }, [roomId]);

  const updateRoomMessage = useCallback(async (msgId: string, content: string) => {
    if (!content.trim()) return;
    const now = new Date().toISOString();
    const { error } = await supabase.from('room_messages')
      .update({ content: content.trim(), edited_at: now })
      .eq('id', msgId);
    if (error) {
      await supabase.from('room_messages').update({ content: content.trim() }).eq('id', msgId);
    }
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: content.trim(), edited_at: now } : m));
  }, []);

  const deleteRoomMessage = useCallback(async (msgId: string) => {
    await supabase.from('room_messages').delete().eq('id', msgId);
    setMessages(prev => prev.filter(m => m.id !== msgId));
  }, []);

  return { messages, loading, sendMessage, updateRoomMessage, deleteRoomMessage };
}

/** Returns all confirmed PasaBuy rooms the user owns or is a member of, for the group chat list. */
export function useRoomChats(userId?: string) {
  const [chats, setChats] = useState<RoomChatSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) { setLoading(false); return; }

    // Owned confirmed rooms (all categories)
    const { data: ownedRooms } = await supabase
      .from('rooms')
      .select('id, name, join_code, category')
      .eq('user_id', userId)
      .in('status', ['confirmed', 'completed', 'cancelled']);

    // Rooms where user is an accepted member — use join_requests (proven RLS-safe)
    const { data: approvedReqs } = await supabase
      .from('join_requests')
      .select('room_id')
      .eq('user_id', userId)
      .eq('status', 'approved');

    let memberRooms: { id: string; name: string; join_code: string }[] = [];
    if (approvedReqs?.length) {
      const ids = (approvedReqs as { room_id: string }[]).map(r => r.room_id);
      const { data: memberRoomData } = await supabase
        .from('rooms')
        .select('id, name, join_code, category')
        .in('id', ids)
        .in('status', ['confirmed', 'completed', 'cancelled']);
      memberRooms = (memberRoomData ?? []) as any;
    }

    const all = [...(ownedRooms ?? []), ...memberRooms] as any[];
    const unique = Array.from(new Map(all.map(r => [r.id, r])).values());

    if (!unique.length) { setChats([]); setLoading(false); return; }

    const summaries: RoomChatSummary[] = await Promise.all(
      unique.map(async (room: any) => {
        const { data: lastMsg } = await supabase
          .from('room_messages')
          .select('content, created_at')
          .eq('room_id', room.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        return {
          room_id: room.id,
          room_name: room.name,
          join_code: room.join_code,
          last_message: lastMsg?.content ?? 'Booking confirmed!',
          last_message_at: lastMsg?.created_at ?? new Date().toISOString(),
        };
      }),
    );

    setChats(summaries.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
    if (!userId) return;
    // Re-fetch when a join_request for this user is approved or a room status changes
    const channel = supabase
      .channel(`room-chats-membership-${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'join_requests', filter: `user_id=eq.${userId}` }, refresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms' }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refresh, userId]);

  return { chats, loading, refresh };
}

/** Returns confirmed rooms (all categories) where the user was accepted as a member (via join_requests). */
export function useAcceptedBookings(userId?: string) {
  const [bookings, setBookings] = useState<RoomChatSummary[]>([]);

  const refresh = useCallback(async () => {
    if (!userId) { setBookings([]); return; }

    const { data: approved } = await supabase
      .from('join_requests')
      .select('room_id')
      .eq('user_id', userId)
      .eq('status', 'approved');

    if (!approved?.length) { setBookings([]); return; }

    const roomIds = (approved as { room_id: string }[]).map(r => r.room_id);
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id, name, join_code')
      .in('id', roomIds)
      .eq('status', 'confirmed');

    setBookings(
      (rooms ?? []).map((r: any) => ({
        room_id: r.id,
        room_name: r.name,
        join_code: r.join_code,
        last_message: '',
        last_message_at: '',
      })),
    );
  }, [userId]);

  useEffect(() => {
    refresh();
    if (!userId) return;
    const channel = supabase
      .channel(`accepted-bookings-${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'join_requests', filter: `user_id=eq.${userId}` }, refresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms' }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refresh, userId]);

  return { bookings };
}
