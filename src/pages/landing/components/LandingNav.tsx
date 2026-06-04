import { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Theme } from '@/types';

interface LandingNavProps {
  theme: Theme;
  onLoginClick?: () => void;
  scrollTo: (id: string) => void;
}

export function LandingNav({ theme, onLoginClick, scrollTo }: LandingNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScrollTo = (id: string) => {
    scrollTo(id);
    setMobileMenuOpen(false);
  };

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-md"
      style={{
        background: `${theme.bg}E6`,
        borderBottom: `1px solid ${theme.border}`,
        transition: 'all 600ms ease',
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="SabayPH mascot" className="h-10 w-10 object-contain" />
          <span className="font-display text-xl font-bold" style={{ color: theme.text }}>
            Sabay<span style={{ color: theme.accent }}>PH</span>
          </span>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          {['categories', 'features', 'trust', 'join'].map((id) => (
            <a
              key={id}
              href={`#${id}`}
              className="text-sm font-medium hover:opacity-70"
              style={{ color: theme.text }}
            >
              {id === 'trust' ? 'Trust & Safety' : id.charAt(0).toUpperCase() + id.slice(1)}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {onLoginClick && (
            <button
              className="hidden md:inline-flex text-sm font-medium hover:opacity-70"
              style={{ color: theme.text, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={onLoginClick}
            >
              Sign in
            </button>
          )}
          <Button
            className="hidden rounded-full font-medium md:inline-flex"
            style={{ background: theme.primary, color: theme.bg, border: 'none' }}
            onClick={onLoginClick}
          >
            Get started
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <button
            className="md:hidden p-1"
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen
              ? <X style={{ color: theme.text }} />
              : <Menu style={{ color: theme.text }} />
            }
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="md:hidden px-6 pb-4 flex flex-col gap-4"
          style={{ borderTop: `1px solid ${theme.border}`, background: `${theme.bg}F5` }}
        >
          {['categories', 'features', 'trust', 'join'].map((id) => (
            <button
              key={id}
              onClick={() => handleScrollTo(id)}
              className="text-left text-sm font-medium capitalize hover:opacity-70"
              style={{ color: theme.text }}
            >
              {id === 'trust' ? 'Trust & Safety' : id.charAt(0).toUpperCase() + id.slice(1)}
            </button>
          ))}
          <div className="flex gap-3">
            <Button
              className="rounded-full font-medium w-fit"
              style={{ background: theme.primary, color: theme.bg, border: 'none' }}
              onClick={() => { setMobileMenuOpen(false); onLoginClick?.(); }}
            >
              Get started <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            {onLoginClick && (
              <Button
                variant="outline"
                className="rounded-full font-medium w-fit"
                style={{ borderColor: theme.text, color: theme.text, background: 'transparent' }}
                onClick={() => { setMobileMenuOpen(false); onLoginClick(); }}
              >
                Sign in
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
