# v0.4 Release Gate Automated Result

**执行日期**：2026-04-26
**范围**：v0.4 发布前最终 QA · 第二层自动化 / 安全门禁
**结论**：PASS。所有 P0 自动化门禁通过；无阻塞安全发现。

## 命令结果

| Gate | 命令 | 结果 | 证据摘要 |
|---|---|---|---|
| 全量 Vitest | `npm test` | PASS | 55 files / 713 tests passed |
| 生产构建 | `npm run build` | PASS | `tsc -b && vite build` 通过；仅 Vite chunk size warning |
| 标准 Playwright E2E | `npx playwright test` | PASS | 9 / 9 passed（含 ISSUE-065 回归） |
| v0.4 专项 Vitest | `npm test -- src/engine/generators/vertical-calc.phase3.test.ts src/engine/generators/number-sense.phase3.test.ts src/store/session-dedupe.test.ts src/repository/local.phase2-migration.test.ts src/constants/campaign.phase2.test.ts src/constants/player-topics.phase2.test.ts src/pages/practice-input-state.test.ts src/engine/vertical-calc-policy.test.ts src/store/index.test.ts --run` | PASS | 9 files / 44 tests passed |
| PM 一致性 | `npx tsx scripts/pm-sync-check.ts` | PASS | 全绿，未发现不一致 |
| 依赖审计 | `npm audit --audit-level=moderate` | PASS | 0 vulnerabilities |
| Secret 高风险扫描 | `rg -n --glob '!.git/**' --glob '!node_modules/**' --glob '!dist/**' --glob '!dist-dev/**' --glob '!QA/runs/**' '(SUPABASE_SERVICE_ROLE\|SERVICE_ROLE_KEY\|service_role\|sk_live\|ghp_\|password=\|secret=)' .` | PASS | QA run 记录外无匹配 |

## Playwright 覆盖摘要

| Spec | 结果 | 覆盖 |
|---|---|---|
| `QA/e2e/smoke.spec.ts` | PASS：1/1 | 首页加载与注册流程可达 |
| `QA/e2e/v03-account-sync.spec.ts` | PASS：2/2 | 未配置 Supabase 时账号入口安全降级、段位赛离线门禁 |
| `QA/e2e/phase4-carry-focus.spec.ts` | PASS：2/2 | 低档自动聚焦进位格、中档保持答案格链路 |
| `QA/e2e/phase5-practice-input-reset.spec.ts` | PASS：3/3 | numeric reset、multi-blank 重建、multi-select reset 与退出弹窗隔离 |
| `QA/e2e/issue-065-vertical-operand-contrast.spec.ts` | PASS：1/1 | 单行竖式真实操作数 / 运算符高对比，空白对齐格保持浅色占位 |

## v0.4 专项覆盖摘要

| 风险 | 覆盖文件 | 结论 |
|---|---|---|
| A03 乘法分布 / 除法样本池 | `vertical-calc.phase3.test.ts` | PASS |
| A02 compare 质量 | `number-sense.phase3.test.ts` | PASS |
| session 内完全重复治理 | `session-dedupe.test.ts` | PASS |
| A04/A06 legacy 数据与 A07 IA | `local.phase2-migration.test.ts`, `campaign.phase2.test.ts`, `player-topics.phase2.test.ts` | PASS |
| Practice 输入 reset | `practice-input-state.test.ts` | PASS |
| 竖式三档策略 | `vertical-calc-policy.test.ts`, `store/index.test.ts` | PASS |

## 安全 / 隐私说明

| 检查 | 结果 | 裁决 |
|---|---|---|
| `npm audit --audit-level=moderate` | 0 vulnerabilities | PASS |
| 高风险 secret 扫描 | QA run 记录外无 `service_role` / private secret / password / live token 匹配 | PASS |
| Supabase publishable anon key | `.env.production` 中存在 `VITE_SUPABASE_ANON_KEY=sb_publishable...`，扫描也命中文档示例和测试 stub | 非阻塞：这是前端 publishable key，不是 service role secret；v0.3 acceptance 已记录该配置 |

## 观察项

| ID | 类型 | 说明 | 裁决 |
|---|---|---|---|
| OBS-AUTO-01 | Observation | `npm run build` 仍有 Vite chunk size warning，属于既有 bundle 体积提示。 | 非阻塞 |
| OBS-AUTO-02 | Observation | `npx playwright test` 会刷新 `QA/runs/2026-04-26-v04-phase5-practice-reset/artifacts/I-01-multi-blank-rebuilt.png` 这一既有截图文件。 | 非阻塞；不影响测试结论 |

## 缺陷分流

| 类型 | 数量 | 处理 |
|---|---:|---|
| FAIL | 0 | 无需写入 `ProjectManager/ISSUE_LIST.md` |
| RISK | 0 | 无发布阻塞自动化风险 |
| Observation | 2 | 记录于本文件 |
