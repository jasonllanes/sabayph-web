import { useState, useEffect, useRef } from 'react';
import { ArrowRight, User, MapPin, Navigation, Check, Search, X, Loader } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PixelHeart } from '@/components/common/PixelDecorations';
import { supabase } from '@/lib/supabase';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const T = {
  bg: '#F1EDE1', surface: '#FFFFFF', surfaceAlt: '#E9E2D0',
  primary: '#043E81', accent: '#C82718', highlight: '#EEA64C',
  text: '#06131B', textMuted: '#5A5448', border: '#D6C09D',
};

const AGE_RANGES = ['18–24', '25–34', '35–44', '45+'];
const GENDERS    = ['Lalaki', 'Babae', 'Non-binary', 'Prefer not to say'];
const PH_CENTER: [number, number] = [12.8797, 121.774];

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

// Flies map to given coords when they change
function FlyTo({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => { if (coords) map.flyTo(coords, 13, { duration: 0.8 }); }, [coords]);
  return null;
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

interface ProfileSetupPageProps {
  userId: string;
  initialName?: string;
  onDone: () => void;
}

export default function ProfileSetupPage({ userId, initialName = '', onDone }: ProfileSetupPageProps) {
  const [displayName, setDisplayName]   = useState(initialName);
  const [ageRange, setAgeRange]         = useState('');
  const [bio, setBio]                   = useState('');
  const [gender, setGender]             = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [nameFocus, setNameFocus]       = useState(false);

  // Map dialog
  const [mapOpen, setMapOpen]           = useState(false);
  const [homeCoords, setHomeCoords]     = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [flyTo, setFlyTo]               = useState<[number, number] | null>(null);
  const [gpsLoading, setGpsLoading]     = useState(false);

  // Search
  const [searchQuery, setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openDialog = () => {
    setPendingCoords(homeCoords);
    setSearchQuery('');
    setSearchResults([]);
    setMapOpen(true);
  };

  const confirmLocation = () => {
    if (pendingCoords) setHomeCoords(pendingCoords);
    setMapOpen(false);
  };

  const useGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPendingCoords(coords);
        setFlyTo([coords.lat, coords.lng]);
        setGpsLoading(false);
        // Reverse geocode to get label
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`)
          .then(r => r.json())
          .then(d => { if (d.display_name) setLocationLabel(d.display_name.split(',').slice(0, 2).join(', ')); })
          .catch(() => {});
      },
      () => setGpsLoading(false),
    );
  };

  const runSearch = (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=ph`,
        );
        const data: NominatimResult[] = await res.json();
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  const pickResult = (r: NominatimResult) => {
    const coords = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
    setPendingCoords(coords);
    setFlyTo([coords.lat, coords.lng]);
    setLocationLabel(r.display_name.split(',').slice(0, 2).join(', '));
    setSearchResults([]);
    setSearchQuery(r.display_name.split(',').slice(0, 2).join(', '));
  };

  const handleMapPick = (lat: number, lng: number) => {
    setPendingCoords({ lat, lng });
    // Reverse geocode silently
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      .then(r => r.json())
      .then(d => {
        if (d.display_name) {
          const label = d.display_name.split(',').slice(0, 2).join(', ');
          setLocationLabel(label);
          setSearchQuery(label);
        }
      })
      .catch(() => {});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('Please enter a display name.'); return; }
    setError('');
    setLoading(true);

    const { error: err } = await supabase.from('profiles').upsert({
      id: userId,
      display_name: displayName.trim(),
      age_range: ageRange || null,
      location: locationLabel.trim() || null,
      bio: bio.trim() || null,
      gender: gender || null,
      home_lat: homeCoords?.lat ?? null,
      home_lng: homeCoords?.lng ?? null,
      profile_completed: true,
      updated_at: new Date().toISOString(),
    });

    setLoading(false);
    if (err) { setError(err.message); return; }
    onDone();
  };

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: '100%', height: 52, padding: '0 16px',
    fontSize: 15, fontFamily: '"DM Sans", system-ui, sans-serif',
    border: `2px solid ${focused ? T.primary : T.border}`,
    borderRadius: 12, background: T.surface,
    color: T.text, outline: 'none',
    transition: 'border-color 200ms ease',
    boxSizing: 'border-box',
  });

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 20, fontSize: 14, fontWeight: 600,
    border: `2px solid ${active ? T.primary : T.border}`,
    background: active ? `${T.primary}12` : T.surfaceAlt,
    color: active ? T.primary : T.textMuted,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease',
  });

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", system-ui, sans-serif', padding: '24px 16px', overflowY: 'auto' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Bricolage+Grotesque:wght@700;800&family=VT323&display=swap');
        .font-display{font-family:'Bricolage Grotesque',serif;letter-spacing:-0.02em;}
        .font-pixel{font-family:'VT323',monospace;}
        @keyframes fade-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fade-up 500ms ease-out both;}
        .chip-opt:hover{opacity:0.85;}
        .search-result-btn:hover{background:#F3F4F6!important;}
      `}</style>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.3, backgroundImage: `linear-gradient(${T.border} 1px,transparent 1px),linear-gradient(90deg,${T.border} 1px,transparent 1px)`, backgroundSize: '20px 20px' }} />

      <div className="fade-up" style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1, padding: '24px 0' }}>
        <div style={{ background: T.surface, border: `3px solid ${T.text}`, borderRadius: 24, boxShadow: `8px 8px 0 ${T.text}`, padding: '40px 36px' }}>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>👋</div>
            <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: '0 0 8px' }}>
              Kumusta! Tell us about yourself
            </h2>
            <p style={{ fontSize: 14, color: T.textMuted, margin: 0 }}>
              A few quick details so others know who you are in rooms.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Display Name */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <User size={14} /> Display Name <span style={{ color: T.accent }}>*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                onFocus={() => setNameFocus(true)}
                onBlur={() => setNameFocus(false)}
                placeholder="What should we call you?"
                maxLength={40}
                required
                style={inputStyle(nameFocus)}
              />
            </div>

            {/* Age Range */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'block', marginBottom: 8 }}>
                Age Range <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 400 }}>(optional)</span>
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {AGE_RANGES.map(r => (
                  <button key={r} type="button" className="chip-opt" onClick={() => setAgeRange(ageRange === r ? '' : r)} style={chipStyle(ageRange === r)}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'block', marginBottom: 8 }}>
                Gender <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 400 }}>(optional)</span>
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {GENDERS.map(g => (
                  <button key={g} type="button" className="chip-opt" onClick={() => setGender(gender === g ? '' : g)} style={{ ...chipStyle(gender === g), fontSize: 13, padding: '8px 14px' }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Short Bio */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'block', marginBottom: 6 }}>
                Short Bio <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell the community a bit about yourself…"
                maxLength={120}
                rows={3}
                style={{ width: '100%', padding: '12px 16px', fontSize: 15, fontFamily: '"DM Sans", system-ui, sans-serif', border: `2px solid ${T.border}`, borderRadius: 12, background: T.surface, color: T.text, outline: 'none', resize: 'none', lineHeight: 1.5, boxSizing: 'border-box' }}
              />
              <p style={{ fontSize: 11, color: T.textMuted, margin: '4px 0 0', textAlign: 'right' }}>{bio.length}/120</p>
            </div>

            {/* Home Location — triggers dialog */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <MapPin size={14} /> Home Location <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 400 }}>(optional)</span>
              </label>
              <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 10px', lineHeight: 1.5 }}>
                Used as your default search center in Explore.
              </p>
              <button
                type="button"
                onClick={openDialog}
                style={{ width: '100%', height: 48, borderRadius: 12, border: `2px solid ${homeCoords ? '#86EFAC' : T.border}`, background: homeCoords ? '#DCFCE7' : T.surfaceAlt, color: homeCoords ? '#15803D' : T.text, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 150ms ease' }}
              >
                {homeCoords ? (
                  <><Check size={14} /> {locationLabel || `${homeCoords.lat.toFixed(4)}, ${homeCoords.lng.toFixed(4)}`}</>
                ) : (
                  <><MapPin size={14} /> Set Home Location on Map</>
                )}
              </button>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#FEE2E2', borderRadius: 8, border: '1px solid #FCA5A5' }}>
                <p style={{ fontSize: 13, color: '#B91C1C', margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: loading ? T.border : T.primary, color: loading ? T.textMuted : T.surface, fontSize: 16, fontWeight: 700, fontFamily: 'inherit', cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 200ms ease', marginTop: 4 }}
            >
              {loading
                ? <span className="font-pixel" style={{ fontSize: 16, letterSpacing: 2 }}>SAVING...</span>
                : <>Handa na! Let's go <ArrowRight size={18} /></>
              }
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <PixelHeart color={T.accent} size={10} />
          <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>Made with love in the Philippines</p>
          <PixelHeart color={T.accent} size={10} />
        </div>
      </div>

      {/* ── Map Dialog ── */}
      {mapOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          {/* Backdrop */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setMapOpen(false)} />

          {/* Sheet */}
          <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', background: T.surface, borderRadius: '24px 24px 0 0', border: `2px solid ${T.border}`, borderBottom: 'none', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>

            {/* Handle + header */}
            <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: T.border, margin: '0 auto 14px' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <p className="font-pixel" style={{ fontSize: 13, color: T.accent, margin: 0, letterSpacing: 1 }}>PICK YOUR AREA</p>
                  <h3 className="font-display" style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: '2px 0 0' }}>Set Home Location</h3>
                </div>
                <button onClick={() => setMapOpen(false)} style={{ width: 36, height: 36, borderRadius: '50%', border: `1.5px solid ${T.border}`, background: T.surfaceAlt, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted }}>
                  <X size={16} />
                </button>
              </div>

              {/* Search input */}
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); runSearch(e.target.value); }}
                  placeholder="Search city, barangay, landmark…"
                  style={{ width: '100%', height: 46, paddingLeft: 42, paddingRight: searchQuery ? 42 : 16, fontSize: 14, fontFamily: '"DM Sans",system-ui,sans-serif', border: `2px solid ${T.border}`, borderRadius: 12, background: T.bg, color: T.text, outline: 'none', boxSizing: 'border-box' }}
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex' }}>
                    <X size={14} />
                  </button>
                )}
                {searchLoading && (
                  <Loader size={14} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, animation: 'spin 1s linear infinite' }} />
                )}
              </div>

              {/* Search results dropdown */}
              {searchResults.length > 0 && (
                <div style={{ border: `1.5px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 8, background: T.surface, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                  {searchResults.map(r => (
                    <button
                      key={r.place_id}
                      className="search-result-btn"
                      onClick={() => pickResult(r)}
                      style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'flex-start', gap: 10 }}
                    >
                      <MapPin size={14} style={{ color: T.primary, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13, color: T.text, lineHeight: 1.4 }}>{r.display_name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* GPS button */}
              <button
                type="button"
                onClick={useGPS}
                disabled={gpsLoading}
                style={{ width: '100%', height: 38, borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.surfaceAlt, color: T.text, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: gpsLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 12 }}
              >
                {gpsLoading ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Getting location…</> : <><Navigation size={13} /> Use my current location (GPS)</>}
              </button>
            </div>

            {/* Map */}
            <div style={{ flex: 1, minHeight: 260, position: 'relative' }}>
              <MapContainer center={pendingCoords ? [pendingCoords.lat, pendingCoords.lng] : PH_CENTER} zoom={pendingCoords ? 13 : 6} style={{ height: '100%', width: '100%' }} scrollWheelZoom zoomControl>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                <MapClickHandler onPick={handleMapPick} />
                <FlyTo coords={flyTo} />
                {pendingCoords && <Marker position={[pendingCoords.lat, pendingCoords.lng]} />}
              </MapContainer>
              <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 11, padding: '4px 12px', borderRadius: 20, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 999 }}>
                Tap anywhere on the map to pin your location
              </div>
            </div>

            {/* Confirm bar */}
            <div style={{ padding: '14px 20px', borderTop: `1.5px solid ${T.border}`, display: 'flex', gap: 10, flexShrink: 0 }}>
              <button
                onClick={() => setMapOpen(false)}
                style={{ flex: '0 0 auto', height: 48, padding: '0 20px', borderRadius: 24, border: `2px solid ${T.border}`, background: 'transparent', color: T.text, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmLocation}
                disabled={!pendingCoords}
                style={{ flex: 1, height: 48, borderRadius: 24, border: 'none', background: pendingCoords ? T.primary : T.border, color: pendingCoords ? T.surface : T.textMuted, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: pendingCoords ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 150ms ease' }}
              >
                <Check size={15} /> Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
