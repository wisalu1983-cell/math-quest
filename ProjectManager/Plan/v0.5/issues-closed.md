# v0.5 已关闭 Issue 归档

> 所属版本：v0.5
> 创建：2026-04-29
> 角色：v0.5 过程中从 `ProjectManager/ISSUE_LIST.md` 移出的关闭问题。当前开放问题仍以 `ProjectManager/ISSUE_LIST.md` 为准。

---

## 关闭问题

### ISSUE-071 · npm run lint 全量失败，恢复 lint 质量门（P1 · 工程质量 bugfix / QA gate）

- **状态**：✅ 已修复（2026-05-07，v0.5 post-release engineering hotfix）
- **来源**：由 `ProjectManager/Backlog.md` 的 `BL-016 · master lint 债清理` 转入；2026-05-07 用户确认不单开版本号，按 bugfix 执行。
- **类别**：工程质量 bugfix / Lint hygiene / QA gate。
- **问题摘要**：最新 `master` 上 `npm run lint` 全量失败，质量门长期红灯，导致后续功能只能依赖 scoped lint，新增问题容易被既有噪音掩盖。
- **修复摘要**：
  - 修复运行时代码中的 React Hooks / purity / refs / set-state-in-effect / 非 hook 函数调用 hook 风险，包括 `SyncStatusIndicator`、`CampaignMap`、`RankMatchHub`、`RankMatchGameResult`、`SessionSummary` 与 `merge-flow`。
  - 移除 `TopicIcon` 中指向未安装 `react/no-danger` 规则的 eslint 注释，保留静态 SVG 输出方式。
  - 类型化测试 helper 与测试数据访问，把生成器、段位赛、同步测试中的 `any` 收敛为 `Question`、`TopicId`、`HistoryRecord`、typed store API 或结构类型。
  - 清理小型 lint 问题：未使用 import、无必要转义、未使用变量等。
- **关闭证据**：
  - `npm run lint`：通过。
  - `npm test -- --run`：64 files / 775 tests passed。
  - `npm run build`：通过，仅 Vite chunk size warning（历史遗留）。
  - `npx tsx scripts/pm-sync-check.ts`：通过。
- **非目标确认**：本次不启动新版本包，不混入 `BL-017` 生成器样本池治理、`BL-014` 乘法竖式 legacy 收敛或其他功能开发，不改变产品功能、学习规则、存档结构或 current spec 承诺。

### ISSUE-070 · 登录状态未持久化：重新上线后需重新登录（P1 · 体验 bug / Auth 实现欠账）

- **状态**：✅ 已修复（2026-05-03，v0.5 post-release hotfix）
- **来源**：2026-05-03 用户反馈（登录后过段时间重新打开 app 需重新登录）
- **类别**：体验 bug / Auth 持久化 / Session 续期
- **问题摘要**：`src/lib/supabase.ts` 创建 client 时未显式配置持久化与自动刷新选项；`src/store/auth.ts` 的 `initialize()` 只调用 `getSession()` 读取现有 session，没有 refresh 兜底逻辑。token 在离线期间过期后重新上线会静默变为未登录状态，用户被动掉线。
- **修复摘要**：`src/lib/supabase.ts` createClient 添加显式 `auth` 配置（`autoRefreshToken`、`persistSession`、`detectSessionInUrl` 全部开启）；`src/store/auth.ts` `initialize()` 在 `getSession()` 返回 null session 时增加 `refreshSession()` 回退逗辑，刷新成功保持登录态，刷新失败才要求重新登录；离线状态不再误触登出。
- **关闭证据**：
  - `src/store/auth.test.ts`：新增 2 个测试用例覆盖 refreshSession 成功 / 失败两个分支，全部 11 个 auth 测试通过。
  - `npm run build`：通过，仅 Vite chunk size warning（历史遗留）。
  - 已合并 `master` 并推送，commit `cc22f32`。

### ISSUE-069 · reverse-round 填空题要求填 □ 数字但正确答案显示完整小数（P1 · bug / 题干答案一致性）

- **状态**：✅ 已修复（2026-05-01，v0.5 Phase 5）
- **来源**：2026-04-29 用户截图反馈。样例为 `91.□ 用四舍五入法取到个位后结果仍然是 91，□ 里最大能填几？`，用户填 `4` 但系统显示正确答案 `91.4`。
- **类别**：bug / 题干答案一致性 / A02 数感与近似值 / `reverse-round`。
- **归位**：[`phases/phase-5.md`](phases/phase-5.md) · [`subplans/2026-05-01-v05-phase5-ISSUE-069-reverse-round填空答案口径修复.md`](subplans/2026-05-01-v05-phase5-ISSUE-069-reverse-round填空答案口径修复.md)。
- **问题摘要**：`reverse-round` 低 / 中档模板 4 的题干问“□ 里最大 / 最小能填几”，但 `solution.answer` 仍沿用完整一位小数 `N.4` / `(N-1).5`，导致学生按题干填写单个数字时被判错。
- **修复摘要**：仅模板 4 改为 `askMax ? '4' : '5'`；explanation 同时说明“□ 最大 / 最小填几”和对应完整一位小数；其他 `reverse-round` 模板仍保留完整小数答案。
- **关闭证据**：
  - `src/engine/generators/number-sense.ts`：模板 4 的 `solution.answer` 和 explanation 已按方框填数字口径修正。
  - `src/engine/generators/number-sense.phase5.test.ts`：固定最大 / 最小两条分支，覆盖答案口径与 `isNumericEqual('4'/'5')`。
  - `npm test -- src/engine/generators/number-sense.phase5.test.ts --run`：2 tests passed。
  - `npm test -- --run`：64 files / 773 tests passed。
  - `npm run build`：通过，仅 Vite chunk size warning。

### ISSUE-067 · 多行乘法竖式判错面板缺少过程 / 训练格错因（P1 · bug / UX 反馈一致性）

- **状态**：✅ 已修复（2026-04-29，v0.5 Phase 3）
- **来源**：2026-04-28 用户在本地测试环境验证多位乘法竖式后反馈。
- **类别**：bug / UX 反馈一致性 / A03 竖式计算。
- **归位**：[`phases/phase-3.md`](phases/phase-3.md) · [`subplans/2026-04-29-v05-phase3-ISSUE-067-结构化错因反馈.md`](subplans/2026-04-29-v05-phase3-ISSUE-067-结构化错因反馈.md)。
- **问题摘要**：多行乘法竖式中，最终积填写正确但部分积、合计过程格或小数训练格错误时，系统判错但统一失败面板只显示正确答案和解析，缺少“为什么答案对还没通过”的解释。
- **修复摘要**：新增结构化 `failureDetail`，多行乘法提交从裸 `boolean` 升级为结构化 payload；最终答案错仍走普通错答，过程格错显示类别，训练格错显示用户值 / 正确值；反馈面板与错题本复用 `getPracticeFailureDisplay()`，历史记录 UI 不展示错因；旧 `failureReason='vertical-process'` 数据保留 fallback。
- **关闭证据**：
  - `src/engine/verticalMultiplicationErrors.ts` / `.test.ts`：覆盖最终答案错、过程格错、训练格错、过程格 + 训练格同时错。
  - `src/utils/practiceFailureDisplay.ts` / `.test.ts`：覆盖旧数据 fallback、过程类别、训练格明细和空用户值展示。
  - `src/store/index.test.ts`、`src/sync/merge.test.ts`：`failureDetail` 可选字段在当前反馈、错题、历史和同步合并中保留。
  - `QA/e2e/phase3-decimal-training-failure.spec.ts`：小数乘法训练格错、最终答数对的浏览器端到端证据。
  - `QA/runs/2026-04-29-v05-phase3-input-feedback-qa/qa-summary.md`：Phase 3 QA 有条件通过；`ISSUE-067` 所需自动化与拟真人工证据通过。
  - `npm test -- --run`：59 files / 734 tests passed。
  - `npm run build`：通过，仅 Vite chunk size warning。
  - `npx playwright test`：13 tests passed。

### ISSUE-068 · 单行过程积乘法竖式要求重复填写答数（P2 · UX / 输入冗余）

- **状态**：✅ 已修复（2026-04-29，v0.5 Phase 3 小修）
- **来源**：2026-04-29 用户界面优化反馈；截图样例为 `90.8 × 5`。
- **类别**：UX / 输入冗余 / A03 竖式计算。
- **归位**：[`phases/phase-3.md`](phases/phase-3.md) · [`subplans/2026-04-29-v05-phase3-ISSUE-068-单行过程积乘法免重复答数.md`](subplans/2026-04-29-v05-phase3-ISSUE-068-单行过程积乘法免重复答数.md)。
- **问题摘要**：当乘法竖式只有一行过程积时，唯一过程积本身已经等同最终乘积，界面仍要求学生在下方合计 / 答数行原样再填一遍。
- **修复摘要**：新增乘法竖式计算行 helper；单行过程积场景不再渲染 `total` 行；提交时从唯一过程积行推导 `integer-final-answer`，单行过程积填错按普通最终答案错误处理；wrong-answer 无结构化错因时不渲染空的“未通过原因”块；多行部分积仍保留合计行。
- **关闭证据**：
  - `src/engine/verticalMultiplication.ts` / `.test.ts`：覆盖单行 partial 不返回 `total`、多行 partial 保留 `total`、final product row 来源。
  - `src/components/MultiplicationVerticalBoard.tsx`：单行过程积场景从唯一 partial 行推导最终整数乘积。
  - `src/engine/verticalMultiplicationErrors.ts` / `.test.ts`：空 `finalAnswerKeys` 不跳过最终答案判断，多 final key 返回第一条错误最终答案值。
  - `src/utils/practiceFailureDisplay.ts` / `.test.ts`、`src/pages/Practice.tsx`、`src/pages/WrongBook.tsx`：wrong-answer 不展示空错因块。
  - `QA/e2e/issue-068-single-partial-multiplication.spec.ts`：固定 `90.8 × 5` 验证无重复合计行、单行过程积填错按最终答案错误处理。
  - `QA/e2e/phase3-decimal-training-failure.spec.ts`：小数训练格错因回归按新规格通过。
  - `QA/runs/2026-04-29-v05-issue-068-single-partial-multiplication-qa/qa-summary.md`：L2 QA 通过。
  - `npm test -- --run`：59 files / 739 tests passed。
  - `npm run build`：通过，仅 Vite chunk size warning。
  - `npx playwright test`：15 tests passed。
  - scoped ESLint：exit 0。
  - `npm audit --audit-level=high`：found 0 vulnerabilities。
