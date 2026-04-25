---
name: a02-high-tier-compare-requires-two-step-or-trap
description: MathQuest A02 高档 compare 题不能停留在一步判断，应至少需要两步思考或包含需要察觉的误导
type: feedback
status: candidate
pattern_key: mathquest-a02-high-tier-compare-two-step-or-trap
source_tool: codex
source_session: codex-desktop-2026-04-25-mathquest-v04-phase3-worktree
source_timestamp_start: 2026-04-25T21:45:00.000+08:00
source_timestamp_end: 2026-04-25T21:49:00.000+08:00
seen_count: 1
first_seen: 2026-04-25
last_seen: 2026-04-25
---

# A02 high-tier compare requires two-step reasoning or a trap

MathQuest A02 `number-sense / compare` 高档题（尤其 d=7 表达式比较）不能只是 `a × b ○ a × c`、`a ÷ b ○ a ÷ c`、`a × 0.9 ○ a` 这类一步判断题。这个难度级别至少需要两步思考，或题干存在需要学生主动察觉的误导。

**Why:** 用户指出这些一步比较题“都太简单了，都是一步思考就出结果，不适合放在这个难度级别”。如果高档 compare 仍以此为主，会让 A02 高档梯度虚高，进阶和闯关体验都显得水。

**How to apply:** 编写 A02 compare 高档开发文档或改生成器时，把一步比较模板降到 d=6 或更低；d=7 主体应使用二步结构比较、等价变形、组合表达式或带误导性的比较题，并在 explanation 中写清关键识别点。
