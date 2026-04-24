import { expect, test } from '@playwright/test';

test('首页加载与注册流程可达', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: '数学大冒险' })).toBeVisible();

  await page.getByRole('button', { name: '开始冒险' }).click();
  await page.getByLabel('用户昵称').fill('小测同学');
  await page.getByRole('button', { name: '开始学习！' }).click();

  await expect(page.getByText('所有主题')).toBeVisible();
  await expect(page.getByLabel('用户：小测同学')).toBeVisible();
  expect(pageErrors).toEqual([]);
});
