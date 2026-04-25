import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const RUN_ARTIFACTS_DIR = path.join(
  process.cwd(),
  'QA',
  'runs',
  '2026-04-25-v0.3-account-sync-regression',
  'artifacts',
);

const topicIds = [
  'mental-arithmetic',
  'number-sense',
  'vertical-calc',
  'operation-laws',
  'decimal-ops',
  'bracket-ops',
  'multi-step',
  'equation-transpose',
] as const;

async function saveScreenshot(page: Page, name: string): Promise<void> {
  mkdirSync(RUN_ARTIFACTS_DIR, { recursive: true });
  await page.screenshot({
    path: path.join(RUN_ARTIFACTS_DIR, name),
    fullPage: true,
  });
}

async function completeOnboarding(page: Page, nickname: string): Promise<void> {
  await page.getByRole('button', { name: '开始冒险' }).click();
  await page.getByLabel('用户昵称').fill(nickname);
  await page.getByRole('button', { name: '开始学习！' }).click();
  await expect(page.getByText('所有主题')).toBeVisible();
  await expect(page.getByLabel(`用户：${nickname}`)).toBeVisible();
}

async function seedRankReadyUser(page: Page): Promise<void> {
  await page.addInitScript((ids) => {
    const now = Date.now();
    const userId = 'qa-v03-rank-ready';
    const advanceProgress = Object.fromEntries(
      ids.map(topicId => [
        topicId,
        {
          topicId,
          heartsAccumulated: 100,
          sessionsPlayed: 34,
          sessionsWhite: 0,
          unlockedAt: now - 60_000,
        },
      ]),
    );

    localStorage.clear();
    localStorage.setItem('mq_version', JSON.stringify(4));
    localStorage.setItem('mq_user', JSON.stringify({
      id: userId,
      nickname: '同步QA',
      avatarSeed: 'qa-v03',
      createdAt: now - 120_000,
      settings: {
        soundEnabled: true,
        hapticsEnabled: true,
      },
    }));
    localStorage.setItem('mq_game_progress', JSON.stringify({
      userId,
      campaignProgress: {},
      advanceProgress,
      rankProgress: {
        currentTier: 'apprentice',
        history: [],
      },
      wrongQuestions: [],
      totalQuestionsAttempted: 8,
      totalQuestionsCorrect: 8,
    }));
    localStorage.setItem('mq_sync_state', JSON.stringify({
      dirtyKeys: [],
      lastSyncedAt: null,
      deviceId: 'qa-v03-device',
    }));
  }, topicIds);
}

test.describe('v0.3 account sync regression', () => {
  test('guest account entry remains reachable and safe when Supabase is absent', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '数学大冒险' })).toBeVisible();
    await saveScreenshot(page, '01-onboarding.png');

    await completeOnboarding(page, '同步QA');
    await saveScreenshot(page, '02-home-after-onboarding.png');

    await page.getByLabel('用户：同步QA').click();
    await expect(page.getByRole('heading', { name: '个人中心' })).toBeVisible();
    await saveScreenshot(page, '03-profile-account-section.png');

    const unconfiguredNotice = page.getByText('当前版本未接入账号系统。');
    if (await unconfiguredNotice.isVisible()) {
      await expect(unconfiguredNotice).toBeVisible();
    } else {
      await expect(page.getByRole('button', { name: '登录账号' })).toBeVisible();
      await page.getByRole('button', { name: '登录账号' }).click();
      await expect(page.getByRole('heading', { name: '登录账号' })).toBeVisible();
      await expect(page.getByPlaceholder('你的邮箱地址')).toBeVisible();
    }

    expect(pageErrors).toEqual([]);
  });

  test('rank match gate blocks new challenge while offline without hiding synced progress', async ({ page, context }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    await seedRankReadyUser(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('挑战 新秀')).toBeVisible();

    await page.getByText('挑战 新秀').click();
    await expect(page.getByText('段位赛大厅')).toBeVisible();
    await expect(page.getByRole('button', { name: '挑战新秀段位' })).toBeEnabled();

    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(page.getByText('当前离线，段位赛需要联网才能进行。恢复网络后可开始挑战。')).toBeVisible();
    await expect(page.getByRole('button', { name: '挑战新秀段位' })).toBeDisabled();
    await saveScreenshot(page, '04-rank-match-offline-gate.png');

    expect(pageErrors).toEqual([]);
    await context.setOffline(false);
  });
});
