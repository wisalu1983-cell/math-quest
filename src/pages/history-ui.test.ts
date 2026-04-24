import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BottomNav from '@/components/BottomNav';
import { repository, setStorageNamespace } from '@/repository/local';
import { useGameProgressStore, useUIStore } from '@/store';
import type { GameProgress } from '@/types/gamification';
import History from './History';
import Progress from './Progress';
import SessionDetail from './SessionDetail';

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

function makeGameProgress(): GameProgress {
  return {
    userId: 'u1',
    campaignProgress: {
      'mental-arithmetic': {
        topicId: 'mental-arithmetic',
        completedLevels: [
          {
            levelId: 'mental-arithmetic-S1-LA-L1',
            bestHearts: 3,
            completedAt: 1700000000000,
          },
        ],
        campaignCompleted: false,
      },
    },
    advanceProgress: {},
    rankProgress: { currentTier: 'apprentice', history: [] },
    wrongQuestions: [],
    totalQuestionsAttempted: 12,
    totalQuestionsCorrect: 9,
  };
}

function seedHistory(): void {
  repository.saveHistoryRecord({
    id: 'history-1',
    userId: 'u1',
    sessionMode: 'campaign',
    startedAt: 1700000000000,
    endedAt: 1700000005000,
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
      {
        prompt: '2 + 3 = ?',
        userAnswer: '6',
        correctAnswer: '5',
        correct: false,
        timeMs: 1200,
      },
    ],
  });
}

describe('历史记录 UI（v0.2-5-1）', () => {
  beforeEach(() => {
    installLocalStorageMock();
    setStorageNamespace('main');
    useGameProgressStore.setState({ gameProgress: makeGameProgress() });
    useUIStore.setState({
      currentPage: 'history',
      viewingSessionId: 'history-1',
    });
  });

  afterEach(() => {
    setStorageNamespace('main');
  });

  it('History 页从 mq_history 渲染模式与结果，而不是读 mq_sessions', () => {
    seedHistory();

    const html = renderToStaticMarkup(createElement(History));

    expect(html).toContain('闯关');
    expect(html).toContain('胜利');
    expect(html).toContain('50%');
    expect(html).not.toContain('还没有练习记录');
  });

  it('SessionDetail 从 mq_history 渲染逐题答案对比', () => {
    seedHistory();

    const html = renderToStaticMarkup(createElement(SessionDetail, { recordId: 'history-1' }));

    expect(html).toContain('2 + 3 = ?');
    expect(html).toContain('你的答案');
    expect(html).toContain('正确答案');
    expect(html).not.toContain('找不到该练习记录');
  });

  it('Progress 页精简为记录总览，不再渲染题型进度卡片', () => {
    seedHistory();

    const html = renderToStaticMarkup(createElement(Progress));

    expect(html).toContain('概览信息');
    expect(html).toContain('累计答题');
    expect(html).toContain('总正确率');
    expect(html).toContain('练习记录');
    expect(html).toContain('时间筛选');
    expect(html).toContain('时间排序');
    expect(html).toContain('闯关');
    expect(html).not.toContain('总场次');
    expect(html).not.toContain('进入练习记录');
    expect(html).not.toContain('基础计算');
  });

  it('BottomNav 将 progress tab 文案改为“记录”', () => {
    const html = renderToStaticMarkup(createElement(BottomNav, { activeTab: 'progress' }));

    expect(html).toContain('记录');
    expect(html).not.toContain('进度');
  });
});
