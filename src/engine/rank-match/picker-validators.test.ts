// src/engine/rank-match/picker-validators.test.ts
// 抽题器自检钩子单测 · Phase 3 M2 TDD
//
// 覆盖 Spec 2026-04-18 §5.7 列出的全部校验项：
//   1. 三桶合计 = totalCount
//   2. 各桶 difficulty 落在 §5.5 允许范围
//   3. 主考 ≥40%、复习 ≤25%
//   4. 专家复习池 normal 占比 ≤10%；其他段位复习池禁止 normal
//   5. 大师 demon 占 primary+nonPrimary 合集 ≥40%

import { describe, it, expect } from 'vitest';
import {
  validateTierDistribution,
  toDifficultyBand,
  type TierDistributionBuckets,
} from './picker-validators';
import type { Question, TopicId } from '@/types';

function mk(topicId: TopicId, difficulty: number, idSuffix = ''): Question {
  return {
    id: `mock-${topicId}-${difficulty}-${idSuffix}`,
    topicId,
    type: 'numeric-input',
    difficulty,
    prompt: '',
    data: { kind: 'mental-arithmetic', expression: '', operands: [], operator: '+' },
    solution: { answer: 0, explanation: '' },
    hints: [],
  } as Question;
}

function fill(topicId: TopicId, difficulty: number, count: number): Question[] {
  return Array.from({ length: count }, (_, i) => mk(topicId, difficulty, String(i)));
}

describe('toDifficultyBand', () => {
  it('1-5 映射 normal', () => {
    for (const d of [1, 2, 3, 4, 5]) expect(toDifficultyBand(d)).toBe('normal');
  });
  it('6-7 映射 hard', () => {
    expect(toDifficultyBand(6)).toBe('hard');
    expect(toDifficultyBand(7)).toBe('hard');
  });
  it('8-10 映射 demon', () => {
    for (const d of [8, 9, 10]) expect(toDifficultyBand(d)).toBe('demon');
  });
});

// ─── 1. 三桶合计数 = totalCount ───

describe('validateTierDistribution · totalCount 一致性', () => {
  it('合计题数与 totalCount 相等 → ok', () => {
    const buckets: TierDistributionBuckets = {
      primary:    fill('mental-arithmetic', 3, 8),
      nonPrimary: fill('number-sense',      3, 8),
      review:     [],
    };
    const res = validateTierDistribution('rookie', buckets, 16);
    expect(res.ok).toBe(true);
  });

  it('合计题数不等于 totalCount → 违规', () => {
    const buckets: TierDistributionBuckets = {
      primary:    fill('mental-arithmetic', 3, 8),
      nonPrimary: fill('number-sense',      3, 5),
      review:     [],
    };
    const res = validateTierDistribution('rookie', buckets, 16);
    expect(res.ok).toBe(false);
    expect(res.violations.join('\n')).toMatch(/total|count|题数/i);
  });
});

// ─── 2. 难度范围硬约束 ───

describe('validateTierDistribution · rookie 难度范围 normal 2-5', () => {
  it('所有题 difficulty ∈ [2,5] → ok', () => {
    const res = validateTierDistribution('rookie', {
      primary:    fill('mental-arithmetic', 3, 8),
      nonPrimary: fill('number-sense',      5, 12),
      review:     [],
    }, 20);
    expect(res.ok).toBe(true);
  });

  it('rookie 主考出现 difficulty=6 → 违规', () => {
    const res = validateTierDistribution('rookie', {
      primary:    [...fill('mental-arithmetic', 3, 7), mk('mental-arithmetic', 6)],
      nonPrimary: fill('number-sense',      3, 12),
      review:     [],
    }, 20);
    expect(res.ok).toBe(false);
    expect(res.violations.join('\n')).toMatch(/primary|主考/);
    expect(res.violations.join('\n')).toMatch(/6|range|范围/);
  });

  it('rookie 非主考出现 difficulty=1 → 违规（越下界）', () => {
    const res = validateTierDistribution('rookie', {
      primary:    fill('mental-arithmetic', 3, 8),
      nonPrimary: [...fill('number-sense', 3, 11), mk('number-sense', 1)],
      review:     [],
    }, 20);
    expect(res.ok).toBe(false);
  });
});

describe('validateTierDistribution · expert 难度范围', () => {
  it('主考 hard 6-7 + demon 8 ≤20% → ok', () => {
    // 25 题：primary 10（其中 2 道 demon，占 8% < 20%）+ nonPrimary 10 + review 5
    const res = validateTierDistribution('expert', {
      primary:    [...fill('vertical-calc', 6, 4), ...fill('vertical-calc', 7, 4), ...fill('vertical-calc', 8, 2)],
      nonPrimary: [...fill('operation-laws', 6, 5), ...fill('operation-laws', 7, 5)],
      review:     fill('mental-arithmetic', 6, 5),
    }, 25);
    expect(res.ok).toBe(true);
  });

  it('expert 非主考出现 normal 5 → 违规（非主考桶不允许下放）', () => {
    const res = validateTierDistribution('expert', {
      primary:    fill('vertical-calc', 7, 10),
      nonPrimary: [...fill('operation-laws', 6, 9), mk('operation-laws', 5)],
      review:     fill('mental-arithmetic', 6, 5),
    }, 25);
    expect(res.ok).toBe(false);
  });
});

describe('validateTierDistribution · master 难度范围', () => {
  it('主考 hard + demon 混合，demon 占 primary+nonPrimary ≥40% → ok', () => {
    // 30 题：primary 15（hard 6×3 + demon 8×6 + demon 9×3 + demon 10×3）+ nonPrimary 10 + review 5
    // demon 数：12 / 合集 25 = 48% ≥ 40% ✓
    const res = validateTierDistribution('master', {
      primary:    [...fill('operation-laws', 6, 3), ...fill('operation-laws', 8, 6), ...fill('operation-laws', 9, 3), ...fill('operation-laws', 10, 3)],
      nonPrimary: [...fill('decimal-ops',    6, 5), ...fill('decimal-ops',    7, 5)],
      review:     fill('bracket-ops',        7, 5),
    }, 30);
    expect(res.ok).toBe(true);
  });

  it('master demon 占合集 < 40% → 违规', () => {
    // primary 15（hard 7 × 10 + demon 8 × 5）+ nonPrimary 10 hard + review 5 hard
    // demon 数 5 / 合集 25 = 20% < 40% → 违规
    const res = validateTierDistribution('master', {
      primary:    [...fill('operation-laws', 7, 10), ...fill('operation-laws', 8, 5)],
      nonPrimary: fill('decimal-ops',    7, 10),
      review:     fill('bracket-ops',    7, 5),
    }, 30);
    expect(res.ok).toBe(false);
    expect(res.violations.join('\n')).toMatch(/demon/i);
  });
});

// ─── 3. 占比：主考 ≥40%、复习 ≤25% ───

describe('validateTierDistribution · 占比约束', () => {
  it('主考占比 < 40% → 违规', () => {
    // 20 题：primary 7（35%）+ nonPrimary 13 + review 0
    const res = validateTierDistribution('rookie', {
      primary:    fill('mental-arithmetic', 3, 7),
      nonPrimary: fill('number-sense',      3, 13),
      review:     [],
    }, 20);
    expect(res.ok).toBe(false);
    expect(res.violations.join('\n')).toMatch(/primary|主考|40/i);
  });

  it('主考恰好 40% → ok', () => {
    const res = validateTierDistribution('rookie', {
      primary:    fill('mental-arithmetic', 3, 8),
      nonPrimary: fill('number-sense',      3, 12),
      review:     [],
    }, 20);
    expect(res.ok).toBe(true);
  });

  it('复习占比 > 25% → 违规', () => {
    // pro：25 题，review 7（28%）
    const res = validateTierDistribution('pro', {
      primary:    fill('mental-arithmetic', 4, 10),
      nonPrimary: fill('decimal-ops',       4, 8),
      review:     fill('number-sense',      4, 7),
    }, 25);
    expect(res.ok).toBe(false);
    expect(res.violations.join('\n')).toMatch(/review|复习|25/i);
  });
});

// ─── 4. 专家甜点 + 其他段位 normal 复习禁止 ───

describe('validateTierDistribution · 复习池 normal 规则', () => {
  it('expert 复习池 normal ≤10% 总题量 → ok', () => {
    // 25 题：复习 5 道中 1 道 normal 5（占 4% < 10%）
    const res = validateTierDistribution('expert', {
      primary:    fill('vertical-calc',  7, 10),
      nonPrimary: fill('operation-laws', 6, 10),
      review:     [mk('mental-arithmetic', 5), ...fill('mental-arithmetic', 6, 4)],
    }, 25);
    expect(res.ok).toBe(true);
  });

  it('expert 复习池 normal > 10% 总题量 → 违规', () => {
    // 25 题：复习 5 道中 3 道 normal → 12% > 10%
    const res = validateTierDistribution('expert', {
      primary:    fill('vertical-calc',  7, 10),
      nonPrimary: fill('operation-laws', 6, 10),
      review:     [...fill('mental-arithmetic', 5, 3), ...fill('mental-arithmetic', 6, 2)],
    }, 25);
    expect(res.ok).toBe(false);
    expect(res.violations.join('\n')).toMatch(/expert|甜点|10/i);
  });

  it('pro 复习池出现 normal 1 → 违规（pro 复习允许 normal 但 Spec §5.5 pro review range 2-5，1 越下界）', () => {
    // 25 题：primary 10 + nonPrimary 10 + review 5（含 1 道 difficulty=1）
    const res = validateTierDistribution('pro', {
      primary:    fill('mental-arithmetic', 5, 10),
      nonPrimary: fill('decimal-ops',       4, 10),
      review:     [mk('number-sense', 1), ...fill('number-sense', 3, 4)],
    }, 25);
    expect(res.ok).toBe(false);
  });

  it('master 复习池出现 normal → 违规', () => {
    // 30 题：primary 15（demon ≥40% ok）+ nonPrimary 10 + review 5（1 道 normal 5）
    const res = validateTierDistribution('master', {
      primary:    [...fill('operation-laws', 6, 3), ...fill('operation-laws', 8, 6), ...fill('operation-laws', 9, 6)],
      nonPrimary: fill('decimal-ops',    7, 10),
      review:     [mk('bracket-ops', 5), ...fill('bracket-ops', 7, 4)],
    }, 30);
    expect(res.ok).toBe(false);
    expect(res.violations.join('\n')).toMatch(/master|normal/i);
  });
});

// ─── 5. rookie 不应有 review ───

describe('validateTierDistribution · rookie 不允许 review', () => {
  it('rookie review 非空 → 违规', () => {
    const res = validateTierDistribution('rookie', {
      primary:    fill('mental-arithmetic', 3, 8),
      nonPrimary: fill('number-sense',      3, 11),
      review:     fill('vertical-calc',     3, 1),
    }, 20);
    expect(res.ok).toBe(false);
    expect(res.violations.join('\n')).toMatch(/rookie|review|复习/i);
  });
});
