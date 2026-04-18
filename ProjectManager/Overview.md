# math-quest 项目概览

> 最后更新：2026-04-18（**子计划 4 Umbrella 落盘并同日重排**——[`Plan/2026-04-18-subplan-4-next-stage-expansion.md`](Plan/2026-04-18-subplan-4-next-stage-expansion.md)；tsc 0 / vitest 328/328 / pm-sync-check 全绿；**当前阶段主计划** = [`Plan/2026-04-16-open-backlog-consolidation.md`](Plan/2026-04-16-open-backlog-consolidation.md)；**下一步** = 起草 A03 块B Plus 设计级 / 实施级规格（子计划 4 顺位 1，用户 2026-04-18 调整为"先闯关+进阶内容补强，段位赛最后"）。子计划 4 收敛为三块：A03+ → A09 → Phase 3；B/C/D 已移出，后续作独立"子计划 5 领域扩展 roadmap"（待立）。真题参考库补充 **合流**：A09 归子计划 4 Step 0；B/C/D 归未来子计划 5 Step 0）

---

## 项目目标

**产品**：数学大冒险（math-quest）— 面向上海五年级学生的游戏化数学练习应用

**核心问题**：现有生成器纯算法生成，缺乏真实考试校准，与实际考试题型脱节；游戏化包装缺乏整体规划，体验碎片化

**解决方案**：
1. 构建真题参考库（525题）+ 逐主题校准生成器
2. 全面重新设计游戏化体系（三层：闯关→进阶→段位赛）

**成功标准**：
1. A01-A08 八个核心主题生成器全部校准完成 ✅
2. 真题参考库达到 525 题（当前 312/525，59%）
3. 游戏化重新设计完成并实施（Q1~Q10 全部确认，**Phase 1 CR+QA 验收通过**）
4. P0 问题全部修复（见待解决问题）

**范围**：当前聚焦 A 领域（A01-A08 数与运算）；A09 分数、B 几何、C 应用题、D 统计待后续排期

---

## 当前进展

### 游戏化重设计

| 阶段 | 内容 | 状态 |
|------|------|------|
| 设计 Q1~Q10 | 游戏化规格确认（闯关/进阶/段位赛体系，心数门槛，段位数值） | ✅ 完成 |
| Phase 1 开发 | Foundation + 闯关系统（15 个 Task，tsc 0 错误，91 测试通过） | ✅ 开发完成 |
| Phase 1 CR+QA | Code Review 修复 2 Bug + 浏览器全量测试 48/48 PASS | ✅ 验收通过 |
| Phase 1 热修复+迭代 | 去年级区分、History入口、路线匹配修复、出题质量、难度标准化 | ✅ [全部完成](Plan/2026-04-14-phase1-hotfix-and-iteration.md) |
| Phase 1 深度体验 QA Batch 1 | 解锁链 / 退出弹窗 / 竖式板交互拟真人工 QA（14 PASS / 1 RISK） | ✅ [已完成](Plan/2026-04-14-phase1-deep-experience-manual-qa.md) |
| Phase 2 开发 | 进阶系统（心→星，难度自动调配） | ✅ 开发完成 |
| Phase 2 CR+QA | Code Review 17项 + 冒烟107条 + 可信44条深度QA | ✅ [冒烟](Reports/2026-04-15-full-qa-results.md) + [可信](Reports/2026-04-15-credible-qa-results.md) |
| Bug 修复 | CR-002 竖式浮点 + 进阶结算页无限重渲染 | ✅ 已修复并验证 |
| 视觉全量 QA | 86 条：颜色/字体/尺寸/布局/交互/可访问性/截图审视 | ✅ [报告](Reports/2026-04-15-visual-qa-results.md)（82 PASS / 4 FAIL）|
| 视觉修复回归 | 6 项修复验证：关卡宽度/边框/Progress留白/答题居中/庆祝动画/弹窗遮罩 | ✅ [报告](Reports/2026-04-15-regression-visual-results.md)（6/6 PASS）|
| P1+P2 修复 QA | CR + Vitest 167/167 + Playwright 16/16 PASS，0 新缺陷 | ✅ [报告](../test-results/phase2-p1p2-fixes/qa-result.md) |
| Phase 2 浏览器验收 | 进阶系统 A1-A6 全量验收：Vitest 167/167 + Playwright 31 条 30 PASS / 拟真 QA 10 条 9 PASS，0 新缺陷 | ✅ [报告](../test-results/phase2-advance-acceptance/qa-result.md) |
| P1 UI/a11y 批量修复 | ISSUE-022~024/028/032/034/035 共 7 项关闭：Playwright 19/19 PASS | ✅ [报告](../test-results/p1-ui-a11y-batch/qa-result.md) |
| Phase 3 | 段位赛系统（BO3/BO5/BO7） | ⬜ 下阶段 |

### UI 重设计（阳光版 v5）

| 阶段 | 内容 | 状态 |
|------|------|------|
| 视觉方向 | 阳光版 v5 批准：暖色系/平面/SVG图标/鼓励情绪（5轮迭代） | ✅ 批准 |
| Phase A | Token 替换 + 5 个基础组件（BottomNav/ProgressBar/Hearts/LoadingScreen/Dialog） | ✅ 完成 |
| Phase B | 页面级改造（Home/CampaignMap/Practice/SessionSummary/WrongBook/Progress 等全量） | ✅ 完成 |
| Phase C | 动效打磨（stagger 入场动画 + 推荐关卡跳动） | ✅ 完成 |
| Design Review | 设计系统合规审查（94% 合规），修复 DecimalTrainingGrid/Hearts/card border 等 | ✅ 完成 |
| WCAG AA 审查 | 无障碍审查，修复 CampaignMap 键盘/输入框 aria/skip-link/focus-visible 等 | ✅ 完成 |
| 浏览器实测 | 主路径 E2E 验收（新 UI 首次在真实浏览器中测试） | ✅ **完成**（0 JS 错误，截图存档）|

### 生成器模块

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 0~3 | A01-A08 全主题 P0/P1/P2 改进 | ✅ 全部完成 |
| A03 块A/B | 小数支持 + 竖式组件重构 | ✅ 完成 |

**当前状态**：A01-A08 生成器 v2.2 重写 + 梯度打分迭代完成，当前总测试 328/328 通过，构建成功

### 真题参考库

| 主题 | F | A | 合计 |
|------|---|---|------|
| A01 基础计算 | 21 | 15 | 36 |
| A02 数感估算 | 15 | 12 | 27 |
| A03 竖式笔算 | 22 | 16 | 38 |
| A04 运算律 | 20 | 15 | 35 |
| A05 小数运算 | 30 | 30 | 60 |
| A06 括号变换 | 18 | 13 | 31 |
| A07 简便计算 | 24 | 21 | 45 |
| A08 方程等式 | 23 | 17 | 40 |
| **合计** | **173** | **139** | **312/525 (59%)** |

---

## 待解决问题

完整清单见 [`ISSUE_LIST.md`](ISSUE_LIST.md)

### P0 — 全部关闭 ✅

### P1 — 全部关闭 ✅

### P2 — 生成器增强 ✅ 全部关闭
- **ISSUE-008** ✅ 新增 58 条三档覆盖测试（difficulty-tiers.test.ts）
- **ISSUE-009** ✅ 降级关闭（hints 字段 UI 未使用，属死数据）
- **ISSUE-010** ✅ formatNum 提取到 utils.ts，消除 4 处重复

### UI / 无障碍开放项 — 全部关闭 ✅（子计划 3，2026-04-18）
- **UI / 交互**：ISSUE-020、025、026、029、030、031 全部关闭（其中 020/026/029 由子计划 2 / 2.5 附带修复；025/030/031 由 B1 批次完成）
- **a11y / 体验**：ISSUE-037、038、041、042、043、045 全部关闭（038 由子计划 2 / 2.5 附带修复；045 浏览器抽测中发现 `index.html` 早已实现；043 由 B2 批次完成；037/041/042 由 B3 评估后关闭/降级关闭）

### 2026-04-16 试玩反馈（全部已修复）
- **ISSUE-046** ✅ 结算面板心数不更新（store/index.ts submitAnswer 同步 heartsRemaining）
- **ISSUE-047** ✅ 除法整除比例异常（difficulty 6-7: 40% 有余数；8+: 30% 有余数）
- **ISSUE-048** ✅ Boss 关无视觉差异（CampaignMap 火焰横幅 + danger 配色 + 120px 按钮）
- **ISSUE-049** ✅ Boss 关内容与综合挑战关雷同（Boss diff→9 题数→25；S3-L3→8；S2-L3→6）
- **ISSUE-050** ✅ 进阶/段位赛对新用户不可见（Home 始终显示进阶入口，未解锁呈锁定态）
- **ISSUE-051** ✅ 关卡难度梯度缺失（并入 ISSUE-049 处理）
- **ISSUE-052** ✅ 进度圆点挤压心数（>15 题改为数字 N/M）
- **ISSUE-053** ✅ 关卡地图未自动滚到当前关（scrollIntoView + 300ms 延迟）
- **ISSUE-054** ✅ 算式折行（whitespace-nowrap + 动态字号）
- **ISSUE-055** ✅ 余数框获焦页面跳动（focus preventScroll: true）
- **ISSUE-017** ✅ 竖式退位提示（首次进入竖式题显示脉冲提示）

### UI / 无障碍审查跟踪

| 类别 | 条目 | 状态 |
|------|------|------|
| 已关闭 | ISSUE-018、019、021~024、027、028、032~036、039、040、044 | ✅ 已关闭 |
| 已关闭（子计划 3，2026-04-18） | ISSUE-020、025、026、029、030、031、037、038、041、042、043、045 | ✅ 全部关闭或降级关闭 |

---

## 后续待办

**当前阶段主计划**：[`Plan/2026-04-16-open-backlog-consolidation.md`](Plan/2026-04-16-open-backlog-consolidation.md)（2026-04-18 刷新）  
**已完成子计划**：
- [`Plan/2026-04-17-campaign-advance-stabilization.md`](Plan/2026-04-17-campaign-advance-stabilization.md) — 闯关+进阶模式稳定化 ✅（2026-04-18）
- [`Plan/2026-04-18-ui-consistency-cleanup.md`](Plan/2026-04-18-ui-consistency-cleanup.md) — UI 一致性与代码整洁清理 ✅（2026-04-18）

**进行中子计划**：
- [`Plan/2026-04-18-subplan-4-next-stage-expansion.md`](Plan/2026-04-18-subplan-4-next-stage-expansion.md) — 子计划 4 Umbrella（下阶段扩展总纲）🟡 Umbrella 落盘并重排，三块 = A03+ → A09 → Phase 3；**顺位 1 = A03 块B Plus 设计级 / 实施级规格待起草**；B/C/D 已从本 Umbrella 移出

**下一步**：起草 A03 块B Plus 设计级规格 `Specs/2026-04-XX-a03-block-b-plus-design.md` + 实施级相关字段（不动代码，三层落盘纪律——规格 → 实施子子计划 → 代码）

### 已完成阶段

| 优先级 | 事项 | 状态 |
|--------|------|------|
| ~~P1~~ | Phase 2 浏览器验收 | ✅ |
| ~~P1~~ | 高优先级 UI/a11y 修复 | ✅ |
| ~~P1~~ | 生成器质量补强 ISSUE-008~010 | ✅ |
| ~~P1~~ | 生成器 v2.2 系统性重写 | ✅ |
| ~~P0~~ | v2.2 稳定化 S1 阻塞级 | ✅ |
| ~~P1~~ | v2.2 稳定化 S2 重要 bug | ✅ |
| ~~P1~~ | v2.2 稳定化 S3 深度体验 QA（含 S3-T1 梯度打分）| ✅ |
| ~~P1~~ | v2.2 稳定化 S4 进阶专项 | ✅ |
| ~~P2~~ | UI 一致性清理（子计划 3，12 项 UI/a11y ISSUE）| ✅ |

### 当前暂缓（2026-04-18 评估 + 同日重排补充）

| 优先级 | 事项 | 状态 | 说明 |
|--------|------|------|------|
| P2 | 真题参考库补充（312/525，差 213）| 暂缓，**拆分到两个子计划**的 Step 0 | 缺口 213 题落在 A09 + B/C/D 六个主题，这些主题生成器尚未开发。**子计划 4 范围内只涉及 A09**：开工时 Step 0 提 30-35 题 A09 真题。**B/C/D 已从子计划 4 移出**，归未来子计划 5（领域扩展 roadmap，待立）——B01/B02/C01/C02/D01 各主题启动时各自 Step 0 提 30-35 题。A01-A08 已 312 题且生成器已 v2.2 稳定，再补的边际校准价值有限。 |

### 下阶段：新功能扩展（归属 [子计划 4 Umbrella](Plan/2026-04-18-subplan-4-next-stage-expansion.md)，2026-04-18 同日重排）

| 顺位 | 事项 | 状态 | 说明 |
|------|------|------|------|
| 1 | **A03 块B Plus** | 🟡 设计级 / 实施级规格待起草 | 竖式题型深化（乘法部分积、除法试商）；**对现有闯关+进阶模式的内容补强**；风险最小 |
| 2 | A09 分数运算生成器 | ⬜ 等顺位 1 闭环 | 全新题型但进入现有闯关+进阶模式；开工 Step 0 先提 30-35 题真题；为段位赛补题库多样性 |
| 3 | Phase 3 段位赛 | ⬜ 等顺位 2 闭环 | BO3/BO5/BO7；**全新模式**，补齐三层游戏化闭环；规格最齐（`2026-04-10 gamification-redesign §5` + `2026-04-13 star-rank-numerical-design`），仅差实施级 Specs；启动前置 = A03+ / A09 闭环 |

> **B/C/D 领域扩展**（几何 / 应用题 / 统计）—— **已从子计划 4 移出**，后续作为独立"**子计划 5 领域扩展 roadmap**"（待立）承载。原因：B/C/D 是新领域而非"闯关+进阶的内容补强"；规模属多季度工程。每领域独立 Plan；每主题开工 Step 0 先提 30-35 题真题。
