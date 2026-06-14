import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Navigation, Loader, Users, Lock, MapPin, Calendar, ChevronDown, ChevronUp, Send, Check, X } from 'lucide-react';
import { CATEGORIES, CATEGORY_DETAILS, THEMES } from '@/data/themes';
import { useExploreRooms } from '@/hooks/useExploreRooms';
import { submitJoinRequest, getMyRequestStatus } from '@/hooks/useJoinRequests';
import { useProfile } from '@/hooks/useProfile';
import { PixelHeart } from '@/components/common/PixelDecorations';
import type { CategoryId, Theme } from '@/types';

const CATEGORY_COLORS: Record<string, { primary: string; light: string; text: string }> = {
  pasabuy:   { primary: '#CA8A04', light: '#FEF9C3', text: '#78350F' },
  rotary:    { primary: '#1A7A3C', light: '#D1FAE5', text: '#064E3B' },
  gaming:    { primary: '#A855F7', light: '#EDE9FE', text: '#4C1D95' },
  cafe:      { primary: '#5C3317', light: '#FDE8C8', text: '#5C3317' },
  sports:    { primary: '#bee800', light: '#F0FD80', text: '#4A6200' },
  travel:    { primary: '#1C6E94', light: '#DBEAFE', text: '#1E3A5F' },
  hiking:    { primary: '#7F3B19', light: '#FEF3C7', text: '#7F3B19' },
  rideshare: { primary: '#043E81', light: '#DBEAFE', text: '#043E81' },
  volunteer: { primary: '#2E5748', light: '#D1FAE5', text: '#2E5748' },
};

const RADIUS_OPTIONS = [5, 10, 25, 50] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

interface BrowseRoomsScreenProps {
  categoryId: CategoryId;
  theme: Theme;
  userId?: string;
  onBack: () => void;
}

export default function BrowseRoomsScreen({ categoryId, theme: T, userId, onBack }: BrowseRoomsScreenProps) {
  const category  = CATEGORIES.find(c => c.id === categoryId)!;
  const detail    = CATEGORY_DETAILS[categoryId];
  const heroImage = category.image ?? 'https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/cover.png';
  // Always use the category's own brand theme for hero + accents, regardless of global mode
  const CT = THEMES[categoryId as keyof typeof THEMES] ?? T;

  const { profile } = useProfile(userId);
  const [search, setSearch]       = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [center, setCenter]       = useState<[number, number] | null>(null);
  const [radiusKm, setRadiusKm]   = useState<number>(10);
  const [radiusOpen, setRadiusOpen] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [requestStates, setRequestStates] = useState<Record<string, string>>({});
  const [requestMsg, setRequestMsg] = useState('');
  const [requestingId, setRequestingId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.home_lat && profile?.home_lng && !center) {
      setCenter([profile.home_lat, profile.home_lng]);
    }
  }, [profile]);

  const useGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setCenter([pos.coords.latitude, pos.coords.longitude]); setGpsLoading(false); },
      ()  => setGpsLoading(false),
    );
  };

  const clearLocation = () => setCenter(null);

  const { rooms, loading } = useExploreRooms(search, categoryId, center, radiusKm);

  // Pre-load request statuses
  useEffect(() => {
    if (!userId || rooms.length === 0) return;
    rooms.forEach(async room => {
      const status = await getMyRequestStatus(room.id, userId);
      if (status) setRequestStates(s => ({ ...s, [room.id]: status }));
    });
  }, [rooms, userId]);

  const sendRequest = async (roomId: string) => {
    if (!userId) return;
    setRequestStates(s => ({ ...s, [roomId]: 'sending' }));
    const err = await submitJoinRequest(roomId, userId, requestMsg);
    setRequestStates(s => ({ ...s, [roomId]: err ? 'none' : 'pending' }));
    setRequestingId(null);
    setRequestMsg('');
  };

  const now = new Date();
  const activeRooms   = rooms.filter(r => !!r.event_date && new Date(r.event_date) >= now);
  const archivedRooms = rooms.filter(r => !r.event_date  || new Date(r.event_date) <  now);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: '"DM Sans", system-ui, sans-serif' }}>

      {/* ── Hero ── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: CT.primary, display: 'flex', minHeight: 340 }}>

        {/* Left: details */}
        <div style={{ flex: '1 1 55%', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '52px 20px 24px 20px', zIndex: 2 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 75%, rgba(0,0,0,0) 100%)', zIndex: 0 }} />

          {/* Back button */}
          <button
            onClick={onBack}
            style={{ position: 'absolute', top: 14, left: 14, zIndex: 3, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '5px 12px', color: '#F1EDE1', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', backdropFilter: 'blur(6px)' }}
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 3 }}>
            <PixelHeart color={CT.highlight} size={16} />
          </div>

          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
            {/* Category name + status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <category.Icon size={18} style={{ color: '#fff', opacity: 0.9 }} strokeWidth={1.8} />
              <p className="font-pixel" style={{ fontSize: 18, color: '#F1EDE1', margin: 0, letterSpacing: 2, textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>{category.name.toUpperCase()}</p>
              <span style={{ fontSize: 9, fontWeight: 700, background: CT.accent, color: '#F1EDE1', padding: '2px 7px', borderRadius: 8, letterSpacing: 0.5 }}>LIVE</span>
            </div>

            <p style={{ fontSize: 12, color: 'rgba(241,237,225,0.85)', margin: 0, lineHeight: 1.6, maxWidth: 260 }}>{detail.description}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {detail.highlights.map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <h.Icon size={13} strokeWidth={1.8} style={{ color: '#F1EDE1' }} />
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(241,237,225,0.9)' }}>{h.label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
              {detail.stats.map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: '7px 4px', background: 'rgba(255,255,255,0.12)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)' }}>
                  <p className="font-display" style={{ fontSize: 15, fontWeight: 800, color: '#F1EDE1', margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: 10, color: 'rgba(241,237,225,0.7)', margin: '1px 0 0' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: image */}
        <div style={{ flex: '0 0 45%', position: 'relative', overflow: 'hidden' }}>
          <img src={heroImage} alt={category.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, rgba(0,0,0,0) 50%, rgba(0,0,0,0.25) 100%)' }} />
        </div>
      </div>

      {/* ── Search / filter bar ── */}
      <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Text search */}
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setSearchFocus(false)}
            placeholder={`Search ${category.name} rooms…`}
            style={{ width: '100%', height: 44, padding: '0 12px 0 36px', fontSize: 14, fontFamily: 'inherit', border: `1.5px solid ${searchFocus ? T.primary : T.border}`, borderRadius: 12, background: T.surface, color: T.text, outline: 'none', boxSizing: 'border-box', transition: 'border-color 200ms' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', alignItems: 'center' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Location row */}
        <div style={{ display: 'flex', gap: 8 }}>
          {/* GPS / clear button */}
          {center ? (
            <button onClick={clearLocation} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: 40, borderRadius: 20, border: `1.5px solid ${T.accent}`, background: `${T.accent}18`, color: T.accent, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <MapPin size={14} /> Near me <X size={12} />
            </button>
          ) : (
            <button onClick={useGPS} disabled={gpsLoading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: 40, borderRadius: 20, border: `1.5px solid ${T.border}`, background: T.surface, color: T.textMuted, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {gpsLoading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Navigation size={14} />}
              {gpsLoading ? 'Locating…' : 'Use my location'}
            </button>
          )}

          {/* Radius picker — only shown when center is set */}
          {center && (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setRadiusOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px', height: 40, borderRadius: 20, border: `1.5px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                {radiusKm} km {radiusOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {radiusOpen && (
                <div style={{ position: 'absolute', top: 46, left: 0, background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, overflow: 'hidden', minWidth: 90 }}>
                  {RADIUS_OPTIONS.map(r => (
                    <button key={r} onClick={() => { setRadiusKm(r); setRadiusOpen(false); }}
                      style={{ display: 'block', width: '100%', padding: '9px 14px', textAlign: 'left', background: r === radiusKm ? T.surfaceAlt : 'transparent', color: r === radiusKm ? T.primary : T.text, fontSize: 13, fontWeight: r === radiusKm ? 700 : 400, fontFamily: 'inherit', border: 'none', cursor: 'pointer' }}>
                      {r} km
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Result count pill */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', padding: '0 12px', height: 40, borderRadius: 20, background: T.surfaceAlt, fontSize: 13, fontWeight: 600, color: T.textMuted, whiteSpace: 'nowrap' }}>
            {loading ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : `${rooms.length} room${rooms.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>

      {/* ── Room list ── */}
      <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '40px 0', color: T.textMuted }}>
            <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 14 }}>Loading rooms…</span>
          </div>
        )}

        {!loading && rooms.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', border: `2px dashed ${T.border}`, borderRadius: 20 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
            <p className="font-display" style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: '0 0 6px' }}>No rooms found</p>
            <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>
              {center ? 'Try a larger radius or clear the location filter.' : 'No active rooms yet for this category.'}
            </p>
          </div>
        )}

        {/* Active rooms */}
        {!loading && activeRooms.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
              <p className="font-pixel" style={{ fontSize: 12, color: T.textMuted, margin: 0, letterSpacing: 1 }}>ACTIVE ROOMS — {activeRooms.length}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeRooms.map(room => <RoomCard key={room.id} room={room} T={T} userId={userId} requestState={requestStates[room.id] ?? 'none'} requestingId={requestingId} requestMsg={requestMsg} onSetRequestingId={setRequestingId} onSetRequestMsg={setRequestMsg} onSend={sendRequest} categoryId={categoryId} />)}
            </div>
          </div>
        )}

        {/* Archived rooms */}
        {!loading && archivedRooms.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 14 }}>📦</span>
              <p className="font-pixel" style={{ fontSize: 12, color: T.textMuted, margin: 0, letterSpacing: 1 }}>PAST ROOMS — {archivedRooms.length}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, opacity: 0.75 }}>
              {archivedRooms.map(room => <RoomCard key={room.id} room={room} T={T} userId={userId} requestState={requestStates[room.id] ?? 'none'} requestingId={requestingId} requestMsg={requestMsg} onSetRequestingId={setRequestingId} onSetRequestMsg={setRequestMsg} onSend={sendRequest} categoryId={categoryId} />)}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <PixelHeart color={T.accent} size={10} />
            <p className="font-pixel" style={{ fontSize: 11, color: T.textMuted, margin: 0, letterSpacing: 1 }}>{category.name.toUpperCase()} — SABAYPH</p>
            <PixelHeart color={T.accent} size={10} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Room card ──────────────────────────────────────────────────────────────────

interface RoomCardProps {
  room: import('@/types').Room;
  T: Theme;
  userId?: string;
  requestState: string;
  requestingId: string | null;
  requestMsg: string;
  categoryId: CategoryId;
  onSetRequestingId: (id: string | null) => void;
  onSetRequestMsg: (msg: string) => void;
  onSend: (roomId: string) => void;
}

function RoomCard({ room, T, userId, requestState, requestingId, requestMsg, onSetRequestingId, onSetRequestMsg, onSend, categoryId }: RoomCardProps) {
  const fill = Math.min((room.member_count / room.max_members) * 100, 100);
  const isFull = room.member_count >= room.max_members;
  const isOwner = room.user_id === userId;
  const isRequestingThis = requestingId === room.id;
  const cat = CATEGORY_COLORS[room.category] ?? { primary: T.primary, light: T.surfaceAlt, text: T.primary };

  const memberLabel = categoryId === 'gaming' ? 'players' : categoryId === 'cafe' ? 'guests' : categoryId === 'pasabuy' ? 'agents' : 'members';

  return (
    <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderLeft: `4px solid ${cat.primary}`, borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: 14 }}>
        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 700, background: cat.light, color: cat.text, padding: '2px 7px', borderRadius: 6, textTransform: 'uppercase' }}>{room.category}</span>
          {room.status === 'live' && !isOwner && <span style={{ fontSize: 9, fontWeight: 700, background: '#C82718', color: '#F1EDE1', padding: '2px 7px', borderRadius: 6 }}>LIVE</span>}
          {room.is_private && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, background: T.surfaceAlt, color: T.textMuted, padding: '2px 7px', borderRadius: 6, border: `1px solid ${T.border}` }}><Lock size={8} /> PRIVATE</span>}
          {isFull && <span style={{ fontSize: 9, fontWeight: 700, background: T.surfaceAlt, color: T.textMuted, padding: '2px 7px', borderRadius: 6 }}>FULL</span>}
          {isOwner && <span style={{ fontSize: 9, fontWeight: 700, background: T.primary, color: T.bg, padding: '2px 7px', borderRadius: 6, marginLeft: 'auto' }}>YOUR ROOM</span>}
        </div>

        <p className="font-display" style={{ fontSize: 15, fontWeight: 800, color: T.text, margin: '0 0 3px' }}>{room.name}</p>
        {room.description && <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 6px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{room.description}</p>}
        <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 10px' }}>Hosted by <strong style={{ color: T.text }}>{room.host_name}</strong></p>

        {/* Member bar */}
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: T.textMuted }}>
            <Users size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            {room.member_count} / {room.max_members} {memberLabel}
          </span>
          <div style={{ height: 4, background: T.surfaceAlt, borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
            <div style={{ height: '100%', borderRadius: 3, width: `${fill}%`, background: isFull ? '#EF4444' : cat.primary, transition: 'width 500ms' }} />
          </div>
        </div>

        {/* Event date / location */}
        {(room.event_date || room.location_name) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
            {room.event_date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 9px', borderRadius: 8, background: T.surfaceAlt }}>
                <Calendar size={12} style={{ color: T.primary, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{formatDate(room.event_date)}</span>
              </div>
            )}
            {room.location_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 9px', borderRadius: 8, background: T.surfaceAlt }}>
                <MapPin size={12} style={{ color: T.primary, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.location_name}</span>
              </div>
            )}
          </div>
        )}

        {/* Join code */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: T.surfaceAlt, marginBottom: 10 }}>
          <p className="font-pixel" style={{ fontSize: 9, color: T.textMuted, margin: 0, letterSpacing: 1 }}>CODE</p>
          <p className="font-display" style={{ fontSize: 13, fontWeight: 800, color: T.primary, margin: 0, letterSpacing: 1.5 }}>{room.join_code}</p>
        </div>

        {/* Join / request action */}
        {!isOwner && (
          <>
            {requestState === 'approved' || requestState === 'accepted' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 10, background: '#DCFCE7', border: '1.5px solid #86EFAC' }}>
                <Check size={14} style={{ color: '#15803D' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#15803D' }}>You're in!</span>
              </div>
            ) : requestState === 'pending' ? (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: T.surfaceAlt, border: `1.5px solid ${T.border}` }}>
                <span style={{ fontSize: 13, color: T.textMuted, fontWeight: 600 }}>⏳ Request sent — waiting for host</span>
              </div>
            ) : isRequestingThis ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  value={requestMsg}
                  onChange={e => onSetRequestMsg(e.target.value)}
                  placeholder="Add a short message (optional)"
                  rows={2}
                  style={{ width: '100%', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', border: `1.5px solid ${T.border}`, borderRadius: 10, background: T.bg, color: T.text, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => onSend(room.id)} style={{ flex: 1, height: 38, borderRadius: 10, border: 'none', background: T.primary, color: T.bg, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Send size={13} /> Send Request
                  </button>
                  <button onClick={() => onSetRequestingId(null)} style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.surfaceAlt, color: T.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => onSetRequestingId(room.id)}
                disabled={isFull || requestState === 'sending'}
                style={{ width: '100%', height: 40, borderRadius: 10, border: 'none', background: isFull ? T.surfaceAlt : T.primary, color: isFull ? T.textMuted : T.bg, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: isFull ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {requestState === 'sending' ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</> : isFull ? 'Room is full' : 'Request to Join'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
