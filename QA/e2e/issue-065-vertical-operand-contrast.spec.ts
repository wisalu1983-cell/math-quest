import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

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

const runDir = path.join('QA', 'runs', '2026-04-26-issue-065-vertical-contrast');
const artifactsDir = path.join(runDir, 'artifacts');

async function openFixedVerticalCalc(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.evaluate(() => {
    const harness = window as HarnessWindow;
    if (!harness.__MQ_SESSION__ || !harness.__MQ_UI__) {
      throw new Error('DEV store hooks are unavailable');
    }

    const steps = [
      { stepIndex: 0, stepType: 'digit', column: 0, row: 0, expectedDigit: 7, skippable: false, hint: '个位' },
      { stepIndex: 1, stepType: 'carry', column: 1, row: 0, expectedDigit: 1, skippable: false, hint: '向十位进1' },
      { stepIndex: 2, stepType: 'digit', column: 1, row: 0, expectedDigit: 8, skippable: false, hint: '十位' },
      { stepIndex: 3, stepType: 'carry', column: 2, row: 0, expectedDigit: 1, skippable: false, hint: '向百位进1' },
      { stepIndex: 4, stepType: 'digit', column: 2, row: 0, expectedDigit: 8, skippable: false, hint: '百位' },
      { stepIndex: 5, stepType: 'carry', column: 3, row: 0, expectedDigit: 1, skippable: false, hint: '向千位进1' },
      { stepIndex: 6, stepType: 'digit', column: 3, row: 0, expectedDigit: 1, skippable: false, hint: '千位' },
    ];

    const question = {
      id: 'issue-065-contrast',
      topicId: 'vertical-calc',
      type: 'vertical-fill',
      difficulty: 5,
      prompt: '用竖式计算: 999 + 888',
      data: {
        kind: 'vertical-calc',
        operation: '+',
        operands: [999, 888],
        steps,
      },
      solution: {
        answer: 1887,
        steps: ['999 + 888 = 1887'],
        explanation: '999 + 888 = 1887',
      },
      hints: [],
    };

    harness.__MQ_SESSION__.setState({
      active: true,
      session: {
        id: 'issue-065-contrast-session',
        userId: 'issue-065-e2e',
        topicId: 'vertical-calc',
        startedAt: Date.now(),
        difficulty: 5,
        sessionMode: 'campaign',
        targetLevelId: 'issue-065-level',
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
  });

  await expect(page.getByRole('heading', { name: '用竖式计算: 999 + 888' })).toBeVisible();
}

test('known vertical operands and operator use high-contrast text while alignment blanks stay muted', async ({ page }) => {
  await openFixedVerticalCalc(page);

  fs.mkdirSync(artifactsDir, { recursive: true });
  const suffix = process.env.ISSUE065_SCREENSHOT_SUFFIX ?? 'current';
  await page.screenshot({
    path: path.join(artifactsDir, `issue-065-${suffix}.png`),
    fullPage: true,
  });

  const board = page.locator('.card.inline-block');
  const directGridRows = board.locator(':scope > div.grid');
  await expect(directGridRows).toHaveCount(3);

  const topOperandRow = directGridRows.nth(1);
  const bottomOperandRow = board.locator(':scope > .mt-1 > div.grid');
  await expect(bottomOperandRow).toHaveCount(1);

  const topDigitCells = topOperandRow.locator(':scope > div').filter({ hasText: '9' });
  const bottomDigitCells = bottomOperandRow.locator(':scope > div').filter({ hasText: '8' });
  await expect(topDigitCells).toHaveCount(3);
  await expect(bottomDigitCells).toHaveCount(3);

  const topAlignmentBlank = topOperandRow.locator(':scope > div').nth(1);
  await expect(topAlignmentBlank).toHaveClass(/digit-cell-empty/);
  await expect(topAlignmentBlank).toHaveCSS('color', 'rgb(200, 200, 200)');

  await expect(topDigitCells.nth(0)).not.toHaveClass(/digit-cell-empty/);
  await expect(topDigitCells.nth(0)).toHaveCSS('color', 'rgb(24, 24, 24)');
  await expect(bottomDigitCells.nth(0)).not.toHaveClass(/digit-cell-empty/);
  await expect(bottomDigitCells.nth(0)).toHaveCSS('color', 'rgb(24, 24, 24)');

  const operatorCell = bottomOperandRow.locator(':scope > div').filter({ hasText: '+' });
  await expect(operatorCell).toHaveCount(1);
  await expect(operatorCell).not.toHaveClass(/digit-cell-empty/);
  await expect(operatorCell).toHaveCSS('color', 'rgb(24, 24, 24)');
});
