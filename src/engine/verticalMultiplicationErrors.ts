import type { PracticeFailureDetail, PracticeFailureReason, VerticalCalcCompletePayload } from '@/types';
import { isEquivalentFinalAnswer } from './verticalMultiplication';

const PROCESS_FAILURE_MESSAGE = '你的最终答案是对的，但竖式里的计算步骤有错误。把步骤也写对，才能通过哦。';

const trainingLabels: Record<string, string> = {
  'operand-a-decimal-places': '被乘数小数位数错误',
  'operand-b-decimal-places': '乘数小数位数错误',
  'decimal-move': '小数点移动位数错误',
};

interface ClassifyMultiplicationErrorsParams {
  orderedInputKeys: string[];
  expectedByKey: Record<string, string>;
  userValues: Record<string, string>;
  finalAnswerKey: string;
  finalAnswerKeys?: string[];
}

function isExpectedValue(key: string, userValue: string, expectedValue: string, finalAnswerKey: string): boolean {
  if (key === finalAnswerKey) {
    return isEquivalentFinalAnswer(userValue, expectedValue);
  }
  return userValue.trim() === expectedValue;
}

function processCategoryForKey(key: string): { code: string; label: string } {
  if (key.startsWith('partial-')) {
    return { code: 'multiplication-partial-product', label: '部分积填写错误' };
  }
  if (key.startsWith('total-')) {
    return { code: 'multiplication-total', label: '竖式求和过程填写错误' };
  }
  return { code: 'multiplication-process', label: '竖式过程填写错误' };
}

function uniqueCategories(categories: Array<{ code: string; label: string }>) {
  const map = new Map<string, { code: string; label: string }>();
  for (const category of categories) map.set(category.code, category);
  return Array.from(map.values());
}

export function classifyMultiplicationErrors(
  params: ClassifyMultiplicationErrorsParams,
): VerticalCalcCompletePayload {
  const finalAnswerKeys = params.finalAnswerKeys?.length
    ? params.finalAnswerKeys
    : [params.finalAnswerKey];
  const finalAnswer = params.userValues[params.finalAnswerKey] ?? params.expectedByKey[params.finalAnswerKey] ?? '';
  const wrongFinalAnswerKey = finalAnswerKeys.find(key => !isExpectedValue(
    key,
    params.userValues[key] ?? '',
    params.expectedByKey[key] ?? '',
    params.finalAnswerKey,
  ));

  if (wrongFinalAnswerKey) {
    return {
      result: 'failWrongAnswer',
      answer: params.userValues[wrongFinalAnswerKey] ?? finalAnswer,
      failureReason: 'wrong-answer',
    };
  }

  const processCategories: Array<{ code: string; label: string }> = [];
  const trainingFieldMistakes: NonNullable<PracticeFailureDetail['trainingFieldMistakes']> = [];

  for (const key of params.orderedInputKeys) {
    if (finalAnswerKeys.includes(key)) continue;
    const expectedValue = params.expectedByKey[key];
    if (expectedValue == null) continue;
    const userValue = params.userValues[key] ?? '';
    if (isExpectedValue(key, userValue, expectedValue, params.finalAnswerKey)) continue;

    if (key in trainingLabels) {
      trainingFieldMistakes.push({
        code: key,
        label: trainingLabels[key],
        userValue,
        expectedValue,
      });
      continue;
    }

    processCategories.push(processCategoryForKey(key));
  }

  const uniqueProcessCategories = uniqueCategories(processCategories);
  if (uniqueProcessCategories.length === 0 && trainingFieldMistakes.length === 0) {
    return { result: 'pass', answer: finalAnswer };
  }

  const reason: PracticeFailureReason = uniqueProcessCategories.length > 0
    ? 'vertical-multiplication-process'
    : 'vertical-training-field';
  const detail: PracticeFailureDetail = {
    reason,
    source: 'vertical-multiplication',
    message: uniqueProcessCategories.length > 0 ? PROCESS_FAILURE_MESSAGE : '小数训练格有错误。',
    processCategories: uniqueProcessCategories,
    trainingFieldMistakes,
  };

  return {
    result: 'failProcess',
    answer: finalAnswer,
    failureReason: reason,
    failureDetail: detail,
  };
}
