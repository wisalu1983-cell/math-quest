# math-quest 项目概览

> 最后更新：2026-04-21（v0.2-1-1 F3 开发者工具栏实施+QA 通过，进入 v0.2-1-2 准备）
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

- ✅ **`v0.2-1-1` F3 开发者工具栏** 实施+QA 全部通过（2026-04-21）
  - 单测 501/501 全绿（含新增 22 条）；双构建纯净度 grep 验证通过；用户人工 QA 确认注入项有效性
  - 子计划详见：[`Plan/v0.2/subplans/2026-04-20-dev-tool-panel.md`](Plan/v0.2/subplans/2026-04-20-dev-tool-panel.md)
  - QA 报告：[`QA/2026-04-20-f3-dev-tool-unit-test/qa-result.md`](QA/2026-04-20-f3-dev-tool-unit-test/qa-result.md)
- ✅ **`v0.2-1-2` B1 生成器退化题 + E1 题干折行** 实施+QA 全部通过（2026-04-21）
  - vitest 503/503；E1 Playwright DOM 度量全通过；算式题型全部单行
  - B1 子计划：[`Plan/v0.2/subplans/2026-04-21-b1-生成器退化题修复.md`](Plan/v0.2/subplans/2026-04-21-b1-生成器退化题修复.md)
  - E1 子计划 + QA 报告：[`Plan/v0.2/subplans/2026-04-21-e1-题干折行修复.md`](Plan/v0.2/subplans/2026-04-21-e1-题干折行修复.md) · [`QA/2026-04-21-e1-prompt-nowrap/qa-result.md`](QA/2026-04-21-e1-prompt-nowrap/qa-result.md)
- 规划包已落盘：`Plan/v0.2/` 下各文件完整；Phase 3 内容待 Phase 2 诊断报告产出后再充实
- 工程基线（2026-04-21）：`npm run build` 绿，`vitest` 501/501 PASS；`npm run lint` pre-existing 161 error 属基线债务（本次改动文件 0 新增）

**下一步**：Phase 1 全部完成（`1-1` + `1-2` ✅）→ 启动 Phase 2（三项合并短诊断：B2/C1/D）。

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
