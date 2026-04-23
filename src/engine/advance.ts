// src/engine/advance.ts
// 进阶系统核心算法：子题型选取（全局合并 SWOR）+ 难度档分配

import type { TopicId } from '@/types';
import type { SubtypeDef, AdvanceSlot } from '@/types/gamification';
import {
  ADVANCE_QUESTION_COUNT,
  ADVANCE_MAX_SUBTYPES,
  TOPIC_STAR_CAP,
  STAR_THRESHOLDS_3,
  STAR_THRESHOLDS_5,
  TIER_WEIGHT_BREAKPOINTS_3STAR,
  TIER_WEIGHT_BREAKPOINTS_5STAR,
  randDifficultyInTier,
  type DifficultyTier,
} from '@/constants/advance';
import { getSubtypeEntries as getMentalArithmeticEntries } from './generators/mental-arithmetic';
import { getSubtypeEntries as getNumberSenseEntries } from './generators/number-sense';
import { getSubtypeEntries as getVerticalCalcEntries } from './generators/vertical-calc';
import { getSubtypeEntries as getOperationLawsEntries } from './generators/operation-laws';
import { getSubtypeEntries as getDecimalOpsEntries } from './generators/decimal-ops';
import { getSubtypeEntries as getBracketOpsEntries } from './generators/bracket-ops';
import { getSubtypeEntries as getMultiStepEntries } from './generators/multi-step';
import { getSubtypeEntries as getEquationTransposeEntries } from './generators/equation-transpose';

// ─── 生成器 entries 分发表 ───

const SUBTYPE_ENTRY_MAP: Record<TopicId, (difficulty: number) => SubtypeDef[]> = {
  'mental-arithmetic': getMentalArithmeticEntries,
  'number-sense':      getNumberSenseEntries,
  'vertical-calc':     getVerticalCalcEntries,
  'operation-laws':    getOperationLawsEntries,
  'decimal-ops':       getDecimalOpsEntries,
  'bracket-ops':       getBracketOpsEntries,
  'multi-step':        getMultiStepEntries,
  'equation-transpose': getEquationTransposeEntries,
};

/** 取某题型在指定难度档的代表性 difficulty（取档内中位值） */
function repDifficulty(tier: DifficultyTier): number {
  if (tier === 'normal') return 4;
  if (tier === 'hard')   return 6;
  return 9;
}

// ─── 星级计算 ───

/** 由累计心数计算当前整数星级 (0 ~ cap) */
export function getStars(heartsAccumulated: number, cap: 3 | 5): number {
  const thresholds = cap === 3 ? STAR_THRESHOLDS_3 : STAR_THRESHOLDS_5;
  let stars = 0;
  for (const threshold of thresholds) {
    if (heartsAccumulated >= threshold) stars++;
    else break;
  }
  return stars;
}

/** 当前星内进度 0.0 ~ 1.0（满级时为 1.0） */
export function getStarProgress(heartsAccumulated: number, cap: 3 | 5): number {
  const stars = getStars(heartsAccumulated, cap);
  if (stars >= cap) return 1.0;
  const thresholds = cap === 3 ? STAR_THRESHOLDS_3 : STAR_THRESHOLDS_5;
  const prev = stars === 0 ? 0 : thresholds[stars - 1];
  const next = thresholds[stars];
  return (heartsAccumulated - prev) / (next - prev);
}

/** 分数星级 0.0 ~ cap，用于难度档插值 */
export function getFractionalStars(heartsAccumulated: number, cap: 3 | 5): number {
  return Math.min(cap, getStars(heartsAccumulated, cap) + getStarProgress(heartsAccumulated, cap));
}

// ─── 难度档题量分配 ───

/** 线性插值 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * 根据分数星级，计算三个难度档各分配多少道题（合计 = total）
 * 使用断点表线性插值，最大余数法取整
 */
export function getTierCounts(
  heartsAccumulated: number,
  cap: 3 | 5,
  total: number = ADVANCE_QUESTION_COUNT
): { normal: number; hard: number; demon: number } {
  const frac = getFractionalStars(heartsAccumulated, cap);
  const breakpoints = cap === 3
    ? TIER_WEIGHT_BREAKPOINTS_3STAR
    : TIER_WEIGHT_BREAKPOINTS_5STAR;

  // 找到 frac 所在的区间
  let lo = breakpoints[0];
  let hi = breakpoints[breakpoints.length - 1];
  for (let i = 0; i < breakpoints.length - 1; i++) {
    if (frac >= breakpoints[i][0] && frac <= breakpoints[i + 1][0]) {
      lo = breakpoints[i];
      hi = breakpoints[i + 1];
      break;
    }
  }

  const t = lo[0] === hi[0] ? 0 : (frac - lo[0]) / (hi[0] - lo[0]);
  const normalPct = lerp(lo[1], hi[1], t) / 100;
  const hardPct   = lerp(lo[2], hi[2], t) / 100;
  const demonPct  = lerp(lo[3], hi[3], t) / 100;

  // 最大余数法取整
  const exactNormal = normalPct * total;
  const exactHard   = hardPct   * total;
  const exactDemon  = demonPct  * total;

  const floors = [
    { key: 'normal' as const, floor: Math.floor(exactNormal), frac: exactNormal - Math.floor(exactNormal) },
    { key: 'hard'   as const, floor: Math.floor(exactHard),   frac: exactHard   - Math.floor(exactHard) },
    { key: 'demon'  as const, floor: Math.floor(exactDemon),  frac: exactDemon  - Math.floor(exactDemon) },
  ];

  const deficit = total - floors.reduce((s, e) => s + e.floor, 0);
  floors.sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < deficit; i++) floors[i].floor++;

  const result = { normal: 0, hard: 0, demon: 0 };
  for (const e of floors) result[e.key] = e.floor;
  return result;
}

// ─── 全局合并 SWOR ───

interface WeightedTag {
  tag: string;
  mergedWeight: number; // 跨档加权后的权重，用于 SWOR 选择
}

/**
 * 合并多个难度档的子题型池
 * 权重 = Σ_tier (tierQuestionCount / total) × tagWeight_in_tier
 * 只有至少在一个活跃档存在的 tag 才进入池
 */
function buildMergedPool(
  topicId: TopicId,
  tierCounts: { normal: number; hard: number; demon: number },
  total: number
): WeightedTag[] {
  const tagMap = new Map<string, number>();

  const tiers: Array<[DifficultyTier, number]> = [
    ['normal', tierCounts.normal],
    ['hard',   tierCounts.hard],
    ['demon',  tierCounts.demon],
  ];

  for (const [tier, count] of tiers) {
    if (count === 0) continue;
    const entries = SUBTYPE_ENTRY_MAP[topicId](repDifficulty(tier));
    const tierTotalWeight = entries.reduce((s, e) => s + e.weight, 0);
    if (tierTotalWeight === 0) continue;
    for (const e of entries) {
      const contribution = (count / total) * (e.weight / tierTotalWeight) * 100;
      tagMap.set(e.tag, (tagMap.get(e.tag) ?? 0) + contribution);
    }
  }

  return Array.from(tagMap.entries())
    .map(([tag, mergedWeight]) => ({ tag, mergedWeight }))
    .filter(e => e.mergedWeight > 0);
}

/**
 * 加权无放回抽样（SWOR）：从 pool 中选 min(k, pool.length) 个
 */
function weightedSwor(pool: WeightedTag[], k: number): WeightedTag[] {
  if (pool.length <= k) return [...pool];

  const selected: WeightedTag[] = [];
  const remaining = [...pool];

  for (let i = 0; i < k; i++) {
    const total = remaining.reduce((s, e) => s + e.mergedWeight, 0);
    let r = Math.random() * total;
    let chosen = remaining.length - 1; // 兜底：取最后一个
    for (let j = 0; j < remaining.length; j++) {
      r -= remaining[j].mergedWeight;
      if (r <= 0) { chosen = j; break; }
    }
    selected.push(remaining[chosen]);
    remaining.splice(chosen, 1);
  }

  return selected;
}

function ensureActiveTierCoverage(
  topicId: TopicId,
  selectedTags: WeightedTag[],
  mergedPool: WeightedTag[],
  tierCounts: { normal: number; hard: number; demon: number }
): WeightedTag[] {
  const activeTiers: Array<[DifficultyTier, number]> = [
    ['normal', tierCounts.normal],
    ['hard', tierCounts.hard],
    ['demon', tierCounts.demon],
  ].filter(([, count]) => count > 0);

  const tierTagMap = new Map<DifficultyTier, Set<string>>();
  for (const [tier] of activeTiers) {
    tierTagMap.set(
      tier,
      new Set(SUBTYPE_ENTRY_MAP[topicId](repDifficulty(tier)).map(entry => entry.tag))
    );
  }

  const weightMap = new Map(mergedPool.map(entry => [entry.tag, entry.mergedWeight]));
  const next = [...selectedTags];

  const coversTier = (tag: WeightedTag, tier: DifficultyTier) =>
    tierTagMap.get(tier)?.has(tag.tag) ?? false;

  const canRemove = (index: number) => {
    const candidate = next[index];
    return activeTiers.every(([tier]) => {
      if (!coversTier(candidate, tier)) return true;
      return next.some((tag, otherIndex) => otherIndex !== index && coversTier(tag, tier));
    });
  };

  for (const [tier] of activeTiers) {
    if (next.some(tag => coversTier(tag, tier))) continue;

    const replacement = SUBTYPE_ENTRY_MAP[topicId](repDifficulty(tier))
      .filter(entry => !next.some(tag => tag.tag === entry.tag))
      .map(entry => ({
        tag: entry.tag,
        mergedWeight: weightMap.get(entry.tag) ?? entry.weight,
      }))
      .sort((a, b) => b.mergedWeight - a.mergedWeight)[0];

    if (!replacement) continue;

    const removableIndex = next
      .map((tag, index) => ({ tag, index }))
      .filter(({ index }) => canRemove(index))
      .sort((a, b) => a.tag.mergedWeight - b.tag.mergedWeight)[0]?.index;

    if (removableIndex === undefined) continue;
    next[removableIndex] = replacement;
  }

  return next;
}

// ─── 档内槽位分配 ───

/**
 * 将 count 道题按比例分配给 selectedTags 中在该档存在的子题型
 * 使用该档的原始权重，最大余数法取整
 */
function distributeSlots(
  selectedTags: WeightedTag[],
  tierEntries: SubtypeDef[],
  count: number
): Array<{ tag: string; slots: number }> {
  // 过滤：只保留该档存在且被选中的 tag
  const tierWeightMap = new Map(tierEntries.map(e => [e.tag, e.weight]));
  const available = selectedTags
    .map(s => ({ tag: s.tag, weight: tierWeightMap.get(s.tag) ?? 0 }))
    .filter(e => e.weight > 0);

  if (available.length === 0 || count === 0) return [];

  const totalWeight = available.reduce((s, e) => s + e.weight, 0);

  const items = available.map(e => {
    const exact = (e.weight / totalWeight) * count;
    return { tag: e.tag, floor: Math.floor(exact), frac: exact - Math.floor(exact) };
  });

  const deficit = count - items.reduce((s, e) => s + e.floor, 0);
  items.sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < deficit; i++) items[i].floor++;

  return items.map(({ tag, floor }) => ({ tag, slots: floor }));
}

// ─── Fisher-Yates shuffle ───

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── 主入口 ───

/**
 * 为一次进阶 session 预生成 ADVANCE_QUESTION_COUNT 道题的槽位
 * 返回已 shuffle 的 AdvanceSlot[]，nextQuestion 按序取用
 */
export function buildAdvanceSlots(
  topicId: TopicId,
  heartsAccumulated: number
): AdvanceSlot[] {
  const cap = TOPIC_STAR_CAP[topicId];
  const total = ADVANCE_QUESTION_COUNT;

  // 1. 计算三档题量
  const tierCounts = getTierCounts(heartsAccumulated, cap, total);

  // 2. 合并子题型池，SWOR 选 4 个
  const mergedPool = buildMergedPool(topicId, tierCounts, total);
  const selectedTags = ensureActiveTierCoverage(
    topicId,
    weightedSwor(mergedPool, ADVANCE_MAX_SUBTYPES),
    mergedPool,
    tierCounts
  );

  // 3. 按档分配槽位
  const slots: AdvanceSlot[] = [];

  const activeTiers: Array<[DifficultyTier, number]> = [
    ['normal', tierCounts.normal],
    ['hard',   tierCounts.hard],
    ['demon',  tierCounts.demon],
  ];

  for (const [tier, count] of activeTiers) {
    if (count === 0) continue;
    const tierEntries = SUBTYPE_ENTRY_MAP[topicId](repDifficulty(tier));
    const distribution = distributeSlots(selectedTags, tierEntries, count);

    for (const { tag, slots: n } of distribution) {
      for (let i = 0; i < n; i++) {
        slots.push({
          difficulty: randDifficultyInTier(tier),
          subtypeTag: tag,
        });
      }
    }
  }

  // 4. 如果分配后总数不足（极罕见：全档无匹配 tag），用兜底补齐
  while (slots.length < total) {
    const fallbackTier: DifficultyTier = tierCounts.normal > 0 ? 'normal'
      : tierCounts.hard > 0 ? 'hard' : 'demon';
    const fallbackEntries = SUBTYPE_ENTRY_MAP[topicId](repDifficulty(fallbackTier));
    const fallbackTag = fallbackEntries[0]?.tag ?? 'unknown';
    slots.push({ difficulty: randDifficultyInTier(fallbackTier), subtypeTag: fallbackTag });
  }

  return shuffle(slots);
}
