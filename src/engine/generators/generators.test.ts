/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { generateMentalArithmetic } from './mental-arithmetic';
import { generateVerticalCalc } from './vertical-calc';
import { generateDecimalOps } from './decimal-ops';
import { generateMultiStep } from './multi-step';
import { generateEquationTranspose } from './equation-transpose';
import { generateNumberSense } from './number-sense';
import { generateBracketOps } from './bracket-ops';
import { generateOperationLaws } from './operation-laws';

// Helper: generate N questions and return them
function genN(fn: (p: { difficulty: number; id: string }) => any, difficulty: number, n = 50) {
  return Array.from({ length: n }, (_, i) => fn({ difficulty, id: `test-${i}` }));
}

// ==================== Mental Arithmetic ====================
// v2.1 规格：
//   低档 (d≤5): 表内乘除（整除）+ 两位数加减 + 整十整百差
//   中档 (6≤d≤7): 陷阱题（退位边界/中间含0/接近整数减法），三位数÷一位数整除
//   高档 (d≥8): 末尾0管理 + 需拆分技巧
describe('Mental Arithmetic (口算速算)', () => {
  describe('低档 (difficulty=5)', () => {
    it('C1档1-高(d=4~5)乘法应为中档函数（含多位操作数）', () => {
      const qs = genN(generateMentalArithmetic, 5, 200);
      const muls = qs.filter((q: any) => q.data.kind === 'mental-arithmetic' && q.data.operator === '×');
      expect(muls.length).toBeGreaterThan(0);
      // d=5 走 midMulMidZero，会有三位数操作数
      const hasLargerOps = muls.some((q: any) => {
        const [a] = q.data.operands;
        return a >= 100;
      });
      expect(hasLargerOps).toBe(true);
    });

    it('除法应为表内除法（整除，商为 2-9）', () => {
      const qs = genN(generateMentalArithmetic, 5, 200);
      const divs = qs.filter((q: any) => q.data.kind === 'mental-arithmetic' && q.data.operator === '÷');
      expect(divs.length).toBeGreaterThan(0);
      for (const q of divs) {
        const [a, b] = q.data.operands;
        // 整除且除数在表内范围
        expect(a % b).toBe(0);
        expect(b).toBeGreaterThanOrEqual(2);
        expect(b).toBeLessThanOrEqual(9);
        // 答案是数字，不是"商...余数"字符串
        expect(typeof q.solution.answer === 'number').toBe(true);
        expect(q.solution.answer).toBe(a / b);
      }
    });
  });

  describe('中档 (difficulty=7)', () => {
    it('乘法包含"中间含0"陷阱（如 208×5）', () => {
      const qs = genN(generateMentalArithmetic, 7, 300);
      const muls = qs.filter((q: any) => q.data.kind === 'mental-arithmetic' && q.data.operator === '×');
      expect(muls.length).toBeGreaterThan(0);
      // 至少存在一道：a 是三位数且十位为 0（即 X0Y 结构）
      const midZero = muls.filter((q: any) => {
        const a = q.data.operands[0];
        return a >= 100 && a <= 999 && Math.floor((a / 10) % 10) === 0;
      });
      expect(midZero.length).toBeGreaterThan(0);
    });

    it('除法为整除（v2.1 规格：心算题不带余数）', () => {
      const qs = genN(generateMentalArithmetic, 7, 300);
      const divs = qs.filter((q: any) => q.data.kind === 'mental-arithmetic' && q.data.operator === '÷');
      expect(divs.length).toBeGreaterThan(0);
      for (const q of divs) {
        const [a, b] = q.data.operands;
        expect(a % b).toBe(0);
        expect(typeof q.solution.answer === 'number').toBe(true);
      }
    });
  });

  describe('档 2 (difficulty=9，v2.2)', () => {
    it('乘法池包含"末尾0/拆分/基础"混合（档 2 = 原中档+原高档）', () => {
      const qs = genN(generateMentalArithmetic, 9, 300);
      const muls = qs.filter((q: any) => q.data.kind === 'mental-arithmetic' && q.data.operator === '×');
      expect(muls.length).toBeGreaterThan(0);
      const qualifying = muls.filter((q: any) => {
        const [a, b] = q.data.operands;
        const trailingZero = (a % 10 === 0) || (b % 10 === 0);
        const factorSplit = [25, 125, 75, 50].includes(a) || [25, 125, 75, 50].includes(b);
        return trailingZero || factorSplit;
      });
      // 档 2 约 50% 抽到原高档池（含末尾0/拆分），给宽松下界 20%
      expect(qualifying.length).toBeGreaterThan(muls.length * 0.2);
    });

    it('除法必须整除；档 2 覆盖原高档"非表内"池', () => {
      const qs = genN(generateMentalArithmetic, 9, 300);
      const divs = qs.filter((q: any) => q.data.kind === 'mental-arithmetic' && q.data.operator === '÷');
      expect(divs.length).toBeGreaterThan(0);
      for (const q of divs) {
        const [a, b] = q.data.operands;
        expect(a % b).toBe(0);
      }
      // 档 2 约 50% 抽到原高档池（除数≥10 或 被除数≥1000）
      const hard = divs.filter((q: any) => {
        const [a, b] = q.data.operands;
        return b >= 10 || a >= 1000;
      });
      expect(hard.length).toBeGreaterThan(divs.length * 0.2);
    });
  });

  describe('Operation Order (运算顺序)', () => {
    it('difficulty≤5 应生成运算顺序题', () => {
      const qs = genN(generateMentalArithmetic, 5, 300);
      const orderQs = qs.filter(q => q.data.kind === 'multi-step');
      expect(orderQs.length).toBeGreaterThan(0);
    });

    it('运算顺序题的表达式应包含至少两种运算符', () => {
      const qs = genN(generateMentalArithmetic, 5, 300);
      const orderQs = qs.filter(q => q.data.kind === 'multi-step');
      for (const q of orderQs) {
        const ops = q.data.expression.match(/[+\-×÷]/g) || [];
        expect(ops.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('数值答案应为有效数字', () => {
      const qs = genN(generateMentalArithmetic, 5, 300);
      const orderQs = qs.filter(q => q.data.kind === 'multi-step' && q.type === 'numeric-input');
      for (const q of orderQs) {
        expect(isNaN(Number(q.solution.answer))).toBe(false);
      }
    });

    it('MC题答案必须在选项内', () => {
      const qs = genN(generateMentalArithmetic, 5, 300);
      const mcQs = qs.filter(q => q.data.kind === 'multi-step' && q.type === 'multiple-choice');
      for (const q of mcQs) {
        const opts = (q.data as any).options as string[];
        expect(opts).toContain(String(q.solution.answer));
      }
    });

    it('C1 档2-低(d=6~7)运算顺序题只用含括号子池（orderMid）', () => {
      const qs = genN(generateMentalArithmetic, 7, 300);
      const orderQs = qs.filter(q => q.data.kind === 'multi-step');
      expect(orderQs.length).toBeGreaterThan(0);
      const withBrackets = orderQs.filter(q => q.data.expression.includes('('));
      // d=6~7 只走 orderMid，全部含括号
      expect(withBrackets.length).toBe(orderQs.length);
    });

    it('档 2 (d≥6) 运算顺序题全部 numeric-input（MC 仅在档 1）', () => {
      const qs = genN(generateMentalArithmetic, 9, 300);
      const orderQs = qs.filter(q => q.data.kind === 'multi-step');
      for (const q of orderQs) {
        expect(q.type).toBe('numeric-input');
      }
    });
  });

  it('单步口算答案与正确计算一致（v2.1：除法整除，直接给数字答案）', () => {
    for (const d of [5, 7, 9]) {
      const qs = genN(generateMentalArithmetic, d, 100);
      const basicQs = qs.filter(q => q.data.kind === 'mental-arithmetic');
      for (const q of basicQs) {
        const [a, b] = q.data.operands;
        const op = q.data.operator;
        let expected: number;
        if (op === '+') expected = a + b;
        else if (op === '-') expected = a - b;
        else if (op === '×') expected = a * b;
        else {
          expect(a % b).toBe(0);
          expected = a / b;
        }
        expect(q.solution.answer).toBe(expected);
      }
    }
  });
});

// ==================== Vertical Calc ====================
describe('Vertical Calc (竖式笔算)', () => {
  describe('Normal (difficulty=5)', () => {
    it('应包含除法题 (numeric-input)', () => {
      const qs = genN(generateVerticalCalc, 5, 100);
      const divs = qs.filter(q => q.data.operation === '÷');
      expect(divs.length).toBeGreaterThan(0);
      for (const q of divs) {
        expect(q.type).toBe('numeric-input');
      }
    });
  });

  describe('Hard (difficulty=7)', () => {
    it('应包含 3位×2位 乘法（多位乘法竖式板）', () => {
      const qs = genN(generateVerticalCalc, 7, 200);
      const bigMuls = qs.filter(q => {
        if (q.data.operation !== '×') return false;
        const [, b] = q.data.operands;
        return b >= 10;
      });
      expect(bigMuls.length).toBeGreaterThan(0);
      for (const q of bigMuls) {
        expect(q.type).toBe('vertical-fill');
        expect(q.data.multiplicationBoard).toMatchObject({
          mode: 'integer',
          operandInputMode: 'static',
        });
      }
    });

    it('应包含除法题', () => {
      const qs = genN(generateVerticalCalc, 7, 200);
      const divs = qs.filter(q => q.data.operation === '÷');
      expect(divs.length).toBeGreaterThan(0);
    });
  });

  describe('Demon (difficulty=10)', () => {
    it('乘法应为 3~4位×2位（整数版）', () => {
      const qs = genN(generateVerticalCalc, 10, 200);
      const muls = qs.filter(q => q.data.operation === '×' && q.type === 'vertical-fill' &&
        Number.isInteger(q.data.operands[0]) && Number.isInteger(q.data.operands[1]));
      expect(muls.length).toBeGreaterThan(0);
      for (const q of muls) {
        const [a, b] = q.data.operands;
        expect(a).toBeGreaterThanOrEqual(100);
        expect(b).toBeGreaterThanOrEqual(11);
        expect(b).toBeLessThanOrEqual(99);
        expect(q.data.multiplicationBoard).toMatchObject({
          mode: 'integer',
          operandInputMode: 'static',
        });
      }
    });

    it('除法以小数÷小数为主（v2.1：高档整数除法已移出）', () => {
      const qs = genN(generateVerticalCalc, 10, 200);
      const divs = qs.filter(q => q.data.operation === '÷');
      expect(divs.length).toBeGreaterThan(0);
      // 除数是小数的比例应占多数（取近似题里的除法也可能是整数÷整数）
      const decDivisor = divs.filter(q => !Number.isInteger(q.data.operands[1]));
      expect(decDivisor.length).toBeGreaterThan(0);
    });
  });

  it('所有答案正确', () => {
    for (const d of [5, 7, 10]) {
      const qs = genN(generateVerticalCalc, d, 100);
      for (const q of qs) {
        // 跳过小数题（operands 含小数、有 decimalPlaces、有 trainingFields、答案是小数字符串）
        const [a, b] = q.data.operands;
        if (!Number.isInteger(a) || !Number.isInteger(b)) continue;
        if (q.data.decimalPlaces != null) continue;
        if (q.data.trainingFields != null) continue;
        if (q.prompt.includes('精确到') || q.prompt.includes('保留')) continue;
        if (typeof q.solution.answer === 'string' && q.solution.answer.includes('.')) continue;
        const op = q.data.operation;
        let expected: number;
        if (op === '+') expected = a + b;
        else if (op === '-') expected = a - b;
        else if (op === '×') expected = a * b;
        else expected = Math.floor(a / b);
        expect(q.solution.answer).toBe(expected);
      }
    }
  });
});

// ==================== Decimal Ops ====================
describe('Decimal Ops (小数计算)', () => {
  describe('Normal (difficulty=5)', () => {
    it('应包含小数×整数', () => {
      const qs = genN(generateDecimalOps, 5, 100);
      const muls = qs.filter(q => q.data.subtype === 'mul');
      expect(muls.length).toBeGreaterThan(0);
    });

    it('应包含小数÷整数', () => {
      const qs = genN(generateDecimalOps, 5, 100);
      const divs = qs.filter(q => q.data.subtype === 'div');
      expect(divs.length).toBeGreaterThan(0);
    });

    it('应包含加减法', () => {
      const qs = genN(generateDecimalOps, 5, 100);
      const addSubs = qs.filter(q => q.data.subtype === 'add-sub');
      expect(addSubs.length).toBeGreaterThan(0);
    });
  });

  describe('Hard (difficulty=7)', () => {
    it('应包含小数×小数', () => {
      const qs = genN(generateDecimalOps, 7, 200);
      const muls = qs.filter(q => q.data.subtype === 'mul');
      expect(muls.length).toBeGreaterThan(0);
      // Check some have decimal × decimal (both operands have decimal points)
      const decMuls = muls.filter(q => {
        const parts = q.data.expression.split('×').map((s: string) => s.trim());
        return parts.every((p: string) => p.includes('.'));
      });
      expect(decMuls.length).toBeGreaterThan(0);
    });

    it('应包含小数÷小数', () => {
      const qs = genN(generateDecimalOps, 7, 200);
      const divs = qs.filter(q => q.data.subtype === 'div');
      expect(divs.length).toBeGreaterThan(0);
      // Check some have decimal divisors
      const decDivs = divs.filter(q => {
        const parts = q.data.expression.split('÷').map((s: string) => s.trim());
        return parts[1] && parts[1].includes('.');
      });
      expect(decDivs.length).toBeGreaterThan(0);
    });

    it('应包含少量 <1×<1 陷阱题', () => {
      const qs = genN(generateDecimalOps, 7, 500);
      const traps = qs.filter(q => {
        if (q.data.subtype !== 'mul') return false;
        const parts = q.data.expression.split('×').map((s: string) => parseFloat(s.trim()));
        return parts.every((p: number) => p < 1 && p > 0);
      });
      expect(traps.length).toBeGreaterThan(0);
    });
  });

  describe('Demon (difficulty=10)', () => {
    it('应包含复杂小数×小数', () => {
      const qs = genN(generateDecimalOps, 10, 100);
      const muls = qs.filter(q => q.data.subtype === 'mul');
      expect(muls.length).toBeGreaterThan(0);
    });

    it('应包含复杂小数÷小数', () => {
      const qs = genN(generateDecimalOps, 10, 100);
      const divs = qs.filter(q => q.data.subtype === 'div');
      expect(divs.length).toBeGreaterThan(0);
    });
  });

  it('所有答案无浮点精度问题', () => {
    for (const d of [5, 7, 10]) {
      const qs = genN(generateDecimalOps, d, 200);
      for (const q of qs) {
        // 跳过大小比较题（答案是 >/</= 而非数字）
        if (q.data.subtype === 'compare') continue;
        const ansStr = String(q.solution.answer);
        // Answer should not have excessive decimal places (max 4)
        if (ansStr.includes('.')) {
          const dp = ansStr.split('.')[1].length;
          expect(dp).toBeLessThanOrEqual(4);
        }
        // Answer should be a valid number
        expect(isNaN(Number(ansStr))).toBe(false);
      }
    }
  });
});

// ==================== Multi-Step ====================
describe('Multi-Step (多步计算)', () => {
  describe('Normal (difficulty=5)', () => {
    it('所有题目应为简便计算题型（非纯按序计算）', () => {
      const qs = genN(generateMultiStep, 5, 200);
      // 确认不再生成纯两步按序计算
      // 注意: generateDecimalTwoStep 的 explanation 也含"先乘除后加减"，
      // 但 formatNum 可能去掉 .0 导致表达式看似无小数，允许少量误报
      const pureTwoStep = qs.filter(q => {
        const explanation = String(q.solution.explanation || '');
        return explanation.includes('先乘除后加减') && !q.data.expression.includes('.');
      });
      expect(pureTwoStep.length).toBeLessThanOrEqual(5);
    });

    // v2.1：低档以识别（MC）+ 执行（multi-blank）为主
    it('低档应混合 MC 识别 与 multi-blank 执行', () => {
      const qs = genN(generateMultiStep, 5, 200);
      const mcs = qs.filter(q => q.type === 'multiple-choice');
      const mbs = qs.filter(q => q.type === 'multi-blank');
      expect(mcs.length).toBeGreaterThan(0);
      expect(mbs.length).toBeGreaterThan(0);
    });

    it('低档 multi-blank 答案为数字数组', () => {
      const qs = genN(generateMultiStep, 5, 200);
      const mbs = qs.filter(q => q.type === 'multi-blank');
      for (const q of mbs) {
        expect(Array.isArray(q.solution.blanks)).toBe(true);
        expect((q.solution.blanks as any[]).length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('Hard (difficulty=7)', () => {
    it('中档包含 MC（识别/方法）与 multi-blank（拆分路径）', () => {
      const qs = genN(generateMultiStep, 7, 200);
      const mcs = qs.filter(q => q.type === 'multiple-choice');
      const mbs = qs.filter(q => q.type === 'multi-blank');
      expect(mcs.length).toBeGreaterThan(0);
      expect(mbs.length).toBeGreaterThan(0);
    });

    it('选择题答案必须包含在选项内', () => {
      const qs = genN(generateMultiStep, 7, 100);
      const mcs = qs.filter(q => q.type === 'multiple-choice');
      expect(mcs.length).toBeGreaterThan(0);
      for (const q of mcs) {
        const opts = (q.data as any).options as string[];
        expect(opts).toContain(String(q.solution.answer));
      }
    });

    it('选择题选项恰好4个且互不相同', () => {
      const qs = genN(generateMultiStep, 7, 100);
      const mcs = qs.filter(q => q.type === 'multiple-choice');
      for (const q of mcs) {
        const opts = (q.data as any).options as string[];
        expect(opts.length).toBe(4);
        expect(new Set(opts).size).toBe(4);
      }
    });
  });

  describe('Demon (difficulty=10)', () => {
    it('高档应含 multi-select 识别题', () => {
      const qs = genN(generateMultiStep, 10, 200);
      const multis = qs.filter(q => q.type === 'multi-select');
      expect(multis.length).toBeGreaterThan(0);
    });

    it('高档应含错误诊断 MC（"哪步错了"）', () => {
      const qs = genN(generateMultiStep, 10, 200);
      const diagnose = qs.filter(q => (q.data as any).subtype === 'error-diagnose');
      expect(diagnose.length).toBeGreaterThan(0);
    });

    it('高档应含 expression-input 隐藏公因数统一题', () => {
      const qs = genN(generateMultiStep, 10, 200);
      const exprs = qs.filter(q => q.type === 'expression-input');
      expect(exprs.length).toBeGreaterThan(0);
    });

    it('魔王选择题答案在选项内', () => {
      const qs = genN(generateMultiStep, 10, 100);
      const mcs = qs.filter(q => q.type === 'multiple-choice');
      expect(mcs.length).toBeGreaterThan(0);
      for (const q of mcs) {
        const opts = (q.data as any).options as string[];
        expect(opts).toContain(String(q.solution.answer));
      }
    });
  });

  it('v2.1：A07 不再产生纯 numeric-input 得数题', () => {
    for (const d of [5, 7, 10]) {
      const qs = genN(generateMultiStep, d, 200);
      const numericOnly = qs.filter(q => q.type === 'numeric-input');
      expect(numericOnly.length).toBe(0);
    }
  });
});

// ==================== Decimal Ops - Compare Size ====================
describe('Decimal Ops - Compare Size (大小比较)', () => {
  it('应在 difficulty≤5 时生成大小比较题', () => {
    const qs = genN(generateDecimalOps, 5, 300);
    const compareQs = qs.filter((q: any) => q.data.subtype === 'compare');
    expect(compareQs.length).toBeGreaterThan(0);
  });

  it('大小比较题应为 multiple-choice 类型', () => {
    const qs = genN(generateDecimalOps, 5, 300);
    const compareQs = qs.filter((q: any) => q.data.subtype === 'compare');
    for (const q of compareQs) {
      expect(q.type).toBe('multiple-choice');
    }
  });

  it('答案必须是 >、< 或 = 之一', () => {
    const qs = genN(generateDecimalOps, 5, 500);
    const compareQs = qs.filter((q: any) => q.data.subtype === 'compare');
    for (const q of compareQs) {
      expect(['>', '<', '=']).toContain(String(q.solution.answer));
    }
  });

  it('选项必须包含 >、< 和 =', () => {
    const qs = genN(generateDecimalOps, 5, 300);
    const compareQs = qs.filter((q: any) => q.data.subtype === 'compare');
    for (const q of compareQs) {
      const opts = q.data.options as string[];
      expect(opts).toContain('>');
      expect(opts).toContain('<');
      expect(opts).toContain('=');
      expect(opts.length).toBe(3);
    }
  });

  it('三种答案应都能出现', () => {
    const qs = genN(generateDecimalOps, 5, 600);
    const compareQs = qs.filter((q: any) => q.data.subtype === 'compare');
    const answers = new Set(compareQs.map((q: any) => String(q.solution.answer)));
    expect(answers.has('>')).toBe(true);
    expect(answers.has('<')).toBe(true);
    expect(answers.has('=')).toBe(true);
  });
});

// ==================== Decimal Ops - Cyclic Division ====================
describe('Decimal Ops - Cyclic Division (循环小数除法)', () => {
  it('应在 difficulty≥6 时生成循环小数除法题', () => {
    const qs = genN(generateDecimalOps, 7, 400);
    const cyclicQs = qs.filter((q: any) =>
      q.prompt.includes('保留') && q.data.subtype === 'div'
    );
    expect(cyclicQs.length).toBeGreaterThan(0);
  });

  it('循环小数除法题应为 numeric-input 类型', () => {
    const qs = genN(generateDecimalOps, 7, 400);
    const cyclicQs = qs.filter((q: any) =>
      q.prompt.includes('保留') && q.data.subtype === 'div'
    );
    for (const q of cyclicQs) {
      expect(q.type).toBe('numeric-input');
    }
  });

  it('答案应为有效数字', () => {
    const qs = genN(generateDecimalOps, 7, 400);
    const cyclicQs = qs.filter((q: any) =>
      q.prompt.includes('保留') && q.data.subtype === 'div'
    );
    for (const q of cyclicQs) {
      expect(isNaN(Number(q.solution.answer))).toBe(false);
    }
  });
});

// ==================== Equation Transpose ====================
describe('Equation Transpose (方程与等式)', () => {
  describe('Bracket Equations (含括号方程, v2.1)', () => {
    it('difficulty≥6 应能生成含括号方程（equation-input 或 numeric-input）', () => {
      const qs = genN(generateEquationTranspose, 7, 400);
      const bracketQs = qs.filter((q: any) => q.data.equation?.includes('('));
      expect(bracketQs.length).toBeGreaterThan(0);
    });

    it('含括号方程：numeric 答案为有效数字，expression 提供 standardExpression', () => {
      const qs = genN(generateEquationTranspose, 7, 400);
      const bracketQs = qs.filter((q: any) => q.data.equation?.includes('('));
      for (const q of bracketQs) {
        if (q.type === 'numeric-input') {
          expect(isNaN(Number(q.solution.answer))).toBe(false);
        } else if (q.type === 'equation-input') {
          expect(q.solution.standardExpression).toBeTruthy();
        }
      }
    });
  });

  describe('v2.1 低档主流为 equation-input 填写完整等式', () => {
    it('低档（d=3）equation-input 比例应显著', () => {
      const qs = genN(generateEquationTranspose, 3, 400);
      const exprInput = qs.filter((q: any) => q.type === 'equation-input');
      expect(exprInput.length).toBeGreaterThan(qs.length * 0.3);
    });

    it('equation-input 必须提供 variable 与 standardExpression', () => {
      const qs = genN(generateEquationTranspose, 3, 200);
      const exprInput = qs.filter((q: any) => q.type === 'equation-input');
      for (const q of exprInput) {
        expect(q.solution.variable).toBeTruthy();
        expect(q.solution.standardExpression).toBeTruthy();
      }
    });
  });

  describe('v2.1 高档陷阱覆盖', () => {
    it('高档（d=9）应出现 T3 / T4 / T3+T4 陷阱标记', () => {
      const qs = genN(generateEquationTranspose, 9, 400);
      const traps = qs.map((q: any) => q.data?.trap).filter(Boolean);
      const unique = new Set(traps);
      expect(unique.size).toBeGreaterThan(0);
    });
  });
});

// ==================== Number Sense - Compare ====================
describe('Number Sense - Compare (大小比较判断)', () => {
  it('应生成大小比较判断题', () => {
    const qs = genN(generateNumberSense, 5, 400);
    const compareQs = qs.filter((q: any) => q.data.subtype === 'compare');
    expect(compareQs.length).toBeGreaterThan(0);
  });

  it('大小比较题应为 multiple-choice 类型', () => {
    const qs = genN(generateNumberSense, 5, 400);
    const compareQs = qs.filter((q: any) => q.data.subtype === 'compare');
    for (const q of compareQs) {
      expect(q.type).toBe('multiple-choice');
    }
  });

  it('答案必须是 >、< 或 = 之一', () => {
    const qs = genN(generateNumberSense, 5, 600);
    const compareQs = qs.filter((q: any) => q.data.subtype === 'compare');
    for (const q of compareQs) {
      expect(['>', '<', '=']).toContain(String(q.solution.answer));
    }
  });

  it('选项必须包含 >、< 和 =', () => {
    const qs = genN(generateNumberSense, 5, 400);
    const compareQs = qs.filter((q: any) => q.data.subtype === 'compare');
    for (const q of compareQs) {
      const opts = q.data.options as string[];
      expect(opts).toEqual(['>', '<', '=']);
    }
  });
});

// ==================== A05 Phase 2: Shift + Special Values ====================
describe('Decimal Ops - Shift Extension (小数点左移)', () => {
  it('difficulty 6-7 应生成左移题（×0.1 或 ×0.01）', () => {
    const qs = genN(generateDecimalOps, 7, 500);
    const shiftQs = qs.filter((q: any) => q.data.subtype === 'shift');
    const leftShifts = shiftQs.filter((q: any) =>
      q.data.expression.includes('× 0.1') || q.data.expression.includes('× 0.01') || q.data.expression.includes('× 0.001')
    );
    expect(leftShifts.length).toBeGreaterThan(0);
  });

  it('左移题答案应为有效数字', () => {
    const qs = genN(generateDecimalOps, 7, 500);
    const leftShifts = qs.filter((q: any) =>
      q.data.subtype === 'shift' && (q.data.expression.includes('× 0.1') || q.data.expression.includes('× 0.01'))
    );
    for (const q of leftShifts) {
      expect(isNaN(Number(q.solution.answer))).toBe(false);
    }
  });
});

describe('Decimal Ops - Special Values (特殊值)', () => {
  it('C1 档1-低(d=3)应偶尔生成特殊值乘法（如 0.125×8）', () => {
    // C1规范化后：特殊值只在 d=3 生成，d=4~5 改为方向辨析/连续移位
    const qs = genN(generateDecimalOps, 3, 600);
    const specials = qs.filter((q: any) =>
      q.data.subtype === 'mul' && q.solution.explanation.includes('特殊值')
    );
    expect(specials.length).toBeGreaterThan(0);
  });

  it('C1 档1-高(d=4~5)mul 应生成方向辨析或连续移位题', () => {
    const qs = genN(generateDecimalOps, 4, 400);
    const mulQs = qs.filter((q: any) => q.data.subtype === 'mul');
    expect(mulQs.length).toBeGreaterThan(0);
    // d=4 的乘法题应包含 0.1 或 0.01 或 × m ÷ n 形式（方向辨析/连续移位）
    const hasDirection = mulQs.some((q: any) =>
      q.data.expression.includes('0.1') || q.data.expression.includes('÷')
    );
    expect(hasDirection).toBe(true);
  });
});

// ==================== A06 Phase 2: 4-item + Division Property ====================
describe('Bracket Ops - 4-item Extension (四项括号变换)', () => {
  it('difficulty≥6 应生成四项括号变换题', () => {
    const qs = genN(generateBracketOps, 7, 400);
    const fourItems = qs.filter((q: any) => {
      const expr = q.data.originalExpression;
      const ops = expr.match(/[+\-]/g) || [];
      return ops.length >= 3;
    });
    expect(fourItems.length).toBeGreaterThan(0);
  });
});

describe('Bracket Ops - Division Property (除法性质)', () => {
  it('difficulty≥6 应生成除法性质题', () => {
    const qs = genN(generateBracketOps, 7, 400);
    const divProps = qs.filter((q: any) => q.data.subtype === 'division-property');
    expect(divProps.length).toBeGreaterThan(0);
  });

  it('除法性质题选项应包含正确答案', () => {
    const qs = genN(generateBracketOps, 7, 400);
    const divProps = qs.filter((q: any) => q.data.subtype === 'division-property');
    for (const q of divProps) {
      const opts = q.data.options as string[];
      expect(opts).toContain(String(q.solution.answer));
    }
  });
});

describe('Bracket Ops v2.1 - 答题形式', () => {
  it('低档（d=3）全部为 expression-input（填写式子）', () => {
    const qs = genN(generateBracketOps, 3, 60);
    for (const q of qs) {
      expect(q.type).toBe('expression-input');
    }
  });

  it('高档（d=9）同时含 expression-input 与 multiple-choice', () => {
    const qs = genN(generateBracketOps, 9, 200);
    const exprs = qs.filter(q => q.type === 'expression-input');
    const mcs = qs.filter(q => q.type === 'multiple-choice');
    expect(exprs.length).toBeGreaterThan(0);
    expect(mcs.length).toBeGreaterThan(0);
  });
});

// ==================== A01 Phase 2: Extended Ranges ====================
describe('Mental Arithmetic - Extended Ranges (整十整百运算)', () => {
  it('C1 档1-高(d=4~5)应稳定生成三位数运算（midAdd/midSub）', () => {
    const qs = genN(generateMentalArithmetic, 5, 200);
    const singleStep = qs.filter((q: any) => q.data.kind !== 'multi-step');
    const addSubQs = singleStep.filter((q: any) =>
      q.data.operator === '+' || q.data.operator === '-'
    );
    expect(addSubQs.length).toBeGreaterThan(0);
    // d=5 全走 midAdd/midSub，100% 应有三位数操作数
    const threeDigit = addSubQs.filter((q: any) => {
      const ops = q.data.operands as number[];
      return ops.some((n: number) => n >= 100);
    });
    expect(threeDigit.length).toBeGreaterThan(addSubQs.length * 0.8);
  });

  it('C1 档1-低(d=2~3)整十整百运算来自 lowAdd，不强制 d=5 为整十整百', () => {
    // d=3 时仍走 lowAdd（d≤3），包含 25% 整十整百
    const qs = genN(generateMentalArithmetic, 3, 300);
    const singleStep = qs.filter((q: any) => q.data.kind !== 'multi-step');
    const addQs = singleStep.filter((q: any) => q.data.operator === '+');
    const roundNums = addQs.filter((q: any) => {
      const ops = q.data.operands as number[];
      return ops.some((n: number) => n >= 10 && n % 10 === 0);
    });
    expect(roundNums.length).toBeGreaterThan(0); // lowAdd 25% 是整十整百
  });
});

// ==================== A07 Phase 2: Hidden Factor + Decimal ====================
describe('Multi-Step v2.1 - 识别力（Recognize）', () => {
  it('低档应能生成"哪道可以凑整简便"识别题', () => {
    const qs = genN(generateMultiStep, 5, 300);
    const recognize = qs.filter((q: any) => q.data.subtype === 'recognize-simplifiable');
    expect(recognize.length).toBeGreaterThan(0);
  });

  it('中档应能生成"哪道不能简便"/"用什么律"识别题', () => {
    const qs = genN(generateMultiStep, 7, 400);
    const recognize = qs.filter((q: any) =>
      q.data.subtype === 'recognize-not-simplifiable' ||
      q.data.subtype === 'recognize-method'
    );
    expect(recognize.length).toBeGreaterThan(0);
  });
});

describe('Multi-Step v2.1 - 执行力（Execute）填空模板', () => {
  it('低档应能生成凑整拆分 multi-blank 模板', () => {
    const qs = genN(generateMultiStep, 5, 300);
    const mbs = qs.filter((q: any) => q.type === 'multi-blank' && q.data.subtype === 'fill-split-low');
    expect(mbs.length).toBeGreaterThan(0);
    for (const q of mbs) {
      expect((q.solution.blanks as any[]).length).toBe(2);
    }
  });

  it('中档应能生成发现拆分路径 multi-blank 题', () => {
    const qs = genN(generateMultiStep, 7, 400);
    const mbs = qs.filter((q: any) => q.type === 'multi-blank' && q.data.subtype === 'fill-split-mid');
    expect(mbs.length).toBeGreaterThan(0);
  });
});

// ==================== A04 Phase 3: Law Identification ====================
describe('Operation Laws - Identification (运算律类型识别)', () => {
  it('应生成运算律识别题', () => {
    const qs = genN(generateOperationLaws, 5, 400);
    const idQs = qs.filter((q: any) => q.prompt.includes('运用了什么运算律'));
    expect(idQs.length).toBeGreaterThan(0);
  });

  it('运算律识别题应为 multiple-choice 类型', () => {
    const qs = genN(generateOperationLaws, 5, 400);
    const idQs = qs.filter((q: any) => q.prompt.includes('运用了什么运算律'));
    for (const q of idQs) {
      expect(q.type).toBe('multiple-choice');
    }
  });

  it('答案必须是三种运算律之一', () => {
    const qs = genN(generateOperationLaws, 5, 400);
    const idQs = qs.filter((q: any) => q.prompt.includes('运用了什么运算律'));
    for (const q of idQs) {
      expect(['交换律', '结合律', '分配律']).toContain(String(q.solution.answer));
    }
  });

  it('三种运算律答案应都能出现', () => {
    const qs = genN(generateOperationLaws, 5, 600);
    const idQs = qs.filter((q: any) => q.prompt.includes('运用了什么运算律'));
    const answers = new Set(idQs.map((q: any) => String(q.solution.answer)));
    expect(answers.size).toBe(3);
  });
});

// ==================== A08 Phase 3: Equation Concept ====================
describe('Equation Transpose - Concept (方程概念判断)', () => {
  it('应生成方程概念判断题', () => {
    const qs = genN(generateEquationTranspose, 5, 400);
    const conceptQs = qs.filter((q: any) =>
      q.prompt.includes('方程') && q.type === 'multiple-choice' && !q.prompt.includes('解方程')
    );
    expect(conceptQs.length).toBeGreaterThan(0);
  });

  it('方程概念题应为 multiple-choice 类型', () => {
    const qs = genN(generateEquationTranspose, 5, 400);
    const conceptQs = qs.filter((q: any) =>
      q.prompt.includes('方程') && q.type === 'multiple-choice' && !q.prompt.includes('解方程')
    );
    for (const q of conceptQs) {
      expect(q.type).toBe('multiple-choice');
    }
  });

  it('方程概念题选项应包含正确答案', () => {
    const qs = genN(generateEquationTranspose, 5, 400);
    const conceptQs = qs.filter((q: any) =>
      q.prompt.includes('方程') && q.type === 'multiple-choice' && !q.prompt.includes('解方程')
    );
    for (const q of conceptQs) {
      const opts = q.data.options as string[];
      expect(opts).toContain(String(q.solution.answer));
    }
  });
});

// ==================== A02 Phase 3: Floor/Ceil + Reverse ====================
describe('Number Sense - Floor/Ceil (去尾法/进一法)', () => {
  it('应生成去尾法或进一法情景题', () => {
    const qs = genN(generateNumberSense, 7, 500);
    const fcQs = qs.filter((q: any) =>
      q.data.subtype === 'round' &&
      (q.prompt.includes('至少') || q.prompt.includes('最多')) &&
      !q.prompt.includes('四舍五入')
    );
    expect(fcQs.length).toBeGreaterThan(0);
  });

  it('去尾法/进一法答案应为有效数字', () => {
    const qs = genN(generateNumberSense, 7, 500);
    const fcQs = qs.filter((q: any) =>
      q.data.subtype === 'round' &&
      (q.prompt.includes('至少') || q.prompt.includes('最多')) &&
      !q.prompt.includes('四舍五入')
    );
    for (const q of fcQs) {
      expect(isNaN(Number(q.solution.answer))).toBe(false);
    }
  });

  it('低档(d=4~5)不生成含小数除法的复杂情景', () => {
    const qs = genN((p) => generateNumberSense({ ...p, subtypeFilter: 'floor-ceil' }), 4, 200);
    for (const q of qs) {
      // 简单情景池：整数÷整数，答案≤20
      expect(Number(q.solution.answer)).toBeLessThanOrEqual(20);
    }
  });
});

describe('Number Sense - Reverse Round (逆向推理)', () => {
  it('应生成逆向推理题', () => {
    const qs = genN(generateNumberSense, 7, 500);
    const revQs = qs.filter((q: any) =>
      q.prompt.includes('最大') || q.prompt.includes('最小')
    );
    expect(revQs.length).toBeGreaterThan(0);
  });

  it('逆向推理答案应为有效数字', () => {
    const qs = genN(generateNumberSense, 7, 500);
    const revQs = qs.filter((q: any) =>
      q.prompt.includes('最大') || q.prompt.includes('最小')
    );
    for (const q of revQs) {
      expect(isNaN(Number(q.solution.answer))).toBe(false);
    }
  });
});

// ==================== A03 Decimal Support (v2.1：小数从中档起) ====================
describe('Vertical Calc - Decimal Add/Sub (小数加减法)', () => {
  it('中档应生成小数加减法题', () => {
    const qs = genN(generateVerticalCalc, 7, 400);
    const decAddSub = qs.filter((q: any) =>
      q.type === 'vertical-fill' && q.data.decimalPlaces != null &&
      (q.data.operation === '+' || q.data.operation === '-')
    );
    expect(decAddSub.length).toBeGreaterThan(0);
  });

  it('小数加减法答案应为有效数字', () => {
    const qs = genN(generateVerticalCalc, 7, 400);
    const decAddSub = qs.filter((q: any) =>
      q.type === 'vertical-fill' && q.data.decimalPlaces != null &&
      (q.data.operation === '+' || q.data.operation === '-')
    );
    for (const q of decAddSub) {
      expect(isNaN(Number(q.solution.answer))).toBe(false);
    }
  });
});

describe('Vertical Calc - Decimal Mul (小数乘法)', () => {
  it('中档应生成小数×整数乘法竖式题', () => {
    const qs = genN(generateVerticalCalc, 7, 400);
    const decMul = qs.filter((q: any) =>
      q.type === 'vertical-fill' && q.prompt.includes('列竖式计算') &&
      q.data.operation === '×' &&
      (q.data.operands[0] % 1 !== 0 || q.data.operands[1] % 1 !== 0)
    );
    expect(decMul.length).toBeGreaterThan(0);
    for (const q of decMul) {
      expect(q.data.multiplicationBoard).toMatchObject({
        mode: 'decimal',
        operandInputMode: 'blank',
      });
      expect(q.data.multiplicationBoard.decimalPlaces).toBeGreaterThan(0);
      expect(q.data.trainingFields).toBeUndefined();
    }
  });

  it('高档应生成小数×小数乘法竖式题', () => {
    const qs = genN(generateVerticalCalc, 9, 400);
    const decMul = qs.filter((q: any) =>
      q.type === 'vertical-fill' &&
      q.data.operation === '×' &&
      q.data.multiplicationBoard?.mode === 'decimal' &&
      q.data.operands[0] % 1 !== 0 &&
      q.data.operands[1] % 1 !== 0
    );
    expect(decMul.length).toBeGreaterThan(0);
    for (const q of decMul) {
      expect(q.data.multiplicationBoard.operandInputMode).toBe('blank');
      expect(q.data.trainingFields).toBeUndefined();
    }
  });
});

describe('Vertical Calc - Decimal Div (小数除法)', () => {
  it('中档应生成小数÷整数除法题', () => {
    const qs = genN(generateVerticalCalc, 7, 400);
    const decDiv = qs.filter((q: any) =>
      q.type === 'numeric-input' && q.prompt.includes('列竖式计算') &&
      q.data.operation === '÷' &&
      (q.data.operands[0] % 1 !== 0 || q.data.operands[1] % 1 !== 0)
    );
    expect(decDiv.length).toBeGreaterThan(0);
  });

  it('高档应生成除数是小数的除法题', () => {
    const qs = genN(generateVerticalCalc, 9, 400);
    const decDivDecDivisor = qs.filter((q: any) =>
      q.type === 'numeric-input' && q.data.operation === '÷' &&
      q.data.operands[1] % 1 !== 0
    );
    expect(decDivDecDivisor.length).toBeGreaterThan(0);
  });

  it('高档 dec-div 不应残留隐藏 trainingFields（ISSUE-059）', () => {
    const qs = genN(generateVerticalCalc, 9, 400);
    const highDecDivs = qs.filter((q: any) =>
      q.type === 'numeric-input' &&
      q.data.operation === '÷' &&
      q.data.operands[1] % 1 !== 0 &&
      q.solution.steps?.some((step: string) => step.includes('除数是小数'))
    );
    expect(highDecDivs.length).toBeGreaterThan(0);
    for (const q of highDecDivs) {
      expect(q.data.trainingFields).toBeUndefined();
    }
  });
});

describe('Vertical Calc - Approximate (取近似值)', () => {
  it('困难/魔王应生成取近似值题', () => {
    const qs = genN(generateVerticalCalc, 7, 500);
    const approxQs = qs.filter((q: any) =>
      q.prompt.includes('精确到') || q.prompt.includes('保留')
    );
    expect(approxQs.length).toBeGreaterThan(0);
  });

  it('取近似值答案应为有效数字', () => {
    const qs = genN(generateVerticalCalc, 7, 500);
    const approxQs = qs.filter((q: any) =>
      q.prompt.includes('精确到') || q.prompt.includes('保留')
    );
    for (const q of approxQs) {
      expect(isNaN(Number(q.solution.answer))).toBe(false);
    }
  });
});

// ==================== Number Sense - B1 退化题过滤 ====================
describe('Number Sense - B1 退化题过滤', () => {
  it('round 子题型：500 次采样 answer !== num（无退化题）', () => {
    const qs = genN((p) => generateNumberSense({ ...p, subtypeFilter: 'round' }), 5, 500);
    for (const q of qs) {
      if (q.type === 'numeric-input' && typeof q.solution.answer === 'number') {
        const numMatch = q.prompt.match(/将\s*([\d,]+)\s*四舍五入/);
        if (numMatch) {
          const num = Number(numMatch[1].replace(/,/g, ''));
          expect(q.solution.answer).not.toBe(num);
        }
      }
    }
  });

  it('floor-ceil 子题型：500 次采样 answer !== parseInt(numStr)（无退化题）', () => {
    const qs = genN((p) => generateNumberSense({ ...p, subtypeFilter: 'floor-ceil' }), 5, 500);
    for (const q of qs) {
      if (q.type === 'numeric-input' && typeof q.solution.answer === 'number') {
        const numMatch = q.prompt.match(/将\s*([\d.]+)\s*取近似/);
        if (numMatch) {
          const num = Number(numMatch[1]);
          // 如果 num 是整数（退化条件），answer 应已被 retry 避开
          if (Number.isInteger(num)) {
            // retry 兜底后 num 不再是整数，此断言不会触发
            // 若触发说明 retry 逻辑失效
            expect(Number.isInteger(num)).toBe(false);
          }
        }
      }
    }
  });
});

describe('Vertical Calc - Dispatcher Distribution (调度器分布)', () => {
  it('低档 100% 整数（v2.1：低档禁止小数）', () => {
    const qs = genN(generateVerticalCalc, 5, 1000);
    const intOnly = qs.filter((q: any) => {
      const ops = q.data.operands ?? [];
      return ops.every((n: number) => Number.isInteger(n));
    });
    expect(intOnly.length).toBe(qs.length);
  });

  it('中档整数 vertical-fill 应明显下降（小数接管主流）', () => {
    const qs = genN(generateVerticalCalc, 7, 1000);
    const intVf = qs.filter((q: any) => {
      if (q.type !== 'vertical-fill') return false;
      if (q.data.multiplicationBoard?.mode === 'decimal') return false;
      return q.data.decimalPlaces == null;
    });
    expect(intVf.length / qs.length).toBeLessThan(0.25);
  });

  it('所有难度的 numeric-input 答案应为有效数字', () => {
    for (const d of [5, 7, 10]) {
      const qs = genN(generateVerticalCalc, d, 300);
      for (const q of qs) {
        if (q.type === 'numeric-input') {
          const ans = String(q.solution.answer);
          expect(isNaN(Number(ans))).toBe(false);
        }
      }
    }
  });
});
