# Phase 3：UI + 验收

> 所属：v0.3 · 设计规格 §7/§9/§6.4/§13
> 状态：✅ 已完成，代码验证与真实 Supabase 验收均已通过（2026-04-24）
> 依赖：Phase 2（✅ 已完成 2026-04-24）
> 读取提示：查 Phase 3 范围 / 状态读本文件；查开工前预研细节读 [`phase-3-research.md`](./phase-3-research.md)；查真实验收读 [`phase-3-acceptance.md`](./phase-3-acceptance.md)。

---

## 开发文档入口

Phase 3 开发以下面 5 份开发文档为唯一依据。本页"预研收口结论"作为产品规则源头保留，技术实施以开发文档为准：

- [`../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-00-index.md`](../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-00-index.md) · 总览、决策清单、导航、RISK 落点、收尾条件
- [`../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-01-startup-and-merge.md`](../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-01-startup-and-merge.md) · Task 3.0 启动门控 + Task 3.2 首次登录合并
- [`../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-02-sync-status-ui.md`](../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-02-sync-status-ui.md) · Task 3.1 SyncStatusIndicator + Task 3.3 AccountSection
- [`../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-03-rank-match-online.md`](../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-03-rank-match-online.md) · Task 3.4 段位赛联网 + 自动 suspend + 10 分钟接管
- [`../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-04-resilience-qa.md`](../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-04-resilience-qa.md) · Task 3.5 指数退避 + RISK 3/4 + 真实 Supabase 验收剧本

`implementation-plan.md` Phase 3 草案（Task 3.1~3.5）已作废；Phase 1 / Phase 2 部分保留作为历史实施记录。

---

## 范围

Phase 3 的目标不是单纯补 UI，而是把 v0.3 的账号同步从"底层可用"推进到"用户安全可用、可理解、可验收"：

- 登录入口：Onboarding / Profile 可进入邮箱 Magic Link 登录
- 账号区域：Profile 展示邮箱、登录状态、同步状态、登出
- 同步状态：Home 轻量展示，Profile 展示更完整状态
- 首次登录合并：保护本地进度，完成本地 / 云端 / 账号归属判定
- 账号切换：不同账号数据严格独立，切换前先确认当前账号已同步
- 段位赛联网限制：开始新系列 / 系列内下一局前检查联网与远端活跃状态
- Phase 2 RISK 消化：dirtyKeys、删除语义、重试退避、合并测试补强
- 真实 Supabase 验收：Magic Link、跨设备合并、离线恢复、段位赛联网限制

不纳入本阶段：

- v0.2 Backlog（如 compare 方法提示补证、Practice 状态重置清理）
- 同步管理中心 / 同步详情页 / 手动同步控制台
- 密码登录、排行榜、好友、后台看板
- Practice 答题页同步状态展示

## Task 清单

| Task | 内容 | 涉及文件 |
|------|------|---------|
| 3.0 | 启动前技术收口 | SyncEngine 启动门控、有效本地进度判定、账号隔离、Supabase 环境状态 |
| 3.1 | 同步状态指示器 | `src/components/SyncStatusIndicator.tsx`, `src/pages/Home.tsx`, `src/pages/Profile.tsx` |
| 3.2 | 首次登录合并引导 | `src/components/MergeGuideDialog.tsx`, `src/App.tsx`, `src/sync/engine.ts`, `src/repository/local.ts` |
| 3.3 | Profile 账号区域 + Onboarding 入口 | `src/components/AccountSection.tsx`, `src/pages/Profile.tsx`, `src/pages/Onboarding.tsx` |
| 3.4 | 段位赛联网检查 | `src/store/rank-match.ts`, `src/store/index.ts`, `src/pages/RankMatchHub.tsx` |
| 3.5 | 同步韧性 + 全量验收 | `src/sync/engine.ts`, `src/sync/merge.test.ts`, QA / build / 真实 Supabase 验收 |

## 进入条件

- Phase 2 完成（SyncEngine 可运行、合并策略测试通过）

## 收尾条件

- `npm test` 全量通过：✅ 42 个测试文件，638 个测试
- `npm run build` 通过：✅ 2026-04-24 复跑通过
- 线上发布：✅ `master` commit `f34dc38` 已部署到 GitHub Pages，线上地址 [`https://wisalu1983-cell.github.io/math-quest/`](https://wisalu1983-cell.github.io/math-quest/)
- 手动验收：
  - 访客模式正常（不登录 = 和之前一样）
  - 登录页可打开、可输入邮箱
  - Profile 页显示账号区域
  - Home 页登录后显示同步状态
  - 段位赛离线时按钮 disabled
  - 两台设备分别离线做题，联网后进度正确合并（需真实 Supabase 环境）
- Phase 2 4 条 RISK 均有处理结论：✅ 见 [`phase-3-acceptance.md`](./phase-3-acceptance.md)
- 真实 Supabase 8 个验收剧本：✅ 全部通过，证据见 [`phase-3-acceptance.md`](./phase-3-acceptance.md)
- 同一设备切换账号时，不同账号数据严格隔离，无自动跨账号合并

详细步骤见 [`../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-00-index.md`](../../../Specs/v03-supabase-account-sync/2026-04-24-phase3-00-index.md) 及其 4 份分文档。

---

## 预研收口与遗留 RISK

低频长内容已拆到 [`phase-3-research.md`](./phase-3-research.md)，包括：

- 首次登录与本地进度保护规则
- 账号切换与隔离规则
- 同步状态展示规则
- Supabase 未配置 / 服务不可用策略
- 段位赛联网规则
- Phase 2 Code Review 的 4 条 RISK 与归属 Task
