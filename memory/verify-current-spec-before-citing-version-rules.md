---
name: verify-current-spec-before-citing-version-rules
description: MathQuest 引用已发布版本规则前必须先核对 current spec 或对应 subplan 原文
type: feedback
status: candidate
pattern_key: mathquest-verify-current-spec-before-citing-version-rules
source_tool: codex
source_session: 019dce3b-d830-7573-97a0-e051701f52eb
source_timestamp_start: 2026-04-28T17:32:41.059+08:00
source_timestamp_end: 2026-04-28T17:32:41.059+08:00
seen_count: 1
first_seen: 2026-04-28
last_seen: 2026-04-28
---

# Verify current spec before citing version rules

MathQuest 中引用已发布版本的具体行为规则时，必须先读取对应 `current.md`、phase subplan 或代码入口原文，再复述规则。尤其是 A03 竖式过程格、难度档位、反馈判定这类多条件规则，不能凭记忆套用到新预研。

**Why:** 用户指出对 v0.4 三档过程格规则的复述“有点不对”。核对 `Specs/a03-vertical-calc/current.md` 后确认：高档是不显示过程格、只填答案格；中档是过程格可选且答案对即通过，用户填错过程格才给当前题提示；低档是非 0 过程格必填且过程错不通过。凭记忆复述容易把“过程格可选/不显示/只看答案”混在一起。
**How to apply:** 在设计 v0.5 或后续需求时，如果要“沿用 v0.4 精神”或引用某个已发布规则，先打开对应 current spec/subplan，按原文提炼，再讨论是否适合迁移；若只是类比，明确说明这是类比而非既有规则。
