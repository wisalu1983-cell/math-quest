# ISSUE-068 测试设计方法

**执行日期**：2026-04-29
**范围**：v0.5 Phase 3 · `ISSUE-068` 单行过程积乘法免重复答数
**QA 深度**：L2 Professional
**目标用户画像**：上海五年级学生，数学能力中等，主要在触摸设备上完成竖式填空。

## 测试依据

- `ProjectManager/ISSUE_LIST.md`：`ISSUE-068` 单行过程积乘法竖式要求重复填写答数。
- `ProjectManager/Plan/v0.5/subplans/2026-04-29-v05-phase3-ISSUE-068-单行过程积乘法免重复答数.md`：需求、非目标、验收项。
- `ProjectManager/Specs/a03-vertical-calc/current.md`：A03 竖式、多行乘法、结构化错因和内置键盘当前承诺。
- 当前实现入口：`src/components/MultiplicationVerticalBoard.tsx`、`src/engine/verticalMultiplication.ts`、`src/engine/verticalMultiplicationErrors.ts`、`src/utils/practiceFailureDisplay.ts`。

## 方法选择

| 方法 | 使用原因 | 覆盖点 |
|---|---|---|
| 规格追踪 | 该问题来自用户明确 UX 反馈，需要逐条映射验收项 | 单行过程积免重复、多行仍保留合计、错因语义 |
| 等价类 | 乘法竖式以 `partials.length` 分为单行 / 多行两类 | `90.8 × 5`、`1.2 × 0.3`、`782 × 14` |
| 决策表 | 提交结果取决于最终答案、过程格、训练格组合 | 单行过程积填错、训练格错、最终答数正确 |
| 回归测试 | 变更触及 Phase 3 输入和错因链路 | 内置键盘、训练格错误、旧 Playwright 回归 |
| 视觉 / 拟真人工 charter | 这是 UI 冗余优化，需确认学生视角负担下降 | 页面不再出现重复合计格，提交反馈可理解 |

## 风险假设

- 最大风险不是布局变化本身，而是移除 `total` 行后最终答案来源丢失，导致错误被误判为空或误判为过程错。
- 第二风险是扩大作用域，误删两行及以上部分积乘法中的合计行，破坏真实求和训练。
- 第三风险是旧小数训练格回归用例仍依赖 `积` 行，导致测试与新规格不一致。

## 退出标准

- P0 用例全部 PASS。
- `npm test -- --run`、`npm run build`、`npx playwright test` 均通过。
- scoped ESLint 和 `npm audit --audit-level=high` 无新增阻塞。
- PM 多源回写后 `pm-sync-check` 通过。
- 若有 FAIL，必须进入 `ISSUE_LIST.md` 或经产品裁决接受。
