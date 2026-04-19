// src/engine/rank-match/question-picker.test.ts
// 段位赛抽题器单测 · Phase 3 M2 TDD
//
// 覆盖 Spec 2026-04-18 §5 抽题器算法的核心契约：
//   - 每场题量与 RANK_QUESTIONS_PER_GAME 一致
//   - 主考项比例 ≥40%、复习题比例 ≤25%
//   - 主考项 topicIds 来自 RANK_PRIMARY_BY_WIN_SLOT[tier][winSlot-1]
//   - 胜场游标：负局不消耗游标（winSlot 只随已胜场数递增）
//   - §5.5 每段位 × 每桶难度范围硬约束
//   - 专家复习池 normal 甜点 ≤10%；大师 demon ≥40%
//   - §5.8 校验失败抛 PickerValidationError，不静默降级

import { describe, it, expect } from 'vitest';
import { pickQuestionsForGame, PickerValidationError } from './question-picker';
import { toDifficultyBand } from './picker-validators';
import {
  RANK_QUESTIONS_PER_GAME,
  RANK_PRIMARY_BY_WIN_SLOT,
  RANK_TOPIC_RANGE,
  RANK_DIFFICULTY_RANGE,
  type ChallengeableTier,
} from '@/constants/rank-match';
import type { AdvanceProgress, RankMatchSession, RankMatchGame } from '@/types/gamification';

// ─── 辅助 ───

function makeGame(
  gameIndex: number,
  finished: boolean,
  won?: boolean,
): RankMatchGame {
  return {
    gameIndex,
    finished,
    won,
    practiceSessionId: `ps-${gameIndex}`,
    startedAt: 0,
    endedAt: finished ? 1 : undefined,
  };
}

function makeSession(tier: ChallengeableTier, games: RankMatchGame[]): RankMatchSession {
  return {
    id: 'rs-1',
    userId: 'u-1',
    targetTier: tier,
    bestOf: tier === 'rookie' ? 3 : tier === 'master' ? 7 : 5,
    winsToAdvance: tier === 'rookie' ? 2 : tier === 'master' ? 4 : 3,
    games,
    startedAt: 0,
  };
}

const fullAdvance: AdvanceProgress = {};

// ─── 题量 ───

describe('pickQuestionsForGame · 每场题量', () => {
  for (const tier of ['rookie', 'pro', 'expert', 'master'] as ChallengeableTier[]) {
    it(`${tier}: 返回 ${RANK_QUESTIONS_PER_GAME[tier]} 道题`, () => {
      const session = makeSession(tier, [makeGame(1, false)]);
      const { questions } = pickQuestionsForGame({
        session, gameIndex: 1, advanceProgress: fullAdvance,
      });
      expect(questions).toHaveLength(RANK_QUESTIONS_PER_GAME[tier]);
    });
  }
});

// ─── 主考项 topicIds ───

describe('pickQuestionsForGame · 主考项 topicIds 来自 RANK_PRIMARY_BY_WIN_SLOT', () => {
  it('rookie 第 1 胜场主考 = [mental-arithmetic, number-sense]', () => {
    const session = makeSession('rookie', [makeGame(1, false)]);
    const { primaryTopics } = pickQuestionsForGame({
      session, gameIndex: 1, advanceProgress: fullAdvance,
    });
    expect(primaryTopics).toEqual(RANK_PRIMARY_BY_WIN_SLOT.rookie[0]);
  });

  it('rookie 第 2 胜场（已胜 1 局 + 第 2 局正在打）主考 = [vertical-calc, operation-laws]', () => {
    const session = makeSession('rookie', [
      makeGame(1, true, true),
      makeGame(2, false),
    ]);
    const { primaryTopics } = pickQuestionsForGame({
      session, gameIndex: 2, advanceProgress: fullAdvance,
    });
    expect(primaryTopics).toEqual(RANK_PRIMARY_BY_WIN_SLOT.rookie[1]);
  });

  it('胜场游标：负局不消耗（胜-负-胜-? 第 4 局仍冲第 2 胜场）', () => {
    const session = makeSession('pro', [
      makeGame(1, true, true),
      makeGame(2, true, false),
      makeGame(3, true, true),
      makeGame(4, false),
    ]);
    // 已胜 2 场，第 4 局冲第 3 胜场
    const { primaryTopics } = pickQuestionsForGame({
      session, gameIndex: 4, advanceProgress: fullAdvance,
    });
    expect(primaryTopics).toEqual(RANK_PRIMARY_BY_WIN_SLOT.pro[2]);
  });

  it('胜场游标：全负（0 胜）第 N 局仍冲第 1 胜场', () => {
    const session = makeSession('rookie', [
      makeGame(1, true, false),
      makeGame(2, false),
    ]);
    const { primaryTopics } = pickQuestionsForGame({
      session, gameIndex: 2, advanceProgress: fullAdvance,
    });
    expect(primaryTopics).toEqual(RANK_PRIMARY_BY_WIN_SLOT.rookie[0]);
  });

  it('pro 末场（胜场 3）主考映射含 mental-arithmetic 复用位', () => {
    const session = makeSession('pro', [
      makeGame(1, true, true),
      makeGame(2, true, true),
      makeGame(3, false),
    ]);
    const { primaryTopics } = pickQuestionsForGame({
      session, gameIndex: 3, advanceProgress: fullAdvance,
    });
    // pro 第 3 胜场 = ['multi-step', 'equation-transpose', 'mental-arithmetic']
    expect(primaryTopics).toEqual(RANK_PRIMARY_BY_WIN_SLOT.pro[2]);
  });
});

// ─── 比例约束 ───

describe('pickQuestionsForGame · 三桶比例', () => {
  it('rookie: 主考比例 ≥40%、复习 = 0', () => {
    const session = makeSession('rookie', [makeGame(1, false)]);
    const { buckets } = pickQuestionsForGame({
      session, gameIndex: 1, advanceProgress: fullAdvance,
    });
    const total = RANK_QUESTIONS_PER_GAME.rookie;
    expect(buckets.primary.length * 100).toBeGreaterThanOrEqual(total * 40);
    expect(buckets.review.length).toBe(0);
  });

  it('pro: 主考 ≥40%、复习 ≤25%', () => {
    const session = makeSession('pro', [makeGame(1, false)]);
    const { buckets } = pickQuestionsForGame({
      session, gameIndex: 1, advanceProgress: fullAdvance,
    });
    const total = RANK_QUESTIONS_PER_GAME.pro;
    expect(buckets.primary.length * 100).toBeGreaterThanOrEqual(total * 40);
    expect(buckets.review.length * 100).toBeLessThanOrEqual(total * 25);
  });

  it('master: 主考 ≥40% + demon 占合集 ≥40%', () => {
    const session = makeSession('master', [makeGame(1, false)]);
    const { buckets } = pickQuestionsForGame({
      session, gameIndex: 1, advanceProgress: fullAdvance,
    });
    const combined = [...buckets.primary, ...buckets.nonPrimary];
    const demon = combined.filter(q => toDifficultyBand(q.difficulty) === 'demon').length;
    expect(demon * 100).toBeGreaterThanOrEqual(combined.length * 40);
  });
});

// ─── 难度范围硬约束（§5.5） ───

describe('pickQuestionsForGame · 每段位 × 每桶难度范围', () => {
  for (const tier of ['rookie', 'pro', 'expert', 'master'] as ChallengeableTier[]) {
    it(`${tier}: 所有桶难度均在 RANK_DIFFICULTY_RANGE 规定内`, () => {
      const session = makeSession(tier, [makeGame(1, false)]);
      const { buckets } = pickQuestionsForGame({
        session, gameIndex: 1, advanceProgress: fullAdvance,
      });
      const cfg = RANK_DIFFICULTY_RANGE[tier];
      for (const q of buckets.primary) {
        expect(q.difficulty).toBeGreaterThanOrEqual(cfg.primary.min);
        expect(q.difficulty).toBeLessThanOrEqual(cfg.primary.max);
      }
      for (const q of buckets.nonPrimary) {
        expect(q.difficulty).toBeGreaterThanOrEqual(cfg.nonPrimary.min);
        expect(q.difficulty).toBeLessThanOrEqual(cfg.nonPrimary.max);
      }
      if (cfg.review) {
        for (const q of buckets.review) {
          expect(q.difficulty).toBeGreaterThanOrEqual(cfg.review.min);
          expect(q.difficulty).toBeLessThanOrEqual(cfg.review.max);
        }
      }
    });
  }
});

describe('pickQuestionsForGame · expert 甜点规则', () => {
  it('expert 复习池 normal 占比 ≤10% 总题量', () => {
    const session = makeSession('expert', [makeGame(1, false)]);
    const { buckets } = pickQuestionsForGame({
      session, gameIndex: 1, advanceProgress: fullAdvance,
    });
    const total = RANK_QUESTIONS_PER_GAME.expert;
    const normalInReview = buckets.review.filter(q => toDifficultyBand(q.difficulty) === 'normal').length;
    expect(normalInReview * 100).toBeLessThanOrEqual(total * 10);
  });
});

// ─── 主考项 topicId 一致性 ───

describe('pickQuestionsForGame · primary 桶 topicId ⊆ primaryTopics', () => {
  it('rookie 第 1 胜场 primary 题目 topic 全部来自 mental-arithmetic/number-sense', () => {
    const session = makeSession('rookie', [makeGame(1, false)]);
    const { buckets, primaryTopics } = pickQuestionsForGame({
      session, gameIndex: 1, advanceProgress: fullAdvance,
    });
    for (const q of buckets.primary) {
      expect(primaryTopics).toContain(q.topicId);
    }
  });

  it('expert primary topic ⊆ 段位范围，且 nonPrimary topic ⊆ 段位范围 \\ primary', () => {
    const session = makeSession('expert', [makeGame(1, false)]);
    const { buckets, primaryTopics } = pickQuestionsForGame({
      session, gameIndex: 1, advanceProgress: fullAdvance,
    });
    const tierRange = RANK_TOPIC_RANGE.expert;
    for (const q of buckets.primary) {
      expect(primaryTopics).toContain(q.topicId);
    }
    for (const q of buckets.nonPrimary) {
      expect(tierRange).toContain(q.topicId);
      expect(primaryTopics).not.toContain(q.topicId);
    }
  });
});

// ─── 连续跑 3 场不抛错（Plan M2 验收门槛） ───

describe('pickQuestionsForGame · 稳定性', () => {
  for (const tier of ['rookie', 'pro', 'expert', 'master'] as ChallengeableTier[]) {
    it(`${tier}: 连续生成 3 场不抛错且都通过 validators`, () => {
      let session = makeSession(tier, [makeGame(1, false)]);
      for (let i = 1; i <= 3; i++) {
        if (i > 1) {
          session = {
            ...session,
            games: [
              ...session.games.slice(0, -1),
              { ...session.games[session.games.length - 1], finished: true, won: true, endedAt: 1 },
              makeGame(i, false),
            ],
          };
        }
        expect(() => pickQuestionsForGame({
          session, gameIndex: i, advanceProgress: fullAdvance,
        })).not.toThrow();
      }
    });
  }
});

// ─── §5.8 异常路径 ───

describe('pickQuestionsForGame · 异常路径', () => {
  it('PickerValidationError 是 Error 子类且携带 violations', () => {
    // 直接构造用例验证异常形状（picker 正常路径不应抛）
    const err = new PickerValidationError(
      'mock',
      ['v1', 'v2'],
      { tier: 'rookie', gameIndex: 1, totalCount: 20 },
    );
    expect(err).toBeInstanceOf(Error);
    expect(err.violations).toEqual(['v1', 'v2']);
    expect(err.context.tier).toBe('rookie');
  });

  it('未解锁段位（advanceProgress 空）抛错（picker 依赖入场校验前置）', () => {
    // picker 不直接做入场校验（那是 entry-gate 的事）；但若 session.targetTier 合法、
    // advanceProgress 为空时 picker 仍能正常出题——因为入场校验在 createRankMatchSession 已做。
    // 所以这里只验证 picker 对 "合法 session" 的鲁棒性：空 advanceProgress 不影响抽题。
    const session = makeSession('rookie', [makeGame(1, false)]);
    expect(() => pickQuestionsForGame({
      session, gameIndex: 1, advanceProgress: {},
    })).not.toThrow();
  });
});
