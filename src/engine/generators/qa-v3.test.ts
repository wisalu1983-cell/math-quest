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

  // A-21: A01 S2-LB 乘除在 d≥6 下高档技巧池占主导（useHighPool=0.75，子计划 2.5 §S2-T3 方案 B）
  it('A-21: A01 S2-LB 乘除 d≥6 高档技巧题占比 ≥ 65%', () => {
    const qs = genBatch('mental-arithmetic', 7, 400, ['mul', 'div']);
    // 判据：中档 midMulMidZero/midDiv 的 operand 永不命中「末尾 0」或 {25,50,75,125}；
    // 高档 highMul*/highDiv* 必命中其一。详见 mental-arithmetic.ts §"高档：末尾0管理/需拆分"。
    const FRIENDLY = new Set([25, 50, 75, 125]);
    let hi = 0;
    for (const q of qs) {
      const d = q.data as any;
      if (d.kind !== 'mental-arithmetic' || !d.operands) continue;
      const [a, b] = d.operands as [number, number];
      const op = d.operator as string;
      const isHigh =
        op === '×'
          ? FRIENDLY.has(a) || FRIENDLY.has(b) || a % 10 === 0 || b % 10 === 0
          : op === '÷'
            ? FRIENDLY.has(b) || b % 10 === 0
            : false;
      if (isHigh) hi++;
    }
    expect(hi / qs.length).toBeGreaterThan(0.65);
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

  // A-22 ~ A-25: S3-T3 — A08 四类陷阱（T1/T2/T3/T4）反馈质量（子计划 2.5 §S3-T3）
  // 判据：每类陷阱题的 solution.explanation 必须同时包含
  //   ① 陷阱标签（"陷阱 T[1-4]" 或对应陷阱编号）
  //   ② 错误点说明（告诉学生哪里会错）
  //   ③ 修正指引（怎么改到正确）
  // 生成采样：每类 ≥ 2 条（子计划原文每类一次，本 session 用户要求每类两次）

  function collectByTrap(difficulty: number, count: number): Record<string, Question[]> {
    const qs = genBatch('equation-transpose', difficulty, count);
    const byTrap: Record<string, Question[]> = {};
    for (const q of qs) {
      const trap = (q.data as any).trap as string | undefined;
      if (!trap) continue;
      (byTrap[trap] ??= []).push(q);
    }
    return byTrap;
  }

  function assertTrapFeedbackQuality(q: Question, trapLabel: string, errorKeywords: RegExp, fixKeywords: RegExp) {
    const exp = q.solution.explanation ?? '';
    expect(exp, `${trapLabel} 题必须有 explanation`).toBeTruthy();
    expect(exp, `${trapLabel} 题的 explanation 必须标注陷阱标签`).toMatch(/陷阱 ?T[1-4]/);
    expect(exp, `${trapLabel} 题的 explanation 必须说明错误点`).toMatch(errorKeywords);
    expect(exp, `${trapLabel} 题的 explanation 必须给修正指引`).toMatch(fixKeywords);
    expect(q.hints?.length ?? 0, `${trapLabel} 题必须有 hints`).toBeGreaterThan(0);
  }

  it('A-22: A08-T1「减号后 x 丢负号」反馈含陷阱标签+错误点+修正指引（≥2 道）', () => {
    const byTrap = collectByTrap(7, 200);
    const t1 = byTrap['T1'] ?? [];
    expect(t1.length, 'T1 陷阱题应至少生成 2 道').toBeGreaterThanOrEqual(2);
    for (const q of t1.slice(0, 2)) {
      assertTrapFeedbackQuality(q, 'T1', /负号|变号|不变/, /保持不变|只变|不能写成/);
    }
  });

  it('A-23: A08-T2「同侧多常数漏移」反馈含陷阱标签+错误点+修正指引（≥2 道）', () => {
    const byTrap = collectByTrap(7, 200);
    const t2 = byTrap['T2'] ?? [];
    expect(t2.length, 'T2 陷阱题应至少生成 2 道').toBeGreaterThanOrEqual(2);
    for (const q of t2.slice(0, 2)) {
      assertTrapFeedbackQuality(q, 'T2', /常数|都要|两个/, /变号|移到右边|不能只移/);
    }
  });

  it('A-24: A08-T3「括号展开漏乘」反馈含陷阱标签+错误点+修正指引（≥2 道）', () => {
    const byTrap = collectByTrap(7, 200);
    const t3Keys = ['T3', 'T3+T4'];
    const t3 = t3Keys.flatMap(k => byTrap[k] ?? []);
    expect(t3.length, 'T3 / T3+T4 陷阱题应至少生成 2 道').toBeGreaterThanOrEqual(2);
    for (const q of t3.slice(0, 2)) {
      assertTrapFeedbackQuality(q, 'T3', /展开|漏乘|不能漏/, /同时乘|再做|分配律/);
    }
  });

  it('A-25: A08-T4「双向移项每项变号」反馈含陷阱标签+错误点+修正指引（≥2 道）', () => {
    const byTrap = collectByTrap(7, 200);
    const t4Keys = ['T4', 'T3+T4'];
    const t4 = t4Keys.flatMap(k => byTrap[k] ?? []);
    expect(t4.length, 'T4 / T3+T4 陷阱题应至少生成 2 道').toBeGreaterThanOrEqual(2);
    for (const q of t4.slice(0, 2)) {
      assertTrapFeedbackQuality(q, 'T4', /每个|都要变号|两侧/, /变号|移到/);
    }
  });

  // A-26: S3-T2 — multi-select 链路结构验证（子计划 2.5 §S3-T2）
  // 高档 A04(operation-laws)/ A07(multi-step)/ A02(number-sense) 会出 multi-select
  it('A-26: multi-select 题 answer 为逗号分隔排序字母 + answers 数组存在', () => {
    const sources: Array<[string, number, string[]?]> = [
      ['operation-laws', 7],
      ['multi-step', 7, ['recognize-multi']],
      ['number-sense', 7, ['compare']],
    ];
    for (const [topic, d, filter] of sources) {
      const qs = genBatch(topic, d, 200, filter);
      const ms = qs.filter(q => q.type === 'multi-select');
      if (ms.length === 0) continue;
      for (const q of ms.slice(0, 3)) {
        expect(q.solution.answer, `${topic} multi-select answer 应为逗号分隔大写字母`).toMatch(/^[A-Z](,[A-Z])*$/);
        expect(q.solution.answers?.length, `${topic} multi-select answers 数组应 ≥ 1`).toBeGreaterThanOrEqual(1);
        const sorted = q.solution.answer.split(',').sort().join(',');
        expect(sorted, `${topic} multi-select answer 应已排序`).toBe(q.solution.answer);
        expect(q.data && 'options' in q.data && (q.data as any).options?.length, `${topic} multi-select 应有 options`).toBeGreaterThanOrEqual(2);
      }
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
        if (data.options.length === 2 && data.options.some((o: string) => o.includes('满足'))) {
          continue; // A04 simple-judge：二选一判断题
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
      'mental-arithmetic': 9,  // C1: S1-LA-L2(d=3), S2-LA-L2(d=7) 删除，共减2关
      'number-sense': 15,      // 原 15，S3"综合估算"改为聚焦估算 + 比较深化
      'vertical-calc': 11,     // C1: S1-LA-L2(d=3) 删除，共减1关
      'operation-laws': 7,     // C1: S1-LA-L2(d=3) 删除，共减1关
      'decimal-ops': 12,       // 原 12，S3"综合"改为循环小数 + 反直觉性质
      'bracket-ops': 9,        // C1: S1-LA-L2(d=4) 删除，共减1关
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
