---
name: real-game-qa-over-preview
description: MathQuest UI compatibility QA should use the real game flow when the user asks to inspect the development game version
type: user
status: candidate
pattern_key: mathquest-real-game-qa-over-preview
source_tool: codex
source_session: codex-desktop-thread
source_timestamp_start: 2026-04-25T12:48:59.024+08:00
source_timestamp_end: 2026-04-25T12:48:59.024+08:00
seen_count: 2
first_seen: 2026-04-25
last_seen: 2026-04-26
---

When the user asks to inspect or validate MathQuest UI in the development game version, do not treat `?preview=*` pages as sufficient evidence. Preview pages are useful for component iteration, but compatibility and acceptance checks should enter the real game/practice flow and capture evidence there.

**Why:** The user explicitly corrected that they wanted to see the feature inside the development game, not the preview page. Preview-only validation can miss wrapper layout, practice header, progress/heart bars, real cards, and mobile overflow caused by the production page context.

**How to apply:** For UI QA after component preview approval, drive `http://127.0.0.1:<port>/` into the actual practice state with Playwright/browser-use, then test the real rendered page. Keep preview screenshots as auxiliary evidence only.

Second observation (2026-04-26, v0.4 release gate): release gate visual QA found `ISSUE-065` because Phase 1 preview-based multiplication evidence did not cover the legacy single-line `VerticalCalcBoard`; the real Practice flow still showed known operands in low-contrast placeholder styling. When a fix claims a component-family-wide visual property such as "vertical digits are high contrast", include both new and legacy render paths in the real game flow.
