---
name: backfill-inflight-docs-when-introducing-pm-process
description: MathQuest 引入新的 PM 文档制度时，要把正在收口的正式用例补齐新字段并跑通闭环
type: feedback
status: candidate
pattern_key: mathquest-backfill-inflight-docs-when-introducing-process
source_tool: codex
source_session: rollout-2026-04-26T09-49-35-019dc77a-5250-77a2-8a7a-dbd7625bb0fc
source_timestamp_start: 2026-04-26T04:49:00.000Z
source_timestamp_end: 2026-04-26T04:49:18.832Z
seen_count: 1
first_seen: 2026-04-26
last_seen: 2026-04-26
---

在 MathQuest 引入新的 PM 文档制度、模板字段或收口流程时，不能只说“后续新文档适用”。如果当前有已经验收但尚未正式收口的 phase / subplan，应把它作为首个正式试行用例，补齐新字段并跑完整闭环。

**Why:** 用户指出 Living Spec 试点要求“后续每个新 subplan 必填 Spec impact”时，现有 v0.4 Phase 4 subplan 仍缺该字段。若不在当前收口用例中补齐，新制度会停留在未来约束，无法验证正式环境是否真的能防止漏回写。

**How to apply:** 合入新 PM 制度时，检查当前 active version / phase 中已验收但未收口的 subplan。至少对首个正式用例补齐新增字段、执行收口 checklist、更新 current spec / index / Overview，并把执行结果写入制度试行报告；历史 phase 的批量补齐可留到版本整体收口。
