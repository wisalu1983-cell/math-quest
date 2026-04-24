import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HistoryRecord, User } from '@/types';
import type { GameProgress, RankMatchSession } from '@/types/gamification';

type TableName = 'profiles' | 'game_progress' | 'history_records' | 'rank_match_sessions';

interface QueryResponse<T> {
  data: T;
  error: Error | null;
}

const mockState = {
  clientEnabled: true,
  filters: [] as Array<{ table: TableName; op: 'eq' | 'gt'; column: string; value: unknown }>,
  upserts: [] as Array<{ table: TableName; payload: unknown }>,
  singleResponses: {
    profiles: { data: null, error: null },
    game_progress: { data: null, error: null },
    history_records: { data: null, error: null },
    rank_match_sessions: { data: null, error: null },
  } as Record<TableName, QueryResponse<unknown>>,
  listResponses: {
    profiles: { data: null, error: null },
    game_progress: { data: null, error: null },
    history_records: { data: [], error: null },
    rank_match_sessions: { data: [], error: null },
  } as Record<TableName, QueryResponse<unknown>>,
  upsertResponses: {
    profiles: { data: null, error: null },
    game_progress: { data: null, error: null },
    history_records: { data: null, error: null },
    rank_match_sessions: { data: null, error: null },
  } as Record<TableName, QueryResponse<unknown>>,
};

function makeBuilder(table: TableName) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn((column: string, value: unknown) => {
      mockState.filters.push({ table, op: 'eq', column, value });
      return builder;
    }),
    gt: vi.fn((column: string, value: unknown) => {
      mockState.filters.push({ table, op: 'gt', column, value });
      return builder;
    }),
    single: vi.fn(async () => mockState.singleResponses[table]),
    upsert: vi.fn(async (payload: unknown) => {
      mockState.upserts.push({ table, payload });
      return mockState.upsertResponses[table];
    }),
    then: (
      onFulfilled?: (value: QueryResponse<unknown>) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(mockState.listResponses[table]).then(onFulfilled, onRejected),
  };

  return builder;
}

const mockClient = {
  from: vi.fn((table: TableName) => makeBuilder(table)),
};

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => (mockState.clientEnabled ? mockClient : null),
}));

import {
  fetchRemoteGameProgress,
  fetchRemoteHistory,
  fetchRemoteProfile,
  fetchRemoteRankMatchSessions,
  upsertRemoteGameProgress,
  upsertRemoteHistoryRecords,
  upsertRemoteProfile,
  upsertRemoteRankMatchSessions,
} from './remote';

function makeGameProgress(): GameProgress {
  return {
    userId: 'u1',
    campaignProgress: {},
    advanceProgress: {},
    rankProgress: { currentTier: 'apprentice', history: [] },
    wrongQuestions: [],
    totalQuestionsAttempted: 12,
    totalQuestionsCorrect: 9,
  };
}

function makeHistoryRecord(id: string): HistoryRecord {
  return {
    id,
    userId: 'u1',
    sessionMode: 'campaign',
    startedAt: 100,
    endedAt: 200,
    completed: true,
    result: 'win',
    topicId: 'number-sense',
    questions: [],
  };
}

function makeRankMatchSession(id: string): RankMatchSession {
  return {
    id,
    userId: 'u1',
    targetTier: 'rookie',
    bestOf: 3,
    winsToAdvance: 2,
    games: [{ gameIndex: 1, finished: false, practiceSessionId: `${id}-g1`, startedAt: 100 }],
    status: 'active',
    startedAt: 100,
    updatedAt: '2026-04-23T00:00:00.000Z',
  };
}

beforeEach(() => {
  mockState.clientEnabled = true;
  mockState.filters = [];
  mockState.upserts = [];
  mockState.singleResponses = {
    profiles: { data: null, error: null },
    game_progress: { data: null, error: null },
    history_records: { data: null, error: null },
    rank_match_sessions: { data: null, error: null },
  };
  mockState.listResponses = {
    profiles: { data: null, error: null },
    game_progress: { data: null, error: null },
    history_records: { data: [], error: null },
    rank_match_sessions: { data: [], error: null },
  };
  mockState.upsertResponses = {
    profiles: { data: null, error: null },
    game_progress: { data: null, error: null },
    history_records: { data: null, error: null },
    rank_match_sessions: { data: null, error: null },
  };
  mockClient.from.mockClear();
});

describe('remote sync access', () => {
  it('未配置 Supabase 时 fetchRemoteProfile 返回 null', async () => {
    mockState.clientEnabled = false;

    await expect(fetchRemoteProfile('u1')).resolves.toBeNull();
  });

  it('fetchRemoteProfile 会读取 profiles 表并按 id 过滤', async () => {
    mockState.singleResponses.profiles = {
      data: {
        id: 'u1',
        nickname: 'Kid',
        avatar_seed: 'seed',
        settings: { soundEnabled: true, hapticsEnabled: true },
        updated_at: '2026-04-23T00:00:00.000Z',
      },
      error: null,
    };

    const profile = await fetchRemoteProfile('u1');

    expect(profile).toMatchObject({ id: 'u1', nickname: 'Kid' });
    expect(mockState.filters).toContainEqual({
      table: 'profiles',
      op: 'eq',
      column: 'id',
      value: 'u1',
    });
  });

  it('upsertRemoteProfile 会把 avatarSeed 映射到 avatar_seed', async () => {
    const profile: Pick<User, 'nickname' | 'avatarSeed' | 'settings'> = {
      nickname: 'Kid',
      avatarSeed: 'seed-1',
      settings: { soundEnabled: true, hapticsEnabled: false },
    };

    await expect(upsertRemoteProfile('u1', profile)).resolves.toBe(true);
    expect(mockState.upserts).toContainEqual({
      table: 'profiles',
      payload: {
        id: 'u1',
        nickname: 'Kid',
        avatar_seed: 'seed-1',
        settings: { soundEnabled: true, hapticsEnabled: false },
      },
    });
  });

  it('fetchRemoteGameProgress 直接返回远端行结构', async () => {
    mockState.singleResponses.game_progress = {
      data: {
        user_id: 'u1',
        campaign_progress: { 'number-sense': { topicId: 'number-sense' } },
        advance_progress: {},
        rank_progress: { currentTier: 'rookie', history: [] },
        wrong_questions: [],
        total_questions_attempted: 12,
        total_questions_correct: 9,
        updated_at: '2026-04-23T00:00:00.000Z',
      },
      error: null,
    };

    const progress = await fetchRemoteGameProgress('u1');

    expect(progress?.user_id).toBe('u1');
    expect(mockState.filters).toContainEqual({
      table: 'game_progress',
      op: 'eq',
      column: 'user_id',
      value: 'u1',
    });
  });

  it('upsertRemoteGameProgress 会把 GameProgress 映射到 snake_case 字段', async () => {
    const gp = makeGameProgress();

    await expect(upsertRemoteGameProgress('u1', gp)).resolves.toBe(true);
    expect(mockState.upserts).toContainEqual({
      table: 'game_progress',
      payload: {
        user_id: 'u1',
        campaign_progress: {},
        advance_progress: {},
        rank_progress: { currentTier: 'apprentice', history: [] },
        wrong_questions: [],
        total_questions_attempted: 12,
        total_questions_correct: 9,
      },
    });
  });

  it('fetchRemoteHistory 会映射 snake_case，并在传入 since 时加 gt 过滤', async () => {
    mockState.listResponses.history_records = {
      data: [{
        id: 'h1',
        user_id: 'u1',
        session_mode: 'campaign',
        started_at: 100,
        ended_at: 200,
        completed: true,
        result: 'win',
        topic_id: 'number-sense',
        rank_match_meta: null,
        questions: [],
        synced_at: '2026-04-23T00:00:00.000Z',
      }],
      error: null,
    };

    const result = await fetchRemoteHistory('u1', '2026-04-23T00:00:00.000Z');

    expect(result).toEqual([makeHistoryRecord('h1')]);
    expect(mockState.filters).toContainEqual({
      table: 'history_records',
      op: 'gt',
      column: 'synced_at',
      value: '2026-04-23T00:00:00.000Z',
    });
  });

  it('upsertRemoteHistoryRecords 会映射批量历史记录，空数组时直接成功', async () => {
    await expect(upsertRemoteHistoryRecords('u1', [])).resolves.toBe(true);
    expect(mockState.upserts).toHaveLength(0);

    await expect(upsertRemoteHistoryRecords('u1', [makeHistoryRecord('h1')])).resolves.toBe(true);
    expect(mockState.upserts).toContainEqual({
      table: 'history_records',
      payload: [{
        id: 'h1',
        user_id: 'u1',
        session_mode: 'campaign',
        started_at: 100,
        ended_at: 200,
        completed: true,
        result: 'win',
        topic_id: 'number-sense',
        rank_match_meta: null,
        questions: [],
      }],
    });
  });

  it('fetchRemoteRankMatchSessions 会把数组映射成按 id 索引的对象，并支持 since 过滤', async () => {
    mockState.listResponses.rank_match_sessions = {
      data: [{
        id: 'rm1',
        user_id: 'u1',
        target_tier: 'rookie',
        best_of: 3,
        wins_to_advance: 2,
        games: [{ gameIndex: 1, finished: false, practiceSessionId: 'rm1-g1', startedAt: 100 }],
        status: 'active',
        outcome: null,
        started_at: 100,
        suspended_at: null,
        cancelled_at: null,
        ended_at: null,
        updated_at: '2026-04-23T00:00:00.000Z',
      }],
      error: null,
    };

    const result = await fetchRemoteRankMatchSessions('u1', '2026-04-23T00:00:00.000Z');

    expect(result).toEqual({ rm1: makeRankMatchSession('rm1') });
    expect(mockState.filters).toContainEqual({
      table: 'rank_match_sessions',
      op: 'gt',
      column: 'updated_at',
      value: '2026-04-23T00:00:00.000Z',
    });
  });

  it('upsertRemoteRankMatchSessions 会映射批量会话，空对象时直接成功', async () => {
    await expect(upsertRemoteRankMatchSessions('u1', {})).resolves.toBe(true);
    expect(mockState.upserts).toHaveLength(0);

    await expect(upsertRemoteRankMatchSessions('u1', { rm1: makeRankMatchSession('rm1') })).resolves.toBe(true);
    expect(mockState.upserts).toContainEqual({
      table: 'rank_match_sessions',
      payload: [{
        id: 'rm1',
        user_id: 'u1',
        target_tier: 'rookie',
        best_of: 3,
        wins_to_advance: 2,
        games: [{ gameIndex: 1, finished: false, practiceSessionId: 'rm1-g1', startedAt: 100 }],
        status: 'active',
        outcome: null,
        started_at: 100,
        suspended_at: null,
        cancelled_at: null,
        ended_at: null,
      }],
    });
  });
});
