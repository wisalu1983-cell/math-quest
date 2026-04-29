# Automated Result

**范围**：v0.5 Phase 3 `BL-011` 自动换格统一化  
**日期**：2026-04-29  
**结果**：PASS

## Red-Green Evidence

| 阶段 | 命令 | 结果 |
|---|---|---|
| RED · 单测 | `npm test -- --run src/pages/practice-math-keyboard.test.ts src/pages/PracticeMathKeyboard.test.ts` | 预期失败：5 failed。缺少 `resolveAutoAdvanceSlotId` 与 fixed-bottom class。 |
| RED · E2E | `npx playwright test QA/e2e/phase3-keyboard-autofocus.spec.ts --reporter=line` | 预期失败：4 failed。商余数、多空、训练格不跳；乘法仍左到右。 |
| GREEN · 专项 | `npx playwright test QA/e2e/phase3-keyboard-autofocus.spec.ts --reporter=line` | 7 passed。 |
| 补测 · 用例 ID 矩阵 | `npm test -- --run src/pages/practice-math-keyboard.test.ts src/pages/PracticeMathKeyboard.test.ts` | PASS。2 files / 14 tests passed。 |
| 补测 · 用例 ID 矩阵 | `npx playwright test QA/e2e/phase3-keyboard-autofocus.spec.ts --reporter=line` | PASS。8 tests passed。新增 `U-EDIT-01` 当前行为观察。 |

## Final Automation

| 命令 | 结果摘要 |
|---|---|
| `npm test -- --run` | PASS。59 files / 738 tests passed。 |
| `npx playwright test --reporter=line` | PASS。21 tests passed。 |
| `npx eslint src/pages/practice-math-keyboard.ts src/pages/PracticeMathKeyboard.tsx src/pages/Practice.tsx src/components/VerticalCalcBoard.tsx src/components/MultiplicationVerticalBoard.tsx src/components/DecimalTrainingGrid.tsx src/previews/MultiplicationVerticalBoardPreview.tsx QA/e2e/phase3-keyboard-autofocus.spec.ts QA/e2e/phase3-decimal-training-failure.spec.ts` | PASS。无输出。 |
| `npm run build` | PASS。保留既有 Vite chunk size warning。 |
| `npx tsx scripts/pm-sync-check.ts` | PASS。PM 文档同步检查通过。 |

## Notes

- 全量 Playwright 首轮发现两个回归：固定键盘被题卡布局上下文限制、旧训练格测试未适配右到左输入顺序。已修复并复跑通过。
- `PracticeMathKeyboard` 使用 portal 后，新增 E2E 断言键盘底边贴近视口底部且滚动后位置不变。
- 2026-04-29 补测新增 [`execution-matrix.md`](./execution-matrix.md)，将 `test-cases-v1.md` 的每个用例 ID 映射到 Result / Evidence；专项 Playwright 当前为 8 tests passed。
