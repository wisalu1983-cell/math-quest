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
