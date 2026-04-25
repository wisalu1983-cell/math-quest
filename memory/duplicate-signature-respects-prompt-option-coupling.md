---
name: duplicate-signature-respects-prompt-option-coupling
description: MathQuest 完全重复治理的签名规则要区分开放题干与闭合题干，不能机械使用 prompt 或 prompt+options
type: feedback
status: candidate
pattern_key: mathquest-duplicate-signature-prompt-option-coupling
source_tool: codex
source_session: codex-desktop-2026-04-25-mathquest-v04-phase3-worktree
source_timestamp_start: 2026-04-25T22:05:00.000+08:00
source_timestamp_end: 2026-04-25T22:08:00.000+08:00
seen_count: 1
first_seen: 2026-04-25
last_seen: 2026-04-25
---

# Duplicate signature respects prompt-option coupling

MathQuest Phase 3 完全重复治理不能机械选择 `prompt`、`prompt + options` 或完整题目字段。应先判断题干与候选项的语义关系：开放题干由 options 承载题目实例，闭合题干由 prompt 承载题目实例。

**Why:** 用户指出，“下面哪个式子能先凑整？”这类开放题干，题干相同但 options 不同可以接受；而“25 × 37 × 4 可以先变成哪一个？”这类闭合题干，题干已经绑定了具体题目实例，即使 options 不同也不应在同一 session 内重复。

**How to apply:** 设计完全重复签名时使用题型感知规则：闭合题干签名用 normalized prompt；开放题干签名用 normalized prompt + canonicalized options；无法可靠判断时，优先让对应 generator/helper 显式标注 duplicate signature policy，而不是靠全局字段拼接。
