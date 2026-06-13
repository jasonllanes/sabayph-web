import { ArrowRight, Shield, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PixelHeart, PixelPlus } from '@/components/common/PixelDecorations';
import type { Theme } from '@/types';

interface HeroSectionProps {
  theme: Theme;
  scrollTo: (id: string) => void;
}

export function HeroSection({ theme, scrollTo }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-16 lg:px-12 lg:pt-24">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
        <div className="fade-rise">
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium"
            style={{ background: theme.surfaceAlt, color: theme.text }}
          >
            <PixelHeart color={theme.accent} size={12} />
            <span className="font-pixel text-base">PROUDLY MADE IN THE PHILIPPINES</span>
          </div>
          <h1
            className="font-display text-5xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl"
            style={{ color: theme.text }}
          >
            Wherever you go,<br />
            <span style={{ color: theme.primary }}>someone&apos;s</span>{' '}
            <span style={{ color: theme.accent }}>always</span><br />
            by your side.
          </h1>
          <p
            className="mt-6 max-w-xl text-lg leading-relaxed"
            style={{ color: theme.textMuted }}
          >
            SabayPH is the trusted way to find your kasama for real-world adventures —
            from Rotary service projects to PasaBuy errands, gaming squads, and café hangouts.
            No more going alone.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              className="rounded-full px-7 py-6 text-base font-medium"
              style={{ background: theme.primary, color: theme.bg, border: 'none' }}
              onClick={() => scrollTo('join')}
            >
              Get started — it's free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-7 py-6 text-base font-medium"
              style={{ borderColor: theme.text, color: theme.text, background: 'transparent' }}
              onClick={() => scrollTo('categories')}
            >
              Explore categories
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-6 text-sm" style={{ color: theme.textMuted }}>
            <div className="flex items-center gap-2">
              <Shield size={16} style={{ color: theme.primary }} />
              <span>Verified members</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} style={{ color: theme.primary }} />
              <span>Launching in Mindanao</span>
            </div>
          </div>
        </div>

        <div className="fade-rise relative" style={{ animationDelay: '150ms' }}>
          <div
            className="float-soft relative aspect-square overflow-hidden rounded-3xl"
            style={{
              background: theme.surface,
              border: `3px solid ${theme.text}`,
              boxShadow: `8px 8px 0 ${theme.text}`,
            }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
              }}
            />
            <img
              src="https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/logo.png"
              alt="SabayPH mascot"
              className="absolute inset-0 h-full w-full object-contain p-8"
            />
            <div className="absolute right-4 top-4">
              <PixelHeart color={theme.accent} size={20} />
            </div>
            <div className="absolute bottom-4 left-4">
              <PixelPlus color={theme.highlight} size={14} />
            </div>
          </div>
          <div
            className="absolute -bottom-4 -right-4 rounded-full px-4 py-2 font-pixel text-lg shadow-lg"
            style={{ background: theme.accent, color: '#F1EDE1' }}
          >
            SABAY!
          </div>
        </div>
      </div>
    </section>
  );
}
