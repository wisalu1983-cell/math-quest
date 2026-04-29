---
name: agent-rules-semantic-sync
description: MathQuest 的 CLAUDE.md 与 AGENTS.md 应全文语义同步，工具差异只做环境适配
type: user
status: candidate
pattern_key: mathquest-agent-rule-semantic-sync
source_tool: codex
source_session: rollout-2026-04-29T21-23-38-019dd968-cfd5-7a33-beef-6aa88c47e22f
source_timestamp_start: 2026-04-29T22:06:05.184+08:00
source_timestamp_end: 2026-04-29T22:06:05.184+08:00
seen_count: 1
first_seen: 2026-04-29
last_seen: 2026-04-29
---

用户明确偏好：MathQuest 不再采用 `CLAUDE.md` 为主入口、`AGENTS.md` 只做轻适配的方式；两份 agent 规则文件应全文语义同步。凡是不涉及工具差异的规则、规范、定义都应在两边都保留。涉及特定环境、skill、plugin 或路径差异时，按各自工具能力做语义等价适配。

**Why:** 只让 `AGENTS.md` 转发到 `CLAUDE.md` 会依赖 agent 继续读取另一个文件；用户希望任一侧单独读取本侧入口时，也能获得完整规则效果。

**How to apply:** 更新 `CLAUDE.md` 或 `AGENTS.md` 时，先判断规则是否通用。通用规则两边都写；工具差异只改路径、skill/plugin 名称和执行入口，不改变约束语义。对照检查时覆盖全文，不只检查最近讨论的子主题。
