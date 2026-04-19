// src/engine/rank-match/match-state.test.ts
// BO 赛事生命周期状态机单测 · Phase 3 M1 TDD
//
// 覆盖范围：
//   - 入场校验：满足门槛 / 缺失门槛
//   - onGameFinished 的晋级 / 淘汰 / 继续判定
//   - BO 提前结束（Spec §7.4 强制规则）
//   - getCurrentGameIndex 派生函数

import { describe, it, expect } from 'vitest';
import {
  createRankMatchSession,
  startNextGame,
  onGameFinished,
  getCurrentGameIndex,
} from './match-state';
import { isTierUnlocked, getTierGaps } from './entry-gate';
import type { AdvanceProgress, RankMatchSession, TopicAdvanceProgress } from '@/types/gamification';
import type { TopicId } from '@/types';

// ─── 辅助构造 ───

/** 给定题型 → 心数，构造 AdvanceProgress */
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

/**
 * 新秀入场 = A01~A04 各 1★。
 * 参照 STAR_THRESHOLDS_3/5 的第一档 = 6 心即 1★（A01~A04 cap=3 用 STAR_THRESHOLDS_3=[6,18,38]）。
 */
function rookieQualifyingAdvance(): AdvanceProgress {
  return makeAdvance({
    'mental-arithmetic': 6,
    'number-sense':      6,
    'vertical-calc':     6,
    'operation-laws':    6,
  });
}

// ─── 入场校验 ───

describe('entry-gate · isTierUnlocked', () => {
  it('apprentice 段位永远 unlocked', () => {
    expect(isTierUnlocked('apprentice', {})).toBe(true);
  });

  it('rookie：A01~A04 各 1★ 满足即 unlocked', () => {
    expect(isTierUnlocked('rookie', rookieQualifyingAdvance())).toBe(true);
  });

  it('rookie：A01 星级不足即 locked', () => {
    const ap = rookieQualifyingAdvance();
    ap['mental-arithmetic']!.heartsAccumulated = 5; // 不足 6 心 = 0★
    expect(isTierUnlocked('rookie', ap)).toBe(false);
  });

  it('rookie：空 AdvanceProgress 一定 locked', () => {
    expect(isTierUnlocked('rookie', {})).toBe(false);
  });

  it('pro：在仅满足新秀门槛时仍然 locked（需要 8 题型各 2★）', () => {
    expect(isTierUnlocked('pro', rookieQualifyingAdvance())).toBe(false);
  });
});

describe('entry-gate · getTierGaps', () => {
  it('apprentice 无缺口', () => {
    expect(getTierGaps('apprentice', {})).toEqual([]);
  });

  it('rookie 空存档：四个题型各缺 1 星', () => {
    const gaps = getTierGaps('rookie', {});
    expect(gaps).toHaveLength(4);
    for (const g of gaps) {
      expect(g.requiredStars).toBe(1);
      expect(g.currentStars).toBe(0);
    }
  });

  it('rookie 半达标：只列未满足题型', () => {
    const ap = rookieQualifyingAdvance();
    ap['operation-laws']!.heartsAccumulated = 0;
    const gaps = getTierGaps('rookie', ap);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].topicId).toBe('operation-laws');
    expect(gaps[0].currentStars).toBe(0);
  });
});

// ─── createRankMatchSession ───

describe('createRankMatchSession', () => {
  it('未满足门槛 → 抛错', () => {
    expect(() =>
      createRankMatchSession({
        userId: 'u1',
        targetTier: 'rookie',
        advanceProgress: {},
        firstPracticeSessionId: 'ps1',
      }),
    ).toThrow(/not unlocked/i);
  });

  it('满足新秀门槛 → 生成 BO3 session 且第 1 局在 games 中', () => {
    const s = createRankMatchSession({
      userId: 'u1',
      targetTier: 'rookie',
      advanceProgress: rookieQualifyingAdvance(),
      firstPracticeSessionId: 'ps1',
      now: 1000,
      makeId: () => 'rs-abc',
    });
    expect(s).toMatchObject({
      id: 'rs-abc',
      userId: 'u1',
      targetTier: 'rookie',
      bestOf: 3,
      winsToAdvance: 2,
      startedAt: 1000,
    });
    expect(s.games).toHaveLength(1);
    expect(s.games[0]).toMatchObject({
      gameIndex: 1,
      finished: false,
      practiceSessionId: 'ps1',
      startedAt: 1000,
    });
    expect(s.outcome).toBeUndefined();
  });
});

// ─── getCurrentGameIndex ───

describe('getCurrentGameIndex', () => {
  it('首局未 finished → 返回 1', () => {
    const s = createRankMatchSession({
      userId: 'u1',
      targetTier: 'rookie',
      advanceProgress: rookieQualifyingAdvance(),
      firstPracticeSessionId: 'ps1',
    });
    expect(getCurrentGameIndex(s)).toBe(1);
  });

  it('已出 outcome → 返回 undefined', () => {
    const s: RankMatchSession = {
      id: 'rs',
      userId: 'u',
      targetTier: 'rookie',
      bestOf: 3,
      winsToAdvance: 2,
      games: [
        { gameIndex: 1, finished: true, won: true, practiceSessionId: 'p1', startedAt: 0, endedAt: 1 },
        { gameIndex: 2, finished: true, won: true, practiceSessionId: 'p2', startedAt: 2, endedAt: 3 },
      ],
      outcome: 'promoted',
      startedAt: 0,
      endedAt: 3,
    };
    expect(getCurrentGameIndex(s)).toBeUndefined();
  });

  it('最后一局已 finished 但未开下一局 → undefined', () => {
    const s: RankMatchSession = {
      id: 'rs',
      userId: 'u',
      targetTier: 'rookie',
      bestOf: 3,
      winsToAdvance: 2,
      games: [
        { gameIndex: 1, finished: true, won: false, practiceSessionId: 'p1', startedAt: 0, endedAt: 1 },
      ],
      startedAt: 0,
    };
    expect(getCurrentGameIndex(s)).toBeUndefined();
  });
});

// ─── onGameFinished ───

function freshRookieSession(): RankMatchSession {
  return createRankMatchSession({
    userId: 'u1',
    targetTier: 'rookie',
    advanceProgress: rookieQualifyingAdvance(),
    firstPracticeSessionId: 'ps1',
    now: 1000,
    makeId: () => 'rs',
  });
}

describe('onGameFinished · BO3 新秀', () => {
  it('胜 2 负 0：第 2 局结束即 promoted，不得产生第 3 局', () => {
    let s = freshRookieSession();
    let r = onGameFinished({ session: s, gameIndex: 1, won: true, now: 2000 });
    expect(r.nextAction).toEqual({ kind: 'start-next' });
    s = startNextGame({ session: r.session, practiceSessionId: 'ps2', now: 2100 });

    r = onGameFinished({ session: s, gameIndex: 2, won: true, now: 3000 });
    expect(r.nextAction).toEqual({ kind: 'promoted' });
    expect(r.session.outcome).toBe('promoted');
    expect(r.session.games).toHaveLength(2); // 第 3 局不得生成
    expect(r.session.endedAt).toBe(3000);
  });

  it('负 2 胜 0：第 2 局结束即 eliminated（BO 提前结束）', () => {
    let s = freshRookieSession();
    let r = onGameFinished({ session: s, gameIndex: 1, won: false, now: 2000 });
    expect(r.nextAction).toEqual({ kind: 'start-next' });
    s = startNextGame({ session: r.session, practiceSessionId: 'ps2', now: 2100 });

    r = onGameFinished({ session: s, gameIndex: 2, won: false, now: 3000 });
    expect(r.nextAction).toEqual({ kind: 'eliminated' });
    expect(r.session.outcome).toBe('eliminated');
    expect(r.session.games).toHaveLength(2);
  });

  it('胜 1 负 1：未决 → start-next，允许打第 3 局', () => {
    let s = freshRookieSession();
    let r = onGameFinished({ session: s, gameIndex: 1, won: true });
    s = startNextGame({ session: r.session, practiceSessionId: 'ps2' });
    r = onGameFinished({ session: s, gameIndex: 2, won: false });
    expect(r.nextAction).toEqual({ kind: 'start-next' });
    expect(r.session.outcome).toBeUndefined();
    expect(r.session.games).toHaveLength(2);
  });
});

describe('onGameFinished · 保护分支', () => {
  it('session 已有 outcome → 抛错', () => {
    const s = freshRookieSession();
    const r = onGameFinished({ session: s, gameIndex: 1, won: true });
    // 构造一个人工已结束的 session
    const ended: RankMatchSession = {
      ...r.session,
      games: [
        ...r.session.games,
        { gameIndex: 2, finished: true, won: true, practiceSessionId: 'ps2', startedAt: 0, endedAt: 1 },
      ],
      outcome: 'promoted',
    };
    expect(() => onGameFinished({ session: ended, gameIndex: 2, won: false })).toThrow();
  });

  it('给出不存在的 gameIndex → 抛错', () => {
    const s = freshRookieSession();
    expect(() => onGameFinished({ session: s, gameIndex: 9, won: true })).toThrow();
  });

  it('重复对同一局 finish → 抛错', () => {
    let s = freshRookieSession();
    const r = onGameFinished({ session: s, gameIndex: 1, won: true });
    s = r.session;
    expect(() => onGameFinished({ session: s, gameIndex: 1, won: false })).toThrow();
  });
});

// ─── startNextGame ───

describe('startNextGame', () => {
  it('正常追加下一局 → gameIndex = games.length + 1', () => {
    let s = freshRookieSession();
    const r = onGameFinished({ session: s, gameIndex: 1, won: true });
    s = startNextGame({ session: r.session, practiceSessionId: 'ps2', now: 5000 });
    expect(s.games).toHaveLength(2);
    expect(s.games[1].gameIndex).toBe(2);
    expect(s.games[1].practiceSessionId).toBe('ps2');
    expect(s.games[1].startedAt).toBe(5000);
  });

  it('上一局未 finished → 抛错', () => {
    const s = freshRookieSession();
    expect(() => startNextGame({ session: s, practiceSessionId: 'ps2' })).toThrow();
  });

  it('session 已出 outcome → 抛错', () => {
    const s: RankMatchSession = {
      ...freshRookieSession(),
      outcome: 'promoted',
    };
    expect(() => startNextGame({ session: s, practiceSessionId: 'ps2' })).toThrow();
  });
});
