# 执行纪律与验收规则

> 所属版本：v0.3
> 所属主线：[README](./README.md)
> 重建日期：2026-04-25
> 本文件角色：事后重建 v0.3 实施期间实际形成的执行纪律、分工边界、验收要求与后续复用规则。

---

## 核心原则

v0.3 是账号与数据同步主线，风险集中在“用户进度不能丢、账号数据不能串、离线状态不能误导用户”。因此执行纪律优先级为：

1. 数据安全优先于 UI 便利
2. 本地优先优先于强制联网
3. 账号隔离优先于跨账号迁移
4. 真实 Supabase 验收优先于纯 mock 测试
5. Phase 3 以最新开发文档为准，废弃早期草案

## Worktree 与文档前置

v0.3 Phase 3 继续使用历史 worktree：

`math-quest/.worktrees/v0.3-phase1-auth-foundation`

理由：

- Phase 3 直接承接 Phase 1/2 代码
- 现有 worktree 已包含 Phase 1/2 收口文档
- 新开 worktree 会增加合并成本

后续类似任务复用规则：

- 若在 worktree 内执行计划或开发文档，必须确认该计划引用的 `ProjectManager / Specs / Reports / subplans / QA` 文档也存在于当前 worktree
- 若缺失，先同步文档，或明确声明以主工作区文档为 source of truth，并在收尾记录差异

## Phase 3 草案废弃规则

`implementation-plan.md` 的 Phase 3 Task 3.1~3.5 是早期草案，已在 2026-04-24 废弃。Phase 3 实施以以下文档为准：

- [`../../Specs/v03-supabase-account-sync/2026-04-24-phase3-00-index.md`](../../Specs/v03-supabase-account-sync/2026-04-24-phase3-00-index.md)
- [`../../Specs/v03-supabase-account-sync/2026-04-24-phase3-01-startup-and-merge.md`](../../Specs/v03-supabase-account-sync/2026-04-24-phase3-01-startup-and-merge.md)
- [`../../Specs/v03-supabase-account-sync/2026-04-24-phase3-02-sync-status-ui.md`](../../Specs/v03-supabase-account-sync/2026-04-24-phase3-02-sync-status-ui.md)
- [`../../Specs/v03-supabase-account-sync/2026-04-24-phase3-03-rank-match-online.md`](../../Specs/v03-supabase-account-sync/2026-04-24-phase3-03-rank-match-online.md)
- [`../../Specs/v03-supabase-account-sync/2026-04-24-phase3-04-resilience-qa.md`](../../Specs/v03-supabase-account-sync/2026-04-24-phase3-04-resilience-qa.md)

后续查 v0.3 Phase 3 时，必须先读 `phase-3.md` 和上述 Specs 文档，不能按 `implementation-plan.md` 的 Phase 3 草案继续实施。

## 数据保护纪律

### 首次登录

- 登录后不能立即让 SyncEngine 自动 `fullSync()` 抢跑
- 必须先判定本地进度、云端进度、账号归属锁
- 仅有 nickname / avatar 不算有效本地进度
- 本地与云端都有有效进度时，必须由合并引导给出确定性选择
- 不提供“稍后再说”，避免登录后处于不确定数据归属状态

### 账号切换

- 不同账号数据严格隔离
- 当前账号有未同步数据时，默认阻止登出 / 切换
- 用户确认强制登出时，清空当前账号待同步队列，避免污染下一账号
- 不提供把账号 A 本地数据自动合并进账号 B 的入口

### 同步失败

- 本地写入优先完成
- 云同步失败时保留 `dirtyKeys`
- push 失败按指数退避自动重试
- 网络恢复、下一次写入、Realtime、30s 轮询都可触发自愈
- 不因同步失败擦除本地进度

## 段位赛联网纪律

段位赛是长期进度资产，联网约束比普通练习更严格：

| 场景 | 规则 |
|---|---|
| 离线开始新段位赛系列 | 拒绝启动 |
| 离线开始系列内下一局 | 拒绝启动 |
| 局中断网 | 当前局继续，结果先存本地，联网后同步 |
| 远端已有活跃段位赛 | 当前设备不能开新系列 |
| 远端活跃段位赛超过 10 分钟无更新 | 允许本设备接管 |
| 闯关 / 进阶 | 继续允许离线使用 |

物理删除不是产品路径。段位赛生命周期统一靠 `status` 字段表达：`active / suspended / cancelled / completed`。

## 验收纪律

v0.3 不能只靠单元测试收口。收尾必须同时满足：

- `npm test -- --run` 全量通过
- `npm run build` 通过
- 访客模式回归正常
- Supabase 未配置 / 离线 / error 态文案正确
- 真实 Supabase 环境完成 Magic Link、跨设备、合并、离线恢复、段位赛联网与指数退避剧本
- 线上发布后访问检查通过

真实 Supabase 验收记录统一写入 [`phases/phase-3-acceptance.md`](./phases/phase-3-acceptance.md)。

2026-04-25 事后补跑的 v0.3 账号同步 scoped QAleader 记录归档在 [`../../../QA/runs/2026-04-25-v0.3-account-sync-regression/qa-summary.md`](../../../QA/runs/2026-04-25-v0.3-account-sync-regression/qa-summary.md)。该 run 用于补齐正式 QAleader 三层记录；真实 Supabase 远端写入仍以 2026-04-24 acceptance 为事实源。

## RISK 闭环纪律

Phase 2 Code Review 发现的 RISK 不直接丢进 `ISSUE_LIST.md`，而是在 Phase 3 中按任务归属闭环：

| RISK | 处理纪律 |
|---|---|
| RISK-1 | 有实际数据丢失风险，必须修复 |
| RISK-2 | 若确认无产品路径调用者，可按产品语义降级关闭，但要补注释和证据 |
| RISK-3 | 与用户可感知同步 error 停留有关，必须修复 |
| RISK-4 | 测试鲁棒性不足，必须补对称用例 |

所有 RISK 的最终结论必须写入 acceptance 文档。

## PM 回写纪律

v0.3 的 PM 回写顺序：

1. 先更新 Phase / Spec / Acceptance 等权威源
2. 再更新 `Plan/v0.3/README.md`
3. 最后在影响项目活跃视图时更新 `Overview.md`

跨源写入、里程碑收尾、Plan/Spec/Issue 生命周期变化时，按项目规则运行 `pm-sync-check`；纯诊断 / 只读分析可豁免。

## 后续复用

类似账号 / 同步 / 存档升级任务应复用本纪律：

- 迁移链不得用 `clearAll()` 代替
- 合并策略必须确定性
- 云端失败不能擦本地
- 用户可见同步状态必须解释“本地安全、稍后同步”
- 上线前必须有真实后端验收，而不是只看 mock 或单测
