import { useState } from 'react';
import { ArrowRight, ChevronLeft, Shield, Users, Sparkles } from 'lucide-react';
import { PixelHeart } from '@/components/common/PixelDecorations';
import { useScreenSize } from '@/hooks/useScreenSize';
import { CATEGORIES, THEMES, TRUST_ITEMS } from '@/data/themes';
import type { Theme } from '@/types';

const LIVE = CATEGORIES.filter(c => c.status === 'live');

// ─── MOBILE DATA ─────────────────────────────────────────────────────────────

type MobilePage = {
  theme: Theme;
  pixel: string;
  title: string;
  body: string;
  image?: string;
  variant?: 'categories';
};

const MOBILE_PAGES: MobilePage[] = [
  {
    theme: THEMES.heritage,
    pixel: 'KAMUSTA!',
    title: 'Welcome to SabayPH',
    body: 'The trusted way Filipinos find their kasama — for real plans, real places, and real adventures.',
    image: '/avatar.png',
  },
  {
    theme: THEMES.heritage,
    pixel: 'LIVE NGAYON!',
    title: 'Four activities, open now.',
    body: 'Join Rotary service groups, PasaBuy errands, Gaming squads, and Café meet-ups — all verified and ready.',
    variant: 'categories',
  },
  {
    theme: THEMES.travel,
    pixel: 'TARA, SABAY TAYO!',
    title: 'Find your people, anywhere.',
    body: 'Browse rooms by activity, join verified groups, and go further together. No more solo adventures.',
    image: '/cover.png',
  },
  {
    theme: THEMES.heritage,
    pixel: 'LIGTAS AT TIWALA',
    title: 'Safety is not optional.',
    body: 'Every SabayPH member is verified. Reputation follows you. Organizers stay in control, so everyone feels safe.',
    image: '/safe.png',
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
  const [fading, setFading] = useState(false);
  const p = MOBILE_PAGES[page];
  const t = p.theme;
  const isLast = page === MOBILE_PAGES.length - 1;

  const go = (next: number) => {
    if (next < 0 || next >= MOBILE_PAGES.length || fading) return;
    setFading(true);
    setTimeout(() => { setPage(next); setFading(false); }, 200);
  };

  const finish = () => {
    localStorage.setItem('sabayph_onboarding_seen', '1');
    onDone();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: t.bg,
      display: 'flex', flexDirection: 'column',
      fontFamily: '"DM Sans", system-ui, sans-serif',
      transition: 'background 400ms ease',
      overflow: 'hidden',
    }}>
      <style>{`
        ${FONTS}
        @keyframes float-soft { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .float-img { animation: float-soft 4s ease-in-out infinite; }
        @keyframes pop-in { from { opacity: 0; transform: scale(0.93); } to { opacity: 1; transform: scale(1); } }
        .pop-in { animation: pop-in 0.3s ease both; }
      `}</style>

      {/* Skip */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px 0' }}>
        {!isLast && (
          <button
            onClick={finish}
            style={{ fontSize: 13, color: t.textMuted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Skip
          </button>
        )}
      </div>

      {/* Visual area */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 28px',
        opacity: fading ? 0 : 1, transition: 'opacity 200ms ease',
      }}>
        {p.variant === 'categories' ? (
          <div style={{ width: '100%', maxWidth: 340, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {LIVE.map((cat, i) => {
              const ct = THEMES[cat.id as keyof typeof THEMES];
              return (
                <div key={cat.id} className="pop-in" style={{
                  background: ct.surface,
                  border: `2px solid ${ct.border}`,
                  borderRadius: 16,
                  padding: '14px 12px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                  boxShadow: `3px 3px 0 ${ct.text}18`,
                  animationDelay: `${i * 70}ms`,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: ct.bg, border: `1.5px solid ${ct.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <cat.Icon size={18} color={ct.primary} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: ct.text, fontFamily: '"Bricolage Grotesque", serif' }}>
                      {cat.name}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: ct.textMuted }}>
                      {cat.tagline}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 1,
                    color: ct.primary, background: ct.bg,
                    borderRadius: 4, padding: '2px 6px',
                    border: `1px solid ${ct.border}`,
                    alignSelf: 'flex-start', textTransform: 'uppercase',
                  }}>
                    Live
                  </span>
                </div>
              );
            })}
          </div>
        ) : p.image ? (
          <div className="float-img" style={{
            width: '100%', maxWidth: 280, aspectRatio: '1',
            borderRadius: 28, border: `3px solid ${t.text}`,
            boxShadow: `8px 8px 0 ${t.text}`,
            background: t.surface, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src={p.image} alt="" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
          </div>
        ) : null}
      </div>

      {/* Bottom sheet */}
      <div style={{
        padding: '24px 28px 40px',
        background: t.surface,
        borderRadius: '28px 28px 0 0',
        border: `2px solid ${t.border}`,
        borderBottom: 'none',
        opacity: fading ? 0 : 1,
        transition: 'opacity 200ms ease',
      }}>
        <p className="font-pixel" style={{ fontSize: 13, color: t.accent, margin: '0 0 6px', letterSpacing: 2 }}>
          {p.pixel}
        </p>
        <h2 className="font-display" style={{ fontSize: 24, fontWeight: 800, color: t.text, margin: '0 0 10px', lineHeight: 1.15 }}>
          {p.title}
        </h2>
        <p style={{ fontSize: 14, color: t.textMuted, margin: '0 0 24px', lineHeight: 1.65 }}>
          {p.body}
        </p>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {MOBILE_PAGES.map((_, i) => (
            <div
              key={i}
              onClick={() => go(i)}
              style={{
                height: 7, cursor: 'pointer',
                width: i === page ? 24 : 7,
                borderRadius: 4,
                background: i === page ? t.primary : t.border,
                transition: 'all 300ms ease',
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {page > 0 && (
            <button
              onClick={() => go(page - 1)}
              style={{
                flex: '0 0 auto', height: 50, width: 50, borderRadius: '50%',
                border: `2px solid ${t.border}`, background: 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: t.text,
              }}
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <button
            onClick={isLast ? finish : () => go(page + 1)}
            style={{
              flex: 1, height: 50, borderRadius: 25, border: 'none',
              background: t.primary, color: t.bg,
              cursor: 'pointer', fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: 15, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'opacity 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {isLast
              ? <><PixelHeart color={t.bg} size={13} /> Tara, mag-explore!</>
              : <>Continue <ArrowRight size={17} /></>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DESKTOP SUB-VIEWS ───────────────────────────────────────────────────────

function DesktopWelcome({ theme: t }: { theme: Theme }) {
  return (
    <div style={{ maxWidth: 640 }}>
      <p className="font-pixel" style={{ fontSize: 18, color: t.accent, margin: '0 0 20px', letterSpacing: 3 }}>
        KAMUSTA!
      </p>
      <h1 className="font-display" style={{ fontSize: 52, fontWeight: 800, color: t.text, margin: '0 0 20px', lineHeight: 1.08 }}>
        The Filipino way to go further,{' '}
        <span style={{ color: t.primary }}>together.</span>
      </h1>
      <p style={{ fontSize: 18, color: t.textMuted, margin: '0 0 48px', lineHeight: 1.7, maxWidth: 500 }}>
        SabayPH connects Filipinos with verified kasama for real-world activities — from Rotary service projects to gaming nights to café meet-ups.
      </p>

      <p style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 16px' }}>
        Live right now
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {LIVE.map((cat, i) => {
          const ct = THEMES[cat.id as keyof typeof THEMES];
          return (
            <div key={cat.id} className="pop-in" style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '9px 16px', borderRadius: 50,
              background: ct.surface, border: `1.5px solid ${ct.border}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              animationDelay: `${i * 60}ms`,
            }}>
              <cat.Icon size={15} color={ct.primary} />
              <span style={{ fontSize: 14, fontWeight: 600, color: ct.text }}>{cat.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DesktopActivities({ theme: t }: { theme: Theme }) {
  return (
    <div style={{ maxWidth: 680 }}>
      <p className="font-pixel" style={{ fontSize: 18, color: t.accent, margin: '0 0 20px', letterSpacing: 3 }}>
        LIVE NGAYON!
      </p>
      <h2 className="font-display" style={{ fontSize: 40, fontWeight: 800, color: t.text, margin: '0 0 12px', lineHeight: 1.1 }}>
        Four activities, open now.
      </h2>
      <p style={{ fontSize: 16, color: t.textMuted, margin: '0 0 36px', lineHeight: 1.65 }}>
        Pick what excites you — more categories are on the way.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {LIVE.map((cat, i) => {
          const ct = THEMES[cat.id as keyof typeof THEMES];
          return (
            <div key={cat.id} className="pop-in cat-card" style={{
              background: ct.surface,
              border: `2px solid ${ct.border}`,
              borderRadius: 20, padding: '24px',
              display: 'flex', flexDirection: 'column', gap: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'transform 200ms, box-shadow 200ms',
              cursor: 'default',
              animationDelay: `${i * 70}ms`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: ct.bg, border: `1.5px solid ${ct.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <cat.Icon size={22} color={ct.primary} />
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: 1,
                  color: ct.primary, background: ct.bg,
                  borderRadius: 20, padding: '4px 10px',
                  border: `1px solid ${ct.border}`,
                  textTransform: 'uppercase',
                }}>
                  Live
                </span>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: ct.text, fontFamily: '"Bricolage Grotesque", serif' }}>
                  {cat.name}
                </p>
                <p style={{ margin: 0, fontSize: 14, color: ct.textMuted, lineHeight: 1.5 }}>
                  {cat.tagline}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DesktopHowItWorks({ theme: t }: { theme: Theme }) {
  return (
    <div style={{ maxWidth: 640 }}>
      <p className="font-pixel" style={{ fontSize: 18, color: t.accent, margin: '0 0 20px', letterSpacing: 3 }}>
        PAANO ITO?
      </p>
      <h2 className="font-display" style={{ fontSize: 40, fontWeight: 800, color: t.text, margin: '0 0 12px', lineHeight: 1.1 }}>
        How SabayPH works.
      </h2>
      <p style={{ fontSize: 16, color: t.textMuted, margin: '0 0 40px', lineHeight: 1.65 }}>
        Every plan lives in a room. Find people, join up, and go together.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {HOW_ITEMS.map((item, i) => (
          <div key={i} className="pop-in" style={{
            display: 'flex', alignItems: 'flex-start', gap: 20,
            padding: '20px 24px', borderRadius: 16,
            background: t.surface, border: `1.5px solid ${t.border}`,
            animationDelay: `${i * 80}ms`,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: t.bg, border: `1.5px solid ${t.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <item.Icon size={22} color={t.primary} />
            </div>
            <div>
              <p style={{ margin: '0 0 5px', fontSize: 16, fontWeight: 700, color: t.text }}>{item.title}</p>
              <p style={{ margin: 0, fontSize: 14, color: t.textMuted, lineHeight: 1.65 }}>{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DesktopSafety({ theme: t }: { theme: Theme }) {
  return (
    <div style={{ maxWidth: 640 }}>
      <p className="font-pixel" style={{ fontSize: 18, color: t.accent, margin: '0 0 20px', letterSpacing: 3 }}>
        LIGTAS AT TIWALA
      </p>
      <h2 className="font-display" style={{ fontSize: 40, fontWeight: 800, color: t.text, margin: '0 0 12px', lineHeight: 1.1 }}>
        Built on trust.
      </h2>
      <p style={{ fontSize: 16, color: t.textMuted, margin: '0 0 36px', lineHeight: 1.65 }}>
        Safety is not optional on SabayPH. Every member is accountable.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {TRUST_ITEMS.map((item, i) => (
          <div key={i} className="pop-in" style={{
            padding: '20px',
            borderRadius: 16,
            background: t.surface, border: `1.5px solid ${t.border}`,
            animationDelay: `${i * 60}ms`,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: t.bg, border: `1px solid ${t.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
            }}>
              <Shield size={15} color={t.primary} />
            </div>
            <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: t.text }}>{item.title}</p>
            <p style={{ margin: 0, fontSize: 13, color: t.textMuted, lineHeight: 1.65 }}>{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DESKTOP ONBOARDING ──────────────────────────────────────────────────────

function DesktopOnboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [fading, setFading] = useState(false);
  const t = THEMES.heritage;
  const total = DESKTOP_STEPS.length;
  const isLast = step === total - 1;

  const go = (next: number) => {
    if (next < 0 || next >= total || fading) return;
    setFading(true);
    setTimeout(() => { setStep(next); setFading(false); }, 180);
  };

  const finish = () => {
    localStorage.setItem('sabayph_onboarding_seen', '1');
    onDone();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: t.bg,
      display: 'flex',
      fontFamily: '"DM Sans", system-ui, sans-serif',
      overflow: 'hidden',
    }}>
      <style>{`
        ${FONTS}
        @keyframes pop-in { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
        .pop-in { animation: pop-in 0.28s ease both; }
        @keyframes slide-in { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
        .slide-in { animation: slide-in 0.28s ease both; }
        .cat-card:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
        .step-btn { transition: background 180ms; }
        .step-btn:hover { background: ${t.surfaceAlt} !important; }
        .nav-btn:hover { opacity: 0.85 !important; }
      `}</style>

      {/* LEFT PANEL */}
      <aside style={{
        width: 268, flexShrink: 0,
        background: t.surface,
        borderRight: `1.5px solid ${t.border}`,
        display: 'flex', flexDirection: 'column',
        padding: '40px 24px',
      }}>
        {/* Brand */}
        <div style={{ marginBottom: 44 }}>
          <p className="font-pixel" style={{ fontSize: 22, color: t.accent, margin: 0, letterSpacing: 3 }}>
            SABAYPH
          </p>
          <p style={{ fontSize: 12, color: t.textMuted, margin: '4px 0 0' }}>Find your kasama</p>
        </div>

        {/* Step list */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {DESKTOP_STEPS.map((s, i) => {
            const isActive = i === step;
            const isDone = i < step;
            return (
              <button
                key={s.key}
                onClick={() => go(i)}
                className="step-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 12px', borderRadius: 12,
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: isActive ? t.bg : 'transparent',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  background: isActive ? t.primary : isDone ? t.highlight : t.border,
                  color: isActive ? t.surface : isDone ? t.text : t.textMuted,
                  transition: 'all 280ms',
                }}>
                  {isDone ? '✓' : s.idx}
                </div>
                <span style={{
                  fontSize: 14, fontWeight: isActive ? 700 : 500,
                  color: isActive ? t.text : t.textMuted,
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  transition: 'color 180ms',
                }}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Skip */}
        <button
          onClick={finish}
          style={{
            fontSize: 13, color: t.textMuted, background: 'none', border: 'none',
            cursor: 'pointer', textAlign: 'left', padding: '8px 12px',
            fontFamily: 'inherit',
          }}
        >
          Skip intro →
        </button>
      </aside>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: t.border, flexShrink: 0 }}>
          <div style={{
            height: '100%', background: t.primary,
            width: `${((step + 1) / total) * 100}%`,
            transition: 'width 400ms ease',
          }} />
        </div>

        {/* Content */}
        <div
          key={step}
          className="slide-in"
          style={{ flex: 1, overflowY: 'auto', padding: '52px 60px 24px' }}
        >
          {step === 0 && <DesktopWelcome     theme={t} />}
          {step === 1 && <DesktopActivities  theme={t} />}
          {step === 2 && <DesktopHowItWorks  theme={t} />}
          {step === 3 && <DesktopSafety      theme={t} />}
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 60px 32px',
          borderTop: `1px solid ${t.border}`,
          flexShrink: 0,
        }}>
          <button
            onClick={() => go(step - 1)}
            disabled={step === 0}
            className="nav-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              height: 42, padding: '0 18px', borderRadius: 21,
              border: `1.5px solid ${t.border}`, background: 'transparent',
              cursor: step === 0 ? 'not-allowed' : 'pointer',
              opacity: step === 0 ? 0.28 : 1,
              fontSize: 14, color: t.text, fontFamily: 'inherit',
              transition: 'opacity 150ms',
            }}
          >
            <ChevronLeft size={16} /> Back
          </button>

          <span style={{ fontSize: 13, color: t.textMuted }}>
            {step + 1} / {total}
          </span>

          <button
            onClick={isLast ? finish : () => go(step + 1)}
            className="nav-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              height: 42, padding: '0 22px', borderRadius: 21,
              border: 'none', background: t.primary, color: t.surface,
              cursor: 'pointer', fontSize: 14, fontWeight: 700,
              fontFamily: 'inherit',
              transition: 'opacity 150ms',
            }}
          >
            {isLast
              ? <><PixelHeart color={t.surface} size={12} /> Tara, mag-explore!</>
              : <>Next <ArrowRight size={16} /></>
            }
          </button>
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
