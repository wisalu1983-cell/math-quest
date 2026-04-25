# 执行纪律与验收规则

> 所属版本：v0.4
> 所属主线：[README](./README.md)
> 本文件角色：v0.4 的需求讨论、调研、实施、验收与 PM 回写规则。

---

## 核心原则

v0.4 是题目体验修复版本，风险集中在“孩子是否看得懂、是否被误导、是否真正练到目标能力”。执行优先级为：

1. 用户可感知改善优先于内部实现便利
2. 教学目标清楚优先于题目数量扩张
3. 先诊断再定性，尤其是重复题目和生成器难度问题
4. 局部修复优先，不重启大范围生成器重构
5. 每个子项都要能回到用户反馈来源和验证证据

## 子项通用四步

继承 v0.2 已固化的工作方式，每个非纯执行子项开工前按四步推进：

1. **预期效果提炼**：说明修好后用户会看到什么变化，避免只写“优化”。
2. **资料调研**：查相关代码、Specs、历史 QA / Report，必要时跑抽样或截图验证。
3. **方案设计**：给出方案、影响面、风险、验收方式。
4. **用户审核**：通过后再进入实施；不通过则回到预期或方案阶段。

纯执行性小修（如颜色 token、答案等价判定）可以把四步压缩到同一份子计划 / 对话中，但仍要写清预期效果和验收。

## 规格检索纪律

| 工作类型 | 必查 |
|---|---|
| 竖式笔算 / `dec-div` | `Specs/2026-04-17-generator-redesign-v2.md`、`Specs/2026-04-09-a03-block-b-design.md` |
| 难度与星级 | `Specs/2026-04-16-generator-difficulty-tiering-spec.md`、`Specs/2026-04-15-gamification-phase2-advance-spec.md` |
| 题目 UI / 交互 | `Specs/2026-04-14-ui-redesign-spec.md` |
| 新持久化字段 | `src/sync/merge.ts` 与 v0.3 同步规格 |

若新增或修改正式 Spec，必须同步更新 [`../../Specs/_index.md`](../../Specs/_index.md)。

## Worktree 与开工规则

- 纯文档 / 需求讨论可在当前工作树完成。
- 新增功能、业务逻辑修改、跨文件重构、执行子计划时，默认在 `.worktrees/` 下创建 v0.4 专用 git worktree。
- 在 worktree 内执行计划前，必须确认引用的 `ProjectManager / Specs / Reports / QA` 文档存在；缺失时先同步，或明确声明以主工作区文档为 source of truth。

## 验收纪律

按改动范围选择验收，但版本收口前至少满足：

- `npm test -- --run` 通过
- `npm run build` 通过
- 涉及题目生成器 / 抽题逻辑时，有抽样验证记录
- 涉及 UI / 交互时，有用户视角走查或截图证据
- 涉及 Practice 状态重构时，有行为等价回归测试
- 涉及 PM 多源写入时，`pm-sync-check` 通过

## PM 回写纪律

v0.4 的 PM 回写顺序：

1. 先更新子项权威源：Phase / subplan / Spec / Issue / QA
2. 再更新 [`README.md`](./README.md) 或 [`03-phase-plan.md`](./03-phase-plan.md)
3. 最后在影响活跃视图时更新 [`../../Overview.md`](../../Overview.md)

Backlog / Issue 流转：

- `BL-003` ~ `BL-008` 已纳入 v0.4 后，Backlog 状态必须保持与本版本 Plan 一致。
- `ISSUE-059` 是 bug 类条目，当前版本内跟踪于 [`../../ISSUE_LIST.md`](../../ISSUE_LIST.md)。
- 若 v0.4 过程中发现新的 bug，从 `ISSUE-065` 起继续编号。
- v0.4 收口时必须执行 Backlog 归档：已完成的 `BL-003` ~ `BL-008` 从 Backlog 活跃区移出，只在 `已落地归档` 保留一行 Plan 索引；未完成项回流为候选 / 延期项并写清原因；放弃项进入 `已放弃归档`。
- `ISSUE-059` 收口不走 Backlog 落地归档；若已修复，进入本版本 `issues-closed.md`，若延期，再迁回 Backlog 并保留原 ID。
