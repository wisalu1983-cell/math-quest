import { getSupabaseClient } from '@/lib/supabase';
import type { HistoryRecord, User } from '@/types';
import type { GameProgress, RankMatchSession } from '@/types/gamification';
import type {
  RemoteGameProgress,
  RemoteHistoryRecord,
  RemoteProfile,
  RemoteRankMatchSession,
} from './types';

type RemoteProfileInput = Pick<User, 'nickname' | 'avatarSeed' | 'settings'>;

function mapRemoteHistoryRecord(row: RemoteHistoryRecord): HistoryRecord {
  return {
    id: row.id,
    userId: row.user_id,
    sessionMode: row.session_mode,
    startedAt: row.started_at,
    ...(row.ended_at !== null ? { endedAt: row.ended_at } : {}),
    completed: row.completed,
    result: row.result,
    topicId: row.topic_id,
    ...(row.rank_match_meta ? { rankMatchMeta: row.rank_match_meta } : {}),
    questions: row.questions,
  };
}

function mapRemoteRankMatchSession(row: RemoteRankMatchSession): RankMatchSession {
  return {
    id: row.id,
    userId: row.user_id,
    targetTier: row.target_tier,
    bestOf: row.best_of,
    winsToAdvance: row.wins_to_advance,
    games: row.games,
    status: row.status,
    ...(row.outcome ? { outcome: row.outcome } : {}),
    startedAt: row.started_at,
    ...(row.suspended_at !== null ? { suspendedAt: row.suspended_at } : {}),
    ...(row.cancelled_at !== null ? { cancelledAt: row.cancelled_at } : {}),
    ...(row.ended_at !== null ? { endedAt: row.ended_at } : {}),
  };
}

export async function fetchRemoteProfile(userId: string): Promise<RemoteProfile | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as RemoteProfile;
}

export async function upsertRemoteProfile(
  userId: string,
  profile: RemoteProfileInput,
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    return false;
  }

  const { error } = await client.from('profiles').upsert({
    id: userId,
    nickname: profile.nickname,
    avatar_seed: profile.avatarSeed,
    settings: profile.settings,
  });

  return !error;
}

export async function fetchRemoteGameProgress(userId: string): Promise<RemoteGameProgress | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from('game_progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as RemoteGameProgress;
}

export async function upsertRemoteGameProgress(
  userId: string,
  progress: GameProgress,
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    return false;
  }

  const { error } = await client.from('game_progress').upsert({
    user_id: userId,
    campaign_progress: progress.campaignProgress,
    advance_progress: progress.advanceProgress,
    rank_progress: progress.rankProgress ?? { currentTier: 'apprentice', history: [] },
    wrong_questions: progress.wrongQuestions,
    total_questions_attempted: progress.totalQuestionsAttempted,
    total_questions_correct: progress.totalQuestionsCorrect,
  });

  return !error;
}

export async function fetchRemoteHistory(
  userId: string,
  since?: string,
): Promise<HistoryRecord[]> {
  const client = getSupabaseClient();
  if (!client) {
    return [];
  }

  const baseQuery = client.from('history_records').select('*').eq('user_id', userId);
  const { data, error } = since
    ? await baseQuery.gt('synced_at', since)
    : await baseQuery;

  if (error || !data) {
    return [];
  }

  return (data as RemoteHistoryRecord[]).map(mapRemoteHistoryRecord);
}

export async function upsertRemoteHistoryRecords(
  userId: string,
  records: HistoryRecord[],
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    return false;
  }

  if (records.length === 0) {
    return true;
  }

  const rows: Array<Omit<RemoteHistoryRecord, 'synced_at'>> = records.map(record => ({
    id: record.id,
    user_id: userId,
    session_mode: record.sessionMode,
    started_at: record.startedAt,
    ended_at: record.endedAt ?? null,
    completed: record.completed,
    result: record.result,
    topic_id: record.topicId,
    rank_match_meta: record.rankMatchMeta ?? null,
    questions: record.questions,
  }));

  const { error } = await client.from('history_records').upsert(rows);
  return !error;
}

export async function fetchRemoteRankMatchSessions(
  userId: string,
  since?: string,
): Promise<Record<string, RankMatchSession>> {
  const client = getSupabaseClient();
  if (!client) {
    return {};
  }

  const baseQuery = client.from('rank_match_sessions').select('*').eq('user_id', userId);
  const { data, error } = since
    ? await baseQuery.gt('updated_at', since)
    : await baseQuery;

  if (error || !data) {
    return {};
  }

  return (data as RemoteRankMatchSession[]).reduce<Record<string, RankMatchSession>>((sessions, row) => {
    sessions[row.id] = mapRemoteRankMatchSession(row);
    return sessions;
  }, {});
}

export async function upsertRemoteRankMatchSessions(
  userId: string,
  sessions: Record<string, RankMatchSession>,
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    return false;
  }

  const rows: Array<Omit<RemoteRankMatchSession, 'updated_at'>> = Object.values(sessions).map(session => ({
    id: session.id,
    user_id: userId,
    target_tier: session.targetTier,
    best_of: session.bestOf,
    wins_to_advance: session.winsToAdvance,
    games: session.games,
    status: session.status,
    outcome: session.outcome ?? null,
    started_at: session.startedAt,
    suspended_at: session.suspendedAt ?? null,
    cancelled_at: session.cancelledAt ?? null,
    ended_at: session.endedAt ?? null,
  }));

  if (rows.length === 0) {
    return true;
  }

  const { error } = await client.from('rank_match_sessions').upsert(rows);
  return !error;
}
