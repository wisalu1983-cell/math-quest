import type { PracticeSession } from '@/types';
import type { RankMatchSession } from '@/types/gamification';

export function shouldAutoSuspendRankMatch(params: {
  session: PracticeSession | null;
  activeRankSession: RankMatchSession | null;
  sessionEnded: boolean;
}): boolean {
  const { session, activeRankSession, sessionEnded } = params;
  return !sessionEnded &&
    session?.sessionMode === 'rank-match' &&
    session.endedAt == null &&
    activeRankSession?.status === 'active' &&
    !activeRankSession.outcome;
}
