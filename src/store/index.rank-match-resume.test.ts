// src/store/index.rank-match-resume.test.ts
// ISSUE-060（P1）M2 遗留补做单测：段位赛单局途中刷新恢复
//
// 覆盖 Plan §4.1 明文要求的"mq_sessions + mq_rank_match_sessions 一致性"
// 四类场景：
//   1. 正常恢复：刷新前后 currentQuestion / 下一题行为等价
//   2. 第 1 局途中刷新
//   3. 局间刷新（PracticeSession 已 endedAt 且 RankMatchGame.finished=true，但 outcome 未出）
//   4. 一致性异常 → 抛 RankMatchRecoveryError + 清 activeSessionId（Spec §5.8）

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSessionStore, useUserStore, useGameProgressStore } from './index';
import { useRankMatchStore } from './rank-match';
import { RankMatchRecoveryError } from './rank-match';
import { repository } from '@/repository/local';
import { getCurrentGameIndex } from '@/engine/rank-match/match-state';
import type { GameProgress, AdvanceProgress, TopicAdvanceProgress } from '@/types/gamification';
import type { User, TopicId, PracticeSession } from '@/types';
import { RANK_QUESTIONS_PER_GAME } from '@/constants/rank-match';

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

/** 模拟"已答 N 题"：直接构造 attempts 数组 + 心数，并落盘 PracticeSession（模仿 submitAnswer 的增量落盘行为） */
function simulateAnsweredN(n: number, heartsRemaining: number): void {
  const s = useSessionStore.getState();
  const session = s.session;
  if (!session || !session.rankQuestionQueue) throw new Error('No rank session to answer');
  const attempts = Array.from({ length: n }, (_, i) => ({
    questionId: session.rankQuestionQueue![i].id,
    question: session.rankQuestionQueue![i],
    userAnswer: 'mock',
    correct: i < n - (3 - heartsRemaining), // 前几题对，后几题错，凑够 heart 扣除数
    timeMs: 100,
    hintsUsed: 0,
    attemptedAt: Date.now(),
  }));
  const updated: PracticeSession = {
    ...session,
    questions: attempts,
    heartsRemaining,
  };
  useSessionStore.setState({
    session: updated,
    currentIndex: n,
    hearts: heartsRemaining,
  });
  // ISSUE-060 修复要求：rank-match 答题过程必须落盘
  repository.saveSession(updated);
}

/** 模拟"刷新页面"：清 store 内存，保留 localStorage */
function simulateRefresh(): void {
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
  useRankMatchStore.setState({ activeRankSession: null });
  // gameProgress 由 repository 持久化，通过 getGameProgress 复原
  const userId = useUserStore.getState().user!.id;
  const gp = repository.getGameProgress(userId);
  useGameProgressStore.setState({ gameProgress: gp });
}

beforeEach(() => {
  installLocalStorageMock();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  resetAllStores(makeGP(rookieAdvance()));
});

describe('SessionStore.resumeRankMatchGame · 第 1 局途中刷新恢复（ISSUE-060 场景 1+2）', () => {
  it('答 5 题后刷新 → resumeRankMatchGame 恢复到 currentIndex=5, 同题，剩余心数', () => {
    const rank = useRankMatchStore.getState().startRankMatch('rookie');
    useSessionStore.getState().startRankMatchGame(rank.id, 1);

    const beforeQueue = useSessionStore.getState().session!.rankQuestionQueue!;
    const beforeId6 = beforeQueue[5].id;

    simulateAnsweredN(5, 2);

    simulateRefresh();

    const recovered = useRankMatchStore.getState().loadActiveRankMatch('u1');
    expect(recovered?.id).toBe(rank.id);
    const gi = getCurrentGameIndex(recovered!);
    expect(gi).toBe(1);
    const targetGame = recovered!.games.find(g => g.gameIndex === gi)!;
    useSessionStore.getState().resumeRankMatchGame(targetGame.practiceSessionId);

    const s = useSessionStore.getState();
    expect(s.active).toBe(true);
    expect(s.session?.id).toBe(targetGame.practiceSessionId);
    expect(s.session?.questions).toHaveLength(5);
    expect(s.currentIndex).toBe(5);
    expect(s.hearts).toBe(2);
    expect(s.totalQuestions).toBe(RANK_QUESTIONS_PER_GAME.rookie);
    // 恢复后 currentQuestion 指向第 6 题（与刷新前 queue 的第 6 题同 id）
    expect(s.currentQuestion?.id).toBe(beforeId6);
  });

  it('刷新后 nextQuestion 能继续从 queue 推进（queue 未丢）', () => {
    const rank = useRankMatchStore.getState().startRankMatch('rookie');
    useSessionStore.getState().startRankMatchGame(rank.id, 1);
    const beforeQueue = useSessionStore.getState().session!.rankQuestionQueue!;
    const beforeId7 = beforeQueue[6].id;

    simulateAnsweredN(5, 3);
    simulateRefresh();

    useRankMatchStore.getState().loadActiveRankMatch('u1');
    const gi = getCurrentGameIndex(useRankMatchStore.getState().activeRankSession!)!;
    const targetGame = useRankMatchStore.getState().activeRankSession!.games.find(g => g.gameIndex === gi)!;
    useSessionStore.getState().resumeRankMatchGame(targetGame.practiceSessionId);

    // 模拟 UI 完成第 6 题
    useSessionStore.setState({ currentIndex: 6 });
    useSessionStore.getState().nextQuestion();

    expect(useSessionStore.getState().currentQuestion?.id).toBe(beforeId7);
  });
});

describe('SessionStore.resumeRankMatchGame · 局间刷新（ISSUE-060 场景 3）', () => {
  it('第 1 局已打完（PracticeSession.completed=true）但 BO 未出 outcome → getCurrentGameIndex=undefined，UI 路由走 GameResult / Hub（调用方不应调 resumeRankMatchGame）', () => {
    const rank = useRankMatchStore.getState().startRankMatch('rookie');
    useSessionStore.getState().startRankMatchGame(rank.id, 1);

    // 模拟答完且赢
    const sess = useSessionStore.getState().session!;
    const queue = sess.rankQuestionQueue!;
    const attempts = queue.map((q, i) => ({
      questionId: q.id,
      question: q,
      userAnswer: 'mock',
      correct: true,
      timeMs: 1,
      hintsUsed: 0,
      attemptedAt: Date.now() + i,
    }));
    useSessionStore.setState({
      session: { ...sess, questions: attempts },
      currentIndex: queue.length,
      hearts: 3,
    });
    useSessionStore.getState().endSession();

    // 模拟刷新
    simulateRefresh();

    // 恢复 rank-match session
    const recovered = useRankMatchStore.getState().loadActiveRankMatch('u1');
    expect(recovered).not.toBeNull();
    // outcome 未出（BO3 仅打完 1 局，winsToAdvance=2 未达）
    expect(recovered?.outcome).toBeUndefined();
    // 活跃局 = undefined（games[0] 已 finished，下一局未创建）
    expect(getCurrentGameIndex(recovered!)).toBeUndefined();
    // → UI 层应走 GameResult / 开下一局路径；不调 resumeRankMatchGame
  });

  it('resumeRankMatchGame 传入"已完成"的 practiceSessionId → 抛 RankMatchRecoveryError 并清 activeSessionId', () => {
    const rank = useRankMatchStore.getState().startRankMatch('rookie');
    useSessionStore.getState().startRankMatchGame(rank.id, 1);

    const sess = useSessionStore.getState().session!;
    const queue = sess.rankQuestionQueue!;
    const attempts = queue.map((q, i) => ({
      questionId: q.id,
      question: q,
      userAnswer: 'mock',
      correct: true,
      timeMs: 1,
      hintsUsed: 0,
      attemptedAt: Date.now() + i,
    }));
    useSessionStore.setState({
      session: { ...sess, questions: attempts },
      currentIndex: queue.length,
      hearts: 3,
    });
    const firstPsId = sess.id;
    useSessionStore.getState().endSession();

    simulateRefresh();
    useRankMatchStore.getState().loadActiveRankMatch('u1');

    expect(() => useSessionStore.getState().resumeRankMatchGame(firstPsId)).toThrow(
      RankMatchRecoveryError,
    );
    // 副作用：rank-match 全局状态清空
    expect(useRankMatchStore.getState().activeRankSession).toBeNull();
    expect(useGameProgressStore.getState().gameProgress?.rankProgress?.activeSessionId).toBeUndefined();
  });
});

describe('SessionStore.resumeRankMatchGame · 一致性异常（ISSUE-060 场景 4 · Spec §5.8）', () => {
  it('PracticeSession 不存在 → 抛 RankMatchRecoveryError + 清 activeSessionId', () => {
    const rank = useRankMatchStore.getState().startRankMatch('rookie');
    useSessionStore.getState().startRankMatchGame(rank.id, 1);
    simulateRefresh();
    useRankMatchStore.getState().loadActiveRankMatch('u1');

    expect(() => useSessionStore.getState().resumeRankMatchGame('never-saved-id')).toThrow(
      RankMatchRecoveryError,
    );
    expect(useGameProgressStore.getState().gameProgress?.rankProgress?.activeSessionId).toBeUndefined();
    expect(useRankMatchStore.getState().activeRankSession).toBeNull();
  });

  it('rankMatchMeta.rankSessionId 与 activeRankSession 不一致 → 抛错 + 清 activeSessionId', () => {
    const rank = useRankMatchStore.getState().startRankMatch('rookie');
    useSessionStore.getState().startRankMatchGame(rank.id, 1);

    // 篡改存档：把 PracticeSession 的 rankSessionId 改错
    const sess = useSessionStore.getState().session!;
    const tampered: PracticeSession = {
      ...sess,
      rankMatchMeta: { ...sess.rankMatchMeta!, rankSessionId: 'other-rank' },
    };
    repository.saveSession(tampered);

    simulateRefresh();
    useRankMatchStore.getState().loadActiveRankMatch('u1');

    expect(() => useSessionStore.getState().resumeRankMatchGame(sess.id)).toThrow(
      RankMatchRecoveryError,
    );
    expect(useGameProgressStore.getState().gameProgress?.rankProgress?.activeSessionId).toBeUndefined();
  });

  it('已答题数 > queue 长度（数据损坏）→ 抛错 + 清 activeSessionId', () => {
    const rank = useRankMatchStore.getState().startRankMatch('rookie');
    useSessionStore.getState().startRankMatchGame(rank.id, 1);

    const sess = useSessionStore.getState().session!;
    const queue = sess.rankQuestionQueue!;
    // 制造 21 条 attempts 超过 queue 长度 20
    const overAnswered: PracticeSession = {
      ...sess,
      questions: [...Array(queue.length + 1)].map((_, i) => ({
        questionId: 'mock',
        question: queue[0],
        userAnswer: 'x',
        correct: true,
        timeMs: 1,
        hintsUsed: 0,
        attemptedAt: i,
      })),
    };
    repository.saveSession(overAnswered);

    simulateRefresh();
    useRankMatchStore.getState().loadActiveRankMatch('u1');

    expect(() => useSessionStore.getState().resumeRankMatchGame(sess.id)).toThrow(
      RankMatchRecoveryError,
    );
    expect(useGameProgressStore.getState().gameProgress?.rankProgress?.activeSessionId).toBeUndefined();
  });

  it('rankQuestionQueue 缺失（v2 残留 / 未持久化）→ 抛错 + 清 activeSessionId', () => {
    const rank = useRankMatchStore.getState().startRankMatch('rookie');
    useSessionStore.getState().startRankMatchGame(rank.id, 1);

    const sess = useSessionStore.getState().session!;
    const noQueue: PracticeSession = { ...sess };
    delete noQueue.rankQuestionQueue;
    repository.saveSession(noQueue);

    simulateRefresh();
    useRankMatchStore.getState().loadActiveRankMatch('u1');

    expect(() => useSessionStore.getState().resumeRankMatchGame(sess.id)).toThrow(
      RankMatchRecoveryError,
    );
    expect(useGameProgressStore.getState().gameProgress?.rankProgress?.activeSessionId).toBeUndefined();
  });
});

describe('SessionStore.startRankMatchGame · 落盘副作用（ISSUE-060）', () => {
  it('启动第 1 局后立即落盘 PracticeSession（含 rankQuestionQueue），可从 repository 读回', () => {
    const rank = useRankMatchStore.getState().startRankMatch('rookie');
    useSessionStore.getState().startRankMatchGame(rank.id, 1);
    const sessionId = rank.games[0].practiceSessionId;
    const saved = repository.getSessions().find(s => s.id === sessionId);
    expect(saved).toBeDefined();
    expect(saved?.rankQuestionQueue).toHaveLength(RANK_QUESTIONS_PER_GAME.rookie);
    expect(saved?.questions).toHaveLength(0); // 启动时尚未作答
  });
});
