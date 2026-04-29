import { describe, expect, it } from 'vitest';
import { classifyMultiplicationErrors } from './verticalMultiplicationErrors';

const keys = [
  'partial-0-1',
  'partial-0-2',
  'total-0',
  'operand-a-decimal-places',
  'operand-b-decimal-places',
  'decimal-move',
  'final-answer',
];

const expectedByKey = {
  'partial-0-1': '4',
  'partial-0-2': '3',
  'total-0': '7',
  'operand-a-decimal-places': '1',
  'operand-b-decimal-places': '1',
  'decimal-move': '2',
  'final-answer': '4.73',
};

describe('classifyMultiplicationErrors', () => {
  it('returns wrong-answer when the final answer is wrong and hides process details', () => {
    const result = classifyMultiplicationErrors({
      orderedInputKeys: keys,
      expectedByKey,
      userValues: { ...expectedByKey, 'partial-0-1': '9', 'final-answer': '4.7' },
      finalAnswerKey: 'final-answer',
    });

    expect(result.result).toBe('failWrongAnswer');
    expect(result.failureDetail).toBeUndefined();
  });

  it('classifies process errors when final answer is correct', () => {
    const result = classifyMultiplicationErrors({
      orderedInputKeys: keys,
      expectedByKey,
      userValues: { ...expectedByKey, 'partial-0-1': '9' },
      finalAnswerKey: 'final-answer',
    });

    expect(result.result).toBe('failProcess');
    expect(result.failureReason).toBe('vertical-multiplication-process');
    expect(result.failureDetail?.processCategories).toEqual([
      { code: 'multiplication-partial-product', label: '部分积填写错误' },
    ]);
    expect(result.failureDetail?.trainingFieldMistakes).toEqual([]);
  });

  it('classifies training field mistakes with values when final answer is correct', () => {
    const result = classifyMultiplicationErrors({
      orderedInputKeys: keys,
      expectedByKey,
      userValues: { ...expectedByKey, 'decimal-move': '' },
      finalAnswerKey: 'final-answer',
    });

    expect(result.result).toBe('failProcess');
    expect(result.failureReason).toBe('vertical-training-field');
    expect(result.failureDetail?.trainingFieldMistakes).toEqual([
      {
        code: 'decimal-move',
        label: '小数点移动位数错误',
        userValue: '',
        expectedValue: '2',
      },
    ]);
  });

  it('reports both process categories and training field mistakes when both are wrong', () => {
    const result = classifyMultiplicationErrors({
      orderedInputKeys: keys,
      expectedByKey,
      userValues: { ...expectedByKey, 'partial-0-1': '9', 'decimal-move': '1' },
      finalAnswerKey: 'final-answer',
    });

    expect(result.result).toBe('failProcess');
    expect(result.failureReason).toBe('vertical-multiplication-process');
    expect(result.failureDetail?.processCategories).toEqual([
      { code: 'multiplication-partial-product', label: '部分积填写错误' },
    ]);
    expect(result.failureDetail?.trainingFieldMistakes).toEqual([
      {
        code: 'decimal-move',
        label: '小数点移动位数错误',
        userValue: '1',
        expectedValue: '2',
      },
    ]);
  });

  it('returns pass when every registered input is correct', () => {
    const result = classifyMultiplicationErrors({
      orderedInputKeys: keys,
      expectedByKey,
      userValues: expectedByKey,
      finalAnswerKey: 'final-answer',
    });

    expect(result).toEqual({ result: 'pass', answer: '4.73' });
  });
});
