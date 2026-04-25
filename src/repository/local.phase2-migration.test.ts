import { beforeEach, describe, expect, it, vi } from 'vitest';
import { migrateV4ToV5, repository } from './local';
import type { GameProgress, RankMatchSession } from '@/types/gamification';
import type { Question } from '@/types';

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

function makeProgress(activeSessionId = 'rs-hidden'): GameProgress {
  return {
    userId: 'u1',
    campaignProgress: {
      'operation-laws': {
        topicId: 'operation-laws',
        completedLevels: [{ levelId: 'operation-laws-S1-LA-L1', bestHearts: 3, completedAt: 1 }],
        campaignCompleted: false,
      },
    },
    advanceProgress: {
      'bracket-ops': {
        topicId: 'bracket-ops',
        heartsAccumulated: 18,
        sessionsPlayed: 2,
        sessionsWhite: 0,
        unlockedAt: 1,
      },
    },
    rankProgress: { currentTier: 'rookie', history: [], activeSessionId },
    wrongQuestions: [
      {
        question: {
          id: 'old-wrong',
          topicId: 'operation-laws',
          type: 'multiple-choice',
          difficulty: 5,
          prompt: 'old',
          data: {
            kind: 'operation-laws',
            law: 'commutative',
            originalExpression: '1+2',
            transformedExpression: '2+1',
          },
          solution: { answer: '交换律', explanation: 'legacy' },
          hints: [],
        },
        wrongAnswer: '结合律',
        wrongAt: 1,
      },
    ],
    totalQuestionsAttempted: 10,
    totalQuestionsCorrect: 8,
  };
}

function makeQuestion(topicId: Question['topicId']): Question {
  return {
    id: `q-${topicId}`,
    topicId,
    type: 'multiple-choice',
    difficulty: 5,
    prompt: 'rank',
    data: { kind: 'multi-step', expression: '1 + 2', steps: [], options: ['3', '4'] },
    solution: { answer: '3', explanation: 'ok' },
    hints: [],
  };
}

function makeRankSession(topicId: Question['topicId']): RankMatchSession {
  return {
    id: 'rs-hidden',
    userId: 'u1',
    targetTier: 'rookie',
    bestOf: 3,
    winsToAdvance: 2,
    games: [{ gameIndex: 1, finished: false, practiceSessionId: 'ps-hidden', startedAt: 1 }],
    status: 'active',
    startedAt: 1,
    rankQuestionQueue: [makeQuestion(topicId)],
  } as RankMatchSession & { rankQuestionQueue?: Question[] };
}

describe('v0.4 Phase 2 v5 migration', () => {
  beforeEach(() => {
    installLocalStorageMock();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('migrateV4ToV5 preserves legacy A04/A06 data in GameProgress', () => {
    const progress = makeProgress();
    const migrated = migrateV4ToV5(progress);

    expect(migrated.campaignProgress['operation-laws']).toEqual(progress.campaignProgress['operation-laws']);
    expect(migrated.advanceProgress['bracket-ops']).toEqual(progress.advanceProgress['bracket-ops']);
    expect(migrated.wrongQuestions[0].question.topicId).toBe('operation-laws');
  });

  it('repository.init upgrades v4 to v5 and cancels resumable rank sessions containing hidden topics', () => {
    const progress = makeProgress();
    const hiddenSession = makeRankSession('operation-laws');
    const visibleSession: RankMatchSession = {
      ...makeRankSession('multi-step'),
      id: 'rs-visible',
      games: [{ gameIndex: 1, finished: false, practiceSessionId: 'ps-visible', startedAt: 1 }],
    };

    localStorage.setItem('mq_version', '4');
    localStorage.setItem('mq_game_progress', JSON.stringify(progress));
    localStorage.setItem('mq_rank_match_sessions', JSON.stringify({
      'rs-hidden': hiddenSession,
      'rs-visible': visibleSession,
    }));
    localStorage.setItem('mq_sessions', JSON.stringify([
      {
        id: 'ps-hidden',
        userId: 'u1',
        topicId: 'operation-laws',
        difficulty: 5,
        sessionMode: 'rank-match',
        targetLevelId: null,
        startedAt: 1,
        questions: [],
        heartsRemaining: 3,
        completed: false,
        rankMatchMeta: {
          rankSessionId: 'rs-hidden',
          gameIndex: 1,
          targetTier: 'rookie',
          primaryTopics: ['operation-laws'],
        },
        rankQuestionQueue: [makeQuestion('operation-laws')],
      },
    ]));

    repository.init();

    expect(localStorage.getItem('mq_version')).toBe('5');
    const storedProgress = JSON.parse(localStorage.getItem('mq_game_progress') ?? '{}') as GameProgress;
    expect(storedProgress.rankProgress?.activeSessionId).toBeUndefined();
    expect(storedProgress.campaignProgress['operation-laws']).toEqual(progress.campaignProgress['operation-laws']);
    expect(storedProgress.advanceProgress['bracket-ops']).toEqual(progress.advanceProgress['bracket-ops']);

    const storedRankSessions = JSON.parse(localStorage.getItem('mq_rank_match_sessions') ?? '{}') as Record<string, RankMatchSession>;
    expect(storedRankSessions['rs-hidden'].status).toBe('cancelled');
    expect(storedRankSessions['rs-visible'].status).toBe('active');
  });
});
