import { useState, useEffect } from 'react';

interface ScreenSize {
  width: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

function measure(): ScreenSize {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
  return {
    width: w,
    isMobile: w < 768,
    isTablet: w >= 768 && w < 1024,
    isDesktop: w >= 1024,
  };
}

export function useScreenSize(): ScreenSize {
  const [size, setSize] = useState<ScreenSize>(measure);

  useEffect(() => {
    const fn = () => setSize(measure());
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  return size;
}
