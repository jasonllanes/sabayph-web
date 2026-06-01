import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Room } from '@/types';

export type RoomInput = Omit<Room, 'id' | 'created_at' | 'user_id'>;

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateJoinCode(): string {
  let code = 'KRM-';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export function useRooms(category = 'rotary') {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('rooms')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else setRooms((data as Room[]) ?? []);
    setLoading(false);
  }, [category]);

  useEffect(() => { fetch(); }, [fetch]);

  const createRoom = async (input: RoomInput): Promise<{ error: string | null; room: Room | null }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated', room: null };

    // Generate join code at insert time so no orphan codes exist
    const joinCode = generateJoinCode();
    const { data, error: err } = await supabase
      .from('rooms')
      .insert({ ...input, user_id: user.id, join_code: joinCode })
      .select()
      .single();
    if (err) return { error: err.message, room: null };
    await fetch();
    return { error: null, room: data as Room };
  };

  const updateRoom = async (id: string, input: Partial<RoomInput>) => {
    const { error: err } = await supabase.from('rooms').update(input).eq('id', id);
    if (err) return { error: err.message };
    await fetch();
    return { error: null };
  };

  const deleteRoom = async (id: string) => {
    const { error: err } = await supabase.from('rooms').delete().eq('id', id);
    if (err) return { error: err.message };
    await fetch();
    return { error: null };
  };

  const incrementMember = async (id: string) => {
    const room = rooms.find(r => r.id === id);
    if (!room) return { error: 'Room not found' };
    if (room.member_count >= room.max_members) return { error: 'Room is full' };
    return updateRoom(id, { member_count: room.member_count + 1 });
  };

  return { rooms, loading, error, createRoom, updateRoom, deleteRoom, incrementMember, refresh: fetch };
}

export async function fetchRoomByCode(joinCode: string): Promise<Room | null> {
  const { data } = await supabase
    .from('rooms')
    .select('*')
    .eq('join_code', joinCode)
    .maybeSingle();
  return data as Room | null;
}
