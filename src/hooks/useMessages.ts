import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  edited_at?: string | null;
}

export interface Conversation {
  partner_id: string;
  partner_name: string;
  partner_avatar: string | null;
  partner_gender: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export function useConversations(userId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) return;
    // Get all messages involving this user, join partner profile
    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_id, recipient_id, content, read_at, created_at')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error || !data) { setLoading(false); return; }

    // Group by partner
    const map = new Map<string, { latest: Message; unread: number }>();
    for (const m of data as Message[]) {
      const partnerId = m.sender_id === userId ? m.recipient_id : m.sender_id;
      if (!map.has(partnerId)) {
        map.set(partnerId, { latest: m, unread: 0 });
      }
      if (m.recipient_id === userId && !m.read_at) {
        map.get(partnerId)!.unread++;
      }
    }

    if (map.size === 0) { setConversations([]); setLoading(false); return; }

    // Fetch partner profiles
    const partnerIds = [...map.keys()];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, gender, profile_tags, avatar_url')
      .in('id', partnerIds);

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    const convs: Conversation[] = partnerIds.map(pid => {
      const { latest, unread } = map.get(pid)!;
      const p: any = profileMap.get(pid) ?? {};
      const isFemale = p.gender === 'Babae' || (p.profile_tags ?? []).some((t: string) => t === 'She/Her' || t === 'She/They');
      const defaultAvatar = isFemale ? '/avatar_girl.png' : '/avatar.png';
      return {
        partner_id: pid,
        partner_name: p.display_name ?? 'Kasama',
        partner_avatar: p.avatar_url ?? defaultAvatar,
        partner_gender: p.gender ?? null,
        last_message: latest.content,
        last_message_at: latest.created_at,
        unread_count: unread,
      };
    }).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

    setConversations(convs);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
    if (!userId) return;
    const channel = supabase
      .channel(`convs-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `sender_id=eq.${userId}` }, fetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `recipient_id=eq.${userId}` }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch, userId]);

  return { conversations, loading, refresh: fetch };
}

export function useChat(userId?: string, partnerId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetch = useCallback(async () => {
    if (!userId || !partnerId) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${userId})`)
      .order('created_at', { ascending: true });
    setMessages((data as Message[]) ?? []);
    setLoading(false);
    // Mark incoming as read
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', partnerId)
      .eq('recipient_id', userId)
      .is('read_at', null);
  }, [userId, partnerId]);

  useEffect(() => {
    setMessages([]);
    setLoading(true);
    fetch();
    if (!userId || !partnerId) return;
    const channel = supabase
      .channel(`chat-${userId}-${partnerId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const m = payload.new as Message;
        if ((m.sender_id === userId && m.recipient_id === partnerId) ||
            (m.sender_id === partnerId && m.recipient_id === userId)) {
          setMessages(prev => {
            // Replace matching optimistic entry; otherwise dedup then append
            const idx = prev.findIndex(msg =>
              msg.id.startsWith('opt-') &&
              msg.sender_id === m.sender_id &&
              msg.content === m.content
            );
            if (idx !== -1) {
              const next = [...prev];
              next[idx] = m;
              return next;
            }
            return prev.some(msg => msg.id === m.id) ? prev : [...prev, m];
          });
          if (m.recipient_id === userId) {
            supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', m.id);
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, payload => {
        const m = payload.new as Message;
        if ((m.sender_id === userId && m.recipient_id === partnerId) ||
            (m.sender_id === partnerId && m.recipient_id === userId)) {
          setMessages(prev => prev.map(msg => msg.id === m.id ? m : msg));
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch, userId, partnerId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!userId || !partnerId || !content.trim()) return;
    setSending(true);
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      sender_id: userId,
      recipient_id: partnerId,
      content: content.trim(),
      read_at: null,
      created_at: new Date().toISOString(),
      edited_at: null,
    };
    setMessages(prev => [...prev, optimistic]);
    const { data: inserted, error } = await supabase.from('messages').insert({
      sender_id: userId,
      recipient_id: partnerId,
      content: content.trim(),
    }).select().single();
    if (inserted) {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? inserted as Message : m));
    } else if (error) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    }
    setSending(false);
  }, [userId, partnerId]);

  const updateMessage = useCallback(async (msgId: string, content: string) => {
    if (!content.trim()) return;
    const now = new Date().toISOString();
    const { error } = await supabase.from('messages')
      .update({ content: content.trim(), edited_at: now })
      .eq('id', msgId);
    if (error) {
      // edited_at column may not exist yet — update content only
      await supabase.from('messages').update({ content: content.trim() }).eq('id', msgId);
    }
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: content.trim(), edited_at: now } : m));
  }, []);

  const deleteMessage = useCallback(async (msgId: string) => {
    await supabase.from('messages').delete().eq('id', msgId);
    setMessages(prev => prev.filter(m => m.id !== msgId));
  }, []);

  return { messages, loading, sending, sendMessage, updateMessage, deleteMessage, refresh: fetch };
}

export function useUnreadCount(userId?: string) {
  const [count, setCount] = useState(0);

  const fetch = useCallback(async () => {
    if (!userId) return;
    const { count: c } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .is('read_at', null);
    setCount(c ?? 0);
  }, [userId]);

  useEffect(() => {
    fetch();
    if (!userId) return;
    const channel = supabase
      .channel(`unread-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `recipient_id=eq.${userId}` }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch, userId]);

  return count;
}
