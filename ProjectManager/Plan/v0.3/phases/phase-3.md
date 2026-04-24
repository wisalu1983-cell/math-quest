# Phase 3：UI + 验收

> 所属：v0.3 · 设计规格 §7/§9/§6.4/§13
> 状态：📋 预研已收口，开发文档已落地（2026-04-24）
> 依赖：Phase 2（✅ 已完成 2026-04-24）

---

## 开发文档入口

Phase 3 开发以下面 5 份开发文档为唯一依据，本页的旧 Task 清单已被开发文档整体取代：

- [`../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-00-index.md`](../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-00-index.md) · 总览、决策清单、导航、RISK 落点、收尾条件
- [`../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-01-startup-and-merge.md`](../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-01-startup-and-merge.md) · Task 3.0 启动门控 + Task 3.2 首次登录合并
- [`../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-02-sync-status-ui.md`](../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-02-sync-status-ui.md) · Task 3.1 SyncStatusIndicator + Task 3.3 AccountSection
- [`../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-03-rank-match-online.md`](../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-03-rank-match-online.md) · Task 3.4 段位赛联网 + 自动 suspend + 10 分钟接管
- [`../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-04-resilience-qa.md`](../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-04-resilience-qa.md) · Task 3.5 指数退避 + RISK 3/4 + 真实 Supabase 验收剧本

`implementation-plan.md` Phase 3 草案（Task 3.1~3.5）已作废；Phase 1 / Phase 2 部分保留作为历史实施记录。

---

## 范围

- 同步状态指示器（`src/components/SyncStatusIndicator.tsx`）+ Home 页集成
- 首次登录合并引导对话框（`src/components/MergeGuideDialog.tsx`）+ App.tsx 集成
- Profile 账号区域（`src/components/AccountSection.tsx`）
- Onboarding 登录入口
- 段位赛联网检查（store + UI）
- 全量测试 + 构建 + 手动验收

## Task 清单

| Task | 内容 | 涉及文件 |
|------|------|---------|
| 3.1 | 同步状态指示器 | `src/components/SyncStatusIndicator.tsx`, `src/pages/Home.tsx` |
| 3.2 | 首次登录合并引导 | `src/components/MergeGuideDialog.tsx`, `src/App.tsx` |
| 3.3 | Profile 账号区域 + Onboarding 入口 | `src/components/AccountSection.tsx`, `src/pages/Profile.tsx`, `src/pages/Onboarding.tsx` |
| 3.4 | 段位赛联网检查 | `src/store/rank-match.ts`, `src/pages/RankMatchHub.tsx` |
| 3.5 | 全量测试 + 构建验证 | 全量 |

## 进入条件

- Phase 2 完成（SyncEngine 可运行、合并策略测试通过）

## 收尾条件

- `npm test` 全量通过
- `npm run build` 通过
- 手动验收：
  - 访客模式正常（不登录 = 和之前一样）
  - 登录页可打开、可输入邮箱
  - Profile 页显示账号区域
  - Home 页登录后显示同步状态
  - 段位赛离线时按钮 disabled
  - 两台设备分别离线做题，联网后进度正确合并（需真实 Supabase 环境）

详细步骤见 [`../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-00-index.md`](../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-00-index.md) 及其 4 份分文档。
