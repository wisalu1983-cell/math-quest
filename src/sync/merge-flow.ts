import { repository } from '@/repository/local';
import { useAuthStore } from '@/store/auth';
import type { User } from '@/types';
import type { GameProgress, RankMatchSession } from '@/types/gamification';
import { useSyncEngine } from './engine';
import { hasMeaningfulLocalProgress } from './local-progress';
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
import type { RemoteGameProgress, RemoteProfile } from './types';

export type MergeGuideDialogStep =
  | 'loading'
  | 'wait-user-choice'
  | 'auto-pulling'
  | 'auto-pushing'
  | 'merging'
  | 'discarding'
  | 'merge-error'
  | 'discard-error'
  | 'offline-waiting'
  | 'success';

export interface MergeGuideDialogState {
  step: MergeGuideDialogStep;
  onConfirmMerge: () => void;
  onConfirmDiscard: () => void;
  onRetry: () => void;
  onSwitch: () => void;
  onCancelLogin: () => void;
}

export interface AccountMismatchDialogState {
  currentLocalAuthId: string;
  incomingUserId: string;
  onProceed: () => void;
  onCancelLogin: () => void;
}

interface MergeFlowRepository {
  getAuthUserId: () => string | null;
  setAuthUserId: (userId: string) => void;
  clearAuthUserId: () => void;
  getUser: () => User | null;
  saveUserSilent: (user: User) => void;
  getGameProgress: (userId: string) => GameProgress;
  saveGameProgressSilent: (progress: GameProgress) => void;
  getHistory: typeof repository.getHistory;
  saveHistorySilent: typeof repository.saveHistorySilent;
  getRankMatchSessions: typeof repository.getRankMatchSessions;
  saveRankMatchSessionsSilent: typeof repository.saveRankMatchSessionsSilent;
  clearAccountScopedData: () => void;
  discardPendingSyncAfterUserConfirmation: () => void;
}

export interface MergeFlowDependencies {
  repository: MergeFlowRepository;
  fetchRemoteProfile: (userId: string) => Promise<RemoteProfile | null>;
  fetchRemoteGameProgress: (userId: string) => Promise<RemoteGameProgress | null>;
  fetchRemoteHistory: typeof fetchRemoteHistory;
  fetchRemoteRankMatchSessions: typeof fetchRemoteRankMatchSessions;
  upsertRemoteProfile: typeof upsertRemoteProfile;
  upsertRemoteGameProgress: typeof upsertRemoteGameProgress;
  upsertRemoteHistoryRecords: typeof upsertRemoteHistoryRecords;
  upsertRemoteRankMatchSessions: typeof upsertRemoteRankMatchSessions;
  startSync: () => Promise<void>;
  shutdownSync: () => void;
  signOutForce: () => Promise<void>;
  isOnline: () => boolean;
  now: () => number;
}

interface RemoteBundle {
  profile: RemoteProfile | null;
  progress: GameProgress | null;
  history: Awaited<ReturnType<typeof fetchRemoteHistory>>;
  rankMatchSessions: Record<string, RankMatchSession>;
}

type MergeAction = 'merge' | 'discard' | 'retry' | 'switch' | 'cancel';

export interface RunMergeFlowOptions {
  setMergeDialog: (state: MergeGuideDialogState | null) => void;
  setMismatchDialog: (state: AccountMismatchDialogState | null) => void;
  deps?: MergeFlowDependencies;
  timeoutMs?: number;
}

export type MergeFlowResult =
  | { status: 'started' }
  | { status: 'cancelled' };

function isOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return true;
  }
  return navigator.onLine;
}

function remoteProgressToLocal(userId: string, remote: RemoteGameProgress | null): GameProgress {
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

function rewriteProgressUserId(progress: GameProgress, userId: string): GameProgress {
  return { ...progress, userId };
}

function buildAccountUser(
  userId: string,
  localUser: User | null,
  remoteProfile: RemoteProfile | null,
  preferRemoteProfile: boolean,
  now: () => number,
): User {
  if (preferRemoteProfile && remoteProfile) {
    return {
      id: userId,
      nickname: remoteProfile.nickname,
      avatarSeed: remoteProfile.avatar_seed,
      createdAt: localUser?.createdAt ?? now(),
      supabaseId: userId,
      settings: remoteProfile.settings,
    };
  }

  if (localUser) {
    return {
      ...localUser,
      id: userId,
      supabaseId: userId,
    };
  }

  if (remoteProfile) {
    return {
      id: userId,
      nickname: remoteProfile.nickname,
      avatarSeed: remoteProfile.avatar_seed,
      createdAt: now(),
      supabaseId: userId,
      settings: remoteProfile.settings,
    };
  }

  return {
    id: userId,
    nickname: '学习者',
    avatarSeed: userId.slice(0, 6) || 'avatar',
    createdAt: now(),
    supabaseId: userId,
    settings: { soundEnabled: true, hapticsEnabled: true },
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('timeout'));
    }, timeoutMs);

    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

const defaultDeps: MergeFlowDependencies = {
  repository,
  fetchRemoteProfile,
  fetchRemoteGameProgress,
  fetchRemoteHistory,
  fetchRemoteRankMatchSessions,
  upsertRemoteProfile,
  upsertRemoteGameProgress,
  upsertRemoteHistoryRecords,
  upsertRemoteRankMatchSessions,
  startSync: () => useSyncEngine.getState().start(),
  shutdownSync: () => useSyncEngine.getState().shutdown(),
  signOutForce: () => useAuthStore.getState().signOutForce(),
  isOnline,
  now: () => Date.now(),
};

export async function runMergeFlow(
  userId: string,
  options: RunMergeFlowOptions,
): Promise<MergeFlowResult> {
  const deps = options.deps ?? defaultDeps;
  const timeoutMs = options.timeoutMs ?? 15_000;
  const { setMergeDialog, setMismatchDialog } = options;

  const closeDialogs = () => {
    setMergeDialog(null);
    setMismatchDialog(null);
  };

  const cancelLogin = async (): Promise<MergeFlowResult> => {
    closeDialogs();
    deps.shutdownSync();
    await deps.signOutForce();
    return { status: 'cancelled' };
  };

  const waitForMergeAction = (step: MergeGuideDialogStep): Promise<MergeAction> => (
    new Promise(resolve => {
      setMergeDialog({
        step,
        onConfirmMerge: () => resolve('merge'),
        onConfirmDiscard: () => resolve('discard'),
        onRetry: () => resolve('retry'),
        onSwitch: () => resolve('switch'),
        onCancelLogin: () => resolve('cancel'),
      });
    })
  );

  const waitForMismatchAction = (
    currentLocalAuthId: string,
  ): Promise<'proceed' | 'cancel'> => (
    new Promise(resolve => {
      setMismatchDialog({
        currentLocalAuthId,
        incomingUserId: userId,
        onProceed: () => resolve('proceed'),
        onCancelLogin: () => resolve('cancel'),
      });
    })
  );

  const loadRemoteBundle = async (): Promise<RemoteBundle> => {
    const [profile, remoteProgress, history, rankMatchSessions] = await withTimeout(
      Promise.all([
        deps.fetchRemoteProfile(userId),
        deps.fetchRemoteGameProgress(userId),
        deps.fetchRemoteHistory(userId),
        deps.fetchRemoteRankMatchSessions(userId),
      ]),
      timeoutMs,
    );

    return {
      profile,
      progress: remoteProgress ? remoteProgressToLocal(userId, remoteProgress) : null,
      history,
      rankMatchSessions,
    };
  };

  const getLocalProgress = (): GameProgress => {
    const localUser = deps.repository.getUser();
    return deps.repository.getGameProgress(localUser?.id ?? userId);
  };

  const saveLocalAccount = (
    progress: GameProgress,
    remoteProfile: RemoteProfile | null,
    preferRemoteProfile: boolean,
  ) => {
    const localUser = deps.repository.getUser();
    deps.repository.saveUserSilent(
      buildAccountUser(userId, localUser, remoteProfile, preferRemoteProfile, deps.now),
    );
    deps.repository.saveGameProgressSilent(rewriteProgressUserId(progress, userId));
    deps.repository.setAuthUserId(userId);
  };

  const startSync = async (): Promise<MergeFlowResult> => {
    closeDialogs();
    await deps.startSync();
    return { status: 'started' };
  };

  const waitUntilOnlineOrCancel = async (): Promise<'online' | 'cancelled'> => {
    while (!deps.isOnline()) {
      const action = await waitForMergeAction('offline-waiting');
      if (action === 'cancel') {
        await cancelLogin();
        return 'cancelled';
      }
    }
    return 'online';
  };

  const useRemoteAccount = async (remote: RemoteBundle): Promise<void> => {
    const nextProgress = remote.progress ?? remoteProgressToLocal(userId, null);
    saveLocalAccount(nextProgress, remote.profile, true);
    deps.repository.saveHistorySilent(remote.history);
    deps.repository.saveRankMatchSessionsSilent(remote.rankMatchSessions);
  };

  const mergeLocalIntoCloud = async (localProgress: GameProgress, remote: RemoteBundle): Promise<void> => {
    const nextProgress = remote.progress
      ? mergeGameProgress(rewriteProgressUserId(localProgress, userId), remote.progress)
      : rewriteProgressUserId(localProgress, userId);
    saveLocalAccount(nextProgress, remote.profile, false);

    const localUser = deps.repository.getUser();
    if (localUser) {
      const profileOk = await deps.upsertRemoteProfile(userId, {
        nickname: localUser.nickname,
        avatarSeed: localUser.avatarSeed,
        settings: localUser.settings,
      });
      if (!profileOk) {
        throw new Error('profile-upsert-failed');
      }
    }

    const progressOk = await deps.upsertRemoteGameProgress(userId, nextProgress);
    const history = mergeHistoryRecords(deps.repository.getHistory(), remote.history);
    const historyOk = await deps.upsertRemoteHistoryRecords(userId, history);
    deps.repository.saveHistorySilent(history);

    const rankMatchSessions = mergeRankMatchSessions(
      deps.repository.getRankMatchSessions(),
      remote.rankMatchSessions,
    );
    const rankOk = await deps.upsertRemoteRankMatchSessions(userId, rankMatchSessions);
    deps.repository.saveRankMatchSessionsSilent(rankMatchSessions);

    if (!progressOk || !historyOk || !rankOk) {
      throw new Error('remote-upsert-failed');
    }
  };

  const runOperationWithRecovery = async (
    initialOperation: 'merge' | 'discard',
    localProgress: GameProgress,
    remote: RemoteBundle,
    initialBusyStep: 'auto-pulling' | 'auto-pushing' | 'merging' | 'discarding',
  ): Promise<MergeFlowResult> => {
    let operation = initialOperation;
    let busyStep: MergeGuideDialogStep = initialBusyStep;

    while (true) {
      setMergeDialog({
        step: busyStep,
        onConfirmMerge: () => undefined,
        onConfirmDiscard: () => undefined,
        onRetry: () => undefined,
        onSwitch: () => undefined,
        onCancelLogin: () => undefined,
      });

      try {
        if (operation === 'merge') {
          await mergeLocalIntoCloud(localProgress, remote);
        } else {
          await useRemoteAccount(remote);
        }
        return startSync();
      } catch {
        const action = await waitForMergeAction(operation === 'merge' ? 'merge-error' : 'discard-error');
        if (action === 'cancel') {
          return cancelLogin();
        }
        if (action === 'retry') {
          busyStep = operation === 'merge' ? 'merging' : 'discarding';
          continue;
        }
        if (action === 'switch') {
          operation = operation === 'merge' ? 'discard' : 'merge';
          busyStep = operation === 'merge' ? 'merging' : 'discarding';
        }
      }
    }
  };

  const decideFirstLogin = async (): Promise<MergeFlowResult> => {
    const onlineResult = await waitUntilOnlineOrCancel();
    if (onlineResult === 'cancelled') {
      return { status: 'cancelled' };
    }

    setMergeDialog({
      step: 'loading',
      onConfirmMerge: () => undefined,
      onConfirmDiscard: () => undefined,
      onRetry: () => undefined,
      onSwitch: () => undefined,
      onCancelLogin: () => undefined,
    });

    let remote: RemoteBundle;
    try {
      remote = await loadRemoteBundle();
    } catch {
      const action = await waitForMergeAction('offline-waiting');
      if (action === 'cancel') {
        return cancelLogin();
      }
      return decideFirstLogin();
    }

    const localProgress = getLocalProgress();
    const hasLocal = hasMeaningfulLocalProgress(localProgress);
    const hasRemote = remote.progress ? hasMeaningfulLocalProgress(remote.progress) : false;

    if (!hasLocal && !hasRemote) {
      saveLocalAccount(localProgress, remote.profile, Boolean(remote.profile));
      return startSync();
    }

    if (hasLocal && !hasRemote) {
      return runOperationWithRecovery('merge', localProgress, remote, 'auto-pushing');
    }

    if (!hasLocal && hasRemote) {
      return runOperationWithRecovery('discard', localProgress, remote, 'auto-pulling');
    }

    const action = await waitForMergeAction('wait-user-choice');
    if (action === 'cancel') {
      return cancelLogin();
    }
    return runOperationWithRecovery(action === 'discard' ? 'discard' : 'merge', localProgress, remote, action === 'discard' ? 'discarding' : 'merging');
  };

  const localAuthId = deps.repository.getAuthUserId();

  if (localAuthId && localAuthId !== userId) {
    const action = await waitForMismatchAction(localAuthId);
    if (action === 'cancel') {
      return cancelLogin();
    }

    deps.repository.discardPendingSyncAfterUserConfirmation();
    deps.repository.clearAccountScopedData();
    deps.repository.clearAuthUserId();
    return decideFirstLogin();
  }

  if (localAuthId === userId) {
    return startSync();
  }

  return decideFirstLogin();
}
