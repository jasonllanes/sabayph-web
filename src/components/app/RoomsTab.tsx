import { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Loader, Copy, Share2, Check, Lock, MapPin, ChevronDown, ChevronUp, UserCheck, UserX, Bell, ShoppingBasket, HeartHandshake, Eye, X, Star, ShieldCheck, Shield, ShieldAlert } from 'lucide-react';
import ShareRoomCard from '@/components/app/ShareRoomCard';
import { PixelHeart } from '@/components/common/PixelDecorations';
import { FacebookIcon, InstagramIcon, TwitterIcon } from '@/components/common/SocialIcons';
import { useRooms } from '@/hooks/useRooms';
import { useRoomJoinRequests } from '@/hooks/useJoinRequests';
import RoomWizard, { type WizardData } from '@/components/app/RoomWizard';
import PasaBuyWizard, { type PasaBuyWizardData } from '@/components/app/PasaBuyWizard';
import { SwipeToConfirm } from '@/components/app/BookingModals';
import { THEMES } from '@/data/themes';
import { supabase } from '@/lib/supabase';
import type { Theme, Room, DiscoverProfile } from '@/types';
import { getDefaultAvatar } from '@/components/app/tagConstants';

// ── Applicant profile mini-modal ─────────────────────────────────────────────

function verifyCount(p: DiscoverProfile) {
  return (p.profile_completed ? 1 : 0) + (p.contact_phone ? 1 : 0) + (p.home_lat != null ? 1 : 0) + (p.id_verified ? 1 : 0);
}

function verifyBadge(p: DiscoverProfile) {
  const n = verifyCount(p);
  if (n === 4) return { label: 'Fully verified',     color: '#15803D', bg: '#DCFCE7', border: '#86EFAC', Icon: ShieldCheck };
  if (n >= 2)  return { label: 'Partially verified', color: '#A16207', bg: '#FEF9C3', border: '#FDE047', Icon: Shield };
  if (n === 1) return { label: 'Getting started',    color: '#C2410C', bg: '#FFEDD5', border: '#FDBA74', Icon: ShieldAlert };
  return              { label: 'Not yet verified',   color: '#6B7280', bg: '#F3F4F6', border: '#D1D5DB', Icon: ShieldAlert };
}

function ApplicantProfileModal({ profile, theme: T, onClose, headerLabel = 'APPLICANT PROFILE' }: { profile: DiscoverProfile; theme: Theme; onClose: () => void; headerLabel?: string }) {
  const badge = verifyBadge(profile);
  const BadgeIcon = badge.Icon;
  const avatarSrc = profile.avatar_url || getDefaultAvatar(profile.gender, profile.profile_tags);
  const rating = profile.kasama_rating != null ? profile.kasama_rating.toFixed(1) : '—';

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}
      onMouseDown={e => { if (e.target === e.currentTarget) (e.currentTarget as HTMLDivElement).dataset.dismissing = '1'; }}
      onMouseUp={e => { if (e.target === e.currentTarget && (e.currentTarget as HTMLDivElement).dataset.dismissing === '1') onClose(); (e.currentTarget as HTMLDivElement).dataset.dismissing = ''; }}
    >
      <div style={{ width: '100%', maxWidth: 380, background: T.surface, borderRadius: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
        {/* Banner */}
        <div style={{ height: 80, background: T.primary, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.12, backgroundImage: `linear-gradient(${T.bg} 1px,transparent 1px),linear-gradient(90deg,${T.bg} 1px,transparent 1px)`, backgroundSize: '18px 18px' }} />
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} />
          </button>
          <div style={{ position: 'absolute', top: 12, left: 14, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily: '"DM Sans",system-ui,sans-serif' }}>
            {headerLabel}
          </div>
        </div>

        {/* Avatar + badge row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 20px', marginTop: -36 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: T.primary, border: `4px solid ${T.surface}`, boxShadow: '0 4px 16px rgba(0,0,0,0.25)', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: T.bg, position: 'absolute', fontFamily: '"Bricolage Grotesque",serif' }}>
              {(profile.display_name ?? '?').charAt(0).toUpperCase()}
            </span>
            <img src={avatarSrc} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.currentTarget as HTMLImageElement).src = getDefaultAvatar(profile.gender, profile.profile_tags); }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 20, background: badge.bg, border: `1.5px solid ${badge.border}`, marginBottom: 4 }}>
            <BadgeIcon size={13} style={{ color: badge.color }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: badge.color }}>{badge.label}</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '12px 20px 20px' }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: '0 0 2px', fontFamily: '"Bricolage Grotesque",serif' }}>{profile.display_name ?? 'Kasama'}</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
            {profile.location && <span style={{ fontSize: 12, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={12} />{profile.location}</span>}
            {profile.age_range && <span style={{ fontSize: 12, color: T.textMuted, background: T.surfaceAlt, padding: '2px 8px', borderRadius: 10 }}>{profile.age_range}</span>}
            {profile.gender && <span style={{ fontSize: 12, color: T.textMuted, background: T.surfaceAlt, padding: '2px 8px', borderRadius: 10 }}>{profile.gender}</span>}
          </div>

          {profile.bio && (
            <p style={{ fontSize: 13, color: T.text, margin: '0 0 14px', lineHeight: 1.6, padding: '10px 12px', background: T.surfaceAlt, borderRadius: 12 }}>{profile.bio}</p>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div style={{ padding: '12px', background: T.surfaceAlt, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
                <Star size={13} style={{ color: '#D97706', fill: '#D97706' }} />
                <span style={{ fontSize: 20, fontWeight: 800, color: T.primary, fontFamily: '"Bricolage Grotesque",serif' }}>{rating}</span>
              </div>
              <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>
                Kasama rating{profile.rating_count > 0 ? ` · ${profile.rating_count}` : ''}
              </p>
            </div>
            <div style={{ padding: '12px', background: badge.bg, border: `1.5px solid ${badge.border}`, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { label: 'Profile', done: profile.profile_completed },
                { label: 'Phone', done: !!profile.contact_phone },
                { label: 'Location', done: profile.home_lat != null },
                { label: 'ID verified', done: profile.id_verified },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: s.done ? badge.color : '#9CA3AF' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0, background: s.done ? badge.color : 'transparent', border: `1.5px solid ${s.done ? badge.color : '#D1D5DB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {s.done && <Check size={8} color="#fff" strokeWidth={3} />}
                  </div>
                  {s.label}
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {(profile.profile_tags ?? []).length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(profile.profile_tags ?? []).slice(0, 8).map(tag => (
                <span key={tag} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type RoomCategory = 'rotary' | 'pasabuy' | 'gaming' | 'cafe' | 'sports';

function RoomsSkeletonList({ theme: T }: { theme: Theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}} .sk-rm{border-radius:8px;background:linear-gradient(90deg,${T.surfaceAlt} 25%,${T.border} 50%,${T.surfaceAlt} 75%);background-size:800px 100%;animation:shimmer 1.4s infinite linear}`}</style>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ background: T.surface, border: `2px solid ${T.border}`, borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="sk-rm" style={{ width: 70, height: 22, borderRadius: 20 }} />
              <div className="sk-rm" style={{ width: 50, height: 22, borderRadius: 20 }} />
            </div>
            <div className="sk-rm" style={{ width: '70%', height: 20 }} />
            <div className="sk-rm" style={{ width: '45%', height: 14, borderRadius: 6 }} />
            <div style={{ marginTop: 4 }}>
              <div className="sk-rm" style={{ width: 100, height: 12, marginBottom: 6, borderRadius: 6 }} />
              <div className="sk-rm" style={{ height: 5, borderRadius: 3 }} />
            </div>
            <div className="sk-rm" style={{ height: 36, borderRadius: 10 }} />
          </div>
          <div style={{ borderTop: `1px solid ${T.border}`, padding: '10px 16px', background: T.surfaceAlt, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div className="sk-rm" style={{ width: 60, height: 9, borderRadius: 4 }} />
              <div className="sk-rm" style={{ width: 80, height: 18, borderRadius: 6 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="sk-rm" style={{ width: 80, height: 32, borderRadius: 20 }} />
              <div className="sk-rm" style={{ width: 100, height: 32, borderRadius: 20 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface RoomsTabProps { theme: Theme; userId?: string; userAvatarUrl?: string; }

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

type RoomViewState = 'active' | 'queuing' | 'finished' | 'archived';

function getRoomViewState(r: Room, now: Date): RoomViewState {
  if (r.status === 'completed') return 'finished';
  if (r.status === 'cancelled' || r.status === 'archived') return 'archived';
  if (r.event_date && new Date(r.event_date) < now && r.status !== 'confirmed') return 'archived';
  const isFull = r.member_count >= r.max_members;
  if (r.status === 'confirmed') return 'active';
  if ((r.category === 'gaming' || r.category === 'cafe') && isFull) return 'active';
  return 'queuing';
}

const ROOM_STATE_META: Record<RoomViewState, { label: string }> = {
  active:   { label: 'Active' },
  queuing:  { label: 'Queuing' },
  finished: { label: 'Finished' },
  archived: { label: 'Archived' },
};

export default function RoomsTab({ theme: T, userId, userAvatarUrl }: RoomsTabProps) {
  const [categoryTab, setCategoryTab] = useState<RoomCategory>('rotary');
  const { rooms, loading, error, createRoom, updateRoom, deleteRoom } = useRooms(categoryTab, userId);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [roomsView, setRoomsView] = useState<RoomViewState>('active');
  const [requestsExpandedId, setRequestsExpandedId] = useState<string | null>(null);
  const [pasabuyDetailId, setPasabuyDetailId] = useState<string | null>(null);
  const [togglingAutoMatch, setTogglingAutoMatch] = useState(false);
  const [roomDetailId, setRoomDetailId] = useState<string | null>(null);
  const [shareRoomId, setShareRoomId] = useState<string | null>(null);
  const [membersExpandedId, setMembersExpandedId] = useState<string | null>(null);
  const [membersData, setMembersData] = useState<Record<string, { user_id: string; display_name: string }[]>>({});
  const [membersLoadingId, setMembersLoadingId] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const pasabuyTheme = { ...T, primary: THEMES.pasabuy.primary, accent: THEMES.pasabuy.accent, highlight: THEMES.pasabuy.highlight, border: THEMES.pasabuy.border };
  const gamingTheme  = { ...T, primary: '#7C3AED', accent: '#A855F7', bg: T.bg };
  const cafeTheme    = { ...T, primary: '#92400E', accent: '#D97706', bg: T.bg };
  const sportsTheme  = { ...T, primary: '#bee800', accent: '#7A9E00', border: '#CBDE00' };
  const activeTheme  = categoryTab === 'pasabuy' ? pasabuyTheme : categoryTab === 'gaming' ? gamingTheme : categoryTab === 'cafe' ? cafeTheme : categoryTab === 'sports' ? sportsTheme : T;

  const ownedRoomIds = rooms.filter(r => r.user_id === userId).map(r => r.id);
  const { requests, approveRequest, rejectRequest } = useRoomJoinRequests(ownedRoomIds);

  const [viewingApplicant, setViewingApplicant] = useState<DiscoverProfile | null>(null);
  const [profileModalLabel, setProfileModalLabel] = useState('APPLICANT PROFILE');

  const handleViewApplicantProfile = async (applicantUserId: string) => {
    setProfileModalLabel('APPLICANT PROFILE');
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, age_range, location, bio, gender, profile_tags, kasama_rating, rating_count, is_online, profile_completed, contact_phone, home_lat, rooms_joined, avatar_url, id_verified')
      .eq('id', applicantUserId)
      .maybeSingle();
    if (data) setViewingApplicant(data as DiscoverProfile);
  };

  const fetchRoomMembers = async (roomId: string) => {
    if (membersData[roomId] !== undefined) return;
    setMembersLoadingId(roomId);
    const { data } = await supabase
      .from('join_requests')
      .select('user_id, display_name')
      .eq('room_id', roomId)
      .eq('status', 'approved');
    setMembersData(prev => ({ ...prev, [roomId]: (data as { user_id: string; display_name: string }[]) ?? [] }));
    setMembersLoadingId(null);
  };

  const handleViewHostProfile = async (hostUserId: string) => {
    setProfileModalLabel('HOST PROFILE');
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, age_range, location, bio, gender, profile_tags, kasama_rating, rating_count, is_online, profile_completed, contact_phone, home_lat, rooms_joined, avatar_url, id_verified')
      .eq('id', hostUserId)
      .maybeSingle();
    if (data) setViewingApplicant(data as DiscoverProfile);
  };

  const now = new Date();
  const stateMap = rooms.reduce<Record<RoomViewState, Room[]>>(
    (acc, r) => { acc[getRoomViewState(r, now)].push(r); return acc; },
    { active: [], queuing: [], finished: [], archived: [] }
  );
  const activeRooms  = stateMap.active; // kept for banner / new-room gate
  const displayRooms = stateMap[roomsView];

  const openCreate = () => { setEditing(null); setWizardOpen(true); };
  const openEdit   = (room: Room) => { setEditing(room); setWizardOpen(true); };

  // ── Rotary handlers ──────────────────────────────────────────────────────────

  const handleRotaryCreate = async (data: WizardData) => {
    const { location, game_name, game_id, ...rest } = data;
    return createRoom({
      ...rest,
      event_date:    rest.event_date    || null,
      next_event:    rest.next_event    || null,
      password:      rest.password      || null,
      description:   rest.description   || null,
      location_lat:  location?.lat       ?? null,
      location_lng:  location?.lng       ?? null,
      location_name: location?.name      || null,
      facebook_url:  rest.facebook_url  || null,
      instagram_url: rest.instagram_url || null,
      twitter_url:   rest.twitter_url   || null,
      game_name:     null,
      game_id:       null,
    } as Parameters<typeof createRoom>[0]);
  };

  const handleRotaryUpdate = async (id: string, data: Partial<WizardData>) => {
    const { location, game_name, game_id, ...rest } = data;
    return updateRoom(id, {
      ...rest,
      event_date:    rest.event_date    || null,
      next_event:    rest.next_event    || null,
      password:      rest.password      || null,
      description:   rest.description   || null,
      location_lat:  location?.lat       ?? null,
      location_lng:  location?.lng       ?? null,
      location_name: location?.name      || null,
      facebook_url:  rest.facebook_url  || null,
      instagram_url: rest.instagram_url || null,
      twitter_url:   rest.twitter_url   || null,
      game_name:     null,
      game_id:       null,
    });
  };

  // ── Gaming handlers ──────────────────────────────────────────────────────────

  const handleGamingCreate = async (data: WizardData) => {
    const { location, game_name, game_id, ...rest } = data;
    return createRoom({
      ...rest,
      category:      'gaming',
      event_date:    rest.event_date    || null,
      next_event:    rest.next_event    || null,
      password:      rest.password      || null,
      description:   rest.description   || null,
      location_lat:  null,
      location_lng:  null,
      location_name: null,
      facebook_url:  rest.facebook_url  || null,
      instagram_url: rest.instagram_url || null,
      twitter_url:   rest.twitter_url   || null,
      game_name:     game_name          || null,
      game_id:       game_id            || null,
    } as Parameters<typeof createRoom>[0]);
  };

  const handleGamingUpdate = async (id: string, data: Partial<WizardData>) => {
    const { location, game_name, game_id, ...rest } = data;
    return updateRoom(id, {
      ...rest,
      event_date:    rest.event_date    || null,
      next_event:    rest.next_event    || null,
      password:      rest.password      || null,
      description:   rest.description   || null,
      location_lat:  null,
      location_lng:  null,
      location_name: null,
      facebook_url:  rest.facebook_url  || null,
      instagram_url: rest.instagram_url || null,
      twitter_url:   rest.twitter_url   || null,
      game_name:     game_name          || null,
      game_id:       game_id            || null,
    });
  };

  // ── Cafe handlers ────────────────────────────────────────────────────────────

  const handleCafeCreate = async (data: WizardData) => {
    const { location, game_name, game_id, ...rest } = data;
    return createRoom({
      ...rest,
      category:      'cafe',
      event_date:    rest.event_date    || null,
      next_event:    rest.next_event    || null,
      password:      rest.password      || null,
      description:   rest.description   || null,
      location_lat:  location?.lat       ?? null,
      location_lng:  location?.lng       ?? null,
      location_name: location?.name      || null,
      facebook_url:  rest.facebook_url  || null,
      instagram_url: rest.instagram_url || null,
      twitter_url:   rest.twitter_url   || null,
      game_name:     null,
      game_id:       null,
    } as Parameters<typeof createRoom>[0]);
  };

  const handleCafeUpdate = async (id: string, data: Partial<WizardData>) => {
    const { location, game_name, game_id, ...rest } = data;
    return updateRoom(id, {
      ...rest,
      event_date:    rest.event_date    || null,
      next_event:    rest.next_event    || null,
      password:      rest.password      || null,
      description:   rest.description   || null,
      location_lat:  location?.lat       ?? null,
      location_lng:  location?.lng       ?? null,
      location_name: location?.name      || null,
      facebook_url:  rest.facebook_url  || null,
      instagram_url: rest.instagram_url || null,
      twitter_url:   rest.twitter_url   || null,
      game_name:     null,
      game_id:       null,
    });
  };

  // ── Sports handlers ──────────────────────────────────────────────────────────

  const handleSportsCreate = async (data: WizardData) => {
    const { location, game_name, game_id, ...rest } = data;
    return createRoom({
      ...rest,
      category:      'sports',
      event_date:    rest.event_date    || null,
      next_event:    rest.next_event    || null,
      password:      rest.password      || null,
      description:   rest.description   || null,
      location_lat:  location?.lat       ?? null,
      location_lng:  location?.lng       ?? null,
      location_name: location?.name      || null,
      facebook_url:  rest.facebook_url  || null,
      instagram_url: rest.instagram_url || null,
      twitter_url:   rest.twitter_url   || null,
      game_name:     game_name          || null,
      game_id:       null,
    } as Parameters<typeof createRoom>[0]);
  };

  const handleSportsUpdate = async (id: string, data: Partial<WizardData>) => {
    const { location, game_name, game_id, ...rest } = data;
    return updateRoom(id, {
      ...rest,
      event_date:    rest.event_date    || null,
      next_event:    rest.next_event    || null,
      password:      rest.password      || null,
      description:   rest.description   || null,
      location_lat:  location?.lat       ?? null,
      location_lng:  location?.lng       ?? null,
      location_name: location?.name      || null,
      facebook_url:  rest.facebook_url  || null,
      instagram_url: rest.instagram_url || null,
      twitter_url:   rest.twitter_url   || null,
      game_name:     game_name          || null,
      game_id:       null,
    });
  };

  // ── PasaBuy handlers ─────────────────────────────────────────────────────────

  // PasaBuyWizard builds an explicit DB payload before calling onCreate/onUpdate,
  // so these handlers just pass it straight through — no re-mapping needed.
  const handlePasaBuyCreate = async (data: PasaBuyWizardData) => {
    return createRoom(data as unknown as Parameters<typeof createRoom>[0]);
  };

  const handlePasaBuyUpdate = async (id: string, data: Partial<PasaBuyWizardData>) => {
    return updateRoom(id, data as any);
  };

  const handleDelete = async (room: Room) => {
    if (!confirm(`Delete "${room.name}"? This cannot be undone.`)) return;
    setDeletingId(room.id);
    await deleteRoom(room.id);
    setDeletingId(null);
  };

  const copyCode = (room: Room) => {
    navigator.clipboard.writeText(room.join_code);
    setCopiedId(room.id + '-code');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const TT = activeTheme;

  return (
    <div style={{ padding: '20px 16px 32px', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=VT323&display=swap'); .font-display{font-family:'Bricolage Grotesque',serif;letter-spacing:-0.02em;} .font-pixel{font-family:'VT323',monospace;}`}</style>

      {/* Category switcher */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 20, padding: '4px', background: T.surfaceAlt, borderRadius: 20, border: `1.5px solid ${T.border}`, overflowX: 'auto' }}>
        {([
          { id: 'rotary'  as const, label: 'Rotary',  accent: T.primary,              activeColor: '#fff',     icon: <HeartHandshake size={14} /> },
          { id: 'pasabuy' as const, label: 'PasaBuy', accent: THEMES.pasabuy.primary, activeColor: '#fff',     icon: <ShoppingBasket size={14} /> },
          { id: 'gaming'  as const, label: 'Gaming',  accent: '#7C3AED',              activeColor: '#fff',     icon: <span style={{ fontSize: 14 }}>🎮</span> },
          { id: 'cafe'    as const, label: 'Cafe',    accent: '#92400E',              activeColor: '#fff',     icon: <span style={{ fontSize: 14 }}>☕</span> },
          { id: 'sports'  as const, label: 'Sports',  accent: '#bee800',              activeColor: '#1A2800',  icon: <span style={{ fontSize: 14 }}>⚽</span> },
        ]).map(({ id, label, accent, activeColor, icon }) => {
          const active = categoryTab === id;
          return (
            <button
              key={id}
              onClick={() => { setCategoryTab(id); setRoomsView('active'); setWizardOpen(false); setEditing(null); }}
              style={{ flex: 1, minWidth: 64, height: 40, borderRadius: 16, border: 'none', background: active ? accent : 'transparent', color: active ? activeColor : T.textMuted, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 200ms ease', whiteSpace: 'nowrap' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', opacity: active ? 1 : 0.6 }}>{icon}</span>
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <p className="font-pixel" style={{ fontSize: 13, color: TT.accent, margin: '0 0 3px', letterSpacing: 1 }}>
            {categoryTab === 'pasabuy' ? 'PASABUY REQUESTS' : categoryTab === 'gaming' ? 'GAMING ROOMS' : categoryTab === 'cafe' ? 'CAFE ROOMS' : categoryTab === 'sports' ? 'SPORTS ROOMS' : 'ROTARY ROOMS'}
          </p>
          <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: TT.text, margin: 0 }}>
            {categoryTab === 'pasabuy' ? 'Your buy requests.' : categoryTab === 'gaming' ? 'Your game lobbies.' : categoryTab === 'cafe' ? 'Your cafe hangouts.' : categoryTab === 'sports' ? 'Your sports rooms.' : 'Your sabay spaces.'}
          </h2>
        </div>
        <button
          onClick={!loading && activeRooms.length === 0 ? openCreate : undefined}
          disabled={!loading && activeRooms.length > 0}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 40, borderRadius: 20, border: 'none', background: (!loading && activeRooms.length > 0) ? TT.border : TT.primary, color: (!loading && activeRooms.length > 0) ? TT.textMuted : TT.bg, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: (!loading && activeRooms.length > 0) ? 'not-allowed' : 'pointer', opacity: (!loading && activeRooms.length > 0) ? 0.6 : 1, transition: 'all 200ms' }}
        >
          <Plus size={16} /> {categoryTab === 'pasabuy' ? 'New Request' : categoryTab === 'gaming' ? 'New Lobby' : categoryTab === 'cafe' ? 'New Hangout' : categoryTab === 'sports' ? 'New Sports Room' : 'New Room'}
        </button>
      </div>

      {/* Active-room gate banner */}
      {!loading && activeRooms.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: '#FEF3E2', borderRadius: 12, border: '1px solid #F9C07E', marginBottom: 16 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
            You already have an active {categoryTab === 'pasabuy' ? 'PasaBuy request' : categoryTab === 'gaming' ? 'gaming lobby' : categoryTab === 'cafe' ? 'cafe hangout' : categoryTab === 'sports' ? 'sports room' : 'room'}. Complete, confirm, or delete it before creating a new one.
          </p>
        </div>
      )}

      {/* Active / Queuing / Finished / Archived tabs */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7, marginBottom: 20 }}>
          {(['active', 'queuing', 'finished', 'archived'] as RoomViewState[]).map(tab => {
            const m = ROOM_STATE_META[tab];
            const sel = roomsView === tab;
            const count = stateMap[tab].length;
            return (
              <button key={tab} onClick={() => setRoomsView(tab)}
                style={{ height: 44, borderRadius: 14, border: `2px solid ${sel ? TT.primary : TT.border}`, background: sel ? TT.primary : TT.surface, color: sel ? TT.bg : TT.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, transition: 'all 200ms ease', padding: '0 4px' }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.2, lineHeight: 1 }}>{m.label}</span>
                <span style={{ fontSize: 10, minWidth: 18, textAlign: 'center', padding: '0 5px', borderRadius: 10, background: sel ? 'rgba(255,255,255,0.22)' : TT.surfaceAlt, color: sel ? TT.bg : TT.textMuted, fontWeight: 700, lineHeight: '16px' }}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {error && <div style={{ padding: '10px 14px', background: '#FEE2E2', borderRadius: 10, border: '1px solid #FCA5A5', marginBottom: 16 }}><p style={{ fontSize: 13, color: '#B91C1C', margin: 0 }}>Failed to load: {error}</p></div>}

      {loading && <RoomsSkeletonList theme={TT} />}

      {!loading && displayRooms.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          {displayRooms.map(room => {
            const isOwner = room.user_id === userId;
            const isArchived = room.status === 'completed' || room.status === 'cancelled' || room.status === 'archived' || (!!room.event_date && new Date(room.event_date) < now && room.status !== 'confirmed');
            const fill = Math.min((room.member_count / room.max_members) * 100, 100);
            const eventDisplay = room.event_date ? formatEventDate(room.event_date) : room.next_event;
            const isPasaBuy = categoryTab === 'pasabuy';
            const isGaming  = categoryTab === 'gaming';
            const isCafe    = categoryTab === 'cafe';
            const isSports  = categoryTab === 'sports';

            return (
              <div key={room.id}
                style={{ background: isArchived ? TT.surfaceAlt : TT.surface, border: `2px solid ${TT.border}`, borderRadius: 18, overflow: 'hidden', opacity: deletingId === room.id ? 0.5 : isArchived ? 0.85 : 1, transition: 'box-shadow 150ms' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 4px 16px ${TT.text}18`)}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                {/* Host row */}
                <div
                  onClick={() => handleViewHostProfile(room.user_id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: `1px solid ${TT.border}`, cursor: 'pointer', background: 'transparent', transition: 'background 120ms' }}
                  onMouseEnter={e => (e.currentTarget.style.background = TT.surfaceAlt)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: TT.primary, border: `1.5px solid ${TT.border}`, overflow: 'hidden', position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: TT.bg, position: 'absolute', fontFamily: '"Bricolage Grotesque",serif', zIndex: 0 }}>
                      {(room.host_name || '?').charAt(0).toUpperCase()}
                    </span>
                    {isOwner && userAvatarUrl && (
                      <img src={userAvatarUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: TT.textMuted, fontWeight: 500 }}>
                    {isOwner ? 'You' : room.host_name}
                  </span>
                  <span style={{ fontSize: 10, color: TT.textMuted, opacity: 0.5 }}>·</span>
                  <span style={{ fontSize: 11, color: TT.primary, fontWeight: 600 }}>Host</span>
                  <span style={{ fontSize: 10, color: TT.primary, marginLeft: 'auto', fontWeight: 600, opacity: 0.75 }}>View profile →</span>
                </div>

                {isPasaBuy ? (
                  /* Compact PasaBuy card — tap to open detail sheet */
                  <div
                    onClick={() => setPasabuyDetailId(room.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setPasabuyDetailId(room.id); }}
                    style={{ padding: '14px 16px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, background: '#FEF3E2', color: '#D97706', padding: '3px 10px', borderRadius: 20, border: '1px solid #F9C07E' }}><ShoppingBasket size={11} /> PasaBuy</span>
                      {isArchived && <span style={{ fontSize: 10, fontWeight: 700, background: TT.border, color: TT.textMuted, padding: '2px 8px', borderRadius: 8 }}>📦 ARCHIVED</span>}
                      {room.status === 'confirmed' && <span style={{ fontSize: 10, fontWeight: 700, background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: 8, border: '1px solid #86EFAC' }}>✅ CONFIRMED</span>}
                      {(() => { const cnt = requests.filter(r => r.room_id === room.id).length; return cnt > 0 && room.status !== 'confirmed' ? <span style={{ fontSize: 10, fontWeight: 700, background: TT.accent, color: '#fff', padding: '2px 8px', borderRadius: 8 }}>🔔 {cnt} applicant{cnt !== 1 ? 's' : ''}</span> : null; })()}
                      {room.is_private && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, background: TT.surfaceAlt, color: TT.textMuted, padding: '2px 8px', borderRadius: 8, border: `1px solid ${TT.border}` }}><Lock size={9} /> PRIVATE</span>}
                      {isOwner && <span style={{ fontSize: 10, fontWeight: 700, background: TT.primary, color: TT.bg, padding: '2px 8px', borderRadius: 8, marginLeft: 'auto' }}>YOUR REQUEST</span>}
                    </div>
                    <h3 className="font-display" style={{ fontSize: 16, fontWeight: 800, color: TT.text, margin: '0 0 8px' }}>{room.name}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {room.location_name && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: TT.textMuted, background: TT.surfaceAlt, padding: '3px 9px', borderRadius: 12, border: `1px solid ${TT.border}` }}>🏪 {room.location_name}</span>}
                      {(room.items ?? []).length > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: TT.textMuted, background: TT.surfaceAlt, padding: '3px 9px', borderRadius: 12, border: `1px solid ${TT.border}` }}>🛒 {room.items.length} item{room.items.length !== 1 ? 's' : ''}</span>}
                      {eventDisplay && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: TT.textMuted, background: TT.surfaceAlt, padding: '3px 9px', borderRadius: 12, border: `1px solid ${TT.border}` }}>🤝 {eventDisplay}</span>}
                    </div>
                    {room.status !== 'confirmed' && (
                      <div style={{ marginBottom: 10 }}>
                        <span style={{ fontSize: 11, color: TT.textMuted }}><Users size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />{room.member_count} / {room.max_members} applicants in queue</span>
                        <div style={{ height: 4, background: TT.surfaceAlt, borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
                          <div style={{ height: '100%', borderRadius: 3, width: `${fill}%`, background: TT.primary }} />
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: TT.primary, fontWeight: 600, marginTop: 2 }}>
                      <Eye size={12} /> View details <ChevronDown size={12} />
                    </div>
                  </div>
                ) : (
                  /* Compact non-PasaBuy card — tap to open detail dialog */
                  <div
                    onClick={() => setRoomDetailId(room.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setRoomDetailId(room.id); }}
                    style={{ padding: '14px 16px', cursor: 'pointer' }}
                  >
                    {/* Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                      {isGaming
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, background: '#EDE9FE', color: '#7C3AED', padding: '3px 10px', borderRadius: 20, border: '1px solid #C4B5FD' }}><img src="https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/gaming.png" alt="" style={{ width: 13, height: 13, objectFit: 'contain' }} /> Gaming</span>
                        : isCafe
                          ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, background: '#FEF3C7', color: '#92400E', padding: '3px 10px', borderRadius: 20, border: '1px solid #D97706AA' }}><img src="https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/coffee.png" alt="" style={{ width: 13, height: 13, objectFit: 'contain' }} /> Cafe</span>
                          : isSports
                            ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, background: '#F0FD80', color: '#4A6200', padding: '3px 10px', borderRadius: 20, border: '1px solid #bee800' }}><img src="https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/sports.png" alt="" style={{ width: 13, height: 13, objectFit: 'contain' }} /> Sports</span>
                            : <span style={{ fontSize: 11, fontWeight: 700, background: '#F4ECDF', color: '#9F5E0F', padding: '3px 10px', borderRadius: 20, border: '1px solid #9F5E0F44' }}>Rotary</span>
                      }
                      {isArchived && <span style={{ fontSize: 10, fontWeight: 700, background: TT.border, color: TT.textMuted, padding: '2px 8px', borderRadius: 8 }}>📦 ARCHIVED</span>}
                      {room.status === 'confirmed' && <span style={{ fontSize: 10, fontWeight: 700, background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: 8, border: '1px solid #86EFAC' }}>✅ CONFIRMED</span>}
                      {!isArchived && room.status === 'live' && <span style={{ fontSize: 10, fontWeight: 700, background: '#C82718', color: '#F1EDE1', padding: '2px 8px', borderRadius: 8 }}>LIVE</span>}
                      {room.is_private && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, background: TT.surfaceAlt, color: TT.textMuted, padding: '2px 8px', borderRadius: 8, border: `1px solid ${TT.border}` }}><Lock size={9} /> PRIVATE</span>}
                      {isOwner && (() => { const cnt = requests.filter(r => r.room_id === room.id).length; return cnt > 0 && room.status !== 'confirmed' ? <span style={{ fontSize: 10, fontWeight: 700, background: TT.accent, color: '#fff', padding: '2px 8px', borderRadius: 8 }}>🔔 {cnt} request{cnt !== 1 ? 's' : ''}</span> : null; })()}
                      {isOwner && <span style={{ fontSize: 10, fontWeight: 700, background: TT.primary, color: isSports ? '#1A2800' : TT.bg, padding: '2px 8px', borderRadius: 8, marginLeft: 'auto' }}>YOUR {isGaming ? 'LOBBY' : isCafe ? 'HANGOUT' : isSports ? 'SPORTS ROOM' : 'ROOM'}</span>}
                    </div>

                    <h3 className="font-display" style={{ fontSize: 16, fontWeight: 800, color: TT.text, margin: '0 0 8px' }}>{room.name}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {isGaming && room.game_name && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: TT.textMuted, background: TT.surfaceAlt, padding: '3px 9px', borderRadius: 12, border: `1px solid ${TT.border}` }}>🎮 {room.game_name}</span>}
                      {isSports && room.game_name && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: TT.textMuted, background: TT.surfaceAlt, padding: '3px 9px', borderRadius: 12, border: `1px solid ${TT.border}` }}>⚽ {room.game_name}</span>}
                      {room.location_name && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: TT.textMuted, background: TT.surfaceAlt, padding: '3px 9px', borderRadius: 12, border: `1px solid ${TT.border}` }}>📍 {room.location_name}</span>}
                      {eventDisplay && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: TT.textMuted, background: TT.surfaceAlt, padding: '3px 9px', borderRadius: 12, border: `1px solid ${TT.border}` }}>📅 {eventDisplay}</span>}
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ fontSize: 11, color: TT.textMuted }}><Users size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />{room.member_count} / {room.max_members} {isGaming ? 'players' : isCafe ? 'guests' : isSports ? 'players' : 'members'}</span>
                      <div style={{ height: 4, background: TT.surfaceAlt, borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
                        <div style={{ height: '100%', borderRadius: 3, width: `${fill}%`, background: TT.primary }} />
                      </div>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: TT.primary, fontWeight: 600, marginTop: 2 }}>
                      <Eye size={12} /> View details <ChevronDown size={12} />
                    </div>
                  </div>
                )}

                {/* Join code strip */}
                <div style={{ borderTop: `1px solid ${TT.border}`, padding: '10px 16px', background: TT.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <p className="font-pixel" style={{ fontSize: 9, color: TT.textMuted, margin: '0 0 1px', letterSpacing: 1 }}>JOIN CODE</p>
                    <p className="font-display" style={{ fontSize: 15, fontWeight: 800, color: TT.primary, margin: 0, letterSpacing: 1.5 }}>{room.join_code}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => copyCode(room)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${TT.border}`, background: TT.surface, color: TT.text, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                      {copiedId === room.id + '-code' ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Code</>}
                    </button>
                    <button onClick={() => setShareRoomId(room.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${TT.primary}44`, background: `${TT.primary}12`, color: TT.primary, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                      <Share2 size={12} /> Share Card
                    </button>
                  </div>
                </div>

                {/* Join Requests panel — owners only; PasaBuy agents are managed in the detail dialog */}
                {isOwner && (() => {
                  if (isPasaBuy) {
                    return room.status === 'confirmed' ? (
                      <div style={{ borderTop: `1px solid ${TT.border}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: '#15803D', fontWeight: 600 }}>✅ Booking confirmed — group chat created in Messages.</span>
                      </div>
                    ) : null;
                  }
                  const roomRequests = requests.filter(r => r.room_id === room.id);
                  const isReqExpanded = requestsExpandedId === room.id;
                  const isConfirmed = room.status === 'confirmed';
                  return (
                    <div style={{ borderTop: `1px solid ${TT.border}` }}>
                      {isConfirmed ? (
                        <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, color: '#15803D', fontWeight: 600 }}>✅ Booking confirmed — group chat created in Messages.</span>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setRequestsExpandedId(isReqExpanded ? null : room.id)}
                            style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Bell size={14} style={{ color: roomRequests.length > 0 ? TT.accent : TT.textMuted }} />
                              <span style={{ fontSize: 13, fontWeight: 600, color: roomRequests.length > 0 ? TT.text : TT.textMuted }}>
                                {isGaming ? 'Player Requests' : isCafe ? 'Guest Requests' : 'Join Requests'}
                              </span>
                              {roomRequests.length > 0 && (
                                <span style={{ fontSize: 11, fontWeight: 700, background: TT.accent, color: '#fff', padding: '1px 7px', borderRadius: 10 }}>{roomRequests.length}</span>
                              )}
                            </div>
                            {isReqExpanded ? <ChevronUp size={14} style={{ color: TT.textMuted }} /> : <ChevronDown size={14} style={{ color: TT.textMuted }} />}
                          </button>

                          {isReqExpanded && (
                            <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {roomRequests.length === 0 ? (
                                <p style={{ fontSize: 13, color: TT.textMuted, margin: 0, textAlign: 'center', padding: '12px 0' }}>No pending {isGaming ? 'player requests' : isCafe ? 'guest requests' : 'requests'}.</p>
                              ) : (
                                roomRequests.map(req => (
                                  <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: TT.surfaceAlt, borderRadius: 12, border: `1.5px solid ${TT.border}` }}>
                                    <button
                                      onClick={() => handleViewApplicantProfile(req.user_id)}
                                      title="View applicant profile"
                                      style={{ width: 36, height: 36, borderRadius: '50%', background: TT.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: 'none', cursor: 'pointer', position: 'relative' }}
                                    >
                                      <span style={{ fontSize: 14, fontWeight: 800, color: TT.bg, fontFamily: '"Bricolage Grotesque",serif' }}>
                                        {(req.display_name ?? '?').charAt(0).toUpperCase()}
                                      </span>
                                    </button>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: TT.text, margin: 0 }}>{req.display_name ?? 'Anonymous'}</p>
                                        <button
                                          onClick={() => handleViewApplicantProfile(req.user_id)}
                                          title="View profile"
                                          style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '1px 7px', borderRadius: 10, border: `1px solid ${TT.border}`, background: TT.surface, color: TT.textMuted, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                                        >
                                          <Eye size={11} /> Profile
                                        </button>
                                      </div>
                                      {req.message && <p style={{ fontSize: 12, color: TT.textMuted, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.message}</p>}
                                      <p style={{ fontSize: 11, color: TT.textMuted, margin: '2px 0 0' }}>{new Date(req.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                      <button onClick={() => approveRequest(req)}
                                        style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #86EFAC', background: '#DCFCE7', color: '#15803D', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Accept applicant">
                                        <UserCheck size={15} />
                                      </button>
                                      <button onClick={() => rejectRequest(req.id)}
                                        style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#B91C1C', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Reject applicant">
                                        <UserX size={15} />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* Owner actions */}
                {isOwner && (
                  <div style={{ borderTop: `1px solid ${TT.border}`, padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* End Room swipe — only for active/queuing non-PasaBuy rooms */}
                    {!isArchived && categoryTab !== 'pasabuy' && (
                      <SwipeToConfirm
                        label="Slide to end room"
                        sublabel="Only you as the host can end this room"
                        color={TT.primary}
                        onConfirm={async () => {
                          await updateRoom(room.id, { status: 'completed' } as any);
                          setExpandedId(null);
                        }}
                      />
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!isArchived && (
                        <button onClick={() => openEdit(room)} style={{ flex: 1, height: 36, borderRadius: 10, border: `1.5px solid ${TT.border}`, background: TT.surfaceAlt, color: TT.text, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <Edit2 size={13} /> Edit
                        </button>
                      )}
                      <button onClick={() => handleDelete(room)} disabled={!!deletingId} style={{ flex: isArchived ? 'none' : 1, width: isArchived ? '100%' : undefined, height: 36, borderRadius: 10, border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#B91C1C', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: deletingId ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: deletingId === room.id ? 0.5 : 1 }}>
                        <Trash2 size={13} /> {deletingId === room.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && displayRooms.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '40px 20px', border: `2px dashed ${TT.border}`, borderRadius: 20 }}>
          <p className="font-display" style={{ fontSize: 17, fontWeight: 700, color: TT.text, margin: '0 0 6px' }}>
            {roomsView === 'active'   && (categoryTab === 'pasabuy' ? 'No active requests.' : categoryTab === 'gaming' ? 'No active lobbies.' : categoryTab === 'cafe' ? 'No active hangouts.' : 'No active rooms yet.')}
            {roomsView === 'queuing'  && (categoryTab === 'pasabuy' ? 'No requests in queue.' : categoryTab === 'gaming' ? 'No lobbies waiting.' : categoryTab === 'cafe' ? 'No hangouts in queue.' : 'No rooms in queue.')}
            {roomsView === 'finished' && (categoryTab === 'pasabuy' ? 'No finished requests.' : categoryTab === 'gaming' ? 'No finished lobbies.' : categoryTab === 'cafe' ? 'No finished hangouts.' : 'No finished rooms.')}
            {roomsView === 'archived' && (categoryTab === 'pasabuy' ? 'No archived requests.' : categoryTab === 'gaming' ? 'No archived lobbies.' : categoryTab === 'cafe' ? 'No archived hangouts.' : 'No archived rooms.')}
          </p>
          <p style={{ fontSize: 13, color: TT.textMuted, margin: '0 0 20px' }}>
            {roomsView === 'active'   && (categoryTab === 'pasabuy' ? 'Accepted requests appear here.' : 'Confirmed or full rooms appear here.')}
            {roomsView === 'queuing'  && (categoryTab === 'pasabuy' ? 'Requests awaiting an agent appear here.' : 'Rooms still waiting for members or host confirmation appear here.')}
            {roomsView === 'finished' && 'Completed rooms and deliveries appear here.'}
            {roomsView === 'archived' && 'Cancelled rooms and past event dates appear here.'}
          </p>
          {roomsView === 'active' && (
            <button onClick={openCreate} style={{ padding: '10px 24px', borderRadius: 24, border: 'none', background: TT.primary, color: TT.bg, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Plus size={15} /> {categoryTab === 'pasabuy' ? 'Post a request' : categoryTab === 'gaming' ? 'Create lobby' : categoryTab === 'cafe' ? 'Create hangout' : 'Create first room'}
            </button>
          )}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <PixelHeart color={TT.accent} size={10} />
          <p className="font-pixel" style={{ fontSize: 11, color: TT.textMuted, margin: 0, letterSpacing: 1 }}>
            {categoryTab === 'pasabuy' ? 'PASABUY' : categoryTab === 'gaming' ? 'GAMING ROOMS' : categoryTab === 'cafe' ? 'CAFE ROOMS' : 'ROTARY ROOMS'} — SABAYPH
          </p>
          <PixelHeart color={TT.accent} size={10} />
        </div>
      </div>

      {/* PasaBuy Detail Bottom Sheet */}
      {pasabuyDetailId && (() => {
        const detailRoom = rooms.find(r => r.id === pasabuyDetailId);
        if (!detailRoom) return null;
        const PT = THEMES.pasabuy;
        const roomRequests = requests.filter(r => r.room_id === detailRoom.id);
        const isConfirmed = detailRoom.status === 'confirmed';
        const isOwnerOfDetail = detailRoom.user_id === userId;
        const isAutoMatch = detailRoom.approval_mode === 'auto';
        const isArchivedDetail = !detailRoom.event_date || new Date(detailRoom.event_date) < now;
        const detailEventDisplay = detailRoom.event_date ? formatEventDate(detailRoom.event_date) : detailRoom.next_event;

        return (
          <div
            onMouseDown={e => { if (e.target === e.currentTarget) (e.currentTarget as HTMLDivElement).dataset.dismissing = '1'; }}
            onMouseUp={e => { if (e.target === e.currentTarget && (e.currentTarget as HTMLDivElement).dataset.dismissing === '1') setPasabuyDetailId(null); (e.currentTarget as HTMLDivElement).dataset.dismissing = ''; }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', fontFamily: '"DM Sans", system-ui, sans-serif' }}
          >
            <div style={{ width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', background: PT.surface, borderRadius: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }}>

              {/* Header */}
              <div style={{ padding: '8px 20px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="font-pixel" style={{ fontSize: 11, color: PT.accent, margin: '0 0 2px', letterSpacing: 1 }}>PASABUY REQUEST</p>
                  <h2 className="font-display" style={{ fontSize: 20, fontWeight: 800, color: PT.text, margin: '0 0 6px', lineHeight: 1.2 }}>{detailRoom.name}</h2>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {isConfirmed && <span style={{ fontSize: 10, fontWeight: 700, background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: 8, border: '1px solid #86EFAC' }}>✅ CONFIRMED</span>}
                    {detailRoom.is_private && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, background: PT.surfaceAlt, color: PT.textMuted, padding: '2px 8px', borderRadius: 8 }}><Lock size={9} /> PRIVATE</span>}
                    {isOwnerOfDetail && <span style={{ fontSize: 10, fontWeight: 700, background: PT.primary, color: PT.bg, padding: '2px 8px', borderRadius: 8 }}>YOUR REQUEST</span>}
                    {isAutoMatch && !isConfirmed && <span style={{ fontSize: 10, fontWeight: 700, background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: 8 }}>⚡ AUTO-MATCH ON</span>}
                  </div>
                </div>
                <button
                  onClick={() => setPasabuyDetailId(null)}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: PT.surfaceAlt, border: `1.5px solid ${PT.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PT.textMuted, flexShrink: 0 }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Requested by */}
              <p style={{ padding: '10px 20px 0', fontSize: 13, color: PT.textMuted, margin: 0 }}>
                Requested by <strong style={{ color: PT.text }}>{detailRoom.host_name}</strong>
              </p>

              {/* Quick chips */}
              {(detailEventDisplay || detailRoom.location_name) && (
                <div style={{ padding: '10px 20px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {detailEventDisplay && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12, background: PT.surfaceAlt, border: `1px solid ${PT.border}` }}>
                      <span style={{ fontSize: 14 }}>🤝</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: PT.text }}>{detailEventDisplay}</span>
                    </div>
                  )}
                  {detailRoom.location_name && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12, background: PT.surfaceAlt, border: `1px solid ${PT.border}` }}>
                      <MapPin size={13} style={{ color: PT.primary, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: PT.text }}>{detailRoom.location_name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Full details (description) */}
              {detailRoom.description && (
                <div style={{ margin: '14px 20px 0', padding: '14px', background: PT.surfaceAlt, borderRadius: 16, border: `1px solid ${PT.border}` }}>
                  <pre style={{ fontSize: 13, color: PT.text, margin: 0, lineHeight: 1.7, fontFamily: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{detailRoom.description}</pre>
                </div>
              )}

              {/* Confirmed message */}
              {isConfirmed && (
                <div style={{ margin: '14px 20px 0', padding: '14px 16px', background: '#DCFCE7', borderRadius: 14, border: '1.5px solid #86EFAC', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>✅</span>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#15803D', margin: 0 }}>Booking confirmed — your agent has been selected. Group chat created in Messages.</p>
                </div>
              )}

              {/* Agent Queue — owner only, not yet confirmed */}
              {isOwnerOfDetail && !isConfirmed && (
                <div style={{ margin: '14px 20px 0', borderRadius: 16, border: `2px solid ${PT.border}`, overflow: 'hidden' }}>
                  {/* Queue header */}
                  <div style={{ padding: '14px 16px', background: PT.surfaceAlt, borderBottom: `1px solid ${PT.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Bell size={15} style={{ color: PT.accent }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: PT.text }}>Agent Queue</span>
                      {roomRequests.length > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, background: PT.accent, color: '#fff', padding: '1px 7px', borderRadius: 10 }}>{roomRequests.length}</span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: PT.textMuted, margin: '0 0 12px', lineHeight: 1.5 }}>
                      Pick any applicant — you don't need all {detailRoom.max_members} slots filled. Select one and the booking is confirmed.
                    </p>

                    {/* Auto-match toggle — only shown for active (non-archived) rooms */}
                    {!isArchivedDetail && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: isAutoMatch ? '#F0FDF4' : PT.surface, borderRadius: 12, border: `1.5px solid ${isAutoMatch ? '#86EFAC' : PT.border}` }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: isAutoMatch ? '#15803D' : PT.text, margin: '0 0 1px' }}>Auto-match</p>
                        <p style={{ fontSize: 11, color: isAutoMatch ? '#16A34A' : PT.textMuted, margin: 0 }}>
                          {isAutoMatch ? 'First applicant gets confirmed automatically' : 'Manually choose your agent'}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (togglingAutoMatch) return;
                          setTogglingAutoMatch(true);
                          const newMode = isAutoMatch ? 'manual' : 'auto';
                          await handlePasaBuyUpdate(detailRoom.id, { approval_mode: newMode } as any);
                          if (newMode === 'auto' && roomRequests.length > 0) {
                            await approveRequest(roomRequests[0]);
                            setPasabuyDetailId(null);
                          }
                          setTogglingAutoMatch(false);
                        }}
                        disabled={togglingAutoMatch}
                        style={{ width: 48, height: 26, borderRadius: 13, border: 'none', background: isAutoMatch ? '#15803D' : PT.border, cursor: togglingAutoMatch ? 'not-allowed' : 'pointer', position: 'relative', transition: 'background 250ms', flexShrink: 0, opacity: togglingAutoMatch ? 0.6 : 1 }}
                      >
                        <div style={{ position: 'absolute', top: 3, left: isAutoMatch ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.25)', transition: 'left 250ms' }} />
                      </button>
                    </div>}
                  </div>

                  {/* Applicants list */}
                  <div style={{ padding: '10px 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {roomRequests.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <p style={{ fontSize: 24, margin: '0 0 8px' }}>🕐</p>
                        <p style={{ fontSize: 13, color: PT.textMuted, margin: 0 }}>No applicants yet. Share your join code to get agents!</p>
                      </div>
                    ) : (
                      roomRequests.map(req => (
                        <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: PT.surfaceAlt, borderRadius: 14, border: `1.5px solid ${PT.border}` }}>
                          <button
                            onClick={() => handleViewApplicantProfile(req.user_id)}
                            style={{ width: 44, height: 44, borderRadius: '50%', background: PT.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: 'none', cursor: 'pointer' }}
                          >
                            <span style={{ fontSize: 18, fontWeight: 800, color: PT.bg, fontFamily: '"Bricolage Grotesque",serif' }}>
                              {(req.display_name ?? '?').charAt(0).toUpperCase()}
                            </span>
                          </button>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <p style={{ fontSize: 14, fontWeight: 700, color: PT.text, margin: 0 }}>{req.display_name ?? 'Anonymous'}</p>
                              <button
                                onClick={() => handleViewApplicantProfile(req.user_id)}
                                style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 10, border: `1px solid ${PT.border}`, background: PT.surface, color: PT.textMuted, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                              >
                                <Eye size={11} /> Profile
                              </button>
                            </div>
                            {req.message && <p style={{ fontSize: 12, color: PT.textMuted, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.message}</p>}
                            <p style={{ fontSize: 11, color: PT.textMuted, margin: 0 }}>Applied {new Date(req.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                            <button
                              onClick={async () => { await approveRequest(req); setPasabuyDetailId(null); }}
                              style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1.5px solid #86EFAC', background: '#DCFCE7', color: '#15803D', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                            >
                              <UserCheck size={14} /> Confirm
                            </button>
                            <button
                              onClick={() => rejectRequest(req.id)}
                              style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#B91C1C', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}
                            >
                              <UserX size={14} /> Reject
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Buyer swipe-to-confirm — shown when courier is confirmed */}
              {isOwnerOfDetail && isConfirmed && (
                <div style={{ margin: '0 16px 20px', padding: '14px 16px 16px', background: '#F0FDF4', borderRadius: 16, border: '1.5px solid #86EFAC' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#15803D', margin: '0 0 10px' }}>🎉 Your agent has been confirmed! Mark as done once you receive your items.</p>
                  <SwipeToConfirm
                    label="Slide to complete order"
                    color="#059669"
                    onConfirm={async () => {
                      await handlePasaBuyUpdate(detailRoom.id, { status: 'completed' } as any);
                      setPasabuyDetailId(null);
                    }}
                  />
                </div>
              )}

              <div style={{ height: 32 }} />
            </div>
          </div>
        );
      })()}

      {/* Room Detail Dialog — Rotary / Gaming / Cafe */}
      {roomDetailId && (() => {
        const detailRoom = rooms.find(r => r.id === roomDetailId);
        if (!detailRoom) return null;
        const isGD = detailRoom.category === 'gaming';
        const isCD = detailRoom.category === 'cafe';
        const DT = isGD ? { ...T, primary: '#7C3AED', accent: '#A855F7' } : isCD ? { ...T, primary: '#92400E', accent: '#D97706' } : T;
        const isArchivedDetail = detailRoom.status === 'completed' || detailRoom.status === 'cancelled' || (!detailRoom.event_date && detailRoom.status !== 'confirmed') || (!!detailRoom.event_date && new Date(detailRoom.event_date) < now);
        const detailFill = Math.min((detailRoom.member_count / detailRoom.max_members) * 100, 100);
        const detailEventDisplay = detailRoom.event_date ? formatEventDate(detailRoom.event_date) : detailRoom.next_event;
        const hasItineraryDetail = detailRoom.itinerary && detailRoom.itinerary.length > 0;
        const isItinExpanded = expandedId === detailRoom.id;
        const mobileEntry = (detailRoom.other_socials ?? []).find(s => s.label === 'Mobile' && s.url);
        const detailSocials = [
          detailRoom.facebook_url && { Icon: FacebookIcon, url: detailRoom.facebook_url, color: '#1877F2' },
          detailRoom.instagram_url && { Icon: InstagramIcon, url: detailRoom.instagram_url, color: '#E4405F' },
          detailRoom.twitter_url && { Icon: TwitterIcon, url: detailRoom.twitter_url, color: '#1DA1F2' },
          ...(detailRoom.other_socials ?? []).filter(s => s.url && s.label !== 'Mobile').map(s => ({ Icon: null, url: s.url, label: s.label, color: DT.primary })),
        ].filter(Boolean);

        return (
          <div
            onMouseDown={e => { if (e.target === e.currentTarget) (e.currentTarget as HTMLDivElement).dataset.dismissing = '1'; }}
            onMouseUp={e => { if (e.target === e.currentTarget && (e.currentTarget as HTMLDivElement).dataset.dismissing === '1') setRoomDetailId(null); (e.currentTarget as HTMLDivElement).dataset.dismissing = ''; }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', fontFamily: '"DM Sans", system-ui, sans-serif' }}
          >
            <div style={{ width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', background: DT.surface, borderRadius: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }}>

              {/* Header */}
              <div style={{ padding: '18px 20px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="font-pixel" style={{ fontSize: 11, color: DT.accent, margin: '0 0 2px', letterSpacing: 1 }}>
                    {isGD ? 'GAMING LOBBY' : isCD ? 'CAFE HANGOUT' : 'ROTARY ROOM'}
                  </p>
                  <h2 className="font-display" style={{ fontSize: 20, fontWeight: 800, color: DT.text, margin: '0 0 6px', lineHeight: 1.2 }}>{detailRoom.name}</h2>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {detailRoom.status === 'confirmed' && <span style={{ fontSize: 10, fontWeight: 700, background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: 8, border: '1px solid #86EFAC' }}>✅ CONFIRMED</span>}
                    {detailRoom.status === 'live' && <span style={{ fontSize: 10, fontWeight: 700, background: '#C82718', color: '#F1EDE1', padding: '2px 8px', borderRadius: 8 }}>LIVE</span>}
                    {detailRoom.is_private && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, background: DT.surfaceAlt, color: DT.textMuted, padding: '2px 8px', borderRadius: 8 }}><Lock size={9} /> PRIVATE</span>}
                    {detailRoom.user_id === userId && <span style={{ fontSize: 10, fontWeight: 700, background: DT.primary, color: DT.bg, padding: '2px 8px', borderRadius: 8 }}>YOUR {isGD ? 'LOBBY' : isCD ? 'HANGOUT' : 'ROOM'}</span>}
                  </div>
                </div>
                <button onClick={() => setRoomDetailId(null)} style={{ width: 36, height: 36, borderRadius: '50%', background: DT.surfaceAlt, border: `1.5px solid ${DT.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: DT.textMuted, flexShrink: 0 }}>
                  <X size={16} />
                </button>
              </div>

              <p style={{ padding: '10px 20px 0', fontSize: 13, color: DT.textMuted, margin: 0 }}>
                Hosted by <strong style={{ color: DT.text }}>{detailRoom.host_name}</strong>
              </p>

              {/* Quick chips */}
              {(isGD && detailRoom.game_name || detailEventDisplay || detailRoom.location_name) && (
                <div style={{ padding: '10px 20px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {isGD && detailRoom.game_name && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12, background: DT.surfaceAlt, border: `1px solid ${DT.border}` }}>
                      <span style={{ fontSize: 14 }}>🎮</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: DT.text }}>{detailRoom.game_name}</span>
                    </div>
                  )}
                  {detailEventDisplay && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12, background: DT.surfaceAlt, border: `1px solid ${DT.border}` }}>
                      <span style={{ fontSize: 14 }}>📅</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: DT.text }}>{detailEventDisplay}</span>
                    </div>
                  )}
                  {detailRoom.location_name && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12, background: DT.surfaceAlt, border: `1px solid ${DT.border}` }}>
                      <MapPin size={13} style={{ color: DT.primary, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: DT.text }}>{detailRoom.location_name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Members */}
              <div style={{ margin: '14px 20px 0', background: DT.surfaceAlt, borderRadius: 16, border: `1px solid ${DT.border}`, overflow: 'hidden' }}>
                <button
                  onClick={() => {
                    const next = membersExpandedId === detailRoom.id ? null : detailRoom.id;
                    setMembersExpandedId(next);
                    if (next) fetchRoomMembers(detailRoom.id);
                  }}
                  style={{ width: '100%', padding: '14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: DT.text }}>
                      <Users size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                      {isGD ? 'Players' : isCD ? 'Guests' : 'Members'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: DT.primary }}>{detailRoom.member_count} / {detailRoom.max_members}</span>
                      <span style={{ fontSize: 11, color: DT.primary, fontWeight: 600 }}>
                        {membersExpandedId === detailRoom.id ? 'Hide' : 'Show all'}
                      </span>
                      {membersExpandedId === detailRoom.id
                        ? <ChevronUp size={13} style={{ color: DT.primary }} />
                        : <ChevronDown size={13} style={{ color: DT.primary }} />}
                    </div>
                  </div>
                  <div style={{ height: 6, background: DT.surface, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${detailFill}%`, background: DT.primary, transition: 'width 600ms' }} />
                  </div>
                </button>

                {membersExpandedId === detailRoom.id && (
                  <div style={{ borderTop: `1px solid ${DT.border}`, padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Host always shown first */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: DT.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: DT.bg, fontFamily: '"Bricolage Grotesque",serif' }}>
                          {(detailRoom.host_name || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: DT.text, margin: 0 }}>{detailRoom.host_name}</p>
                        <p style={{ fontSize: 11, fontWeight: 700, color: DT.primary, margin: 0 }}>Host</p>
                      </div>
                    </div>

                    {membersLoadingId === detailRoom.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: DT.textMuted, padding: '6px 0' }}>
                        <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: 12 }}>Loading members…</span>
                      </div>
                    ) : (membersData[detailRoom.id] ?? []).length === 0 ? (
                      <p style={{ fontSize: 12, color: DT.textMuted, margin: '4px 0 0' }}>No other members have joined yet.</p>
                    ) : (
                      (membersData[detailRoom.id] ?? []).map(m => (
                        <button
                          key={m.user_id}
                          onClick={() => handleViewApplicantProfile(m.user_id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left', padding: '2px 0' }}
                        >
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: DT.surfaceAlt, border: `1.5px solid ${DT.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: DT.primary, fontFamily: '"Bricolage Grotesque",serif' }}>
                              {(m.display_name || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: DT.text, margin: 0, flex: 1 }}>{m.display_name}</p>
                          <span style={{ fontSize: 11, color: DT.primary, fontWeight: 600, opacity: 0.75 }}>View →</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              {detailRoom.description && (
                <div style={{ margin: '14px 20px 0', padding: '14px', background: DT.surfaceAlt, borderRadius: 16, border: `1px solid ${DT.border}` }}>
                  <pre style={{ fontSize: 13, color: DT.text, margin: 0, lineHeight: 1.7, fontFamily: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{detailRoom.description}</pre>
                </div>
              )}

              {/* Mobile number — tap to copy, only visible to members/owner */}
              {mobileEntry && (
                <div style={{ padding: '14px 20px 0' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(mobileEntry.url).then(() => {
                        setCopiedPhone(true);
                        setTimeout(() => setCopiedPhone(false), 2000);
                      });
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 12, border: `1.5px solid ${DT.primary}44`, background: `${DT.primary}10`, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 150ms' }}
                    onMouseEnter={e => (e.currentTarget.style.background = `${DT.primary}20`)}
                    onMouseLeave={e => (e.currentTarget.style.background = `${DT.primary}10`)}
                  >
                    <span style={{ fontSize: 15 }}>📱</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: DT.primary, letterSpacing: 0.3 }}>{mobileEntry.url}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: copiedPhone ? '#15803D' : DT.textMuted, marginLeft: 4, transition: 'color 200ms' }}>
                      {copiedPhone ? '✓ Copied!' : 'Tap to copy'}
                    </span>
                  </button>
                </div>
              )}

              {/* Social links */}
              {detailSocials.length > 0 && (
                <div style={{ padding: '14px 20px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {detailSocials.map((s, i) => s && (
                    s.Icon
                      ? <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, border: `1px solid ${s.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                          <s.Icon size={16} color={s.color} />
                        </a>
                      : <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', borderRadius: 10, background: `${DT.primary}12`, border: `1px solid ${DT.primary}33`, display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 600, color: DT.primary, textDecoration: 'none', gap: 4 }}>
                          🔗 {(s as { label?: string }).label || 'Link'}
                        </a>
                  ))}
                </div>
              )}

              {/* Itinerary (Rotary only) */}
              {hasItineraryDetail && (
                <div style={{ margin: '14px 20px 0', borderRadius: 16, border: `1px solid ${DT.border}`, overflow: 'hidden' }}>
                  <button
                    onClick={() => setExpandedId(isItinExpanded ? null : detailRoom.id)}
                    style={{ width: '100%', padding: '12px 16px', background: DT.surfaceAlt, border: 'none', borderBottom: isItinExpanded ? `1px solid ${DT.border}` : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: DT.primary }}>📋 Itinerary ({detailRoom.itinerary.length} steps)</span>
                    {isItinExpanded ? <ChevronUp size={14} style={{ color: DT.textMuted }} /> : <ChevronDown size={14} style={{ color: DT.textMuted }} />}
                  </button>
                  {isItinExpanded && (
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {detailRoom.itinerary.map((item, idx) => (
                        <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${DT.primary}18`, border: `1.5px solid ${DT.primary}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: DT.primary, flexShrink: 0 }}>{idx + 1}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {item.time && <span style={{ fontSize: 12, color: DT.textMuted, fontWeight: 600 }}>{item.time}</span>}
                              <span style={{ fontSize: 13, fontWeight: 700, color: DT.text }}>{item.title}</span>
                            </div>
                            {item.description && <p style={{ fontSize: 12, color: DT.textMuted, margin: '2px 0 0', lineHeight: 1.4 }}>{item.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Host swipe-to-end — shown at bottom of detail dialog */}
              {detailRoom.user_id === userId && !isArchivedDetail && (
                <div style={{ margin: '14px 20px 0', padding: '14px 16px 16px', background: `${DT.primary}0D`, borderRadius: 16, border: `1.5px solid ${DT.primary}44` }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: DT.primary, margin: '0 0 10px' }}>
                    {isGD ? '🎮 End the lobby when the session is over.' : isCD ? '☕ Close the hangout when everyone has left.' : '🏛️ End the room when the rotary is done.'}
                  </p>
                  <SwipeToConfirm
                    label={isGD ? 'Slide to end lobby' : isCD ? 'Slide to close hangout' : 'Slide to end room'}
                    color={DT.primary}
                    onConfirm={async () => {
                      await updateRoom(detailRoom.id, { status: 'completed' } as any);
                      setRoomDetailId(null);
                    }}
                  />
                </div>
              )}

              <div style={{ height: 32 }} />
            </div>
          </div>
        );
      })()}

      {/* Share Room Card */}
      {shareRoomId && (() => {
        const shareRoom = rooms.find(r => r.id === shareRoomId);
        if (!shareRoom) return null;
        return (
          <ShareRoomCard
            onClose={() => setShareRoomId(null)}
            theme={activeTheme}
            room={shareRoom}
            category={categoryTab}
          />
        );
      })()}

      {/* Rotary Wizard */}
      {wizardOpen && categoryTab === 'rotary' && (
        <RoomWizard
          theme={T}
          editing={editing}
          initialCategory="rotary"
          userId={userId}
          onClose={() => { setWizardOpen(false); setEditing(null); }}
          onCreate={handleRotaryCreate}
          onUpdate={handleRotaryUpdate}
        />
      )}

      {/* Gaming Wizard */}
      {wizardOpen && categoryTab === 'gaming' && (
        <RoomWizard
          theme={{ ...T, primary: '#7C3AED', accent: '#A855F7' }}
          editing={editing}
          initialCategory="gaming"
          userId={userId}
          onClose={() => { setWizardOpen(false); setEditing(null); }}
          onCreate={handleGamingCreate}
          onUpdate={handleGamingUpdate}
        />
      )}

      {/* Cafe Wizard */}
      {wizardOpen && categoryTab === 'cafe' && (
        <RoomWizard
          theme={{ ...T, primary: '#92400E', accent: '#D97706' }}
          editing={editing}
          initialCategory="cafe"
          userId={userId}
          onClose={() => { setWizardOpen(false); setEditing(null); }}
          onCreate={handleCafeCreate}
          onUpdate={handleCafeUpdate}
        />
      )}

      {/* Sports Wizard */}
      {wizardOpen && categoryTab === 'sports' && (
        <RoomWizard
          theme={{ ...T, primary: '#bee800', accent: '#7A9E00', border: '#CBDE00' }}
          editing={editing}
          initialCategory="sports"
          userId={userId}
          onClose={() => { setWizardOpen(false); setEditing(null); }}
          onCreate={handleSportsCreate}
          onUpdate={handleSportsUpdate}
        />
      )}

      {/* PasaBuy Wizard */}
      {wizardOpen && categoryTab === 'pasabuy' && (
        <PasaBuyWizard
          theme={THEMES.pasabuy}
          editing={editing}
          userId={userId}
          onClose={() => { setWizardOpen(false); setEditing(null); }}
          onCreate={handlePasaBuyCreate}
          onUpdate={handlePasaBuyUpdate}
        />
      )}

      {/* Applicant / host profile viewer */}
      {viewingApplicant && (
        <ApplicantProfileModal
          profile={viewingApplicant}
          theme={activeTheme}
          onClose={() => setViewingApplicant(null)}
          headerLabel={profileModalLabel}
        />
      )}
    </div>
  );
}
