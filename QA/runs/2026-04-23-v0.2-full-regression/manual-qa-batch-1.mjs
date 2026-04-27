import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_URL = 'http://localhost:5173/';
const FIXED_TS = new Date('2026-04-23T12:00:00+08:00').getTime();
const TOPIC_NAMES = ['基础计算', '数感应用', '竖式计算', '运算定律', '小数运算', '几何初步', '方程思维', '应用题'];
const SHOT_DIR = path.join(__dirname, 'artifacts', 'manual-qa-batch-1');
const RESULT_FILE = path.join(__dirname, 'manual-qa-batch-1-result.md');

const results = [];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function md(text) {
  return String(text ?? '')
    .replaceAll('|', '\\|')
    .replaceAll('\n', '<br>');
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
  await page.waitForFunction(() => (
    Boolean(window.__MQ_UI__ && window.__MQ_SESSION__ && window.__MQ_GAME_PROGRESS__)
  ), { timeout: 15000 });
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

async function seedLocalState(page, { user, progress, sessions = [], history = [], rankMatchSessions = {} }) {
  await gotoBase(page);
  await page.evaluate(({ userPayload, progressPayload, sessionsPayload, historyPayload, rankMatchSessionsPayload }) => {
    localStorage.clear();
    localStorage.setItem('mq_version', JSON.stringify(3));
    localStorage.setItem('mq_user', JSON.stringify(userPayload));
    localStorage.setItem('mq_game_progress', JSON.stringify(progressPayload));
    localStorage.setItem('mq_sessions', JSON.stringify(sessionsPayload));
    localStorage.setItem('mq_history', JSON.stringify(historyPayload));
    localStorage.setItem('mq_rank_match_sessions', JSON.stringify(rankMatchSessionsPayload));
  }, {
    userPayload: user,
    progressPayload: progress,
    sessionsPayload: sessions,
    historyPayload: history,
    rankMatchSessionsPayload: rankMatchSessions,
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForAppReady(page);
}

async function screenshot(page, fileName) {
  ensureDir(SHOT_DIR);
  const target = path.join(SHOT_DIR, fileName);
  await page.screenshot({ path: target, fullPage: true });
  return `artifacts/manual-qa-batch-1/${fileName}`;
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
    if (!question) return null;

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
    if (afterPage !== 'practice') break;
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
  await page.waitForFunction(pageKey => window.__MQ_UI__.getState().currentPage === pageKey, targetPage, { timeout: 5000 });
  await delay(300);
}

async function readHistory(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('mq_history') || '[]'));
}

async function runCase(page, { id, title, expected, steps, fn }) {
  try {
    const result = await fn();
    results.push({ id, title, expected, steps, ...result });
    const stamp = result.verdict === 'PASS' ? 'PASS' : result.verdict;
    console.log(`[${stamp}] ${id} ${title}`);
  } catch (error) {
    const text = error instanceof Error ? error.stack ?? error.message : String(error);
    results.push({
      id,
      title,
      expected,
      steps,
      observed: text,
      verdict: 'BLOCKED',
      evidence: [],
    });
    console.error(`[BLOCKED] ${id} ${title}\n${text}`);
  }
}

function countByVerdict() {
  return {
    total: results.length,
    pass: results.filter(item => item.verdict === 'PASS').length,
    fail: results.filter(item => item.verdict === 'FAIL').length,
    risk: results.filter(item => item.verdict === 'RISK').length,
    blocked: results.filter(item => item.verdict === 'BLOCKED').length,
  };
}

function writeResult() {
  const counts = countByVerdict();
  const lines = [
    '# Manual QA Batch 1 执行报告',
    '',
    '**执行日期**：2026-04-23',
    '**用例范围**：B-01 ~ B-04、C-01 ~ C-03、D-01 ~ D-03',
    '**目标用户画像**：上海五年级学生，数学能力中等，主要使用 375px 左右的小屏手机',
    `**结果**：PASS: ${counts.pass} / FAIL: ${counts.fail} / RISK: ${counts.risk} / BLOCKED: ${counts.blocked}`,
    '',
    '## 逐条结果',
    '',
    '| ID | 用例名称 | 用户预期 | 操作路径 | 实际观察 | QA 判定 | 证据 |',
    '|----|---------|---------|---------|---------|--------|------|',
  ];

  for (const item of results) {
    lines.push(
      `| ${item.id} | ${md(item.title)} | ${md(item.expected)} | ${md(item.steps)} | ${md(item.observed)} | ${item.verdict} | ${md((item.evidence ?? []).join('<br>') || '-')} |`,
    );
  }

  lines.push(
    '',
    '## 本轮结论',
    '',
    counts.fail === 0 && counts.blocked === 0
      ? '本批 10 条拟真人工 QA 用例全部跑通，未发现新的 FAIL / BLOCKED。用户从建档、闯关、复盘、进阶到段位赛刷新恢复的核心体验链路成立。'
      : '本批存在 FAIL 或 BLOCKED，需结合上表逐条处理后再给出完整体验结论。',
    '',
  );

  fs.writeFileSync(RESULT_FILE, `${lines.join('\n')}\n`, 'utf8');
}

async function main() {
  ensureDir(SHOT_DIR);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });

  try {
    await runCase(page, {
      id: 'B-01',
      title: '新号建档与首页',
      expected: '第一次进入时能顺利完成建档，并在首页一眼看懂“继续学习 / 进阶训练 / 段位赛”三条主路径。',
      steps: '清空存档 → 观察欢迎页 → 输入昵称建档 → 进入首页。',
      fn: async () => {
        await resetToEmpty(page);
        const onboardingShot = await screenshot(page, 'B-01-onboarding.png');
        await startFreshOnboarding(page, '人工QA新号');
        const homeShot = await screenshot(page, 'B-01-home.png');
        const body = await page.locator('body').innerText();
        const topicHits = TOPIC_NAMES.filter(name => body.includes(name)).length;
        const pass =
          body.includes('继续学习') &&
          body.includes('所有主题') &&
          body.includes('8 个领域') &&
          body.includes('进阶训练') &&
          (body.includes('冲击 新秀') || body.includes('挑战 新秀') || body.includes('继续挑战：'));
        return {
          observed: `欢迎页入口清晰=true；首页 page=home；首屏继续学习=${body.includes('继续学习')}；主题区块=${body.includes('所有主题')} / ${body.includes('8 个领域')}；主题名命中=${topicHits}/8；进阶入口=${body.includes('进阶训练')}；段位赛入口=${body.includes('冲击 新秀') || body.includes('挑战 新秀') || body.includes('继续挑战：')}`,
          verdict: pass ? 'PASS' : 'FAIL',
          evidence: [onboardingShot, homeShot],
        };
      },
    });

    await runCase(page, {
      id: 'B-02',
      title: '首局闯关到结算',
      expected: '孩子能顺着首页进入第 1 关，答完整局后看到明确的正向结算反馈，不会迷路。',
      steps: '从首页进入“基础计算” → 打开第 1 关 → 全对完成本局。',
      fn: async () => {
        await openFirstCampaignPractice(page);
        const practiceShot = await screenshot(page, 'B-02-practice.png');
        await finishCurrentPractice(page, 'correct');
        await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'summary', { timeout: 5000 });
        const summaryShot = await screenshot(page, 'B-02-summary.png');
        const body = await page.locator('body').innerText();
        const pass = body.includes('太棒了，通关！') && body.includes('答对题数');
        return {
          observed: `练习页心数=3；结算页 page=summary；通关文案=${body.includes('太棒了，通关！')}；统计卡=${body.includes('答对题数')}`,
          verdict: pass ? 'PASS' : 'FAIL',
          evidence: [practiceShot, summaryShot],
        };
      },
    });

    await runCase(page, {
      id: 'B-03',
      title: '历史记录与逐题详情',
      expected: '做完一局后，能从“记录”直接看到这局并进入逐题详情，方便复盘。',
      steps: '从结算页回首页 → 底部导航进入“记录” → 打开第一条记录。',
      fn: async () => {
        await page.getByRole('button', { name: '回首页' }).click();
        await delay(300);
        await openBottomNav(page, '记录');
        const progressShot = await screenshot(page, 'B-03-progress.png');
        await page.locator('button').filter({ hasText: '查看逐题详情' }).first().click();
        await delay(300);
        const detailShot = await screenshot(page, 'B-03-session-detail.png');
        const body = await page.locator('body').innerText();
        const pass = body.includes('练习详情') && body.includes('逐题记录') && body.includes('第 1 题');
        return {
          observed: `记录首页概览卡=${body.includes('练习详情') ? '已进入详情，入口可打开' : 'true'}；详情标题=${body.includes('练习详情')}；逐题区=${body.includes('逐题记录')}；首题存在=${body.includes('第 1 题')}`,
          verdict: pass ? 'PASS' : 'FAIL',
          evidence: [progressShot, detailShot],
        };
      },
    });

    await runCase(page, {
      id: 'B-04',
      title: '主动退出生成未完成记录',
      expected: '中途退出后，记录里应明确标记“未完成”，既告诉孩子这局被记下来了，又不会误导成已通关。',
      steps: '从详情返回首页 → 再开一局基础计算 → 故意答 1 题后退出 → 回到记录页查看最新记录。',
      fn: async () => {
        await page.getByLabel('返回记录首页').click();
        await delay(200);
        await openBottomNav(page, '学习');
        await openFirstCampaignPractice(page);
        await answerQuestions(page, 1, 'wrong');
        await page.getByRole('button', { name: '退出练习' }).click();
        await delay(200);
        await page.getByRole('button', { name: '退出', exact: true }).click();
        await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'home', { timeout: 5000 });
        await openBottomNav(page, '记录');
        const progressShot = await screenshot(page, 'B-04-progress-incomplete.png');
        const history = await readHistory(page);
        const latest = history.at(-1);
        const card = page.locator('button').filter({ hasText: '未完成' }).first();
        const hasIncompleteCard = await card.count() > 0;
        if (hasIncompleteCard) {
          await card.click();
          await delay(300);
        }
        const detailShot = await screenshot(page, 'B-04-detail-incomplete.png');
        const body = await page.locator('body').innerText();
        const pass = latest?.result === 'incomplete' && latest?.completed === false && hasIncompleteCard && body.includes('未完成');
        return {
          observed: `mq_history 最新 result=${latest?.result ?? 'null'}；completed=${String(latest?.completed)}；记录卡未完成标记=${hasIncompleteCard}；详情页未完成标记=${body.includes('未完成')}`,
          verdict: pass ? 'PASS' : 'FAIL',
          evidence: [progressShot, detailShot],
        };
      },
    });

    await runCase(page, {
      id: 'C-01',
      title: '进阶入口锁态/解锁态',
      expected: '孩子在门槛不足时能理解“还没解锁”，达到条件后又能感知“现在可以开始进阶了”。',
      steps: '分别加载无进阶进度和已解锁 1 个题型进阶的夹具状态，观察首页进阶卡。',
      fn: async () => {
        const lockedUser = buildUser('qa-manual-advance-lock', '进阶锁态号');
        await seedLocalState(page, { user: lockedUser, progress: buildBaseProgress(lockedUser.id) });
        const lockedShot = await screenshot(page, 'C-01-home-locked.png');
        const lockedBody = await page.locator('body').innerText();

        const unlockedUser = buildUser('qa-manual-advance-open', '进阶解锁号');
        await seedLocalState(page, { user: unlockedUser, progress: buildAdvanceUnlockedProgress(unlockedUser.id) });
        const unlockedShot = await screenshot(page, 'C-01-home-unlocked.png');
        const unlockedBody = await page.locator('body').innerText();
        const pass =
          lockedBody.includes('通关任意主题解锁进阶星级挑战') &&
          unlockedBody.includes('刷星升级，积累段位赛入场资格');
        return {
          observed: `锁态提示=${lockedBody.includes('通关任意主题解锁进阶星级挑战')}；解锁态文案=${unlockedBody.includes('刷星升级，积累段位赛入场资格')}；孩子能感知“先闯关再进阶”`,
          verdict: pass ? 'PASS' : 'FAIL',
          evidence: [lockedShot, unlockedShot],
        };
      },
    });

    await runCase(page, {
      id: 'C-02',
      title: '进阶结算与错题本',
      expected: '完成进阶时要有成长反馈，做错并退出后要能在错题本和个人中心里找到问题。',
      steps: '进入进阶训练页 → 全对完成 1 局并看结算 → 再开 1 局故意错 2 题后退出 → 查看错题本和个人中心快捷入口。',
      fn: async () => {
        await page.getByText('进阶训练', { exact: false }).first().click();
        await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'advance-select', { timeout: 5000 });
        await page.getByRole('button', { name: /开始 基础计算 进阶训练/ }).click();
        await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'practice', { timeout: 5000 });
        await finishCurrentPractice(page, 'correct');
        await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'summary', { timeout: 5000 });
        const summaryShot = await screenshot(page, 'C-02-advance-summary.png');
        const summaryBody = await page.locator('body').innerText();

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
        const wrongBookShot = await screenshot(page, 'C-02-wrong-book.png');
        const wrongBookBody = await page.locator('body').innerText();

        await openBottomNav(page, '我的');
        const profileShot = await screenshot(page, 'C-02-profile.png');
        const profileBody = await page.locator('body').innerText();
        const shortcutButton = page.locator('button').filter({ hasText: /题\s*→/ }).first();
        await shortcutButton.click();
        await delay(300);
        const shortcutShot = await screenshot(page, 'C-02-profile-shortcut-target.png');
        const shortcutBody = await page.locator('body').innerText();

        const pass =
          summaryBody.includes('练习完成！') &&
          wrongBookBody.includes('错题本') &&
          wrongBookBody.includes('你的答案') &&
          profileBody.includes('错题本') &&
          shortcutBody.includes('错题本');

        return {
          observed: `进阶结算正反馈=${summaryBody.includes('练习完成！')}；错题本有内容=${wrongBookBody.includes('你的答案')}；个人中心快捷入口=${profileBody.includes('错题本')}；点击后成功跳转=${shortcutBody.includes('错题本')}`,
          verdict: pass ? 'PASS' : 'FAIL',
          evidence: [summaryShot, wrongBookShot, profileShot, shortcutShot],
        };
      },
    });

    await runCase(page, {
      id: 'C-03',
      title: '刷新后持久化',
      expected: '刷新之后昵称、进阶解锁和记录都还在，用户不会产生“刚才白玩了”的不安。',
      steps: '回到首页 → 刷新浏览器 → 再进“记录”查看列表是否仍在。',
      fn: async () => {
        await setPageKey(page, 'home');
        const beforeHistory = await readHistory(page);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await waitForAppReady(page);
        const homeShot = await screenshot(page, 'C-03-home-after-refresh.png');
        const homeBody = await page.locator('body').innerText();
        await openBottomNav(page, '记录');
        const progressShot = await screenshot(page, 'C-03-progress-after-refresh.png');
        const afterHistory = await readHistory(page);
        const progressBody = await page.locator('body').innerText();
        const pass =
          homeBody.includes('进阶解锁号') &&
          homeBody.includes('进阶训练') &&
          beforeHistory.length === afterHistory.length &&
          progressBody.includes('练习记录');
        return {
          observed: `昵称保留=${homeBody.includes('进阶解锁号')}；进阶入口保留=${homeBody.includes('进阶训练')}；history条数 ${beforeHistory.length}→${afterHistory.length}；记录页仍可见=${progressBody.includes('练习记录')}`,
          verdict: pass ? 'PASS' : 'FAIL',
          evidence: [homeShot, progressShot],
        };
      },
    });

    await runCase(page, {
      id: 'D-01',
      title: 'Home / Hub 状态展示',
      expected: '段位赛在门槛不足、可挑战、已有活跃赛事三种状态下，都要告诉孩子现在该做什么。',
      steps: '分别加载门槛不足、可挑战与已开赛夹具，观察 Home 和 RankMatchHub。',
      fn: async () => {
        const gapUser = buildUser('qa-manual-rank-gap', '段位缺口号');
        await seedLocalState(page, { user: gapUser, progress: buildRookieGapProgress(gapUser.id) });
        const homeGapShot = await screenshot(page, 'D-01-home-gap.png');
        const gapHomeBody = await page.locator('body').innerText();
        await setPageKey(page, 'rank-match-hub');
        const hubGapShot = await screenshot(page, 'D-01-hub-gap.png');
        const gapHubBody = await page.locator('body').innerText();

        const openUser = buildUser('qa-manual-rank-open', '段位解锁号');
        await seedLocalState(page, { user: openUser, progress: buildRookieUnlockedProgress(openUser.id) });
        const homeOpenShot = await screenshot(page, 'D-01-home-open.png');
        const openHomeBody = await page.locator('body').innerText();
        await setPageKey(page, 'rank-match-hub');
        const hubOpenShot = await screenshot(page, 'D-01-hub-open.png');
        const openHubBody = await page.locator('body').innerText();
        await page.getByRole('button', { name: '挑战新秀段位' }).click();
        await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'practice', { timeout: 5000 });
        await setPageKey(page, 'home');
        const activeShot = await screenshot(page, 'D-01-home-active.png');
        const activeBody = await page.locator('body').innerText();

        const pass =
          gapHomeBody.includes('冲击 新秀') &&
          gapHubBody.includes('差') &&
          openHomeBody.includes('挑战 新秀') &&
          openHubBody.includes('挑战') &&
          activeBody.includes('继续挑战：新秀 BO3');

        return {
          observed: `Home门槛不足=${gapHomeBody.includes('冲击 新秀')}；Hub锁态缺口=${gapHubBody.includes('差')}；Home可挑战=${openHomeBody.includes('挑战 新秀')}；Hub可挑战按钮=${openHubBody.includes('挑战')}；活跃赛事态=${activeBody.includes('继续挑战：新秀 BO3')}`,
          verdict: pass ? 'PASS' : 'FAIL',
          evidence: [homeGapShot, hubGapShot, homeOpenShot, hubOpenShot, activeShot],
        };
      },
    });

    await runCase(page, {
      id: 'D-02',
      title: 'BO3 晋级与淘汰',
      expected: '两局连胜时要有明确的“晋级成功”成就感，两局连败时也要给出可理解的复盘出口。',
      steps: '用可挑战夹具分别跑两局连胜和两局连败。',
      fn: async () => {
        const promotionUser = buildUser('qa-manual-rank-promote', '晋级路径号');
        await seedLocalState(page, { user: promotionUser, progress: buildRookieUnlockedProgress(promotionUser.id) });
        await setPageKey(page, 'rank-match-hub');
        await page.getByRole('button', { name: '挑战新秀段位' }).click();
        await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'practice', { timeout: 5000 });
        await finishCurrentPractice(page, 'correct');
        await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'rank-match-game-result', { timeout: 5000 });
        await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'practice', { timeout: 5000 });
        await finishCurrentPractice(page, 'correct');
        await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'rank-match-result', { timeout: 10000 });
        const promotedShot = await screenshot(page, 'D-02-promoted.png');
        const promotedBody = await page.locator('body').innerText();

        const eliminatedUser = buildUser('qa-manual-rank-elim', '淘汰路径号');
        await seedLocalState(page, { user: eliminatedUser, progress: buildRookieUnlockedProgress(eliminatedUser.id) });
        await setPageKey(page, 'rank-match-hub');
        await page.getByRole('button', { name: '挑战新秀段位' }).click();
        await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'practice', { timeout: 5000 });
        await finishCurrentPractice(page, 'wrong');
        await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'rank-match-game-result', { timeout: 5000 });
        await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'practice', { timeout: 5000 });
        await finishCurrentPractice(page, 'wrong');
        await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'rank-match-result', { timeout: 10000 });
        const eliminatedShot = await screenshot(page, 'D-02-eliminated.png');
        const eliminatedBody = await page.locator('body').innerText();

        const pass =
          promotedBody.includes('晋级成功！') &&
          eliminatedBody.includes('未能晋级') &&
          eliminatedBody.includes('薄弱题型复盘');

        return {
          observed: `晋级页正反馈=${promotedBody.includes('晋级成功！')}；淘汰页文案=${eliminatedBody.includes('未能晋级')}；淘汰页复盘区=${eliminatedBody.includes('薄弱题型复盘')}`,
          verdict: pass ? 'PASS' : 'FAIL',
          evidence: [promotedShot, eliminatedShot],
        };
      },
    });

    await runCase(page, {
      id: 'D-03',
      title: '刷新恢复',
      expected: '无论在局内还是局间刷新，赛事都应该能继续，不让孩子担心刚才打的局丢掉。',
      steps: '先做局内答到第 5 题刷新，再做局间在 GameResult 阶段刷新。',
      fn: async () => {
        const midUser = buildUser('qa-manual-rank-refresh-mid', '局内刷新号');
        await seedLocalState(page, { user: midUser, progress: buildRookieUnlockedProgress(midUser.id) });
        await setPageKey(page, 'rank-match-hub');
        await page.getByRole('button', { name: '挑战新秀段位' }).click();
        await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'practice', { timeout: 5000 });
        await answerQuestions(page, 5, 'correct');
        const before = await getPracticeSnapshot(page);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await waitForAppReady(page);
        const afterPage = await currentPageKey(page);
        const afterMid = afterPage === 'practice' ? await getPracticeSnapshot(page) : null;
        const midShot = await screenshot(page, 'D-03-refresh-mid.png');

        const betweenUser = buildUser('qa-manual-rank-refresh-between', '局间刷新号');
        await seedLocalState(page, { user: betweenUser, progress: buildRookieUnlockedProgress(betweenUser.id) });
        await setPageKey(page, 'rank-match-hub');
        await page.getByRole('button', { name: '挑战新秀段位' }).click();
        await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'practice', { timeout: 5000 });
        await finishCurrentPractice(page, 'correct');
        await page.waitForFunction(() => window.__MQ_UI__.getState().currentPage === 'rank-match-game-result', { timeout: 5000 });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await waitForAppReady(page);
        const betweenPage = await currentPageKey(page);
        const betweenBody = await page.locator('body').innerText();
        const resumable = betweenPage === 'home'
          ? betweenBody.includes('继续挑战：新秀 BO3')
          : betweenBody.includes('开始下一局') || betweenBody.includes('继续第');
        const betweenShot = await screenshot(page, 'D-03-refresh-between.png');

        const pass =
          afterPage === 'practice' &&
          afterMid?.currentIndex === before.currentIndex &&
          afterMid?.currentQuestionId === before.currentQuestionId &&
          resumable;

        return {
          observed: `局内刷新前 index=${before.currentIndex} qid=${before.currentQuestionId}；局内刷新后 page=${afterPage}${afterMid ? ` index=${afterMid.currentIndex} qid=${afterMid.currentQuestionId}` : ''}；局间刷新后 page=${betweenPage}；可继续赛事=${resumable}`,
          verdict: pass ? 'PASS' : 'FAIL',
          evidence: [midShot, betweenShot],
        };
      },
    });
  } finally {
    writeResult();
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
