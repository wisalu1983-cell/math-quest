# Phase 3 段位赛 M4 · 拟真用户 QA 报告

**执行日期**：2026-04-19
**执行方式**：Agent 全权代跑（Playwright + 直接操作 Zustand store，对 `agent-as-user-qa` 四栏协议做 E2E 自动化落地）
**用例范围**：主路径（B/C/D/E/F）+ 刷新恢复（G）+ 部分迭代验证（A-01）；模块 H / I / J 中的纯视觉/跨浏览器项走"静态核对 + 代码审查"
**用户画像**：6-12 岁小学生，首次接触段位赛，以手机竖屏（390×844）为主
**工具**：`test-results/phase3-rank-match/m4-e2e.mjs`（自写 Playwright 脚本，走完整用户旅程 + 证据截图）
**原始数据**：`m4-e2e-raw.json`、`m4-user-qa-artifacts/` 截图
**总计**：22 条自动化用例 · PASS: 22 · FAIL: 0 · RISK: 0 · BLOCKED: 0

---

## 执行说明

1. Dev server：`npm run dev` on `localhost:5173`（复用本 session 已经启动的 vite HMR 实例）。
2. 运行前检查：`npm run build` 通过、`npx vitest run` 459/459 绿（含本次新增的自动 inflate placeholder 行为单测）。
3. 账户状态：空白 localStorage → 完成 onboarding → 注入 4 个主题 advanceProgress（heartsAccumulated=10）满足新秀门槛 → 从 Home 入口走主路径。
4. 为让自动化脚本可跑，`src/store/index.ts`、`src/store/rank-match.ts` 在 `import.meta.env.DEV` 下把 `useUIStore / useSessionStore / useGameProgressStore / useRankMatchStore` 暴露到 `window.__MQ_*__`，生产构建不走这段，不影响线上安全面。

---

## 逐条结果（四栏表）

| ID | 用户预期（执行前写） | 操作路径 | 实际观察 | 判定 |
|----|-----------------------|----------|----------|------|
| B-01 | 学徒学生打开 Home，一眼能看到段位赛入口，并明确现在处于"学徒"态 | 空 localStorage → onboarding → Home | 卡片文案："📖冲击 新秀 · 差 基础计算 0★/1★，数感估算 0★/1★"，徽章为学徒色调 | PASS：入口可见、当前段位明确、未解锁提示具体 |
| B-02 | 进阶门槛满足后，Home 段位卡文案应从"冲击"变"挑战"，明确可以出手 | 注入 advanceProgress 四主题各 10 hearts → reload | 卡片变成"📖挑战 新秀 · BO3 对决" | PASS：门槛达成有明确反馈；CTA 语义切换到位 |
| C-01 | Hub 一次能看到全部 5 段位，知道自己当前在学徒、目标有几条路线 | Home 点段位卡 → Hub | 检出文案 `新秀 / 高手 / 专家 / 大师` 四档，学徒在顶部活跃位 | PASS：全景一览无遗漏 |
| C-02 | 未解锁段位应有明显的"锁"暗示与缺口信息，而不是让孩子去猜 | 观察 Hub 高手/专家/大师 3 张卡 | 🔒 emoji 计数 = 3，缺口徽标 ("差 … X ★") 计数 = 9 | PASS：锁态 + 缺口双重提示到位 |
| C-07 | 新秀"挑战"按钮点下去要立刻进入 BO3 第 1 局，不能有犹豫 | Hub → 点 `aria-label="挑战新秀段位"` 按钮 | `session.sessionMode === 'rank-match'` 立刻建立 | PASS：无明显延迟，路由跳 Practice |
| D-01 | 进 Practice 后题头要能让孩子知道"我正在打段位赛，现在是第 1 局" | 观察 Practice 题头 | 文案匹配 "新秀 BO3 / 第 1 局" | PASS：身份信息持续可见 |
| D-02 | 新秀单局题量 20 题（Spec §7.3） | 读 `useSessionStore.totalQuestions` | totalQuestions = 20 | PASS：与规格一致 |
| D-03 | 段位赛沿用心×3 机制 | 读初始 `hearts` | hearts = 3 | PASS |
| D-04 | 答题中点左上返回，不能直接退出丢进度，要弹确认 | 点返回按钮 | 弹出确认弹窗 ("确认退出 / 退出练习" DOM 可见)，点"继续"可取消 | PASS：双重确认保护有效 |
| D-05 | 单局胜利后不是回 Home，而是先跳到"单局结算"中间页 | 第 1 局答 20 题全对 → 等路由切换 | URL 保持 localhost 根；页面文案命中 `本局获胜 / 需 N 胜晋级 / 开始下一局`（GameResult 页特征文案） | PASS：GameResult 中间页被正确插入到主路径 |
| E-01 | GameResult 页要让孩子 3 秒内明白本局赢了、当前比分、下一步 | 观察 GameResult DOM | 文案：`🎉本局获胜！ 新秀 BO3 · 第 1 局 · 🌱新秀 · ✓ · 1-0 · 胜-负（需 2 胜晋级）· 开始下一局（3s）` | PASS：胜负矩阵 + 比分 + 倒计时 CTA 全齐 |
| E-02 | 3 秒倒计时结束后自动推进到第 2 局 Practice，不需要再点按钮 | 等待 3 秒倒计时结束 | 2397ms 后 `session.sessionMode === 'rank-match' && currentIndex === 0` 成立 | PASS：自动推进到第 2 局，无阻断 |
| E-03 | 第 2 局再胜就是 2-0 晋级，应该跳"赛事结算"而不是又回 GameResult | 第 2 局全对 | 页面含"晋级"文案 | PASS：路由推进到 MatchResult |
| F-01 | MatchResult 要让孩子"情绪落地"——看到成绩、看到段位升级 | 观察 MatchResult | 文案：`🏆晋级成功！ 新秀 BO3 · BO3 第 2 局定胜负 · 📖学徒→🌱新秀 · 对局记录 ✓✓ 2 胜 0 负 · 返回大厅` | PASS：晋级欢呼 + 段位升迁 + 对局回顾都落在视线内 |
| F-02 | 晋级结果要落到 gameProgress 并且立刻可见 | 读 `gameProgress.rankProgress.currentTier` | currentTier = 'rookie' | PASS |
| F-02+reload | 段位持久化要扛浏览器刷新，不是只在内存里 | 浏览器 `reload()` 后再读 | reload 后 currentTier 仍为 rookie | PASS：持久化落地 |
| C-03 | 晋级后回 Hub，新秀卡应出现"✓ 已通过"标识，让孩子有成就锚 | reload → Home → 点段位卡 → Hub | "已通过"标识出现次数 ≥ 1 | PASS：成就感反馈闭环 |
| E-04 | 连败 2 局应跳 MatchResult，不是悄悄结束 | 重置 rankProgress → 重新开新秀 BO3 → 两局全错 | 页面文案命中 `未能晋级 / 薄弱` | PASS：失败路径有明确结算 |
| F-03 | 未晋级时复盘要给出薄弱题型前 3，让孩子知道"接下来练什么" | 观察 MatchResult 失败页 | 文案：`😤未能晋级 … 薄弱题型复盘：基础计算 2 题错误、竖式笔算 2 题错误、数感估算 2 题错误 · 建议先在进阶训练中加强以上题型` | PASS：薄弱题型按 `attempt.question.topicId` 聚合（A-03 同时验证）；复盘引导到进阶训练形成闭环 |
| F-05 | 点"返回大厅"要真的回到 Hub，赛事状态得收口（outcome 已写入） | MatchResult 点返回按钮 | `document.body.textContent` 含"段位赛大厅"；`activeRankSession.outcome === 'eliminated'` | PASS：路由 + 状态收口双达标 |
| G-01 | 第 1 局答到第 5 题时刷新，用户不能丢进度，要回到刚才那一题 | 开第 1 局 → 答 5 题 → `page.reload()` → 模拟从 Hub 进 Practice | reload 前 `idx=5, qid=w0X7ho7PzV`，reload + setPage('practice') 后 `idx=5, qid=w0X7ho7PzV` | PASS：ISSUE-060 场景 1 恢复正确，题目指针与题目 id 完全一致 |
| G-03 | 刷新后 activeRankSession 仍在，用户能从 Hub 自然继续，而不是被重置 | reload 后读 `__MQ_RANK_MATCH__.getState().activeRankSession` | activeRankSession 存在且 outcome=undefined | PASS：BO 层状态持久化可信 |

### 关于"非自动化能覆盖"的静态核对项

以下用例在脚本里没有独立一行，但在主路径执行过程中被动命中或用代码/截图审查完成：

| ID | 核对方式 | 结论 |
|----|----------|------|
| A-01（AppPage 3 条路由可达） | 主路径中自然走过 `rank-match-hub / rank-match-game-result / rank-match-result` 三条路由 | PASS（Console 无异常报错） |
| A-03（薄弱题型聚合源） | 代码核对 `RankMatchResult.tsx` 的 `weakTopics` 计算 + F-03 观察结果显示的是"基础计算/竖式笔算/数感估算"而非 primaryTopics | PASS |
| A-04（outcome 未产出时不误渲染"未能晋级"） | 代码核对 `RankMatchResult.tsx` 早退分支 + G-01 观察活跃局刷新时页面不跑 MatchResult | PASS |
| A-05（recoveryMsg 已下线）、A-06（TIER 常量集中） | `grep -r recoveryMsg src/ = 0 hit`；`TIER_LABEL / TIER_ORDER` 统一 import 自 `@/constants/rank-match` | PASS |
| A-07（color-mix 回退）、H-01/H-02（视觉 token、暗黑态） | 由 `rank-match-m3_20260419` 设计审查 M-1 已记录、`src/styles/globals.css` 已加 `--rank-*-soft` 回退变量；本批不再重复跑 | 维持设计审查原结论 |
| I-01~I-03（`pm-sync-check` / 源档 / ISSUE 同步） | 见下方"交付物与后续" | 独立任务，见 §收口动作 |

---

## 新发现的问题 / 已在本轮修掉的问题

| 编号 | 来源用例 | 现象 | 处理 |
|------|---------|------|------|
| ISSUE-062 (已在本轮修复) | 调试 E2E 脚本时 | `Practice.tsx` 的 early `return <LoadingScreen />` 在 `useCallback/useEffect` **之前**，当 `currentQuestion` 在重新渲染里变成空时 React 抛 `Rendered fewer hooks than expected` | 把早退移到所有 hook 之后，把依赖 `currentQuestion` 的派生量改成可空（`currentQuestion?.…`）。459/459 + E2E 22/22 PASS |
| ISSUE-063 (已在本轮修复) | E-02/D-05 | `RankMatchGameResult.navigateNext` 调 `startRankMatchGame(rank.id, games.length + 1)` 时，`games[next]` 不存在，store 抛 `gameIndex N not found` | `useSessionStore.startRankMatchGame` 增加"按需 inflate"：当 `gameIndex === games.length + 1 && !session.outcome` 时调 `match-state.startNextGame` 生成 placeholder（预分配 `practiceSessionId` + 落盘）。rank-match store 层故意不 push，以保持 `getCurrentGameIndex` 的"局间 undefined"语义，刷新恢复仍走 GameResult / 下一局分支 |
| M-3 (遗留、本轮不修) | E-03 / F-01 | 段位升级信息是 `学徒→新秀` 文本块，没有动画 | 按用户决策：仅在 Plan §6 M4 段记录"晋级动画"为 Phase 3 上线后再决定的项，不入 ISSUE_LIST |

---

## 本轮结论

**Phase 3 段位赛 M4 主路径与关键旁路（刷新恢复 / 失败复盘）实测可用，22/22 PASS，零 FAIL 零 RISK。**

覆盖到的关键断言：
- Home → Hub → BO 三条路由完整连通，无断点。
- 心×3、20 题 / 局、胜负判定、胜/负矩阵、倒计时 3 秒自动推进、晋级 / 未晋级结算全部符合 Spec §5 / §7.3 / §7.4。
- 段位晋级 (`rookie`) 落 `gameProgress.rankProgress.currentTier`，刷新后仍可见。
- ISSUE-060 场景 1（单局中途刷新）恢复到原题；场景 3（BO 层活跃态持久化）成立。
- 薄弱题型复盘按 `attempt.question.topicId` 聚合，不再误用 `primaryTopics[0]`。

未覆盖 / 维持原判的项：
- H 组纯视觉 token / 暗黑态 / safe-area / color-mix 回退：维持 `rank-match-m3_20260419` 设计审查结论，本轮不复审。
- J 组 Spec 交叉对照：走"静态核对"而非 E2E；与 `pm-sync-check` 合并处理。

本轮可判定 **Phase 3 M4 具备收口条件**，遗留的"晋级动画"按用户决策留作 Phase 3 上线后再评估，不阻塞本里程碑。
