import type { PracticeFailureDetail, PracticeFailureReason, TrainingFieldMistake } from '@/types';

interface FailureDisplayInput {
  failureReason?: PracticeFailureReason | null;
  failureDetail?: PracticeFailureDetail | null;
}

interface DisplayTrainingFieldMistake extends TrainingFieldMistake {
  userValue: string;
  text: string;
}

export interface PracticeFailureDisplay {
  summary: string;
  message: string;
  processCategories: Array<{ code: string; label: string }>;
  trainingFieldMistakes: DisplayTrainingFieldMistake[];
}

function legacyMessage(reason?: PracticeFailureReason | null): string {
  if (reason === 'vertical-process') return '进位/退位格填写错误';
  if (reason === 'vertical-multiplication-process') {
    return '你的最终答案是对的，但竖式里的计算步骤有错误。把步骤也写对，才能通过哦。';
  }
  if (reason === 'vertical-training-field') return '小数训练格有错误。';
  return '';
}

function formatTrainingMistake(mistake: TrainingFieldMistake): DisplayTrainingFieldMistake {
  const userValue = mistake.userValue.trim() || '未填写';
  const code = mistake.code ?? mistake.label;
  return {
    ...mistake,
    code,
    userValue,
    text: `${mistake.label}：你填 ${userValue}，正确是 ${mistake.expectedValue}`,
  };
}

export function getPracticeFailureDisplay(input: FailureDisplayInput): PracticeFailureDisplay {
  const detail = input.failureDetail;
  const message = detail?.message || legacyMessage(input.failureReason);
  const processCategories = detail?.processCategories ?? [];
  const trainingFieldMistakes = (detail?.trainingFieldMistakes ?? []).map(formatTrainingMistake);

  return {
    summary: processCategories[0]?.label || trainingFieldMistakes[0]?.label || message,
    message,
    processCategories,
    trainingFieldMistakes,
  };
}

export function hasPracticeFailureDisplayContent(display: PracticeFailureDisplay): boolean {
  return Boolean(
    display.message ||
    display.processCategories.length > 0 ||
    display.trainingFieldMistakes.length > 0,
  );
}
