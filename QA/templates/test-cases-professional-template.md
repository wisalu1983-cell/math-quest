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

## Prototype Parity Matrix（如适用）

> 适用条件：功能存在已确认 UI / 交互预览原型，例如 `?preview=*` 页面、HTML 原型、截图、设计稿或预览分支。预览原型只能作为 oracle / 对照依据，最终证据必须来自开发落地版本或真实游戏流。

| ID | Prototype Source / Approval | 原型期望 | 开发落地版本观察 | Evidence | Result | 备注 / 偏离裁决 |
|---|---|---|---|---|---|---|
| P-001 | <预览 URL / 设计稿 / 截图 / 批准记录> | <关键状态、布局、交互步骤、焦点、输入规则、显隐时机、反馈文案、视觉 token 或响应式边界> | <真实页面或游戏流观察> | <截图、Playwright 测试、人工记录或报告链接> | PASS / FAIL / RISK / BLOCKED | <若有意偏离，链接 Plan / Spec / 用户裁决> |

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

## Execution Matrix

> 执行矩阵是 QA 结论的事实源。每个 Functional Case 和 Exploratory Charter 都必须有一行当前结果；命令级 PASS 不能替代用例 ID 级记录。

| ID | Result | 执行方式 | Evidence | 备注 / 残余风险 |
|---|---|---|---|---|
| F-001 | PASS / FAIL / RISK / BLOCKED / SKIP | <Vitest / Playwright / 模拟人工 / Code Review> | <测试名、源码行、截图、命令输出摘要或报告链接> | <必要说明> |
| U-001 | PASS / FAIL / RISK / BLOCKED / SKIP | <模拟人工 / 视觉 QA / Playwright 观察> | <四栏记录、截图或报告链接> | <用户感知和后续观察条件> |

## Exit Criteria

- P0 用例全部 PASS。
- P1 可有 RISK，但必须写入 summary 的 residual risk。
- FAIL 必须进入 `ProjectManager/ISSUE_LIST.md` 或经产品裁决接受。
- 自动化失败不得写成 QA PASS。
- `Execution Matrix` 必须覆盖测试用例表中所有 ID；缺少 P0 / P1 结果不得声明 QA PASS。
- 若存在已确认预览原型，`Prototype Parity Matrix` 中 P0 / P1 原型项必须全部有开发落地版本证据；未说明依据的偏离不得声明 QA PASS。
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
