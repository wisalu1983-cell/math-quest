/// <reference types="vitest/globals" />
import { describe, expect, it } from 'vitest';
import { generateNumberSense } from './number-sense';
import type { Question } from '@/types';

function generateCompareQuestions(difficulty: number, n: number): Question[] {
  return Array.from({ length: n }, (_, i) =>
    generateNumberSense({
      difficulty,
      id: `phase3-number-sense-${difficulty}-${i}`,
      subtypeFilter: ['compare'],
    }),
  );
}

function singleChoiceStatement(question: Question): string | null {
  const match = question.prompt.match(/判断正误："(.+)"$/);
  return match?.[1] ?? null;
}

describe('v0.4 Phase 3 · A02 compare 质量优化', () => {
  it('difficulty=7 覆盖三类二步 compare 模板与三种答案', () => {
    const qs = generateCompareQuestions(7, 240);
    const explanations = qs.map(q => String(q.solution.explanation ?? ''));
    const answers = new Set(qs.map(q => String(q.solution.answer)));

    expect(explanations.some(text => text.includes('等价'))).toBe(true);
    expect(explanations.some(text => text.includes('整体倍率'))).toBe(true);
    expect(explanations.some(text => text.includes('合并'))).toBe(true);
    expect(answers).toEqual(new Set(['>', '<', '=']));

    for (const q of qs) {
      expect(q.type).toBe('multiple-choice');
      expect(q.data.kind).toBe('number-sense');
      expect(q.data.subtype).toBe('compare');
      expect(q.data.options).toEqual(['>', '<', '=']);
      expect(String(q.solution.explanation)).toMatch(/等价|整体倍率|合并/);
    }
  });

  it('difficulty=8 保留对错单选并扩充概念池与教学 explanation', () => {
    const qs = generateCompareQuestions(8, 900);
    const singleChoice = qs.filter(q =>
      q.type === 'multiple-choice'
      && q.data.kind === 'number-sense'
      && q.data.subtype === 'compare'
      && q.data.options.join('|') === '对|错',
    );
    const statements = new Set(singleChoice.map(singleChoiceStatement).filter(Boolean));
    const truthCounts = singleChoice.reduce<Record<string, number>>((acc, q) => {
      const answer = String(q.solution.answer);
      acc[answer] = (acc[answer] ?? 0) + 1;
      return acc;
    }, {});

    expect(singleChoice.length).toBeGreaterThan(250);
    expect(statements.size).toBeGreaterThanOrEqual(24);
    expect(Math.abs((truthCounts['对'] ?? 0) - (truthCounts['错'] ?? 0))).toBeLessThan(singleChoice.length * 0.25);

    for (const q of singleChoice) {
      expect(q.data.options).toEqual(['对', '错']);
      expect(String(q.solution.explanation)).toMatch(/规则|反例|条件|边界|因为|当|如果|必须|不能|非零/);
    }
  });
});
