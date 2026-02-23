import { create } from 'zustand';

interface AuthState {
  isUnlocked: boolean;
  lastUnlockedAt: number | null;
  failedAttempts: number;
  lockoutUntil: number | null;

  unlock(): void;
  lock(): void;
  incrementFailedAttempts(): void;
  resetFailedAttempts(): void;
  isLockedOut(): boolean;
  lockoutSecondsRemaining(): number;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isUnlocked: false,
  lastUnlockedAt: null,
  failedAttempts: 0,
  lockoutUntil: null,

  unlock() {
    set({ isUnlocked: true, lastUnlockedAt: Date.now(), failedAttempts: 0, lockoutUntil: null });
  },

  lock() {
    set({ isUnlocked: false });
  },

  incrementFailedAttempts() {
    const attempts = get().failedAttempts + 1;
    const lockoutUntil = attempts >= 5 ? Date.now() + 30_000 : null;
    set({ failedAttempts: attempts, lockoutUntil });
  },

  resetFailedAttempts() {
    set({ failedAttempts: 0, lockoutUntil: null });
  },

  isLockedOut() {
    const { lockoutUntil } = get();
    return lockoutUntil !== null && Date.now() < lockoutUntil;
  },

  lockoutSecondsRemaining() {
    const { lockoutUntil } = get();
    if (!lockoutUntil) return 0;
    return Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
  },
}));
