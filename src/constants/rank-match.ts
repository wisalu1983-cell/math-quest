// src/constants/rank-match.ts
// 段位赛常量层 · Phase 3 M1
//
// 事实源：
//   - 入场星级表：`ProjectManager/Specs/2026-04-13-star-rank-numerical-design.md` §3.2
//   - 出题范围 / 新内容点：`ProjectManager/Specs/2026-04-10-gamification-redesign.md` §5.2 / §8 Q9
//   - 每场题量 / 计时：`ProjectManager/Specs/2026-04-18-rank-match-phase3-implementation-spec.md` §5.3
//   - 星级上限：沿用 `src/constants/advance.ts::TOPIC_STAR_CAP`（不在本文件重复定义）

import type { TopicId } from '@/types';
import type { RankTier, RankMatchBestOf } from '@/types/gamification';

/** 需要段位赛考核的段位（排除学徒初始标签） */
export type ChallengeableTier = Exclude<RankTier, 'apprentice'>;

/**
 * 段位入场门槛：每段位需要各题型达到的星级数（0-5）。
 * 未列出的题型视为无要求（0 星即可）。
 *
 * 对照表来源：2026-04-13 §3.2，"粗体为该段位新增的要求"在本表中以数值体现。
 */
export const RANK_ENTRY_STARS: Record<ChallengeableTier, Partial<Record<TopicId, number>>> = {
  rookie: {
    'mental-arithmetic':  1, // A01
    'number-sense':       1, // A02
    'vertical-calc':      1, // A03
    'operation-laws':     1, // A04
  },
  pro: {
    'mental-arithmetic':  2,
    'number-sense':       2,
    'vertical-calc':      2,
    'operation-laws':     2,
    'decimal-ops':        2, // A05
    'bracket-ops':        2, // A06
    'multi-step':         2, // A07
    'equation-transpose': 2, // A08
  },
  expert: {
    'mental-arithmetic':  2,
    'number-sense':       3,
    'vertical-calc':      3,
    'operation-laws':     3,
    'decimal-ops':        4,
    'bracket-ops':        4,
    'multi-step':         4,
    'equation-transpose': 3,
  },
  master: {
    'mental-arithmetic':  3, // A01 cap=3
    'number-sense':       5,
    'vertical-calc':      5,
    'operation-laws':     3, // A04 cap=3
    'decimal-ops':        5,
    'bracket-ops':        5,
    'multi-step':         5,
    'equation-transpose': 3, // A08 cap=3
  },
};

/** BO 赛制 */
export const RANK_BEST_OF: Record<ChallengeableTier, RankMatchBestOf> = {
  rookie: 3,
  pro:    5,
  expert: 5,
  master: 7,
};

/** 晋级所需胜场数 = (bestOf + 1) / 2 */
export const RANK_WINS_TO_ADVANCE: Record<ChallengeableTier, number> = {
  rookie: 2,
  pro:    3,
  expert: 3,
  master: 4,
};

/** 每场题量（Spec §5.3 首版取值） */
export const RANK_QUESTIONS_PER_GAME: Record<ChallengeableTier, number> = {
  rookie: 20,
  pro:    25,
  expert: 25,
  master: 30,
};

/**
 * 每场倒计时（分钟）。
 * 仅专家 / 大师设计时；未列出的段位代表"不设计时"。
 */
export const RANK_TIMER_MINUTES: Partial<Record<ChallengeableTier, number>> = {
  expert: 30,
  master: 30,
};

/**
 * 各段位「新内容点」数量。
 * 抽题器（M2）按 ⌈N ÷ W⌉ 计算每场主考项数；M1 仅供类型层与验收钩子读取。
 *
 * 依据 2026-04-10 §8 Q9：
 *   - 新秀 4（A01/A02/A03/A04 首次出题）
 *   - 高手 8*（A05~A08 首次出题 + A01~A04 新增困难档；*详细设计阶段可能压缩到 6）
 *   - 专家 6（A03~A08 提升至困难为主）
 *   - 大师 5（A04~A08 提升至更高魔王比例，2+2+1 分配到 4 胜场）
 */
export const RANK_NEW_CONTENT_POINTS: Record<ChallengeableTier, number> = {
  rookie: 4,
  pro:    8,
  expert: 6,
  master: 5,
};

// ─── M2 抽题器数据表（Spec 2026-04-18 §5） ───

/**
 * 各段位的出题题型范围（Spec §5.2 表 "出题题型" 列）。
 * 顺序为 TopicId 书写顺序，供 §5.4 "确定性胜场编排" 使用。
 */
export const RANK_TOPIC_RANGE: Record<ChallengeableTier, TopicId[]> = {
  rookie: ['mental-arithmetic', 'number-sense', 'vertical-calc', 'operation-laws'],
  pro:    [
    'mental-arithmetic', 'number-sense', 'vertical-calc', 'operation-laws',
    'decimal-ops', 'bracket-ops', 'multi-step', 'equation-transpose',
  ],
  expert: [
    'vertical-calc', 'operation-laws',
    'decimal-ops', 'bracket-ops', 'multi-step', 'equation-transpose',
  ],
  master: [
    'operation-laws', 'decimal-ops', 'bracket-ops', 'multi-step', 'equation-transpose',
  ],
};

/**
 * 复习题来源（之前段位 TopicId 的并集）。
 * Spec §5.5 要求复习题难度与之前段位对齐；rookie 无之前段位，review=[]。
 */
export const RANK_REVIEW_TOPIC_RANGE: Record<ChallengeableTier, TopicId[]> = {
  rookie: [],
  pro:    RANK_TOPIC_RANGE.rookie,
  expert: RANK_TOPIC_RANGE.pro,
  master: RANK_TOPIC_RANGE.expert,
};

/**
 * 主考项胜场映射（Spec §5.4 确定性编排 · TopicId 书写顺序）。
 * `RANK_PRIMARY_BY_WIN_SLOT[tier][winSlot - 1]` = 第 winSlot 个胜场的主考项。
 *
 * 设计要点：
 *  - rookie：4 内容点 / W=2 → 每场主考 2 项，正好对齐
 *  - pro：   8 内容点 / W=3 → ⌈8/3⌉=3，末位复用第一个保证每场恰好 3 项
 *  - expert：6 内容点 / W=3 → 每场 2 项
 *  - master：5 内容点 / W=4，依 Spec §8 Q9 脚注 "2+2+1"，第 4 场复用第 3 场 A08
 *    （Plan §4.2 M2 开放项的首版决策，待 playtest 复盘）
 */
export const RANK_PRIMARY_BY_WIN_SLOT: Record<ChallengeableTier, TopicId[][]> = {
  rookie: [
    ['mental-arithmetic', 'number-sense'],
    ['vertical-calc',     'operation-laws'],
  ],
  pro: [
    ['mental-arithmetic', 'number-sense', 'vertical-calc'],
    ['operation-laws',    'decimal-ops',  'bracket-ops'],
    ['multi-step',        'equation-transpose', 'mental-arithmetic'],
  ],
  expert: [
    ['vertical-calc',     'operation-laws'],
    ['decimal-ops',       'bracket-ops'],
    ['multi-step',        'equation-transpose'],
  ],
  master: [
    ['operation-laws',    'decimal-ops'],
    ['bracket-ops',       'multi-step'],
    ['equation-transpose'],
    ['equation-transpose'],
  ],
};

/** 难度桶类别（Spec §5.5） */
export type RankDifficultyBucket = 'primary' | 'nonPrimary' | 'review';

export interface DifficultyRange {
  min: number;
  max: number;
}

/**
 * 难度范围硬约束（Spec §5.5）。
 *
 * 记号：normal=2-5，hard=6-7，demon=8-10。
 * 特殊规则（不在本表表达，由 validators 补充）：
 *   - 专家复习题允许 ≤10% 为 normal 5 ("甜点回顾")
 *   - 大师 demon 占主考+非主考合集 ≥ 40%
 *   - 其它段位复习池不得出现 normal
 *
 * rookie 无复习题 → review 字段为 null。
 */
export const RANK_DIFFICULTY_RANGE: Record<
  ChallengeableTier,
  { primary: DifficultyRange; nonPrimary: DifficultyRange; review: DifficultyRange | null }
> = {
  rookie: {
    primary:    { min: 2, max: 5 },
    nonPrimary: { min: 2, max: 5 },
    review:     null,
  },
  pro: {
    primary:    { min: 3, max: 6 },
    nonPrimary: { min: 3, max: 5 },
    review:     { min: 2, max: 5 },
  },
  expert: {
    primary:    { min: 6, max: 8 },
    nonPrimary: { min: 6, max: 7 },
    review:     { min: 5, max: 7 },
  },
  master: {
    primary:    { min: 6, max: 10 },
    nonPrimary: { min: 6, max: 7 },
    review:     { min: 6, max: 7 },
  },
};

export const TIER_LABEL: Record<RankTier, string> = {
  apprentice: '学徒',
  rookie:     '新秀',
  pro:        '高手',
  expert:     '专家',
  master:     '大师',
};

export const TIER_ORDER: RankTier[] = ['apprentice', 'rookie', 'pro', 'expert', 'master'];
