// Math Quest - 修复版全流程测试脚本
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const RESULTS_DIR = path.join(__dirname, 'test-results');
const SCREENSHOT_DIR = path.join(RESULTS_DIR, 'screenshots');

const testResults = [];
let screenshotIndex = 100;

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

function record(tcId, step, status, detail = '') {
  testResults.push({ tcId, step, status, detail, time: new Date().toISOString() });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'WARN' ? '⚠️' : 'ℹ️';
  log(`${icon} ${tcId} - ${step}: ${detail || status}`);
}

async function screenshot(page, name) {
  screenshotIndex++;
  const filename = `${screenshotIndex}_${name}.png`;
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: true });
  return filename;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  log('========================================');
  log('Math Quest 修复版测试 - 核心答题流程');
  log('========================================');

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    locale: 'zh-CN',
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push({ text: msg.text(), url: page.url() });
  });
  page.on('pageerror', err => consoleErrors.push({ text: err.message, url: page.url() }));

  try {
    // ============ Setup: 注册新用户 ============
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 快速完成注册
    await page.click('button:has-text("开始冒险")');
    await sleep(500);
    await page.fill('input', '测试玩家');
    await sleep(200);
    await page.click('button:has-text("下一步")');
    await sleep(500);
    await page.click('button:has-text("开始学习")');
    await sleep(800);

    log('注册完成，进入首页');
    await screenshot(page, 'setup_home');

    // ============ TC-03: TopicSelect ============
    log('\n--- TC-03: TopicSelect (口算速算) ---');

    // 使用更精确的选择器 - 找到包含"口算速算"文本的button元素
    // Home.tsx 中每个主题卡片是直接的 button 元素
    const topicButton = page.locator('button').filter({ hasText: '口算速算' }).first();
    const topicVisible = await topicButton.isVisible();
    record('TC-03', '找到口算速算按钮', topicVisible ? 'PASS' : 'FAIL',
      topicVisible ? '按钮可见' : '按钮不可见');

    if (topicVisible) {
      await topicButton.click();
      await sleep(800);
      await screenshot(page, 'tc03_topic_select_fixed');

      // 验证已导航到TopicSelect页面
      const pageText = await page.textContent('body');
      const isTopicSelect = pageText.includes('选择难度') || pageText.includes('开始练习');
      record('TC-03', '导航到TopicSelect', isTopicSelect ? 'PASS' : 'FAIL',
        isTopicSelect ? '成功进入难度选择页' : '未能导航');

      if (isTopicSelect) {
        // 检查难度按钮
        const normalBtn = page.locator('button').filter({ hasText: '普通' });
        const hardBtn = page.locator('button').filter({ hasText: '困难' });
        const demonBtn = page.locator('button').filter({ hasText: '魔王' });

        const normalCount = await normalBtn.count();
        const hardCount = await hardBtn.count();
        const demonCount = await demonBtn.count();
        record('TC-03', '难度按钮', normalCount > 0 ? 'PASS' : 'FAIL',
          `普通:${normalCount} 困难:${hardCount} 魔王:${demonCount}`);

        // 检查困难和魔王是否锁定
        if (hardCount > 0) {
          const hardDisabled = await hardBtn.first().isDisabled();
          record('TC-03', '困难锁定', hardDisabled ? 'PASS' : 'WARN',
            hardDisabled ? '困难难度已锁定' : '困难难度未锁定');
        }

        // 检查题数选择
        const count10 = page.locator('button').filter({ hasText: '10题' });
        const count15 = page.locator('button').filter({ hasText: '15题' });
        const count20 = page.locator('button').filter({ hasText: '20题' });
        const c10 = await count10.count();
        const c15 = await count15.count();
        const c20 = await count20.count();
        record('TC-03', '题数选项', (c10 && c15 && c20) ? 'PASS' : 'FAIL',
          `10题:${c10} 15题:${c15} 20题:${c20}`);

        // 选择10题
        if (c10) await count10.first().click();
        await sleep(200);

        // ============ TC-04: Practice (口算速算) ============
        log('\n--- TC-04: Practice (口算速算 数字输入) ---');

        const startBtn = page.locator('button').filter({ hasText: '开始练习' });
        if (await startBtn.count() > 0) {
          await startBtn.first().click();
          await sleep(1000);
          await screenshot(page, 'tc04_practice_start');

          const practiceBody = await page.textContent('body');
          const hasPractice = practiceBody.includes('/');
          record('TC-04', '1. 进入练习', hasPractice ? 'PASS' : 'FAIL',
            hasPractice ? '显示练习页面' : '未进入练习');

          // 检查红心
          const heartElements = page.locator('text=♥');
          const heartCount = await heartElements.count();
          record('TC-04', '2. 红心', heartCount === 5 ? 'PASS' : 'WARN',
            `找到 ${heartCount} 颗红心`);

          // ====== 答题循环 ======
          let totalCorrect = 0;
          let totalWrong = 0;
          let maxCombo = 0;
          let currentCombo = 0;

          for (let q = 0; q < 10; q++) {
            await sleep(300);
            const body = await page.textContent('body');

            // 检查是否已结束
            if (body.includes('再练一次') || body.includes('回首页')) {
              log(`  练习已在第${q}题结束`);
              break;
            }

            // 检查题型
            const numInput = await page.$('input[inputmode="decimal"]');
            const mcBtns = page.locator('.grid button');
            const mcCount = await mcBtns.count();

            if (numInput) {
              // 数字输入题 - 解析算式
              const prompt = await page.locator('h2').first().textContent();
              let calcAnswer = null;

              // 尝试解析简单算式: A op B = ?
              const m = prompt.match(/(\d+(?:\.\d+)?)\s*([+\-×÷])\s*(\d+(?:\.\d+)?)/);
              if (m) {
                const a = parseFloat(m[1]), op = m[2], b = parseFloat(m[3]);
                switch(op) {
                  case '+': calcAnswer = a + b; break;
                  case '-': case '−': calcAnswer = a - b; break;
                  case '×': calcAnswer = a * b; break;
                  case '÷': calcAnswer = b !== 0 ? a / b : 0; break;
                }
                // 处理浮点精度
                if (calcAnswer !== null) {
                  calcAnswer = Math.round(calcAnswer * 10000) / 10000;
                  // 如果是整数则去掉小数
                  if (Number.isInteger(calcAnswer)) calcAnswer = Math.round(calcAnswer);
                }
              }

              // 尝试解析更复杂的多步表达式
              if (calcAnswer === null) {
                const exprMatch = prompt.match(/([0-9+\-×÷().（）\s]+)[=＝?？]/);
                if (exprMatch) {
                  try {
                    const expr = exprMatch[1]
                      .replace(/×/g, '*').replace(/÷/g, '/')
                      .replace(/（/g, '(').replace(/）/g, ')').trim();
                    calcAnswer = eval(expr);
                    if (typeof calcAnswer === 'number') {
                      calcAnswer = Math.round(calcAnswer * 10000) / 10000;
                      if (Number.isInteger(calcAnswer)) calcAnswer = Math.round(calcAnswer);
                    }
                  } catch { calcAnswer = null; }
                }
              }

              const shouldBeWrong = (q === 6); // 故意答错第7题

              if (shouldBeWrong) {
                await numInput.fill('99999');
                log(`  Q${q+1}: "${prompt}" → 故意答错: 99999`);
              } else if (calcAnswer !== null) {
                await numInput.fill(String(calcAnswer));
                log(`  Q${q+1}: "${prompt}" → ${calcAnswer}`);
              } else {
                await numInput.fill('0');
                log(`  Q${q+1}: "${prompt}" → 无法解析，输入0`);
              }

              await sleep(200);

              // 点确认
              const confirmBtn = page.locator('button').filter({ hasText: '确认' });
              if (await confirmBtn.count() > 0 && !(await confirmBtn.first().isDisabled())) {
                await confirmBtn.first().click();
              }

            } else if (mcCount >= 2) {
              // 选择题
              const prompt = await page.locator('h2').first().textContent();
              log(`  Q${q+1}: 选择题 - "${prompt}"`);

              // 点击第一个选项
              await mcBtns.first().click();
              await sleep(200);

              const confirmBtn = page.locator('button').filter({ hasText: '确认' });
              if (await confirmBtn.count() > 0 && !(await confirmBtn.first().isDisabled())) {
                await confirmBtn.first().click();
              }
            } else {
              // 竖式题或其他 - 检查 VerticalCalcBoard
              log(`  Q${q+1}: 特殊题型(可能是竖式)，尝试跳过`);
              // 通过退出按钮跳过
              const quitBtn = page.locator('button').filter({ hasText: '✕' });
              if (await quitBtn.count() > 0) {
                await quitBtn.first().click();
                await sleep(500);
                break;
              }
            }

            await sleep(800);

            // 检查反馈
            const feedbackBody = await page.textContent('body');
            const isCorrect = feedbackBody.includes('正确！');
            const isWrong = feedbackBody.includes('再想想');

            if (isCorrect) {
              totalCorrect++;
              currentCombo++;
              maxCombo = Math.max(maxCombo, currentCombo);
            } else if (isWrong) {
              totalWrong++;
              currentCombo = 0;
            }

            // 截图关键步骤
            if (q === 0) await screenshot(page, 'tc04_q1_correct');
            if (q === 6) await screenshot(page, 'tc04_q7_wrong');
            if (q === 9) await screenshot(page, 'tc04_q10_last');

            // TC-07: 连击测试
            if (q === 4 && currentCombo >= 5) {
              const comboText = feedbackBody.includes('连击');
              record('TC-07', '5连击', comboText ? 'PASS' : 'WARN',
                `连击计数: ${currentCombo}`);
            }

            // 下一题
            const nextBtn = page.locator('button').filter({ hasText: '下一题' });
            const resultBtn = page.locator('button').filter({ hasText: '查看结果' });

            if (await resultBtn.count() > 0) {
              await resultBtn.first().click();
              await sleep(500);
              record('TC-08', '完成10题', 'PASS', '点击查看结果');
              break;
            } else if (await nextBtn.count() > 0) {
              await nextBtn.first().click();
              await sleep(300);
            }
          }

          record('TC-04', '答题统计', 'INFO',
            `正确:${totalCorrect} 错误:${totalWrong} 最大连击:${maxCombo}`);

          // ============ TC-10: SessionSummary ============
          log('\n--- TC-10: SessionSummary ---');
          await sleep(500);
          await screenshot(page, 'tc10_summary');

          const summaryBody = await page.textContent('body');

          // 准确率
          const accMatch = summaryBody.match(/(\d+)%/);
          record('TC-10', '2. 准确率', accMatch ? 'PASS' : 'FAIL',
            accMatch ? `显示准确率: ${accMatch[0]}` : '未找到准确率');

          // XP
          record('TC-10', '3. XP', summaryBody.includes('XP') ? 'PASS' : 'FAIL',
            summaryBody.includes('XP') ? '显示XP' : '未显示');

          // 连击
          record('TC-10', '4. 连击', summaryBody.includes('连击') ? 'PASS' : 'WARN',
            summaryBody.includes('连击') ? '显示连击' : '可能为0连击');

          // 等级
          record('TC-10', '6. 等级', summaryBody.includes('Lv.') ? 'PASS' : 'FAIL',
            summaryBody.includes('Lv.') ? '显示等级' : '未显示');

          // 表情判定
          const hasTrophy = summaryBody.includes('\u{1F3C6}');
          const hasParty = summaryBody.includes('\u{1F389}');
          const hasThumb = summaryBody.includes('\u{1F44D}');
          const hasFlex = summaryBody.includes('\u{1F4AA}');
          record('TC-10', '1. 表情', (hasTrophy || hasParty || hasThumb || hasFlex) ? 'PASS' : 'WARN',
            'trophy:' + hasTrophy + ' party:' + hasParty + ' thumb:' + hasThumb + ' flex:' + hasFlex);

          // ============ TC-11: 成就 ============
          log('\n--- TC-11: 成就检查 ---');
          const hasNewAch = summaryBody.includes('新成就解锁');
          record('TC-11', '首次答题成就', hasNewAch ? 'PASS' : 'WARN',
            hasNewAch ? '显示新成就解锁提示' : '未显示新成就（可能没有触发）');

          if (hasNewAch) {
            await screenshot(page, 'tc11_achievements');
          }

          // 点击"再练一次"
          const retryBtn = page.locator('button').filter({ hasText: '再练一次' });
          const homeBtn = page.locator('button').filter({ hasText: '回首页' });

          record('TC-10', '9. 再练一次按钮', await retryBtn.count() > 0 ? 'PASS' : 'FAIL',
            await retryBtn.count() > 0 ? '存在' : '不存在');
          record('TC-10', '10. 回首页按钮', await homeBtn.count() > 0 ? 'PASS' : 'FAIL',
            await homeBtn.count() > 0 ? '存在' : '不存在');

          // 回首页
          if (await homeBtn.count() > 0) {
            await homeBtn.first().click();
            await sleep(500);
          }

          // ============ TC-25: XP & 等级更新检查 ============
          log('\n--- TC-25: XP & 等级 ---');
          await screenshot(page, 'tc25_home_after');

          const homeAfterBody = await page.textContent('body');
          const xpMismatch = homeAfterBody.includes('0 / 400 XP');
          record('TC-25', 'XP更新', !xpMismatch ? 'PASS' : 'FAIL',
            !xpMismatch ? 'XP已更新' : 'XP仍为0');

          // ============ TC-18: 数据持久化 ============
          log('\n--- TC-18: 数据持久化 ---');
          const storageData = await page.evaluate(() => ({
            user: !!localStorage.getItem('mq_user'),
            progress: !!localStorage.getItem('mq_progress'),
            sessions: !!localStorage.getItem('mq_sessions'),
          }));
          record('TC-18', 'localStorage',
            storageData.user && storageData.progress ? 'PASS' : 'FAIL',
            `user:${storageData.user} progress:${storageData.progress} sessions:${storageData.sessions}`);

          // 刷新
          await page.reload();
          await page.waitForLoadState('networkidle');
          await sleep(1000);

          const afterReload = await page.textContent('body');
          record('TC-18', '刷新后状态',
            afterReload.includes('测试玩家') ? 'PASS' : 'FAIL',
            afterReload.includes('测试玩家') ? '数据持久化成功' : '数据丢失');

          // ============ TC-15: 错题本 (有错题后) ============
          log('\n--- TC-15: 错题本 (有错题) ---');
          const navBtns = page.locator('nav button');
          if (await navBtns.count() >= 3) {
            await navBtns.nth(2).click(); // 第3个按钮=错题本
            await sleep(500);
            await screenshot(page, 'tc15_wrongbook');

            const wbBody = await page.textContent('body');
            if (totalWrong > 0) {
              const hasWrongQ = wbBody.includes('口算速算') || !wbBody.includes('还没有做错');
              record('TC-15', '错题显示', hasWrongQ ? 'PASS' : 'FAIL',
                hasWrongQ ? '显示错题数据' : '未显示错题');
            } else {
              record('TC-15', '全对后无错题', wbBody.includes('还没有做错') ? 'PASS' : 'WARN',
                '全部答对时应显示空状态');
            }

            // 回首页
            await navBtns.first().click();
            await sleep(500);
          }

          // ============ TC-09: 中途退出测试 ============
          log('\n--- TC-09: 中途退出 ---');

          // 再次进入口算速算
          const topicBtn2 = page.locator('button').filter({ hasText: '口算速算' }).first();
          await topicBtn2.click();
          await sleep(500);

          const startBtn2 = page.locator('button').filter({ hasText: '开始练习' });
          if (await startBtn2.count() > 0) {
            await startBtn2.first().click();
            await sleep(800);

            // 答2题
            for (let i = 0; i < 2; i++) {
              const inp = await page.$('input[inputmode="decimal"]');
              if (inp) {
                await inp.fill('1');
                await sleep(200);
                const conf = page.locator('button').filter({ hasText: '确认' });
                if (await conf.count() > 0 && !(await conf.first().isDisabled())) {
                  await conf.first().click();
                }
                await sleep(500);
                const nxt = page.locator('button').filter({ hasText: '下一题' });
                if (await nxt.count() > 0) {
                  await nxt.first().click();
                  await sleep(300);
                }
              }
            }

            await screenshot(page, 'tc09_before_quit');

            // 点击退出✕
            const quitBtn = page.locator('button').filter({ hasText: '✕' });
            if (await quitBtn.count() > 0) {
              await quitBtn.first().click();
              await sleep(500);
              await screenshot(page, 'tc09_after_quit');

              const quitBody = await page.textContent('body');
              const atSummary = quitBody.includes('回首页') || quitBody.includes('%');
              record('TC-09', '中途退出', atSummary ? 'PASS' : 'FAIL',
                atSummary ? '退出后显示结果页' : '退出后页面状态异常');

              // 回首页
              const hb = page.locator('button').filter({ hasText: '回首页' });
              if (await hb.count() > 0) await hb.first().click();
              await sleep(500);
            } else {
              record('TC-09', '退出按钮', 'FAIL', '未找到✕退出按钮');
            }
          }

          // ============ TC-20: 运算律 (选择题) ============
          log('\n--- TC-20: 运算律 (选择题) ---');

          const opLawBtn = page.locator('button').filter({ hasText: '运算律' }).first();
          if (await opLawBtn.isVisible()) {
            await opLawBtn.click();
            await sleep(500);

            const startOL = page.locator('button').filter({ hasText: '开始练习' });
            if (await startOL.count() > 0) {
              await startOL.first().click();
              await sleep(800);
              await screenshot(page, 'tc20_operation_laws');

              const olBody = await page.textContent('body');

              // 运算律应该是选择题
              const mcGridBtns = page.locator('.grid.grid-cols-1 button');
              const mcOptionsCount = await mcGridBtns.count();

              if (mcOptionsCount >= 2) {
                record('TC-20', '选择题格式', 'PASS', `${mcOptionsCount} 个选项`);

                // 检查未选时确认按钮
                const confBtn = page.locator('button').filter({ hasText: '确认' });
                if (await confBtn.count() > 0) {
                  const disabled = await confBtn.first().isDisabled();
                  record('TC-20', '未选时确认', disabled ? 'PASS' : 'FAIL',
                    disabled ? 'disabled' : '未正确禁用');
                }

                // 选一个选项
                await mcGridBtns.first().click();
                await sleep(200);
                await screenshot(page, 'tc20_selected');

                // 确认
                if (await confBtn.count() > 0 && !(await confBtn.first().isDisabled())) {
                  await confBtn.first().click();
                  await sleep(500);
                  await screenshot(page, 'tc20_feedback');

                  const fbBody = await page.textContent('body');
                  const hasFB = fbBody.includes('正确') || fbBody.includes('再想想');
                  record('TC-20', '答题反馈', hasFB ? 'PASS' : 'FAIL',
                    hasFB ? '显示反馈' : '未显示反馈');
                }
              } else {
                record('TC-20', '选择题格式', 'WARN',
                  `可能不是选择题，选项数: ${mcOptionsCount}`);
                // 可能是数字输入
                const numInp = await page.$('input[inputmode="decimal"]');
                if (numInp) {
                  record('TC-20', '题型', 'INFO', '运算律使用了数字输入而非选择题');
                }
              }

              // 退出
              const qb = page.locator('button').filter({ hasText: '✕' });
              if (await qb.count() > 0) {
                await qb.first().click();
                await sleep(500);
              }
              const hb2 = page.locator('button').filter({ hasText: '回首页' });
              if (await hb2.count() > 0) {
                await hb2.first().click();
                await sleep(500);
              }
            }
          }

          // ============ TC-19: 竖式笔算 ============
          log('\n--- TC-19: 竖式笔算 ---');

          const vertBtn = page.locator('button').filter({ hasText: '竖式笔算' }).first();
          if (await vertBtn.isVisible()) {
            await vertBtn.click();
            await sleep(500);

            const startVert = page.locator('button').filter({ hasText: '开始练习' });
            if (await startVert.count() > 0) {
              await startVert.first().click();
              await sleep(1000);
              await screenshot(page, 'tc19_vertical_calc');

              const vertBody = await page.textContent('body');

              // 竖式题应该有特殊的网格界面
              // 检查是否有竖式计算组件的特征元素
              const hasVertGrid = await page.$('.grid') !== null;
              const hasSubmitInVert = vertBody.includes('提交');
              const hasClearBtn = vertBody.includes('清除');

              record('TC-19', '竖式界面', (hasSubmitInVert || hasClearBtn) ? 'PASS' : 'WARN',
                `提交按钮:${hasSubmitInVert} 清除按钮:${hasClearBtn}`);

              // 退出竖式练习
              const qb2 = page.locator('button').filter({ hasText: '✕' });
              if (await qb2.count() > 0) {
                await qb2.first().click();
                await sleep(500);
              }
              const hb3 = page.locator('button').filter({ hasText: '回首页' });
              if (await hb3.count() > 0) {
                await hb3.first().click();
                await sleep(500);
              }
            }
          }

          // ============ TC-05: 倒计时超时 ============
          log('\n--- TC-05: 倒计时超时 ---');

          const mentalBtn3 = page.locator('button').filter({ hasText: '口算速算' }).first();
          await mentalBtn3.click();
          await sleep(500);

          const startTO = page.locator('button').filter({ hasText: '开始练习' });
          if (await startTO.count() > 0) {
            await startTO.first().click();
            await sleep(800);

            // 检查是否有倒计时
            const timerBody1 = await page.textContent('body');
            const hasTimer = timerBody1.match(/\d+s/);
            record('TC-05', '倒计时显示', hasTimer ? 'PASS' : 'WARN',
              hasTimer ? `显示倒计时: ${hasTimer[0]}` : '未找到倒计时');

            if (hasTimer) {
              // 等待倒计时结束 - 最多等30秒
              log('  等待倒计时结束...');
              let timedOut = false;
              for (let wait = 0; wait < 35; wait++) {
                await sleep(1000);
                const curBody = await page.textContent('body');
                if (curBody.includes('再想想') || curBody.includes('正确')) {
                  timedOut = true;
                  break;
                }
              }

              if (timedOut) {
                await screenshot(page, 'tc05_timeout');
                const toBody = await page.textContent('body');
                const autoWrong = toBody.includes('再想想');
                record('TC-05', '超时判定', autoWrong ? 'PASS' : 'WARN',
                  autoWrong ? '超时自动判错' : '超时但未显示错误反馈');
              } else {
                record('TC-05', '超时等待', 'WARN', '倒计时可能过长（>35s），跳过');
              }
            }

            // 退出
            // 先处理可能的反馈页面
            const nextBtnTO = page.locator('button').filter({ hasText: '下一题' });
            if (await nextBtnTO.count() > 0) {
              // 不点下一题，直接退出
            }
            const qb3 = page.locator('button').filter({ hasText: '✕' });
            if (await qb3.count() > 0) {
              await qb3.first().click();
              await sleep(500);
            }
            const hb4 = page.locator('button').filter({ hasText: '回首页' });
            if (await hb4.count() > 0) {
              await hb4.first().click();
              await sleep(500);
            }
          }

          // ============ TC-13/14: History & SessionDetail ============
          log('\n--- TC-13/14: History & Detail ---');

          const navProgress = page.locator('nav button').nth(1);
          await navProgress.click();
          await sleep(500);

          // 点击练习记录
          const histLink = page.locator('button, div').filter({ hasText: '练习记录' }).first();
          if (await histLink.isVisible()) {
            await histLink.click();
            await sleep(500);
            await screenshot(page, 'tc13_history_fixed');

            const histBody = await page.textContent('body');
            const sessionCount = (histBody.match(/口算速算/g) || []).length;
            record('TC-13', '练习记录数', sessionCount >= 2 ? 'PASS' : 'WARN',
              `找到 ${sessionCount} 条口算速算记录（应至少有2条）`);

            // 检查准确率颜色分级 - 查看是否有百分比
            const percents = histBody.match(/\d+%/g);
            record('TC-13', '准确率显示', percents ? 'PASS' : 'FAIL',
              percents ? `准确率: ${percents.join(', ')}` : '未显示准确率');

            // 点击第一条记录
            const sessionBtns = page.locator('button').filter({ hasText: '口算速算' });
            if (await sessionBtns.count() > 0) {
              await sessionBtns.first().click();
              await sleep(500);
              await screenshot(page, 'tc14_detail_fixed');

              const detailBody = await page.textContent('body');
              record('TC-14', '详情页',
                detailBody.includes('练习详情') ? 'PASS' : 'FAIL',
                detailBody.includes('练习详情') ? '显示详情' : '未显示');

              // 检查题目详情
              const hasQ1 = detailBody.includes('第 1 题') || detailBody.includes('第1题');
              record('TC-14', '题目列表', hasQ1 ? 'PASS' : 'WARN',
                hasQ1 ? '显示第1题' : '未找到题目列表');

              // 返回
              const backBtn = page.locator('button').filter({ hasText: '←' });
              if (await backBtn.count() > 0) await backBtn.first().click();
              await sleep(300);
            }

            // 返回
            const backBtn2 = page.locator('button').filter({ hasText: '←' });
            if (await backBtn2.count() > 0) await backBtn2.first().click();
            await sleep(300);
          }

          // 回首页
          const navHome = page.locator('nav button').first();
          await navHome.click();
          await sleep(500);

        } else {
          record('TC-04', '开始练习', 'FAIL', '未找到开始练习按钮');
        }
      } else {
        record('TC-03', '导航失败', 'FAIL', '未能进入TopicSelect页面');
      }
    } else {
      record('TC-03', '找不到按钮', 'FAIL', '口算速算按钮不可见');
    }

    // ============ 控制台错误 ============
    log('\n--- 控制台错误 ---');
    if (consoleErrors.length > 0) {
      record('CONSOLE', '错误', 'FAIL', `${consoleErrors.length} 个控制台错误`);
      consoleErrors.slice(0, 5).forEach((e, i) => {
        record('CONSOLE', `错误${i+1}`, 'FAIL', e.text.slice(0, 200));
      });
    } else {
      record('CONSOLE', '无错误', 'PASS', '控制台无错误');
    }

    // ============ 生成报告 ============
    const pass = testResults.filter(r => r.status === 'PASS').length;
    const fail = testResults.filter(r => r.status === 'FAIL').length;
    const warn = testResults.filter(r => r.status === 'WARN').length;
    const info = testResults.filter(r => r.status === 'INFO').length;

    log(`\n✅ ${pass} | ❌ ${fail} | ⚠️ ${warn} | ℹ️ ${info}`);

    fs.writeFileSync(path.join(RESULTS_DIR, 'test-report-v2.json'),
      JSON.stringify({ summary: { pass, fail, warn, info, consoleErrors: consoleErrors.length },
        results: testResults, consoleErrors }, null, 2));

    log('报告已保存');

  } catch (err) {
    log(`💥 错误: ${err.message}`);
    console.error(err.stack);
    await screenshot(page, 'error');
  } finally {
    await browser.close();
  }
})();
