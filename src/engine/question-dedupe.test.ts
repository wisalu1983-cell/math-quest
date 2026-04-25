/// <reference types="vitest/globals" />
import { describe, expect, it, vi } from 'vitest';
import {
  DEDUPE_RETRY_LIMIT,
  generateUniqueQuestion,
  getDuplicateSignature,
} from './question-dedupe';
import type { Question } from '@/types';

function makeQuestion(params: {
  id?: string;
  prompt: string;
  options?: string[];
  topicId?: Question['topicId'];
}): Question {
  return {
    id: params.id ?? params.prompt,
    topicId: params.topicId ?? 'number-sense',
    type: params.options ? 'multiple-choice' : 'numeric-input',
    difficulty: 4,
    prompt: params.prompt,
    data: {
      kind: 'number-sense',
      subtype: 'compare',
      options: params.options,
    },
    solution: { answer: params.options?.[0] ?? '42' },
    hints: [],
  };
}

describe('question dedupe signature', () => {
  it('闭合题干只按归一化 prompt 判重，不受选项顺序影响', () => {
    const a = makeQuestion({
      prompt: ' 判断正误："小数除以小数，商一定是小数" ',
      options: ['对', '错'],
    });
    const b = makeQuestion({
      prompt: '判断正误："小数除以小数，商一定是小数"',
      options: ['错', '对'],
    });

    expect(getDuplicateSignature(a)).toBe(getDuplicateSignature(b));
  });

  it('开放题干按 prompt + 排序后的 options 判重', () => {
    const base = makeQuestion({
      prompt: '下面哪个式子能先凑整？',
      options: ['25 × 4 × 17', '25 × 37 × 4', '18 × 5 × 2'],
    });
    const sameOptionsDifferentOrder = makeQuestion({
      prompt: '下面哪个式子能先凑整？',
      options: ['18 × 5 × 2', '25 × 4 × 17', '25 × 37 × 4'],
    });
    const differentOptions = makeQuestion({
      prompt: '下面哪个式子能先凑整？',
      options: ['125 × 8 × 4', '25 × 16 × 4', '35 × 99'],
    });

    expect(getDuplicateSignature(base)).toBe(getDuplicateSignature(sameOptionsDifferentOrder));
    expect(getDuplicateSignature(base)).not.toBe(getDuplicateSignature(differentOptions));
  });

  it('generateUniqueQuestion 遇到重复会 bounded retry 并记录新签名', () => {
    const seen = new Set<string>([getDuplicateSignature(makeQuestion({ prompt: '重复题' }))]);
    const generate = vi
      .fn()
      .mockReturnValueOnce(makeQuestion({ prompt: '重复题' }))
      .mockReturnValueOnce(makeQuestion({ prompt: '新题' }));

    const result = generateUniqueQuestion({
      generate,
      seen,
      context: { sessionMode: 'campaign', topicId: 'number-sense', difficulty: 4 },
    });

    expect(result.prompt).toBe('新题');
    expect(generate).toHaveBeenCalledTimes(2);
    expect(seen.has(getDuplicateSignature(result))).toBe(true);
  });

  it('retry 耗尽后接受当前题，不无限循环', () => {
    const seen = new Set<string>([getDuplicateSignature(makeQuestion({ prompt: '小题池重复' }))]);
    const generate = vi.fn(() => makeQuestion({ prompt: '小题池重复' }));
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined);

    const result = generateUniqueQuestion({
      generate,
      seen,
      context: { sessionMode: 'advance', topicId: 'number-sense', difficulty: 4 },
    });

    expect(result.prompt).toBe('小题池重复');
    expect(generate).toHaveBeenCalledTimes(DEDUPE_RETRY_LIMIT + 1);
    expect(debug).toHaveBeenCalledWith('[question-dedupe] retry exhausted', expect.objectContaining({
      sessionMode: 'advance',
      signature: getDuplicateSignature(result),
      retryCount: DEDUPE_RETRY_LIMIT,
    }));

    debug.mockRestore();
  });
});
