import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X, Navigation, Users, Lock, Home, Send, Check, Map, Calendar, Gamepad2, ShoppingBasket, Coffee, Heart, Clock } from 'lucide-react';
import type { Room } from '@/types';
import { useProfile } from '@/hooks/useProfile';
import { submitJoinRequest, getMyRequestStatus } from '@/hooks/useJoinRequests';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CATEGORIES, CATEGORY_DETAILS } from '@/data/themes';
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
const PH_CENTER: [number, number] = [12.8797, 121.774];
const LIVE_CATEGORIES = CATEGORIES.filter(c => c.status === 'live');

const IMG = (n: string) =>
  `https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/${n}`;

const CAT_STYLE: Record<string, {
  headerBg: string; headerText: string; badgeBg: string; badgeText: string;
  image: string; Icon: typeof Gamepad2; whatLabel: string;
}> = {
  rotary:  { headerBg: '#9F5E0F', headerText: '#FEF3E2', badgeBg: '#FEF3E2', badgeText: '#9F5E0F', image: IMG('rotary.png'),  Icon: Heart,          whatLabel: 'Service' },
  gaming:  { headerBg: '#1E1B4B', headerText: '#EDE9FE', badgeBg: '#EDE9FE', badgeText: '#4F46E5', image: IMG('gaming.png'),  Icon: Gamepad2,       whatLabel: 'Game' },
  cafe:    { headerBg: '#7F3B19', headerText: '#FEF3E2', badgeBg: '#FEF3E2', badgeText: '#7F3B19', image: IMG('coffee.png'),  Icon: Coffee,         whatLabel: 'Venue' },
  pasabuy: { headerBg: '#B45309', headerText: '#FFFBEB', badgeBg: '#FFFBEB', badgeText: '#B45309', image: IMG('pasabuy.png'), Icon: ShoppingBasket, whatLabel: 'Items' },
};

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) + ', ' +
    d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
}

function fmtNeededBy(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = d.getTime() - Date.now();
  const hrs = Math.round(diff / 3_600_000);
  if (hrs < 0) return 'Overdue';
  if (hrs < 1) return 'Due soon';
  if (hrs < 24) return `in ${hrs}h`;
  return `by ${d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`;
}

interface RoomCardProps {
  room: Room;
  userId?: string;
  outerTheme: { border: string; text: string; surface: string; surfaceAlt: string; primary: string; bg: string; textMuted: string; accent: string };
  reqState: string;
  requestingId: string | null;
  requestMsg: string;
  joinError?: string;
  onRequestMsg: (v: string) => void;
  onOpenRequest: () => void;
  onSendRequest: () => void;
  onCancelRequest: () => void;
}

function RoomCard({ room, userId, outerTheme: T, reqState, requestingId, requestMsg, joinError, onRequestMsg, onOpenRequest, onSendRequest, onCancelRequest }: RoomCardProps) {
  const cat = CAT_STYLE[room.category] ?? CAT_STYLE.rotary;
  const CatIcon = cat.Icon;
  const isOwn = userId === room.user_id;
  const isOpen = requestingId === room.id;
  const pct = Math.min(100, Math.round((room.member_count / room.max_members) * 100));

  const memberLabel = room.category === 'gaming' ? 'players'
    : room.category === 'cafe' ? 'guests'
    : room.category === 'pasabuy' ? 'agents'
    : 'members';

  // What to show for the "what" row
  const whatValue = room.category === 'gaming'
    ? room.game_name ?? null
    : room.category === 'pasabuy'
    ? (room.items?.length ? `${room.items.length} item${room.items.length !== 1 ? 's' : ''} · ${room.items.slice(0, 2).map(i => i.name).join(', ')}${room.items.length > 2 ? ` +${room.items.length - 2}` : ''}` : room.location_name)
    : room.location_name;

  const whenValue = room.category === 'pasabuy'
    ? fmtNeededBy(room.needed_by ?? room.event_date)
    : fmtDate(room.event_date);

  const whereValue = room.category === 'gaming'
    ? (room.game_id ? `ID: ${room.game_id}` : null)
    : room.category === 'pasabuy'
    ? (room.dropoff_name ?? room.location_name)
    : room.location_name;

  return (
    <div style={{
      borderRadius: 18, overflow: 'hidden',
      border: `2px solid ${cat.headerBg}33`,
      boxShadow: `4px 4px 0 ${cat.headerBg}22`,
      transition: 'box-shadow 150ms ease, transform 150ms ease',
      background: T.surface,
    }}
      onMouseEnter={e => { (e.currentTarget.style.boxShadow = `6px 6px 0 ${cat.headerBg}55`); (e.currentTarget.style.transform = 'translateY(-1px)'); }}
      onMouseLeave={e => { (e.currentTarget.style.boxShadow = `4px 4px 0 ${cat.headerBg}22`); (e.currentTarget.style.transform = 'none'); }}
    >
      {/* ── Colored header ── */}
      <div style={{ background: cat.headerBg, padding: '14px 16px 12px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        {/* Grid pattern */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)', backgroundSize: '14px 14px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', flex: 1 }}>
          {/* Badges row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 800, background: cat.badgeBg, color: cat.badgeText, padding: '2px 8px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <CatIcon size={9} />{room.category}
            </span>
            {room.status === 'live' && <span style={{ fontSize: 9, fontWeight: 800, background: '#C82718', color: '#fff', padding: '2px 8px', borderRadius: 8 }}>LIVE</span>}
            {room.is_private && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, background: 'rgba(0,0,0,0.3)', color: cat.headerText, padding: '2px 7px', borderRadius: 8 }}><Lock size={8} />PRIVATE</span>}
          </div>

          <h3 style={{ fontFamily: '"Bricolage Grotesque",serif', fontSize: 16, fontWeight: 800, color: cat.headerText, margin: '0 0 2px', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            {room.name}
          </h3>
          <p style={{ fontSize: 11, color: `${cat.headerText}aa`, margin: 0, fontWeight: 500 }}>by {room.host_name}</p>
        </div>

        {/* Category image */}
        <img src={cat.image} alt="" style={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0, position: 'relative', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
      </div>

      {/* ── Card body ── */}
      <div style={{ padding: '12px 16px 14px' }}>
        {/* WHEN / WHERE / WHAT rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
          {whenValue && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: T.text }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: `${cat.headerBg}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {room.category === 'pasabuy' ? <Clock size={11} style={{ color: cat.headerBg }} /> : <Calendar size={11} style={{ color: cat.headerBg }} />}
              </div>
              <span style={{ fontWeight: 600 }}>{whenValue}</span>
            </div>
          )}
          {whereValue && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: T.textMuted }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: `${cat.headerBg}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {room.category === 'gaming' ? <Gamepad2 size={11} style={{ color: cat.headerBg }} /> : <MapPin size={11} style={{ color: cat.headerBg }} />}
              </div>
              <span>{whereValue}</span>
            </div>
          )}
          {whatValue && room.category !== 'pasabuy' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: T.textMuted }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: `${cat.headerBg}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CatIcon size={11} style={{ color: cat.headerBg }} />
              </div>
              <span>{whatValue}</span>
            </div>
          )}
          {room.category === 'pasabuy' && whatValue && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: T.textMuted }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: `${cat.headerBg}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <ShoppingBasket size={11} style={{ color: cat.headerBg }} />
              </div>
              <span style={{ lineHeight: 1.4 }}>{whatValue}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {room.description && (
          <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 10px', lineHeight: 1.5, borderLeft: `2px solid ${cat.headerBg}44`, paddingLeft: 8 }}>
            {room.description.length > 100 ? room.description.slice(0, 100) + '…' : room.description}
          </p>
        )}

        {/* Member bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: T.surfaceAlt, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: pct >= 90 ? '#C82718' : cat.headerBg, transition: 'width 400ms ease' }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, flexShrink: 0 }}>
            {room.member_count}/{room.max_members} {memberLabel}
          </span>
        </div>
      </div>

      {/* ── Join action ── */}
      {userId && !isOwn && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: '10px 14px', background: `${cat.headerBg}08` }}>
          {reqState === 'pending' || reqState === 'approved' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#15803D', fontWeight: 600 }}>
              <Check size={14} />
              {reqState === 'approved' ? 'Request approved!' : 'Request sent — awaiting approval'}
            </div>
          ) : isOpen ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={requestMsg}
                onChange={e => onRequestMsg(e.target.value)}
                placeholder="Optional message to the host…"
                maxLength={120}
                style={{ width: '100%', height: 40, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', border: `1.5px solid ${T.border}`, borderRadius: 10, background: T.surface, color: T.text, outline: 'none', boxSizing: 'border-box' as const }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={onSendRequest} disabled={reqState === 'sending'}
                  style={{ flex: 1, height: 36, borderRadius: 18, border: 'none', background: cat.headerBg, color: cat.headerText, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Send size={13} /> {reqState === 'sending' ? 'Sending…' : 'Send Request'}
                </button>
                <button onClick={onCancelRequest}
                  style={{ height: 36, padding: '0 14px', borderRadius: 18, border: `1.5px solid ${T.border}`, background: 'none', color: T.textMuted, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {joinError && (
                <p style={{ fontSize: 11, color: '#B91C1C', background: '#FEE2E2', padding: '6px 10px', borderRadius: 8, margin: '0 0 8px' }}>{joinError}</p>
              )}
              <button onClick={onOpenRequest}
                style={{ width: '100%', height: 36, borderRadius: 18, border: `1.5px solid ${cat.headerBg}`, background: `${cat.headerBg}12`, color: cat.headerBg, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Send size={13} />
                {room.category === 'pasabuy' ? 'Apply as Agent' : 'Request to Join'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

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

  // Show all rooms by default; filter by location group or map center when active.
  // PasaBuy rooms have no lat/lng so they must always be reachable without a map filter.
  const displayRooms = selectedLoc
    ? rooms.filter(r => (r.location_name ?? 'No location set') === selectedLoc)
    : rooms;

  const checkRequestStatus = async (roomId: string) => {
    if (!userId || requestStates[roomId]) return;
    const status = await getMyRequestStatus(userId, roomId);
    setRequestStates(prev => ({ ...prev, [roomId]: status }));
  };

  const [joinError, setJoinError] = useState<Record<string, string>>({});

  const handleRequestJoin = async (roomId: string, roomName: string) => {
    if (!userId) return;
    const displayName = profile?.display_name ?? roomName;
    setRequestStates(prev => ({ ...prev, [roomId]: 'sending' }));
    setJoinError(prev => ({ ...prev, [roomId]: '' }));
    const { error } = await submitJoinRequest(
      userId, roomId,
      displayName,
      requestMsg.trim() || undefined,
    );
    if (error) {
      setRequestStates(prev => ({ ...prev, [roomId]: 'none' }));
      setJoinError(prev => ({ ...prev, [roomId]: error }));
    } else {
      setRequestStates(prev => ({ ...prev, [roomId]: 'pending' }));
      setRequestingId(null);
      setRequestMsg('');
    }
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
        <div style={{ position: 'relative', overflow: 'hidden', background: T.primary, display: 'flex', minHeight: 300 }}>
          <div style={{ flex: '1 1 55%', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '48px 20px 24px 20px', zIndex: 2 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 75%, rgba(0,0,0,0) 100%)', zIndex: 0 }} />
            <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 3 }}>
              <PixelHeart color="#EEA64C" size={16} />
            </div>
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <selectedCat.Icon size={18} style={{ color: '#fff', opacity: 0.9 }} strokeWidth={1.8} />
                <p className="font-pixel" style={{ fontSize: 18, color: '#F1EDE1', margin: 0, letterSpacing: 2, textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>{selectedCat.name.toUpperCase()}</p>
                <span style={{ fontSize: 9, fontWeight: 700, background: T.accent, color: '#F1EDE1', padding: '2px 7px', borderRadius: 8, letterSpacing: 0.5 }}>LIVE</span>
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
            <img src={selectedCat.image ?? 'https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/cover.png'} alt={selectedCat.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
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
          return (
            <button
              key={cat.id}
              onClick={() => { setCategory(active ? null : cat.id); setSelectedLoc(null); }}
              style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1.5px solid ${active ? T.primary : T.border}`, background: active ? T.primary : T.surface, color: active ? T.bg : T.text, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 150ms ease' }}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayRooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: T.textMuted }}>
                <p style={{ fontSize: 14, margin: 0 }}>No rooms here yet.</p>
              </div>
            ) : (
              displayRooms.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  userId={userId}
                  outerTheme={T}
                  reqState={requestStates[room.id] ?? 'none'}
                  requestingId={requestingId}
                  requestMsg={requestMsg}
                  joinError={joinError[room.id]}
                  onRequestMsg={setRequestMsg}
                  onOpenRequest={() => { checkRequestStatus(room.id); setRequestingId(room.id); }}
                  onSendRequest={() => handleRequestJoin(room.id, room.name)}
                  onCancelRequest={() => { setRequestingId(null); setRequestMsg(''); setJoinError(prev => ({ ...prev, [room.id]: '' })); }}
                />
              ))
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
