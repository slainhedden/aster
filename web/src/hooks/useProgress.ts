import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'aster-guide-progress';

export function useProgress() {
  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...checked]));
  }, [checked]);

  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const isChecked = useCallback((id: string) => checked.has(id), [checked]);

  const reset = useCallback(() => setChecked(new Set()), []);

  const totalChecked = checked.size;

  return { toggle, isChecked, reset, totalChecked };
}
