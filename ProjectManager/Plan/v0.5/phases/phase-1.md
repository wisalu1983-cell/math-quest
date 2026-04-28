# Phase 1 · 开工对齐与架构启动门

> 所属版本：v0.5
> 创建：2026-04-28
> 所属主线：[../README](../README.md)
> 状态：✅ 完成

---

## 目标

在进入代码实现前，先完成 v0.5 开工对齐：总设计不追求全量细节，只保证口算样例过滤、内置键盘、错因反馈、长除法 UI 四条线在模块、类型、存档、UI 容量和 QA 口径上不互相冲突。

各子项的详细设计下沉到 Phase 2 / 3 / 4 子计划，随写随做随验收。

## 输入

- v0.5 预研结论：[`../01-research-catalog.md`](../01-research-catalog.md)
- 分类与依赖：[`../02-classification.md`](../02-classification.md)
- Phase 总图：[`../03-phase-plan.md`](../03-phase-plan.md)
- 执行纪律：[`../04-execution-discipline.md`](../04-execution-discipline.md)
- A03 current spec：[`../../../Specs/a03-vertical-calc/current.md`](../../../Specs/a03-vertical-calc/current.md)
- Specs 索引：[`../../../Specs/_index.md`](../../../Specs/_index.md)
- Phase 1 开工对齐子计划：[`../subplans/2026-04-28-v05-phase1-开工对齐与跨phase边界.md`](../subplans/2026-04-28-v05-phase1-开工对齐与跨phase边界.md)

## 主要问题

- 内置键盘的组件归属、输入状态模型、焦点策略和系统键盘兜底入口。
- 长除法核心板的数据结构、动态轮次扩展、训练格挂载和提交判定 API。
- 过程格 / 训练格错因枚举、失败面板展示、错题本记录和历史记录隐藏规则。
- `BL-009` 抽样诊断口径与强制过滤规则决策流程。

## 收尾条件

- 开工对齐文档已由用户确认。
- 开工对齐显式回答模块 ownership、类型/API、存档、命名空间、UI 容量、测试与 QA 映射。
- Phase 2 ~ Phase 4 的子计划拆分明确。
- 若发现必须调整 v0.5 范围，已回写 [`../03-phase-plan.md`](../03-phase-plan.md) 和 [`../../../Overview.md`](../../../Overview.md)。

## 当前状态

Phase 1 已于 2026-04-28 收口。开工对齐子计划已完成，产品 / 体验决策点 P1~P5 已确认，技术拆分、类型/API、UI 容量、QA 映射已形成后续 Phase 的共同边界。下一步进入 Phase 2：创建 `BL-009` 竖式题样本质量诊断与过滤规则子计划。
