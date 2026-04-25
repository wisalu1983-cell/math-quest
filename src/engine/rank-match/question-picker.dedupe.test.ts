/// <reference types="vitest/globals" />
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateQuestion } from '@/engine';
import type { Question, TopicId } from '@/types';
import type { AdvanceProgress, RankMatchGame, RankMatchSession } from '@/types/gamification';
import { getDuplicateSignature } from '@/engine/question-dedupe';
import { pickQuestionsForGame } from './question-picker';

vi.mock('@/engine', () => ({
  generateQuestion: vi.fn(),
}));

const mockedGenerateQuestion = vi.mocked(generateQuestion);

function makeQuestion(topicId: TopicId, difficulty: number, prompt: string, id: string): Question {
  return {
    id,
    topicId,
    type: 'numeric-input',
    difficulty,
    prompt,
    data: {
      kind: 'number-sense',
      subtype: 'floor-ceil',
    },
    solution: { answer: '1' },
    hints: [],
  };
}

function makeGame(gameIndex: number, finished: boolean, won?: boolean): RankMatchGame {
  return {
    gameIndex,
    finished,
    won,
    practiceSessionId: `ps-${gameIndex}`,
    startedAt: 0,
    endedAt: finished ? 1 : undefined,
  };
}

function makeSession(): RankMatchSession {
  return {
    id: 'rs-dedupe',
    userId: 'u-dedupe',
    targetTier: 'rookie',
    bestOf: 3,
    winsToAdvance: 2,
    games: [makeGame(1, false)],
    startedAt: 0,
  };
}

const fullAdvance: AdvanceProgress = {};

describe('pickQuestionsForGame session 内完全重复治理', () => {
  beforeEach(() => {
    let calls = 0;
    mockedGenerateQuestion.mockImplementation((topicId, difficulty) => {
      calls++;
      const prompt = calls <= 2 ? '重复题' : `唯一题 ${calls}`;
      return makeQuestion(topicId, difficulty, prompt, `q-${calls}`);
    });
  });

  it('整局三个 bucket 共用 signature set，跨 bucket 重复会重抽', () => {
    const { questions } = pickQuestionsForGame({
      session: makeSession(),
      gameIndex: 1,
      advanceProgress: fullAdvance,
    });
    const signatures = questions.map(getDuplicateSignature);

    expect(new Set(signatures).size).toBe(questions.length);
    expect(mockedGenerateQuestion).toHaveBeenCalledTimes(questions.length + 1);
  });
});
