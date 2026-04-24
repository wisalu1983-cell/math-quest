import { describe, expect, it, vi } from 'vitest';
import type { User } from '@/types';
import type { GameProgress } from '@/types/gamification';
import type { RemoteGameProgress, RemoteProfile } from './types';
import {
  runMergeFlow,
  type AccountMismatchDialogState,
  type MergeFlowDependencies,
  type MergeGuideDialogState,
} from './merge-flow';

function makeUser(id = 'local-user'): User {
  return {
    id,
    nickname: '小鹿',
    avatarSeed: 'avatar',
    createdAt: 1,
    settings: { soundEnabled: true, hapticsEnabled: true },
  };
}

function makeProgress(overrides: Partial<GameProgress> = {}): GameProgress {
  return {
    userId: 'local-user',
    campaignProgress: {},
    advanceProgress: {},
    rankProgress: { currentTier: 'apprentice', history: [] },
    wrongQuestions: [],
    totalQuestionsAttempted: 0,
    totalQuestionsCorrect: 0,
    ...overrides,
  };
}

function makeRemoteProgress(overrides: Partial<RemoteGameProgress> = {}): RemoteGameProgress {
  return {
    user_id: 'cloud-user',
    campaign_progress: {},
    advance_progress: {},
    rank_progress: { currentTier: 'apprentice', history: [] },
    wrong_questions: [],
    total_questions_attempted: 0,
    total_questions_correct: 0,
    updated_at: '2026-04-24T00:00:00.000Z',
    ...overrides,
  };
}

function makeRemoteProfile(overrides: Partial<RemoteProfile> = {}): RemoteProfile {
  return {
    id: 'cloud-user',
    nickname: '云端账号',
    avatar_seed: 'cloud',
    settings: { soundEnabled: false, hapticsEnabled: true },
    updated_at: '2026-04-24T00:00:00.000Z',
    ...overrides,
  };
}

interface FakeState {
  authUserId: string | null;
  user: User | null;
  progress: GameProgress;
  remoteProgress: RemoteGameProgress | null;
  remoteProfile: RemoteProfile | null;
  online: boolean;
}

function makeDeps(initial: Partial<FakeState> = {}) {
  const state: FakeState = {
    authUserId: null,
    user: null,
    progress: makeProgress({ userId: initial.user?.id ?? 'local-user' }),
    remoteProgress: null,
    remoteProfile: null,
    online: true,
    ...initial,
  };

  const deps: MergeFlowDependencies = {
    repository: {
      getAuthUserId: vi.fn(() => state.authUserId),
      setAuthUserId: vi.fn((userId: string) => {
        state.authUserId = userId;
      }),
      clearAuthUserId: vi.fn(() => {
        state.authUserId = null;
      }),
      getUser: vi.fn(() => state.user),
      saveUserSilent: vi.fn((user: User) => {
        state.user = user;
      }),
      getGameProgress: vi.fn(() => state.progress),
      saveGameProgressSilent: vi.fn((progress: GameProgress) => {
        state.progress = progress;
      }),
      getHistory: vi.fn(() => []),
      saveHistorySilent: vi.fn(),
      getRankMatchSessions: vi.fn(() => ({})),
      saveRankMatchSessionsSilent: vi.fn(),
      clearAccountScopedData: vi.fn(() => {
        state.user = null;
        state.progress = makeProgress({ userId: 'cleared' });
      }),
      discardPendingSyncAfterUserConfirmation: vi.fn(),
    },
    fetchRemoteProfile: vi.fn(async () => state.remoteProfile),
    fetchRemoteGameProgress: vi.fn(async () => state.remoteProgress),
    fetchRemoteHistory: vi.fn(async () => []),
    fetchRemoteRankMatchSessions: vi.fn(async () => ({})),
    upsertRemoteProfile: vi.fn(async () => true),
    upsertRemoteGameProgress: vi.fn(async () => true),
    upsertRemoteHistoryRecords: vi.fn(async () => true),
    upsertRemoteRankMatchSessions: vi.fn(async () => true),
    startSync: vi.fn(async () => undefined),
    shutdownSync: vi.fn(),
    signOutForce: vi.fn(async () => undefined),
    isOnline: vi.fn(() => state.online),
    now: vi.fn(() => 1234),
  };

  return { state, deps };
}

function makePresenter() {
  let mergeDialog: MergeGuideDialogState | null = null;
  let mismatchDialog: AccountMismatchDialogState | null = null;
  return {
    setMergeDialog: vi.fn((state: MergeGuideDialogState | null) => {
      mergeDialog = state;
    }),
    setMismatchDialog: vi.fn((state: AccountMismatchDialogState | null) => {
      mismatchDialog = state;
    }),
    get mergeDialog() {
      return mergeDialog;
    },
    get mismatchDialog() {
      return mismatchDialog;
    },
  };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
}

describe('runMergeFlow', () => {
  it('场景 A：本地和云端都没有有效进度时直接绑定账号并启动同步', async () => {
    const { state, deps } = makeDeps({
      user: makeUser('guest'),
      progress: makeProgress({ userId: 'guest' }),
      remoteProfile: makeRemoteProfile(),
    });
    const presenter = makePresenter();

    const result = await runMergeFlow('cloud-user', {
      ...presenter,
      deps,
      timeoutMs: 50,
    });

    expect(result.status).toBe('started');
    expect(state.authUserId).toBe('cloud-user');
    expect(state.user?.id).toBe('cloud-user');
    expect(state.progress.userId).toBe('cloud-user');
    expect(deps.startSync).toHaveBeenCalledTimes(1);
    expect(deps.upsertRemoteGameProgress).not.toHaveBeenCalled();
    expect(presenter.mergeDialog).toBeNull();
  });

  it('场景 B：访客本地有进度且云端为空时自动上传本地进度', async () => {
    const { state, deps } = makeDeps({
      user: makeUser('guest'),
      progress: makeProgress({ userId: 'guest', totalQuestionsAttempted: 8, totalQuestionsCorrect: 6 }),
    });
    const presenter = makePresenter();

    const result = await runMergeFlow('cloud-user', {
      ...presenter,
      deps,
      timeoutMs: 50,
    });

    expect(result.status).toBe('started');
    expect(state.progress.userId).toBe('cloud-user');
    expect(deps.upsertRemoteGameProgress).toHaveBeenCalledWith(
      'cloud-user',
      expect.objectContaining({ totalQuestionsAttempted: 8, userId: 'cloud-user' }),
    );
    expect(deps.startSync).toHaveBeenCalledTimes(1);
  });

  it('场景 C：本地为空且云端有进度时自动拉取云端进度', async () => {
    const { state, deps } = makeDeps({
      user: makeUser('guest'),
      progress: makeProgress({ userId: 'guest' }),
      remoteProgress: makeRemoteProgress({
        total_questions_attempted: 21,
        total_questions_correct: 19,
      }),
      remoteProfile: makeRemoteProfile(),
    });
    const presenter = makePresenter();

    const result = await runMergeFlow('cloud-user', {
      ...presenter,
      deps,
      timeoutMs: 50,
    });

    expect(result.status).toBe('started');
    expect(state.progress).toEqual(expect.objectContaining({
      userId: 'cloud-user',
      totalQuestionsAttempted: 21,
      totalQuestionsCorrect: 19,
    }));
    expect(deps.upsertRemoteGameProgress).not.toHaveBeenCalled();
    expect(deps.startSync).toHaveBeenCalledTimes(1);
  });

  it('场景 D：两端都有进度时等待用户选择，选择合并后写入合并结果', async () => {
    const { state, deps } = makeDeps({
      user: makeUser('guest'),
      progress: makeProgress({ userId: 'guest', totalQuestionsAttempted: 5, totalQuestionsCorrect: 3 }),
      remoteProgress: makeRemoteProgress({
        total_questions_attempted: 9,
        total_questions_correct: 8,
      }),
      remoteProfile: makeRemoteProfile(),
    });
    const presenter = makePresenter();

    const pending = runMergeFlow('cloud-user', {
      ...presenter,
      deps,
      timeoutMs: 50,
    });
    await flushPromises();

    expect(presenter.mergeDialog?.step).toBe('wait-user-choice');
    presenter.mergeDialog?.onConfirmMerge();

    const result = await pending;
    expect(result.status).toBe('started');
    expect(state.progress).toEqual(expect.objectContaining({
      userId: 'cloud-user',
      totalQuestionsAttempted: 9,
      totalQuestionsCorrect: 8,
    }));
    expect(deps.upsertRemoteGameProgress).toHaveBeenCalledWith(
      'cloud-user',
      expect.objectContaining({ totalQuestionsAttempted: 9, totalQuestionsCorrect: 8 }),
    );
    expect(deps.startSync).toHaveBeenCalledTimes(1);
  });

  it('场景 E：本地归属锁属于另一个账号时，确认继续会先丢弃旧 dirtyKeys 再清本地数据', async () => {
    const { state, deps } = makeDeps({
      authUserId: 'account-a',
      user: makeUser('account-a'),
      progress: makeProgress({ userId: 'account-a', totalQuestionsAttempted: 3 }),
      remoteProgress: makeRemoteProgress({
        total_questions_attempted: 11,
        total_questions_correct: 10,
      }),
    });
    const presenter = makePresenter();

    const pending = runMergeFlow('account-b', {
      ...presenter,
      deps,
      timeoutMs: 50,
    });
    await flushPromises();

    expect(presenter.mismatchDialog).toEqual(expect.objectContaining({
      currentLocalAuthId: 'account-a',
      incomingUserId: 'account-b',
    }));
    presenter.mismatchDialog?.onProceed();

    const result = await pending;
    expect(result.status).toBe('started');
    expect(deps.repository.discardPendingSyncAfterUserConfirmation).toHaveBeenCalledBefore(
      deps.repository.clearAccountScopedData as ReturnType<typeof vi.fn>,
    );
    expect(state.authUserId).toBe('account-b');
    expect(state.progress).toEqual(expect.objectContaining({
      userId: 'account-b',
      totalQuestionsAttempted: 11,
    }));
  });

  it('场景 F：首次登录且离线时保持等待网络状态，取消登录会关闭同步并登出', async () => {
    const { deps } = makeDeps({
      user: makeUser('guest'),
      progress: makeProgress({ userId: 'guest', totalQuestionsAttempted: 2 }),
      online: false,
    });
    const presenter = makePresenter();

    const pending = runMergeFlow('cloud-user', {
      ...presenter,
      deps,
      timeoutMs: 50,
    });
    await flushPromises();

    expect(presenter.mergeDialog?.step).toBe('offline-waiting');
    expect(deps.fetchRemoteGameProgress).not.toHaveBeenCalled();

    presenter.mergeDialog?.onCancelLogin();
    const result = await pending;

    expect(result.status).toBe('cancelled');
    expect(deps.shutdownSync).toHaveBeenCalledTimes(1);
    expect(deps.signOutForce).toHaveBeenCalledTimes(1);
  });
});
