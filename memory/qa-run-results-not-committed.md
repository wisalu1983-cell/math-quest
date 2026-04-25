---
name: qa-run-results-not-committed
description: MathQuest QA run outputs are process artifacts and should not be committed
type: user
status: candidate
pattern_key: mathquest-qa-run-results-not-committed
source_tool: codex
source_session: codex-desktop-thread
source_timestamp_start: 2026-04-25T13:08:04.048+08:00
source_timestamp_end: 2026-04-25T13:08:04.048+08:00
seen_count: 1
first_seen: 2026-04-25
last_seen: 2026-04-25
---

For MathQuest, QA run outputs such as screenshots, JSON reports, run summaries, and ad hoc QA result directories under `QA/runs/` are process artifacts and should not be committed, even when PM documents mention that QA was performed. Commit only QA system scaffolding, reusable QA tools, scripts, templates, canonical process documents, or other "production materials" needed to run QA.

**Why:** The user had already established this convention. Forcing ignored QA result directories into Git to avoid broken PM links turns transient evidence into repository payload and violates the repo's `.gitignore` intent.

**How to apply:** Before staging QA paths, distinguish "QA production materials" from "QA execution results." For execution results, keep them local/ignored and write a concise conclusion into PM docs instead of linking to uncommitted run paths. Never use `git add -f QA/runs/...` unless the user explicitly overrides this convention.
