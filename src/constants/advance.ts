// src/constants/advance.ts
// 进阶系统数值常量

import type { TopicId } from '@/types';

/** 每局固定题数 */
export const ADVANCE_QUESTION_COUNT = 20;

/** 进阶最大心数（与闯关共用） */
export const ADVANCE_MAX_HEARTS = 3;

/** 单档最多选取子题型数 */
export const ADVANCE_MAX_SUBTYPES = 4;

// ─── 星级门槛 ───

/** 3★ 封顶题型的累计心数门槛 */
export const STAR_THRESHOLDS_3 = [6, 18, 38] as const;

/** 5★ 封顶题型的累计心数门槛 */
export const STAR_THRESHOLDS_5 = [6, 18, 38, 58, 78] as const;

/** 每个题型的星级上限 */
export const TOPIC_STAR_CAP: Record<TopicId, 3 | 5> = {
  'mental-arithmetic': 3,  // A01
  'number-sense':      5,  // A02
  'vertical-calc':     5,  // A03
  'operation-laws':    3,  // A04
  'decimal-ops':       5,  // A05
  'bracket-ops':       5,  // A06
  'multi-step':        5,  // A07
  'equation-transpose': 3, // A08
};

// ─── 难度档定义 ───

export const TIER_NORMAL = { min: 2, max: 5 } as const;
export const TIER_HARD   = { min: 6, max: 7 } as const;
export const TIER_DEMON  = { min: 8, max: 10 } as const;

export type DifficultyTier = 'normal' | 'hard' | 'demon';

/** 判断 difficulty 属于哪个档 */
export function getTier(difficulty: number): DifficultyTier {
  if (difficulty <= 5) return 'normal';
  if (difficulty <= 7) return 'hard';
  return 'demon';
}

/** 在档内随机取一个 difficulty 值 */
export function randDifficultyInTier(tier: DifficultyTier): number {
  const range = tier === 'normal' ? TIER_NORMAL : tier === 'hard' ? TIER_HARD : TIER_DEMON;
  return range.min + Math.floor(Math.random() * (range.max - range.min + 1));
}

// ─── 星级→难度档权重表 ───
// 每行：[fractionalStars, normal%, hard%, demon%]
// 对 5★ 题型使用全部 6 行；对 3★ 题型使用前 4 行（demon 永远为 0）

export const TIER_WEIGHT_BREAKPOINTS_5STAR: ReadonlyArray<[number, number, number, number]> = [
  [0, 100, 0,   0],
  [1, 60,  40,  0],
  [2, 20,  80,  0],
  [3, 0,   80,  20],
  [4, 0,   50,  50],
  [5, 0,   10,  90],
];

export const TIER_WEIGHT_BREAKPOINTS_3STAR: ReadonlyArray<[number, number, number, number]> = [
  [0, 100, 0,   0],
  [1, 60,  40,  0],
  [2, 20,  80,  0],
  [3, 0,   100, 0],
];
