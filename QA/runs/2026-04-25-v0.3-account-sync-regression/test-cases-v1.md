# v0.3 Account Sync Regression - Test Cases v1

日期：2026-04-25

范围：v0.3 账号 / Supabase 同步能力的版本收口 QA。重点覆盖本地游客态、账号入口、同步状态、防离线误操作、段位赛进度不丢失。

环境记录：

- 当前本地 `.env.local` / `.env` 未配置 Supabase 变量，因此本轮浏览器拟真以“未接入账号系统”的安全降级路径为主。
- 真实 Supabase 8 脚本验收已见 `ProjectManager/Plan/v0.3/phases/phase-3-acceptance.md`，本轮不重复执行真实远端写入。

## L1 Code Review

CR-01：`src/sync/engine.ts`

- 核对 dirtyKeys 持久化、offline/error/retry/fullSync 状态转移。
- 核对 `shutdown()` 不清空待同步队列，避免登出或 auth 状态切换丢本地待推送数据。
- 核对 `pull()` / `push()` 对 profile、game_progress、history_records、rank_match_sessions 的覆盖顺序。

CR-02：`src/sync/merge-flow.ts`

- 核对首次登录：本地有进度 / 云端有进度 / 两边都有进度 / 离线等待 / 超时重试。
- 核对账号不一致路径：必须显式确认后才清账号域数据。

CR-03：`src/store/auth.ts` + `src/components/AccountSection.tsx`

- 核对 dirtyKeys 存在时登出保护。
- 核对未配置 Supabase 的 UI 降级，不暴露不可完成动作。

CR-04：`src/pages/Profile.tsx` + `src/pages/LoginPage.tsx` + `src/pages/RankMatchHub.tsx`

- 核对账号入口可达。
- 核对 Magic Link UI 不误触发。
- 核对段位赛离线门禁和活跃赛事恢复入口。

## L2 Automation

A-01：全量 Vitest

- 命令：`npm test -- --run`
- 判定：全部通过，无新增失败。

A-02：生产构建

- 命令：`npm run build`
- 判定：TypeScript + Vite build 全部通过。

A-03：基础 E2E 冒烟

- 命令：`npx playwright test smoke.spec.ts`
- 判定：首页加载和注册流程可达，无 pageerror。

A-04：v0.3 账号同步 scoped E2E

- 命令：`npx playwright test v03-account-sync.spec.ts`
- 判定：
  - 游客完成 onboarding 后，Profile 账号区可见；
  - Supabase 未配置时显示安全降级说明；
  - 已有本地进阶星级的用户进入段位赛大厅后，离线状态禁止新挑战；
  - 无 pageerror，截图落到本 run 的 `artifacts/`。

## L3 Simulated Human QA

M-01：新用户路径

- 从 onboarding 开始，观察是否存在“已有账号？登录”入口。
- 完成昵称创建，进入首页。
- 打开 Profile，检查账号区是否给出符合当前环境的下一步。

M-02：老用户 / 已有进度路径

- 注入本地已解锁新秀挑战的进度。
- 从首页进入段位赛大厅。
- 切到离线，检查挑战按钮是否禁用，并且不会丢失段位/星级可见性。

M-03：收口判断

- 若 L1-L3 均通过且仅有“本地未配置 Supabase，无法执行真实 Magic Link”限制，则 v0.3 可记为“本地 scoped QAleader 通过，真实远端依据 2026-04-24 验收记录继承”。
