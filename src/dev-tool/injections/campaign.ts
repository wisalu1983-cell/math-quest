// src/dev-tool/injections/campaign.ts
// F3 注入项：闯关通关

import type { DevInjection } from '../types';
import { TOPICS } from '@/constants';
import { getAllLevelIds, isCampaignFullyCompleted } from '@/constants/campaign';
import { useUserStore } from '@/store';
import { repository } from '@/repository/local';
import { applyAndReload } from '../namespace';
import type {
  GameProgress,
  TopicCampaignProgress,
  TopicAdvanceProgress,
} from '@/types/gamification';
import type { TopicId } from '@/types';

function requireUserId(): string {
  const user = useUserStore.getState().user;
  if (!user) {
    throw new Error('当前 namespace 没有用户，请先在 Onboarding 创建账号或切回"正式数据"');
  }
  return user.id;
}

function buildFullClear(topicId: TopicId, now: number): TopicCampaignProgress {
  const allIds = getAllLevelIds(topicId);
  return {
    topicId,
    completedLevels: allIds.map(levelId => ({
      levelId,
      bestHearts: 3,
      completedAt: now,
    })),
    campaignCompleted: isCampaignFullyCompleted(topicId, new Set(allIds)),
  };
}

function ensureAdvanceUnlocked(
  advance: Record<string, TopicAdvanceProgress>,
  topicId: TopicId,
  now: number,
): Record<string, TopicAdvanceProgress> {
  if (advance[topicId]) return advance;
  return {
    ...advance,
    [topicId]: {
      topicId,
      heartsAccumulated: 0,
      sessionsPlayed: 0,
      sessionsWhite: 0,
      unlockedAt: now,
    },
  };
}

function mutateProgress(patch: (prev: GameProgress) => GameProgress): void {
  const userId = requireUserId();
  const prev = repository.getGameProgress(userId);
  const next = patch({ ...prev, userId });
  repository.saveGameProgress(next);
}

const perTopicCompletions: DevInjection[] = TOPICS.map(t => ({
  id: `campaign.complete.${t.id}`,
  group: 'campaign',
  label: `完成 ${t.name} 全部关卡`,
  description: `${t.name} 所有关卡打满 3 心通关；附带解锁进阶`,
  async run() {
    await applyAndReload(() => {
      const now = Date.now();
      mutateProgress(gp => ({
        ...gp,
        campaignProgress: { ...gp.campaignProgress, [t.id]: buildFullClear(t.id, now) },
        advanceProgress: ensureAdvanceUnlocked(gp.advanceProgress, t.id, now),
      }));
    });
  },
}));

const completeAll: DevInjection = {
  id: 'campaign.complete-all',
  group: 'campaign',
  label: '完成所有题型全部关卡',
  description: '8 题型全关卡满星通关 + 所有进阶解锁',
  async run() {
    await applyAndReload(() => {
      const now = Date.now();
      mutateProgress(gp => {
        const campaignProgress = { ...gp.campaignProgress };
        let advanceProgress = gp.advanceProgress;
        for (const t of TOPICS) {
          campaignProgress[t.id] = buildFullClear(t.id, now);
          advanceProgress = ensureAdvanceUnlocked(advanceProgress, t.id, now);
        }
        return { ...gp, campaignProgress, advanceProgress };
      });
    });
  },
};

export const campaignInjections: DevInjection[] = [completeAll, ...perTopicCompletions];
