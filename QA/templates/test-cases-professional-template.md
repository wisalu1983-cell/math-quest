# <scope> 测试用例 v<N>

**执行日期**：YYYY-MM-DD
**范围**：<phase / issue / feature / release>
**QA 深度**：L1 Standard / L2 Professional / L3 Release Gate
**目标用户画像**：<目标用户>
**设计方法**：<风险驱动 / 规格追踪 / 等价类 / 边界值 / 决策表 / 状态迁移 / 统计抽样 / 探索式 charter>

## Traceability Summary

| Task / Spec / Issue | Test Basis | 用例族 | 覆盖目标 |
|---|---|---|---|
| <T1 / ISSUE-001> | <Plan / Spec path> | <F-XXX> | <目标> |

## Risk Model

| Risk ID | 风险 | 影响 | 可能性 | 优先级 | 对应用例族 |
|---|---|---|---|---|---|
| R1 | <风险描述> | 高 / 中 / 低 | 高 / 中 / 低 | P0 / P1 / P2 | <用例族> |

## <用例族>：<模块名称>

设计意图：<从 Spec / Plan 提炼一句话，说明为什么要测这一组。>

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| F-001 | <测试条件> | <文档/代码/裁决> | R1 | <等价类/边界值/统计抽样/...> | P0 | <前置条件> | <操作步骤/命令> | <可判定结果> | <用户感知> | 自动化 / Code Review / 模拟人工 |

## Exploratory Charters

| ID | Charter | Test Basis | Risk | Technique | Priority | Preconditions | Mission / Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| U-001 | <用户视角任务> | <依据> | R1 | Exploratory charter | P1 | <前置条件> | <探索任务> | <可接受/不可接受边界> | <体验目标> | 模拟人工 |

## Coverage Matrix

| Risk | Covered By | Residual Risk |
|---|---|---|
| R1 | F-001, U-001 | <无 / 后续观察> |

## Exit Criteria

- P0 用例全部 PASS。
- P1 可有 RISK，但必须写入 summary 的 residual risk。
- FAIL 必须进入 `ProjectManager/ISSUE_LIST.md` 或经产品裁决接受。
- 自动化失败不得写成 QA PASS。
- 对随机生成器，必须记录 seed / 样本量 / 验收带。

## Execution Summary

| 层级 | 结果 | 证据 |
|---|---|---|
| Code Review | PASS / FAIL / RISK / SKIP | <报告或代码引用> |
| 自动化 | PASS / FAIL / RISK / SKIP | <命令输出摘要> |
| 拟真人工 / 视觉 | PASS / FAIL / RISK / SKIP | <报告或截图路径> |

## Defect Triage

| 类型 | 数量 | 处理 |
|---|---:|---|
| FAIL | 0 | <无 / ISSUE-xxx> |
| RISK | 0 | <无 / 后续观察> |
| Observation | 0 | <无 / Backlog> |
