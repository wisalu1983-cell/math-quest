# Automation Result

日期：2026-04-25

结论：通过。

## 命令结果

| 项目 | 命令 | 结果 |
|---|---|---|
| Vitest | `npm test -- --run` | 通过：42 files / 638 tests |
| Build | `npm run build` | 通过：TypeScript + Vite build succeeded |
| Playwright smoke | `npx playwright test smoke.spec.ts` | 通过：1/1 |
| Playwright v0.3 scoped | `npx playwright test v03-account-sync.spec.ts` | 通过：2/2 |

## 环境说明

- `npm test -- --run` 与 `npm run build` 在沙箱内首次运行失败，错误为 Tailwind/Vite 原生依赖加载触发 `spawn EPERM` / `UNLOADABLE_DEPENDENCY`。同一命令在批准的沙箱外复跑通过。
- `npx playwright test smoke.spec.ts` 在沙箱内首次运行失败，错误为 Playwright 清理 `QA/artifacts/playwright-test-results/.last-run.json` 时 `EPERM`。同一命令在批准的沙箱外复跑通过。
- 本地未配置 `.env.local` / `.env`，因此 v0.3 scoped E2E 的账号路径验证的是未接入 Supabase 时的安全降级；真实 Supabase 远端写入依据 2026-04-24 已有验收记录。

## Playwright 证据

新增 spec：

- `QA/e2e/v03-account-sync.spec.ts`

截图：

- `QA/runs/2026-04-25-v0.3-account-sync-regression/artifacts/01-onboarding.png`
- `QA/runs/2026-04-25-v0.3-account-sync-regression/artifacts/02-home-after-onboarding.png`
- `QA/runs/2026-04-25-v0.3-account-sync-regression/artifacts/03-profile-account-section.png`
- `QA/runs/2026-04-25-v0.3-account-sync-regression/artifacts/04-rank-match-offline-gate.png`

## 覆盖点

- 新用户 onboarding 到首页。
- Profile 账号区在 Supabase 未配置时的安全降级。
- 本地已有进阶星级/段位赛入场资格时，首页仍展示挑战入口。
- 段位赛大厅在离线状态禁用新挑战，不隐藏已有进度。
- Playwright pageerror 为 0。
