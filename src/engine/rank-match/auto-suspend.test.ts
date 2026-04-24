import { describe, expect, it } from 'vitest';
import type { PracticeSession } from '@/types';
import type { RankMatchSession } from '@/types/gamification';
import { shouldAutoSuspendRankMatch } from './auto-suspend';

function makePracticeSession(overrides: Partial<PracticeSession> = {}): PracticeSession {
  return {
    id: 'practice-1',
    userId: 'u1',
    topicId: 'mental-arithmetic',
    startedAt: 1_000,
    difficulty: 4,
    sessionMode: 'rank-match',
    targetLevelId: null,
    questions: [],
    heartsRemaining: 3,
    completed: false,
    rankMatchMeta: {
      rankSessionId: 'rank-1',
      gameIndex: 1,
      targetTier: 'rookie',
      primaryTopics: ['mental-arithmetic'],
    },
    ...overrides,
  };
}

function makeRankSession(overrides: Partial<RankMatchSession> = {}): RankMatchSession {
  return {
    id: 'rank-1',
    userId: 'u1',
    targetTier: 'rookie',
    bestOf: 3,
    winsToAdvance: 2,
    games: [
      {
        gameIndex: 1,
        finished: false,
        practiceSessionId: 'practice-1',
        startedAt: 1_000,
      },
    ],
    status: 'active',
    startedAt: 1_000,
    ...overrides,
  };
}

describe('shouldAutoSuspendRankMatch', () => {
  it('未正常结束的 active 段位赛 Practice 离开时应自动 suspend', () => {
    expect(shouldAutoSuspendRankMatch({
      session: makePracticeSession(),
      activeRankSession: makeRankSession(),
      sessionEnded: false,
    })).toBe(true);
  });

  it('已正常结束、非段位赛、已 suspended 或已有 outcome 时不自动 suspend', () => {
    expect(shouldAutoSuspendRankMatch({
      session: makePracticeSession(),
      activeRankSession: makeRankSession(),
      sessionEnded: true,
    })).toBe(false);

    expect(shouldAutoSuspendRankMatch({
      session: makePracticeSession({ sessionMode: 'campaign', rankMatchMeta: undefined }),
      activeRankSession: makeRankSession(),
      sessionEnded: false,
    })).toBe(false);

    expect(shouldAutoSuspendRankMatch({
      session: makePracticeSession(),
      activeRankSession: makeRankSession({ status: 'suspended' }),
      sessionEnded: false,
    })).toBe(false);

    expect(shouldAutoSuspendRankMatch({
      session: makePracticeSession(),
      activeRankSession: makeRankSession({ status: 'completed', outcome: 'promoted' }),
      sessionEnded: false,
    })).toBe(false);
  });
});
