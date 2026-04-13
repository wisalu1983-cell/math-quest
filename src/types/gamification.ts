// src/types/gamification.ts
import type { TopicId, WrongQuestion } from './index';

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
  // Phase 2 在此追加 advanceProgress
  // Phase 3 在此追加 rankProgress
  wrongQuestions: WrongQuestion[];
  totalQuestionsAttempted: number;
  totalQuestionsCorrect: number;
}

// ─── Session Mode ───

export type GameSessionMode = 'campaign' | 'wrong-review';
// Phase 2 追加 'advance'；Phase 3 追加 'rank-match'
