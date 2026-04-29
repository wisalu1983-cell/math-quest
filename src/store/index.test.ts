/// <reference types="vitest/globals" />
import { beforeEach, describe, expect, it } from 'vitest';
import type { PracticeSession, Question } from '@/types';
import { useGameProgressStore } from './gamification';
import { useSessionStore } from './index';

function buildTrainingQuestion(): Question {
  return {
    id: 'q-training',
    topicId: 'vertical-calc',
    type: 'numeric-input',
    difficulty: 6,
    prompt: '列竖式计算: 1.25 × 4',
    data: {
      kind: 'vertical-calc',
      operation: '×',
      operands: [1.25, 4],
      steps: [],
      trainingFields: [
        { label: '1.25 有几位小数', answer: '2' },
        { label: '4 有几位小数', answer: '0' },
        { label: '积共有几位小数', answer: '2' },
      ],
    },
    solution: {
      answer: '5',
      explanation: '1.25 × 4 = 5',
    },
    hints: [],
  };
}

function buildVerticalQuestion(): Question {
  return {
    id: 'q-vertical-process',
    topicId: 'vertical-calc',
    type: 'vertical-fill',
    difficulty: 5,
    prompt: '用竖式计算: 999 + 888',
    data: {
      kind: 'vertical-calc',
      operation: '+',
      operands: [999, 888],
      steps: [],
    },
    solution: {
      answer: 1887,
      explanation: '999 + 888 = 1887',
    },
    hints: [],
  };
}

function buildSession(): PracticeSession {
  return {
    id: 's-training',
    userId: 'u-training',
    topicId: 'vertical-calc',
    startedAt: Date.now() - 1000,
    difficulty: 6,
    sessionMode: 'campaign',
    targetLevelId: 'vertical-calc-S1-LA-L1',
    questions: [],
    heartsRemaining: 3,
    completed: false,
  };
}

function primeSession(question: Question): void {
  (useSessionStore.setState as unknown as (partial: Record<string, unknown>) => void)({
    active: true,
    session: buildSession(),
    currentQuestion: question,
    currentIndex: 0,
    totalQuestions: 10,
    hearts: 3,
    questionStartTime: Date.now() - 500,
    showFeedback: false,
    lastAnswerCorrect: false,
    pendingWrongQuestions: [],
    lastTrainingFieldMistakes: [],
    lastProcessWarning: null,
    lastFailureReason: null,
  });
}

function primeGameProgress(): void {
  (useGameProgressStore.setState as unknown as (partial: Record<string, unknown>) => void)({
    gameProgress: {
      userId: 'u-training',
      campaignProgress: {},
      advanceProgress: {},
      rankProgress: { currentTier: 'apprentice', history: [] },
      wrongQuestions: [],
      totalQuestionsAttempted: 0,
      totalQuestionsCorrect: 0,
    },
  });
}

describe('useSessionStore.submitAnswer training feedback', () => {
  beforeEach(() => {
    (useGameProgressStore.setState as unknown as (partial: Record<string, unknown>) => void)({
      gameProgress: null,
    });
    primeSession(buildTrainingQuestion());
  });

  it('答案正确但困难档训练格有错时仍判定通过，并记录过程格错误清单', () => {
    const submit = useSessionStore.getState().submitAnswer as unknown as (
      answer: string,
      meta?: { trainingValues?: string[] },
    ) => { correct: boolean };

    const result = submit('5', {
      trainingValues: ['2', '1', '2'],
    });

    const state = useSessionStore.getState() as typeof useSessionStore.getState extends () => infer T
      ? T & {
          lastTrainingFieldMistakes?: Array<{
            label: string;
            userValue: string;
            expectedValue: string;
          }>;
        }
      : never;

    expect(result.correct).toBe(true);
    expect(state.hearts).toBe(3);
    expect(state.pendingWrongQuestions).toHaveLength(0);
    expect(state.lastTrainingFieldMistakes).toEqual([
      {
        label: '4 有几位小数',
        userValue: '1',
        expectedValue: '0',
      },
    ]);
  });

  it('答案正确且过程格全对时，不记录任何过程格错误', () => {
    const submit = useSessionStore.getState().submitAnswer as unknown as (
      answer: string,
      meta?: { trainingValues?: string[] },
    ) => { correct: boolean };

    const result = submit('5', {
      trainingValues: ['2', '0', '2'],
    });

    const state = useSessionStore.getState() as typeof useSessionStore.getState extends () => infer T
      ? T & {
          lastTrainingFieldMistakes?: Array<{
            label: string;
            userValue: string;
            expectedValue: string;
          }>;
        }
      : never;

    expect(result.correct).toBe(true);
    expect(state.lastTrainingFieldMistakes).toEqual([]);
  });
});

describe('useSessionStore.submitAnswer vertical process failure', () => {
  beforeEach(() => {
    primeGameProgress();
    primeSession(buildVerticalQuestion());
  });

  it('低档竖式答案正确但过程格错误时按错误记录，并把 failureReason 传到错题链路', () => {
    const result = useSessionStore.getState().submitAnswer('1887', {
      failureReason: 'vertical-process',
    });

    const state = useSessionStore.getState();
    expect(result.correct).toBe(false);
    expect(state.hearts).toBe(2);
    expect(state.session?.questions[0]).toMatchObject({
      correct: false,
      failureReason: 'vertical-process',
    });
    expect(state.lastFailureReason).toBe('vertical-process');
    expect(state.pendingWrongQuestions[0]).toMatchObject({
      wrongAnswer: '1887',
      failureReason: 'vertical-process',
    });
  });

  it('多行乘法结构化错因会保留到当前反馈、session attempt 和错题链路', () => {
    const failureDetail = {
      reason: 'vertical-multiplication-process' as const,
      source: 'vertical-multiplication' as const,
      message: '你的最终答案是对的，但竖式里的计算步骤有错误。把步骤也写对，才能通过哦。',
      processCategories: [
        { code: 'multiplication-partial-product', label: '部分积填写错误' },
      ],
    };

    const result = useSessionStore.getState().submitAnswer('1887', {
      failureReason: 'vertical-multiplication-process',
      failureDetail,
    });

    const state = useSessionStore.getState();
    expect(result.correct).toBe(false);
    expect(state.lastFailureReason).toBe('vertical-multiplication-process');
    expect(state.lastFailureDetail).toEqual(failureDetail);
    expect(state.session?.questions[0]).toMatchObject({
      failureReason: 'vertical-multiplication-process',
      failureDetail,
    });
    expect(state.pendingWrongQuestions[0]).toMatchObject({
      failureReason: 'vertical-multiplication-process',
      failureDetail,
    });
  });

  it('中档竖式过程格 warning 只保留在当前反馈状态，不进入错题链路', () => {
    const result = useSessionStore.getState().submitAnswer('1887', {
      processWarning: 'vertical-process-warning',
    });

    const state = useSessionStore.getState();
    expect(result.correct).toBe(true);
    expect(state.hearts).toBe(3);
    expect(state.lastProcessWarning).toBe('vertical-process-warning');
    expect(state.lastFailureReason).toBeNull();
    expect(state.session?.questions[0].failureReason).toBeUndefined();
    expect(state.pendingWrongQuestions).toHaveLength(0);
  });
});
