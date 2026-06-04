import { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, X, Check, Loader } from 'lucide-react';

// ── Fix Leaflet bundler icon issue ──────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl:       new URL('leaflet/dist/images/marker-icon.png',   import.meta.url).href,
  shadowUrl:     new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

// ── Types ────────────────────────────────────────────────────────────────────

export interface MapLocation { lat: number; lng: number; name: string; }

export interface MapPickerTheme {
  primary: string;
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
}

const LIGHT: MapPickerTheme = {
  primary: '#043E81', bg: '#F1EDE1', surface: '#FFFFFF',
  surfaceAlt: '#E9E2D0', text: '#06131B', textMuted: '#5A5448', border: '#D6C09D',
};

interface NominatimResult {
  place_id: number; lat: string; lon: string; display_name: string;
}

interface MapPickerProps {
  value: MapLocation | null;
  onChange: (loc: MapLocation) => void;
  height?: number;
  theme?: Partial<MapPickerTheme>;
}

// ── Map internals ─────────────────────────────────────────────────────────────

interface MapControllerProps {
  onMove: (lat: number, lng: number) => void;
  flyTarget: [number, number] | null;
  flyKey: number;
}

function MapController({ onMove, flyTarget, flyKey }: MapControllerProps) {
  const map = useMap();
  useMapEvents({ move() { const c = map.getCenter(); onMove(c.lat, c.lng); } });
  const prevKey = useRef(-1);
  useEffect(() => {
    if (flyTarget && flyKey !== prevKey.current) {
      prevKey.current = flyKey;
      map.flyTo(flyTarget, 15, { animate: true, duration: 0.6 });
    }
  }, [flyTarget, flyKey, map]);
  return null;
}

// ── SVG drop pin fixed at map center ──────────────────────────────────────────

function CenterPin({ color }: { color: string }) {
  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -100%) translateY(4px)',
      zIndex: 500, pointerEvents: 'none',
      filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.45))',
    }}>
      <svg width="30" height="42" viewBox="0 0 30 42" fill="none">
        <path d="M15 0C6.716 0 0 6.716 0 15c0 10.313 13.125 25.875 14.25 27.188a1 1 0 001.5 0C16.875 40.875 30 25.313 30 15 30 6.716 23.284 0 15 0z" fill={color} />
        <circle cx="15" cy="15" r="6" fill="white" />
        <circle cx="15" cy="15" r="3" fill={color} />
      </svg>
    </div>
  );
}

function shortName(displayName: string): string {
  return displayName.split(',').slice(0, 2).join(',').trim();
}

// ── Main component ────────────────────────────────────────────────────────────

const PH_DEFAULT: [number, number] = [7.0736, 125.6122]; // Davao City

export default function MapPicker({ value, onChange, height = 300, theme }: MapPickerProps) {
  const C: MapPickerTheme = { ...LIGHT, ...theme };

  const [showMap, setShowMap] = useState(false);
  const [query, setQuery] = useState(value?.name ? shortName(value.name) : '');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [draftCenter, setDraftCenter] = useState<[number, number]>(value ? [value.lat, value.lng] : PH_DEFAULT);
  const [draftAddress, setDraftAddress] = useState(value?.name ?? '');
  const [geocoding, setGeocoding] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(value ? [value.lat, value.lng] : null);
  const [flyKey, setFlyKey] = useState(0);

  const searchTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 400 ms search debounce
  const handleQueryChange = (q: string) => {
    setQuery(q);
    setShowSuggestions(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.trim().length < 2) { setSuggestions([]); setSearching(false); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        setSuggestions(await res.json() as NominatimResult[]);
      } catch { setSuggestions([]); }
      setSearching(false);
    }, 400);
  };

  const selectSuggestion = (s: NominatimResult) => {
    const loc: MapLocation = { lat: parseFloat(s.lat), lng: parseFloat(s.lon), name: s.display_name };
    onChange(loc);
    setQuery(shortName(s.display_name));
    setSuggestions([]);
    setShowSuggestions(false);
    setDraftCenter([loc.lat, loc.lng]);
    setDraftAddress(s.display_name);
    setFlyTarget([loc.lat, loc.lng]);
    setFlyKey(k => k + 1);
  };

  const clearSearch = () => { setQuery(''); setSuggestions([]); };

  // 600 ms reverse geocode debounce
  const handleMapMove = useCallback((lat: number, lng: number) => {
    setDraftCenter([lat, lng]);
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    setGeocoding(true);
    geocodeTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json() as { display_name?: string };
        setDraftAddress(data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      } catch {
        setDraftAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
      setGeocoding(false);
    }, 600);
  }, []);

  const confirmMapLocation = () => {
    const loc: MapLocation = { lat: draftCenter[0], lng: draftCenter[1], name: draftAddress };
    onChange(loc);
    setQuery(shortName(draftAddress));
    setShowMap(false);
  };

  const openMap = () => {
    if (value) {
      setDraftCenter([value.lat, value.lng]);
      setDraftAddress(value.name);
      setFlyTarget([value.lat, value.lng]);
      setFlyKey(k => k + 1);
    } else {
      handleMapMove(PH_DEFAULT[0], PH_DEFAULT[1]);
    }
    setShowMap(true);
  };

  useEffect(() => () => {
    if (searchTimer.current)  clearTimeout(searchTimer.current);
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
  }, []);

  const inputBase: React.CSSProperties = {
    width: '100%', height: 46, fontSize: 14,
    fontFamily: '"DM Sans",system-ui,sans-serif',
    border: `1.5px solid ${C.border}`, borderRadius: 10,
    background: C.bg, color: C.text, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, color: C.textMuted, pointerEvents: 'none' }} />
          <input
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search for a place, landmark, address…"
            style={{ ...inputBase, padding: '0 40px 0 36px' }}
          />
          {query && (
            <button onClick={clearSearch} style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, display: 'flex', padding: 4 }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && (searching || suggestions.length > 0) && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 600,
            background: C.surface, border: `1.5px solid ${C.border}`,
            borderRadius: 10, marginTop: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)', overflow: 'hidden',
          }}>
            {searching && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', color: C.textMuted, fontSize: 13 }}>
                <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                Searching…
              </div>
            )}
            {suggestions.map(s => (
              <button
                key={s.place_id}
                onMouseDown={() => selectSuggestion(s)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px',
                  border: 'none', borderBottom: `1px solid ${C.border}`,
                  background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = C.surfaceAlt)}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <MapPin size={14} style={{ color: C.primary, marginTop: 2, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: '0 0 1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {shortName(s.display_name)}
                  </p>
                  <p style={{ fontSize: 11, color: C.textMuted, margin: 0, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.display_name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Choose on map / Close map toggle */}
      <button
        type="button"
        onClick={showMap ? () => setShowMap(false) : openMap}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          height: 38, borderRadius: 19, width: '100%',
          border: `1.5px dashed ${showMap ? C.border : C.primary}`,
          background: showMap ? 'transparent' : `${C.primary}12`,
          color: showMap ? C.textMuted : C.primary,
          fontSize: 13, fontWeight: 600,
          fontFamily: '"DM Sans",system-ui,sans-serif', cursor: 'pointer',
          transition: 'all 200ms',
        }}
      >
        {showMap ? <><X size={14} /> Close map</> : <><MapPin size={14} /> Choose on map</>}
      </button>

      {/* Map view */}
      {showMap && (
        <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: `1.5px solid ${C.border}` }}>
          {/* Instruction banner */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 550,
            background: 'rgba(4,62,129,0.88)', backdropFilter: 'blur(6px)',
            padding: '7px 14px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 12, color: '#F1EDE1', margin: 0, fontFamily: '"DM Sans",system-ui,sans-serif' }}>
              Drag the map · the pin stays centered at your meetup point
            </p>
          </div>

          <MapContainer center={draftCenter} zoom={14} style={{ height, width: '100%' }} scrollWheelZoom zoomControl={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController onMove={handleMapMove} flyTarget={flyTarget} flyKey={flyKey} />
          </MapContainer>

          {/* Fixed crosshair pin */}
          <CenterPin color={C.primary} />

          {/* Bottom confirm bar */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 550,
            background: C.surface, borderTop: `1px solid ${C.border}`,
            padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, margin: '0 0 2px', letterSpacing: 0.5 }}>
                {geocoding ? 'LOCATING…' : 'PINNED LOCATION'}
              </p>
              <p style={{ fontSize: 12, color: C.text, margin: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {geocoding
                  ? <span style={{ color: C.textMuted }}>Finding address…</span>
                  : draftAddress || `${draftCenter[0].toFixed(5)}, ${draftCenter[1].toFixed(5)}`}
              </p>
            </div>
            <button
              onClick={confirmMapLocation}
              disabled={geocoding}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 20, border: 'none',
                background: geocoding ? C.border : C.primary,
                color: '#F1EDE1', fontSize: 13, fontWeight: 700,
                fontFamily: '"DM Sans",system-ui,sans-serif',
                cursor: geocoding ? 'default' : 'pointer', flexShrink: 0,
                transition: 'background 200ms',
              }}
            >
              <Check size={14} /> Confirm
            </button>
          </div>
        </div>
      )}

      {/* Confirmed location indicator */}
      {!showMap && value?.name && (
        <p style={{ fontSize: 11, color: C.primary, margin: 0, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
          <MapPin size={11} /> {shortName(value.name)}
        </p>
      )}
    </div>
  );
}
