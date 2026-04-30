import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const RUN_ARTIFACTS_DIR = path.join(
  process.cwd(),
  'QA',
  'runs',
  '2026-04-30-v05-phase4-long-division-qa',
  'artifacts',
);
const LONG_DIVISION_E2E_URL = process.env.MQ_LONG_DIVISION_E2E_URL ?? '/';

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

function integerLongDivisionQuestion() {
  return {
    id: 'phase4-long-division-936-div-4',
    topicId: 'vertical-calc',
    type: 'vertical-fill',
    difficulty: 5,
    prompt: '用竖式计算: 936 ÷ 4',
    data: {
      kind: 'vertical-calc',
      operation: '÷',
      operands: [936, 4],
      steps: [],
      longDivisionBoard: {
        mode: 'integer',
        originalDividend: '936',
        originalDivisor: '4',
        workingDividend: '936',
        workingDivisor: '4',
        finalAnswer: '234',
        quotientStartColumn: 0,
        quotientDecimalAfter: null,
        boardColumnCount: 3,
        expectedByKey: {
          'round-0-quotient': '2',
          'round-0-product': '8',
          'round-0-next': '13',
          'round-1-quotient': '3',
          'round-1-product': '12',
          'round-1-next': '16',
          'round-2-quotient': '4',
          'round-2-product': '16',
          'round-2-remainder': '0',
        },
        rounds: [
          { index: 0, currentPartialDividend: '9', quotientDigit: '2', product: '8', remainder: '1', nextPartialDividend: '13', broughtDownDigit: '3' },
          { index: 1, currentPartialDividend: '13', quotientDigit: '3', product: '12', remainder: '1', nextPartialDividend: '16', broughtDownDigit: '6' },
          { index: 2, currentPartialDividend: '16', quotientDigit: '4', product: '16', remainder: '0' },
        ],
      },
    },
    solution: {
      answer: '234',
      explanation: '936 ÷ 4 = 234',
    },
    hints: [],
  };
}

function decimalDivisorLongDivisionQuestion() {
  return {
    id: 'phase4-long-division-15-6-div-0-24',
    topicId: 'vertical-calc',
    type: 'vertical-fill',
    difficulty: 5,
    prompt: '用竖式计算: 15.6 ÷ 0.24',
    data: {
      kind: 'vertical-calc',
      operation: '÷',
      operands: [15.6, 0.24],
      steps: [],
      longDivisionBoard: {
        mode: 'decimal-divisor',
        originalDividend: '15.6',
        originalDivisor: '0.24',
        workingDividend: '1560',
        workingDivisor: '24',
        finalAnswer: '65',
        quotientStartColumn: 2,
        quotientDecimalAfter: null,
        boardColumnCount: 4,
        expectedByKey: {
          'setup-scale': '100',
          'setup-divisor': '24',
          'setup-dividend': '1560',
          'round-0-quotient': '6',
          'round-0-product': '144',
          'round-0-next': '120',
          'round-1-quotient': '5',
          'round-1-product': '120',
          'round-1-remainder': '0',
        },
        setupFields: [
          { id: 'setup-scale', label: '除数扩大', expected: '100', allowDecimal: true },
          { id: 'setup-divisor', label: '转换后除数', expected: '24', allowDecimal: true, mustBeInteger: true },
          { id: 'setup-dividend', label: '转换后被除数', expected: '1560', allowDecimal: true },
        ],
        rounds: [
          { index: 0, currentPartialDividend: '156', quotientDigit: '6', product: '144', remainder: '12', nextPartialDividend: '120', broughtDownDigit: '0' },
          { index: 1, currentPartialDividend: '120', quotientDigit: '5', product: '120', remainder: '0' },
        ],
      },
    },
    solution: {
      answer: '65',
      explanation: '15.6 ÷ 0.24 = 65',
    },
    hints: [],
  };
}

async function openLongDivisionQuestion(
  page: Page,
  question = integerLongDivisionQuestion(),
  options: { expectBoardVisible?: boolean } = {},
) {
  const { expectBoardVisible = true } = options;
  await page.goto(LONG_DIVISION_E2E_URL);
  await page.waitForLoadState('networkidle');

  await page.evaluate((fixedQuestion) => {
    const harness = window as HarnessWindow;
    if (!harness.__MQ_SESSION__ || !harness.__MQ_UI__ || !harness.__MQ_GAME_PROGRESS__) {
      throw new Error('DEV store hooks are unavailable');
    }
    harness.__MQ_GAME_PROGRESS__.setState({
      gameProgress: {
        userId: 'phase4-long-division-user',
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
        id: 'phase4-long-division-session',
        userId: 'phase4-long-division-user',
        topicId: 'vertical-calc',
        startedAt: Date.now(),
        difficulty: Number(fixedQuestion.difficulty),
        sessionMode: 'campaign',
        targetLevelId: 'phase4-long-division-level',
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

  await expect(page.getByRole('heading', { name: question.prompt })).toBeVisible();
  if (expectBoardVisible) {
    await expect(page.locator('[data-long-division-board-section="true"]')).toBeVisible();
  }
}

async function expectKeyboardLeavesPracticeArea(page: Page) {
  const keyboard = page.locator('[aria-label="计算输入键盘"]');
  await expect(keyboard).toBeVisible();
  const box = await keyboard.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.y / viewport!.height).toBeGreaterThanOrEqual(0.6);
}

async function pressMathKeys(page: Page, keys: string[]) {
  for (const key of keys) {
    const name = key === 'delete' ? '删除当前格' : `输入 ${key}`;
    await page.getByRole('button', { name, exact: true }).click({ force: true });
  }
}

async function fillSlot(page: Page, label: string, keys: string[]) {
  await page.getByRole('textbox', { name: label, exact: true }).click({ force: true });
  await pressMathKeys(page, keys);
}

async function fillDigitSlot(page: Page, label: string, digits: string[]) {
  for (const [index, digit] of digits.entries()) {
    await page.getByRole('textbox', { name: `${label}第 ${index + 1} 位`, exact: true }).click({ force: true });
    await pressMathKeys(page, [digit]);
  }
}

test('长除法板按商乘减落顺序接入内置键盘并能提交正确答案', async ({ page }) => {
  await openLongDivisionQuestion(page);
  await expectKeyboardLeavesPracticeArea(page);

  const board = page.locator('[data-long-division-board-section="true"]');
  await expect(board.getByRole('textbox')).toHaveCount(1);
  await expect(board.getByRole('textbox', { name: '第 1 轮商位第 1 位', exact: true })).toBeVisible();
  await expect(board.getByRole('textbox', { name: '第 1 轮乘积第 1 位', exact: true })).toHaveCount(0);

  fs.mkdirSync(RUN_ARTIFACTS_DIR, { recursive: true });
  await page.screenshot({
    path: path.join(RUN_ARTIFACTS_DIR, 'long-division-mobile-390.png'),
    fullPage: true,
  });

  await pressMathKeys(page, ['2']);
  await expect(page.getByRole('textbox', { name: '第 1 轮乘积第 1 位', exact: true })).toHaveClass(/ring-2/);
  await pressMathKeys(page, ['8']);
  await expect(page.getByRole('textbox', { name: '第 1 轮余数与落位第 1 位', exact: true })).toHaveClass(/ring-2/);

  await fillDigitSlot(page, '第 1 轮余数与落位', ['1', '3']);
  await fillDigitSlot(page, '第 2 轮商位', ['3']);
  await fillDigitSlot(page, '第 2 轮乘积', ['1', '2']);
  await fillDigitSlot(page, '第 2 轮余数与落位', ['1', '6']);
  await fillDigitSlot(page, '第 3 轮商位', ['4']);
  await fillDigitSlot(page, '第 3 轮乘积', ['1', '6']);
  await fillDigitSlot(page, '第 3 轮最终余数', ['0']);

  await page.getByRole('button', { name: '提交答案' }).click({ force: true });

  await expect(page.getByText('答对了！')).toBeVisible();
});

test('小数除小数扩倍通过后转换区退出并进入竖式逐位计算', async ({ page }) => {
  await openLongDivisionQuestion(page, decimalDivisorLongDivisionQuestion(), { expectBoardVisible: false });

  await expect(page.getByRole('textbox', { name: '除数扩大', exact: true })).toBeVisible();
  await expect(page.locator('[data-long-division-board-section="true"]')).toHaveCount(0);

  await fillSlot(page, '除数扩大', ['1', '0', '0']);
  await fillSlot(page, '转换后除数', ['2', '4']);
  await fillSlot(page, '转换后被除数', ['1', '5', '6', '0']);
  await page.getByRole('button', { name: '确认扩倍' }).click({ force: true });

  await expect(page.getByRole('textbox', { name: '除数扩大', exact: true })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: '转换后除数', exact: true })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: '转换后被除数', exact: true })).toHaveCount(0);
  await expect(page.locator('[data-long-division-board-section="true"]')).toBeVisible();
  await expect(page.getByRole('textbox', { name: '第 1 轮商位第 1 位', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '提交答案' })).toBeVisible();
});

test('长除法板在桌面视口保持可见并生成视觉证据', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await openLongDivisionQuestion(page);

  fs.mkdirSync(RUN_ARTIFACTS_DIR, { recursive: true });
  await expect(page.locator('[data-long-division-board-viewport="true"]')).toBeVisible();
  await page.addStyleTag({ content: '[aria-label="计算输入键盘"] { display: none !important; }' });
  await page.locator('[data-long-division-board-section="true"]').screenshot({
    path: path.join(RUN_ARTIFACTS_DIR, 'long-division-desktop-1024.png'),
  });
});

test('长除法板在 375px 手机视口保持可见并生成视觉证据', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openLongDivisionQuestion(page);
  await expectKeyboardLeavesPracticeArea(page);

  fs.mkdirSync(RUN_ARTIFACTS_DIR, { recursive: true });
  await expect(page.locator('[data-long-division-board-viewport="true"]')).toBeVisible();
  await page.screenshot({
    path: path.join(RUN_ARTIFACTS_DIR, 'long-division-mobile-375.png'),
    fullPage: true,
  });
});

test('长除法过程错误进入结构化错因反馈，不暴露过程正确值', async ({ page }) => {
  await openLongDivisionQuestion(page);

  await fillDigitSlot(page, '第 1 轮商位', ['3']);
  await fillDigitSlot(page, '第 1 轮乘积', ['8']);
  await fillDigitSlot(page, '第 1 轮余数与落位', ['1', '3']);
  await fillDigitSlot(page, '第 2 轮商位', ['3']);
  await fillDigitSlot(page, '第 2 轮乘积', ['1', '2']);
  await fillDigitSlot(page, '第 2 轮余数与落位', ['1', '6']);
  await fillDigitSlot(page, '第 3 轮商位', ['4']);
  await fillDigitSlot(page, '第 3 轮乘积', ['1', '6']);
  await fillDigitSlot(page, '第 3 轮最终余数', ['0']);

  await page.getByRole('button', { name: '提交答案' }).click({ force: true });

  await expect(page.getByText('未通过原因：本题未通过：竖式过程有误。')).toBeVisible();
  await expect(page.getByText('第 1 轮商位错误')).toBeVisible();
  await expect(page.getByText('正确是 2')).toHaveCount(0);
});
