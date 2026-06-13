import { Compass, Users, Map, User, Heart, MessageSquare, Lock, Bell } from 'lucide-react';
import type { Theme } from '@/types';

export type TabId = 'discover' | 'rooms' | 'explore' | 'friends' | 'messages' | 'profile' | 'notifications';

const TABS: { id: TabId; label: string; Icon: React.ComponentType<any> }[] = [
  { id: 'discover',      label: 'Discover', Icon: Compass },
  { id: 'explore',       label: 'Explore',  Icon: Map },
  { id: 'rooms',         label: 'Rooms',    Icon: Users },
  { id: 'friends',       label: 'Friends',  Icon: Heart },
  { id: 'messages',      label: 'Messages', Icon: MessageSquare },
  { id: 'notifications', label: 'Alerts',   Icon: Bell },
  { id: 'profile',       label: 'Profile',  Icon: User },
];

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  theme: Theme;
  unreadMessages?: number;
  pendingFriends?: number;
  pendingRooms?: number;
  unreadNotifications?: number;
  profileCompleted?: boolean;
}

export default function BottomNav({ activeTab, onTabChange, theme, unreadMessages = 0, pendingFriends = 0, pendingRooms = 0, unreadNotifications = 0, profileCompleted = true }: BottomNavProps) {
  return (
    <div style={{ flexShrink: 0, display: 'flex', background: theme.surface, borderTop: `2px solid ${theme.border}`, paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
      {TABS.map(({ id, label, Icon }) => {
        const active = activeTab === id;
        const locked = id === 'rooms' && !profileCompleted;
        const badge = locked ? 0 : id === 'messages' ? unreadMessages : id === 'friends' ? pendingFriends : id === 'rooms' ? pendingRooms : id === 'notifications' ? unreadNotifications : 0;
        return (
          <button
            key={id}
            onClick={() => !locked && onTabChange(id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '10px 0 8px', background: 'none', border: 'none', cursor: locked ? 'default' : 'pointer', fontFamily: '"DM Sans", system-ui, sans-serif', opacity: locked ? 0.5 : 1, transition: 'opacity 150ms ease' }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 26, borderRadius: 13, background: active ? `${theme.primary}1A` : 'transparent', transition: 'background 300ms ease' }}>
              {locked ? <Lock size={16} style={{ color: theme.textMuted }} /> : <Icon size={20} strokeWidth={active ? 2.5 : 1.8} style={{ color: active ? theme.primary : theme.textMuted, transition: 'color 300ms ease' }} />}
              {!locked && badge > 0 && (
                <span style={{ position: 'absolute', top: -4, right: 2, minWidth: 14, height: 14, borderRadius: 7, background: theme.accent, color: '#fff', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: `1.5px solid ${theme.surface}` }}>
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? theme.primary : theme.textMuted, transition: 'color 300ms ease', letterSpacing: 0.2 }}>
              {label}
            </span>
            {locked && (
              <span style={{ fontSize: 8, color: theme.accent, fontWeight: 600, letterSpacing: 0.2, lineHeight: 1, marginTop: 1 }}>
                Verify first
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
