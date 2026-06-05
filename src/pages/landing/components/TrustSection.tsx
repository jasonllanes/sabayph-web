import { Check } from 'lucide-react';
import { PixelHeart } from '@/components/common/PixelDecorations';
import { TRUST_ITEMS } from '@/data/themes';
import type { Theme } from '@/types';

interface TrustSectionProps {
  theme: Theme;
}

export function TrustSection({ theme }: TrustSectionProps) {
  return (
    <section id="trust" className="px-6 py-20 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-pixel text-base uppercase tracking-wide" style={{ color: theme.accent }}>
              Trust comes first
            </p>
            <h2 className="font-display mt-2 text-4xl font-bold leading-tight sm:text-5xl" style={{ color: theme.text }}>
              Going with strangers shouldn&apos;t feel like one.
            </h2>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: theme.textMuted }}>
              Every SabayPH room is built on verified identity, reputation history,
              and approval controls — so organizers stay in charge and members stay safe.
            </p>
            <ul className="mt-8 space-y-4">
              {TRUST_ITEMS.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div
                    className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ background: theme.primary, color: theme.bg }}
                  >
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div>
                    <p className="font-display font-bold" style={{ color: theme.text }}>{item.title}</p>
                    <p className="text-sm" style={{ color: theme.textMuted }}>{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="relative overflow-hidden rounded-3xl"
            style={{
              border: `3px solid ${theme.text}`,
              boxShadow: `8px 8px 0 ${theme.text}`,
              transition: 'border-color 600ms ease, box-shadow 600ms ease',
              background: theme.surfaceAlt,
            }}
          >
            <div
              className="absolute inset-0 z-10 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle, ${theme.text} 1.5px, transparent 1.5px)`,
                backgroundSize: '24px 24px',
              }}
            />
            <img
              src="https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/safe.png"
              alt="SabayPH trust & safety mascot"
              className="relative z-20 w-full object-contain"
              style={{ imageRendering: 'pixelated', display: 'block' }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-4"
              style={{ background: `${theme.text}D9` }}
            >
              <div>
                <p className="font-pixel text-lg leading-none" style={{ color: theme.highlight }}>
                  VERIFIED MEMBER
                </p>
                <p className="mt-1 text-xs font-medium" style={{ color: `${theme.bg}CC` }}>
                  Identity checked. Reputation earned.
                </p>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <PixelHeart key={i} color={theme.accent} size={14} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
