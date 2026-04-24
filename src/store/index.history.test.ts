import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { repository, setStorageNamespace } from '@/repository/local';
import { useGameProgressStore, useSessionStore, useUserStore } from './index';
import type { PracticeSession, Question, QuestionAttempt, TopicId, User } from '@/types';
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
    id: 'u1',
    nickname: 'Tester',
    avatarSeed: 'seed',
    createdAt: 0,
    settings: {
      soundEnabled: true,
      hapticsEnabled: true,
    },
  };
}

function makeGameProgress(): GameProgress {
  return {
    userId: 'u1',
    campaignProgress: {},
    advanceProgress: {},
    rankProgress: { currentTier: 'apprentice', history: [] },
    wrongQuestions: [],
    totalQuestionsAttempted: 0,
    totalQuestionsCorrect: 0,
  };
}

function makeQuestion(id: string, topicId: TopicId, prompt: string, answer: string): Question {
  return {
    id,
    topicId,
    type: 'numeric-input',
    difficulty: 3,
    prompt,
    data: {
      kind: 'mental-arithmetic',
      expression: '1 + 1',
      operands: [1, 1],
      operator: '+',
    },
    solution: {
      answer,
      explanation: `${prompt} = ${answer}`,
    },
    hints: [],
  };
}

function makeAttempt(id: string, prompt: string, userAnswer: string, correctAnswer: string, correct: boolean): QuestionAttempt {
  return {
    questionId: id,
    question: makeQuestion(id, 'mental-arithmetic', prompt, correctAnswer),
    userAnswer,
    correct,
    timeMs: 1200,
    hintsUsed: 0,
    attemptedAt: 1000,
  };
}

function makeSession(
  sessionMode: PracticeSession['sessionMode'],
  heartsRemaining: number,
): PracticeSession {
  return {
    id: `${sessionMode}-session`,
    userId: 'u1',
    topicId: 'mental-arithmetic',
    startedAt: 1700000000000,
    difficulty: 3,
    sessionMode,
    targetLevelId: sessionMode === 'campaign' ? 'mental-arithmetic-S1-LA-L1' : null,
    questions: [
      makeAttempt('q-1', '1 + 1 = ?', '2', '2', true),
      makeAttempt('q-2', '2 + 3 = ?', '6', '5', false),
    ],
    heartsRemaining,
    completed: false,
  };
}

function primeStores(session: PracticeSession, hearts: number): void {
  useUserStore.setState({ user: makeUser() });
  useGameProgressStore.setState({ gameProgress: makeGameProgress() });
  useSessionStore.setState({
    active: true,
    session,
    currentQuestion: null,
    currentIndex: session.questions.length,
    totalQuestions: session.questions.length,
    hearts,
    questionStartTime: 0,
    showFeedback: false,
    lastAnswerCorrect: false,
    lastTrainingFieldMistakes: [],
    pendingWrongQuestions: [],
    rankQuestionQueue: [],
    lastRankMatchAction: null,
  });
}

function getHistory() {
  const historyRepo = repository as unknown as {
    getHistory?: () => Array<Record<string, unknown>>;
  };
  expect(typeof historyRepo.getHistory).toBe('function');
  return historyRepo.getHistory?.() ?? [];
}

describe('SessionStore 历史记录写入（v0.2-5-1）', () => {
  beforeEach(() => {
    installLocalStorageMock();
    setStorageNamespace('main');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setStorageNamespace('main');
  });

  it('endSession：hearts > 0 写入 win 记录', () => {
    primeStores(makeSession('campaign', 2), 2);
    vi.spyOn(Date, 'now').mockReturnValue(1700000005000);

    useSessionStore.getState().endSession();

    const history = getHistory();
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      id: 'campaign-session',
      sessionMode: 'campaign',
      completed: true,
      result: 'win',
      startedAt: 1700000000000,
      endedAt: 1700000005000,
      topicId: 'mental-arithmetic',
    });
    expect(history[0].questions).toEqual([
      expect.objectContaining({
        prompt: '1 + 1 = ?',
        userAnswer: '2',
        correctAnswer: '2',
        correct: true,
        timeMs: 1200,
      }),
      expect.objectContaining({
        prompt: '2 + 3 = ?',
        userAnswer: '6',
        correctAnswer: '5',
        correct: false,
        timeMs: 1200,
      }),
    ]);
  });

  it('endSession：hearts = 0 写入 lose 记录', () => {
    primeStores(makeSession('advance', 0), 0);
    vi.spyOn(Date, 'now').mockReturnValue(1700000006000);

    useSessionStore.getState().endSession();

    const history = getHistory();
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      id: 'advance-session',
      sessionMode: 'advance',
      completed: true,
      result: 'lose',
      endedAt: 1700000006000,
    });
  });

  it('abandonSession：completed=false 写入 incomplete，且保留 rankMatchMeta.primaryTopics', () => {
    const session: PracticeSession = {
      ...makeSession('rank-match', 1),
      rankMatchMeta: {
        rankSessionId: 'rs-1',
        gameIndex: 1,
        targetTier: 'rookie',
        primaryTopics: ['mental-arithmetic', 'number-sense'],
      },
    };
    primeStores(session, 1);
    vi.spyOn(Date, 'now').mockReturnValue(1700000007000);

    useSessionStore.getState().abandonSession();

    const history = getHistory();
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      id: 'rank-match-session',
      sessionMode: 'rank-match',
      completed: false,
      result: 'incomplete',
      endedAt: 1700000007000,
      rankMatchMeta: {
        primaryTopics: ['mental-arithmetic', 'number-sense'],
      },
    });
  });
});
