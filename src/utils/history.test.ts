import { describe, expect, it } from 'vitest';
import type { HistoryRecord } from '@/types';
import {
  filterAndSortHistory,
  getHistoryTimeFilterLabel,
  type HistoryDateRange,
} from './history';

function makeRecord(id: string, startedAt: number): HistoryRecord {
  return {
    id,
    userId: 'u1',
    sessionMode: 'campaign',
    startedAt,
    endedAt: startedAt + 60_000,
    completed: true,
    result: 'win',
    topicId: 'mental-arithmetic',
    questions: [
      {
        prompt: '1 + 1 = ?',
        userAnswer: '2',
        correctAnswer: '2',
        correct: true,
        timeMs: 1200,
      },
    ],
  };
}

describe('history utils', () => {
  const now = Date.parse('2026-04-23T12:00:00+08:00');

  it('支持自定义日期范围筛选', () => {
    const range: HistoryDateRange = {
      startDate: '2026-04-10',
      endDate: '2026-04-20',
    };

    const records = [
      makeRecord('early', Date.parse('2026-04-09T10:00:00+08:00')),
      makeRecord('inside', Date.parse('2026-04-15T10:00:00+08:00')),
      makeRecord('late', Date.parse('2026-04-22T10:00:00+08:00')),
    ];

    const result = filterAndSortHistory(records, {
      modeFilter: 'all',
      timeFilter: 'custom',
      dateRange: range,
      sortOrder: 'desc',
      now,
    });

    expect(result.map(record => record.id)).toEqual(['inside']);
  });

  it('支持用同一天开始和结束做单日筛选', () => {
    const range: HistoryDateRange = {
      startDate: '2026-04-18',
      endDate: '2026-04-18',
    };

    const records = [
      makeRecord('before', Date.parse('2026-04-17T23:59:59+08:00')),
      makeRecord('morning', Date.parse('2026-04-18T08:00:00+08:00')),
      makeRecord('night', Date.parse('2026-04-18T21:30:00+08:00')),
      makeRecord('after', Date.parse('2026-04-19T00:00:00+08:00')),
    ];

    const result = filterAndSortHistory(records, {
      modeFilter: 'all',
      timeFilter: 'custom',
      dateRange: range,
      sortOrder: 'asc',
      now,
    });

    expect(result.map(record => record.id)).toEqual(['morning', 'night']);
  });

  it('为自定义日期范围生成可读按钮文案', () => {
    const range: HistoryDateRange = {
      startDate: '2026-04-11',
      endDate: '2026-04-30',
    };

    expect(getHistoryTimeFilterLabel('custom', range)).toBe('时间筛选：4/11-4/30');
  });
});
