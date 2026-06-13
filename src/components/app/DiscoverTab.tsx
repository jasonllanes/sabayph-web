import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Shield, Check, ShieldCheck, ShieldAlert, Star, UserPlus,
  ArrowRight, Plus, MapPin, CalendarDays, Users, Lock, Unlock,
  BookOpen, Wifi,
} from 'lucide-react';
import { PixelHeart } from '@/components/common/PixelDecorations';
import { CATEGORIES, THEMES } from '@/data/themes';
import { useDiscoverPeople } from '@/hooks/useDiscoverPeople';
import { useConnections } from '@/hooks/useConnections';
import { useStories } from '@/hooks/useStories';
import { useRoomsFeed } from '@/hooks/useRoomsFeed';
import { useScreenSize } from '@/hooks/useScreenSize';
import ProfileViewModal from '@/components/app/ProfileViewModal';
import StoriesBar from '@/components/app/StoriesBar';
import StoryViewer from '@/components/app/StoryViewer';
import AddStoryModal from '@/components/app/AddStoryModal';
import { tagStyle, getDefaultAvatar } from '@/components/app/tagConstants';
import { getLevelInfo } from '@/lib/levelUtils';
import type { Theme, ThemeKey, DiscoverProfile, CategoryId } from '@/types';
import type { Story } from '@/hooks/useStories';
import type { FeedRoom } from '@/hooks/useRoomsFeed';

interface DiscoverTabProps {
  theme: Theme;
  activeCategory: ThemeKey;
  onCategoryChange: (val: ThemeKey | ((prev: ThemeKey) => ThemeKey)) => void;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  onBrowseCategory?: (cat: CategoryId) => void;
  onAddRoom?: () => void;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// ─── PersonCard (reused) ──────────────────────────────────────────────────────

const PRONOUN_LABELS = ['He/Him', 'She/Her', 'They/Them', 'She/They', 'He/They'];

function miniProfileBadge(p: DiscoverProfile) {
  const count = (p.profile_completed ? 1 : 0) + (p.contact_phone ? 1 : 0) + (p.home_lat != null ? 1 : 0);
  if (count === 3) return { Icon: ShieldCheck, color: '#15803D', label: 'Fully verified' };
  if (count === 2) return { Icon: Shield, color: '#A16207', label: 'Trusted' };
  return { Icon: ShieldAlert, color: '#9CA3AF', label: 'New member' };
}

function PersonCard({ person, theme: T, onView, compact }: { person: DiscoverProfile; theme: Theme; onView: () => void; compact?: boolean }) {
  const allTags = person.profile_tags ?? [];
  const pronounTag = allTags.find(t => PRONOUN_LABELS.includes(t));
  const interestTags = allTags.filter(t => !PRONOUN_LABELS.includes(t));
  const MAX_TAGS = compact ? 2 : 3;
  const shownTags = interestTags.slice(0, MAX_TAGS);
  const overflow = interestTags.length - MAX_TAGS;
  const badge = miniProfileBadge(person);
  const BadgeIcon = badge.Icon;
  const lvl = getLevelInfo(person.rooms_joined ?? 0);

  return (
    <button
      onClick={onView}
      style={{
        width: compact ? 160 : 200, flexShrink: 0,
        background: T.surface, border: `1.5px solid ${T.border}`,
        borderRadius: 20, padding: 0, overflow: 'hidden',
        textAlign: 'left', fontFamily: '"DM Sans",system-ui,sans-serif',
        cursor: 'pointer', transition: 'box-shadow 150ms ease, border-color 150ms ease',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 6px 20px ${T.text}22`; e.currentTarget.style.borderColor = T.primary; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = T.border; }}
    >
      <div style={{ height: 48, background: T.primary, position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.12, backgroundImage: `linear-gradient(${T.bg} 1px,transparent 1px),linear-gradient(90deg,${T.bg} 1px,transparent 1px)`, backgroundSize: '14px 14px' }} />
        {person.is_online && (
          <span style={{ position: 'absolute', top: 7, right: 7, display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.28)', padding: '2px 6px', borderRadius: 8 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} /> Active
          </span>
        )}
      </div>
      <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <div style={{ marginTop: -22, marginBottom: 2 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: T.primary, border: `3px solid ${T.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <span style={{ fontFamily: '"Bricolage Grotesque",serif', fontWeight: 800, fontSize: 18, color: T.bg, position: 'absolute' }}>
              {(person.display_name ?? '?').charAt(0).toUpperCase()}
            </span>
            <img src={getDefaultAvatar(person.gender, person.profile_tags)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: '"Bricolage Grotesque",serif', flex: 1, minWidth: 0 }}>
            {person.display_name ?? 'Kasama'}
          </p>
          <BadgeIcon size={12} style={{ color: badge.color, flexShrink: 0 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: T.primary, color: T.bg, letterSpacing: 0.3 }}>Lv.{lvl.level}</span>
          <span style={{ fontSize: 9, color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lvl.title}</span>
        </div>
        {person.location && !compact && (
          <p style={{ fontSize: 10, color: T.textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {person.location}</p>
        )}
        {(shownTags.length > 0 || overflow > 0) && (
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 2 }}>
            {shownTags.map(tag => {
              const ts = tagStyle(tag, person.id);
              return <span key={tag} style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 10, background: ts.bg, color: ts.color, whiteSpace: 'nowrap' }}>{ts.label}</span>;
            })}
            {overflow > 0 && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: T.surfaceAlt, color: T.textMuted, whiteSpace: 'nowrap' }}>+{overflow}</span>}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: T.primary, fontSize: 10, fontWeight: 600, marginTop: 'auto', paddingTop: 4 }}>
          View <ArrowRight size={9} />
        </div>
      </div>
    </button>
  );
}

// ─── Room feed card ───────────────────────────────────────────────────────────

function RoomFeedCard({ room, theme: T, onBrowse, userId }: { room: FeedRoom; theme: Theme; onBrowse?: () => void; userId?: string }) {
  const catTheme = THEMES[room.category as keyof typeof THEMES] ?? T;
  const cat = CATEGORIES.find(c => c.id === room.category);
  const fillPct = room.max_members > 0 ? Math.min(100, (room.member_count / room.max_members) * 100) : 0;
  const isFull = room.member_count >= room.max_members;
  const eventDate = formatDate(room.event_date ?? room.next_event);
  const isOwner = !!userId && room.user_id === userId;

  return (
    <div style={{
      background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 18,
      overflow: 'hidden', marginBottom: 12,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      borderTop: `3px solid ${catTheme.primary}`,
      transition: 'box-shadow 150ms',
    }}>
      {/* Post header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: catTheme.primary, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {cat ? <cat.Icon size={18} color={catTheme.bg} strokeWidth={1.8} /> : <Users size={18} color={catTheme.bg} strokeWidth={1.8} />}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text, fontFamily: '"DM Sans",system-ui,sans-serif' }}>
              {room.host_name}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: catTheme.primary, background: catTheme.bg, padding: '1px 7px', borderRadius: 8, border: `1px solid ${catTheme.border}`, textTransform: 'capitalize' }}>
                {room.category}
              </span>
              <span style={{ fontSize: 10, color: T.textMuted }}>·</span>
              <span style={{ fontSize: 10, color: T.textMuted }}>{timeAgo(room.created_at)}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isOwner && (
            <span style={{ fontSize: 9, fontWeight: 700, background: catTheme.primary, color: catTheme.bg, padding: '2px 7px', borderRadius: 6 }}>YOUR ROOM</span>
          )}
          {room.is_private
            ? <Lock size={13} style={{ color: T.textMuted }} />
            : <Unlock size={13} style={{ color: '#15803D' }} />
          }
        </div>
      </div>

      {/* Room name + description */}
      <div style={{ padding: '0 16px 12px' }}>
        <p style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: T.text, fontFamily: '"Bricolage Grotesque",serif', lineHeight: 1.2 }}>
          {room.name}
        </p>
        {room.description && (
          <p style={{ margin: 0, fontSize: 13, color: T.textMuted, lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
            {room.description}
          </p>
        )}
      </div>

      {/* Meta chips */}
      {(eventDate || room.location_name) && (
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', flexWrap: 'wrap' }}>
          {eventDate && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: T.text, background: T.surfaceAlt, padding: '4px 10px', borderRadius: 20, border: `1px solid ${T.border}` }}>
              <CalendarDays size={11} color={catTheme.primary} /> {eventDate}
            </span>
          )}
          {room.location_name && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: T.text, background: T.surfaceAlt, padding: '4px 10px', borderRadius: 20, border: `1px solid ${T.border}` }}>
              <MapPin size={11} color={catTheme.primary} /> {room.location_name}
            </span>
          )}
        </div>
      )}

      {/* Member bar */}
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>
            <span style={{ color: T.text, fontWeight: 700 }}>{room.member_count}</span> / {room.max_members} members
          </span>
          {isFull && <span style={{ fontSize: 10, fontWeight: 700, color: '#C82718', background: '#FEF2F2', padding: '2px 8px', borderRadius: 8 }}>FULL</span>}
        </div>
        <div style={{ height: 5, background: T.surfaceAlt, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${fillPct}%`, background: isFull ? '#C82718' : catTheme.primary, borderRadius: 3, transition: 'width 400ms ease' }} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: `1px solid ${T.border}`, background: T.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Wifi size={12} style={{ color: '#15803D' }} />
          <span style={{ fontSize: 11, color: '#15803D', fontWeight: 700 }}>Active</span>
        </div>
        <button
          onClick={onBrowse}
          style={{ height: 32, padding: '0 14px', borderRadius: 16, border: isOwner ? `1.5px solid ${catTheme.primary}` : 'none', background: isOwner ? 'transparent' : catTheme.primary, color: isOwner ? catTheme.primary : catTheme.bg, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'opacity 150ms', fontFamily: '"DM Sans",system-ui,sans-serif' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.86')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          {isOwner ? 'Manage Room' : 'View Room'} <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Active rooms carousel ────────────────────────────────────────────────────

function ActiveRoomsCarousel({ rooms, theme: T, onBrowse, label = 'Active Rooms' }: { rooms: FeedRoom[]; theme: Theme; onBrowse: (cat?: CategoryId) => void; label?: string }) {
  if (rooms.length === 0) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0 10px' }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.accent, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: '"VT323",monospace' }}>
            {label}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', display: 'inline-block', boxShadow: '0 0 6px #4ADE80' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D' }}>{rooms.length} live</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
        <style>{`div::-webkit-scrollbar{display:none}`}</style>
        {rooms.map(room => {
          const catTheme = THEMES[room.category as keyof typeof THEMES] ?? T;
          const cat = CATEGORIES.find(c => c.id === room.category);
          const fillPct = room.max_members > 0 ? Math.min(100, (room.member_count / room.max_members) * 100) : 0;
          return (
            <button
              key={room.id}
              onClick={() => onBrowse(room.category as CategoryId)}
              style={{
                width: 180, flexShrink: 0, background: T.surface, border: `1.5px solid ${T.border}`,
                borderRadius: 16, overflow: 'hidden', cursor: 'pointer', textAlign: 'left',
                fontFamily: '"DM Sans",system-ui,sans-serif', padding: 0,
                transition: 'box-shadow 150ms, border-color 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 6px 20px ${T.text}18`; e.currentTarget.style.borderColor = catTheme.primary; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = T.border; }}
            >
              <div style={{ height: 6, background: catTheme.primary }} />
              <div style={{ padding: '12px 12px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: catTheme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${catTheme.border}` }}>
                    {cat ? <cat.Icon size={14} color={catTheme.primary} /> : <BookOpen size={14} color={catTheme.primary} />}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: catTheme.primary, textTransform: 'capitalize' }}>{room.category}</span>
                </div>
                <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: T.text, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                  {room.name}
                </p>
                <p style={{ margin: '0 0 8px', fontSize: 10, color: T.textMuted }}>{room.host_name}</p>
                <div style={{ height: 3, background: T.surfaceAlt, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${fillPct}%`, background: catTheme.primary, borderRadius: 2 }} />
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 10, color: T.textMuted }}>{room.member_count}/{room.max_members}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Add Room CTA ─────────────────────────────────────────────────────────────

function AddRoomCta({ theme: T, onAddRoom }: { theme: Theme; onAddRoom?: () => void }) {
  return (
    <button
      onClick={onAddRoom}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', borderRadius: 16, marginBottom: 16,
        background: T.surface, border: `2px dashed ${T.border}`,
        cursor: 'pointer', textAlign: 'left', fontFamily: '"DM Sans",system-ui,sans-serif',
        transition: 'border-color 180ms, background 180ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.background = T.surfaceAlt; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface; }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 12, background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Plus size={20} color={T.bg} strokeWidth={2.5} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>Host a Room</p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: T.textMuted }}>Create a group for your next activity</p>
      </div>
      <ArrowRight size={16} style={{ color: T.textMuted, marginLeft: 'auto', flexShrink: 0 }} />
    </button>
  );
}

// ─── Active members section ───────────────────────────────────────────────────

function ActiveMembersSection({ people, theme: T, onView }: { people: DiscoverProfile[]; theme: Theme; onView: (p: DiscoverProfile) => void }) {
  if (people.length === 0) return null;
  const online = people.filter(p => p.is_online);
  return (
    <div style={{ marginBottom: 16, background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 18, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.accent, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: '"VT323",monospace' }}>ACTIVE MEMBERS</p>
          <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 800, color: T.text, fontFamily: '"Bricolage Grotesque",serif' }}>
            {people.length} kasama {online.length > 0 && `· ${online.length} online`}
          </p>
        </div>
        {online.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: '#DCFCE7', border: '1px solid #86EFAC' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#15803D', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D' }}>{online.length} active</span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px 14px', scrollbarWidth: 'none' }}>
        <style>{`div::-webkit-scrollbar{display:none}`}</style>
        {people.map(person => (
          <PersonCard key={person.id} person={person} theme={T} onView={() => onView(person)} compact />
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FeedSkeleton({ theme: T }: { theme: Theme }) {
  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}.sk{border-radius:8px;background:linear-gradient(90deg,${T.surfaceAlt} 25%,${T.border} 50%,${T.surfaceAlt} 75%);background-size:800px 100%;animation:shimmer 1.4s infinite linear}`}</style>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', marginBottom: 12, borderTop: `3px solid ${T.border}` }}>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
              <div className="sk" style={{ width: 38, height: 38, borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <div className="sk" style={{ width: 120, height: 13, marginBottom: 6 }} />
                <div className="sk" style={{ width: 80, height: 11 }} />
              </div>
            </div>
            <div className="sk" style={{ width: '80%', height: 18, marginBottom: 8 }} />
            <div className="sk" style={{ width: '60%', height: 13 }} />
          </div>
          <div style={{ padding: '0 16px 14px' }}>
            <div className="sk" style={{ height: 5, borderRadius: 3 }} />
          </div>
          <div style={{ height: 44, background: T.bg, borderTop: `1px solid ${T.border}` }} />
        </div>
      ))}
    </>
  );
}

// ─── Desktop right sidebar ────────────────────────────────────────────────────

function DesktopSidebar({ people, rooms, theme: T, onViewPerson, onBrowse }: {
  people: DiscoverProfile[];
  rooms: FeedRoom[];
  theme: Theme;
  onViewPerson: (p: DiscoverProfile) => void;
  onBrowse: (cat?: CategoryId) => void;
}) {
  return (
    <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Active Members widget */}
      <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', position: 'sticky', top: 16 }}>
        <div style={{ padding: '14px 16px 10px' }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: T.accent, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: '"VT323",monospace' }}>ACTIVE MEMBERS</p>
          <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 800, color: T.text, fontFamily: '"Bricolage Grotesque",serif' }}>
            {people.length} kasama
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 340, overflowY: 'auto' }}>
          {people.slice(0, 8).map(person => {
            const badge = miniProfileBadge(person);
            const BadgeIcon = badge.Icon;
            return (
              <button
                key={person.id}
                onClick={() => onViewPerson(person)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 150ms', fontFamily: '"DM Sans",system-ui,sans-serif', borderTop: `1px solid ${T.border}` }}
                onMouseEnter={e => (e.currentTarget.style.background = T.surfaceAlt)}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.primary, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                  <img src={getDefaultAvatar(person.gender, person.profile_tags)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  {person.is_online && <span style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#4ADE80', border: `1.5px solid ${T.surface}` }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: '"Bricolage Grotesque",serif' }}>
                    {person.display_name ?? 'Kasama'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <BadgeIcon size={10} style={{ color: badge.color }} />
                    <span style={{ fontSize: 10, color: T.textMuted }}>{badge.label}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {people.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 16px', color: T.textMuted }}>
            <UserPlus size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
            <p style={{ fontSize: 12, margin: 0 }}>No members visible yet</p>
          </div>
        )}
      </div>

      {/* Active Rooms widget */}
      {rooms.length > 0 && (
        <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 10px' }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: T.accent, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: '"VT323",monospace' }}>ACTIVE ROOMS</p>
            <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 800, color: T.text, fontFamily: '"Bricolage Grotesque",serif' }}>
              {rooms.length} open now
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {rooms.slice(0, 5).map(room => {
              const catTheme = THEMES[room.category as keyof typeof THEMES] ?? T;
              const cat = CATEGORIES.find(c => c.id === room.category);
              return (
                <button
                  key={room.id}
                  onClick={() => onBrowse(room.category as CategoryId)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderTop: `1px solid ${T.border}`, transition: 'background 150ms', fontFamily: '"DM Sans",system-ui,sans-serif' }}
                  onMouseEnter={e => (e.currentTarget.style.background = T.surfaceAlt)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: catTheme.bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${catTheme.border}` }}>
                    {cat ? <cat.Icon size={14} color={catTheme.primary} /> : <BookOpen size={14} color={catTheme.primary} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.name}</p>
                    <p style={{ margin: '1px 0 0', fontSize: 10, color: T.textMuted }}>{room.member_count}/{room.max_members} · {room.host_name}</p>
                  </div>
                  <ArrowRight size={12} style={{ color: T.textMuted, flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Category filter bar ──────────────────────────────────────────────────────

const LIVE_CATS = CATEGORIES.filter(c => c.status === 'live');

function CategoryFilterBar({ active, theme: T, onChange }: { active: ThemeKey; theme: Theme; onChange: (v: ThemeKey) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
      <style>{`div::-webkit-scrollbar{display:none}`}</style>
      <button
        onClick={() => onChange('heritage')}
        style={{ flexShrink: 0, height: 30, padding: '0 12px', borderRadius: 15, border: `1.5px solid ${active === 'heritage' ? T.primary : T.border}`, background: active === 'heritage' ? T.primary : 'transparent', color: active === 'heritage' ? T.surface : T.textMuted, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: '"DM Sans",system-ui,sans-serif', transition: 'all 180ms' }}
      >
        All
      </button>
      {LIVE_CATS.map(cat => {
        const isActive = active === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onChange(isActive ? 'heritage' : cat.id as ThemeKey)}
            style={{ flexShrink: 0, height: 30, padding: '0 12px', borderRadius: 15, display: 'flex', alignItems: 'center', gap: 5, border: `1.5px solid ${isActive ? T.primary : T.border}`, background: isActive ? T.primary : 'transparent', color: isActive ? T.surface : T.textMuted, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: '"DM Sans",system-ui,sans-serif', transition: 'all 180ms' }}
          >
            <cat.Icon size={12} strokeWidth={2} /> {cat.name}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DiscoverTab({
  theme,
  activeCategory,
  onCategoryChange,
  userId,
  userName,
  userAvatar,
  onBrowseCategory,
  onAddRoom,
}: DiscoverTabProps) {
  const { isMobile } = useScreenSize();
  const T = theme;

  // Data
  const { stories, available: storiesAvailable, myStories, addPhoto, addNote, remove: removeStory, refresh: refreshStories } = useStories(userId);
  const { rooms, loading: roomsLoading, initialized: roomsReady, hasMore, loadMore } = useRoomsFeed();
  const { people, loading: peopleLoading } = useDiscoverPeople(userId);
  const {
    getStatus, getConnection, sendRequest, acceptRequest, removeConnection,
    loading: connLoading, error: connError, tableReady,
  } = useConnections(userId);

  // UI state
  const [viewingProfile, setViewingProfile] = useState<DiscoverProfile | null>(null);
  const [showAddStory, setShowAddStory] = useState(false);
  const [viewerStories, setViewerStories] = useState<Story[] | null>(null);
  const [viewerStart, setViewerStart] = useState(0);

  // Pull-to-refresh
  const mobileRootRef = useRef<HTMLDivElement>(null);
  const [ptY, setPtY] = useState(0);
  const [ptRefreshing, setPtRefreshing] = useState(false);
  const ptStartY = useRef(0);
  const ptTracking = useRef(false);

  const getScrollTop = () => mobileRootRef.current?.parentElement?.scrollTop ?? 0;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (getScrollTop() === 0) {
      ptStartY.current = e.touches[0].clientY;
      ptTracking.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!ptTracking.current) return;
    const delta = e.touches[0].clientY - ptStartY.current;
    if (delta > 4) {
      setPtY(Math.min(delta * 0.45, 72));
    } else {
      ptTracking.current = false;
      setPtY(0);
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (!ptTracking.current) return;
    ptTracking.current = false;
    if (ptY >= 56) {
      setPtRefreshing(true);
      setPtY(0);
      await refreshStories();
      await new Promise(r => setTimeout(r, 500));
      setPtRefreshing(false);
    } else {
      setPtY(0);
    }
  }, [ptY, refreshStories]);

  // IntersectionObserver sentinel for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // Filter rooms by active category
  const filteredRooms = activeCategory === 'heritage'
    ? rooms
    : rooms.filter(r => r.category === activeCategory);

  const carouselRooms = filteredRooms.slice(0, 6);
  const midRooms = filteredRooms.slice(6, 12);

  const handleBrowse = (cat?: CategoryId) => {
    if (cat) onBrowseCategory?.(cat);
  };

  // Get the current user's display name + avatar from profile data
  // (AppShell passes these down via theme/profile, but we don't have them here directly)
  // We'll just show a default
  const myStoryCount = myStories.length;

  // ─── DESKTOP LAYOUT ───────────────────────────────────────────────────────

  if (!isMobile) {
    return (
      <div style={{ padding: '20px 0 40px' }}>
        <style>{`.room-card:hover{box-shadow:0 6px 24px rgba(0,0,0,0.1)!important}`}</style>

        {/* Stories + category filter row */}
        <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ borderBottom: `1px solid ${T.border}`, padding: '2px 0' }}>
            <StoriesBar
              theme={T}
              stories={stories}
              userId={userId}
              userName={userName}
              userAvatar={userAvatar}
              isMobile={false}
              onAddStory={() => setShowAddStory(true)}
              onViewOwnStory={(s) => { setViewerStories(s); setViewerStart(0); }}
              onViewStory={(s, i) => { setViewerStories(s); setViewerStart(i ?? 0); }}
            />
          </div>
          {/* Category filter */}
          <div style={{ padding: '10px 20px 12px' }}>
            <CategoryFilterBar active={activeCategory} theme={T} onChange={v => onCategoryChange(v)} />
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* Left: main feed */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Add Room CTA */}
            <AddRoomCta theme={T} onAddRoom={onAddRoom} />

            {/* Active Rooms carousel */}
            {carouselRooms.length > 0 && (
              <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 18, padding: '14px 16px', marginBottom: 16 }}>
                <ActiveRoomsCarousel rooms={carouselRooms} theme={T} onBrowse={handleBrowse} />
              </div>
            )}

            {/* Feed */}
            {!roomsReady ? (
              <FeedSkeleton theme={T} />
            ) : filteredRooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', border: `2px dashed ${T.border}`, borderRadius: 18, color: T.textMuted }}>
                <BookOpen size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
                <p style={{ fontSize: 14, margin: 0 }}>No active rooms yet.<br />Be the first to host one!</p>
              </div>
            ) : (
              <>
                {filteredRooms.map((room, i) => (
                  <div key={room.id} className="room-card" style={{ transition: 'box-shadow 150ms' }}>
                    <RoomFeedCard room={room} theme={T} userId={userId} onBrowse={() => handleBrowse(room.category as CategoryId)} />
                  </div>
                ))}
                {/* Inline: more Active Rooms mid-feed */}
                {midRooms.length > 0 && (
                  <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 18, padding: '14px 16px', marginBottom: 12 }}>
                    <ActiveRoomsCarousel rooms={midRooms} theme={T} onBrowse={handleBrowse} label="More Active Rooms" />
                  </div>
                )}
              </>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {roomsLoading && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: T.primary, opacity: 0.5, animation: `pulse 1s ease-in-out ${i * 0.2}s infinite alternate` }} />
                  ))}
                  <style>{`@keyframes pulse{from{opacity:0.3;transform:scale(0.8)}to{opacity:1;transform:scale(1.2)}}`}</style>
                </div>
              )}
              {!hasMore && filteredRooms.length > 0 && (
                <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>All rooms loaded · {filteredRooms.length} total</p>
              )}
            </div>
          </div>

          {/* Right: sticky sidebar */}
          <DesktopSidebar
            people={people}
            rooms={rooms}
            theme={T}
            onViewPerson={setViewingProfile}
            onBrowse={handleBrowse}
          />
        </div>

        {/* Modals */}
        {showAddStory && (
          <AddStoryModal
            theme={T}
            available={storiesAvailable}
            onAddPhoto={addPhoto}
            onAddNote={addNote}
            onClose={() => setShowAddStory(false)}
          />
        )}
        {viewerStories && (
          <StoryViewer
            stories={viewerStories}
            startIndex={viewerStart}
            onClose={() => setViewerStories(null)}
            isMobile={false}
            userId={userId}
            userAvatar={userAvatar}
            onDelete={async (id) => { await removeStory(id); }}
          />
        )}
        {viewingProfile && (
          <ProfileViewModal
            person={viewingProfile} theme={T}
            connectionStatus={getStatus(viewingProfile.id)}
            connectionLoading={connLoading} connectionError={connError} tableReady={tableReady}
            connection={getConnection(viewingProfile.id)}
            onSendRequest={() => sendRequest(viewingProfile.id)}
            onAcceptRequest={() => { const c = getConnection(viewingProfile.id); if (c) acceptRequest(c.id); }}
            onRemoveConnection={() => { const c = getConnection(viewingProfile.id); if (c) removeConnection(c.id); }}
            onClose={() => setViewingProfile(null)}
          />
        )}
      </div>
    );
  }

  // ─── MOBILE LAYOUT ────────────────────────────────────────────────────────

  return (
    <div
      ref={mobileRootRef}
      style={{ paddingBottom: 24, position: 'relative' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`.room-card:hover{box-shadow:0 4px 12px rgba(0,0,0,0.08)!important}`}</style>

      {/* Pull-to-refresh indicator */}
      {(ptY > 0 || ptRefreshing) && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
          display: 'flex', justifyContent: 'center',
          transform: `translateY(${ptRefreshing ? 16 : ptY - 40}px)`,
          transition: ptRefreshing ? 'transform 200ms ease' : 'none',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: T.surface, border: `2px solid ${T.border}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              border: `2.5px solid ${T.border}`,
              borderTopColor: T.primary,
              animation: ptRefreshing ? 'ptr-spin 700ms linear infinite' : 'none',
              transform: ptRefreshing ? 'none' : `rotate(${ptY * 3}deg)`,
            }} />
            <style>{`@keyframes ptr-spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        </div>
      )}

      {/* Stories bar */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <StoriesBar
          theme={T}
          stories={stories}
          userId={userId}
          userName={userName}
          userAvatar={userAvatar}
          isMobile
          onAddStory={() => setShowAddStory(true)}
          onViewStory={(s, i) => { setViewerStories(s); setViewerStart(i ?? 0); }}
        />
      </div>

      <div style={{ padding: '14px 14px 0' }}>
        {/* Category filter */}
        <div style={{ marginBottom: 14 }}>
          <CategoryFilterBar active={activeCategory} theme={T} onChange={v => onCategoryChange(v)} />
        </div>

        {/* Add Room CTA */}
        <AddRoomCta theme={T} onAddRoom={onAddRoom} />

        {/* Active Rooms carousel */}
        {carouselRooms.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <ActiveRoomsCarousel rooms={carouselRooms} theme={T} onBrowse={handleBrowse} />
          </div>
        )}

        {/* Active Members — always visible above the feed */}
        {!peopleLoading && (
          <ActiveMembersSection people={people} theme={T} onView={setViewingProfile} />
        )}

        {/* Feed: rooms + inline sections */}
        {!roomsReady ? (
          <FeedSkeleton theme={T} />
        ) : filteredRooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', border: `2px dashed ${T.border}`, borderRadius: 16, color: T.textMuted, marginBottom: 14 }}>
            <BookOpen size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
            <p style={{ fontSize: 13, margin: 0 }}>No active rooms yet.<br />Be the first to host one!</p>
          </div>
        ) : (
          <>
            {filteredRooms.map((room, i) => (
              <div key={room.id}>
                {/* More Active Rooms inline — after 7th room */}
                {i === 7 && midRooms.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <ActiveRoomsCarousel rooms={midRooms} theme={T} onBrowse={handleBrowse} label="More Active Rooms" />
                  </div>
                )}
                <div className="room-card" style={{ transition: 'box-shadow 150ms' }}>
                  <RoomFeedCard room={room} theme={T} userId={userId} onBrowse={() => handleBrowse(room.category as CategoryId)} />
                </div>
              </div>
            ))}
          </>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
          {roomsLoading && (
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: T.primary, opacity: 0.5, animation: `pulse 1s ease-in-out ${i * 0.2}s infinite alternate` }} />
              ))}
              <style>{`@keyframes pulse{from{opacity:0.3;transform:scale(0.8)}to{opacity:1;transform:scale(1.2)}}`}</style>
            </div>
          )}
          {!hasMore && filteredRooms.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
              <PixelHeart color={T.accent} size={11} />
              <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>All {filteredRooms.length} rooms loaded</span>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddStory && (
        <AddStoryModal
          theme={T}
          available={storiesAvailable}
          onAddPhoto={addPhoto}
          onAddNote={addNote}
          onClose={() => setShowAddStory(false)}
        />
      )}
      {viewerStories && (
        <StoryViewer
          stories={viewerStories}
          startIndex={viewerStart}
          onClose={() => setViewerStories(null)}
          isMobile
          userId={userId}
          userAvatar={userAvatar}
          onDelete={async (id) => { await removeStory(id); }}
        />
      )}
      {viewingProfile && (
        <ProfileViewModal
          person={viewingProfile} theme={T}
          connectionStatus={getStatus(viewingProfile.id)}
          connectionLoading={connLoading} connectionError={connError} tableReady={tableReady}
          connection={getConnection(viewingProfile.id)}
          onSendRequest={() => sendRequest(viewingProfile.id)}
          onAcceptRequest={() => { const c = getConnection(viewingProfile.id); if (c) acceptRequest(c.id); }}
          onRemoveConnection={() => { const c = getConnection(viewingProfile.id); if (c) removeConnection(c.id); }}
          onClose={() => setViewingProfile(null)}
        />
      )}
    </div>
  );
}
