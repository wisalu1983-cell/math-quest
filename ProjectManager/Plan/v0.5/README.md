# v0.5 A03 竖式体验与输入系统 · 主线

> 所属版本：v0.5
> 创建：2026-04-28
> 状态：✅ Phase 2 已完成；下一步 Phase 3 输入与反馈基础设施
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
| Phase 1：开工对齐与架构启动门 | [`phases/phase-1.md`](./phases/phase-1.md) |
| Phase 1 开工对齐与跨 Phase 边界 | [`subplans/2026-04-28-v05-phase1-开工对齐与跨phase边界.md`](./subplans/2026-04-28-v05-phase1-开工对齐与跨phase边界.md) |
| Phase 2：竖式题样本质量诊断 | [`phases/phase-2.md`](./phases/phase-2.md) |
| Phase 2 `BL-009` 子计划 | [`subplans/2026-04-28-v05-phase2-BL-009-竖式题样本质量诊断与过滤规则.md`](./subplans/2026-04-28-v05-phase2-BL-009-竖式题样本质量诊断与过滤规则.md) |

## N/A / 延迟创建说明

- `subplans/`：Phase 1 开工对齐文档已完成；Phase 2 `BL-009` 子计划已完成；Phase 3 / 4 的详细设计与实施计划按各 Phase 启动时分别创建。
- 新设计规格：`BL-009` 已在 Phase 2 收口时回写 `ProjectManager/Specs/a03-vertical-calc/current.md`；后续若改变长期功能行为，继续按 Living Spec 制度在对应 phase 收口时回写。
- QA 产物：Phase 2 使用固定 seed 诊断脚本、generator 单测、全量 test/build 验收；后续 UI / 体验类 Phase 收尾时按 `qa-leader` 规则补齐。

## 当前状态

- ✅ v0.5 版本管理包已按 `version-package-template.md` 启动。
- ✅ 2026-04-27 ~ 2026-04-28 对话预研结论已汇总到 [`01-research-catalog.md`](./01-research-catalog.md)。
- ✅ `BL-009`（闯关竖式题目排除纯口算样例）、`BL-011`（计算输入内置键盘）、`BL-010`（竖式除法 UI 化答题）已纳入 v0.5。
- ✅ `ISSUE-067`（多行乘法竖式判错面板缺少过程 / 训练格错因）已纳入 v0.5 顺带修复。
- ✅ `BL-012`（特定账号数据查询后台页面）已从 v0.5 拆出，改由 v0.6 承接；v0.6 版本包待启动。
- ✅ Phase 1 已完成：开工对齐、产品 / 体验决策确认、技术 ownership、类型/API、UI 容量与 QA 映射已形成后续 Phase 的共同边界。
- ✅ Phase 2 已完成：`BL-009` 子计划、固定 seed 诊断、生成器过滤、自动化测试、实施后复测与 current spec 回写已完成。
- ⏭️ 下一步：启动 Phase 3 `BL-011` 内置键盘 + `ISSUE-067` 错因反馈基础设施子计划。
