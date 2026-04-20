# math-quest 项目概览

> 最后更新：2026-04-20（v0.2-1-1 F3 开发者工具栏子计划 4 步工作流完成，进入实施）
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
| **当前版本** | **v0.2** | 📋 规划包已落盘，等待启动 Phase 1 | [Plan/v0.2/](Plan/v0.2/) |
| 上一版本 | v0.1 | ✅ 已发布（2026-04-19 收口，三层游戏化闭环完成） | [Plan/v0.1/](Plan/v0.1/) |

> 版本命名与归档规则见 [Plan/README.md](Plan/README.md) §版本归档规则。本文件只呈现当前版本活跃信息；历史版本请进入对应 `Plan/vX.Y/` 目录。

---

## 当前阶段（v0.2）

**阶段目标**：把 2026-04-20 收到的一批深度体验反馈（13 条）整体作为主线，从"清现网可感知体验问题"、"回到题型教育设计层面重梳理"、"补齐游戏化反馈与长期回顾能力"三个方向推进，并顺带建一套可用的开发者工具栏降低人工验证成本。

**当前主线**：用户反馈驱动主线（5 个 Phase：Phase 1 效率基建+低成本修复 → Phase 2 三项合并短诊断 → Phase 3 诊断结论执行 → Phase 4 题型教育设计重梳理 → Phase 5 历史答题记录）。

**当前状态**：

- 进行中 · **Phase 1 · `v0.2-1-1` F3 开发者工具栏**（4 步工作流已走完，进入实施）
- 方案定稿：[`Specs/dev-tool-panel/2026-04-20-design-proposal.md`](Specs/dev-tool-panel/2026-04-20-design-proposal.md)（4 决策点：Namespace 切换隔离 + 悬浮 FAB + 侧栏抽屉 + DEV 自动显示 + 生产双构建双路径 + 声明式清单注入项）
- 子计划 Plan：[`Plan/v0.2/subplans/2026-04-20-dev-tool-panel.md`](Plan/v0.2/subplans/2026-04-20-dev-tool-panel.md)（含 T1~T6 六个实施任务，工作量 ~2 人日）
- 规划包已落盘：`Plan/v0.2/` 下 `00-overview.md` / `01-feedback-catalog.md` / `02-classification.md` / `03-phase-plan.md` / `04-execution-discipline.md` + `phases/phase-1.md` ~ `phase-5.md`
- Phase 3 内容待 Phase 2 诊断报告产出后再充实
- 工程基线（延续 v0.1 收口）：`npm run build` 绿，`vitest` 473/473 PASS；`npm run lint` 127 条 error 属基线债务
- 精确检查点：`master@977933e`

**下一步**：启动 `v0.2-1-1` 实施任务 T1（`repository/local.ts` namespace 切换改造 + 单测），逐步推进 T2~T6。期间新发现的问题挂 `ISSUE_LIST.md`，不回写本文件。

---

## 权威入口

### 版本活跃入口

- 当前版本根目录：[Plan/v0.2/](Plan/v0.2/)
- 当前主线概览：[Plan/v0.2/00-overview.md](Plan/v0.2/00-overview.md)
- 当前反馈目录：[Plan/v0.2/01-feedback-catalog.md](Plan/v0.2/01-feedback-catalog.md)
- 当前 Phase 计划：[Plan/v0.2/03-phase-plan.md](Plan/v0.2/03-phase-plan.md)
- 当前执行纪律：[Plan/v0.2/04-execution-discipline.md](Plan/v0.2/04-execution-discipline.md)
- 当前 Phase 1 详表：[Plan/v0.2/phases/phase-1.md](Plan/v0.2/phases/phase-1.md)

### 全局管理入口

- 开放问题权威源：[ISSUE_LIST.md](ISSUE_LIST.md)
- 未激活候选 / 延期条目：[Backlog.md](Backlog.md)
- 计划索引 / 模板 / 版本归档规则：[Plan/README.md](Plan/README.md)
- 规格导航总索引：[Specs/_index.md](Specs/_index.md)
- 复盘 / 历史机制记录：[Reports/](Reports/)

### 历史版本

- v0.1 版本归档：[Plan/v0.1/](Plan/v0.1/)（[README](Plan/v0.1/README.md) · [收口快照](Plan/v0.1/00-overview.md) · [已关闭 issue](Plan/v0.1/issues-closed.md)）

### 低频扩展

- 人工验证题库：[human-verification-bank-v2.md](human-verification-bank-v2.md)
- QA 产物：[QA/](QA/)
- 真题参考库：[../reference-bank/README.md](../reference-bank/README.md)
