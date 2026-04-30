---
name: temp-artifacts-follow-explicit-routing
description: MathQuest 临时产物先遵守专门规则，未覆盖场景统一写入项目通用临时目录
type: user
status: candidate
pattern_key: mathquest-temp-artifacts-explicit-routing-before-common-temp
source_tool: codex
source_session: rollout-2026-04-30T18-07-46-019ddddb-db44-7261-a312-a8e0801c3560
source_timestamp_start: 2026-04-30T18:17:13.083+08:00
source_timestamp_end: 2026-04-30T18:17:16.919+08:00
seen_count: 1
first_seen: 2026-04-30
last_seen: 2026-04-30
---

MathQuest 中处理临时图片、截图、JSON、log、一次性脚本输出等产物时，先检查是否已有明确项目规则或专门目录。已有明确规则的按规则走；没有明确规则的，统一写入项目通用临时目录 `.agent-tmp/<scope>/`，且该目录内容默认忽略。

**Why:** 用户明确澄清：“对于临时文件，有明确规则的按明确规则走。没有规则的走项目通用的临时文件目录和规则”。这避免把正式 QA artifacts、Playwright output、agent 自用临时截图等不同语义混在同一条硬规则里。

**How to apply:** 生成临时产物前先判断归属：正式 QA 过程证据按 QA 规则写入 `QA/runs/**/artifacts/` 或 `QA/artifacts/`；Playwright 自有运行产物按 Playwright 配置；无专门规则的 agent 自用临时产物写入 `.agent-tmp/<scope>/`。不要新增 repo 根散落临时文件、未忽略临时目录或新的 `.codex-tmp/` 产物。
