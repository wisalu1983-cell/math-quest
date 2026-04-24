import type { GameProgress } from '@/types/gamification';

export function hasMeaningfulLocalProgress(gp: GameProgress): boolean {
  if (gp.totalQuestionsAttempted > 0) return true;

  if (Object.values(gp.campaignProgress).some(progress =>
    Boolean(progress && (progress.completedLevels.length > 0 || progress.campaignCompleted)),
  )) {
    return true;
  }

  if (Object.values(gp.advanceProgress).some(progress =>
    Boolean(progress && (progress.heartsAccumulated > 0 || progress.sessionsPlayed > 0)),
  )) {
    return true;
  }

  const rankProgress = gp.rankProgress;
  if (rankProgress) {
    if (rankProgress.history.length > 0) return true;
    if (rankProgress.activeSessionId) return true;
    if (rankProgress.currentTier !== 'apprentice') return true;
  }

  return gp.wrongQuestions.length > 0;
}
