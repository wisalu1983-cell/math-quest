# ISSUE-068 单行过程积乘法免重复答数测试用例 v1

**执行日期**：2026-04-29
**范围**：v0.5 Phase 3 · `ISSUE-068`
**QA 深度**：L2 Professional
**目标用户画像**：上海五年级学生，数学能力中等。
**设计方法**：风险驱动、规格追踪、等价类、决策表、回归测试、探索式 charter。

## Traceability Summary

| Task / Spec / Issue | Test Basis | 用例族 | 覆盖目标 |
|---|---|---|---|
| `ISSUE-068` 单行过程积乘法竖式要求重复填写答数 | `ISSUE_LIST.md`、用户 2026-04-29 反馈 | I-068 | 免重复合计行、最终答案来源、反馈语义 |
| T1：单行 / 多行计算行 helper | `verticalMultiplication.ts` | I-068-AUTO | 单行只返回 partial，多行返回 partials + total |
| T2：分类器 final key 来源 | `MultiplicationVerticalBoard.submit()`、`verticalMultiplicationErrors.ts` | I-068-AUTO / I-068-E2E | 单行过程积填错按最终答案错处理 |
| T3：小数训练字段和内置键盘回归 | Phase 3 `BL-011` / `ISSUE-067` | I-068-REG | 训练格仍可提交并显示结构化错因 |

## Risk Model

| Risk ID | 风险 | 影响 | 可能性 | 优先级 | 对应用例族 |
|---|---|---|---|---|---|
| R1 | 单行过程积仍显示重复合计行 | 中 | 高 | P0 | I-068-001 |
| R2 | 移除 `total` 行后最终答案来源为 `undefined` 或被空 `finalAnswerKeys` 跳过 | 高 | 中 | P0 | I-068-002, I-068-004 |
| R3 | 单行过程积填错被误报为“最终答案对但步骤错” | 高 | 中 | P0 | I-068-002 |
| R4 | 多行部分积合计行被误删 | 高 | 低 | P0 | I-068-003 |
| R5 | 小数训练字段 / 结构化错因回归 | 中 | 中 | P1 | I-068-005 |
| R6 | 普通最终答案错路径显示空的“未通过原因”块 | 中 | 中 | P1 | I-068-006 |

## I-068：竖式乘法行为

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| I-068-001 | `90.8 × 5` 单行过程积不展示重复合计行 | `ISSUE-068`、T1 | R1 | 等价类 | P0 | 注入固定小数乘法题 | 打开 Practice，统计 `第 1 个部分积` 与 `积` textbox | 部分积格存在；`积第 N 格` 数量为 0 | 学生只填真实计算步骤，不再抄一遍 | Playwright + 截图 |
| I-068-002 | 单行过程积填错按最终答案错误处理 | 用户确认、T2 | R2 / R3 / R6 | 决策表 | P0 | `90.8 × 5`，最终答数填 `454`，过程积填 `4541` | 提交题目 | 进入普通错答反馈，显示正确答案；不显示过程错因，不显示空“未通过原因” | 学生感知为答案错，不被误导成步骤错 | Playwright |
| I-068-003 | 多行部分积仍保留合计行 | 非目标、多行乘法现有规格 | R4 | 等价类 | P0 | `782 × 14` layout | 调用 calculation rows helper | 行 ID 为 `partial-0`、`partial-1`、`total` | 多行求和训练仍保留 | Vitest |
| I-068-004 | 空 `finalAnswerKeys` 不跳过最终答案判断 | T2 审核修正项 | R2 | 边界值 | P0 | 直接调用分类器 | 传入空 `finalAnswerKeys` 且最终答案错误 | 返回 `failWrongAnswer` | 系统不会把最终答案来源判空后误过 | Vitest |
| I-068-005 | 小数训练格错误仍显示结构化错因 | Phase 3 `ISSUE-067` | R5 | 回归测试 | P1 | `1.2 × 0.3`，唯一过程积填对，小数移动位数填错 | 提交题目 | 展示 `小数训练格有错误` 和用户值 / 正确值 | 训练价值不因移除合计行丢失 | Playwright |
| I-068-006 | wrong-answer 不渲染空错因块 | 失败诊断新增发现 | R6 | 回归测试 | P1 | `failureReason='wrong-answer'` 无 `failureDetail` | 调用展示 helper / 浏览器提交 | display 不可展示；练习页不出现空“未通过原因” | 普通错答反馈保持干净 | Vitest + Playwright |

## Exploratory Charters

| ID | Charter | Test Basis | Risk | Technique | Priority | Preconditions | Mission / Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| U-068-001 | 作为学生检查 `90.8 × 5` 是否少做无意义抄写 | 用户反馈截图 | R1 / R3 | Exploratory charter | P1 | 390px 级移动视口，固定题 | 查看竖式区域、输入顺序、提交后的错误反馈 | 只看到一行过程积；填错后是普通错答反馈 | 任务减少且反馈不绕 | 模拟人工 / 视觉 |

## Coverage Matrix

| Risk | Covered By | Residual Risk |
|---|---|---|
| R1 | I-068-001, U-068-001 | 无 |
| R2 | I-068-002, I-068-004 | 无 |
| R3 | I-068-002 | 无 |
| R4 | I-068-003 | 无 |
| R5 | I-068-005 | 无 |
| R6 | I-068-002, I-068-006 | 无 |

## Exit Criteria

- P0 用例全部 PASS。
- P1 用例全部 PASS 或明确 residual risk。
- 全量 Vitest、生产构建、全量 Playwright 通过。
- scoped ESLint、依赖高危审计、PM sync check 通过。

## Execution Summary

| 层级 | 结果 | 证据 |
|---|---|---|
| Code Review | PASS | `code-review-result.md` |
| 自动化 | PASS | `automated-result.md` |
| 拟真人工 / 视觉 | PASS | `manual-result.md`、`visual-result.md` |
| Execution Matrix | PASS | `execution-matrix.md` |

## Defect Triage

| 类型 | 数量 | 处理 |
|---|---:|---|
| FAIL | 0 | 无 |
| RISK | 0 | 无 |
| Observation | 1 | 生产构建仍有既有 Vite chunk size warning，本轮不扩大处理 |
