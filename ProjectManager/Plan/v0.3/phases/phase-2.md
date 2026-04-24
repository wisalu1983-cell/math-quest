# Phase 2：同步引擎

> 所属：v0.3 · 设计规格 §5/§6
> 状态：✅ 已完成（2026-04-24）
> 依赖：Phase 1（AuthStore + Supabase 客户端就绪）

---

## 范围

- 同步类型定义（`src/sync/types.ts`）
- 合并策略函数 + 单元测试（`src/sync/merge.ts` + `merge.test.ts`）
- 远端数据访问层——Supabase CRUD 封装（`src/sync/remote.ts`）
- SyncEngine 核心——push/pull/在线检测/Realtime 订阅（`src/sync/engine.ts`）
- Repository 改造——写操作加 `markDirty` + silent 写方法

## Task 清单

| Task | 内容 | 涉及文件 |
|------|------|---------|
| 2.1 | 同步类型定义 | `src/sync/types.ts` |
| 2.2 | 合并策略（核心 + 测试） | `src/sync/merge.ts`, `src/sync/merge.test.ts` |
| 2.3 | 远端数据访问层 | `src/sync/remote.ts` |
| 2.4 | SyncEngine + Repository 改造 | `src/sync/engine.ts`, `src/repository/local.ts` |

## 进入条件

- Phase 1 完成（AuthStore 可用、Supabase 客户端可初始化）

## 收尾条件

- 合并策略单元测试全部通过
- `npm test` 全量通过
- `npm run build` 通过
- Repository 写操作能正确标记 dirtyKeys

## 关键设计约束

- **合并规则确定性**：所有合并函数对相同输入始终产出相同结果，不存在随机或时间依赖
- **Repository 接口不变**：Zustand stores 的调用方式不改变
- **silent 方法**：SyncEngine pull 后写本地用 silent 方法，避免循环触发 markDirty
- **本地-only 数据**：`saveSession`（`mq_sessions`）按 Spec §14 不挂 `notifySync`，不进云同步

详细步骤见 [`implementation-plan.md`](../implementation-plan.md) Task 2.1~2.4。

---

## 收口证据（2026-04-24）

**交付范围**：

- `src/sync/types.ts` — 同步类型定义（`SyncStatus` / `DirtyKey` / `SyncState` + Remote* 行类型）
- `src/sync/merge.ts` + `src/sync/merge.test.ts` — 7 个确定性合并函数 + 单元测试
- `src/sync/remote.ts` — Supabase CRUD 封装（profile / game_progress / history / rank_match_sessions）
- `src/sync/engine.ts` — SyncEngine（push / pull / fullSync / markDirty / Realtime，订阅 AuthStore 自动 initialize/shutdown）
- `src/repository/local.ts` — 新增 `setSyncNotify` 事件桥 + 4 个 `*Silent` 写方法；原有写方法末尾挂 `notifySync`

**验收事实**：

- `npm test`：34 files / 582 tests 全绿
- `npm run build`：类型检查 + 打包通过
- §14 约束遵守：`saveSession` 无 `notifySync` 调用，`mq_sessions` 仅本地
- Repository 公开接口签名未变（`saveUser` / `saveGameProgress` / `saveHistoryRecord` / `saveRankMatchSession`），Zustand store 调用方无需改动
- Commit 链：`a9a1866` 类型 → `77217c9` 合并策略 → `07d6bc5` 远端层 → `684d536` Engine + markDirty 改造

**Code Review 附加观察（4 条 RISK，非阻塞，已移交 Phase 3 预研待办）**：

见 [`phase-3.md` · 预研与遗留风险待办](./phase-3.md#预研与遗留风险待办)。
