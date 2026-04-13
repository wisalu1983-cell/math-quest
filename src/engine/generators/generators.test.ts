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
describe('Mental Arithmetic (口算速算)', () => {
  describe('Normal (difficulty=5)', () => {
    it('乘法应为 1位×2位', () => {
      const qs = genN(generateMentalArithmetic, 5, 200);
      // 排除整十/整百运算题（20%概率生成，operands 可能超出普通范围）
      // const muls = qs.filter((q: any) => q.data.operator === '×' && !q.data.operands.some((n: number) => n >= 10 && n % 10 === 0 && n >= 10 && n <= 900 && (n % 10 === 0)));
      // 只检查非整十整百题
      const normalMuls = qs.filter((q: any) => q.data.operator === '×' && q.data.operands[0] <= 9);
      expect(normalMuls.length).toBeGreaterThan(0);
      for (const q of normalMuls) {
        const [a, b] = q.data.operands;
        expect(a).toBeGreaterThanOrEqual(2);
        expect(a).toBeLessThanOrEqual(9);
        expect(b).toBeGreaterThanOrEqual(10);
        expect(b).toBeLessThanOrEqual(99);
      }
    });

    it('除法应为 2位÷1位，答案为 "商...余数" 格式', () => {
      const qs = genN(generateMentalArithmetic, 5, 200);
      // 排除整十/整百运算题（a >= 100 的是整百运算，答案格式不同）
      const divs = qs.filter((q: any) => q.data.operator === '÷' && q.data.operands[0] <= 99);
      expect(divs.length).toBeGreaterThan(0);
      for (const q of divs) {
        const [a, b] = q.data.operands;
        expect(a).toBeGreaterThanOrEqual(10);
        expect(a).toBeLessThanOrEqual(99);
        expect(b).toBeGreaterThanOrEqual(2);
        expect(b).toBeLessThanOrEqual(9);
        // Answer must be "quotient...remainder" string
        const ansStr = String(q.solution.answer);
        expect(ansStr).toMatch(/^\d+\.\.\.\d+$/);
        const [qStr, rStr] = ansStr.split('...');
        const quotient = parseInt(qStr);
        const remainder = parseInt(rStr);
        expect(quotient).toBe(Math.floor(a / b));
        expect(remainder).toBe(a % b);
      }
    });

    it('除法应混有有余数和整除两种情况', () => {
      const qs = genN(generateMentalArithmetic, 5, 500);
      const divs = qs.filter(q => q.data.operator === '÷');
      const withRemainder = divs.filter(q => !String(q.solution.answer).endsWith('...0'));
      const exact = divs.filter(q => String(q.solution.answer).endsWith('...0'));
      expect(withRemainder.length).toBeGreaterThan(0);
      expect(exact.length).toBeGreaterThan(0);
    });

    it('时间限制为 10 秒', () => {
      const qs = genN(generateMentalArithmetic, 5, 20);
      const basicQs = qs.filter(q => q.data.kind === 'mental-arithmetic');
      for (const q of basicQs) {
        expect(q.timeLimit).toBe(10000);
      }
    });
  });

  describe('Hard (difficulty=7)', () => {
    it('乘法应为 1位×(2或3位)', () => {
      const qs = genN(generateMentalArithmetic, 7, 200);
      const muls = qs.filter(q => q.data.operator === '×');
      expect(muls.length).toBeGreaterThan(0);
      let has2digit = false, has3digit = false;
      for (const q of muls) {
        const [a, b] = q.data.operands;
        expect(a).toBeGreaterThanOrEqual(2);
        expect(a).toBeLessThanOrEqual(9);
        expect(b).toBeGreaterThanOrEqual(10);
        expect(b).toBeLessThanOrEqual(999);
        if (b >= 100) has3digit = true;
        else has2digit = true;
      }
      expect(has2digit).toBe(true);
      expect(has3digit).toBe(true);
    });

    it('时间限制为 30 秒', () => {
      const qs = genN(generateMentalArithmetic, 7, 20);
      const basicQs = qs.filter(q => q.data.kind === 'mental-arithmetic');
      for (const q of basicQs) {
        expect(q.timeLimit).toBe(30000);
      }
    });
  });

  describe('Demon (difficulty=10)', () => {
    it('时间限制为 60 秒', () => {
      const qs = genN(generateMentalArithmetic, 10, 20);
      const basicQs = qs.filter(q => q.data.kind === 'mental-arithmetic');
      for (const q of basicQs) {
        expect(q.timeLimit).toBe(60000);
      }
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

    it('difficulty≥6 运算顺序题应包含括号', () => {
      const qs = genN(generateMentalArithmetic, 7, 300);
      const orderQs = qs.filter(q => q.data.kind === 'multi-step');
      const withBracket = orderQs.filter(q => q.data.expression.includes('('));
      expect(withBracket.length).toBeGreaterThan(0);
    });
  });

  it('单步口算答案与正确计算一致', () => {
    for (const d of [5, 7, 10]) {
      const qs = genN(generateMentalArithmetic, d, 100);
      const basicQs = qs.filter(q => q.data.kind === 'mental-arithmetic');
      for (const q of basicQs) {
        const [a, b] = q.data.operands;
        const op = q.data.operator;
        if (op === '÷') {
          // Division: answer is "quotient...remainder" string
          const ansStr = String(q.solution.answer);
          expect(ansStr).toMatch(/^\d+\.\.\.\d+$/);
          const [qStr, rStr] = ansStr.split('...');
          expect(parseInt(qStr)).toBe(Math.floor(a / b));
          expect(parseInt(rStr)).toBe(a % b);
        } else {
          let expected: number;
          if (op === '+') expected = a + b;
          else if (op === '-') expected = a - b;
          else expected = a * b;
          expect(q.solution.answer).toBe(expected);
        }
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
    it('应包含 3位×2位 乘法 (numeric-input)', () => {
      const qs = genN(generateVerticalCalc, 7, 200);
      const bigMuls = qs.filter(q => {
        if (q.data.operation !== '×') return false;
        const [, b] = q.data.operands;
        return b >= 10;
      });
      expect(bigMuls.length).toBeGreaterThan(0);
      for (const q of bigMuls) {
        expect(q.type).toBe('numeric-input');
      }
    });

    it('应包含除法题', () => {
      const qs = genN(generateVerticalCalc, 7, 200);
      const divs = qs.filter(q => q.data.operation === '÷');
      expect(divs.length).toBeGreaterThan(0);
    });
  });

  describe('Demon (difficulty=10)', () => {
    it('乘法应为 3~4位×2位', () => {
      const qs = genN(generateVerticalCalc, 10, 200);
      const muls = qs.filter(q => q.data.operation === '×' && q.type === 'numeric-input' &&
        Number.isInteger(q.data.operands[0]) && Number.isInteger(q.data.operands[1]));
      expect(muls.length).toBeGreaterThan(0);
      for (const q of muls) {
        const [a, b] = q.data.operands;
        expect(a).toBeGreaterThanOrEqual(100);
        expect(b).toBeGreaterThanOrEqual(11);
        expect(b).toBeLessThanOrEqual(99);
      }
    });

    it('除法应为 3~4位÷2位（整数）或小数除法', () => {
      const qs = genN(generateVerticalCalc, 10, 200);
      const divs = qs.filter(q => q.data.operation === '÷');
      expect(divs.length).toBeGreaterThan(0);
      // 整数除法部分：操作数都是整数时才验证范围
      const intDivs = divs.filter(q =>
        Number.isInteger(q.data.operands[0]) && Number.isInteger(q.data.operands[1]));
      for (const q of intDivs) {
        const [a, b] = q.data.operands;
        expect(a).toBeGreaterThanOrEqual(100);
        expect(b).toBeGreaterThanOrEqual(11);
        expect(b).toBeLessThanOrEqual(99);
      }
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

    it('应包含简单小数混合运算', () => {
      const qs = genN(generateMultiStep, 5, 200);
      const withDecimal = qs.filter(q => q.data.expression.includes('.'));
      expect(withDecimal.length).toBeGreaterThan(0);
    });

    it('应包含连减合并题 (a-b-c 无括号)', () => {
      const qs = genN(generateMultiStep, 5, 200);
      const reductions = qs.filter(q => {
        const expr = String(q.data.expression);
        return !expr.includes('(') && (expr.match(/-/g) || []).length >= 2;
      });
      expect(reductions.length).toBeGreaterThan(0);
    });

    it('应包含乘法分配律凑整题 (a×near-round)', () => {
      const qs = genN(generateMultiStep, 5, 200);
      const distributes = qs.filter(q => {
        const expr = String(q.data.expression);
        return expr.includes('×') && !expr.includes('(') && !expr.includes('.') && q.type === 'numeric-input';
      });
      expect(distributes.length).toBeGreaterThan(0);
    });
  });

  describe('Hard (difficulty=7)', () => {
    it('应包含小数两步运算', () => {
      const qs = genN(generateMultiStep, 7, 200);
      const withDecimal = qs.filter(q => q.data.expression.includes('.'));
      expect(withDecimal.length).toBeGreaterThan(0);
    });

    it('应包含括号陷阱选择题 (multiple-choice)', () => {
      const qs = genN(generateMultiStep, 7, 200);
      const trapMC = qs.filter(q => q.type === 'multiple-choice');
      expect(trapMC.length).toBeGreaterThan(0);
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
    it('应包含复杂小数多步运算', () => {
      const qs = genN(generateMultiStep, 10, 200);
      const withDecimal = qs.filter(q => q.data.expression.includes('.'));
      expect(withDecimal.length).toBeGreaterThan(0);
    });

    it('应包含分配律/除法陷阱选择题', () => {
      const qs = genN(generateMultiStep, 10, 200);
      const trapMC = qs.filter(q => q.type === 'multiple-choice');
      expect(trapMC.length).toBeGreaterThan(0);
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

    it('魔王级应包含提取公因数题', () => {
      const demonQs = genN(generateMultiStep, 10, 200);
      const extractQs = demonQs.filter(q => {
        const explanation = String(q.solution.explanation || '');
        return explanation.includes('提取') || explanation.includes('公因数');
      });
      expect(extractQs.length).toBeGreaterThan(0);
    });
  });

  it('所有数值答案为有效数字，MC答案在选项内', () => {
    for (const d of [5, 7, 10]) {
      const qs = genN(generateMultiStep, d, 100);
      for (const q of qs) {
        if (q.type === 'multiple-choice') {
          const opts = (q.data as any).options as string[];
          expect(opts).toContain(String(q.solution.answer));
        } else {
          const ans = q.solution.answer;
          expect(isNaN(Number(ans))).toBe(false);
        }
      }
    }
  });

  it('所有小数答案精度合理', () => {
    for (const d of [5, 7, 10]) {
      const qs = genN(generateMultiStep, d, 200);
      for (const q of qs) {
        if (q.type === 'multiple-choice') continue;
        const ansStr = String(q.solution.answer);
        if (ansStr.includes('.')) {
          const dp = ansStr.split('.')[1].length;
          expect(dp).toBeLessThanOrEqual(4);
        }
      }
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
  describe('Bracket Equations (含括号方程)', () => {
    it('difficulty≥6 应能生成含括号方程', () => {
      const qs = genN(generateEquationTranspose, 7, 400);
      const bracketQs = qs.filter((q: any) =>
        q.data.equation.includes('(') && q.type === 'numeric-input'
      );
      expect(bracketQs.length).toBeGreaterThan(0);
    });

    it('含括号方程答案应为有效数字', () => {
      const qs = genN(generateEquationTranspose, 7, 400);
      const bracketQs = qs.filter((q: any) =>
        q.data.equation.includes('(') && q.type === 'numeric-input'
      );
      for (const q of bracketQs) {
        expect(isNaN(Number(q.solution.answer))).toBe(false);
        expect(Number(q.solution.answer)).toBeGreaterThan(0);
      }
    });

    it('含括号方程 solution.steps 应非空', () => {
      const qs = genN(generateEquationTranspose, 7, 400);
      const bracketQs = qs.filter((q: any) =>
        q.data.equation.includes('(') && q.type === 'numeric-input'
      );
      for (const q of bracketQs) {
        expect(q.solution.steps).toBeDefined();
        expect(q.solution.steps!.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('Division Equations (除法方程)', () => {
    it('difficulty≤5 应能生成除法方程', () => {
      const qs = genN(generateEquationTranspose, 5, 400);
      const divQs = qs.filter((q: any) =>
        q.data.equation.includes('÷') && q.type === 'numeric-input'
      );
      expect(divQs.length).toBeGreaterThan(0);
    });

    it('除法方程答案应为正整数', () => {
      const qs = genN(generateEquationTranspose, 5, 400);
      const divQs = qs.filter((q: any) =>
        q.data.equation.includes('÷') && q.type === 'numeric-input'
      );
      for (const q of divQs) {
        const ans = Number(q.solution.answer);
        expect(isNaN(ans)).toBe(false);
        expect(ans).toBeGreaterThan(0);
      }
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
  it('difficulty≤5 应偶尔生成特殊值乘法（如 0.125×8）', () => {
    const qs = genN(generateDecimalOps, 5, 600);
    const specials = qs.filter((q: any) =>
      q.data.subtype === 'mul' && q.solution.explanation.includes('特殊值')
    );
    expect(specials.length).toBeGreaterThan(0);
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

describe('Bracket Ops - Decimal Support (小数支持)', () => {
  it('difficulty≥6 应偶尔生成小数括号变换题', () => {
    const qs = genN(generateBracketOps, 7, 500);
    const decimalQs = qs.filter((q: any) => q.data.originalExpression.includes('.'));
    expect(decimalQs.length).toBeGreaterThan(0);
  });
});

// ==================== A01 Phase 2: Extended Ranges ====================
describe('Mental Arithmetic - Extended Ranges (整十整百运算)', () => {
  it('difficulty=5 应偶尔生成三位数整十/整百运算', () => {
    const qs = genN(generateMentalArithmetic, 5, 500);
    const singleStep = qs.filter((q: any) => q.data.kind !== 'multi-step');
    const threeDigit = singleStep.filter((q: any) => {
      const ops = q.data.operands as number[];
      return ops.some((n: number) => n >= 100);
    });
    expect(threeDigit.length).toBeGreaterThan(0);
  });

  it('三位数运算应为整十或整百数', () => {
    const qs = genN(generateMentalArithmetic, 5, 500);
    const singleStep = qs.filter((q: any) => q.data.kind !== 'multi-step');
    const threeDigit = singleStep.filter((q: any) => {
      const ops = q.data.operands as number[];
      return ops.some((n: number) => n >= 100);
    });
    for (const q of threeDigit) {
      const ops = q.data.operands as number[];
      const bigNum = ops.find((n: number) => n >= 100)!;
      expect(bigNum % 10).toBe(0);
    }
  });
});

// ==================== A07 Phase 2: Hidden Factor + Decimal ====================
describe('Multi-Step - Hidden Factor (隐藏公因数)', () => {
  it('difficulty≥6 应生成隐藏公因数题', () => {
    const qs = genN(generateMultiStep, 7, 500);
    const factorQs = qs.filter((q: any) =>
      q.solution.explanation && q.solution.explanation.includes('公因数')
    );
    const hidden = factorQs.filter((q: any) => q.data.expression.includes('.'));
    expect(hidden.length).toBeGreaterThan(0);
  });
});

describe('Multi-Step - Decimal Versions (小数简便计算)', () => {
  it('difficulty≤5 连减凑整应支持小数', () => {
    const qs = genN(generateMultiStep, 5, 500);
    const decimalQs = qs.filter((q: any) =>
      q.data.expression.includes('.') && q.solution.explanation && q.solution.explanation.includes('凑')
    );
    expect(decimalQs.length).toBeGreaterThan(0);
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
  it('应生成去尾法或进一法题', () => {
    const qs = genN(generateNumberSense, 7, 500);
    const fcQs = qs.filter((q: any) =>
      q.prompt.includes('去尾') || q.prompt.includes('进一')
    );
    expect(fcQs.length).toBeGreaterThan(0);
  });

  it('去尾法/进一法答案应为有效数字', () => {
    const qs = genN(generateNumberSense, 7, 500);
    const fcQs = qs.filter((q: any) =>
      q.prompt.includes('去尾') || q.prompt.includes('进一')
    );
    for (const q of fcQs) {
      expect(isNaN(Number(q.solution.answer))).toBe(false);
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

// ==================== A03 Decimal Support ====================
describe('Vertical Calc - Decimal Add/Sub (小数加减法)', () => {
  it('普通难度应生成小数加减法题', () => {
    const qs = genN(generateVerticalCalc, 5, 400);
    const decAddSub = qs.filter((q: any) =>
      q.type === 'vertical-fill' && q.data.decimalPlaces != null &&
      (q.data.operation === '+' || q.data.operation === '-')
    );
    expect(decAddSub.length).toBeGreaterThan(0);
  });

  it('小数加减法答案应为有效数字', () => {
    const qs = genN(generateVerticalCalc, 5, 400);
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
  it('普通难度应生成小数乘法题', () => {
    const qs = genN(generateVerticalCalc, 5, 400);
    const decMul = qs.filter((q: any) =>
      q.type === 'numeric-input' && q.prompt.includes('列竖式计算') &&
      q.data.operation === '×' &&
      (q.data.operands[0] % 1 !== 0 || q.data.operands[1] % 1 !== 0)
    );
    expect(decMul.length).toBeGreaterThan(0);
  });
});

describe('Vertical Calc - Decimal Div (小数除法)', () => {
  it('普通难度应生成小数除法题', () => {
    const qs = genN(generateVerticalCalc, 5, 400);
    const decDiv = qs.filter((q: any) =>
      q.type === 'numeric-input' && q.prompt.includes('列竖式计算') &&
      q.data.operation === '÷' &&
      (q.data.operands[0] % 1 !== 0 || q.data.operands[1] % 1 !== 0)
    );
    expect(decDiv.length).toBeGreaterThan(0);
  });

  it('困难应生成除数是小数的除法题', () => {
    const qs = genN(generateVerticalCalc, 7, 400);
    const decDivDecDivisor = qs.filter((q: any) =>
      q.type === 'numeric-input' && q.data.operation === '÷' &&
      q.data.operands[1] % 1 !== 0
    );
    expect(decDivDecDivisor.length).toBeGreaterThan(0);
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

describe('Vertical Calc - Dispatcher Distribution (调度器分布)', () => {
  it('普通难度整数与小数题应各约一半', () => {
    const qs = genN(generateVerticalCalc, 5, 1000);
    const intQs = qs.filter((q: any) => q.type === 'vertical-fill');
    const intPct = intQs.length / qs.length;
    expect(intPct).toBeGreaterThan(0.30);
    expect(intPct).toBeLessThan(0.70);
  });

  it('困难整数 vertical-fill 应约 10%', () => {
    const qs = genN(generateVerticalCalc, 7, 1000);
    // 仅统计整数竖式（无 decimalPlaces），小数加减法现已改为 vertical-fill 需排除
    const intVf = qs.filter((q: any) => q.type === 'vertical-fill' && q.data.decimalPlaces == null);
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
