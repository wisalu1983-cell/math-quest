import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { repository, setStorageNamespace } from '@/repository/local';
import { TOPICS } from '@/constants';
import { useGameProgressStore, useUserStore } from '@/store';
import { useRankMatchStore } from '@/store/rank-match';
import { allInjections } from './_registry';
import { historyRecordInjections } from './history-records';
import type { HistoryRecord, User } from '@/types';
import type { GameProgress } from '@/types/gamification';

function installLocalStorageMock(): void {
  const store = new Map<string, string>();
  const mock = {
    getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  };
  (globalThis as Record<string, unknown>).localStorage = mock;
}

function makeUser(): User {
  return {
    id: 'u-history-dev',
    nickname: 'History Dev',
    avatarSeed: 'history-seed',
    createdAt: 0,
    settings: {
      soundEnabled: true,
      hapticsEnabled: true,
    },
  };
}

function makeGameProgress(): GameProgress {
  return {
    userId: 'u-history-dev',
    campaignProgress: {},
    advanceProgress: {},
    rankProgress: { currentTier: 'apprentice', history: [] },
    wrongQuestions: [],
    totalQuestionsAttempted: 0,
    totalQuestionsCorrect: 0,
  };
}

function makeHistoryRecord(id: string): HistoryRecord {
  return {
    id,
    userId: 'u-history-dev',
    sessionMode: 'campaign',
    startedAt: 1700000000000,
    endedAt: 1700000003000,
    completed: true,
    result: 'win',
    topicId: 'mental-arithmetic',
    questions: [
      {
        prompt: '1 + 1 = ?',
        userAnswer: '2',
        correctAnswer: '2',
        correct: true,
        timeMs: 900,
      },
    ],
  };
}

describe('historyRecordInjections', () => {
  beforeEach(() => {
    installLocalStorageMock();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.clear();
    setStorageNamespace('main');
    repository.init();

    const user = makeUser();
    repository.saveUser(user);
    repository.saveGameProgress(makeGameProgress());
    useUserStore.setState({ user });
    useGameProgressStore.getState().loadGameProgress(user.id);
    useRankMatchStore.getState()._setActiveRankSession(null);
  });

  afterEach(() => {
    localStorage.clear();
    setStorageNamespace('main');
    repository.init();
    useUserStore.setState({ user: null });
    useGameProgressStore.setState({ gameProgress: null });
    useRankMatchStore.getState()._setActiveRankSession(null);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('已注册到 _registry，且暴露追加与清空两个 ext 注入项', () => {
    const ids = allInjections.map(injection => injection.id);

    expect(ids).toContain('history.records.append-random-covered');
    expect(ids).toContain('history.records.clear');
  });

  it('append-random-covered：保留旧历史并追加一批覆盖模式/结果/题型的随机记录', async () => {
    repository.saveHistoryRecord(makeHistoryRecord('existing-history'));

    const injection = historyRecordInjections.find(item => item.id === 'history.records.append-random-covered');
    expect(injection).toBeDefined();

    await injection!.run();

    const history = repository.getHistory();
    const appended = history.filter(record => record.id.startsWith('dev-history-'));

    expect(history).toHaveLength(10);
    expect(history.some(record => record.id === 'existing-history')).toBe(true);
    expect(appended).toHaveLength(9);
    expect(new Set(appended.map(record => record.sessionMode))).toEqual(new Set([
      'campaign',
      'advance',
      'rank-match',
    ]));
    expect(new Set(appended.map(record => record.result))).toEqual(new Set([
      'win',
      'lose',
      'incomplete',
    ]));
    expect(new Set(appended.map(record => record.topicId))).toEqual(new Set(TOPICS.map(topic => topic.id)));
    expect(appended.every(record => record.questions.length >= 3)).toBe(true);
    expect(appended.some(record => record.sessionMode === 'rank-match' && record.rankMatchMeta?.primaryTopics.length)).toBe(true);
  });

  it('clear：只清当前 namespace 的历史记录，不影响另一侧 namespace', async () => {
    repository.saveHistoryRecord(makeHistoryRecord('main-history'));

    setStorageNamespace('dev');
    repository.init();
    repository.saveHistoryRecord(makeHistoryRecord('dev-history-seed'));

    const injection = historyRecordInjections.find(item => item.id === 'history.records.clear');
    expect(injection).toBeDefined();

    vi.stubGlobal('confirm', vi.fn(() => true));
    await injection!.run();

    expect(repository.getHistory()).toEqual([]);

    setStorageNamespace('main');
    expect(repository.getHistory().map(record => record.id)).toEqual(['main-history']);
  });
});
