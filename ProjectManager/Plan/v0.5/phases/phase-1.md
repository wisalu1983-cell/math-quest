# Phase 1 · 详细设计与架构启动门

> 所属版本：v0.5
> 创建：2026-04-28
> 所属主线：[../README](../README.md)
> 状态：📋 待启动

---

## 目标

在进入代码实现前，把 v0.5 的详细设计文档讨论清楚并落盘，确保口算样例过滤、内置键盘、错因反馈、长除法 UI 四条线不会在实现期互相冲突。

## 输入

- v0.5 预研结论：[`../01-research-catalog.md`](../01-research-catalog.md)
- 分类与依赖：[`../02-classification.md`](../02-classification.md)
- Phase 总图：[`../03-phase-plan.md`](../03-phase-plan.md)
- 执行纪律：[`../04-execution-discipline.md`](../04-execution-discipline.md)
- A03 current spec：[`../../../Specs/a03-vertical-calc/current.md`](../../../Specs/a03-vertical-calc/current.md)
- Specs 索引：[`../../../Specs/_index.md`](../../../Specs/_index.md)

## 主要问题

- 内置键盘的组件归属、输入状态模型、焦点策略和系统键盘兜底入口。
- 长除法核心板的数据结构、动态轮次扩展、训练格挂载和提交判定 API。
- 过程格 / 训练格错因枚举、失败面板展示、错题本记录和历史记录隐藏规则。
- `BL-009` 抽样诊断口径与强制过滤规则决策流程。

## 收尾条件

- 详细设计文档已由用户确认。
- 详细设计显式回答模块 ownership、类型/API、存档、命名空间、UI 容量、测试与 QA 映射。
- Phase 2 ~ Phase 4 的子计划拆分明确。
- 若发现必须调整 v0.5 范围，已回写 [`../03-phase-plan.md`](../03-phase-plan.md) 和 [`../../../Overview.md`](../../../Overview.md)。

## 当前状态

版本启动材料已准备好；下一步可以开始讨论详细设计文档。
