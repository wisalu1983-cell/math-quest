import { expect, test, type Page, type TestInfo } from '@playwright/test';

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

type QuestionFixture = Record<string, unknown>;

function numericQuestion(id: string, prompt: string, answer: number): QuestionFixture {
  return {
    id,
    topicId: 'mental-arithmetic',
    type: 'numeric-input',
    difficulty: 3,
    prompt,
    data: {
      kind: 'mental-arithmetic',
      expression: prompt.replace(' = ?', ''),
      operands: [12, 8],
      operator: '+',
    },
    solution: {
      answer,
      explanation: `${prompt.replace('?', answer.toString())}`,
    },
    hints: [],
  };
}

function multiBlankQuestion(id: string, prompt: string, blanks: number[]): QuestionFixture {
  return {
    id,
    topicId: 'multi-step',
    type: 'multi-blank',
    difficulty: 6,
    prompt,
    data: {
      kind: 'multi-step',
      expression: prompt,
      steps: [],
      template: prompt,
    },
    solution: {
      answer: String(blanks.at(-1) ?? ''),
      blanks,
      explanation: '按步骤填写空位',
    },
    hints: [],
  };
}

function multiSelectQuestion(id: string, prompt: string, options: string[]): QuestionFixture {
  return {
    id,
    topicId: 'number-sense',
    type: 'multi-select',
    difficulty: 4,
    prompt,
    data: {
      kind: 'number-sense',
      subtype: 'compare',
      options,
    },
    solution: {
      answer: 'A,C',
      answers: ['A', 'C'],
      explanation: '选择所有正确说法',
    },
    hints: [],
  };
}

async function saveEvidence(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await page.waitForTimeout(350);
  await page.screenshot({
    path: testInfo.outputPath(name),
    fullPage: true,
  });
}

async function openPracticeQuestion(page: Page, question: QuestionFixture): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.evaluate((fixedQuestion) => {
    const harness = window as HarnessWindow;
    if (!harness.__MQ_SESSION__ || !harness.__MQ_UI__) {
      throw new Error('DEV store hooks are unavailable');
    }

    harness.__MQ_SESSION__.setState({
      active: true,
      session: {
        id: 'phase5-reset-session',
        userId: 'phase5-e2e',
        topicId: 'mental-arithmetic',
        startedAt: Date.now(),
        difficulty: 3,
        sessionMode: 'campaign',
        targetLevelId: 'phase5-reset-level',
        questions: [fixedQuestion],
        heartsRemaining: 3,
        completed: false,
      },
      currentQuestion: fixedQuestion,
      currentIndex: 0,
      totalQuestions: 2,
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
  }, question);

  await expect(page.getByRole('heading', { name: String(question.prompt) })).toBeVisible();
}

async function switchQuestion(page: Page, question: QuestionFixture, index: number): Promise<void> {
  await page.evaluate(({ fixedQuestion, nextIndex }) => {
    const harness = window as HarnessWindow;
    if (!harness.__MQ_SESSION__) {
      throw new Error('DEV session hook is unavailable');
    }

    harness.__MQ_SESSION__.setState({
      currentQuestion: fixedQuestion,
      currentIndex: nextIndex,
      questionStartTime: Date.now(),
      showFeedback: false,
    });
  }, { fixedQuestion: question, nextIndex: index });

  await expect(page.getByRole('heading', { name: String(question.prompt) })).toBeVisible();
}

async function pressMathKeys(page: Page, keys: string[]): Promise<void> {
  for (const key of keys) {
    await page.getByRole('button', { name: `输入 ${key}`, exact: true }).click({ force: true });
  }
}

async function activateInput(page: Page, label: string) {
  const input = page.getByRole('textbox', { name: label, exact: true });
  await input.click({ force: true });
  return input;
}

test.describe('v0.4 Phase 5 Practice input reset', () => {
  test('numeric answer is cleared and focused when the current question changes', async ({ page }, testInfo) => {
    const first = numericQuestion('phase5-numeric-1', '12 + 8 = ?', 20);
    const second = numericQuestion('phase5-numeric-2', '9 + 6 = ?', 15);

    await openPracticeQuestion(page, first);
    await pressMathKeys(page, ['9', '9']);
    await expect(page.getByRole('textbox', { name: '输入答案', exact: true })).toHaveValue('99');

    await switchQuestion(page, second, 1);

    await expect(page.getByRole('textbox', { name: '输入答案', exact: true })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: '输入答案', exact: true })).toHaveClass(/ring-2/);
    await saveEvidence(page, testInfo, 'G-01-numeric-reset-focused.png');
  });

  test('multi blank values are rebuilt from the next question shape', async ({ page }, testInfo) => {
    const first = multiBlankQuestion('phase5-blanks-3', '25 x 4 = __ x __ = __', [25, 4, 100]);
    const second = multiBlankQuestion('phase5-blanks-2', '18 + 12 = __ + __', [18, 12]);

    await openPracticeQuestion(page, first);
    await activateInput(page, '第 1 空');
    await pressMathKeys(page, ['2', '5']);
    await activateInput(page, '第 2 空');
    await pressMathKeys(page, ['4']);
    await activateInput(page, '第 3 空');
    await pressMathKeys(page, ['1', '0', '0']);

    await switchQuestion(page, second, 1);

    await expect(page.getByRole('textbox', { name: '第 1 空', exact: true })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: '第 2 空', exact: true })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: '第 3 空', exact: true })).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: '第 1 空', exact: true })).toHaveClass(/ring-2/);
    await saveEvidence(page, testInfo, 'I-01-multi-blank-rebuilt.png');
  });

  test('multi-select reset does not consume the quit dialog state', async ({ page }, testInfo) => {
    const first = multiSelectQuestion('phase5-select-1', '选择所有正确说法', [
      '2 是偶数',
      '3 是偶数',
      '4 是偶数',
    ]);
    const second = multiSelectQuestion('phase5-select-2', '再选一次正确说法', [
      '6 是偶数',
      '7 是偶数',
      '8 是偶数',
    ]);

    await openPracticeQuestion(page, first);
    const selectedButton = page.getByRole('button', { name: '2 是偶数' });
    await selectedButton.click();
    await expect(selectedButton).toHaveAttribute('aria-pressed', 'true');

    await switchQuestion(page, second, 1);

    await expect(page.getByRole('button', { name: '6 是偶数' })).toHaveAttribute('aria-pressed', 'false');
    await page.getByLabel('退出练习').click();
    await expect(page.getByRole('dialog', { name: '确定退出吗？' })).toBeVisible();
    await expect(page.getByRole('button', { name: '继续练习' })).toBeVisible();
    await saveEvidence(page, testInfo, 'H-01-multi-select-reset-quit-dialog.png');
  });
});
