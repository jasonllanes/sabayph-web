import { useEffect, useState } from 'react';
import { PixelHeart, PixelPlus } from '@/components/common/PixelDecorations';

interface LoadingDotProps {
  delay: number;
}

function LoadingDot({ delay }: LoadingDotProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setActive(true);
      setTimeout(() => setActive(false), 400);
    };
    const id = setInterval(cycle, 900);
    const init = setTimeout(cycle, delay);
    return () => { clearInterval(id); clearTimeout(init); };
  }, [delay]);

  return (
    <div
      style={{
        width: 10, height: 10,
        background: active ? '#EEA64C' : '#2A405A',
        borderRadius: 0,
        transition: 'background 200ms ease, transform 200ms ease',
        transform: active ? 'scaleY(1.4)' : 'scaleY(1)',
      }}
    />
  );
}

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1000),
      setTimeout(() => setPhase(4), 1300),
      setTimeout(() => setPhase(5), 1600),
      setTimeout(() => setPhase(6), 2000),
      setTimeout(() => onDone(), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: '#06131B',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"DM Sans", system-ui, sans-serif',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
        .font-pixel { font-family: 'VT323', monospace; }
        @keyframes elastic-in {
          0%   { transform: scale(0.3); opacity: 0; }
          60%  { transform: scale(1.15); }
          80%  { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes float-logo { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <div
        style={{
          position: 'absolute', inset: 0, opacity: 0.15,
          backgroundImage: 'linear-gradient(#2A405A 1px, transparent 1px), linear-gradient(90deg, #2A405A 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div style={{ position: 'absolute', top: 48, left: 24 }}><PixelPlus color="#2A405A" size={20} /></div>
      <div style={{ position: 'absolute', top: 48, right: 24 }}><PixelPlus color="#2A405A" size={20} /></div>
      <div style={{ position: 'absolute', bottom: 80, left: 24 }}><PixelHeart color="#C82718" size={16} /></div>
      <div style={{ position: 'absolute', bottom: 80, right: 24 }}><PixelHeart color="#C82718" size={16} /></div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, position: 'relative', zIndex: 1 }}>
        <div
          style={{
            width: 160, height: 160,
            borderRadius: 28,
            border: '3px solid #EEA64C',
            boxShadow: '0 0 32px rgba(238,166,76,0.35)',
            overflow: 'hidden',
            animation: phase >= 1
              ? 'elastic-in 900ms cubic-bezier(0.22,1,0.36,1) both, float-logo 4s ease-in-out 1s infinite'
              : 'none',
            opacity: phase >= 1 ? 1 : 0,
          }}
        >
          <img src="/sabayph_logo.png" alt="SabayPH" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div style={{ height: 32 }} />

        <p
          className="font-pixel"
          style={{
            fontSize: 52, color: '#F1EDE1', letterSpacing: 6,
            animation: phase >= 2 ? 'slide-up 600ms ease-out both' : 'none',
            opacity: phase >= 2 ? 1 : 0,
            margin: 0,
          }}
        >
          SABAYPH
        </p>

        <div style={{ height: 8 }} />

        <p
          className="font-pixel"
          style={{
            fontSize: 13, color: '#EEA64C', letterSpacing: 1.5, lineHeight: 1.6,
            textAlign: 'center', maxWidth: 280, margin: 0,
            animation: phase >= 3 ? 'fade-in 600ms ease both' : 'none',
            opacity: phase >= 3 ? 1 : 0,
          }}
        >
          WHEREVER YOU GO, SOMEONE&apos;S ALWAYS BY YOUR SIDE.
        </p>

        <div style={{ height: 16 }} />

        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            animation: phase >= 4 ? 'fade-in 500ms ease both' : 'none',
            opacity: phase >= 4 ? 1 : 0,
          }}
        >
          <PixelHeart color="#C82718" size={16} />
          <PixelPlus color="#EEA64C" size={12} />
          <PixelHeart color="#C82718" size={16} />
        </div>

        <div style={{ height: 48 }} />

        <div
          style={{
            display: 'flex', gap: 6, alignItems: 'center',
            animation: phase >= 5 ? 'fade-in 400ms ease both' : 'none',
            opacity: phase >= 5 ? 1 : 0,
          }}
        >
          {[0, 200, 400, 600, 800].map((d) => <LoadingDot key={d} delay={d} />)}
        </div>

        <div style={{ height: 12 }} />

        <p
          className="font-pixel"
          style={{
            fontSize: 14, color: '#9DB0C2', letterSpacing: 3, margin: 0,
            animation: phase >= 5 ? 'fade-in 400ms ease both' : 'none',
            opacity: phase >= 5 ? 1 : 0,
          }}
        >
          LOADING...
        </p>
      </div>

      <p
        className="font-pixel"
        style={{
          position: 'absolute', bottom: 32, left: 0, right: 0,
          textAlign: 'center', fontSize: 12, color: '#5A6B7A', letterSpacing: 2, margin: 0,
          animation: phase >= 6 ? 'fade-in 600ms ease both' : 'none',
          opacity: phase >= 6 ? 1 : 0,
        }}
      >
        PROUDLY MADE IN THE PHILIPPINES
      </p>
    </div>
  );
}
