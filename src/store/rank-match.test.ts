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
    'multi-step':        6,
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
  useRankMatchStore.setState({ activeRankSession: null, startedInThisSession: new Set() });
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
    expect((session as PracticeSession & { status?: string }).status).toBe('active');

    expect(useRankMatchStore.getState().activeRankSession?.id).toBe(session.id);
    const gp = useGameProgressStore.getState().gameProgress;
    expect(gp?.rankProgress?.activeSessionId).toBe(session.id);
  });

  it('已有进行中赛事 → 第二次 startRankMatch 抛错', () => {
    resetStores(makeGameProgress(rookieAdvance()));
    useRankMatchStore.getState().startRankMatch('rookie');
    expect(() => useRankMatchStore.getState().startRankMatch('rookie')).toThrow();
  });

  it('active session 可被显式 suspend，且 activeSessionId 保留', () => {
    resetStores(makeGameProgress(rookieAdvance()));
    const session = useRankMatchStore.getState().startRankMatch('rookie');

    const suspended = (useRankMatchStore.getState() as any).suspendActiveMatch();

    expect(suspended.status).toBe('suspended');
    expect(useRankMatchStore.getState().activeRankSession?.status).toBe('suspended');
    expect(useGameProgressStore.getState().gameProgress?.rankProgress?.activeSessionId).toBe(session.id);
  });

  it('suspended session 可被重新激活为 active', () => {
    resetStores(makeGameProgress(rookieAdvance()));
    useRankMatchStore.getState().startRankMatch('rookie');
    (useRankMatchStore.getState() as any).suspendActiveMatch();

    const reactivated = (useRankMatchStore.getState() as any).reactivateSuspendedMatch();

    expect(reactivated.status).toBe('active');
    expect(useRankMatchStore.getState().activeRankSession?.status).toBe('active');
  });

  it('startRankMatch 与 reactivateSuspendedMatch 会标记本启动周期发起的 session', () => {
    resetStores(makeGameProgress(rookieAdvance()));
    const session = useRankMatchStore.getState().startRankMatch('rookie');

    expect(useRankMatchStore.getState().startedInThisSession.has(session.id)).toBe(true);

    (useRankMatchStore.getState() as any).suspendActiveMatch();
    useRankMatchStore.setState({ startedInThisSession: new Set() });
    const reactivated = (useRankMatchStore.getState() as any).reactivateSuspendedMatch();

    expect(useRankMatchStore.getState().startedInThisSession.has(reactivated.id)).toBe(true);
  });

  it('active session 可被 cancel；会话标记为 cancelled，activeSessionId 清空且 history 不追加', () => {
    resetStores(makeGameProgress(rookieAdvance()));
    const session = useRankMatchStore.getState().startRankMatch('rookie');

    const cancelled = (useRankMatchStore.getState() as any).cancelActiveMatch();

    expect(cancelled.status).toBe('cancelled');
    expect(repository.getRankMatchSession(session.id)?.status).toBe('cancelled');
    expect(useRankMatchStore.getState().activeRankSession).toBeNull();
    const gp = useGameProgressStore.getState().gameProgress;
    expect(gp?.rankProgress?.activeSessionId).toBeUndefined();
    expect(gp?.rankProgress?.history).toHaveLength(0);
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

    // 模拟外部调用 startNextGame（rank-match store 不在 handleGameFinished 里自动 push；
    // session 层的 startRankMatchGame 在"开始下一局"时负责 inflate）
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
    // 手工开第 2 局（store 层不自动 push，由 session 层 startRankMatchGame 负责 inflate）
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

// ─── ISSUE-060 M2 遗留补做：RankMatchSession 持久化 + 启动恢复 ───

import { repository } from '@/repository/local';

describe('useRankMatchStore · 持久化写入（ISSUE-060）', () => {
  beforeEach(() => {
    installLocalStorageMock();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('startRankMatch 成功后立即 saveRankMatchSession（存档有此 id）', () => {
    resetStores(makeGameProgress(rookieAdvance()));
    const session = useRankMatchStore.getState().startRankMatch('rookie');
    const persisted = repository.getRankMatchSession(session.id);
    expect(persisted).not.toBeNull();
    expect(persisted?.targetTier).toBe('rookie');
    expect(persisted?.games[0].gameIndex).toBe(1);
  });

  it('handleGameFinished 每次都把最新 session 落盘（胜负状态可从存档读回）', () => {
    resetStores(makeGameProgress(rookieAdvance()));
    const session = useRankMatchStore.getState().startRankMatch('rookie');
    useRankMatchStore.getState().handleGameFinished(
      makePracticeSnapshot({ rankSessionId: session.id, gameIndex: 1, won: true }),
    );
    const persisted = repository.getRankMatchSession(session.id);
    expect(persisted?.games[0]).toMatchObject({ finished: true, won: true });
  });
});

describe('useRankMatchStore · loadActiveRankMatch（ISSUE-060 启动恢复）', () => {
  beforeEach(() => {
    installLocalStorageMock();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('rankProgress.activeSessionId 为空 → 返回 null，不改变 activeRankSession', () => {
    resetStores(makeGameProgress(rookieAdvance()));
    const result = useRankMatchStore.getState().loadActiveRankMatch('u1');
    expect(result).toBeNull();
    expect(useRankMatchStore.getState().activeRankSession).toBeNull();
  });

  it('有 activeSessionId 且存档存在 → 恢复到 activeRankSession', () => {
    resetStores(makeGameProgress(rookieAdvance()));
    const session = useRankMatchStore.getState().startRankMatch('rookie');
    useRankMatchStore.setState({ activeRankSession: null }); // 模拟刷新后内存丢失

    const recovered = useRankMatchStore.getState().loadActiveRankMatch('u1');
    expect(recovered?.id).toBe(session.id);
    expect(useRankMatchStore.getState().activeRankSession?.id).toBe(session.id);
  });

  it('suspended session 仍可被 loadActiveRankMatch 恢复到 activeRankSession（但不应视为 completed）', () => {
    resetStores(makeGameProgress(rookieAdvance()));
    const session = useRankMatchStore.getState().startRankMatch('rookie');
    const suspended = { ...session, status: 'suspended' as const, suspendedAt: 1500 };
    repository.saveRankMatchSession(suspended);
    useRankMatchStore.setState({ activeRankSession: null });

    const recovered = useRankMatchStore.getState().loadActiveRankMatch('u1');

    expect(recovered?.id).toBe(session.id);
    expect(recovered?.status).toBe('suspended');
    expect(useRankMatchStore.getState().activeRankSession?.status).toBe('suspended');
  });

  it('activeSessionId 指向的存档不存在（一致性异常）→ 清 activeSessionId 返回 null', () => {
    const gp = makeGameProgress(rookieAdvance());
    gp.rankProgress!.activeSessionId = 'missing-id';
    resetStores(gp);
    repository.saveGameProgress(gp);

    const result = useRankMatchStore.getState().loadActiveRankMatch('u1');
    expect(result).toBeNull();
    expect(useRankMatchStore.getState().activeRankSession).toBeNull();
    // 副作用：activeSessionId 被清
    expect(useGameProgressStore.getState().gameProgress?.rankProgress?.activeSessionId).toBeUndefined();
  });

  it('存档 session.userId 不匹配当前 user → 清 activeSessionId 返回 null', () => {
    resetStores(makeGameProgress(rookieAdvance()));
    const session = useRankMatchStore.getState().startRankMatch('rookie');

    // 手动写一条 userId 不一致的存档覆盖
    const tampered = { ...session, userId: 'someone-else' };
    repository.saveRankMatchSession(tampered);
    useRankMatchStore.setState({ activeRankSession: null });

    const result = useRankMatchStore.getState().loadActiveRankMatch('u1');
    expect(result).toBeNull();
    expect(useGameProgressStore.getState().gameProgress?.rankProgress?.activeSessionId).toBeUndefined();
  });

  it('已出 outcome（BO 已结束）的 session → 视为无需恢复，清 activeSessionId 返回 null', () => {
    resetStores(makeGameProgress(rookieAdvance()));
    const session = useRankMatchStore.getState().startRankMatch('rookie');
    const finishedSession: typeof session = { ...session, status: 'completed', outcome: 'promoted', endedAt: 2000 };
    repository.saveRankMatchSession(finishedSession);
    useRankMatchStore.setState({ activeRankSession: null });

    const result = useRankMatchStore.getState().loadActiveRankMatch('u1');
    expect(result).toBeNull();
    expect(useGameProgressStore.getState().gameProgress?.rankProgress?.activeSessionId).toBeUndefined();
  });

  it('cancelled session → 视为无需恢复，清 activeSessionId 返回 null', () => {
    resetStores(makeGameProgress(rookieAdvance()));
    const session = useRankMatchStore.getState().startRankMatch('rookie');
    const cancelledSession: typeof session = {
      ...session,
      status: 'cancelled',
      cancelledAt: 1800,
      endedAt: 1800,
    };
    repository.saveRankMatchSession(cancelledSession);
    useRankMatchStore.setState({ activeRankSession: null });

    const result = useRankMatchStore.getState().loadActiveRankMatch('u1');

    expect(result).toBeNull();
    expect(useGameProgressStore.getState().gameProgress?.rankProgress?.activeSessionId).toBeUndefined();
  });
});
