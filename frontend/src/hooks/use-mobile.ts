'use client';

import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${String(MOBILE_BREAKPOINT - 1)}px)`);

    const onChange = (): void => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    onChange();
    mediaQuery.addEventListener('change', onChange);
    return () => {
      mediaQuery.removeEventListener('change', onChange);
    };
  }, []);

  return isMobile;
}

export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(min-width: ${String(MOBILE_BREAKPOINT)}px) and (max-width: ${String(TABLET_BREAKPOINT - 1)}px)`,
    );

    const onChange = (): void => {
      const width = window.innerWidth;
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT);
    };

    onChange();
    mediaQuery.addEventListener('change', onChange);
    return () => {
      mediaQuery.removeEventListener('change', onChange);
    };
  }, []);

  return isTablet;
}
