# Automated Result · v0.5 Phase 4 BL-010 长除法 UI

**日期**：2026-04-30  
**结果**：PASS，保留全仓 lint baseline RISK。

## TDD Evidence

| 阶段 | 命令 | 结果 |
|---|---|---|
| RED | `npm test -- src/engine/longDivision.test.ts src/utils/practiceFailureDisplay.test.ts src/engine/generators/generators.test.ts` | 预期失败：缺少 `src/engine/longDivision.ts`、长除法 fallback、生成器仍走旧 numeric-input。 |
| GREEN | `npm test -- src/engine/longDivision.test.ts src/utils/practiceFailureDisplay.test.ts src/engine/generators/generators.test.ts` | PASS。3 files / 108 tests passed。 |
| E2E GREEN | `npx playwright test QA/e2e/phase4-long-division.spec.ts --reporter=line` | PASS。4 tests passed。 |

## Final Automation

| 命令 | 结果摘要 |
|---|---|
| `npm test` | PASS。60 files / 755 tests passed。 |
| `npm run build` | PASS。TypeScript build + Vite build 通过；保留既有 chunk size warning。 |
| `npx playwright test --reporter=line` | PASS。42 tests passed。 |
| scoped `npx eslint ...` | PASS。变更范围无 lint 输出。 |
| `npm audit --audit-level=moderate` | PASS。found 0 vulnerabilities。 |
| `git diff --check` | PASS。 |
| `npm run lint` | RISK。146 problems（145 errors, 1 warning），全仓既有规则债；不宣称全仓 lint 通过。 |

## Notes

- 全量 Playwright 首轮发现 `QA/e2e/phase3-decimal-training-failure.spec.ts` 仍断言旧文案“未通过原因：小数训练格有错误。”；页面、单测和当前 helper 已统一为“本题未通过：小数训练格有误。”。已只更新测试断言，不改产品文案。
- Phase4 视觉截图曾与交互用例混放导致视口切换干扰 active slot；已拆成独立视觉用例，并最终全量 Playwright 通过。
- Review hardening 已补 5 个 `src/engine/longDivision.test.ts` 用例：数值文本归一化 helper、小数被除数 round、商中含 0、单轮除法、过程格与结构化结果混合错误。
