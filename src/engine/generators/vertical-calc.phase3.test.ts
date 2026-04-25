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

function getVerticalOperands(question: Question): [number, number] {
  expect(question.data.kind).toBe('vertical-calc');
  expect(question.data.operands).toHaveLength(2);
  const [a, b] = question.data.operands;
  expect(typeof a).toBe('number');
  expect(typeof b).toBe('number');
  return [a, b];
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

  it('difficulty<=3 的 int-mul 仍保持 2位数 × 1位数', () => {
    const qs = generateIntMulQuestions(3, 300);
    expect(qs.some(isTwoDigitByTwoDigit)).toBe(false);
    for (const q of qs) {
      expect(q.data.kind).toBe('vertical-calc');
      expect(q.data.operation).toBe('×');
      const [a, b] = q.data.operands;
      expect(digitCount(a)).toBe(2);
      expect(digitCount(b)).toBe(1);
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
