import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Domains that support + addressing (strip the +tag)
const PLUS_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
]);

// Gmail also ignores dots in the local part (test.name = testname)
const DOT_DOMAINS = new Set(['gmail.com', 'googlemail.com']);

/**
 * Canonicalises an email so that Gmail/Outlook plus-addressing tricks
 * (test+alias@gmail.com) and Gmail dot-ignoring (t.e.s.t@gmail.com)
 * can't be used to create multiple accounts from one inbox.
 */
export function normalizeEmail(raw: string): string {
  const lower = raw.toLowerCase().trim();
  const at = lower.lastIndexOf('@');
  if (at === -1) return lower;

  let local  = lower.slice(0, at);
  const domain = lower.slice(at + 1);

  // Strip +tag
  if (PLUS_DOMAINS.has(domain)) {
    const plus = local.indexOf('+');
    if (plus !== -1) local = local.slice(0, plus);
  }

  // Remove dots (Gmail treats them as equivalent)
  if (DOT_DOMAINS.has(domain)) {
    local = local.replace(/\./g, '');
  }

  return `${local}@${domain}`;
}
