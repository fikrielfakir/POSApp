import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '@core/store/authStore';
import { getMeta } from '@core/database/dbHelpers';

const DEFAULT_AUTO_LOCK_MINUTES = 5;

export function useAppLock() {
  const { lock, isUnlocked, lastUnlockedAt } = useAuthStore();
  const backgroundTime = useRef<number | null>(null);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        backgroundTime.current = Date.now();
      } else if (state === 'active') {
        if (backgroundTime.current && isUnlocked) {
          const elapsed = Date.now() - backgroundTime.current;
          const autoLockMinutes = parseInt(getMeta('auto_lock_minutes') ?? String(DEFAULT_AUTO_LOCK_MINUTES), 10);
          if (autoLockMinutes > 0 && elapsed > autoLockMinutes * 60 * 1000) {
            lock();
          }
          backgroundTime.current = null;
        }
      }
    });
    return () => sub.remove();
  }, [isUnlocked, lock]);
}
