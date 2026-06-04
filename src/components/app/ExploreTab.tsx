import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X, Navigation, Users, Lock, Home, Send, Check } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { submitJoinRequest, getMyRequestStatus } from '@/hooks/useJoinRequests';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CATEGORIES } from '@/data/themes';
import { useExploreRooms } from '@/hooks/useExploreRooms';
import type { CategoryId, Theme } from '@/types';

// Fix Leaflet default icon paths for Vite/bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const RADIUS_OPTIONS = [5, 10, 25, 50] as const;

// Philippines center — good overview
const PH_CENTER: [number, number] = [12.8797, 121.774];

function makeRoomIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function makeCenterIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:20px;height:20px;border-radius:50%;background:#C82718;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.5)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

interface ExploreTabProps {
  theme: Theme;
  userId?: string;
}

export default function ExploreTab({ theme: T, userId }: ExploreTabProps) {
  const { profile } = useProfile(userId);
  const [search, setSearch]           = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [category, setCategory]       = useState<CategoryId | null>(null);
  const [center, setCenter]           = useState<[number, number] | null>(null);
  const [radiusKm, setRadiusKm]       = useState<number>(10);
  const [selectedLoc, setSelectedLoc] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading]   = useState(false);
  // roomId → 'none' | 'pending' | 'approved' | 'sending'
  const [requestStates, setRequestStates] = useState<Record<string, string>>({});
  const [requestMsg, setRequestMsg]   = useState('');
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Pre-set center from profile home location on load
  useEffect(() => {
    if (profile?.home_lat && profile?.home_lng && !center) {
      setCenter([profile.home_lat, profile.home_lng]);
    }
  }, [profile]);

  const jumpToHome = () => {
    if (profile?.home_lat && profile?.home_lng) {
      setCenter([profile.home_lat, profile.home_lng]);
      setSelectedLoc(null);
      mapRef.current?.flyTo([profile.home_lat, profile.home_lng], 12, { duration: 1 });
    }
  };

  const useGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCenter(coords);
        setSelectedLoc(null);
        mapRef.current?.flyTo(coords, 12, { duration: 1 });
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
    );
  };

  const { rooms, roomsWithCoords, locationGroups, loading, total } =
    useExploreRooms(search, category, center, radiusKm);

  // If a location group is selected, show its rooms
  const displayRooms = selectedLoc
    ? rooms.filter(r => (r.location_name ?? 'No location set') === selectedLoc)
    : center
    ? rooms
    : null;

  const handleMapClick = (lat: number, lng: number) => {
    setCenter([lat, lng]);
    setSelectedLoc(null);
  };

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

  const clearCenter = () => {
    setCenter(null);
    setSelectedLoc(null);
  };

  const roomIcon = makeRoomIcon(T.primary);
  const centerIcon = makeCenterIcon();

  return (
    <div style={{ padding: '20px 16px 32px' }}>
      <style>{`
        .leaflet-container { font-family: "DM Sans", system-ui, sans-serif; }
        .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,.15); }
        .leaflet-popup-content { margin: 10px 14px; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p className="font-pixel" style={{ fontSize: 13, color: T.accent, margin: '0 0 3px', letterSpacing: 1 }}>EXPLORE</p>
        <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: '0 0 4px', lineHeight: 1.15 }}>
          Find activities near you.
        </h2>
        <p style={{ fontSize: 14, color: T.textMuted, margin: 0 }}>
          {loading ? 'Loading rooms…' : `${total} rooms across the Philippines`}
        </p>
      </div>

      {/* Search */}
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

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16, scrollbarWidth: 'none' }}>
        <button onClick={() => setCategory(null)}
          style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: `2px solid ${!category ? T.primary : T.border}`, background: !category ? T.primary : T.surface, color: !category ? T.bg : T.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 200ms ease' }}>
          All
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setCategory(category === cat.id ? null : cat.id)}
            style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: `2px solid ${category === cat.id ? T.primary : T.border}`, background: category === cat.id ? T.primary : T.surface, color: category === cat.id ? T.bg : T.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 200ms ease', opacity: cat.status === 'soon' ? 0.55 : 1 }}>
            <cat.Icon size={14} strokeWidth={2} />
            {cat.name}
          </button>
        ))}
      </div>

      {/* Map */}
      <div style={{ borderRadius: 20, overflow: 'hidden', border: `3px solid ${T.text}`, boxShadow: `6px 6px 0 ${T.text}`, marginBottom: 12, position: 'relative' }}>
        <MapContainer
          center={PH_CENTER}
          zoom={6}
          style={{ height: 280, width: '100%' }}
          ref={mapRef as any}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onMapClick={handleMapClick} />

          {/* Room markers */}
          {roomsWithCoords.map(room => (
            <Marker
              key={room.id}
              position={[room.location_lat!, room.location_lng!]}
              icon={roomIcon}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#06131B', margin: '0 0 2px' }}>{room.name}</p>
                  <p style={{ fontSize: 11, color: '#5A5448', margin: '0 0 4px' }}>by {room.host_name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#5A5448' }}>{room.member_count}/{room.max_members} members</span>
                    {room.is_private && <span style={{ fontSize: 10, fontWeight: 700, background: '#F3F4F6', color: '#6B7280', padding: '1px 6px', borderRadius: 6 }}>PRIVATE</span>}
                  </div>
                  {room.location_name && <p style={{ fontSize: 11, color: '#5A5448', margin: '4px 0 0' }}>📍 {room.location_name}</p>}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Center marker + radius circle */}
          {center && (
            <>
              <Marker position={center} icon={centerIcon} />
              <Circle
                center={center}
                radius={radiusKm * 1000}
                pathOptions={{ color: T.primary, fillColor: T.primary, fillOpacity: 0.08, weight: 2, dashArray: '6 4' }}
              />
            </>
          )}
        </MapContainer>

        {/* Map hint overlay */}
        {!center && (
          <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', border: `1.5px solid ${T.border}`, borderRadius: 20, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
            <MapPin size={13} style={{ color: T.accent }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Tap map to search by location</span>
          </div>
        )}
      </div>

      {/* Location shortcuts + radius */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        {profile?.home_lat && (
          <button onClick={jumpToHome}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600, border: `1.5px solid ${T.primary}`, background: `${T.primary}12`, color: T.primary, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Home size={12} /> Home
          </button>
        )}
        <button onClick={useGPS} disabled={gpsLoading}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600, border: `1.5px solid ${T.border}`, background: T.surface, color: T.textMuted, cursor: gpsLoading ? 'default' : 'pointer', fontFamily: 'inherit' }}>
          <Navigation size={12} /> {gpsLoading ? 'Finding…' : 'My Location'}
        </button>
        {center && (
          <>
            <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 600 }}>·</span>
            {RADIUS_OPTIONS.map(km => (
              <button key={km} onClick={() => setRadiusKm(km)}
                style={{ padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600, border: `1.5px solid ${radiusKm === km ? T.primary : T.border}`, background: radiusKm === km ? T.primary : T.surface, color: radiusKm === km ? T.bg : T.text, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease' }}>
                {km} km
              </button>
            ))}
            <button onClick={clearCenter}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600, border: `1.5px solid ${T.border}`, background: 'transparent', color: T.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>
              <X size={12} /> Clear
            </button>
          </>
        )}
      </div>

      {/* Results summary */}
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

      {/* Location groups (when no specific selection) */}
      {!displayRooms && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            [1,2,3,4].map(i => (
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

      {/* Room cards (when location or radius selected) */}
      {displayRooms && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayRooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: T.textMuted }}>
              <p style={{ fontSize: 14, margin: 0 }}>No rooms here yet.</p>
            </div>
          ) : (
            displayRooms.map(room => (
              <div key={room.id}
                style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 16, overflow: 'hidden', transition: 'box-shadow 150ms ease' }}
                onMouseEnter={e => { checkRequestStatus(room.id); (e.currentTarget.style.boxShadow = `4px 4px 0 ${T.text}`); }}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, background: T.surfaceAlt, color: T.primary, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase' }}>{room.category}</span>
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

                {/* Request to Join — only for non-owners */}
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
            ))
          )}
        </div>
      )}
    </div>
  );
}
