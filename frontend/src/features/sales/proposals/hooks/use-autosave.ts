import { useEffect, useRef, useState } from 'react';

export type AutosaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface UseAutosaveOptions {
  readonly enabled: boolean;
  readonly isDirty: boolean;
  readonly delayMs?: number;
  readonly onSave: () => Promise<void>;
}

/** Debounced autosave hook for proposal editor content. */
export function useAutosave({ enabled, isDirty, delayMs = 1500, onSave }: UseAutosaveOptions) {
  const [state, setState] = useState<AutosaveState>('idle');
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    if (!enabled || !isDirty) {
      return;
    }

    setState('pending');

    const timer = window.setTimeout(() => {
      setState('saving');
      void onSaveRef
        .current()
        .then(() => {
          setState('saved');
        })
        .catch(() => {
          setState('error');
        });
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [delayMs, enabled, isDirty]);

  return { state };
}
