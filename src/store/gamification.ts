// src/store/gamification.ts
import { create } from 'zustand';
import type { GameProgress, TopicCampaignProgress, LevelCompletion } from '@/types/gamification';
import type { TopicId, WrongQuestion } from '@/types';
import { repository } from '@/repository/local';
import { isCampaignFullyCompleted } from '@/constants/campaign';

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
}));
