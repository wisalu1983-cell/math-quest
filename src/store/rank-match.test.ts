// src/store/rank-match.test.ts
// 段位赛 store 最小 API 单测 · Phase 3 M1

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRankMatchStore } from './rank-match';
import { useUserStore, useGameProgressStore } from './index';
import type { GameProgress, AdvanceProgress, TopicAdvanceProgress } from '@/types/gamification';
import type { PracticeSession, User, TopicId } from '@/types';

// ─── localStorage mock ───

function installLocalStorageMock(): void {
  const store = new Map<string, string>();
  const mock = {
    getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => { store.clear(); },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
  };
  (globalThis as Record<string, unknown>).localStorage = mock;
}

// ─── 辅助构造 ───

function makeAdvance(map: Partial<Record<TopicId, number>>): AdvanceProgress {
  const ap: AdvanceProgress = {};
  for (const [topic, hearts] of Object.entries(map) as Array<[TopicId, number]>) {
    const entry: TopicAdvanceProgress = {
      topicId: topic,
      heartsAccumulated: hearts,
      sessionsPlayed: 0,
      sessionsWhite: 0,
      unlockedAt: 0,
    };
    ap[topic] = entry;
  }
  return ap;
}

function rookieAdvance(): AdvanceProgress {
  return makeAdvance({
    'mental-arithmetic': 6,
    'number-sense':      6,
    'vertical-calc':     6,
    'operation-laws':    6,
  });
}

function makeUser(): User {
  return {
    id: 'u1',
    nickname: 'tester',
    avatarSeed: 's',
    createdAt: 0,
    settings: { soundEnabled: true, hapticsEnabled: true },
  };
}

function makeGameProgress(advanceProgress: AdvanceProgress): GameProgress {
  return {
    userId: 'u1',
    campaignProgress: {},
    advanceProgress,
    rankProgress: { currentTier: 'apprentice', history: [] },
    wrongQuestions: [],
    totalQuestionsAttempted: 0,
    totalQuestionsCorrect: 0,
  };
}

function resetStores(gp: GameProgress): void {
  useUserStore.setState({ user: makeUser() });
  useGameProgressStore.setState({ gameProgress: gp });
  useRankMatchStore.setState({ activeRankSession: null });
}

function makePracticeSnapshot(opts: {
  rankSessionId: string;
  gameIndex: number;
  won: boolean;
}): PracticeSession {
  return {
    id: `ps-${opts.gameIndex}`,
    userId: 'u1',
    topicId: 'mental-arithmetic',
    startedAt: 0,
    endedAt: 1000,
    difficulty: 4,
    sessionMode: 'rank-match',
    targetLevelId: null,
    questions: [],
    heartsRemaining: opts.won ? 2 : 0,
    completed: true,
    rankMatchMeta: {
      rankSessionId: opts.rankSessionId,
      gameIndex: opts.gameIndex,
      targetTier: 'rookie',
      primaryTopics: ['mental-arithmetic'],
    },
  };
}

// ─── tests ───

describe('useRankMatchStore · startRankMatch', () => {
  beforeEach(() => {
    installLocalStorageMock();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('未满足新秀门槛 → 抛错', () => {
    resetStores(makeGameProgress({}));
    expect(() => useRankMatchStore.getState().startRankMatch('rookie')).toThrow(/not unlocked/i);
    expect(useRankMatchStore.getState().activeRankSession).toBeNull();
  });

  it('满足门槛 → 创建 BO3 session 并写入 rankProgress.activeSessionId', () => {
    resetStores(makeGameProgress(rookieAdvance()));
    const session = useRankMatchStore.getState().startRankMatch('rookie');

    expect(session.bestOf).toBe(3);
    expect(session.winsToAdvance).toBe(2);
    expect(session.games).toHaveLength(1);

    expect(useRankMatchStore.getState().activeRankSession?.id).toBe(session.id);
    const gp = useGameProgressStore.getState().gameProgress;
    expect(gp?.rankProgress?.activeSessionId).toBe(session.id);
  });

  it('已有进行中赛事 → 第二次 startRankMatch 抛错', () => {
    resetStores(makeGameProgress(rookieAdvance()));
    useRankMatchStore.getState().startRankMatch('rookie');
    expect(() => useRankMatchStore.getState().startRankMatch('rookie')).toThrow();
  });
});

describe('useRankMatchStore · handleGameFinished', () => {
  beforeEach(() => {
    installLocalStorageMock();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('BO3 胜胜 → outcome=promoted，rankProgress.currentTier 升到 rookie', () => {
    resetStores(makeGameProgress(rookieAdvance()));
    const session = useRankMatchStore.getState().startRankMatch('rookie');

    // 第 1 局胜
    const a1 = useRankMatchStore.getState().handleGameFinished(
      makePracticeSnapshot({ rankSessionId: session.id, gameIndex: 1, won: true }),
    );
    expect(a1).toEqual({ kind: 'start-next' });

    // 模拟外部调用 startNextGame（M1 store 未封装此动作；但状态机支持）
    // 这里用 _setActiveRankSession 手工推进：模拟 M2 会做的事
    const afterStartNext = {
      ...useRankMatchStore.getState().activeRankSession!,
      games: [
        ...useRankMatchStore.getState().activeRankSession!.games,
        {
          gameIndex: 2,
          finished: false,
          practiceSessionId: 'ps2',
          startedAt: Date.now(),
        },
      ],
    };
    useRankMatchStore.getState()._setActiveRankSession(afterStartNext);

    // 第 2 局胜 → 晋级
    const a2 = useRankMatchStore.getState().handleGameFinished(
      makePracticeSnapshot({ rankSessionId: session.id, gameIndex: 2, won: true }),
    );
    expect(a2).toEqual({ kind: 'promoted' });

    const gp = useGameProgressStore.getState().gameProgress;
    expect(gp?.rankProgress?.currentTier).toBe('rookie');
    expect(gp?.rankProgress?.activeSessionId).toBeUndefined();
    expect(gp?.rankProgress?.history).toHaveLength(1);
    expect(gp?.rankProgress?.history[0]).toMatchObject({
      targetTier: 'rookie',
      outcome: 'promoted',
    });
  });

  it('BO3 负负 → outcome=eliminated，currentTier 保持 apprentice，history 追加 eliminated', () => {
    resetStores(makeGameProgress(rookieAdvance()));
    const session = useRankMatchStore.getState().startRankMatch('rookie');

    useRankMatchStore.getState().handleGameFinished(
      makePracticeSnapshot({ rankSessionId: session.id, gameIndex: 1, won: false }),
    );
    // 手工开第 2 局
    const next = {
      ...useRankMatchStore.getState().activeRankSession!,
      games: [
        ...useRankMatchStore.getState().activeRankSession!.games,
        { gameIndex: 2, finished: false, practiceSessionId: 'ps2', startedAt: 0 },
      ],
    };
    useRankMatchStore.getState()._setActiveRankSession(next);

    const a = useRankMatchStore.getState().handleGameFinished(
      makePracticeSnapshot({ rankSessionId: session.id, gameIndex: 2, won: false }),
    );
    expect(a).toEqual({ kind: 'eliminated' });

    const gp = useGameProgressStore.getState().gameProgress;
    expect(gp?.rankProgress?.currentTier).toBe('apprentice');
    expect(gp?.rankProgress?.activeSessionId).toBeUndefined();
    expect(gp?.rankProgress?.history[0]).toMatchObject({
      targetTier: 'rookie',
      outcome: 'eliminated',
    });
  });

  it('PracticeSession 的 rankSessionId 不匹配 → 抛错', () => {
    resetStores(makeGameProgress(rookieAdvance()));
    useRankMatchStore.getState().startRankMatch('rookie');
    expect(() =>
      useRankMatchStore
        .getState()
        .handleGameFinished(
          makePracticeSnapshot({ rankSessionId: 'wrong-id', gameIndex: 1, won: true }),
        ),
    ).toThrow();
  });

  it('无活跃赛事 → handleGameFinished 抛错', () => {
    resetStores(makeGameProgress(rookieAdvance()));
    expect(() =>
      useRankMatchStore
        .getState()
        .handleGameFinished(
          makePracticeSnapshot({ rankSessionId: 'any', gameIndex: 1, won: true }),
        ),
    ).toThrow();
  });
});
