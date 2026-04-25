# 来源目录与证据映射

> 所属版本：v0.3
> 所属主线：[README](./README.md)
> 重建日期：2026-04-25
> 本文件角色：事后重建 v0.3 的需求来源、规格来源、实施来源与验收来源映射。v0.3 不是用户反馈批次主线，因此本文件替代 v0.2 的 `01-feedback-catalog.md`。

---

## 来源总览

| 来源 | 文件 / 证据 | 对 v0.3 的作用 |
|---|---|---|
| Backlog 激活 | [`../../Backlog.md`](../../Backlog.md) 的 `BL-001` | v0.3 主线入口：本地用户数据存档 / 账号系统前置数据模型，最终扩大为在线账号同步系统 |
| 设计规格 | [`../../Specs/v03-supabase-account-sync/2026-04-23-v03-supabase-账号与同步系统.md`](../../Specs/v03-supabase-account-sync/2026-04-23-v03-supabase-账号与同步系统.md) | 定义 Supabase 表、RLS、Magic Link、本地优先同步、合并策略、段位赛联网等产品与架构规则 |
| 实施计划 | [`implementation-plan.md`](./implementation-plan.md) | Phase 1 / Phase 2 的历史实施记录；Phase 3 草案已废弃，仅保留设计演进痕迹 |
| Phase 1 收口 | [`phases/phase-1.md`](./phases/phase-1.md) | 记录基建 + 认证范围、收尾条件、人工 Supabase 操作 |
| Phase 2 收口 | [`phases/phase-2.md`](./phases/phase-2.md) | 记录同步引擎交付范围、测试证据、4 条 RISK 来源 |
| Phase 3 产品规则 | [`phases/phase-3.md`](./phases/phase-3.md) | 记录首次登录合并、账号隔离、同步状态、段位赛联网、RISK 落点 |
| Phase 3 开发文档 | [`../../Specs/v03-supabase-account-sync/2026-04-24-phase3-00-index.md`](../../Specs/v03-supabase-account-sync/2026-04-24-phase3-00-index.md) 及 4 份分文档 | 替代 `implementation-plan.md` 的 Phase 3 草案，成为 Phase 3 技术实施依据 |
| 真实验收 | [`phases/phase-3-acceptance.md`](./phases/phase-3-acceptance.md) | 记录真实 Supabase 环境、8 个验收剧本、RISK 最终结论、线上发布证据 |
| 项目状态 | [`../../Overview.md`](../../Overview.md) / [`../README.md`](../README.md) | 记录 v0.3 已上线、当前下一步是版本级收口决策 |

## 需求条目映射

| 需求 / 决策 | 来源 | 落点 |
|---|---|---|
| 邮箱 Magic Link 登录 | v0.3 设计规格 §4 / Phase 1 | `src/store/auth.ts`、`src/pages/LoginPage.tsx`、`src/lib/supabase.ts` |
| 本地存档 v3→v4 | v0.3 设计规格 §8 / Phase 1 | `src/repository/local.ts`、`src/types/index.ts` |
| Supabase 数据模型 | v0.3 设计规格 §3 / Phase 1 | `supabase/migrations/001_initial_schema.sql` |
| 确定性合并策略 | v0.3 设计规格 §6 / Phase 2 | `src/sync/merge.ts`、`src/sync/merge.test.ts` |
| 远端数据访问层 | v0.3 设计规格 §5 / Phase 2 | `src/sync/remote.ts` |
| 本地优先 SyncEngine | v0.3 设计规格 §5 / Phase 2 | `src/sync/engine.ts`、`src/repository/local.ts` |
| 首次登录合并与本地进度保护 | Phase 3 预研结论 / Phase 3 分文档 01 | `src/components/MergeGuideDialog.tsx`、`src/sync/local-progress.ts`、`src/App.tsx` |
| 同步状态展示 | Phase 3 预研结论 / Phase 3 分文档 02 | `src/components/SyncStatusIndicator.tsx`、`src/components/AccountSection.tsx`、`src/pages/Home.tsx`、`src/pages/Profile.tsx` |
| 账号切换与隔离 | Phase 3 预研结论 / Phase 3 分文档 01/02 | `mq_auth_user_id` 归属锁、`signOutGuarded()` |
| 段位赛联网门控 | Phase 3 预研结论 / Phase 3 分文档 03 | `src/store/rank-match.ts`、`src/pages/RankMatchHub.tsx` |
| 指数退避与自愈 | Phase 3 分文档 04 / RISK-3 | `src/sync/engine.ts` |
| 真实 Supabase 验收 | Phase 3 分文档 04 / acceptance | `phases/phase-3-acceptance.md` |

## RISK 来源与闭环

| ID | 来源 | 处理状态 | 证据 |
|---|---|---|---|
| RISK-1 | Phase 2 Code Review：`shutdown()` 清空 `dirtyKeys` | 已修复 | [`phases/phase-3-acceptance.md`](./phases/phase-3-acceptance.md) RISK 最终结论 |
| RISK-2 | Phase 2 Code Review：`deleteRankMatchSession` 不推远端删除 | 降级关闭 | 产品路径不做物理删除，仅 dev-tool / 单测调用 |
| RISK-3 | Phase 2 Code Review：push 失败无指数退避 | 已修复 | `RETRY_DELAYS_MS = [1,2,4,8,16,30]s` |
| RISK-4 | Phase 2 Code Review：合并测试缺对称用例 | 已修复 | `mergeRankMatchSessions` 对称测试补齐 |

## 与 v0.2 来源目录的差异

v0.2 的 `01-feedback-catalog.md` 用来追踪 13 条用户体验反馈。v0.3 的主线不是反馈批次，而是架构基础设施升级，因此本文件按“Backlog → Spec → Plan → Phase → Acceptance”的证据链组织。

这意味着 v0.3 没有要补造的“原始反馈 13 条”表；需要保留的是每个需求从哪份规格或阶段文档来、最终落到了哪类代码与验收证据中。
