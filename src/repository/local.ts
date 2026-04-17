// src/repository/local.ts
import type { User, PracticeSession, TopicId } from '@/types';
import type { GameProgress, TopicCampaignProgress } from '@/types/gamification';
import { CAMPAIGN_MAPS, getAllLevelIds, isCampaignFullyCompleted } from '@/constants/campaign';

const KEYS = {
  user: 'mq_user',
  gameProgress: 'mq_game_progress',
  sessions: 'mq_sessions',
  version: 'mq_version',
} as const;

const CURRENT_VERSION = 2;
const MAX_SESSIONS = 200;

/**
 * ISSUE-057（2026-04-17）闯关结构全面重构后的一次性存档迁移（策略 X）
 *
 * 背景：8 个题型的 stage/lane/levelId 都发生了变化。旧结构里存在的
 *   levelId（如 'mental-arithmetic-S4-LA-L1' 老 Boss）在新结构里不存在，
 *   玩家进度如果不迁移就会变成孤儿数据。
 *
 * 策略：
 *   - 如果玩家曾通 Boss（campaignCompleted=true 或含任何旧 Boss levelId）
 *     → 新结构所有 levelId 直接标记通关（bestHearts=3）
 *   - 否则丢弃旧 completedLevels，玩家从新 S1 第 1 关开始
 *   - advanceProgress 不动
 *
 * 幂等：只有当 completedLevels 含"新结构外 levelId"时才触发；迁移一次后
 *   所有 levelId 都属于新结构，不再触发。
 */
export function migrateCampaignIfNeeded(gp: GameProgress): GameProgress {
  let changed = false;
  const newCampaignProgress: typeof gp.campaignProgress = { ...gp.campaignProgress };

  for (const topicId of Object.keys(CAMPAIGN_MAPS) as TopicId[]) {
    const topicProg = gp.campaignProgress[topicId];
    if (!topicProg) continue;

    const validIds = new Set(getAllLevelIds(topicId));
    const hasStaleId = topicProg.completedLevels.some(l => !validIds.has(l.levelId));

    if (!hasStaleId) continue;

    changed = true;
    const wasBossDone = topicProg.campaignCompleted === true;

    let migrated: TopicCampaignProgress;
    if (wasBossDone) {
      const now = Date.now();
      const allIds = getAllLevelIds(topicId);
      migrated = {
        topicId,
        completedLevels: allIds.map(levelId => ({
          levelId,
          bestHearts: 3,
          completedAt: now,
        })),
        campaignCompleted: isCampaignFullyCompleted(topicId, new Set(allIds)),
      };
    } else {
      const kept = topicProg.completedLevels.filter(l => validIds.has(l.levelId));
      const keptIds = new Set(kept.map(l => l.levelId));
      migrated = {
        topicId,
        completedLevels: kept,
        campaignCompleted: isCampaignFullyCompleted(topicId, keptIds),
      };
    }

    newCampaignProgress[topicId] = migrated;
  }

  if (!changed) return gp;
  return { ...gp, campaignProgress: newCampaignProgress };
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

function write<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('数据保存失败，可能存储空间已满', e);
  }
}

export const repository = {
  init() {
    const version = read<number>(KEYS.version);
    if (version !== CURRENT_VERSION) {
      // 版本升级：清除旧数据，防止结构不兼容
      localStorage.removeItem('mq_progress');
      write(KEYS.version, CURRENT_VERSION);
    }
  },

  // User
  getUser(): User | null {
    return read<User>(KEYS.user);
  },

  saveUser(user: User): void {
    write(KEYS.user, user);
  },

  // GameProgress
  getGameProgress(userId: string): GameProgress {
    const raw = read<GameProgress>(KEYS.gameProgress);
    if (raw && raw.userId === userId) {
      // 向前兼容迁移：老数据无 advanceProgress 字段
      if (!raw.advanceProgress) raw.advanceProgress = {};
      // ISSUE-057 闯关结构重构后的一次性存档迁移
      const migrated = migrateCampaignIfNeeded(raw);
      if (migrated !== raw) {
        write(KEYS.gameProgress, migrated);
      }
      return migrated;
    }
    return {
      userId,
      campaignProgress: {},
      advanceProgress: {},
      wrongQuestions: [],
      totalQuestionsAttempted: 0,
      totalQuestionsCorrect: 0,
    };
  },

  saveGameProgress(progress: GameProgress): void {
    write(KEYS.gameProgress, progress);
  },

  // Sessions
  getSessions(): PracticeSession[] {
    return read<PracticeSession[]>(KEYS.sessions) ?? [];
  },

  saveSession(session: PracticeSession): void {
    const sessions = this.getSessions();
    sessions.push(session);
    if (sessions.length > MAX_SESSIONS) {
      sessions.splice(0, sessions.length - MAX_SESSIONS);
    }
    write(KEYS.sessions, sessions);
  },

  getRecentSessions(limit: number): PracticeSession[] {
    return this.getSessions().slice(-limit);
  },

  clearAll(): void {
    localStorage.removeItem(KEYS.user);
    localStorage.removeItem(KEYS.gameProgress);
    localStorage.removeItem(KEYS.sessions);
    localStorage.removeItem('mq_progress');
  },
};
