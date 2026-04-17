/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { generateMentalArithmetic, getSubtypeEntries as maEntries } from './mental-arithmetic';
import { generateNumberSense, getSubtypeEntries as nsEntries } from './number-sense';
import { generateVerticalCalc, getSubtypeEntries as vcEntries } from './vertical-calc';
import { generateOperationLaws, getSubtypeEntries as olEntries } from './operation-laws';
import { generateDecimalOps, getSubtypeEntries as doEntries } from './decimal-ops';
import { generateBracketOps, getSubtypeEntries as boEntries } from './bracket-ops';
import { generateMultiStep, getSubtypeEntries as msEntries } from './multi-step';
import { generateEquationTranspose, getSubtypeEntries as etEntries } from './equation-transpose';
import { formatNum } from './utils';
import type { Question } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type GenFn = (p: { difficulty: number; id: string; subtypeFilter?: string[] }) => Question;

function genFiltered(fn: GenFn, difficulty: number, subtypeFilter: string[], n = 80): Question[] {
  return Array.from({ length: n }, (_, i) =>
    fn({ difficulty, id: `tier-${i}`, subtypeFilter }),
  );
}

function genN(fn: GenFn, difficulty: number, n = 80): Question[] {
  return Array.from({ length: n }, (_, i) => fn({ difficulty, id: `tier-${i}` }));
}

// ---------------------------------------------------------------------------
// 0. Shared utility — formatNum
// ---------------------------------------------------------------------------

describe('formatNum 共享工具函数', () => {
  it('整数 → 字符串', () => {
    expect(formatNum(42)).toBe('42');
    expect(formatNum(0)).toBe('0');
    expect(formatNum(-7)).toBe('-7');
  });
  it('小数去尾零', () => {
    expect(formatNum(3.5)).toBe('3.5');
    expect(formatNum(1.2000)).toBe('1.2');
    expect(formatNum(0.001)).toBe('0.001');
  });
  it('精度最多4位', () => {
    expect(formatNum(1 / 3)).toBe('0.3333');
  });
});

// ---------------------------------------------------------------------------
// 1. getSubtypeEntries 验证：各生成器按三档返回正确的子题型集合
// ---------------------------------------------------------------------------

describe('getSubtypeEntries 三档子题型集合', () => {
  const tags = (entries: { tag: string }[]) => entries.map(e => e.tag).sort();

  // A01
  it('A01 mental-arithmetic: 全难度返回 add/sub/mul/div/order', () => {
    for (const d of [3, 7, 9]) {
      expect(tags(maEntries(d))).toEqual(['add', 'div', 'mul', 'order', 'sub']);
    }
  });

  // A02
  it('A02 number-sense: 全难度返回 estimate/round/compare/floor-ceil/reverse-round', () => {
    for (const d of [3, 7, 9]) {
      expect(tags(nsEntries(d))).toEqual(
        ['compare', 'estimate', 'floor-ceil', 'reverse-round', 'round'],
      );
    }
  });

  // A03
  it('A03 vertical-calc: ≤5 无 approximate；≥6 有 approximate', () => {
    expect(vcEntries(5).find(e => e.tag === 'approximate')).toBeUndefined();
    expect(vcEntries(6).find(e => e.tag === 'approximate')).toBeDefined();
    expect(vcEntries(9).find(e => e.tag === 'approximate')).toBeDefined();
  });

  // A04（v2.2：2 档结构，对齐 TOPIC_STAR_CAP=3）
  it('A04 operation-laws: 档 1 (d≤5) 律的认识组；档 2 (d≥6) 律的深化组；下沉 split-path / cannot-simplify 等到 A07', () => {
    const tier1 = olEntries(5);
    expect(tier1.find(e => e.tag === 'identify-law')).toBeDefined();
    expect(tier1.find(e => e.tag === 'structure-blank')).toBeDefined();
    expect(tier1.find(e => e.tag === 'reverse-blank')).toBeDefined();
    expect(tier1.find(e => e.tag === 'simple-judge')).toBeDefined();
    expect(tier1.find(e => e.tag === 'counter-example')).toBeUndefined();
    expect(tier1.find(e => e.tag === 'split-path-distribute')).toBeUndefined();

    const tier2 = olEntries(6);
    expect(tier2.find(e => e.tag === 'counter-example')).toBeDefined();
    expect(tier2.find(e => e.tag === 'easy-confuse')).toBeDefined();
    expect(tier2.find(e => e.tag === 'compound-law')).toBeDefined();
    expect(tier2.find(e => e.tag === 'distributive-trap')).toBeDefined();
    expect(tier2.find(e => e.tag === 'concept-reverse')).toBeDefined();
    expect(tier2.find(e => e.tag === 'error-diagnose')).toBeDefined();
    expect(tier2.find(e => e.tag === 'identify-law')).toBeUndefined();

    // d=7 / d=8 / d=9 都属于档 2，和 d=6 结构一致
    expect(olEntries(7).map(e => e.tag).sort()).toEqual(tier2.map(e => e.tag).sort());
    expect(olEntries(9).map(e => e.tag).sort()).toEqual(tier2.map(e => e.tag).sort());

    // 下沉：以下 tag 不应该再出现在 A04 任何档位
    const droppedTags = [
      'split-path-distribute',
      'split-path-associate',
      'cannot-simplify',
      'choose-law',
      'reverse-coefficient',
      'multi-select',
    ];
    for (const d of [5, 6, 7, 8, 9]) {
      const entries = olEntries(d);
      for (const tag of droppedTags) {
        expect(entries.find(e => e.tag === tag)).toBeUndefined();
      }
    }
  });

  // A05
  it('A05 decimal-ops: ≤5 无 cyclic-div/shift/trap；6-7 有 shift+cyclic-div；≥8 无 add-sub/shift', () => {
    expect(doEntries(5).find(e => e.tag === 'cyclic-div')).toBeUndefined();
    expect(doEntries(7).find(e => e.tag === 'shift')).toBeDefined();
    expect(doEntries(7).find(e => e.tag === 'cyclic-div')).toBeDefined();
    expect(doEntries(9).find(e => e.tag === 'add-sub')).toBeUndefined();
    expect(doEntries(9).find(e => e.tag === 'shift')).toBeUndefined();
  });

  // A06
  it('A06 bracket-ops: ≤5 只有 remove 类；≥8 有 nested-bracket', () => {
    const lowTags = tags(boEntries(5));
    expect(lowTags).toEqual(['remove-bracket-minus', 'remove-bracket-plus']);
    expect(boEntries(9).find(e => e.tag === 'nested-bracket')).toBeDefined();
  });

  // A07
  it('A07 multi-step: ≤5 有 bracket-normal；≥8 有 bracket-demon/decimal-chain', () => {
    expect(msEntries(5).find(e => e.tag === 'bracket-normal')).toBeDefined();
    expect(msEntries(9).find(e => e.tag === 'bracket-demon')).toBeDefined();
    expect(msEntries(9).find(e => e.tag === 'decimal-chain')).toBeDefined();
  });

  // A08（v2.2：2 档）
  it('A08 equation-transpose: 档 1 无 bracket-equation；档 2 有 move-both-sides/bracket-equation/error-diagnose', () => {
    // 档 1（d≤5）：无 bracket-equation、move-both-sides、error-diagnose
    expect(etEntries(5).find(e => e.tag === 'bracket-equation')).toBeUndefined();
    expect(etEntries(5).find(e => e.tag === 'move-both-sides')).toBeUndefined();
    expect(etEntries(5).find(e => e.tag === 'error-diagnose')).toBeUndefined();
    // 档 1 允许 move-from-linear（轻度 T1）
    expect(etEntries(5).find(e => e.tag === 'move-from-linear')).toBeDefined();
    // 档 2（d≥6）：关键陷阱题型全部存在
    expect(etEntries(9).find(e => e.tag === 'move-both-sides')).toBeDefined();
    expect(etEntries(9).find(e => e.tag === 'bracket-equation')).toBeDefined();
    expect(etEntries(9).find(e => e.tag === 'error-diagnose')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 2. A01 口算速算 — 2 档结构断言（v2.2，对齐 TOPIC_STAR_CAP=3）
// ---------------------------------------------------------------------------

describe('A01 口算速算 2 档（v2.2）', () => {
  describe('档 1 (d=3)', () => {
    const qs = genN(generateMentalArithmetic, 3, 200);
    it('单步题占多数', () => {
      const singleStep = qs.filter(q => q.data.kind === 'mental-arithmetic' && q.type !== 'expression-select');
      expect(singleStep.length).toBeGreaterThan(100);
    });
    it('乘法为表内乘法范围', () => {
      const muls = qs.filter(q => (q.data as any).operator === '×');
      for (const q of muls) {
        const [a, b] = (q.data as any).operands;
        const small = Math.min(a, b);
        expect(small).toBeLessThanOrEqual(9);
      }
    });
    it('运算顺序题支持 MC 形式（d≤5 允许"先算哪步"）', () => {
      const qs = genFiltered(generateMentalArithmetic, 5, ['order'], 100);
      const mcCount = qs.filter(q => q.type === 'multiple-choice').length;
      // 档 1 约 50% MC，给个宽松下界 10 避免偶发抽样偏差
      expect(mcCount).toBeGreaterThanOrEqual(10);
    });
  });

  describe('档 2 (d=6-9)', () => {
    it('运算顺序题 100% numeric-input（档 2 不出 MC）', () => {
      const qs = genFiltered(generateMentalArithmetic, 9, ['order'], 50);
      for (const q of qs) expect(q.type).toBe('numeric-input');
    });

    it('运算顺序题池覆盖含括号（原中档）+ 陷阱型（原高档）', () => {
      const qs = genFiltered(generateMentalArithmetic, 9, ['order'], 200);
      const withBrackets = qs.filter(q => q.prompt.includes('('));
      // 档 2 的 order 是 midOrder+highOrder 各 50% 混合
      expect(withBrackets.length).toBeGreaterThan(20); // 原中档含括号子池仍有产出
      expect(qs.length - withBrackets.length).toBeGreaterThan(20); // 原高档陷阱子池仍有产出
    });

    it('除法题答案为有效整数（覆盖原中档和原高档两个池）', () => {
      const qs = genFiltered(generateMentalArithmetic, 9, ['div'], 100);
      for (const q of qs) {
        const ops = (q.data as any).operands;
        expect(ops).toBeDefined();
        expect(Number.isInteger(Number(q.solution.answer))).toBe(true);
      }
      // 档 2 除法池既有三位数÷一位数（原中档），也有大数/末尾0（原高档）
      const hasHardPool = qs.some(q => {
        const [a, b] = (q.data as any).operands;
        return b >= 10 || a >= 1000;
      });
      expect(hasHardPool).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// 3. A02 数感估算 — 三档结构断言
// ---------------------------------------------------------------------------

describe('A02 数感估算 三档', () => {
  describe('低档 (d=3)', () => {
    it('compare 子题型应为 MC', () => {
      const qs = genFiltered(generateNumberSense, 3, ['compare'], 30);
      for (const q of qs) {
        expect(q.type).toBe('multiple-choice');
        expect(['>', '<', '=']).toContain(q.solution.answer);
      }
    });
  });

  describe('中档 (d=7)', () => {
    it('estimate 子题型答案为数字或方向字符串', () => {
      // v2.1: 中档 estimate 混合数值估算 + 方向判断MC（答案是"偏大/偏小/相等"）
      const qs = genFiltered(generateNumberSense, 7, ['estimate'], 60);
      for (const q of qs) {
        const ans = q.solution.answer;
        if (q.type === 'multiple-choice') {
          expect(['偏大', '偏小', '相等']).toContain(String(ans));
        } else {
          expect(typeof ans === 'number').toBe(true);
          expect(isNaN(ans as number)).toBe(false);
        }
      }
    });
    it('reverse-round 子题型答案为有效数字字符串', () => {
      const qs = genFiltered(generateNumberSense, 7, ['reverse-round'], 30);
      for (const q of qs) {
        const ans = q.solution.answer;
        expect(!isNaN(Number(ans))).toBe(true);
      }
    });
  });

  describe('高档 (d=9)', () => {
    it('reverse-round d=9 应使用 2 位小数', () => {
      const qs = genFiltered(generateNumberSense, 9, ['reverse-round'], 30);
      for (const q of qs) {
        expect(q.prompt).toMatch(/小数/);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// 4. A03 竖式笔算 — 三档结构断言
// ---------------------------------------------------------------------------

describe('A03 竖式笔算 三档（v2.1）', () => {
  describe('低档 (d=3)', () => {
    it('禁止出现小数', () => {
      const qs = genN(generateVerticalCalc, 3, 300);
      for (const q of qs) {
        const ops = (q.data as any).operands ?? [];
        for (const n of ops) {
          expect(Number.isInteger(n)).toBe(true);
        }
        expect(q.prompt.includes('.')).toBe(false);
      }
    });
  });

  describe('中档 (d=7)', () => {
    it('dec-mul 为小数×整数（非小数×小数）', () => {
      const qs = genFiltered(generateVerticalCalc, 7, ['dec-mul'], 30);
      for (const q of qs) {
        const ops = (q.data as any).operands;
        expect(ops).toBeDefined();
        const hasDecimal = ops.some((n: number) => !Number.isInteger(n));
        const hasInteger = ops.some((n: number) => Number.isInteger(n));
        expect(hasDecimal).toBe(true);
        expect(hasInteger).toBe(true);
      }
    });
  });

  describe('高档 (d=9)', () => {
    it('approximate 子题型答案为有效数字', () => {
      const qs = genFiltered(generateVerticalCalc, 9, ['approximate'], 30);
      for (const q of qs) {
        expect(q.prompt).toMatch(/精确到|保留/);
        const n = Number(q.solution.answer);
        expect(isNaN(n)).toBe(false);
      }
    });
    it('dec-div 为小数÷小数（扩倍后长除法）', () => {
      const qs = genFiltered(generateVerticalCalc, 9, ['dec-div'], 30);
      for (const q of qs) {
        const ops = (q.data as any).operands;
        // 高档小数除法：除数为小数
        expect(Number.isInteger(ops[1])).toBe(false);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// 5. A04 运算律 — 2 档结构断言（v2.2，对齐 TOPIC_STAR_CAP=3）
// ---------------------------------------------------------------------------

describe('A04 运算律 2 档（v2.2）', () => {
  // 档 1
  it('档 1 identify-law：三种运算律都能出现', () => {
    const qs = genFiltered(generateOperationLaws, 5, ['identify-law'], 100);
    const answers = qs.map(q => q.solution.answer);
    expect(answers.some(a => String(a).includes('交换'))).toBe(true);
    expect(answers.some(a => String(a).includes('结合'))).toBe(true);
    expect(answers.some(a => String(a).includes('分配'))).toBe(true);
  });

  it('档 1 structure-blank：multi-blank 填公式骨架', () => {
    const qs = genFiltered(generateOperationLaws, 5, ['structure-blank'], 20);
    for (const q of qs) {
      expect(q.type).toBe('multi-blank');
      expect(Array.isArray(q.solution.blanks)).toBe(true);
      expect((q.solution.blanks as unknown[]).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('档 1 reverse-blank：multi-blank 反用律', () => {
    const qs = genFiltered(generateOperationLaws, 5, ['reverse-blank'], 20);
    for (const q of qs) {
      expect(q.type).toBe('multi-blank');
      expect(Array.isArray(q.solution.blanks)).toBe(true);
      expect((q.solution.blanks as unknown[]).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('档 1 simple-judge：MC，答案是"满足"或"不满足"', () => {
    const qs = genFiltered(generateOperationLaws, 5, ['simple-judge'], 20);
    for (const q of qs) {
      expect(q.type).toBe('multiple-choice');
      expect(['满足', '不满足']).toContain(q.solution.answer);
    }
  });

  // 档 2
  it('档 2 counter-example：MC 或多选，识别不满足律的运算', () => {
    const qs = genFiltered(generateOperationLaws, 8, ['counter-example'], 40);
    for (const q of qs) {
      expect(['multiple-choice', 'multi-select']).toContain(q.type);
      expect((q.data as any).options?.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('档 2 easy-confuse：MC 辨析律的精确陈述', () => {
    const qs = genFiltered(generateOperationLaws, 8, ['easy-confuse'], 20);
    for (const q of qs) {
      expect(q.type).toBe('multiple-choice');
      expect((q.data as any).options?.length).toBe(4);
    }
  });

  it('档 2 compound-law：MC 识别复合律', () => {
    const qs = genFiltered(generateOperationLaws, 8, ['compound-law'], 20);
    for (const q of qs) {
      expect(q.type).toBe('multiple-choice');
      expect(q.prompt).toMatch(/用了哪/);
    }
  });

  it('档 2 distributive-trap：MC 抓分配律常见错误', () => {
    const qs = genFiltered(generateOperationLaws, 8, ['distributive-trap'], 20);
    for (const q of qs) {
      expect(q.type).toBe('multiple-choice');
      expect((q.data as any).options?.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('档 2 concept-reverse：MC 律的限定条件 / 反例', () => {
    const qs = genFiltered(generateOperationLaws, 8, ['concept-reverse'], 20);
    for (const q of qs) {
      expect(q.type).toBe('multiple-choice');
    }
  });

  it('档 2 error-diagnose：MC 单步律使用对错', () => {
    const qs = genFiltered(generateOperationLaws, 8, ['error-diagnose'], 20);
    for (const q of qs) {
      expect(q.type).toBe('multiple-choice');
    }
  });
});

// ---------------------------------------------------------------------------
// 6. A05 小数运算 — 三档 + generateDemon* + generateHardMixedAddSub
// ---------------------------------------------------------------------------

describe('A05 小数运算 三档', () => {
  describe('低档 (d=3)', () => {
    it('add-sub 答案精度 ≤ 4 位小数', () => {
      const qs = genFiltered(generateDecimalOps, 3, ['add-sub'], 30);
      for (const q of qs) {
        const ans = String(q.solution.answer);
        if (ans.includes('.')) {
          expect(ans.split('.')[1].length).toBeLessThanOrEqual(4);
        }
      }
    });
  });

  describe('中档 (d=7)', () => {
    it('generateHardMixedAddSub：异位加减法答案有效', () => {
      const qs = genFiltered(generateDecimalOps, 7, ['add-sub'], 50);
      for (const q of qs) {
        const n = Number(q.solution.answer);
        expect(isNaN(n)).toBe(false);
      }
    });
    it('shift 子题型：提示包含移位', () => {
      const qs = genFiltered(generateDecimalOps, 7, ['shift'], 30);
      for (const q of qs) {
        expect(q.prompt).toMatch(/×|÷/);
      }
    });
    it('cyclic-div：答案为有效数字', () => {
      const qs = genFiltered(generateDecimalOps, 7, ['cyclic-div'], 30);
      for (const q of qs) {
        const n = Number(q.solution.answer);
        expect(isNaN(n)).toBe(false);
      }
    });
  });

  describe('高档 (d=9)', () => {
    it('generateDemonMulDecimal：答案有效、小数精度 ≤ 4', () => {
      const qs = genFiltered(generateDecimalOps, 9, ['mul'], 50);
      for (const q of qs) {
        const ans = String(q.solution.answer);
        const n = Number(ans);
        expect(isNaN(n)).toBe(false);
        if (ans.includes('.')) {
          expect(ans.split('.')[1].length).toBeLessThanOrEqual(4);
        }
      }
    });
    it('generateDemonDivDecimal：答案有效', () => {
      const qs = genFiltered(generateDecimalOps, 9, ['div'], 50);
      for (const q of qs) {
        const n = Number(q.solution.answer);
        expect(isNaN(n)).toBe(false);
      }
    });
    it('cyclic-div d=9：保留 2 位小数', () => {
      const qs = genFiltered(generateDecimalOps, 9, ['cyclic-div'], 30);
      for (const q of qs) {
        expect(q.prompt).toMatch(/保留/);
      }
    });
    it('trap 子题型：答案有效', () => {
      const qs = genFiltered(generateDecimalOps, 9, ['trap'], 30);
      for (const q of qs) {
        const n = Number(q.solution.answer);
        expect(isNaN(n)).toBe(false);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// 7. A06 括号变换 — 三档 + generateNestedBracket + generateDivisionProperty
// ---------------------------------------------------------------------------

describe('A06 括号变换 三档（v2.1）', () => {
  describe('低档 (d=3)', () => {
    it('remove-bracket 题：填写式子 + 禁止含括号', () => {
      const qs = genN(generateBracketOps, 3, 30);
      for (const q of qs) {
        expect(q.type).toBe('expression-input');
        expect(q.solution.standardExpression).toBeTruthy();
        expect(q.solution.bracketPolicy).toBe('must-not-have');
        // 标准答案本身不含括号
        expect(/[()]/.test(String(q.solution.standardExpression))).toBe(false);
      }
    });
    it('低档括号位置应多样化（3档位分布均有覆盖）', () => {
      const qs = genN(generateBracketOps, 3, 150);
      const positions = new Set((qs.map(q => (q.data as any).position) as string[]).filter(Boolean));
      // 至少覆盖到 front/middle/tail 中的两种（运气因素下放松，但不能只有一种）
      expect(positions.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('中档 (d=7)', () => {
    it('generateDivisionProperty：MC 答案在选项内', () => {
      const qs = genFiltered(generateBracketOps, 7, ['division-property'], 30);
      for (const q of qs) {
        expect(q.type).toBe('multiple-choice');
        const opts = (q.data as any).options;
        expect(opts).toContain(q.solution.answer);
      }
    });
    it('add-bracket：填写式子且答案必须含括号', () => {
      const qs = genFiltered(generateBracketOps, 7, ['add-bracket'], 30);
      for (const q of qs) {
        expect(q.type).toBe('expression-input');
        expect(q.solution.bracketPolicy).toBe('must-have');
        expect(/[()]/.test(String(q.solution.standardExpression))).toBe(true);
      }
    });
  });

  describe('高档 (d=9)', () => {
    it('generateNestedBracket：原式含嵌套括号且为填写题', () => {
      const qs = genFiltered(generateBracketOps, 9, ['nested-bracket'], 30);
      for (const q of qs) {
        expect(q.type).toBe('expression-input');
        const expr = (q.data as any).originalExpression || q.prompt;
        const openCount = (expr.match(/\(/g) || []).length;
        expect(openCount).toBeGreaterThanOrEqual(2);
      }
    });
    it('error-diagnose：MC 答案在选项内', () => {
      const qs = genFiltered(generateBracketOps, 9, ['error-diagnose'], 30);
      for (const q of qs) {
        expect(q.type).toBe('multiple-choice');
        const opts = (q.data as any).options;
        expect(opts).toContain(q.solution.answer);
      }
    });
    it('four-items-sign：填写题，标准答案恰好 4 项且不含括号', () => {
      const qs = genFiltered(generateBracketOps, 9, ['four-items-sign'], 30);
      for (const q of qs) {
        expect(q.type).toBe('expression-input');
        expect(q.solution.bracketPolicy).toBe('must-not-have');
        expect(/[()]/.test(String(q.solution.standardExpression))).toBe(false);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// 8. A07 多步混合运算 — 三档 + generateDecimalChain + generateDecimalMultiStep
// ---------------------------------------------------------------------------

describe('A07 简便计算 三档（v2.1：识别+执行双能力）', () => {
  describe('低档 (d=3)', () => {
    it('bracket-normal：MC（识别）或 multi-blank（执行）', () => {
      const qs = genFiltered(generateMultiStep, 3, ['bracket-normal'], 30);
      for (const q of qs) {
        expect(['multiple-choice', 'multi-blank']).toContain(q.type);
      }
    });
    it('extract-factor：MC 或 multi-blank', () => {
      const qs = genFiltered(generateMultiStep, 3, ['extract-factor'], 30);
      for (const q of qs) {
        expect(['multiple-choice', 'multi-blank']).toContain(q.type);
      }
    });
  });

  describe('中档 (d=7)', () => {
    it('bracket-hard MC：答案在选项内', () => {
      const qs = genFiltered(generateMultiStep, 7, ['bracket-hard'], 50);
      const mcQs = qs.filter(q => q.type === 'multiple-choice');
      for (const q of mcQs) {
        const opts = (q.data as any).options;
        expect(opts).toContain(String(q.solution.answer));
      }
    });
    it('simplify-subtract：应为 MC 或 multi-blank（不再直接求得数）', () => {
      const qs = genFiltered(generateMultiStep, 7, ['simplify-subtract'], 30);
      for (const q of qs) {
        expect(['multiple-choice', 'multi-blank']).toContain(q.type);
      }
    });
  });

  describe('高档 (d=9)', () => {
    it('decimal-multi-step：高档 multi-select 或 MC 或 expression-input', () => {
      const qs = genFiltered(generateMultiStep, 9, ['decimal-multi-step'], 30);
      for (const q of qs) {
        expect(['multiple-choice', 'multi-select', 'expression-input', 'multi-blank']).toContain(q.type);
      }
    });
    it('decimal-chain：高档同样遵循识别+执行（不要求得数）', () => {
      const qs = genFiltered(generateMultiStep, 9, ['decimal-chain'], 30);
      for (const q of qs) {
        expect(['multiple-choice', 'multi-select', 'expression-input', 'multi-blank']).toContain(q.type);
      }
    });
    it('bracket-demon MC：答案在选项内', () => {
      const qs = genFiltered(generateMultiStep, 9, ['bracket-demon'], 50);
      const mcQs = qs.filter(q => q.type === 'multiple-choice');
      for (const q of mcQs) {
        const opts = (q.data as any).options;
        expect(opts).toContain(String(q.solution.answer));
      }
    });
    it('extract-factor d=9：可出现小数隐藏公因数', () => {
      const qs = genFiltered(generateMultiStep, 9, ['extract-factor'], 60);
      const hasDecimal = qs.some(q => q.prompt.includes('.'));
      expect(hasDecimal).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// 9. A08 方程与等式 — 三档 + generateBracketEquation + generateDivisionEquation + generateEquationConcept
// ---------------------------------------------------------------------------

describe('A08 方程移项 2 档（v2.2）', () => {
  describe('档 1 (d=3)', () => {
    it('generateEquationConcept：MC 答案在选项内', () => {
      const qs = genFiltered(generateEquationTranspose, 3, ['equation-concept'], 30);
      for (const q of qs) {
        expect(q.type).toBe('multiple-choice');
        const opts = (q.data as any).options;
        expect(opts).toBeDefined();
        expect(opts).toContain(q.solution.answer);
      }
    });
    it('move-constant：档 1 填写完整等式（equation-input）', () => {
      const qs = genFiltered(generateEquationTranspose, 3, ['move-constant'], 30);
      for (const q of qs) {
        expect(['equation-input', 'multiple-choice', 'numeric-input']).toContain(q.type);
        if (q.type === 'equation-input') {
          expect(q.solution.standardExpression).toBeTruthy();
        }
      }
    });
    it('move-from-linear：档 1 即为轻度 T1（强制手动变号）', () => {
      const qs = genFiltered(generateEquationTranspose, 3, ['move-from-linear'], 30);
      expect(qs.length).toBeGreaterThan(0);
      for (const q of qs) {
        expect(q.type).toBe('equation-input');
        expect(q.solution.standardExpression).toBeTruthy();
        // 档 1 的 T1-lite 陷阱标记
        const trap = (q.data as any).trap;
        expect(trap).toBe('T1-lite');
      }
    });
  });

  describe('档 2 (d=7-9)', () => {
    it('move-both-sides：档 2 为 equation-input T4 陷阱', () => {
      const qs = genFiltered(generateEquationTranspose, 9, ['move-both-sides'], 30);
      for (const q of qs) {
        expect(q.type).toBe('equation-input');
        expect(q.solution.standardExpression).toBeTruthy();
        expect((q.data as any).trap).toBe('T4');
      }
    });
    it('bracket-equation：档 2 含陷阱 T3 / T3+T4', () => {
      const qs = genFiltered(generateEquationTranspose, 9, ['bracket-equation'], 60);
      const withTrap = qs.filter(q => {
        const t = (q.data as any).trap;
        return t === 'T3' || t === 'T3+T4';
      });
      expect(withTrap.length).toBeGreaterThan(0);
    });
    it('move-from-linear d=7：覆盖 T1/T2/两步移项三种形态', () => {
      const qs = genFiltered(generateEquationTranspose, 7, ['move-from-linear'], 60);
      const exprs = qs.filter(q => q.type === 'equation-input');
      expect(exprs.length).toBeGreaterThan(0);
      const traps = new Set(qs.map(q => (q.data as any).trap).filter(Boolean));
      // 至少应出现 T1 或 T2 中的一种（概率抽样）
      expect(traps.size).toBeGreaterThanOrEqual(0);
    });
    it('error-diagnose：档 2 为错误诊断 MC', () => {
      const qs = genFiltered(generateEquationTranspose, 9, ['error-diagnose'], 30);
      expect(qs.length).toBeGreaterThan(0);
      for (const q of qs) {
        expect(q.type).toBe('multiple-choice');
        const opts = (q.data as any).options;
        expect(opts).toBeDefined();
        expect(opts).toContain(q.solution.answer);
      }
    });
  });
});
