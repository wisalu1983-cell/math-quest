---
name: document-type-skill-routing
description: MathQuest 文档写作前应先用文档类型路由决定项目规则和 skill
type: feedback
status: candidate
pattern_key: mathquest-document-type-skill-routing
source_tool: codex
source_session: codex-desktop-current-session
source_timestamp_start: 2026-04-29T00:00:00.000+08:00
source_timestamp_end: 2026-04-29T00:00:00.000+08:00
seen_count: 1
first_seen: 2026-04-29
last_seen: 2026-04-29
---

MathQuest 中写文档前，应先按文档类型路由到对应项目规则和 skill：详细开发文档 / subplan 走 `dev-doc-flow`，QA 产物走 `qa-leader`，版本生命周期走 `version-lifecycle-manager`，普通说明 / 提案 / 流程 / 复盘类文档走通用文档编写流程（Codex 下为 `doc-coauthoring`），PM 状态和索引类文档只走项目 PM 路由。

**Why:** 用户明确要求把“什么文档用什么规则或 skill”固化为路由。此前规范分散在 `CLAUDE.md`、`ProjectManager/Plan/README.md`、`rules/*` 和 `dev-doc-flow` 中，容易让 `dev-doc-flow` 误吸 phase 入口或普通说明文档。
**How to apply:** 新建或修改文档前，先读 `ProjectManager/Plan/rules/document-skill-routing.md`。确认文档职责后，再进入对应规则或 skill；通用 skill 只提供写作方法，不能覆盖 MathQuest 的落点、命名、索引和回写规则。
