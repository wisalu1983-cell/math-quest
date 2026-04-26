---
name: qa-formal-qa-materials-commit-policy
description: MathQuest 正式 QA 体系、测试生产资料和正式结论可入库；过程 artifacts 继续忽略
type: user
status: candidate
pattern_key: mathquest-qa-formal-materials-vs-process-artifacts
source_tool: codex
source_session: codex-desktop-thread
source_timestamp_start: 2026-04-25T13:08:04.048+08:00
source_timestamp_end: 2026-04-25T13:08:04.048+08:00
seen_count: 2
first_seen: 2026-04-25
last_seen: 2026-04-26
---

For MathQuest, distinguish formal QA work products from raw process artifacts:

- Can be committed: QA system/scaffolding, reusable QA tools, scripts, templates, canonical process documents, formal test methodology, formal test cases, formal execution reports, and QA summary/conclusions.
- Should stay ignored by default: screenshots, videos, Playwright trace/report output, raw JSON, raw console logs, temporary diagnostics, large artifacts, and one-off generated outputs.

**Why:** The user clarified on 2026-04-26 that "测试体系、工具、正式的测试工作生产资料和测试结论可以同步", while process artifacts should still be ignored. The previous memory overgeneralized by treating all `QA/runs/` outputs as non-committable.

**How to apply:** Before staging QA paths, classify each file. Commit formal Markdown summaries/test cases/methodology/results and reusable hand-written QA scripts when they are intended as project records. Keep raw artifacts and bulky generated evidence ignored unless the user explicitly marks a small item as long-term evidence in the QA summary.
