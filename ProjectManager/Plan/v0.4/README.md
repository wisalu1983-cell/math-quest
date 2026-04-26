# v0.4 题目体验系统性修复 · 主线

> 所属版本：v0.4
> 创建：2026-04-25
> 状态：✅ Phase 1 / Phase 2 / Phase 3 / Phase 4 已完成；Phase 5 工程方案已定
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
| Phase 1 子计划：乘法竖式与修复 | [`subplans/2026-04-25-bl-005-乘法竖式与Phase1修复.md`](./subplans/2026-04-25-bl-005-乘法竖式与Phase1修复.md) |
| Phase 2：A04/A06 断联并入 A07 | [`phases/phase-2.md`](./phases/phase-2.md) |
| Phase 2 样题模拟：A07 新地图完整跑一轮 | [`phases/2026-04-25-a07-新地图完整模拟题目清单.md`](./phases/2026-04-25-a07-新地图完整模拟题目清单.md) |
| Phase 2 子计划：A04/A06 断联并入 A07 | [`subplans/2026-04-25-a04-a06-断联并入A07简便计算.md`](./subplans/2026-04-25-a04-a06-断联并入A07简便计算.md) |
| Phase 3：题目质量与生成器诊断 | [`phases/phase-3.md`](./phases/phase-3.md) |
| Phase 3 预研收口：题目质量与生成器诊断 | [`phases/phase-3-research.md`](./phases/phase-3-research.md) |
| Phase 4：交互设计与教学引导 | [`phases/phase-4.md`](./phases/phase-4.md) |
| Phase 4 子计划：进位/退位格规则与 compare tip 补证 | [`subplans/2026-04-26-phase4-进位退位格规则与compare-tip补证.md`](./subplans/2026-04-26-phase4-进位退位格规则与compare-tip补证.md) |
| Phase 5：Practice 工程质量 | [`phases/phase-5.md`](./phases/phase-5.md) |
| Phase 5 启动准备：Practice 状态重置 | [`subplans/2026-04-26-phase5-Practice状态重置启动准备.md`](./subplans/2026-04-26-phase5-Practice状态重置启动准备.md) |

## N/A / 延迟创建说明

- `subplans/`：已创建并完成 Phase 1 乘法竖式子计划；后续具体子计划在某个 Phase / 子项通过需求讨论并准备开工时，再按 [`../templates/plan-template.md`](../templates/plan-template.md) 落盘。
- 新设计规格：开发期不提前改写 current spec；Phase 4 收口已按 Living Spec 制度回写 `ProjectManager/Specs/a03-vertical-calc/current.md`。

## 当前状态

- ✅ v0.4 预研报告已完成：[`../../Reports/2026-04-25-v0.4-prereport.md`](../../Reports/2026-04-25-v0.4-prereport.md)
- ✅ 版本管理包 `00-04 + phases/` 已按生命周期模板建立
- ✅ `BL-003` ~ `BL-008` 已纳入 v0.4 规划视图；`ISSUE-059` 已重新挂入当前版本 issue 视图
- ✅ `BL-005.3` 乘法竖式统一方向已确认：多位整数乘法模块 → 小数乘法复用 → 小数点定位 / 答案等价
- ✅ Phase 1 已完成：[`phases/phase-1.md`](./phases/phase-1.md)
- ✅ Phase 1 乘法竖式子计划已完成：[`subplans/2026-04-25-bl-005-乘法竖式与Phase1修复.md`](./subplans/2026-04-25-bl-005-乘法竖式与Phase1修复.md)
- ✅ Phase 1 QAleader 三层 QA 已完成；QA run 原始结果按制度不入库，结论已回写到 Phase 1 计划与子计划
- ✅ Phase 2 已完成：A04「运算律」/ A06「括号变换」取消玩家独立入口并从新主链路断联；相关能力迁入 A07「简便计算」低档知识点 lane；A07 进阶保留原 A07 子题型分配；自动化、构建、浏览器拟真验收通过
- ✅ Phase 3 已完成：A03 `difficulty=4-5 + int-mul` 的 `2位数 × 2位数` 分布已落在验收带内；A03 进阶 3★ 短除候选降为 0；A02 compare d=7/d=8 质量优化完成；campaign / advance / rank-match session 内完全重复治理已接入 bounded retry；QAleader v2 已按风险驱动、规格追踪、统计抽样与拟真人工 oracle 补强并通过，记录见 [`../../../QA/runs/2026-04-26-v04-phase3-question-quality-v2/qa-summary.md`](../../../QA/runs/2026-04-26-v04-phase3-question-quality-v2/qa-summary.md)
- ✅ Phase 4 已完成：进位/退位格三档规则采用策略判定器方案，compare tip 补证通过，A03 current spec 已回写。入口：[`subplans/2026-04-26-phase4-进位退位格规则与compare-tip补证.md`](./subplans/2026-04-26-phase4-进位退位格规则与compare-tip补证.md) · [`../../Specs/a03-vertical-calc/current.md`](../../Specs/a03-vertical-calc/current.md)
- 🟡 Phase 5 工程方案已定：`BL-004` Practice 状态重置采用纯初始化函数 + reducer + `usePracticeInputState()` hook；Phase 4 已收口后可进入代码实施闸门
- 📋 下一步：推进 Phase 5 行为基线测试与统一状态重置方案实施，并验收 Living Spec 制度正式试行结果
