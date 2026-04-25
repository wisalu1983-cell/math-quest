# 阶段规划总图

> 所属版本：v0.3
> 所属主线：[README](./README.md)
> 分类基础：[`02-classification.md`](./02-classification.md)
> 重建日期：2026-04-25
> 本文件角色：事后重建 v0.3 Phase 1~3 的阶段依赖、时序、实际 commit 链与收尾条件。

---

## 三个 Phase 一览

| Phase | 名称 | 主产出 | 启动条件 | 收尾条件 | 状态 |
|---|---|---|---|---|---|
| Phase 1 | 基建 + 认证 | Supabase SDK、SQL schema、本地 v3→v4 迁移、AuthStore、LoginPage | 无 | build/test 通过；登录页可渲染；访客模式不受影响 | ✅ 已完成 |
| Phase 2 | 同步引擎 | sync 类型、合并策略、remote layer、SyncEngine、Repository `markDirty` | Phase 1 完成 | 合并测试通过；全量 test/build 通过；Repository 写操作正确标 dirty | ✅ 已完成 |
| Phase 3 | UI + 验收 | 首次登录合并、同步状态 UI、账号隔离、段位赛联网、指数退避、真实 Supabase 验收 | Phase 2 完成 | 全量 test/build 通过；真实 Supabase 8 剧本通过；上线发布 | ✅ 已完成 |

## 时序示意

```text
2026-04-23
  6451fed  启动 v0.3 计划与目录

2026-04-24
  da17015  Phase 1：基建 + 认证
  a9a1866  Phase 2：同步类型定义
  77217c9  Phase 2：合并策略 + 单元测试
  07d6bc5  Phase 2：远端数据访问层
  684d536  Phase 2：SyncEngine + Repository markDirty
  a999df7  Phase 1/2 收口文档 + RISK 转入 Phase 3
  972ef8b  Phase 3 预研规则收口
  5c7c3a9  Phase 3 账号同步收尾
  f34dc38  发布 v0.3 账号同步系统
  5ee25be  Phase 3 收口文档同步
```

## Phase 之间的依赖

| 关系 | 性质 | 说明 |
|---|---|---|
| Phase 1 → Phase 2 | 硬依赖 | Phase 2 需要 Supabase client、AuthStore、v4 本地存档和 SQL schema |
| Phase 2 → Phase 3 | 硬依赖 | Phase 3 的 UI、合并引导和段位赛联网都依赖 SyncEngine / remote / merge 基础 |
| Phase 3 预研 → Phase 3 实施 | 硬依赖 | Phase 3 原草案不足，需先明确启动门控、账号隔离、RISK 落点和真实验收剧本 |
| Phase 3 → 发布 | 硬依赖 | 线上发布前必须完成真实 Supabase 验收与 build/test |

## Phase 1 详情

入口：[`phases/phase-1.md`](./phases/phase-1.md)

主要任务：

- 安装 `@supabase/supabase-js`
- 新增 `.env.example` 与 Supabase client 单例
- 新增 Supabase SQL migration：表、RLS、trigger
- 本地存档版本 v3→v4
- 新增 AuthStore
- LoginPage 与 App 集成

收口证据：

- 交付 commit：`da17015`
- `npm run build` / `npm test` 通过记录写入 Phase 文档
- 访客模式不受影响

## Phase 2 详情

入口：[`phases/phase-2.md`](./phases/phase-2.md)

主要任务：

- `src/sync/types.ts`
- `src/sync/merge.ts` + `src/sync/merge.test.ts`
- `src/sync/remote.ts`
- `src/sync/engine.ts`
- `src/repository/local.ts` 的 `setSyncNotify`、`markDirty`、silent 写方法

收口证据：

- `npm test`：34 files / 582 tests 通过
- `npm run build` 通过
- `saveSession` 按 Spec §14 保持 local-only
- commit 链：`a9a1866` → `77217c9` → `07d6bc5` → `684d536`
- 4 条 RISK 作为非阻塞观察转入 Phase 3

## Phase 3 详情

入口：[`phases/phase-3.md`](./phases/phase-3.md)

Phase 3 实施依据：

- [`../../Specs/v03-supabase-account-sync/2026-04-24-phase3-00-index.md`](../../Specs/v03-supabase-account-sync/2026-04-24-phase3-00-index.md)
- [`../../Specs/v03-supabase-account-sync/2026-04-24-phase3-01-startup-and-merge.md`](../../Specs/v03-supabase-account-sync/2026-04-24-phase3-01-startup-and-merge.md)
- [`../../Specs/v03-supabase-account-sync/2026-04-24-phase3-02-sync-status-ui.md`](../../Specs/v03-supabase-account-sync/2026-04-24-phase3-02-sync-status-ui.md)
- [`../../Specs/v03-supabase-account-sync/2026-04-24-phase3-03-rank-match-online.md`](../../Specs/v03-supabase-account-sync/2026-04-24-phase3-03-rank-match-online.md)
- [`../../Specs/v03-supabase-account-sync/2026-04-24-phase3-04-resilience-qa.md`](../../Specs/v03-supabase-account-sync/2026-04-24-phase3-04-resilience-qa.md)

主要任务：

- Task 3.0：SyncEngine 启动门控、账号归属锁、有效本地进度判定
- Task 3.1：同步状态指示器
- Task 3.2：首次登录合并引导
- Task 3.3：Profile 账号区域 + Onboarding 登录入口
- Task 3.4：段位赛联网检查、10 分钟接管、自动 suspend
- Task 3.5：指数退避、自愈、RISK 测试补强、真实验收

收口证据：

- `npm test -- --run`：42 个测试文件，638 个测试通过
- `npm run build` 通过
- 真实 Supabase 8 个剧本通过，见 [`phases/phase-3-acceptance.md`](./phases/phase-3-acceptance.md)
- 2026-04-25 补跑 v0.3 账号同步 scoped QAleader 三层回归通过，见 [`../../../QA/runs/2026-04-25-v0.3-account-sync-regression/qa-summary.md`](../../../QA/runs/2026-04-25-v0.3-account-sync-regression/qa-summary.md)
- 线上发布：`f34dc38`，GitHub Pages 可访问

## 子计划说明

v0.3 历史上没有在 `Plan/v0.3/subplans/` 下创建独立子计划。Phase 1/2 由 `implementation-plan.md` 承载实施步骤；Phase 3 的任务拆解由 `Specs/v03-supabase-account-sync/2026-04-24-phase3-*` 文档集承载。

因此本次重建不补造空 `subplans/` 目录，也不把 Phase 3 分文档复制到 Plan 下；在 v0.3 语境中，上述 5 份 Specs 分文档即等价于 Phase 3 的实施级任务入口。

## 下一步

v0.3 已完成代码、验收和发布。若不追加 v0.3 功能，后续应进入版本级收口决策：

1. 确认本次重建的 `00-04` 管理文档与历史证据一致
2. 若线上观察到新问题，进入 [`../../ISSUE_LIST.md`](../../ISSUE_LIST.md) 或 [`../../Backlog.md`](../../Backlog.md)
3. 切入下一版本规划，并更新 [`../../Overview.md`](../../Overview.md) 与 [`../README.md`](../README.md)
