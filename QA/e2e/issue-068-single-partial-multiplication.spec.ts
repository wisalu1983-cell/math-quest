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
  '2026-04-29-v05-issue-068-single-partial-multiplication-qa',
  'artifacts',
);

function singlePartialDecimalMultiplicationQuestion() {
  return {
    id: 'issue-068-single-partial-decimal-multiplication',
    topicId: 'vertical-calc',
    type: 'vertical-fill',
    difficulty: 6,
    prompt: '列竖式计算: 90.8 × 5',
    data: {
      kind: 'vertical-calc',
      operation: '×',
      operands: [908, 5],
      steps: [],
      multiplicationBoard: {
        mode: 'decimal',
        integerOperands: [908, 5],
        operandInputMode: 'static',
        originalOperands: ['90.8', '5'],
        operandDecimalPlaces: [1, 0],
        decimalPlaces: 1,
        finalAnswer: '454',
      },
    },
    solution: {
      answer: '454',
      explanation: '90.8 × 5 = 454',
    },
    hints: [],
  };
}

async function openSinglePartialDecimalMultiplication(page: Page): Promise<void> {
  const question = singlePartialDecimalMultiplicationQuestion();

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.evaluate((fixedQuestion) => {
    const harness = window as HarnessWindow;
    if (!harness.__MQ_SESSION__ || !harness.__MQ_UI__ || !harness.__MQ_GAME_PROGRESS__) {
      throw new Error('DEV store hooks are unavailable');
    }

    harness.__MQ_GAME_PROGRESS__.setState({
      gameProgress: {
        userId: 'issue-068-qa-user',
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
        id: 'issue-068-session',
        userId: 'issue-068-qa-user',
        topicId: 'vertical-calc',
        startedAt: Date.now(),
        difficulty: 6,
        sessionMode: 'campaign',
        targetLevelId: 'issue-068-level',
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

  await expect(page.getByRole('heading', { name: '列竖式计算: 90.8 × 5' })).toBeVisible();
  await expect(page.locator('[aria-label="计算输入键盘"]')).toBeVisible();
}

async function pressMathKeys(page: Page, keys: string[]): Promise<void> {
  for (const key of keys) {
    const name = key === '.' ? '输入 .' : `输入 ${key}`;
    await page.getByRole('button', { name, exact: true }).click({ force: true });
  }
}

async function fillSlot(page: Page, label: string, keys: string[]): Promise<void> {
  await page.getByRole('textbox', { name: label, exact: true }).click({ force: true });
  await pressMathKeys(page, keys);
}

test('单行过程积乘法不展示重复合计行', async ({ page }) => {
  await openSinglePartialDecimalMultiplication(page);

  await expect(page.getByRole('textbox', { name: /^第 1 个部分积第 \d+ 格$/ })).toHaveCount(4);
  await expect(page.getByRole('textbox', { name: /^积第 \d+ 格$/ })).toHaveCount(0);
  const separatorCount = await page.locator('.rounded-2xl.border-2.border-border.bg-bg.p-3').evaluate(board =>
    Array.from(board.children).filter(child =>
      child instanceof HTMLElement &&
      child.classList.contains('border-b-2') &&
      child.classList.contains('border-text'),
    ).length,
  );
  expect(separatorCount).toBe(1);

  fs.mkdirSync(RUN_ARTIFACTS_DIR, { recursive: true });
  await page.screenshot({
    path: path.join(RUN_ARTIFACTS_DIR, 'single-partial-no-duplicate-total-row.png'),
    fullPage: true,
  });
});

test('单行过程积填错按最终答案错误处理', async ({ page }) => {
  await openSinglePartialDecimalMultiplication(page);

  await fillSlot(page, '第 1 个部分积第 1 格', ['4']);
  await fillSlot(page, '第 1 个部分积第 2 格', ['5']);
  await fillSlot(page, '第 1 个部分积第 3 格', ['4']);
  await fillSlot(page, '第 1 个部分积第 4 格', ['1']);
  await fillSlot(page, '90.8的小数位数', ['1']);
  await fillSlot(page, '5的小数位数', ['0']);
  await fillSlot(page, '小数点向左移动的位数', ['1']);
  await fillSlot(page, '最终答数', ['4', '5', '4']);

  await page.getByRole('button', { name: '提交' }).click({ force: true });

  await expect(page.getByText('正确答案：')).toBeVisible();
  await expect(page.getByText('未通过原因：')).toHaveCount(0);
  await expect(page.getByText('部分积填写错误')).toHaveCount(0);
});
