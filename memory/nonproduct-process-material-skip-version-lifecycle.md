---
name: nonproduct-process-material-skip-version-lifecycle
description: math-quest 中介绍流程的辅助材料不需要走产品版本管理流程
type: user
status: candidate
pattern_key: mathquest-nonproduct-process-material-skip-version-lifecycle
source_tool: codex
source_session: 019dce3e-f35f-7d71-88ed-e1a07521b8e5
source_timestamp_start: 2026-04-27T17:36:03.000+08:00
source_timestamp_end: 2026-04-27T17:36:03.000+08:00
seen_count: 1
first_seen: 2026-04-27
last_seen: 2026-04-27
---

在 math-quest 项目中，如果用户明确说明某个网页或文档只是介绍项目管理、版本管理流程的辅助材料，而不是产品本身内容，则不要套用标准产品版本管理流程。

**Why:** 这类材料不改变产品行为、版本轴、Plan/Spec/Issue/Backlog/QA 生命周期，套用版本管理包、subplan、Spec impact 或 pm-sync-check 会增加无意义流程成本。
**How to apply:** 先确认材料性质和影响范围；若仅是介绍性材料，按普通静态文档或辅助页面处理。不要创建版本管理包、子计划或触发 pm-sync-check，除非用户明确要求把它纳入产品版本流程或它实际改变了 PM 权威源。
