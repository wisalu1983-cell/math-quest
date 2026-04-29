---
name: phase-qa-evidence-every-acceptance-condition
description: Phase/QA 收口前必须逐条核对验收清单，并把真实设备或端到端证据缺口明确标为 gate
type: feedback
status: candidate
pattern_key: phase-qa-evidence-every-acceptance-condition
source_tool: codex
source_session: codex-desktop-current-session
source_timestamp_start: 2026-04-29T13:20:00.000+08:00
source_timestamp_end: 2026-04-29T13:36:00.000+08:00
seen_count: 1
first_seen: 2026-04-29
last_seen: 2026-04-29
---

MathQuest 的 Phase/QA 收口不能只按总体自动化通过和代表性浏览器路径下结论。必须把 phase/subplan 的验收清单逐条映射到证据，尤其区分模拟器证据、真实设备证据、unit 级证据和浏览器端到端证据。

**Why:** v0.5 Phase 3 QA 初版把小数乘法训练格错因停留在 unit 级证据，并把 Chrome Android / Safari iOS 真实设备证据列为 residual risk，但未在最终收口口径里足够突出；用户最终评审指出这两项必须补齐或保留为关闭 gate。
**How to apply:** 跑 QAleader 或写 phase closure 报告时，先从 phase/subplan 验收清单建立矩阵；每一项标明证据级别和路径。真实设备要求不能用 Playwright Chromium mobile emulation 代替；端到端要求不能只用 unit test 代替。无法在当前环境完成的项目要写成明确 gate，而不是笼统 residual risk。
