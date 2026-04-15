// src/store/gamification.ts
import { create } from 'zustand';
import type { GameProgress, TopicCampaignProgress, LevelCompletion, TopicAdvanceProgress } from '@/types/gamification';
import type { TopicId, WrongQuestion } from '@/types';
import { repository } from '@/repository/local';
import { isCampaignFullyCompleted } from '@/constants/campaign';
import { getStars, getStarProgress } from '@/engine/advance';
import { TOPIC_STAR_CAP } from '@/constants/advance';

interface GameProgressStore {
  gameProgress: GameProgress | null;

  loadGameProgress: (userId: string) => void;

  /** 记录一次闯关通关（heartsRemaining > 0 才调用） */
  recordLevelCompletion: (
    topicId: TopicId,
    levelId: string,
    heartsRemaining: number
  ) => void;

  addWrongQuestion: (wq: WrongQuestion) => void;
  recordAttempt: (correct: boolean) => void;

  /** 判断某关卡是否已通关 */
  isLevelCompleted: (topicId: TopicId, levelId: string) => boolean;

  /** 判断某题型闯关是否全部通关（含 Boss） */
  isTopicCampaignDone: (topicId: TopicId) => boolean;

  // ─── Phase 2: 进阶系统 ───

  /** 解锁某题型进阶（闯关全通后自动触发） */
  unlockAdvance: (topicId: TopicId) => void;

  /** 进阶 session 正常结算（心归零或做完全部题）*/
  recordAdvanceSession: (topicId: TopicId, heartsEarned: number) => void;

  /** 获取某题型进阶进度（含派生星级信息） */
  getAdvanceProgress: (topicId: TopicId) => {
    progress: TopicAdvanceProgress | null;
    currentStars: number;
    starProgress: number;
    cap: 3 | 5;
  };

  /** 判断某题型进阶是否已解锁 */
  isAdvanceUnlocked: (topicId: TopicId) => boolean;
}

export const useGameProgressStore = create<GameProgressStore>((set, get) => ({
  gameProgress: null,

  loadGameProgress: (userId) => {
    const gp = repository.getGameProgress(userId);
    repository.saveGameProgress(gp);
    set({ gameProgress: gp });
  },

  recordLevelCompletion: (topicId, levelId, heartsRemaining) => {
    const gp = get().gameProgress;
    if (!gp) return;

    const existing: TopicCampaignProgress = gp.campaignProgress[topicId] ?? {
      topicId,
      completedLevels: [],
      campaignCompleted: false,
    };

    // 更新 bestHearts（保留最佳）
    const prevIdx = existing.completedLevels.findIndex(l => l.levelId === levelId);
    const newCompletion: LevelCompletion = {
      levelId,
      bestHearts: prevIdx >= 0
        ? Math.max(existing.completedLevels[prevIdx].bestHearts, heartsRemaining)
        : heartsRemaining,
      completedAt: Date.now(),
    };

    const updatedLevels = prevIdx >= 0
      ? existing.completedLevels.map((l, i) => i === prevIdx ? newCompletion : l)
      : [...existing.completedLevels, newCompletion];

    const completedIds = new Set(updatedLevels.map(l => l.levelId));
    const campaignCompleted = isCampaignFullyCompleted(topicId, completedIds);

    const updatedTopic: TopicCampaignProgress = {
      ...existing,
      completedLevels: updatedLevels,
      campaignCompleted,
    };

    const updated: GameProgress = {
      ...gp,
      campaignProgress: { ...gp.campaignProgress, [topicId]: updatedTopic },
    };

    repository.saveGameProgress(updated);
    set({ gameProgress: updated });

    // 闯关全通 → 自动解锁进阶
    if (campaignCompleted) {
      get().unlockAdvance(topicId);
    }
  },

  addWrongQuestion: (wq) => {
    const gp = get().gameProgress;
    if (!gp) return;
    const updated = {
      ...gp,
      wrongQuestions: [...gp.wrongQuestions, wq].slice(-100),
    };
    repository.saveGameProgress(updated);
    set({ gameProgress: updated });
  },

  recordAttempt: (correct) => {
    const gp = get().gameProgress;
    if (!gp) return;
    const updated = {
      ...gp,
      totalQuestionsAttempted: gp.totalQuestionsAttempted + 1,
      totalQuestionsCorrect: gp.totalQuestionsCorrect + (correct ? 1 : 0),
    };
    repository.saveGameProgress(updated);
    set({ gameProgress: updated });
  },

  isLevelCompleted: (topicId, levelId) => {
    const gp = get().gameProgress;
    if (!gp) return false;
    return gp.campaignProgress[topicId]?.completedLevels.some(l => l.levelId === levelId) ?? false;
  },

  isTopicCampaignDone: (topicId) => {
    const gp = get().gameProgress;
    if (!gp) return false;
    return gp.campaignProgress[topicId]?.campaignCompleted ?? false;
  },

  // ─── Phase 2: 进阶系统实现 ───

  unlockAdvance: (topicId) => {
    const gp = get().gameProgress;
    if (!gp) return;
    // 已解锁则跳过
    if (gp.advanceProgress[topicId]) return;

    const newEntry: TopicAdvanceProgress = {
      topicId,
      heartsAccumulated: 0,
      sessionsPlayed: 0,
      sessionsWhite: 0,
      unlockedAt: Date.now(),
    };
    const updated: GameProgress = {
      ...gp,
      advanceProgress: { ...gp.advanceProgress, [topicId]: newEntry },
    };
    repository.saveGameProgress(updated);
    set({ gameProgress: updated });
  },

  recordAdvanceSession: (topicId, heartsEarned) => {
    const gp = get().gameProgress;
    if (!gp) return;

    const existing: TopicAdvanceProgress = gp.advanceProgress[topicId] ?? {
      topicId,
      heartsAccumulated: 0,
      sessionsPlayed: 0,
      sessionsWhite: 0,
      unlockedAt: Date.now(),
    };

    const updated: GameProgress = {
      ...gp,
      advanceProgress: {
        ...gp.advanceProgress,
        [topicId]: {
          ...existing,
          heartsAccumulated: existing.heartsAccumulated + heartsEarned,
          sessionsPlayed: existing.sessionsPlayed + 1,
          sessionsWhite: existing.sessionsWhite + (heartsEarned === 0 ? 1 : 0),
        },
      },
    };
    repository.saveGameProgress(updated);
    set({ gameProgress: updated });
  },

  getAdvanceProgress: (topicId) => {
    const gp = get().gameProgress;
    const cap = TOPIC_STAR_CAP[topicId];
    if (!gp || !gp.advanceProgress[topicId]) {
      return { progress: null, currentStars: 0, starProgress: 0, cap };
    }
    const progress = gp.advanceProgress[topicId]!;
    return {
      progress,
      currentStars: getStars(progress.heartsAccumulated, cap),
      starProgress: getStarProgress(progress.heartsAccumulated, cap),
      cap,
    };
  },

  isAdvanceUnlocked: (topicId) => {
    const gp = get().gameProgress;
    if (!gp) return false;
    return !!gp.advanceProgress[topicId];
  },
}));
