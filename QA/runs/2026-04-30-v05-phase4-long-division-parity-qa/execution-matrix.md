# Execution Matrix · v0.5 Phase 4 长除法一致性补测

**日期**：2026-04-30
**环境**：Windows / PowerShell / Vite dev server `127.0.0.1:5178`

## Parity 自动化

| 命令 | 结果 | 说明 |
|---|---|---|
| `$env:MQ_LONG_DIVISION_PARITY_URL='http://127.0.0.1:5178/'; $env:MQ_FORMAL_PROTOTYPE_URL='http://127.0.0.1:5178/?preview=longdiv-formal'; npx playwright test QA/e2e/phase4-long-division-parity.spec.ts --reporter=line` | ✅ 14 passed | 六个子题型 UI 逐步骤签名、每个竖式步骤错误类别、小数 ÷ 小数扩倍错误、取近似 / 循环小数结构化结果错误 |

## 回归验证

| 命令 | 结果 | 覆盖 |
|---|---|---|
| `$env:MQ_LONG_DIVISION_E2E_URL='http://127.0.0.1:5178/'; npx playwright test QA/e2e/phase4-long-division.spec.ts --reporter=line` | ✅ 5 passed | 既有生产长除法 E2E：键盘输入、扩倍区退出、视觉证据、过程错因 |
| `$env:MQ_FORMAL_PROTOTYPE_URL='http://127.0.0.1:5178/?preview=longdiv-formal'; npx playwright test QA/e2e/phase4-long-division-formal-prototype.spec.ts --reporter=line` | ✅ 1 passed | formal prototype 小数 ÷ 小数扩倍通过后隐藏转换区 |
| `npx vitest run src/engine/longDivision.test.ts` | ✅ 10 passed | 长除法过程判定、结构化字段、错因 payload |
| `npm run build` | ✅ 通过 | TypeScript 与生产构建 |
| `git diff --check` | ✅ 通过 | 空白 / 冲突标记检查 |

## 视觉证据

截图保存在 `QA/runs/2026-04-30-v05-phase4-long-division-parity-qa/artifacts/`：

- `integer-remainder-prototype-ready.png` / `integer-remainder-production-ready.png`
- `middle-zero-prototype-ready.png` / `middle-zero-production-ready.png`
- `decimal-dividend-prototype-ready.png` / `decimal-dividend-production-ready.png`
- `decimal-divisor-prototype-ready.png` / `decimal-divisor-production-ready.png`
- `approximation-prototype-ready.png` / `approximation-production-ready.png`
- `cyclic-prototype-ready.png` / `cyclic-production-ready.png`
