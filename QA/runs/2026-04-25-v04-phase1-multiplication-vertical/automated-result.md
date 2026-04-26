# 自动化测试结果

**执行日期**：2026-04-25  
**结论**：PASS（全量测试与构建通过；全量 lint 因既有债务失败）

## 命令结果

| 命令 | 结果 | 摘要 |
|---|---|---|
| `npm test -- src/engine/verticalMultiplication.test.ts src/engine/generators/generators.test.ts src/engine/answerValidation.test.ts` | PASS | 3 files / 128 tests passed |
| `npm test` | PASS | 43 files / 643 tests passed |
| `npm run build` | PASS | `tsc -b && vite build` 通过；保留既有 chunk size warning |
| `npx eslint src/components/MultiplicationVerticalBoard.tsx src/components/VerticalCalcBoard.tsx src/previews/MultiplicationVerticalBoardPreview.tsx src/engine/verticalMultiplication.ts src/engine/generators/vertical-calc.ts src/types/index.ts` | PASS | 本次新增/修改文件 scoped lint 通过 |
| `npm run lint` | BLOCKED | 全量 lint 仍有 148 errors / 1 warning，来自既有债务文件，不含本次 touched scope |
| `npx tsx scripts/pm-sync-check.ts` | PASS | PM 文档静态一致性校验全绿 |

## 覆盖内容

- `782 × 14` 多位整数乘法部分积布局与总积。
- 小数点定位与最终答数归一化：`56` / `56.0` 等价仅用于最终答数。
- 中高档 `int-mul` / `dec-mul` 生成器输出新 `multiplicationBoard`。
- 一位整数乘法旧竖式设计保留。
- 高档 `dec-div` 不再残留隐藏 `trainingFields`。
