import { FEATURES } from '@/data/themes';
import type { Theme } from '@/types';

interface FeaturesSectionProps {
  theme: Theme;
}

export function FeaturesSection({ theme }: FeaturesSectionProps) {
  return (
    <section
      id="features"
      className="px-6 py-20 lg:px-12"
      style={{ background: theme.surfaceAlt, transition: 'background 600ms ease' }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 max-w-2xl">
          <p className="font-pixel text-base uppercase tracking-wide" style={{ color: theme.accent }}>
            What you get
          </p>
          <h2 className="font-display mt-2 text-4xl font-bold leading-tight sm:text-5xl" style={{ color: theme.text }}>
            Built for real-world coordination, not endless scrolling.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 transition-all hover:-translate-y-1"
              style={{ background: theme.surface, border: `2px solid ${theme.border}` }}
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: theme.surfaceAlt, color: theme.primary }}
              >
                <f.Icon size={24} strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-xl font-bold" style={{ color: theme.text }}>
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
