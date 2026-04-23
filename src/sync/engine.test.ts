import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@/types';
import type { GameProgress, RankMatchSession } from '@/types/gamification';
import type { RemoteGameProgress, RemoteProfile } from './types';

const remoteState = {
  profile: null as RemoteProfile | null,
  gameProgress: null as RemoteGameProgress | null,
  history: [] as any[],
  rankMatchSessions: {} as Record<string, RankMatchSession>,
  fetchRemoteProfile: vi.fn(async () => remoteState.profile),
  upsertRemoteProfile: vi.fn(async () => true),
  fetchRemoteGameProgress: vi.fn(async () => remoteState.gameProgress),
  upsertRemoteGameProgress: vi.fn(async () => true),
  fetchRemoteHistory: vi.fn(async () => remoteState.history),
  upsertRemoteHistoryRecords: vi.fn(async () => true),
  fetchRemoteRankMatchSessions: vi.fn(async () => remoteState.rankMatchSessions),
  upsertRemoteRankMatchSessions: vi.fn(async () => true),
};

const mockChannel = {
  on: vi.fn(() => mockChannel),
  subscribe: vi.fn(() => mockChannel),
};

const mockSupabaseClient = {
  channel: vi.fn(() => mockChannel),
  removeAllChannels: vi.fn(),
};

vi.mock('./remote', () => ({
  fetchRemoteProfile: (...args: Parameters<typeof remoteState.fetchRemoteProfile>) => remoteState.fetchRemoteProfile(...args),
  upsertRemoteProfile: (...args: Parameters<typeof remoteState.upsertRemoteProfile>) => remoteState.upsertRemoteProfile(...args),
  fetchRemoteGameProgress: (...args: Parameters<typeof remoteState.fetchRemoteGameProgress>) => remoteState.fetchRemoteGameProgress(...args),
  upsertRemoteGameProgress: (...args: Parameters<typeof remoteState.upsertRemoteGameProgress>) => remoteState.upsertRemoteGameProgress(...args),
  fetchRemoteHistory: (...args: Parameters<typeof remoteState.fetchRemoteHistory>) => remoteState.fetchRemoteHistory(...args),
  upsertRemoteHistoryRecords: (...args: Parameters<typeof remoteState.upsertRemoteHistoryRecords>) => remoteState.upsertRemoteHistoryRecords(...args),
  fetchRemoteRankMatchSessions: (...args: Parameters<typeof remoteState.fetchRemoteRankMatchSessions>) => remoteState.fetchRemoteRankMatchSessions(...args),
  upsertRemoteRankMatchSessions: (...args: Parameters<typeof remoteState.upsertRemoteRankMatchSessions>) => remoteState.upsertRemoteRankMatchSessions(...args),
}));

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => mockSupabaseClient,
}));

vi.mock('nanoid', () => ({
  nanoid: () => 'device-1',
}));

function installLocalStorageMock(): void {
  const store = new Map<string, string>();
  const mock = {
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() { return store.size; },
  };
  (globalThis as Record<string, unknown>).localStorage = mock;
}

function installBrowserMocks() {
  const listeners = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  Object.defineProperty(globalThis, 'window', {
    value: listeners,
    configurable: true,
    writable: true,
  });

  let online = true;
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      get onLine() {
        return online;
      },
    },
    configurable: true,
  });

  return {
    listeners,
    setOnline(next: boolean) {
      online = next;
    },
  };
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    nickname: 'Local Kid',
    avatarSeed: 'seed-local',
    createdAt: 0,
    settings: { soundEnabled: true, hapticsEnabled: true },
    ...overrides,
  };
}

function makeGameProgress(overrides: Partial<GameProgress> = {}): GameProgress {
  return {
    userId: 'u1',
    campaignProgress: {},
    advanceProgress: {},
    rankProgress: { currentTier: 'apprentice', history: [] },
    wrongQuestions: [],
    totalQuestionsAttempted: 0,
    totalQuestionsCorrect: 0,
    ...overrides,
  };
}

function makeRankMatchSession(id: string, overrides: Partial<RankMatchSession> = {}): RankMatchSession {
  return {
    id,
    userId: 'u1',
    targetTier: 'rookie',
    bestOf: 3,
    winsToAdvance: 2,
    games: [{ gameIndex: 1, finished: false, practiceSessionId: `${id}-g1`, startedAt: 100 }],
    status: 'active',
    startedAt: 100,
    ...overrides,
  };
}

async function loadModules() {
  const local = await import('../repository/local');
  const engine = await import('./engine');
  return { ...local, ...engine };
}

describe('SyncEngine', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    installLocalStorageMock();
    const browser = installBrowserMocks();
    browser.setOnline(true);
    remoteState.profile = null;
    remoteState.gameProgress = null;
    remoteState.history = [];
    remoteState.rankMatchSessions = {};
    remoteState.fetchRemoteProfile.mockClear();
    remoteState.upsertRemoteProfile.mockClear();
    remoteState.fetchRemoteGameProgress.mockClear();
    remoteState.upsertRemoteGameProgress.mockClear();
    remoteState.fetchRemoteHistory.mockClear();
    remoteState.upsertRemoteHistoryRecords.mockClear();
    remoteState.fetchRemoteRankMatchSessions.mockClear();
    remoteState.upsertRemoteRankMatchSessions.mockClear();
    mockChannel.on.mockClear();
    mockChannel.subscribe.mockClear();
    mockSupabaseClient.channel.mockClear();
    mockSupabaseClient.removeAllChannels.mockClear();
  });

  it('initialize 会注册 sync notify 与 realtime，离线写操作只标记 dirty 不立即 push', async () => {
    const browser = installBrowserMocks();
    browser.setOnline(false);
    const { repository, useSyncEngine } = await loadModules();

    useSyncEngine.getState().initialize('u1');
    repository.saveUser(makeUser());

    expect(useSyncEngine.getState().status).toBe('offline');
    expect(useSyncEngine.getState().syncState.deviceId).toBe('device-1');
    expect(useSyncEngine.getState().syncState.dirtyKeys).toEqual(['profiles']);
    expect(mockSupabaseClient.channel).toHaveBeenCalledTimes(1);
    expect(mockChannel.subscribe).toHaveBeenCalledTimes(1);
    expect(remoteState.upsertRemoteProfile).not.toHaveBeenCalled();
  });

  it('fullSync 会拉取远端数据、合并后静默写本地，并保持 dirtyKeys 为空', async () => {
    const browser = installBrowserMocks();
    browser.setOnline(false);
    const { repository, useSyncEngine } = await loadModules();

    repository.saveUser(makeUser({ nickname: 'Local Kid', supabaseId: 'u1' }));
    repository.saveGameProgress(makeGameProgress({
      totalQuestionsAttempted: 10,
      totalQuestionsCorrect: 7,
    }));
    repository.saveHistoryRecord({
      id: 'local-history',
      userId: 'u1',
      sessionMode: 'campaign',
      startedAt: 100,
      endedAt: 200,
      completed: true,
      result: 'win',
      topicId: 'number-sense',
      questions: [],
    });
    repository.saveRankMatchSession(makeRankMatchSession('local-rank'));

    remoteState.profile = {
      id: 'u1',
      nickname: 'Remote Kid',
      avatar_seed: 'seed-remote',
      settings: { soundEnabled: false, hapticsEnabled: true },
      updated_at: '2026-04-23T00:00:00.000Z',
    };
    remoteState.gameProgress = {
      user_id: 'u1',
      campaign_progress: {},
      advance_progress: {},
      rank_progress: { currentTier: 'rookie', history: [] },
      wrong_questions: [],
      total_questions_attempted: 12,
      total_questions_correct: 9,
      updated_at: '2026-04-23T00:00:00.000Z',
    };
    remoteState.history = [{
      id: 'remote-history',
      userId: 'u1',
      sessionMode: 'advance',
      startedAt: 300,
      endedAt: 400,
      completed: true,
      result: 'win',
      topicId: 'number-sense',
      questions: [],
    }];
    remoteState.rankMatchSessions = {
      'remote-rank': makeRankMatchSession('remote-rank', { status: 'completed', outcome: 'promoted', endedAt: 300 }),
    };

    useSyncEngine.getState().initialize('u1');
    browser.setOnline(true);
    await useSyncEngine.getState().fullSync();

    expect(repository.getUser()?.nickname).toBe('Remote Kid');
    expect(repository.getGameProgress('u1').totalQuestionsAttempted).toBe(12);
    expect(repository.getGameProgress('u1').totalQuestionsCorrect).toBe(9);
    expect(repository.getHistory().map(record => record.id)).toEqual(['remote-history', 'local-history']);
    expect(repository.getRankMatchSession('remote-rank')?.status).toBe('completed');
    expect(useSyncEngine.getState().syncState.dirtyKeys).toEqual([]);
    expect(remoteState.upsertRemoteGameProgress).toHaveBeenCalledTimes(1);
    expect(remoteState.upsertRemoteHistoryRecords).toHaveBeenCalledTimes(1);
    expect(remoteState.upsertRemoteRankMatchSessions).toHaveBeenCalledTimes(1);
  });

  it('markDirty 后 fullSync 会 push 本地脏数据并清空 dirtyKeys', async () => {
    const browser = installBrowserMocks();
    browser.setOnline(false);
    const { repository, useSyncEngine } = await loadModules();

    repository.saveGameProgress(makeGameProgress({
      totalQuestionsAttempted: 18,
      totalQuestionsCorrect: 15,
    }));

    useSyncEngine.getState().initialize('u1');
    useSyncEngine.getState().markDirty('game_progress');
    expect(useSyncEngine.getState().syncState.dirtyKeys).toEqual(['game_progress']);

    browser.setOnline(true);
    await useSyncEngine.getState().fullSync();

    expect(remoteState.upsertRemoteGameProgress).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        totalQuestionsAttempted: 18,
        totalQuestionsCorrect: 15,
      }),
    );
    expect(useSyncEngine.getState().syncState.dirtyKeys).toEqual([]);
    expect(useSyncEngine.getState().status).toBe('synced');
  });

  it('shutdown 会解绑 realtime 与 sync notify，后续写操作不再产生 dirty', async () => {
    const browser = installBrowserMocks();
    browser.setOnline(false);
    const { repository, useSyncEngine } = await loadModules();

    useSyncEngine.getState().initialize('u1');
    useSyncEngine.getState().shutdown();
    repository.saveUser(makeUser({ nickname: 'After Shutdown' }));

    expect(mockSupabaseClient.removeAllChannels).toHaveBeenCalled();
    expect(useSyncEngine.getState().status).toBe('idle');
    expect(useSyncEngine.getState().syncState.dirtyKeys).toEqual([]);
  });
});
