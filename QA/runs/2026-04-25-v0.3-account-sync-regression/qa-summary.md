# v0.3 Account Sync Regression QA Summary

日期：2026-04-25

结论：通过（本地 scoped QAleader 回归通过；真实 Supabase 远端验收继承 2026-04-24 已有记录）。

## 范围

本轮不是重跑 v0.3 全项目全量体验 QA，而是针对 v0.3 的核心风险补跑 QAleader 三层回归：

- 账号入口与未配置 Supabase 的安全降级
- 本地优先进度不被账号同步破坏
- dirtyKeys / retry / sign out guard / merge flow 静态风险
- 段位赛离线门禁与已有进度可见性
- 全量单测、生产构建、基础 smoke、账号同步 scoped E2E

## 结果

| 层级 | 结论 | 证据 |
|---|---|---|
| L1 Code Review | 通过，无阻塞问题 | `code-review-result.md` |
| L2 Automation | 通过 | `auto-result.md` |
| L3 Simulated Human QA | 通过，带环境限制 | `manual-result.md` |

## 自动化摘要

- `npm test -- --run`：通过，42 files / 638 tests
- `npm run build`：通过
- `npx playwright test smoke.spec.ts`：通过，1/1
- `npx playwright test v03-account-sync.spec.ts`：通过，2/2

沙箱内 Tailwind/Vite 原生依赖与 Playwright 输出目录遇到 Windows `EPERM`，同一命令在批准的沙箱外复跑通过。

## 新增 QA 资产

- `QA/e2e/v03-account-sync.spec.ts`
- `QA/runs/2026-04-25-v0.3-account-sync-regression/test-cases-v1.md`
- `QA/runs/2026-04-25-v0.3-account-sync-regression/code-review-result.md`
- `QA/runs/2026-04-25-v0.3-account-sync-regression/auto-result.md`
- `QA/runs/2026-04-25-v0.3-account-sync-regression/manual-result.md`
- `QA/runs/2026-04-25-v0.3-account-sync-regression/artifacts/*.png`

## 限制与判断

当前本地 `.env.local` / `.env` 未配置 Supabase，因此本轮不会真实发送 Magic Link，也不会再次写入 Supabase。v0.3 真实远端验收以既有记录为准：

- `ProjectManager/Plan/v0.3/phases/phase-3-acceptance.md`

结合本轮结果，v0.3 现在具备正式 QAleader 记录，可作为版本级收口依据。若后续要做“真实远端再验”，建议另开 Supabase configured run，专测 Magic Link 回跳、跨设备合并、Realtime 自愈与远端 RLS。
