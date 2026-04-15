// src/engine/advance.test.ts
import { describe, it, expect } from 'vitest';
import {
  getStars,
  getStarProgress,
  getFractionalStars,
  getTierCounts,
  buildAdvanceSlots,
} from './advance';
import { ADVANCE_QUESTION_COUNT } from '@/constants/advance';

describe('getStars', () => {
  it('0 hearts → 0★', () => expect(getStars(0, 3)).toBe(0));
  it('6 hearts → 1★ (3-cap)', () => expect(getStars(6, 3)).toBe(1));
  it('18 hearts → 2★ (3-cap)', () => expect(getStars(18, 3)).toBe(2));
  it('38 hearts → 3★ (3-cap)', () => expect(getStars(38, 3)).toBe(3));
  it('38 hearts → 3★ (5-cap)', () => expect(getStars(38, 5)).toBe(3));
  it('78 hearts → 5★ (5-cap)', () => expect(getStars(78, 5)).toBe(5));
  it('overflow (100 hearts) → cap (3-cap)', () => expect(getStars(100, 3)).toBe(3));
});

describe('getStarProgress', () => {
  it('0 hearts → 0.0', () => expect(getStarProgress(0, 3)).toBe(0));
  it('3 hearts (half of 0→1★) → 0.5', () => expect(getStarProgress(3, 3)).toBeCloseTo(0.5));
  it('6 hearts → 0.0 (new star starts)', () => expect(getStarProgress(6, 3)).toBe(0));
  it('cap reached → 1.0', () => expect(getStarProgress(38, 3)).toBe(1.0));
});

describe('getTierCounts', () => {
  it('0★ → all normal', () => {
    const c = getTierCounts(0, 5, 20);
    expect(c.normal).toBe(20);
    expect(c.hard).toBe(0);
    expect(c.demon).toBe(0);
  });

  it('总数精确等于 total', () => {
    for (const hearts of [0, 3, 6, 18, 38, 58, 78]) {
      const c = getTierCounts(hearts, 5, 20);
      expect(c.normal + c.hard + c.demon).toBe(20);
    }
    for (const hearts of [0, 6, 18, 38]) {
      const c = getTierCounts(hearts, 3, 20);
      expect(c.normal + c.hard + c.demon).toBe(20);
    }
  });

  it('5★ → 3-cap topic stops at hard only', () => {
    const c = getTierCounts(38, 3, 20); // 3★ 满级
    expect(c.demon).toBe(0);
  });
});

describe('buildAdvanceSlots', () => {
  const TOPICS: Array<import('@/types').TopicId> = [
    'mental-arithmetic', 'number-sense', 'vertical-calc', 'operation-laws',
    'decimal-ops', 'bracket-ops', 'multi-step', 'equation-transpose',
  ];

  for (const topicId of TOPICS) {
    it(`${topicId}: 生成 ${ADVANCE_QUESTION_COUNT} 个槽位`, () => {
      const slots = buildAdvanceSlots(topicId, 0);
      expect(slots.length).toBe(ADVANCE_QUESTION_COUNT);
    });

    it(`${topicId}: difficulty 在合法范围 1-10`, () => {
      const slots = buildAdvanceSlots(topicId, 0);
      for (const s of slots) {
        expect(s.difficulty).toBeGreaterThanOrEqual(1);
        expect(s.difficulty).toBeLessThanOrEqual(10);
      }
    });

    it(`${topicId}: 子题型数 ≤ 4`, () => {
      const slots = buildAdvanceSlots(topicId, 0);
      const uniqueTags = new Set(slots.map(s => s.subtypeTag));
      expect(uniqueTags.size).toBeLessThanOrEqual(4);
    });

    it(`${topicId}: 高星段(78❤️)槽位总数正确`, () => {
      const slots = buildAdvanceSlots(topicId, 78);
      expect(slots.length).toBe(ADVANCE_QUESTION_COUNT);
    });
  }
});
