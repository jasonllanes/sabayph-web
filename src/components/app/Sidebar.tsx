import { Compass, Users, Map, User, Heart, MessageSquare, LogOut } from 'lucide-react';
import { PixelHeart } from '@/components/common/PixelDecorations';
import type { Theme, UserInfo } from '@/types';
import type { TabId } from './BottomNav';

const TABS: { id: TabId; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }> }[] = [
  { id: 'discover',  label: 'Discover',  Icon: Compass },
  { id: 'rooms',     label: 'My Rooms',  Icon: Users },
  { id: 'explore',   label: 'Explore',   Icon: Map },
  { id: 'friends',   label: 'Friends',   Icon: Heart },
  { id: 'messages',  label: 'Messages',  Icon: MessageSquare },
  { id: 'profile',   label: 'Profile',   Icon: User },
];

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  theme: Theme;
  user: UserInfo;
  onLogout: () => void;
  pendingCount?: number;
  unreadMessages?: number;
}

export default function Sidebar({ activeTab, onTabChange, theme, user, onLogout, pendingCount = 0, unreadMessages = 0 }: SidebarProps) {
  return (
    <div style={{ width: 240, flexShrink: 0, height: '100vh', display: 'flex', flexDirection: 'column', background: theme.surface, borderRight: `2px solid ${theme.border}`, transition: 'background 600ms ease, border-color 600ms ease' }}>
      <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/sabayph_logo.png" alt="SabayPH" style={{ width: 40, height: 40, borderRadius: 10, border: `2px solid ${theme.primary}`, objectFit: 'cover' }} />
        <div>
          <p className="font-display" style={{ fontSize: 18, fontWeight: 800, color: theme.text, margin: 0 }}>
            Sabay<span style={{ color: theme.accent }}>PH</span>
          </p>
          <p className="font-pixel" style={{ fontSize: 10, color: theme.textMuted, margin: 0, letterSpacing: 1 }}>WHEREVER YOU GO</p>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          const badge = id === 'friends' && pendingCount > 0 ? pendingCount : id === 'messages' && unreadMessages > 0 ? unreadMessages : null;
          return (
            <button key={id} onClick={() => onTabChange(id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: active ? `${theme.primary}18` : 'transparent', border: active ? `1.5px solid ${theme.primary}30` : '1.5px solid transparent', cursor: 'pointer', width: '100%', fontFamily: '"DM Sans", system-ui, sans-serif', transition: 'all 200ms ease' }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = `${theme.text}08`; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} style={{ color: active ? theme.primary : theme.textMuted, flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? theme.primary : theme.text, flex: 1, textAlign: 'left' }}>{label}</span>
              {badge != null && badge > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, background: id === 'friends' ? theme.accent : theme.primary, color: theme.surface, padding: '2px 7px', borderRadius: 10 }}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
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
              <img
                src={user.avatarUrl}
                alt={user.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                onError={e => {
                  const isFemale = user.gender === 'Babae';
                  (e.currentTarget as HTMLImageElement).src = isFemale ? '/avatar_girl.png' : '/avatar.png';
                }}
              />
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
