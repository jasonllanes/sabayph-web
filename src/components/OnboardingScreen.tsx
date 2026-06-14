import { useState, useRef } from 'react';
import { ArrowRight, ChevronLeft, Users, Shield, Sparkles } from 'lucide-react';
import { PixelHeart } from '@/components/common/PixelDecorations';
import { useScreenSize } from '@/hooks/useScreenSize';

interface OnboardingPage {
  bg: string; surface: string; primary: string; accent: string;
  highlight: string; text: string; textMuted: string; border: string;
  image: string; pixel: string; title: string; body: string;
}

const PAGES: OnboardingPage[] = [
  {
    bg: '#F1EDE1', surface: '#FFFFFF', primary: '#043E81', accent: '#C82718',
    highlight: '#EEA64C', text: '#06131B', textMuted: '#5A5448', border: '#D6C09D',
    image: 'https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/avatar.png', pixel: 'KAMUSTA!',
    title: 'Welcome to SabayPH',
    body: 'The trusted way Filipinos find their kasama for real-world adventures — from Rotary service to mountain hikes to weekend ride-shares.',
  },
  {
    bg: '#E8F2F7', surface: '#FFFFFF', primary: '#1C6E94', accent: '#C82718',
    highlight: '#EEA64C', text: '#043E81', textMuted: '#3D6478', border: '#9CC3D6',
    image: 'https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/cover.png', pixel: 'TARA, SABAY TAYO!',
    title: 'Find your people, anywhere.',
    body: 'Browse rooms by activity, join verified groups, and go further together. No more solo adventures.',
  },
  {
    bg: '#F4ECDF', surface: '#FFFFFF', primary: '#9F5E0F', accent: '#C82718',
    highlight: '#EEA64C', text: '#3F2414', textMuted: '#6B5440', border: '#D6C09D',
    image: 'https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/safe.png', pixel: 'LIGTAS AT MAPAGKAKATIWALAAN',
    title: 'Safety is not optional.',
    body: 'Every SabayPH member is verified. Reputation follows you. Organizers stay in control, so everyone feels safe.',
  },
  {
    bg: '#EDF5EF', surface: '#FFFFFF', primary: '#1B6B3A', accent: '#C82718',
    highlight: '#72B882', text: '#0D3320', textMuted: '#3D6B4A', border: '#9ECAAA',
    image: 'https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/avatar.png', pixel: 'HANDA KA NA!',
    title: "You're all set!",
    body: "Your kasama is out there. Explore rooms, meet verified members, and start your next adventure. Kita kits!",
  },
];

// ─── DESKTOP DATA ────────────────────────────────────────────────────────────

const HOW_ITEMS = [
  { Icon: Users,    title: 'Join a Room',      body: 'Every plan has its own room — group chat, itinerary, and RSVP all in one place.' },
  { Icon: Shield,   title: 'Verified kasama',  body: "ID checks and reputation history mean you always know who you're with." },
  { Icon: Sparkles, title: 'Earn your rep',    body: 'Show up, host well, and be a good kasama — your badges follow you everywhere.' },
];

const DESKTOP_STEPS = [
  { key: 'welcome',    label: 'Welcome',        idx: '01' },
  { key: 'activities', label: 'Activities',     idx: '02' },
  { key: 'how',        label: 'How it works',   idx: '03' },
  { key: 'safety',     label: 'Trust & safety', idx: '04' },
] as const;

// ─── SHARED STYLES ───────────────────────────────────────────────────────────

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Bricolage+Grotesque:wght@500;700;800&family=VT323&display=swap');
  .font-display { font-family: 'Bricolage Grotesque', serif; letter-spacing: -0.02em; }
  .font-pixel   { font-family: 'VT323', monospace; letter-spacing: 0.05em; }
`;

// ─── MOBILE ONBOARDING ───────────────────────────────────────────────────────

function MobileOnboarding({ onDone }: { onDone: () => void }) {
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
    }, 220);
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
      style={{
        position: 'fixed', inset: 0,
        background: p.bg,
        display: 'flex', flexDirection: 'column',
        fontFamily: '"DM Sans", system-ui, sans-serif',
        transition: 'background 400ms ease',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Bricolage+Grotesque:wght@500;700;800&family=VT323&display=swap');
        .font-display { font-family: 'Bricolage Grotesque', serif; letter-spacing: -0.02em; }
        .font-pixel  { font-family: 'VT323', monospace; letter-spacing: 0.05em; }
        @keyframes float-soft { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .float-img { animation: float-soft 4s ease-in-out infinite; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px 0' }}>
        {!isLast && (
          <button
            onClick={onDone}
            style={{ fontSize: 13, color: p.textMuted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Skip
          </button>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 32px' }}>
        <div
          className="float-img"
          style={{
            width: '100%', maxWidth: 320, aspectRatio: '1',
            borderRadius: 28, border: `3px solid ${p.text}`,
            boxShadow: `8px 8px 0 ${p.text}`,
            background: p.surface, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: transitioning ? 0 : 1,
            transition: 'opacity 220ms ease',
          }}
        >
          <img src={p.image} alt="" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
        </div>
      </div>

      <div
        style={{
          padding: '24px 32px 40px',
          background: p.surface,
          borderRadius: '28px 28px 0 0',
          border: `2px solid ${p.border}`,
          borderBottom: 'none',
          opacity: transitioning ? 0 : 1,
          transition: 'opacity 220ms ease',
        }}
      >
        <p className="font-pixel" style={{ fontSize: 14, color: p.accent, margin: '0 0 6px', letterSpacing: 2 }}>
          {p.pixel}
        </p>
        <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: p.text, margin: '0 0 12px', lineHeight: 1.15 }}>
          {p.title}
        </h2>
        <p style={{ fontSize: 15, color: p.textMuted, margin: '0 0 28px', lineHeight: 1.65 }}>
          {p.body}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {PAGES.map((_, i) => (
            <div
              key={i}
              onClick={() => go(i)}
              style={{
                height: 8, cursor: 'pointer',
                width: i === page ? 28 : 8,
                borderRadius: 4,
                background: i === page ? p.primary : p.border,
                transition: 'all 300ms ease',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {page > 0 && (
            <button
              onClick={() => go(page - 1)}
              style={{
                flex: '0 0 auto', height: 52, width: 52, borderRadius: '50%',
                border: `2px solid ${p.border}`, background: 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: p.text,
              }}
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <button
            onClick={isLast ? onDone : () => go(page + 1)}
            style={{
              flex: 1, height: 52, borderRadius: 26, border: 'none',
              background: p.primary, color: p.bg,
              cursor: 'pointer', fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: 16, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: `0 4px 18px ${p.primary}50`,
              transition: 'opacity 150ms, background 450ms ease, box-shadow 450ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {isLast ? (
              <><PixelHeart color={p.bg} size={14} /> Tara, mag-explore!</>
            ) : (
              <>Continue <ArrowRight size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DESKTOP ONBOARDING ──────────────────────────────────────────────────────

function DesktopOnboarding({ onDone }: { onDone: () => void }) {
  const [page, setPage] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const p = PAGES[page];
  const isLast = page === PAGES.length - 1;

  const go = (next: number) => {
    if (next < 0 || next >= PAGES.length || transitioning) return;
    setTransitioning(true);
    setTimeout(() => { setPage(next); setTransitioning(false); }, 220);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <style>{FONTS}</style>
      <div style={{
        width: '100%', maxWidth: 800, borderRadius: 28, overflow: 'hidden',
        border: `3px solid ${p.text}`, boxShadow: `10px 10px 0 ${p.text}`,
        display: 'flex', transition: 'border-color 400ms, box-shadow 400ms',
      }}>
        {/* Left: visual */}
        <div style={{
          flex: '0 0 280px', background: p.bg,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '40px 32px', gap: 20,
          transition: 'background 400ms',
        }}>
          <div style={{
            width: 190, height: 190, borderRadius: 20,
            background: p.surface, border: `2.5px solid ${p.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            <img
              src={p.image} alt=""
              style={{ width: '80%', height: '80%', objectFit: 'contain', opacity: transitioning ? 0 : 1, transition: 'opacity 220ms' }}
            />
          </div>
          <p className="font-pixel" style={{ fontSize: 15, color: p.accent, margin: 0, letterSpacing: 2, textAlign: 'center', opacity: transitioning ? 0 : 1, transition: 'opacity 220ms' }}>
            {p.pixel}
          </p>
        </div>

        {/* Right: content */}
        <div style={{
          flex: 1, background: p.surface, padding: '48px 40px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          opacity: transitioning ? 0 : 1, transition: 'opacity 220ms',
        }}>
          <h2 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: p.text, margin: '0 0 12px' }}>
            {p.title}
          </h2>
          <p style={{ fontSize: 15, color: p.textMuted, margin: '0 0 32px', lineHeight: 1.7 }}>
            {p.body}
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
            {PAGES.map((_, i) => (
              <div
                key={i} onClick={() => go(i)}
                style={{ height: 8, cursor: 'pointer', width: i === page ? 28 : 8, borderRadius: 4, background: i === page ? p.primary : p.border, transition: 'all 300ms ease' }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {page > 0 && (
              <button
                onClick={() => go(page - 1)}
                style={{ flex: '0 0 auto', height: 52, width: 52, borderRadius: '50%', border: `2px solid ${p.border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.text }}
              >
                <ChevronLeft size={20} />
              </button>
            )}
            {!isLast && (
              <button
                onClick={onDone}
                style={{ height: 52, padding: '0 20px', borderRadius: 26, border: `2px solid ${p.border}`, background: 'transparent', color: p.textMuted, cursor: 'pointer', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 15, fontWeight: 700 }}
              >
                Skip
              </button>
            )}
            <button
              onClick={isLast ? onDone : () => go(page + 1)}
              style={{
                flex: 1, height: 52, borderRadius: 26, border: 'none',
                background: p.primary, color: p.bg, cursor: 'pointer',
                fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 16, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: `0 4px 18px ${p.primary}50`,
                transition: 'opacity 150ms, background 450ms ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {isLast ? <><PixelHeart color={p.bg} size={14} /> Tara, mag-explore!</> : <>Continue <ArrowRight size={18} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

interface OnboardingScreenProps {
  onDone: () => void;
}

export default function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const { isMobile } = useScreenSize();
  return isMobile
    ? <MobileOnboarding onDone={onDone} />
    : <DesktopOnboarding onDone={onDone} />;
}
