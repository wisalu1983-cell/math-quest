import { describe, expect, it } from 'vitest';
import type { GameProgress } from '@/types/gamification';
import { hasMeaningfulLocalProgress } from './local-progress';

function makeProgress(overrides: Partial<GameProgress> = {}): GameProgress {
  return {
    userId: 'local-user',
    campaignProgress: {},
    advanceProgress: {},
    rankProgress: { currentTier: 'apprentice', history: [] },
    wrongQuestions: [],
    totalQuestionsAttempted: 0,
    totalQuestionsCorrect: 0,
    ...overrides,
  };
}

describe('hasMeaningfulLocalProgress', () => {
  it('空进度不算有效进度', () => {
    expect(hasMeaningfulLocalProgress(makeProgress())).toBe(false);
  });

  it('答题数大于 0 算有效进度', () => {
    expect(hasMeaningfulLocalProgress(makeProgress({ totalQuestionsAttempted: 1 }))).toBe(true);
  });

  it('闯关完成记录算有效进度', () => {
    expect(hasMeaningfulLocalProgress(makeProgress({
      campaignProgress: {
        'number-sense': {
          topicId: 'number-sense',
          completedLevels: [{ levelId: 'level-1', bestHearts: 3, completedAt: 1 }],
          campaignCompleted: false,
        },
      },
    }))).toBe(true);
  });

  it('闯关完成标记算有效进度', () => {
    expect(hasMeaningfulLocalProgress(makeProgress({
      campaignProgress: {
        'number-sense': {
          topicId: 'number-sense',
          completedLevels: [],
          campaignCompleted: true,
        },
      },
    }))).toBe(true);
  });

  it('进阶训练心数或局数算有效进度', () => {
    expect(hasMeaningfulLocalProgress(makeProgress({
      advanceProgress: {
        'number-sense': {
          topicId: 'number-sense',
          heartsAccumulated: 1,
          sessionsPlayed: 0,
          sessionsWhite: 0,
          unlockedAt: 1,
        },
      },
    }))).toBe(true);

    expect(hasMeaningfulLocalProgress(makeProgress({
      advanceProgress: {
        'number-sense': {
          topicId: 'number-sense',
          heartsAccumulated: 0,
          sessionsPlayed: 1,
          sessionsWhite: 1,
          unlockedAt: 1,
        },
      },
    }))).toBe(true);
  });

  it('段位历史、活跃段位赛或非 apprentice 段位算有效进度', () => {
    expect(hasMeaningfulLocalProgress(makeProgress({
      rankProgress: {
        currentTier: 'apprentice',
        history: [{ targetTier: 'rookie', outcome: 'promoted', startedAt: 1, endedAt: 2 }],
      },
    }))).toBe(true);

    expect(hasMeaningfulLocalProgress(makeProgress({
      rankProgress: { currentTier: 'apprentice', history: [], activeSessionId: 'rank-1' },
    }))).toBe(true);

    expect(hasMeaningfulLocalProgress(makeProgress({
      rankProgress: { currentTier: 'rookie', history: [] },
    }))).toBe(true);
  });

  it('错题记录算有效进度', () => {
    expect(hasMeaningfulLocalProgress(makeProgress({
      wrongQuestions: [{
        question: {} as never,
        wrongAnswer: '42',
        wrongAt: 1,
      }],
    }))).toBe(true);
  });
});
