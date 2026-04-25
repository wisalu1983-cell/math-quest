---
name: distinguish-formal-qa-run-from-validation-records
description: MathQuest 版本收口要区分正式 QAleader run 与普通验收/测试记录
type: feedback
status: candidate
pattern_key: distinguish-formal-qa-run-from-validation-records
source_tool: codex
source_session: 019dc204-6a70-75d3-8e49-33062a85a287
source_timestamp_start: 2026-04-25T08:49:21.8803431+08:00
source_timestamp_end: 2026-04-25T08:49:21.8803431+08:00
seen_count: 1
first_seen: 2026-04-25
last_seen: 2026-04-25
---

MathQuest 版本收口时，不能把普通验收记录、单元测试记录、build 记录或真实后端脚本记录直接等同于“QAleader 已跑过”。必须检查是否存在正式 QAleader run 目录、三层结果和 summary。

**Why:** v0.3 已有真实 Supabase 验收和全量测试记录，但没有正式 QAleader 三层产物。若直接回答“测过”，会混淆验证强度与流程事实，影响版本收口可信度。

**How to apply:** 当用户问某版本是否跑过 QA/QAleader 时，先查 `QA/runs/` 与对应 Plan/acceptance 引用；再把记录分类为“正式 QAleader run”“非 QAleader 验收记录”“自动化测试记录”“无记录”。需要补跑时，明确 scope 与环境限制，不冒充真实后端重验。
