# Execution Matrix

**范围**：v0.5 Phase 3 `BL-011` 自动换格统一化  
**补测日期**：2026-04-29  
**补测原因**：原记录只有命令级 PASS 与 charter 分组结果，缺少测试用例 ID 级 Result / Evidence 映射。  
**结论**：P0 / P1 用例均有逐项 PASS 证据；`U-EDIT-01` 保持 RISK，作为体验观察项不阻塞。

## Commands

| 命令 | 结果 |
|---|---|
| `npm test -- --run src/pages/practice-math-keyboard.test.ts src/pages/PracticeMathKeyboard.test.ts` | PASS。2 files / 14 tests passed。Start at 16:22:31。 |
| `npx playwright test QA/e2e/phase3-keyboard-autofocus.spec.ts --reporter=line` | PASS。8 tests passed。 |

## Functional Cases

| ID | Result | 补测方式 | Evidence | 备注 |
|---|---|---|---|---|
| G-KBD-01 | PASS | Vitest | `src/pages/practice-math-keyboard.test.ts:112`; `npm test -- --run src/pages/practice-math-keyboard.test.ts src/pages/PracticeMathKeyboard.test.ts` | slot 未声明自动换格时保持当前 slot。 |
| G-KBD-02 | PASS | Vitest | `src/pages/practice-math-keyboard.test.ts:127`; `npm test -- --run src/pages/practice-math-keyboard.test.ts src/pages/PracticeMathKeyboard.test.ts` | `delete` 不触发自动换格。 |
| G-KBD-03 | PASS | Vitest | `src/pages/practice-math-keyboard.test.ts:146`, `src/pages/practice-math-keyboard.test.ts:174`; `npm test -- --run src/pages/practice-math-keyboard.test.ts src/pages/PracticeMathKeyboard.test.ts` | 满足完成条件时进入下一 slot，最终 slot 不越界。 |
| X-MOB-01 | PASS | Playwright | `QA/e2e/phase3-keyboard-autofocus.spec.ts:202`; `npx playwright test QA/e2e/phase3-keyboard-autofocus.spec.ts --reporter=line` | 键盘滚动前后均固定在视口底部。 |
| G-PRAC-01 | PASS | Playwright | `QA/e2e/phase3-keyboard-autofocus.spec.ts:249`; `npx playwright test QA/e2e/phase3-keyboard-autofocus.spec.ts --reporter=line` | 商达到答案长度后 active 移到余数。 |
| G-PRAC-02 | PASS | Playwright | `QA/e2e/phase3-keyboard-autofocus.spec.ts:271`; `npx playwright test QA/e2e/phase3-keyboard-autofocus.spec.ts --reporter=line` | 第 1 空达到对应答案长度后 active 移到第 2 空。 |
| G-PRAC-03 | PASS | Playwright | `QA/e2e/phase3-keyboard-autofocus.spec.ts:324`; `npx playwright test QA/e2e/phase3-keyboard-autofocus.spec.ts --reporter=line` | 第 1 个训练字段填满后 active 移到第 2 个训练字段。 |
| I-MUL-01 | PASS | Playwright | `QA/e2e/phase3-keyboard-autofocus.spec.ts:220`, `QA/e2e/phase3-keyboard-autofocus.spec.ts:348`; `npx playwright test QA/e2e/phase3-keyboard-autofocus.spec.ts --reporter=line` | 多行乘法输入后换到下一 slot；部分积 / 总积按右到左。 |
| I-MUL-02 | PASS | Playwright | `QA/e2e/phase3-keyboard-autofocus.spec.ts:348`; `npx playwright test QA/e2e/phase3-keyboard-autofocus.spec.ts --reporter=line` | `Tab` 前进、`Shift+Tab` 回退均跟随右到左 slot 顺序。 |
| I-REG-01 | PASS | Playwright | `QA/e2e/phase3-keyboard-autofocus.spec.ts:181`; `npx playwright test QA/e2e/phase3-keyboard-autofocus.spec.ts --reporter=line` | legacy 竖式格用内置键盘输入后自动移动到下一格。 |

## Exploratory Charters

| ID | Result | 补测方式 | Evidence | 备注 |
|---|---|---|---|---|
| U-EDIT-01 | RISK | Playwright 当前行为观察 + 拟真记录 | `QA/e2e/phase3-keyboard-autofocus.spec.ts:294`; `npx playwright test QA/e2e/phase3-keyboard-autofocus.spec.ts --reporter=line`; `manual-result.md` | 填满 A 自动到 B，点回 A 删除再补满后仍自动到 B；按既定裁决保留真实学生观察。 |
| U-MOB-01 | PASS | Playwright + 拟真记录 | `QA/e2e/phase3-keyboard-autofocus.spec.ts:202`; `manual-result.md` | 390x844 视口下键盘固定底部，可滚动题卡避免遮挡。 |

## Gate Check

| 检查项 | 结果 |
|---|---|
| `test-cases-v1.md` Functional Cases 是否均有 Result / Evidence | PASS |
| `test-cases-v1.md` Exploratory Charters 是否均有 Result / Evidence | PASS |
| P0 / P1 是否全部 PASS | PASS |
| P2 RISK 是否写明残余风险 | PASS |
