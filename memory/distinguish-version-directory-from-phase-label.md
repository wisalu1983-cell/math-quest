---
name: distinguish-version-directory-from-phase-label
description: MathQuest PM 汇报中要明确区分版本目录 v0.4 与阶段 Phase 4，避免把 v0.4/subplans 误听成 Phase 4 下的文档
type: feedback
status: candidate
pattern_key: mathquest-distinguish-version-directory-from-phase-label
source_tool: codex
source_session: codex-desktop-current-thread
source_timestamp_start: 2026-04-25T23:10:41.387+08:00
source_timestamp_end: 2026-04-25T23:10:41.387+08:00
seen_count: 1
first_seen: 2026-04-25
last_seen: 2026-04-25
---

MathQuest PM 文档汇报路径时，应把 `ProjectManager/Plan/v0.4/` 明确称为“v0.4 版本目录”，把 `phases/phase-3.md` 或标题中的 `Phase 3` 明确称为“阶段”。不要只说“写到 v0.4 下面”而省略 Phase 3 上下文，因为 `v0.4` 容易被误解为 Phase 4。

**Why:** 用户在 Phase 3 预研转正式开发文档的上下文中看到 `v0.4` 路径，可能会合理怀疑文档被写进 Phase 4，造成不必要的中断和信任成本。
**How to apply:** 回报 PM 文档位置时使用“两段式定位”：`v0.4 版本目录 / Phase 3 子计划`。若同一版本内同时存在 `phases/phase-4.md`，额外说明“没有写入 phase-4.md，Phase 4 仍只包含交互设计与教学引导范围”。
