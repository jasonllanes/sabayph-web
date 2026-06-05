import { useState, useEffect, useCallback, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { Moon, Sun } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DiscoverProfile } from '@/types';
import { useScreenSize } from '@/hooks/useScreenSize';
import { useDarkMode } from '@/hooks/useDarkMode';
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
import { useUnreadCount } from '@/hooks/useMessages';
import { usePendingFriendsCount, usePendingRoomsCount } from '@/hooks/useBadgeCounts';
import { useAcceptedBookings } from '@/hooks/useRoomChat';
import ProfileViewModal from './ProfileViewModal';
import { useConnections } from '@/hooks/useConnections';

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
  @keyframes tab-enter { from { opacity: 0; } to { opacity: 1; } }
  .tab-enter   { animation: tab-enter 220ms ease-out both; }
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
`;

const TAB_LABELS: Record<TabId, string> = {
  discover: 'Discover',
  rooms:    'My Rooms',
  explore:  'Explore',
  friends:  'Friends',
  messages: 'Messages',
  profile:  'Profile',
};

interface AppShellProps {
  user: User | null;
  onLogout: () => void;
  initialProfileTag?: string;
}

export default function AppShell({ user, onLogout, initialProfileTag }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const saved = localStorage.getItem('sabayph_active_tab') as TabId | null;
    const valid: TabId[] = ['discover', 'rooms', 'explore', 'friends', 'messages', 'profile'];
    return saved && valid.includes(saved) ? saved : 'discover';
  });

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    localStorage.setItem('sabayph_active_tab', tab);
  };
  const [activeCategory, setActiveCategory] = useState<ThemeKey>('heritage');
  const [exploreCategory, setExploreCategory] = useState<import('@/types').CategoryId | null>(null);
  const { isMobile } = useScreenSize();
  const { dark, toggle: toggleDark } = useDarkMode();

  const effectiveCategory: ThemeKey = activeTab === 'discover' ? activeCategory : 'heritage';
  const baseTheme: Theme = THEMES[effectiveCategory];
  const theme: Theme = dark ? applyDark(baseTheme) : baseTheme;

  const { profile } = useProfile(user?.id);
  const unreadMessages = useUnreadCount(user?.id);
  const pendingFriends = usePendingFriendsCount(user?.id);
  const pendingRooms   = usePendingRoomsCount(user?.id);
  const { bookings: acceptedBookings } = useAcceptedBookings(user?.id);
  const userEmail = user?.email ?? user?.user_metadata?.email ?? 'kasama@sabayph.com';
  const googleName: string = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? '';
  const userName = profile?.display_name || googleName || userEmail.split('@')[0];
  const avatarUrl: string = user?.user_metadata?.avatar_url ?? '';

  // Resolve display avatar: Google pic → gender-based local avatar
  const isFemale = profile?.gender === 'Babae' || (profile?.profile_tags ?? []).some(t => t === 'She/Her' || t === 'She/They');
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

  // Persistent accepted-booking banner — shown to the courier who was accepted
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
      <span style={{ fontSize: 20, flexShrink: 0 }}>📦</span>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: 0.2 }}>
          You've been accepted as courier!
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
          {acceptedBookings[0].room_name} · {acceptedBookings[0].join_code} — tap to open tracking chat
        </p>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.22)', padding: '4px 10px', borderRadius: 10, flexShrink: 0 }}>
        Open →
      </span>
    </button>
  ) : null;

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
      case 'explore': return <ExploreTab theme={theme} userId={user?.id} initialCategory={exploreCategory} />;
      case 'friends':  return <FriendsTab theme={theme} userId={user?.id} />;
      case 'messages': return <MessagesTab theme={theme} userId={user?.id} />;
      case 'profile': return (
        <ProfileTab
          theme={theme}
          user={{ email: userEmail, name: userName }}
          supabaseUser={user ?? undefined}
          avatarUrl={avatarUrl}
          userId={user?.id}
          dark={dark}
          onToggleDark={toggleDark}
          onLogout={onLogout}
        />
      );
      default: return <DiscoverTab theme={theme} activeCategory={activeCategory} onCategoryChange={onCategoryChange} userId={user?.id} onBrowseCategory={cat => { setExploreCategory(cat); handleTabChange('explore'); }} />;
    }
  };

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: theme.bg, color: theme.text, fontFamily: '"DM Sans", system-ui, sans-serif', transition: 'background 600ms ease, color 600ms ease' }}>
        <style>{GLOBAL_STYLE}</style>

        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: `${theme.bg}F0`, borderBottom: `1.5px solid ${theme.border}`, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', transition: 'all 600ms ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/sabayph_logo.png" alt="SabayPH" style={{ width: 34, height: 34, borderRadius: 9, objectFit: 'cover', border: `2px solid ${theme.primary}` }} />
            <span className="font-display" style={{ fontSize: 18, fontWeight: 800, color: theme.text }}>
              Sabay<span style={{ color: theme.accent }}>PH</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DarkToggle />
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

        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} theme={theme} unreadMessages={unreadMessages} pendingFriends={pendingFriends} pendingRooms={pendingRooms} profileCompleted={!!profile?.profile_completed} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: theme.bg, color: theme.text, fontFamily: '"DM Sans", system-ui, sans-serif', transition: 'background 600ms ease, color 600ms ease' }}>
      <style>{GLOBAL_STYLE}</style>

      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} theme={theme} user={{ email: userEmail, name: userName, avatarUrl: displayAvatar, gender: profile?.gender }} onLogout={onLogout} unreadMessages={unreadMessages} pendingFriends={pendingFriends} pendingRooms={pendingRooms} profileCompleted={!!profile?.profile_completed} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', background: theme.surface, borderBottom: `1.5px solid ${theme.border}`, transition: 'all 600ms ease' }}>
          <div>
            <p className="font-pixel" style={{ fontSize: 12, color: theme.accent, margin: '0 0 2px', letterSpacing: 1 }}>
              {TAB_LABELS[activeTab].toUpperCase()}
            </p>
            <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, color: theme.text, margin: 0 }}>
              {activeTab === 'discover' ? `Kamusta, ${userName}! 👋`
                : activeTab === 'rooms' ? 'Your Rooms'
                : activeTab === 'explore'  ? 'Explore Activities'
                : activeTab === 'messages' ? 'Messages'
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
    </div>
  );
}
