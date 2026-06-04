export interface LevelInfo {
  level:     number;
  title:     string;
  xp:        number;   // current XP
  xpForNext: number;   // XP needed for next level (0 if max)
  xpMin:     number;   // XP at start of current level
  progress:  number;   // 0–100 % toward next level
  isMax:     boolean;
}

// 1 room = 10 XP, max 200 XP
const XP_PER_ROOM = 10;

const LEVELS = [
  { level: 1, title: 'Bagong Kasama',       minXp: 0   },
  { level: 2, title: 'Maaasahan',           minXp: 40  },
  { level: 3, title: 'Tiwala',              minXp: 80  },
  { level: 4, title: 'Gabay',               minXp: 120 },
  { level: 5, title: 'Haligi ng Komunidad', minXp: 160 },
];

const MAX_XP = 200;

export function getLevelInfo(roomsJoined: number): LevelInfo {
  const xp    = Math.min(roomsJoined * XP_PER_ROOM, MAX_XP);
  const curr  = [...LEVELS].reverse().find(l => xp >= l.minXp) ?? LEVELS[0];
  const next  = LEVELS.find(l => l.level === curr.level + 1) ?? null;
  const isMax = curr.level === 5;

  const xpMin     = curr.minXp;
  const xpForNext = next ? next.minXp : MAX_XP;
  const span      = xpForNext - xpMin;
  const progress  = isMax ? 100 : Math.min(((xp - xpMin) / span) * 100, 100);

  return { level: curr.level, title: curr.title, xp, xpForNext, xpMin, progress, isMax };
}
