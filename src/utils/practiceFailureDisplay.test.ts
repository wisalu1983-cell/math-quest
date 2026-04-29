import { describe, expect, it } from 'vitest';
import type { PracticeFailureDetail } from '@/types';
import { getPracticeFailureDisplay } from './practiceFailureDisplay';

describe('practiceFailureDisplay', () => {
  it('falls back for legacy vertical process failures', () => {
    const display = getPracticeFailureDisplay({
      failureReason: 'vertical-process',
    });

    expect(display.summary).toBe('进位/退位格填写错误');
    expect(display.message).toBe('进位/退位格填写错误');
    expect(display.trainingFieldMistakes).toEqual([]);
  });

  it('explains multiplication process failures without exposing process values', () => {
    const detail: PracticeFailureDetail = {
      reason: 'vertical-multiplication-process',
      source: 'vertical-multiplication',
      message: '你的最终答案是对的，但竖式里的计算步骤有错误。把步骤也写对，才能通过哦。',
      processCategories: [
        { code: 'multiplication-partial-product', label: '部分积填写错误' },
      ],
    };

    const display = getPracticeFailureDisplay({
      failureReason: 'vertical-multiplication-process',
      failureDetail: detail,
    });

    expect(display.message).toBe('你的最终答案是对的，但竖式里的计算步骤有错误。把步骤也写对，才能通过哦。');
    expect(display.processCategories).toEqual([
      { code: 'multiplication-partial-product', label: '部分积填写错误' },
    ]);
    expect(JSON.stringify(display)).not.toContain('expectedValue');
  });

  it('formats training field mistakes and maps blank values to 未填写', () => {
    const detail: PracticeFailureDetail = {
      reason: 'vertical-training-field',
      source: 'vertical-multiplication',
      message: '小数训练格有错误。',
      trainingFieldMistakes: [
        {
          code: 'decimal-move',
          label: '小数点移动位数错误',
          userValue: '',
          expectedValue: '2',
        },
      ],
    };

    const display = getPracticeFailureDisplay({
      failureReason: 'vertical-training-field',
      failureDetail: detail,
    });

    expect(display.trainingFieldMistakes).toEqual([
      {
        code: 'decimal-move',
        label: '小数点移动位数错误',
        userValue: '未填写',
        expectedValue: '2',
        text: '小数点移动位数错误：你填 未填写，正确是 2',
      },
    ]);
  });
});
