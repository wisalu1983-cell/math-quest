// src/dev-tool/injections/advance.ts
// F3 注入项：进阶星级设定（按 TOPIC_STAR_CAP 反推 heartsAccumulated）

import type { DevInjection } from '../types';
import { TOPICS } from '@/constants';
import {
  TOPIC_STAR_CAP,
  STAR_THRESHOLDS_3,
  STAR_THRESHOLDS_5,
} from '@/constants/advance';
import { getStars } from '@/engine/advance';
import { useUserStore } from '@/store';
import { repository } from '@/repository/local';
import { applyAndReload } from '../namespace';
import type {
  GameProgress,
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

function heartsFor(topicId: TopicId, stars: number): number {
  const cap = TOPIC_STAR_CAP[topicId];
  if (stars <= 0) return 0;
  const thresholds = cap === 3 ? STAR_THRESHOLDS_3 : STAR_THRESHOLDS_5;
  const capped = Math.min(stars, cap);
  return thresholds[capped - 1];
}

function mutateProgress(patch: (prev: GameProgress) => GameProgress): void {
  const userId = requireUserId();
  const prev = repository.getGameProgress(userId);
  const next = patch({ ...prev, userId });
  repository.saveGameProgress(next);
}

function setStarsFor(
  gp: GameProgress,
  topicId: TopicId,
  stars: number,
): GameProgress {
  const now = Date.now();
  const hearts = heartsFor(topicId, stars);
  const prev: TopicAdvanceProgress = gp.advanceProgress[topicId] ?? {
    topicId,
    heartsAccumulated: 0,
    sessionsPlayed: 0,
    sessionsWhite: 0,
    unlockedAt: now,
  };
  const next: TopicAdvanceProgress = {
    ...prev,
    topicId,
    heartsAccumulated: hearts,
    unlockedAt: prev.unlockedAt ?? now,
  };
  return {
    ...gp,
    advanceProgress: { ...gp.advanceProgress, [topicId]: next },
  };
}

function addOneStarForTopic(gp: GameProgress, topicId: TopicId): GameProgress {
  const cap = TOPIC_STAR_CAP[topicId];
  const currentHearts = gp.advanceProgress[topicId]?.heartsAccumulated ?? 0;
  const nextStars = Math.min(getStars(currentHearts, cap) + 1, cap);
  return setStarsFor(gp, topicId, nextStars);
}

// 每题型每次 +1★
const perTopicAddStar: DevInjection[] = TOPICS.map(t => {
  const cap = TOPIC_STAR_CAP[t.id];
  return {
    id: `advance.add-star.${t.id}`,
    group: 'advance',
    label: `${t.name} 进阶 +1★`,
    description: `每点一次只给 ${t.name} 增加 1★；已到 ${cap}★ 时保持封顶`,
    async run() {
      await applyAndReload(() => {
        mutateProgress(gp => addOneStarForTopic(gp, t.id));
      });
    },
  };
});

const addAll: DevInjection = {
  id: 'advance.add-star.all',
  group: 'advance',
  label: '所有题型进阶 +1★',
  description: '所有玩家可见题型各增加 1★；已封顶题型保持封顶',
  async run() {
    await applyAndReload(() => {
      mutateProgress(gp => {
        let next = gp;
        for (const t of TOPICS) {
          next = addOneStarForTopic(next, t.id);
        }
        return next;
      });
    });
  },
};

const clearAll: DevInjection = {
  id: 'advance.clear.all',
  group: 'advance',
  label: '清空所有题型进阶星级（保留解锁态）',
  description: '把所有已解锁题型的 heartsAccumulated 归零，重新积星',
  async run() {
    await applyAndReload(() => {
      mutateProgress(gp => {
        const updated: Record<string, TopicAdvanceProgress> = {};
        for (const [k, v] of Object.entries(gp.advanceProgress)) {
          updated[k] = {
            ...v,
            heartsAccumulated: 0,
            sessionsPlayed: 0,
            sessionsWhite: 0,
          };
        }
        return { ...gp, advanceProgress: updated };
      });
    });
  },
};

export const advanceInjections: DevInjection[] = [addAll, clearAll, ...perTopicAddStar];
