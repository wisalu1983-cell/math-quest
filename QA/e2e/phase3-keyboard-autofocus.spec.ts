import { expect, test, type Page } from '@playwright/test';

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

async function openVerticalQuestion(
  page: Page,
  params: {
    id: string;
    prompt: string;
    operation: '+' | '-' | '×';
    operands: [number, number];
    steps: FixedStep[];
    answer: string | number;
    multiplicationBoard?: Record<string, unknown>;
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
      difficulty: 6,
      prompt: questionParams.prompt,
      data: {
        kind: 'vertical-calc',
        operation: questionParams.operation,
        operands: questionParams.operands,
        steps: questionParams.steps,
        ...(questionParams.multiplicationBoard
          ? { multiplicationBoard: questionParams.multiplicationBoard }
          : {}),
      },
      solution: {
        answer: questionParams.answer,
        explanation: `${questionParams.prompt} = ${questionParams.answer}`,
      },
      hints: [],
    };

    harness.__MQ_SESSION__.setState({
      active: true,
      session: {
        id: `${questionParams.id}-session`,
        userId: 'keyboard-autofocus-e2e',
        topicId: 'vertical-calc',
        startedAt: Date.now(),
        difficulty: 6,
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
      lastFailureDetail: null,
      pendingWrongQuestions: [],
      rankQuestionQueue: [],
      sessionDuplicateSignatures: new Set(),
      lastRankMatchAction: null,
    });
    harness.__MQ_UI__.getState().setPage('practice');
  }, params);

  await expect(page.getByRole('heading', { name: params.prompt })).toBeVisible();
  await expect(page.locator('[aria-label="计算输入键盘"]')).toBeVisible();
}

async function openPracticeQuestion(
  page: Page,
  question: Record<string, unknown>,
) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.evaluate((questionParams) => {
    const harness = window as HarnessWindow;
    if (!harness.__MQ_SESSION__ || !harness.__MQ_UI__) {
      throw new Error('DEV store hooks are unavailable');
    }

    harness.__MQ_SESSION__.setState({
      active: true,
      session: {
        id: `${String(questionParams.id)}-session`,
        userId: 'keyboard-autofocus-e2e',
        topicId: String(questionParams.topicId),
        startedAt: Date.now(),
        difficulty: Number(questionParams.difficulty),
        sessionMode: 'campaign',
        targetLevelId: `${String(questionParams.id)}-level`,
        questions: [],
        heartsRemaining: 3,
        completed: false,
      },
      currentQuestion: questionParams,
      currentIndex: 0,
      totalQuestions: 1,
      hearts: 3,
      questionStartTime: Date.now(),
      showFeedback: false,
      lastAnswerCorrect: false,
      lastTrainingFieldMistakes: [],
      lastProcessWarning: null,
      lastFailureReason: null,
      lastFailureDetail: null,
      pendingWrongQuestions: [],
      rankQuestionQueue: [],
      sessionDuplicateSignatures: new Set(),
      lastRankMatchAction: null,
    });
    harness.__MQ_UI__.getState().setPage('practice');
  }, question);

  await expect(page.getByRole('heading', { name: String(question.prompt) })).toBeVisible();
  await expect(page.locator('[aria-label="计算输入键盘"]')).toBeVisible();
}

function legacyAnswerRow(page: Page) {
  return page.locator('.card.inline-block').locator(':scope > div.grid').last();
}

async function pressMathKey(page: Page, key: string) {
  const name = key === 'delete' ? '删除当前格' : `输入 ${key}`;
  await page.getByRole('button', { name, exact: true }).click({ force: true });
}

async function activeMultiplicationSlotLabel(page: Page): Promise<string | null> {
  return page.locator('input.ring-2').getAttribute('aria-label');
}

async function expectKeyboardDockedToViewport(page: Page) {
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  const keyboardBox = await page.locator('[aria-label="计算输入键盘"]').boundingBox();
  expect(keyboardBox).not.toBeNull();
  expect((keyboardBox?.y ?? 0) + (keyboardBox?.height ?? 0)).toBeGreaterThan((viewport?.height ?? 0) - 24);
}

async function expectInputActive(page: Page, ariaLabel: string) {
  await expect(page.getByLabel(ariaLabel)).toHaveClass(/ring-2/);
}

test('legacy 竖式格用内置键盘输入后自动移动到下一格', async ({ page }) => {
  await openVerticalQuestion(page, {
    id: 'keyboard-autofocus-legacy',
    prompt: '用竖式计算: 50 - 20',
    operation: '-',
    operands: [50, 20],
    steps: [
      { stepIndex: 0, stepType: 'digit', column: 0, row: 0, expectedDigit: 0, skippable: false, hint: '个位' },
      { stepIndex: 1, stepType: 'digit', column: 1, row: 0, expectedDigit: 3, skippable: false, hint: '十位' },
    ],
    answer: 30,
  });

  const answerCells = legacyAnswerRow(page).locator(':scope > div');

  await pressMathKey(page, '0');

  await expect(answerCells.nth(2)).toHaveText('0');
  await expect(answerCells.nth(1)).toHaveClass(/digit-cell-active/);
});

test('内置键盘固定在视口底部且不跟随题卡滚动', async ({ page }) => {
  await openVerticalQuestion(page, {
    id: 'keyboard-docked-to-viewport',
    prompt: '用竖式计算: 50 - 20',
    operation: '-',
    operands: [50, 20],
    steps: [
      { stepIndex: 0, stepType: 'digit', column: 0, row: 0, expectedDigit: 0, skippable: false, hint: '个位' },
      { stepIndex: 1, stepType: 'digit', column: 1, row: 0, expectedDigit: 3, skippable: false, hint: '十位' },
    ],
    answer: 30,
  });

  await expectKeyboardDockedToViewport(page);
  await page.mouse.wheel(0, 300);
  await expectKeyboardDockedToViewport(page);
});

test('多行乘法竖式格用内置键盘输入后自动移动到下一格', async ({ page }) => {
  await openVerticalQuestion(page, {
    id: 'keyboard-autofocus-multiplication',
    prompt: '用竖式计算: 1.2 × 0.3',
    operation: '×',
    operands: [12, 3],
    steps: [],
    answer: '0.36',
    multiplicationBoard: {
      mode: 'decimal',
      integerOperands: [12, 3],
      operandInputMode: 'static',
      originalOperands: ['1.2', '0.3'],
      operandDecimalPlaces: [1, 1],
      decimalPlaces: 2,
      finalAnswer: '0.36',
    },
  });

  const beforeActive = await activeMultiplicationSlotLabel(page);

  await pressMathKey(page, '3');

  const afterActive = await activeMultiplicationSlotLabel(page);
  expect(beforeActive).not.toBeNull();
  expect(afterActive).not.toBeNull();
  expect(afterActive).not.toBe(beforeActive);
});

test('商余数用内置键盘填满商后自动移动到余数', async ({ page }) => {
  await openPracticeQuestion(page, {
    id: 'keyboard-autofocus-division-remainder',
    topicId: 'mental-arithmetic',
    type: 'numeric-input',
    difficulty: 5,
    prompt: '37 ÷ 3 = ?',
    data: { operator: '÷' },
    solution: {
      answer: '12...1',
      explanation: '37 ÷ 3 = 12 余 1',
    },
    hints: [],
  });

  await pressMathKey(page, '1');
  await expectInputActive(page, '商（除法结果的商数部分）');

  await pressMathKey(page, '2');
  await expectInputActive(page, '余数（除法结果的余数部分）');
});

test('multi-blank 用内置键盘达到当前空答案长度后移动到下一空', async ({ page }) => {
  await openPracticeQuestion(page, {
    id: 'keyboard-autofocus-multi-blank',
    topicId: 'operation-laws',
    type: 'multi-blank',
    difficulty: 5,
    prompt: '把 12 和 3 填进两个空',
    data: {},
    solution: {
      answer: '12,3',
      blanks: [12, 3],
      explanation: '第一空是 12，第二空是 3',
    },
    hints: [],
  });

  await pressMathKey(page, '1');
  await expectInputActive(page, '第 1 空');

  await pressMathKey(page, '2');
  await expectInputActive(page, '第 2 空');
});

test('编辑回填再次填满后仍自动移动到下一空（当前体验观察）', async ({ page }) => {
  await openPracticeQuestion(page, {
    id: 'keyboard-autofocus-edit-refill',
    topicId: 'operation-laws',
    type: 'multi-blank',
    difficulty: 5,
    prompt: '把 12 和 3 填进两个空',
    data: {},
    solution: {
      answer: '12,3',
      blanks: [12, 3],
      explanation: '第一空是 12，第二空是 3',
    },
    hints: [],
  });

  await pressMathKey(page, '1');
  await expectInputActive(page, '第 1 空');

  await pressMathKey(page, '2');
  await expectInputActive(page, '第 2 空');

  await page.getByLabel('第 1 空').click();
  await pressMathKey(page, 'delete');
  await expectInputActive(page, '第 1 空');

  await pressMathKey(page, '2');
  await expectInputActive(page, '第 2 空');
});

test('训练格用内置键盘填满当前字段后移动到下一字段', async ({ page }) => {
  await openPracticeQuestion(page, {
    id: 'keyboard-autofocus-training-fields',
    topicId: 'decimal-multiplication',
    type: 'numeric-input',
    difficulty: 5,
    prompt: '先完成训练格',
    data: {
      trainingFields: [
        { label: '整数积', answer: '3', placeholder: '?' },
        { label: '小数位数', answer: '2', placeholder: '?' },
      ],
    },
    solution: {
      answer: '0.03',
      explanation: '3 向左移动 2 位得到 0.03',
    },
    hints: [],
  });

  await pressMathKey(page, '3');
  await expectInputActive(page, '小数位数');
});

test('多行乘法部分积和总积按右到左顺序输入并用 Tab 延续同一顺序', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await openVerticalQuestion(page, {
    id: 'keyboard-autofocus-multiplication-rtl',
    prompt: '用竖式计算: 90.8 × 5',
    operation: '×',
    operands: [908, 5],
    steps: [],
    answer: '454',
    multiplicationBoard: {
      mode: 'decimal',
      integerOperands: [908, 5],
      operandInputMode: 'static',
      originalOperands: ['90.8', '5'],
      operandDecimalPlaces: [1, 0],
      decimalPlaces: 1,
      finalAnswer: '454',
    },
  });

  await expect(page.locator('input.ring-2')).toHaveAttribute('aria-label', '第 1 个部分积第 4 格');

  await pressMathKey(page, '0');
  await expect(page.locator('input.ring-2')).toHaveAttribute('aria-label', '第 1 个部分积第 3 格');

  await page.keyboard.press('Tab');
  await expect(page.locator('input.ring-2')).toHaveAttribute('aria-label', '第 1 个部分积第 2 格');

  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('input.ring-2')).toHaveAttribute('aria-label', '第 1 个部分积第 3 格');
});
