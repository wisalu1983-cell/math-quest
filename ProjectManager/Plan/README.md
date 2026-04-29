# 计划目录

> 角色：Plan 索引与规则入口，不承载项目当前状态总览。
> 高频读取：找当前版本入口、确认写入路由、确认 Plan / Spec / 子计划放哪里。
> 当前状态请先读：[`../Overview.md`](../Overview.md)。
> 低频规则采用渐进式披露，按下表进入，不默认通读。

---

## 高频速查

| 想确认什么 | 读取入口 |
|---|---|
| 当前项目状态 / 下一步 | [`../Overview.md`](../Overview.md) |
| PM 写入路由 / pm-sync-check 何时跑 | [`rules/pm-write-routing.md`](./rules/pm-write-routing.md) |
| Phase / 子计划 ID 怎么命名 | [`rules/phase-and-subplan-naming.md`](./rules/phase-and-subplan-naming.md) |
| Spec / Plan / Report / QA 分别放哪里 | [`rules/document-ownership.md`](./rules/document-ownership.md) |
| 新建普通 Plan 模板 | [`templates/plan-template.md`](./templates/plan-template.md) |
| 新建 / 回写功能 current spec 模板 | [`templates/current-spec-template.md`](./templates/current-spec-template.md) |
| 开新版本 / 版本过程 / 版本收口 | [`version-lifecycle.md`](./version-lifecycle.md) |
| 新版本管理包模板 | [`templates/version-package-template.md`](./templates/version-package-template.md) |

## 最小常用规则

1. **先改权威源，再改主管**：Plan / Spec / Issue / QA / Report 先更新；影响当前状态时再回写 `Overview.md`。
2. **索引只在生命周期变化时更新**：新建、归档、废弃、改名、入口关系变化时更新本文件或 `_index.md`。
3. **新 Plan 开工前先扫规格索引**：从 [`../Specs/_index.md`](../Specs/_index.md) 找相关生效规格。
4. **版本启动和收口必须读低频指南**：见 [`version-lifecycle.md`](./version-lifecycle.md) 和 [`templates/version-package-template.md`](./templates/version-package-template.md)。
5. **协作文档文件名用中文可读主题**：版本计划、子计划、开发文档、讨论样题等文件名在日期后优先写中文；专用术语和代号可保留原文，固定版本骨架除外。
6. **低频长规则不写进本 README**：超过 10 行且非日常使用的规则放到 `rules/`、`templates/`、`Reports/` 或版本目录。

## 当前版本（v0.5）

> 主线：A03 竖式体验与输入系统 · 入口 [`v0.5/README.md`](./v0.5/README.md)

| 文件 | 用途 | 状态 |
|---|---|---|
| [`v0.5/README.md`](./v0.5/README.md) | 版本入口 | 🟡 Phase 3 已启动；输入与反馈基础设施开发文档已建立 |
| [`v0.5/00-overview.md`](./v0.5/00-overview.md) | 背景、目标、阶段结构 | 📋 启动快照已建立 |
| [`v0.5/01-research-catalog.md`](./v0.5/01-research-catalog.md) | 预研结论 / Backlog / Issue / Spec / 浏览器证据链 | 📋 已建立 |
| [`v0.5/02-classification.md`](./v0.5/02-classification.md) | 分类、依赖、边界 | 📋 已建立 |
| [`v0.5/03-phase-plan.md`](./v0.5/03-phase-plan.md) | Phase 1~5 总图与决策门 | 📋 已建立 |
| [`v0.5/04-execution-discipline.md`](./v0.5/04-execution-discipline.md) | 本版本执行纪律、验收规则 | 📋 已建立 |
| [`v0.5/phases/`](./v0.5/phases/) | Phase 范围 / 进入条件 / 收尾条件 | ✅ Phase 1 已完成，后续 Phase 按子计划展开 |
| [`v0.5/subplans/2026-04-28-v05-phase1-开工对齐与跨phase边界.md`](./v0.5/subplans/2026-04-28-v05-phase1-开工对齐与跨phase边界.md) | Phase 1 开工对齐 / 跨 Phase 边界 | ✅ 完成 |
| [`v0.5/phases/phase-2.md`](./v0.5/phases/phase-2.md) | Phase 2 竖式题样本质量诊断 | ✅ 完成 |
| [`v0.5/subplans/2026-04-28-v05-phase2-BL-009-竖式题样本质量诊断与过滤规则.md`](./v0.5/subplans/2026-04-28-v05-phase2-BL-009-竖式题样本质量诊断与过滤规则.md) | Phase 2 `BL-009` 样本质量诊断 / 过滤规则 | ✅ 完成 |
| [`v0.5/phases/phase-3.md`](./v0.5/phases/phase-3.md) | Phase 3 输入与反馈基础设施 | 🟡 进行中 |
| [`v0.5/subplans/2026-04-29-v05-phase3-BL-011-计算输入内置键盘.md`](./v0.5/subplans/2026-04-29-v05-phase3-BL-011-计算输入内置键盘.md) | Phase 3 `BL-011` 内置键盘 | 🟡 待实现 |
| [`v0.5/subplans/2026-04-29-v05-phase3-ISSUE-067-结构化错因反馈.md`](./v0.5/subplans/2026-04-29-v05-phase3-ISSUE-067-结构化错因反馈.md) | Phase 3 `ISSUE-067` 结构化错因反馈 | 🟡 待实现 |

## 跨版本工具性 Plan

| 文件 | 用途 |
|---|---|
| [`version-lifecycle.md`](./version-lifecycle.md) | 开新版本、版本过程、版本收口低频指南 |
| [`2026-04-17-pm-document-sync-mechanism.md`](./2026-04-17-pm-document-sync-mechanism.md) | pm-sync-check 机制历史设计 |
| [`2026-04-19-pm-token-efficiency-optimization.md`](./2026-04-19-pm-token-efficiency-optimization.md) | PM token 轻量化历史方案 |

## 历史版本

| 版本 | 入口 | 摘要 |
|---|---|---|
| v0.4 | [`v0.4/README.md`](./v0.4/README.md) | 题目体验系统性修复；Phase 1~5、release gate 与 hotfix 完成；已发布 |
| v0.3 | [`v0.3/README.md`](./v0.3/README.md) | Supabase 在线账号与数据同步；Phase 1/2/3 完成；真实 Supabase 验收通过；已上线 |
| v0.2 | [`v0.2/README.md`](./v0.2/README.md) | 用户反馈驱动主线收口；Phase 1~5 完成；QAleader 三层 QA 完成 |
| v0.1 | [`v0.1/README.md`](./v0.1/README.md) | 原型与三层游戏化闭环完成 |

## 跨版本资产

| 类型 | 入口 |
|---|---|
| 设计规格 | [`../Specs/_index.md`](../Specs/_index.md) |
| 开放问题 | [`../ISSUE_LIST.md`](../ISSUE_LIST.md) |
| Backlog | [`../Backlog.md`](../Backlog.md) |
| 报告 / 复盘 | [`../Reports/`](../Reports/) |
| QA 产物 | [`../../QA/`](../../QA/) |
