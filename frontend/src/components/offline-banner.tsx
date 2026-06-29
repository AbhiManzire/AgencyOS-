'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Displays a banner when the browser loses network connectivity. */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const updateStatus = (): void => {
      setIsOffline(!navigator.onLine);
    };

    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div
      role="status"
      className={cn(
        'fixed inset-x-0 top-0 z-[200] flex items-center justify-center gap-2',
        'border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm text-amber-950',
        'dark:text-amber-100',
      )}
    >
      <WifiOff className="size-4 shrink-0" aria-hidden="true" />
      <span>You are offline. Changes may not save until your connection returns.</span>
    </div>
  );
}
