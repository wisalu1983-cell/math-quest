import { expect, test } from '@playwright/test';

const formalPrototypeUrl = process.env.MQ_FORMAL_PROTOTYPE_URL ?? '/?preview=longdiv-formal';

test('正式原型中小数除小数扩倍通过后隐藏转换区并只进入竖式计算', async ({ page }) => {
  await page.goto(formalPrototypeUrl);
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: '竖式除法正式版高保真原型' })).toBeVisible();

  await page.getByRole('button', { name: '小数÷小数 扩倍' }).click();
  await expect(page.getByRole('heading', { name: '小数 ÷ 小数 · 扩倍训练格' })).toBeVisible();

  await expect(page.locator('[data-conversion-panel="true"]')).toBeVisible();
  await page.getByRole('button', { name: '正确示例' }).click();

  await expect(page.locator('[data-conversion-panel="true"]')).toHaveCount(0);
  await expect(page.locator('[data-long-division-board-section="true"]')).toBeVisible();
  await expect(page.getByText('除数扩大')).toHaveCount(0);
  await expect(page.getByText('转换后除数')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '提交答案' })).toBeVisible();
});
