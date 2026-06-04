import { useRef, useState } from 'react';
import { Shield, Check, ArrowRight, ShieldCheck, ShieldAlert, Star, UserPlus, Loader, Users, BookOpen, LayoutGrid } from 'lucide-react';
import { PixelHeart, PixelPlus } from '@/components/common/PixelDecorations';
import { CATEGORIES, CATEGORY_DETAILS, FEATURES, TRUST_ITEMS } from '@/data/themes';
import { useDiscoverPeople } from '@/hooks/useDiscoverPeople';
import { useConnections } from '@/hooks/useConnections';
import { useHeroStats } from '@/hooks/useHeroStats';
import ProfileViewModal from '@/components/app/ProfileViewModal';
import { tagStyle, getDefaultAvatar } from '@/components/app/tagConstants';
import { getLevelInfo } from '@/lib/levelUtils';
import type { Theme, ThemeKey, DiscoverProfile, CategoryId } from '@/types';

interface DiscoverTabProps {
  theme: Theme;
  activeCategory: ThemeKey;
  onCategoryChange: (val: ThemeKey | ((prev: ThemeKey) => ThemeKey)) => void;
  userId?: string;
  onBrowseCategory?: (cat: CategoryId) => void;
}

// ── Compact profile badge ───────────────────────────────────────────────────

function miniProfileBadge(p: DiscoverProfile) {
  const count = (p.profile_completed ? 1 : 0) + (p.contact_phone ? 1 : 0) + (p.home_lat != null ? 1 : 0);
  if (count === 3) return { Icon: ShieldCheck, color: '#15803D', bg: '#DCFCE7', label: 'Fully verified' };
  if (count === 2) return { Icon: Shield, color: '#A16207', bg: '#FEF9C3', label: 'Trusted' };
  return { Icon: ShieldAlert, color: '#9CA3AF', bg: '#F3F4F6', label: 'New member' };
}

// ── Person card ─────────────────────────────────────────────────────────────

const PRONOUN_LABELS = ['He/Him', 'She/Her', 'They/Them', 'She/They', 'He/They'];

function genderEmoji(pronoun: string | undefined): string | null {
  if (!pronoun) return null;
  if (pronoun === 'He/Him') return '♂️';
  if (pronoun === 'She/Her') return '♀️';
  return '🌈';
}

function PersonCard({ person, theme: T, onView }: { person: DiscoverProfile; theme: Theme; onView: () => void }) {
  const allTags = person.profile_tags ?? [];
  const pronounTag = allTags.find(t => PRONOUN_LABELS.includes(t));
  const interestTags = allTags.filter(t => !PRONOUN_LABELS.includes(t));
  const MAX_TAGS = 3;
  const shownTags = interestTags.slice(0, MAX_TAGS);
  const overflow = interestTags.length - MAX_TAGS;
  const badge = miniProfileBadge(person);
  const BadgeIcon = badge.Icon;
  const emoji = genderEmoji(pronounTag);
  const lvl = getLevelInfo(person.rooms_joined ?? 0);

  return (
    <button
      onClick={onView}
      style={{
        width: 200, flexShrink: 0,
        background: T.surface, border: `1.5px solid ${T.border}`,
        borderRadius: 20, padding: 0, overflow: 'hidden',
        textAlign: 'left', fontFamily: '"DM Sans",system-ui,sans-serif',
        cursor: 'pointer', transition: 'box-shadow 150ms ease, border-color 150ms ease',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 6px 20px ${T.text}22`; e.currentTarget.style.borderColor = T.primary; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = T.border; }}
    >
      {/* Coloured strip */}
      <div style={{ height: 56, background: T.primary, position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.12, backgroundImage: `linear-gradient(${T.bg} 1px,transparent 1px),linear-gradient(90deg,${T.bg} 1px,transparent 1px)`, backgroundSize: '14px 14px' }} />
        {person.is_online && (
          <span style={{ position: 'absolute', top: 9, right: 9, display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.28)', padding: '2px 7px', borderRadius: 8 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
            Active
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
        {/* Avatar — overlaps strip */}
        <div style={{ marginTop: -24, marginBottom: 4 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: T.primary, border: `3px solid ${T.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <span style={{ fontFamily: '"Bricolage Grotesque",serif', fontWeight: 800, fontSize: 20, color: T.bg, position: 'absolute' }}>
              {(person.display_name ?? '?').charAt(0).toUpperCase()}
            </span>
            <img src={getDefaultAvatar(person.gender, person.profile_tags)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          </div>
        </div>

        {/* Name + badge icon + gender emoji */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'nowrap', overflow: 'hidden' }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: '"Bricolage Grotesque",serif', flex: 1, minWidth: 0 }}>
            {person.display_name ?? 'Kasama'}
          </p>
          <BadgeIcon size={13} style={{ color: badge.color, flexShrink: 0 }} />
          {emoji && <span style={{ fontSize: 13, flexShrink: 0 }}>{emoji}</span>}
        </div>

        {/* Level badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 8, background: T.primary, color: T.bg, letterSpacing: 0.3, flexShrink: 0 }}>
            Lv.{lvl.level}
          </span>
          <span style={{ fontSize: 10, color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lvl.title}
          </span>
        </div>

        {/* Location */}
        {person.location && (
          <p style={{ fontSize: 11, color: T.textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}>
            📍 {person.location}
          </p>
        )}

        {/* Rating */}
        {person.kasama_rating != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={11} style={{ color: '#D97706', fill: '#D97706' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: T.primary }}>{person.kasama_rating.toFixed(1)}</span>
          </div>
        )}

        {/* Interest tags + overflow chip */}
        {(shownTags.length > 0 || overflow > 0) && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
            {shownTags.map(tag => {
              const ts = tagStyle(tag, person.id);
              return (
                <span key={tag} style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 12, background: ts.bg, color: ts.color, border: `1px solid ${ts.color}22`, whiteSpace: 'nowrap' }}>
                  {ts.label}
                </span>
              );
            })}
            {overflow > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 12, background: T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>
                +{overflow}
              </span>
            )}
          </div>
        )}

        {/* View CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: T.primary, fontSize: 11, fontWeight: 600, marginTop: 'auto', paddingTop: 4 }}>
          View profile <ArrowRight size={10} />
        </div>
      </div>
    </button>
  );
}

// ── Main tab ─────────────────────────────────────────────────────────────────

const HERO_COPY: Partial<Record<ThemeKey, { headline: string; sub: string }>> = {
  heritage: { headline: 'TARA, SABAY TAYO!', sub: 'Browse categories and find your kasama' },
  rotary: { headline: 'SABAY MAG-SERBISYO!', sub: 'Coordinate projects and chapter events' },
  pasabuy: { headline: 'PASABUY NA TAYO!', sub: 'Find a trusted kasama to buy for you' },
  gaming: { headline: 'LARO NA, KASAMA!', sub: 'Squad up and join gaming lobbies near you' },
  cafe: { headline: 'KAPE TAYO, SABAY!', sub: 'Find café hangouts and meet your people' },
  travel: { headline: 'LAKAD TAYO, PARE!', sub: 'Find travel companions across the Philippines' },
  hiking: { headline: 'AKYAT TAYO, KASAMA!', sub: 'Hit the trails with trusted hiking partners' },
  rideshare: { headline: 'SAKAY SABAY TAYO!', sub: 'Split rides and fuel costs with locals' },
  volunteer: { headline: 'TULONG TAYO SABAY!', sub: 'Join community drives and make an impact' },
};

export default function DiscoverTab({ theme, activeCategory, onCategoryChange, userId, onBrowseCategory }: DiscoverTabProps) {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const currentCategory = CATEGORIES.find(c => c.id === activeCategory) ?? null;
  const detail = currentCategory ? CATEGORY_DETAILS[activeCategory as keyof typeof CATEGORY_DETAILS] : null;
  const heroImage = currentCategory?.image ?? '/cover.png';
  const heroCopy = HERO_COPY[activeCategory] ?? HERO_COPY['heritage']!;

  const liveCategories = CATEGORIES.filter(c => c.status === 'live');
  const soonCategories = CATEGORIES.filter(c => c.status === 'soon');

  const { people, loading: peopleLoading } = useDiscoverPeople(userId);
  const { stats } = useHeroStats();
  const { getStatus, getConnection, sendRequest, acceptRequest, removeConnection, loading: connLoading, error: connError, tableReady } = useConnections(userId);

  const [viewingProfile, setViewingProfile] = useState<DiscoverProfile | null>(null);

  const selectCategory = (id: ThemeKey) => {
    if (activeCategory === id) {
      onCategoryChange('heritage');
    } else {
      onCategoryChange(id);
      setTimeout(() => heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
    }
  };

  return (
    <div style={{ padding: '0 0 24px' }}>

      {/* Hero */}
      <style>{`
        .hero-wrap { display: flex; flex-direction: row; }
        .hero-img-col { flex: 0 0 45%; position: relative; overflow: hidden; }
        .hero-img-mobile { display: none; }
        .hero-img-col img, .hero-img-col .hero-fade { position: absolute; inset: 0; width: 100%; height: 100%; }
        @media (max-width: 540px) {
          .hero-wrap { flex-direction: column; overflow: visible; }
          .hero-img-col { display: none; }
          .hero-img-mobile { display: block; width: 100%; position: relative; flex-shrink: 0; margin-bottom: -48px; z-index: 1; }
          .hero-img-mobile img { width: 100%; height: auto; display: block; }
          .hero-img-mobile .hero-fade { position: absolute; bottom: 0; left: 0; right: 0; height: 100px; background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.55) 100%); }
          .hero-content-col { padding: 20px 18px 72px !important; z-index: 2; }
          .hero-gradient { background: rgba(0,0,0,0.3) !important; }
        }
      `}</style>
      <div ref={heroRef} className="hero-wrap" style={{ position: 'relative', background: theme.primary, minHeight: currentCategory && detail && activeCategory !== 'heritage' ? 420 : 300, transition: 'min-height 300ms ease' }}>

        {/* Mobile-only: image on top */}
        <div className="hero-img-mobile">
          <img key={heroImage + '-m'} src={heroImage} alt="SabayPH" style={{ objectPosition: 'center top' }} />
          <div className="hero-fade" />
          {/* SABAY! badge on mobile */}
          <div className="font-pixel" style={{ position: 'absolute', top: 12, left: 12, background: theme.accent, color: '#F1EDE1', padding: '4px 12px', borderRadius: 20, fontSize: 14, letterSpacing: 1, zIndex: 3 }}>SABAY!</div>
          <div style={{ position: 'absolute', top: 10, right: 12, display: 'flex', gap: 8, alignItems: 'center', zIndex: 3 }}>
            <PixelHeart color="#EEA64C" size={16} />
            <PixelPlus color="#EEA64C" size={11} />
          </div>
        </div>

        {/* Left/below: text content */}
        <div className="hero-content-col" style={{ flex: '1 1 55%', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: currentCategory && detail && activeCategory !== 'heritage' ? 'flex-start' : 'flex-end', padding: '48px 20px 72px 20px', zIndex: 2 }}>
          {/* dark gradient (hidden on mobile via .hero-gradient override) */}
          <div className="hero-gradient" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 75%, rgba(0,0,0,0) 100%)', zIndex: 0 }} />

          {/* SABAY! badge — desktop only (mobile shows it over image above) */}
          <div className="font-pixel hero-badge-desktop" style={{ position: 'absolute', top: 16, left: 16, background: theme.accent, color: '#F1EDE1', padding: '4px 12px', borderRadius: 20, fontSize: 14, letterSpacing: 1, zIndex: 3 }}>SABAY!</div>
          <style>{`.hero-badge-desktop{ display:block; } @media(max-width:540px){ .hero-badge-desktop{ display:none; } }`}</style>
          <div className="hero-deco-desktop" style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 8, alignItems: 'center', zIndex: 3 }}>
            <PixelHeart color="#EEA64C" size={16} />
            <PixelPlus color="#EEA64C" size={11} />
          </div>
          <style>{`.hero-deco-desktop{ display:flex; } @media(max-width:540px){ .hero-deco-desktop{ display:none; } }`}</style>

          {currentCategory && detail && activeCategory !== 'heritage' ? (
            /* ── Category detail inside hero ── */
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
              {/* Name + status badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <currentCategory.Icon size={18} style={{ color: '#fff', opacity: 0.9 }} strokeWidth={1.8} />
                <p className="font-pixel" style={{ fontSize: 18, color: '#F1EDE1', margin: 0, letterSpacing: 2, textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>{currentCategory.name.toUpperCase()}</p>
                <span style={{ fontSize: 9, fontWeight: 700, background: currentCategory.status === 'live' ? theme.accent : 'rgba(255,255,255,0.25)', color: '#F1EDE1', padding: '2px 7px', borderRadius: 8, letterSpacing: 0.5 }}>
                  {currentCategory.status === 'live' ? 'LIVE' : 'SOON'}
                </span>
              </div>

              {/* Description */}
              <p style={{ fontSize: 12, color: 'rgba(241,237,225,0.85)', margin: 0, lineHeight: 1.6, fontFamily: '"DM Sans", system-ui, sans-serif', maxWidth: 260 }}>{detail.description}</p>

              {/* Highlights */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {detail.highlights.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <h.Icon size={13} strokeWidth={1.8} style={{ color: '#F1EDE1' }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'rgba(241,237,225,0.9)', fontFamily: '"DM Sans", system-ui, sans-serif' }}>{h.label}</span>
                  </div>
                ))}
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                {detail.stats.map((s, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', padding: '7px 4px', background: 'rgba(255,255,255,0.12)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)' }}>
                    <p className="font-display" style={{ fontSize: 15, fontWeight: 800, color: '#F1EDE1', margin: 0 }}>{s.value}</p>
                    <p style={{ fontSize: 10, color: 'rgba(241,237,225,0.7)', margin: '1px 0 0', fontFamily: '"DM Sans", system-ui, sans-serif' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {currentCategory.status === 'live' ? (
                <button onClick={() => onBrowseCategory?.(activeCategory as CategoryId)} style={{ alignSelf: 'flex-start', height: 38, padding: '0 18px', borderRadius: 19, border: 'none', background: '#fff', color: theme.primary, fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  Browse Rooms <ArrowRight size={14} />
                </button>
              ) : (
                <p className="font-pixel" style={{ fontSize: 11, color: 'rgba(241,237,225,0.6)', margin: '2px 0 0', letterSpacing: 1 }}>LAUNCHING SOON</p>
              )}
            </div>
          ) : (
            /* ── Default hero text ── */
            <div style={{ position: 'relative', zIndex: 2, marginBottom: 40 }}>
              <p key={activeCategory + '-h'} className="font-pixel" style={{ fontSize: 22, color: '#F1EDE1', margin: '0 0 4px', letterSpacing: 2, textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>{heroCopy.headline}</p>
              <p key={activeCategory + '-s'} style={{ fontSize: 13, color: 'rgba(241,237,225,0.88)', margin: 0, fontFamily: '"DM Sans", system-ui, sans-serif' }}>{heroCopy.sub}</p>
            </div>
          )}
        </div>

        {/* Right: image — desktop only */}
        <div className="hero-img-col">
          <img
            key={heroImage}
            src={heroImage}
            alt="SabayPH"
            className="ml-12"
            style={{ objectFit: 'cover', objectPosition: 'center top', transition: 'opacity 300ms ease' }}
          />
          <div className="ml-12 hero-fade" style={{ background: 'linear-gradient(to left, rgba(0,0,0,0) 50%, rgba(0,0,0,0.25) 100%)' }} />
        </div>

        {/* ── Realtime stats bar ── */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', zIndex: 4 }}>
          {[
            { Icon: Users, value: stats.activeMembers, label: 'Kasama Members' },
            { Icon: BookOpen, value: stats.activeRooms, label: 'Active Rooms' },
            { Icon: LayoutGrid, value: 4, label: 'Categories' },
          ].map(({ Icon, value, label }, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px 10px 10px', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', borderTop: '1px solid rgba(255,255,255,0.12)', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.12)' : 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={14} style={{ color: '#F1EDE1' }} strokeWidth={1.8} />
              </div>
              <div>
                <p className="font-display" style={{ fontSize: 16, fontWeight: 800, color: '#F1EDE1', margin: 0, lineHeight: 1 }}>{value.toLocaleString()}</p>
                <p style={{ fontSize: 10, color: 'rgba(241,237,225,0.65)', margin: '2px 0 0', fontFamily: '"DM Sans",system-ui,sans-serif', whiteSpace: 'nowrap' }}>{label}</p>
              </div>
              {/* live pulse dot */}
              <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 6px #4ADE80', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── People section ── */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <p className="font-pixel" style={{ fontSize: 13, color: theme.accent, margin: '0 0 2px', letterSpacing: 1 }}>MEET THE KASAMA</p>
            <h2 className="font-display" style={{ fontSize: 20, fontWeight: 800, color: theme.text, margin: 0, lineHeight: 1.2 }}>
              {people.length > 0 ? `${people.length} members active` : 'Find your people'}
            </h2>
          </div>
          {people.filter(p => p.is_online).length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: '#DCFCE7', border: '1px solid #86EFAC' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#15803D', display: 'inline-block' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#15803D' }}>{people.filter(p => p.is_online).length} online</span>
            </div>
          )}
        </div>

        {peopleLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '28px 0', color: theme.textMuted }}>
            <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13 }}>Loading kasama…</span>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : people.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', border: `2px dashed ${theme.border}`, borderRadius: 16, color: theme.textMuted }}>
            <UserPlus size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
            <p style={{ fontSize: 13, margin: 0 }}>No kasama visible yet.<br />Complete your profile to appear here!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
            <style>{`div::-webkit-scrollbar{display:none}`}</style>
            {people.map(person => (
              <PersonCard key={person.id} person={person} theme={theme} onView={() => setViewingProfile(person)} />
            ))}
          </div>
        )}
      </div>

      {/* Category picker */}
      <div style={{ padding: '24px 16px 0' }}>
        <p className="font-pixel" style={{ fontSize: 14, color: theme.accent, margin: '0 0 4px', letterSpacing: 1 }}>PICK YOUR VIBE</p>
        <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: theme.text, margin: '0 0 16px', lineHeight: 1.2 }}>Find your people.</h2>

        {/* Live categories */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
          {liveCategories.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => selectCategory(cat.id)}
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 6px', borderRadius: 14, minHeight: 80, background: isActive ? theme.primary : theme.surface, color: isActive ? theme.bg : theme.text, border: `2px solid ${isActive ? theme.primary : theme.border}`, cursor: 'pointer', transition: 'all 250ms ease', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
                <span style={{ position: 'absolute', top: -8, right: 4, background: theme.accent, color: '#F1EDE1', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 8, letterSpacing: 0.5 }}>LIVE</span>
                <cat.Icon size={22} strokeWidth={1.5} />
                <span className="font-display" style={{ fontSize: 11, fontWeight: 700, marginTop: 6 }}>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Coming soon label */}
        <p className="font-pixel" style={{ fontSize: 11, color: theme.textMuted, margin: '16px 0 8px', letterSpacing: 1 }}>COMING SOON</p>

        {/* Soon categories */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {soonCategories.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => selectCategory(cat.id)}
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 6px', borderRadius: 14, minHeight: 80, background: isActive ? theme.primary : theme.surface, color: isActive ? theme.bg : theme.text, border: `2px solid ${isActive ? theme.primary : theme.border}`, cursor: 'pointer', opacity: 0.75, transition: 'all 250ms ease', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
                <span className="font-pixel" style={{ position: 'absolute', top: -8, right: 4, background: isActive ? theme.bg : theme.surfaceAlt, color: isActive ? theme.text : theme.textMuted, fontSize: 9, padding: '2px 5px', borderRadius: 7 }}>SOON</span>
                <cat.Icon size={22} strokeWidth={1.5} />
                <span className="font-display" style={{ fontSize: 11, fontWeight: 700, marginTop: 6 }}>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>


      {/* Features */}
      <div style={{ padding: '28px 16px 0' }}>
        <p className="font-pixel" style={{ fontSize: 14, color: theme.accent, margin: '0 0 4px', letterSpacing: 1 }}>WHAT YOU GET</p>
        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 800, color: theme.text, margin: '0 0 16px', lineHeight: 1.2 }}>Built for real-world coordination.</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '14px', background: theme.surface, border: `1.5px solid ${theme.border}`, borderRadius: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: theme.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.primary }}>
                <f.Icon size={20} strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-display" style={{ fontSize: 15, fontWeight: 700, color: theme.text, margin: '0 0 2px' }}>{f.title}</p>
                <p style={{ fontSize: 13, color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust */}
      <div style={{ padding: '28px 16px 0' }}>
        <div style={{ background: theme.surface, border: `3px solid ${theme.text}`, borderRadius: 20, boxShadow: `6px 6px 0 ${theme.text}`, overflow: 'hidden' }}>
          <div style={{ height: 160, overflow: 'hidden', background: theme.surfaceAlt, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: `radial-gradient(circle, ${theme.border} 1.5px, transparent 1.5px)`, backgroundSize: '20px 20px' }} />
            <img src="/safe.png" alt="Verified member" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom' }} />
            <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 8 }}>
              {[0, 1, 2].map(i => <PixelHeart key={i} color={theme.accent} size={16} />)}
            </div>
          </div>
          <div style={{ padding: '20px' }}>
            <p className="font-pixel" style={{ fontSize: 14, color: theme.accent, margin: '0 0 4px', letterSpacing: 1 }}>TRUST COMES FIRST</p>
            <h3 className="font-display" style={{ fontSize: 20, fontWeight: 800, color: theme.text, margin: '0 0 8px', lineHeight: 1.2 }}>Safety is not optional.</h3>
            <p style={{ fontSize: 13, color: theme.textMuted, margin: '0 0 16px', lineHeight: 1.6 }}>Every SabayPH member is verified. Reputation follows you across all rooms.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {TRUST_ITEMS.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                    <Check size={13} strokeWidth={3} style={{ color: theme.bg }} />
                  </div>
                  <div>
                    <p className="font-display" style={{ fontSize: 14, fontWeight: 700, color: theme.text, margin: '0 0 1px' }}>{item.title}</p>
                    <p style={{ fontSize: 12, color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div style={{ margin: '28px 16px 0', padding: '28px 20px', background: theme.text, borderRadius: 20, textAlign: 'center', transition: 'background 600ms ease' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <PixelHeart color={theme.accent} size={16} />
          <PixelPlus color={theme.highlight} size={12} />
          <PixelHeart color={theme.accent} size={16} />
        </div>
        <p className="font-display" style={{ fontSize: 22, fontWeight: 800, color: theme.bg, lineHeight: 1.2, margin: '0 0 8px' }}>
          <span style={{ color: theme.highlight }}>Sabay-sabay</span> tayo.<br />Mas masaya kapag kasama.
        </p>
        <p style={{ fontSize: 13, color: theme.bg, opacity: 0.7, margin: 0 }}>
          Building the trusted way Filipinos coordinate real-world adventures.
        </p>
      </div>

      {/* Profile view modal */}
      {viewingProfile && (
        <ProfileViewModal
          person={viewingProfile}
          theme={theme}
          connectionStatus={getStatus(viewingProfile.id)}
          connectionLoading={connLoading}
          connectionError={connError}
          tableReady={tableReady}
          connection={getConnection(viewingProfile.id)}
          onSendRequest={() => sendRequest(viewingProfile.id)}
          onAcceptRequest={() => {
            const c = getConnection(viewingProfile.id);
            if (c) acceptRequest(c.id);
          }}
          onRemoveConnection={() => {
            const c = getConnection(viewingProfile.id);
            if (c) removeConnection(c.id);
          }}
          onClose={() => setViewingProfile(null)}
        />
      )}
    </div>
  );
}
