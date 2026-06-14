import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { ArrowLeft, Send, MessageSquare, UserPlus, Search, X, Loader, Users, Info, MoreVertical } from 'lucide-react';
import { useConversations, useChat } from '@/hooks/useMessages';
import { useRoomChats, useRoomMessages } from '@/hooks/useRoomChat';
import { useConnections } from '@/hooks/useConnections';
import { supabase } from '@/lib/supabase';
import { getDefaultAvatar } from '@/components/app/tagConstants';
import type { Theme, Room, BookingRating } from '@/types';
import { BookingDetailSheet, CancelModal, RatingModal } from '@/components/app/BookingModals';

interface MessagesTabProps {
  theme: Theme;
  userId?: string;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

type ReactionGroup = { emoji: string; userIds: string[] };
type ReactionsMap = Record<string, ReactionGroup[]>;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

async function loadReactionsFromDB(messageIds: string[], contextType: 'dm' | 'group'): Promise<ReactionsMap> {
  if (!messageIds.length) return {};
  try {
    const { data } = await supabase.from('message_reactions')
      .select('message_id, user_id, emoji')
      .in('message_id', messageIds)
      .eq('context_type', contextType);
    if (!data) return {};
    const grouped: ReactionsMap = {};
    for (const r of data as { message_id: string; user_id: string; emoji: string }[]) {
      if (!grouped[r.message_id]) grouped[r.message_id] = [];
      const g = grouped[r.message_id].find(x => x.emoji === r.emoji);
      if (g) g.userIds.push(r.user_id);
      else grouped[r.message_id].push({ emoji: r.emoji, userIds: [r.user_id] });
    }
    return grouped;
  } catch {
    return {};
  }
}

// ── Pull-to-refresh ──────────────────────────────────────────────────────────

function PullToRefresh({ children, onRefresh, theme: T, style }: {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  theme: Theme;
  style?: React.CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const pullYRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  const [pullDisplay, setPullDisplay] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const THRESHOLD = 68;

  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if ((containerRef.current?.scrollTop ?? 0) > 2 || refreshingRef.current) return;
    startYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!startYRef.current || refreshingRef.current) return;
    if ((containerRef.current?.scrollTop ?? 0) > 2) { startYRef.current = 0; return; }
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy > 0) {
      const clamped = Math.min(dy * 0.5, THRESHOLD + 16);
      pullYRef.current = clamped;
      setPullDisplay(clamped);
      setPulling(true);
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    const py = pullYRef.current;
    startYRef.current = 0;
    pullYRef.current = 0;
    setPulling(false);
    if (py >= THRESHOLD && !refreshingRef.current) {
      refreshingRef.current = true;
      setRefreshing(true);
      setPullDisplay(THRESHOLD);
      try { await onRefreshRef.current(); } finally {
        refreshingRef.current = false;
        setRefreshing(false);
        setPullDisplay(0);
      }
    } else {
      setPullDisplay(0);
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDisplay / THRESHOLD, 1);

  return (
    <div ref={containerRef} style={{ overflowY: 'auto', ...style }}>
      <div style={{
        height: refreshing ? 52 : pullDisplay,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        transition: pulling ? 'none' : 'height 200ms ease-out',
        flexShrink: 0,
      }}>
        {(pullDisplay > 4 || refreshing) && (
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            border: `2.5px solid ${T.border}`,
            borderTopColor: T.primary,
            animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
            transform: !refreshing ? `rotate(${progress * 270}deg)` : undefined,
            transition: (!refreshing && pulling) ? 'none' : 'opacity 150ms',
            opacity: refreshing ? 1 : Math.min(progress * 1.5, 1),
          }} />
        )}
      </div>
      {children}
    </div>
  );
}

// ── Emoji picker popup ───────────────────────────────────────────────────────

function EmojiPicker({ onPick, onClose, theme: T, align = 'left' }: { onPick: (e: string) => void; onClose: () => void; theme: Theme; align?: 'left' | 'right' }) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9900 }} onClick={onClose} />
      <div style={{ position: 'absolute', bottom: '100%', ...(align === 'right' ? { right: 0 } : { left: 0 }), marginBottom: 6, zIndex: 9901, background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 16, padding: '8px 10px', display: 'flex', gap: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}>
        {QUICK_EMOJIS.map(e => (
          <button key={e} onClick={() => { onPick(e); onClose(); }}
            style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 120ms' }}
            onMouseEnter={ev => (ev.currentTarget.style.background = T.surfaceAlt)}
            onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
          >{e}</button>
        ))}
      </div>
    </>
  );
}

// ── Reactions bar ────────────────────────────────────────────────────────────

function ReactionsBar({ reactions, userId, onToggle, theme: T }: { reactions: ReactionGroup[]; userId: string; onToggle: (emoji: string) => void; theme: Theme }) {
  if (!reactions.length) return null;
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
      {reactions.map(r => {
        const mine = r.userIds.includes(userId);
        return (
          <button key={r.emoji} onClick={() => onToggle(r.emoji)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, border: `1.5px solid ${mine ? T.primary : T.border}`, background: mine ? `${T.primary}18` : T.surfaceAlt, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: mine ? T.primary : T.textMuted, fontFamily: 'inherit', transition: 'all 120ms' }}>
            {r.emoji} <span style={{ fontSize: 11 }}>{r.userIds.length}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Message action menu (⋮ button + dropdown) ────────────────────────────────

function MenuBtn({ label, color, hoverBg, onClick }: { label: string; color: string; hoverBg: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: 'transparent', color, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'background 100ms' }}
      onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >{label}</button>
  );
}

function MessageActions({ mine, side, isOpen, showEmoji, onToggle, onClose, onShowEmoji, onHideEmoji, onReact, onEdit, onDelete, theme: T }: {
  mine: boolean; side: 'left' | 'right';
  isOpen: boolean; showEmoji: boolean;
  onToggle: () => void; onClose: () => void;
  onShowEmoji: () => void; onHideEmoji: () => void;
  onReact: (e: string) => void; onEdit: () => void; onDelete: () => void;
  theme: Theme;
}) {
  return (
    <div style={{ position: 'relative', flexShrink: 0, alignSelf: 'center' }}>
      <button
        onClick={ev => { ev.stopPropagation(); onToggle(); }}
        style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: (isOpen || showEmoji) ? `${T.text}10` : 'transparent', color: T.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 120ms' }}
        onMouseEnter={ev => (ev.currentTarget.style.background = `${T.text}10`)}
        onMouseLeave={ev => { if (!isOpen && !showEmoji) ev.currentTarget.style.background = 'transparent'; }}
      >
        <MoreVertical size={15} />
      </button>
      {showEmoji && <EmojiPicker theme={T} align={side} onPick={e => { onReact(e); onHideEmoji(); }} onClose={onHideEmoji} />}
      {isOpen && !showEmoji && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 8000 }} onClick={onClose} />
          <div style={{ position: 'absolute', bottom: '100%', marginBottom: 4, ...(side === 'left' ? { left: 0 } : { right: 0 }), zIndex: 8001, background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 12, padding: 4, minWidth: 130, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <MenuBtn label="😊  React" color={T.text} hoverBg={T.surfaceAlt} onClick={onShowEmoji} />
            {mine && (
              <>
                <MenuBtn label="✏️  Edit" color={T.text} hoverBg={T.surfaceAlt} onClick={() => { onEdit(); onClose(); }} />
                <div style={{ height: 1, background: T.border, margin: '2px 4px' }} />
                <MenuBtn label="🗑️  Delete" color="#DC2626" hoverBg="#FEF2F2" onClick={() => { onDelete(); onClose(); }} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── New conversation picker ──────────────────────────────────────────────────

interface Friend { id: string; display_name: string; gender: string | null; profile_tags: string[] | null; avatar_url: string | null; }

function NewConvPicker({ userId, theme: T, onPick, onClose }: { userId: string; theme: Theme; onPick: (f: Friend) => void; onClose: () => void }) {
  const { connections } = useConnections(userId);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const accepted = connections.filter(c => c.status === 'accepted');
    if (!accepted.length) { setFriends([]); return; }
    const ids = accepted.map(c => c.from_user_id === userId ? c.to_user_id : c.from_user_id);
    supabase.from('profiles').select('id, display_name, gender, profile_tags, avatar_url').in('id', ids)
      .then(({ data }) => setFriends((data as Friend[]) ?? []));
  }, [connections, userId]);

  const filtered = friends.filter(f => f.display_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', background: T.surface, borderRadius: '20px 20px 0 0', border: `2px solid ${T.border}`, borderBottom: 'none', maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: T.border, margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 className="font-display" style={{ fontSize: 17, fontWeight: 800, color: T.text, margin: 0 }}>New Message</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted }}><X size={18} /></button>
          </div>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search kasama…"
              style={{ width: '100%', height: 40, paddingLeft: 36, paddingRight: 12, fontSize: 14, fontFamily: 'inherit', border: `1.5px solid ${T.border}`, borderRadius: 10, background: T.bg, color: T.text, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 8px', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: T.textMuted }}>
              <UserPlus size={28} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ fontSize: 13, margin: 0 }}>{friends.length === 0 ? 'Add kasama first to start a conversation.' : 'No match found.'}</p>
            </div>
          ) : filtered.map(f => (
            <button key={f.id} onClick={() => onPick(f)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 150ms' }}
              onMouseEnter={e => (e.currentTarget.style.background = `${T.text}08`)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <img src={f.avatar_url ?? getDefaultAvatar(f.gender, f.profile_tags)} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${T.border}` }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{f.display_name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 1-on-1 chat view ─────────────────────────────────────────────────────────

function ChatView({ userId, partnerId, partnerName, partnerAvatar, theme: T, onBack }: {
  userId: string; partnerId: string; partnerName: string; partnerAvatar: string; theme: Theme; onBack: () => void;
}) {
  const { messages, loading, sending, sendMessage, updateMessage, deleteMessage, refresh } = useChat(userId, partnerId);
  const [draft, setDraft] = useState('');
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [showEmojiFor, setShowEmojiFor] = useState<string | null>(null);
  const [reactions, setReactions] = useState<ReactionsMap>({});
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = (msgId: string) => () => {
    longPressRef.current = setTimeout(() => {
      setActiveMenuMsgId(msgId);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };
  const handleTouchEnd = () => {
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!messages.length) return;
    loadReactionsFromDB(messages.map(m => m.id), 'dm').then(setReactions);
  }, [messages.length]);

  const toggleReaction = useCallback(async (msgId: string, emoji: string) => {
    const current = reactions[msgId] ?? [];
    const group = current.find(r => r.emoji === emoji);
    const mine = group?.userIds.includes(userId);

    setReactions(prev => {
      const curr = prev[msgId] ?? [];
      if (mine) {
        return { ...prev, [msgId]: curr.map(r => r.emoji === emoji ? { ...r, userIds: r.userIds.filter(id => id !== userId) } : r).filter(r => r.userIds.length > 0) };
      }
      const found = curr.find(r => r.emoji === emoji);
      if (found) return { ...prev, [msgId]: curr.map(r => r.emoji === emoji ? { ...r, userIds: [...r.userIds, userId] } : r) };
      return { ...prev, [msgId]: [...curr, { emoji, userIds: [userId] }] };
    });

    try {
      if (mine) {
        await supabase.from('message_reactions').delete().eq('message_id', msgId).eq('user_id', userId).eq('emoji', emoji).eq('context_type', 'dm');
      } else {
        await supabase.from('message_reactions').insert({ message_id: msgId, context_type: 'dm', user_id: userId, emoji });
      }
    } catch {}
  }, [reactions, userId]);

  const startEdit = (msgId: string, content: string) => { setEditingMsgId(msgId); setEditDraft(content); setHoveredMsgId(null); setActiveMenuMsgId(null); };

  const saveEdit = async () => {
    if (!editingMsgId || !editDraft.trim()) return;
    await updateMessage(editingMsgId, editDraft.trim());
    setEditingMsgId(null);
    setEditDraft('');
  };

  const send = async () => {
    if (!draft.trim()) return;
    const text = draft;
    setDraft('');
    await sendMessage(text);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: T.surface, borderBottom: `1.5px solid ${T.border}` }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', padding: 4 }}>
          <ArrowLeft size={20} />
        </button>
        <img src={partnerAvatar} alt={partnerName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${T.border}` }} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>{partnerName}</p>
          <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>Kasama</p>
        </div>
      </div>

      <PullToRefresh onRefresh={refresh} theme={T} style={{ flex: 1 }}>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 4, minHeight: '100%' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: T.textMuted, gap: 8 }}>
            <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
          </div>
        ) : messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: T.textMuted, gap: 8 }}>
            <MessageSquare size={32} style={{ opacity: 0.3 }} />
            <p style={{ fontSize: 13, margin: 0 }}>No messages yet. Say hi!</p>
          </div>
        ) : (
          messages.map(m => {
            const mine = m.sender_id === userId;
            const isEditing = editingMsgId === m.id;
            const msgReactions = reactions[m.id] ?? [];
            const showMoreBtn = (hoveredMsgId === m.id || activeMenuMsgId === m.id || showEmojiFor === m.id) && !isEditing;
            const menuOpen = activeMenuMsgId === m.id && showEmojiFor !== m.id;
            const emojiOpen = showEmojiFor === m.id;

            return (
              <div key={m.id} style={{ marginBottom: 6 }}>
                <div
                  style={{ display: 'flex', alignItems: 'flex-end', justifyContent: mine ? 'flex-end' : 'flex-start', gap: 4 }}
                  onMouseEnter={() => setHoveredMsgId(m.id)}
                  onMouseLeave={() => { if (activeMenuMsgId !== m.id && showEmojiFor !== m.id) setHoveredMsgId(null); }}
                  onTouchStart={handleTouchStart(m.id)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                  onContextMenu={e => e.preventDefault()}
                >
                  {/* ⋮ on left — for own messages */}
                  {mine && showMoreBtn && (
                    <MessageActions mine={mine} side="right"
                      isOpen={menuOpen} showEmoji={emojiOpen}
                      onToggle={() => setActiveMenuMsgId(prev => prev === m.id ? null : m.id)}
                      onClose={() => setActiveMenuMsgId(null)}
                      onShowEmoji={() => { setShowEmojiFor(m.id); setActiveMenuMsgId(null); }}
                      onHideEmoji={() => setShowEmojiFor(null)}
                      onReact={e => toggleReaction(m.id, e)}
                      onEdit={() => startEdit(m.id, m.content)}
                      onDelete={() => deleteMessage(m.id)}
                      theme={T}
                    />
                  )}

                  {/* Bubble */}
                  {isEditing ? (
                    <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <textarea
                        value={editDraft}
                        onChange={e => setEditDraft(e.target.value)}
                        autoFocus rows={2}
                        style={{ padding: '9px 13px', borderRadius: 16, border: `1.5px solid ${T.primary}`, background: T.bg, color: T.text, fontSize: 14, lineHeight: 1.5, fontFamily: '"DM Sans",system-ui,sans-serif', resize: 'none', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => setEditingMsgId(null)} style={{ padding: '4px 12px', borderRadius: 8, border: `1.5px solid ${T.border}`, background: T.surfaceAlt, color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                        <button onClick={saveEdit} style={{ padding: '4px 12px', borderRadius: 8, border: 'none', background: T.primary, color: T.bg, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ maxWidth: '70%', padding: '9px 13px', borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: mine ? T.primary : T.surfaceAlt, color: mine ? T.bg : T.text, fontSize: 14, lineHeight: 1.5, fontFamily: '"DM Sans",system-ui,sans-serif', wordBreak: 'break-word' }}>
                      {m.content}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 3 }}>
                        {m.edited_at && <span style={{ fontSize: 9, opacity: 0.6, fontStyle: 'italic' }}>Edited</span>}
                        <span style={{ fontSize: 10, opacity: 0.6 }}>{timeAgo(m.created_at)}</span>
                      </div>
                    </div>
                  )}

                  {/* ⋮ on right — for others' messages */}
                  {!mine && showMoreBtn && (
                    <MessageActions mine={mine} side="left"
                      isOpen={menuOpen} showEmoji={emojiOpen}
                      onToggle={() => setActiveMenuMsgId(prev => prev === m.id ? null : m.id)}
                      onClose={() => setActiveMenuMsgId(null)}
                      onShowEmoji={() => { setShowEmojiFor(m.id); setActiveMenuMsgId(null); }}
                      onHideEmoji={() => setShowEmojiFor(null)}
                      onReact={e => toggleReaction(m.id, e)}
                      onEdit={() => startEdit(m.id, m.content)}
                      onDelete={() => deleteMessage(m.id)}
                      theme={T}
                    />
                  )}
                </div>

                {/* Reactions */}
                {msgReactions.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginTop: 2 }}>
                    <ReactionsBar reactions={msgReactions} userId={userId} onToggle={e => toggleReaction(m.id, e)} theme={T} />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
        </div>
      </PullToRefresh>

      <div style={{ flexShrink: 0, display: 'flex', gap: 8, padding: '12px 16px', background: T.surface, borderTop: `1.5px solid ${T.border}` }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type a message…"
          maxLength={1000}
          style={{ flex: 1, height: 44, padding: '0 14px', fontSize: 14, fontFamily: '"DM Sans",system-ui,sans-serif', border: `1.5px solid ${T.border}`, borderRadius: 22, background: T.bg, color: T.text, outline: 'none' }}
        />
        <button onClick={send} disabled={!draft.trim() || sending}
          style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: draft.trim() ? T.primary : T.border, color: draft.trim() ? T.bg : T.textMuted, cursor: draft.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 150ms' }}>
          {sending ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}

// ── Group / Tracking GC view ─────────────────────────────────────────────────

function GroupChatView({ userId, userName, roomId, roomName, joinCode, theme: T, onBack }: {
  userId: string; userName: string; roomId: string; roomName: string; joinCode: string; theme: Theme; onBack: () => void;
}) {
  const { messages, loading, sendMessage, updateRoomMessage, deleteRoomMessage, refresh } = useRoomMessages(roomId);
  const [draft, setDraft] = useState('');
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [showEmojiFor, setShowEmojiFor] = useState<string | null>(null);
  const [reactions, setReactions] = useState<ReactionsMap>({});
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = (msgId: string) => () => {
    longPressRef.current = setTimeout(() => {
      setActiveMenuMsgId(msgId);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };
  const handleTouchEnd = () => {
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
  };

  const [room, setRoom]         = useState<Room | null>(null);
  const [courier, setCourier]   = useState<{ id: string; name: string } | null>(null);
  const [myRating, setMyRating] = useState<BookingRating | null>(null);

  const [showDetail, setShowDetail] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    supabase.from('rooms').select('*').eq('id', roomId).maybeSingle()
      .then(({ data }) => data && setRoom(data as Room));
    supabase.from('join_requests').select('user_id, display_name').eq('room_id', roomId).eq('status', 'approved').maybeSingle()
      .then(({ data }) => data && setCourier({ id: data.user_id, name: data.display_name ?? 'Courier' }));
    supabase.from('booking_ratings').select('*').eq('room_id', roomId).eq('rater_id', userId).maybeSingle()
      .then(({ data }) => data && setMyRating(data as BookingRating));
  }, [roomId, userId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!messages.length) return;
    const ids = messages.filter(m => !m.is_system).map(m => m.id);
    if (!ids.length) return;
    loadReactionsFromDB(ids, 'group').then(setReactions);
  }, [messages.length]);

  const toggleReaction = useCallback(async (msgId: string, emoji: string) => {
    const current = reactions[msgId] ?? [];
    const group = current.find(r => r.emoji === emoji);
    const mine = group?.userIds.includes(userId);

    setReactions(prev => {
      const curr = prev[msgId] ?? [];
      if (mine) {
        return { ...prev, [msgId]: curr.map(r => r.emoji === emoji ? { ...r, userIds: r.userIds.filter(id => id !== userId) } : r).filter(r => r.userIds.length > 0) };
      }
      const found = curr.find(r => r.emoji === emoji);
      if (found) return { ...prev, [msgId]: curr.map(r => r.emoji === emoji ? { ...r, userIds: [...r.userIds, userId] } : r) };
      return { ...prev, [msgId]: [...curr, { emoji, userIds: [userId] }] };
    });

    try {
      if (mine) {
        await supabase.from('message_reactions').delete().eq('message_id', msgId).eq('user_id', userId).eq('emoji', emoji).eq('context_type', 'group');
      } else {
        await supabase.from('message_reactions').insert({ message_id: msgId, context_type: 'group', user_id: userId, emoji });
      }
    } catch {}
  }, [reactions, userId]);

  const startEdit = (msgId: string, content: string) => { setEditingMsgId(msgId); setEditDraft(content); setHoveredMsgId(null); setActiveMenuMsgId(null); };

  const saveEdit = async () => {
    if (!editingMsgId || !editDraft.trim()) return;
    await updateRoomMessage(editingMsgId, editDraft.trim());
    setEditingMsgId(null);
    setEditDraft('');
  };

  const isOwner   = room?.user_id === userId;
  const roomStatus = room?.status ?? 'confirmed';
  const isActive  = roomStatus === 'confirmed';
  const isDone    = roomStatus === 'completed';
  const otherPartyId   = isOwner ? courier?.id   : room?.user_id;
  const otherPartyName = isOwner ? (courier?.name ?? 'Courier') : (room?.host_name ?? 'Requester');

  const postSystem = async (content: string) => {
    await supabase.from('room_messages').insert({ room_id: roomId, sender_id: userId, sender_name: 'SabayPH', content, is_system: true });
  };

  const handleMarkComplete = async () => {
    setActionBusy(true);
    await supabase.from('rooms').update({ status: 'completed' }).eq('id', roomId);
    await postSystem('🎉 Booking marked as completed! Thank you — please rate your experience.');
    setRoom(r => r ? { ...r, status: 'completed' } : r);
    setActionBusy(false);
    setShowDetail(false);
    setShowRating(true);
  };

  const handleCancel = async (reason: string) => {
    setActionBusy(true);
    await supabase.from('rooms').update({ status: 'cancelled' }).eq('id', roomId);
    await supabase.from('join_requests').update({ status: 'rejected' }).eq('room_id', roomId).eq('status', 'approved');
    await postSystem(`❌ Booking cancelled. Reason: ${reason}`);
    setRoom(r => r ? { ...r, status: 'cancelled' } : r);
    setActionBusy(false);
    setShowCancel(false);
    setShowDetail(false);
  };

  const handleRatingSubmit = async (scores: { overall: number; communication: number; timeliness: number; reliability: number; comment: string }) => {
    if (!otherPartyId) return;
    setActionBusy(true);
    const { data } = await supabase.from('booking_ratings').insert({
      room_id: roomId, rater_id: userId, ratee_id: otherPartyId,
      overall_score: scores.overall, communication_score: scores.communication,
      timeliness_score: scores.timeliness, reliability_score: scores.reliability,
      comment: scores.comment || null,
    }).select().maybeSingle();
    if (data) setMyRating(data as BookingRating);
    setActionBusy(false);
    setShowRating(false);
  };

  const send = async () => {
    if (!draft.trim()) return;
    const text = draft; setDraft('');
    await sendMessage(userId, userName, text);
  };

  const statusChip = isDone
    ? { label: 'Completed', bg: '#DCFCE7', color: '#15803D' }
    : roomStatus === 'cancelled'
      ? { label: 'Cancelled', bg: '#FEF2F2', color: '#B91C1C' }
      : { label: 'Active', bg: '#FEF3E2', color: '#D97706' };

  const inputDisabled = !isActive;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: T.surface, borderBottom: `1.5px solid ${T.border}` }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, padding: 4, display: 'flex', flexShrink: 0 }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: '#FEF3E2', border: '2px solid #F9C07E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Users size={15} style={{ color: '#D97706' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Tracking GC · {joinCode}</p>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: statusChip.bg, color: statusChip.color, flexShrink: 0 }}>{statusChip.label}</span>
          </div>
          <p style={{ fontSize: 11, color: T.textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{roomName}</p>
        </div>
        <button onClick={() => setShowDetail(true)}
          style={{ width: 34, height: 34, borderRadius: '50%', border: `1.5px solid ${T.border}`, background: T.surfaceAlt, color: T.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Info size={15} />
        </button>
      </div>

      {/* Courier rating prompt */}
      {isDone && !isOwner && !myRating && (
        <button onClick={() => setShowRating(true)}
          style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'linear-gradient(90deg,#D97706,#B45309)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left' }}>
          <span style={{ fontSize: 18 }}>⭐</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#fff', margin: 0 }}>Rate your requester!</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', margin: 0 }}>How was working with {room?.host_name ?? 'them'}?</p>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.22)', padding: '3px 10px', borderRadius: 10 }}>Rate →</span>
        </button>
      )}

      {/* Messages */}
      <PullToRefresh onRefresh={refresh} theme={T} style={{ flex: 1 }}>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 4, minHeight: '100%' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: T.textMuted, gap: 8 }}>
            <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
          </div>
        ) : messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: T.textMuted, gap: 8 }}>
            <Users size={32} style={{ opacity: 0.3 }} />
            <p style={{ fontSize: 13, margin: 0 }}>No messages yet.</p>
          </div>
        ) : (
          messages.map(m => {
            if (m.is_system) {
              const isCancelMsg = m.content.startsWith('❌');
              const isDoneMsg   = m.content.startsWith('🎉');
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                  <div style={{ maxWidth: '85%', padding: '8px 14px', borderRadius: 12, background: isCancelMsg ? '#FEF2F2' : isDoneMsg ? '#EDE9FE' : '#DCFCE7', border: `1px solid ${isCancelMsg ? '#FCA5A5' : isDoneMsg ? '#C4B5FD' : '#86EFAC'}`, fontSize: 12, color: isCancelMsg ? '#B91C1C' : isDoneMsg ? '#6D28D9' : '#15803D', fontFamily: '"DM Sans",system-ui,sans-serif', textAlign: 'center', lineHeight: 1.5 }}>
                    {m.content}
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3 }}>{timeAgo(m.created_at)}</div>
                  </div>
                </div>
              );
            }

            const mine = m.sender_id === userId;
            const isEditing = editingMsgId === m.id;
            const msgReactions = reactions[m.id] ?? [];
            const showMoreBtn = (hoveredMsgId === m.id || activeMenuMsgId === m.id || showEmojiFor === m.id) && !isEditing;
            const menuOpen = activeMenuMsgId === m.id && showEmojiFor !== m.id;
            const emojiOpen = showEmojiFor === m.id;

            return (
              <div key={m.id} style={{ marginBottom: 6 }}>
                {!mine && m.sender_name && <p style={{ fontSize: 11, color: T.textMuted, margin: '0 0 3px 4px', fontWeight: 600 }}>{m.sender_name}</p>}
                <div
                  style={{ display: 'flex', alignItems: 'flex-end', justifyContent: mine ? 'flex-end' : 'flex-start', gap: 4 }}
                  onMouseEnter={() => setHoveredMsgId(m.id)}
                  onMouseLeave={() => { if (activeMenuMsgId !== m.id && showEmojiFor !== m.id) setHoveredMsgId(null); }}
                  onTouchStart={handleTouchStart(m.id)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                  onContextMenu={e => e.preventDefault()}
                >
                  {/* ⋮ on left — for own messages */}
                  {mine && showMoreBtn && (
                    <MessageActions mine={mine} side="right"
                      isOpen={menuOpen} showEmoji={emojiOpen}
                      onToggle={() => setActiveMenuMsgId(prev => prev === m.id ? null : m.id)}
                      onClose={() => setActiveMenuMsgId(null)}
                      onShowEmoji={() => { setShowEmojiFor(m.id); setActiveMenuMsgId(null); }}
                      onHideEmoji={() => setShowEmojiFor(null)}
                      onReact={e => toggleReaction(m.id, e)}
                      onEdit={() => startEdit(m.id, m.content)}
                      onDelete={() => deleteRoomMessage(m.id)}
                      theme={T}
                    />
                  )}

                  {/* Bubble */}
                  {isEditing ? (
                    <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <textarea
                        value={editDraft}
                        onChange={e => setEditDraft(e.target.value)}
                        autoFocus rows={2}
                        style={{ padding: '9px 13px', borderRadius: 16, border: `1.5px solid ${T.primary}`, background: T.bg, color: T.text, fontSize: 14, lineHeight: 1.5, fontFamily: '"DM Sans",system-ui,sans-serif', resize: 'none', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => setEditingMsgId(null)} style={{ padding: '4px 12px', borderRadius: 8, border: `1.5px solid ${T.border}`, background: T.surfaceAlt, color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                        <button onClick={saveEdit} style={{ padding: '4px 12px', borderRadius: 8, border: 'none', background: T.primary, color: T.bg, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ maxWidth: '70%', padding: '9px 13px', borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: mine ? T.primary : T.surfaceAlt, color: mine ? T.bg : T.text, fontSize: 14, lineHeight: 1.5, fontFamily: '"DM Sans",system-ui,sans-serif', wordBreak: 'break-word' }}>
                      {m.content}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 3 }}>
                        {m.edited_at && <span style={{ fontSize: 9, opacity: 0.6, fontStyle: 'italic' }}>Edited</span>}
                        <span style={{ fontSize: 10, opacity: 0.6 }}>{timeAgo(m.created_at)}</span>
                      </div>
                    </div>
                  )}

                  {/* ⋮ on right — for others' messages */}
                  {!mine && showMoreBtn && (
                    <MessageActions mine={mine} side="left"
                      isOpen={menuOpen} showEmoji={emojiOpen}
                      onToggle={() => setActiveMenuMsgId(prev => prev === m.id ? null : m.id)}
                      onClose={() => setActiveMenuMsgId(null)}
                      onShowEmoji={() => { setShowEmojiFor(m.id); setActiveMenuMsgId(null); }}
                      onHideEmoji={() => setShowEmojiFor(null)}
                      onReact={e => toggleReaction(m.id, e)}
                      onEdit={() => startEdit(m.id, m.content)}
                      onDelete={() => deleteRoomMessage(m.id)}
                      theme={T}
                    />
                  )}
                </div>

                {/* Reactions */}
                {msgReactions.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginTop: 2 }}>
                    <ReactionsBar reactions={msgReactions} userId={userId} onToggle={e => toggleReaction(m.id, e)} theme={T} />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
        </div>
      </PullToRefresh>

      {/* Input */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 8, padding: '12px 16px', background: T.surface, borderTop: `1.5px solid ${T.border}` }}>
        <input
          value={draft}
          onChange={e => !inputDisabled && setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !inputDisabled) { e.preventDefault(); send(); } }}
          placeholder={inputDisabled ? `Chat closed — booking ${roomStatus}` : 'Type a message…'}
          disabled={inputDisabled}
          maxLength={1000}
          style={{ flex: 1, height: 44, padding: '0 14px', fontSize: 14, fontFamily: '"DM Sans",system-ui,sans-serif', border: `1.5px solid ${T.border}`, borderRadius: 22, background: inputDisabled ? T.surfaceAlt : T.bg, color: T.text, outline: 'none', opacity: inputDisabled ? 0.6 : 1 }}
        />
        <button onClick={send} disabled={!draft.trim() || inputDisabled}
          style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: draft.trim() && !inputDisabled ? T.primary : T.border, color: draft.trim() && !inputDisabled ? T.bg : T.textMuted, cursor: draft.trim() && !inputDisabled ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 150ms' }}>
          <Send size={16} />
        </button>
      </div>

      {/* Modals */}
      {showDetail && room && (
        <BookingDetailSheet room={room} isOwner={isOwner} courierName={courier?.name ?? 'Courier'} theme={T}
          onClose={() => setShowDetail(false)}
          onCancel={() => { setShowDetail(false); setShowCancel(true); }}
          onComplete={handleMarkComplete}
        />
      )}
      {showCancel && (
        <CancelModal theme={T} submitting={actionBusy} onConfirm={handleCancel} onClose={() => setShowCancel(false)} />
      )}
      {showRating && (
        <RatingModal
          rateeRole={isOwner ? 'courier' : 'requester'}
          rateeName={otherPartyName}
          existingRating={myRating}
          theme={T}
          submitting={actionBusy}
          onSubmit={handleRatingSubmit}
          onClose={() => setShowRating(false)}
        />
      )}
    </div>
  );
}

// ── Conversations skeleton ───────────────────────────────────────────────────

function ConversationsSkeleton({ theme: T }: { theme: Theme }) {
  return (
    <div style={{ padding: '0 8px' }}>
      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}} .sk-msg{border-radius:8px;background:linear-gradient(90deg,${T.surfaceAlt} 25%,${T.border} 50%,${T.surfaceAlt} 75%);background-size:800px 100%;animation:shimmer 1.4s infinite linear}`}</style>
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px', marginBottom: 2 }}>
          <div className="sk-msg" style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div className="sk-msg" style={{ width: `${55 + i * 8}%`, height: 14 }} />
            <div className="sk-msg" style={{ width: `${40 + i * 5}%`, height: 12, borderRadius: 6 }} />
          </div>
          <div className="sk-msg" style={{ width: 28, height: 11, borderRadius: 4, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

// ── Main tab ─────────────────────────────────────────────────────────────────

type ActiveChat =
  | { kind: 'dm'; id: string; name: string; avatar: string }
  | { kind: 'group'; roomId: string; roomName: string; joinCode: string };

export default function MessagesTab({ theme: T, userId }: MessagesTabProps) {
  const { conversations, loading: dmLoading, refresh: refreshDMs } = useConversations(userId);
  const { chats: groupChats, loading: gcLoading, refresh: refreshGCs } = useRoomChats(userId);
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!userId) return;
    supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle()
      .then(({ data }) => setUserName(data?.display_name ?? 'Kasama'));
  }, [userId]);

  const handleRefreshInbox = useCallback(async () => {
    await Promise.all([refreshDMs(), refreshGCs()]);
  }, [refreshDMs, refreshGCs]);

  if (activeChat && userId) {
    if (activeChat.kind === 'group') {
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <GroupChatView
            userId={userId}
            userName={userName}
            roomId={activeChat.roomId}
            roomName={activeChat.roomName}
            joinCode={activeChat.joinCode}
            theme={T}
            onBack={() => setActiveChat(null)}
          />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      );
    }
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <ChatView
          userId={userId}
          partnerId={activeChat.id}
          partnerName={activeChat.name}
          partnerAvatar={activeChat.avatar}
          theme={T}
          onBack={() => setActiveChat(null)}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const loading = dmLoading || gcLoading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '24px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.bg }}>
        <div>
          <p className="font-pixel" style={{ fontSize: 13, color: T.accent, margin: '0 0 2px', letterSpacing: 1 }}>DIRECT MESSAGES</p>
          <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0 }}>Messages</h2>
        </div>
        <button onClick={() => setShowPicker(true)}
          style={{ height: 38, padding: '0 16px', borderRadius: 19, border: 'none', background: T.primary, color: T.bg, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Send size={13} /> New
        </button>
      </div>

      <PullToRefresh onRefresh={handleRefreshInbox} theme={T} style={{ flex: 1, padding: '0 8px' }}>
        {loading ? (
          <ConversationsSkeleton theme={T} />
        ) : (
          <>
            {groupChats.length > 0 && (
              <>
                <div style={{ padding: '4px 12px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={12} style={{ color: T.textMuted }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5 }}>GROUP CHATS</span>
                </div>
                {groupChats.map(gc => (
                  <button key={gc.room_id}
                    onClick={() => setActiveChat({ kind: 'group', roomId: gc.room_id, roomName: gc.room_name, joinCode: gc.join_code })}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px', borderRadius: 14, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 150ms', marginBottom: 2 }}
                    onMouseEnter={e => (e.currentTarget.style.background = `${T.text}08`)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FEF3E2', border: '2px solid #F9C07E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Users size={20} style={{ color: '#D97706' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Tracking GC · {gc.join_code}
                        </span>
                        <span style={{ fontSize: 11, color: T.textMuted, flexShrink: 0, marginLeft: 8 }}>{timeAgo(gc.last_message_at)}</span>
                      </div>
                      <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gc.room_name}</p>
                      <p style={{ fontSize: 12, color: T.textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gc.last_message}</p>
                    </div>
                  </button>
                ))}
                {conversations.length > 0 && (
                  <div style={{ height: 1, background: T.border, margin: '8px 12px 10px' }} />
                )}
              </>
            )}

            {conversations.length === 0 && groupChats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', border: `2px dashed ${T.border}`, borderRadius: 16, margin: '8px', color: T.textMuted }}>
                <MessageSquare size={36} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.35 }} />
                <p className="font-display" style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 6px' }}>No conversations yet</p>
                <p style={{ fontSize: 13, margin: '0 0 16px' }}>Start a DM with one of your kasama.</p>
                <button onClick={() => setShowPicker(true)}
                  style={{ height: 40, padding: '0 20px', borderRadius: 20, border: 'none', background: T.primary, color: T.bg, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                  Start a conversation
                </button>
              </div>
            ) : (
              conversations.map(conv => (
                <button key={conv.partner_id}
                  onClick={() => setActiveChat({ kind: 'dm', id: conv.partner_id, name: conv.partner_name, avatar: conv.partner_avatar ?? '/avatar.png' })}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px', borderRadius: 14, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 150ms', marginBottom: 2 }}
                  onMouseEnter={e => (e.currentTarget.style.background = `${T.text}08`)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={conv.partner_avatar ?? '/avatar.png'} alt={conv.partner_name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${T.border}` }} />
                    {conv.unread_count > 0 && (
                      <span style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: T.accent, border: `2px solid ${T.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: conv.unread_count > 0 ? 800 : 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.partner_name}</span>
                      <span style={{ fontSize: 11, color: T.textMuted, flexShrink: 0, marginLeft: 8 }}>{timeAgo(conv.last_message_at)}</span>
                    </div>
                    <p style={{ fontSize: 13, color: conv.unread_count > 0 ? T.text : T.textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: conv.unread_count > 0 ? 600 : 400 }}>
                      {conv.last_message}
                    </p>
                  </div>
                </button>
              ))
            )}
          </>
        )}
      </PullToRefresh>

      {showPicker && userId && (
        <NewConvPicker
          userId={userId}
          theme={T}
          onPick={f => {
            setShowPicker(false);
            setActiveChat({ kind: 'dm', id: f.id, name: f.display_name, avatar: f.avatar_url ?? getDefaultAvatar(f.gender, f.profile_tags) });
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
