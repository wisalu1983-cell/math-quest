---
name: do-not-infer-unreachable-tier-behavior
description: MathQuest 题型分档分析必须先确认生成器是否会产生该形态，不能把不可达分支说成高档行为
type: feedback
status: candidate
pattern_key: mathquest-do-not-infer-unreachable-tier-behavior
source_tool: codex
source_session: 019dce3b-d830-7573-97a0-e051701f52eb
source_timestamp_start: 2026-04-28T17:38:44.199+08:00
source_timestamp_end: 2026-04-28T17:38:44.199+08:00
seen_count: 1
first_seen: 2026-04-28
last_seen: 2026-04-28
---

# Do not infer unreachable tier behavior

MathQuest 题型分档分析时，必须先确认生成器在该 difficulty 是否会产生对应题型形态，再描述 UI/判定行为。不能把某个组件或策略函数在理论上支持的分支，说成当前产品高档实际会出现的行为。

**Why:** 用户纠正了“乘法高档会隐藏过程格”的说法。实际 `generateIntMul()` 在 `difficulty > 5` 直接走 `generateMultiDigitMult()`，一位数乘数的 legacy 单行乘法不会出现在高难度里；因此“高档不显示过程格”不能作为乘法高档行为描述。
**How to apply:** 讨论题型三档时按“生成器可达题形 → 渲染组件 → 判定策略”顺序核查。只有在该题形会被当前生成器产出时，才把对应 UI/判定写入该档位说明；否则标为“组件理论能力/其他运算路径”，不要写成产品实际行为。
