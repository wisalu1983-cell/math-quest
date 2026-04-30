# Coverage Matrix · v0.5 Phase 4 BL-010 长除法 UI

**日期**：2026-04-30  
**结论**：P0 / P1 覆盖项均 PASS；RISK / DEFERRED 已显式登记。

| 覆盖项 | 证据 | 结果 |
|---|---|---|
| 长除法轮次模型：商位、乘积、余数、落位 / 最终余数 | `src/engine/longDivision.test.ts` | PASS |
| 长除法边界：小数被除数、商中含 0、单轮除法 | `src/engine/longDivision.test.ts` | PASS |
| 长除法数值文本归一化 helper：engine / UI 共用 | `src/engine/longDivision.test.ts`、`src/components/LongDivisionBoard.tsx` | PASS |
| 小数 ÷ 小数扩倍转换字段 | `src/engine/longDivision.test.ts` | PASS |
| 取近似后置结果字段 | `src/engine/longDivision.test.ts` | PASS |
| 混合错误：过程格与结构化结果同时错误 | `src/engine/longDivision.test.ts` | PASS |
| 循环小数字段：非循环部分 + 循环节 | `src/engine/longDivision.test.ts`、`QA/e2e/phase4-long-division-decimal-point-preview.spec.ts` | PASS |
| 高档 A03 `cyclic-div` 生产入口 | `src/engine/generators/generators.test.ts` | PASS |
| 生成器把除法题升级为显式 `longDivisionBoard` | `src/engine/generators/generators.test.ts` | PASS |
| 旧题兼容：缺少 `longDivisionBoard` 时保留原 `VerticalCalcBoard` legacy 路径 | `src/components/VerticalCalcBoard.tsx` 分支实现 + build | PASS |
| 生产 UI 挂载：`VerticalCalcBoard` 内部分流到 `LongDivisionBoard` | `src/components/VerticalCalcBoard.tsx` + Phase4 E2E | PASS |
| 内置键盘输入与自动换格 | `QA/e2e/phase4-long-division.spec.ts` | PASS |
| 过程错误反馈只展示类别，不泄露中间正确值 | `QA/e2e/phase4-long-division.spec.ts` | PASS |
| 长除法 fallback 文案 | `src/utils/practiceFailureDisplay.test.ts` | PASS |
| 375x812 手机视口 | `artifacts/long-division-mobile-375.png` + Phase4 E2E | PASS |
| 390x844 手机视口 | `artifacts/long-division-mobile-390.png` + Phase4 E2E | PASS |
| 1024x768 桌面视口 | `artifacts/long-division-desktop-1024.png` + Phase4 E2E | PASS |
| 全量回归 | `npm test`、`npx playwright test --reporter=line`、`npm run build` | PASS |
| 依赖风险 | `npm audit --audit-level=moderate` | PASS |
| 变更范围 lint | scoped `npx eslint ...` | PASS |
| 全仓 lint | `npm run lint` | RISK：146 problems，历史基线；无 `LongDivisionBoard` |
| 真实 Android / iOS | 本地未执行 | DEFERRED：沿 Phase3 发布后线上补验 |
