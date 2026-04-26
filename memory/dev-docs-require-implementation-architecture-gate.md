---
name: dev-docs-require-implementation-architecture-gate
description: MathQuest 开发文档不能只完成产品口径，必须显式通过实现架构决策门后才算可开工
type: feedback
status: candidate
pattern_key: mathquest-dev-doc-implementation-architecture-gate
source_tool: codex
source_session: codex-desktop-current-thread
source_timestamp_start: 2026-04-25T16:45:00.000+08:00
source_timestamp_end: 2026-04-25T16:45:00.000+08:00
seen_count: 2
first_seen: 2026-04-25
last_seen: 2026-04-26
---

MathQuest 的开发文档在声明“正式完整 / 可开工”前，不能只写清产品需求、PM 范围和验收口径，还必须补齐程序开发视角的架构决策：模块 ownership 与依赖方向、类型/API 契约、持久化与版本迁移、标识符命名空间、UI 容量/响应式约束，以及这些决策对应的测试/QA 映射。

**Why:** 用户指出 Phase 2 文档产品口径已经完整，但仍缺一层“程序开发视角的架构决策补丁”。这种缺口会让实现阶段在生成器依赖、类型处理、迁移版本、子题型 ID 等问题上重新开讨论，降低开发文档的可执行性。
**How to apply:** 写 MathQuest subplan 或 phase 开发文档时，先按需求/范围写清楚，再执行“实现架构决策门”。若任一维度未定义，文档状态只能标为“待架构补丁”或“有阻塞项”，不能标为“正式完整”。相关流程应维护在 `.claude/skills/dev-doc-flow/SKILL.md`。

2026-04-26 复现：用户审核 Phase 5 Practice 状态重置方案时指出，方案虽然有状态盘点和 TDD 顺序，但缺少 `focus()` DOM 副作用归属，以及自定义 hook 的最终 API 边界。实现架构决策门需要覆盖副作用 ownership、hook / facade 调用面、effect 归属，而不只写“使用 reducer / hook”这种可解释空间过大的方案。
