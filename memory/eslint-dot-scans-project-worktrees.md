---
name: eslint-dot-scans-project-worktrees
description: MathQuest 仓库内 .worktrees/ 会被 eslint . 扫描，验收结论需区分全仓 lint 与变更范围 lint
type: feedback
status: candidate
pattern_key: mathquest-eslint-dot-scans-project-worktrees
source_tool: codex
source_session: rollout-2026-04-25T23-33-12-019dc546-0087-79c2-8b2d-45f24118342b
source_timestamp_start: 2026-04-25T23:52:00.000+08:00
source_timestamp_end: 2026-04-25T23:54:00.000+08:00
seen_count: 1
first_seen: 2026-04-25
last_seen: 2026-04-25
---

MathQuest 将开发 worktree 放在仓库根 `.worktrees/` 下时，`npm run lint` 的 `eslint .` 会递归扫描这些 worktree 副本，导致同一类 lint 存量问题在主工作区和 worktree 中重复出现。验收 Phase/分支时，要明确区分全仓 lint 现状和本次变更范围的 scoped lint 结果。

**Why:** 项目规则要求实现类任务默认使用仓库内 `.worktrees/`，但 ESLint 命令没有默认排除该目录。若直接把 `npm run lint` 的失败归因到当前改动，会误判；若只看 scoped lint 又不说明全仓 lint 状态，会让验收结论不完整。
**How to apply:** 在使用仓库内 `.worktrees/` 的任务里，验收时同时记录：1）本次触及文件的 scoped ESLint 是否通过；2）`npm run lint` 是否因历史存量或 `.worktrees/` 扫描失败。后续若要让全仓 lint 成为硬门禁，应先在 ESLint 配置中忽略 `.worktrees/`，再清理主工作区的既有 lint 债务。
