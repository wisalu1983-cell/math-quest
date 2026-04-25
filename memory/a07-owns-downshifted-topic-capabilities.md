---
name: a07-owns-downshifted-topic-capabilities
description: MathQuest 题型断联并入时，应把被合并题型能力迁入目标题型，而不是让目标题型特例引用旧题型
type: user
status: candidate
pattern_key: topic-downshift-target-owns-capabilities
source_tool: codex
source_session: codex-desktop-2026-04-25-mathquest
source_timestamp_start: 2026-04-25T00:00:00.000+08:00
source_timestamp_end: 2026-04-25T00:00:00.000+08:00
seen_count: 3
first_seen: 2026-04-25
last_seen: 2026-04-25
---

MathQuest 中将 A04/A06 断联并入 A07 时，用户明确偏好：A07 会用到的 A04/A06 相关功能应合并为 A07 的一部分，而不是让 A07 作为特例引用 A04/A06；随后将 A04/A06 作为大题型整体屏蔽断联。用户进一步确认：旧进度不折算到新 A07 lane，旧错题/历史不参与新段位复习，新题的数据身份彻底 A07 化。

**Why:** 这样玩家语义和代码主链路一致，A04/A06 不会在生成器、进阶、统计、段位、历史等路径中反复以“隐藏特例”泄漏出来。

**How to apply:** 题型合并/断联并入时，优先让目标题型拥有被合并能力；保留旧 topic id 只用于 legacy data / migration / history compatibility。新题、玩家入口、统计和规则主链路必须归属目标题型。
