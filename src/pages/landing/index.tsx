import { useState, useEffect, useRef } from 'react';
import { THEMES } from '@/data/themes';
import type { ThemeKey } from '@/types';
import { LandingNav } from './components/LandingNav';
import { HeroSection } from './components/HeroSection';
import { CategoriesSection } from './components/CategoriesSection';
import { FeaturesSection } from './components/FeaturesSection';
import { TrustSection } from './components/TrustSection';
import { ManifestoSection } from './components/ManifestoSection';
import { WaitlistSection } from './components/WaitlistSection';
import { LandingFooter } from './components/LandingFooter';

interface SabayPHLandingProps {
  onLoginClick?: () => void;
}

export default function SabayPHLanding({ onLoginClick }: SabayPHLandingProps) {
  const [activeCategory, setActiveCategory] = useState<ThemeKey>('heritage');
  const theme = THEMES[activeCategory];
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.documentElement.style.transition = 'background-color 600ms ease';
    document.documentElement.style.backgroundColor = theme.bg;
  }, [theme.bg]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleCategory = (id: ThemeKey) => {
    const isOpening = activeCategory !== id;
    setActiveCategory((prev) => (prev === id ? 'heritage' : id));
    if (isOpening) {
      setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
    }
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: theme.bg,
        color: theme.text,
        fontFamily: '"DM Sans", system-ui, sans-serif',
        transition: 'background-color 600ms ease, color 600ms ease',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Bricolage+Grotesque:wght@500;700;800&family=VT323&display=swap');
        .font-display { font-family: 'Bricolage Grotesque', serif; letter-spacing: -0.02em; }
        .font-pixel { font-family: 'VT323', monospace; letter-spacing: 0.02em; }
        @keyframes float-soft { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .float-soft { animation: float-soft 4s ease-in-out infinite; }
        @keyframes fade-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-rise { animation: fade-rise 700ms ease-out both; }
      `}</style>

      <LandingNav theme={theme} onLoginClick={onLoginClick} scrollTo={scrollTo} />
      <HeroSection theme={theme} scrollTo={scrollTo} />
      <CategoriesSection
        theme={theme}
        activeCategory={activeCategory}
        toggleCategory={toggleCategory}
        setActiveCategory={setActiveCategory}
        panelRef={panelRef}
        scrollTo={scrollTo}
      />
      <FeaturesSection theme={theme} />
      <TrustSection theme={theme} />
      <ManifestoSection theme={theme} />
      <WaitlistSection theme={theme} />
      <LandingFooter theme={theme} />
    </div>
  );
}
