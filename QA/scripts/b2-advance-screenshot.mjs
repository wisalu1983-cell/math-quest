// QA/scripts/b2-advance-screenshot.mjs
import { chromium } from 'playwright';

const ALL_MENTAL_LEVELS = [
  'mental-arithmetic-S1-LA-L1', 'mental-arithmetic-S1-LA-L2', 'mental-arithmetic-S1-LA-L3',
  'mental-arithmetic-S1-LB-L1', 'mental-arithmetic-S1-LB-L2',
  'mental-arithmetic-S2-LA-L1', 'mental-arithmetic-S2-LA-L2', 'mental-arithmetic-S2-LA-L3',
  'mental-arithmetic-S2-LB-L1', 'mental-arithmetic-S2-LB-L2',
  'mental-arithmetic-S3-LA-L1',
];
const now = Date.now();
const gameProgress = {
  userId: 'test-user',
  campaignProgress: {
    'mental-arithmetic': {
      topicId: 'mental-arithmetic',
      completedLevels: ALL_MENTAL_LEVELS.map(id => ({ levelId: id, bestHearts: 3, completedAt: now - 100000 })),
      campaignCompleted: true,
    },
  },
  advanceProgress: {
    'mental-arithmetic': {
      topicId: 'mental-arithmetic', heartsAccumulated: 0,
      sessionsPlayed: 0, sessionsWhite: 0, unlockedAt: now - 50000,
    },
  },
  wrongQuestions: [],
  totalQuestionsAttempted: 200,
  totalQuestionsCorrect: 170,
};
const user = { id: 'test-user', nickname: '测试员', avatarSeed: 'abc123', createdAt: now - 200000 };

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();

  // 注入 localStorage
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ gp, u }) => {
    localStorage.setItem('mq_version', '3');
    localStorage.setItem('mq_user', JSON.stringify(u));
    localStorage.setItem('mq_game_progress', JSON.stringify(gp));
    localStorage.setItem('mq_sessions', JSON.stringify([]));
  }, { gp: gameProgress, u: user });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 进入进阶训练
  await page.locator('text=进阶训练').first().click();
  await page.waitForTimeout(800);

  // 点 A01 开始
  await page.locator('button:has-text("开始")').first().click();
  await page.waitForTimeout(1000);

  // 截图前 8 道题
  for (let i = 1; i <= 8; i++) {
    await page.waitForTimeout(300);
    // 读取题干
    const prompt = await page.locator('[class*="text-"]').filter({ hasText: /计算|求|比较|估|填|判断|化简|解方程|移项/ }).first().textContent().catch(() => '');
    console.log(`题 ${i}: ${prompt.trim()}`);
    await page.screenshot({ path: `QA/b2-screenshots/q${i}.png` });

    // 输入随机答案并提交
    const input = page.locator('input[type="text"], input[type="number"], input[inputmode="decimal"]').first();
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      await input.fill('42');
      await page.locator('button:has-text("确认")').first().click();
    } else {
      // 选择题：点第一个选项
      const opts = page.locator('[data-testid^="option-"]');
      if (await opts.count() > 0) await opts.nth(0).click();
    }
    await page.waitForTimeout(800);

    // 点"下一题"（如果出现）
    const nxt = page.locator('button:has-text("下一题")').first();
    if (await nxt.isVisible({ timeout: 1000 }).catch(() => false)) {
      await nxt.click();
      await page.waitForTimeout(500);
    }
  }

  await browser.close();
  console.log('\n截图完成');
}

run().catch(e => { console.error(e); process.exit(1); });
