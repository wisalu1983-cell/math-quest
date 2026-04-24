// src/dev-tool/injections/rank-progress.ts
// F3 注入项：段位等级切换（RankProgress.currentTier）

import type { DevInjection } from '../types';
import { useUserStore } from '@/store';
import { repository } from '@/repository/local';
import { applyAndReload } from '../namespace';
import type { GameProgress, RankTier } from '@/types/gamification';
import { TIER_LABEL } from '@/constants/rank-match';

const TIERS: RankTier[] = ['apprentice', 'rookie', 'pro', 'expert', 'master'];

function requireUserId(): string {
  const user = useUserStore.getState().user;
  if (!user) {
    throw new Error('当前 namespace 没有用户，请先在 Onboarding 创建账号或切回"正式数据"');
  }
  return user.id;
}

function mutateProgress(patch: (prev: GameProgress) => GameProgress): void {
  const userId = requireUserId();
  const prev = repository.getGameProgress(userId);
  const next = patch({ ...prev, userId });
  repository.saveGameProgress(next);
}

export const rankProgressInjections: DevInjection[] = TIERS.map(tier => ({
  id: `rank.set-tier.${tier}`,
  group: 'rank',
  label: `段位设为 ${TIER_LABEL[tier]}`,
  description: `rankProgress.currentTier → ${tier}（不触碰 activeSessionId / history）`,
  async run() {
    await applyAndReload(() => {
      mutateProgress(gp => {
        const prev = gp.rankProgress ?? { currentTier: 'apprentice' as RankTier, history: [] };
        return {
          ...gp,
          rankProgress: { ...prev, currentTier: tier },
        };
      });
    });
  },
}));
