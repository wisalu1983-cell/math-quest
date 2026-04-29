---
name: reference-shanghai-math-standards-for-learning-ui
description: MathQuest 学习 UI 的默认计算步骤应优先参考上海小学数学课标、教材或教学规范
type: user
status: candidate
pattern_key: mathquest-learning-ui-reference-shanghai-curriculum
source_tool: codex
source_session: rollout-2026-04-29T18-54-11-019dd8df-fcb1-77f0-bb1b-0fc39e0c31bd
source_timestamp_start: 2026-04-29T11:53:51.999Z
source_timestamp_end: 2026-04-29T11:56:29.787Z
seen_count: 1
first_seen: 2026-04-29
last_seen: 2026-04-29
---

MathQuest 中涉及学习 UI 的默认计算步骤、答题顺序或题型覆盖边界时，应优先参考上海小学数学课标、教材或教学规范，再把它转成产品交互和技术 slot 顺序。

**Why:** 用户在 Phase 4 `BL-010` 竖式除法 UI 化答题文档推进中明确要求：“需要一个默认顺序。具体顺序参考上海小学数学教学大纲里关于竖式除法的计算规范”。这说明项目的教学体验默认值应服务上海小学数学语境，而不是只按通用工程便利或个人直觉设定。
**How to apply:** 后续设计 A03 竖式、长除法、小数计算、取近似、循环小数等学习交互时，先查项目内已有预研、上海课标 / 教材 / 教学用书依据和成熟教学规范；若官方公开材料只给到课程或教材层级、没有逐字操作条款，必须在文档中标注证据边界，并把可执行方案写成“依据教学常规的实现默认”，保留按具体教材页码校准的空间。
