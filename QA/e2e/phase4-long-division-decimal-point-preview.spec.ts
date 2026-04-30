import { expect, test, type Page } from '@playwright/test';

async function openPreview(page: Page) {
  await page.goto('/?preview=longdiv');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: '竖式除法 UI 化答题审核稿' })).toBeVisible();
}

async function chooseScenario(page: Page, buttonName: string, headingName: string) {
  await page.getByRole('button', { name: buttonName }).click();
  await expect(page.getByRole('heading', { name: headingName })).toBeVisible();
}

async function fillConversion(page: Page, values: {
  scale: string;
  divisor: string;
  dividend: string;
}) {
  await page.getByLabel('除数扩大').fill(values.scale);
  await page.getByLabel('转换后除数').fill(values.divisor);
  await page.getByLabel('转换后被除数').fill(values.dividend);
}

async function confirmConversion(page: Page) {
  await page.getByRole('button', { name: '确认扩倍' }).click();
}

function quotientDecimalDots(page: Page) {
  return page
    .locator('[data-long-division-board-section="true"]')
    .locator('span.text-danger')
    .filter({ hasText: '.' });
}

async function expectFeedbackHasNoActionRequest(page: Page) {
  const feedbackText = await page.locator('[data-feedback-panel="true"]').textContent();
  expect(feedbackText ?? '').not.toMatch(/请|检查|回看|订正/);
}

async function inputWidth(page: Page, label: string) {
  const box = await page.getByLabel(label).boundingBox();
  expect(box).not.toBeNull();
  return Math.round(box?.width ?? 0);
}

test('转换后被除数为整数且除尽时，商行不提前显示小数点', async ({ page }) => {
  await openPreview(page);
  await chooseScenario(page, '小数÷小数 扩倍', '小数 ÷ 小数 · 扩倍训练格');

  await fillConversion(page, {
    scale: '100',
    divisor: '24',
    dividend: '1560',
  });

  await expect(page.locator('[data-long-division-board-section="true"]')).toHaveCount(0);
  await confirmConversion(page);

  await expect(page.locator('[data-long-division-board-section="true"]')).toBeVisible();
  await expect(quotientDecimalDots(page)).toHaveCount(0);
});

test('转换后除数仍为小数时，提示先化成整数且不进入竖式板', async ({ page }) => {
  await openPreview(page);
  await chooseScenario(page, '小数÷小数 扩倍', '小数 ÷ 小数 · 扩倍训练格');

  await page.getByLabel('除数扩大').fill('100');
  await page.getByLabel('转换后除数').fill('0.24');
  await page.getByLabel('转换后被除数').fill('1560');

  await confirmConversion(page);

  await expect(page.getByText('转换后除数不是整数。')).toBeVisible();
  await expect(await page.getByRole('alert').textContent()).not.toMatch(/请|检查|回看|订正|先把/);
  await expect(page.locator('[data-long-division-board-section="true"]')).toHaveCount(0);
});

test('转换后除数填错时只提示错误，不直接泄露正确值', async ({ page }) => {
  await openPreview(page);
  await chooseScenario(page, '小数÷小数 扩倍', '小数 ÷ 小数 · 扩倍训练格');
  await page.getByRole('button', { name: '转换后仍有小数' }).click();

  await page.getByLabel('除数扩大').fill('100');
  await page.getByLabel('转换后除数').fill('40');
  await page.getByLabel('转换后被除数').fill('123.4');

  await confirmConversion(page);

  await expect(page.getByText('转换后除数填写有误')).toBeVisible();
  await expect(page.getByText('除数应为 4')).toHaveCount(0);
  await expect(page.locator('[data-long-division-board-section="true"]')).toHaveCount(0);
});

test('转换后被除数填错时给出明确提示且不进入竖式板', async ({ page }) => {
  await openPreview(page);
  await chooseScenario(page, '小数÷小数 扩倍', '小数 ÷ 小数 · 扩倍训练格');
  await page.getByRole('button', { name: '转换后仍有小数' }).click();

  await fillConversion(page, {
    scale: '100',
    divisor: '4',
    dividend: '1234',
  });

  await confirmConversion(page);

  await expect(page.getByText('转换后被除数填写有误')).toBeVisible();
  await expect(page.locator('[data-long-division-board-section="true"]')).toHaveCount(0);
});

test('扩倍环节三个输入框宽度保持一致', async ({ page }) => {
  await openPreview(page);
  await chooseScenario(page, '小数÷小数 扩倍', '小数 ÷ 小数 · 扩倍训练格');

  const widths = await Promise.all([
    inputWidth(page, '除数扩大'),
    inputWidth(page, '转换后除数'),
    inputWidth(page, '转换后被除数'),
  ]);

  expect(new Set(widths).size).toBe(1);
});

test('高档下转换值填错直接进入失败反馈', async ({ page }) => {
  await openPreview(page);
  await chooseScenario(page, '小数÷小数 扩倍', '小数 ÷ 小数 · 扩倍训练格');
  await page.getByRole('button', { name: '高档无提示' }).click();
  await page.getByRole('button', { name: '转换后仍有小数' }).click();

  await fillConversion(page, {
    scale: '100',
    divisor: '4',
    dividend: '1234',
  });

  await confirmConversion(page);

  await expect(page.locator('[data-feedback-panel="true"]')).toBeVisible();
  await expect(page.getByText('本题未通过：扩倍结果有误。')).toBeVisible();
  await expect(page.getByText('最终答案可能已经接近')).toHaveCount(0);
  await expectFeedbackHasNoActionRequest(page);
  await expect(page.getByText('转换后被除数错误')).toBeVisible();
  await expect(page.getByText('正确是 123.4')).toBeVisible();
  await expect(page.locator('[data-long-division-board-section="true"]')).toHaveCount(0);
});

test('实际计算错误反馈使用过程类短文案', async ({ page }) => {
  await openPreview(page);

  await page.getByRole('button', { name: '错因预览' }).click();

  await expect(page.locator('[data-feedback-panel="true"]')).toBeVisible();
  await expect(page.getByText('本题未通过：竖式过程有误。')).toBeVisible();
  await expect(page.getByText('最终答案可能已经接近')).toHaveCount(0);
  await expectFeedbackHasNoActionRequest(page);
});

test('过程和结果字段同时错误时反馈说明两类问题', async ({ page }) => {
  await openPreview(page);
  await chooseScenario(page, '取近似 保留 2 位', '取近似 · 算到保留位后一位');

  await page.getByRole('button', { name: '错因预览' }).click();

  await expect(page.locator('[data-feedback-panel="true"]')).toBeVisible();
  await expect(page.getByText('本题未通过：竖式过程和结构化字段都有误。')).toBeVisible();
  await expect(page.getByText('最终答案可能已经接近')).toHaveCount(0);
  await expectFeedbackHasNoActionRequest(page);
});

test('结果字段错误反馈只说明结果字段有误', async ({ page }) => {
  await openPreview(page);
  await chooseScenario(page, '取近似 保留 2 位', '取近似 · 算到保留位后一位');

  await page.getByRole('button', { name: '正确示例' }).click();
  await page.getByLabel('保留两位小数').fill('2.84');
  await page.getByRole('button', { name: '提交答案' }).click();

  await expect(page.locator('[data-feedback-panel="true"]')).toBeVisible();
  await expect(page.getByText('本题未通过：结果表达有误。')).toBeVisible();
  await expectFeedbackHasNoActionRequest(page);
});

test('高级转换值填错时直接进入失败反馈并展示具体错因', async ({ page }) => {
  await openPreview(page);
  await chooseScenario(page, '小数÷小数 扩倍', '小数 ÷ 小数 · 扩倍训练格');
  await page.getByRole('button', { name: '高档无提示' }).click();
  await page.getByRole('button', { name: '转换后仍有小数' }).click();

  await fillConversion(page, {
    scale: '100',
    divisor: '4',
    dividend: '1234',
  });
  await confirmConversion(page);

  await expect(page.locator('[data-feedback-panel="true"]')).toBeVisible();
  await expect(page.getByText('转换后被除数错误')).toBeVisible();
  await expect(page.getByText('123.4')).toBeVisible();
  await expect(page.locator('[data-long-division-board-section="true"]')).toHaveCount(0);
});

test('扩倍环节小数点键始终可用且等值小数可确认进入计算环节', async ({ page }) => {
  await openPreview(page);
  await chooseScenario(page, '小数÷小数 扩倍', '小数 ÷ 小数 · 扩倍训练格');

  await page.getByLabel('除数扩大').focus();
  await expect(page.getByRole('button', { name: '输入 .' })).toBeEnabled();
  await fillConversion(page, {
    scale: '100.0',
    divisor: '24.0',
    dividend: '1560.0',
  });
  await confirmConversion(page);

  const board = page.locator('[data-long-division-board-section="true"]');
  await expect(board).toBeVisible();
  await expect(board.getByText('24', { exact: true })).toBeVisible();
  await expect.poll(async () => (await board.textContent())?.replace(/\s/g, '') ?? '').toContain('241560');
});

test('小数除小数两个转换结果类型合并在同一个预览场景内', async ({ page }) => {
  await openPreview(page);

  await expect(page.getByRole('button', { name: '扩倍后小数 仍小数' })).toHaveCount(0);
  await chooseScenario(page, '小数÷小数 扩倍', '小数 ÷ 小数 · 扩倍训练格');
  await expect(page.getByRole('button', { name: '转换后整数' })).toBeVisible();
  await expect(page.getByRole('button', { name: '转换后仍有小数' })).toBeVisible();
});

test('循环小数预览使用 3 位循环节样例', async ({ page }) => {
  await openPreview(page);
  await chooseScenario(page, '循环小数 循环节', '循环小数 · 非循环部分 + 循环节');

  await expect(page.getByText('14 ÷ 135')).toBeVisible();
  await expect(page.getByText('极限样例：展示串 8 字符')).toBeVisible();
});

test('循环小数结果格填写完整非循环部分并生成中国循环点格式答数', async ({ page }) => {
  await openPreview(page);
  await chooseScenario(page, '循环小数 循环节', '循环小数 · 非循环部分 + 循环节');
  await page.getByRole('button', { name: '正确示例' }).click();

  const nonRepeatingInput = page.getByRole('textbox', { name: '非循环部分' });
  const repeatingInput = page.getByRole('textbox', { name: '循环节' });
  await expect(nonRepeatingInput).toHaveValue('0.1');
  await expect(repeatingInput).toHaveValue('037');
  await expect(page.getByText('标准格式答数')).toBeVisible();
  const answerPreview = page.locator('[data-cyclic-answer-preview="true"]');
  await expect(answerPreview).toHaveAttribute('aria-label', '标准格式答数：0.1，循环节037');
  await expect(answerPreview.locator('[data-cyclic-dot="true"]')).toHaveCount(2);
  await expect(page.getByText('0.1(037)')).toHaveCount(0);

  await repeatingInput.fill('37');
  await expect(answerPreview).toHaveAttribute('aria-label', '标准格式答数：0.1，循环节37');
  await expect(answerPreview.locator('[data-cyclic-dot="true"]')).toHaveCount(2);
});

test('390px 宽度下极限循环小数竖式板不需要左右滑动', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPreview(page);
  await chooseScenario(page, '循环小数 循环节', '循环小数 · 非循环部分 + 循环节');
  await page.getByRole('button', { name: '正确示例' }).click();

  await expect(page.getByText('宽度自适应：')).toBeVisible();

  const viewport = page.locator('[data-long-division-board-viewport="true"]');
  await expect.poll(async () => {
    return viewport.evaluate(element => element.scrollWidth - element.clientWidth);
  }).toBeLessThanOrEqual(1);

  const pageOverflow = await page.evaluate(() => (
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ));
  expect(pageOverflow).toBeLessThanOrEqual(1);
});
