import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MessageSquare, UserPlus, Search, X, Loader, Users, Info } from 'lucide-react';
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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ── New conversation picker ──────────────────────────────────────────────────

interface Friend { id: string; display_name: string; gender: string | null; profile_tags: string[] | null; }

function NewConvPicker({ userId, theme: T, onPick, onClose }: { userId: string; theme: Theme; onPick: (f: Friend) => void; onClose: () => void }) {
  const { connections } = useConnections(userId);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const accepted = connections.filter(c => c.status === 'accepted');
    if (!accepted.length) { setFriends([]); return; }
    const ids = accepted.map(c => c.from_user_id === userId ? c.to_user_id : c.from_user_id);
    supabase.from('profiles').select('id, display_name, gender, profile_tags').in('id', ids)
      .then(({ data }) => setFriends((data as Friend[]) ?? []));
  }, [connections, userId]);

  const filtered = friends.filter(f => f.display_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', background: T.surface, borderRadius: '20px 20px 0 0', border: `2px solid ${T.border}`, borderBottom: 'none', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 20px 0' }}>
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
        <div style={{ overflowY: 'auto', padding: '0 8px 20px' }}>
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
              <img src={getDefaultAvatar(f.gender, f.profile_tags)} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${T.border}` }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{f.display_name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 1-on-1 chat view ─────────────────────────────────────────────────────────

function ChatView({ userId, partnerId, partnerName, partnerAvatar, theme: T, onBack }: { userId: string; partnerId: string; partnerName: string; partnerAvatar: string; theme: Theme; onBack: () => void }) {
  const { messages, loading, sending, sendMessage } = useChat(userId, partnerId);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!draft.trim()) return;
    const text = draft;
    setDraft('');
    await sendMessage(text);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: T.surface, borderBottom: `1.5px solid ${T.border}` }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', padding: 4 }}>
          <ArrowLeft size={20} />
        </button>
        <img src={partnerAvatar} alt={partnerName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${T.border}` }} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>{partnerName}</p>
          <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>Kasama</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '75%', padding: '9px 13px', borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: mine ? T.primary : T.surfaceAlt, color: mine ? T.bg : T.text, fontSize: 14, lineHeight: 1.5, fontFamily: '"DM Sans",system-ui,sans-serif', wordBreak: 'break-word' }}>
                  {m.content}
                  <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3, textAlign: 'right' }}>{timeAgo(m.created_at)}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ flexShrink: 0, display: 'flex', gap: 8, padding: '12px 16px', background: T.surface, borderTop: `1.5px solid ${T.border}` }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type a message…"
          maxLength={1000}
          style={{ flex: 1, height: 44, padding: '0 14px', fontSize: 14, fontFamily: '"DM Sans",system-ui,sans-serif', border: `1.5px solid ${T.border}`, borderRadius: 22, background: T.bg, color: T.text, outline: 'none' }}
        />
        <button
          onClick={send}
          disabled={!draft.trim() || sending}
          style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: draft.trim() ? T.primary : T.border, color: draft.trim() ? T.bg : T.textMuted, cursor: draft.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 150ms' }}
        >
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
  const { messages, loading, sendMessage } = useRoomMessages(roomId);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Room detail + participants
  const [room, setRoom]           = useState<Room | null>(null);
  const [courier, setCourier]     = useState<{ id: string; name: string } | null>(null);
  const [myRating, setMyRating]   = useState<BookingRating | null>(null);

  // Modal state
  const [showDetail, setShowDetail]   = useState(false);
  const [showCancel, setShowCancel]   = useState(false);
  const [showRating, setShowRating]   = useState(false);
  const [actionBusy, setActionBusy]   = useState(false);

  useEffect(() => {
    supabase.from('rooms').select('*').eq('id', roomId).maybeSingle()
      .then(({ data }) => data && setRoom(data as Room));
    supabase.from('join_requests').select('user_id, display_name').eq('room_id', roomId).eq('status', 'approved').maybeSingle()
      .then(({ data }) => data && setCourier({ id: data.user_id, name: data.display_name ?? 'Courier' }));
    supabase.from('booking_ratings').select('*').eq('room_id', roomId).eq('rater_id', userId).maybeSingle()
      .then(({ data }) => data && setMyRating(data as BookingRating));
  }, [roomId, userId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const isOwner    = room?.user_id === userId;
  const roomStatus = room?.status ?? 'confirmed';
  const isActive   = roomStatus === 'confirmed';
  const isDone     = roomStatus === 'completed';
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

  // Status badge for header
  const statusChip = isDone
    ? { label: 'Completed', bg: '#DCFCE7', color: '#15803D' }
    : roomStatus === 'cancelled'
      ? { label: 'Cancelled', bg: '#FEF2F2', color: '#B91C1C' }
      : { label: 'Active', bg: '#FEF3E2', color: '#D97706' };

  const inputDisabled = !isActive;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: T.surface, borderBottom: `1.5px solid ${T.border}` }}>
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
        {/* Info / actions button */}
        <button onClick={() => setShowDetail(true)}
          style={{ width: 34, height: 34, borderRadius: '50%', border: `1.5px solid ${T.border}`, background: T.surfaceAlt, color: T.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Info size={15} />
        </button>
      </div>

      {/* Courier rating prompt — shown to courier when booking is completed and not yet rated */}
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                <div key={m.id} style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ maxWidth: '85%', padding: '8px 14px', borderRadius: 12, background: isCancelMsg ? '#FEF2F2' : isDoneMsg ? '#EDE9FE' : '#DCFCE7', border: `1px solid ${isCancelMsg ? '#FCA5A5' : isDoneMsg ? '#C4B5FD' : '#86EFAC'}`, fontSize: 12, color: isCancelMsg ? '#B91C1C' : isDoneMsg ? '#6D28D9' : '#15803D', fontFamily: '"DM Sans",system-ui,sans-serif', textAlign: 'center', lineHeight: 1.5 }}>
                    {m.content}
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3 }}>{timeAgo(m.created_at)}</div>
                  </div>
                </div>
              );
            }
            const mine = m.sender_id === userId;
            return (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                {!mine && m.sender_name && <p style={{ fontSize: 11, color: T.textMuted, margin: '0 0 3px 4px', fontWeight: 600 }}>{m.sender_name}</p>}
                <div style={{ maxWidth: '75%', padding: '9px 13px', borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: mine ? T.primary : T.surfaceAlt, color: mine ? T.bg : T.text, fontSize: 14, lineHeight: 1.5, fontFamily: '"DM Sans",system-ui,sans-serif', wordBreak: 'break-word' }}>
                  {m.content}
                  <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3, textAlign: 'right' }}>{timeAgo(m.created_at)}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input — disabled when not active */}
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
        <BookingDetailSheet
          room={room} isOwner={isOwner} courierName={courier?.name ?? 'Courier'} theme={T}
          onClose={() => setShowDetail(false)}
          onCancel={() => { setShowDetail(false); setShowCancel(true); }}
          onComplete={handleMarkComplete}
        />
      )}
      {showCancel && (
        <CancelModal theme={T} submitting={actionBusy}
          onConfirm={handleCancel} onClose={() => setShowCancel(false)} />
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

// ── Main tab ─────────────────────────────────────────────────────────────────

type ActiveChat =
  | { kind: 'dm'; id: string; name: string; avatar: string }
  | { kind: 'group'; roomId: string; roomName: string; joinCode: string };

export default function MessagesTab({ theme: T, userId }: MessagesTabProps) {
  const { conversations, loading: dmLoading } = useConversations(userId);
  const { chats: groupChats, loading: gcLoading } = useRoomChats(userId);
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!userId) return;
    supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle()
      .then(({ data }) => setUserName(data?.display_name ?? 'Kasama'));
  }, [userId]);

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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ padding: '24px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p className="font-pixel" style={{ fontSize: 13, color: T.accent, margin: '0 0 2px', letterSpacing: 1 }}>DIRECT MESSAGES</p>
          <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0 }}>Messages</h2>
        </div>
        <button
          onClick={() => setShowPicker(true)}
          style={{ height: 38, padding: '0 16px', borderRadius: 19, border: 'none', background: T.primary, color: T.bg, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Send size={13} /> New
        </button>
      </div>

      <div style={{ flex: 1, padding: '0 8px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 8, color: T.textMuted }}>
            <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13 }}>Loading…</span>
          </div>
        ) : (
          <>
            {/* ── Group / Tracking GCs ─────────────────────────────────────── */}
            {groupChats.length > 0 && (
              <>
                <div style={{ padding: '4px 12px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={12} style={{ color: T.textMuted }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5 }}>TRACKING GROUP CHATS</span>
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

            {/* ── DMs ──────────────────────────────────────────────────────── */}
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
      </div>

      {showPicker && userId && (
        <NewConvPicker
          userId={userId}
          theme={T}
          onPick={f => {
            setShowPicker(false);
            setActiveChat({ kind: 'dm', id: f.id, name: f.display_name, avatar: getDefaultAvatar(f.gender, f.profile_tags) });
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
