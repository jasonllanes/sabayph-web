import { useState, useEffect, useCallback } from 'react';
import {
  UserCheck, Clock, Search, X, Loader, UserPlus, MapPin,
  Check, UserX, Users, ShieldCheck, Shield, ShieldAlert,
} from 'lucide-react';
import { PixelHeart } from '@/components/common/PixelDecorations';
import { supabase } from '@/lib/supabase';
import { useConnections } from '@/hooks/useConnections';
import ProfileViewModal from '@/components/app/ProfileViewModal';
import { tagStyle, PRONOUNS, getDefaultAvatar } from '@/components/app/tagConstants';
import type { Theme, DiscoverProfile, Connection } from '@/types';

const PROFILE_COLS =
  'id, display_name, age_range, location, bio, gender, profile_tags, kasama_rating, rating_count, is_online, profile_completed, contact_phone, home_lat, rooms_joined, avatar_url, id_verified';

// PROFILE_COLS_FALLBACK — excludes migration-dependent columns; always works
const PROFILE_COLS_FALLBACK =
  'id, display_name, age_range, location, bio, gender, profile_tags, kasama_rating, rating_count, is_online, profile_completed, contact_phone, home_lat, rooms_joined';

async function safeSelectProfiles(
  q: (cols: string) => PromiseLike<{ data: any[] | null; error: any }>,
): Promise<any[]> {
  const { data, error } = await q(PROFILE_COLS);
  if (!error && data !== null) return data;
  const { data: fb } = await q(PROFILE_COLS_FALLBACK);
  return fb ?? [];
}

function normProfile(r: any): DiscoverProfile {
  return {
    id: r.id, display_name: r.display_name ?? null, age_range: r.age_range ?? null,
    location: r.location ?? null, bio: r.bio ?? null, gender: r.gender ?? null,
    profile_tags: r.profile_tags ?? null, kasama_rating: r.kasama_rating ?? null,
    rating_count: r.rating_count ?? 0, is_online: r.is_online ?? false,
    profile_completed: r.profile_completed ?? false, contact_phone: r.contact_phone ?? null,
    home_lat: r.home_lat ?? null,
    rooms_joined: r.rooms_joined ?? 0,
    avatar_url:  r.avatar_url ?? null,
    id_verified: r.id_verified ?? false,
  };
}

function miniVerified(p: DiscoverProfile) {
  const c = (p.profile_completed ? 1 : 0) + (p.contact_phone ? 1 : 0) + (p.home_lat != null ? 1 : 0);
  if (c === 3) return { Icon: ShieldCheck, color: '#15803D', bg: '#DCFCE7', label: 'Fully verified' };
  if (c === 2) return { Icon: Shield,      color: '#A16207', bg: '#FEF9C3', label: 'Trusted' };
  return           { Icon: ShieldAlert,   color: '#9CA3AF', bg: '#F3F4F6', label: 'New member' };
}

// ── Friends skeleton ──────────────────────────────────────────────────────

function FriendsSkeletonList({ theme: T }: { theme: Theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}} .sk-fr{border-radius:8px;background:linear-gradient(90deg,${T.surfaceAlt} 25%,${T.border} 50%,${T.surfaceAlt} 75%);background-size:800px 100%;animation:shimmer 1.4s infinite linear}`}</style>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 16 }}>
          <div className="sk-fr" style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div className="sk-fr" style={{ width: `${50 + i * 10}%`, height: 14 }} />
            <div className="sk-fr" style={{ width: `${35 + i * 6}%`, height: 11, borderRadius: 5 }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <div className="sk-fr" style={{ width: 52, height: 30, borderRadius: 16 }} />
            <div className="sk-fr" style={{ width: 32, height: 30, borderRadius: '50%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Compact person row ─────────────────────────────────────────────────────

function PersonRow({
  person, theme: T, action,
}: {
  person: DiscoverProfile;
  theme: Theme;
  action: React.ReactNode;
}) {
  const PRONOUN_LABELS = ['He/Him','She/Her','They/Them','She/They','He/They'];
  const pronoun = (person.profile_tags ?? []).find(t => PRONOUN_LABELS.includes(t));
  const badge = miniVerified(person);
  const BadgeIcon = badge.Icon;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 16 }}>
      {/* Avatar */}
      <div style={{ width: 46, height: 46, borderRadius: '50%', background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        <span style={{ fontFamily: '"Bricolage Grotesque",serif', fontWeight: 800, fontSize: 18, color: T.bg, position: 'absolute' }}>
          {(person.display_name ?? '?').charAt(0).toUpperCase()}
        </span>
        <img
          src={person.avatar_url || getDefaultAvatar(person.gender, person.profile_tags)}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { (e.currentTarget as HTMLImageElement).src = getDefaultAvatar(person.gender, person.profile_tags); }}
        />
        {person.is_online && (
          <span style={{ position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: '50%', background: '#15803D', border: `2px solid ${T.surface}` }} />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>{person.display_name ?? 'Kasama'}</p>
          {pronoun && (() => {
            const pr = PRONOUNS.find(p => p.label === pronoun);
            if (!pr) return null;
            return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: pr.bg, color: pr.color, border: `1px solid ${pr.color}33` }}>{pr.label}</span>;
          })()}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <BadgeIcon size={11} style={{ color: badge.color }} />
            <span style={{ fontSize: 10, color: badge.color, fontWeight: 700 }}>{badge.label}</span>
          </div>
        </div>
        {person.location && (
          <p style={{ fontSize: 12, color: T.textMuted, margin: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
            <MapPin size={11} /> {person.location}
          </p>
        )}
      </div>

      {/* Action slot */}
      <div style={{ flexShrink: 0 }}>{action}</div>
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────

interface FriendsTabProps { theme: Theme; userId?: string; }

export default function FriendsTab({ theme: T, userId }: FriendsTabProps) {
  const { connections, getStatus, getConnection, sendRequest, acceptRequest, removeConnection, loading: connLoading, error: connError, tableReady } = useConnections(userId);

  const [friendProfiles, setFriendProfiles] = useState<Record<string, DiscoverProfile>>({});
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<DiscoverProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<DiscoverProfile | null>(null);
  const [activeSection, setActiveSection] = useState<'friends' | 'pending'>('friends');

  // Fetch profiles for all connection partners
  const fetchFriendProfiles = useCallback(async () => {
    if (!userId || connections.length === 0) return;
    const ids = connections.map(c => c.from_user_id === userId ? c.to_user_id : c.from_user_id);
    if (ids.length === 0) return;
    setProfilesLoading(true);
    const data = await safeSelectProfiles(cols => supabase.from('profiles').select(cols).in('id', ids));
    const map: Record<string, DiscoverProfile> = {};
    for (const r of data) map[r.id] = normProfile(r);
    setFriendProfiles(map);
    setProfilesLoading(false);
  }, [connections, userId]);

  useEffect(() => { fetchFriendProfiles(); }, [fetchFriendProfiles]);

  const acceptedConns: Connection[] = connections.filter(c => c.status === 'accepted');
  const pendingIncoming: Connection[] = connections.filter(c => c.status === 'pending' && c.to_user_id === userId);
  const pendingSent: Connection[] = connections.filter(c => c.status === 'pending' && c.from_user_id === userId);

  // ── Search ────────────────────────────────────────────────────────────────

  const handleSearch = async () => {
    const term = search.trim();
    if (!term) return;
    setSearching(true); setSearchDone(false);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term);

    let results: DiscoverProfile[] = [];

    if (isUuid) {
      const data = await safeSelectProfiles(cols => supabase.from('profiles').select(cols).eq('id', term).limit(1));
      results = data.map(normProfile);
    } else if (term.startsWith('#')) {
      const tag = term.slice(1).trim();
      const data = await safeSelectProfiles(cols =>
        supabase.from('profiles').select(cols).contains('profile_tags', [tag]).neq('id', userId ?? '').limit(20)
      );
      results = data.map(normProfile);
    } else {
      const data = await safeSelectProfiles(cols =>
        supabase.from('profiles').select(cols).ilike('display_name', `%${term}%`).neq('id', userId ?? '').limit(20)
      );
      results = data.map(normProfile);
    }

    setSearchResults(results);
    setSearching(false); setSearchDone(true);
  };

  const clearSearch = () => { setSearch(''); setSearchResults([]); setSearchDone(false); };

  const btnSm = (label: string, color: string, bg: string, border: string, onClick: () => void, Icon?: React.ComponentType<{size: number}>) => (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 16, border: `1.5px solid ${border}`, background: bg, color, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
      {Icon && <Icon size={13} />} {label}
    </button>
  );

  const isLoading = connLoading || profilesLoading;

  return (
    <div style={{ padding: '20px 16px 32px', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=VT323&display=swap'); .font-display{font-family:'Bricolage Grotesque',serif;letter-spacing:-0.02em;} .font-pixel{font-family:'VT323',monospace;}`}</style>

      <div style={{ marginBottom: 20 }}>
        <p className="font-pixel" style={{ fontSize: 13, color: T.accent, margin: '0 0 3px', letterSpacing: 1 }}>KASAMA NETWORK</p>
        <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0 }}>Your friends.</h2>
      </div>

      {/* ── Search ── */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, margin: '0 0 8px' }}>
          Search by name, <span style={{ color: T.primary }}>#tag</span>, or paste a user ID
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); if (!e.target.value.trim()) clearSearch(); }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. Jason, #Gamer, or paste a UUID…"
              style={{ width: '100%', height: 44, paddingLeft: 36, paddingRight: search ? 36 : 14, fontSize: 14, fontFamily: 'inherit', border: `1.5px solid ${T.border}`, borderRadius: 22, background: T.bg, color: T.text, outline: 'none', boxSizing: 'border-box' }}
            />
            {search && (
              <button onClick={clearSearch} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex' }}>
                <X size={14} />
              </button>
            )}
          </div>
          <button onClick={handleSearch} disabled={searching || !search.trim()}
            style={{ height: 44, paddingInline: 18, borderRadius: 22, border: 'none', background: (!search.trim() || searching) ? T.border : T.primary, color: (!search.trim() || searching) ? T.textMuted : '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: (!search.trim() || searching) ? 'default' : 'pointer' }}>
            {searching ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : 'Search'}
          </button>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

        {/* Search results */}
        {searchDone && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {searchResults.length === 0 ? (
              <p style={{ fontSize: 13, color: T.textMuted, textAlign: 'center', padding: '16px 0' }}>No kasama found for "{search}"</p>
            ) : (
              searchResults.map(person => (
                <PersonRow key={person.id} person={person} theme={T} action={
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setViewingProfile(person)}
                      style={{ padding: '6px 12px', borderRadius: 16, border: `1.5px solid ${T.border}`, background: T.surfaceAlt, color: T.text, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                      View
                    </button>
                    {(() => {
                      const st = getStatus(person.id);
                      if (st === 'accepted') return <span style={{ fontSize: 11, color: '#15803D', fontWeight: 700 }}>✓ Kasama</span>;
                      if (st === 'pending_sent') return <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>Pending</span>;
                      if (person.id === userId) return null;
                      return (
                        <button onClick={() => sendRequest(person.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 16, border: 'none', background: T.primary, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                          <UserPlus size={13} /> Add
                        </button>
                      );
                    })()}
                  </div>
                } />
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Section switcher ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, padding: 4, background: T.surfaceAlt, borderRadius: 20, border: `1.5px solid ${T.border}` }}>
        {([
          { id: 'friends' as const, label: `Friends`, count: acceptedConns.length, Icon: UserCheck },
          { id: 'pending' as const, label: `Pending`, count: pendingIncoming.length, Icon: Clock },
        ] as { id: 'friends' | 'pending'; label: string; count: number; Icon: React.ComponentType<{size: number; style?: React.CSSProperties}> }[]).map(({ id, label, count, Icon }) => (
          <button key={id} onClick={() => setActiveSection(id)}
            style={{ flex: 1, height: 38, borderRadius: 16, border: 'none', background: activeSection === id ? T.primary : 'transparent', color: activeSection === id ? '#fff' : T.textMuted, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 200ms' }}>
            <Icon size={14} style={{ color: activeSection === id ? '#fff' : T.textMuted }} />
            {label}
            {count > 0 && (
              <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 6px', borderRadius: 10, background: activeSection === id ? 'rgba(255,255,255,0.25)' : T.primary, color: activeSection === id ? '#fff' : '#fff' }}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Friends list ── */}
      {activeSection === 'friends' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {isLoading && <FriendsSkeletonList theme={T} />}

          {!isLoading && acceptedConns.length === 0 && (
            <div style={{ textAlign: 'center', padding: '36px 20px', border: `2px dashed ${T.border}`, borderRadius: 18 }}>
              <Users size={32} style={{ color: T.textMuted, margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
              <p className="font-display" style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 4px' }}>No friends yet</p>
              <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>Search by name or tag to find kasama!</p>
            </div>
          )}

          {acceptedConns.map(conn => {
            const otherId = conn.from_user_id === userId ? conn.to_user_id : conn.from_user_id;
            const person = friendProfiles[otherId];
            if (!person) return null;
            return (
              <PersonRow key={conn.id} person={person} theme={T} action={
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setViewingProfile(person)}
                    style={{ padding: '6px 12px', borderRadius: 16, border: `1.5px solid ${T.primary}`, background: `${T.primary}12`, color: T.primary, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                    View
                  </button>
                  <button onClick={() => removeConnection(conn.id)}
                    style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#B91C1C', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserX size={14} />
                  </button>
                </div>
              } />
            );
          })}

          {/* Sent pending */}
          {pendingSent.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, margin: '12px 0 8px', letterSpacing: 0.5 }}>REQUESTS SENT</p>
              {pendingSent.map(conn => {
                const otherId = conn.to_user_id;
                const person = friendProfiles[otherId];
                if (!person) return null;
                return (
                  <PersonRow key={conn.id} person={person} theme={T} action={
                    btnSm('Cancel', T.textMuted, T.surfaceAlt, T.border, () => removeConnection(conn.id))
                  } />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Pending incoming ── */}
      {activeSection === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pendingIncoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', border: `2px dashed ${T.border}`, borderRadius: 18 }}>
              <Clock size={32} style={{ color: T.textMuted, margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
              <p className="font-display" style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 4px' }}>No pending requests</p>
              <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>When someone adds you, they'll appear here.</p>
            </div>
          ) : (
            pendingIncoming.map(conn => {
              const person = friendProfiles[conn.from_user_id];
              if (!person) return null;
              return (
                <PersonRow key={conn.id} person={person} theme={T} action={
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => acceptRequest(conn.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 16, border: 'none', background: '#15803D', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                      <Check size={13} /> Accept
                    </button>
                    <button onClick={() => removeConnection(conn.id)}
                      style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#B91C1C', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserX size={14} />
                    </button>
                  </div>
                } />
              );
            })
          )}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <PixelHeart color={T.accent} size={10} />
        <p className="font-pixel" style={{ fontSize: 11, color: T.textMuted, margin: 0, letterSpacing: 1 }}>KASAMA NETWORK — SABAYPH</p>
        <PixelHeart color={T.accent} size={10} />
      </div>

      {/* Migration warning banner */}
      {tableReady === false && (
        <div style={{ margin: '16px 0 0', padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 12 }}>
          <p style={{ fontSize: 13, color: '#B45309', margin: 0, fontWeight: 600 }}>⚠️ Friends feature not active</p>
          <p style={{ fontSize: 12, color: '#92400E', margin: '3px 0 0' }}>Run <strong>connections_migration.sql</strong> in your Supabase SQL Editor to enable friend requests.</p>
        </div>
      )}
      {connError && (
        <div style={{ margin: '10px 0 0', padding: '8px 12px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 10 }}>
          <p style={{ fontSize: 12, color: '#B91C1C', margin: 0 }}>{connError}</p>
        </div>
      )}

      {viewingProfile && (
        <ProfileViewModal
          person={viewingProfile}
          theme={T}
          currentUserId={userId}
          connectionStatus={getStatus(viewingProfile.id)}
          connectionLoading={connLoading}
          connectionError={connError}
          tableReady={tableReady}
          connection={getConnection(viewingProfile.id)}
          onSendRequest={() => sendRequest(viewingProfile.id)}
          onAcceptRequest={() => { const c = getConnection(viewingProfile.id); if (c) acceptRequest(c.id); }}
          onRemoveConnection={() => { const c = getConnection(viewingProfile.id); if (c) removeConnection(c.id); }}
          onClose={() => setViewingProfile(null)}
        />
      )}
    </div>
  );
}
