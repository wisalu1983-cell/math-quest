import { describe, expect, it } from 'vitest';
import type { HistoryRecord, WrongQuestion } from '@/types';
import type {
  GameProgress,
  LevelCompletion,
  RankMatchSession,
  RankProgress,
  TopicAdvanceProgress,
  TopicCampaignProgress,
} from '@/types/gamification';
import {
  mergeAdvanceProgress,
  mergeCampaignProgress,
  mergeCompletedLevels,
  mergeGameProgress,
  mergeHistoryRecords,
  mergeRankMatchSessions,
  mergeRankProgress,
  mergeWrongQuestions,
} from './merge';

function makeCompletion(
  levelId: string,
  bestHearts: number,
  completedAt: number,
): LevelCompletion {
  return { levelId, bestHearts, completedAt };
}

function makeCampaignProgress(overrides: Partial<TopicCampaignProgress> = {}): TopicCampaignProgress {
  return {
    topicId: 'number-sense',
    completedLevels: [],
    campaignCompleted: false,
    ...overrides,
  };
}

function makeAdvanceProgress(overrides: Partial<TopicAdvanceProgress> = {}): TopicAdvanceProgress {
  return {
    topicId: 'number-sense',
    heartsAccumulated: 0,
    sessionsPlayed: 0,
    sessionsWhite: 0,
    unlockedAt: 0,
    ...overrides,
  };
}

function makeRankProgress(overrides: Partial<RankProgress> = {}): RankProgress {
  return {
    currentTier: 'apprentice',
    history: [],
    ...overrides,
  };
}

function makeWrongQuestion(id: string, wrongAt: number): WrongQuestion {
  return {
    question: {
      id,
      topicId: 'number-sense',
      type: 'numeric-input',
      difficulty: 1,
      prompt: `Q-${id}`,
      data: {
        kind: 'number-sense',
        subtype: 'compare',
      },
      solution: {
        answer: '1',
        explanation: 'demo',
      },
      hints: [],
    },
    wrongAnswer: '0',
    wrongAt,
  };
}

function makeGameProgress(overrides: Partial<GameProgress> = {}): GameProgress {
  return {
    userId: 'u1',
    campaignProgress: {},
    advanceProgress: {},
    rankProgress: { currentTier: 'apprentice', history: [] },
    wrongQuestions: [],
    totalQuestionsAttempted: 0,
    totalQuestionsCorrect: 0,
    ...overrides,
  };
}

function makeHistoryRecord(id: string, startedAt: number): HistoryRecord {
  return {
    id,
    userId: 'u1',
    sessionMode: 'campaign',
    startedAt,
    endedAt: startedAt + 100,
    completed: true,
    result: 'win',
    topicId: 'number-sense',
    questions: [],
  };
}

function makeRankMatchSession(
  id: string,
  overrides: Partial<RankMatchSession> = {},
): RankMatchSession {
  return {
    id,
    userId: 'u1',
    targetTier: 'rookie',
    bestOf: 3,
    winsToAdvance: 2,
    games: [
      {
        gameIndex: 1,
        finished: false,
        practiceSessionId: `${id}-g1`,
        startedAt: 100,
      },
    ],
    status: 'active',
    startedAt: 100,
    ...overrides,
  };
}

function makeRankMatchGames(length: number): RankMatchSession['games'] {
  return Array.from({ length }, (_, index) => ({
    gameIndex: index + 1,
    finished: index < length - 1,
    won: index < length - 1 ? true : undefined,
    practiceSessionId: `p-${index + 1}`,
    startedAt: 100 + index * 100,
    ...(index < length - 1 ? { endedAt: 150 + index * 100 } : {}),
  }));
}

describe('mergeCompletedLevels', () => {
  it('本地空 + 远端有数据时取远端', () => {
    const remote = [makeCompletion('L1', 2, 100)];
    expect(mergeCompletedLevels([], remote)).toEqual(remote);
  });

  it('本地有 + 远端空时取本地', () => {
    const local = [makeCompletion('L1', 3, 100)];
    expect(mergeCompletedLevels(local, [])).toEqual(local);
  });

  it('同 levelId 时 bestHearts 取更高值', () => {
    const result = mergeCompletedLevels(
      [makeCompletion('L1', 2, 100)],
      [makeCompletion('L1', 3, 200)],
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ levelId: 'L1', bestHearts: 3 });
  });

  it('不同 levelId 时返回并集', () => {
    const result = mergeCompletedLevels(
      [makeCompletion('L1', 2, 100)],
      [makeCompletion('L2', 1, 200)],
    );

    expect(result).toHaveLength(2);
  });
});

describe('mergeCampaignProgress', () => {
  it('campaignCompleted 取 OR，completedLevels 按规则合并', () => {
    const result = mergeCampaignProgress(
      makeCampaignProgress({
        completedLevels: [makeCompletion('L1', 2, 100)],
        campaignCompleted: true,
      }),
      makeCampaignProgress({
        completedLevels: [makeCompletion('L1', 3, 200), makeCompletion('L2', 1, 300)],
        campaignCompleted: false,
      }),
    );

    expect(result.campaignCompleted).toBe(true);
    expect(result.completedLevels).toHaveLength(2);
    expect(result.completedLevels.find(level => level.levelId === 'L1')?.bestHearts).toBe(3);
  });
});

describe('mergeAdvanceProgress', () => {
  it('计数器取 max，unlockedAt 取更早时间', () => {
    const result = mergeAdvanceProgress(
      makeAdvanceProgress({
        heartsAccumulated: 10,
        sessionsPlayed: 5,
        sessionsWhite: 1,
        unlockedAt: 100,
      }),
      makeAdvanceProgress({
        heartsAccumulated: 8,
        sessionsPlayed: 7,
        sessionsWhite: 2,
        unlockedAt: 50,
      }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        heartsAccumulated: 10,
        sessionsPlayed: 7,
        sessionsWhite: 2,
        unlockedAt: 50,
      }),
    );
  });
});

describe('mergeRankProgress', () => {
  it('currentTier 取最高段位', () => {
    const result = mergeRankProgress(
      makeRankProgress({ currentTier: 'pro' }),
      makeRankProgress({ currentTier: 'rookie' }),
    );

    expect(result.currentTier).toBe('pro');
  });

  it('history 按 startedAt 去重合并', () => {
    const result = mergeRankProgress(
      makeRankProgress({
        currentTier: 'rookie',
        history: [
          { targetTier: 'rookie', outcome: 'promoted', startedAt: 100, endedAt: 200 },
        ],
      }),
      makeRankProgress({
        currentTier: 'rookie',
        history: [
          { targetTier: 'rookie', outcome: 'promoted', startedAt: 100, endedAt: 200 },
          { targetTier: 'pro', outcome: 'eliminated', startedAt: 300, endedAt: 400 },
        ],
      }),
    );

    expect(result.history).toHaveLength(2);
    expect(result.history.map(item => item.startedAt)).toEqual([100, 300]);
  });

  it('activeSessionId 双方均非空时取远端，否则取非空值', () => {
    expect(
      mergeRankProgress(
        makeRankProgress({ currentTier: 'rookie', activeSessionId: 'local-id' }),
        makeRankProgress({ currentTier: 'rookie' }),
      ).activeSessionId,
    ).toBe('local-id');

    expect(
      mergeRankProgress(
        makeRankProgress({ currentTier: 'rookie', activeSessionId: 'local-id' }),
        makeRankProgress({ currentTier: 'rookie', activeSessionId: 'remote-id' }),
      ).activeSessionId,
    ).toBe('remote-id');
  });
});

describe('mergeWrongQuestions', () => {
  it('保留结构化 failureDetail 字段', () => {
    const local = makeWrongQuestion('q-local', 100);
    const remote: WrongQuestion = {
      ...makeWrongQuestion('q-remote', 200),
      failureReason: 'vertical-training-field',
      failureDetail: {
        reason: 'vertical-training-field',
        source: 'vertical-multiplication',
        message: '本题未通过：小数训练格有误。',
        trainingFieldMistakes: [
          {
            code: 'decimal-move',
            label: '小数点移动位数错误',
            userValue: '',
            expectedValue: '2',
          },
        ],
      },
    };

    const result = mergeWrongQuestions([local], [remote]);

    expect(result[0]).toMatchObject({
      failureReason: 'vertical-training-field',
      failureDetail: remote.failureDetail,
    });
  });

  it('按 question.id + wrongAt 去重', () => {
    const wrong = makeWrongQuestion('q1', 100);
    const result = mergeWrongQuestions([wrong], [{ ...wrong }]);
    expect(result).toHaveLength(1);
  });

  it('合并后按 wrongAt 倒序并截取前 100 条', () => {
    const local = Array.from({ length: 60 }, (_, index) => makeWrongQuestion(`l-${index}`, index));
    const remote = Array.from({ length: 60 }, (_, index) => makeWrongQuestion(`r-${index}`, index + 100));
    const result = mergeWrongQuestions(local, remote);

    expect(result).toHaveLength(100);
    expect(result[0].wrongAt).toBe(159);
    expect(result.at(-1)?.wrongAt).toBe(20);
  });

  it('保留低档竖式过程格失败原因', () => {
    const wrong = {
      ...makeWrongQuestion('vertical-process', 100),
      failureReason: 'vertical-process' as const,
    };

    expect(mergeWrongQuestions([wrong], [])).toEqual([wrong]);
  });
});

describe('mergeGameProgress', () => {
  it('逐字段合并 campaign / advance / rank / wrongQuestions / 计数器', () => {
    const result = mergeGameProgress(
      makeGameProgress({
        campaignProgress: {
          'number-sense': makeCampaignProgress({
            completedLevels: [makeCompletion('L1', 2, 100)],
          }),
        },
        advanceProgress: {
          'number-sense': makeAdvanceProgress({ heartsAccumulated: 10, sessionsPlayed: 2 }),
        },
        rankProgress: makeRankProgress({ currentTier: 'rookie' }),
        wrongQuestions: [makeWrongQuestion('local', 10)],
        totalQuestionsAttempted: 100,
        totalQuestionsCorrect: 80,
      }),
      makeGameProgress({
        campaignProgress: {
          'number-sense': makeCampaignProgress({
            completedLevels: [makeCompletion('L1', 3, 200), makeCompletion('L2', 1, 300)],
            campaignCompleted: true,
          }),
        },
        advanceProgress: {
          'number-sense': makeAdvanceProgress({ heartsAccumulated: 8, sessionsPlayed: 4, sessionsWhite: 1 }),
        },
        rankProgress: makeRankProgress({ currentTier: 'pro' }),
        wrongQuestions: [makeWrongQuestion('remote', 20)],
        totalQuestionsAttempted: 90,
        totalQuestionsCorrect: 85,
      }),
    );

    expect(result.campaignProgress['number-sense']?.campaignCompleted).toBe(true);
    expect(result.campaignProgress['number-sense']?.completedLevels).toHaveLength(2);
    expect(result.advanceProgress['number-sense']).toEqual(
      expect.objectContaining({
        heartsAccumulated: 10,
        sessionsPlayed: 4,
        sessionsWhite: 1,
      }),
    );
    expect(result.rankProgress?.currentTier).toBe('pro');
    expect(result.wrongQuestions).toHaveLength(2);
    expect(result.totalQuestionsAttempted).toBe(100);
    expect(result.totalQuestionsCorrect).toBe(85);
  });
});

describe('mergeHistoryRecords', () => {
  it('按 id 去重合并并按 startedAt 倒序', () => {
    const result = mergeHistoryRecords(
      [makeHistoryRecord('h1', 100), makeHistoryRecord('h2', 200)],
      [makeHistoryRecord('h2', 200), makeHistoryRecord('h3', 300)],
    );

    expect(result).toHaveLength(3);
    expect(result.map(record => record.id)).toEqual(['h3', 'h2', 'h1']);
  });
});

describe('mergeRankMatchSessions', () => {
  it('状态优先级 completed > active，且 games 取更长版本', () => {
    const result = mergeRankMatchSessions(
      {
        s1: makeRankMatchSession('s1', {
          status: 'active',
          games: [{ gameIndex: 1, finished: false, practiceSessionId: 'p1', startedAt: 100 }],
        }),
      },
      {
        s1: makeRankMatchSession('s1', {
          status: 'completed',
          outcome: 'promoted',
          games: [
            { gameIndex: 1, finished: true, won: true, practiceSessionId: 'p1', startedAt: 100, endedAt: 200 },
            { gameIndex: 2, finished: true, won: true, practiceSessionId: 'p2', startedAt: 210, endedAt: 300 },
          ],
          endedAt: 300,
        }),
      },
    );

    expect(result.s1.status).toBe('completed');
    expect(result.s1.games).toHaveLength(2);
    expect(result.s1.outcome).toBe('promoted');
  });

  it('同优先级时保留 games 更长的版本，并合并缺失会话', () => {
    const result = mergeRankMatchSessions(
      {
        local: makeRankMatchSession('local', {
          status: 'suspended',
          games: [{ gameIndex: 1, finished: true, won: false, practiceSessionId: 'p1', startedAt: 100, endedAt: 200 }],
        }),
      },
      {
        local: makeRankMatchSession('local', {
          status: 'suspended',
          games: [
            { gameIndex: 1, finished: true, won: false, practiceSessionId: 'p1', startedAt: 100, endedAt: 200 },
            { gameIndex: 2, finished: false, practiceSessionId: 'p2', startedAt: 210 },
          ],
        }),
        remoteOnly: makeRankMatchSession('remoteOnly'),
      },
    );

    expect(result.local.games).toHaveLength(2);
    expect(result.remoteOnly).toBeDefined();
  });

  it('RISK-4：同为 active，本地 games 更长时取本地 games', () => {
    const result = mergeRankMatchSessions(
      { s1: makeRankMatchSession('s1', { status: 'active', games: makeRankMatchGames(3) }) },
      { s1: makeRankMatchSession('s1', { status: 'active', games: makeRankMatchGames(2) }) },
    );

    expect(result.s1.games).toHaveLength(3);
  });

  it('RISK-4：同为 active，远端 games 更长时取远端 games', () => {
    const result = mergeRankMatchSessions(
      { s1: makeRankMatchSession('s1', { status: 'active', games: makeRankMatchGames(2) }) },
      { s1: makeRankMatchSession('s1', { status: 'active', games: makeRankMatchGames(3) }) },
    );

    expect(result.s1.games).toHaveLength(3);
  });

  it('远端段位赛 updatedAt 会保留，用于跨设备接管判定', () => {
    const result = mergeRankMatchSessions(
      { s1: makeRankMatchSession('s1', { status: 'active', games: makeRankMatchGames(2) }) },
      {
        s1: makeRankMatchSession('s1', {
          status: 'active',
          games: makeRankMatchGames(2),
          updatedAt: '2026-04-24T10:00:00.000Z',
        }),
      },
    );

    expect(result.s1.updatedAt).toBe('2026-04-24T10:00:00.000Z');
  });

  it('RISK-4：同为 suspended，本地 games 更长时取本地 games', () => {
    const result = mergeRankMatchSessions(
      { s1: makeRankMatchSession('s1', { status: 'suspended', games: makeRankMatchGames(3) }) },
      { s1: makeRankMatchSession('s1', { status: 'suspended', games: makeRankMatchGames(2) }) },
    );

    expect(result.s1.games).toHaveLength(3);
  });

  it('RISK-4：交换 local/remote 位置后，同优先级 games 更长者结果等价', () => {
    const longer = makeRankMatchSession('s1', {
      status: 'active',
      games: makeRankMatchGames(3),
      updatedAt: '2026-04-24T10:00:00.000Z',
    });
    const shorter = makeRankMatchSession('s1', {
      status: 'active',
      games: makeRankMatchGames(2),
      updatedAt: '2026-04-24T09:00:00.000Z',
    });

    const left = mergeRankMatchSessions({ s1: longer }, { s1: shorter });
    const right = mergeRankMatchSessions({ s1: shorter }, { s1: longer });

    expect(left.s1.games).toEqual(right.s1.games);
    expect(left.s1.updatedAt).toEqual(right.s1.updatedAt);
  });
});
