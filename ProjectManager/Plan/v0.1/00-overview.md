# v0.1 版本收口快照

> 所属版本：v0.1（原型，已发布）
> 收口日期：2026-04-19（Phase 3 段位赛主线完成并入仓；开新号全量 QA 复跑全绿）
> 检查点：`master@977933e`（`更新全量回归测试结果与问题修复记录`）
> 本文件角色：v0.1 完工时从 `ProjectManager/Overview.md` 抽取的**快照**，保留版本结束瞬间的详细状态记录。Overview.md 在 v0.2 启动时已切换为下一版本的活跃视图。

---

## 版本范围

**产品**：数学大冒险（math-quest），面向上海五年级学生的游戏化数学练习应用。

**v0.1 阶段目标**：建立真题校准的生成器底座，并完成**三层游戏化闭环**（闯关 → 进阶 → 段位赛）。

**本版本不做**：A03+、A09、B/C/D 领域

---

## Phase 1 — 闯关系统（Foundation + CampaignMap）

**范围**：移除旧 XP 体系；新建 `GameProgress` / `CampaignMap` / Heart 体系类型与 Store/Repository；搭建 8 题型闯关地图。

**状态**：✅ 开发完成，浏览器验收通过。

**核心 Plan**：[2026-04-13-gamification-phase1-foundation-campaign.md](2026-04-13-gamification-phase1-foundation-campaign.md)

**附带 Phase 1 优化迭代**：
- [2026-04-14-phase1-hotfix-and-iteration.md](2026-04-14-phase1-hotfix-and-iteration.md) — 去年级区分、History 入口、路线匹配修复、出题质量、难度标准
- [2026-04-14-phase1-deep-experience-manual-qa.md](2026-04-14-phase1-deep-experience-manual-qa.md) — 深度体验拟真 QA
- [2026-04-16-p1p2-fixes.md](2026-04-16-p1p2-fixes.md) — 试玩反馈 11 项修复（心数 bug / Boss 视觉内容差异化 / 进阶引导 / 难度梯度 / 除法整除比例 / Practice UI / VerticalCalcBoard 焦点与退位提示）

---

## Phase 2 — 进阶系统（心→星，难度自动调配）

**范围**：T1-T15 + A1-A6 全部实施；星级体系、心数门槛、`TOPIC_STAR_CAP` 硬约束（A01/A04/A08 为 3★ 2 梯度，其余 5★ 3 梯度）。

**状态**：✅ 开发完成 + 浏览器验收通过（2026-04-16 QA Leader 全量流程，Vitest 167/167 + Playwright 30/31 + 拟真 QA 9/10，0 新缺陷）

**核心 Plan**：[2026-04-15-gamification-phase2-implementation.md](2026-04-15-gamification-phase2-implementation.md)

---

## Phase 3 — 段位赛系统（BO3/BO5/BO7 五段位闭环）

**主 Plan**：[2026-04-18-rank-match-phase3-implementation.md](2026-04-18-rank-match-phase3-implementation.md)
**实施级规格**：`../../Specs/2026-04-18-rank-match-phase3-implementation-spec.md`

### 三层落盘

- Umbrella Plan：[2026-04-18-subplan-4-next-stage-expansion.md](2026-04-18-subplan-4-next-stage-expansion.md)
- 实施级 Spec：`../../Specs/2026-04-18-rank-match-phase3-implementation-spec.md`
- 实施子子计划：[2026-04-18-rank-match-phase3-implementation.md](2026-04-18-rank-match-phase3-implementation.md)

### M1 已完工（2026-04-19）

类型层 + 常量层 + `entry-gate.ts` 纯函数入场校验 + `match-state.ts` BO 状态机（含 §7.4 提前结束强制）+ `repository/local.ts` 迁移链（v2→v3，项目级原则落地）+ 段位赛最小 store。6 条项目级硬约束全部核验通过。

### M2 已完工（2026-04-19，同日收口）

抽题器（`question-picker.ts` 胜场游标 + 三桶分配 + 难度配额 + 交错混合）+ 自检钩子（`picker-validators.ts` 覆盖 Spec §5.7 五类硬约束）+ 段位赛答题流驳接（`store/index.ts::startRankMatchGame` 预生成题序；`endSession` 的 rank-match 分支调用 `handleGameFinished` 并通过新字段 `lastRankMatchAction` 供 UI 路由）。Spec §5.8 校验失败走 `PickerValidationError`，不允许静默降级。

### M2 遗留补做已完工（2026-04-19 同日独立 session）

- `ISSUE-060`（P1）段位赛单局中途刷新恢复 —— 方案 A 变体 A2：`PracticeSession.rankQuestionQueue` + `mq_rank_match_sessions` 独立 key，分层恢复入口 `loadActiveRankMatch` + `resumeRankMatchGame`，一致性异常一律抛 `RankMatchRecoveryError` + 清 `activeSessionId`（Spec §5.8）
- `ISSUE-061`（P2）复习题错题频次加权 —— `distributeReviewTopics` 纯函数（窗口 N=50，保底 1 道/主题 + 余量原始错题次数最大余数法分配）
- M3 UI 作用域零触碰，UI 接入入口通过 store 方法暴露

### M3 已完工（2026-04-19）

UI 三页（`RankMatchHub` / `RankMatchGameResult` / `RankMatchResult`）+ `RankBadge` 组件 + 三条路由注册（`useUIStore.currentPage`，Spec §8.3）+ `globals.css` 段位徽章色 CSS 变量（`--rank-*`，Spec §8.4）+ `Home.tsx` 独立段位赛入口卡片（活跃赛事/缺口提示/入场引导三态）+ `Practice.tsx` BO 进度徽标 + `endSession` 后路由到单局结算页 + 刷新恢复双层接入（`App.tsx` `loadActiveRankMatch` / `Practice.tsx` `resumeRankMatchGame`）。`RankMatchRecoveryError` 全链路显式路由回 Hub，无静默降级（Spec §5.8）。

### M4 代码闭环已完成（2026-04-19）

M3 完工后首次 `npm run build` 暴露 5 个 build-only 报错（`tsc --noEmit` 不覆盖的 `erasableSyntaxOnly` 路径 + 未用 import），按用户决策归入 M4 验证项一并处理；拟真 QA 阶段以 Playwright 自写 E2E（`test-results/phase3-rank-match/m4-e2e.mjs`）走完整用户旅程，**22 条用例 / 0 FAIL / 0 RISK**，覆盖主路径（学徒→新秀 BO3 两连胜晋级）+ 失败复盘（连败走 MatchResult + 薄弱题型前 3）+ 刷新恢复（G-01 / G-03）；E2E 过程暴露并当场修复两个 P1 bug：`ISSUE-062`（Practice 早退位于 hooks 之前违反规则）、`ISSUE-063`（`startRankMatchGame` 找不到下一局 placeholder）。

四栏报告：`test-results/phase3-rank-match/m4-user-qa-report.md`

### 2026-04-19 开新号全量回归（复跑全绿）

`ISSUE-064` 修复后再次执行 `QA/runs/2026-04-19-full-regression/full-regression.mjs`。
- Fresh 10/10 PASS
- Advance 6/6 PASS
- Rank 9/9 PASS
- `D-07` 已恢复为"刷新后直达当前 `Practice`"
- `D-08` 继续保持 PASS
- `console critical total: 0`

---

## 附带的生成器 v2.2 重做 + 稳定化（v0.1 后期迭代）

v0.1 后期阶段主计划 [2026-04-16-open-backlog-consolidation.md](2026-04-16-open-backlog-consolidation.md) 承接了以下子计划：

- [2026-04-17-generator-redesign-v2-implementation.md](2026-04-17-generator-redesign-v2-implementation.md) — 生成器题型设计 v2.2 实施（A01~A08 重写 + 陷阱体系 + 答题形式重做；5 阶段 + 阶段 6 二轮修订全部完成）
- [2026-04-17-campaign-advance-stabilization.md](2026-04-17-campaign-advance-stabilization.md) — 子计划 2.5 闯关+进阶稳定化（S1 阻塞级 → S4 进阶专项验收）
- [2026-04-18-ui-consistency-cleanup.md](2026-04-18-ui-consistency-cleanup.md) — 子计划 3 UI 一致性与代码整洁清理（12 项 ISSUE 全部关闭或降级关闭）
- [2026-04-16-generator-difficulty-recalibration.md](2026-04-16-generator-difficulty-recalibration.md) — 生成器难度分档重审

---

## 工程基线（v0.1 收口瞬间）

- `npm run build`：绿
- `vitest`：**473/473 PASS**
- `npm run lint`：127 条 error，属于现有基线债务，如实记录在全量 QA 自动化报告中
- 精确检查点：`master@977933e`

---

## v0.1 收口时的遗留开放项（已迁入 Backlog）

v0.1 收口瞬间仍开放的条目已统一迁入 `../../Backlog.md`，保留原 ISSUE ID：

- `ISSUE-059`（P2 · 实现一致性）—— `dec-div` 高档残留隐藏 `trainingFields`；不阻塞 Phase 3，维持低优先级
- 晋级动画遗留（M3 设计审查 m-3 漏网）—— 按用户决策不进 ISSUE_LIST，上线后按真实反馈评估
- "本地用户数据存档 / 账号系统前置数据模型" —— v0.1 收口时未立为主线，顺延到后续版本评估

---

## 相关资产入口

- **v0.1 期间全部已关闭 issue**：[`issues-closed.md`](./issues-closed.md)（ISSUE-001~064 含历史关闭记录）
- **生效规格索引**：`../../Specs/_index.md`
- **真题参考库**：`../../../reference-bank/README.md`
- **人工验证题库**：`../../human-verification-bank-v2.md`
