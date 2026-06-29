'use client';

import { useEffect, useState } from 'react';
import {
  computeElapsedSeconds,
  formatElapsedHms,
} from '@/features/time-entries/utils/format-elapsed-time';

/** Ticks every second to display live elapsed time as HH:MM:SS. */
export function useLiveTimer(startTimeIso: string | null, isRunning: boolean): string {
  const [elapsed, setElapsed] = useState(() =>
    startTimeIso !== null ? computeElapsedSeconds(startTimeIso) : 0,
  );

  useEffect(() => {
    if (!isRunning || startTimeIso === null) {
      return;
    }

    const updateElapsed = (): void => {
      setElapsed(computeElapsedSeconds(startTimeIso));
    };

    updateElapsed();
    const intervalId = window.setInterval(updateElapsed, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning, startTimeIso]);

  return formatElapsedHms(elapsed);
}
