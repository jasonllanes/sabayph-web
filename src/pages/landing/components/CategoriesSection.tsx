import React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CategoryPanel } from './CategoryPanel';
import { CATEGORIES } from '@/data/themes';
import type { Category, Theme, ThemeKey } from '@/types';

interface CategoriesSectionProps {
  theme: Theme;
  activeCategory: ThemeKey;
  toggleCategory: (id: ThemeKey) => void;
  setActiveCategory: (id: ThemeKey) => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
  scrollTo: (id: string) => void;
}

export function CategoriesSection({
  theme,
  activeCategory,
  toggleCategory,
  setActiveCategory,
  panelRef,
  scrollTo,
}: CategoriesSectionProps) {
  const panelOpen = activeCategory !== 'heritage';

  const currentCategory = CATEGORIES.find((c) => c.id === activeCategory) ?? null;
  const lastCategoryRef = React.useRef<Category | null>(null);
  if (currentCategory) lastCategoryRef.current = currentCategory;
  const displayCategory = currentCategory ?? lastCategoryRef.current;

  return (
    <section id="categories" className="px-6 py-20 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-pixel text-base uppercase tracking-wide" style={{ color: theme.accent }}>
              Pick your vibe
            </p>
            <h2 className="font-display mt-2 text-4xl font-bold leading-tight sm:text-5xl" style={{ color: theme.text }}>
              Find your people.<br />Pick your vibe.
            </h2>
          </div>
          <p className="max-w-md text-base" style={{ color: theme.textMuted }}>
            Tap any live category to preview the experience. Tap again to close.
          </p>
        </div>

        {/* Live categories */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ gridAutoRows: '1fr' }}>
          {CATEGORIES.filter(c => c.status === 'live').map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className="group relative flex flex-col items-center justify-center rounded-2xl p-4 transition-all duration-200 hover:scale-[1.03]"
                style={{
                  background: isActive ? theme.primary : theme.surface,
                  color: isActive ? theme.bg : theme.text,
                  border: `2px solid ${isActive ? theme.primary : theme.border}`,
                  height: '152px',
                  boxShadow: isActive ? `0 4px 20px ${theme.primary}40` : 'none',
                }}
              >
                <Badge
                  className="absolute -top-2.5 right-3 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: theme.accent, color: '#F1EDE1', border: 'none' }}
                >
                  LIVE
                </Badge>
                <cat.Icon size={28} strokeWidth={1.5} />
                <p className="font-display mt-3 text-base font-bold">{cat.name}</p>
                <p className="font-pixel text-xs opacity-70">{cat.tagline.toUpperCase()}</p>
                {isActive && (
                  <span
                    className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full opacity-60"
                    style={{ background: theme.bg }}
                  >
                    <X size={10} style={{ color: theme.primary }} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Coming soon label */}
        <p className="font-pixel mt-8 mb-3 text-sm uppercase tracking-widest" style={{ color: theme.textMuted }}>
          Coming Soon
        </p>

        {/* Soon categories — non-interactive, dimmed */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ gridAutoRows: '1fr' }}>
          {CATEGORIES.filter(c => c.status === 'soon').map((cat) => (
            <div
              key={cat.id}
              className="relative flex flex-col items-center justify-center rounded-2xl p-4"
              style={{
                background: theme.surface,
                color: theme.textMuted,
                border: `2px solid ${theme.border}`,
                height: '152px',
                opacity: 0.65,
              }}
            >
              <span
                className="font-pixel absolute -top-2.5 right-3 rounded-sm px-2 py-0.5 text-[10px]"
                style={{ background: theme.surfaceAlt, color: theme.textMuted }}
              >
                SOON
              </span>
              <cat.Icon size={28} strokeWidth={1.5} />
              <p className="font-display mt-3 text-base font-bold">{cat.name}</p>
              <p className="font-pixel text-xs opacity-70">{cat.tagline.toUpperCase()}</p>
            </div>
          ))}
        </div>

        <CategoryPanel
          theme={theme}
          displayCategory={displayCategory}
          panelOpen={panelOpen}
          panelRef={panelRef}
          scrollTo={scrollTo}
          onClose={() => setActiveCategory('heritage')}
        />
      </div>
    </section>
  );
}
