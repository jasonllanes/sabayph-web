import { useState, useEffect } from 'react';

const KEY = 'sabayph_dark_mode';

export function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    const stored = localStorage.getItem(KEY);
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem(KEY, String(dark));
  }, [dark]);

  const toggle = () => setDark(prev => !prev);

  return { dark, toggle };
}
