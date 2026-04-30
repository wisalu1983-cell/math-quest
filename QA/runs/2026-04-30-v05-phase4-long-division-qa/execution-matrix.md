# Execution Matrix · v0.5 Phase 4 BL-010 长除法 UI

**执行日期**：2026-04-30  
**结论**：P0 / P1 功能用例 PASS；全仓 lint 为既有 RISK。

## Commands

| 命令 | 结果 |
|---|---|
| `npm test` | PASS。60 files / 755 tests passed。 |
| `npm run build` | PASS。保留既有 Vite chunk size warning。 |
| `npx playwright test QA/e2e/phase4-long-division.spec.ts --reporter=line` | PASS。4 tests passed。 |
| `npx playwright test --reporter=line` | PASS。42 tests passed。 |
| `npx eslint src/components/LongDivisionBoard.tsx src/components/VerticalCalcBoard.tsx src/engine/longDivision.ts src/engine/generators/vertical-calc.ts src/utils/practiceFailureDisplay.ts QA/e2e/phase4-long-division.spec.ts QA/e2e/phase3-decimal-training-failure.spec.ts` | PASS。无输出。 |
| `npm audit --audit-level=moderate` | PASS。found 0 vulnerabilities。 |
| `git diff --check` | PASS。无输出。 |
| `npm run lint` | RISK。146 problems（145 errors, 1 warning），全仓既有基线；筛选摘要无 `LongDivisionBoard`。 |

## Functional Cases

| ID | Result | Evidence |
|---|---|---|
| LD-ENG-01 | PASS | `src/engine/longDivision.test.ts`；全量 `npm test` |
| LD-ENG-02 | PASS | `src/engine/longDivision.test.ts`；全量 `npm test` |
| LD-ENG-03 | PASS | `src/engine/longDivision.test.ts`；全量 `npm test` |
| LD-ENG-04 | PASS | `src/engine/longDivision.test.ts`；全量 `npm test` |
| LD-ENG-05 | PASS | `src/engine/longDivision.test.ts`；全量 `npm test` |
| LD-ENG-06 | PASS | `src/engine/longDivision.test.ts`；全量 `npm test` |
| LD-ENG-07 | PASS | `src/engine/longDivision.test.ts`；全量 `npm test` |
| LD-ENG-08 | PASS | `src/engine/longDivision.test.ts`；全量 `npm test` |
| LD-ENG-09 | PASS | `src/engine/longDivision.test.ts`；全量 `npm test` |
| LD-GEN-01 | PASS | `src/engine/generators/generators.test.ts`；全量 `npm test` |
| LD-GEN-02 | PASS | `src/engine/generators/generators.test.ts`；高档 `cyclic-div` 结构化长除法题 |
| LD-UI-01 | PASS | `QA/e2e/phase4-long-division.spec.ts:143`；专项与全量 Playwright |
| LD-UI-02 | PASS | `QA/e2e/phase4-long-division.spec.ts:194`；专项与全量 Playwright |
| LD-UI-03 | PASS | `QA/e2e/phase4-long-division.spec.ts:182`；`artifacts/long-division-mobile-375.png` |
| LD-UI-04 | PASS | `QA/e2e/phase4-long-division.spec.ts:143`；`artifacts/long-division-mobile-390.png` |
| LD-UI-05 | PASS | `QA/e2e/phase4-long-division.spec.ts:170`；`artifacts/long-division-desktop-1024.png` |
| LD-DISP-01 | PASS | `src/utils/practiceFailureDisplay.test.ts`；全量 `npm test` |
| LD-REG-01 | PASS | `QA/e2e/phase3-decimal-training-failure.spec.ts:149`；全量 Playwright |

## Gate Check

| 检查项 | 结果 |
|---|---|
| P0 用例是否全部 PASS | PASS |
| P1 用例是否全部 PASS 或明确 RISK | PASS |
| 自动化与视觉证据是否覆盖 375 / 390 / 桌面 | PASS |
| 残余风险是否写明 | PASS |
