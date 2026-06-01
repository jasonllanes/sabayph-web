import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Theme } from '@/types';

interface WaitlistSectionProps {
  theme: Theme;
}

export function WaitlistSection({ theme }: WaitlistSectionProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section id="waitlist" className="px-6 py-20 lg:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-pixel text-base uppercase tracking-wide" style={{ color: theme.accent }}>
          Be the first kasama
        </p>
        <h2 className="font-display mt-2 text-4xl font-bold leading-tight sm:text-5xl" style={{ color: theme.text }}>
          Join the SabayPH waitlist.
        </h2>
        <p className="mt-4 text-lg" style={{ color: theme.textMuted }}>
          Get early access, exclusive launch perks, and a verified badge from day one.
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="h-12 rounded-full border-2 px-5 text-base"
              style={{ background: theme.surface, borderColor: theme.border, color: theme.text }}
            />
            <Button
              type="submit"
              className="h-12 rounded-full px-7 text-base font-medium"
              style={{ background: theme.primary, color: theme.bg, border: 'none' }}
            >
              Join waitlist
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </form>
        ) : (
          <div
            className="mx-auto mt-8 max-w-md rounded-2xl p-6"
            style={{ background: theme.surface, border: `2px solid ${theme.primary}` }}
          >
            <div
              className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: theme.primary }}
            >
              <Check size={20} strokeWidth={3} style={{ color: theme.bg }} />
            </div>
            <p className="font-display text-xl font-bold" style={{ color: theme.text }}>
              Salamat, kasama!
            </p>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
              You&apos;re on the list. We&apos;ll be in touch.
            </p>
          </div>
        )}

        <p className="mt-6 text-xs" style={{ color: theme.textMuted }}>
          No spam. Unsubscribe anytime. We respect your inbox.
        </p>
      </div>
    </section>
  );
}
