import { Compass, Users, Map, User, Heart } from 'lucide-react';
import type { Theme } from '@/types';

export type TabId = 'discover' | 'rooms' | 'explore' | 'friends' | 'profile';

const TABS: { id: TabId; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }> }[] = [
  { id: 'discover', label: 'Discover', Icon: Compass },
  { id: 'rooms',    label: 'Rooms',    Icon: Users },
  { id: 'explore',  label: 'Explore',  Icon: Map },
  { id: 'friends',  label: 'Friends',  Icon: Heart },
  { id: 'profile',  label: 'Profile',  Icon: User },
];

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  theme: Theme;
}

export default function BottomNav({ activeTab, onTabChange, theme }: BottomNavProps) {
  return (
    <div style={{ flexShrink: 0, display: 'flex', background: theme.surface, borderTop: `2px solid ${theme.border}`, paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
      {TABS.map(({ id, label, Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '10px 0 8px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: '"DM Sans", system-ui, sans-serif', transition: 'opacity 150ms ease' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 26, borderRadius: 13, background: active ? `${theme.primary}1A` : 'transparent', transition: 'background 300ms ease' }}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} style={{ color: active ? theme.primary : theme.textMuted, transition: 'color 300ms ease' }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? theme.primary : theme.textMuted, transition: 'color 300ms ease', letterSpacing: 0.2 }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
