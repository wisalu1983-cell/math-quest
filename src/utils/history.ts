import type { GameSessionMode, HistoryRecord, HistoryResult } from '@/types';

export type HistoryModeFilter = 'all' | Extract<GameSessionMode, 'campaign' | 'advance' | 'rank-match'>;
export type HistoryTimeFilter = 'all' | 'today' | '7d' | '30d' | '90d' | 'this-month' | 'custom';
export type HistorySortOrder = 'desc' | 'asc';

export interface HistoryDateRange {
  startDate: string | null;
  endDate: string | null;
}

export interface ResolvedHistoryDateRange extends HistoryDateRange {
  startAt: number | null;
  endAt: number | null;
}

export const HISTORY_MODE_OPTIONS: Array<{ value: HistoryModeFilter; label: string }> = [
  { value: 'all', label: '全部模式' },
  { value: 'campaign', label: '闯关' },
  { value: 'advance', label: '进阶' },
  { value: 'rank-match', label: '段位赛' },
];

export const HISTORY_TIME_OPTIONS: Array<{ value: HistoryTimeFilter; label: string }> = [
  { value: 'all', label: '全部时间' },
  { value: 'today', label: '今天' },
  { value: '7d', label: '近7天' },
  { value: '30d', label: '近30天' },
  { value: '90d', label: '近90天' },
  { value: 'this-month', label: '本月' },
  { value: 'custom', label: '自定义' },
];

const HISTORY_TIME_LABELS: Record<HistoryTimeFilter, string> = {
  all: '全部时间',
  today: '今天',
  '7d': '近7天',
  '30d': '近30天',
  '90d': '近90天',
  'this-month': '本月',
  custom: '自定义',
};

export function getHistoryModeLabel(mode: GameSessionMode): string {
  switch (mode) {
    case 'campaign':
      return '闯关';
    case 'advance':
      return '进阶';
    case 'rank-match':
      return '段位赛';
    case 'wrong-review':
      return '错题复练';
    default:
      return mode;
  }
}

export function getHistoryResultLabel(result: HistoryResult): string {
  switch (result) {
    case 'win':
      return '胜利';
    case 'lose':
      return '失败';
    case 'incomplete':
      return '未完成';
    default:
      return result;
  }
}

export function getHistoryStats(record: HistoryRecord): {
  total: number;
  correct: number;
  accuracy: number;
} {
  const total = record.questions.length;
  const correct = record.questions.filter(question => question.correct).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return { total, correct, accuracy };
}

export function getHistoryDurationMs(record: HistoryRecord): number | null {
  if (!record.completed || typeof record.endedAt !== 'number') {
    return null;
  }

  return Math.max(0, record.endedAt - record.startedAt);
}

export function toHistoryDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseHistoryDateValue(value: string | null | undefined): Date | null {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).getTime();
}

function endOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).getTime();
}

function shiftDays(date: Date, offset: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
}

function orderHistoryDateRange(range: HistoryDateRange): HistoryDateRange {
  const startDate = range.startDate ?? range.endDate;
  const endDate = range.endDate ?? range.startDate;

  if (!startDate || !endDate) {
    return { startDate: null, endDate: null };
  }

  return startDate <= endDate
    ? { startDate, endDate }
    : { startDate: endDate, endDate: startDate };
}

export function resolveHistoryDateRange(
  filter: HistoryTimeFilter,
  dateRange: HistoryDateRange = { startDate: null, endDate: null },
  now = Date.now(),
): ResolvedHistoryDateRange {
  const today = new Date(now);
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  switch (filter) {
    case 'today': {
      const todayValue = toHistoryDateValue(today);
      return {
        startDate: todayValue,
        endDate: todayValue,
        startAt: todayStart,
        endAt: todayEnd,
      };
    }
    case '7d': {
      const startDate = shiftDays(today, -6);
      return {
        startDate: toHistoryDateValue(startDate),
        endDate: toHistoryDateValue(today),
        startAt: startOfDay(startDate),
        endAt: todayEnd,
      };
    }
    case '30d': {
      const startDate = shiftDays(today, -29);
      return {
        startDate: toHistoryDateValue(startDate),
        endDate: toHistoryDateValue(today),
        startAt: startOfDay(startDate),
        endAt: todayEnd,
      };
    }
    case '90d': {
      const startDate = shiftDays(today, -89);
      return {
        startDate: toHistoryDateValue(startDate),
        endDate: toHistoryDateValue(today),
        startAt: startOfDay(startDate),
        endAt: todayEnd,
      };
    }
    case 'this-month': {
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        startDate: toHistoryDateValue(startDate),
        endDate: toHistoryDateValue(today),
        startAt: startOfDay(startDate),
        endAt: todayEnd,
      };
    }
    case 'custom': {
      const normalized = orderHistoryDateRange(dateRange);
      const start = parseHistoryDateValue(normalized.startDate);
      const end = parseHistoryDateValue(normalized.endDate);

      if (!start || !end) {
        return {
          startDate: null,
          endDate: null,
          startAt: null,
          endAt: null,
        };
      }

      return {
        startDate: normalized.startDate,
        endDate: normalized.endDate,
        startAt: startOfDay(start),
        endAt: endOfDay(end),
      };
    }
    case 'all':
    default:
      return {
        startDate: null,
        endDate: null,
        startAt: null,
        endAt: null,
      };
  }
}

function formatHistoryDateLabel(dateValue: string | null): string {
  const date = parseHistoryDateValue(dateValue);
  if (!date) return '';
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function getHistoryTimeFilterLabel(
  filter: HistoryTimeFilter,
  dateRange: HistoryDateRange = { startDate: null, endDate: null },
  now = Date.now(),
): string {
  if (filter !== 'custom') {
    return `时间筛选：${HISTORY_TIME_LABELS[filter]}`;
  }

  const resolved = resolveHistoryDateRange(filter, dateRange, now);
  if (!resolved.startDate || !resolved.endDate) {
    return '时间筛选：自定义';
  }

  const startLabel = formatHistoryDateLabel(resolved.startDate);
  const endLabel = formatHistoryDateLabel(resolved.endDate);
  if (!startLabel || !endLabel) {
    return '时间筛选：自定义';
  }

  return startLabel === endLabel
    ? `时间筛选：${startLabel}`
    : `时间筛选：${startLabel}-${endLabel}`;
}

export function filterAndSortHistory(
  records: HistoryRecord[],
  options: {
    modeFilter: HistoryModeFilter;
    timeFilter: HistoryTimeFilter;
    dateRange?: HistoryDateRange;
    sortOrder: HistorySortOrder;
    now?: number;
  },
): HistoryRecord[] {
  const resolvedRange = resolveHistoryDateRange(
    options.timeFilter,
    options.dateRange,
    options.now,
  );

  return records
    .filter(record => {
      if (options.modeFilter !== 'all' && record.sessionMode !== options.modeFilter) {
        return false;
      }

      if (resolvedRange.startAt !== null && record.startedAt < resolvedRange.startAt) {
        return false;
      }

      if (resolvedRange.endAt !== null && record.startedAt > resolvedRange.endAt) {
        return false;
      }

      return true;
    })
    .sort((left, right) => (
      options.sortOrder === 'desc'
        ? right.startedAt - left.startedAt
        : left.startedAt - right.startedAt
    ));
}
