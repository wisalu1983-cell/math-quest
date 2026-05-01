# Execution Matrix · v0.5 Phase 5 Release Gate

**日期**：2026-05-01  
**环境**：Windows / PowerShell / Vite dev server `127.0.0.1:5173`

## 自动化验证

| 命令 | 结果 | 覆盖 |
|---|---|---|
| `npm test -- src/engine/generators/number-sense.phase5.test.ts --run` | ✅ 2 passed | `ISSUE-069` 最大 / 最小填空答案口径 |
| `npm test -- src/engine/generators/vertical-calc.phase5.test.ts --run` | ✅ 1 passed | `cyclic-div` 样例池多样性 hardening |
| `npm test -- --run` | ✅ 64 files / 773 tests passed | Vitest 全量回归 |
| `npx eslint src/engine/generators/number-sense.ts src/engine/generators/vertical-calc.ts src/engine/generators/number-sense.phase5.test.ts src/engine/generators/vertical-calc.phase5.test.ts QA/e2e/phase4-long-division-parity.spec.ts playwright.config.ts` | ✅ 通过 | Phase 5 代码 / 测试 / Playwright config 改动 |
| `npm run build` | ✅ 通过 | TypeScript 与生产构建 |
| `npm audit --audit-level=moderate` | ✅ 0 vulnerabilities | 依赖安全审计 |
| `npx tsx scripts/pm-sync-check.ts` | ✅ 通过 | PM 多源状态一致性 |
| `npx playwright test` | ✅ 58 passed（1.9m） | Playwright 全量 E2E，默认 `workers: 1` |

## Release Gate 判定

| 项 | 结论 | 说明 |
|---|---|---|
| Open issue | ✅ 0 | `ISSUE-069` 已归档 |
| Backlog 阻塞项 | ✅ 无 | `BL-017` v0.5 范围完成；系统性治理转 v0.6 |
| 自动化回归 | ✅ PASS | Vitest / Playwright / build / audit 通过 |
| 文档一致性 | ✅ PASS | `pm-sync-check` 通过 |
| 发布剩余说明 | 🟡 NOTE | 真实移动设备补验证据沿用 Phase 3 既有发布后验收口径 |
