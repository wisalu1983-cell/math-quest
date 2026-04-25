# v0.4 题目体验系统性修复 · 主线

> 所属版本：v0.4
> 创建：2026-04-25
> 状态：🟡 Phase 1 已完成；Phase 2 题型信息架构方案已定，待实施
> 设计规格：N/A（本版本先由预研报告和既有 Specs 约束驱动；具体子项开工前按需补设计 / 子计划）

---

## 读取提示

- 查入口和状态：读本文件
- 查版本背景 / 目标 / 阶段结构：读 [`00-overview.md`](./00-overview.md)
- 查来源证据：读 [`01-research-catalog.md`](./01-research-catalog.md)
- 查分类和边界：读 [`02-classification.md`](./02-classification.md)
- 查 Phase 总图：读 [`03-phase-plan.md`](./03-phase-plan.md)
- 查执行纪律和验收规则：读 [`04-execution-discipline.md`](./04-execution-discipline.md)

## 导航入口

| 想了解什么 | 打开哪个文件 |
|---|---|
| 版本背景、目标、阶段结构 | [`00-overview.md`](./00-overview.md) |
| 预研报告、Backlog、Issue、规格约束 | [`01-research-catalog.md`](./01-research-catalog.md) |
| 功能分类、依赖关系、范围边界 | [`02-classification.md`](./02-classification.md) |
| Phase 1~4 总图、时序、进入 / 收尾条件 | [`03-phase-plan.md`](./03-phase-plan.md) |
| 执行纪律、验收、PM 回写规则 | [`04-execution-discipline.md`](./04-execution-discipline.md) |
| Phase 1：渲染与判定修复 | [`phases/phase-1.md`](./phases/phase-1.md) |
| Phase 1 子计划：乘法竖式与修复 | [`subplans/2026-04-25-bl-005-multiplication-vertical-board.md`](./subplans/2026-04-25-bl-005-multiplication-vertical-board.md) |
| Phase 2：A04/A06 降阶并入 A07 | [`phases/phase-2.md`](./phases/phase-2.md) |
| Phase 2 子计划：A04/A06 降阶并入 A07 | [`subplans/2026-04-25-a04-a06-downshift-to-a07.md`](./subplans/2026-04-25-a04-a06-downshift-to-a07.md) |
| Phase 3：题目质量与生成器诊断 | [`phases/phase-3.md`](./phases/phase-3.md) |
| Phase 4：交互设计与教学引导 | [`phases/phase-4.md`](./phases/phase-4.md) |
| Phase 5：Practice 工程质量 | [`phases/phase-5.md`](./phases/phase-5.md) |

## N/A / 延迟创建说明

- `subplans/`：已创建并完成 Phase 1 乘法竖式子计划；后续具体子计划在某个 Phase / 子项通过需求讨论并准备开工时，再按 [`../templates/plan-template.md`](../templates/plan-template.md) 落盘。
- 新设计规格：暂不创建。Phase 2 题型 IA 新规则先记录在子计划中；若实施中发现需要跨版本复用，再提升为 `ProjectManager/Specs/` 正式规格。

## 当前状态

- ✅ v0.4 预研报告已完成：[`../../Reports/2026-04-25-v0.4-prereport.md`](../../Reports/2026-04-25-v0.4-prereport.md)
- ✅ 版本管理包 `00-04 + phases/` 已按生命周期模板建立
- ✅ `BL-003` ~ `BL-008` 已纳入 v0.4 规划视图；`ISSUE-059` 已重新挂入当前版本 issue 视图
- ✅ `BL-005.3` 乘法竖式统一方向已确认：多位整数乘法模块 → 小数乘法复用 → 小数点定位 / 答案等价
- ✅ Phase 1 已完成：[`phases/phase-1.md`](./phases/phase-1.md)
- ✅ Phase 1 乘法竖式子计划已完成：[`subplans/2026-04-25-bl-005-multiplication-vertical-board.md`](./subplans/2026-04-25-bl-005-multiplication-vertical-board.md)
- ✅ Phase 1 QAleader 三层 QA 已完成；QA run 原始结果按制度不入库，结论已回写到 Phase 1 计划与子计划
- 🟡 Phase 2 方案已定：A04「运算律」/ A06「括号变换」取消玩家独立入口，降阶为 A07「简便计算」低档知识点 lane
- 📋 下一步：实施 Phase 2；随后进入 Phase 3 题目质量与生成器诊断，并另行确认 `BL-005.2` 进位格三档规则、`Phase 5` 是否保留在 v0.4
