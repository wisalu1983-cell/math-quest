import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { getSupabaseClient } from '@/lib/supabase';
import { repository, setSyncNotify } from '@/repository/local';
import type { User } from '@/types';
import type { GameProgress } from '@/types/gamification';
import { mergeGameProgress, mergeHistoryRecords, mergeRankMatchSessions } from './merge';
import {
  fetchRemoteGameProgress,
  fetchRemoteHistory,
  fetchRemoteProfile,
  fetchRemoteRankMatchSessions,
  upsertRemoteGameProgress,
  upsertRemoteHistoryRecords,
  upsertRemoteProfile,
  upsertRemoteRankMatchSessions,
} from './remote';
import type { DirtyKey, SyncState, SyncStatus } from './types';

const SYNC_INTERVAL_MS = 30_000;
export const RETRY_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000] as const;
export const MAX_RETRY = RETRY_DELAYS_MS.length;

interface SyncEngineState {
  status: SyncStatus;
  retryCount: number;
  syncState: SyncState;
  arm: (userId: string) => void;
  start: () => Promise<void>;
  shutdown: () => void;
  markDirty: (key: DirtyKey) => void;
  fullSync: () => Promise<void>;
}

function isOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return true;
  }

  return navigator.onLine;
}

function createDefaultSyncState(): SyncState {
  return {
    lastSyncedAt: null,
    dirtyKeys: [],
    deviceId: nanoid(12),
  };
}

function loadSyncState(): SyncState {
  try {
    const raw = localStorage.getItem(repository.getSyncStateKey());
    if (!raw) {
      return createDefaultSyncState();
    }

    return JSON.parse(raw) as SyncState;
  } catch {
    return createDefaultSyncState();
  }
}

function saveSyncState(state: SyncState): void {
  localStorage.setItem(repository.getSyncStateKey(), JSON.stringify(state));
}

function toLocalGameProgress(userId: string, remote: Awaited<ReturnType<typeof fetchRemoteGameProgress>>): GameProgress {
  return {
    userId,
    campaignProgress: remote?.campaign_progress ?? {},
    advanceProgress: remote?.advance_progress ?? {},
    rankProgress: remote?.rank_progress ?? { currentTier: 'apprentice', history: [] },
    wrongQuestions: remote?.wrong_questions ?? [],
    totalQuestionsAttempted: remote?.total_questions_attempted ?? 0,
    totalQuestionsCorrect: remote?.total_questions_correct ?? 0,
  };
}

function mergeProfile(localUser: User | null, userId: string, remote: NonNullable<Awaited<ReturnType<typeof fetchRemoteProfile>>>): User {
  return {
    id: userId,
    nickname: remote.nickname,
    avatarSeed: remote.avatar_seed,
    createdAt: localUser?.createdAt ?? Date.now(),
    supabaseId: userId,
    settings: remote.settings,
  };
}

export const useSyncEngine = create<SyncEngineState>((set, get) => {
  let activeUserId: string | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let retryTimerId: ReturnType<typeof setTimeout> | null = null;
  let onlineHandler: (() => void) | null = null;
  let offlineHandler: (() => void) | null = null;

  const clearRetryTimer = () => {
    if (retryTimerId) {
      clearTimeout(retryTimerId);
      retryTimerId = null;
    }
  };

  const scheduleRetry = (retryAttempt: number) => {
    clearRetryTimer();
    const delay = RETRY_DELAYS_MS[retryAttempt - 1];
    if (delay === undefined) return;

    retryTimerId = setTimeout(() => {
      retryTimerId = null;
      if (!activeUserId) return;
      if (!isOnline()) {
        set({ status: 'offline' });
        return;
      }
      void push();
    }, delay);
  };

  const cleanupRuntime = () => {
    clearRetryTimer();

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }

    if (typeof window !== 'undefined') {
      if (onlineHandler) {
        window.removeEventListener('online', onlineHandler);
      }
      if (offlineHandler) {
        window.removeEventListener('offline', offlineHandler);
      }
    }

    onlineHandler = null;
    offlineHandler = null;
    setSyncNotify(null);

    const client = getSupabaseClient();
    if (client) {
      client.removeAllChannels();
    }
  };

  const persistSyncState = (state: SyncState) => {
    saveSyncState(state);
    set({ syncState: state });
  };

  const recordFailure = () => {
    const previousRetry = get().retryCount;
    const nextRetry = Math.min(MAX_RETRY, previousRetry + 1);
    set({ status: 'error', retryCount: nextRetry });

    if (get().syncState.dirtyKeys.length > 0 && previousRetry < MAX_RETRY) {
      scheduleRetry(nextRetry);
    } else {
      clearRetryTimer();
    }
  };

  const recordSuccess = () => {
    clearRetryTimer();
    set({ status: 'synced', retryCount: 0 });
  };

  const push = async (): Promise<boolean> => {
    if (!activeUserId) {
      return false;
    }

    if (!isOnline()) {
      set({ status: 'offline' });
      return false;
    }

    const { syncState } = get();
    if (syncState.dirtyKeys.length === 0) {
      return true;
    }

    set({ status: 'syncing' });

    const remaining: DirtyKey[] = [];
    for (const key of syncState.dirtyKeys) {
      let ok = false;

      try {
        if (key === 'profiles') {
          const user = repository.getUser();
          ok = user
            ? await upsertRemoteProfile(activeUserId, {
              nickname: user.nickname,
              avatarSeed: user.avatarSeed,
              settings: user.settings,
            })
            : false;
        } else if (key === 'game_progress') {
          ok = await upsertRemoteGameProgress(activeUserId, repository.getGameProgress(activeUserId));
        } else if (key === 'history_records') {
          ok = await upsertRemoteHistoryRecords(activeUserId, repository.getHistory());
        } else if (key === 'rank_match_sessions') {
          ok = await upsertRemoteRankMatchSessions(activeUserId, repository.getRankMatchSessions());
        }
      } catch {
        ok = false;
      }

      if (!ok) {
        remaining.push(key);
      }
    }

    const nextState: SyncState = {
      ...syncState,
      dirtyKeys: remaining,
      lastSyncedAt: remaining.length === 0 ? new Date().toISOString() : syncState.lastSyncedAt,
    };

    persistSyncState(nextState);
    if (remaining.length === 0) {
      recordSuccess();
    } else {
      recordFailure();
    }

    return remaining.length === 0;
  };

  const pull = async (): Promise<boolean> => {
    if (!activeUserId) {
      return false;
    }

    if (!isOnline()) {
      set({ status: 'offline' });
      return false;
    }

    const { syncState } = get();

    const remoteProfile = await fetchRemoteProfile(activeUserId);
    if (remoteProfile && !syncState.dirtyKeys.includes('profiles')) {
      repository.saveUserSilent(mergeProfile(repository.getUser(), activeUserId, remoteProfile));
    }

    const remoteGameProgress = await fetchRemoteGameProgress(activeUserId);
    if (remoteGameProgress) {
      const merged = mergeGameProgress(
        repository.getGameProgress(activeUserId),
        toLocalGameProgress(activeUserId, remoteGameProgress),
      );
      repository.saveGameProgressSilent(merged);
      await upsertRemoteGameProgress(activeUserId, merged);
    }

    const remoteHistory = await fetchRemoteHistory(activeUserId, syncState.lastSyncedAt ?? undefined);
    if (remoteHistory.length > 0) {
      const merged = mergeHistoryRecords(repository.getHistory(), remoteHistory);
      repository.saveHistorySilent(merged);
      await upsertRemoteHistoryRecords(activeUserId, merged);
    }

    const remoteRankMatchSessions = await fetchRemoteRankMatchSessions(
      activeUserId,
      syncState.lastSyncedAt ?? undefined,
    );
    if (Object.keys(remoteRankMatchSessions).length > 0) {
      const merged = mergeRankMatchSessions(
        repository.getRankMatchSessions(),
        remoteRankMatchSessions,
      );
      repository.saveRankMatchSessionsSilent(merged);
      await upsertRemoteRankMatchSessions(activeUserId, merged);
    }

    const nextState: SyncState = {
      ...get().syncState,
      lastSyncedAt: new Date().toISOString(),
    };
    persistSyncState(nextState);
    set({ status: 'synced', retryCount: 0 });

    return true;
  };

  return {
    status: 'idle',
    retryCount: 0,
    syncState: loadSyncState(),

    arm: (userId: string) => {
      cleanupRuntime();
      activeUserId = userId;
      const syncState = loadSyncState();
      persistSyncState(syncState);
      set({ status: 'armed', retryCount: 0 });

      setSyncNotify((key) => {
        get().markDirty(key);
      });

      intervalId = setInterval(() => {
        if (!activeUserId || !isOnline()) return;
        const { status, syncState } = get();
        if (status === 'error' && syncState.dirtyKeys.length > 0) {
          clearRetryTimer();
          void push();
          return;
        }
        void pull();
      }, SYNC_INTERVAL_MS);

      onlineHandler = () => {
        clearRetryTimer();
        void get().fullSync();
      };
      offlineHandler = () => {
        clearRetryTimer();
        set({ status: 'offline' });
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('online', onlineHandler);
        window.addEventListener('offline', offlineHandler);
      }

      const client = getSupabaseClient();
      if (client) {
        client
          .channel(`sync-${userId}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'game_progress',
            filter: `user_id=eq.${userId}`,
          }, () => {
            clearRetryTimer();
            void get().fullSync();
          })
          .subscribe();
      }
    },

    start: async () => {
      if (!activeUserId) {
        set({ status: 'idle' });
        return;
      }

      if (!isOnline()) {
        set({ status: 'offline' });
        return;
      }

      await get().fullSync();
    },

    shutdown: () => {
      cleanupRuntime();
      activeUserId = null;
      set({ status: 'idle', retryCount: 0 });
    },

    markDirty: (key: DirtyKey) => {
      const { syncState } = get();
      if (!syncState.dirtyKeys.includes(key)) {
        persistSyncState({
          ...syncState,
          dirtyKeys: [...syncState.dirtyKeys, key],
        });
      }

      if (get().status === 'error') {
        clearRetryTimer();
      }

      if (get().status === 'armed') {
        return;
      }

      if (!isOnline()) {
        set({ status: 'offline' });
        return;
      }

      if (activeUserId) {
        void push();
      }
    },

    fullSync: async () => {
      if (!activeUserId) {
        set({ status: 'idle' });
        return;
      }

      if (!isOnline()) {
        set({ status: 'offline' });
        return;
      }

      set({ status: 'syncing' });

      try {
        await pull();
        await push();
        set({
          status: get().syncState.dirtyKeys.length === 0 ? 'synced' : 'error',
        });
      } catch {
        recordFailure();
      }
    },
  };
});
