import { Compass, Users, Map, User, Heart, MessageSquare, LogOut, Lock, Bell } from 'lucide-react';
import { PixelHeart } from '@/components/common/PixelDecorations';
import type { Theme, UserInfo } from '@/types';
import type { TabId } from './BottomNav';

const NAV_GROUPS: { items: { id: TabId; label: string; Icon: React.ComponentType<any> }[] }[] = [
  {
    items: [
      { id: 'discover', label: 'Discover', Icon: Compass },
      { id: 'explore',  label: 'Explore',  Icon: Map },
      { id: 'rooms',    label: 'My Rooms', Icon: Users },
    ],
  },
  {
    items: [
      { id: 'friends',       label: 'Friends',       Icon: Heart },
      { id: 'messages',      label: 'Messages',      Icon: MessageSquare },
      { id: 'notifications', label: 'Notifications', Icon: Bell },
    ],
  },
  {
    items: [
      { id: 'profile',  label: 'Profile',  Icon: User },
    ],
  },
];

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  theme: Theme;
  user: UserInfo;
  onLogout: () => void;
  pendingCount?: number;
  unreadMessages?: number;
  pendingFriends?: number;
  pendingRooms?: number;
  unreadNotifications?: number;
  profileCompleted?: boolean;
}

export default function Sidebar({ activeTab, onTabChange, theme, user, onLogout, pendingCount = 0, unreadMessages = 0, pendingFriends = 0, pendingRooms = 0, unreadNotifications = 0, profileCompleted = true }: SidebarProps) {
  return (
    <div style={{ width: 240, flexShrink: 0, height: '100vh', display: 'flex', flexDirection: 'column', background: theme.surface, borderRight: `2px solid ${theme.border}`, transition: 'background 600ms ease, border-color 600ms ease' }}>
      <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/sabayph_logo_tp.png" alt="SabayPH" style={{ width: 40, height: 40, borderRadius: 10, border: `2px solid ${theme.primary}`, objectFit: 'cover' }} />
        <div>
          <p className="font-display" style={{ fontSize: 18, fontWeight: 800, color: theme.text, margin: 0 }}>
            Sabay<span style={{ color: theme.accent }}>PH</span>
          </p>
          <p className="font-pixel" style={{ fontSize: 10, color: theme.textMuted, margin: 0, letterSpacing: 1 }}>WHEREVER YOU GO</p>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto' }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && (
              <div style={{ height: 1, background: theme.border, margin: '8px 4px' }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {group.items.map(({ id, label, Icon }) => {
                const active = activeTab === id;
                const badge = id === 'messages'      ? unreadMessages
                            : id === 'friends'       ? (pendingFriends || pendingCount)
                            : id === 'rooms'         ? pendingRooms
                            : id === 'notifications' ? unreadNotifications
                            : null;
                const locked = id === 'rooms' && !profileCompleted;

                return (
                  <div key={id}>
                    <button
                      onClick={() => !locked && onTabChange(id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: active ? `${theme.primary}18` : 'transparent', border: active ? `1.5px solid ${theme.primary}30` : '1.5px solid transparent', cursor: locked ? 'default' : 'pointer', width: '100%', fontFamily: '"DM Sans", system-ui, sans-serif', transition: 'all 200ms ease', opacity: locked ? 0.6 : 1 }}
                      onMouseEnter={e => { if (!active && !locked) e.currentTarget.style.background = `${theme.text}08`; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Icon size={20} strokeWidth={active ? 2.5 : 1.8} style={{ color: active ? theme.primary : theme.textMuted, flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? theme.primary : theme.text, flex: 1, textAlign: 'left' }}>{label}</span>
                      {locked && <Lock size={12} style={{ color: theme.textMuted, flexShrink: 0 }} />}
                      {!locked && badge != null && badge > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: id === 'friends' ? theme.accent : theme.primary, color: theme.surface, padding: '2px 7px', borderRadius: 10 }}>
                          {badge > 9 ? '9+' : badge}
                        </span>
                      )}
                    </button>
                    {locked && (
                      <p style={{ fontSize: 11, color: theme.textMuted, margin: '-2px 0 4px 46px', lineHeight: 1.4 }}>
                        Complete verification.{' '}
                        <button onClick={() => onTabChange('profile')} style={{ background: 'none', border: 'none', padding: 0, fontSize: 11, fontWeight: 700, color: theme.primary, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
                          Go to Profile →
                        </button>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div style={{ padding: '12px 20px', borderTop: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <PixelHeart color={theme.accent} size={10} />
          <p className="font-pixel" style={{ fontSize: 11, color: theme.accent, margin: 0, letterSpacing: 1 }}>TARA, SABAY TAYO!</p>
        </div>
      </div>

      <div style={{ padding: '16px 12px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: theme.primary, flexShrink: 0, overflow: 'hidden', border: `2px solid ${theme.border}`, position: 'relative' }}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                onError={e => { const isFemale = user.gender === 'Babae'; (e.currentTarget as HTMLImageElement).src = isFemale ? '/avatar_girl.png' : '/avatar.png'; }} />
            ) : (
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Bricolage Grotesque", serif', fontWeight: 800, fontSize: 15, color: theme.bg }}>
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: theme.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
            <p style={{ fontSize: 11, color: theme.textMuted, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
          </div>
        </div>
        <button onClick={onLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 10, background: 'transparent', border: `1px solid ${theme.border}`, cursor: 'pointer', width: '100%', fontFamily: '"DM Sans", system-ui, sans-serif', color: theme.textMuted, fontSize: 13, fontWeight: 500, transition: 'all 150ms ease' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#B91C1C'; e.currentTarget.style.borderColor = '#FCA5A5'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.textMuted; e.currentTarget.style.borderColor = theme.border; }}>
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );
}
