# Phase 3：UI + 验收

> 所属：v0.3 · 设计规格 §7/§9/§6.4/§13
> 状态：📋 待开始
> 依赖：Phase 2（✅ 已完成 2026-04-24）

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

详细步骤见 [`implementation-plan.md`](../implementation-plan.md) Task 3.1~3.5。

---

## 预研与遗留风险待办

> 来源：Phase 2 Code Review（2026-04-24）。均为 RISK 级观察（非阻塞 bug），开工 Phase 3 前通读；开工后按 Task 归属拆到具体步骤里落实。未归为 ISSUE 是因为它们属于"已知设计边界，等 Phase 3 正好有场景继续打磨"，与 Spec 并不矛盾。

| ID | 级别 | 现象 | 用户感知 | 处理方向 | 归属 Task |
|---|---|---|---|---|---|
| RISK-1 | P2 | `SyncEngine.shutdown` 里直接清空 `syncState.dirtyKeys`；登出瞬间若仍有未推送的本地变更，下次登录这些脏标记已丢失 | 登出 → 登录往返后，少量本地新写不会立即被推云 | Task 3.2（首次登录合并引导）开工时一并处理：`shutdown` 前先 `await push()`；或首登流程主动扫描本地 → 远端差异，按 Spec §7 合并引导对话框触发 | 3.2 |
| RISK-2 | P2 | `repository.deleteRankMatchSession` 走 `*Silent` 写法，不调 `notifySync`，本地删除不会推送到远端 | 本地清理段位赛 session 后，云端仍保留该条目 | 决定清楚"删除是否需要同步"：若需同步，则 `deleteRankMatchSession` 末尾挂 `notifySync('rank_match_sessions')`；若仅本地，则在方法注释明确"删除只影响本地，云端保留"并在 Spec §6.4 补一行说明 | 3.4 |
| RISK-3 | P2 | `push` 失败时只递增 `retryCount`，无 Spec §5 预留的 `RETRY_DELAYS` 指数退避定时器；依赖下一次写操作或 30s 轮询 pull 间接触发 | 瞬时网络波动后，首次 push 失败要等到下一次写或 30s 才重试，用户侧看到"同步出错"状态停留偏久 | Phase 3 Task 3.5 全量验收前补指数退避：`push` 失败时根据 `retryCount` 查 `RETRY_DELAYS` 安排一次性 `setTimeout` 重试，直到成功或 `retryCount` 超上限 | 3.5 |
| RISK-4 | P3 | `mergeRankMatchSessions` 测试未覆盖"同优先级 + 本地 games 更长"的对称用例，仅验证了"远端 games 更长" | 无用户感知（当前逻辑对两个方向对称，纯测试鲁棒性问题） | Task 3.5 全量测试前在 `src/sync/merge.test.ts` 补一条对称用例 | 3.5 |

**进入 Phase 3 前的检查清单**（Task 3.1 开工时勾选）：

- [ ] RISK-1 / 2 / 3 / 4 的归属 Task 已明确，无新增未归属项
- [ ] 上述任一 RISK 升级为 bug（例如 Phase 3 集成联调时观察到实际用户感知）→ 迁入 `ISSUE_LIST.md`，从本表移除并在对应行注"→ ISSUE-xxx"
- [ ] Task 收尾报告里明确写出每条 RISK 的处理结果（已修复 / 按产品决策保留 / 延期到 v0.4）
