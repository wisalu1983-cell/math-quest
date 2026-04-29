import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

type HarnessWindow = Window & {
  __MQ_SESSION__?: {
    setState: (partial: Record<string, unknown>) => void;
  };
  __MQ_GAME_PROGRESS__?: {
    setState: (partial: Record<string, unknown>) => void;
  };
  __MQ_UI__?: {
    getState: () => {
      setPage: (page: string) => void;
    };
  };
};

const RUN_ARTIFACTS_DIR = path.join(
  process.cwd(),
  'QA',
  'runs',
  '2026-04-29-v05-phase3-input-feedback-qa',
  'artifacts',
);

function decimalMultiplicationQuestion() {
  return {
    id: 'phase3-decimal-training-failure',
    topicId: 'vertical-calc',
    type: 'vertical-fill',
    difficulty: 6,
    prompt: '用竖式计算: 1.2 × 0.3',
    data: {
      kind: 'vertical-calc',
      operation: '×',
      operands: [12, 3],
      steps: [],
      multiplicationBoard: {
        mode: 'decimal',
        integerOperands: [12, 3],
        operandInputMode: 'static',
        originalOperands: ['1.2', '0.3'],
        operandDecimalPlaces: [1, 1],
        decimalPlaces: 2,
        finalAnswer: '0.36',
      },
    },
    solution: {
      answer: '0.36',
      explanation: '1.2 × 0.3 = 0.36',
    },
    hints: [],
  };
}

async function openDecimalMultiplication(page: Page): Promise<void> {
  const question = decimalMultiplicationQuestion();

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.evaluate((fixedQuestion) => {
    const harness = window as HarnessWindow;
    if (!harness.__MQ_SESSION__ || !harness.__MQ_UI__ || !harness.__MQ_GAME_PROGRESS__) {
      throw new Error('DEV store hooks are unavailable');
    }

    harness.__MQ_GAME_PROGRESS__.setState({
      gameProgress: {
        userId: 'phase3-qa-user',
        campaignProgress: {},
        advanceProgress: {},
        wrongQuestions: [],
        totalQuestionsAttempted: 0,
        totalQuestionsCorrect: 0,
      },
    });
    harness.__MQ_SESSION__.setState({
      active: true,
      session: {
        id: 'phase3-decimal-training-session',
        userId: 'phase3-qa-user',
        topicId: 'vertical-calc',
        startedAt: Date.now(),
        difficulty: 6,
        sessionMode: 'campaign',
        targetLevelId: 'phase3-decimal-training-level',
        questions: [],
        heartsRemaining: 3,
        completed: false,
      },
      currentQuestion: fixedQuestion,
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

  await expect(page.getByRole('heading', { name: '用竖式计算: 1.2 × 0.3' })).toBeVisible();
  await expect(page.locator('[aria-label="计算输入键盘"]')).toBeVisible();
}

async function pressMathKeys(page: Page, keys: string[]): Promise<void> {
  for (const key of keys) {
    const name = key === '.' ? '输入 .' : `输入 ${key}`;
    await page.getByRole('button', { name, exact: true }).click({ force: true });
  }
}

async function fillSlot(page: Page, label: string, keys: string[]): Promise<void> {
  const slot = page.getByRole('textbox', { name: label, exact: true });
  await slot.evaluate((element) => {
    element.scrollIntoView({ block: 'center', inline: 'nearest' });
  });
  await slot.click({ force: true });
  await pressMathKeys(page, keys);
}

test('小数乘法训练格错误会在反馈面板展示用户值和正确值', async ({ page }) => {
  await openDecimalMultiplication(page);

  await fillSlot(page, '第 1 个部分积第 2 格', ['6']);
  await fillSlot(page, '第 1 个部分积第 1 格', ['3']);
  await fillSlot(page, '积第 2 格', ['6']);
  await fillSlot(page, '积第 1 格', ['3']);
  await fillSlot(page, '1.2的小数位数', ['1']);
  await fillSlot(page, '0.3的小数位数', ['1']);
  await fillSlot(page, '小数点向左移动的位数', ['1']);
  await fillSlot(page, '最终答数', ['0', '.', '3', '6']);

  const submitButton = page.getByRole('button', { name: '提交' });
  await submitButton.evaluate((element) => {
    element.scrollIntoView({ block: 'center', inline: 'nearest' });
  });
  await submitButton.click({ force: true });

  await expect(page.getByText('未通过原因：小数训练格有错误。')).toBeVisible();
  await expect(page.getByText('小数点移动位数错误')).toBeVisible();
  await expect(page.getByText('你填')).toBeVisible();
  await expect(page.getByText('正确是')).toBeVisible();

  fs.mkdirSync(RUN_ARTIFACTS_DIR, { recursive: true });
  await page.screenshot({
    path: path.join(RUN_ARTIFACTS_DIR, 'decimal-training-failure-feedback.png'),
    fullPage: true,
  });
});
