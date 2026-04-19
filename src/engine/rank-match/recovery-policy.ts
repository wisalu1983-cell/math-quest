import type { RankMatchSessionStatus } from '@/types/gamification';

export type RankMatchRecoveryDecision =
  | 'auto-resume-practice'
  | 'stay-home'
  | 'clear-and-ignore';

export function decideRankMatchRecovery(params: {
  status: RankMatchSessionStatus;
  hasUnfinishedGame: boolean;
}): RankMatchRecoveryDecision {
  const { status, hasUnfinishedGame } = params;

  if (status === 'completed' || status === 'cancelled') {
    return 'clear-and-ignore';
  }

  if (status === 'suspended') {
    return 'stay-home';
  }

  return hasUnfinishedGame ? 'auto-resume-practice' : 'stay-home';
}
