// src/engine/advance.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  getStars,
  getStarProgress,
  getTierCounts,
  buildAdvanceSlots,
} from './advance';
import { ADVANCE_QUESTION_COUNT, getTier } from '@/constants/advance';
import type { TopicId } from '@/types';

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
  it('0★ → 40% normal + 60% hard（v0.2 方向A调整后）', () => {
    const c = getTierCounts(0, 5, 20);
    expect(c.normal).toBe(8);
    expect(c.hard).toBe(12);
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

  it('operation-laws: 跨档抽样偏向单档时仍保持子题型数 ≤ 4', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.9);
    try {
      const slots = buildAdvanceSlots('operation-laws', 0);
      const uniqueTags = new Set(slots.map(s => s.subtypeTag));
      expect(uniqueTags.size).toBeLessThanOrEqual(4);
    } finally {
      randomSpy.mockRestore();
    }
  });
});

// ─────────────────────────────────────────
// S4-T1: 3★-cap 题型（A01/A04/A08）压档场景验收
// 子计划 2.5 §S4-T1 — 验证 v2.2 压档后 buildAdvanceSlots 在 4 个星级边界
// 的 tierCounts 精确分布 + slots 档位落点一致 + demon 档永不启用 + 子题型不退化
// ─────────────────────────────────────────

describe('S4-T1: 3★-cap 题型压档场景（A01/A04/A08）', () => {
  const CAP3_TOPICS: TopicId[] = ['mental-arithmetic', 'operation-laws', 'equation-transpose'];

  /** 边界矩阵：[hearts, 预期 tierCounts.normal/hard/demon]（v0.2 方向A调整后权重）*/
  const BOUNDARY_MATRIX: Array<{ hearts: number; star: string; expected: { normal: number; hard: number; demon: number } }> = [
    { hearts: 0,  star: '0★', expected: { normal: 8,  hard: 12, demon: 0 } },
    { hearts: 6,  star: '1★', expected: { normal: 4,  hard: 16, demon: 0 } },
    { hearts: 18, star: '2★', expected: { normal: 0,  hard: 20, demon: 0 } },
    { hearts: 38, star: '3★', expected: { normal: 0,  hard: 20, demon: 0 } },
  ];

  describe('1. getTierCounts 精确分布', () => {
    for (const { hearts, star, expected } of BOUNDARY_MATRIX) {
      it(`${star}(${hearts}❤️): {normal:${expected.normal}, hard:${expected.hard}, demon:${expected.demon}}`, () => {
        const counts = getTierCounts(hearts, 3, 20);
        expect(counts).toEqual(expected);
      });
    }
  });

  describe('2. buildAdvanceSlots 档位落点与 tierCounts 一致', () => {
    for (const topicId of CAP3_TOPICS) {
      for (const { hearts, star, expected } of BOUNDARY_MATRIX) {
        it(`${topicId} @ ${star}(${hearts}❤️): slots 档位计数 == tierCounts`, () => {
          const slots = buildAdvanceSlots(topicId, hearts);
          const actual = { normal: 0, hard: 0, demon: 0 };
          for (const s of slots) {
            actual[getTier(s.difficulty)]++;
          }
          expect(actual).toEqual(expected);
        });
      }
    }
  });

  describe('3. 【压档核心】demon 档永不启用', () => {
    for (const topicId of CAP3_TOPICS) {
      it(`${topicId}: 四个星级边界下所有 slots difficulty ≤ 7`, () => {
        for (const { hearts } of BOUNDARY_MATRIX) {
          const slots = buildAdvanceSlots(topicId, hearts);
          for (const s of slots) {
            expect(s.difficulty).toBeLessThanOrEqual(7);
            expect(s.difficulty).toBeGreaterThanOrEqual(2);
          }
        }
      });
    }
  });

  describe('4. 子题型不退化为单一（跨档星级下）', () => {
    // 检查 1★ / 2★ 跨档边界；0★（Normal+Hard 混档）和 3★（全 Hard）单档题型也应有多种子题型
    // SWOR 最多选 4 个 tag，只要 pool ≥ 2 就应该 ≥ 2 种
    for (const topicId of CAP3_TOPICS) {
      it(`${topicId} @ 1★(6❤️): slot.subtypeTag 唯一值数 ≥ 2`, () => {
        const slots = buildAdvanceSlots(topicId, 6);
        const uniqueTags = new Set(slots.map(s => s.subtypeTag));
        expect(uniqueTags.size).toBeGreaterThanOrEqual(2);
      });

      it(`${topicId} @ 2★(18❤️): slot.subtypeTag 唯一值数 ≥ 2`, () => {
        const slots = buildAdvanceSlots(topicId, 18);
        const uniqueTags = new Set(slots.map(s => s.subtypeTag));
        expect(uniqueTags.size).toBeGreaterThanOrEqual(2);
      });
    }
  });
});

// ─────────────────────────────────────────
// S4-T3: 进阶模式新答题形式可达性
// 子计划 2.5 §S4-T3 — 验证 buildAdvanceSlots 产出的 subtypeTag 能触发
// multi-blank / expression-input / equation-input 对应的生成器路径
// ─────────────────────────────────────────

describe('S4-T3: 进阶中新答题形式可达性', () => {
  // A04(operation-laws) 高档有 multi-blank：tag = 'fill-commutative' / 'fill-distributive'
  // A06(bracket-ops) 全档都是 expression-input
  // A08(equation-transpose) 全档都是 equation-input

  it('operation-laws 进阶 slots 包含 fill-* tag（对应 multi-blank）', () => {
    // 1★ 时既有 normal 档也有 hard 档，fill-* tag 出现概率高
    let found = false;
    const blankTags = ['structure-blank', 'reverse-blank'];
    for (let trial = 0; trial < 10; trial++) {
      const slots = buildAdvanceSlots('operation-laws', 6);
      if (slots.some(s => blankTags.includes(s.subtypeTag))) { found = true; break; }
    }
    expect(found, 'operation-laws 进阶应能生成 structure-blank / reverse-blank (multi-blank) subtypeTag').toBe(true);
  });

  it('bracket-ops 进阶 slots 包含去/添括号 tag（对应 expression-input）', () => {
    const slots = buildAdvanceSlots('bracket-ops', 0);
    const tags = new Set(slots.map(s => s.subtypeTag));
    const expressionTags = ['remove-bracket-plus', 'remove-bracket-minus', 'add-bracket', 'nested-bracket', 'four-items-sign', 'error-diagnose', 'division-property'];
    const hasAny = expressionTags.some(t => tags.has(t));
    expect(hasAny, 'bracket-ops 进阶应能生成 expression-input 对应 subtypeTag').toBe(true);
  });

  it('equation-transpose 进阶 slots 包含移项 tag（对应 equation-input）', () => {
    const slots = buildAdvanceSlots('equation-transpose', 0);
    const tags = new Set(slots.map(s => s.subtypeTag));
    const eqTags = ['move-constant', 'move-from-linear', 'equation-concept', 'move-both-sides', 'bracket-equation', 'error-diagnose', 'solve-after-transpose', 'division-equation'];
    const hasAny = eqTags.some(t => tags.has(t));
    expect(hasAny, 'equation-transpose 进阶应能生成 equation-input 对应 subtypeTag').toBe(true);
  });
});

// ─────────────────────────────────────────
// S4-T2: 8 主题进阶端到端冒烟
// 子计划 2.5 §S4-T2 — 每主题各跑一局完整 20 题进阶，
// 验证 buildAdvanceSlots → generateQuestion 链路全程无 throw、
// 0 console error（以 question 结构完整性替代 pageerror 检测）
// ─────────────────────────────────────────

import { generateQuestion } from './index';

describe('S4-T2: 8 主题进阶端到端冒烟（20 题完整局）', () => {
  const TOPICS: Array<import('@/types').TopicId> = [
    'mental-arithmetic', 'number-sense', 'vertical-calc', 'operation-laws',
    'decimal-ops', 'bracket-ops', 'multi-step', 'equation-transpose',
  ];

  const HEARTS_LEVELS = [0, 18, 38]; // 0★ / 2★ / 3★(或 3★ for 5-cap)

  for (const topicId of TOPICS) {
    for (const hearts of HEARTS_LEVELS) {
      it(`${topicId} @ ${hearts}❤️: 20 题生成无 throw + 结构完整`, () => {
        const slots = buildAdvanceSlots(topicId, hearts);
        expect(slots.length).toBe(ADVANCE_QUESTION_COUNT);

        for (const slot of slots) {
          const q = generateQuestion(topicId, slot.difficulty, [slot.subtypeTag]);
          expect(q, `${topicId}/${slot.subtypeTag}/d${slot.difficulty} 应返回 Question`).toBeTruthy();
          expect(q.id).toBeTruthy();
          expect(q.topicId).toBe(topicId);
          expect(q.prompt).toBeTruthy();
          expect(q.solution).toBeTruthy();
          expect(q.solution.answer !== undefined && q.solution.answer !== null).toBe(true);
        }
      });
    }
  }
});
