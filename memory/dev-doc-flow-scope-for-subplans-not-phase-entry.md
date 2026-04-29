---
name: dev-doc-flow-scope-for-subplans-not-phase-entry
description: MathQuest 中 dev-doc-flow 应主要用于详细开发文档 / subplan，纯 phase 入口补齐优先走 PM 路由
type: feedback
status: candidate
pattern_key: mathquest-dev-doc-flow-scope-for-subplans-not-phase-entry
source_tool: codex
source_session: codex-desktop-current-session
source_timestamp_start: 2026-04-29T00:00:00.000+08:00
source_timestamp_end: 2026-04-29T00:00:00.000+08:00
seen_count: 2
first_seen: 2026-04-29
last_seen: 2026-04-29
---

MathQuest 中 `dev-doc-flow` 的主要适用对象是功能开发文档、方案文档和作为开发文档承载体的 `subplan`。纯粹补 `ProjectManager/Plan/vX.Y/phases/phase-N.md` 阶段入口时，优先使用 PM 写入路由、Phase 命名规则和版本包索引规则；`dev-doc-flow` 最多用于确认后续详细 `subplan` 的落点和阅读路径。

**Why:** 用户指出 `dev-doc-flow` 是写开发文档的，写 `phase.md` 阶段入口时触发它的收益有限。`phase-N.md` 在项目里是阶段导航 / 状态入口，主规则来自 `pm-write-routing.md`、`phase-and-subplan-naming.md` 和版本包索引；详细开发设计才应落到 `subplans/YYYY-MM-DD-...md` 并使用 `dev-doc-flow` 的架构门、需求门、Living Spec 门。
**How to apply:** 遇到“补 phase 入口 / 更新 Phase 状态 / 新建 phase-N.md”时，先走 PM 路由和命名规则。只有任务同时要求写功能方案、实施拆解、开发文档、或创建 `BL/ISSUE` 子计划时，再调用 `dev-doc-flow` 并把产物落到 subplan。

2026-04-29 再次触发：用户确认项目需要做“文档类型 / skill 路由”，并要求收窄 `dev-doc-flow` 对 phase 入口和普通文档的误触发边界。
