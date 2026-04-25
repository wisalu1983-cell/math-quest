// src/engine/rank-match/question-picker.ts
// 段位赛抽题器 · Phase 3 M2（Spec 2026-04-18 §5）
//
// 职责：
//   - 按段位 × 胜场游标编排主考项（§5.4 确定性顺序）
//   - 按桶（主考 / 非主考 / 复习）分配题数与难度（§5.5 硬约束）
//   - 复习桶主题按近期错题频次加权（§5.6 / ISSUE-061）
//   - 通过 validateTierDistribution 自检（§5.7）
//   - 校验失败抛 PickerValidationError，严禁静默降级（§5.8）
//
// 不做：
//   - 不做入场校验（在 entry-gate.ts / createRankMatchSession 前置）
//   - 不写入 PracticeSession / store（调用方负责装配）

import type { Question, TopicId, WrongQuestion } from '@/types';
import type {
  AdvanceProgress,
  RankMatchSession,
} from '@/types/gamification';
import { generateQuestion } from '@/engine';
import { generateUniqueQuestion } from '@/engine/question-dedupe';
import {
  RANK_QUESTIONS_PER_GAME,
  RANK_PRIMARY_BY_WIN_SLOT,
  RANK_TOPIC_RANGE,
  RANK_REVIEW_TOPIC_RANGE,
  RANK_DIFFICULTY_RANGE,
  type ChallengeableTier,
  type DifficultyRange,
} from '@/constants/rank-match';
import {
  validateTierDistribution,
  toDifficultyBand,
  type TierDistributionBuckets,
} from './picker-validators';
// ISSUE-061：复习桶主题按近期错题频次加权
import { distributeReviewTopics, REVIEW_WRONG_WINDOW } from './review-weighting';

export interface PickQuestionsParams {
  session: RankMatchSession;
  gameIndex: number;
  advanceProgress: AdvanceProgress;
  /**
   * 玩家累积错题（用于 §5.6 复习桶主题加权，ISSUE-061）。
   * 不传 / 空数组 → 复习桶按均匀分布回落，保持 M2 原行为（rookie 无复习桶不受影响）。
   */
  wrongQuestions?: WrongQuestion[];
}

export interface PickQuestionsResult {
  /** 按答题顺序的混合题序（交错排列三桶，避免扎堆） */
  questions: Question[];
  /** 本局主考题型，写入 PracticeSession.rankMatchMeta.primaryTopics */
  primaryTopics: TopicId[];
  /** 分桶结果（测试与诊断用；正式答题流量只消费 questions） */
  buckets: TierDistributionBuckets;
}

export interface PickerValidationErrorContext {
  tier: ChallengeableTier;
  gameIndex: number;
  totalCount: number;
  /** 附带抽到的题目 id 样本，便于 §5.8 落地 ISSUE_LIST */
  sampledIds?: string[];
}

/** Spec §5.8：抽题器校验失败抛此异常，上层必须上抛（不得静默降级） */
export class PickerValidationError extends Error {
  readonly violations: string[];
  readonly context: PickerValidationErrorContext;

  constructor(
    message: string,
    violations: string[],
    context: PickerValidationErrorContext,
  ) {
    super(message);
    this.name = 'PickerValidationError';
    this.violations = violations;
    this.context = context;
  }
}

// ─── 主算法 ───

export function pickQuestionsForGame(params: PickQuestionsParams): PickQuestionsResult {
  const { session, gameIndex, wrongQuestions = [] } = params;
  const tier = session.targetTier;
  const totalCount = RANK_QUESTIONS_PER_GAME[tier];

  const primaryTopics = resolvePrimaryTopics(session, gameIndex);
  const tierRange = RANK_TOPIC_RANGE[tier];
  const nonPrimaryTopics = tierRange.filter(t => !primaryTopics.includes(t));
  const reviewTopics = RANK_REVIEW_TOPIC_RANGE[tier];

  // §5.5 桶难度配置
  const diffCfg = RANK_DIFFICULTY_RANGE[tier];

  // 桶题数：主考 ≥40% 取 ceil(total*0.40)；复习 ≤25% 取 floor(total*0.25)；
  // 非主考 = 余下。rookie 没有复习题，review=0。
  const primaryCount = Math.ceil(totalCount * 0.40);
  const reviewCount = diffCfg.review === null ? 0 : Math.floor(totalCount * 0.25);
  const nonPrimaryCount = totalCount - primaryCount - reviewCount;
  const seenSignatures = new Set<string>();

  // 生成三桶
  const primary = generateBucket({
    topics: primaryTopics,
    count: primaryCount,
    band: 'primary',
    tier,
    seenSignatures,
  });
  const nonPrimary = generateBucket({
    topics: nonPrimaryTopics.length > 0 ? nonPrimaryTopics : primaryTopics,
    count: nonPrimaryCount,
    band: 'nonPrimary',
    tier,
    seenSignatures,
  });
  // 复习桶：§5.6 按错题频次加权产出 topicsPerSlot；generateBucket 直接按该序列映射主题
  const review = diffCfg.review === null
    ? []
    : generateBucket({
        topics: reviewTopics,
        count: reviewCount,
        band: 'review',
        tier,
        seenSignatures,
        topicsPerSlot: distributeReviewTopics({
          reviewTopics,
          count: reviewCount,
          wrongQuestions,
          reviewRange: diffCfg.review,
          windowSize: REVIEW_WRONG_WINDOW,
        }),
      });

  const buckets: TierDistributionBuckets = { primary, nonPrimary, review };

  // §5.7 自检
  const result = validateTierDistribution(tier, buckets, totalCount);
  if (!result.ok) {
    const allQs = [...primary, ...nonPrimary, ...review];
    throw new PickerValidationError(
      `Rank match picker validation failed for tier=${tier} gameIndex=${gameIndex}: ${result.violations.length} violation(s)`,
      result.violations,
      {
        tier,
        gameIndex,
        totalCount,
        sampledIds: allQs.slice(0, 5).map(q => q.id),
      },
    );
  }

  return {
    questions: interleave([primary, nonPrimary, review]),
    primaryTopics,
    buckets,
  };
}

// ─── 胜场游标（§5.4） ───

/**
 * 第 gameIndex 局正在冲的胜场序号 (1-based)。
 * winSlot = 已胜场数 + 1（只统计 gameIndex 严格小于当前的 finished && won 局）；
 * 超过段位新内容点胜场数时复用最后一组主考项（§5.4 "必须已被选为主考项" 的兜底）。
 */
function resolvePrimaryTopics(session: RankMatchSession, gameIndex: number): TopicId[] {
  const winsBefore = session.games.filter(
    g => g.finished && g.won === true && g.gameIndex < gameIndex,
  ).length;
  const winSlot = winsBefore + 1;
  const mapping = RANK_PRIMARY_BY_WIN_SLOT[session.targetTier];
  const idx = Math.min(winSlot - 1, mapping.length - 1);
  return mapping[idx];
}

// ─── 桶生成 ───

type BucketKind = 'primary' | 'nonPrimary' | 'review';

interface GenerateBucketParams {
  topics: TopicId[];
  count: number;
  band: BucketKind;
  tier: ChallengeableTier;
  /**
   * 可选：长度必须等于 count 的"每槽主题"序列（当前仅复习桶使用，由
   * distributeReviewTopics 按错题频次预计算，ISSUE-061）。
   * 未提供时回落 round-robin `topics[i % topics.length]`（主考 / 非主考 / 无错题的复习桶）。
   */
  topicsPerSlot?: TopicId[];
  seenSignatures?: Set<string>;
}

function generateBucket(params: GenerateBucketParams): Question[] {
  const { topics, count, band, tier, topicsPerSlot, seenSignatures } = params;
  if (count === 0 || topics.length === 0) return [];

  // 难度配额（§5.5 硬比例约束）
  const difficulties = allocateDifficulties(tier, band, count);

  const out: Question[] = [];
  for (let i = 0; i < count; i++) {
    const topic = topicsPerSlot
      ? topicsPerSlot[i] ?? topics[i % topics.length]
      : topics[i % topics.length];
    const difficulty = difficulties[i];
    const question = seenSignatures
      ? generateUniqueQuestion({
          generate: () => generateQuestion(topic, difficulty),
          seen: seenSignatures,
          context: {
            sessionMode: 'rank-match',
            topicId: topic,
            difficulty,
            subtypeTag: band,
          },
        })
      : generateQuestion(topic, difficulty);
    out.push(question);
  }
  return out;
}

/**
 * 按段位 × 桶给出 count 道题的难度数组。
 * 保证满足 §5.5 硬比例（expert demon ≤20% primary、master demon ≥50% primary、
 * expert review normal 甜点 ≤10% 总题量折算到桶内 ≤50%）。
 */
function allocateDifficulties(tier: ChallengeableTier, band: BucketKind, count: number): number[] {
  const range = RANK_DIFFICULTY_RANGE[tier][band] as DifficultyRange | null;
  if (!range) return [];
  const out: number[] = [];

  switch (tier) {
    case 'rookie':
      // normal 2-5：均匀分布于 2,3,4,5
      for (let i = 0; i < count; i++) {
        out.push(2 + (i % 4));
      }
      break;

    case 'pro':
      if (band === 'primary') {
        // normal 3-5 + 少量 hard 6：hard 占 ~25%
        const hardCount = Math.floor(count * 0.25);
        for (let i = 0; i < hardCount; i++) out.push(6);
        const remaining = count - hardCount;
        for (let i = 0; i < remaining; i++) out.push(3 + (i % 3));
      } else if (band === 'nonPrimary') {
        for (let i = 0; i < count; i++) out.push(3 + (i % 3));
      } else {
        // review：normal 2-5 均匀
        for (let i = 0; i < count; i++) out.push(2 + (i % 4));
      }
      break;

    case 'expert':
      if (band === 'primary') {
        // hard 6-7 为主，demon 8 ≤20%
        const demonCount = Math.floor(count * 0.15); // 15% < 20% ✓
        for (let i = 0; i < demonCount; i++) out.push(8);
        const remaining = count - demonCount;
        for (let i = 0; i < remaining; i++) out.push(6 + (i % 2)); // 6/7 交错
      } else if (band === 'nonPrimary') {
        for (let i = 0; i < count; i++) out.push(6 + (i % 2));
      } else {
        // review：hard 6-7 主 + 甜点 normal 5 ≤10% 总题量
        // 总题量 = RANK_QUESTIONS_PER_GAME.expert = 25，10% = 2.5 → 桶内最多 2 道 normal
        const total = RANK_QUESTIONS_PER_GAME.expert;
        const sweetCap = Math.floor(total * 0.10); // =2
        const sweetCount = Math.min(sweetCap, Math.floor(count * 0.3));
        for (let i = 0; i < sweetCount; i++) out.push(5);
        const remaining = count - sweetCount;
        for (let i = 0; i < remaining; i++) out.push(6 + (i % 2));
      }
      break;

    case 'master':
      if (band === 'primary') {
        // Spec §5.5 表："hard + demon 混合"；硬约束 3："demon 占主考+非主考合集 ≥40%"。
        // master 固定配比 primary=12 / nonPrimary=11 / review=7，合集=23；
        // 40% × 23 ≈ 10 道 demon 是下限。保留 1 道 hard 保持 "混合" 语义，其余全 demon，
        // demon/合集 = 11/23 ≈ 47.8% 稳过。
        const hardCount = Math.min(1, count);
        const demonCount = count - hardCount;
        for (let i = 0; i < demonCount; i++) out.push(8 + (i % 3)); // 8/9/10 轮转
        for (let i = 0; i < hardCount; i++) out.push(7);
      } else if (band === 'nonPrimary') {
        for (let i = 0; i < count; i++) out.push(6 + (i % 2));
      } else {
        // review：hard 6-7
        for (let i = 0; i < count; i++) out.push(6 + (i % 2));
      }
      break;
  }

  // 兜底：若桶内某道难度越界（保险），钳到 range
  return out.map(d => Math.max(range.min, Math.min(range.max, d)));
}

// ─── 交错混合 ───

/**
 * Round-robin 混合多个桶，使最终题序不扎堆；
 * 长度差异以长桶多出的部分尾部补齐。
 */
function interleave(buckets: Question[][]): Question[] {
  const out: Question[] = [];
  const copies = buckets.map(b => [...b]);
  while (copies.some(b => b.length > 0)) {
    for (const bucket of copies) {
      const q = bucket.shift();
      if (q) out.push(q);
    }
  }
  return out;
}

// ─── 辅助导出（供 store/UI 查询本局主考项） ───

export { toDifficultyBand };
