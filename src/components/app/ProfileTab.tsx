import { useState, lazy, Suspense } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  Users, LogOut, ChevronDown,
  Bell, Lock, HelpCircle, Moon, Sun, Save, Check, Phone, Copy,
  MapPin, X, ShieldCheck, ShieldAlert, Shield, Calendar, Sprout, AtSign, Navigation,
} from 'lucide-react';
import { FacebookIcon, InstagramIcon, TwitterIcon } from '@/components/common/SocialIcons';
import { PixelHeart } from '@/components/common/PixelDecorations';
import { useProfile } from '@/hooks/useProfile';
import { useUserStats } from '@/hooks/useUserStats';
import { supabase } from '@/lib/supabase';
import type { Theme, UserInfo } from '@/types';
import type { MapLocation, MapPickerTheme } from '@/components/common/MapPicker';

const MapPicker = lazy(() => import('@/components/common/MapPicker'));

import { PRONOUNS, INTEREST_TAGS, OTHERS_PALETTE, othersColor, tagStyle, getDefaultAvatar } from '@/components/app/tagConstants';

interface ProfileTabProps {
  theme: Theme;
  user: UserInfo;
  supabaseUser?: User;
  avatarUrl?: string;
  userId?: string;
  dark: boolean;
  onToggleDark: () => void;
  onLogout: () => void;
}

// ── Verification progress helpers ──────────────────────────────────────────
function getVerifySteps(
  profileCompleted: boolean,
  emailVerified: boolean,
  phoneAdded: boolean,
  locationPinned: boolean,
) {
  return [
    { key: 'profile',  label: 'Complete your profile', sub: 'Display name, bio, and location', done: profileCompleted },
    { key: 'email',    label: 'Verify email address',  sub: 'Confirm via email link',           done: emailVerified },
    { key: 'phone',    label: 'Add phone number',       sub: 'Save your contact number',        done: phoneAdded },
    { key: 'location', label: 'Pin home location',      sub: 'Mark your area on the map',       done: locationPinned },
  ];
}

function badgeConfig(count: number) {
  if (count === 4) return { label: 'Fully verified',     color: '#15803D', bg: '#DCFCE7', border: '#86EFAC', Icon: ShieldCheck };
  if (count >= 2) return { label: 'Partially verified', color: '#A16207', bg: '#FEF9C3', border: '#FDE047', Icon: Shield };
  if (count === 1) return { label: 'Getting started',   color: '#C2410C', bg: '#FFEDD5', border: '#FDBA74', Icon: ShieldAlert };
  return             { label: 'Not verified',           color: '#6B7280', bg: '#F3F4F6', border: '#D1D5DB', Icon: ShieldAlert };
}

// ── Copyable user ID chip ─────────────────────────────────────────────────

function UserIdChip({ userId, T }: { userId: string; T: { primary: string; surfaceAlt: string; border: string; textMuted: string; text: string } }) {
  const [copied, setCopied] = useState(false);
  const short = `${userId.slice(0, 8)}…`;
  const copy = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      title="Copy your User ID to share with friends"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, border: `1.5px solid ${copied ? '#86EFAC' : T.border}`, background: copied ? '#DCFCE7' : T.surfaceAlt, color: copied ? '#15803D' : T.textMuted, fontSize: 11, fontWeight: 600, fontFamily: '"DM Sans",system-ui,sans-serif', cursor: 'pointer', transition: 'all 200ms', marginBottom: 6 }}
    >
      {copied
        ? <><Check size={11} /> ID Copied!</>
        : <><Copy size={11} /> ID: {short}</>}
    </button>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────

function ProfileSkeleton({ T }: { T: Theme }) {
  return (
    <div style={{ padding: '20px 16px 32px' }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .sk { border-radius: 8px; background: linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.border} 50%, ${T.surfaceAlt} 75%); background-size: 800px 100%; animation: shimmer 1.4s infinite linear; }
      `}</style>

      {/* Profile card skeleton */}
      <div style={{ background: T.surface, border: `3px solid ${T.border}`, borderRadius: 24, overflow: 'hidden', marginBottom: 20 }}>
        {/* Header strip */}
        <div style={{ height: 80, background: T.surfaceAlt }} />

        <div style={{ padding: '0 20px 20px', marginTop: -28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="sk" style={{ width: 64, height: 64, borderRadius: '50%', border: `3px solid ${T.surface}` }} />
            <div className="sk" style={{ width: 110, height: 28, borderRadius: 20 }} />
          </div>
          <div className="sk" style={{ width: 160, height: 22, marginBottom: 8 }} />
          <div className="sk" style={{ width: 200, height: 14, marginBottom: 8 }} />
          <div className="sk" style={{ width: 100, height: 22, borderRadius: 20, marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="sk" style={{ width: 60, height: 14, borderRadius: 12 }} />
            <div className="sk" style={{ width: 50, height: 14, borderRadius: 12 }} />
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: `1px solid ${T.border}` }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ padding: '16px 8px', textAlign: 'center', borderRight: i < 2 ? `1px solid ${T.border}` : 'none' }}>
              <div className="sk" style={{ width: 32, height: 24, margin: '0 auto 6px' }} />
              <div className="sk" style={{ width: 70, height: 11, margin: '0 auto', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Tags skeleton */}
      <div className="sk" style={{ height: 58, borderRadius: 18, marginBottom: 16 }} />

      {/* Verification skeleton */}
      <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', marginBottom: 16, padding: '14px 16px' }}>
        <div className="sk" style={{ width: 160, height: 16, marginBottom: 8 }} />
        <div className="sk" style={{ width: '100%', height: 8, borderRadius: 6, marginBottom: 14 }} />
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}`, marginBottom: 8 }}>
            <div className="sk" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="sk" style={{ width: '60%', height: 13, marginBottom: 5, borderRadius: 6 }} />
              <div className="sk" style={{ width: '40%', height: 10, borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Settings skeleton */}
      <div className="sk" style={{ height: 180, borderRadius: 18, marginBottom: 16 }} />
      {/* Social links skeleton */}
      <div className="sk" style={{ height: 220, borderRadius: 18, marginBottom: 16 }} />
    </div>
  );
}

export default function ProfileTab({ theme: T, user, supabaseUser, avatarUrl, userId, dark, onToggleDark, onLogout }: ProfileTabProps) {
  const { profile, loading: profileLoading, saveProfile } = useProfile(userId);
  const stats = useUserStats(userId);

  // Social links
  const [fb, setFb] = useState('');
  const [ig, setIg] = useState('');
  const [tw, setTw] = useState('');
  const [savedLinks, setSavedLinks] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Profile edit
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAgeRange, setEditAgeRange] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editLoaded, setEditLoaded] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savedEdit, setSavedEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Privacy panel
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'members'>('public');
  const [showInDiscover, setShowInDiscover] = useState(true);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [savedPrivacy, setSavedPrivacy] = useState(false);
  const [privacyLoaded, setPrivacyLoaded] = useState(false);

  // Online status
  const [isOnline, setIsOnline] = useState(false);
  const [onlineLoaded, setOnlineLoaded] = useState(false);
  const [savingOnline, setSavingOnline] = useState(false);

  // Phone (simple add — no OTP)
  const [contactPhone, setContactPhone] = useState('');
  const [phoneInputOpen, setPhoneInputOpen] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [savedPhone, setSavedPhone] = useState(false);
  const [phoneLoaded, setPhoneLoaded] = useState(false);

  // Tags & pronouns
  const [profileTags, setProfileTags] = useState<string[]>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [savingTags, setSavingTags] = useState(false);
  const [savedTags, setSavedTags] = useState(false);

  // Home location pin (dialog)
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<MapLocation | null>(null);
  const [locationName, setLocationName] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);
  const [savedLocation, setSavedLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Email resend
  const [emailResendLoading, setEmailResendLoading] = useState(false);
  const [emailResendDone, setEmailResendDone] = useState(false);

  if (profile && !profileLoaded) {
    setFb(profile.facebook_url ?? '');
    setIg(profile.instagram_url ?? '');
    setTw(profile.twitter_url ?? '');
    setProfileLoaded(true);
  }
  if (profile && !onlineLoaded) {
    setIsOnline(profile.is_online ?? false);
    setOnlineLoaded(true);
  }
  if (profile && !editLoaded) {
    setEditName(profile.display_name ?? '');
    setEditBio(profile.bio ?? '');
    setEditAgeRange(profile.age_range ?? '');
    setEditGender(profile.gender ?? '');
    setEditLocation(profile.location ?? '');
    setEditLoaded(true);
  }
  if (profile && !phoneLoaded) {
    setContactPhone(profile.contact_phone ?? '');
    setPhoneLoaded(true);
  }
  if (profile && !locationLoaded) {
    if (profile.home_lat != null && profile.home_lng != null) {
      setPendingLocation({ lat: profile.home_lat, lng: profile.home_lng, name: profile.location ?? '' });
      setLocationName(profile.location ?? '');
    }
    setLocationLoaded(true);
  }
  if (profile && !tagsLoaded) {
    setProfileTags(profile.profile_tags ?? []);
    setTagsLoaded(true);
  }
  if (profile && !privacyLoaded) {
    setPrivacyLevel((profile as any).privacy_level ?? 'public');
    setShowInDiscover((profile as any).show_in_discover ?? true);
    setPrivacyLoaded(true);
  }

  // Derived state
  const emailVerified = !!supabaseUser?.email_confirmed_at;
  const phoneAdded = !!(profile?.contact_phone);
  const locationPinned = profile?.home_lat != null;
  const profileCompleted = !!profile?.profile_completed;
  const currentPhone = profile?.contact_phone ?? supabaseUser?.phone ?? '';

  const yearJoined = supabaseUser?.created_at
    ? new Date(supabaseUser.created_at).getFullYear()
    : null;
  const daysSinceJoined = supabaseUser?.created_at
    ? Math.floor((Date.now() - new Date(supabaseUser.created_at).getTime()) / 86_400_000)
    : null;
  const isNewJoiner = daysSinceJoined !== null && daysSinceJoined < 90;

  const verifySteps = getVerifySteps(profileCompleted, emailVerified, phoneAdded, locationPinned);
  const doneCount = verifySteps.filter(s => s.done).length;
  const badge = badgeConfig(doneCount);
  const BadgeIcon = badge.Icon;

  const ratingDisplay = stats.kasamaRating !== null
    ? stats.kasamaRating.toFixed(1)
    : '—';

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleSaveLinks = async () => {
    setSavingLinks(true);
    await saveProfile({ facebook_url: fb || null, instagram_url: ig || null, twitter_url: tw || null });
    setSavingLinks(false); setSavedLinks(true);
    setTimeout(() => setSavedLinks(false), 2500);
  };

  const handleSavePrivacy = async () => {
    setSavingPrivacy(true);
    await saveProfile({ privacy_level: privacyLevel, show_in_discover: showInDiscover } as any);
    setSavingPrivacy(false); setSavedPrivacy(true);
    setTimeout(() => setSavedPrivacy(false), 2500);
  };

  const [phoneError, setPhoneError] = useState('');

  const handleSavePhone = async () => {
    if (!contactPhone.trim()) return;
    setPhoneError('');
    setSavingPhone(true);
    const { error } = await saveProfile({ contact_phone: contactPhone.trim() });
    setSavingPhone(false);
    if (error) { setPhoneError(error); return; }
    setSavedPhone(true);
    setPhoneInputOpen(false);
    setTimeout(() => setSavedPhone(false), 2500);
  };

  const useGPS = () => {
    if (!navigator.geolocation) { setLocationError('Geolocation not supported by your browser.'); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, name: locationName };
        setPendingLocation(loc);
        setGpsLoading(false);
      },
      () => { setLocationError('Could not get GPS location. Try tapping the map instead.'); setGpsLoading(false); },
    );
  };

  const handleSaveLocation = async () => {
    if (!pendingLocation) { setLocationError('Pin a location on the map first.'); return; }
    setLocationError('');
    setSavingLocation(true);
    const { error } = await saveProfile({
      home_lat: pendingLocation.lat,
      home_lng: pendingLocation.lng,
      location: locationName.trim() || null,
    } as any);
    setSavingLocation(false);
    if (error) { setLocationError(error); return; }
    setSavedLocation(true);
    setLocationDialogOpen(false);
    setTimeout(() => setSavedLocation(false), 2500);
  };

  const handleToggleOnline = async () => {
    const next = !isOnline;
    setIsOnline(next);
    setSavingOnline(true);
    await saveProfile({ is_online: next } as any);
    setSavingOnline(false);
  };

  const PRONOUN_LABELS = ['He/Him','She/Her','They/Them','She/They','He/They'];

  const toggleTag = (label: string) => {
    const isPronoun = PRONOUN_LABELS.includes(label);
    setProfileTags(prev => {
      if (isPronoun) {
        // Radio: remove all existing pronouns, then toggle the clicked one
        const withoutPronoun = prev.filter(t => !PRONOUN_LABELS.includes(t));
        return prev.includes(label) ? withoutPronoun : [...withoutPronoun, label];
      }
      return prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label];
    });
  };

  const handleSaveTags = async () => {
    setSavingTags(true);
    await saveProfile({ profile_tags: profileTags } as any);
    setSavingTags(false); setSavedTags(true);
    setTagsOpen(false);
    setTimeout(() => setSavedTags(false), 2000);
  };

  const handleSaveProfileEdit = async () => {
    if (!editName.trim()) { setEditError('Display name is required.'); return; }
    setEditError('');
    setSavingEdit(true);
    const { error } = await saveProfile({
      display_name:      editName.trim(),
      bio:               editBio.trim() || null,
      age_range:         editAgeRange || null,
      gender:            editGender || null,
      location:          editLocation.trim() || null,
      profile_completed: true,
    } as any);
    setSavingEdit(false);
    if (error) { setEditError(error); return; }
    setSavedEdit(true);
    setProfileEditOpen(false);
    setTimeout(() => setSavedEdit(false), 2000);
  };

  const handleResendEmail = async () => {
    if (!user.email) return;
    setEmailResendLoading(true);
    await supabase.auth.resend({ type: 'signup', email: user.email });
    setEmailResendLoading(false); setEmailResendDone(true);
    setTimeout(() => setEmailResendDone(false), 4000);
  };

  // ── shared styles ──────────────────────────────────────────────────────────

  const inputSt: React.CSSProperties = {
    width: '100%', height: 48, padding: '0 14px', fontSize: 14,
    fontFamily: '"DM Sans", system-ui, sans-serif',
    border: `1.5px solid ${T.border}`, borderRadius: 10,
    background: T.bg, color: T.text, outline: 'none', boxSizing: 'border-box',
  };

  const tog = (on: boolean, fn: () => void) => (
    <div onClick={fn} style={{ width: 44, height: 24, borderRadius: 12, background: on ? T.primary : T.border, position: 'relative', transition: 'background 250ms ease', flexShrink: 0, cursor: 'pointer' }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.3)', transition: 'left 250ms ease' }} />
    </div>
  );

  // ── render ─────────────────────────────────────────────────────────────────

  if (profileLoading && !profile) {
    return <ProfileSkeleton T={T} />;
  }

  return (
    <div style={{ padding: '20px 16px 32px' }}>

      {/* ── Profile card ── */}
      <div style={{ background: T.surface, border: `3px solid ${T.text}`, borderRadius: 24, boxShadow: `6px 6px 0 ${T.text}`, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ height: 80, background: T.primary, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: `linear-gradient(${T.bg} 1px,transparent 1px),linear-gradient(90deg,${T.bg} 1px,transparent 1px)`, backgroundSize: '20px 20px' }} />
          <div style={{ position: 'absolute', top: 12, right: 16 }}><PixelHeart color={T.highlight} size={16} /></div>
        </div>

        <div style={{ padding: '0 20px 20px', marginTop: -28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', border: `3px solid ${T.surface}`, overflow: 'hidden', background: T.primary, boxShadow: `0 2px 8px ${T.text}22`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: '"Bricolage Grotesque",serif', fontWeight: 800, fontSize: 26, color: T.bg, position: 'absolute' }}>
                {user.name.charAt(0).toUpperCase()}
              </span>
              {avatarUrl
                ? <img src={avatarUrl} alt={user.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                : <img src={getDefaultAvatar(profile?.gender, profileTags)} alt="Profile" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              }
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: badge.bg, border: `1px solid ${badge.border}` }}>
              <BadgeIcon size={13} style={{ color: badge.color }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: badge.color }}>{badge.label}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
            <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0 }}>{user.name}</h2>
            {(() => {
              const pronoun = profileTags.find(t => ['He/Him','She/Her','They/Them','She/They','He/They'].includes(t));
              if (!pronoun) return null;
              const pr = PRONOUNS.find(p => p.label === pronoun);
              if (!pr) return null;
              return (
                <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: pr.bg, color: pr.color, border: `1.5px solid ${pr.color}44`, flexShrink: 0 }}>
                  {pr.label}
                </span>
              );
            })()}
          </div>
          <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 8px' }}>{user.email}</p>
          {/* Copyable user ID — for sharing with friends */}
          {userId && <UserIdChip userId={userId} T={T} />}

          {/* Year joined + new joiner badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {yearJoined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.textMuted }}>
                <Calendar size={12} />
                <span>Member since {yearJoined}</span>
              </div>
            )}
            {isNewJoiner && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 12, background: '#F0FDF4', border: '1px solid #86EFAC' }}>
                <Sprout size={11} style={{ color: '#15803D' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D' }}>New Kasama</span>
              </div>
            )}
          </div>

          {profile?.bio && <p style={{ fontSize: 13, color: T.text, margin: '0 0 4px', lineHeight: 1.5 }}>{profile.bio}</p>}
          {(profile?.location || profile?.age_range) && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: profileTags.length > 0 ? 8 : 0 }}>
              {profile.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.textMuted }}><MapPin size={12} />{profile.location}</span>}
              {profile.age_range && <span style={{ fontSize: 12, color: T.textMuted, background: T.surfaceAlt, padding: '2px 10px', borderRadius: 12 }}>{profile.age_range}</span>}
            </div>
          )}
          {profileTags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {profileTags.map(tag => {
                const ts = tagStyle(tag, userId ?? '');
                return (
                  <span key={tag} style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: ts.bg, color: ts.color, border: `1px solid ${ts.color}33` }}>
                    {ts.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats — live from DB */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: `1px solid ${T.border}` }}>
          {[
            { value: stats.loading ? '…' : String(stats.roomsJoined),    label: 'Rooms joined' },
            { value: stats.loading ? '…' : String(stats.eventsAttended), label: 'Events attended' },
            { value: stats.loading ? '…' : ratingDisplay,                label: 'Kasama rating' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '16px 8px', textAlign: 'center', borderRight: i < 2 ? `1px solid ${T.border}` : 'none' }}>
              <p className="font-display" style={{ fontSize: 20, fontWeight: 800, color: T.primary, margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: T.textMuted, margin: '2px 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tags & Pronouns ── */}
      <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', marginBottom: 16 }}>
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', transition: 'background 150ms' }}
          onClick={() => setTagsOpen(o => !o)}
          onMouseEnter={e => (e.currentTarget.style.background = T.surfaceAlt)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 1px' }}>Tags & Pronouns</p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>
              {profileTags.length > 0 ? profileTags.join(', ') : 'Let others know who you are'}
            </p>
          </div>
          <ChevronDown size={16} style={{ color: T.textMuted, transition: 'transform 200ms', transform: tagsOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
        </div>

        {tagsOpen && (
          <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${T.border}`, background: T.surfaceAlt }}>
            {/* Pronouns */}
            <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, margin: '14px 0 8px', letterSpacing: 0.5 }}>PRONOUNS</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {PRONOUNS.map(p => {
                const active = profileTags.includes(p.label);
                return (
                  <button key={p.label} onClick={() => toggleTag(p.label)}
                    style={{ padding: '6px 14px', borderRadius: 20, border: `2px solid ${active ? p.color : T.border}`, background: active ? p.bg : T.surface, color: active ? p.color : T.textMuted, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {active && <Check size={11} />}
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Interests */}
            <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, margin: '0 0 8px', letterSpacing: 0.5 }}>INTERESTS</p>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
              {INTEREST_TAGS.map(t => {
                const active = profileTags.includes(t.label);
                return (
                  <button key={t.label} onClick={() => toggleTag(t.label)}
                    style={{ padding: '6px 12px', borderRadius: 20, border: `2px solid ${active ? t.color : T.border}`, background: active ? t.bg : T.surface, color: active ? t.color : T.textMuted, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>{t.emoji}</span>
                    {t.label}
                    {active && <Check size={10} />}
                  </button>
                );
              })}

              {/* Others — random color per user, not user-selectable */}
              {(() => {
                const active = profileTags.includes('Others');
                const oc = othersColor(userId ?? '');
                return (
                  <button onClick={() => toggleTag('Others')}
                    style={{ padding: '6px 12px', borderRadius: 20, border: `2px solid ${active ? oc.color : T.border}`, background: active ? oc.bg : T.surface, color: active ? oc.color : T.textMuted, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: 5 }}>
                    ✨ Others
                    {active && <Check size={10} />}
                  </button>
                );
              })()}
            </div>

            <button onClick={handleSaveTags} disabled={savingTags}
              style={{ width: '100%', height: 42, borderRadius: 21, border: 'none', background: savedTags ? '#15803D' : T.primary, color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: savingTags ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background 250ms' }}>
              {savedTags ? <><Check size={14} /> Saved!</> : savingTags ? 'Saving…' : <><Save size={14} /> Save Tags</>}
            </button>
          </div>
        )}
      </div>

      {/* ── Verification Progress ── */}
      <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '14px 16px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 1px' }}>Verification Progress</p>
              <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>{doneCount}/4 steps complete</p>
            </div>
            <div style={{ padding: '4px 12px', borderRadius: 20, background: badge.bg, border: `1px solid ${badge.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: badge.color }}>{doneCount === 4 ? 'Verified ✓' : `${doneCount}/4`}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ background: T.surfaceAlt, borderRadius: 6, height: 8, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ height: '100%', borderRadius: 6, width: `${(doneCount / 4) * 100}%`, background: doneCount === 4 ? '#15803D' : doneCount >= 2 ? '#EAB308' : doneCount === 1 ? T.highlight : T.border, transition: 'width 600ms ease' }} />
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {verifySteps.map((step, i) => (
              <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, background: step.done ? '#F0FDF4' : T.surfaceAlt, border: `1px solid ${step.done ? '#86EFAC' : T.border}`, transition: 'all 200ms ease' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: step.done ? '#15803D' : T.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 200ms ease' }}>
                  {step.done
                    ? <Check size={14} style={{ color: '#fff' }} />
                    : <span style={{ fontSize: 12, fontWeight: 700, color: T.surface }}>{i + 1}</span>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: step.done ? '#15803D' : T.text, margin: 0 }}>{step.label}</p>
                  <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>{step.sub}</p>
                </div>
                {step.key === 'profile' && (
                  <button onClick={() => { setProfileEditOpen(o => !o); setEditError(''); }}
                    style={{ padding: '5px 11px', borderRadius: 16, fontSize: 11, fontWeight: 600, border: `1.5px solid ${step.done ? '#86EFAC' : T.primary}`, background: step.done ? '#DCFCE7' : 'transparent', color: step.done ? '#15803D' : T.primary, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    {step.done ? 'Edit' : 'Set up'}
                  </button>
                )}
                {!step.done && step.key === 'email' && (
                  <button onClick={handleResendEmail} disabled={emailResendLoading || emailResendDone}
                    style={{ padding: '5px 11px', borderRadius: 16, fontSize: 11, fontWeight: 600, border: `1.5px solid ${T.primary}`, background: emailResendDone ? '#DCFCE7' : 'transparent', color: emailResendDone ? '#15803D' : T.primary, cursor: emailResendDone ? 'default' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    {emailResendDone ? '✓ Sent' : emailResendLoading ? '…' : 'Resend'}
                  </button>
                )}
                {!step.done && step.key === 'phone' && !phoneInputOpen && (
                  <button onClick={() => { setPhoneInputOpen(true); setPhoneError(''); }}
                    style={{ padding: '5px 11px', borderRadius: 16, fontSize: 11, fontWeight: 600, border: `1.5px solid ${T.primary}`, background: 'transparent', color: T.primary, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    Add
                  </button>
                )}
                {step.done && step.key === 'phone' && (
                  <button onClick={() => { setPhoneInputOpen(o => !o); setPhoneError(''); }}
                    style={{ padding: '5px 11px', borderRadius: 16, fontSize: 11, fontWeight: 600, border: `1.5px solid #86EFAC`, background: '#DCFCE7', color: '#15803D', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    Edit
                  </button>
                )}
                {step.key === 'location' && (
                  <button onClick={() => { setLocationDialogOpen(true); setLocationError(''); }}
                    style={{ padding: '5px 11px', borderRadius: 16, fontSize: 11, fontWeight: 600, border: `1.5px solid ${step.done ? '#86EFAC' : T.primary}`, background: step.done ? '#DCFCE7' : 'transparent', color: step.done ? '#15803D' : T.primary, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    {step.done ? 'Edit' : 'Pin'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Inline profile edit ── */}
        {profileEditOpen && (
          <div style={{ margin: '0 16px 16px', padding: 16, background: T.surfaceAlt, borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>Edit your profile</p>
              <button onClick={() => setProfileEditOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Name */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 5, letterSpacing: 0.4 }}>DISPLAY NAME *</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="What should we call you?" maxLength={40}
                  style={{ ...inputSt, height: 42 }} />
              </div>

              {/* Age range */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6, letterSpacing: 0.4 }}>AGE RANGE</label>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {['18–24','25–34','35–44','45+'].map(r => (
                    <button key={r} type="button" onClick={() => setEditAgeRange(editAgeRange === r ? '' : r)}
                      style={{ padding: '5px 13px', borderRadius: 20, border: `1.5px solid ${editAgeRange === r ? T.primary : T.border}`, background: editAgeRange === r ? `${T.primary}12` : T.surface, color: editAgeRange === r ? T.primary : T.textMuted, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 150ms' }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6, letterSpacing: 0.4 }}>GENDER</label>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {['Lalaki','Babae','Non-binary','Prefer not to say'].map(g => (
                    <button key={g} type="button" onClick={() => setEditGender(editGender === g ? '' : g)}
                      style={{ padding: '5px 13px', borderRadius: 20, border: `1.5px solid ${editGender === g ? T.primary : T.border}`, background: editGender === g ? `${T.primary}12` : T.surface, color: editGender === g ? T.primary : T.textMuted, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 150ms' }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* City */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 5, letterSpacing: 0.4 }}>CITY / AREA</label>
                <input value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="e.g. Cagayan de Oro, Davao…" maxLength={60}
                  style={{ ...inputSt, height: 42 }} />
              </div>

              {/* Bio */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 5, letterSpacing: 0.4 }}>SHORT BIO</label>
                <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Tell the community a bit about yourself…" maxLength={120} rows={3}
                  style={{ ...inputSt, height: 'auto', padding: '10px 14px', resize: 'none', lineHeight: 1.5 }} />
                <p style={{ fontSize: 11, color: T.textMuted, margin: '3px 0 0', textAlign: 'right' }}>{editBio.length}/120</p>
              </div>

              {editError && (
                <p style={{ fontSize: 12, color: '#B91C1C', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '7px 10px', margin: 0 }}>{editError}</p>
              )}

              <button onClick={handleSaveProfileEdit} disabled={savingEdit || !editName.trim()}
                style={{ width: '100%', height: 42, borderRadius: 21, border: 'none', background: (!editName.trim() || savingEdit) ? T.border : T.primary, color: (!editName.trim() || savingEdit) ? T.textMuted : '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: (!editName.trim() || savingEdit) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background 200ms' }}>
                {savingEdit ? 'Saving…' : savedEdit ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Profile</>}
              </button>
            </div>
          </div>
        )}

        {/* Inline phone input — no OTP */}
        {phoneInputOpen && (
          <div style={{ margin: '0 16px 16px', padding: 14, background: T.surfaceAlt, borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>
                {phoneAdded ? 'Update phone number' : 'Add your phone number'}
              </p>
              <button onClick={() => setPhoneInputOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex' }}>
                <X size={16} />
              </button>
            </div>
            <input
              value={contactPhone}
              onChange={e => setContactPhone(e.target.value)}
              placeholder="+63 917 123 4567"
              style={inputSt}
            />
            <p style={{ fontSize: 11, color: T.textMuted, margin: '4px 0 10px' }}>
              Include country code, e.g. +63 for Philippines
            </p>
            {phoneError && (
              <p style={{ fontSize: 12, color: '#B91C1C', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '7px 10px', margin: '0 0 10px' }}>{phoneError}</p>
            )}
            <button
              onClick={handleSavePhone}
              disabled={savingPhone || !contactPhone.trim()}
              style={{ width: '100%', height: 40, borderRadius: 20, border: 'none', background: (!contactPhone.trim() || savingPhone) ? T.border : T.primary, color: (!contactPhone.trim() || savingPhone) ? T.textMuted : '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: (!contactPhone.trim() || savingPhone) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 200ms' }}
            >
              {savingPhone ? 'Saving…' : <><Phone size={14} /> Save Number</>}
            </button>
          </div>
        )}

        {savedPhone && (
          <div style={{ margin: '0 16px 16px', padding: '10px 14px', background: '#DCFCE7', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} style={{ color: '#15803D' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#15803D', margin: 0 }}>Phone number saved!</p>
          </div>
        )}

        {savedLocation && (
          <div style={{ margin: '0 16px 16px', padding: '10px 14px', background: '#DCFCE7', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} style={{ color: '#15803D' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#15803D', margin: 0 }}>Home location saved!</p>
          </div>
        )}
      </div>

      {/* ── Kasama Reputation ── */}
      <div style={{ padding: 16, background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <p className="font-display" style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: '0 0 2px' }}>Kasama Reputation</p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>
              {stats.kasamaRating !== null ? `${stats.ratingCount} rating${stats.ratingCount !== 1 ? 's' : ''} · avg ${stats.kasamaRating.toFixed(1)}` : 'Level 1 — Building trust'}
            </p>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} style={{ color: T.primary }} />
          </div>
        </div>
        <div style={{ background: T.surfaceAlt, borderRadius: 6, height: 8, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 6, width: `${Math.min((stats.roomsJoined / 20) * 100, 100)}%`, background: T.primary, transition: 'width 800ms ease' }} />
        </div>
        <p style={{ fontSize: 11, color: T.textMuted, margin: '6px 0 0' }}>
          {stats.roomsJoined === 0
            ? 'Join your first room to start building reputation'
            : stats.roomsJoined < 5
            ? `Join ${5 - stats.roomsJoined} more room${5 - stats.roomsJoined !== 1 ? 's' : ''} to reach Level 2`
            : `${stats.roomsJoined} rooms joined · keep going!`
          }
        </p>
        {stats.kasamaRating === null && (
          <p style={{ fontSize: 11, color: T.textMuted, margin: '4px 0 0', fontStyle: 'italic' }}>Ratings appear after others rate your hosting</p>
        )}
      </div>

      {/* ── Settings ── */}
      <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', marginBottom: 16 }}>

        {/* Dark mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background 150ms ease' }}
          onClick={onToggleDark}
          onMouseEnter={e => (e.currentTarget.style.background = T.surfaceAlt)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: dark ? '#2A405A' : T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: dark ? '#EEA64C' : T.primary }}>
            {dark ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }}>{dark ? 'Light Mode' : 'Dark Mode'}</p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: '1px 0 0' }}>{dark ? 'Switch to light theme' : 'Switch to dark theme'}</p>
          </div>
          {tog(dark, onToggleDark)}
        </div>

        {/* Online status toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background 150ms ease' }}
          onClick={handleToggleOnline}
          onMouseEnter={e => (e.currentTarget.style.background = T.surfaceAlt)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: isOnline ? '#DCFCE7' : T.surfaceAlt, border: `1.5px solid ${isOnline ? '#86EFAC' : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 250ms' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: isOnline ? '#15803D' : T.textMuted, display: 'inline-block', transition: 'background 250ms' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }}>
              {isOnline ? 'Active now' : 'Appear offline'}
              {savingOnline && <span style={{ fontSize: 12, color: T.textMuted, marginLeft: 6 }}>saving…</span>}
            </p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: '1px 0 0' }}>{isOnline ? 'Others can see you\'re online' : 'Toggle to show you\'re available'}</p>
          </div>
          {tog(isOnline, handleToggleOnline)}
        </div>

        {/* Notifications — disabled */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: `1px solid ${T.border}`, opacity: 0.45, cursor: 'not-allowed' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted }}>
            <Bell size={18} strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }}>Notifications</p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: '1px 0 0' }}>Manage alerts & reminders</p>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, background: T.surfaceAlt, border: `1px solid ${T.border}`, padding: '3px 8px', borderRadius: 10, letterSpacing: 0.5 }}>SOON</span>
        </div>

        {/* Privacy & Safety */}
        <div style={{ borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer', transition: 'background 150ms ease' }}
            onClick={() => setPrivacyOpen(o => !o)}
            onMouseEnter={e => (e.currentTarget.style.background = T.surfaceAlt)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary }}>
              <Lock size={18} strokeWidth={1.8} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }}>Privacy & Safety</p>
              <p style={{ fontSize: 12, color: T.textMuted, margin: '1px 0 0' }}>Control who sees your profile</p>
            </div>
            <ChevronDown size={16} style={{ color: T.textMuted, transition: 'transform 200ms ease', transform: privacyOpen ? 'rotate(180deg)' : 'none' }} />
          </div>

          {privacyOpen && (
            <div style={{ padding: '0 16px 16px', background: T.surfaceAlt, borderTop: `1px solid ${T.border}` }}>
              <div style={{ marginTop: 14, marginBottom: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, margin: '0 0 8px', letterSpacing: 0.5 }}>PROFILE VISIBILITY</p>
                {(['public', 'members'] as const).map(level => (
                  <div key={level} onClick={() => setPrivacyLevel(level)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: privacyLevel === level ? `${T.primary}12` : 'transparent', border: `1.5px solid ${privacyLevel === level ? T.primary : T.border}`, marginBottom: 6, transition: 'all 150ms ease' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${privacyLevel === level ? T.primary : T.border}`, background: privacyLevel === level ? T.primary : 'transparent', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>{level === 'public' ? 'Everyone' : 'Members only'}</p>
                      <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>{level === 'public' ? 'Anyone can see your profile' : 'Only verified members can see you'}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: T.surface, border: `1.5px solid ${T.border}`, marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>Show in Discover</p>
                  <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>Let others find you in room suggestions</p>
                </div>
                {tog(showInDiscover, () => setShowInDiscover(v => !v))}
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: `${T.accent}0D`, border: `1px solid ${T.accent}33`, marginBottom: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: T.accent, margin: '0 0 2px' }}>Safety reminder</p>
                <p style={{ fontSize: 12, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>Never share personal addresses or financial details inside rooms. Use the flag button to report suspicious behavior.</p>
              </div>
              <button onClick={handleSavePrivacy} disabled={savingPrivacy} style={{ width: '100%', height: 40, borderRadius: 20, border: 'none', background: savedPrivacy ? '#15803D' : T.primary, color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: savingPrivacy ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 250ms ease' }}>
                {savedPrivacy ? <><Check size={14} /> Saved!</> : savingPrivacy ? 'Saving…' : <><Save size={14} /> Save Privacy Settings</>}
              </button>
            </div>
          )}
        </div>

        {/* Help & Support — disabled */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', opacity: 0.45, cursor: 'not-allowed' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted }}>
            <HelpCircle size={18} strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }}>Help & Support</p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: '1px 0 0' }}>FAQs and contact support</p>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, background: T.surfaceAlt, border: `1px solid ${T.border}`, padding: '3px 8px', borderRadius: 10, letterSpacing: 0.5 }}>SOON</span>
        </div>
      </div>

      {/* ── Social links ── */}
      <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 18, padding: 16, marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: '0 0 4px' }}>Contact & Social Links</p>
        <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 14px', lineHeight: 1.5 }}>These auto-fill when you create a room.</p>

        {/* Default contact info from account */}
        <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 12, background: T.surfaceAlt, border: `1.5px solid ${T.border}` }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, margin: '0 0 8px', letterSpacing: 0.5 }}>DEFAULT CONTACT (from your account)</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${T.primary}18`, border: `1.5px solid ${T.primary}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AtSign size={14} color={T.primary} />
              </div>
              <div style={{ flex: 1, height: 36, padding: '0 10px', fontSize: 13, border: `1.5px solid ${T.border}`, borderRadius: 8, background: T.surface, color: T.text, display: 'flex', alignItems: 'center', opacity: 0.85 }}>
                {user.email || 'No email on account'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `#16A34A18`, border: `1.5px solid #16A34A44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Phone size={14} color="#16A34A" />
              </div>
              <div style={{ flex: 1, height: 36, padding: '0 10px', fontSize: 13, border: `1.5px solid ${T.border}`, borderRadius: 8, background: T.surface, color: currentPhone ? T.text : T.textMuted, display: 'flex', alignItems: 'center', opacity: 0.85 }}>
                {currentPhone || 'No phone — add one in Verification'}
              </div>
            </div>
          </div>
        </div>

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
              <input value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
                style={{ flex: 1, height: 40, padding: '0 12px', fontSize: 13, fontFamily: '"DM Sans",system-ui,sans-serif', border: `1.5px solid ${T.border}`, borderRadius: 10, background: T.bg, color: T.text, outline: 'none', boxSizing: 'border-box' as const }}
              />
            </div>
          ))}
        </div>
        <button onClick={handleSaveLinks} disabled={savingLinks} style={{ width: '100%', height: 42, borderRadius: 21, border: 'none', background: savedLinks ? '#15803D' : T.primary, color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: '"DM Sans",system-ui,sans-serif', cursor: savingLinks ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background 250ms ease' }}>
          {savedLinks ? <><Check size={15} /> Saved!</> : savingLinks ? 'Saving…' : <><Save size={15} /> Save Social Links</>}
        </button>
      </div>

      <button onClick={onLogout} style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1.5px solid #FCA5A5', background: '#FEF2F2', fontFamily: '"DM Sans",system-ui,sans-serif', fontSize: 14, fontWeight: 600, color: '#B91C1C', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 150ms ease' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#FEE2E2')}
        onMouseLeave={e => (e.currentTarget.style.background = '#FEF2F2')}
      >
        <LogOut size={17} /> Sign out
      </button>

      <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <PixelHeart color={T.accent} size={10} />
        <p className="font-pixel" style={{ fontSize: 11, color: T.textMuted, margin: 0, letterSpacing: 1 }}>SABAYPH v1.0 — MADE IN MINDANAO</p>
        <PixelHeart color={T.accent} size={10} />
      </div>

      {/* ── Location Dialog ── */}
      {locationDialogOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setLocationDialogOpen(false); }}
        >
          <div style={{ width: '100%', maxWidth: 480, background: T.surface, borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 14px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 2px' }}>
                  {locationPinned ? 'Update home location' : 'Pin home location'}
                </p>
                <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>Tap the map or search to set your area</p>
              </div>
              <button onClick={() => setLocationDialogOpen(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${T.border}`, background: T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.textMuted, flexShrink: 0 }}>
                <X size={16} />
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* GPS button */}
              <button type="button" onClick={useGPS} disabled={gpsLoading}
                style={{ width: '100%', height: 40, borderRadius: 20, border: `1.5px solid ${pendingLocation ? '#86EFAC' : T.border}`, background: pendingLocation ? '#DCFCE7' : T.surfaceAlt, color: pendingLocation ? '#15803D' : T.text, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: gpsLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                {gpsLoading ? 'Getting location…' : pendingLocation
                  ? <><Check size={13} /> GPS set — drag pin to adjust</>
                  : <><Navigation size={13} /> Use my current location (GPS)</>}
              </button>

              {/* Map */}
              <div style={{ borderRadius: 12, overflow: 'hidden', border: `1.5px solid ${T.border}` }}>
                <Suspense fallback={<div style={{ height: 260, background: T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: T.textMuted }}>Loading map…</div>}>
                  <MapPicker
                    value={pendingLocation}
                    onChange={loc => setPendingLocation({ lat: loc.lat, lng: loc.lng, name: loc.name })}
                    theme={{ primary: T.primary, bg: T.bg, surface: T.surface, surfaceAlt: T.surfaceAlt, text: T.text, textMuted: T.textMuted, border: T.border } as MapPickerTheme}
                  />
                </Suspense>
              </div>

              {/* Short area label — separate from geocoder result */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, margin: '0 0 6px', letterSpacing: 0.4 }}>AREA LABEL <span style={{ fontWeight: 400 }}>(optional)</span></p>
                <input
                  value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                  placeholder="e.g. Davao City, CDO, Cebu…"
                  style={{ ...inputSt, height: 42 }}
                />
                <p style={{ fontSize: 11, color: T.textMuted, margin: '4px 0 0' }}>A short name shown on your profile — not the full address.</p>
              </div>

              {locationError && (
                <p style={{ fontSize: 12, color: '#B91C1C', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '8px 12px', margin: 0 }}>{locationError}</p>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px 20px', borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
              <button onClick={handleSaveLocation} disabled={savingLocation || !pendingLocation}
                style={{ width: '100%', height: 46, borderRadius: 23, border: 'none', background: (!pendingLocation || savingLocation) ? T.border : T.primary, color: (!pendingLocation || savingLocation) ? T.textMuted : '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: (!pendingLocation || savingLocation) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background 200ms' }}>
                {savingLocation ? 'Saving…' : <><MapPin size={15} /> Save Location</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
