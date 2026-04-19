// src/engine/rank-match/entry-gate.ts
// 段位赛入场校验 · 独立纯函数（Spec 2026-04-18 §7.1）
//
// 硬约束：本文件只读 advanceProgress + 常量表，禁止依赖 store / repository / RankMatchSession。
// Hub 页面、Home 入口卡片、store-before-create 三处共用同一份逻辑，保证可被单测纯粹覆盖。

import type { TopicId } from '@/types';
import type { AdvanceProgress, RankTier } from '@/types/gamification';
import { TOPIC_STAR_CAP } from '@/constants/advance';
import { getStars } from '@/engine/advance';
import { RANK_ENTRY_STARS, type ChallengeableTier } from '@/constants/rank-match';

/**
 * 判断当前进阶进度是否满足挑战某段位的星级门槛。
 * - 学徒（apprentice）= 初始标签，始终 unlocked
 * - 新秀及以上：逐项核对入场表
 */
export function isTierUnlocked(
  tier: RankTier,
  advanceProgress: AdvanceProgress,
): boolean {
  if (tier === 'apprentice') return true;
  const requirements = RANK_ENTRY_STARS[tier as ChallengeableTier];
  for (const topic of Object.keys(requirements) as TopicId[]) {
    const required = requirements[topic] ?? 0;
    if (required === 0) continue;
    const hearts = advanceProgress[topic]?.heartsAccumulated ?? 0;
    const cap = TOPIC_STAR_CAP[topic];
    if (getStars(hearts, cap) < required) return false;
  }
  return true;
}

export interface TierGap {
  topicId: TopicId;
  requiredStars: number;
  currentStars: number;
}

/**
 * 返回当前用户距离解锁目标段位还缺哪些题型星级（供 Home / Hub 缺口提示使用）。
 * 学徒返回空数组；已达标的题型不计入。
 */
export function getTierGaps(
  tier: RankTier,
  advanceProgress: AdvanceProgress,
): TierGap[] {
  if (tier === 'apprentice') return [];
  const requirements = RANK_ENTRY_STARS[tier as ChallengeableTier];
  const gaps: TierGap[] = [];
  for (const topic of Object.keys(requirements) as TopicId[]) {
    const required = requirements[topic] ?? 0;
    if (required === 0) continue;
    const hearts = advanceProgress[topic]?.heartsAccumulated ?? 0;
    const cap = TOPIC_STAR_CAP[topic];
    const current = getStars(hearts, cap);
    if (current < required) {
      gaps.push({ topicId: topic, requiredStars: required, currentStars: current });
    }
  }
  return gaps;
}
