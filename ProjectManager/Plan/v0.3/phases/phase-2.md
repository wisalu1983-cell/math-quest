# Phase 2：同步引擎

> 所属：v0.3 · 设计规格 §5/§6
> 状态：📋 待开始
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

详细步骤见 [`implementation-plan.md`](../implementation-plan.md) Task 2.1~2.4。
