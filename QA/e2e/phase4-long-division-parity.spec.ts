import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.MQ_LONG_DIVISION_PARITY_URL ?? '/';
const FORMAL_URL = process.env.MQ_FORMAL_PROTOTYPE_URL ?? '/?preview=longdiv-formal';
const ARTIFACT_DIR = path.join(
  process.cwd(),
  'QA',
  'runs',
  '2026-04-30-v05-phase4-long-division-parity-qa',
  'artifacts',
);

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

type BoardInput = {
  label: string;
  value: string;
  kind: 'field' | 'digits';
};

type Fixture = {
  id: string;
  shortTitle: string;
  formalHeading: string;
  prompt: string;
  answer: string;
  difficulty: number;
  operands: Array<number | string>;
  board: Record<string, unknown>;
  conversionInputs?: BoardInput[];
  boardInputs: BoardInput[];
  resultInputs?: BoardInput[];
  firstProcessMistakeCategory: string;
  cyclic?: boolean;
};

type Signature = {
  actionButton: string | null;
  activeLabel: string | null;
  boardVisible: boolean;
  conversionVisible: boolean;
  cyclicDotCount: number;
  cyclicPreviewVisible: boolean;
  ellipsisVisible: boolean;
  hasLongDivisionBracket: boolean;
  labels: string[];
  values: Record<string, string>;
};

type FillRecordOptions = {
  signatures?: Array<{ step: string; signature: Signature }>;
  useKeyboard?: boolean;
};

const fixtures: Fixture[] = [
  {
    id: 'integer-remainder',
    shortTitle: '整数多轮',
    formalHeading: '整数除法 · 多次余数传递',
    prompt: '用竖式计算: 936 ÷ 4',
    answer: '234',
    difficulty: 5,
    operands: [936, 4],
    firstProcessMistakeCategory: '第 1 轮商位错误',
    board: {
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
    boardInputs: [
      { label: '第 1 轮商位', value: '2', kind: 'digits' },
      { label: '第 1 轮乘积', value: '8', kind: 'digits' },
      { label: '第 1 轮余数与落位', value: '13', kind: 'digits' },
      { label: '第 2 轮商位', value: '3', kind: 'digits' },
      { label: '第 2 轮乘积', value: '12', kind: 'digits' },
      { label: '第 2 轮余数与落位', value: '16', kind: 'digits' },
      { label: '第 3 轮商位', value: '4', kind: 'digits' },
      { label: '第 3 轮乘积', value: '16', kind: 'digits' },
      { label: '第 3 轮最终余数', value: '0', kind: 'digits' },
    ],
  },
  {
    id: 'middle-zero',
    shortTitle: '商中 0',
    formalHeading: '整数除法 · 商中间 0',
    prompt: '用竖式计算: 824 ÷ 4',
    answer: '206',
    difficulty: 5,
    operands: [824, 4],
    firstProcessMistakeCategory: '第 1 轮商位错误',
    board: {
      mode: 'integer',
      originalDividend: '824',
      originalDivisor: '4',
      workingDividend: '824',
      workingDivisor: '4',
      finalAnswer: '206',
      quotientStartColumn: 0,
      quotientDecimalAfter: null,
      boardColumnCount: 3,
      expectedByKey: {
        'round-0-quotient': '2',
        'round-0-product': '8',
        'round-0-next': '2',
        'round-1-quotient': '0',
        'round-1-product': '0',
        'round-1-next': '24',
        'round-2-quotient': '6',
        'round-2-product': '24',
        'round-2-remainder': '0',
      },
      rounds: [
        { index: 0, currentPartialDividend: '8', quotientDigit: '2', product: '8', remainder: '0', nextPartialDividend: '2', broughtDownDigit: '2' },
        { index: 1, currentPartialDividend: '2', quotientDigit: '0', product: '0', remainder: '2', nextPartialDividend: '24', broughtDownDigit: '4' },
        { index: 2, currentPartialDividend: '24', quotientDigit: '6', product: '24', remainder: '0' },
      ],
    },
    boardInputs: [
      { label: '第 1 轮商位', value: '2', kind: 'digits' },
      { label: '第 1 轮乘积', value: '8', kind: 'digits' },
      { label: '第 1 轮余数与落位', value: '2', kind: 'digits' },
      { label: '第 2 轮商位', value: '0', kind: 'digits' },
      { label: '第 2 轮乘积', value: '0', kind: 'digits' },
      { label: '第 2 轮余数与落位', value: '24', kind: 'digits' },
      { label: '第 3 轮商位', value: '6', kind: 'digits' },
      { label: '第 3 轮乘积', value: '24', kind: 'digits' },
      { label: '第 3 轮最终余数', value: '0', kind: 'digits' },
    ],
  },
  {
    id: 'decimal-dividend',
    shortTitle: '小数÷整数',
    formalHeading: '小数 ÷ 整数 · 小数点预置',
    prompt: '用竖式计算: 5.76 ÷ 3',
    answer: '1.92',
    difficulty: 5,
    operands: [5.76, 3],
    firstProcessMistakeCategory: '第 1 轮商位错误',
    board: {
      mode: 'decimal-dividend',
      originalDividend: '5.76',
      originalDivisor: '3',
      workingDividend: '5.76',
      workingDivisor: '3',
      finalAnswer: '1.92',
      quotientStartColumn: 0,
      quotientDecimalAfter: 0,
      boardColumnCount: 3,
      expectedByKey: {
        'round-0-quotient': '1',
        'round-0-product': '3',
        'round-0-next': '27',
        'round-1-quotient': '9',
        'round-1-product': '27',
        'round-1-next': '6',
        'round-2-quotient': '2',
        'round-2-product': '6',
        'round-2-remainder': '0',
      },
      rounds: [
        { index: 0, currentPartialDividend: '5', quotientDigit: '1', product: '3', remainder: '2', nextPartialDividend: '27', broughtDownDigit: '7' },
        { index: 1, currentPartialDividend: '27', quotientDigit: '9', product: '27', remainder: '0', nextPartialDividend: '6', broughtDownDigit: '6' },
        { index: 2, currentPartialDividend: '6', quotientDigit: '2', product: '6', remainder: '0' },
      ],
    },
    boardInputs: [
      { label: '第 1 轮商位', value: '1', kind: 'digits' },
      { label: '第 1 轮乘积', value: '3', kind: 'digits' },
      { label: '第 1 轮余数与落位', value: '27', kind: 'digits' },
      { label: '第 2 轮商位', value: '9', kind: 'digits' },
      { label: '第 2 轮乘积', value: '27', kind: 'digits' },
      { label: '第 2 轮余数与落位', value: '6', kind: 'digits' },
      { label: '第 3 轮商位', value: '2', kind: 'digits' },
      { label: '第 3 轮乘积', value: '6', kind: 'digits' },
      { label: '第 3 轮最终余数', value: '0', kind: 'digits' },
    ],
  },
  {
    id: 'decimal-divisor',
    shortTitle: '小数÷小数',
    formalHeading: '小数 ÷ 小数 · 扩倍训练格',
    prompt: '用竖式计算: 15.6 ÷ 0.24',
    answer: '65',
    difficulty: 5,
    operands: [15.6, 0.24],
    firstProcessMistakeCategory: '第 1 轮商位错误',
    board: {
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
    conversionInputs: [
      { label: '除数扩大', value: '100', kind: 'field' },
      { label: '转换后除数', value: '24', kind: 'field' },
      { label: '转换后被除数', value: '1560', kind: 'field' },
    ],
    boardInputs: [
      { label: '第 1 轮商位', value: '6', kind: 'digits' },
      { label: '第 1 轮乘积', value: '144', kind: 'digits' },
      { label: '第 1 轮余数与落位', value: '120', kind: 'digits' },
      { label: '第 2 轮商位', value: '5', kind: 'digits' },
      { label: '第 2 轮乘积', value: '120', kind: 'digits' },
      { label: '第 2 轮最终余数', value: '0', kind: 'digits' },
    ],
  },
  {
    id: 'approximation',
    shortTitle: '取近似',
    formalHeading: '取近似 · 算到保留位后一位',
    prompt: '用竖式计算: 8.5 ÷ 3（保留两位小数）',
    answer: '2.83',
    difficulty: 5,
    operands: [8.5, 3],
    firstProcessMistakeCategory: '第 1 轮商位错误',
    board: {
      mode: 'approximation',
      originalDividend: '8.5',
      originalDivisor: '3',
      workingDividend: '8.5',
      workingDivisor: '3',
      finalAnswer: '2.83',
      quotientStartColumn: 0,
      quotientDecimalAfter: 0,
      boardColumnCount: 4,
      expectedByKey: {
        'round-0-quotient': '2',
        'round-0-product': '6',
        'round-0-next': '25',
        'round-1-quotient': '8',
        'round-1-product': '24',
        'round-1-next': '10',
        'round-2-quotient': '3',
        'round-2-product': '9',
        'round-2-next': '10',
        'round-3-quotient': '3',
        'round-3-product': '9',
        'round-3-remainder': '1',
        'result-approximation': '2.83',
      },
      rounds: [
        { index: 0, currentPartialDividend: '8', quotientDigit: '2', product: '6', remainder: '2', nextPartialDividend: '25', broughtDownDigit: '5' },
        { index: 1, currentPartialDividend: '25', quotientDigit: '8', product: '24', remainder: '1', nextPartialDividend: '10', broughtDownDigit: '0' },
        { index: 2, currentPartialDividend: '10', quotientDigit: '3', product: '9', remainder: '1', nextPartialDividend: '10', broughtDownDigit: '0' },
        { index: 3, currentPartialDividend: '10', quotientDigit: '3', product: '9', remainder: '1' },
      ],
      resultFields: [
        { id: 'result-approximation', label: '保留两位小数', expected: '2.83', allowDecimal: true },
      ],
    },
    boardInputs: [
      { label: '第 1 轮商位', value: '2', kind: 'digits' },
      { label: '第 1 轮乘积', value: '6', kind: 'digits' },
      { label: '第 1 轮余数与落位', value: '25', kind: 'digits' },
      { label: '第 2 轮商位', value: '8', kind: 'digits' },
      { label: '第 2 轮乘积', value: '24', kind: 'digits' },
      { label: '第 2 轮余数与落位', value: '10', kind: 'digits' },
      { label: '第 3 轮商位', value: '3', kind: 'digits' },
      { label: '第 3 轮乘积', value: '9', kind: 'digits' },
      { label: '第 3 轮余数与落位', value: '10', kind: 'digits' },
      { label: '第 4 轮商位', value: '3', kind: 'digits' },
      { label: '第 4 轮乘积', value: '9', kind: 'digits' },
      { label: '第 4 轮最终余数', value: '1', kind: 'digits' },
    ],
    resultInputs: [
      { label: '保留两位小数', value: '2.83', kind: 'field' },
    ],
  },
  {
    id: 'cyclic',
    shortTitle: '循环小数',
    formalHeading: '循环小数 · 非循环部分 + 循环节',
    prompt: '用竖式计算: 14 ÷ 135',
    answer: '0.1037037',
    difficulty: 8,
    operands: [14, 135],
    firstProcessMistakeCategory: '第 1 轮商位错误',
    cyclic: true,
    board: {
      mode: 'cyclic',
      originalDividend: '14',
      originalDivisor: '135',
      workingDividend: '14',
      workingDivisor: '135',
      finalAnswer: '0.1037037',
      quotientStartColumn: 0,
      quotientDecimalAfter: 0,
      boardColumnCount: 8,
      expectedByKey: {
        'round-0-quotient': '0',
        'round-0-product': '0',
        'round-0-next': '140',
        'round-1-quotient': '1',
        'round-1-product': '135',
        'round-1-next': '50',
        'round-2-quotient': '0',
        'round-2-product': '0',
        'round-2-next': '500',
        'round-3-quotient': '3',
        'round-3-product': '405',
        'round-3-next': '950',
        'round-4-quotient': '7',
        'round-4-product': '945',
        'round-4-next': '50',
        'round-5-quotient': '0',
        'round-5-product': '0',
        'round-5-next': '500',
        'round-6-quotient': '3',
        'round-6-product': '405',
        'round-6-next': '950',
        'round-7-quotient': '7',
        'round-7-product': '945',
        'round-7-remainder': '5',
        'result-non-repeating': '0.1',
        'result-repeating': '037',
      },
      rounds: [
        { index: 0, currentPartialDividend: '14', quotientDigit: '0', product: '0', remainder: '14', nextPartialDividend: '140', broughtDownDigit: '0' },
        { index: 1, currentPartialDividend: '140', quotientDigit: '1', product: '135', remainder: '5', nextPartialDividend: '50', broughtDownDigit: '0' },
        { index: 2, currentPartialDividend: '50', quotientDigit: '0', product: '0', remainder: '50', nextPartialDividend: '500', broughtDownDigit: '0' },
        { index: 3, currentPartialDividend: '500', quotientDigit: '3', product: '405', remainder: '95', nextPartialDividend: '950', broughtDownDigit: '0' },
        { index: 4, currentPartialDividend: '950', quotientDigit: '7', product: '945', remainder: '5', nextPartialDividend: '50', broughtDownDigit: '0' },
        { index: 5, currentPartialDividend: '50', quotientDigit: '0', product: '0', remainder: '50', nextPartialDividend: '500', broughtDownDigit: '0' },
        { index: 6, currentPartialDividend: '500', quotientDigit: '3', product: '405', remainder: '95', nextPartialDividend: '950', broughtDownDigit: '0' },
        { index: 7, currentPartialDividend: '950', quotientDigit: '7', product: '945', remainder: '5' },
      ],
      resultFields: [
        { id: 'result-non-repeating', label: '非循环部分', expected: '0.1', allowDecimal: true },
        { id: 'result-repeating', label: '循环节', expected: '037', allowDecimal: false },
      ],
      cyclic: {
        nonRepeating: '0.1',
        repeating: '037',
        displayText: '0.1037',
      },
    },
    boardInputs: [
      { label: '第 1 轮商位', value: '0', kind: 'digits' },
      { label: '第 1 轮乘积', value: '0', kind: 'digits' },
      { label: '第 1 轮余数与落位', value: '140', kind: 'digits' },
      { label: '第 2 轮商位', value: '1', kind: 'digits' },
      { label: '第 2 轮乘积', value: '135', kind: 'digits' },
      { label: '第 2 轮余数与落位', value: '50', kind: 'digits' },
      { label: '第 3 轮商位', value: '0', kind: 'digits' },
      { label: '第 3 轮乘积', value: '0', kind: 'digits' },
      { label: '第 3 轮余数与落位', value: '500', kind: 'digits' },
      { label: '第 4 轮商位', value: '3', kind: 'digits' },
      { label: '第 4 轮乘积', value: '405', kind: 'digits' },
      { label: '第 4 轮余数与落位', value: '950', kind: 'digits' },
      { label: '第 5 轮商位', value: '7', kind: 'digits' },
      { label: '第 5 轮乘积', value: '945', kind: 'digits' },
      { label: '第 5 轮余数与落位', value: '50', kind: 'digits' },
      { label: '第 6 轮商位', value: '0', kind: 'digits' },
      { label: '第 6 轮乘积', value: '0', kind: 'digits' },
      { label: '第 6 轮余数与落位', value: '500', kind: 'digits' },
      { label: '第 7 轮商位', value: '3', kind: 'digits' },
      { label: '第 7 轮乘积', value: '405', kind: 'digits' },
      { label: '第 7 轮余数与落位', value: '950', kind: 'digits' },
      { label: '第 8 轮商位', value: '7', kind: 'digits' },
      { label: '第 8 轮乘积', value: '945', kind: 'digits' },
      { label: '第 8 轮最终余数', value: '5', kind: 'digits' },
    ],
    resultInputs: [
      { label: '非循环部分', value: '0.1', kind: 'field' },
      { label: '循环节', value: '037', kind: 'field' },
    ],
  },
];

function questionFor(fixture: Fixture) {
  return {
    id: `phase4-long-division-parity-${fixture.id}`,
    topicId: 'vertical-calc',
    type: 'vertical-fill',
    difficulty: fixture.difficulty,
    prompt: fixture.prompt,
    data: {
      kind: 'vertical-calc',
      operation: '÷',
      operands: fixture.operands,
      steps: [],
      longDivisionBoard: fixture.board,
    },
    solution: {
      answer: fixture.answer,
      explanation: `${fixture.prompt.replace('用竖式计算: ', '')} = ${fixture.answer}`,
    },
    hints: [],
  };
}

function allInputs(fixture: Fixture) {
  return [
    ...(fixture.conversionInputs ?? []),
    ...fixture.boardInputs,
    ...(fixture.resultInputs ?? []),
  ];
}

async function openFormalScenario(page: Page, fixture: Fixture) {
  await page.goto(FORMAL_URL);
  await page.waitForLoadState('networkidle');
  const navButton = page.locator('nav').getByRole('button').filter({ hasText: fixture.shortTitle });
  await expect(navButton).toHaveCount(1);
  await navButton.click();
  await expect(page.getByRole('heading', { name: fixture.formalHeading, exact: true })).toBeVisible();
}

async function openProductionScenario(page: Page, fixture: Fixture) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.evaluate((fixedQuestion) => {
    const harness = window as HarnessWindow;
    if (!harness.__MQ_SESSION__ || !harness.__MQ_UI__ || !harness.__MQ_GAME_PROGRESS__) {
      throw new Error('DEV store hooks are unavailable');
    }
    harness.__MQ_GAME_PROGRESS__.setState({
      gameProgress: {
        userId: 'phase4-long-division-parity-user',
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
        id: 'phase4-long-division-parity-session',
        userId: 'phase4-long-division-parity-user',
        topicId: 'vertical-calc',
        startedAt: Date.now(),
        difficulty: Number(fixedQuestion.difficulty),
        sessionMode: 'campaign',
        targetLevelId: 'phase4-long-division-parity-level',
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
  }, questionFor(fixture));
  await expect(page.getByRole('heading', { name: fixture.prompt })).toBeVisible();
}

async function collectSignature(page: Page): Promise<Signature> {
  return page.evaluate(() => {
    const isVisible = (element: Element) => {
      const htmlElement = element as HTMLElement;
      const style = window.getComputedStyle(htmlElement);
      const rect = htmlElement.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[aria-label]')).filter(isVisible);
    const values = Object.fromEntries(inputs.map(input => [input.getAttribute('aria-label') ?? '', input.value]));
    const activeInput = inputs.find(input => (
      input.getAttribute('data-active-slot') === 'true' ||
      String(input.getAttribute('class') ?? '').includes('ring-2')
    ));
    const actionButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
      .filter(isVisible)
      .map(button => button.innerText.trim().replace(/\s+/g, ' '))
      .filter(text => text === '确认扩倍' || text === '提交答案');
    const board = document.querySelector('[data-long-division-board-section="true"]');
    const conversion = document.querySelector('[data-conversion-panel="true"]');
    return {
      actionButton: actionButtons[0] ?? null,
      activeLabel: activeInput?.getAttribute('aria-label') ?? null,
      boardVisible: Boolean(board && isVisible(board)),
      conversionVisible: Boolean(conversion && isVisible(conversion)),
      cyclicDotCount: document.querySelectorAll('[data-cyclic-dot="true"]').length,
      cyclicPreviewVisible: Boolean(document.querySelector('[data-cyclic-answer-preview="true"]')),
      ellipsisVisible: Array.from(document.querySelectorAll('div,span')).some(element => (
        isVisible(element) && element.textContent?.trim() === '...'
      )),
      hasLongDivisionBracket: Boolean(board?.querySelector('svg path')),
      labels: inputs.map(input => input.getAttribute('aria-label') ?? ''),
      values,
    };
  });
}

function expectSignaturesToMatch(step: string, production: Signature, prototype: Signature) {
  expect(production, step).toEqual(prototype);
}

async function setTextboxValue(page: Page, label: string, value: string) {
  const textbox = page.getByRole('textbox', { name: label, exact: true });
  await expect(textbox).toBeVisible();
  await textbox.click({ force: true });
  await textbox.evaluate((element, nextValue) => {
    const input = element as HTMLInputElement;
    const previousValue = input.value;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, nextValue);
    const tracker = (input as HTMLInputElement & { _valueTracker?: { setValue: (value: string) => void } })._valueTracker;
    tracker?.setValue(previousValue);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
  await expect(textbox).toHaveValue(value);
  await textbox.press('Tab').catch(() => undefined);
  await page.waitForTimeout(0);
}

async function fillInputAndRecord(page: Page, input: BoardInput, options: FillRecordOptions = {}) {
  const useKeyboard = options.useKeyboard ?? Boolean(options.signatures);
  if (useKeyboard) {
    await fillInputWithMathKeyboard(page, input);
    if (options.signatures) {
      options.signatures.push({
        step: input.label,
        signature: await collectSignature(page),
      });
    }
    return;
  }

  if (input.kind === 'field') {
    await setTextboxValue(page, input.label, input.value);
    return;
  }

  for (const [index, key] of input.value.split('').entries()) {
    const label = `${input.label}第 ${index + 1} 位`;
    await setTextboxValue(page, label, key);
  }
}

function wrongValueFor(input: BoardInput) {
  return input.value
    .split('')
    .map(char => (char === '.' ? '.' : char === '0' ? '1' : '0'))
    .join('');
}

async function pressMathKey(page: Page, key: string) {
  const name = key === 'delete' ? '删除当前格' : `输入 ${key}`;
  await page.getByRole('button', { name, exact: true }).click({ force: true });
}

async function waitForActiveInput(page: Page, label: string) {
  await page.waitForFunction((expectedLabel) => {
    const isVisible = (element: Element) => {
      const htmlElement = element as HTMLElement;
      const style = window.getComputedStyle(htmlElement);
      const rect = htmlElement.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[aria-label]')).filter(isVisible);
    const activeInput = inputs.find(input => (
      input.getAttribute('data-active-slot') === 'true' ||
      String(input.getAttribute('class') ?? '').includes('ring-2')
    ));
    return activeInput?.getAttribute('aria-label') === expectedLabel;
  }, label);
}

async function fillInputWithMathKeyboard(page: Page, input: BoardInput) {
  if (input.kind === 'field') {
    const textbox = page.getByRole('textbox', { name: input.label, exact: true });
    await textbox.click({ force: true });
    const isReadonly = await textbox.evaluate(element => (element as HTMLInputElement).readOnly);
    if (!isReadonly) {
      await textbox.fill(input.value);
      await expect(textbox).toHaveValue(input.value);
      await textbox.press('Tab').catch(() => undefined);
      await page.waitForTimeout(0);
      return;
    }
    await waitForActiveInput(page, input.label);
    for (const [index, key] of input.value.split('').entries()) {
      await pressMathKey(page, key);
      await expect(textbox).toHaveValue(input.value.slice(0, index + 1));
    }
    await textbox.press('Tab').catch(() => undefined);
    return;
  }

  for (const [index, key] of input.value.split('').entries()) {
    const label = `${input.label}第 ${index + 1} 位`;
    const textbox = page.getByRole('textbox', { name: label, exact: true });
    await textbox.click({ force: true });
    const isReadonly = await textbox.evaluate(element => (element as HTMLInputElement).readOnly);
    if (!isReadonly) {
      await textbox.fill(key);
      await expect(textbox).toHaveValue(key);
      await textbox.press('Tab').catch(() => undefined);
      await page.waitForTimeout(0);
      continue;
    }
    await waitForActiveInput(page, label);
    await pressMathKey(page, key);
    await expect(textbox).toHaveValue(key);
    await textbox.press('Tab').catch(() => undefined);
  }
}

async function fillInputsAndRecord(page: Page, fixture: Fixture) {
  const signatures: Array<{ step: string; signature: Signature }> = [{
    step: 'initial',
    signature: await collectSignature(page),
  }];

  for (const input of fixture.conversionInputs ?? []) {
    await fillInputAndRecord(page, input, { signatures });
  }
  if (fixture.conversionInputs?.length) {
    await page.getByRole('button', { name: '确认扩倍', exact: true }).click({ force: true });
    signatures.push({
      step: 'confirm-conversion',
      signature: await collectSignature(page),
    });
  }

  for (const input of fixture.boardInputs) {
    await fillInputAndRecord(page, input, { signatures });
  }
  for (const input of fixture.resultInputs ?? []) {
    await fillInputAndRecord(page, input, { signatures });
  }

  signatures.push({
    step: 'ready-to-submit',
    signature: await collectSignature(page),
  });

  return signatures;
}

async function captureBoardScreenshot(page: Page, name: string) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const board = page.locator('[data-long-division-board-section="true"]');
  if (await board.count() === 0) return;
  await board.screenshot({ path: path.join(ARTIFACT_DIR, `${name}.png`) });
}

async function fillBoardInput(page: Page, input: BoardInput, mode: 'fast' | 'keyboard') {
  if (mode === 'keyboard') {
    await fillInputWithMathKeyboard(page, input);
    return;
  }
  await fillInputAndRecord(page, input);
}

async function fillAllWithOptionalMistake(
  page: Page,
  fixture: Fixture,
  mistake?: { label: string; value: string },
  mode: 'fast' | 'keyboard' = 'fast',
) {
  for (const input of allInputs(fixture)) {
    const nextValue = input.label === mistake?.label ? mistake.value : input.value;
    await fillBoardInput(page, { ...input, value: nextValue }, mode);
    if (input === fixture.conversionInputs?.at(-1)) {
      await page.getByRole('button', { name: '确认扩倍', exact: true }).click({ force: true });
    }
  }
}

test.describe('正式版长除法逐题型对齐 formal prototype', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const fixture of fixtures) {
    test(`${fixture.shortTitle} UI、交互与逐步输入状态对齐`, async ({ browser }) => {
      const prototypePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
      const productionPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await openFormalScenario(prototypePage, fixture);
      await openProductionScenario(productionPage, fixture);

      const prototypeSignatures = await fillInputsAndRecord(prototypePage, fixture);
      const productionSignatures = await fillInputsAndRecord(productionPage, fixture);
      expect(productionSignatures.map(item => item.step)).toEqual(prototypeSignatures.map(item => item.step));
      for (const [index, prototype] of prototypeSignatures.entries()) {
        expectSignaturesToMatch(prototype.step, productionSignatures[index].signature, prototype.signature);
      }

      await captureBoardScreenshot(prototypePage, `${fixture.id}-prototype-ready`);
      await captureBoardScreenshot(productionPage, `${fixture.id}-production-ready`);
      await prototypePage.close();
      await productionPage.close();
    });

    test(`${fixture.shortTitle} 竖式步骤错误输出规则符合原型口径`, async ({ browser }) => {
      const productionPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await openProductionScenario(productionPage, fixture);
      const processInput = fixture.boardInputs[0];

      await fillAllWithOptionalMistake(
        productionPage,
        fixture,
        { label: processInput.label, value: wrongValueFor(processInput) },
        'fast',
      );
      await productionPage.getByRole('button', { name: '提交答案', exact: true }).click({ force: true });

      await expect(productionPage.getByText('本题未通过：竖式过程有误。', { exact: false })).toBeVisible();
      await expect(productionPage.getByText(`${processInput.label}错误`, { exact: true })).toBeVisible();
      await expect(productionPage.getByText(`正确是 ${processInput.value}`, { exact: false })).toHaveCount(0);

      await productionPage.close();
    });
  }

  test('小数除小数转换错误提示与停留规则对齐', async ({ browser }) => {
    const fixture = fixtures.find(item => item.id === 'decimal-divisor');
    expect(fixture).toBeTruthy();
    const prototypePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const productionPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await openFormalScenario(prototypePage, fixture!);
    await openProductionScenario(productionPage, fixture!);

    await fillInputWithMathKeyboard(prototypePage, { label: '除数扩大', value: '10', kind: 'field' });
    await fillInputAndRecord(productionPage, { label: '除数扩大', value: '10', kind: 'field' }, { useKeyboard: true });
    await fillInputWithMathKeyboard(prototypePage, { label: '转换后除数', value: '24', kind: 'field' });
    await fillInputAndRecord(productionPage, { label: '转换后除数', value: '24', kind: 'field' }, { useKeyboard: true });
    await fillInputWithMathKeyboard(prototypePage, { label: '转换后被除数', value: '1560', kind: 'field' });
    await fillInputAndRecord(productionPage, { label: '转换后被除数', value: '1560', kind: 'field' }, { useKeyboard: true });
    await prototypePage.getByRole('button', { name: '确认扩倍', exact: true }).click({ force: true });
    await productionPage.getByRole('button', { name: '确认扩倍', exact: true }).click({ force: true });

    await expect(prototypePage.getByText('扩倍倍数填写有误', { exact: true })).toBeVisible();
    await expect(productionPage.getByText('扩倍倍数填写有误', { exact: true })).toBeVisible();
    expect((await collectSignature(productionPage)).conversionVisible).toBe(true);
    expect((await collectSignature(productionPage)).boardVisible).toBe(false);

    await prototypePage.close();
    await productionPage.close();
  });

  test('取近似结构化结果错误输出规则对齐', async ({ browser }) => {
    const fixture = fixtures.find(item => item.id === 'approximation');
    expect(fixture).toBeTruthy();
    const productionPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await openProductionScenario(productionPage, fixture!);
    const resultInput = fixture!.resultInputs![0];
    const wrongValue = '2.84';

    await fillAllWithOptionalMistake(
      productionPage,
      fixture!,
      { label: resultInput.label, value: wrongValue },
      'keyboard',
    );
    await productionPage.getByRole('button', { name: '提交答案', exact: true }).click({ force: true });

    await expect(productionPage.getByText(`${resultInput.label}错误`, { exact: true })).toBeVisible();
    await expect(productionPage.getByText(`正确是 ${resultInput.value}`, { exact: false })).toBeVisible();
    await productionPage.close();
  });
});
