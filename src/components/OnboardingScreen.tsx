import { useState, useRef } from 'react';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { PixelHeart } from '@/components/common/PixelDecorations';

const IMG = (n: string) =>
  `https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/${n}`;

const PAGES = [
  {
    bg: '#F1EDE1', surface: '#FFFFFF', primary: '#043E81', accent: '#C82718',
    text: '#06131B', textMuted: '#5A5448', border: '#D6C09D', deco: '#C8B48A',
    image: '/avatar.png', pixel: 'KAMUSTA!',
    title: 'Welcome to SabayPH',
    body: 'The trusted way Filipinos find their kasama for real-world adventures — from Rotary service to mountain hikes to weekend getaways.',
  },
  {
    bg: '#E8F2F7', surface: '#FFFFFF', primary: '#1C6E94', accent: '#C82718',
    text: '#043E81', textMuted: '#3D6478', border: '#9CC3D6', deco: '#7AAFC5',
    image: IMG('cover.png'), pixel: 'TARA, SABAY TAYO!',
    title: 'Find your people, anywhere.',
    body: 'Browse rooms by activity, join verified groups, and go further together. No more solo adventures — unless you want to.',
  },
  {
    bg: '#F4ECDF', surface: '#FFFFFF', primary: '#9F5E0F', accent: '#C82718',
    text: '#3F2414', textMuted: '#6B5440', border: '#D6C09D', deco: '#C4A06A',
    image: IMG('safe.png'), pixel: 'LIGTAS AT MAPAGKAKATIWALAAN',
    title: 'Safety is not optional.',
    body: 'Every SabayPH member is verified. Reputation follows you across all rooms. Organizers stay in control, so everyone feels safe.',
  },
  {
    bg: '#EDF5EF', surface: '#FFFFFF', primary: '#1B6B3A', accent: '#C82718',
    text: '#0D3320', textMuted: '#3D6B4A', border: '#9ECAAA', deco: '#72B882',
    image: IMG('stand_normal.png'), pixel: 'HANDA KA NA!',
    title: "You're all set!",
    body: "Your kasama is out there. Explore rooms, meet verified members, and start your next adventure. Kita kits!",
  },
];

interface OnboardingScreenProps {
  onDone: () => void;
}

export default function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const [page, setPage] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const p = PAGES[page];
  const isLast = page === PAGES.length - 1;

  const go = (next: number) => {
    if (next < 0 || next >= PAGES.length || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setPage(next);
      setTransitioning(false);
    }, 240);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -55 && page < PAGES.length - 1) go(page + 1);
    else if (dx > 55 && page > 0) go(page - 1);
    touchStartX.current = null;
  };

  const contentStyle = {
    opacity: transitioning ? 0 : 1,
    transform: `translateX(${transitioning ? -18 : 0}px)`,
    transition: 'opacity 240ms ease, transform 240ms ease',
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'fixed', inset: 0,
        background: p.bg,
        display: 'flex', flexDirection: 'column',
        fontFamily: '"DM Sans", system-ui, sans-serif',
        transition: 'background 450ms ease',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Bricolage+Grotesque:wght@500;700;800&family=VT323&display=swap');
        .ob-font-display { font-family: 'Bricolage Grotesque', serif; letter-spacing: -0.02em; }
        .ob-font-pixel  { font-family: 'VT323', monospace; letter-spacing: 0.05em; }
        @keyframes ob-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes ob-spin  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes ob-pulse { 0%, 100% { transform: scale(1); opacity: 0.25; } 50% { transform: scale(1.07); opacity: 0.12; } }
        .ob-float { animation: ob-float 4.5s ease-in-out infinite; }
        .ob-spin  { animation: ob-spin 22s linear infinite; }
        .ob-pulse { animation: ob-pulse 3.5s ease-in-out infinite; }
      `}</style>

      {/* Background decorations */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="ob-pulse" style={{
          position: 'absolute', top: '10%', right: '-56px',
          width: 200, height: 200, borderRadius: '50%',
          border: `2.5px solid ${p.deco}`,
          transition: 'border-color 450ms ease',
        }} />
        <div className="ob-spin" style={{
          position: 'absolute', bottom: '44%', left: '-36px',
          width: 110, height: 110, borderRadius: 22,
          border: `2px dashed ${p.deco}`,
          opacity: 0.45,
          transition: 'border-color 450ms ease',
        }} />
        <div style={{
          position: 'absolute', bottom: '36%', right: '10%',
          width: 60, height: 60, borderRadius: '50%',
          background: `${p.border}55`,
          transition: 'background 450ms ease',
        }} />
        {[
          { top: '6%', left: '14%', size: 8 },
          { top: '20%', right: '20%', size: 5 },
          { top: '34%', left: '7%', size: 6 },
        ].map((dot, i) => (
          <div key={i} style={{
            position: 'absolute', ...dot,
            width: dot.size, height: dot.size, borderRadius: '50%',
            background: i % 2 === 0 ? p.accent : p.deco,
            opacity: 0.35,
            transition: 'background 450ms ease',
          }} />
        ))}
      </div>

      {/* Top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '22px 24px 0', position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {PAGES.map((_, i) => (
            <div
              key={i}
              onClick={() => go(i)}
              style={{
                height: 5, cursor: 'pointer',
                width: i === page ? 24 : 6,
                borderRadius: 3,
                background: i === page ? p.text : `${p.text}28`,
                transition: 'all 350ms ease',
              }}
            />
          ))}
        </div>
        {!isLast && (
          <button
            onClick={onDone}
            style={{
              fontSize: 13, color: p.textMuted,
              background: `${p.border}66`,
              border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', padding: '5px 14px',
              borderRadius: 20, fontWeight: 600,
            }}
          >
            Skip
          </button>
        )}
      </div>

      {/* Image */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '8px 44px 0',
      }}>
        <div
          className="ob-float"
          style={{
            ...contentStyle,
            width: '100%', maxWidth: 295, aspectRatio: '1',
            borderRadius: 32,
            border: `3px solid ${p.text}`,
            boxShadow: `7px 7px 0 ${p.text}20, 0 20px 48px ${p.text}12`,
            background: p.surface, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <img src={p.image} alt="" style={{ width: '86%', height: '86%', objectFit: 'contain' }} />
        </div>
      </div>

      {/* Page counter */}
      <div style={{ textAlign: 'center', padding: '10px 0 2px' }}>
        <span
          className="ob-font-pixel"
          style={{ fontSize: 13, color: `${p.textMuted}88`, letterSpacing: 1 }}
        >
          {page + 1} / {PAGES.length}
        </span>
      </div>

      {/* Bottom sheet */}
      <div
        style={{
          ...contentStyle,
          padding: '22px 28px 48px',
          background: p.surface,
          borderRadius: '28px 28px 0 0',
          border: `2px solid ${p.border}`,
          borderBottom: 'none',
          boxShadow: `0 -6px 28px ${p.text}08`,
          transition: `opacity 240ms ease, transform 240ms ease, border-color 450ms ease`,
        }}
      >
        <p
          className="ob-font-pixel"
          style={{ fontSize: 15, color: p.accent, margin: '0 0 4px', letterSpacing: 2 }}
        >
          {p.pixel}
        </p>
        <h2
          className="ob-font-display"
          style={{ fontSize: 25, fontWeight: 800, color: p.text, margin: '0 0 10px', lineHeight: 1.2 }}
        >
          {p.title}
        </h2>
        <p style={{ fontSize: 14.5, color: p.textMuted, margin: '0 0 24px', lineHeight: 1.65 }}>
          {p.body}
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          {page > 0 && (
            <button
              onClick={() => go(page - 1)}
              style={{
                flex: '0 0 auto', height: 52, width: 52, borderRadius: '50%',
                border: `2px solid ${p.border}`,
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: p.text,
                transition: 'border-color 300ms',
              }}
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <button
            onClick={isLast ? onDone : () => go(page + 1)}
            style={{
              flex: 1, height: 52, borderRadius: 26, border: 'none',
              background: p.primary, color: '#fff',
              cursor: 'pointer',
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: 16, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: `0 4px 18px ${p.primary}50`,
              transition: 'opacity 150ms, background 450ms ease, box-shadow 450ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {isLast ? (
              <><PixelHeart color="#fff" size={14} /> Tara, mag-explore!</>
            ) : (
              <>Sunod <ArrowRight size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
