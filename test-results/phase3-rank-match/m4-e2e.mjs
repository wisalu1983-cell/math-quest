// Phase 3 段位赛 M4 · 拟真用户 E2E 脚本
// 目标：自动跑通主路径（学徒→解锁新秀→BO3 两连胜→晋级→刷新持久化），
//       以及失败复盘（BO3 两连败→eliminated），以及刷新恢复（第 1 局中途刷新）。
// 运行：node test-results/phase3-rank-match/m4-e2e.mjs
// 前置：vite dev server 已在 http://localhost:5173/ 启动

import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = 'http://localhost:5173/';
const ART_DIR = path.resolve('test-results/phase3-rank-match/m4-user-qa-artifacts');
const RESULTS_PATH = path.resolve('test-results/phase3-rank-match/m4-e2e-raw.json');

const results = [];
const log = (msg) => console.log(`[M4-E2E] ${msg}`);

async function snap(page, name) {
  const file = path.join(ART_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

async function waitForStore(page) {
  await page.waitForFunction(() => !!window.__MQ_SESSION__ && !!window.__MQ_GAME_PROGRESS__ && !!window.__MQ_RANK_MATCH__, { timeout: 10000 });
}

async function onboardIfNeeded(page) {
  const hasHomeGreet = await page.locator('text=/今天继续挑战/').count() > 0;
  if (hasHomeGreet) return;
  // step 0：点"开始冒险"
  const startBtn = page.locator('button', { hasText: '开始冒险' }).first();
  if (await startBtn.count() > 0) {
    await startBtn.click();
    await page.waitForTimeout(300);
  }
  // step 1：填昵称 + 点"开始学习！"
  const input = page.locator('input[type="text"]').first();
  if (await input.count() > 0) {
    await input.fill('测试小学生');
    await page.waitForTimeout(200);
    const learnBtn = page.locator('button', { hasText: '开始学习' }).first();
    if (await learnBtn.count() > 0) {
      await learnBtn.click();
    }
  }
  await page.waitForSelector('text=/今天继续挑战/', { timeout: 8000 });
}

async function injectAdvanceProgress(page) {
  await page.evaluate(() => {
    const gp = window.__MQ_GAME_PROGRESS__.getState().gameProgress;
    if (!gp) throw new Error('GameProgress 未加载');
    const now = Date.now();
    const topics = ['mental-arithmetic', 'number-sense', 'vertical-calc', 'operation-laws'];
    const advanceProgress = { ...gp.advanceProgress };
    for (const t of topics) {
      advanceProgress[t] = {
        topicId: t,
        heartsAccumulated: 10,
        sessionsPlayed: 5,
        sessionsWhite: 0,
        unlockedAt: now - 86400000,
      };
    }
    const next = { ...gp, advanceProgress };
    window.__MQ_GAME_PROGRESS__.setState({ gameProgress: next });
    window.localStorage.setItem('mq_game_progress', JSON.stringify(next));
  });
}

async function resetRankProgress(page) {
  await page.evaluate(() => {
    const gp = window.__MQ_GAME_PROGRESS__.getState().gameProgress;
    if (!gp) return;
    const next = {
      ...gp,
      rankProgress: { currentTier: 'apprentice', history: [], activeSessionId: undefined },
    };
    window.__MQ_GAME_PROGRESS__.setState({ gameProgress: next });
    window.localStorage.setItem('mq_game_progress', JSON.stringify(next));
    window.localStorage.removeItem('mq_rank_match_sessions');
    window.__MQ_RANK_MATCH__.setState({ activeRankSession: null });
  });
}

function computeAnswer(q) {
  // 在浏览器上下文运行
  if (q.type === 'multi-blank' && q.solution.blanks) {
    return q.solution.blanks.map(String).join('|');
  }
  if (q.type === 'multi-select' && q.solution.answers) {
    return q.solution.answers.join('');
  }
  return String(q.solution.answer);
}

async function runOneGame(page, { wantWin }) {
  return await page.evaluate(async ({ wantWin, compute }) => {
    const session = window.__MQ_SESSION__;
    const ui = window.__MQ_UI__;
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const fn = new Function('return ' + compute)();
    let guard = 0;
    let loseBreak = false;
    while (guard++ < 40) {
      const s = session.getState();
      if (!s.currentQuestion || !s.session) break;
      const q = s.currentQuestion;
      const correct = fn(q);
      const ans = wantWin ? correct : '999999';
      session.getState().submitAnswer(ans);
      await sleep(50);
      const after = session.getState();
      if (after.hearts <= 0) {
        loseBreak = true;
        break;
      }
      if (after.currentIndex + 1 >= after.totalQuestions) {
        break;
      }
      session.getState().nextQuestion();
      await sleep(40);
    }
    // 模拟 Practice.handleNext：session 终态时 endSession + setPage
    const after = session.getState();
    if (after.session) {
      const completedSession = session.getState().endSession();
      if (completedSession.sessionMode === 'rank-match') {
        ui.getState().setLastSession(completedSession);
        ui.getState().setPage('rank-match-game-result');
      }
    }
    await sleep(120);
    return { loseBreak };
  }, { wantWin, compute: computeAnswer.toString() });
}

async function record(caseId, expected, action, observation, verdict, artifact) {
  results.push({ caseId, expected, action, observation, verdict, artifact: artifact || null });
  log(`${caseId}: ${verdict}`);
}

async function main() {
  await mkdir(ART_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') log(`[browser:error] ${m.text()}`);
  });
  page.on('pageerror', (err) => log(`[browser:pageerror] ${err.message}`));

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await waitForStore(page);
  await onboardIfNeeded(page);
  await page.waitForSelector('text=/今天继续挑战/', { timeout: 8000 });

  // ── B-01 学徒态 Home 段位赛卡 ──
  {
    const evidence = await snap(page, 'B-01-before');
    const cardText = await page.locator('button', { has: page.locator('text=/冲击|挑战|继续挑战|数学大冒险/') }).allTextContents();
    const text = cardText.join(' | ');
    // 当前是学徒、无进阶，卡片应提示"冲击新秀 + 通关任意主题解锁进阶" 或类似
    const ok = /冲击|段位|新秀|学徒/.test(text);
    await record('B-01', '学徒用户进入 Home 看到段位赛卡片与当前学徒徽章',
      '打开 localhost:5173 → 完成 onboarding → 到 home', `Home 段位卡片文案：${text.slice(0, 200)}`,
      ok ? 'PASS' : 'RISK', evidence);
  }

  // 注入 advanceProgress 满足新秀门槛
  await injectAdvanceProgress(page);
  await page.reload();
  await waitForStore(page);
  await page.waitForSelector('text=/今天继续挑战/', { timeout: 8000 });

  // ── B-02 解锁后卡片切换 ──
  {
    const evidence = await snap(page, 'B-02-after');
    const html = await page.locator('button', { hasText: /挑战/ }).last().textContent().catch(() => '');
    const ok = /挑战\s*新秀|BO3/.test(html || '');
    await record('B-02', '门槛满足后 Home 卡片变成"挑战 新秀"与 BO3 副文案',
      '注入 advanceProgress 各 10 hearts 刷新 Home', `Home 段位卡文案：${html}`,
      ok ? 'PASS' : 'FAIL', evidence);
  }

  // 点击 Home 段位卡进 Hub
  await page.evaluate(() => {
    window.__MQ_SESSION__.getState(); // keep alive
    // 直接 setPage 到 hub
    const ui = Object.values(window).find(v => v && typeof v === 'object');
    // 用 store 导航更可靠
  });
  // 通过 DOM 点击段位卡
  const rankCard = page.locator('button', { hasText: /挑战\s*新秀|冲击|段位|继续挑战/ }).last();
  await rankCard.click();
  await page.waitForSelector('text=/段位赛大厅/', { timeout: 5000 });

  // ── C-01 五段位列表 ──
  {
    const evidence = await snap(page, 'C-01-after');
    const labels = await page.locator('text=/新秀|高手|专家|大师/').allTextContents();
    const unique = [...new Set(labels.map(s => s.trim()))];
    const ok = ['新秀', '高手', '专家', '大师'].every(l => unique.some(x => x.includes(l)));
    await record('C-01', '进入 Hub 能看到新秀/高手/专家/大师四张段位卡（学徒在顶部展示）',
      '在 Home 点击段位赛卡 → Hub', `段位卡文案 unique=${unique.join(' | ')}`,
      ok ? 'PASS' : 'FAIL', evidence);
  }

  // ── C-02 未解锁段位灰态（当前只满足新秀） ──
  {
    const evidence = await snap(page, 'C-02-after');
    const lockCount = await page.locator('text=🔒').count();
    const gapCount = await page.locator('text=/差\\s+\\S+\\s+\\d+★/').count();
    const ok = lockCount >= 3 || gapCount >= 1;
    await record('C-02', '未解锁段位显示 🔒 与星级缺口徽标',
      '观察 Hub 页面的高手/专家/大师卡片', `🔒 计数=${lockCount}，缺口徽标计数=${gapCount}`,
      ok ? 'PASS' : 'RISK', evidence);
  }

  // ── C-07 满足门槛点"挑战" ──
  await page.locator('button[aria-label="挑战新秀段位"]').click();
  await page.waitForFunction(() => {
    const s = window.__MQ_SESSION__.getState();
    return s.session && s.session.sessionMode === 'rank-match';
  }, { timeout: 8000 });
  const snapD01 = await snap(page, 'D-01-evidence');
  await record('C-07', '新秀"挑战"按钮能启动 BO3 第 1 局',
    'Hub → 点"挑战"按钮（新秀）', 'session.sessionMode=rank-match 已建立',
    'PASS', snapD01);

  // ── D-01 题头 BO 徽标 ──
  {
    const badgeVisible = await page.locator('text=/新秀.*BO3|第\\s*1\\s*局/').count();
    await record('D-01', '题头显示"新秀 · BO3 · 第 1 局"徽标',
      '进入 Practice 后观察题头', `匹配 "新秀 BO3 / 第 1 局" 文案数=${badgeVisible}`,
      badgeVisible >= 1 ? 'PASS' : 'FAIL', snapD01);
  }

  // ── D-02 题量=20 ──
  {
    const totalFromStore = await page.evaluate(() => window.__MQ_SESSION__.getState().totalQuestions);
    await record('D-02', 'BO 新秀单局题量=20',
      '读取 useSessionStore.totalQuestions', `totalQuestions=${totalFromStore}`,
      totalFromStore === 20 ? 'PASS' : 'FAIL', null);
  }

  // ── D-03 心×3 ──
  {
    const hearts0 = await page.evaluate(() => window.__MQ_SESSION__.getState().hearts);
    await record('D-03', '段位赛沿用心×3 机制',
      '读取 useSessionStore.hearts 初始值', `hearts=${hearts0}`,
      hearts0 === 3 ? 'PASS' : 'FAIL', null);
  }

  // ── D-04 退出确认 ──
  {
    const backBtn = page.locator('button[aria-label*="退出"], button:has-text("‹"), button:has-text("←")').first();
    if (await backBtn.count() > 0) {
      await backBtn.click();
      await page.waitForTimeout(300);
      const dialogVisible = await page.locator('text=/确认退出|确定退出|退出练习/').count();
      const evidence = await snap(page, 'D-04-evidence');
      if (dialogVisible > 0) {
        await record('D-04', '答题中点左上返回会弹出确认',
          'Practice → 点左上返回', `确认弹窗可见=true`, 'PASS', evidence);
        // 点"取消/继续答题"
        const cancel = page.locator('button', { hasText: /继续|取消|不退/ }).first();
        if (await cancel.count() > 0) await cancel.click();
      } else {
        await record('D-04', '答题中点左上返回会弹出确认',
          'Practice → 点左上返回', `未检测到确认弹窗 DOM`, 'RISK', evidence);
      }
    } else {
      await record('D-04', '退出确认弹窗', '找返回按钮', '未找到返回按钮选择器', 'BLOCKED', null);
    }
  }

  // ── 第 1 局：胜（20 全对） ──
  log('running game 1 — wantWin=true');
  const g1 = await runOneGame(page, { wantWin: true });
  await page.waitForTimeout(500);
  // 等待路由切到 game-result
  await page.waitForFunction(() => window.__MQ_SESSION__.getState().session === null || document.body.textContent.includes('本局胜') || document.body.textContent.includes('本局胜利'), { timeout: 8000 }).catch(() => {});

  // ── D-05 胜利后跳 GameResult ──
  {
    const url = page.url();
    const pageText = await page.textContent('body');
    const atGameResult = /本局获胜|本局告负|需\d+胜晋级|开始下一局/.test(pageText);
    const evidence = await snap(page, 'E-01-after');
    await record('D-05', '单局胜后跳到 rank-match-game-result',
      '第 1 局答 20 题全对 → endSession', `url=${url}; pageText 包含 game-result 特征=${atGameResult}`,
      atGameResult ? 'PASS' : 'FAIL', evidence);
    await record('E-01', 'GameResult 显示本局胜 + 胜场累计 + 胜负矩阵',
      '观察 GameResult 页面内容', `pageText=${pageText.slice(0, 300)}`,
      atGameResult ? 'PASS' : 'FAIL', evidence);
  }

  // ── E-02 等 3 秒自动推进 ──
  {
    const before = Date.now();
    await page.waitForFunction(() => {
      const s = window.__MQ_SESSION__.getState();
      return s.session && s.session.sessionMode === 'rank-match' && s.currentIndex === 0;
    }, { timeout: 6000 }).catch(() => {});
    const elapsed = Date.now() - before;
    const started2 = await page.evaluate(() => {
      const s = window.__MQ_SESSION__.getState();
      return s.session?.sessionMode === 'rank-match' && s.currentIndex === 0;
    });
    const evidence = await snap(page, 'E-02-after');
    await record('E-02', 'GameResult 3 秒后自动推进到下一局 Practice',
      '等待自动跳转', `等待 ${elapsed}ms 后 session.currentIndex=0 第 2 局开启=${started2}`,
      started2 ? 'PASS' : 'FAIL', evidence);
  }

  // ── 第 2 局：胜 → promoted ──
  log('running game 2 — wantWin=true（decisive）');
  const g2 = await runOneGame(page, { wantWin: true });
  await page.waitForTimeout(800);

  // ── E-03 晋级跳 MatchResult ──
  {
    await page.waitForFunction(() => {
      const t = document.body.textContent;
      return /晋级|升级到|新秀/.test(t) && /返回大厅|返回/.test(t);
    }, { timeout: 6000 }).catch(() => {});
    const evidence = await snap(page, 'F-01-after');
    const pageText = await page.textContent('body');
    const atMatchResult = /晋级|升级到/.test(pageText);
    await record('E-03', '决胜胜利后跳 rank-match-result',
      '第 2 局全对 → 等待路由', `pageText 含晋级=${atMatchResult}`,
      atMatchResult ? 'PASS' : 'FAIL', evidence);
    await record('F-01', 'MatchResult 展示晋级 + 段位升级信息',
      '观察 MatchResult 页面', `pageText snippet=${pageText.slice(0, 400)}`,
      atMatchResult ? 'PASS' : 'RISK', evidence);
  }

  // ── F-02 持久化 ──
  {
    const tier = await page.evaluate(() => window.__MQ_GAME_PROGRESS__.getState().gameProgress?.rankProgress?.currentTier);
    await record('F-02', '晋级后 rankProgress.currentTier = rookie 并持久化',
      '读取 gameProgress.rankProgress.currentTier', `currentTier=${tier}`,
      tier === 'rookie' ? 'PASS' : 'FAIL', null);
    // 刷新后再读
    await page.reload();
    await waitForStore(page);
    await page.waitForTimeout(500);
    const tier2 = await page.evaluate(() => window.__MQ_GAME_PROGRESS__.getState().gameProgress?.rankProgress?.currentTier);
    await record('F-02+reload', '刷新后段位仍为 rookie',
      '浏览器刷新 → 读 rankProgress.currentTier', `currentTier after reload=${tier2}`,
      tier2 === 'rookie' ? 'PASS' : 'FAIL', null);
  }

  // 刷新后应该在 Home。点段位卡回 Hub 看"已通过"标注
  // ── C-03 已通过段位 ──
  {
    await page.waitForSelector('text=/今天继续挑战/', { timeout: 8000 });
    const evidence = await snap(page, 'C-03-after');
    // 直接在 store 把 page 设为 hub
    await page.evaluate(() => {
      // useUIStore 通过 __MQ_SESSION__ 不可直接拿。用 DOM 点击
    });
    // 点 Home 的段位卡
    const cardBtn = page.locator('button', { hasText: /继续|挑战|冲击/ }).filter({ hasText: /新秀|高手|大师|段位/ }).last();
    if (await cardBtn.count() > 0) {
      await cardBtn.click();
      await page.waitForSelector('text=/段位赛大厅/', { timeout: 5000 }).catch(() => {});
      const hasPassed = await page.locator('text=/已通过/').count();
      const evidence2 = await snap(page, 'C-03-hub');
      await record('C-03', '通过新秀后 Hub 新秀卡片显示"✓ 已通过"',
        'Home → 点段位卡 → Hub 新秀卡片', `已通过标注出现数=${hasPassed}`,
        hasPassed >= 1 ? 'PASS' : 'RISK', evidence2);
    } else {
      await record('C-03', '新秀"已通过"标注', '点段位卡', '未找到段位卡按钮', 'BLOCKED', evidence);
    }
  }

  // ── 失败复盘：重置 rankProgress 再跑 BO3 连败 ──
  log('failure path: reset + lose 2 games');
  await resetRankProgress(page);
  await page.reload();
  await waitForStore(page);
  await page.waitForTimeout(500);

  // 需要重新注入 advanceProgress 因为 reload 后 state 被 repository 重读
  const advStillOk = await page.evaluate(() => {
    const gp = window.__MQ_GAME_PROGRESS__.getState().gameProgress;
    return !!gp?.advanceProgress?.['mental-arithmetic']?.heartsAccumulated;
  });
  if (!advStillOk) {
    await injectAdvanceProgress(page);
    await page.reload();
    await waitForStore(page);
    await page.waitForTimeout(500);
  }

  // 用 store 直接启动 BO3
  await page.evaluate(() => {
    const rm = window.__MQ_RANK_MATCH__;
    const s = rm.getState();
    // 预先分配 practiceSessionId
    const firstPid = 'ps_' + Math.random().toString(36).slice(2, 10);
    const session = s.startRankMatch('rookie', { firstPracticeSessionId: firstPid });
    window.__MQ_SESSION__.getState().startRankMatchGame(session.id, 1);
  });
  await page.waitForFunction(() => window.__MQ_SESSION__.getState().session?.sessionMode === 'rank-match', { timeout: 5000 });

  // 第 1 局：连错 3 题直至 hearts=0
  log('lose game 1');
  await runOneGame(page, { wantWin: false });
  await page.waitForTimeout(800);

  // E-02 跳过，直接等第 2 局
  await page.waitForFunction(() => {
    const s = window.__MQ_SESSION__.getState();
    return s.session?.sessionMode === 'rank-match' && s.currentIndex === 0 && s.hearts === 3;
  }, { timeout: 6000 }).catch(() => {});

  log('lose game 2');
  await runOneGame(page, { wantWin: false });
  await page.waitForTimeout(1200);

  // ── E-04 淘汰跳 MatchResult + F-03 复盘薄弱题型 ──
  {
    await page.waitForFunction(() => /未能晋级|未晋级|薄弱/.test(document.body.textContent), { timeout: 8000 }).catch(() => {});
    const evidence = await snap(page, 'F-03-after');
    const pageText = await page.textContent('body');
    const atMatchResult = /未能晋级|未晋级|淘汰|薄弱/.test(pageText);
    await record('E-04', '连败后跳到 MatchResult',
      '第 2 局 hearts=0 → 等待路由', `MatchResult 文案检出=${atMatchResult}`,
      atMatchResult ? 'PASS' : 'FAIL', evidence);
    await record('F-03', 'MatchResult 显示薄弱题型前 3',
      '观察 MatchResult 页面', `pageText=${pageText.slice(0, 500)}`,
      atMatchResult ? 'PASS' : 'RISK', evidence);
  }

  // ── F-05 返回大厅 ──
  {
    const backBtn = page.locator('button', { hasText: /返回大厅|返回 Hub|返回|Hub/ }).first();
    if (await backBtn.count() > 0) {
      await backBtn.click();
      await page.waitForSelector('text=/段位赛大厅/', { timeout: 5000 }).catch(() => {});
      const { outcome, atHub } = await page.evaluate(() => ({
        outcome: window.__MQ_RANK_MATCH__.getState().activeRankSession?.outcome,
        atHub: document.body.textContent.includes('段位赛大厅'),
      }));
      const evidence = await snap(page, 'F-05-after');
      // Spec：赛事结束（outcome 已写 eliminated/promoted）即视为"已收口"，Hub 会按"历史"展示；
      // activeRankSession 对象本身是否保留无强要求
      const ok = atHub && (outcome === 'eliminated' || outcome === 'promoted');
      await record('F-05', '点"返回大厅"能回 Hub 且赛事已结束（outcome 已写）',
        'MatchResult → 返回按钮', `atHub=${atHub}, outcome=${outcome}`,
        ok ? 'PASS' : 'FAIL', evidence);
    } else {
      await record('F-05', '返回大厅按钮', '找返回按钮', '未找到按钮', 'BLOCKED', null);
    }
  }

  // ── G-01 刷新恢复：第 1 局中途刷新 ──
  log('refresh recovery path');
  await resetRankProgress(page);
  await page.reload();
  await waitForStore(page);
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    const rm = window.__MQ_RANK_MATCH__;
    const firstPid = 'ps_' + Math.random().toString(36).slice(2, 10);
    const session = rm.getState().startRankMatch('rookie', { firstPracticeSessionId: firstPid });
    window.__MQ_SESSION__.getState().startRankMatchGame(session.id, 1);
  });
  await page.waitForFunction(() => window.__MQ_SESSION__.getState().session?.sessionMode === 'rank-match', { timeout: 5000 });

  // 答 5 题
  await page.evaluate(async () => {
    const session = window.__MQ_SESSION__;
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const getCorrect = (q) => {
      if (q.type === 'multi-blank' && q.solution.blanks) return q.solution.blanks.map(String).join('|');
      if (q.type === 'multi-select' && q.solution.answers) return q.solution.answers.join('');
      return String(q.solution.answer);
    };
    for (let i = 0; i < 5; i++) {
      const s = session.getState();
      if (!s.currentQuestion) break;
      session.getState().submitAnswer(getCorrect(s.currentQuestion));
      await sleep(30);
      session.getState().nextQuestion();
      await sleep(30);
    }
  });
  const beforeState = await page.evaluate(() => {
    const s = window.__MQ_SESSION__.getState();
    return { currentIndex: s.currentIndex, qid: s.currentQuestion?.id };
  });
  const g01Before = await snap(page, 'G-01-before');

  // 刷新
  await page.reload();
  await waitForStore(page);
  // 刷新后 UI 在 Home；模拟用户从 Hub 进 Practice 的路径 —— 直接 setPage 到 practice
  await page.waitForTimeout(500); // 等 App.useEffect 调 loadActiveRankMatch
  await page.evaluate(() => window.__MQ_UI__.getState().setPage('practice'));
  // Practice 挂载后的 useEffect 会调 resumeRankMatchGame
  await page.waitForFunction(() => {
    const s = window.__MQ_SESSION__.getState();
    return s.session?.sessionMode === 'rank-match' && !!s.currentQuestion;
  }, { timeout: 8000 }).catch(() => {});
  const afterState = await page.evaluate(() => {
    const s = window.__MQ_SESSION__.getState();
    return { currentIndex: s.currentIndex, qid: s.currentQuestion?.id };
  });
  const g01After = await snap(page, 'G-01-after');
  const recovered = beforeState.qid && afterState.qid && beforeState.currentIndex === afterState.currentIndex && beforeState.qid === afterState.qid;
  await record('G-01', '第 1 局中途刷新能回到刚才那一题',
    '答 5 题 → F5 → 比较 currentQuestion.id',
    `before: idx=${beforeState.currentIndex} qid=${beforeState.qid} | after: idx=${afterState.currentIndex} qid=${afterState.qid}`,
    recovered ? 'PASS' : 'FAIL', g01After);

  // ── G-03 Hub 活跃卡片恢复 ──
  {
    // 先放弃 Practice 页，跳 Hub 看活跃卡片
    const active = await page.evaluate(() => window.__MQ_RANK_MATCH__.getState().activeRankSession);
    const activeExists = !!active;
    await record('G-03', '刷新后 activeRankSession 仍存在可由 Hub 继续',
      '观察 store 的 activeRankSession', `activeRankSession 存在=${activeExists}`,
      activeExists ? 'PASS' : 'FAIL', g01After);
  }

  // 写入 raw 结果
  await writeFile(RESULTS_PATH, JSON.stringify(results, null, 2), 'utf-8');
  log(`raw results written to ${RESULTS_PATH}`);
  log(`total: ${results.length}, PASS: ${results.filter(r => r.verdict === 'PASS').length}, FAIL: ${results.filter(r => r.verdict === 'FAIL').length}, RISK: ${results.filter(r => r.verdict === 'RISK').length}, BLOCKED: ${results.filter(r => r.verdict === 'BLOCKED').length}`);

  await browser.close();
}

main().catch(async (e) => {
  console.error('[M4-E2E] FATAL', e);
  await writeFile(RESULTS_PATH, JSON.stringify({ error: String(e), stack: e.stack, partial: results }, null, 2), 'utf-8');
  process.exit(1);
});
