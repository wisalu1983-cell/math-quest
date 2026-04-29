---
name: mathquest-plan-docs-follow-project-routing
description: MathQuest 项目文档应服从 ProjectManager 版本目录路由，不能套用通用技能的 docs/plans 默认路径
type: feedback
status: candidate
pattern_key: mathquest-plan-docs-follow-project-routing
source_tool: codex
source_session: rollout-2026-04-29T11-26-36-019dd746-3831-7b92-a5e1-11250e8a7500
source_timestamp_start: 2026-04-29T11:39:08.589+08:00
source_timestamp_end: 2026-04-29T11:39:08.589+08:00
seen_count: 1
first_seen: 2026-04-29
last_seen: 2026-04-29
---

MathQuest 中涉及版本计划、Phase、subplan、spec、QA 或 PM 状态的文档，应先按 `CLAUDE.md` 与 `ProjectManager/Plan/rules/*` 的项目路由定位权威源。通用技能中提到的 `docs/plans/YYYY-MM-DD-...` 只能作为外部默认模板，不能覆盖本项目的 `ProjectManager/Plan/vX.Y/phases/`、`ProjectManager/Plan/vX.Y/subplans/`、`ProjectManager/Specs/` 等目录约定。

**Why:** 用户指出 subplan 本来就在版本目录，spec 也不在 `docs/plans`。在 MathQuest 中把“跳过 docs/plans 设计文档”称为例外，会混淆项目 canonical 文档体系与通用技能默认产物位置。
**How to apply:** 在 MathQuest 执行 `brainstorming`、`writing-plans` 或其他通用流程技能时，先用项目 AGENTS/CLAUDE 与 PM 路由校准产物位置。若技能默认路径与项目路由冲突，应明确说明“采用项目路由覆盖技能默认路径”，而不是把项目既有路由描述成一次性例外。
