---
name: long-division-decimal-point-system-controlled
description: MathQuest 长除法 UI 中商小数点优先用系统规则自动出现，不额外增加用户点选控件
type: user
status: candidate
pattern_key: mathquest-long-division-decimal-point-system-controlled
source_tool: codex
source_session: 019ddc49-ac02-7151-854b-6f108df3cbb1
source_timestamp_start: 2026-04-30T11:57:27.006+08:00
source_timestamp_end: 2026-04-30T11:57:27.006+08:00
seen_count: 1
first_seen: 2026-04-30
last_seen: 2026-04-30
---

MathQuest 长除法 UI 调整商小数点时，优先采用系统自动规则：小数除整数由系统预置并与被除数小数点对齐；整数除整数只在个位处理完仍需继续算小数时自动出现；小数除小数先校验转换后除数必须为整数，再按转换后被除数复用前两种模式。不要为了“让学生判断小数点”额外增加点选槽，除非用户重新要求更高拟真度。

**Why:** 用户在 v0.5 Phase 4 `BL-010` 长除法 UI 审核中否决了“格间小数点槽”方案，明确说“这样就不用了，简单点”，并给出上述自动规则。该偏好说明用户更重视当前 UI 布局稳定和实现简单度，而不是为小数点增加新交互。
**How to apply:** 遇到 MathQuest 长除法小数点交互争议时，先检查是否能用确定性数学规则自动处理；只有规则无法覆盖或用户要求显式判断训练时，才考虑新增用户可操作控件。
