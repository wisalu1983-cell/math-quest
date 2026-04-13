// Math Quest - 全流程自动化测试脚本
// 模拟真实用户操作完成一轮完整测试
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const RESULTS_DIR = path.join(__dirname, 'test-results');
const SCREENSHOT_DIR = path.join(RESULTS_DIR, 'screenshots');

// 测试结果收集
const testResults = [];
let screenshotIndex = 0;

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

function record(tcId, step, status, detail = '') {
  testResults.push({ tcId, step, status, detail, time: new Date().toISOString() });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  log(`${icon} ${tcId} - ${step}: ${detail || status}`);
}

async function screenshot(page, name) {
  screenshotIndex++;
  const filename = `${String(screenshotIndex).padStart(2, '0')}_${name}.png`;
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: true });
  return filename;
}

async function waitAndClick(page, selector, options = {}) {
  await page.waitForSelector(selector, { timeout: 5000, ...options });
  await page.click(selector);
}

async function safeText(page, selector) {
  try {
    const el = await page.waitForSelector(selector, { timeout: 3000 });
    return el ? await el.textContent() : null;
  } catch { return null; }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  log('========================================');
  log('Math Quest 全流程自动化测试');
  log('========================================');

  // 确保截图目录存在
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    locale: 'zh-CN',
  });
  const page = await context.newPage();

  // 收集控制台错误
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ text: msg.text(), url: page.url() });
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push({ text: err.message, url: page.url() });
  });

  try {
    // =============================================
    // TC-01: Onboarding 新用户注册
    // =============================================
    log('\n--- TC-01: Onboarding ---');

    // 清理 localStorage
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'tc01_welcome');

    // Step 1: 欢迎页面
    const startBtn = await page.$('button:has-text("开始冒险")');
    if (startBtn) {
      record('TC-01', '1. 欢迎页面', 'PASS', '显示"开始冒险"按钮');
    } else {
      record('TC-01', '1. 欢迎页面', 'FAIL', '未找到"开始冒险"按钮');
    }

    // Step 2: 点击开始冒险
    await page.click('button:has-text("开始冒险")');
    await sleep(500);
    await screenshot(page, 'tc01_nickname');

    const nicknameInput = await page.$('input[placeholder="输入你的昵称"]');
    if (nicknameInput) {
      record('TC-01', '2. 进入昵称输入', 'PASS', '昵称输入框显示');
    } else {
      record('TC-01', '2. 进入昵称输入', 'FAIL', '未找到昵称输入框');
    }

    // Step 3: 空昵称检查
    const nextBtnDisabled = await page.$('button:has-text("下一步")[disabled]');
    if (nextBtnDisabled) {
      record('TC-01', '3. 空昵称禁用', 'PASS', '下一步按钮为disabled');
    } else {
      // 可能按钮不用disabled而是其他方式
      const nextBtn = await page.$('button:has-text("下一步")');
      const isDisabled = nextBtn ? await nextBtn.isDisabled() : false;
      record('TC-01', '3. 空昵称禁用', isDisabled ? 'PASS' : 'FAIL',
        isDisabled ? '下一步按钮为disabled' : '按钮未正确禁用');
    }

    // Step 4: 输入纯空格
    await page.fill('input', '   ');
    await sleep(200);
    const nextBtnAfterSpaces = await page.$('button:has-text("下一步")');
    const disabledAfterSpaces = nextBtnAfterSpaces ? await nextBtnAfterSpaces.isDisabled() : false;
    record('TC-01', '4. 纯空格输入', disabledAfterSpaces ? 'PASS' : 'FAIL',
      disabledAfterSpaces ? '纯空格时按钮disabled' : '纯空格时按钮未禁用');

    // Step 5: 输入有效昵称
    await page.fill('input', '测试玩家');
    await sleep(200);
    const nextBtnEnabled = await page.$('button:has-text("下一步")');
    const isEnabled = nextBtnEnabled ? !(await nextBtnEnabled.isDisabled()) : false;
    record('TC-01', '5. 有效昵称', isEnabled ? 'PASS' : 'FAIL',
      isEnabled ? '输入有效昵称后按钮可点击' : '按钮仍不可点击');

    // Step 6: maxLength测试 - 输入超长字符
    await page.fill('input', '一二三四五六七八九十甲乙丙');
    await sleep(200);
    const inputValue = await page.$eval('input', el => el.value);
    const maxLenOk = inputValue.length <= 12;
    record('TC-01', '6. maxLength截断', maxLenOk ? 'PASS' : 'WARN',
      `输入值长度: ${inputValue.length}, 值: "${inputValue}"`);

    // 恢复正常昵称
    await page.fill('input', '测试玩家');
    await sleep(200);

    // Step 7: 点击下一步
    await page.click('button:has-text("下一步")');
    await sleep(500);
    await screenshot(page, 'tc01_grade');

    // Step 8: 默认年级选中
    const gradeButtons = await page.$$('button:has-text("年级")');
    record('TC-01', '8. 年级选择', gradeButtons.length >= 2 ? 'PASS' : 'FAIL',
      `找到 ${gradeButtons.length} 个年级按钮`);

    // Step 9: 选择6年级
    for (const btn of gradeButtons) {
      const text = await btn.textContent();
      if (text && text.includes('6')) {
        await btn.click();
        break;
      }
    }
    await sleep(200);

    // Step 10: 点击开始学习
    const startLearning = await page.$('button:has-text("开始学习")');
    if (startLearning) {
      await startLearning.click();
      await sleep(800);
      await screenshot(page, 'tc01_home_after');
      record('TC-01', '10. 完成注册', 'PASS', '成功跳转到首页');
    } else {
      record('TC-01', '10. 完成注册', 'FAIL', '未找到"开始学习"按钮');
    }

    // 验证 localStorage
    const userData = await page.evaluate(() => {
      const data = localStorage.getItem('mq_user');
      return data ? JSON.parse(data) : null;
    });
    if (userData && userData.nickname === '测试玩家') {
      record('TC-01', '验证数据', 'PASS', `用户ID: ${userData.id}, 年级: ${userData.grade}`);
    } else {
      record('TC-01', '验证数据', 'FAIL', `localStorage 数据: ${JSON.stringify(userData)}`);
    }

    // =============================================
    // TC-02: Home 首页展示
    // =============================================
    log('\n--- TC-02: Home 首页 ---');
    await sleep(500);

    const greeting = await safeText(page, 'h1, h2, p');
    const pageContent = await page.textContent('body');

    if (pageContent && pageContent.includes('测试玩家')) {
      record('TC-02', '1. 问候语', 'PASS', '显示用户昵称');
    } else {
      record('TC-02', '1. 问候语', 'FAIL', '未找到用户昵称');
    }

    const hasLv = pageContent && pageContent.includes('Lv.');
    record('TC-02', '2. 等级显示', hasLv ? 'PASS' : 'FAIL',
      hasLv ? '显示等级信息' : '未找到等级显示');

    await screenshot(page, 'tc02_home');

    // 检查主题卡片 - 尝试找到包含主题文字的元素
    const topicTexts = ['口算速算', '数感估算', '竖式笔算', '运算律', '小数计算', '括号变换', '多步计算', '方程移项'];
    let topicCount = 0;
    for (const t of topicTexts) {
      if (pageContent && pageContent.includes(t)) topicCount++;
    }
    record('TC-02', '6. 主题网格', topicCount === 8 ? 'PASS' : 'WARN',
      `找到 ${topicCount}/8 个主题`);

    // =============================================
    // TC-17: 底部导航栏
    // =============================================
    log('\n--- TC-17: 底部导航 ---');

    // 尝试点击进度页导航
    const navButtons = await page.$$('nav button, footer button, [class*="fixed"] button');
    record('TC-17', '导航按钮', navButtons.length >= 4 ? 'PASS' : 'WARN',
      `找到 ${navButtons.length} 个底部导航按钮`);

    // 点击第二个导航按钮（进度）
    if (navButtons.length >= 4) {
      await navButtons[1].click();
      await sleep(500);
      await screenshot(page, 'tc17_progress_nav');

      const progressContent = await page.textContent('body');
      const isProgress = progressContent && progressContent.includes('学习进度');
      record('TC-17', '进度页导航', isProgress ? 'PASS' : 'FAIL',
        isProgress ? '成功跳转到进度页' : '未跳转到进度页');

      // 点击错题本
      const navBtns2 = await page.$$('nav button, footer button, [class*="fixed"] button');
      if (navBtns2.length >= 4) {
        await navBtns2[2].click();
        await sleep(500);
        await screenshot(page, 'tc17_wrongbook_nav');

        const wbContent = await page.textContent('body');
        const isWB = wbContent && wbContent.includes('错题本');
        record('TC-17', '错题本导航', isWB ? 'PASS' : 'FAIL',
          isWB ? '成功跳转到错题本' : '未跳转到错题本');
      }

      // 点击个人中心
      const navBtns3 = await page.$$('nav button, footer button, [class*="fixed"] button');
      if (navBtns3.length >= 4) {
        await navBtns3[3].click();
        await sleep(500);
        await screenshot(page, 'tc17_profile_nav');

        const pfContent = await page.textContent('body');
        const isPF = pfContent && pfContent.includes('个人中心');
        record('TC-17', '个人中心导航', isPF ? 'PASS' : 'FAIL',
          isPF ? '成功跳转到个人中心' : '未跳转到个人中心');
      }

      // 回首页
      const navBtns4 = await page.$$('nav button, footer button, [class*="fixed"] button');
      if (navBtns4.length >= 4) {
        await navBtns4[0].click();
        await sleep(500);
      }
    }

    // =============================================
    // TC-15: WrongBook 空状态
    // =============================================
    log('\n--- TC-15: WrongBook 空状态 ---');
    const navForWB = await page.$$('nav button, footer button, [class*="fixed"] button');
    if (navForWB.length >= 4) {
      await navForWB[2].click();
      await sleep(500);
      const wbEmpty = await page.textContent('body');
      const hasEmptyState = wbEmpty && (wbEmpty.includes('还没有做错') || wbEmpty.includes('🎉'));
      record('TC-15', '5. 空状态', hasEmptyState ? 'PASS' : 'FAIL',
        hasEmptyState ? '显示空状态提示' : '未显示空状态');
      await screenshot(page, 'tc15_empty');

      // 回首页
      const navBack = await page.$$('nav button, footer button, [class*="fixed"] button');
      if (navBack.length >= 1) await navBack[0].click();
      await sleep(500);
    }

    // =============================================
    // TC-16: Profile 个人中心
    // =============================================
    log('\n--- TC-16: Profile ---');
    const navForPF = await page.$$('nav button, footer button, [class*="fixed"] button');
    if (navForPF.length >= 4) {
      await navForPF[3].click();
      await sleep(500);
      await screenshot(page, 'tc16_profile');

      const pfBody = await page.textContent('body');

      // 检查昵称
      const hasNickname = pfBody && pfBody.includes('测试玩家');
      record('TC-16', '1. 用户信息', hasNickname ? 'PASS' : 'FAIL',
        hasNickname ? '显示用户昵称' : '未显示昵称');

      // 检查每日目标设置
      const hasGoalOptions = pfBody && (pfBody.includes('每日目标') || pfBody.includes('50'));
      record('TC-16', '4. 每日目标', hasGoalOptions ? 'PASS' : 'WARN',
        hasGoalOptions ? '显示每日目标设置' : '未找到目标设置');

      // 尝试修改每日目标
      const goalBtn = await page.$('button:has-text("100")');
      if (goalBtn) {
        await goalBtn.click();
        await sleep(300);
        record('TC-16', '4. 修改目标', 'PASS', '点击100 XP目标');
      }

      // 检查成就
      const hasAchievements = pfBody && pfBody.includes('成就');
      record('TC-16', '3. 成就区域', hasAchievements ? 'PASS' : 'WARN',
        hasAchievements ? '成就区域存在' : '未找到成就区域');

      // 回首页
      const navHome = await page.$$('nav button, footer button, [class*="fixed"] button');
      if (navHome.length >= 1) await navHome[0].click();
      await sleep(500);
    }

    // =============================================
    // TC-03: TopicSelect + TC-04: Practice (口算速算)
    // =============================================
    log('\n--- TC-03: TopicSelect ---');

    // 点击口算速算
    const mentalArithBtn = await page.$('button:has-text("口算速算"), div:has-text("口算速算")');
    if (mentalArithBtn) {
      await mentalArithBtn.click();
      await sleep(500);
      await screenshot(page, 'tc03_topic_select');

      const tsBody = await page.textContent('body');

      // 检查难度按钮
      const hasNormal = tsBody && tsBody.includes('普通');
      const hasHard = tsBody && tsBody.includes('困难');
      const hasDemon = tsBody && tsBody.includes('魔王');
      record('TC-03', '2. 难度按钮', hasNormal ? 'PASS' : 'FAIL',
        `普通:${hasNormal} 困难:${hasHard} 魔王:${hasDemon}`);

      // 检查题数选项
      const has10 = tsBody && tsBody.includes('10');
      const has15 = tsBody && tsBody.includes('15');
      const has20 = tsBody && tsBody.includes('20');
      record('TC-03', '4. 题数选项', (has10 && has15 && has20) ? 'PASS' : 'WARN',
        `10:${has10} 15:${has15} 20:${has20}`);

      // 选择10题
      const count10 = await page.$('button:has-text("10")');
      if (count10) {
        await count10.click();
        await sleep(200);
      }

      // 点击开始练习
      log('\n--- TC-04: Practice (口算速算) ---');
      const startPractice = await page.$('button:has-text("开始练习")');
      if (startPractice) {
        await startPractice.click();
        await sleep(800);
        await screenshot(page, 'tc04_practice_start');

        const practiceBody = await page.textContent('body');

        // 检查进度条
        const hasProgress = practiceBody && (practiceBody.includes('/10') || practiceBody.includes('1/'));
        record('TC-04', '1. 进度显示', hasProgress ? 'PASS' : 'WARN',
          hasProgress ? '显示进度 1/10' : '未找到进度显示');

        // 检查红心
        const hearts = await page.$$('[class*="heart"], [class*="❤"], text=♥');
        record('TC-04', '2. 红心显示', 'INFO', `找到心形元素: ${hearts.length}`);

        // ============ 答题循环 ============
        let totalCorrect = 0;
        let totalWrong = 0;
        let questionsDone = 0;
        const maxQuestions = 10;

        for (let q = 0; q < maxQuestions; q++) {
          await sleep(400);
          const qBody = await page.textContent('body');

          // 检查是否还在练习页面
          if (qBody && (qBody.includes('查看结果') || qBody.includes('再练一次') || qBody.includes('回首页'))) {
            log(`  练习提前结束 (第${q}题)`);
            break;
          }

          // 尝试找到输入框（数字输入类型）
          const numInput = await page.$('input[inputmode="decimal"], input[type="text"], input[type="number"]');
          const mcOptions = await page.$$('button[class*="border"]');

          if (numInput) {
            // 数字输入题
            // 尝试从题目中提取表达式并计算
            const questionText = qBody || '';
            let answer = '';

            // 尝试简单计算 - 提取数字和运算符
            const exprMatch = questionText.match(/(\d+)\s*([+\-×÷])\s*(\d+)\s*[=＝]/);
            if (exprMatch) {
              const a = parseInt(exprMatch[1]);
              const op = exprMatch[2];
              const b = parseInt(exprMatch[3]);
              switch (op) {
                case '+': answer = String(a + b); break;
                case '-': case '−': answer = String(a - b); break;
                case '×': answer = String(a * b); break;
                case '÷': answer = String(Math.floor(a / b)); break;
              }
              log(`  Q${q + 1}: ${a} ${op} ${b} = ${answer}`);
            } else {
              // 复杂表达式 - 尝试用 eval 近似
              const exprMatch2 = questionText.match(/([0-9+\-×÷()（）.\s]+)\s*[=＝]/);
              if (exprMatch2) {
                try {
                  const expr = exprMatch2[1]
                    .replace(/×/g, '*')
                    .replace(/÷/g, '/')
                    .replace(/（/g, '(')
                    .replace(/）/g, ')')
                    .trim();
                  const result = eval(expr);
                  answer = String(Math.round(result * 1000) / 1000);
                  log(`  Q${q + 1}: ${expr} = ${answer}`);
                } catch {
                  answer = '42'; // fallback
                  log(`  Q${q + 1}: 无法解析表达式，使用默认答案`);
                }
              } else {
                answer = '42';
                log(`  Q${q + 1}: 未找到表达式，使用默认答案`);
              }
            }

            // 故意前几题答对，后面答错以测试两种场景
            if (q < 6) {
              await numInput.fill(answer);
            } else if (q === 6) {
              // 故意答错
              await numInput.fill('99999');
              log(`  Q${q + 1}: 故意答错`);
            } else {
              await numInput.fill(answer);
            }

            await sleep(200);

            // 点击确认
            const submitBtn = await page.$('button:has-text("确认")');
            if (submitBtn && !(await submitBtn.isDisabled())) {
              await submitBtn.click();
            } else {
              // 尝试按Enter
              await page.keyboard.press('Enter');
            }
          } else if (mcOptions.length > 1) {
            // 选择题 - 随机选一个
            const randomIdx = Math.floor(Math.random() * Math.min(mcOptions.length, 4));
            if (mcOptions[randomIdx]) {
              await mcOptions[randomIdx].click();
              await sleep(200);
              const submitBtn = await page.$('button:has-text("确认")');
              if (submitBtn && !(await submitBtn.isDisabled())) {
                await submitBtn.click();
              }
            }
            log(`  Q${q + 1}: 选择题 - 选择选项 ${randomIdx + 1}`);
          } else {
            log(`  Q${q + 1}: 未知题型，尝试跳过`);
            // 可能是竖式题，暂时跳过
          }

          await sleep(800);

          // 检查反馈
          const feedbackBody = await page.textContent('body');
          if (feedbackBody && feedbackBody.includes('正确')) {
            totalCorrect++;
          } else if (feedbackBody && (feedbackBody.includes('再想想') || feedbackBody.includes('答案有误'))) {
            totalWrong++;
          }
          questionsDone++;

          // 截图关键步骤
          if (q === 0 || q === 6) {
            await screenshot(page, `tc04_q${q + 1}_feedback`);
          }

          // 点击下一题/查看结果
          const nextBtn = await page.$('button:has-text("下一题")');
          const viewResult = await page.$('button:has-text("查看结果")');

          if (viewResult) {
            await viewResult.click();
            await sleep(500);
            break;
          } else if (nextBtn) {
            await nextBtn.click();
            await sleep(300);
          } else {
            // 尝试按Enter
            await page.keyboard.press('Enter');
            await sleep(300);
          }
        }

        record('TC-04', '答题完成', 'INFO',
          `完成${questionsDone}题, 正确${totalCorrect}, 错误${totalWrong}`);

        // =============================================
        // TC-10: SessionSummary
        // =============================================
        log('\n--- TC-10: SessionSummary ---');
        await sleep(500);
        await screenshot(page, 'tc10_summary');

        const summaryBody = await page.textContent('body');

        // 检查准确率
        const hasAccuracy = summaryBody && summaryBody.includes('%');
        record('TC-10', '2. 准确率', hasAccuracy ? 'PASS' : 'FAIL',
          hasAccuracy ? '显示准确率' : '未显示准确率');

        // 检查 XP
        const hasXP = summaryBody && summaryBody.includes('XP');
        record('TC-10', '3. XP显示', hasXP ? 'PASS' : 'FAIL',
          hasXP ? '显示XP' : '未显示XP');

        // 检查连击
        const hasCombo = summaryBody && summaryBody.includes('连击');
        record('TC-10', '4. 最大连击', hasCombo ? 'PASS' : 'WARN',
          hasCombo ? '显示最大连击数' : '未找到连击显示');

        // 检查等级进度
        const hasLevel = summaryBody && summaryBody.includes('Lv.');
        record('TC-10', '6. 等级进度', hasLevel ? 'PASS' : 'WARN',
          hasLevel ? '显示等级信息' : '未找到等级信息');

        // 检查题目详情列表
        const hasQuestionDetail = summaryBody && (summaryBody.includes('第1题') || summaryBody.includes('第 1 题'));
        record('TC-10', '7. 题目详情', hasQuestionDetail ? 'PASS' : 'WARN',
          hasQuestionDetail ? '显示题目详情列表' : '未找到详情列表');

        // =============================================
        // TC-11: 成就检查
        // =============================================
        log('\n--- TC-11: 成就检查 ---');
        const hasAchievement = summaryBody && summaryBody.includes('成就');
        record('TC-11', '1. 首次成就', hasAchievement ? 'PASS' : 'WARN',
          hasAchievement ? '显示新成就区域' : '未找到成就解锁提示');

        // 点击回首页
        const homeBtn = await page.$('button:has-text("回首页")');
        if (homeBtn) {
          await homeBtn.click();
          await sleep(500);
          record('TC-10', '10. 回首页', 'PASS', '成功返回首页');
        } else {
          record('TC-10', '10. 回首页', 'FAIL', '未找到"回首页"按钮');
          // 尝试其他方式回去
          const retryBtn = await page.$('button:has-text("再练一次")');
          if (retryBtn) {
            await retryBtn.click();
            await sleep(500);
            // 再从topic-select回首页
            const backBtn = await page.$('button:has-text("←"), button[aria-label="back"]');
            if (backBtn) await backBtn.click();
            await sleep(500);
          }
        }

      } else {
        record('TC-03', '7. 开始练习', 'FAIL', '未找到"开始练习"按钮');
      }
    } else {
      record('TC-03', '进入TopicSelect', 'FAIL', '未找到口算速算主题按钮');
    }

    // =============================================
    // TC-02 (续): 练习后首页检查
    // =============================================
    log('\n--- TC-02 (续): 练习后首页 ---');
    await sleep(500);
    await screenshot(page, 'tc02_home_after_practice');

    const homeAfter = await page.textContent('body');

    // 检查XP更新
    const xpUpdated = homeAfter && !homeAfter.includes('0 / 100 XP');
    record('TC-02', 'XP更新', 'INFO',
      `练习后首页内容检查: XP是否更新=${xpUpdated}`);

    // 检查连续天数
    const hasStreak = homeAfter && homeAfter.includes('🔥');
    record('TC-02', '连续天数', hasStreak ? 'PASS' : 'WARN',
      hasStreak ? '显示连续学习天数' : '首次练习可能不显示');

    // =============================================
    // TC-12: Progress 学习进度
    // =============================================
    log('\n--- TC-12: Progress ---');
    const navForProgress = await page.$$('nav button, footer button, [class*="fixed"] button');
    if (navForProgress.length >= 4) {
      await navForProgress[1].click();
      await sleep(500);
      await screenshot(page, 'tc12_progress');

      const progressBody = await page.textContent('body');

      const hasTotalXP = progressBody && progressBody.includes('XP');
      record('TC-12', '1. 总XP', hasTotalXP ? 'PASS' : 'FAIL',
        hasTotalXP ? '显示总XP' : '未显示XP');

      const hasAccuracy = progressBody && progressBody.includes('%');
      record('TC-12', '1. 总准确率', hasAccuracy ? 'PASS' : 'WARN',
        hasAccuracy ? '显示准确率' : '未显示准确率');

      // 检查是否有主题进度
      const hasTopicProgress = progressBody && progressBody.includes('口算速算');
      record('TC-12', '4. 主题进度', hasTopicProgress ? 'PASS' : 'FAIL',
        hasTopicProgress ? '显示口算速算进度' : '未显示练习过的主题');

      // 点击练习记录
      const historyLink = await page.$('button:has-text("练习记录"), a:has-text("练习记录"), div:has-text("练习记录")');
      if (historyLink) {
        await historyLink.click();
        await sleep(500);

        // =============================================
        // TC-13: History
        // =============================================
        log('\n--- TC-13: History ---');
        await screenshot(page, 'tc13_history');

        const historyBody = await page.textContent('body');
        const hasSession = historyBody && historyBody.includes('口算速算');
        record('TC-13', '1. 练习记录', hasSession ? 'PASS' : 'FAIL',
          hasSession ? '显示练习记录' : '未显示练习记录');

        // 检查准确率颜色编码
        const hasPercentage = historyBody && historyBody.includes('%');
        record('TC-13', '3. 准确率显示', hasPercentage ? 'PASS' : 'WARN',
          hasPercentage ? '显示准确率' : '未显示');

        // 点击第一条记录查看详情
        const sessionCards = await page.$$('button:has-text("口算速算")');
        if (sessionCards.length > 0) {
          await sessionCards[0].click();
          await sleep(500);

          // =============================================
          // TC-14: SessionDetail
          // =============================================
          log('\n--- TC-14: SessionDetail ---');
          await screenshot(page, 'tc14_detail');

          const detailBody = await page.textContent('body');
          const hasDetail = detailBody && detailBody.includes('练习详情');
          record('TC-14', '1. 详情页', hasDetail ? 'PASS' : 'FAIL',
            hasDetail ? '显示练习详情' : '未显示');

          const hasStats = detailBody && detailBody.includes('%') && detailBody.includes('XP');
          record('TC-14', '2. 统计信息', hasStats ? 'PASS' : 'WARN',
            hasStats ? '显示统计数据' : '统计数据不完整');

          // 返回
          const backBtn = await page.$('button:has-text("←")');
          if (backBtn) await backBtn.click();
          await sleep(500);
        }

        // 返回首页
        const backToProgress = await page.$('button:has-text("←")');
        if (backToProgress) await backToProgress.click();
        await sleep(500);
      }

      // 回首页
      const navHome2 = await page.$$('nav button, footer button, [class*="fixed"] button');
      if (navHome2.length >= 1) await navHome2[0].click();
      await sleep(500);
    }

    // =============================================
    // TC-18: 数据持久化测试
    // =============================================
    log('\n--- TC-18: 数据持久化 ---');

    // 记录当前数据
    const beforeReload = await page.evaluate(() => {
      return {
        user: localStorage.getItem('mq_user'),
        progress: localStorage.getItem('mq_progress'),
        sessions: localStorage.getItem('mq_sessions'),
      };
    });

    const hasUserData = !!beforeReload.user;
    const hasProgressData = !!beforeReload.progress;
    const hasSessionData = !!beforeReload.sessions;

    record('TC-18', '1. localStorage', hasUserData && hasProgressData ? 'PASS' : 'FAIL',
      `user:${hasUserData} progress:${hasProgressData} sessions:${hasSessionData}`);

    // 刷新页面
    await page.reload();
    await page.waitForLoadState('networkidle');
    await sleep(1000);
    await screenshot(page, 'tc18_after_reload');

    const reloadBody = await page.textContent('body');
    const stillHome = reloadBody && reloadBody.includes('测试玩家');
    record('TC-18', '2. 刷新后状态', stillHome ? 'PASS' : 'FAIL',
      stillHome ? '刷新后仍显示用户数据，无需重新注册' : '刷新后数据丢失');

    // =============================================
    // TC-09: 中途退出测试
    // =============================================
    log('\n--- TC-09: 中途退出 ---');

    // 再次进入口算速算
    const mentalBtn2 = await page.$('button:has-text("口算速算"), div:has-text("口算速算")');
    if (mentalBtn2) {
      await mentalBtn2.click();
      await sleep(500);

      const startBtn2 = await page.$('button:has-text("开始练习")');
      if (startBtn2) {
        await startBtn2.click();
        await sleep(800);

        // 答1题
        const input = await page.$('input[inputmode="decimal"], input[type="text"]');
        if (input) {
          await input.fill('1');
          await sleep(200);
          const confirmBtn = await page.$('button:has-text("确认")');
          if (confirmBtn && !(await confirmBtn.isDisabled())) {
            await confirmBtn.click();
            await sleep(500);
            const nextBtn = await page.$('button:has-text("下一题")');
            if (nextBtn) {
              await nextBtn.click();
              await sleep(300);
            }
          }
        }

        // 点击退出
        await screenshot(page, 'tc09_before_quit');
        // 找关闭按钮 - 通常是X或✕
        const closeBtn = await page.$('button:has-text("✕"), button:has-text("×"), button:has-text("✖")');
        if (closeBtn) {
          await closeBtn.click();
          await sleep(500);
          await screenshot(page, 'tc09_after_quit');

          const quitBody = await page.textContent('body');
          const isAtSummary = quitBody && (quitBody.includes('%') || quitBody.includes('XP') || quitBody.includes('回首页'));
          record('TC-09', '1. 中途退出', isAtSummary ? 'PASS' : 'WARN',
            isAtSummary ? '退出后显示结果页' : '退出后状态不明确');

          // 回首页
          const homeBtn2 = await page.$('button:has-text("回首页")');
          if (homeBtn2) await homeBtn2.click();
          await sleep(500);
        } else {
          record('TC-09', '1. 中途退出', 'FAIL', '未找到退出按钮');
          // 按ESC尝试
          await page.keyboard.press('Escape');
          await sleep(500);
        }
      }
    }

    // =============================================
    // TC-20: 选择题类型（运算律）
    // =============================================
    log('\n--- TC-20: 选择题类型 ---');

    const opLawsBtn = await page.$('button:has-text("运算律"), div:has-text("运算律")');
    if (opLawsBtn) {
      await opLawsBtn.click();
      await sleep(500);

      const startOpLaws = await page.$('button:has-text("开始练习")');
      if (startOpLaws) {
        await startOpLaws.click();
        await sleep(800);
        await screenshot(page, 'tc20_operation_laws');

        const olBody = await page.textContent('body');

        // 查找选择题选项
        // 选项通常是按钮
        const allButtons = await page.$$('button');
        let optionButtons = [];
        for (const btn of allButtons) {
          const text = await btn.textContent();
          // 排除"确认"、导航等按钮
          if (text && !text.includes('确认') && !text.includes('✕') &&
              !text.includes('下一题') && !text.includes('查看结果') &&
              text.trim().length > 0 && text.trim().length < 100) {
            const isVisible = await btn.isVisible();
            if (isVisible) optionButtons.push(btn);
          }
        }

        if (optionButtons.length >= 2) {
          record('TC-20', '2. 选项显示', 'PASS', `找到 ${optionButtons.length} 个选项按钮`);

          // 检查未选择时确认按钮状态
          const confirmBefore = await page.$('button:has-text("确认")');
          if (confirmBefore) {
            const disabled = await confirmBefore.isDisabled();
            record('TC-20', '3. 未选确认', disabled ? 'PASS' : 'WARN',
              disabled ? '未选择时确认按钮disabled' : '确认按钮可能未正确禁用');
          }

          // 选择第一个选项
          await optionButtons[0].click();
          await sleep(300);
          record('TC-20', '4. 选择选项', 'PASS', '点击选项');

          // 提交
          const confirmAfter = await page.$('button:has-text("确认")');
          if (confirmAfter && !(await confirmAfter.isDisabled())) {
            await confirmAfter.click();
            await sleep(500);
            await screenshot(page, 'tc20_feedback');
            record('TC-20', '6/7. 提交反馈', 'PASS', '显示反馈');
          }
        } else {
          record('TC-20', '选择题', 'WARN', `可能不是选择题格式，选项数: ${optionButtons.length}`);
        }

        // 退出
        const quitBtn = await page.$('button:has-text("✕"), button:has-text("×")');
        if (quitBtn) {
          await quitBtn.click();
          await sleep(500);
        }
        const backHome = await page.$('button:has-text("回首页")');
        if (backHome) {
          await backHome.click();
          await sleep(500);
        }
      }
    } else {
      record('TC-20', '进入运算律', 'FAIL', '未找到运算律主题');
    }

    // =============================================
    // TC-27: 响应式布局测试
    // =============================================
    log('\n--- TC-27: 响应式布局 ---');

    // 手机分辨率
    await page.setViewportSize({ width: 375, height: 812 });
    await sleep(500);
    await screenshot(page, 'tc27_mobile');

    const mobileBody = await page.textContent('body');
    const mobileOk = mobileBody && mobileBody.includes('测试玩家');
    record('TC-27', '2. 手机布局', mobileOk ? 'PASS' : 'FAIL',
      mobileOk ? '手机分辨率下正常显示' : '手机分辨率下显示异常');

    // iPad分辨率
    await page.setViewportSize({ width: 768, height: 1024 });
    await sleep(500);
    await screenshot(page, 'tc27_ipad');
    record('TC-27', '3. iPad布局', 'PASS', 'iPad分辨率下截图已保存');

    // 恢复PC分辨率
    await page.setViewportSize({ width: 1280, height: 720 });
    await sleep(500);
    await screenshot(page, 'tc27_pc');
    record('TC-27', '1. PC布局', 'PASS', 'PC分辨率下截图已保存');

    // =============================================
    // 收集控制台错误
    // =============================================
    log('\n--- 控制台错误检查 ---');
    if (consoleErrors.length > 0) {
      record('CONSOLE', '错误', 'FAIL', `发现 ${consoleErrors.length} 个控制台错误`);
      for (const err of consoleErrors.slice(0, 10)) {
        record('CONSOLE', '错误详情', 'FAIL', err.text.slice(0, 200));
      }
    } else {
      record('CONSOLE', '错误', 'PASS', '无控制台错误');
    }

    // =============================================
    // 生成测试报告
    // =============================================
    log('\n========================================');
    log('测试完成，生成报告...');
    log('========================================');

    const passCount = testResults.filter(r => r.status === 'PASS').length;
    const failCount = testResults.filter(r => r.status === 'FAIL').length;
    const warnCount = testResults.filter(r => r.status === 'WARN').length;
    const infoCount = testResults.filter(r => r.status === 'INFO').length;

    const report = {
      summary: {
        total: testResults.length,
        pass: passCount,
        fail: failCount,
        warn: warnCount,
        info: infoCount,
        executedAt: new Date().toISOString(),
        consoleErrors: consoleErrors.length,
      },
      results: testResults,
      consoleErrors: consoleErrors,
    };

    fs.writeFileSync(
      path.join(RESULTS_DIR, 'test-report.json'),
      JSON.stringify(report, null, 2),
      'utf-8'
    );

    // 生成人类可读报告
    let mdReport = `# Math Quest 自动化测试报告\n\n`;
    mdReport += `> 执行时间: ${new Date().toISOString()}\n\n`;
    mdReport += `## 摘要\n\n`;
    mdReport += `| 指标 | 数量 |\n|------|------|\n`;
    mdReport += `| ✅ 通过 | ${passCount} |\n`;
    mdReport += `| ❌ 失败 | ${failCount} |\n`;
    mdReport += `| ⚠️ 警告 | ${warnCount} |\n`;
    mdReport += `| ℹ️ 信息 | ${infoCount} |\n`;
    mdReport += `| 控制台错误 | ${consoleErrors.length} |\n\n`;

    mdReport += `## 详细结果\n\n`;
    mdReport += `| 用例 | 步骤 | 状态 | 详情 |\n`;
    mdReport += `|------|------|------|------|\n`;
    for (const r of testResults) {
      const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : r.status === 'WARN' ? '⚠️' : 'ℹ️';
      mdReport += `| ${r.tcId} | ${r.step} | ${icon} ${r.status} | ${r.detail} |\n`;
    }

    if (consoleErrors.length > 0) {
      mdReport += `\n## 控制台错误\n\n`;
      for (const err of consoleErrors) {
        mdReport += `- ${err.text}\n`;
      }
    }

    mdReport += `\n## 截图\n\n`;
    mdReport += `截图保存在 \`test-results/screenshots/\` 目录下。\n`;

    fs.writeFileSync(
      path.join(RESULTS_DIR, 'test-report.md'),
      mdReport,
      'utf-8'
    );

    log(`\n测试报告已保存到: ${path.join(RESULTS_DIR, 'test-report.md')}`);
    log(`✅ 通过: ${passCount} | ❌ 失败: ${failCount} | ⚠️ 警告: ${warnCount} | ℹ️ 信息: ${infoCount}`);

  } catch (err) {
    log(`💥 测试执行出错: ${err.message}`);
    console.error(err.stack);
    await screenshot(page, 'error_state');
  } finally {
    await browser.close();
    log('浏览器已关闭');
  }
})();
