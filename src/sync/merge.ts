import type { HistoryRecord, TopicId, WrongQuestion } from '@/types';
import type {
  AdvanceProgress,
  GameProgress,
  LevelCompletion,
  RankMatchSession,
  RankMatchSessionStatus,
  RankProgress,
  TopicAdvanceProgress,
  TopicCampaignProgress,
} from '@/types/gamification';

const TIER_ORDER = ['apprentice', 'rookie', 'pro', 'expert', 'master'] as const;

const STATUS_PRIORITY: Record<RankMatchSessionStatus, number> = {
  active: 0,
  suspended: 1,
  cancelled: 2,
  completed: 3,
};

function getTierScore(tier: RankProgress['currentTier']): number {
  return TIER_ORDER.indexOf(tier);
}

function pickDefined<T>(primary: T | undefined | null, fallback: T | undefined | null): T | undefined {
  if (primary !== undefined && primary !== null) {
    return primary;
  }
  if (fallback !== undefined && fallback !== null) {
    return fallback;
  }
  return undefined;
}

export function mergeCompletedLevels(
  local: LevelCompletion[],
  remote: LevelCompletion[],
): LevelCompletion[] {
  const merged = new Map<string, LevelCompletion>();

  for (const level of local) {
    merged.set(level.levelId, level);
  }

  for (const level of remote) {
    const existing = merged.get(level.levelId);
    if (!existing) {
      merged.set(level.levelId, level);
      continue;
    }

    if (level.bestHearts > existing.bestHearts) {
      merged.set(level.levelId, level);
      continue;
    }

    if (level.bestHearts === existing.bestHearts && level.completedAt < existing.completedAt) {
      merged.set(level.levelId, level);
    }
  }

  return Array.from(merged.values());
}

export function mergeCampaignProgress(
  local: TopicCampaignProgress,
  remote: TopicCampaignProgress,
): TopicCampaignProgress {
  return {
    topicId: local.topicId,
    completedLevels: mergeCompletedLevels(local.completedLevels, remote.completedLevels),
    campaignCompleted: local.campaignCompleted || remote.campaignCompleted,
  };
}

export function mergeAdvanceProgress(
  local: TopicAdvanceProgress,
  remote: TopicAdvanceProgress,
): TopicAdvanceProgress {
  return {
    topicId: local.topicId,
    heartsAccumulated: Math.max(local.heartsAccumulated, remote.heartsAccumulated),
    sessionsPlayed: Math.max(local.sessionsPlayed, remote.sessionsPlayed),
    sessionsWhite: Math.max(local.sessionsWhite, remote.sessionsWhite),
    unlockedAt: Math.min(local.unlockedAt, remote.unlockedAt),
  };
}

export function mergeRankProgress(
  local: RankProgress,
  remote: RankProgress,
): RankProgress {
  const mergedHistory = new Map<number, RankProgress['history'][number]>();

  for (const item of local.history) {
    mergedHistory.set(item.startedAt, item);
  }

  for (const item of remote.history) {
    mergedHistory.set(item.startedAt, item);
  }

  return {
    currentTier: getTierScore(local.currentTier) >= getTierScore(remote.currentTier)
      ? local.currentTier
      : remote.currentTier,
    history: Array.from(mergedHistory.values()).sort((a, b) => a.startedAt - b.startedAt),
    activeSessionId: local.activeSessionId && remote.activeSessionId
      ? remote.activeSessionId
      : (remote.activeSessionId ?? local.activeSessionId),
  };
}

export function mergeWrongQuestions(
  local: WrongQuestion[],
  remote: WrongQuestion[],
): WrongQuestion[] {
  const merged = new Map<string, WrongQuestion>();

  const getKey = (question: WrongQuestion) => `${question.question.id}:${question.wrongAt}`;

  for (const question of local) {
    merged.set(getKey(question), question);
  }

  for (const question of remote) {
    merged.set(getKey(question), question);
  }

  return Array.from(merged.values())
    .sort((a, b) => b.wrongAt - a.wrongAt)
    .slice(0, 100);
}

function mergeCampaignProgressMap(
  local: GameProgress['campaignProgress'],
  remote: GameProgress['campaignProgress'],
): GameProgress['campaignProgress'] {
  const merged: GameProgress['campaignProgress'] = {};
  const topicIds = new Set<TopicId>([
    ...Object.keys(local) as TopicId[],
    ...Object.keys(remote) as TopicId[],
  ]);

  for (const topicId of topicIds) {
    const localTopic = local[topicId];
    const remoteTopic = remote[topicId];
    merged[topicId] = localTopic && remoteTopic
      ? mergeCampaignProgress(localTopic, remoteTopic)
      : (localTopic ?? remoteTopic);
  }

  return merged;
}

function mergeAdvanceProgressMap(
  local: AdvanceProgress,
  remote: AdvanceProgress,
): AdvanceProgress {
  const merged: AdvanceProgress = {};
  const topicIds = new Set<TopicId>([
    ...Object.keys(local) as TopicId[],
    ...Object.keys(remote) as TopicId[],
  ]);

  for (const topicId of topicIds) {
    const localTopic = local[topicId];
    const remoteTopic = remote[topicId];
    merged[topicId] = localTopic && remoteTopic
      ? mergeAdvanceProgress(localTopic, remoteTopic)
      : (localTopic ?? remoteTopic);
  }

  return merged;
}

export function mergeGameProgress(
  local: GameProgress,
  remote: GameProgress,
): GameProgress {
  return {
    userId: local.userId,
    campaignProgress: mergeCampaignProgressMap(local.campaignProgress, remote.campaignProgress),
    advanceProgress: mergeAdvanceProgressMap(local.advanceProgress, remote.advanceProgress),
    rankProgress: local.rankProgress && remote.rankProgress
      ? mergeRankProgress(local.rankProgress, remote.rankProgress)
      : (local.rankProgress ?? remote.rankProgress),
    wrongQuestions: mergeWrongQuestions(local.wrongQuestions, remote.wrongQuestions),
    totalQuestionsAttempted: Math.max(local.totalQuestionsAttempted, remote.totalQuestionsAttempted),
    totalQuestionsCorrect: Math.max(local.totalQuestionsCorrect, remote.totalQuestionsCorrect),
  };
}

export function mergeHistoryRecords(
  local: HistoryRecord[],
  remote: HistoryRecord[],
): HistoryRecord[] {
  const merged = new Map<string, HistoryRecord>();

  for (const record of local) {
    merged.set(record.id, record);
  }

  for (const record of remote) {
    if (!merged.has(record.id)) {
      merged.set(record.id, record);
    }
  }

  return Array.from(merged.values()).sort((a, b) => b.startedAt - a.startedAt);
}

function mergeSingleRankMatchSession(
  local: RankMatchSession,
  remote: RankMatchSession,
): RankMatchSession {
  const localPriority = STATUS_PRIORITY[local.status];
  const remotePriority = STATUS_PRIORITY[remote.status];
  const preferred = remotePriority > localPriority ? remote : local;
  const games = remote.games.length > local.games.length ? remote.games : local.games;

  return {
    id: preferred.id,
    userId: preferred.userId,
    targetTier: preferred.targetTier,
    bestOf: preferred.bestOf,
    winsToAdvance: preferred.winsToAdvance,
    games,
    status: preferred.status,
    outcome: pickDefined(remote.outcome, local.outcome),
    startedAt: Math.min(local.startedAt, remote.startedAt),
    suspendedAt: pickDefined(remote.suspendedAt, local.suspendedAt),
    cancelledAt: pickDefined(remote.cancelledAt, local.cancelledAt),
    endedAt: pickDefined(remote.endedAt, local.endedAt),
  };
}

export function mergeRankMatchSessions(
  local: Record<string, RankMatchSession>,
  remote: Record<string, RankMatchSession>,
): Record<string, RankMatchSession> {
  const merged: Record<string, RankMatchSession> = { ...local };

  for (const [id, remoteSession] of Object.entries(remote)) {
    const localSession = merged[id];

    if (!localSession) {
      merged[id] = remoteSession;
      continue;
    }

    merged[id] = mergeSingleRankMatchSession(localSession, remoteSession);
  }

  return merged;
}
