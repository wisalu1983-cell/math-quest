import { describe, it, expect } from 'vitest';
import {
  normalizeInput,
  isExpressionEquivalent,
  isEquationEquivalent,
  isTrivialSolution,
  hasAnyBracket,
  hasBracketAndEquivalent,
  isNumericEqual,
  isMultiChoiceEqual,
  isMultiBlankEqual,
} from './answerValidation';

describe('normalizeInput', () => {
  it('全角数字 → 半角', () => {
    expect(normalizeInput('１２')).toBe('12');
  });
  it('× ÷ 中文符号 → * /', () => {
    expect(normalizeInput('3×5')).toBe('3*5');
    expect(normalizeInput('12÷4')).toBe('12/4');
  });
  it('中文括号 → ASCII', () => {
    expect(normalizeInput('(3＋5)')).toBe('(3+5)');
  });
  it('中括号 → 小括号', () => {
    expect(normalizeInput('[3+5]')).toBe('(3+5)');
  });
  it('空白字符去除', () => {
    expect(normalizeInput('  3 + 5  ')).toBe('3+5');
  });
});

describe('isExpressionEquivalent（A06/A07 填写式子）', () => {
  it('项顺序不同也等价', () => {
    expect(isExpressionEquivalent('72 - 55 + 10', '-55 + 72 + 10')).toBe(true);
    expect(isExpressionEquivalent('a + b - c', '-c + a + b')).toBe(true);
  });
  it('去括号后的等价', () => {
    expect(isExpressionEquivalent('72 - 55 + 10', '72 - (55 - 10)')).toBe(true);
    expect(isExpressionEquivalent('100 - 30 - 20', '100 - (30 + 20)')).toBe(true);
  });
  it('连除变除以积', () => {
    expect(isExpressionEquivalent('360 / (6 * 3)', '360 / 6 / 3')).toBe(true);
  });
  it('不等价识别', () => {
    expect(isExpressionEquivalent('72 - 55 + 10', '72 - 55 - 10')).toBe(false);
    expect(isExpressionEquivalent('a - b + c', 'a + b - c')).toBe(false);
  });
  it('带乘号与无乘号的等价', () => {
    // mathjs 支持 2x = 2*x
    expect(isExpressionEquivalent('2*x', '2x')).toBe(true);
  });
});

describe('isEquationEquivalent（A08 方程移项）', () => {
  it('移项后等价：基础两步', () => {
    expect(isEquationEquivalent('3x = 22 - 7', '3x = 15')).toBe(true);
  });
  it('两边含 x 交叉移项', () => {
    expect(isEquationEquivalent('6x - 2x = 13 + 7', '4x = 20')).toBe(true);
  });
  it('减号后 x 项陷阱（T1）', () => {
    expect(isEquationEquivalent('-5x = 10 - 30', '5x = 30 - 10')).toBe(true);
    expect(isEquationEquivalent('-5x = 10 - 30', '5x = 20')).toBe(true);
  });
  it('同侧多项移项（T2）', () => {
    expect(isEquationEquivalent('2x = 17 - 8 + 3', '2x = 12')).toBe(true);
  });
  it('括号展开后移项（T3）', () => {
    expect(isEquationEquivalent('4x = 28 - 12', '4x = 16')).toBe(true);
  });
  it('不等价识别', () => {
    // 移项时忘了变号
    expect(isEquationEquivalent('5x = 30 + 10', '5x = 20')).toBe(false);
    // 漏移常数
    expect(isEquationEquivalent('2x = 17 - 8', '2x = 12')).toBe(false);
  });
});

describe('isTrivialSolution（防止学生直接写 x=N）', () => {
  it('识别 x=具体数', () => {
    expect(isTrivialSolution('x = 5')).toBe(true);
    expect(isTrivialSolution('x=-3')).toBe(true);
    expect(isTrivialSolution('x=2.5')).toBe(true);
  });
  it('正常等式不算', () => {
    expect(isTrivialSolution('3x = 22 - 7')).toBe(false);
    expect(isTrivialSolution('x = 42 - 15')).toBe(false);
  });
});

describe('hasAnyBracket / hasBracketAndEquivalent', () => {
  it('去括号题：答案不能含括号', () => {
    expect(hasAnyBracket('72 - 55 + 10')).toBe(false);
    expect(hasAnyBracket('72 - (55 - 10)')).toBe(true);
  });
  it('添括号题：必须含括号且等价', () => {
    expect(hasBracketAndEquivalent('100 - (36 + 24)', '100 - 36 - 24')).toBe(true);
    // 没加括号但等价——不算
    expect(hasBracketAndEquivalent('100 - 36 - 24', '100 - 36 - 24')).toBe(false);
    // 加了括号但不等价——不算
    expect(hasBracketAndEquivalent('100 - (36 - 24)', '100 - 36 - 24')).toBe(false);
  });
});

describe('isNumericEqual（数值答案兼容）', () => {
  it('去尾零', () => {
    expect(isNumericEqual('3.50', 3.5)).toBe(true);
    expect(isNumericEqual('3.5', '3.50')).toBe(true);
  });
  it('带空格', () => {
    expect(isNumericEqual('  42  ', 42)).toBe(true);
  });
  it('不相等', () => {
    expect(isNumericEqual('3.5', 3.55)).toBe(false);
  });
});

describe('isMultiChoiceEqual（多选）', () => {
  it('顺序/分隔符不敏感', () => {
    expect(isMultiChoiceEqual('A,C', ['A', 'C'])).toBe(true);
    expect(isMultiChoiceEqual('C,A', ['A', 'C'])).toBe(true);
    expect(isMultiChoiceEqual('AC', ['A', 'C'])).toBe(true);
    expect(isMultiChoiceEqual('A、C', 'AC')).toBe(true);
  });
  it('少选 / 多选都算错', () => {
    expect(isMultiChoiceEqual('A', ['A', 'C'])).toBe(false);
    expect(isMultiChoiceEqual('A,B,C', ['A', 'C'])).toBe(false);
  });
});

describe('isMultiBlankEqual（多步填空）', () => {
  it('按序匹配数值', () => {
    expect(isMultiBlankEqual(['100', '1'], ['100', '1'])).toBe(true);
    expect(isMultiBlankEqual(['100', '2'], ['100', '1'])).toBe(false);
  });
  it('每项可以是表达式', () => {
    expect(isMultiBlankEqual(['100 - 1', '3663'], ['100 - 1', '3663'])).toBe(true);
    // 表达式等价也能通过
    expect(isMultiBlankEqual(['-1 + 100'], ['100 - 1'])).toBe(true);
  });
  it('长度不一致返回 false', () => {
    expect(isMultiBlankEqual(['100'], ['100', '1'])).toBe(false);
  });
});
