---
name: confirm-ui-before-coding-after-doc
description: MathQuest 复杂 UI 功能应在详细文档完成后、开始 coding 前单独确认 UI 方案
type: user
status: candidate
pattern_key: mathquest-confirm-ui-before-coding-after-doc
source_tool: codex
source_session: codex-desktop-current-session
source_timestamp_start: 2026-04-29T00:00:00.000+08:00
source_timestamp_end: 2026-04-29T00:00:00.000+08:00
seen_count: 1
first_seen: 2026-04-29
last_seen: 2026-04-29
---

MathQuest 中复杂 UI 功能的详细开发文档可以先确认功能方案、数据结构、判定和测试映射；具体 UI 视觉与交互方案应在详细文档完成后、开始 coding 前单独向用户确认。

**Why:** 用户在 Phase 4 `BL-010` 竖式除法 UI 化答题文档推进时明确说：“方案没问题，UI在后续写完文档后，开始coding前再确认”。这说明用户希望先把工程和规则文档写完整，再在实现前集中确认 UI，不希望在每个逻辑问题里提前消耗 UI 决策。
**How to apply:** 对 `LongDivisionBoard` 这类复杂 UI，先完成 subplan 中的范围、数据结构、判定、slot、错因、QA 等内容；在进入 worktree / coding 前，单独展示 UI 方案或效果图并等待用户确认，把该确认作为实现前 gate。
