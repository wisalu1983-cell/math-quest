# v0.5 Phase 3 BL-011 自动换格统一化测试用例 v1

**执行日期**：2026-04-29  
**范围**：Phase 3 `BL-011` follow-up 自动换格统一化  
**QA 深度**：L2 Professional  
**设计方法**：规格追踪、缺陷回归、等价类、边界值、状态迁移、探索式 charter
**执行矩阵**：[`execution-matrix.md`](./execution-matrix.md)

## Traceability Summary

| Task / Spec | Test Basis | 用例族 | 覆盖目标 |
|---|---|---|---|
| T1-T2 | 自动换格统一化 subplan §5 / §6 | G-KBD | 通用键盘 helper 与组件执行 |
| T3 | 自动换格统一化 subplan §5.2 | G-PRAC | 商余数、多空、训练格自动换格 |
| T5 | 自动换格统一化 subplan §5.3 / §6 | I-MUL | 多行乘法右到左与 Tab |
| 固定底部 | BL-011 原子计划 / 用户反馈 | X-MOB | 键盘固定视口底部、不随题卡滚动 |
| QA 观察 | 自动换格统一化 subplan §8 / §11 | U-EDIT | 编辑回填体验风险 |

## Functional Cases

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| G-KBD-01 | slot 未声明自动换格 | subplan §5.1 | R2 | 等价类 | P0 | Vitest | 调用 `resolveAutoAdvanceSlotId` | 返回 `null` | 普通答案不被误跳 | 自动化 |
| G-KBD-02 | `delete` 按键 | subplan §5.1 | R2 | 边界值 | P0 | Vitest | `shouldAutoAdvance` 返回 true 时按 delete | 返回 `null` | 删除只修改当前格 | 自动化 |
| G-KBD-03 | 满足完成条件且存在下一 slot | subplan §5.1 | R2 | 状态迁移 | P0 | Vitest | 输入有效数字后回调返回 true | 返回下一 slot id，回调收到 key/previous/next | 填满后自然前进 | 自动化 |
| X-MOB-01 | 内置键盘固定视口底部 | 用户反馈 / subplan §9 | R1 | 缺陷回归 | P0 | 390x844 Playwright | 打开竖式题并滚动页面 | 键盘底边贴近视口底部，滚动后位置不变 | 键盘不跟着题卡跑 | 自动化 / 视觉 |
| G-PRAC-01 | 商余数 | subplan §5.2 | R3 | 等价类 | P1 | `37 ÷ 3 = 12...1` | 输入 `1` 后仍在商，输入 `2` 后到余数 | active 样式移动到余数 | 按商长度完成后继续填余数 | 自动化 |
| G-PRAC-02 | multi-blank | subplan §5.2 | R3 | 等价类 | P1 | blanks `[12, 3]` | 输入 `1` 留在第 1 空，输入 `2` 到第 2 空 | active 样式移动 | 按每空答案长度前进 | 自动化 |
| G-PRAC-03 | trainingFields | subplan §5.2 | R3 | 等价类 | P1 | 两个训练字段 | 第 1 字段填满后到第 2 字段 | active 样式移动 | 训练格节奏连续 | 自动化 |
| I-MUL-01 | 多行乘法计算行右到左 | subplan §5.3 | R4 | 缺陷回归 | P0 | `90.8 × 5` | 初始 active 在最右侧过程格，输入后向左 | 部分积 / 总积行内右到左 | 符合低位到高位笔算 | 自动化 |
| I-MUL-02 | 桌面 Tab 与 slot 顺序一致 | 用户评审建议 / subplan §5.3 | R5 | 状态迁移 | P1 | 1024x768 | `Tab` 前进、`Shift+Tab` 回退 | 焦点按右到左顺序移动 | 桌面输入不分叉 | 自动化 |
| I-REG-01 | legacy 竖式格不回归 | 历史 ISSUE-066 / subplan §6 | R2 | 缺陷回归 | P0 | `50 - 20` | 内置键盘输入个位 `0` | 自动移动到下一格 | 旧竖式节奏保留 | 自动化 |

## Exploratory Charters

| ID | Charter | Risk | Priority | Mission / Procedure | Oracle / Expected Result | Result |
|---|---|---|---|---|---|---|
| U-EDIT-01 | 编辑回填再次自动换格 | R6 | P2 | 填满 A 自动到 B，点回 A 修改，再次填满 | 初版允许再次跳到 B；若学生修正时明显被打断，后续调整为首次填满才跳 | RISK，保留后续真实学生观察 |
| U-MOB-01 | 手机竖屏遮挡观察 | R1 | P0 | 390x844 下检查键盘、题卡、active 态和提交路径 | 键盘固定在视口底部；可通过滚动把当前输入和提交按钮带到键盘上方 | PASS |

## Coverage Matrix

| Risk | Covered By | Residual Risk |
|---|---|---|
| R1 | X-MOB-01, U-MOB-01 | 无阻塞；真实 Android / iOS 仍沿 Phase 3 线上补验 |
| R2 | G-KBD-01~03, I-REG-01 | 无 |
| R3 | G-PRAC-01~03 | 无 |
| R4 | I-MUL-01 | 无 |
| R5 | I-MUL-02 | 无 |
| R6 | U-EDIT-01 | 保留体验观察 |

## Exit Criteria

- P0/P1 全部 PASS。
- P2 可保留 RISK，但必须在 summary 说明。
- Playwright、Vitest、scoped ESLint、build、PM sync check 均需通过。
