import { expect, test } from '@playwright/test';

type HarnessWindow = Window & {
  __MQ_SESSION__?: {
    setState: (partial: Record<string, unknown>) => void;
  };
  __MQ_UI__?: {
    getState: () => {
      setPage: (page: string) => void;
    };
  };
};

type StepType = 'digit' | 'carry';

interface FixedStep {
  stepIndex: number;
  stepType: StepType;
  column: number;
  row: number;
  expectedDigit: number;
  skippable: boolean;
  hint: string;
}

async function openFixedVerticalCalc(
  page: import('@playwright/test').Page,
  params: {
    id: string;
    difficulty?: number;
    prompt: string;
    operation: '+' | '-';
    operands: [number, number];
    steps: FixedStep[];
    answer: number;
    explanation: string;
  },
) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.evaluate((questionParams) => {
    const harness = window as HarnessWindow;
    if (!harness.__MQ_SESSION__ || !harness.__MQ_UI__) {
      throw new Error('DEV store hooks are unavailable');
    }

    const question = {
      id: questionParams.id,
      topicId: 'vertical-calc',
      type: 'vertical-fill',
      difficulty: questionParams.difficulty ?? 5,
      prompt: questionParams.prompt,
      data: {
        kind: 'vertical-calc',
        operation: questionParams.operation,
        operands: questionParams.operands,
        steps: questionParams.steps,
      },
      solution: {
        answer: questionParams.answer,
        steps: [questionParams.explanation],
        explanation: questionParams.explanation,
      },
      hints: [],
    };

    harness.__MQ_SESSION__.setState({
      active: true,
      session: {
        id: `${questionParams.id}-session`,
        userId: 'issue-066-e2e',
        topicId: 'vertical-calc',
        startedAt: Date.now(),
        difficulty: questionParams.difficulty ?? 5,
        sessionMode: 'campaign',
        targetLevelId: `${questionParams.id}-level`,
        questions: [],
        heartsRemaining: 3,
        completed: false,
      },
      currentQuestion: question,
      currentIndex: 0,
      totalQuestions: 1,
      hearts: 3,
      questionStartTime: Date.now(),
      showFeedback: false,
      lastAnswerCorrect: false,
      lastTrainingFieldMistakes: [],
      lastProcessWarning: null,
      lastFailureReason: null,
      pendingWrongQuestions: [],
      rankQuestionQueue: [],
      sessionDuplicateSignatures: new Set(),
      lastRankMatchAction: null,
    });
    harness.__MQ_UI__.getState().setPage('practice');
  }, params);

  await expect(page.getByRole('heading', { name: params.prompt })).toBeVisible();
  await page.locator('input[type="text"]').focus();
}

async function dispatchNativeInput(
  page: import('@playwright/test').Page,
  value: string,
  options: { inputType?: string; data?: string | null } = {},
) {
  await page.locator('input[type="text"]').evaluate((input, eventParams) => {
    const element = input as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(element),
      'value',
    )?.set;
    setter?.call(element, eventParams.value);
    element.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      inputType: eventParams.inputType ?? 'insertText',
      data: eventParams.data ?? eventParams.value,
    }));
  }, { value, ...options });
}

function verticalBoard(page: import('@playwright/test').Page) {
  return page.locator('.card.inline-block');
}

test('同一个 0 先触发 keydown 再触发 input 时只写当前格，不写入跳转后的下一格', async ({ page }) => {
  await openFixedVerticalCalc(page, {
    id: 'issue-066-zero-double-consume',
    prompt: '用竖式计算: 50 - 20',
    operation: '-',
    operands: [50, 20],
    steps: [
      { stepIndex: 0, stepType: 'digit', column: 0, row: 0, expectedDigit: 0, skippable: false, hint: '个位' },
      { stepIndex: 1, stepType: 'digit', column: 1, row: 0, expectedDigit: 3, skippable: false, hint: '十位' },
    ],
    answer: 30,
    explanation: '50 - 20 = 30',
  });

  await page.locator('input[type="text"]').evaluate((input) => {
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: '0',
      bubbles: true,
      cancelable: true,
    }));
  });
  await page.waitForTimeout(50);
  await dispatchNativeInput(page, '0');

  const board = verticalBoard(page);
  const processCells = board.locator(':scope > .mb-1.grid > div');
  const answerRow = board.locator(':scope > div.grid').last();

  await expect(answerRow.locator(':scope > div').nth(2)).toHaveText('0');
  await expect(processCells.nth(1)).toHaveText('');
  await expect(processCells.nth(1)).toHaveClass(/border-secondary/);
});

test('减法退位格输入 1 表示退 1，并自动回到同列答案格', async ({ page }) => {
  await openFixedVerticalCalc(page, {
    id: 'issue-066-borrow-semantic-one',
    prompt: '用竖式计算: 50 - 18',
    operation: '-',
    operands: [50, 18],
    steps: [
      { stepIndex: 0, stepType: 'digit', column: 0, row: 0, expectedDigit: 2, skippable: false, hint: '个位' },
      { stepIndex: 1, stepType: 'carry', column: 1, row: 0, expectedDigit: -1, skippable: false, hint: '十位退1' },
      { stepIndex: 2, stepType: 'digit', column: 1, row: 0, expectedDigit: 3, skippable: false, hint: '十位' },
    ],
    answer: 32,
    explanation: '50 - 18 = 32',
  });

  await page.keyboard.press('2');
  await page.keyboard.press('1');

  const board = verticalBoard(page);
  const processCells = board.locator(':scope > .mb-1.grid > div');
  const answerRow = board.locator(':scope > div.grid').last();

  await expect(processCells.nth(1)).toHaveText('退1');
  await expect(answerRow.locator(':scope > div').nth(1)).toHaveClass(/digit-cell-active/);
});

test('软键盘删除事件会清空当前活动格', async ({ page }) => {
  await openFixedVerticalCalc(page, {
    id: 'issue-066-soft-delete',
    prompt: '用竖式计算: 50 - 20',
    operation: '-',
    operands: [50, 20],
    steps: [
      { stepIndex: 0, stepType: 'digit', column: 0, row: 0, expectedDigit: 0, skippable: false, hint: '个位' },
      { stepIndex: 1, stepType: 'digit', column: 1, row: 0, expectedDigit: 3, skippable: false, hint: '十位' },
    ],
    answer: 30,
    explanation: '50 - 20 = 30',
  });

  await page.keyboard.press('0');

  const board = verticalBoard(page);
  const answerRow = board.locator(':scope > div.grid').last();
  const unitAnswer = answerRow.locator(':scope > div').nth(2);

  await unitAnswer.click();
  await dispatchNativeInput(page, '', {
    inputType: 'deleteContentBackward',
    data: null,
  });

  await expect(unitAnswer).toHaveText('');
  await expect(unitAnswer).toHaveClass(/digit-cell-active/);
});
