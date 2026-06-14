import { PixelHeart } from '@/components/common/PixelDecorations';
import type { Theme } from '@/types';

interface LandingFooterProps {
  theme: Theme;
}

export function LandingFooter({ theme }: LandingFooterProps) {
  return (
    <footer
      className="px-6 py-12 lg:px-12"
      style={{
        background: theme.surfaceAlt,
        borderTop: `1px solid ${theme.border}`,
        transition: 'all 600ms ease',
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <img src="/sabayph_logo_tp.png" alt="SabayPH logo" className="h-10 w-10 object-contain" />
              <span className="font-display text-xl font-bold" style={{ color: theme.text }}>
                Sabay<span style={{ color: theme.accent }}>PH</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm" style={{ color: theme.textMuted }}>
              A trusted coordination platform for real-world group activity. Built in Mindanao, made for the Philippines.
            </p>
          </div>
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wide" style={{ color: theme.text }}>
              Product
            </p>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: theme.textMuted }}>
              <li><a href="#categories" className="hover:opacity-70">Categories</a></li>
              <li><a href="#features" className="hover:opacity-70">Features</a></li>
              <li><a href="#trust" className="hover:opacity-70">Trust &amp; Safety</a></li>
            </ul>
          </div>
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wide" style={{ color: theme.text }}>
              Company
            </p>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: theme.textMuted }}>
              <li><a href="#" className="hover:opacity-70">About</a></li>
              <li><a href="#" className="hover:opacity-70">Contact</a></li>
              <li><a href="#" className="hover:opacity-70">Privacy</a></li>
            </ul>
          </div>
        </div>
        <div
          className="mt-10 flex flex-col items-start justify-between gap-3 border-t pt-6 sm:flex-row sm:items-center"
          style={{ borderColor: theme.border }}
        >
          <p className="text-xs" style={{ color: theme.textMuted }}>
            © {new Date().getFullYear()} SabayPH. Made with <PixelHeart color={theme.accent} size={10} /> in the Philippines.
          </p>
          <p className="font-pixel text-sm" style={{ color: theme.accent }}>
            TARA, SABAY TAYO!
          </p>
        </div>
      </div>
    </footer>
  );
}
