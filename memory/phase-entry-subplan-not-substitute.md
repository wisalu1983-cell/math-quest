---
name: phase-entry-subplan-not-substitute
description: MathQuest 版本管理中 subplan 不能替代 phases/phase-N.md 阶段入口
type: feedback
status: candidate
pattern_key: mathquest-phase-entry-subplan-not-substitute
source_tool: codex
source_session: 019dd48d-a9d4-72f3-a1dc-965639cf59fa
source_timestamp_start: 2026-04-28T23:48:45.675+08:00
source_timestamp_end: 2026-04-28T23:48:45.675+08:00
seen_count: 1
first_seen: 2026-04-28
last_seen: 2026-04-28
---

MathQuest 版本管理中，每个正式启动或收口的 Phase 都必须保留 `ProjectManager/Plan/vX.Y/phases/phase-N.md` 作为阶段级入口。具体诊断、方案、实施拆解与验收细节落到 `subplans/`；`subplan` 不替代 `phase-N.md`。

**Why:** Phase 入口负责目标、范围、输入、收尾条件、状态和下游文档路由；subplan 负责执行细节。缺少 `phase-N.md` 会让版本包结构不完整，也会破坏 `dev-doc-flow` 的版本-phase 阅读路径。

**How to apply:** 启动或收口 MathQuest 的任一 Phase 时，先检查 `phases/phase-N.md` 是否存在并更新状态，再创建或更新对应 `subplans/YYYY-MM-DD-...md`。收口时同步 `vX.Y/README.md`、`03-phase-plan.md`、`ProjectManager/Plan/README.md` 和 `Overview.md` 的入口链接。
