import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PixelHeart } from '@/components/common/PixelDecorations';
import type { Theme } from '@/types';

interface WaitlistSectionProps {
  theme: Theme;
  onLoginClick?: () => void;
}

export function WaitlistSection({ theme, onLoginClick }: WaitlistSectionProps) {
  return (
    <section id="join" className="px-6 py-20 lg:px-12">
      <div
        className="mx-auto max-w-3xl rounded-3xl text-center px-8 py-16"
        style={{ background: theme.text, border: `3px solid ${theme.text}`, boxShadow: `8px 8px 0 ${theme.primary}` }}
      >
        <div className="flex justify-center gap-3 mb-6">
          <PixelHeart color={theme.highlight} size={18} />
          <PixelHeart color={theme.accent} size={18} />
          <PixelHeart color={theme.highlight} size={18} />
        </div>
        <p className="font-pixel text-base uppercase tracking-widest mb-2" style={{ color: theme.highlight }}>
          Tara na, kasama!
        </p>
        <h2 className="font-display mt-2 text-4xl font-bold leading-tight sm:text-5xl mb-4" style={{ color: theme.bg }}>
          Ready to find your people?
        </h2>
        <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: theme.bg, opacity: 0.75 }}>
          SabayPH is live. Sign in or create your account and join the kasama community today.
        </p>
        <Button
          size="lg"
          className="rounded-full px-10 py-6 text-base font-bold"
          style={{ background: theme.bg, color: theme.text, border: 'none' }}
          onClick={onLoginClick}
        >
          Get started — it's free
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
