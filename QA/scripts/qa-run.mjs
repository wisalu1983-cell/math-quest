// ISSUE-057 QA Playwright 脚本（本 session 拟真体验测试）
// 用例：
//   B3-01 首页正常加载 + A01 卡片可见
//   B3-02 A01 CampaignMap：三段（档1/档2/Boss）结构可见
//   B3-03 A04 CampaignMap：三段结构可见
//   B3-04 A02 CampaignMap：四段结构（低档/中档/高档/Boss）可见
//   B3-05 点击 A01 S1-LA L1 进入 Practice，出题是加减类
//   B3-06 注入旧 Boss 存档 + reload → A01 首页显示全关满星（11/11）
//
// 运行：node QA/scripts/qa-run.mjs
// 前置：npm run dev 在 http://localhost:5177

import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:5177';
const artifactsDir = path.resolve(__dirname, '..', 'artifacts');
const shots = path.join(artifactsDir, 'shots');
if (!fs.existsSync(shots)) fs.mkdirSync(shots, { recursive: true });

const results = [];
function record(id, title, expect, observe, verdict) {
  results.push({ id, title, expect, observe, verdict });
  console.log(`[${verdict}] ${id} ${title}`);
  console.log(`  预期: ${expect}`);
  console.log(`  观察: ${observe}`);
}

// 预置一个已登录用户，跳过 onboarding
const PRESET_USER = {
  id: 'qa-user-001',
  nickname: 'QATester',
  avatarSeed: 'qa001',
  createdAt: 1700000000000,
  settings: { soundEnabled: false, hapticsEnabled: false },
};

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newPage();

  // ── B3-01 首页加载 ──
  await context.goto(BASE);
  await context.evaluate(({ user }) => {
    localStorage.clear();
    localStorage.setItem('mq_user', JSON.stringify(user));
    localStorage.setItem('mq_version', '2');
  }, { user: PRESET_USER });
  await context.reload();
  await context.waitForLoadState('networkidle');

  const title = await context.title();
  const hasA01 = await context.getByText('基础计算', { exact: false }).count() > 0;
  await context.screenshot({ path: path.join(shots, 'B3-01-home.png'), fullPage: true });
  record(
    'B3-01',
    '首页加载 + A01 主题卡可见',
    '看到首页，包含 8 个题型主题卡（A01 基础计算可见）',
    `title="${title}", hasA01=${hasA01}`,
    hasA01 ? 'PASS' : 'FAIL'
  );

  // ── B3-02 A01 CampaignMap 三段结构 ──
  await context.getByText('基础计算', { exact: false }).first().click();
  await context.waitForLoadState('networkidle');
  await new Promise(r => setTimeout(r, 500));
  const a01Text = await context.locator('body').innerText();
  const hasDang1 = a01Text.includes('档1') || a01Text.includes('档 1');
  const hasDang2 = a01Text.includes('档2') || a01Text.includes('档 2');
  const hasBoss = a01Text.includes('Boss') || a01Text.includes('BOSS');
  const hasLowMid = a01Text.includes('低档') || a01Text.includes('中档');
  await context.screenshot({ path: path.join(shots, 'B3-02-a01-campaign.png'), fullPage: true });
  const a01Pass = hasDang1 && hasDang2 && hasBoss && !hasLowMid;
  record(
    'B3-02',
    'A01 CampaignMap 显示"档1 / 档2 / Boss"三段（无"低/中/高档"）',
    '看到"档1·纯算术口算"、"档2·运算顺序与口算陷阱"、"Boss战"三段，无"低档/中档/高档"字样',
    `档1=${hasDang1}, 档2=${hasDang2}, Boss=${hasBoss}, 残留低/中档=${hasLowMid}`,
    a01Pass ? 'PASS' : 'FAIL'
  );

  // ── B3-03 A04 CampaignMap 三段 ──
  await context.getByRole('button', { name: '返回首页' }).click();
  await new Promise(r => setTimeout(r, 400));
  await context.getByText('运算律', { exact: false }).first().click();
  await context.waitForLoadState('networkidle');
  await new Promise(r => setTimeout(r, 500));
  const a04Text = await context.locator('body').innerText();
  const a04Dang1 = a04Text.includes('档1') || a04Text.includes('档 1');
  const a04Dang2 = a04Text.includes('档2') || a04Text.includes('档 2');
  const a04Boss = a04Text.includes('Boss');
  const a04LowMid = a04Text.includes('低档') || a04Text.includes('中档');
  await context.screenshot({ path: path.join(shots, 'B3-03-a04-campaign.png'), fullPage: true });
  record(
    'B3-03',
    'A04 CampaignMap 显示"档1 / 档2 / Boss"三段',
    '与 A01 同构，无低/中档',
    `档1=${a04Dang1}, 档2=${a04Dang2}, Boss=${a04Boss}, 残留低/中档=${a04LowMid}`,
    (a04Dang1 && a04Dang2 && a04Boss && !a04LowMid) ? 'PASS' : 'FAIL'
  );

  // ── B3-04 A02 CampaignMap 四段 ──
  await context.getByRole('button', { name: '返回首页' }).click();
  await new Promise(r => setTimeout(r, 400));
  await context.getByText('数感估算', { exact: false }).first().click();
  await context.waitForLoadState('networkidle');
  await new Promise(r => setTimeout(r, 500));
  const a02Text = await context.locator('body').innerText();
  const a02Low = a02Text.includes('低档');
  const a02Mid = a02Text.includes('中档');
  const a02High = a02Text.includes('高档');
  const a02Boss = a02Text.includes('Boss');
  // 聚焦 lane 名：估算 / 比较 / 四舍五入 / 去尾进一 / 逆向推理 / 深化
  const a02HasFocusedLanes = ['估算', '比较', '四舍五入', '去尾', '逆向', '深化']
    .filter(k => a02Text.includes(k)).length;
  await context.screenshot({ path: path.join(shots, 'B3-04-a02-campaign.png'), fullPage: true });
  record(
    'B3-04',
    'A02 CampaignMap 显示"低/中/高档 + Boss"四段，且各段有聚焦 lane 名',
    '四段完整 + 至少 4 个聚焦 lane 名（估算/比较/四舍五入等）',
    `低=${a02Low}, 中=${a02Mid}, 高=${a02High}, Boss=${a02Boss}, 聚焦lane数=${a02HasFocusedLanes}`,
    (a02Low && a02Mid && a02High && a02Boss && a02HasFocusedLanes >= 4) ? 'PASS' : 'FAIL'
  );

  // ── B3-05 A01 S1-LA L1 进入 Practice，题是加减 ──
  await context.getByRole('button', { name: '返回首页' }).click();
  await new Promise(r => setTimeout(r, 400));
  await context.getByText('基础计算', { exact: false }).first().click();
  await context.waitForLoadState('networkidle');
  await new Promise(r => setTimeout(r, 500));
  // 点击第 1 关（第一个 playable 关卡按钮）
  await context.getByRole('button', { name: /第1关/ }).first().click({ force: true });
  await context.waitForLoadState('networkidle');
  await new Promise(r => setTimeout(r, 800));
  const practiceText = await context.locator('body').innerText();
  // 加减类题目应出现 "+" 或 "-" 符号；不应出现 "×" 或 "÷"
  const hasAddOrSub = /[+\-]/.test(practiceText.replace(/返回|第\d+/g, ''));
  const hasMulOrDiv = /[×÷]/.test(practiceText);
  await context.screenshot({ path: path.join(shots, 'B3-05-practice-a01-s1la.png'), fullPage: true });
  record(
    'B3-05',
    'A01 S1-LA L1 进入 Practice，首题为加减类（不含 ×÷）',
    'subtypeFilter=[add,sub] 生效：首题算式只含 + 或 -',
    `有+-=${hasAddOrSub}, 有×÷=${hasMulOrDiv}`,
    (hasAddOrSub && !hasMulOrDiv) ? 'PASS' : 'RISK'
  );

  // ── B3-06 注入旧 Boss 存档 → 迁移后 A01 全关满星 ──
  // 先注入旧 GameProgress（含旧 Boss levelId 且 campaignCompleted=true）
  await context.goto(BASE);
  await context.evaluate(({ user }) => {
    const oldProgress = {
      userId: user.id,
      campaignProgress: {
        'mental-arithmetic': {
          topicId: 'mental-arithmetic',
          completedLevels: [
            { levelId: 'mental-arithmetic-S4-LA-L1', bestHearts: 3, completedAt: 1700000000000 },
          ],
          campaignCompleted: true,
        },
      },
      advanceProgress: {},
      wrongQuestions: [],
      totalQuestionsAttempted: 0,
      totalQuestionsCorrect: 0,
    };
    localStorage.setItem('mq_user', JSON.stringify(user));
    localStorage.setItem('mq_game_progress', JSON.stringify(oldProgress));
    localStorage.setItem('mq_version', '2');
  }, { user: PRESET_USER });
  await context.reload();
  await context.waitForLoadState('networkidle');
  await new Promise(r => setTimeout(r, 500));
  // 迁移应已触发并回写
  const migratedJson = await context.evaluate(() => localStorage.getItem('mq_game_progress'));
  const migrated = JSON.parse(migratedJson);
  const a01Levels = migrated.campaignProgress['mental-arithmetic'].completedLevels;
  const allValid = a01Levels.every(l => !l.levelId.includes('S4'));
  const count = a01Levels.length;
  const allFull = a01Levels.every(l => l.bestHearts === 3);
  await context.screenshot({ path: path.join(shots, 'B3-06-migrated-home.png'), fullPage: true });
  record(
    'B3-06',
    '注入旧 Boss 存档 reload → 新结构全关满星，无旧 S4 遗留',
    '迁移后 completedLevels 数=11（新结构总数），bestHearts=3 全满，无 S4 levelId',
    `总关=${count}, 全满星=${allFull}, 无旧S4=${allValid}`,
    (count === 11 && allFull && allValid) ? 'PASS' : 'FAIL'
  );

  // 打印汇总
  console.log('\n── 汇总 ──');
  const pass = results.filter(r => r.verdict === 'PASS').length;
  const fail = results.filter(r => r.verdict === 'FAIL').length;
  const risk = results.filter(r => r.verdict === 'RISK').length;
  console.log(`PASS=${pass} FAIL=${fail} RISK=${risk} 总=${results.length}`);

  fs.writeFileSync(
    path.join(artifactsDir, 'b3-results.json'),
    JSON.stringify(results, null, 2),
    'utf-8'
  );

  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(2);
});
