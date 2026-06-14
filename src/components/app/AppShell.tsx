import { useState, useEffect, useCallback, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  Moon, Sun, ShoppingBasket, HeartHandshake, Gamepad2, Coffee, ShieldAlert,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { isAdmin } from '@/lib/admin';
import AdminPanel from '@/components/admin/AdminPanel';
import type { DiscoverProfile } from '@/types';
import { useScreenSize } from '@/hooks/useScreenSize';
import { useProfile } from '@/hooks/useProfile';
import { THEMES } from '@/data/themes';
import type { Theme, ThemeKey } from '@/types';
import BottomNav, { type TabId } from './BottomNav';
import Sidebar from './Sidebar';
import DiscoverTab from './DiscoverTab';
import RoomsTab from './RoomsTab';
import ExploreTab from './ExploreTab';
import ProfileTab from './ProfileTab';
import FriendsTab from './FriendsTab';
import MessagesTab from './MessagesTab';
import NotificationsTab from './NotificationsTab';
import { useUnreadCount } from '@/hooks/useMessages';
import { useNotifications } from '@/hooks/useNotifications';
import { usePendingFriendsCount, usePendingRoomsCount } from '@/hooks/useBadgeCounts';
import { useAcceptedBookings } from '@/hooks/useRoomChat';
import ProfileViewModal from './ProfileViewModal';
import { useConnections } from '@/hooks/useConnections';

// ─── Theme modes ──────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'pasabuy' | 'rotary' | 'gaming' | 'cafe';

const THEME_MODES: { id: ThemeMode; label: string; Icon: React.ElementType; dot: string }[] = [
  { id: 'light',   label: 'Light',   Icon: Sun,           dot: '#F1EDE1' },
  { id: 'dark',    label: 'Dark',    Icon: Moon,          dot: '#0D1F2D' },
  { id: 'pasabuy', label: 'PasaBuy', Icon: ShoppingBasket, dot: '#CA8A04' },
  { id: 'rotary',  label: 'Rotary',  Icon: HeartHandshake, dot: '#1A7A3C' },
  { id: 'gaming',  label: 'Gaming',  Icon: Gamepad2,       dot: '#A855F7' },
  { id: 'cafe',    label: 'Café',    Icon: Coffee,         dot: '#5C3317' },
];

// Dark-mode overlay — retains bg/surface palette, replaces primary with #f0a54b
const DARK: Partial<Theme> = {
  bg:         '#06131B',
  surface:    '#0D1F2D',
  surfaceAlt: '#142332',
  primary:    '#f0a54b',
  accent:     '#f0a54b',
  highlight:  '#f0a54b',
  text:       '#F1EDE1',
  textMuted:  '#9DB0C2',
  border:     '#2A405A',
  badge:      '#142332',
};

function resolveTheme(mode: ThemeMode, activeCategory: ThemeKey): Theme {
  switch (mode) {
    case 'dark':    return { ...THEMES.heritage, ...DARK };
    case 'pasabuy': return THEMES.pasabuy;
    case 'rotary':  return THEMES.rotary;
    case 'gaming':  return THEMES.gaming;
    case 'cafe':    return THEMES.cafe;
    default:
      // Light mode: active category drives the theme globally
      return THEMES[activeCategory];
  }
}

const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Bricolage+Grotesque:wght@500;700;800&family=VT323&display=swap');
  .font-display { font-family: 'Bricolage Grotesque', serif; letter-spacing: -0.02em; }
  .font-pixel  { font-family: 'VT323', monospace; letter-spacing: 0.02em; }
  @keyframes float-soft { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  .float-soft  { animation: float-soft 4s ease-in-out infinite; }
  @keyframes fade-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .fade-rise   { animation: fade-rise 500ms ease-out both; }
  @keyframes tab-enter { from { opacity: 0; } to { opacity: 1; } }
  .tab-enter   { animation: tab-enter 220ms ease-out both; }
  * { box-sizing: border-box; }
  ::selection { background: #f0a54b; color: #06131B; }
  ::-moz-selection { background: #f0a54b; color: #06131B; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
`;

const TAB_LABELS: Record<TabId, string> = {
  discover:      'Discover',
  rooms:         'My Rooms',
  explore:       'Explore',
  friends:       'Friends',
  messages:      'Messages',
  notifications: 'Notifications',
  profile:       'Profile',
};

interface AppShellProps {
  user: User | null;
  onLogout: () => void;
  initialProfileTag?: string;
}

// ─── Theme Mode Selector ──────────────────────────────────────────────────────

function ThemeModeSelector({
  mode, onSetMode, theme: T,
}: { mode: ThemeMode; onSetMode: (m: ThemeMode) => void; theme: Theme }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const current = THEME_MODES.find(m => m.id === mode)!;
  const isDarkBg = mode === 'dark' || mode === 'gaming';

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Change theme mode"
        style={{
          width: 34, height: 34, borderRadius: '50%',
          background: isDarkBg ? T.surfaceAlt : T.surfaceAlt,
          border: `1.5px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          color: T.primary,
          transition: 'all 250ms ease',
          position: 'relative',
        }}
      >
        <current.Icon size={16} />
        {/* Colored dot showing active mode */}
        <span style={{
          position: 'absolute', top: -2, right: -2,
          width: 9, height: 9, borderRadius: '50%',
          background: current.dot,
          border: `1.5px solid ${T.surface}`,
        }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 42, right: 0, zIndex: 9000,
          background: T.surface, border: `1.5px solid ${T.border}`,
          borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          overflow: 'hidden', minWidth: 148,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', padding: '10px 12px 6px', margin: 0, fontFamily: '"VT323",monospace' }}>
            APPEARANCE
          </p>
          {THEME_MODES.map(({ id, label, Icon, dot }) => {
            const active = id === mode;
            return (
              <button
                key={id}
                onClick={() => { onSetMode(id); setOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                  padding: '9px 12px', background: active ? `${T.primary}18` : 'none',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontFamily: '"DM Sans",system-ui,sans-serif',
                  transition: 'background 120ms',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = `${T.primary}0E`; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'none'; }}
              >
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: dot, flexShrink: 0, border: `1.5px solid ${T.border}` }} />
                <Icon size={13} style={{ color: active ? T.primary : T.textMuted, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? T.primary : T.text }}>
                  {label}
                </span>
                {active && (
                  <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: T.primary, flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────

export default function AppShell({ user, onLogout, initialProfileTag }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const saved = localStorage.getItem('sabayph_active_tab') as TabId | null;
    const valid: TabId[] = ['discover', 'rooms', 'explore', 'friends', 'messages', 'profile', 'notifications'];
    return saved && valid.includes(saved) ? saved : 'discover';
  });

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    localStorage.setItem('sabayph_active_tab', tab);
  };
  const [showAdmin, setShowAdmin] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ThemeKey>('heritage');
  const [exploreCategory, setExploreCategory] = useState<import('@/types').CategoryId | null>(null);

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('sabayph_theme_mode') as ThemeMode) ?? 'light';
  });

  const handleSetMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem('sabayph_theme_mode', mode);
  };

  // ProfileTab backward compat: treat dark + gaming as "dark"
  const isDark = themeMode === 'dark' || themeMode === 'gaming';
  const toggleDark = () => handleSetMode(isDark ? 'light' : 'dark');

  const { isMobile } = useScreenSize();
  const theme = resolveTheme(themeMode, activeCategory);

  const { profile } = useProfile(user?.id);
  const unreadMessages = useUnreadCount(user?.id);
  const pendingFriends  = usePendingFriendsCount(user?.id);
  const pendingRooms    = usePendingRoomsCount(user?.id);
  const { bookings: acceptedBookings } = useAcceptedBookings(user?.id);
  const {
    notifications,
    loading: notifLoading,
    available: notifAvailable,
    unreadCount: unreadNotifications,
    markRead: markNotifRead,
    markAllRead: markAllNotifRead,
    remove: removeNotif,
    clearAll: clearAllNotifs,
  } = useNotifications(user?.id);
  const userEmail  = user?.email ?? user?.user_metadata?.email ?? 'kasama@sabayph.com';
  const googleName: string = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? '';
  const userName   = profile?.display_name || googleName || userEmail.split('@')[0];
  const avatarUrl: string  = user?.user_metadata?.avatar_url ?? '';

  const isFemale    = profile?.gender === 'Babae' || (profile?.profile_tags ?? []).some(t => t === 'She/Her' || t === 'She/They');
  const localAvatar = isFemale ? '/avatar_girl.png' : '/avatar.png';
  const displayAvatar = avatarUrl || localAvatar;

  useEffect(() => {
    document.documentElement.style.transition = 'background-color 600ms ease';
    document.documentElement.style.backgroundColor = theme.bg;
  }, [theme.bg]);

  // Deep-link: open profile by kasama_tag from ?profile= URL param
  const [deepLinkProfile, setDeepLinkProfile] = useState<DiscoverProfile | null>(null);
  const [connLoading, setConnLoading] = useState(false);
  const deepLinkFetched = useRef(false);
  const { getStatus, getConnection, sendRequest, acceptRequest, removeConnection, tableReady, error: connError } = useConnections(user?.id);
  useEffect(() => {
    if (!initialProfileTag || deepLinkFetched.current) return;
    deepLinkFetched.current = true;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, age_range, location, bio, gender, profile_tags, kasama_rating, rating_count, is_online, profile_completed, contact_phone, home_lat, rooms_joined, avatar_url')
        .eq('kasama_tag', initialProfileTag)
        .single();
      if (data) setDeepLinkProfile(data as DiscoverProfile);
    })();
  }, [initialProfileTag]);

  const onCategoryChange = useCallback((val: ThemeKey | ((prev: ThemeKey) => ThemeKey)) => {
    setActiveCategory(typeof val === 'function' ? val(activeCategory) : val);
  }, [activeCategory]);

  // Persistent accepted-booking banner — shown to the member who was accepted into a room
  const BookingBanner = acceptedBookings.length > 0 ? (
    <button
      onClick={() => handleTabChange('messages')}
      style={{
        flexShrink: 0, width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 16px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        background: 'linear-gradient(90deg,#D97706,#B45309)',
        boxShadow: '0 2px 8px rgba(180,83,9,0.35)',
      }}
    >
      <span style={{ fontSize: 20, flexShrink: 0 }}>🎉</span>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: 0.2 }}>
          You've been accepted into a room!
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
          {acceptedBookings[0].room_name} · {acceptedBookings[0].join_code} — tap to open group chat
        </p>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.22)', padding: '4px 10px', borderRadius: 10, flexShrink: 0 }}>
        Open →
      </span>
    </button>
  ) : null;

  const AdminButton = () => isAdmin(userEmail) ? (
    <button
      onClick={() => setShowAdmin(true)}
      title="Admin Panel"
      style={{ width: 34, height: 34, borderRadius: '50%', background: isDark ? '#2A405A' : theme.surfaceAlt, border: `1.5px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#C82718', transition: 'all 250ms ease', flexShrink: 0 }}
    >
      <ShieldAlert size={16} />
    </button>
  ) : null;

  const DarkToggle = () => (
    <button
      onClick={toggleDark}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: 34, height: 34, borderRadius: '50%',
        background: isDark ? '#2A405A' : theme.surfaceAlt,
        border: `1.5px solid ${theme.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: isDark ? '#EEA64C' : theme.textMuted,
        transition: 'all 250ms ease', flexShrink: 0,
      }}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'rooms':         return <RoomsTab theme={theme} userId={user?.id} userAvatarUrl={displayAvatar} />;
      case 'explore':       return <ExploreTab theme={theme} userId={user?.id} initialCategory={exploreCategory} />;
      case 'friends':       return <FriendsTab theme={theme} userId={user?.id} />;
      case 'messages':      return <MessagesTab theme={theme} userId={user?.id} />;
      case 'notifications': return (
        <NotificationsTab
          theme={theme}
          notifications={notifications}
          loading={notifLoading}
          available={notifAvailable}
          onMarkRead={markNotifRead}
          onMarkAllRead={markAllNotifRead}
          onRemove={removeNotif}
          onClearAll={clearAllNotifs}
          onNavigate={handleTabChange}
        />
      );
      case 'profile':  return (
        <ProfileTab
          theme={theme}
          user={{ email: userEmail, name: userName }}
          supabaseUser={user ?? undefined}
          avatarUrl={avatarUrl}
          userId={user?.id}
          dark={isDark}
          onToggleDark={toggleDark}
          onLogout={onLogout}
        />
      );
      default: return (
        <DiscoverTab
          theme={theme}
          activeCategory={activeCategory}
          onCategoryChange={onCategoryChange}
          userId={user?.id}
          userName={userName}
          userAvatar={displayAvatar}
          onBrowseCategory={cat => { setExploreCategory(cat); handleTabChange('explore'); }}
          onAddRoom={() => handleTabChange('rooms')}
        />
      );
    }
  };

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: theme.bg, color: theme.text, fontFamily: '"DM Sans", system-ui, sans-serif', transition: 'background 600ms ease, color 600ms ease' }}>
        <style>{GLOBAL_STYLE}</style>

        <div style={{ flexShrink: 0, position: 'relative', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: `${theme.bg}F0`, borderBottom: `1.5px solid ${theme.border}`, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', transition: 'all 600ms ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/sabayph_logo_tp.png" alt="SabayPH" style={{ width: 34, height: 34, borderRadius: 9, objectFit: 'cover', border: `2px solid ${theme.primary}` }} />
            <span className="font-display" style={{ fontSize: 18, fontWeight: 800, color: theme.text }}>
              Sabay<span style={{ color: theme.primary }}>PH</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AdminButton />
            <ThemeModeSelector mode={themeMode} onSetMode={handleSetMode} theme={theme} />
            <div
              style={{ width: 34, height: 34, borderRadius: '50%', background: theme.primary, color: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Bricolage Grotesque", serif', fontWeight: 800, fontSize: 15, cursor: 'pointer', border: `2px solid ${theme.border}`, overflow: 'hidden', position: 'relative', flexShrink: 0 }}
              onClick={() => handleTabChange('profile')}
              title={userName}
            >
              <img src={displayAvatar} alt={userName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).src = localAvatar; }} />
            </div>
          </div>
        </div>

        {BookingBanner}

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
          <div key={activeTab} className="tab-enter">
            {renderTab()}
          </div>
        </div>

        <div data-bottomnav style={{ position: 'relative', zIndex: 10 }}>
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} theme={theme} unreadMessages={unreadMessages} pendingFriends={pendingFriends} pendingRooms={pendingRooms} unreadNotifications={unreadNotifications} profileCompleted={!!profile?.profile_completed} />
        </div>
        {showAdmin && <AdminPanel userId={user?.id} userEmail={userEmail} onClose={() => setShowAdmin(false)} />}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: theme.bg, color: theme.text, fontFamily: '"DM Sans", system-ui, sans-serif', transition: 'background 600ms ease, color 600ms ease' }}>
      <style>{GLOBAL_STYLE}</style>

      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} theme={theme} user={{ email: userEmail, name: userName, avatarUrl: displayAvatar, gender: profile?.gender }} onLogout={onLogout} unreadMessages={unreadMessages} pendingFriends={pendingFriends} pendingRooms={pendingRooms} unreadNotifications={unreadNotifications} profileCompleted={!!profile?.profile_completed} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', background: theme.surface, borderBottom: `1.5px solid ${theme.border}`, transition: 'all 600ms ease' }}>
          <div>
            <p className="font-pixel" style={{ fontSize: 12, color: theme.primary, margin: '0 0 2px', letterSpacing: 1 }}>
              {TAB_LABELS[activeTab].toUpperCase()}
            </p>
            <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, color: theme.text, margin: 0 }}>
              {activeTab === 'discover' ? `Kamusta, ${userName}! 👋`
                : activeTab === 'rooms'         ? 'Your Rooms'
                : activeTab === 'explore'       ? 'Explore Activities'
                : activeTab === 'messages'      ? 'Messages'
                : activeTab === 'notifications' ? 'Notifications'
                : 'Your Profile'}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AdminButton />
            <ThemeModeSelector mode={themeMode} onSetMode={handleSetMode} theme={theme} />
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: theme.text, margin: 0 }}>{userName}</p>
              <p style={{ fontSize: 12, color: theme.textMuted, margin: 0 }}>{userEmail}</p>
            </div>
            <div
              style={{ width: 40, height: 40, borderRadius: '50%', background: theme.primary, color: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Bricolage Grotesque", serif', fontWeight: 800, fontSize: 17, border: `2px solid ${theme.border}`, cursor: 'pointer', flexShrink: 0, overflow: 'hidden', position: 'relative' }}
              onClick={() => handleTabChange('profile')}
            >
              <img src={displayAvatar} alt={userName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).src = localAvatar; }} />
            </div>
          </div>
        </div>

        {BookingBanner}

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div key={activeTab} className="tab-enter" style={{ maxWidth: activeTab === 'discover' ? 900 : 800, margin: '0 auto', padding: '0 16px' }}>
            {renderTab()}
          </div>
        </div>
      </div>

      {/* Deep-link profile modal (from ?profile=ksm-xxxx QR scan) */}
      {deepLinkProfile && (
        <ProfileViewModal
          person={deepLinkProfile}
          theme={theme}
          currentUserId={user?.id}
          connectionStatus={getStatus(deepLinkProfile.id)}
          connectionLoading={connLoading}
          connectionError={connError}
          tableReady={tableReady}
          connection={getConnection(deepLinkProfile.id)}
          onSendRequest={async () => {
            setConnLoading(true);
            await sendRequest(deepLinkProfile.id);
            setConnLoading(false);
          }}
          onAcceptRequest={async () => {
            const conn = getConnection(deepLinkProfile.id);
            if (conn) { setConnLoading(true); await acceptRequest(conn.id); setConnLoading(false); }
          }}
          onRemoveConnection={async () => {
            const conn = getConnection(deepLinkProfile.id);
            if (conn) { setConnLoading(true); await removeConnection(conn.id); setConnLoading(false); }
          }}
          onClose={() => setDeepLinkProfile(null)}
        />
      )}

      {/* Admin panel overlay */}
      {showAdmin && <AdminPanel userId={user?.id} userEmail={userEmail} onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
