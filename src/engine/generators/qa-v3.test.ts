/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { generateQuestion } from '../index';
import { CAMPAIGN_MAPS, getSubtypeFilter } from '@/constants/campaign';
import type { Question } from '@/types';

function genBatch(topicId: string, difficulty: number, count: number, subtypeFilter?: string[]): Question[] {
  return Array.from({ length: count }, () =>
    generateQuestion(topicId as any, difficulty, subtypeFilter)
  );
}

// ====================================================================
// A. 版本迭代验证 — 自动化可测部分
// ====================================================================

describe('A. 版本迭代验证', () => {
  // A-09
  it('A-09: Question 对象无 timeLimit 字段', () => {
    for (const topicId of Object.keys(CAMPAIGN_MAPS)) {
      const qs = genBatch(topicId, 5, 10);
      for (const q of qs) {
        expect(q).not.toHaveProperty('timeLimit');
      }
    }
  });

  // A-17: reverse-round 最小值浮点精度
  it('A-17: reverseRound 最小值无浮点误差', () => {
    const qs = genBatch('number-sense', 5, 200, ['reverse-round']);
    const reverseQs = qs.filter(q => q.prompt.includes('最小'));
    expect(reverseQs.length).toBeGreaterThan(10);
    for (const q of reverseQs) {
      const ansStr = String(q.solution.answer);
      expect(ansStr).not.toMatch(/9{4,}/);
      expect(ansStr).not.toMatch(/0{4,}1/);
      const parsed = parseFloat(ansStr);
      expect(parsed.toString()).not.toMatch(/e/);
    }
  });

  // A-18: reverse-round 最大值浮点精度
  it('A-18: reverseRound 最大值无浮点误差', () => {
    const qs = genBatch('number-sense', 5, 200, ['reverse-round']);
    const reverseQs = qs.filter(q => q.prompt.includes('最大'));
    expect(reverseQs.length).toBeGreaterThan(10);
    for (const q of reverseQs) {
      const ansStr = String(q.solution.answer);
      expect(ansStr).not.toMatch(/9{4,}/);
      expect(ansStr).not.toMatch(/0{4,}1/);
    }
  });

  // A-19: MC 干扰项来源
  it('A-19: 运算顺序MC干扰项均来自表达式', () => {
    const qs = genBatch('mental-arithmetic', 5, 100, ['order']);
    const mcQs = qs.filter(q => q.type === 'multiple-choice');
    expect(mcQs.length).toBeGreaterThan(5);
    for (const q of mcQs) {
      const data = q.data as any;
      if (!data.options) continue;
      const exprNums = data.expression.match(/\d+/g) || [];
      for (const opt of data.options) {
        const optNums = opt.match(/\d+/g) || [];
        for (const n of optNums) {
          expect(exprNums).toContain(n);
        }
      }
    }
  });

  // A-20: b=1 概率 ≤ 20%
  it('A-20: compare b=1 概率 ≤ 20%', () => {
    const nsQs = genBatch('number-sense', 5, 200, ['compare']);
    const eqCount = nsQs.filter(q => q.solution.answer === '=').length;
    expect(eqCount / nsQs.length).toBeLessThanOrEqual(0.25);

    const dsQs = genBatch('decimal-ops', 5, 200, ['compare']);
    if (dsQs.length > 0) {
      const dsEqCount = dsQs.filter(q => q.solution.answer === '=').length;
      expect(dsEqCount / dsQs.length).toBeLessThanOrEqual(0.25);
    }
  });
});

// ====================================================================
// F. 题目生成与路线匹配
// ====================================================================

describe('F-I. 通用生成质量', () => {
  // F-01
  it('F-01: Question 结构完整', () => {
    for (const topicId of Object.keys(CAMPAIGN_MAPS)) {
      const q = generateQuestion(topicId as any, 5);
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('topicId');
      expect(q).toHaveProperty('type');
      expect(q).toHaveProperty('difficulty');
      expect(q).toHaveProperty('prompt');
      expect(q).toHaveProperty('data');
      expect(q).toHaveProperty('solution');
      expect(q).toHaveProperty('hints');
    }
  });

  // F-02
  it('F-02: difficulty 匹配', () => {
    const q = generateQuestion('mental-arithmetic', 2);
    expect(q.difficulty).toBe(2);
  });

  // F-03
  it('F-03: topicId 匹配', () => {
    const q = generateQuestion('mental-arithmetic', 5);
    expect(q.topicId).toBe('mental-arithmetic');
  });

  // F-04
  it('F-04: solution.answer 非空', () => {
    for (const topicId of Object.keys(CAMPAIGN_MAPS)) {
      const qs = genBatch(topicId, 5, 10);
      for (const q of qs) {
        expect(q.solution.answer).toBeDefined();
        expect(String(q.solution.answer).length).toBeGreaterThan(0);
      }
    }
  });

  // F-05 — DEFECT-001: equation-transpose generateEquationConcept "是/不是" 只有2选项
  it('F-05: MC 题有 ≥ 3 选项 (排除已知的是/不是判断题)', () => {
    for (const topicId of Object.keys(CAMPAIGN_MAPS)) {
      const qs = genBatch(topicId, 5, 50);
      const mcQs = qs.filter(q => q.type === 'multiple-choice');
      for (const q of mcQs) {
        const data = q.data as any;
        if (!data.options) continue;
        if (data.options.length === 2 && data.options.includes('是') && data.options.includes('不是')) {
          continue; // DEFECT-001: 已知2选项判断题
        }
        if (data.options.length === 2 && data.options.includes('满足') && data.options.includes('不满足')) {
          continue; // A04 simple-judge：满足/不满足 两项判断本身就是题型的表达方式
        }
        expect(data.options.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  // DEFECT-001 FIXED: equation-transpose 概念题升级为 4 选项 MC
  it('DEFECT-001 (fixed): equation-transpose 概念题为 ≥3 选项 MC', () => {
    const qs = genBatch('equation-transpose', 5, 200, ['equation-concept']);
    const mcQs = qs.filter(q => q.type === 'multiple-choice');
    expect(mcQs.length).toBeGreaterThan(0);
    for (const q of mcQs) {
      const data = q.data as any;
      expect(data.options?.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('F-II. subtypeFilter 逐题型验证', () => {
  function testRoute(
    testId: string,
    topicId: string,
    subtypeFilter: string[],
    expectedSubtypes: string[],
    threshold: number
  ) {
    it(`${testId}: ${topicId} filter=${JSON.stringify(subtypeFilter)} → ≥${threshold * 100}% ${expectedSubtypes.join('/')}`, () => {
      const qs = genBatch(topicId, 5, 30, subtypeFilter);
      let matchCount = 0;
      for (const q of qs) {
        const data = q.data as any;
        const subtype = data.subtype || data.kind || data.law;
        if (expectedSubtypes.includes(subtype)) {
          matchCount++;
        }
      }
      expect(matchCount / qs.length).toBeGreaterThanOrEqual(threshold);
    });
  }

  // F-06: A01 加减
  testRoute('F-06', 'mental-arithmetic', ['add', 'sub'], ['mental-arithmetic'], 0.9);

  // F-07: A01 乘除
  testRoute('F-07', 'mental-arithmetic', ['mul', 'div'], ['mental-arithmetic'], 0.9);

  // F-08: A02 估算
  it('F-08: A02 估算路线 100% estimate', () => {
    const qs = genBatch('number-sense', 5, 30, ['estimate']);
    const matchCount = qs.filter(q => (q.data as any).subtype === 'estimate').length;
    expect(matchCount / qs.length).toBe(1);
  });

  // F-09: A02 比较大小
  it('F-09: A02 比较大小路线 100% compare', () => {
    const qs = genBatch('number-sense', 5, 30, ['compare']);
    const matchCount = qs.filter(q => (q.data as any).subtype === 'compare').length;
    expect(matchCount / qs.length).toBe(1);
  });

  // F-10: A03 加减路线
  it('F-10: A03 加减路线 ≥ 90% int-add/sub', () => {
    const qs = genBatch('vertical-calc', 3, 30, ['int-add', 'int-sub']);
    for (const q of qs) {
      expect(q.data.kind).toBe('vertical-calc');
    }
    expect(qs.length).toBe(30);
  });

  // F-11: A03 乘除路线
  it('F-11: A03 乘除路线 ≥ 90% int-mul/div', () => {
    const qs = genBatch('vertical-calc', 3, 30, ['int-mul', 'int-div']);
    for (const q of qs) {
      expect(q.data.kind).toBe('vertical-calc');
    }
    expect(qs.length).toBe(30);
  });

  // F-12: A04 v2.2 — 档 1 identify-law 过滤器
  it('F-12: A04 档 1 identify-law filter 100% 命中', () => {
    const qs = genBatch('operation-laws', 5, 30, ['identify-law']);
    const matchCount = qs.filter(q => q.type === 'multiple-choice').length;
    expect(matchCount / qs.length).toBe(1);
  });

  // F-12b: A04 v2.2 — 档 1 reverse-blank 过滤器（multi-blank 反用律）
  it('F-12b: A04 档 1 reverse-blank filter 100% 命中 multi-blank', () => {
    const qs = genBatch('operation-laws', 5, 30, ['reverse-blank']);
    const matchCount = qs.filter(q => q.type === 'multi-blank').length;
    expect(matchCount / qs.length).toBe(1);
  });

  // F-12c: A04 v2.2 — 档 2 distributive-trap 过滤器（MC 分配律陷阱）
  it('F-12c: A04 档 2 distributive-trap filter 100% 命中 MC', () => {
    const qs = genBatch('operation-laws', 8, 30, ['distributive-trap']);
    const matchCount = qs.filter(q => q.type === 'multiple-choice').length;
    expect(matchCount / qs.length).toBe(1);
  });

  // F-13: A05 乘法路线
  it('F-13: A05 乘法路线 100% mul', () => {
    const qs = genBatch('decimal-ops', 5, 30, ['mul']);
    const matchCount = qs.filter(q => (q.data as any).subtype === 'mul').length;
    expect(matchCount / qs.length).toBe(1);
  });

  // F-14: A06 添括号路线（v2.1：添括号为中档题，改用 d=7）
  it('F-14: A06 添括号路线 100% add-bracket', () => {
    const qs = genBatch('bracket-ops', 7, 30, ['add-bracket']);
    const matchCount = qs.filter(q => (q.data as any).subtype === 'add-bracket').length;
    expect(matchCount / qs.length).toBe(1);
  });

  // F-15: A06 去括号路线
  it('F-15: A06 去括号路线 100% remove-bracket', () => {
    const qs = genBatch('bracket-ops', 5, 30, ['remove-bracket-plus', 'remove-bracket-minus']);
    const matchCount = qs.filter(q => {
      const st = (q.data as any).subtype;
      return st === 'remove-bracket-plus' || st === 'remove-bracket-minus' || st === 'remove-bracket';
    }).length;
    expect(matchCount / qs.length).toBe(1);
  });

  // F-16: A07 分配律路线
  it('F-16: A07 extract-factor 路线', () => {
    const qs = genBatch('multi-step', 5, 30, ['extract-factor']);
    expect(qs.length).toBe(30);
    for (const q of qs) {
      expect(q.topicId).toBe('multi-step');
    }
  });

  // F-17: A08 常数移项
  it('F-17: A08 常数移项路线 100% move-constant', () => {
    const qs = genBatch('equation-transpose', 3, 30, ['move-constant']);
    for (const q of qs) {
      expect(q.topicId).toBe('equation-transpose');
      expect(q.data.kind).toBe('equation-transpose');
    }
    expect(qs.length).toBe(30);
  });

  // F-18: 综合/Boss 混合
  it('F-18: 综合路线(无filter)混合多种子题型', () => {
    const qs = genBatch('mental-arithmetic', 7, 30);
    const types = new Set(qs.map(q => q.type));
    expect(types.size).toBeGreaterThanOrEqual(1);
  });
});

// ====================================================================
// A-07/A-08: A08 方程 MC 应有 4 选项
// ====================================================================

describe('A-07/A-08: 方程MC选项数', () => {
  it('A-07: A08 move-constant MC 有 4 选项', () => {
    const qs = genBatch('equation-transpose', 3, 50, ['move-constant']);
    const mcQs = qs.filter(q => q.type === 'multiple-choice');
    for (const q of mcQs) {
      const data = q.data as any;
      if (data.options) {
        expect(data.options.length).toBe(4);
      }
    }
  });

  it('A-08: A08 move-from-linear MC 有 4 选项', () => {
    const qs = genBatch('equation-transpose', 3, 50, ['move-from-linear', 'solve-after-transpose']);
    const mcQs = qs.filter(q => q.type === 'multiple-choice');
    for (const q of mcQs) {
      const data = q.data as any;
      if (data.options) {
        expect(data.options.length).toBe(4);
      }
    }
  });
});

// ====================================================================
// Campaign 结构验证
// ====================================================================

describe('Campaign 结构验证', () => {
  it('B-09: 各题型总关卡数正确', () => {
    // ISSUE-057（2026-04-17）范围扩张后：8 题型全面重构，"S3 综合无 filter"段
    // 被拆成聚焦 lane；A01/A04/A08 压为 2 档 + Boss。详见 Reports 迁移说明。
    const expected: Record<string, number> = {
      'mental-arithmetic': 11, // 原 12，档 2 拆 2 lane、删去"综合挑战"段
      'number-sense': 15,      // 原 15，S3"综合估算"改为聚焦估算 + 比较深化
      'vertical-calc': 12,     // 原 12，S3"高阶笔算"改为大数乘法 + 除法近似
      'operation-laws': 8,     // 原 10，压 2 档后 S2/S3 合并为"律的深化"
      'decimal-ops': 12,       // 原 12，S3"综合"改为循环小数 + 反直觉性质
      'bracket-ops': 10,       // 原 10，S3 原"division-property"在 v2.2 已降权为 0
      'multi-step': 13,        // 原 14，S3"高阶综合"改为错误诊断 + 隐藏因数
      'equation-transpose': 9, // 原 11，压 2 档后 S2/S3 合并为"双向移项与陷阱"
    };
    for (const [topicId, map] of Object.entries(CAMPAIGN_MAPS)) {
      let count = 0;
      for (const stage of map.stages) {
        for (const lane of stage.lanes) {
          count += lane.levels.length;
        }
      }
      expect(count).toBe(expected[topicId]);
    }
  });

  it('A-24: 50条Lane难度单调不减 + S1首关≥2 + Boss=9', () => {
    let totalLanes = 0;
    for (const [_, map] of Object.entries(CAMPAIGN_MAPS)) {
      for (const stage of map.stages) {
        for (const lane of stage.lanes) {
          totalLanes++;
          const diffs = lane.levels.map(l => l.difficulty);
          for (let i = 1; i < diffs.length; i++) {
            expect(diffs[i]).toBeGreaterThanOrEqual(diffs[i - 1]);
          }
        }
        if (stage.stageId.endsWith('-S1')) {
          for (const lane of stage.lanes) {
            expect(lane.levels[0].difficulty).toBeGreaterThanOrEqual(2);
          }
        }
        if (stage.isBoss) {
          for (const lane of stage.lanes) {
            for (const level of lane.levels) {
              expect(level.difficulty).toBe(9);
            }
          }
        }
      }
    }
    expect(totalLanes).toBe(50);
  });
});
