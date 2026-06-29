const STORAGE_KEY = 'agencyos:active-timer';

export interface PersistedActiveTimer {
  readonly timeEntryId: string;
  readonly taskId: string;
  readonly startTime: string;
}

export function readPersistedActiveTimer(): PersistedActiveTimer | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PersistedActiveTimer;
    if (
      typeof parsed.timeEntryId === 'string' &&
      typeof parsed.taskId === 'string' &&
      typeof parsed.startTime === 'string'
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export function writePersistedActiveTimer(timer: PersistedActiveTimer): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
}

export function clearPersistedActiveTimer(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
