/// <reference types="vitest/globals" />
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateQuestion } from '@/engine';
import type { Question, User } from '@/types';
import { useGameProgressStore, useSessionStore, useUserStore } from './index';

vi.mock('@/engine', () => ({
  generateQuestion: vi.fn(),
}));

const mockedGenerateQuestion = vi.mocked(generateQuestion);

function makeUser(): User {
  return {
    id: 'u-dedupe',
    nickname: 'Dedupe',
    avatarSeed: 'seed',
    createdAt: 0,
    settings: { soundEnabled: true, hapticsEnabled: true },
  };
}

function makeQuestion(prompt: string, id = prompt): Question {
  return {
    id,
    topicId: 'number-sense',
    type: 'numeric-input',
    difficulty: 4,
    prompt,
    data: {
      kind: 'number-sense',
      subtype: 'floor-ceil',
    },
    solution: { answer: '1' },
    hints: [],
  };
}

function resetSessionState(): void {
  useUserStore.setState({ user: makeUser() });
  useGameProgressStore.setState({ gameProgress: null });
  useSessionStore.setState({
    active: false,
    session: null,
    currentQuestion: null,
    currentIndex: 0,
    totalQuestions: 0,
    hearts: 3,
    showFeedback: false,
    lastAnswerCorrect: false,
    lastTrainingFieldMistakes: [],
    pendingWrongQuestions: [],
    rankQuestionQueue: [],
    lastRankMatchAction: null,
  });
}

describe('useSessionStore session 内完全重复治理', () => {
  beforeEach(() => {
    mockedGenerateQuestion.mockReset();
    resetSessionState();
  });

  it('campaign session 内遇到完全重复题会重抽下一题', () => {
    mockedGenerateQuestion
      .mockReturnValueOnce(makeQuestion('重复题', 'q1'))
      .mockReturnValueOnce(makeQuestion('重复题', 'q2'))
      .mockReturnValueOnce(makeQuestion('新题', 'q3'));

    useSessionStore.getState().startCampaignSession('number-sense', 'number-sense-S2-LB-L2');
    expect(useSessionStore.getState().currentQuestion?.prompt).toBe('重复题');

    useSessionStore.setState({ currentIndex: 1 });
    useSessionStore.getState().nextQuestion();

    expect(useSessionStore.getState().currentQuestion?.prompt).toBe('新题');
    expect(mockedGenerateQuestion).toHaveBeenCalledTimes(3);
  });

  it('advance session 内也复用同一个 seen set 做 bounded retry', () => {
    mockedGenerateQuestion
      .mockReturnValueOnce(makeQuestion('重复题', 'a1'))
      .mockReturnValueOnce(makeQuestion('重复题', 'a2'))
      .mockReturnValueOnce(makeQuestion('新题', 'a3'));

    useSessionStore.getState().startAdvanceSession('number-sense');
    expect(useSessionStore.getState().currentQuestion?.prompt).toBe('重复题');

    useSessionStore.setState({ currentIndex: 1 });
    useSessionStore.getState().nextQuestion();

    expect(useSessionStore.getState().currentQuestion?.prompt).toBe('新题');
    expect(mockedGenerateQuestion).toHaveBeenCalledTimes(3);
  });
});
