# v0.5 A03 竖式体验与输入系统 · 主线

> 所属版本：v0.5
> 创建：2026-04-28
> 状态：📋 已启动；范围已纠偏为 A03 / Practice 输入体验主线，下一步讨论详细设计文档
> 设计规格：N/A（启动阶段由本版本预研结论和既有 current spec 约束驱动；具体子项开工前按需补设计 / 子计划）

---

## 读取提示

- 查入口和状态：读本文件
- 查版本背景 / 目标 / 范围：读 [`00-overview.md`](./00-overview.md)
- 查预研结论、来源证据、浏览器风险依据：读 [`01-research-catalog.md`](./01-research-catalog.md)
- 查需求分类、依赖关系、范围边界：读 [`02-classification.md`](./02-classification.md)
- 查 Phase 总图和进入 / 收尾条件：读 [`03-phase-plan.md`](./03-phase-plan.md)
- 查执行纪律、验收、PM 回写规则：读 [`04-execution-discipline.md`](./04-execution-discipline.md)

## 导航入口

| 想了解什么 | 打开哪个文件 |
|---|---|
| 版本背景、目标、阶段结构 | [`00-overview.md`](./00-overview.md) |
| 预研结论、Backlog、Issue、规格约束、浏览器风险依据 | [`01-research-catalog.md`](./01-research-catalog.md) |
| 功能分类、依赖关系、范围边界 | [`02-classification.md`](./02-classification.md) |
| Phase 1~5 总图、时序、进入 / 收尾条件 | [`03-phase-plan.md`](./03-phase-plan.md) |
| 执行纪律、验收、PM 回写规则 | [`04-execution-discipline.md`](./04-execution-discipline.md) |
| Phase 1：详细设计与架构启动门 | [`phases/phase-1.md`](./phases/phase-1.md) |

## N/A / 延迟创建说明

- `subplans/`：具体详细设计文档 / 子计划启动时再创建；当前状态只要求具备讨论详细设计文档的版本控制面。
- 新设计规格：开发期不提前改写 `current.md`；若 v0.5 验收后改变长期功能行为，再按 Living Spec 制度在 phase 收口时回写。
- QA 产物：当前未进入实现 / 验收，正式 QA run 暂无；各 Phase 收尾时按 `qa-leader` 规则补齐。

## 当前状态

- ✅ v0.5 版本管理包已按 `version-package-template.md` 启动。
- ✅ 2026-04-27 ~ 2026-04-28 对话预研结论已汇总到 [`01-research-catalog.md`](./01-research-catalog.md)。
- ✅ `BL-009`（闯关竖式题目排除纯口算样例）、`BL-011`（计算输入内置键盘）、`BL-010`（竖式除法 UI 化答题）已纳入 v0.5。
- ✅ `ISSUE-067`（多行乘法竖式判错面板缺少过程 / 训练格错因）已纳入 v0.5 顺带修复。
- ✅ `BL-012`（特定账号数据查询后台页面）已从 v0.5 拆出，改由 v0.6 承接；v0.6 版本包待启动。
- ⏭️ 下一步：讨论并落盘 v0.5 详细设计文档，先处理 A03 样本过滤、Practice 输入、错因反馈、长除法 UI 与 QA 架构门，再展开各子项实施计划。
