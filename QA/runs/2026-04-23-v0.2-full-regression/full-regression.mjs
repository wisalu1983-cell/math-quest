import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:5173/';
const ARTIFACTS_DIR = path.join(__dirname, 'artifacts');
const SHOTS_DIR = path.join(ARTIFACTS_DIR, 'shots');
const FIXED_TS = 1760860800000;

const TOPIC_NAMES = [
  '基础计算',
  '数感估算',
  '竖式笔算',
  '运算律',
  '小数计算',
  '括号变换',
  '简便计算',
  '方程移项',
];

const results = [];
const consoleEvents = [];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function md(text) {
  return String(text ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, '<br>');
}

function countByVerdict(batch) {
  const scoped = results.filter(item => item.batch === batch);
  return {
    total: scoped.length,
    pass: scoped.filter(item => item.verdict === 'PASS').length,
    fail: scoped.filter(item => item.verdict === 'FAIL').length,
    risk: scoped.filter(item => item.verdict === 'RISK').length,
    blocked: scoped.filter(item => item.verdict === 'BLOCKED').length,
  };
}

function criticalConsoleEventsSince(startIndex) {
  return consoleEvents
    .slice(startIndex)
    .filter(item => item.type === 'error' || item.type === 'pageerror');
}

function record(result) {
  results.push(result);
  console.log(`[${result.verdict}] ${result.id} ${result.title}`);
  console.log(`  观察: ${result.observed}`);
}

async function screenshot(page, fileName) {
  const fullPath = path.join(SHOTS_DIR, fileName);
  await page.screenshot({ path: fullPath, fullPage: true });
  return `artifacts/shots/${fileName}`;
}

async function runCase(page, { batch, id, title, expected, steps, fn }) {
  try {
    const outcome = await fn();
    record({
      batch,
      id,
      title,
      expected,
      steps,
      observed: outcome.observed,
      verdict: outcome.verdict ?? 'PASS',
      evidence: outcome.evidence ?? [],
    });
  } catch (error) {
    const evidence = [];
    try {
      evidence.push(await screenshot(page, `${id}-error.png`));
    } catch {
      // ignore screenshot failures in error path
    }
    record({
      batch,
      id,
      title,
      expected,
      steps,
      observed: `执行异常：${error instanceof Error ? error.message : String(error)}`,
      verdict: 'FAIL',
      evidence,
    });
  }
}

function buildUser(id, nickname) {
  return {
    id,
    nickname,
    avatarSeed: `${id}-avatar`,
    createdAt: FIXED_TS,
    settings: {
      soundEnabled: true,
      hapticsEnabled: true,
    },
  };
}

function buildBaseProgress(userId) {
  return {
    userId,
    campaignProgress: {},
    advanceProgress: {},
    rankProgress: {
      currentTier: 'apprentice',
      history: [],
    },
    wrongQuestions: [],
    totalQuestionsAttempted: 0,
    totalQuestionsCorrect: 0,
  };
}

function fakeCompletedLevels(prefix, count) {
  return Array.from({ length: count }, (_, index) => ({
    levelId: `${prefix}-qa-${index + 1}`,
    bestHearts: 3,
    completedAt: FIXED_TS + index * 1000,
  }));
}

function buildAdvanceUnlockedProgress(userId) {
  const progress = buildBaseProgress(userId);
  progress.campaignProgress['mental-arithmetic'] = {
    topicId: 'mental-arithmetic',
    completedLevels: fakeCompletedLevels('mental-arithmetic', 11),
    campaignCompleted: true,
  };
  progress.advanceProgress['mental-arithmetic'] = {
    topicId: 'mental-arithmetic',
    heartsAccumulated: 8,
    sessionsPlayed: 2,
    sessionsWhite: 0,
    unlockedAt: FIXED_TS,
  };
  progress.totalQuestionsAttempted = 24;
  progress.totalQuestionsCorrect = 20;
  return progress;
}

function buildRookieGapProgress(userId) {
  const progress = buildBaseProgress(userId);
  progress.advanceProgress['mental-arithmetic'] = {
    topicId: 'mental-arithmetic',
    heartsAccumulated: 6,
    sessionsPlayed: 2,
    sessionsWhite: 0,
    unlockedAt: FIXED_TS,
  };
  progress.totalQuestionsAttempted = 40;
  progress.totalQuestionsCorrect = 31;
  return progress;
}

function buildRookieUnlockedProgress(userId) {
  const progress = buildBaseProgress(userId);
  for (const topicId of ['mental-arithmetic', 'number-sense', 'vertical-calc', 'operation-laws']) {
    progress.advanceProgress[topicId] = {
      topicId,
      heartsAccumulated: 6,
      sessionsPlayed: 2,
      sessionsWhite: 0,
      unlockedAt: FIXED_TS,
    };
  }
  progress.totalQuestionsAttempted = 88;
  progress.totalQuestionsCorrect = 72;
  return progress;
}

async function waitForAppReady(page) {
  await page.waitForFunction(() => {
    return Boolean(window.__MQ_UI__ && window.__MQ_SESSION__ && window.__MQ_GAME_PROGRESS__);
  }, { timeout: 15000 });
  await delay(300);
}

async function gotoBase(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await waitForAppReady(page);
}

async function resetToEmpty(page) {
  await gotoBase(page);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForAppReady(page);
}

async function seedLocalState(page, { user, progress, sessions = [], rankMatchSessions = {} }) {
  await gotoBase(page);
  await page.evaluate(({ userPayload, progressPayload, sessionsPayload, rankMatchSessionsPayload }) => {
    localStorage.clear();
    localStorage.setItem('mq_version', JSON.stringify(3));
    localStorage.setItem('mq_user', JSON.stringify(userPayload));
    localStorage.setItem('mq_game_progress', JSON.stringify(progressPayload));
    localStorage.setItem('mq_sessions', JSON.stringify(sessionsPayload));
    localStorage.setItem('mq_rank_match_sessions', JSON.stringify(rankMatchSessionsPayload));
  }, {
    userPayload: user,
    progressPayload: progress,
    sessionsPayload: sessions,
    rankMatchSessionsPayload: rankMatchSessions,
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForAppReady(page);
}

async function currentPageKey(page) {
  return page.evaluate(() => window.__MQ_UI__.getState().currentPage);
}

async function setPageKey(page, pageKey) {
  await page.evaluate(key => {
    window.__MQ_UI__.getState().setPage(key);
  }, pageKey);
  await delay(250);
}

async function getPracticeSnapshot(page) {
  return page.evaluate(() => {
    const state = window.__MQ_SESSION__.getState();
    return {
      page: window.__MQ_UI__.getState().currentPage,
      active: state.active,
      showFeedback: state.showFeedback,
      currentIndex: state.currentIndex,
      totalQuestions: state.totalQuestions,
      hearts: state.hearts,
      currentQuestionId: state.currentQuestion?.id ?? null,
      currentPrompt: state.currentQuestion?.prompt ?? null,
      questionType: state.currentQuestion?.type ?? null,
      sessionMode: state.session?.sessionMode ?? null,
    };
  });
}

async function submitCurrentQuestion(page, mode = 'correct') {
  return page.evaluate(answerMode => {
    const state = window.__MQ_SESSION__.getState();
    const question = state.currentQuestion;
    if (!question) {
      return null;
    }

    const correctAnswer = () => {
      if (question.type === 'multi-select') {
        return [...(question.solution.answers ?? [])].sort().join(',');
      }
      if (question.type === 'multi-blank') {
        return (question.solution.blanks ?? []).join('|');
      }
      if (question.type === 'expression-input' || question.type === 'equation-input') {
        return question.solution.standardExpression ?? String(question.solution.answer);
      }
      return String(question.solution.answer);
    };

    const wrongAnswer = () => {
      if (question.type === 'multiple-choice') {
        const options = question.data?.options ?? [];
        return options.find(option => String(option) !== String(question.solution.answer)) ?? '__wrong__';
      }
      if (question.type === 'multi-select') {
        const letters = (question.data?.options ?? []).map((_, index) => String.fromCharCode(65 + index));
        const candidate = letters.find(letter => !(question.solution.answers ?? []).includes(letter));
        return candidate ?? 'A';
      }
      if (question.type === 'multi-blank') {
        const blanks = question.solution.blanks ?? [];
        if (blanks.length === 0) return '__wrong__';
        return blanks.map((blank, index) => (index === 0 ? `${blank}_x` : blank)).join('|');
      }
      if (question.type === 'expression-input' || question.type === 'equation-input') {
        return '1';
      }
      if (String(question.solution.answer).includes('...')) {
        return '0...0';
      }
      return '__wrong__';
    };

    const answer = answerMode === 'correct' ? correctAnswer() : wrongAnswer();
    const result = state.submitAnswer(answer);
    const nextState = window.__MQ_SESSION__.getState();
    return {
      answer,
      result,
      hearts: nextState.hearts,
      currentIndex: nextState.currentIndex,
      questionId: question.id,
      prompt: question.prompt,
      type: question.type,
    };
  }, mode);
}

async function clickFeedbackNext(page) {
  const button = page.getByRole('button', { name: /下一题|查看结果/ });
  await button.click();
  await delay(200);
}

async function answerQuestions(page, count, mode = 'correct') {
  for (let index = 0; index < count; index++) {
    const before = await getPracticeSnapshot(page);
    if (before.page !== 'practice' || !before.active || before.showFeedback) {
      throw new Error(`无法继续答题：page=${before.page} active=${before.active} feedback=${before.showFeedback}`);
    }
    await submitCurrentQuestion(page, mode);
    await page.waitForFunction(() => window.__MQ_SESSION__.getState().showFeedback === true, { timeout: 5000 });
    await clickFeedbackNext(page);
    const afterPage = await currentPageKey(page);
    if (afterPage !== 'practice') {
      break;
    }
  }
}

async function finishCurrentPractice(page, mode = 'correct') {
  while (true) {
    const snapshot = await getPracticeSnapshot(page);
    if (snapshot.page !== 'practice') break;
    if (!snapshot.showFeedback) {
      await submitCurrentQuestion(page, mode);
      await page.waitForFunction(() => window.__MQ_SESSION__.getState().showFeedback === true, { timeout: 5000 });
    }
    await clickFeedbackNext(page);
    const pageKey = await currentPageKey(page);
    if (pageKey !== 'practice') break;
  }
}

async function startFreshOnboarding(page, nickname) {
  await resetToEmpty(page);
  await page.getByRole('button', { name: '开始冒险' }).click();
  await page.getByLabel('用户昵称').fill(nickname);
  await page.getByRole('button', { name: '开始学习！' }).click();
  await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'home', { timeout: 5000 });
  await delay(300);
}

async function openFirstCampaignPractice(page) {
  await page.getByText('基础计算', { exact: false }).first().click();
  await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'campaign-map', { timeout: 5000 });
  await delay(300);
  await page.getByRole('button', { name: /第\s*1\s*关/ }).first().click({ force: true });
  await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'practice', { timeout: 5000 });
  await delay(300);
}

async function openBottomNav(page, label) {
  const pageKeyMap = {
    学习: 'home',
    记录: 'progress',
    错题: 'wrong-book',
    我的: 'profile',
  };
  const targetPage = pageKeyMap[label];
  if (!targetPage) throw new Error(`未知底部导航标签: ${label}`);
  await page.evaluate(pageKey => {
    window.__MQ_UI__.getState().setPage(pageKey);
  }, targetPage);
  const expectedPage = pageKeyMap[label];
  if (expectedPage) {
    await page.waitForFunction(pageKey => window.__MQ_UI__.getState().currentPage === pageKey, expectedPage, { timeout: 5000 });
  }
  await delay(300);
}

async function writeBatchReport(fileName, title, batchKey, notes = []) {
  const batchResults = results.filter(item => item.batch === batchKey);
  const counts = countByVerdict(batchKey);
  const lines = [
    `# ${title}`,
    '',
    `**执行日期**：2026-04-23`,
    `**总计**：${counts.total} 条`,
    `**结果**：PASS: ${counts.pass} / FAIL: ${counts.fail} / RISK: ${counts.risk} / BLOCKED: ${counts.blocked}`,
    '',
  ];

  if (notes.length > 0) {
    lines.push('## 说明', '');
    for (const note of notes) {
      lines.push(`- ${note}`);
    }
    lines.push('');
  }

  lines.push('## 逐条结果', '');
  lines.push('| ID | 用例名称 | 用户预期 | 操作路径 | 实际观察 | 判定 | 证据 |');
  lines.push('|----|---------|---------|---------|---------|------|------|');

  for (const item of batchResults) {
    const evidence = item.evidence.length > 0 ? item.evidence.join('<br>') : '-';
    lines.push(
      `| ${item.id} | ${md(item.title)} | ${md(item.expected)} | ${md(item.steps)} | ${md(item.observed)} | ${item.verdict} | ${md(evidence)} |`,
    );
  }

  fs.writeFileSync(path.join(__dirname, fileName), `${lines.join('\n')}\n`, 'utf8');
}

async function runFreshUserBatch(page) {
  const batch = 'fresh';

  await runCase(page, {
    batch,
    id: 'B-01',
    title: '欢迎页首屏',
    expected: '看到“数学大冒险”欢迎页与“开始冒险”按钮。',
    steps: '清空本地存档后打开应用。',
    fn: async () => {
      await resetToEmpty(page);
      const shot = await screenshot(page, 'B-01-onboarding.png');
      const body = await page.locator('body').innerText();
      const pageKey = await currentPageKey(page);
      const pass = pageKey === 'onboarding' && body.includes('数学大冒险') && body.includes('开始冒险');
      return {
        observed: `page=${pageKey}；欢迎文案=${body.includes('数学大冒险')}；开始按钮=${body.includes('开始冒险')}`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [shot],
      };
    },
  });

  await runCase(page, {
    batch,
    id: 'B-02',
    title: '昵称建档',
    expected: '输入昵称后创建用户并进入 Home。',
    steps: '点击“开始冒险”→ 输入昵称 → 点击“开始学习！”。',
    fn: async () => {
      await startFreshOnboarding(page, '全量QA新号');
      const shot = await screenshot(page, 'B-02-home-after-onboarding.png');
      const pageKey = await currentPageKey(page);
      const body = await page.locator('body').innerText();
      const pass = pageKey === 'home' && body.includes('全量QA新号');
      return {
        observed: `page=${pageKey}；昵称可见=${body.includes('全量QA新号')}`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [shot],
      };
    },
  });

  await runCase(page, {
    batch,
    id: 'B-03',
    title: 'Home 首屏信息层级',
    expected: 'Home 同时呈现 Hero 卡、8 个主题卡、进阶锁态和段位赛入口。',
    steps: '新号首次进入 Home 后观察首屏。',
    fn: async () => {
      const shot = await screenshot(page, 'B-03-home-overview.png');
      const body = await page.locator('body').innerText();
      const topicHits = TOPIC_NAMES.filter(name => body.includes(name)).length;
      const hasRankCard = body.includes('冲击 新秀') || body.includes('挑战 新秀') || body.includes('继续挑战：');
      const pass = body.includes('继续学习') && body.includes('进阶训练') && hasRankCard && topicHits === 8;
      return {
        observed: `主题命中=${topicHits}/8；进阶入口=${body.includes('进阶训练')}；段位赛卡=${hasRankCard}`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [shot],
      };
    },
  });

  await runCase(page, {
    batch,
    id: 'B-04',
    title: '主题卡进入闯关地图',
    expected: '点击 A01 主题卡后进入 CampaignMap，并看到可玩的第 1 关。',
    steps: '在 Home 点击“基础计算”。',
    fn: async () => {
      await page.getByText('基础计算', { exact: false }).first().click();
      await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'campaign-map', { timeout: 5000 });
      await delay(300);
      const shot = await screenshot(page, 'B-04-campaign-map-a01.png');
      const body = await page.locator('body').innerText();
      const hasLevelOne = /第\s*1\s*关/.test(body);
      const pass = hasLevelOne;
      return {
        observed: `page=campaign-map；第1关可见=${hasLevelOne}`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [shot],
      };
    },
  });

  await runCase(page, {
    batch,
    id: 'B-05',
    title: 'Practice 基础答题页',
    expected: '进入第 1 关后看到退出、进度、心数和题面。',
    steps: '在 CampaignMap 点击第 1 关。',
    fn: async () => {
      await page.getByRole('button', { name: /第\s*1\s*关/ }).first().click({ force: true });
      await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'practice', { timeout: 5000 });
      await delay(400);
      const shot = await screenshot(page, 'B-05-practice-first-question.png');
      const snapshot = await getPracticeSnapshot(page);
      const body = await page.locator('body').innerText();
      const pass = snapshot.page === 'practice' && snapshot.hearts === 3 && body.includes('✕');
      return {
        observed: `题型=${snapshot.questionType}；进度=${snapshot.currentIndex + 1}/${snapshot.totalQuestions}；心数=${snapshot.hearts}`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [shot],
      };
    },
  });

  await runCase(page, {
    batch,
    id: 'B-06',
    title: '退出确认弹窗',
    expected: '点退出后弹出确认对话框，并能继续练习。',
    steps: '在 Practice 点击左上退出按钮，再点击“继续练习”。',
    fn: async () => {
      await page.getByRole('button', { name: '退出练习' }).click();
      await delay(250);
      const shot = await screenshot(page, 'B-06-quit-dialog.png');
      const body = await page.locator('body').innerText();
      const hasDialog = body.includes('确定退出吗？') && body.includes('继续练习') && body.includes('退出');
      await page.getByRole('button', { name: '继续练习' }).click();
      await delay(250);
      return {
        observed: `弹窗标题=${body.includes('确定退出吗？')}；说明文案=${body.includes('退出后本次练习不计入记录')}`,
        verdict: hasDialog ? 'PASS' : 'FAIL',
        evidence: [shot],
      };
    },
  });

  await runCase(page, {
    batch,
    id: 'B-07',
    title: '单局通关结算',
    expected: '完整通过一局闯关后进入 summary，并显示通关结算。',
    steps: '在 Practice 使用正确答案完成本局全部题目。',
    fn: async () => {
      await finishCurrentPractice(page, 'correct');
      await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'summary', { timeout: 5000 });
      const shot = await screenshot(page, 'B-07-summary.png');
      const body = await page.locator('body').innerText();
      const pass = body.includes('太棒了，通关！') && body.includes('答对题数');
      return {
        observed: `summary文案=${body.includes('太棒了，通关！')}；统计区=${body.includes('答对题数')}`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [shot],
      };
    },
  });

  await runCase(page, {
    batch,
    id: 'B-08',
    title: '记录首页与总体统计',
    expected: '记录页能同页展示概览信息、累计答题、总体正确率和练习记录列表。',
    steps: '从 summary 返回首页，再通过底部导航进入“记录”。',
    fn: async () => {
      await page.getByRole('button', { name: '回首页' }).click();
      await delay(300);
      await openBottomNav(page, '记录');
      const shot = await screenshot(page, 'B-08-progress.png');
      const body = await page.locator('body').innerText();
      const pass = body.includes('概览信息') && body.includes('累计答题') && body.includes('总正确率') && body.includes('练习记录');
      return {
        observed: `概览卡=${body.includes('概览信息')}；累计答题=${body.includes('累计答题')}；正确率=${body.includes('总正确率')}；列表=${body.includes('练习记录')}`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [shot],
      };
    },
  });

  await runCase(page, {
    batch,
    id: 'B-09',
    title: '记录列表与 SessionDetail',
    expected: '能从记录首页直接打开刚完成的练习详情。',
    steps: '在记录首页直接打开第一条练习记录。',
    fn: async () => {
      const historyShot = await screenshot(page, 'B-09-history.png');
      await page.locator('button').filter({ hasText: '查看逐题详情' }).first().click();
      await delay(300);
      const detailShot = await screenshot(page, 'B-09-session-detail.png');
      const body = await page.locator('body').innerText();
      const pass = body.includes('练习详情') && body.includes('逐题记录') && body.includes('第 1 题');
      return {
        observed: `详情页标题=${body.includes('练习详情')}；逐题区=${body.includes('逐题记录')}；首题=${body.includes('第 1 题')}`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [historyShot, detailShot],
      };
    },
  });

  await runCase(page, {
    batch,
    id: 'B-10',
    title: 'Profile 与错题本空状态',
    expected: 'Profile 展示用户统计，错题本在全对路径下呈现空状态。',
    steps: '从练习详情返回记录首页，再进入“我的”和“错题”。',
    fn: async () => {
      await page.getByLabel('返回记录首页').click();
      await delay(200);
      await openBottomNav(page, '我的');
      const profileShot = await screenshot(page, 'B-10-profile.png');
      const profileBody = await page.locator('body').innerText();
      await openBottomNav(page, '错题');
      const wrongBookShot = await screenshot(page, 'B-10-wrongbook-empty.png');
      const wrongBookBody = await page.locator('body').innerText();
      const pass = profileBody.includes('个人中心') && profileBody.includes('总题数') && wrongBookBody.includes('还没有做错的题目');
      return {
        observed: `Profile统计=${profileBody.includes('总题数')}；错题本空态=${wrongBookBody.includes('还没有做错的题目')}`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [profileShot, wrongBookShot],
      };
    },
  });
}

async function runAdvanceBatch(page) {
  const batch = 'advance';
  const user = buildUser('qa-advance-user', '进阶夹具号');
  const progress = buildAdvanceUnlockedProgress(user.id);

  await runCase(page, {
    batch,
    id: 'C-01',
    title: '进阶入口锁态→解锁态',
    expected: 'Home 上的进阶训练入口会从锁态切换为可点击态。',
    steps: '加载已解锁 1 个题型进阶的夹具存档，观察 Home。',
    fn: async () => {
      await seedLocalState(page, { user, progress });
      const shot = await screenshot(page, 'C-01-home-advance-unlocked.png');
      const body = await page.locator('body').innerText();
      const pass = body.includes('进阶训练') && body.includes('刷星升级，积累段位赛入场资格');
      return {
        observed: `可点击态文案=${body.includes('刷星升级，积累段位赛入场资格')}；锁态已在 B-03 观察到`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [shot],
      };
    },
  });

  await runCase(page, {
    batch,
    id: 'C-02',
    title: 'AdvanceSelect 已解锁/未解锁分区',
    expected: 'AdvanceSelect 能同时展示已解锁题型与未解锁题型。',
    steps: '从 Home 进入进阶训练页。',
    fn: async () => {
      await page.getByText('进阶训练', { exact: false }).first().click();
      await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'advance-select', { timeout: 5000 });
      await delay(300);
      const shot = await screenshot(page, 'C-02-advance-select.png');
      const body = await page.locator('body').innerText();
      const pass = body.includes('已解锁') && body.includes('完成闯关后解锁') && body.includes('基础计算');
      return {
        observed: `已解锁区=${body.includes('已解锁')}；未解锁区=${body.includes('完成闯关后解锁')}；基础计算可开始=${body.includes('开始')}`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [shot],
      };
    },
  });

  await runCase(page, {
    batch,
    id: 'C-03',
    title: '进阶一局结算与星级进度',
    expected: '完成一局进阶后进入专属 summary，显示 Hearts 投入与星级进度。',
    steps: '在 AdvanceSelect 开始基础计算进阶，并用正确答案完成整局。',
    fn: async () => {
      await page.getByRole('button', { name: /开始 基础计算 进阶训练/ }).click();
      await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'practice', { timeout: 5000 });
      await finishCurrentPractice(page, 'correct');
      await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'summary', { timeout: 5000 });
      const shot = await screenshot(page, 'C-03-advance-summary.png');
      const body = await page.locator('body').innerText();
      const hasStarProgress = /\d+★/.test(body) || body.includes('已达满级');
      const hasHeartProgress = body.includes('❤️') || body.includes('还差');
      const pass = body.includes('练习完成！') && hasStarProgress && hasHeartProgress && body.includes('答对题数');
      return {
        observed: `练习完成=${body.includes('练习完成！')}；星进度=${hasStarProgress}；心进度=${hasHeartProgress}；答题统计=${body.includes('答对题数')}`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [shot],
      };
    },
  });

  await runCase(page, {
    batch,
    id: 'C-04',
    title: '错题本沉淀',
    expected: '进阶中答错后主动退出，错题应进入错题本。',
    steps: '从 summary 返回进阶训练，再开一局并故意做错 2 题后退出到首页，检查错题本。',
    fn: async () => {
      await page.getByRole('button', { name: /再来一局/ }).click();
      await delay(250);
      await page.getByRole('button', { name: /开始 基础计算 进阶训练/ }).click();
      await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'practice', { timeout: 5000 });
      await answerQuestions(page, 2, 'wrong');
      await page.getByRole('button', { name: '退出练习' }).click();
      await delay(200);
      await page.getByRole('button', { name: '退出', exact: true }).click();
      await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'home', { timeout: 5000 });
      await openBottomNav(page, '错题');
      const shot = await screenshot(page, 'C-04-wrongbook.png');
      const body = await page.locator('body').innerText();
      const pass = body.includes('错题本') && body.includes('你的答案') && body.includes('正确');
      return {
        observed: `错题页标题=${body.includes('错题本')}；错误答案区=${body.includes('你的答案')}；正确答案区=${body.includes('正确')}`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [shot],
      };
    },
  });

  await runCase(page, {
    batch,
    id: 'C-05',
    title: 'Profile 快捷入口联动',
    expected: '个人中心存在错题时，可通过快捷入口进入错题本。',
    steps: '从错题本回 Home，再进入“我的”，点击错题本快捷入口。',
    fn: async () => {
      await page.getByRole('button', { name: '返回首页' }).click();
      await delay(250);
      await openBottomNav(page, '我的');
      const profileShot = await screenshot(page, 'C-05-profile-with-shortcut.png');
      const profileBody = await page.locator('body').innerText();
      const shortcutButton = page.locator('button').filter({ hasText: /题\s*→/ }).first();
      await shortcutButton.click();
      await delay(300);
      const wrongBookBody = await page.locator('body').innerText();
      const wrongBookShot = await screenshot(page, 'C-05-wrongbook-shortcut.png');
      const pass = profileBody.includes('错题本') && wrongBookBody.includes('错题本');
      return {
        observed: `Profile快捷入口=${profileBody.includes('错题本')}；跳转后仍在错题本=${wrongBookBody.includes('错题本')}`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [profileShot, wrongBookShot],
      };
    },
  });

  await runCase(page, {
    batch,
    id: 'C-06',
    title: '刷新后持久化',
    expected: '刷新后仍保留用户、进阶解锁与统计数据。',
    steps: '返回 Home 后刷新页面。',
    fn: async () => {
      await setPageKey(page, 'home');
      const beforeReload = await page.locator('body').innerText();
      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      const shot = await screenshot(page, 'C-06-home-after-refresh.png');
      const afterReload = await page.locator('body').innerText();
      const pass = beforeReload.includes('进阶训练') && afterReload.includes('进阶训练') && afterReload.includes('进阶夹具号');
      return {
        observed: `刷新前进阶入口=${beforeReload.includes('进阶训练')}；刷新后进阶入口=${afterReload.includes('进阶训练')}；昵称保留=${afterReload.includes('进阶夹具号')}`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [shot],
      };
    },
  });
}

async function runRankBatch(page) {
  const batch = 'rank';

  await runCase(page, {
    batch,
    id: 'D-01',
    title: 'Home 段位赛入口三态',
    expected: 'Home 段位赛卡在门槛不足 / 可挑战 / 有活跃赛事三态下文案正确。',
    steps: '分别加载门槛不足、可挑战与已开赛的夹具状态，观察 Home 段位赛卡。',
    fn: async () => {
      const gapUser = buildUser('qa-rank-gap', '段位缺口号');
      await seedLocalState(page, { user: gapUser, progress: buildRookieGapProgress(gapUser.id) });
      const gapBody = await page.locator('body').innerText();

      const unlockedUser = buildUser('qa-rank-open', '段位解锁号');
      await seedLocalState(page, { user: unlockedUser, progress: buildRookieUnlockedProgress(unlockedUser.id) });
      const unlockedBody = await page.locator('body').innerText();

      await setPageKey(page, 'rank-match-hub');
      await delay(200);
      await page.getByRole('button', { name: '挑战新秀段位' }).click();
      await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'practice', { timeout: 5000 });
      await setPageKey(page, 'home');
      const activeBody = await page.locator('body').innerText();
      const shot = await screenshot(page, 'D-01-home-rank-card-states.png');

      const pass =
        gapBody.includes('冲击 新秀') &&
        gapBody.includes('差') &&
        unlockedBody.includes('挑战 新秀') &&
        activeBody.includes('继续挑战：新秀 BO3');

      return {
        observed: `门槛不足=${gapBody.includes('冲击 新秀')}；可挑战=${unlockedBody.includes('挑战 新秀')}；活跃赛事=${activeBody.includes('继续挑战：新秀 BO3')}`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [shot],
      };
    },
  });

  await runCase(page, {
    batch,
    id: 'D-02',
    title: 'Hub 锁定与解锁展示',
    expected: 'Hub 中未满足门槛时显示锁态与缺口，满足门槛时显示挑战按钮。',
    steps: '分别加载门槛不足与可挑战夹具，进入 RankMatchHub。',
    fn: async () => {
      const gapUser = buildUser('qa-rank-gap-2', '段位缺口号2');
      await seedLocalState(page, { user: gapUser, progress: buildRookieGapProgress(gapUser.id) });
      await setPageKey(page, 'rank-match-hub');
      const gapBody = await page.locator('body').innerText();

      const openUser = buildUser('qa-rank-open-2', '段位解锁号2');
      await seedLocalState(page, { user: openUser, progress: buildRookieUnlockedProgress(openUser.id) });
      await setPageKey(page, 'rank-match-hub');
      const shot = await screenshot(page, 'D-02-rank-hub.png');
      const openBody = await page.locator('body').innerText();

      const pass = gapBody.includes('🔒') && gapBody.includes('差') && openBody.includes('挑战');
      return {
        observed: `锁态缺口=${gapBody.includes('差')}；解锁按钮=${openBody.includes('挑战')}`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [shot],
      };
    },
  });

  const promotionUser = buildUser('qa-rank-promote', '晋级路径号');
  const promotionProgress = buildRookieUnlockedProgress(promotionUser.id);
  await seedLocalState(page, { user: promotionUser, progress: promotionProgress });
  await setPageKey(page, 'rank-match-hub');
  await page.getByRole('button', { name: '挑战新秀段位' }).click();
  await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'practice', { timeout: 5000 });

  await runCase(page, {
    batch,
    id: 'D-03',
    title: 'Rookie Practice 题头与 BO 感知',
    expected: '进入 Rookie Practice 后看到“新秀 · BO3 · 第 1 局”头部。',
    steps: '从 Hub 发起 Rookie 挑战。',
    fn: async () => {
      const shot = await screenshot(page, 'D-03-rank-practice-header.png');
      const body = await page.locator('body').innerText();
      const pass = body.includes('新秀') && body.includes('BO3') && body.includes('第 1 局');
      return {
        observed: `头部新秀=${body.includes('新秀')}；BO3=${body.includes('BO3')}；第1局=${body.includes('第 1 局')}`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [shot],
      };
    },
  });

  await runCase(page, {
    batch,
    id: 'D-04',
    title: '单局结算自动推进',
    expected: '第 1 局结束后进入 GameResult，并在 3 秒内自动推进到下一局。',
    steps: '用正确答案完成第 1 局 Rookie 对局。',
    fn: async () => {
      await finishCurrentPractice(page, 'correct');
      await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'rank-match-game-result', { timeout: 5000 });
      const gameResultShot = await screenshot(page, 'D-04-rank-game-result.png');
      const body = await page.locator('body').innerText();
      const hasCountdown = body.includes('开始下一局');
      await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'practice', { timeout: 5000 });
      const nextPractice = await getPracticeSnapshot(page);
      const pass = hasCountdown && nextPractice.page === 'practice' && String(nextPractice.currentIndex + 1) === '1';
      return {
        observed: `GameResult倒计时按钮=${hasCountdown}；自动推进后页=${nextPractice.page}`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [gameResultShot],
      };
    },
  });

  await runCase(page, {
    batch,
    id: 'D-05',
    title: '晋级结算页',
    expected: '两局连胜后进入赛事总结算页，显示晋级成功与提前结束标注。',
    steps: '继续用正确答案完成第 2 局。',
    fn: async () => {
      await finishCurrentPractice(page, 'correct');
      await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'rank-match-result', { timeout: 10000 });
      const shot = await screenshot(page, 'D-05-rank-promoted.png');
      const body = await page.locator('body').innerText();
      const pass = body.includes('晋级成功！') && body.includes('BO3 第 2 局定胜负');
      return {
        observed: `晋级文案=${body.includes('晋级成功！')}；提前结束标注=${body.includes('BO3 第 2 局定胜负')}`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [shot],
      };
    },
  });

  await runCase(page, {
    batch,
    id: 'D-06',
    title: '淘汰复盘页',
    expected: '两局连败后进入赛事总结算页，显示薄弱题型前 3。',
    steps: '加载新秀可挑战夹具，故意两局连败。',
    fn: async () => {
      const user = buildUser('qa-rank-elim', '淘汰路径号');
      await seedLocalState(page, { user, progress: buildRookieUnlockedProgress(user.id) });
      await setPageKey(page, 'rank-match-hub');
      await page.getByRole('button', { name: '挑战新秀段位' }).click();
      await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'practice', { timeout: 5000 });
      await finishCurrentPractice(page, 'wrong');
      await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'rank-match-game-result', { timeout: 5000 });
      await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'practice', { timeout: 5000 });
      await finishCurrentPractice(page, 'wrong');
      await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'rank-match-result', { timeout: 10000 });
      const shot = await screenshot(page, 'D-06-rank-eliminated.png');
      const body = await page.locator('body').innerText();
      const pass = body.includes('未能晋级') && body.includes('薄弱题型复盘') && body.includes('题错误');
      return {
        observed: `淘汰文案=${body.includes('未能晋级')}；薄弱题型区=${body.includes('薄弱题型复盘')}`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [shot],
      };
    },
  });

  await runCase(page, {
    batch,
    id: 'D-07',
    title: '局内刷新恢复',
    expected: '段位赛答到中途刷新后，应直接恢复到当前局可继续答题的状态。',
    steps: '加载新秀可挑战夹具，开始 Rookie 对局，答 5 题后刷新浏览器。',
    fn: async () => {
      const user = buildUser('qa-rank-refresh-mid', '局内刷新号');
      await seedLocalState(page, { user, progress: buildRookieUnlockedProgress(user.id) });
      await setPageKey(page, 'rank-match-hub');
      await page.getByRole('button', { name: '挑战新秀段位' }).click();
      await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'practice', { timeout: 5000 });
      await answerQuestions(page, 5, 'correct');
      const before = await getPracticeSnapshot(page);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      const afterPage = await currentPageKey(page);
      let afterSnapshot = null;
      if (afterPage === 'practice') {
        afterSnapshot = await getPracticeSnapshot(page);
      }
      const shot = await screenshot(page, 'D-07-rank-refresh-mid.png');
      const pass =
        afterPage === 'practice' &&
        afterSnapshot?.currentIndex === before.currentIndex &&
        afterSnapshot?.currentQuestionId === before.currentQuestionId;
      return {
        observed: `刷新前 index=${before.currentIndex} qid=${before.currentQuestionId}；刷新后 page=${afterPage}${afterSnapshot ? ` index=${afterSnapshot.currentIndex} qid=${afterSnapshot.currentQuestionId}` : ''}`,
        verdict: pass ? 'PASS' : 'FAIL',
        evidence: [shot],
      };
    },
  });

  await runCase(page, {
    batch,
    id: 'D-08',
    title: '局间刷新恢复',
    expected: '第 1 局结束后的刷新不会丢失活跃赛事，用户仍能继续下一局。',
    steps: '加载新秀可挑战夹具，完成第 1 局后在 GameResult 阶段刷新。',
    fn: async () => {
      const user = buildUser('qa-rank-refresh-between', '局间刷新号');
      await seedLocalState(page, { user, progress: buildRookieUnlockedProgress(user.id) });
      await setPageKey(page, 'rank-match-hub');
      await page.getByRole('button', { name: '挑战新秀段位' }).click();
      await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'practice', { timeout: 5000 });
      await finishCurrentPractice(page, 'correct');
      await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'rank-match-game-result', { timeout: 5000 });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      const pageKey = await currentPageKey(page);
      const body = await page.locator('body').innerText();
      let resumable = false;
      if (pageKey === 'rank-match-hub') {
        resumable = body.includes('开始下一局') || body.includes('继续第');
      } else if (pageKey === 'home') {
        resumable = body.includes('继续挑战：新秀 BO3');
      }
      const shot = await screenshot(page, 'D-08-rank-refresh-between.png');
      return {
        observed: `刷新后 page=${pageKey}；可继续赛事=${resumable}`,
        verdict: resumable ? 'PASS' : 'FAIL',
        evidence: [shot],
      };
    },
  });

  await runCase(page, {
    batch,
    id: 'D-09',
    title: '段位赛相关 Console 健康',
    expected: '跑完整个 Rookie 晋级/淘汰/刷新路径后，不出现关键运行时错误。',
    steps: '统计本轮段位赛用例期间新增的 console error / pageerror。',
    fn: async () => {
      const rankEvents = consoleEvents.filter(event => event.caseTag === 'rank' || event.pageTag === 'rank');
      const critical = rankEvents.filter(event => event.type === 'error' || event.type === 'pageerror');
      const shot = await screenshot(page, 'D-09-final-state.png');
      return {
        observed: critical.length === 0
          ? '未记录到 rank-match 相关关键 console error/pageerror。'
          : `记录到 ${critical.length} 条关键错误：${critical.slice(0, 3).map(item => item.text).join(' || ')}`,
        verdict: critical.length === 0 ? 'PASS' : 'FAIL',
        evidence: [shot],
      };
    },
  });
}

async function main() {
  ensureDir(ARTIFACTS_DIR);
  ensureDir(SHOTS_DIR);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'zh-CN',
    colorScheme: 'light',
  });
  const page = await context.newPage();

  page.on('console', msg => {
    consoleEvents.push({
      type: msg.type(),
      text: msg.text(),
      pageTag: String(msg.text()).includes('RankMatch') ? 'rank' : 'general',
    });
  });
  page.on('pageerror', error => {
    consoleEvents.push({
      type: 'pageerror',
      text: String(error),
      pageTag: String(error).includes('RankMatch') ? 'rank' : 'general',
    });
  });

  try {
    await runFreshUserBatch(page);
    await runAdvanceBatch(page);
    await runRankBatch(page);
  } finally {
    await browser.close();
  }

  await writeBatchReport(
    'batch-1-fresh-user-result.md',
    'Batch 1 · 新号起步执行报告',
    'fresh',
    ['本批使用真实新号 onboarding 路径，不注入任何进度夹具。'],
  );
  await writeBatchReport(
    'batch-2-advance-result.md',
    'Batch 2 · 进阶与持久化执行报告',
    'advance',
    ['本批使用受控进度夹具进入中盘状态，以在单次 session 内覆盖进阶、错题沉淀和刷新持久化。'],
  );
  await writeBatchReport(
    'batch-3-rank-match-result.md',
    'Batch 3 · 段位赛执行报告',
    'rank',
    ['本批使用受控星级夹具进入 Rookie 门槛，并分别跑晋级、淘汰与刷新恢复三条路径。'],
  );

  fs.writeFileSync(
    path.join(__dirname, 'artifacts', 'raw-results.json'),
    JSON.stringify({ results, consoleEvents }, null, 2),
    'utf8',
  );

  const summary = [
    '执行完成：',
    `- fresh: ${JSON.stringify(countByVerdict('fresh'))}`,
    `- advance: ${JSON.stringify(countByVerdict('advance'))}`,
    `- rank: ${JSON.stringify(countByVerdict('rank'))}`,
    `- console critical total: ${consoleEvents.filter(item => item.type === 'error' || item.type === 'pageerror').length}`,
  ].join('\n');
  console.log(summary);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
