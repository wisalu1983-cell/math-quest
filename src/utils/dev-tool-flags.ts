export const DEV_LOCK_HEARTS_STORAGE_KEY = 'mq_dev_lock_hearts';

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function isDevHeartLockEnabled(): boolean {
  return getStorage()?.getItem(DEV_LOCK_HEARTS_STORAGE_KEY) === '1';
}

export function setDevHeartLockEnabled(enabled: boolean): void {
  const storage = getStorage();
  if (!storage) return;
  if (enabled) {
    storage.setItem(DEV_LOCK_HEARTS_STORAGE_KEY, '1');
  } else {
    storage.removeItem(DEV_LOCK_HEARTS_STORAGE_KEY);
  }
}
