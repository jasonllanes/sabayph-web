import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X, Navigation, Users, Lock, Home, Send, Check, Map } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { submitJoinRequest, getMyRequestStatus } from '@/hooks/useJoinRequests';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CATEGORIES, CATEGORY_DETAILS, THEMES } from '@/data/themes';
import { PixelHeart } from '@/components/common/PixelDecorations';
import { useExploreRooms } from '@/hooks/useExploreRooms';
import type { CategoryId, Theme } from '@/types';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const RADIUS_OPTIONS = [5, 10, 25, 50] as const;

const CATEGORY_COLORS: Record<string, { primary: string; light: string; text: string }> = {
  pasabuy:   { primary: '#CA8A04', light: '#FEF9C3', text: '#78350F' },
  rotary:    { primary: '#1A7A3C', light: '#D1FAE5', text: '#064E3B' },
  gaming:    { primary: '#A855F7', light: '#EDE9FE', text: '#4C1D95' },
  cafe:      { primary: '#5C3317', light: '#FDE8C8', text: '#5C3317' },
  travel:    { primary: '#1C6E94', light: '#DBEAFE', text: '#1E3A5F' },
  hiking:    { primary: '#7F3B19', light: '#FEF3C7', text: '#7F3B19' },
  rideshare: { primary: '#043E81', light: '#DBEAFE', text: '#043E81' },
  volunteer: { primary: '#2E5748', light: '#D1FAE5', text: '#2E5748' },
};
const PH_CENTER: [number, number] = [12.8797, 121.774];
const LIVE_CATEGORIES = CATEGORIES.filter(c => c.status === 'live');

function makeRoomIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [14, 14], iconAnchor: [7, 7],
  });
}
function makeCenterIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:20px;height:20px;border-radius:50%;background:#C82718;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.5)"></div>`,
    iconSize: [20, 20], iconAnchor: [10, 10],
  });
}
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

interface ExploreTabProps {
  theme: Theme;
  userId?: string;
  initialCategory?: CategoryId | null;
}

export default function ExploreTab({ theme: T, userId, initialCategory }: ExploreTabProps) {
  const { profile } = useProfile(userId);
  const [search, setSearch] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [category, setCategory] = useState<CategoryId | null>(initialCategory ?? null);
const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [pendingCenter, setPendingCenter] = useState<[number, number] | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [selectedLoc, setSelectedLoc] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [requestStates, setRequestStates] = useState<Record<string, string>>({});
  const [requestMsg, setRequestMsg] = useState('');
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (profile?.home_lat && profile?.home_lng && !center) {
      setCenter([profile.home_lat, profile.home_lng]);
    }
  }, [profile]);

  // Sync if parent navigates to a new initialCategory
  useEffect(() => {
    if (initialCategory !== undefined) setCategory(initialCategory);
  }, [initialCategory]);

  const useGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPendingCenter(coords);
        mapRef.current?.flyTo(coords, 12, { duration: 0.5 });
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
    );
  };

  const { rooms, roomsWithCoords, locationGroups, loading, total } =
    useExploreRooms(search, category, center, radiusKm);

  const displayRooms = selectedLoc
    ? rooms.filter(r => (r.location_name ?? 'No location set') === selectedLoc)
    : center
      ? rooms
      : null;

  const checkRequestStatus = async (roomId: string) => {
    if (!userId || requestStates[roomId]) return;
    const status = await getMyRequestStatus(userId, roomId);
    setRequestStates(prev => ({ ...prev, [roomId]: status }));
  };

  const handleRequestJoin = async (roomId: string, roomName: string) => {
    if (!userId || !profile) return;
    setRequestStates(prev => ({ ...prev, [roomId]: 'sending' }));
    const { error } = await submitJoinRequest(
      userId, roomId,
      profile.display_name ?? roomName,
      requestMsg.trim() || undefined,
    );
    setRequestStates(prev => ({ ...prev, [roomId]: error ? 'none' : 'pending' }));
    setRequestingId(null);
    setRequestMsg('');
  };

  const openMapDialog = () => {
    setPendingCenter(center);
    setMapDialogOpen(true);
  };

  const confirmMapLocation = () => {
    if (pendingCenter) {
      setCenter(pendingCenter);
      setSelectedLoc(null);
    }
    setMapDialogOpen(false);
  };

  const clearCenter = () => {
    setCenter(null);
    setSelectedLoc(null);
  };

  const selectedCat = category ? CATEGORIES.find(c => c.id === category) : null;
  const selectedDetail = category ? CATEGORY_DETAILS[category as keyof typeof CATEGORY_DETAILS] : null;
  // Always use the category's own brand theme for the hero + active chip — never the global T
  const selectedCatTheme = category ? (THEMES[category as keyof typeof THEMES] ?? T) : T;
  const roomIcon = makeRoomIcon(T.primary);
  const centerIcon = makeCenterIcon();

  return (
    <div style={{ paddingBottom: 32 }}>
      <style>{`
        .leaflet-container { font-family: "DM Sans", system-ui, sans-serif; }
        .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,.15); }
        .leaflet-popup-content { margin: 10px 14px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Hero ── */}
      {selectedCat && selectedDetail ? (
        <div style={{ position: 'relative', overflow: 'hidden', background: selectedCatTheme.primary, display: 'flex', minHeight: 300 }}>
          <div style={{ flex: '1 1 55%', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '48px 20px 24px 20px', zIndex: 2 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 75%, rgba(0,0,0,0) 100%)', zIndex: 0 }} />
            <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 3 }}>
              <PixelHeart color={selectedCatTheme.highlight} size={16} />
            </div>
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <selectedCat.Icon size={18} style={{ color: '#fff', opacity: 0.9 }} strokeWidth={1.8} />
                <p className="font-pixel" style={{ fontSize: 18, color: '#F1EDE1', margin: 0, letterSpacing: 2, textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>{selectedCat.name.toUpperCase()}</p>
                <span style={{ fontSize: 9, fontWeight: 700, background: selectedCatTheme.accent, color: '#F1EDE1', padding: '2px 7px', borderRadius: 8, letterSpacing: 0.5 }}>LIVE</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(241,237,225,0.85)', margin: 0, lineHeight: 1.6, maxWidth: 260 }}>{selectedDetail.description}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selectedDetail.highlights.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <h.Icon size={13} strokeWidth={1.8} style={{ color: '#F1EDE1' }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'rgba(241,237,225,0.9)' }}>{h.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                {selectedDetail.stats.map((s, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', padding: '7px 4px', background: 'rgba(255,255,255,0.12)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)' }}>
                    <p className="font-display" style={{ fontSize: 15, fontWeight: 800, color: '#F1EDE1', margin: 0 }}>{s.value}</p>
                    <p style={{ fontSize: 10, color: 'rgba(241,237,225,0.7)', margin: '1px 0 0' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ flex: '0 0 45%', position: 'relative', overflow: 'hidden' }}>
            <img src={selectedCat.image ?? '/cover.png'} alt={selectedCat.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, rgba(0,0,0,0) 50%, rgba(0,0,0,0.25) 100%)' }} />
          </div>
        </div>
      ) : (
        <div style={{ padding: '28px 16px 0' }}>
          <p className="font-pixel" style={{ fontSize: 13, color: T.accent, margin: '0 0 3px', letterSpacing: 1 }}>EXPLORE</p>
          <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: '0 0 4px', lineHeight: 1.15 }}>Find activities near you.</h2>
          <p style={{ fontSize: 14, color: T.textMuted, margin: '0 0 4px' }}>
            {loading ? 'Loading rooms…' : `${total} rooms across the Philippines`}
          </p>
        </div>
      )}

      {/* ── Live category chips ── */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', padding: '14px 16px', background: T.bg }}>
        <button
          onClick={() => { setCategory(null); setSelectedLoc(null); }}
          style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1.5px solid ${!category ? T.primary : T.border}`, background: !category ? T.primary : T.surface, color: !category ? T.bg : T.text, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease' }}
        >
          All
        </button>
        {LIVE_CATEGORIES.map(cat => {
          const active = category === cat.id;
          const chipColor = CATEGORY_COLORS[cat.id] ?? { primary: T.primary, light: T.surfaceAlt, text: T.text };
          return (
            <button
              key={cat.id}
              onClick={() => { setCategory(active ? null : cat.id); setSelectedLoc(null); }}
              style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1.5px solid ${active ? chipColor.primary : T.border}`, background: active ? chipColor.primary : T.surface, color: active ? '#fff' : T.text, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 150ms ease' }}
            >
              <cat.Icon size={13} strokeWidth={active ? 2.2 : 1.8} />
              {cat.name}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        {/* ── Search ── */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedLoc(null); }}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setSearchFocus(false)}
            placeholder="Search rooms, hosts, locations…"
            style={{ width: '100%', height: 48, padding: '0 40px 0 44px', borderRadius: 14, fontSize: 14, boxSizing: 'border-box', fontFamily: '"DM Sans",system-ui,sans-serif', border: `2px solid ${searchFocus ? T.primary : T.border}`, background: T.surface, color: T.text, outline: 'none', transition: 'border-color 200ms ease' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', alignItems: 'center' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* ── Location filter row ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {center ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${T.accent}`, background: `${T.accent}18`, color: T.accent, fontSize: 12, fontWeight: 600 }}>
                <MapPin size={13} /> Near me
              </div>
              {RADIUS_OPTIONS.map(km => (
                <button key={km} onClick={() => setRadiusKm(km)}
                  style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1.5px solid ${radiusKm === km ? T.primary : T.border}`, background: radiusKm === km ? T.primary : T.surface, color: radiusKm === km ? T.bg : T.text, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease' }}>
                  {km} km
                </button>
              ))}
              <button onClick={clearCenter}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1.5px solid ${T.border}`, background: 'transparent', color: T.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>
                <X size={12} /> Clear
              </button>
            </>
          ) : (
            <>
              {profile?.home_lat && (
                <button onClick={() => { setCenter([profile.home_lat!, profile.home_lng!]); setSelectedLoc(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1.5px solid ${T.primary}`, background: `${T.primary}12`, color: T.primary, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Home size={12} /> Use Home
                </button>
              )}
              <button onClick={openMapDialog}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1.5px solid ${T.border}`, background: T.surface, color: T.text, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Map size={12} /> Pick on Map
              </button>
              <button onClick={() => { useGPS(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1.5px solid ${T.border}`, background: T.surface, color: T.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Navigation size={12} /> {gpsLoading ? 'Finding…' : 'My Location'}
              </button>
            </>
          )}
        </div>

        {/* ── Results summary ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p className="font-pixel" style={{ fontSize: 12, color: T.textMuted, margin: 0, letterSpacing: 1 }}>
            {selectedLoc
              ? `ROOMS IN ${selectedLoc.toUpperCase()}`
              : center
                ? `${rooms.length} ROOMS WITHIN ${radiusKm}KM`
                : search || category
                  ? `${rooms.length} RESULTS`
                  : 'ACTIVE AREAS'}
          </p>
          {selectedLoc && (
            <button onClick={() => setSelectedLoc(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.primary, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              <X size={12} /> Back
            </button>
          )}
        </div>

        {/* ── Location groups ── */}
        {!displayRooms && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} style={{ height: 66, borderRadius: 14, background: T.surfaceAlt, border: `1.5px solid ${T.border}`, opacity: 0.5 }} />
              ))
            ) : locationGroups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: T.textMuted }}>
                <MapPin size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
                <p style={{ fontSize: 14, margin: 0 }}>No rooms found{search ? ` for "${search}"` : ''}.</p>
                <p style={{ fontSize: 12, margin: '4px 0 0' }}>Be the first to create one!</p>
              </div>
            ) : (
              locationGroups.map((loc, i) => (
                <div key={i}
                  onClick={() => setSelectedLoc(loc.name)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 14, cursor: 'pointer', transition: 'transform 150ms ease' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(4px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateX(0)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MapPin size={18} strokeWidth={1.8} style={{ color: T.primary }} />
                    </div>
                    <div>
                      <p className="font-display" style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>{loc.name}</p>
                      <p style={{ fontSize: 12, color: T.textMuted, margin: '1px 0 0' }}>{loc.count} active room{loc.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, background: T.surfaceAlt, color: T.primary, padding: '4px 10px', borderRadius: 10 }}>{loc.count}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Room cards ── */}
        {displayRooms && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayRooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: T.textMuted }}>
                <p style={{ fontSize: 14, margin: 0 }}>No rooms here yet.</p>
              </div>
            ) : (
              displayRooms.map(room => {
                const cat = CATEGORY_COLORS[room.category] ?? { primary: T.primary, light: T.surfaceAlt, text: T.primary };
                return (
                <div key={room.id}
                  style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderLeft: `4px solid ${cat.primary}`, borderRadius: 16, overflow: 'hidden', transition: 'box-shadow 150ms ease' }}
                  onMouseEnter={e => { checkRequestStatus(room.id); (e.currentTarget.style.boxShadow = `4px 4px 0 ${cat.primary}40`); }}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                >
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, background: cat.light, color: cat.text, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase' }}>{room.category}</span>
                          {room.status === 'live' && <span style={{ fontSize: 10, fontWeight: 700, background: T.accent, color: '#fff', padding: '2px 8px', borderRadius: 8 }}>LIVE</span>}
                          {room.is_private && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, background: T.border, color: T.textMuted, padding: '2px 8px', borderRadius: 8 }}><Lock size={9} />PRIVATE</span>}
                        </div>
                        <p className="font-display" style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: '0 0 2px' }}>{room.name}</p>
                        <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>by {room.host_name}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.textMuted, flexShrink: 0 }}>
                        <Users size={13} />
                        <span>{room.member_count}/{room.max_members}</span>
                      </div>
                    </div>
                    {room.description && <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 6px', lineHeight: 1.5 }}>{room.description}</p>}
                    {room.location_name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.textMuted, marginBottom: 4 }}>
                        <MapPin size={12} /><span>{room.location_name}</span>
                      </div>
                    )}
                  </div>

                  {userId && room.user_id !== userId && (() => {
                    const reqState = requestStates[room.id] ?? 'none';
                    const isOpen = requestingId === room.id;
                    return (
                      <div style={{ borderTop: `1px solid ${T.border}`, padding: '10px 14px', background: T.surfaceAlt }}>
                        {reqState === 'pending' || reqState === 'approved' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#15803D', fontWeight: 600 }}>
                            <Check size={14} />
                            {reqState === 'approved' ? 'Request approved!' : 'Request sent — awaiting approval'}
                          </div>
                        ) : isOpen ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <input
                              value={requestMsg}
                              onChange={e => setRequestMsg(e.target.value)}
                              placeholder="Optional message to the host…"
                              maxLength={120}
                              style={{ width: '100%', height: 40, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', border: `1.5px solid ${T.border}`, borderRadius: 10, background: T.surface, color: T.text, outline: 'none', boxSizing: 'border-box' }}
                            />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => handleRequestJoin(room.id, room.name)}
                                disabled={reqState === 'sending'}
                                style={{ flex: 1, height: 36, borderRadius: 18, border: 'none', background: T.primary, color: T.bg, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <Send size={13} /> {reqState === 'sending' ? 'Sending…' : 'Send Request'}
                              </button>
                              <button onClick={() => { setRequestingId(null); setRequestMsg(''); }}
                                style={{ height: 36, padding: '0 14px', borderRadius: 18, border: `1.5px solid ${T.border}`, background: 'none', color: T.textMuted, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { checkRequestStatus(room.id); setRequestingId(room.id); }}
                            style={{ width: '100%', height: 36, borderRadius: 18, border: `1.5px solid ${T.primary}`, background: `${T.primary}12`, color: T.primary, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <Send size={13} /> Request to Join
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── Map picker dialog ── */}
      {mapDialogOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) setMapDialogOpen(false); }}
        >
          <div style={{ width: '100%', maxWidth: 580, background: T.bg, borderRadius: 20, border: `2px solid ${T.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 40px)', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
            {/* Dialog header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1.5px solid ${T.border}` }}>
              <div>
                <p className="font-pixel" style={{ fontSize: 13, color: T.accent, margin: '0 0 2px', letterSpacing: 1 }}>LOCATION FILTER</p>
                <p className="font-display" style={{ fontSize: 17, fontWeight: 800, color: T.text, margin: 0 }}>
                  {pendingCenter ? 'Tap to move pin' : 'Tap the map to set location'}
                </p>
              </div>
              <button onClick={() => setMapDialogOpen(false)}
                style={{ width: 34, height: 34, borderRadius: '50%', border: `1.5px solid ${T.border}`, background: T.surfaceAlt, color: T.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            {/* GPS shortcut bar */}
            <div style={{ display: 'flex', gap: 8, padding: '10px 16px', borderBottom: `1px solid ${T.border}`, background: T.surface, flexWrap: 'wrap' }}>
              <button onClick={useGPS} disabled={gpsLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1.5px solid ${T.border}`, background: T.bg, color: T.text, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Navigation size={12} /> {gpsLoading ? 'Locating…' : 'Use my GPS'}
              </button>
              {profile?.home_lat && (
                <button onClick={() => { setPendingCenter([profile.home_lat!, profile.home_lng!]); mapRef.current?.flyTo([profile.home_lat!, profile.home_lng!], 12, { duration: 0.5 }); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1.5px solid ${T.primary}`, background: `${T.primary}12`, color: T.primary, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Home size={12} /> Home
                </button>
              )}
              {pendingCenter && (
                <button onClick={() => setPendingCenter(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1.5px solid ${T.border}`, background: 'transparent', color: T.textMuted, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto' }}>
                  <X size={12} /> Clear pin
                </button>
              )}
            </div>

            {/* Map */}
            <div style={{ height: 360, position: 'relative', flexShrink: 0 }}>
              <MapContainer
                center={pendingCenter ?? PH_CENTER}
                zoom={pendingCenter ? 11 : 6}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef as any}
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onMapClick={(lat, lng) => setPendingCenter([lat, lng])} />
                {roomsWithCoords.map(room => (
                  <Marker key={room.id} position={[room.location_lat!, room.location_lng!]} icon={roomIcon} />
                ))}
                {pendingCenter && (
                  <>
                    <Marker position={pendingCenter} icon={centerIcon} />
                    <Circle
                      center={pendingCenter}
                      radius={radiusKm * 1000}
                      pathOptions={{ color: T.primary, fillColor: T.primary, fillOpacity: 0.08, weight: 2, dashArray: '6 4' }}
                    />
                  </>
                )}
              </MapContainer>
            </div>

            {/* Radius + confirm */}
            <div style={{ padding: '14px 16px', borderTop: `1.5px solid ${T.border}`, background: T.surface, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.textMuted }}>Radius:</span>
              {RADIUS_OPTIONS.map(km => (
                <button key={km} onClick={() => setRadiusKm(km)}
                  style={{ padding: '5px 11px', borderRadius: 16, fontSize: 12, fontWeight: 600, border: `1.5px solid ${radiusKm === km ? T.primary : T.border}`, background: radiusKm === km ? T.primary : T.bg, color: radiusKm === km ? T.bg : T.text, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease' }}>
                  {km} km
                </button>
              ))}
              <button
                onClick={confirmMapLocation}
                disabled={!pendingCenter}
                style={{ marginLeft: 'auto', height: 38, padding: '0 20px', borderRadius: 19, border: 'none', background: pendingCenter ? T.primary : T.border, color: pendingCenter ? T.bg : T.textMuted, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: pendingCenter ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <MapPin size={13} /> Apply Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
