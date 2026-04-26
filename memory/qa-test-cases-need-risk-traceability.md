---
name: qa-test-cases-need-risk-traceability
description: MathQuest QAleader 测试用例不能只列功能点，需按项目性质补风险、规格追踪、测试技术与 oracle
type: feedback
status: candidate
pattern_key: mathquest-qa-test-cases-risk-traceability
source_tool: codex
source_session: rollout-2026-04-25T23-33-12-019dc546-0087-79c2-8b2d-45f24118342b
source_timestamp_start: 2026-04-26T00:00:00.000+08:00
source_timestamp_end: 2026-04-26T00:14:00.000+08:00
seen_count: 3
first_seen: 2026-04-26
last_seen: 2026-04-26
---

MathQuest 的 QAleader 测试用例不能只写“运行某命令、检查某指标”的轻量清单。对于题目生成、教育游戏体验、随机分布和 session 去重这类阶段，测试用例必须从项目性质、版本阶段和开发文档反推风险模型、规格追踪矩阵、测试设计技术、oracle 与用户体验预期。

2026-04-26 的 v0.4 `ISSUE-066` 竖式输入 hotfix 进一步说明：交互组件的测试不能只验证最终 UI 状态，如“填格后焦点跳到哪里”。隐藏 input、自绘输入格、软键盘、组合输入这类机制本身也必须作为风险源建模，覆盖事件入口所有权、DOM value 残留、重复消费、删除路径和用户语义映射。

**Why:** 用户指出 Phase 3 QA 用例“太简单”。本项目的核心质量风险不只是代码能跑，而是题目是否符合教学梯度、随机分布是否稳定、compare 是否有思考价值、重复治理是否不误杀题型、以及 QA 结论是否足以支撑进入下一 Phase。简单用例无法证明这些风险已覆盖。
**How to apply:** 为 MathQuest 写 QAleader 用例时，至少包含：1）Test Basis（Plan/Spec/Task 文档）；2）Risk ID 与优先级；3）Technique（等价类、边界值、决策表、状态迁移、组合覆盖、统计抽样、探索式 charter 等）；4）Oracle / Expected Result；5）Expected UX；6）Verification 层级；7）Coverage Matrix。对于随机生成器和题目质量任务，必须补统计抽样与拟真人工题感判定。对于输入组件，必须补输入机制风险：桌面键盘、软键盘 input、删除 inputType、多事件入口重复消费、DOM value 清理、字符交集值和内部符号到用户语义的映射。
