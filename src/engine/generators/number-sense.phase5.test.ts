/// <reference types="vitest/globals" />
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isNumericEqual } from '../answerValidation';
import { generateNumberSense } from './number-sense';

function withMathRandomSequence(values: number[]) {
  let index = 0;
  return vi.spyOn(Math, 'random').mockImplementation(() => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  });
}

describe('v0.5 Phase 5 · ISSUE-069 reverse-round template 4', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('最大填几题的答案口径为方框内单个数字', () => {
    withMathRandomSequence([
      0,   // pickSubtype -> reverse-round
      0.1, // askMax -> true
      0.5, // target -> stable middle value
      0.7, // templateIdx -> 4
    ]);

    const question = generateNumberSense({
      difficulty: 5,
      id: 'issue-069-max',
      subtypeFilter: ['reverse-round'],
    });

    expect(question.prompt).toContain('□ 里最大能填几');
    expect(question.prompt).toContain('51.□');
    expect(question.prompt).toContain('结果仍然是 51');
    expect(question.solution.answer).toBe('4');
    expect(question.solution.explanation).toContain('□ 最大填 4');
    expect(question.solution.explanation).toContain('这个数是 51.4');
    expect(question.solution.explanation).toContain('进位到 52');
    expect(isNumericEqual('4', question.solution.answer)).toBe(true);
  });

  it('最小填几题的答案口径为方框内单个数字', () => {
    withMathRandomSequence([
      0,   // pickSubtype -> reverse-round
      0.9, // askMax -> false
      0.5, // target -> stable middle value
      0.7, // templateIdx -> 4
    ]);

    const question = generateNumberSense({
      difficulty: 5,
      id: 'issue-069-min',
      subtypeFilter: ['reverse-round'],
    });

    expect(question.prompt).toContain('□ 里最小能填几');
    expect(question.prompt).toContain('50.□');
    expect(question.prompt).toContain('结果变成了 51');
    expect(question.solution.answer).toBe('5');
    expect(question.solution.explanation).toContain('□ 最小填 5');
    expect(question.solution.explanation).toContain('这个数是 50.5');
    expect(question.solution.explanation).toContain('舍去到 50');
    expect(isNumericEqual('5', question.solution.answer)).toBe(true);
  });
});
