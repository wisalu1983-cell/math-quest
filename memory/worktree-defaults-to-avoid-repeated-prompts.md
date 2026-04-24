---
name: worktree-defaults-to-avoid-repeated-prompts
description: 新实现任务优先通过仓库默认配置自动创建 worktree，减少重复询问
type: user
status: candidate
pattern_key: worktree-defaults-to-avoid-repeated-prompts
source_tool: codex
source_session: 019db9b4-9538-7e01-8488-c2d37eedd0d7
source_timestamp_start: 2026-04-23T17:43:52.2488845+08:00
source_timestamp_end: 2026-04-23T17:43:52.2488845+08:00
seen_count: 1
first_seen: 2026-04-23
last_seen: 2026-04-23
---

用户希望把“新开发任务是否开 worktree、用哪个目录”前置为仓库默认配置，而不是每次任务开始时重复确认。

**Why:** 当前 worktree 工作流在仓库内找不到 `.worktrees/` / `worktrees/`，且项目文档没有声明默认目录时，会按规则回退到询问用户。这个仓库会频繁进入实现任务，重复确认目录位置属于低价值摩擦。

**How to apply:** 对需要隔离开发的仓库，优先一次性完成三件事：1）预建并忽略默认 worktree 目录（推荐 `.worktrees/`）；2）在项目级 `CLAUDE.md` / `AGENTS.md` 明确“开始开发任务默认先创建 worktree，目录使用 `.worktrees/`，除非用户明确要求不使用”；3）只读诊断、纯文档或极小风险变更才允许跳过 worktree。
