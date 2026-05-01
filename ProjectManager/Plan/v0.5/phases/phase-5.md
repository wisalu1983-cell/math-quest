# Phase 5 · Release Gate 与 Living Spec 回写

> 所属版本：v0.5
> 创建：2026-05-01
> 所属主线：[../README](../README.md)
> 状态：✅ 已完成（Phase 5 hotfix、审计 hardening、Release Gate QA 已完成；已合并 `master` 并完成版本收口）

---

## 目标

Phase 5 是 v0.5 的 Release Gate。目标是在 Phase 2~4 已完成后，收口版本级正确性、生成器重复风险、QA 与 PM 生命周期：关闭 `ISSUE-069`，完成 `BL-017` 全题型样例池 / 重复风险审计判断，执行版本级验证，并在验收后完成版本收口。

本文件只作为阶段级入口；具体修复、审计证据和验证拆解下沉到子计划。

## 输入

- v0.5 Phase 总图：[`../03-phase-plan.md`](../03-phase-plan.md)
- 执行纪律：[`../04-execution-discipline.md`](../04-execution-discipline.md)
- 当前 issue：[`../../../ISSUE_LIST.md`](../../../ISSUE_LIST.md)
- 当前 Backlog：[`../../../Backlog.md`](../../../Backlog.md)
- 规格索引：[`../../../Specs/_index.md`](../../../Specs/_index.md)
- A03 current spec：[`../../../Specs/a03-vertical-calc/current.md`](../../../Specs/a03-vertical-calc/current.md)
- Phase 4 入口：[`phase-4.md`](phase-4.md)

## 范围

### 纳入

- `ISSUE-069`：A02 `reverse-round` 模板 4 的题干与答案口径修复。
- `BL-017`：审计 `src/engine/generators/` 下硬编码样例池、有限枚举池和高频重复风险。
- 对 v0.5 新增 / 当前发布相关的低风险重复点做小范围 hardening。
- 跑与变更风险匹配的自动化、build、PM sync 和 Release Gate QA。
- 根据验证结果关闭 `ISSUE-069`，并决定 `BL-017` 是落地归档、部分落地后回流 v0.6，还是阻塞 v0.5。

### 不纳入

- 不在 v0.5 内全量重写 A01~A08 所有生成器样例池。
- 不把旧题型概念模板池的系统性扩容塞进 Release Gate。
- 不改变 v0.5 Phase 2~4 已验收的核心交互边界。
- 不处理 Phase 3 真实 Android Chrome / iOS Safari 线上补验证据，仍按既有 DEFERRED 口径跟踪。

## 子计划

| 子计划 | 目标 | 状态 | 备注 |
|---|---|---|---|
| [`ISSUE-069` reverse-round 填空答案口径修复](../subplans/2026-05-01-v05-phase5-ISSUE-069-reverse-round填空答案口径修复.md) | 修复模板 4 “□ 里最大 / 最小能填几”只填方框数字的判定口径 | ✅ 完成 | 已完成 TDD 红绿、全量 Vitest、build 与 issue 关闭 |
| [`BL-017` 题型生成器样例池审计](../subplans/2026-05-01-v05-phase5-BL-017-题型生成器样例池审计.md) | 全题型重复风险审计，修复 v0.5 新增 `cyclic-div` 3 样例池风险，剩余系统性问题分流 | ✅ 完成 | 已完成样本审计、TDD 红绿、全量 Vitest、build 与 Backlog 回写 |

## 决策门

| 决策 | 当前处理 |
|---|---|
| `ISSUE-069` 是否扩大到 A02 系统重做 | 不扩大。只修模板 4 答案 / explanation 与回归测试。 |
| `BL-017` 是否阻塞 v0.5 | 初判不阻塞。系统性样例池问题转 v0.6，v0.5 只修当前新增 `vertical-calc/cyclic-div` 的 3 样例池风险。 |
| Living Spec 是否回写 | `ISSUE-069` 无独立 current spec；`BL-017` 的 broad generator-quality 规则转 v0.6，不在本阶段写成 current spec。A03 current spec 若需补充 `cyclic-div` 样本池口径，在 Release Gate 验收后再判断。 |
| QA 层级 | 已完成 scoped generator tests、全量 Vitest、build、Playwright、audit、pm-sync-check 与版本级 Release Gate QA；合并后复验补齐循环小数结果格自动换格口径；结论为 PASS-WITH-NOTES。 |

## 收尾条件

- `ISSUE-069` 相关测试红绿闭环完成，生成器与判题口径一致。
- `BL-017` 有全题型审计结论，v0.5 内要修的点已修，剩余项有明确版本分流。
- `npm test -- --run` 通过。
- `npm run build` 通过。
- `npx tsx scripts/pm-sync-check.ts` 通过。
- Release Gate QA 有明确 PASS / PASS-WITH-NOTES / BLOCKED 结论。
- `ISSUE_LIST.md`、`Backlog.md`、`Overview.md`、`README.md`、`03-phase-plan.md` 状态一致。

## 当前状态

Phase 5 已在隔离分支 `codex/v05-phase5-release-gate` 完成实现与验证，并已合并至 `master`。当前已完成 `ISSUE-069` 与 `vertical-calc/cyclic-div` 的失败测试、最小修复、全量 Vitest、build、Playwright、audit、pm-sync-check 和 Release Gate QA；`ISSUE-069` 已关闭，`BL-017` 已回写 Backlog，QA 产物见 [`../../../QA/runs/2026-05-01-v05-phase5-release-gate/qa-summary.md`](../../../QA/runs/2026-05-01-v05-phase5-release-gate/qa-summary.md)。当前没有阻塞 v0.5 收口的 open issue。
