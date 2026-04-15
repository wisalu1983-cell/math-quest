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

// ─── Unified Game Progress ───

/** 替代旧 UserProgress 的主进度对象 */
export interface GameProgress {
  userId: string;
  campaignProgress: Partial<Record<TopicId, TopicCampaignProgress>>;
  advanceProgress: AdvanceProgress;   // Phase 2
  // Phase 3 追加 rankProgress
  wrongQuestions: WrongQuestion[];
  totalQuestionsAttempted: number;
  totalQuestionsCorrect: number;
}

// ─── Session Mode ───

export type GameSessionMode = 'campaign' | 'advance' | 'wrong-review';
// Phase 3 追加 'rank-match'
