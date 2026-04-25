---
name: preserve-existing-low-tier-when-restructuring-topics
description: 题型信息架构重排时，要显式审计原低档子题型并保留仍适合低档的应用练习
type: feedback
status: candidate
pattern_key: preserve-existing-low-tier-when-restructuring-topics
source_tool: codex
source_session: unknown
source_timestamp_start: 2026-04-25T00:00:00.000+08:00
source_timestamp_end: 2026-04-25T00:00:00.000+08:00
seen_count: 1
first_seen: 2026-04-25
last_seen: 2026-04-25
---

在 MathQuest 题型信息架构重排中，不能只按“新前置知识 → 原题型应用层”的粗线条迁移。需要先审计原题型的低档子题型，判断哪些本来就是“从规则到应用”的第一层练习，并把这些内容保留在低档。

**Why:** 用户指出 A04/A06 断联并入 A07 的设计文档把原 A07 子题型全都挪到中高档，遗漏了 `bracket-normal` / `extract-factor` 这类原 A07 低档基础应用。这样会让新 A07 低档只剩前置知识，缺少从认识规则到使用规则的第一步。

**How to apply:** 以后合并或重排题型 IA 时，先按现有 generator/campaign 的 difficulty 和 lane 列出原子题型，再逐项标注“保留低档 / 后移中档 / 后移高档 / 废弃”。文档中必须明确原低档应用是否保留，避免整体搬运导致梯度断层。
