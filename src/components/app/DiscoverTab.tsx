import { useRef } from 'react';
import { Sparkles, Shield, Check, ArrowRight } from 'lucide-react';
import { PixelHeart, PixelPlus } from '@/components/common/PixelDecorations';
import { CATEGORIES, CATEGORY_DETAILS, FEATURES, TRUST_ITEMS } from '@/data/themes';
import type { Theme, ThemeKey } from '@/types';

interface DiscoverTabProps {
  theme: Theme;
  activeCategory: ThemeKey;
  onCategoryChange: (val: ThemeKey | ((prev: ThemeKey) => ThemeKey)) => void;
}

export default function DiscoverTab({ theme, activeCategory, onCategoryChange }: DiscoverTabProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const currentCategory = CATEGORIES.find(c => c.id === activeCategory) ?? null;
  const detail = currentCategory ? CATEGORY_DETAILS[activeCategory as keyof typeof CATEGORY_DETAILS] : null;

  const toggleCategory = (id: ThemeKey) => {
    const isOpening = activeCategory !== id;
    onCategoryChange(prev => prev === id ? 'heritage' : id);
    if (isOpening) {
      setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
    }
  };

  return (
    <div style={{ padding: '0 0 24px' }}>

      {/* Hero card */}
      <div style={{ padding: '20px 16px 0' }}>
        <div
          className="float-soft"
          style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', border: `3px solid ${theme.text}`, boxShadow: `6px 6px 0 ${theme.text}`, background: theme.surface, aspectRatio: '16/9' }}
        >
          <div style={{ position: 'absolute', inset: 0, opacity: 0.2, backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
          <img src="/cover.png" alt="SabayPH adventure" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${theme.text}CC 0%, transparent 60%)`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '20px 18px' }}>
            <p className="font-pixel" style={{ fontSize: 22, color: '#F1EDE1', margin: 0, letterSpacing: 2 }}>TARA, SABAY TAYO!</p>
            <p style={{ fontSize: 13, color: 'rgba(241,237,225,0.8)', margin: '4px 0 0' }}>Browse categories and find your kasama</p>
          </div>
          <div style={{ position: 'absolute', top: 12, right: 12 }}><PixelHeart color={theme.accent} size={18} /></div>
          <div style={{ position: 'absolute', bottom: 12, left: 12 }}><PixelPlus color={theme.highlight} size={12} /></div>
          <div className="font-pixel" style={{ position: 'absolute', top: 12, left: 12, background: theme.accent, color: '#F1EDE1', padding: '3px 10px', borderRadius: 20, fontSize: 14 }}>SABAY!</div>
        </div>
      </div>

      {/* Category picker */}
      <div style={{ padding: '24px 16px 0' }}>
        <p className="font-pixel" style={{ fontSize: 14, color: theme.accent, margin: '0 0 4px', letterSpacing: 1 }}>PICK YOUR VIBE</p>
        <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: theme.text, margin: '0 0 16px', lineHeight: 1.2 }}>Find your people.</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
          <button
            onClick={() => onCategoryChange('heritage')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 6px', borderRadius: 14, minHeight: 80, background: activeCategory === 'heritage' ? theme.text : theme.surface, color: activeCategory === 'heritage' ? theme.bg : theme.text, border: `2px solid ${theme.text}`, cursor: 'pointer', transition: 'all 300ms ease', fontFamily: '"DM Sans", system-ui, sans-serif' }}
          >
            <Sparkles size={22} strokeWidth={1.5} />
            <span className="font-display" style={{ fontSize: 11, fontWeight: 700, marginTop: 6 }}>All</span>
            <span className="font-pixel" style={{ fontSize: 10, opacity: 0.7 }}>DEFAULT</span>
          </button>

          {CATEGORIES.slice(0, 3).map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => toggleCategory(cat.id)} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 6px', borderRadius: 14, minHeight: 80, background: isActive ? theme.primary : theme.surface, color: isActive ? theme.bg : theme.text, border: `2px solid ${isActive ? theme.primary : theme.border}`, cursor: 'pointer', transition: 'all 300ms ease', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
                {cat.status === 'live' && <span style={{ position: 'absolute', top: -8, right: 4, background: theme.accent, color: '#F1EDE1', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 8 }}>LIVE</span>}
                {cat.status === 'soon' && <span className="font-pixel" style={{ position: 'absolute', top: -8, right: 4, background: isActive ? theme.bg : theme.surfaceAlt, color: isActive ? theme.text : theme.textMuted, fontSize: 9, padding: '2px 6px', borderRadius: 8 }}>SOON</span>}
                <cat.Icon size={22} strokeWidth={1.5} />
                <span className="font-display" style={{ fontSize: 11, fontWeight: 700, marginTop: 6 }}>{cat.name}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {CATEGORIES.slice(3).map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => toggleCategory(cat.id)} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 6px', borderRadius: 14, minHeight: 80, background: isActive ? theme.primary : theme.surface, color: isActive ? theme.bg : theme.text, border: `2px solid ${isActive ? theme.primary : theme.border}`, cursor: 'pointer', transition: 'all 300ms ease', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
                {cat.status === 'soon' && <span className="font-pixel" style={{ position: 'absolute', top: -8, right: 4, background: isActive ? theme.bg : theme.surfaceAlt, color: isActive ? theme.text : theme.textMuted, fontSize: 9, padding: '2px 6px', borderRadius: 8 }}>SOON</span>}
                <cat.Icon size={22} strokeWidth={1.5} />
                <span className="font-display" style={{ fontSize: 11, fontWeight: 700, marginTop: 6 }}>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category detail panel */}
      {currentCategory && detail && (
        <div ref={panelRef} style={{ margin: '16px 16px 0', padding: '20px', background: theme.surface, border: `2px solid ${theme.border}`, borderRadius: 20, transition: 'all 400ms ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <currentCategory.Icon size={24} style={{ color: theme.primary }} />
            <span style={{ fontSize: 11, fontWeight: 700, background: theme.primary, color: theme.bg, padding: '3px 10px', borderRadius: 12 }}>
              {currentCategory.status === 'live' ? 'AVAILABLE NOW' : 'COMING SOON'}
            </span>
          </div>
          <h3 className="font-display" style={{ fontSize: 20, fontWeight: 800, color: theme.text, margin: '0 0 8px', lineHeight: 1.2 }}>
            {currentCategory.name} rooms,<br />the SabayPH way.
          </h3>
          <p style={{ fontSize: 14, color: theme.textMuted, margin: '0 0 16px', lineHeight: 1.65 }}>{detail.description}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {detail.highlights.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: theme.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.primary }}>
                  <h.Icon size={16} strokeWidth={1.8} />
                </div>
                <span style={{ fontSize: 13, color: theme.text }}>{h.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {detail.stats.map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', padding: '10px 8px', background: theme.surfaceAlt, borderRadius: 12 }}>
                <p className="font-display" style={{ fontSize: 18, fontWeight: 800, color: theme.primary, margin: 0 }}>{s.value}</p>
                <p style={{ fontSize: 11, color: theme.textMuted, margin: '2px 0 0' }}>{s.label}</p>
              </div>
            ))}
          </div>
          {currentCategory.status === 'live' ? (
            <button style={{ width: '100%', height: 46, borderRadius: 23, border: 'none', background: theme.primary, color: theme.bg, fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Browse Rooms <ArrowRight size={16} />
            </button>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px', border: `1px dashed ${theme.border}`, borderRadius: 12, color: theme.textMuted, fontSize: 13 }}>
              <span className="font-pixel" style={{ fontSize: 13 }}>LAUNCHING SOON</span>{' — '}join the waitlist for early access
            </div>
          )}
          {activeCategory === 'rotary' && (
            <div style={{ marginTop: 16, borderRadius: 14, overflow: 'hidden', border: `2px solid ${theme.border}` }}>
              <img src="/rotary.png" alt="Rotary" style={{ width: '100%', objectFit: 'cover', maxHeight: 180 }} />
            </div>
          )}
        </div>
      )}

      {/* Features */}
      <div style={{ padding: '28px 16px 0' }}>
        <p className="font-pixel" style={{ fontSize: 14, color: theme.accent, margin: '0 0 4px', letterSpacing: 1 }}>WHAT YOU GET</p>
        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 800, color: theme.text, margin: '0 0 16px', lineHeight: 1.2 }}>Built for real-world coordination.</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '14px', background: theme.surface, border: `1.5px solid ${theme.border}`, borderRadius: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: theme.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.primary }}>
                <f.Icon size={20} strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-display" style={{ fontSize: 15, fontWeight: 700, color: theme.text, margin: '0 0 2px' }}>{f.title}</p>
                <p style={{ fontSize: 13, color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust */}
      <div style={{ padding: '28px 16px 0' }}>
        <div style={{ background: theme.surface, border: `3px solid ${theme.text}`, borderRadius: 20, boxShadow: `6px 6px 0 ${theme.text}`, overflow: 'hidden' }}>
          <div style={{ height: 160, overflow: 'hidden', background: theme.surfaceAlt, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: `radial-gradient(circle, ${theme.border} 1.5px, transparent 1.5px)`, backgroundSize: '20px 20px' }} />
            <img src="/safe.png" alt="Verified member" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom' }} />
            <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 8 }}>
              {[0, 1, 2].map(i => <PixelHeart key={i} color={theme.accent} size={16} />)}
            </div>
          </div>
          <div style={{ padding: '20px' }}>
            <p className="font-pixel" style={{ fontSize: 14, color: theme.accent, margin: '0 0 4px', letterSpacing: 1 }}>TRUST COMES FIRST</p>
            <h3 className="font-display" style={{ fontSize: 20, fontWeight: 800, color: theme.text, margin: '0 0 8px', lineHeight: 1.2 }}>Safety is not optional.</h3>
            <p style={{ fontSize: 13, color: theme.textMuted, margin: '0 0 16px', lineHeight: 1.6 }}>Every SabayPH member is verified. Reputation follows you across all rooms.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {TRUST_ITEMS.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                    <Check size={13} strokeWidth={3} style={{ color: theme.bg }} />
                  </div>
                  <div>
                    <p className="font-display" style={{ fontSize: 14, fontWeight: 700, color: theme.text, margin: '0 0 1px' }}>{item.title}</p>
                    <p style={{ fontSize: 12, color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div style={{ margin: '28px 16px 0', padding: '28px 20px', background: theme.text, borderRadius: 20, textAlign: 'center', transition: 'background 600ms ease' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <PixelHeart color={theme.accent} size={16} />
          <PixelPlus color={theme.highlight} size={12} />
          <PixelHeart color={theme.accent} size={16} />
        </div>
        <p className="font-display" style={{ fontSize: 22, fontWeight: 800, color: theme.bg, lineHeight: 1.2, margin: '0 0 8px' }}>
          <span style={{ color: theme.highlight }}>Sabay-sabay</span> tayo.<br />Mas masaya kapag kasama.
        </p>
        <p style={{ fontSize: 13, color: theme.bg, opacity: 0.7, margin: 0 }}>
          Building the trusted way Filipinos coordinate real-world adventures.
        </p>
      </div>
    </div>
  );
}
