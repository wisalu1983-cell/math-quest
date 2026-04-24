# Phase 3 · Task 3.5 · 韧性改造 + 测试补齐 + 真实 Supabase 验收

> 属于：v0.3 Phase 3
> 总览：[`00-index`](./2026-04-24-phase3-00-index.md)
> 关键决策：T4（`RETRY_DELAYS`）、T5（自愈触发器）、RISK-3 / RISK-4 修复
> 前置：[`01-startup-and-merge`](./2026-04-24-phase3-01-startup-and-merge.md) / [`02-sync-status-ui`](./2026-04-24-phase3-02-sync-status-ui.md) / [`03-rank-match-online`](./2026-04-24-phase3-03-rank-match-online.md)
> 状态：✅ 已实施并验收（2026-04-24）

---

## 目标

1. **RISK-3 修复**：`SyncEngine` 的 push 失败后加指数退避定时重试；重试耗尽后 status 停留 error、不清 dirtyKeys、提供自愈路径
2. **RISK-4 修复**：`mergeRankMatchSessions` 单测补对称用例（"同优先级 status + 本地 games 更长"），确保合并函数无方向偏向
3. **RISK-1 / RISK-2 闭环确认**：整理 Task 3.0 / Task 3.4 相关改动的最终结论，写入 Phase 3 收尾报告模板
4. **真实 Supabase 验收**：完成 8 个关键剧本的真环境验收，每个剧本写入验收记录（截图或日志摘要）
5. **整体回归**：Phase 3 全量 `npm test` / `npm run build` 通过；手动回归清单全绿

---

## 关键规则（不可违反）

1. **指数退避常量不可 hard-code 到 push 函数**：`RETRY_DELAYS` 导出为模块常量，便于测试 mock
2. **重试耗尽不清 dirtyKeys**：任何自愈触发器成功后才能清 retryCount；status 停留 `error` 直到自愈成功
3. **自愈触发器必须是**四者之一：`online` 事件、下一次 `markDirty`、Realtime 推送、30s 轮询（已有）
4. **真实 Supabase 验收在专用测试账号**完成，不使用个人账号；验收后数据清理规范见 §验收后清理
5. **合并函数（`mergeRankMatchSessions`）对称性**：同输入在交换 local ↔ remote 位置后，结果应等价（见 §RISK-4）

---

## 模块改造点

### `src/sync/engine.ts` — 指数退避

**当前行为**（`engine.ts` L125-181）：
- `push` 失败时 `status = 'error'`、`retryCount++`、保留 `dirtyKeys`
- 没有任何"失败后定时重试"的机制；只靠 30s 轮询 `pull`（pull 不会触发 push）+ `online` 事件（online 触发 `fullSync` = pull + 间接重试）
- 结果：短暂网络抖动后，push 失败的数据**可能要等 30 秒**才重试；如果连续失败也不会自增延迟

**目标行为**：
- `push` 失败后按 `RETRY_DELAYS` 数组定时重试 push（不是 pull）
- 重试耗尽（6 次）后停在 `error` + `retryCount = 6`；`dirtyKeys` 保留
- 自愈：`online` / 下一次 `markDirty` / Realtime / 30s 轮询（轮询内看到 retryCount > 0 且 online 时主动 push）任一触发成功 → `retryCount = 0`

**实现**：

```typescript
// 模块顶层常量已在 Task 3.0 新增：
export const RETRY_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000] as const;
export const MAX_RETRY = RETRY_DELAYS_MS.length;  // 6

// engine 内部新增闭包变量：
let retryTimerId: ReturnType<typeof setTimeout> | null = null;

const scheduleRetry = () => {
  if (retryTimerId) {
    clearTimeout(retryTimerId);
    retryTimerId = null;
  }

  const idx = get().retryCount;
  if (idx >= MAX_RETRY) {
    // 停在 error，等待自愈触发
    return;
  }

  const delay = RETRY_DELAYS_MS[idx];
  retryTimerId = setTimeout(() => {
    retryTimerId = null;
    if (!activeUserId) return;
    if (!isOnline()) {
      set({ status: 'offline' });
      return;
    }
    void push();  // 如成功，push 内部会 retryCount = 0；如失败，retryCount++ 并再次 scheduleRetry
  }, delay);
};

// push() 函数尾部（L175-178 附近）失败分支调用 scheduleRetry：
if (remaining.length === 0) {
  persistSyncState(nextState);
  set({ status: 'synced', retryCount: 0 });
  if (retryTimerId) { clearTimeout(retryTimerId); retryTimerId = null; }
  return true;
}

persistSyncState(nextState);
const nextRetry = get().retryCount + 1;
set({ status: 'error', retryCount: nextRetry });
if (nextRetry < MAX_RETRY) {
  scheduleRetry();
}
return false;
```

**markDirty 的自愈路径**：

```typescript
markDirty: (key: DirtyKey) => {
  const { syncState } = get();
  const nextKeys = syncState.dirtyKeys.includes(key)
    ? syncState.dirtyKeys
    : [...syncState.dirtyKeys, key];
  const nextState = { ...syncState, dirtyKeys: nextKeys };
  persistSyncState(nextState);
  // 自愈：status 之前是 error 时，markDirty 作为用户活动的信号，复位 retryCount 并立即 push
  if (get().status === 'error') {
    set({ retryCount: 0 });
    if (retryTimerId) { clearTimeout(retryTimerId); retryTimerId = null; }
  }
  if (get().status !== 'armed' && activeUserId && isOnline()) {
    void push();
  }
},
```

**online 事件的自愈路径**：

```typescript
onlineHandler = () => {
  if (get().status === 'error') {
    set({ retryCount: 0 });
    if (retryTimerId) { clearTimeout(retryTimerId); retryTimerId = null; }
  }
  void get().fullSync();
};
```

**30s 轮询的自愈路径**：

```typescript
intervalId = setInterval(() => {
  if (!activeUserId) return;
  if (!isOnline()) return;
  const { status, syncState } = get();
  // 如果处于 error + 仍有 dirtyKeys，主动尝试 push（不通过 scheduleRetry 的指数延迟）
  if (status === 'error' && syncState.dirtyKeys.length > 0) {
    set({ retryCount: 0 });
    void push();
    return;
  }
  // 正常情况：拉一次
  void pull();
}, SYNC_INTERVAL_MS);
```

**cleanupRuntime** 需要清理 `retryTimerId`：

```typescript
const cleanupRuntime = () => {
  if (retryTimerId) { clearTimeout(retryTimerId); retryTimerId = null; }
  // ...其余已有逻辑
};
```

### `src/sync/merge.test.ts` — RISK-4 对称用例

**现状**：该文件覆盖了 `mergeGameProgress` / `mergeHistoryRecords` / `mergeRankMatchSessions` 的多种场景。RISK-4 指出"同优先级 status + 本地 games 更长"路径未覆盖——即：

```
两端都是 status === 'active'，本地 session.games.length = 3，远端 session.games.length = 2
→ 应该选本地（games 更长者胜出）
```

**补充用例**：

```typescript
describe('mergeRankMatchSessions · RISK-4 对称用例', () => {
  it('同为 active，本地 games 更长 → 取本地', () => {
    const localSession = makeSession({ id: 's1', status: 'active', gamesLen: 3 });
    const remoteSession = makeSession({ id: 's1', status: 'active', gamesLen: 2 });
    const result = mergeRankMatchSessions({ s1: localSession }, { s1: remoteSession });
    expect(result.s1.games).toHaveLength(3);
  });

  it('同为 active，远端 games 更长 → 取远端', () => {
    const localSession = makeSession({ id: 's1', status: 'active', gamesLen: 2 });
    const remoteSession = makeSession({ id: 's1', status: 'active', gamesLen: 3 });
    const result = mergeRankMatchSessions({ s1: localSession }, { s1: remoteSession });
    expect(result.s1.games).toHaveLength(3);
  });

  it('同为 suspended，本地 games 更长 → 取本地', () => {
    const localSession = makeSession({ id: 's1', status: 'suspended', gamesLen: 3 });
    const remoteSession = makeSession({ id: 's1', status: 'suspended', gamesLen: 2 });
    const result = mergeRankMatchSessions({ s1: localSession }, { s1: remoteSession });
    expect(result.s1.games).toHaveLength(3);
  });

  it('对称性：交换 local/remote 位置，结果等价', () => {
    const a = makeSession({ id: 's1', status: 'active', gamesLen: 3 });
    const b = makeSession({ id: 's1', status: 'active', gamesLen: 2 });
    const r1 = mergeRankMatchSessions({ s1: a }, { s1: b });
    const r2 = mergeRankMatchSessions({ s1: b }, { s1: a });
    expect(r1.s1.games).toEqual(r2.s1.games);
    expect(r1.s1.updatedAt).toEqual(r2.s1.updatedAt);
  });
});
```

`makeSession` 可复用已有测试 helper 或在文件顶部新建。

---

## 实施步骤

- [x] **Step 1**：复用 Task 3.0 已导出的 `RETRY_DELAYS_MS` / `MAX_RETRY` 常量；实现 `scheduleRetry`；`push` 失败分支调用
- [x] **Step 2**：`markDirty` / `onlineHandler` / 轮询的自愈路径
- [x] **Step 3**：`cleanupRuntime` 清理 retryTimer
- [x] **Step 4**：`src/sync/engine.test.ts` 新增：
  - push 失败 1 次后 1s 内 retry（用 `vi.useFakeTimers` + `vi.advanceTimersByTime`）
  - 连续 6 次失败后 retryCount=6 不再 schedule
  - online 事件在 error 状态下复位 retryCount
  - markDirty 在 error 状态下复位 retryCount + 触发立即 push
  - 30s 轮询在 error + dirtyKeys 非空时触发 push
- [x] **Step 5**：`src/sync/merge.test.ts` 新增 RISK-4 对称用例（4 个）
- [x] **Step 6**：`npm test` 全量通过；`npm run build` 通过
- [x] **Step 7**：commit `feat(v0.3): SyncEngine 指数退避 + 自愈触发器 (RISK-3) + mergeRankMatchSessions 对称用例 (RISK-4)`
- [x] **Step 8**：真实 Supabase 验收（见下）
- [x] **Step 9**：Phase 3 收尾报告（见下）

---

## 真实 Supabase 验收剧本

### 准备

- 真实 Supabase 项目已在 Phase 1 完成部署（见 Phase 1 文档）
- 准备两个测试邮箱 A / B（可用同一邮箱 + plus alias，如 `test+a@...` / `test+b@...`）
- 两个设备或两个浏览器（推荐 Chrome + Firefox，独立 localStorage）
- Supabase 控制台 Table Editor 准备好，便于查看实时数据变化

每个剧本完成后填写验收记录，放在 `ProjectManager/Plan/v0.3/phases/phase-3-acceptance.md`（新建）或者 commit 里附截图。

### 剧本 1：Magic Link 首次登录（全新账号）

**步骤**：
1. 访客模式 → Profile 点"登录"→ 输入邮箱 A → 收到 Magic Link → 点链接
2. 回到 app → 观察：无合并对话框，直接进 Home；SyncStatusIndicator 短暂 armed/syncing 后变 synced
3. Supabase 控制台：`profiles` / `game_progress` 表各有 1 行，user_id 对应 A

**期望**：
- 不弹合并对话框（场景 A：全新账号）
- Home 顶部图标最终显示 ✓
- `mq_auth_user_id` localStorage = A 的 Supabase uid

### 剧本 2：访客数据上云（首次登录 · 有本地进度）

**步骤**：
1. 访客模式 → 完成 1 关 campaign + 1 次 advance 训练 → Profile 确认 totalQuestionsAttempted > 0
2. Profile 点"登录"→ 邮箱 B → 点 Magic Link 回 app
3. 观察：对话框短暂 "loading" → 关闭，进 Home（auto-push 路径）
4. Supabase：`game_progress` 行的 total_questions_attempted 与本地一致

**期望**：
- 无用户交互的 auto-push
- 本地数据完整保留 + 已上云

### 剧本 3：跨设备拉取（换设备登录已有账号）

**步骤**：
1. 完成剧本 2 后，打开另一个浏览器（或清空 localStorage）
2. 访客模式 → 不做任何练习（本地无有效进度）
3. Profile → 登录邮箱 B → 点 Magic Link
4. 观察：短暂 loading 后进 Home；campaign / 段位数据与剧本 2 的设备一致

**期望**：
- 无合并对话框（场景 C：auto-pull 路径）
- 所有 campaign / advance / rank 数据完整拉到本地

### 剧本 4：两端都有数据合并

**步骤**：
1. 在剧本 2 的设备登出（SignOutConfirmDialog 应展示"无未同步数据"→ 直接登出）
2. 访客模式下再完成 1 关 campaign（制造本地新数据）
3. Profile → 登录邮箱 B（**同一账号**）→ 观察：弹 MergeGuideDialog "两端都有数据"
4. 点 [合并到云端] → 短暂 loading → 关闭，进 Home
5. Supabase：`game_progress` 的 total_questions_attempted 是本地 + 远端的并集（按 mergeGameProgress 规则）

**期望**：
- 弹出两端都有的对话框；无"稍后再说"按钮
- 合并完成后双端数据一致

### 剧本 5：合并失败错误态

**步骤**：
1. 准备剧本 4 的前置条件（两端都有数据）
2. 打开浏览器 DevTools → Network 标签 → 设置成 offline
3. 执行剧本 4 第 3 步 → MergeGuideDialog 应进入 decide 但 fetch 失败
4. 15 秒超时后进入错误态；验证：
   - "重试合并" 按钮可点 → 重新进入 decide（仍 offline 仍失败）
   - "改用云端数据" 按钮可点 → 切换到 discard 方向
   - "取消登录" 按钮可点 → 登出并回访客 Home
5. 恢复 online → 点击 [重试合并] → 成功完成

**期望**：
- 三个按钮全部可达 + 行为正确
- **不出现"稍后再说"按钮**
- 取消登录后回到 guest 状态干净

### 剧本 6：段位赛跨设备接管（10 分钟阈值）

**步骤**：
1. 在设备 A 登录 B → 段位赛打到第 1 局结束（rookie BO3）
2. 直接关浏览器（**不点中断按钮**）→ 验证 Practice.tsx 的 pagehide 会同步本地 suspend（可选：跳过此步直接模拟"未 suspend"）
3. 在 Supabase 控制台手动把对应 rank_match_sessions 行：`status = 'active'`，`updated_at` 改成当前时间减去 **9 分钟**（模拟"还不到 10 分钟"）
4. 在设备 B 登录 B → Hub 应显示"检测到你有一台设备正在进行此挑战" + 按钮 disabled
5. Supabase 控制台再把 updated_at 改成当前时间减去 **11 分钟** → 刷新设备 B Hub → 应显示"这场挑战在另一台设备上超过 10 分钟无响应，本设备可接管继续"+ [继续第 2 局] 按钮
6. 点击 [继续第 2 局] → 进入 Practice 打完 → Hub 看到 BO 状态推进
7. Supabase：rank_match_sessions 行的 games.length 增加；updated_at 更新到刚才接管时的时间

**期望**：
- 10 分钟阈值严格生效
- 接管后 games 覆盖远端

### 剧本 7：持续离线

**步骤**：
1. 登录 B 完成初次同步 → 关闭 tab
2. DevTools offline → 打开 app（重新挂载）→ 验证：
   - AuthStore.supabaseUser 从 localStorage 恢复
   - 不弹合并对话框（场景 F 的熟路径）
   - SyncStatusIndicator 显示"离线"
   - Home 可正常使用（非段位赛）；段位赛入口 disabled 提示"离线"
3. 断网状态下完成 1 关 campaign → SyncStatusIndicator 仍然离线；dirtyKeys 增加
4. 恢复 online → SyncStatusIndicator 变 syncing → synced；Supabase 数据已更新

**期望**：
- 离线启动不打断用户
- 恢复后自动推送 dirtyKeys 对应数据

### 剧本 8：指数退避 + 自愈

**步骤**：
1. 登录 B + 完成一些数据
2. Supabase 控制台临时把 `game_progress` 表 RLS policy 修改为"仅允许非该 user_id 的访问"（或者直接 revoke 上表的 insert/update 权限给该角色；方式不拘）——**构造一个确定失败的 upsert 路径**
3. 触发一次 markDirty（改 settings 里的 soundEnabled）→ 观察 push 失败
4. 使用 DevTools console 观察 `useSyncEngine.getState().retryCount` 的变化：1 → 2 → 3 → ... 6（各间隔 1/2/4/8/16/30s）
5. 第 7 次不再自动重试（retryCount 停在 6，SyncStatusIndicator 变 ❌）
6. Profile → AccountSection 显示"同步持续失败"+ "手动重试"按钮
7. Supabase 恢复 RLS policy → 点"手动重试" → 成功
8. 备选自愈路径验证：
   - 重做 step 2-5 → 构造 retryCount=6 状态
   - 恢复 RLS
   - 不点手动重试，等下一次 markDirty（例如切换 sound toggle）→ 验证 retryCount 复位 + 立即 push

**期望**：
- 6 次重试严格按 RETRY_DELAYS_MS 间隔
- 耗尽后 status=error 不消失，dirtyKeys 保留
- 自愈触发器三者（手动重试 / markDirty / online）任一生效

---

## 验收后清理

- Supabase 测试表数据可保留（含 A / B 账号的 profile 与 game_progress）
- 若剧本 8 临时改了 RLS policy，必须恢复到 Phase 1 部署时的原版
- 清理 localStorage：手动 `localStorage.clear()` 或在测试浏览器里打开 `file:///...` 之类的独立 origin

---

## RISK 最终结论（写入 Phase 3 收尾报告）

| ID | 最终结论 | 实施位置 |
|---|---|---|
| RISK-1 | **修复** · `shutdown` 不再清 dirtyKeys；signOut 前有 `signOutGuarded` 校验脏数据 + SignOutConfirmDialog 保护；用户确认"仍然登出"后清空待同步队列，防止旧账号 dirtyKeys 污染下一账号 | Task 3.0 / Task 3.3 |
| RISK-2 | **降级关闭** · 核实 `deleteRankMatchSession` 无产品路径调用者（仅 dev-tool / 单测）；doc comment 约束 | Task 3.4 |
| RISK-3 | **修复** · `RETRY_DELAYS_MS = [1, 2, 4, 8, 16, 30] s`，6 次重试；耗尽后自愈路径（手动重试 / markDirty / online / 轮询） | Task 3.5 |
| RISK-4 | **修复** · `mergeRankMatchSessions` 单测新增 4 条对称用例 | Task 3.5 |

---

## 测试计划汇总（Phase 3 全量）

| 文件 | 新增 / 增补 | 用例数 |
|---|---|---|
| `src/sync/local-progress.test.ts` | 新增 | ~10 |
| `src/sync/engine.test.ts` | 增补 | ~11 |
| `src/sync/merge-flow.test.ts` | 新增 | ~12 |
| `src/sync/merge.test.ts` | 增补 | 4 |
| `src/store/auth.test.ts` | 增补 | ~3 |
| `src/repository/local.test.ts` | 增补 | ~3 |
| `src/utils/relative-time.test.ts` | 新增 | 6 |
| `src/components/SyncStatusIndicator.test.tsx` | 新增 | ~7 |
| `src/components/AccountSection.test.tsx` | 新增 | ~7 |
| `src/components/SignOutConfirmDialog.test.tsx` | 新增 | 3 |
| `src/hooks/useOnlineStatus.test.ts` | 新增 | 3 |
| `src/store/rank-match.test.ts` | 增补 | 2 |
| `src/store/index.rank-match-lifecycle.test.ts` | 增补 | 3 |
| `src/pages/RankMatchHub.test.tsx` | 新增 | 6 |
| **合计新增** | — | **~80** |

Phase 2 结束基线 582 tests → Phase 3 结束预估约 660 tests。实际以执行结果为准。

---

## Task 收尾条件

- [x] Step 1-7 代码改动 + commit
- [x] 真实 Supabase 8 个剧本全部通过
- [x] `Plan/v0.3/phases/phase-3-acceptance.md` 写完（每个剧本的通过证据）
- [x] `Plan/v0.3/phases/phase-3.md` 状态改为 ✅ 已完成
- [x] `Plan/v0.3/implementation-plan.md` 顶部添加"Phase 3 以 Specs/... 为准"的废弃声明
- [x] `Plan/v0.3/README.md` 主线状态更新
- [x] worktree 的改动 merge 回主线
- [x] 最终 `npm test` + `npm run build` 全量通过

---

## 相关文件一览

**修改**：
- `src/sync/engine.ts`（指数退避 + 自愈）
- `src/sync/engine.test.ts`（退避用例）
- `src/sync/merge.test.ts`（RISK-4 对称）

**新增文档**：
- `ProjectManager/Plan/v0.3/phases/phase-3-acceptance.md`（真实 Supabase 剧本通过证据）

**不改动**：
- `src/sync/merge.ts`（RISK-4 只补测试）
- `src/sync/remote.ts`
