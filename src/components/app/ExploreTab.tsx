import { useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { CATEGORIES } from '@/data/themes';
import type { CategoryId, Theme } from '@/types';

const AREAS = [
  { name: 'Davao City', count: 14 },
  { name: 'Cagayan de Oro', count: 8 },
  { name: 'General Santos', count: 5 },
  { name: 'Zamboanga City', count: 3 },
  { name: 'Butuan City', count: 4 },
  { name: 'Iligan City', count: 2 },
];

interface ExploreTabProps {
  theme: Theme;
}

export default function ExploreTab({ theme }: ExploreTabProps) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<CategoryId | null>(null);
  const [searchFocus, setSearchFocus] = useState(false);

  return (
    <div style={{ padding: '20px 16px 32px' }}>
      <div style={{ marginBottom: 20 }}>
        <p className="font-pixel" style={{ fontSize: 13, color: theme.accent, margin: '0 0 3px', letterSpacing: 1 }}>EXPLORE</p>
        <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: theme.text, margin: '0 0 4px', lineHeight: 1.15 }}>
          Find activities near you.
        </h2>
        <p style={{ fontSize: 14, color: theme.textMuted, margin: 0 }}>Launching in Mindanao — more areas coming soon.</p>
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: theme.textMuted, pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
          placeholder="Search activities, rooms, areas..."
          style={{
            width: '100%', height: 48, padding: '0 16px 0 44px',
            borderRadius: 14, fontSize: 14, boxSizing: 'border-box',
            fontFamily: '"DM Sans", system-ui, sans-serif',
            border: `2px solid ${searchFocus ? theme.primary : theme.border}`,
            background: theme.surface, color: theme.text, outline: 'none',
            transition: 'border-color 200ms ease',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 24, scrollbarWidth: 'none' }}>
        <button
          onClick={() => setSelectedCat(null)}
          style={{
            flexShrink: 0, padding: '6px 14px', borderRadius: 20,
            border: `2px solid ${!selectedCat ? theme.primary : theme.border}`,
            background: !selectedCat ? theme.primary : theme.surface,
            color: !selectedCat ? theme.bg : theme.text,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: '"DM Sans", system-ui, sans-serif',
            transition: 'all 200ms ease',
          }}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 20,
              border: `2px solid ${selectedCat === cat.id ? theme.primary : theme.border}`,
              background: selectedCat === cat.id ? theme.primary : theme.surface,
              color: selectedCat === cat.id ? theme.bg : theme.text,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: '"DM Sans", system-ui, sans-serif',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 200ms ease',
            }}
          >
            <cat.Icon size={14} strokeWidth={2} />
            {cat.name}
          </button>
        ))}
      </div>

      <div style={{ borderRadius: 20, overflow: 'hidden', border: `3px solid ${theme.text}`, boxShadow: `6px 6px 0 ${theme.text}`, marginBottom: 24, background: theme.surfaceAlt, height: 200, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.2, backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <MapPin size={40} strokeWidth={1.5} style={{ color: theme.primary, marginBottom: 8 }} />
          <p className="font-display" style={{ fontSize: 16, fontWeight: 700, color: theme.text, margin: '0 0 4px' }}>Interactive map</p>
          <p className="font-pixel" style={{ fontSize: 13, color: theme.accent, margin: 0, letterSpacing: 1 }}>COMING SOON</p>
        </div>
        {[{ top: '30%', left: '40%' }, { top: '55%', left: '60%' }, { top: '25%', left: '65%' }].map((pos, i) => (
          <div key={i} style={{ position: 'absolute', ...pos, width: 12, height: 12, borderRadius: '50%', background: theme.accent, border: `2px solid ${theme.text}`, boxShadow: `2px 2px 0 ${theme.text}` }} />
        ))}
      </div>

      <div>
        <p className="font-pixel" style={{ fontSize: 13, color: theme.textMuted, margin: '0 0 12px', letterSpacing: 1 }}>ACTIVE AREAS IN MINDANAO</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {AREAS.map((area, i) => (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: theme.surface, border: `1.5px solid ${theme.border}`, borderRadius: 14, cursor: 'pointer', transition: 'transform 150ms ease' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(4px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateX(0)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={18} strokeWidth={1.8} style={{ color: theme.primary }} />
                </div>
                <div>
                  <p className="font-display" style={{ fontSize: 15, fontWeight: 700, color: theme.text, margin: 0 }}>{area.name}</p>
                  <p style={{ fontSize: 12, color: theme.textMuted, margin: '1px 0 0' }}>{area.count} active rooms</p>
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, background: theme.surfaceAlt, color: theme.primary, padding: '4px 10px', borderRadius: 10 }}>{area.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
