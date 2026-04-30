---
name: wrong-feedback-result-location-only
description: MathQuest 错题提示只说明答题结果和错误位置，不写行动要求
type: user
status: candidate
pattern_key: mathquest-wrong-feedback-result-location-only
source_tool: codex
source_session: codex-desktop-current
source_timestamp_start: 2026-04-30T13:20:00.000+08:00
source_timestamp_end: 2026-04-30T13:32:00.000+08:00
seen_count: 1
first_seen: 2026-04-30
last_seen: 2026-04-30
---

MathQuest 的错题提示文案只需要让用户知道答题结果和错在哪里。

**Why:** 用户明确指出错题提示不应该出现“订正”一类的要求，提示只需要说明答题结果和错误位置。

**How to apply:** 写错题 / 失败反馈文案时，用“本题未通过：竖式过程有误。”、“本题未通过：扩倍结果有误。”这类“结果 + 错误位置”的短句；避免“请检查 / 回看 / 订正 / 把步骤也写对”等行动要求。
