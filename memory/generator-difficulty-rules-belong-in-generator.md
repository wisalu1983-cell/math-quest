---
name: generator-difficulty-rules-belong-in-generator
description: MathQuest 生成器难度档规则应优先落在生成器档位分支，而不是关卡局部补丁
type: feedback
status: rejected
pattern_key: mathquest-generator-difficulty-rule-placement
source_tool: codex
source_session: codex-desktop-2026-04-25-mathquest-v04-phase2
source_timestamp_start: 2026-04-25T14:19:17.138+08:00
source_timestamp_end: 2026-04-25T14:19:17.138+08:00
seen_count: 1
first_seen: 2026-04-25
last_seen: 2026-04-25
---

MathQuest 中，如果新题目形态本质属于某个 difficulty 档位的定义（例如 A03 `difficulty=4-5` 中加入 `2位数 × 2位数` 作为乘法竖式桥接），应优先把规则放进对应生成器的 difficulty 分支，而不是做成某个闯关关卡的局部出题补丁。

Rejected: 用户指出这是本次功能设计取舍，不应计入候选记忆。

**Why:** 闯关、进阶、段位赛共用底层生成器；档位规则放在生成器层可以保持三种模式对同一 difficulty 语义一致，避免关卡补丁造成后续规格和实现分叉。
**How to apply:** 需求讨论时先判断规则是“模式/关卡专属”还是“difficulty 档位语义”。若属于档位语义，更新生成器分支与抽样验收；仅在用户明确要求模式专属时才放到 session/level 层。
