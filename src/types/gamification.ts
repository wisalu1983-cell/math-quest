// src/types/gamification.ts
import type { TopicId, WrongQuestion } from './index';

// ─── Advance System ───

/** 子题型定义（不含 gen 闭包，供进阶系统读取权重用） */
export interface SubtypeDef {
  tag: string;
  weight: number;
}

/** 进阶 session 的单道题槽位（session 开始时预生成） */
export interface AdvanceSlot {
  difficulty: number;
  subtypeTag: string;
}

/** 单题型进阶进度 */
export interface TopicAdvanceProgress {
  topicId: TopicId;
  heartsAccumulated: number; // 累计已投入心数
  sessionsPlayed: number;    // 总局数（含白练局）
  sessionsWhite: number;     // 白练局数（heartsEarned = 0）
  unlockedAt: number;        // 解锁时间戳
}

/** 进阶系统进度（全题型汇总） */
export type AdvanceProgress = Partial<Record<TopicId, TopicAdvanceProgress>>;

// ─── Campaign System ───

/** 单个关卡定义（只读静态数据） */
export interface CampaignLevel {
  levelId: string;         // e.g. "mental-arithmetic-S1-LA-L1"
  difficulty: number;      // 1-7（不含魔王）
  questionCount: number;   // 10-20
}

/** 路线定义（同一阶段内可并行） */
export interface CampaignLane {
  laneId: string;          // e.g. "mental-arithmetic-S1-LA"
  laneLabel: string;       // e.g. "主路线" | "估算" | "比较"
  levels: CampaignLevel[];
  subtypeFilter?: string[];  // 限定此路线允许的子题型标签，为空/undefined 时不过滤
}

/** 阶段定义 */
export interface CampaignStage {
  stageId: string;         // e.g. "mental-arithmetic-S1"
  stageLabel: string;      // e.g. "入门" | "进阶" | "挑战" | "Boss战"
  isBoss: boolean;
  lanes: CampaignLane[];
}

/** 单题型完整闯关地图（只读静态数据） */
export interface CampaignMap {
  topicId: TopicId;
  stages: CampaignStage[];
}

// ─── Campaign Progress（用户数据） ───

/** 单个关卡的通关记录 */
export interface LevelCompletion {
  levelId: string;
  bestHearts: number;  // 通关时剩余心数（1-3）
  completedAt: number; // timestamp
}

/** 单题型闯关进度 */
export interface TopicCampaignProgress {
  topicId: TopicId;
  completedLevels: LevelCompletion[];
  campaignCompleted: boolean; // 含 Boss 关全部通关
}

// ─── Rank Match System（Phase 3） ───

/**
 * 段位枚举（2026-04-19 更名决策：原 bronze/silver/gold/platinum/king 已全面废弃）
 * - apprentice = 学徒：初始标签，无段位赛逻辑
 * - rookie     = 新秀：第一个有考核的段位（BO3）
 * - pro        = 高手（BO5）
 * - expert     = 专家（BO5，30 分钟计时）
 * - master     = 大师（BO7，30 分钟计时）
 */
export type RankTier = 'apprentice' | 'rookie' | 'pro' | 'expert' | 'master';

export type RankMatchBestOf = 3 | 5 | 7;
export type RankMatchSessionStatus = 'active' | 'suspended' | 'completed' | 'cancelled';

/**
 * 单局记录（已完成或进行中）。
 * 答题明细（题目 id 序列、每题对错、耗时、剩余心数等）一律从 PracticeSession 反查，
 * 本对象不冗余存储——避免双写导致不一致。
 */
export interface RankMatchGame {
  /** 该局在 BO 序列里的序号，1-based，连续递增 */
  gameIndex: number;
  finished: boolean;
  /** finished=false 时为 undefined；finished=true 时表示"是否剩 ≥1 心打完" */
  won?: boolean;
  /** 关联的 PracticeSession.id；答题明细一律从 PracticeSession 反查 */
  practiceSessionId: string;
  startedAt: number;
  endedAt?: number;
}

/**
 * 整个 BO 赛事。
 * 不设 currentGameIndex 字段：当前活跃局由派生函数 getCurrentGameIndex 从 games 末尾 finished=false 的一项推导；
 * 把它做成冗余持久化字段会在"刷新页面恢复"、"BO 提前结束"等路径上反复制造不一致风险。
 */
export interface RankMatchSession {
  id: string;
  userId: string;
  /** 挑战的目标段位（不等于当前段位，是"打赢就晋级到"的那个段位） */
  targetTier: Exclude<RankTier, 'apprentice'>;
  bestOf: RankMatchBestOf;
  /** 达到该胜场数即晋级 = (bestOf + 1) / 2 */
  winsToAdvance: number;
  /** BO 序列里的所有已打或已开始的局；按 gameIndex 顺序 */
  games: RankMatchGame[];
  /** 会话生命周期：进行中 / 主动中断 / 正常结束 / 放弃重开 */
  status: RankMatchSessionStatus;
  outcome?: 'promoted' | 'eliminated';
  startedAt: number;
  suspendedAt?: number;
  cancelledAt?: number;
  endedAt?: number;
}

/** 跨 session 的段位持久化 */
export interface RankProgress {
  /** 当前已达到的最高段位 */
  currentTier: RankTier;
  /** 每段位的尝试历史（时间顺序），用于复盘、失败统计、UI 展示 */
  history: Array<{
    targetTier: Exclude<RankTier, 'apprentice'>;
    outcome: 'promoted' | 'eliminated';
    startedAt: number;
    endedAt: number;
  }>;
  /** 正在进行但未结束的 BO；同一时刻最多 1 场 */
  activeSessionId?: string;
}

// ─── Unified Game Progress ───

/** 替代旧 UserProgress 的主进度对象 */
export interface GameProgress {
  userId: string;
  campaignProgress: Partial<Record<TopicId, TopicCampaignProgress>>;
  advanceProgress: AdvanceProgress;   // Phase 2
  rankProgress?: RankProgress;         // Phase 3
  wrongQuestions: WrongQuestion[];
  totalQuestionsAttempted: number;
  totalQuestionsCorrect: number;
}

// ─── Session Mode ───

export type GameSessionMode = 'campaign' | 'advance' | 'wrong-review' | 'rank-match';
