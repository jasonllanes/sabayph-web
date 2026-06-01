import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { Moon, Sun } from 'lucide-react';
import { useScreenSize } from '@/hooks/useScreenSize';
import { useDarkMode } from '@/hooks/useDarkMode';
import { THEMES } from '@/data/themes';
import type { Theme, ThemeKey } from '@/types';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import DiscoverTab from './DiscoverTab';
import RoomsTab from './RoomsTab';
import ExploreTab from './ExploreTab';
import ProfileTab from './ProfileTab';

type TabId = 'discover' | 'rooms' | 'explore' | 'profile';

// Splash screen dark palette applied on top of any theme
const DARK: Partial<Theme> = {
  bg:         '#06131B',
  surface:    '#0D1F2D',
  surfaceAlt: '#142332',
  text:       '#F1EDE1',
  textMuted:  '#9DB0C2',
  border:     '#2A405A',
  badge:      '#142332',
};

function applyDark(base: Theme): Theme {
  return { ...base, ...DARK };
}

const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Bricolage+Grotesque:wght@500;700;800&family=VT323&display=swap');
  .font-display { font-family: 'Bricolage Grotesque', serif; letter-spacing: -0.02em; }
  .font-pixel  { font-family: 'VT323', monospace; letter-spacing: 0.02em; }
  @keyframes float-soft { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  .float-soft  { animation: float-soft 4s ease-in-out infinite; }
  @keyframes fade-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .fade-rise   { animation: fade-rise 500ms ease-out both; }
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
`;

const TAB_LABELS: Record<TabId, string> = {
  discover: 'Discover',
  rooms:    'My Rooms',
  explore:  'Explore',
  profile:  'Profile',
};

interface AppShellProps {
  user: User | null;
  onLogout: () => void;
}

export default function AppShell({ user, onLogout }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<TabId>('discover');
  const [activeCategory, setActiveCategory] = useState<ThemeKey>('heritage');
  const { isMobile } = useScreenSize();
  const { dark, toggle: toggleDark } = useDarkMode();

  const baseTheme: Theme = THEMES[activeCategory];
  const theme: Theme = dark ? applyDark(baseTheme) : baseTheme;

  const userEmail = user?.email ?? user?.user_metadata?.email ?? 'kasama@sabayph.com';
  const userFullName: string = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? '';
  const userName = userFullName || userEmail.split('@')[0];

  useEffect(() => {
    document.documentElement.style.transition = 'background-color 600ms ease';
    document.documentElement.style.backgroundColor = theme.bg;
  }, [theme.bg]);

  const onCategoryChange = useCallback((val: ThemeKey | ((prev: ThemeKey) => ThemeKey)) => {
    setActiveCategory(typeof val === 'function' ? val(activeCategory) : val);
  }, [activeCategory]);

  const DarkToggle = () => (
    <button
      onClick={toggleDark}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: 34, height: 34, borderRadius: '50%',
        background: dark ? '#2A405A' : theme.surfaceAlt,
        border: `1.5px solid ${theme.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: dark ? '#EEA64C' : theme.textMuted,
        transition: 'all 250ms ease', flexShrink: 0,
      }}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'rooms':   return <RoomsTab theme={theme} userId={user?.id} />;
      case 'explore': return <ExploreTab theme={theme} />;
      case 'profile': return (
        <ProfileTab
          theme={theme}
          user={{ email: userEmail, name: userName }}
          userId={user?.id}
          dark={dark}
          onToggleDark={toggleDark}
          onLogout={onLogout}
        />
      );
      default: return <DiscoverTab theme={theme} activeCategory={activeCategory} onCategoryChange={onCategoryChange} />;
    }
  };

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: theme.bg, color: theme.text, fontFamily: '"DM Sans", system-ui, sans-serif', transition: 'background 600ms ease, color 600ms ease' }}>
        <style>{GLOBAL_STYLE}</style>

        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: `${theme.bg}F0`, borderBottom: `1.5px solid ${theme.border}`, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', transition: 'all 600ms ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/sabayph_logo.png" alt="SabayPH" style={{ width: 34, height: 34, borderRadius: 9, objectFit: 'cover', border: `2px solid ${theme.primary}` }} />
            <span className="font-display" style={{ fontSize: 18, fontWeight: 800, color: theme.text }}>
              Sabay<span style={{ color: theme.accent }}>PH</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DarkToggle />
            <div
              style={{ width: 34, height: 34, borderRadius: '50%', background: theme.primary, color: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Bricolage Grotesque", serif', fontWeight: 800, fontSize: 15, cursor: 'pointer', border: `2px solid ${theme.border}` }}
              onClick={() => setActiveTab('profile')}
              title={userName}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
          {renderTab()}
        </div>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} theme={theme} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: theme.bg, color: theme.text, fontFamily: '"DM Sans", system-ui, sans-serif', transition: 'background 600ms ease, color 600ms ease' }}>
      <style>{GLOBAL_STYLE}</style>

      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} theme={theme} user={{ email: userEmail, name: userName }} onLogout={onLogout} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', background: theme.surface, borderBottom: `1.5px solid ${theme.border}`, transition: 'all 600ms ease' }}>
          <div>
            <p className="font-pixel" style={{ fontSize: 12, color: theme.accent, margin: '0 0 2px', letterSpacing: 1 }}>
              {TAB_LABELS[activeTab].toUpperCase()}
            </p>
            <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, color: theme.text, margin: 0 }}>
              {activeTab === 'discover' ? `Kamusta, ${userName}! 👋`
                : activeTab === 'rooms' ? 'Your Rooms'
                : activeTab === 'explore' ? 'Explore Activities'
                : 'Your Profile'}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <DarkToggle />
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: theme.text, margin: 0 }}>{userName}</p>
              <p style={{ fontSize: 12, color: theme.textMuted, margin: 0 }}>{userEmail}</p>
            </div>
            <div
              style={{ width: 40, height: 40, borderRadius: '50%', background: theme.primary, color: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Bricolage Grotesque", serif', fontWeight: 800, fontSize: 17, border: `2px solid ${theme.border}`, cursor: 'pointer', flexShrink: 0 }}
              onClick={() => setActiveTab('profile')}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div style={{ maxWidth: activeTab === 'discover' ? 900 : 800, margin: '0 auto', padding: '0 16px' }}>
            {renderTab()}
          </div>
        </div>
      </div>
    </div>
  );
}
