# v0.3 版本收口快照

> 所属版本：v0.3
> 原始周期：2026-04-23 ~ 2026-04-24
> 重建日期：2026-04-25
> 所属主线：[README](./README.md)
> 本文件角色：根据截至 2026-04-25 的仓库状态、历史 commit 与现有 PM 文档事后重建的 v0.3 收口快照；用于补齐版本管理包，不代表该文件在 v0.3 开工时已经存在。

---

## 重建依据

本快照依据以下事实源重建：

- [`../../Overview.md`](../../Overview.md) 当前 v0.3 状态段
- [`README.md`](./README.md) v0.3 主线入口
- [`implementation-plan.md`](./implementation-plan.md) Phase 1/2 历史实施记录与 Phase 3 废弃声明
- [`phases/phase-1.md`](./phases/phase-1.md)、[`phases/phase-2.md`](./phases/phase-2.md)、[`phases/phase-3.md`](./phases/phase-3.md)
- [`phases/phase-3-acceptance.md`](./phases/phase-3-acceptance.md) 真实 Supabase 验收记录
- [`../../Specs/v03-supabase-account-sync/2026-04-23-v03-supabase-账号与同步系统.md`](../../Specs/v03-supabase-account-sync/2026-04-23-v03-supabase-账号与同步系统.md)
- [`../../Specs/v03-supabase-account-sync/2026-04-24-phase3-00-index.md`](../../Specs/v03-supabase-account-sync/2026-04-24-phase3-00-index.md) 及 4 份 Phase 3 分文档
- git 历史 commit：`6451fed` → `da17015` → `a9a1866` / `77217c9` / `07d6bc5` / `684d536` → `a999df7` → `972ef8b` → `5c7c3a9` → `f34dc38` → `5ee25be`

## 背景

v0.2 收口后，原 Backlog 条目 `BL-001 · 本地用户数据存档 / 账号系统前置数据模型` 被正式纳入 v0.3。v0.3 的范围从“数据模型梳理”扩大为完整的 Supabase 在线账号与数据同步系统：

1. 用邮箱 Magic Link 让用户拥有可恢复账号
2. 在不破坏访客模式的前提下，把本地练习进度同步到云端
3. 支持多设备进度合并、离线继续练习、联网后自愈同步
4. 为段位赛增加联网门控，避免跨设备并发破坏长期进度

## 目标

v0.3 要让 math-quest 从纯本地应用升级为“本地优先 + 可登录 + 可跨设备恢复”的版本：

- 未登录用户继续保留原有访客体验
- 登录用户可通过 Supabase 账号恢复进度
- 本地进度与云端进度能确定性合并
- 账号切换时不同账号数据严格隔离
- 同步失败时保护本地进度，并在网络恢复后自动重试
- 段位赛启动与下一局前必须能确认联网与远端活跃状态

## 阶段结构

| Phase | 名称 | 主产出 | 收口状态 |
|---|---|---|---|
| Phase 1 | 基建 + 认证 | Supabase SDK / SQL schema / v3→v4 本地迁移 / AuthStore / LoginPage | ✅ 已完成，交付 commit `da17015` |
| Phase 2 | 同步引擎 | `src/sync/*` 四件套、确定性合并策略、远端 CRUD、Repository `markDirty` 桥接 | ✅ 已完成，commit 链 `a9a1866` → `77217c9` → `07d6bc5` → `684d536` |
| Phase 3 | UI + 验收 | 首次登录合并、同步状态 UI、账号隔离、段位赛联网、指数退避、真实 Supabase 验收 | ✅ 已完成并上线，收口 commit `5c7c3a9` / 发布 commit `f34dc38` |

详细时序见 [`03-phase-plan.md`](./03-phase-plan.md)。

## 收口事实

- Phase 1 / 2 / 3 全部完成
- Phase 3 真实 Supabase 8 个验收剧本全部通过
- 2026-04-25 已补跑 v0.3 账号同步 scoped QAleader 三层回归：[`../../../QA/runs/2026-04-25-v0.3-account-sync-regression/qa-summary.md`](../../../QA/runs/2026-04-25-v0.3-account-sync-regression/qa-summary.md)
- Phase 2 4 条 RISK 均有处理结论：RISK-1 / 3 / 4 已修复，RISK-2 降级关闭
- `npm test -- --run` 在收口记录中通过：42 个测试文件，638 个测试
- `npm run build` 在收口记录中通过
- v0.3 已发布到 GitHub Pages：`master` commit `f34dc38`
- 线上地址：[`https://wisalu1983-cell.github.io/math-quest/`](https://wisalu1983-cell.github.io/math-quest/)
- 当前版本开放 issue 数为 0，见 [`../../ISSUE_LIST.md`](../../ISSUE_LIST.md)

## 范围边界

v0.3 聚焦账号、同步、数据归属与 Supabase 验收，不回头改 v0.2 的生成器、Tips、历史记录主线。

不纳入 v0.3：

- v0.2 Backlog 遗留项：`BL-003` compare 方法提示补证、`BL-004` Practice 答题页状态重置实现清理
- 密码登录、排行榜、好友、后台看板
- 同步管理中心 / 同步详情页
- Practice 答题页同步状态展示
- 云端历史容量上限策略

## 版本归档状态

本文件为 2026-04-25 事后补建的收口快照。v0.3 已完成代码、验收与上线，但截至重建时仍未切入下一版本轴；后续若决定不追加 v0.3 功能，应按 [`../README.md`](../README.md) 的版本归档规则继续执行：

1. 确认本快照与 v0.3 收口事实一致
2. 处理当前版本 issue / backlog 流转
3. 切换 `Overview.md` 当前版本与下一版本入口
4. 更新 `Plan/README.md` 顶部版本索引与当前版本详表
