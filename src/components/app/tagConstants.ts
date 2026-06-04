export const PRONOUNS = [
  { label: 'He/Him',    color: '#2563EB', bg: '#EFF6FF' },
  { label: 'She/Her',   color: '#DB2777', bg: '#FDF2F8' },
  { label: 'They/Them', color: '#7C3AED', bg: '#F5F3FF' },
  { label: 'She/They',  color: '#A21CAF', bg: '#FAF5FF' },
  { label: 'He/They',   color: '#4F46E5', bg: '#EEF2FF' },
];

export const INTEREST_TAGS = [
  { label: 'Gamer',        emoji: '🎮', color: '#4F46E5', bg: '#EEF2FF' },
  { label: 'Runner',       emoji: '🏃', color: '#059669', bg: '#ECFDF5' },
  { label: 'Foodie',       emoji: '🍜', color: '#D97706', bg: '#FFFBEB' },
  { label: 'Traveler',     emoji: '✈️', color: '#0284C7', bg: '#F0F9FF' },
  { label: 'Bookworm',     emoji: '📚', color: '#7C3AED', bg: '#F5F3FF' },
  { label: 'Coffee Lover', emoji: '☕', color: '#92400E', bg: '#FFFBEB' },
  { label: 'Hiker',        emoji: '🏔️', color: '#15803D', bg: '#F0FDF4' },
  { label: 'Volunteer',    emoji: '🤝', color: '#0369A1', bg: '#F0F9FF' },
  { label: 'Coder',        emoji: '💻', color: '#1D4ED8', bg: '#EFF6FF' },
  { label: 'Artist',       emoji: '🎨', color: '#DC2626', bg: '#FEF2F2' },
  { label: 'Musician',     emoji: '🎵', color: '#9333EA', bg: '#FAF5FF' },
  { label: 'Photographer', emoji: '📸', color: '#C2410C', bg: '#FFF7ED' },
  { label: 'Fitness',      emoji: '🏋️', color: '#B91C1C', bg: '#FEF2F2' },
  { label: 'Wellness',     emoji: '🧘', color: '#0F766E', bg: '#F0FDFA' },
];

export const OTHERS_PALETTE = [
  { color: '#6D28D9', bg: '#F5F3FF' },
  { color: '#0E7490', bg: '#ECFEFF' },
  { color: '#B45309', bg: '#FFFBEB' },
  { color: '#BE185D', bg: '#FDF2F8' },
  { color: '#1D4ED8', bg: '#EFF6FF' },
  { color: '#047857', bg: '#ECFDF5' },
];

export function othersColor(userId = '') {
  const idx = [...userId].reduce((s, c) => s + c.charCodeAt(0), 0) % OTHERS_PALETTE.length;
  return OTHERS_PALETTE[idx];
}

export function getDefaultAvatar(gender?: string | null, tags?: string[] | null): string {
  const isFemale =
    gender === 'Babae' ||
    (tags ?? []).some(t => t === 'She/Her' || t === 'She/They');
  return isFemale ? '/avatar_girl.png' : '/avatar.png';
}

export function tagStyle(tag: string, userId: string) {
  const pr = PRONOUNS.find(p => p.label === tag);
  if (pr) return { label: tag, color: pr.color, bg: pr.bg };
  const it = INTEREST_TAGS.find(t => t.label === tag);
  if (it) return { label: `${it.emoji} ${tag}`, color: it.color, bg: it.bg };
  if (tag === 'Others') { const oc = othersColor(userId); return { label: '✨ Others', color: oc.color, bg: oc.bg }; }
  return { label: tag, color: '#6B7280', bg: '#F3F4F6' };
}
