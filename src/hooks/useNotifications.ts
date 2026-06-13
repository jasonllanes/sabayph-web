import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { AppNotification, NotificationType } from '@/types';

/*
  ── Run once in Supabase SQL editor ──────────────────────────────────────────

  create table if not exists public.notifications (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid references auth.users(id) on delete cascade not null,
    type        text not null,
    title       text not null,
    body        text not null,
    data        jsonb not null default '{}',
    is_read     boolean not null default false,
    created_at  timestamptz not null default now()
  );

  alter table public.notifications enable row level security;

  do $$ begin
    create policy "Users manage own notifications" on public.notifications
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  exception when duplicate_object then null; end $$;

  ── Optional: DB trigger so message notifications fire server-side ─────────

  create or replace function public.notify_room_members_on_message()
  returns trigger language plpgsql security definer as $$
  declare rname text; begin
    if new.is_system then return new; end if;
    select name into rname from public.rooms where id = new.room_id;
    -- notify room owner (if not the sender)
    insert into public.notifications (user_id, type, title, body, data)
    select r.user_id, 'new_message',
      'New message in ' || coalesce(rname, 'a room'),
      coalesce(new.sender_name, 'Someone') || ': ' || left(new.content, 100),
      jsonb_build_object('room_id', new.room_id, 'room_name', coalesce(rname,''), 'sender_name', new.sender_name)
    from public.rooms r
    where r.id = new.room_id and r.user_id is distinct from new.sender_id;
    -- notify approved members (if not the sender)
    insert into public.notifications (user_id, type, title, body, data)
    select jr.user_id, 'new_message',
      'New message in ' || coalesce(rname, 'a room'),
      coalesce(new.sender_name, 'Someone') || ': ' || left(new.content, 100),
      jsonb_build_object('room_id', new.room_id, 'room_name', coalesce(rname,''), 'sender_name', new.sender_name)
    from public.join_requests jr
    where jr.room_id = new.room_id and jr.status = 'approved'
      and jr.user_id is distinct from new.sender_id;
    return new;
  end; $$;

  drop trigger if exists on_room_message_insert on public.room_messages;
  create trigger on_room_message_insert
    after insert on public.room_messages
    for each row execute function public.notify_room_members_on_message();
*/

export { type AppNotification, type NotificationType };

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(60);
    if (error?.code === '42P01') { setAvailable(false); setLoading(false); return; }
    if (error) { setLoading(false); return; }
    setNotifications((data as AppNotification[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    refresh();
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => setNotifications(prev => [payload.new as AppNotification, ...prev]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => setNotifications(prev => prev.map(n => n.id === (payload.new as AppNotification).id ? payload.new as AppNotification : n)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => setNotifications(prev => prev.filter(n => n.id !== (payload.old as any).id)))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refresh, userId]);

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    if (userId) await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
  }, [userId]);

  const remove = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await supabase.from('notifications').delete().eq('id', id);
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    if (userId) await supabase.from('notifications').delete().eq('user_id', userId);
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return { notifications, loading, available, unreadCount, refresh, markRead, markAllRead, remove, clearAll };
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data: Record<string, any> = {},
): Promise<void> {
  try {
    await supabase.from('notifications').insert({ user_id: userId, type, title, body, data });
  } catch { /* silently skip if table doesn't exist yet */ }
}
