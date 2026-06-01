import { useState } from 'react';
import { Shield, Star, Users, LogOut, ChevronRight, Bell, Lock, HelpCircle, Moon, Sun, Save, Check } from 'lucide-react';
import { FacebookIcon, InstagramIcon, TwitterIcon } from '@/components/common/SocialIcons';
import { PixelHeart } from '@/components/common/PixelDecorations';
import { useProfile } from '@/hooks/useProfile';
import type { Theme, UserInfo } from '@/types';

interface SettingItem {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>;
  label: string;
  sub: string;
}

const SETTINGS: SettingItem[] = [
  { Icon: Bell,       label: 'Notifications',     sub: 'Manage alerts & reminders' },
  { Icon: Lock,       label: 'Privacy & Security', sub: 'Verification & data settings' },
  { Icon: HelpCircle, label: 'Help & Support',     sub: 'FAQs and contact support' },
];

const STATS = [
  { value: '3',   label: 'Rooms joined' },
  { value: '12',  label: 'Events attended' },
  { value: '4.8', label: 'Kasama rating' },
];

interface ProfileTabProps {
  theme: Theme;
  user: UserInfo;
  userId?: string;
  dark: boolean;
  onToggleDark: () => void;
  onLogout: () => void;
}

export default function ProfileTab({ theme, user, userId, dark, onToggleDark, onLogout }: ProfileTabProps) {
  const { profile, saveProfile } = useProfile(userId);
  const [fb, setFb] = useState('');
  const [ig, setIg] = useState('');
  const [tw, setTw] = useState('');
  const [savedLinks, setSavedLinks] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Populate inputs once profile loads
  if (profile && !profileLoaded) {
    setFb(profile.facebook_url ?? '');
    setIg(profile.instagram_url ?? '');
    setTw(profile.twitter_url ?? '');
    setProfileLoaded(true);
  }

  const handleSaveLinks = async () => {
    setSavingLinks(true);
    await saveProfile({ facebook_url: fb || null, instagram_url: ig || null, twitter_url: tw || null });
    setSavingLinks(false);
    setSavedLinks(true);
    setTimeout(() => setSavedLinks(false), 2500);
  };
  return (
    <div style={{ padding: '20px 16px 32px' }}>
      <div style={{ background: theme.surface, border: `3px solid ${theme.text}`, borderRadius: 24, boxShadow: `6px 6px 0 ${theme.text}`, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ height: 80, background: theme.primary, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '0 20px 0' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: `linear-gradient(${theme.bg} 1px, transparent 1px), linear-gradient(90deg, ${theme.bg} 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
          <div style={{ position: 'absolute', top: 12, right: 16 }}><PixelHeart color={theme.highlight} size={16} /></div>
        </div>

        <div style={{ padding: '0 20px 20px', marginTop: -28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', border: `3px solid ${theme.surface}`, overflow: 'hidden', background: theme.primary, boxShadow: `0 2px 8px ${theme.text}22`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: '"Bricolage Grotesque", serif', fontWeight: 800, fontSize: 26, color: theme.bg, position: 'absolute' }}>
                {user.name.charAt(0).toUpperCase()}
              </span>
              <img src="/avatar.png" alt="Profile" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: '#EEA64C22', border: '1px solid #EEA64C66' }}>
              <Star size={14} fill="#EEA64C" style={{ color: '#EEA64C' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#9F5E0F' }}>New kasama</span>
            </div>
          </div>
          <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: theme.text, margin: '0 0 2px' }}>{user.name}</h2>
          <p style={{ fontSize: 13, color: theme.textMuted, margin: '0 0 12px' }}>{user.email}</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: `${theme.primary}18`, border: `1px solid ${theme.primary}44` }}>
            <Shield size={13} style={{ color: theme.primary }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: theme.primary }}>Verification pending</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: `1px solid ${theme.border}` }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ padding: '16px 8px', textAlign: 'center', borderRight: i < 2 ? `1px solid ${theme.border}` : 'none' }}>
              <p className="font-display" style={{ fontSize: 20, fontWeight: 800, color: theme.primary, margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: theme.textMuted, margin: '2px 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px', background: theme.surface, border: `1.5px solid ${theme.border}`, borderRadius: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <p className="font-display" style={{ fontSize: 15, fontWeight: 700, color: theme.text, margin: '0 0 2px' }}>Kasama Reputation</p>
            <p style={{ fontSize: 12, color: theme.textMuted, margin: 0 }}>Level 1 — Building trust</p>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} style={{ color: theme.primary }} />
          </div>
        </div>
        <div style={{ background: theme.surfaceAlt, borderRadius: 6, height: 8, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 6, width: '15%', background: theme.primary, transition: 'width 800ms ease' }} />
        </div>
        <p style={{ fontSize: 11, color: theme.textMuted, margin: '6px 0 0' }}>Join 3 more rooms to reach Level 2</p>
      </div>

      <div style={{ background: theme.surface, border: `1.5px solid ${theme.border}`, borderRadius: 18, overflow: 'hidden', marginBottom: 16 }}>
        {/* Dark mode toggle row */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', transition: 'background 150ms ease' }}
          onClick={onToggleDark}
          onMouseEnter={e => (e.currentTarget.style.background = theme.surfaceAlt)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: dark ? '#2A405A' : theme.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: dark ? '#EEA64C' : theme.primary }}>
            {dark ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: theme.text, margin: 0 }}>{dark ? 'Light Mode' : 'Dark Mode'}</p>
            <p style={{ fontSize: 12, color: theme.textMuted, margin: '1px 0 0' }}>{dark ? 'Switch to light theme' : 'Switch to dark theme'}</p>
          </div>
          {/* Toggle pill */}
          <div style={{ width: 44, height: 24, borderRadius: 12, background: dark ? theme.primary : theme.border, position: 'relative', transition: 'background 250ms ease', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 3, left: dark ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.3)', transition: 'left 250ms ease' }} />
          </div>
        </div>

        {SETTINGS.map((s, i) => (
          <div
            key={i}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: i < SETTINGS.length - 1 ? `1px solid ${theme.border}` : 'none', cursor: 'pointer', transition: 'background 150ms ease' }}
            onMouseEnter={e => (e.currentTarget.style.background = theme.surfaceAlt)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: theme.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.primary }}>
              <s.Icon size={18} strokeWidth={1.8} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: theme.text, margin: 0 }}>{s.label}</p>
              <p style={{ fontSize: 12, color: theme.textMuted, margin: '1px 0 0' }}>{s.sub}</p>
            </div>
            <ChevronRight size={16} style={{ color: theme.textMuted }} />
          </div>
        ))}
      </div>

      {/* Social links card */}
      <div style={{ background: theme.surface, border: `1.5px solid ${theme.border}`, borderRadius: 18, padding: 16, marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: theme.text, margin: '0 0 4px' }}>Social Links</p>
        <p style={{ fontSize: 12, color: theme.textMuted, margin: '0 0 14px', lineHeight: 1.5 }}>
          These auto-fill when you create a room. Leave blank to skip.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {[
            { val: fb, set: setFb, Icon: FacebookIcon, placeholder: 'https://facebook.com/yourpage', color: '#1877F2' },
            { val: ig, set: setIg, Icon: InstagramIcon, placeholder: 'https://instagram.com/yourhandle', color: '#E4405F' },
            { val: tw, set: setTw, Icon: TwitterIcon, placeholder: 'https://x.com/yourhandle', color: '#1DA1F2' },
          ].map(({ val, set, Icon, placeholder, color }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1.5px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color={color} />
              </div>
              <input
                value={val}
                onChange={e => set(e.target.value)}
                placeholder={placeholder}
                style={{ flex: 1, height: 40, padding: '0 12px', fontSize: 13, fontFamily: '"DM Sans",system-ui,sans-serif', border: `1.5px solid ${theme.border}`, borderRadius: 10, background: theme.bg, color: theme.text, outline: 'none', boxSizing: 'border-box' as const }}
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleSaveLinks}
          disabled={savingLinks}
          style={{ width: '100%', height: 42, borderRadius: 21, border: 'none', background: savedLinks ? '#15803D' : theme.primary, color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: '"DM Sans",system-ui,sans-serif', cursor: savingLinks ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background 250ms ease' }}
        >
          {savedLinks ? <><Check size={15} /> Saved!</> : savingLinks ? 'Saving…' : <><Save size={15} /> Save Social Links</>}
        </button>
      </div>

      <button
        onClick={onLogout}
        style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1.5px solid #FCA5A5', background: '#FEF2F2', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 14, fontWeight: 600, color: '#B91C1C', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 150ms ease' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#FEE2E2')}
        onMouseLeave={e => (e.currentTarget.style.background = '#FEF2F2')}
      >
        <LogOut size={17} />
        Sign out
      </button>

      <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <PixelHeart color={theme.accent} size={10} />
        <p className="font-pixel" style={{ fontSize: 11, color: theme.textMuted, margin: 0, letterSpacing: 1 }}>SABAYPH v1.0 — MADE IN MINDANAO</p>
        <PixelHeart color={theme.accent} size={10} />
      </div>
    </div>
  );
}
