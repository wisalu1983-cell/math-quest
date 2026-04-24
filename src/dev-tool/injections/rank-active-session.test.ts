// F3 · rank-active-session：buildMidBO 边界 + 注册注入产物结构

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { repository, setStorageNamespace } from '@/repository/local';
import { useUserStore, useGameProgressStore } from '@/store';
import { RANK_WINS_TO_ADVANCE } from '@/constants/rank-match';
import { RankMatchRecoveryError } from '@/store/rank-match';
import { buildMidBO, rankActiveSessionInjections } from './rank-active-session';
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

function makeUser(): User {
  return {
    id: 'u-bo',
    nickname: 'BO',
    avatarSeed: 's',
    createdAt: 0,
    settings: { soundEnabled: true, hapticsEnabled: true },
  };
}

function baseGp(userId: string): GameProgress {
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

describe('buildMidBO', () => {
  beforeEach(() => {
    installLocalStorageMock();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.clear();
    setStorageNamespace('main');
    repository.init();
    const u = makeUser();
    repository.saveUser(u);
    repository.saveGameProgress(baseGp(u.id));
    useUserStore.setState({ user: u });
  });

  afterEach(() => {
    localStorage.clear();
    setStorageNamespace('main');
    repository.init();
    useUserStore.setState({ user: null });
    useGameProgressStore.setState({ gameProgress: null });
    vi.restoreAllMocks();
  });

  it('无用户时抛 RankMatchRecoveryError（no-user）', () => {
    useUserStore.setState({ user: null });
    let caught: unknown;
    try {
      buildMidBO({ targetTier: 'rookie', wins: 1, losses: 1 });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(RankMatchRecoveryError);
    expect((caught as RankMatchRecoveryError).reason).toBe('no-user');
  });

  it('rookie：2:0 已满足晋级 → invalid-mid-state', () => {
    expect(() => buildMidBO({ targetTier: 'rookie', wins: 2, losses: 0 })).toThrow(RankMatchRecoveryError);
  });

  it('rookie：0:2 已淘汰 → invalid-mid-state', () => {
    expect(() => buildMidBO({ targetTier: 'rookie', wins: 0, losses: 2 })).toThrow(RankMatchRecoveryError);
  });

  it('rookie：1:2 再加决胜局会超出 BO3 → invalid-mid-state', () => {
    expect(() => buildMidBO({ targetTier: 'rookie', wins: 1, losses: 2 })).toThrow(RankMatchRecoveryError);
  });

  it('master：4:2 已满足晋级 → invalid-mid-state', () => {
    expect(() => buildMidBO({ targetTier: 'master', wins: 4, losses: 2 })).toThrow(RankMatchRecoveryError);
  });

  it.each([
    { tier: 'rookie' as const, wins: 1, losses: 1, wantGames: 3, bestOf: 3 },
    { tier: 'pro' as const, wins: 2, losses: 2, wantGames: 5, bestOf: 5 },
    { tier: 'expert' as const, wins: 2, losses: 2, wantGames: 5, bestOf: 5 },
    { tier: 'master' as const, wins: 3, losses: 3, wantGames: 7, bestOf: 7 },
  ] as const)('$tier $wins-$losses：已赛场次 + 决胜局 = bestOf，末局未结束', ({ tier, wins, losses, wantGames, bestOf }) => {
    const session = buildMidBO({ targetTier: tier, wins, losses });
    expect(session.bestOf).toBe(bestOf);
    expect(session.winsToAdvance).toBe(RANK_WINS_TO_ADVANCE[tier]);
    expect(session.games.length).toBe(wantGames);
    const last = session.games[session.games.length - 1];
    expect(last.finished).toBe(false);
    expect(session.games.slice(0, -1).every(g => g.finished)).toBe(true);
    const wonCount = session.games.slice(0, -1).filter(g => g.won).length;
    const lostCount = session.games.slice(0, -1).filter(g => !g.won).length;
    expect(wonCount).toBe(wins);
    expect(lostCount).toBe(losses);
  });
});

describe('rankActiveSessionInjections · construct 冒烟', () => {
  beforeEach(() => {
    installLocalStorageMock();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.clear();
    setStorageNamespace('main');
    repository.init();
    const u = makeUser();
    repository.saveUser(u);
    repository.saveGameProgress(baseGp(u.id));
    useUserStore.setState({ user: u });
    useGameProgressStore.getState().loadGameProgress(u.id);
  });

  afterEach(() => {
    localStorage.clear();
    setStorageNamespace('main');
    repository.init();
    useUserStore.setState({ user: null });
    useGameProgressStore.setState({ gameProgress: null });
    vi.restoreAllMocks();
  });

  it('构造 rookie 1-1 中途态后，存档与 session 字段自洽', async () => {
    const inj = rankActiveSessionInjections.find(i => i.id === 'rank.construct-active-bo.rookie.1-1');
    expect(inj).toBeDefined();
    await inj!.run();
    const gp = useGameProgressStore.getState().gameProgress;
    const id = gp?.rankProgress?.activeSessionId;
    expect(id).toBeDefined();
    const session = repository.getRankMatchSession(id!);
    expect(session).not.toBeNull();
    expect(session!.targetTier).toBe('rookie');
    expect(session!.games.length).toBe(3);
    expect(session!.games[2]!.finished).toBe(false);
  });
});
