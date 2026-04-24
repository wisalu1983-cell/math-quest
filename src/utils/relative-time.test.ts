import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatRelativeTime } from './relative-time';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-24T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('空值返回尚未同步', () => {
    expect(formatRelativeTime(null)).toBe('尚未同步');
  });

  it('一分钟内返回刚刚', () => {
    expect(formatRelativeTime(Date.now() - 30_000)).toBe('刚刚');
  });

  it('一小时内返回分钟数', () => {
    expect(formatRelativeTime(Date.now() - 5 * 60_000)).toBe('5 分钟前');
  });

  it('一天内返回小时数', () => {
    expect(formatRelativeTime(Date.now() - 2 * 3_600_000)).toBe('2 小时前');
  });

  it('一天到两天内返回昨天', () => {
    expect(formatRelativeTime(Date.now() - 26 * 3_600_000)).toBe('昨天');
  });

  it('两天后返回天数，且支持 ISO 字符串', () => {
    expect(formatRelativeTime('2026-04-21T12:00:00.000Z')).toBe('3 天前');
  });
});
