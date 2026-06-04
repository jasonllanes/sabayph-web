import { X, MapPin, Star, ShieldCheck, Shield, ShieldAlert, UserPlus, UserCheck, Clock, Check, UserX } from 'lucide-react';
import type { Theme, DiscoverProfile, ConnectionStatus, Connection } from '@/types';
import { PRONOUNS, INTEREST_TAGS, OTHERS_PALETTE, tagStyle, getDefaultAvatar } from '@/components/app/tagConstants';

// ── Badge helpers ───────────────────────────────────────────────────────────

function profileBadge(p: DiscoverProfile) {
  const count = (p.profile_completed ? 1 : 0) + (p.contact_phone ? 1 : 0) + (p.home_lat != null ? 1 : 0);
  if (count === 3) return { label: 'Fully verified', color: '#15803D', bg: '#DCFCE7', border: '#86EFAC', Icon: ShieldCheck };
  if (count === 2) return { label: 'Trusted member', color: '#A16207', bg: '#FEF9C3', border: '#FDE047', Icon: Shield };
  if (count === 1) return { label: 'Getting started', color: '#C2410C', bg: '#FFEDD5', border: '#FDBA74', Icon: ShieldAlert };
  return { label: 'New member', color: '#6B7280', bg: '#F3F4F6', border: '#D1D5DB', Icon: ShieldAlert };
}

// ── Connect button ──────────────────────────────────────────────────────────

interface ConnectBtnProps {
  status: ConnectionStatus;
  loading: boolean;
  connection: Connection | undefined;
  onSend: () => void;
  onAccept: () => void;
  onRemove: () => void;
  T: Theme;
}

function ConnectButton({ status, loading, connection, onSend, onAccept, onRemove, T }: ConnectBtnProps) {
  const base: React.CSSProperties = {
    flex: 1, height: 46, borderRadius: 23, border: 'none',
    fontSize: 15, fontWeight: 700, fontFamily: '"DM Sans",system-ui,sans-serif',
    cursor: loading ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'all 200ms',
  };
  if (status === 'accepted') {
    return (
      <button onClick={onRemove} disabled={loading} style={{ ...base, background: '#DCFCE7', color: '#15803D', border: '2px solid #86EFAC' }}>
        <UserCheck size={17} /> Kasama na!
      </button>
    );
  }
  if (status === 'pending_sent') {
    return (
      <button onClick={onRemove} disabled={loading} className='p-4' style={{ ...base, background: T.surfaceAlt, color: T.textMuted, border: `2px solid ${T.border}` }}>
        <Clock size={17} /> Request sent…
      </button>
    );
  }
  if (status === 'pending_received') {
    return (
      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
        <button onClick={onAccept} disabled={loading} style={{ ...base, flex: 1, background: T.primary, color: '#fff' }}>
          <Check size={17} /> Accept
        </button>
        <button onClick={onRemove} disabled={loading} style={{ ...base, flex: 'none', width: 46, background: T.surfaceAlt, border: `2px solid ${T.border}`, color: T.textMuted }}>
          <UserX size={17} />
        </button>
      </div>
    );
  }
  return (
    <button onClick={onSend} disabled={loading} className="p-2" style={{ ...base, background: T.primary, color: '#fff' }}>
      <UserPlus size={17} /> Add Kasama
    </button>
  );
}

// ── Modal ───────────────────────────────────────────────────────────────────

interface ProfileViewModalProps {
  person: DiscoverProfile;
  theme: Theme;
  connectionStatus: ConnectionStatus;
  connectionLoading: boolean;
  connectionError: string | null;
  tableReady: boolean | null;
  connection: Connection | undefined;
  onSendRequest: () => void;
  onAcceptRequest: () => void;
  onRemoveConnection: () => void;
  onClose: () => void;
}

export default function ProfileViewModal({
  person, theme: T, connectionStatus, connectionLoading, connectionError, tableReady,
  connection, onSendRequest, onAcceptRequest, onRemoveConnection, onClose,
}: ProfileViewModalProps) {
  const badge = profileBadge(person);
  const BadgeIcon = badge.Icon;
  const tags = person.profile_tags ?? [];
  const ratingDisplay = person.kasama_rating != null ? person.kasama_rating.toFixed(1) : '—';

  // Pronouns are the first matching pronoun tag
  const pronounTag = tags.find(t => PRONOUNS.some(p => p.label === t));

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=DM+Sans:wght@400;500;700&family=VT323&display=swap'); .font-display{font-family:'Bricolage Grotesque',serif;letter-spacing:-0.02em;} .font-pixel{font-family:'VT323',monospace;}`}</style>

      <div style={{ width: '100%', maxWidth: 420, background: T.surface, borderRadius: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.4)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Header banner ── */}
        <div style={{ height: 96, background: T.primary, position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.12, backgroundImage: `linear-gradient(${T.bg} 1px,transparent 1px),linear-gradient(90deg,${T.bg} 1px,transparent 1px)`, backgroundSize: '18px 18px' }} />
          {/* Close */}
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
          {/* Active badge in header */}
          {person.is_online && (
            <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.25)', padding: '3px 10px', borderRadius: 12 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
              Active now
            </div>
          )}
        </div>

        {/* ── Avatar + badge — between header and scroll so overflow: auto never clips it ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 22px', marginTop: -40, flexShrink: 0, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: T.primary, border: `4px solid ${T.surface}`, boxShadow: `0 4px 16px rgba(0,0,0,0.25)`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            <span className="font-display" style={{ fontSize: 30, fontWeight: 800, color: T.bg, position: 'absolute' }}>
              {(person.display_name ?? '?').charAt(0).toUpperCase()}
            </span>
            <img src={getDefaultAvatar(person.gender, person.profile_tags)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: badge.bg, border: `1.5px solid ${badge.border}` }}>
            <BadgeIcon size={14} style={{ color: badge.color }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: badge.color }}>{badge.label}</span>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 22px 22px' }}>

          {/* Name + pronouns */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <h2 className="font-display" style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: 0 }}>
                {person.display_name ?? 'Kasama'}
              </h2>
              {/* Pronoun chip — prominently placed next to name */}
              {pronounTag && (() => {
                const pr = PRONOUNS.find(p => p.label === pronounTag)!;
                return (
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: pr.bg, color: pr.color, border: `1.5px solid ${pr.color}44`, flexShrink: 0 }}>
                    {pr.label}
                  </span>
                );
              })()}
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {person.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: T.textMuted }}>
                  <MapPin size={13} /> {person.location}
                </span>
              )}
              {person.age_range && (
                <span style={{ fontSize: 12, color: T.textMuted, background: T.surfaceAlt, padding: '2px 10px', borderRadius: 12 }}>{person.age_range}</span>
              )}
              {person.gender && (
                <span style={{ fontSize: 12, color: T.textMuted, background: T.surfaceAlt, padding: '2px 10px', borderRadius: 12 }}>{person.gender}</span>
              )}
            </div>
          </div>

          {/* All tags (excluding the pronoun already shown) */}
          {tags.filter(t => t !== pronounTag).length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {tags.filter(t => t !== pronounTag).map(tag => {
                const ts = tagStyle(tag, person.id);
                return (
                  <span key={tag} style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: ts.bg, color: ts.color, border: `1px solid ${ts.color}33` }}>
                    {ts.label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Bio */}
          {person.bio && (
            <p style={{ fontSize: 13, color: T.text, margin: '0 0 16px', lineHeight: 1.65, padding: '12px 14px', background: T.surfaceAlt, borderRadius: 14 }}>{person.bio}</p>
          )}

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
            <div style={{ padding: '14px 12px', background: T.surfaceAlt, borderRadius: 14, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 3 }}>
                <Star size={14} style={{ color: '#D97706', fill: '#D97706' }} />
                <p className="font-display" style={{ fontSize: 22, fontWeight: 800, color: T.primary, margin: 0 }}>{ratingDisplay}</p>
              </div>
              <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>
                Kasama rating{person.rating_count > 0 ? ` · ${person.rating_count} reviews` : ''}
              </p>
            </div>
            <div style={{ padding: '14px 12px', background: badge.bg, border: `1.5px solid ${badge.border}`, borderRadius: 14, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 3 }}>
                <BadgeIcon size={16} style={{ color: badge.color }} />
                <p className="font-display" style={{ fontSize: 16, fontWeight: 800, color: badge.color, margin: 0 }}>
                  {person.profile_completed ? 'Verified' : 'New'}
                </p>
              </div>
              <p style={{ fontSize: 11, color: badge.color, margin: 0, opacity: 0.8 }}>{badge.label}</p>
            </div>
          </div>

        </div>

        {/* ── Sticky footer — always visible ── */}
        <div style={{ padding: '12px 22px 20px', borderTop: `1px solid ${T.border}`, flexShrink: 0, background: T.surface }}>
          {tableReady === false && (
            <p style={{ fontSize: 12, color: '#B45309', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: '7px 10px', margin: '0 0 10px', textAlign: 'center' }}>
              ⚠️ Run <strong>connections_migration.sql</strong> in Supabase to enable friends.
            </p>
          )}
          {connectionError && (
            <p style={{ fontSize: 12, color: '#B91C1C', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '7px 10px', margin: '0 0 10px' }}>
              {connectionError}
            </p>
          )}
          <ConnectButton
            status={connectionStatus}
            loading={connectionLoading || tableReady === false}
            connection={connection}
            onSend={onSendRequest}
            onAccept={onAcceptRequest}
            onRemove={onRemoveConnection}
            T={T}
          />
        </div>
      </div>
    </div>
  );
}
