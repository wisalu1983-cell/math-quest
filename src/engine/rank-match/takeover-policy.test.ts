import { describe, expect, it } from 'vitest';
import type { RankMatchSession } from '@/types/gamification';
import {
  getRankMatchTakeoverState,
  getTakeoverMinutesLeft,
  TAKEOVER_THRESHOLD_MS,
} from './takeover-policy';

function makeSession(overrides: Partial<RankMatchSession> = {}): RankMatchSession {
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

describe('rank-match takeover policy', () => {
  it('本次应用启动周期发起的 active session 视为本机继续', () => {
    const session = makeSession({ updatedAt: 10_000 });

    expect(getRankMatchTakeoverState({
      session,
      startedInThisSession: new Set([session.id]),
      now: 20_000,
    })).toBe('local-active');
  });

  it('另一设备 active 且 10 分钟内更新时不可接管', () => {
    const session = makeSession({ updatedAt: 100_000 });

    expect(getRankMatchTakeoverState({
      session,
      startedInThisSession: new Set(),
      now: 100_000 + TAKEOVER_THRESHOLD_MS - 1,
    })).toBe('another-device-active');
  });

  it('另一设备 active 超过 10 分钟无响应时可接管', () => {
    const session = makeSession({ updatedAt: 100_000 });

    expect(getRankMatchTakeoverState({
      session,
      startedInThisSession: new Set(),
      now: 100_000 + TAKEOVER_THRESHOLD_MS + 1,
    })).toBe('stale-active-takeoverable');
  });

  it('suspended session 走原继续流程，不参与另一设备 active 判定', () => {
    expect(getRankMatchTakeoverState({
      session: makeSession({ status: 'suspended', suspendedAt: 200_000 }),
      startedInThisSession: new Set(),
      now: 300_000,
    })).toBe('suspended');
  });

  it('返回另一设备新鲜 active 的剩余等待分钟数', () => {
    const session = makeSession({ updatedAt: 100_000 });

    expect(getTakeoverMinutesLeft(session, 100_000 + 3 * 60_000)).toBe(7);
  });
});
