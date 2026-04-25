// src/store/index.rank-match.test.ts
// 段位赛 session store E2E 单测 · Phase 3 M2
//
// 覆盖：
//   - startRankMatchGame：前置校验 / PracticeSession 构造 / rankQuestionQueue 生成
//   - endSession 在 sessionMode='rank-match' 的分支：调 handleGameFinished 并写 lastRankMatchAction
//   - BO3 胜→start-next→胜→promoted
//   - BO3 负→start-next→负→eliminated（§7.4 数学上无法翻盘）

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSessionStore, useUserStore, useGameProgressStore } from './index';
import { useRankMatchStore } from './rank-match';
import type { GameProgress, AdvanceProgress, TopicAdvanceProgress } from '@/types/gamification';
import type { User, TopicId } from '@/types';
import { RANK_QUESTIONS_PER_GAME } from '@/constants/rank-match';

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
    nickname: 't',
    avatarSeed: 's',
    createdAt: 0,
    settings: { soundEnabled: true, hapticsEnabled: true },
  };
}

function makeGP(advance: AdvanceProgress): GameProgress {
  return {
    userId: 'u1',
    campaignProgress: {},
    advanceProgress: advance,
    rankProgress: { currentTier: 'apprentice', history: [] },
    wrongQuestions: [],
    totalQuestionsAttempted: 0,
    totalQuestionsCorrect: 0,
  };
}

function resetAllStores(gp: GameProgress): void {
  useUserStore.setState({ user: makeUser() });
  useGameProgressStore.setState({ gameProgress: gp });
  useRankMatchStore.setState({ activeRankSession: null });
  useSessionStore.setState({
    active: false,
    session: null,
    currentQuestion: null,
    currentIndex: 0,
    totalQuestions: 0,
    hearts: 3,
    questionStartTime: 0,
    showFeedback: false,
    lastAnswerCorrect: false,
    lastTrainingFieldMistakes: [],
    pendingWrongQuestions: [],
    rankQuestionQueue: [],
    lastRankMatchAction: null,
  });
}

/** 把当前 session 调整为"已答完、剩 N 心"的状态，随即调用 endSession */
function finishCurrentGameWithHearts(hearts: number): void {
  const session = useSessionStore.getState().session;
  if (!session) throw new Error('No active session');
  const total = RANK_QUESTIONS_PER_GAME[session.rankMatchMeta!.targetTier];
  useSessionStore.setState({
    currentIndex: total,
    hearts,
  });
  useSessionStore.getState().endSession();
}

beforeEach(() => {
  installLocalStorageMock();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  resetAllStores(makeGP(rookieAdvance()));
});

describe('SessionStore.startRankMatchGame', () => {
  it('前置：startRankMatch 后调 startRankMatchGame(session.id, 1) 启动第 1 局', () => {
    const rank = useRankMatchStore.getState().startRankMatch('rookie');

    useSessionStore.getState().startRankMatchGame(rank.id, 1);

    const s = useSessionStore.getState();
    expect(s.active).toBe(true);
    expect(s.session?.sessionMode).toBe('rank-match');
    expect(s.session?.rankMatchMeta?.rankSessionId).toBe(rank.id);
    expect(s.session?.rankMatchMeta?.gameIndex).toBe(1);
    expect(s.session?.rankMatchMeta?.targetTier).toBe('rookie');
    expect(s.session?.rankMatchMeta?.primaryTopics.length).toBeGreaterThan(0);
    expect(s.session?.id).toBe(rank.games[0].practiceSessionId);
    expect(s.rankQuestionQueue).toHaveLength(RANK_QUESTIONS_PER_GAME.rookie);
    expect(s.totalQuestions).toBe(RANK_QUESTIONS_PER_GAME.rookie);
    expect(s.currentQuestion).not.toBeNull();
  });

  it('rankSessionId 不匹配 → 抛错', () => {
    useRankMatchStore.getState().startRankMatch('rookie');
    expect(() => useSessionStore.getState().startRankMatchGame('bogus', 1)).toThrow(/mismatch/i);
  });

  it('无活跃 rank session → 抛错', () => {
    expect(() => useSessionStore.getState().startRankMatchGame('any', 1)).toThrow(
      /no active rank match session/i,
    );
  });

  it('gameIndex 不存在 → 抛错', () => {
    const rank = useRankMatchStore.getState().startRankMatch('rookie');
    expect(() => useSessionStore.getState().startRankMatchGame(rank.id, 5)).toThrow(/not found/i);
  });
});

describe('SessionStore.endSession · rank-match 分支', () => {
  it('BO3 第 1 局胜 → lastRankMatchAction = start-next', () => {
    const rank = useRankMatchStore.getState().startRankMatch('rookie');
    useSessionStore.getState().startRankMatchGame(rank.id, 1);

    finishCurrentGameWithHearts(2);

    const action = useSessionStore.getState().lastRankMatchAction;
    expect(action).toEqual({ kind: 'start-next' });
    // 活跃 session 已推进到 rank layer：第 1 局 finished=true won=true
    const active = useRankMatchStore.getState().activeRankSession;
    expect(active?.games[0]).toMatchObject({ finished: true, won: true, gameIndex: 1 });
    expect(active?.outcome).toBeUndefined();
  });

  it('BO3 第 1 局负（hearts=0） → start-next；第 2 局负 → eliminated（§7.4 提前结束）', () => {
    const rank = useRankMatchStore.getState().startRankMatch('rookie');
    useSessionStore.getState().startRankMatchGame(rank.id, 1);

    finishCurrentGameWithHearts(0);
    expect(useSessionStore.getState().lastRankMatchAction).toEqual({ kind: 'start-next' });

    // M4 修复：startRankMatchGame 会按需 inflate 下一局占位（store 层不自动 push）
    useSessionStore.getState().startRankMatchGame(rank.id, 2);
    expect(useRankMatchStore.getState().activeRankSession!.games).toHaveLength(2);
    finishCurrentGameWithHearts(0);

    const action = useSessionStore.getState().lastRankMatchAction;
    expect(action).toEqual({ kind: 'eliminated' });
    const gp = useGameProgressStore.getState().gameProgress;
    expect(gp?.rankProgress?.currentTier).toBe('apprentice');
    expect(gp?.rankProgress?.activeSessionId).toBeUndefined();
  });

  it('BO3 胜胜 → 晋级；games.length=2，不产生第 3 局 RankMatchGame（§7.4）', () => {
    const rank = useRankMatchStore.getState().startRankMatch('rookie');
    useSessionStore.getState().startRankMatchGame(rank.id, 1);
    finishCurrentGameWithHearts(3);
    expect(useSessionStore.getState().lastRankMatchAction).toEqual({ kind: 'start-next' });

    // M4 修复：startRankMatchGame 按需 inflate 下一局占位
    useSessionStore.getState().startRankMatchGame(rank.id, 2);
    expect(useRankMatchStore.getState().activeRankSession!.games).toHaveLength(2);
    finishCurrentGameWithHearts(2);

    const action = useSessionStore.getState().lastRankMatchAction;
    expect(action).toEqual({ kind: 'promoted' });

    const active = useRankMatchStore.getState().activeRankSession;
    expect(active?.games).toHaveLength(2);
    expect(active?.outcome).toBe('promoted');

    const gp = useGameProgressStore.getState().gameProgress;
    expect(gp?.rankProgress?.currentTier).toBe('rookie');
  });

  it('campaign / advance 模式 endSession 不写 lastRankMatchAction', () => {
    // 不启段位赛，单独注入 campaign session
    useSessionStore.setState({
      active: true,
      session: {
        id: 's1',
        userId: 'u1',
        topicId: 'mental-arithmetic',
        startedAt: 0,
        difficulty: 3,
        sessionMode: 'campaign',
        targetLevelId: 'mental-arithmetic-S1-LA-L1',
        questions: [],
        heartsRemaining: 3,
        completed: false,
      },
      currentIndex: 10,
      totalQuestions: 10,
      hearts: 3,
      lastRankMatchAction: { kind: 'promoted' }, // 故意脏数据，验证 endSession 会清
    });
    useSessionStore.getState().endSession();
    // campaign 分支不动 lastRankMatchAction（显式写 null）
    expect(useSessionStore.getState().lastRankMatchAction).toBeNull();
  });
});
