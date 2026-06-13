import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MessageSquare, UserPlus, Search, X, Loader } from 'lucide-react';
import { useConversations, useChat } from '@/hooks/useMessages';
import { useConnections } from '@/hooks/useConnections';
import { supabase } from '@/lib/supabase';
import { getDefaultAvatar } from '@/components/app/tagConstants';
import type { Theme } from '@/types';

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

// ── Chat view ────────────────────────────────────────────────────────────────

function ChatView({ userId, partnerId, partnerName, partnerAvatar, theme: T, onBack }: { userId: string; partnerId: string; partnerName: string; partnerAvatar: string; theme: Theme; onBack: () => void }) {
  const { messages, loading, sending, sendMessage } = useChat(userId, partnerId);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      {/* Header */}
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

      {/* Messages */}
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

      {/* Input bar */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 8, padding: '12px 16px', background: T.surface, borderTop: `1.5px solid ${T.border}` }}>
        <input
          ref={inputRef}
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
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
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

interface ActiveChat { id: string; name: string; avatar: string; }

export default function MessagesTab({ theme: T, userId }: MessagesTabProps) {
  const { conversations, loading } = useConversations(userId);
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  if (activeChat && userId) {
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
      </div>
    );
  }

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

      {/* Conversation list */}
      <div style={{ flex: 1, padding: '0 8px' }}>
        {loading ? (
          <ConversationsSkeleton theme={T} />
        ) : conversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', border: `2px dashed ${T.border}`, borderRadius: 16, margin: '8px', color: T.textMuted }}>
            <MessageSquare size={36} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.35 }} />
            <p className="font-display" style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 6px' }}>No conversations yet</p>
            <p style={{ fontSize: 13, margin: '0 0 16px' }}>Start a DM with one of your kasama.</p>
            <button onClick={() => setShowPicker(true)}
              style={{ height: 40, padding: '0 20px', borderRadius: 20, border: 'none', background: T.primary, color: T.bg, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
              Start a conversation
            </button>
          </div>
        ) : conversations.map(conv => (
          <button key={conv.partner_id}
            onClick={() => setActiveChat({ id: conv.partner_id, name: conv.partner_name, avatar: conv.partner_avatar ?? '/avatar.png' })}
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
        ))}
      </div>

      {showPicker && userId && (
        <NewConvPicker
          userId={userId}
          theme={T}
          onPick={f => {
            setShowPicker(false);
            setActiveChat({ id: f.id, name: f.display_name, avatar: getDefaultAvatar(f.gender, f.profile_tags) });
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
