---
name: long-division-conversion-hints-non-leaking
description: MathQuest 长除法小数除小数转换区即时错误提示不能直接泄露正确值
type: user
status: candidate
pattern_key: mathquest-long-division-conversion-hints-non-leaking
source_tool: codex
source_session: 019ddc49-ac02-7151-854b-6f108df3cbb1
source_timestamp_start: 2026-04-30T12:13:52.703+08:00
source_timestamp_end: 2026-04-30T12:13:52.703+08:00
seen_count: 1
first_seen: 2026-04-30
last_seen: 2026-04-30
---

MathQuest 长除法 UI 中，小数除小数的转换区如果在答题过程中即时提示错误，提示应只说明“转换后除数填写有误”或“转换后被除数填写有误”，不要直接展示“应为 X”。被除数填错时必须给可见反馈，不能只停住不进入竖式板。

**Why:** 用户在 v0.5 Phase 4 `BL-010` 长除法 UI 审核中指出，除数填错时不应直接告诉学生正确值；被除数填错时无提示且不进入下一步，会让用户以为预览出了 bug。
**How to apply:** 设计 MathQuest 过程内即时提示时，先区分“阻断性错误告知”和“提交后订正反馈”。阻断性错误只告诉错在什么字段，不泄露正确答案；提交后的结构化反馈再按当前规格展示必要明细。
