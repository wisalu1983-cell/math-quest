// F3 · namespace 切换 / clearDevSandbox / applyAndReload

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  setStorageNamespace,
  getStorageNamespace,
  repository,
} from '@/repository/local';
import { useUserStore, useGameProgressStore } from '@/store';
import {
  switchDevNamespace,
  clearDevSandbox,
  applyAndReload,
} from '@/dev-tool/namespace';
import type { User } from '@/types';
import type { GameProgress } from '@/types/gamification';

function installLocalStorageMock(): void {
  const store = new Map<string, string>();
  const mock = {
    getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  };
  (globalThis as Record<string, unknown>).localStorage = mock;
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u-ns',
    nickname: 'NSUser',
    avatarSeed: 's',
    createdAt: 0,
    settings: { soundEnabled: true, hapticsEnabled: true },
    ...overrides,
  };
}

function emptyGp(userId: string): GameProgress {
  return {
    userId,
    campaignProgress: {},
    advanceProgress: {},
    rankProgress: { currentTier: 'apprentice', history: [] },
    wrongQuestions: [],
    totalQuestionsAttempted: 0,
    totalQuestionsCorrect: 0,
  };
}

describe('dev-tool/namespace', () => {
  beforeEach(() => {
    installLocalStorageMock();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.clear();
    setStorageNamespace('main');
    repository.init();
  });

  afterEach(() => {
    localStorage.clear();
    setStorageNamespace('main');
    repository.init();
    useUserStore.setState({ user: null });
    useGameProgressStore.setState({ gameProgress: null });
    vi.restoreAllMocks();
  });

  it('switchDevNamespace：切换后 getStorageNamespace 与存档 key 前缀一致', () => {
    repository.saveUser(makeUser({ id: 'u-main', nickname: 'MainOnly' }));
    expect(getStorageNamespace()).toBe('main');
    switchDevNamespace('dev');
    expect(getStorageNamespace()).toBe('dev');
    expect(localStorage.getItem('mq_dev_user')).toBeNull();
    switchDevNamespace('main');
    expect(getStorageNamespace()).toBe('main');
    expect(repository.getUser()?.nickname).toBe('MainOnly');
  });

  it('switchDevNamespace：从 main（有用户）切到 dev 空沙盒 → 内存态 user 为空', () => {
    const u = makeUser({ id: 'u-main', nickname: 'Keeper' });
    repository.saveUser(u);
    useUserStore.setState({ user: u });
    switchDevNamespace('dev');
    expect(getStorageNamespace()).toBe('dev');
    expect(useUserStore.getState().user).toBeNull();
    switchDevNamespace('main');
    expect(useUserStore.getState().user?.nickname).toBe('Keeper');
  });

  it('clearDevSandbox：非 dev namespace 调用时抛错', () => {
    expect(getStorageNamespace()).toBe('main');
    expect(() => clearDevSandbox()).toThrow(/只能在测试沙盒/);
  });

  it('clearDevSandbox：dev 下清空当前沙盒存档', () => {
    switchDevNamespace('dev');
    repository.saveUser(makeUser({ id: 'u-dev', nickname: 'Sandbox' }));
    useUserStore.setState({ user: makeUser({ id: 'u-dev', nickname: 'Sandbox' }) });
    clearDevSandbox();
    expect(repository.getUser()).toBeNull();
    expect(useUserStore.getState().user).toBeNull();
  });

  it('applyAndReload：写入 localStorage 后 gameProgress store 与 repository 一致', async () => {
    const u = makeUser();
    repository.saveUser(u);
    repository.saveGameProgress(emptyGp(u.id));
    useUserStore.setState({ user: u });
    useGameProgressStore.getState().loadGameProgress(u.id);

    await applyAndReload(() => {
      const gp = repository.getGameProgress(u.id);
      repository.saveGameProgress({
        ...gp,
        advanceProgress: {
          ...gp.advanceProgress,
          'mental-arithmetic': {
            topicId: 'mental-arithmetic',
            heartsAccumulated: 6,
            sessionsPlayed: 0,
            sessionsWhite: 0,
            unlockedAt: Date.now(),
          },
        },
      });
    });

    expect(useGameProgressStore.getState().gameProgress?.advanceProgress['mental-arithmetic']?.heartsAccumulated).toBe(
      6,
    );
    expect(repository.getGameProgress(u.id).advanceProgress['mental-arithmetic']?.heartsAccumulated).toBe(6);
  });
});
