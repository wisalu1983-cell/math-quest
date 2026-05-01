/// <reference types="vitest/globals" />
import { describe, expect, it } from 'vitest';
import { generateVerticalCalc } from './vertical-calc';

describe('v0.5 Phase 5 · BL-017 cyclic-div 样例池审计', () => {
  it('高档循环小数长除法不再只依赖 3 个固定样例', () => {
    const questions = Array.from({ length: 120 }, (_, index) =>
      generateVerticalCalc({
        difficulty: 9,
        id: `phase5-cyclic-div-${index}`,
        subtypeFilter: ['cyclic-div'],
      }),
    );

    const prompts = new Set(questions.map(question => question.prompt));

    expect(prompts.size).toBeGreaterThan(20);
    for (const question of questions) {
      expect(question.data.kind).toBe('vertical-calc');
      const board = question.data.longDivisionBoard;
      expect(board).toBeDefined();
      expect(board!.mode).toBe('cyclic');
      expect(board!.cyclic?.repeating).toMatch(/^\d+$/);
    }
  });
});
