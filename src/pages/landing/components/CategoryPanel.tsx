import { ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PixelHeart, PixelPlus } from '@/components/common/PixelDecorations';
import { CATEGORY_DETAILS } from '@/data/themes';
import type { Category, Theme } from '@/types';

interface CategoryPanelProps {
  theme: Theme;
  displayCategory: Category | null;
  panelOpen: boolean;
  panelRef: React.RefObject<HTMLDivElement | null>;
  scrollTo: (id: string) => void;
  onClose: () => void;
}

export function CategoryPanel({ theme, displayCategory, panelOpen, panelRef, scrollTo, onClose }: CategoryPanelProps) {
  return (
    <div
      ref={panelRef}
      style={{
        display: 'grid',
        gridTemplateRows: panelOpen ? '1fr' : '0fr',
        opacity: panelOpen ? 1 : 0,
        transition: 'grid-template-rows 500ms ease, opacity 400ms ease',
      }}
    >
      <div style={{ overflow: 'hidden' }}>
        {displayCategory && (() => {
          const details = CATEGORY_DETAILS[displayCategory.id];
          return (
            <div
              className="mt-8 overflow-hidden rounded-3xl"
              style={{
                background: theme.surface,
                border: `2px solid ${theme.border}`,
                transition: 'background 600ms ease, border-color 600ms ease',
              }}
            >
              <div className="grid lg:grid-cols-2">

                {/* LEFT — image / mascot */}
                <div
                  className="relative flex min-h-[280px] items-center justify-center overflow-hidden lg:min-h-[420px]"
                  style={{ background: theme.surfaceAlt, transition: 'background 600ms ease' }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`,
                      backgroundSize: '16px 16px',
                      opacity: 0.25,
                    }}
                  />

                  {displayCategory.image ? (
                    <img
                      src={displayCategory.image}
                      alt={`${displayCategory.name} mascot`}
                      className="relative z-10 h-56 w-56 object-contain drop-shadow-xl lg:h-72 lg:w-72"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : (
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      <div
                        className="flex h-32 w-32 items-center justify-center rounded-2xl"
                        style={{
                          background: theme.surface,
                          border: `3px solid ${theme.border}`,
                          boxShadow: `4px 4px 0 ${theme.border}`,
                        }}
                      >
                        <displayCategory.Icon size={64} strokeWidth={1.2} style={{ color: theme.primary }} />
                      </div>
                    </div>
                  )}

                  <div
                    className="absolute bottom-0 left-0 right-0 px-6 py-4"
                    style={{ background: `${theme.text}CC` }}
                  >
                    <p className="font-pixel text-xl" style={{ color: theme.highlight }}>
                      {displayCategory.name.toUpperCase()}
                    </p>
                    <p className="text-xs font-medium" style={{ color: `${theme.bg}CC` }}>
                      {displayCategory.tagline}
                    </p>
                  </div>

                  <div className="absolute right-4 top-4">
                    <PixelPlus color={theme.highlight} size={12} />
                  </div>
                  <div className="absolute left-4 top-4">
                    <PixelHeart color={theme.accent} size={16} />
                  </div>
                </div>

                {/* RIGHT — info */}
                <div className="flex flex-col justify-center gap-6 p-8 lg:p-10">
                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <span
                        className="rounded-full px-3 py-1 text-xs font-bold"
                        style={{
                          background: displayCategory.status === 'live' ? theme.accent : theme.surfaceAlt,
                          color: displayCategory.status === 'live' ? '#F1EDE1' : theme.textMuted,
                        }}
                      >
                        {displayCategory.status === 'live' ? 'AVAILABLE NOW' : 'COMING SOON'}
                      </span>
                    </div>
                    <h3 className="font-display text-3xl font-bold leading-tight sm:text-4xl" style={{ color: theme.text }}>
                      {displayCategory.name} rooms,<br />the SabayPH way.
                    </h3>
                    <p className="mt-3 text-base leading-relaxed" style={{ color: theme.textMuted }}>
                      {details?.description}
                    </p>
                  </div>

                  {details?.highlights && (
                    <ul className="space-y-2.5">
                      {details.highlights.map((h, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <div
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                            style={{ background: theme.surfaceAlt, color: theme.primary }}
                          >
                            <h.Icon size={16} strokeWidth={1.5} />
                          </div>
                          <span className="text-sm font-medium" style={{ color: theme.text }}>{h.label}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {details?.stats && (
                    <div
                      className="grid grid-cols-3 gap-3 rounded-2xl p-4"
                      style={{ background: theme.surfaceAlt, transition: 'background 600ms ease' }}
                    >
                      {details.stats.map((s, i) => (
                        <div key={i} className="text-center">
                          <p className="font-display text-2xl font-extrabold" style={{ color: theme.primary }}>
                            {s.value}
                          </p>
                          <p className="mt-0.5 text-xs" style={{ color: theme.textMuted }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {displayCategory.status === 'live' ? (
                      <Button
                        className="rounded-full"
                        style={{ background: theme.primary, color: theme.bg, border: 'none' }}
                      >
                        Get started <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="rounded-full"
                        style={{ borderColor: theme.primary, color: theme.primary, background: 'transparent' }}
                        onClick={() => scrollTo('waitlist')}
                      >
                        Notify me when it launches
                      </Button>
                    )}
                    <button
                      className="text-xs font-medium underline underline-offset-2 hover:opacity-70"
                      style={{ color: theme.textMuted }}
                      onClick={onClose}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
