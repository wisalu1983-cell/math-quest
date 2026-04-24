// src/dev-tool/injections/rank-active-session.ts
// F3 注入项：构造段位赛 BO 中途态 / 清空活跃 BO
//
// 约束（Spec `2026-04-18-rank-match-phase3-implementation-spec.md` §5.8）：
//   段位赛一致性异常必须显式处理。本注入项构造的数据必须自洽：
//     - games 序列连续、胜负明确
//     - 末局 unfinished、有 practiceSessionId 占位
//     - rankProgress.activeSessionId 与新 session.id 对齐
//   数据不一致（例如 user 缺失）一律抛错，绝不静默降级。

import { nanoid } from 'nanoid';
import type { DevInjection } from '../types';
import { useUserStore } from '@/store';
import { repository } from '@/repository/local';
import { applyAndReload } from '../namespace';
import type {
  GameProgress,
  RankMatchSession,
  RankMatchGame,
  RankMatchBestOf,
} from '@/types/gamification';
import {
  RANK_BEST_OF,
  RANK_WINS_TO_ADVANCE,
  TIER_LABEL,
  type ChallengeableTier,
} from '@/constants/rank-match';
import { RankMatchRecoveryError } from '@/store/rank-match';

function requireUserId(): string {
  const user = useUserStore.getState().user;
  if (!user) {
    throw new RankMatchRecoveryError(
      '当前 namespace 没有用户，F3 无法构造活跃 BO',
      'no-user',
    );
  }
  return user.id;
}

function mutateProgress(patch: (prev: GameProgress) => GameProgress): void {
  const userId = requireUserId();
  const prev = repository.getGameProgress(userId);
  const next = patch({ ...prev, userId });
  repository.saveGameProgress(next);
}

interface BuildMidBOParams {
  targetTier: ChallengeableTier;
  wins: number;
  losses: number;
}

/** 导出供单测直接断言 BO 中途态构造规则（实现无额外分支）。 */
export function buildMidBO({ targetTier, wins, losses }: BuildMidBOParams): RankMatchSession {
  const userId = requireUserId();
  const bestOf: RankMatchBestOf = RANK_BEST_OF[targetTier];
  const winsToAdvance = RANK_WINS_TO_ADVANCE[targetTier];

  const totalPlayed = wins + losses;
  if (totalPlayed + 1 > bestOf) {
    throw new RankMatchRecoveryError(
      `BO${bestOf} 不支持 ${wins}胜${losses}负 + 决胜局（超出总局数）`,
      'invalid-mid-state',
    );
  }
  if (wins >= winsToAdvance || losses >= winsToAdvance) {
    throw new RankMatchRecoveryError(
      `BO${bestOf} 在 ${wins}胜${losses}负 时赛事应已结束，不能构造为中途态`,
      'invalid-mid-state',
    );
  }

  const now = Date.now();
  const games: RankMatchGame[] = [];
  let gameIndex = 1;
  let remainingWins = wins;
  let remainingLosses = losses;
  // 交替铺胜负：W L W L ... 余下的集中在后段
  while (remainingWins > 0 || remainingLosses > 0) {
    const prefersWin =
      (gameIndex % 2 === 1 && remainingWins > 0) || remainingLosses === 0;
    const won = prefersWin;
    games.push({
      gameIndex,
      finished: true,
      won,
      practiceSessionId: nanoid(10),
      startedAt: now - (totalPlayed - gameIndex + 2) * 60_000,
      endedAt: now - (totalPlayed - gameIndex + 1) * 60_000,
    });
    if (won) remainingWins--;
    else remainingLosses--;
    gameIndex++;
  }

  // 末尾决胜局（未开始）
  games.push({
    gameIndex,
    finished: false,
    practiceSessionId: nanoid(10),
    startedAt: now,
  });

  return {
    id: nanoid(10),
    userId,
    targetTier,
    bestOf,
    winsToAdvance,
    games,
    status: 'active',
    startedAt: now - (totalPlayed + 1) * 60_000,
  };
}

async function constructMidBO(targetTier: ChallengeableTier, wins: number, losses: number): Promise<void> {
  await applyAndReload(() => {
    // 先清掉任何已有的活跃 BO，避免"两场并存"
    const userId = requireUserId();
    const prevGp = repository.getGameProgress(userId);
    const prevActiveId = prevGp.rankProgress?.activeSessionId;
    if (prevActiveId) {
      repository.deleteRankMatchSession(prevActiveId);
    }

    const session = buildMidBO({ targetTier, wins, losses });
    repository.saveRankMatchSession(session);
    mutateProgress(gp => ({
      ...gp,
      rankProgress: {
        ...(gp.rankProgress ?? { currentTier: 'apprentice', history: [] }),
        activeSessionId: session.id,
      },
    }));
  });
}

const midBOs: Array<{
  tier: ChallengeableTier;
  wins: number;
  losses: number;
  label: string;
  description: string;
}> = [
  {
    tier: 'rookie',
    wins: 1,
    losses: 1,
    label: `构造 BO3（${TIER_LABEL.rookie}）· 1胜1负 决胜局`,
    description: 'rookie BO3 的 1:1 决胜态，下一局决定晋级/淘汰',
  },
  {
    tier: 'pro',
    wins: 2,
    losses: 2,
    label: `构造 BO5（${TIER_LABEL.pro}）· 2胜2负 决胜局`,
    description: 'pro BO5 的 2:2 决胜态',
  },
  {
    tier: 'expert',
    wins: 2,
    losses: 2,
    label: `构造 BO5（${TIER_LABEL.expert}）· 2胜2负 决胜局`,
    description: 'expert BO5 的 2:2 决胜态',
  },
  {
    tier: 'master',
    wins: 3,
    losses: 3,
    label: `构造 BO7（${TIER_LABEL.master}）· 3胜3负 决胜局`,
    description: 'master BO7 的 3:3 决胜态',
  },
];

const constructInjections: DevInjection[] = midBOs.map(cfg => ({
  id: `rank.construct-active-bo.${cfg.tier}.${cfg.wins}-${cfg.losses}`,
  group: 'rank',
  label: cfg.label,
  description: cfg.description,
  async run() {
    await constructMidBO(cfg.tier, cfg.wins, cfg.losses);
  },
}));

const clearActive: DevInjection = {
  id: 'rank.clear-active',
  group: 'rank',
  label: '清空活跃 BO 赛事',
  description: '删除当前活跃 RankMatchSession + 清 activeSessionId（修复一致性异常）',
  async run() {
    await applyAndReload(() => {
      const userId = requireUserId();
      const gp = repository.getGameProgress(userId);
      const activeId = gp.rankProgress?.activeSessionId;
      if (activeId) repository.deleteRankMatchSession(activeId);
      mutateProgress(prev => ({
        ...prev,
        rankProgress: {
          ...(prev.rankProgress ?? { currentTier: 'apprentice', history: [] }),
          activeSessionId: undefined,
        },
      }));
    });
  },
};

export const rankActiveSessionInjections: DevInjection[] = [
  clearActive,
  ...constructInjections,
];
