// src/engine/rank-match/picker-validators.ts
// 段位赛抽题器自检钩子 · Phase 3 M2（Spec 2026-04-18 §5.7）
//
// 设计要点：
//   - 纯函数，不依赖 store / repository / 生成器；输入三桶 + totalCount 即可判定
//   - 违规项以可读字符串返回，便于 §5.8 落地 ISSUE_LIST 时定位
//   - 不在此文件抛异常；是否抛错由 picker 调用方决定（Spec §5.8）

import type { Question } from '@/types';
import {
  RANK_DIFFICULTY_RANGE,
  type ChallengeableTier,
  type DifficultyRange,
} from '@/constants/rank-match';

/** 难度档位三分（Spec §5.5 记号：normal=2-5，hard=6-7，demon=8-10；1 视为 normal 下界外） */
export type DifficultyBand = 'normal' | 'hard' | 'demon';

export function toDifficultyBand(difficulty: number): DifficultyBand {
  if (difficulty >= 8) return 'demon';
  if (difficulty >= 6) return 'hard';
  return 'normal';
}

export interface TierDistributionBuckets {
  primary: Question[];
  nonPrimary: Question[];
  review: Question[];
}

export interface TierDistributionResult {
  ok: boolean;
  violations: string[];
}

function inRange(d: number, range: DifficultyRange): boolean {
  return d >= range.min && d <= range.max;
}

function countByBand(qs: Question[]): Record<DifficultyBand, number> {
  const acc: Record<DifficultyBand, number> = { normal: 0, hard: 0, demon: 0 };
  for (const q of qs) acc[toDifficultyBand(q.difficulty)]++;
  return acc;
}

/**
 * 校验三桶分布是否符合 Spec §5.5-§5.7 的全部硬约束。
 * Spec §5.8：ok=false 时，调用方（抽题器）必须抛异常中断，不得静默降级。
 */
export function validateTierDistribution(
  tier: ChallengeableTier,
  buckets: TierDistributionBuckets,
  totalCount: number,
): TierDistributionResult {
  const violations: string[] = [];
  const { primary, nonPrimary, review } = buckets;
  const rangeCfg = RANK_DIFFICULTY_RANGE[tier];

  // (1) 合计题数 = totalCount
  const sum = primary.length + nonPrimary.length + review.length;
  if (sum !== totalCount) {
    violations.push(
      `[${tier}] total count mismatch: expected ${totalCount}, got ${sum} (primary=${primary.length} nonPrimary=${nonPrimary.length} review=${review.length})`
    );
  }

  // (2) 每桶难度范围 (Spec §5.5)
  for (const q of primary) {
    if (!inRange(q.difficulty, rangeCfg.primary)) {
      violations.push(
        `[${tier}] primary difficulty out of range [${rangeCfg.primary.min},${rangeCfg.primary.max}]: questionId=${q.id} difficulty=${q.difficulty}`
      );
    }
  }
  for (const q of nonPrimary) {
    if (!inRange(q.difficulty, rangeCfg.nonPrimary)) {
      violations.push(
        `[${tier}] nonPrimary difficulty out of range [${rangeCfg.nonPrimary.min},${rangeCfg.nonPrimary.max}]: questionId=${q.id} difficulty=${q.difficulty}`
      );
    }
  }

  // (3) review 桶：rookie 不允许存在 review；其他段位按表校验难度范围
  if (rangeCfg.review === null) {
    if (review.length > 0) {
      violations.push(
        `[${tier}] review bucket must be empty (rookie has no previous tier), got ${review.length} questions`
      );
    }
  } else {
    for (const q of review) {
      if (!inRange(q.difficulty, rangeCfg.review)) {
        violations.push(
          `[${tier}] review difficulty out of range [${rangeCfg.review.min},${rangeCfg.review.max}]: questionId=${q.id} difficulty=${q.difficulty}`
        );
      }
    }
  }

  // (4) 占比：主考 ≥40%、复习 ≤25%
  if (totalCount > 0) {
    const primaryRatio = primary.length / totalCount;
    const reviewRatio = review.length / totalCount;
    // 使用小 epsilon 容忍浮点：0.4 的精确整数解是 0.4 * total，数比例直接用整除判断更稳
    // 主考必须 ≥40% → primary.length * 100 >= totalCount * 40
    if (primary.length * 100 < totalCount * 40) {
      violations.push(
        `[${tier}] primary ratio < 40%: primary=${primary.length}/${totalCount} = ${(primaryRatio * 100).toFixed(1)}%`
      );
    }
    if (review.length * 100 > totalCount * 25) {
      violations.push(
        `[${tier}] review ratio > 25%: review=${review.length}/${totalCount} = ${(reviewRatio * 100).toFixed(1)}%`
      );
    }
  }

  // (5) 复习池 normal 规则（Spec §5.5 硬约束 2）：
  //   - rookie：无 review（已在 (3) 处理）
  //   - pro：review 来自 rookie，本身就是 normal 2-5，允许 normal（不是"甜点"语义）
  //   - expert：允许 ≤10% 总题量 的 normal 5 甜点回顾
  //   - master：review 来自 expert 的 hard 部分，禁止 normal
  const reviewNormalCount = countByBand(review).normal;
  if (tier === 'expert') {
    if (reviewNormalCount * 100 > totalCount * 10) {
      violations.push(
        `[expert] review normal "sweet-spot" exceeds 10% of total: normal=${reviewNormalCount}/${totalCount} = ${((reviewNormalCount / totalCount) * 100).toFixed(1)}%`
      );
    }
  } else if (tier === 'master' && reviewNormalCount > 0) {
    violations.push(
      `[master] review bucket must not contain any "normal" band questions (found ${reviewNormalCount})`
    );
  }

  // (6) master demon ≥40% 占 primary+nonPrimary 合集 (Spec §5.5 硬约束 3)
  if (tier === 'master') {
    const combined = [...primary, ...nonPrimary];
    if (combined.length > 0) {
      const demonCount = countByBand(combined).demon;
      if (demonCount * 100 < combined.length * 40) {
        violations.push(
          `[master] demon ratio in primary+nonPrimary < 40%: demon=${demonCount}/${combined.length} = ${((demonCount / combined.length) * 100).toFixed(1)}%`
        );
      }
    }
  }

  return {
    ok: violations.length === 0,
    violations,
  };
}
