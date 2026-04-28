---
name: vertical-calc-mental-arithmetic-exclusion
description: MathQuest 竖式训练题应排除可心算完成的样例，不能因存在轻微结构价值而保留
type: feedback
status: candidate
pattern_key: mathquest-vertical-calc-mental-arithmetic-exclusion
source_tool: codex
source_session: 019dce3b-d830-7573-97a0-e051701f52eb
source_timestamp_start: 2026-04-28T16:36:28.993+08:00
source_timestamp_end: 2026-04-28T16:36:28.993+08:00
seen_count: 1
first_seen: 2026-04-28
last_seen: 2026-04-28
---

# Vertical calc mental arithmetic exclusion

MathQuest 的 A03 竖式训练题如果学生可以通过心算自然完成，就不应作为竖式训练样例保留。讨论题目质量时，不能用“有一点位值 / 商位 / 结构价值”作为保留心算题的理由。

**Why:** 用户纠正了 `208÷4`、`672÷4` 等例子的判断：这些都属于心算题，不需要列竖式。v0.5 的 `BL-009` 目标是让闯关竖式题真正服务竖式计算训练，而不是让玩家觉得题目可以绕过竖式。
**How to apply:** 做 A03 竖式题预研、生成器过滤或 QA 抽样时，先用“是否需要列竖式”作为排除门槛；只有确实包含无法轻松心算的多步竖式负担时，才讨论进位、退位、部分积、余数传递、商位处理等结构训练价值。
