# 分类与依赖关系

> 所属版本：v0.3
> 所属主线：[README](./README.md)
> 来源目录：[`01-source-catalog.md`](./01-source-catalog.md)
> 重建日期：2026-04-25
> 本文件角色：事后重建 v0.3 的功能分类、依赖关系与边界，用于替代 v0.2 的反馈分组文档。

---

## 七类一览

### A. 账号与认证

| 子项 | 范围 | 依赖 |
|---|---|---|
| A1 | Supabase 客户端单例与环境变量 | 无 |
| A2 | Magic Link 登录 / 登出 / session 恢复 | A1 |
| A3 | LoginPage 与 App 路由集成 | A2 |

### B. 云端数据模型

| 子项 | 范围 | 依赖 |
|---|---|---|
| B1 | 5 张 Supabase 表：`profiles` / `game_progress` / `history_records` / `rank_match_sessions` / `sync_metadata` | A1 |
| B2 | RLS policy 与新用户 trigger | B1 |
| B3 | 前端 remote row 类型映射 | B1 |

### C. 本地存档与 Repository 桥接

| 子项 | 范围 | 依赖 |
|---|---|---|
| C1 | 本地存档版本 v3→v4 | 无 |
| C2 | `dirtyKeys` 与 `markDirty` | C1 |
| C3 | SyncEngine pull 后的 silent 写方法 | C2 |
| C4 | `mq_auth_user_id` 本地账号归属锁 | A2 + C1 |

### D. 同步引擎与合并策略

| 子项 | 范围 | 依赖 |
|---|---|---|
| D1 | 确定性合并函数：GameProgress / History / RankMatch | B3 + C1 |
| D2 | Supabase CRUD remote layer | A1 + B3 |
| D3 | SyncEngine push / pull / fullSync / Realtime | C2 + D1 + D2 |
| D4 | `arm/start/shutdown` 启动门控 | D3 + E1 |

### E. 首次登录合并与账号隔离

| 子项 | 范围 | 依赖 |
|---|---|---|
| E1 | `hasMeaningfulLocalProgress` 有效本地进度判定 | C1 |
| E2 | 首次登录六场景路由 | A2 + C4 + D4 + E1 |
| E3 | 合并引导 UI 与错误态 | E2 |
| E4 | signOut 前未同步数据保护 | C2 + D4 |

### F. 用户可见同步体验

| 子项 | 范围 | 依赖 |
|---|---|---|
| F1 | Home 同步状态轻量展示 | D4 |
| F2 | Profile 账号区域 | A2 + D4 |
| F3 | Onboarding 登录入口 | A3 |
| F4 | Supabase 未配置 / 离线 / error 文案 | A1 + D4 |

### G. 段位赛联网与同步韧性

| 子项 | 范围 | 依赖 |
|---|---|---|
| G1 | 新段位赛 / 下一局前联网门控 | D3 + F4 |
| G2 | 远端活跃段位赛检测与 10 分钟接管 | D2 + D1 |
| G3 | Practice 离开自动 suspend | G1 |
| G4 | push 失败指数退避与自愈 | D3 |
| G5 | 真实 Supabase 8 剧本验收 | A~G 全部 |

## 依赖关系图

```text
A. 账号与认证 ─┬─> B. 云端数据模型 ─┬─> D. 同步引擎与合并策略 ─┬─> F. 用户可见同步体验
              │                    │                            ├─> G. 段位赛联网与同步韧性
              │                    │                            └─> E. 首次登录合并与账号隔离
              └─> C. 本地存档与 Repository 桥接 ───────────────────┘

G5 真实 Supabase 验收依赖 A~G 全链路闭合。
```

## 关键判断

1. **访客模式是硬边界**：未登录时 SyncEngine 休眠，闯关 / 进阶 / 本地段位赛历史不因账号系统接入而破坏。
2. **首次登录合并是数据保护链路，不是普通 UI**：合并判定完成前不能启动 `fullSync()`，否则本地 / 云端归属可能被抢跑写坏。
3. **账号隔离优先于“方便迁移”**：同设备账号 A 切到账号 B 时不自动把 A 的本地数据合入 B。
4. **段位赛比闯关 / 进阶更严格**：闯关 / 进阶允许离线继续；段位赛开始新系列和系列内下一局前必须确认联网与远端状态。
5. **Phase 3 草案已废弃**：`implementation-plan.md` 的 Phase 3 只保留历史，实际执行依据是 `Specs/v03-supabase-account-sync/2026-04-24-phase3-*` 文档集。

## 非目标归类

| 类别 | 明确不做 | 归因 |
|---|---|---|
| 产品账号能力 | 密码登录、好友、排行榜、后台看板 | 超出 v0.3 最小账号同步闭环 |
| 同步管理 | 同步详情页、手动同步控制台 | Phase 3 决定自动重试，用户不承担同步控制责任 |
| 题目与教学 | v0.2 Backlog 的 compare tip、Practice 状态清理 | 与 v0.3 auth / sync 主线解耦 |
| 数据容量 | 云端历史容量上限 | v0.3 数据量在健康范围，观察到真实风险再做 |

## 与 Phase 的对应关系

| 分类 | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|
| A. 账号与认证 | 主体完成 | - | UI 入口补强 |
| B. 云端数据模型 | 主体完成 | remote 类型使用 | 真实 Supabase 验收 |
| C. 本地存档与 Repository 桥接 | v3→v4 | `markDirty` / silent 写 | 账号归属锁与登出保护 |
| D. 同步引擎与合并策略 | - | 主体完成 | 启动门控与退避补强 |
| E. 首次登录合并与账号隔离 | - | 合并基础 | 主体完成 |
| F. 用户可见同步体验 | LoginPage | - | 主体完成 |
| G. 段位赛联网与同步韧性 | - | 合并基础 | 主体完成并验收 |
