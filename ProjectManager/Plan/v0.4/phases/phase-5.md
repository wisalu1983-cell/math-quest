# Phase 5：Practice 工程质量

> 所属：v0.4-5
> 状态：✅ 已完成开发与 QA
> 来源：`BL-004`
> 启动准备：[`../subplans/2026-04-26-phase5-Practice状态重置启动准备.md`](../subplans/2026-04-26-phase5-Practice状态重置启动准备.md)

---

## 目标

把 Practice 答题页“切下一题时手动重置多份输入状态”的实现清理为统一机制，降低后续继续叠题型和交互时的维护成本。

本 Phase 是工程质量收尾项，不阻塞 Phase 2~4 的题目体验主线。已采用纯初始化函数 + 本地 reducer + `usePracticeInputState()` hook，把 Practice 页输入态、换题 reset 和首输入聚焦收敛到统一入口，并通过 TDD、自动化和拟真人工 QA 验收。

## 范围

| 子项 | 内容 | 备注 |
|---|---|---|
| 5.0 | 启动准备 | 已完成：边界、状态盘点、方案定稿和验收门 |
| 5.1 | 梳理 Practice 当前状态重置点 | 已完成：覆盖 `answer`、`remainderInput`、选择态、多空、训练格完成态 |
| 5.2 | 设计统一状态重置机制 | 已完成：纯初始化函数 + reducer + `usePracticeInputState()` hook |
| 5.3 | 补回归测试 | 已完成：Vitest + Playwright 覆盖切题、输入 reset、focus、非输入态隔离 |

## 收口结果

- `BL-004` 已落地：新增 `src/pages/practice-input-state.ts`，`Practice.tsx` 改为消费 `usePracticeInputState(currentQuestion)`。
- 原分散输入态和换题 reset/focus effect 已移除；focus 副作用归属 hook reset 入口。
- QAleader 三层 QA 已完成，记录见 [`../../../../QA/runs/2026-04-26-v04-phase5-practice-reset/qa-summary.md`](../../../../QA/runs/2026-04-26-v04-phase5-practice-reset/qa-summary.md)。
- 未发现新 ISSUE。

## 进入条件

- ✅ Phase 4 已收口。
- ✅ TDD 行为基线已补齐并通过。

## 收尾条件

- ✅ 重构前后用户可见行为等价。
- ✅ Practice 相关回归测试通过：`npm test -- src/pages/practice-input-state.test.ts`、`npx playwright test QA/e2e/phase5-practice-input-reset.spec.ts`。
- ✅ 全量验证通过：`npm test`、`npm run build`、`npx playwright test`。
