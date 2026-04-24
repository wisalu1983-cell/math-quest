import type {
  HistoryQuestionRecord,
  HistoryRecord,
  TopicId,
  UserSettings,
} from '@/types';
import type {
  GameProgress,
  RankMatchBestOf,
  RankMatchGame,
  RankMatchSessionStatus,
  RankProgress,
  RankTier,
} from '@/types/gamification';

export type SyncStatus = 'idle' | 'armed' | 'syncing' | 'synced' | 'offline' | 'error';

export type DirtyKey =
  | 'profiles'
  | 'game_progress'
  | 'history_records'
  | 'rank_match_sessions';

export interface SyncState {
  lastSyncedAt: string | null;
  dirtyKeys: DirtyKey[];
  deviceId: string;
}

export interface RemoteProfile {
  id: string;
  nickname: string;
  avatar_seed: string;
  settings: UserSettings;
  updated_at: string;
}

export interface RemoteGameProgress {
  user_id: string;
  campaign_progress: GameProgress['campaignProgress'];
  advance_progress: GameProgress['advanceProgress'];
  rank_progress: RankProgress;
  wrong_questions: GameProgress['wrongQuestions'];
  total_questions_attempted: number;
  total_questions_correct: number;
  updated_at: string;
}

export interface RemoteHistoryRecord {
  id: string;
  user_id: string;
  session_mode: HistoryRecord['sessionMode'];
  started_at: number;
  ended_at: number | null;
  completed: boolean;
  result: HistoryRecord['result'];
  topic_id: TopicId;
  rank_match_meta: HistoryRecord['rankMatchMeta'] | null;
  questions: HistoryQuestionRecord[];
  synced_at: string;
}

export interface RemoteRankMatchSession {
  id: string;
  user_id: string;
  target_tier: Exclude<RankTier, 'apprentice'>;
  best_of: RankMatchBestOf;
  wins_to_advance: number;
  games: RankMatchGame[];
  status: RankMatchSessionStatus;
  outcome: 'promoted' | 'eliminated' | null;
  started_at: number;
  suspended_at: number | null;
  cancelled_at: number | null;
  ended_at: number | null;
  updated_at: string;
}
