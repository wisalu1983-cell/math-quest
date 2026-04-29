---
name: check-worktrees-before-status-conclusion
description: MathQuest 中判断功能是否已实现前，先检查项目 worktree 状态
type: feedback
status: candidate
pattern_key: mathquest-check-worktrees-before-status-conclusion
source_tool: codex
source_session: 019dd785-b89c-75c1-aa81-8c2202e68722
source_timestamp_start: 2026-04-29T12:20:00.000+08:00
source_timestamp_end: 2026-04-29T12:45:00.643+08:00
seen_count: 1
first_seen: 2026-04-29
last_seen: 2026-04-29
---

MathQuest 中不能只看主工作树就判断某个 Phase 功能是否未实现；项目默认使用 `.worktrees/` 隔离开发，用户可能已经在 worktree 完成功能。

**Why:** 本次先在主工作树搜索 `BL-011` 内置键盘代码并误判为未实现，随后用户纠正“在 worktree 里开发且已开发好”。补查 `git worktree list` 才定位到 `v05-phase3-ui-keyboard`。
**How to apply:** 当任务涉及“已开发、已实现、看效果、验收、模拟”等当前实现状态时，先跑 `git worktree list` 并检查相关 worktree，再基于目标工作树读代码、启动服务或截图。
