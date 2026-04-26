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

async function openFixedVerticalCalc(page: import('@playwright/test').Page, difficulty: number) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.evaluate((targetDifficulty) => {
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
      id: `phase4-focus-${targetDifficulty}`,
      topicId: 'vertical-calc',
      type: 'vertical-fill',
      difficulty: targetDifficulty,
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
        id: `phase4-focus-session-${targetDifficulty}`,
        userId: 'phase4-e2e',
        topicId: 'vertical-calc',
        startedAt: Date.now(),
        difficulty: targetDifficulty,
        sessionMode: 'campaign',
        targetLevelId: `phase4-focus-level-${targetDifficulty}`,
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
  }, difficulty);

  await expect(page.getByRole('heading', { name: '用竖式计算: 999 + 888' })).toBeVisible();
  await page.locator('input[type="text"]').focus();
}

test('低档填完个位答案后自动聚焦十位进位格', async ({ page }) => {
  await openFixedVerticalCalc(page, 5);

  await page.keyboard.press('7');

  const board = page.locator('.card.inline-block');
  const processCells = board.locator(':scope > .mb-1.grid > div');
  await expect(processCells.nth(3)).toHaveClass(/border-secondary/);

  await page.screenshot({
    path: 'QA/runs/2026-04-26-v04-phase4-carry-policy/manual-artifacts/I-01-v2-low-after-unit-focus.png',
    fullPage: true,
  });
});

test('中档填完个位答案后仍自动聚焦十位答案格', async ({ page }) => {
  await openFixedVerticalCalc(page, 6);

  await page.keyboard.press('7');

  const board = page.locator('.card.inline-block');
  const answerRow = board.locator(':scope > div.grid').last();
  await expect(answerRow.locator(':scope > div').nth(3)).toHaveClass(/digit-cell-active/);

  await page.screenshot({
    path: 'QA/runs/2026-04-26-v04-phase4-carry-policy/manual-artifacts/I-10-v2-mid-after-unit-focus.png',
    fullPage: true,
  });
});
