# Phase 5：Practice 工程质量

> 所属：v0.4-5
> 状态：🟡 工程方案已定，等待实施闸门
> 来源：`BL-004`
> 启动准备：[`../subplans/2026-04-26-phase5-Practice状态重置启动准备.md`](../subplans/2026-04-26-phase5-Practice状态重置启动准备.md)

---

## 目标

把 Practice 答题页“切下一题时手动重置多份输入状态”的实现清理为统一机制，降低后续继续叠题型和交互时的维护成本。

本 Phase 是工程质量收尾项，不阻塞 Phase 2~4 的题目体验主线。工程方案已定：采用纯初始化函数 + 本地 reducer / hook，把 Practice 页输入态收敛到统一 reset 机制。代码实施需等 Phase 4 最终验收稳定后启动。

## 范围

| 子项 | 内容 | 备注 |
|---|---|---|
| 5.0 | 启动准备 | 已建立子计划，完成边界、状态盘点、方案定稿和验收门 |
| 5.1 | 梳理 Practice 当前状态重置点 | 重点关注 `answer`、`remainderInput`、选择态、多空、训练格完成态 |
| 5.2 | 设计统一状态重置机制 | 已定稿：纯初始化函数 + reducer / hook；必须保持用户行为等价 |
| 5.3 | 补回归测试 | 覆盖切题、答题、反馈、不同题型输入、训练格 |

## 当前启动判断

- `BL-004` 已纳入 v0.4，但属于工程质量 / 技术债，不应抢在 Phase 4 验收修补前改同一页面。
- 当前已完成方案定稿：新增 `practice-input-state.ts`，用 `createInitialPracticeAnswerState(question)` 和 reducer 统一管理输入态。
- 代码实施前必须先补行为基线测试，避免“清状态”重构改变答题体验。

## 进入条件

- Phase 4 最终验收没有要求继续大改 `Practice.tsx` 的反馈或提交路径
- 先补或确认现有行为测试，避免重构改变体验

## 收尾条件

- 重构前后用户可见行为等价
- Practice 相关回归测试通过
- `npm test -- --run` 和 `npm run build` 通过
