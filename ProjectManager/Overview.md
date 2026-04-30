# math-quest 项目概览

> 最后更新：2026-04-30（Phase 4 `BL-010` UI 审核稿已按用户确认收口；下一步进入正式代码实现）
> 角色：**活跃控制面 / 总管**。本文件只保留项目背景、版本轴、当前阶段目标、当前主线、当前状态、下一步和入口链接；细节下放到对应专人文档或版本归档。

---

## 项目背景

**产品**：数学大冒险（math-quest），面向上海五年级学生的游戏化数学练习应用。

**长期问题**：

- 题目生成不能只靠算法随机，需要用真实考试材料校准
- 游戏化不能只做 UI 包装，需要形成完整的长期练习闭环

**长期路线**：

1. 用真题参考库校准生成器质量
2. 完成三层游戏化闭环：闯关 → 进阶 → 段位赛
3. 基于真实用户反馈持续打磨体验与能力训练设计

**当前范围**：聚焦 A 领域（A01-A08 数与运算）；A09、B、C、D 暂不在本阶段范围内。

---

## 版本轴

| 阶段 | 版本 | 状态 | 入口 |
|---|---|---|---|
| **当前版本** | **v0.5** | 🟡 Phase 3 有条件完成，全量 QA 通过（Phase 1~3 L3 全量测试 44 PASS / 0 FAIL；真实设备证据发布后线上补验；Phase 4 `BL-010` Q1-Q7 已补齐，UI 审核稿已按 2026-04-30 用户确认收口，可进入 coding） | [Plan/v0.5/](Plan/v0.5/) |
| 上一版本 | v0.4 | ✅ 已发布（题目体验系统性修复；release gate 补测通过） | [Plan/v0.4/](Plan/v0.4/) |
| 更早版本 | v0.3 | ✅ 已上线（账号同步系统生效；管理配套文档已重建） | [Plan/v0.3/](Plan/v0.3/) |
| 更早版本 | v0.2 | ✅ 已收工（2026-04-23；`qa-leader` 三层 QA 完成） | [Plan/v0.2/](Plan/v0.2/) |
| 更早版本 | v0.1 | ✅ 已发布（2026-04-19 收口，三层游戏化闭环完成） | [Plan/v0.1/](Plan/v0.1/) |

> 版本命名见 [Plan/rules/phase-and-subplan-naming.md](Plan/rules/phase-and-subplan-naming.md)，版本生命周期规则见 [Plan/version-lifecycle.md](Plan/version-lifecycle.md)。本文件只呈现当前版本活跃信息；历史版本请进入对应 `Plan/vX.Y/` 目录。

---

## 当前阶段（v0.5）

**阶段目标**：完成 A03 竖式体验与输入系统升级，覆盖闯关竖式题样本质量诊断、计算输入内置键盘、错因反馈补强和竖式除法 UI 化答题。

**主线**：A03 竖式体验与输入系统（5 Phase：开工对齐与架构启动门 → 竖式题样本质量诊断 → 输入与反馈基础设施 → 竖式除法 UI 化答题 → Release Gate 与 Living Spec 回写）。

**当前状态**：

- ✅ v0.5 版本管理包已建立：`README + 00-04 + phases/phase-1..4`
- ✅ v0.5 预研结论已汇总，入口见 [`Plan/v0.5/01-research-catalog.md`](Plan/v0.5/01-research-catalog.md)
- ✅ `BL-009`、`BL-011`、`BL-010` 已纳入 v0.5
- ✅ `ISSUE-067` 已随 v0.5 Phase 3 修复并关闭，归档见 [`Plan/v0.5/issues-closed.md`](Plan/v0.5/issues-closed.md)
- ✅ `BL-012` 已从 v0.5 拆出，改由 v0.6 承接；v0.6 版本包待启动
- ✅ Phase 1 已完成：开工对齐、产品 / 体验决策 P1~P5、技术 ownership、类型/API、UI 容量与 QA 映射已确认，入口见 [`Plan/v0.5/subplans/2026-04-28-v05-phase1-开工对齐与跨phase边界.md`](Plan/v0.5/subplans/2026-04-28-v05-phase1-开工对齐与跨phase边界.md)
- ✅ Phase 2 已完成：`BL-009` 竖式题样本质量诊断、过滤规则、生成器实现、实施后复测和 current spec 回写已完成。入口见 [`Plan/v0.5/phases/phase-2.md`](Plan/v0.5/phases/phase-2.md) · [`Plan/v0.5/subplans/2026-04-28-v05-phase2-BL-009-竖式题样本质量诊断与过滤规则.md`](Plan/v0.5/subplans/2026-04-28-v05-phase2-BL-009-竖式题样本质量诊断与过滤规则.md)
- 🟡 Phase 3 有条件完成：`BL-011` 内置键盘、自动换格统一化与 `ISSUE-067` 结构化错因反馈已实现，QA 见 [`../QA/runs/2026-04-29-v05-phase3-input-feedback-qa/qa-summary.md`](../QA/runs/2026-04-29-v05-phase3-input-feedback-qa/qa-summary.md) 与 [`../QA/runs/2026-04-29-v05-phase3-keyboard-autofocus-qa/qa-summary.md`](../QA/runs/2026-04-29-v05-phase3-keyboard-autofocus-qa/qa-summary.md)。入口见 [`Plan/v0.5/phases/phase-3.md`](Plan/v0.5/phases/phase-3.md) · [`Plan/v0.5/subplans/2026-04-29-v05-phase3-BL-011-计算输入内置键盘.md`](Plan/v0.5/subplans/2026-04-29-v05-phase3-BL-011-计算输入内置键盘.md) · [`Plan/v0.5/subplans/2026-04-29-v05-phase3-BL-011-自动换格统一化.md`](Plan/v0.5/subplans/2026-04-29-v05-phase3-BL-011-自动换格统一化.md) · [`Plan/v0.5/subplans/2026-04-29-v05-phase3-ISSUE-067-结构化错因反馈.md`](Plan/v0.5/subplans/2026-04-29-v05-phase3-ISSUE-067-结构化错因反馈.md)
- 🟡 Phase 3 剩余条件：真实 Android Chrome / iOS Safari 默认内置键盘证据发布后在线上环境验收，清单见 [`../QA/runs/2026-04-29-v05-phase3-input-feedback-qa/real-device-checklist.md`](../QA/runs/2026-04-29-v05-phase3-input-feedback-qa/real-device-checklist.md)
- ✅ v0.5 Phase 1~3 全量 QA 通过：L3 级 46 项用例，Vitest 59 files / 743 tests、Playwright 23 tests、build、npm audit 全部通过；Code Review PASS-WITH-NOTES；视觉 QA 12 截图 25 校验点 PASS。入口见 [`../QA/runs/2026-04-29-v05-full-regression/qa-summary.md`](../QA/runs/2026-04-29-v05-full-regression/qa-summary.md)
- 🟡 `ISSUE-069` 已纳入 v0.5 Release Gate 前小修：A02 `reverse-round` 填空题答案口径冲突，作为 P1 correctness hotfix 处理，不并入 Phase 4 `BL-010` 竖式除法 UI 主线
- 🟡 Phase 4 `BL-010` 子计划 Q1-Q7 已补齐，UI 审核稿已按 2026-04-30 用户确认收口：[`Plan/v0.5/phases/phase-4.md`](Plan/v0.5/phases/phase-4.md) · [`Plan/v0.5/subplans/2026-04-29-v05-phase4-BL-010-竖式除法UI化答题.md`](Plan/v0.5/subplans/2026-04-29-v05-phase4-BL-010-竖式除法UI化答题.md) · [`Plan/v0.5/subplans/2026-04-29-v05-phase4-BL-010-竖式除法UI审核稿.md`](Plan/v0.5/subplans/2026-04-29-v05-phase4-BL-010-竖式除法UI审核稿.md)
- ⏭️ 下一步：进入 `BL-010`（竖式除法 UI 化答题功能）正式代码实现；实现完成后按 Phase 4 L2 QA 与 Living Spec 回写流程收口

**入口**：

- 版本入口：[`Plan/v0.5/README.md`](Plan/v0.5/README.md)
- 启动快照：[`Plan/v0.5/00-overview.md`](Plan/v0.5/00-overview.md)
- 预研结论：[`Plan/v0.5/01-research-catalog.md`](Plan/v0.5/01-research-catalog.md)
- Phase 总图：[`Plan/v0.5/03-phase-plan.md`](Plan/v0.5/03-phase-plan.md)
- 当前开放 issue：[`ISSUE_LIST.md`](ISSUE_LIST.md)
- Backlog 来源：[`Backlog.md`](Backlog.md)

---

## 上一版本收口（v0.4）

**阶段目标**：系统性修复题目体验问题，落地 4.25 真实用户反馈，并清理 v0.2 遗留技术债。

**主线**：题目体验系统性修复（5 Phase：渲染与判定修复 → 题型信息架构 → 题目质量与生成器诊断 → 交互设计与教学引导 → Practice 工程质量）。

**当前状态**：

- ✅ v0.4 预研报告已完成，入口见 [`Reports/2026-04-25-v0.4-prereport.md`](Reports/2026-04-25-v0.4-prereport.md)
- ✅ v0.4 版本管理包已建立：`README + 00-04 + phases/phase-1..5`
- ✅ `BL-003` ~ `BL-008` 已纳入 v0.4 并在版本收口时移入 Backlog 已落地归档
- ✅ Phase 1 已完成：多位整数乘法竖式、小数乘法复用、小数答案等价、竖式可读性、`ISSUE-059` 修复
- ✅ Phase 1 QAleader 三层 QA 已完成；QA run 原始结果按制度不入库，结论已回写到 Phase 1 计划与子计划
- ✅ Phase 2 已完成：A04「运算律」/ A06「括号变换」取消玩家独立入口并从新主链路断联；相关能力迁入 A07「简便计算」低档知识点 lane；`npm test -- --run` 48/48 files、672/672 tests 通过，`npm run build` 通过，浏览器拟真验收通过
- ✅ Phase 3 已完成：题目质量与生成器诊断入口见 [`Plan/v0.4/phases/phase-3.md`](Plan/v0.4/phases/phase-3.md)；A03 `difficulty=4-5 + int-mul` 的 `2位数 × 2位数` 分布达标，A03 进阶 3★ 短除候选降为 0，A02 compare 质量优化完成，session 内完全重复治理已覆盖 campaign / advance / rank-match；QAleader v2 已按风险驱动、规格追踪、统计抽样与拟真人工 oracle 补强并通过，记录见 [`../QA/runs/2026-04-26-v04-phase3-question-quality-v2/qa-summary.md`](../QA/runs/2026-04-26-v04-phase3-question-quality-v2/qa-summary.md)
- ✅ v0.4 收口时开放 issue 数为 0；`ISSUE-065` 单行竖式已知操作数低对比已修复并通过视觉补测；`ISSUE-066` 竖式输入双入口导致 `0` 跨格重复消费与退位格输入心智不清已通过 v0.4 hotfix 修复
- ✅ Phase 4 已完成：进位/退位格三档规则采用策略判定器方案；低档默认跳格纳入进位/退位格且过程错不通过并进入错题本，中档只在统一结果 UI 给当前题过程提示，高档不显示过程格；compare tip 已用可控题对象与 dev hook 浏览器补证通过；A03 current spec 已回写。入口见 [`Plan/v0.4/subplans/2026-04-26-phase4-进位退位格规则与compare-tip补证.md`](Plan/v0.4/subplans/2026-04-26-phase4-进位退位格规则与compare-tip补证.md) · [`Specs/a03-vertical-calc/current.md`](Specs/a03-vertical-calc/current.md)
- ✅ Phase 5 已完成：`BL-004` Practice 状态重置采用纯初始化函数 + reducer + `usePracticeInputState()` hook 落地；换题 reset 与首输入聚焦已收敛进 hook，TDD、全量 test/build、Playwright 与 QAleader 三层 QA 通过。入口见 [`Plan/v0.4/subplans/2026-04-26-phase5-Practice状态重置启动准备.md`](Plan/v0.4/subplans/2026-04-26-phase5-Practice状态重置启动准备.md) · [`../QA/runs/2026-04-26-v04-phase5-practice-reset/qa-summary.md`](../QA/runs/2026-04-26-v04-phase5-practice-reset/qa-summary.md)
- ✅ v0.4 Release Gate 已通过（补测后），入口见 [`../QA/runs/2026-04-26-v04-release-gate/qa-summary.md`](../QA/runs/2026-04-26-v04-release-gate/qa-summary.md)
- ✅ v0.4 hotfix 已完成：竖式板输入改为单一字符入口，退位格支持 `1 -> 退1` 语义输入；QA 见 [`../QA/runs/2026-04-26-v04-hotfix-vertical-input/qa-summary.md`](../QA/runs/2026-04-26-v04-hotfix-vertical-input/qa-summary.md)
- ✅ Living Spec 正式试行验收通过，入口见 [`Reports/2026-04-26-current-spec文档流试点工作结果报告.md`](Reports/2026-04-26-current-spec文档流试点工作结果报告.md)
- ✅ v0.4 已发布到 GitHub Pages：[`https://wisalu1983-cell.github.io/math-quest/`](https://wisalu1983-cell.github.io/math-quest/)

**入口**：

- 版本入口：[`Plan/v0.4/README.md`](Plan/v0.4/README.md)
- 启动快照：[`Plan/v0.4/00-overview.md`](Plan/v0.4/00-overview.md)
- 来源证据：[`Plan/v0.4/01-research-catalog.md`](Plan/v0.4/01-research-catalog.md)
- Phase 总图：[`Plan/v0.4/03-phase-plan.md`](Plan/v0.4/03-phase-plan.md)
- 当前开放 issue：[`ISSUE_LIST.md`](ISSUE_LIST.md)
- Backlog 来源：[`Backlog.md`](Backlog.md)

**后续入口**：v0.4 已归档；后续新需求从当前版本 v0.5 进入。

---

## 更早版本（v0.3）

**收口结论**：v0.3 已完成账号同步系统并上线。

**收口事实**：

- ✅ Phase 1（基建 + 认证）、Phase 2（同步引擎）、Phase 3（UI + 验收）全部完成
- ✅ 真实 Supabase 8 个验收剧本通过，记录见 [`Plan/v0.3/phases/phase-3-acceptance.md`](Plan/v0.3/phases/phase-3-acceptance.md)
- ✅ v0.3 账号同步 scoped QAleader 三层回归已于 2026-04-25 补跑通过，记录见 [`../QA/runs/2026-04-25-v0.3-account-sync-regression/qa-summary.md`](../QA/runs/2026-04-25-v0.3-account-sync-regression/qa-summary.md)
- ✅ v0.3 已发布到 GitHub Pages：主干 commit `f34dc38`，线上地址 [`https://wisalu1983-cell.github.io/math-quest/`](https://wisalu1983-cell.github.io/math-quest/)
- ✅ v0.3 管理配套文档 `00-04` 已于 2026-04-25 重建，入口见 [`Plan/v0.3/README.md`](Plan/v0.3/README.md)

---

## 历史版本提示

- v0.2 已于 2026-04-23 收工，正式收口报告见 [`QA/runs/2026-04-23-v0.2-full-regression/qa-summary.md`](../QA/runs/2026-04-23-v0.2-full-regression/qa-summary.md)
- v0.1 已于 2026-04-19 收口，三层游戏化闭环完成

---

## 权威入口

### 版本活跃入口

- 当前版本根目录：[Plan/v0.5/](Plan/v0.5/)
- 当前版本入口：[Plan/v0.5/README.md](Plan/v0.5/README.md)
- 当前版本启动快照：[Plan/v0.5/00-overview.md](Plan/v0.5/00-overview.md)
- 当前版本预研结论：[Plan/v0.5/01-research-catalog.md](Plan/v0.5/01-research-catalog.md)
- 当前版本 Phase 总图：[Plan/v0.5/03-phase-plan.md](Plan/v0.5/03-phase-plan.md)
- 当前 Phase 1 开工对齐：[Plan/v0.5/subplans/2026-04-28-v05-phase1-开工对齐与跨phase边界.md](Plan/v0.5/subplans/2026-04-28-v05-phase1-开工对齐与跨phase边界.md)
- 已完成 Phase 2 入口：[Plan/v0.5/phases/phase-2.md](Plan/v0.5/phases/phase-2.md)
- 已完成 Phase 2 `BL-009` 样本质量诊断与过滤规则：[Plan/v0.5/subplans/2026-04-28-v05-phase2-BL-009-竖式题样本质量诊断与过滤规则.md](Plan/v0.5/subplans/2026-04-28-v05-phase2-BL-009-竖式题样本质量诊断与过滤规则.md)
- 已完成 Phase 3 入口：[Plan/v0.5/phases/phase-3.md](Plan/v0.5/phases/phase-3.md)
- 已完成 Phase 3 `BL-011` 内置键盘：[Plan/v0.5/subplans/2026-04-29-v05-phase3-BL-011-计算输入内置键盘.md](Plan/v0.5/subplans/2026-04-29-v05-phase3-BL-011-计算输入内置键盘.md)
- 已完成 Phase 3 `BL-011` 自动换格统一化：[Plan/v0.5/subplans/2026-04-29-v05-phase3-BL-011-自动换格统一化.md](Plan/v0.5/subplans/2026-04-29-v05-phase3-BL-011-自动换格统一化.md)
- 已完成 Phase 3 `ISSUE-067` 结构化错因反馈：[Plan/v0.5/subplans/2026-04-29-v05-phase3-ISSUE-067-结构化错因反馈.md](Plan/v0.5/subplans/2026-04-29-v05-phase3-ISSUE-067-结构化错因反馈.md)
- 已完成 Phase 3 `ISSUE-068` 单行过程积乘法免重复答数：[Plan/v0.5/subplans/2026-04-29-v05-phase3-ISSUE-068-单行过程积乘法免重复答数.md](Plan/v0.5/subplans/2026-04-29-v05-phase3-ISSUE-068-单行过程积乘法免重复答数.md)
- Phase 4 入口：[Plan/v0.5/phases/phase-4.md](Plan/v0.5/phases/phase-4.md)
- Phase 4 `BL-010` 竖式除法 UI 化答题：[Plan/v0.5/subplans/2026-04-29-v05-phase4-BL-010-竖式除法UI化答题.md](Plan/v0.5/subplans/2026-04-29-v05-phase4-BL-010-竖式除法UI化答题.md)

### 全局管理入口

- 开放问题权威源：[ISSUE_LIST.md](ISSUE_LIST.md)
- 未激活候选 / 延期条目：[Backlog.md](Backlog.md)
- 计划索引 / 规则入口 / 模板入口：[Plan/README.md](Plan/README.md)
- 规格导航总索引：[Specs/_index.md](Specs/_index.md)
- 复盘 / 历史机制记录：[Reports/](Reports/)

### 历史版本

- v0.4 版本归档：[Plan/v0.4/](Plan/v0.4/)（[README](Plan/v0.4/README.md) · [收口快照](Plan/v0.4/00-overview.md) · [Release Gate](../QA/runs/2026-04-26-v04-release-gate/qa-summary.md)）
- v0.3 版本归档：[Plan/v0.3/](Plan/v0.3/)（[README](Plan/v0.3/README.md) · [收口快照](Plan/v0.3/00-overview.md) · [真实 Supabase 验收](Plan/v0.3/phases/phase-3-acceptance.md)）
- v0.2 版本归档：[Plan/v0.2/](Plan/v0.2/)（[README](Plan/v0.2/README.md) · [收口快照](Plan/v0.2/00-overview.md) · [QA 总结](../QA/runs/2026-04-23-v0.2-full-regression/qa-summary.md)）
- v0.1 版本归档：[Plan/v0.1/](Plan/v0.1/)（[README](Plan/v0.1/README.md) · [收口快照](Plan/v0.1/00-overview.md) · [已关闭 issue](Plan/v0.1/issues-closed.md)）

### 低频扩展

- 人工验证题库：[human-verification-bank-v2.md](human-verification-bank-v2.md)
- QA 产物：[QA/](QA/)
- 真题参考库：[../reference-bank/README.md](../reference-bank/README.md)
