import { useState } from 'react';
import { ArrowRight, User, MapPin, Navigation, Check } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

function HomePicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

const T = {
  bg: '#F1EDE1', surface: '#FFFFFF', surfaceAlt: '#E9E2D0',
  primary: '#043E81', accent: '#C82718', highlight: '#EEA64C',
  text: '#06131B', textMuted: '#5A5448', border: '#D6C09D',
};

const AGE_RANGES = ['18–24', '25–34', '35–44', '45+'];
const GENDERS = ['Lalaki', 'Babae', 'Non-binary', 'Prefer not to say'];

interface ProfileSetupPageProps {
  userId: string;
  initialName?: string;
  onDone: () => void;
}

export default function ProfileSetupPage({ userId, initialName = '', onDone }: ProfileSetupPageProps) {
  const [displayName, setDisplayName] = useState(initialName);
  const [ageRange, setAgeRange] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameFocus, setNameFocus] = useState(false);
  const [locationFocus, setLocationFocus] = useState(false);
  const [homeCoords, setHomeCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const useGPS = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported by your browser.'); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setHomeCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsLoading(false); },
      ()  => { setError('Could not get location. Please allow access or tap on the map below.'); setGpsLoading(false); },
    );
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
      location: location.trim() || null,
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

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <MapPin size={14} /> City / Location <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                onFocus={() => setLocationFocus(true)}
                onBlur={() => setLocationFocus(false)}
                placeholder="e.g. Quezon City, Cebu, Davao…"
                maxLength={60}
                style={inputStyle(locationFocus)}
              />
            </div>

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
                style={{
                  width: '100%', padding: '12px 16px',
                  fontSize: 15, fontFamily: '"DM Sans", system-ui, sans-serif',
                  border: `2px solid ${T.border}`, borderRadius: 12,
                  background: T.surface, color: T.text, outline: 'none',
                  resize: 'none', lineHeight: 1.5, boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: 11, color: T.textMuted, margin: '4px 0 0', textAlign: 'right' }}>{bio.length}/120</p>
            </div>

            {/* Home Location */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Navigation size={14} /> Home Location <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 400 }}>(optional)</span>
              </label>
              <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 10px', lineHeight: 1.5 }}>
                Used as your default search center in Explore. Tap the map or use GPS.
              </p>
              <button type="button" onClick={useGPS} disabled={gpsLoading}
                style={{ width: '100%', height: 40, borderRadius: 20, border: `1.5px solid ${homeCoords ? '#86EFAC' : T.border}`, background: homeCoords ? '#DCFCE7' : T.surfaceAlt, color: homeCoords ? '#15803D' : T.text, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: gpsLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 10 }}>
                {homeCoords ? <><Check size={14} /> Location set ({homeCoords.lat.toFixed(4)}, {homeCoords.lng.toFixed(4)})</> : gpsLoading ? 'Getting location…' : <><Navigation size={14} /> Use current location (GPS)</>}
              </button>
              <div style={{ borderRadius: 14, overflow: 'hidden', border: `2px solid ${T.border}`, height: 180 }}>
                <MapContainer center={[12.8797, 121.774]} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                  <HomePicker onPick={(lat, lng) => setHomeCoords({ lat, lng })} />
                  {homeCoords && <Marker position={[homeCoords.lat, homeCoords.lng]} />}
                </MapContainer>
              </div>
              <p style={{ fontSize: 11, color: T.textMuted, margin: '5px 0 0' }}>Tap anywhere on the map to pin your home area.</p>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#FEE2E2', borderRadius: 8, border: '1px solid #FCA5A5' }}>
                <p style={{ fontSize: 13, color: '#B91C1C', margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: 52, borderRadius: 26, border: 'none',
                background: loading ? T.border : T.primary,
                color: loading ? T.textMuted : T.surface,
                fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
                cursor: loading ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 200ms ease', marginTop: 4,
              }}
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
    </div>
  );
}
