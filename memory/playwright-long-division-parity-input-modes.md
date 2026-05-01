---
name: playwright-long-division-parity-input-modes
description: MathQuest long-division parity E2E helpers must split editable prototype inputs from readOnly virtual-keyboard practice inputs.
type: feedback
status: candidate
pattern_key: mathquest-playwright-long-division-input-helper
source_tool: codex
source_session: 019de11e-e2df-7a83-b0e1-8ed2afb359a2
source_timestamp_start: 2026-05-01T10:57:25.613+08:00
source_timestamp_end: 2026-05-01T10:57:25.613+08:00
seen_count: 1
first_seen: 2026-05-01
last_seen: 2026-05-01
---

MathQuest long-division parity Playwright tests compare formal prototype pages with production practice pages, but the two pages do not share the same input mechanics. Formal prototype inputs are editable DOM inputs, while production practice inputs become readOnly at mobile widths and must be driven through the virtual math keyboard. A single helper that always uses DOM value injection or always uses the keyboard can make long-chain progressive reveal tests flaky.

**Why:** The long-division board reveals later rows from active slot / filled-state progression. DOM injection may write visible values without advancing active slot; virtual-keyboard clicks can race with editable prototype active state. The failure pattern is a timeout waiting for a later label such as `第 6 轮乘积第 1 位`.

**How to apply:** In parity E2E helpers, detect whether the target input is readOnly. Use native `fill + Tab` for editable prototype fields; use the math keyboard for readOnly practice fields, and wait for both active input and expected value before continuing. Keep full Playwright on `workers: 1` when validating this long progressive reveal suite.
