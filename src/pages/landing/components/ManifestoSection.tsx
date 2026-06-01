import { PixelHeart, PixelPlus } from '@/components/common/PixelDecorations';
import type { Theme } from '@/types';

interface ManifestoSectionProps {
  theme: Theme;
}

export function ManifestoSection({ theme }: ManifestoSectionProps) {
  return (
    <section
      className="px-6 py-24 lg:px-12"
      style={{ background: theme.text, color: theme.bg, transition: 'all 600ms ease' }}
    >
      <div className="mx-auto max-w-5xl text-center">
        <div className="mb-6 flex justify-center gap-2">
          <PixelHeart color={theme.accent} size={20} />
          <PixelPlus color={theme.highlight} size={16} />
          <PixelHeart color={theme.accent} size={20} />
        </div>
        <p
          className="font-display text-4xl font-extrabold leading-[1.1] sm:text-6xl lg:text-7xl"
          style={{ color: theme.bg }}
        >
          <span style={{ color: theme.highlight }}>Sabay-sabay</span> tayo.<br />
          Mas masaya kapag kasama.
        </p>
        <p className="mx-auto mt-8 max-w-2xl text-lg opacity-80" style={{ color: theme.bg }}>
          We&apos;re building the trusted way Filipinos coordinate real-world adventures —
          from your barangay to the next island over.
        </p>
      </div>
    </section>
  );
}
