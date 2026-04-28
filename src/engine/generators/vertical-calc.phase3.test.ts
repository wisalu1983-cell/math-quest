/// <reference types="vitest/globals" />
import { describe, expect, it } from 'vitest';
import { generateVerticalCalc } from './vertical-calc';
import type { Question } from '@/types';

function generateIntMulQuestions(difficulty: number, n: number): Question[] {
  return Array.from({ length: n }, (_, i) =>
    generateVerticalCalc({
      difficulty,
      id: `phase3-${difficulty}-${i}`,
      subtypeFilter: ['int-mul'],
    }),
  );
}

function generateSubtypeQuestions(subtype: string, difficulty: number, n: number): Question[] {
  return Array.from({ length: n }, (_, i) =>
    generateVerticalCalc({
      difficulty,
      id: `phase3-${subtype}-${difficulty}-${i}`,
      subtypeFilter: [subtype],
    }),
  );
}

function digitCount(value: number): number {
  return String(Math.trunc(Math.abs(value))).length;
}

function isTwoDigitByTwoDigit(question: Question): boolean {
  if (question.data.kind !== 'vertical-calc') return false;
  if (question.data.operation !== '×') return false;
  const [a, b] = question.data.operands;
  return digitCount(a) === 2 && digitCount(b) === 2;
}

function isTwoDigitByOneDigitMultiplication(question: Question): boolean {
  if (question.data.kind !== 'vertical-calc') return false;
  if (question.data.operation !== '×') return false;
  const [a, b] = question.data.operands;
  return digitCount(a) === 2 && digitCount(b) === 1;
}

function isThreeDigitByOneDigitMultiplication(question: Question): boolean {
  if (question.data.kind !== 'vertical-calc') return false;
  if (question.data.operation !== '×') return false;
  const [a, b] = question.data.operands;
  return digitCount(a) === 3 && digitCount(b) === 1;
}

function getVerticalOperands(question: Question): [number, number] {
  expect(question.data.kind).toBe('vertical-calc');
  expect(question.data.operands).toHaveLength(2);
  const [a, b] = question.data.operands;
  expect(typeof a).toBe('number');
  expect(typeof b).toBe('number');
  return [a, b];
}

type OneDigitDivisionLoad = 'D0' | 'D1' | 'D2' | 'D3' | 'other';

function classifyOneDigitIntDivision(question: Question): OneDigitDivisionLoad {
  expect(question.data.kind).toBe('vertical-calc');
  expect(question.data.operation).toBe('÷');
  const [dividend, divisor] = getVerticalOperands(question);
  const quotient = Number(question.solution.answer);

  if (!Number.isInteger(dividend) || !Number.isInteger(divisor) || !Number.isInteger(quotient)) {
    return 'other';
  }
  if (digitCount(divisor) !== 1 || dividend % divisor !== 0) return 'other';

  const quotientMiddle = String(quotient).slice(1, -1);
  if (quotientMiddle.includes('0')) return 'D3';

  const digits = String(dividend).split('').map(Number);
  let current = 0;
  let quotientStarted = false;
  let remainderTransfers = 0;

  for (let i = 0; i < digits.length; i++) {
    current = current * 10 + digits[i];
    if (!quotientStarted && current < divisor) continue;

    const qDigit = Math.floor(current / divisor);
    const remainder = current % divisor;
    if (qDigit > 0 || quotientStarted) {
      quotientStarted = true;
      if (remainder > 0 && i < digits.length - 1) remainderTransfers++;
    }
    current = remainder;
  }

  if (remainderTransfers === 0) return 'D0';
  if (remainderTransfers === 1) return 'D1';
  return 'D2';
}

function decimalPlacesOf(value: unknown): number {
  const text = String(value);
  const [, decimal = ''] = text.split('.');
  return decimal.length;
}

describe('v0.4 Phase 3 · A03 低档后段乘法分布', () => {
  it('difficulty=4-5 的 int-mul 以 15% 期望引入 2位数 × 2位数', () => {
    for (const difficulty of [4, 5]) {
      const qs = generateIntMulQuestions(difficulty, 1000);
      const twoByTwo = qs.filter(isTwoDigitByTwoDigit);

      expect(twoByTwo.length).toBeGreaterThanOrEqual(100);
      expect(twoByTwo.length).toBeLessThanOrEqual(200);

      for (const q of twoByTwo) {
        expect(q.type).toBe('vertical-fill');
        expect(q.data.kind).toBe('vertical-calc');
        expect(q.data.multiplicationBoard).toMatchObject({
          mode: 'integer',
          operandInputMode: 'static',
        });
      }
    }
  });

  it('BL-009: difficulty<=3 的 int-mul 不再生成 2位数 × 1位数', () => {
    for (const difficulty of [2, 3]) {
      const qs = generateIntMulQuestions(difficulty, 300);
      expect(qs.some(isTwoDigitByOneDigitMultiplication)).toBe(false);
      expect(qs.some(isThreeDigitByOneDigitMultiplication)).toBe(true);
    }
  });
});

describe('v0.4 Phase 3 · A03 除法样本池治理', () => {
  it('int-div 不再生成 两位数 ÷ 一位数 的整数短除', () => {
    for (const difficulty of [2, 3, 4, 5, 6, 7]) {
      const qs = generateSubtypeQuestions('int-div', difficulty, 200);
      for (const q of qs) {
        expect(q.data.kind).toBe('vertical-calc');
        expect(q.data.operation).toBe('÷');
        const [dividend, divisor] = getVerticalOperands(q);
        expect(digitCount(dividend) === 2 && digitCount(divisor) === 1).toBe(false);

        if (difficulty <= 5) {
          expect(Number.isInteger(Number(q.solution.answer))).toBe(true);
          expect(dividend).toBeGreaterThanOrEqual(100);
        }
      }
    }
  });

  it('difficulty=6-7 的 int-div 生成三位数为主的有限小数商', () => {
    for (const difficulty of [6, 7]) {
      const qs = generateSubtypeQuestions('int-div', difficulty, 240);
      let oneOrTwoDecimalCount = 0;

      for (const q of qs) {
        const [dividend, divisor] = getVerticalOperands(q);
        const answer = Number(q.solution.answer);

        expect(dividend).toBeGreaterThanOrEqual(100);
        expect(dividend).toBeLessThan(1000);
        expect(divisor).toBeGreaterThanOrEqual(4);
        expect(divisor).toBeLessThanOrEqual(19);
        expect(Number.isInteger(answer)).toBe(false);
        expect(decimalPlacesOf(q.solution.answer)).toBeGreaterThanOrEqual(1);
        expect(decimalPlacesOf(q.solution.answer)).toBeLessThanOrEqual(3);

        if (decimalPlacesOf(q.solution.answer) <= 2) {
          oneOrTwoDecimalCount++;
        }
      }

      expect(oneOrTwoDecimalCount).toBeGreaterThan(qs.length * 0.7);
    }
  });

  it('高档 approximate 不再使用小整数除不尽固定题池', () => {
    for (const difficulty of [8, 9, 10]) {
      const divisionQs = generateSubtypeQuestions('approximate', difficulty, 300)
        .filter(q => q.data.kind === 'vertical-calc' && q.data.operation === '÷');

      expect(divisionQs.length).toBeGreaterThan(150);

      for (const q of divisionQs) {
        const [dividend, divisor] = getVerticalOperands(q);

        if (Number.isInteger(dividend) && Number.isInteger(divisor)) {
          expect(dividend).toBeGreaterThanOrEqual(100);
          expect(dividend).toBeLessThan(1000);
          expect(divisor).toBeGreaterThanOrEqual(4);
          expect(divisor).toBeLessThanOrEqual(19);
          expect(dividend % divisor).not.toBe(0);
        }
      }
    }
  });

  it('dec-div 中档也不回落到两位整数短除', () => {
    for (const difficulty of [6, 7]) {
      const qs = generateSubtypeQuestions('dec-div', difficulty, 300);

      for (const q of qs) {
        expect(q.data.kind).toBe('vertical-calc');
        expect(q.data.operation).toBe('÷');
        const [dividend, divisor] = getVerticalOperands(q);

        if (Number.isInteger(dividend) && Number.isInteger(divisor)) {
          expect(digitCount(dividend) === 2 && digitCount(divisor) === 1).toBe(false);
        }
      }
    }
  });
});

describe('v0.5 Phase 2 · BL-009 低档除法过滤', () => {
  it('difficulty<=5 的 int-div 过滤 D0，并以 D2/D3 为主', () => {
    for (const difficulty of [2, 3, 4, 5]) {
      const qs = generateSubtypeQuestions('int-div', difficulty, 600);
      const counts: Record<OneDigitDivisionLoad, number> = {
        D0: 0,
        D1: 0,
        D2: 0,
        D3: 0,
        other: 0,
      };

      for (const q of qs) {
        counts[classifyOneDigitIntDivision(q)]++;
      }

      expect(counts.D0).toBe(0);
      expect(counts.D2 + counts.D3).toBeGreaterThanOrEqual(qs.length * 0.7);
      expect(counts.D3).toBeGreaterThanOrEqual(qs.length * 0.25);
      expect(counts.D1).toBeLessThanOrEqual(qs.length * 0.3);
      expect(counts.other).toBe(0);
    }
  });
});
