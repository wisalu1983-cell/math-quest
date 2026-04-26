# v0.4 已关闭 Issue 归档

> 所属版本：v0.4
> 收口日期：2026-04-26
> 角色：v0.4 收口时从 `ProjectManager/ISSUE_LIST.md` 归档的关闭问题。当前开放问题仍以 `ProjectManager/ISSUE_LIST.md` 为准。

---

## 关闭问题

### ISSUE-059 · `dec-div` 高档残留隐藏 `trainingFields`（P2 · 实现一致性）

- **状态**：✅ 已修复（2026-04-25）
- **来源**：v0.1 延期开放项；2026-04-20 迁入 Backlog；2026-04-25 随 v0.4 启动重新激活
- **类别**：bug / 实现一致性
- **归位**：[`Plan/v0.4/phases/phase-1.md`](phases/phase-1.md)
- **问题摘要**：`dec-div` 高档题仍可能携带隐藏 `trainingFields`，与当前竖式题设计和训练字段暴露策略不一致。
- **修复摘要**：高档 `generateDecimalDiv` 不再输出隐藏 `trainingFields`。
- **关闭证据**：
  - `src/engine/generators/generators.test.ts` 覆盖高档 `dec-div` 不含 `trainingFields`
  - `npm test`：43 files / 643 tests passed
  - Phase 1 QAleader 三层 QA 完成，结论已回写 Phase 1 计划与子计划
- **历史快照**：原始条目详见 [`../v0.1/issues-closed.md`](../v0.1/issues-closed.md)

### ISSUE-065 · 单行竖式已知操作数仍为浅灰低对比（P1 · 视觉可读性）

- **状态**：✅ 已修复（2026-04-26）
- **来源**：QA release gate `QA/runs/2026-04-26-v04-release-gate/visual-result.md` · 用例 `X-002`
- **类别**：UI / a11y / 视觉可读性
- **归位**：`BL-005.1` 竖式颜色可读性回归缺口；影响 `src/components/VerticalCalcBoard.tsx` legacy single-line board
- **问题摘要**：v0.4 Phase 1 已要求“竖式数字 / 符号使用高对比 token”，但 release gate 在 `999 + 888` 单行竖式题中发现已知操作数 `999`、`888` 仍通过 `.digit-cell-empty` 使用 `text-text-3` 浅灰显示。
- **修复摘要**：`renderOperandRow()` 区分真实操作数 / 运算符与空白对齐格；真实 `999`、`888`、`+` 使用 `text-text` 高对比正文色，空白对齐格继续保留 `.digit-cell-empty` 的浅色占位样式。
- **关闭证据**：
  - 新增回归：`QA/e2e/issue-065-vertical-operand-contrast.spec.ts`
  - 复测截图：`QA/runs/2026-04-26-v04-release-gate/artifacts/X-002-issue-065-before-after.png`
  - `npx playwright test QA/e2e/issue-065-vertical-operand-contrast.spec.ts`：1 passed
  - `npx playwright test QA/e2e/phase4-carry-focus.spec.ts`：2 passed
  - `npm test`：55 files / 713 tests passed
  - `npm run build`：通过，仅 Vite chunk warning
