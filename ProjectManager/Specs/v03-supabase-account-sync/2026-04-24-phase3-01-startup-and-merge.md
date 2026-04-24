# Phase 3 · Task 3.0 + Task 3.2 · 启动门控 + 首次登录合并

> 属于：v0.3 Phase 3
> 总览：[`00-index`](./2026-04-24-phase3-00-index.md)
> 设计规格：[`v03-supabase-账号与同步系统`](./2026-04-23-v03-supabase-账号与同步系统.md) §4 / §5 / §7
> 状态：📋 待开始

Task 3.0（启动前技术收口）与 Task 3.2（首次登录合并引导）紧耦合——合并引导的触发依赖门控改造后的新行为，拆开会增加上下文反复。放在同一文档中按顺序实施。

---

## 目标

1. 把 `SyncEngine` 从"一登录就自动 `fullSync`"改造为可控的三态启动（`arm → start → shutdown`），让合并判定先完成再启动同步
2. 新增 `hasMeaningfulLocalProgress` 纯函数，作为"本地数据归属 + 合并判定"的唯一判据
3. 实现账号归属锁 `mq_auth_user_id` 的读写时序，让"本地数据属于哪个账号"在任何时刻都有确定答案
4. 实现首次登录合并引导对话框，覆盖三种场景 + 错误态
5. 实现 signOut 前的未同步数据保护（对应 P4 / RISK-1 的门控部分）

---

## 关键规则（不可违反）

1. **禁止 `SyncEngine` 在合并判定完成前 `fullSync`**。`arm(userId)` 不能触发 `fullSync`；`start()` 由 App 层在合并判定确认后显式调用。
2. **`mq_auth_user_id` 是本地数据归属的唯一权威**。`mq_user` / `mq_game_progress` 里的 `userId` 字段会在合并完成后改写为 Supabase uid，但在合并完成前它们可能还是旧 nanoid；此时只有 `mq_auth_user_id` 可信。
3. **`hasMeaningfulLocalProgress` 是纯函数**。不能依赖网络 / 环境 / 时间；相同输入必须相同输出。
4. **首次登录合并对话框是阻塞 modal**。对话框打开时用户只能在三个按钮中选一个：继续合并 / 换方向 / 取消登录。不能通过关闭按钮或点背景退出。
5. **离线登录 + 已有本地数据且归属冲突**：必须在合并判定阶段弹对话框，不能让用户进主场景。这个判定只依赖本地 `mq_auth_user_id`，不依赖网络。

---

## 状态机

### AuthStore × SyncEngine 联合状态机

```
┌──────────────┐
│    guest     │  未登录（或 Supabase 未配置）
└──────┬───────┘
       │ signInWithMagicLink / Magic Link 回调
       ▼
┌──────────────┐
│   authing    │  Supabase 正在建立 session
└──────┬───────┘
       │ session 建立成功
       ▼
┌──────────────┐
│ authed-unarmed│ 已登录，SyncEngine 未启动
└──────┬───────┘
       │ engine.arm(userId) — 注册监听，不 fullSync
       ▼
┌──────────────┐       归属冲突
│    armed     │ ─────────────────────┐
└──────┬───────┘                      │
       │ 归属判定完成                 │
       │ + hasMeaningfulLocalProgress │
       ▼                              ▼
┌──────────────┐              ┌──────────────┐
│   merging    │ ────────────▶│ merge-error  │
│ (合并对话框) │   失败        │ (可重试 / 换方向 / 取消登录)
└──────┬───────┘              └───┬──────────┘
       │ 合并完成                 │ 取消登录
       │ mq_auth_user_id 写入      │
       ▼                          ▼
┌──────────────┐              (回到 guest)
│   running    │
│ start 完成   │
└──────┬───────┘
       │ signOut（需 P4 保护）
       ▼
┌──────────────┐
│   shutdown   │ 清理监听，不清 dirtyKeys（修正 RISK-1）
└──────┬───────┘
       │
       ▼
   (回到 guest)
```

### MergeGuideDialog 内部状态机

```
idle
 │ 对话框首次打开
 ▼
decide — 读本地 + 拉云端，决定走哪条路径
 │
 ├── 本地无有效进度，云端有 → auto-pull（自动拉取，不用户确认）
 │     ↓
 │   writing-local → success
 │
 ├── 本地有，云端无 → auto-push（自动上传，不用户确认）
 │     ↓
 │   writing-remote → success
 │
 └── 本地有，云端也有 → wait-user-choice（显示"合并到云端 / 使用云端"按钮）
       │ 用户点"合并到云端"
       ▼
     merging → success / merge-error
       │ 用户点"使用云端"
       ▼
     discarding-local → success / discard-error

任一 error 状态：
  - 重试同一操作
  - 换方向（merge-error 改走 discard；discard-error 改走 merge）
  - 取消登录（signOut 回访客）
```

---

## 数据流

### 场景 A：全新设备 + 全新账号

```
用户输入邮箱 → Magic Link → 回到 app → AuthStore.supabaseUser 更新
  → engine.arm(userId)
  → App 检测：本地无有效进度 + 本地 mq_auth_user_id 为空
  → fetch 云端：无数据（新账号 trigger 刚创建空行）
  → MergeGuideDialog 不弹，直接：
      写 mq_auth_user_id = userId
      把本地空 GameProgress 的 userId 改为 Supabase uid
  → engine.start()
  → 进入 running 状态，Home
```

### 场景 B：访客玩过一段 + 首次登录新账号

```
用户输入邮箱 → Magic Link → 回到 app → AuthStore.supabaseUser 更新
  → engine.arm(userId)
  → App 检测：hasMeaningfulLocalProgress(localGP) === true + mq_auth_user_id 为空
  → fetch 云端：无数据
  → MergeGuideDialog decide → auto-push
    本地 GameProgress.userId 改写为 Supabase uid
    upsert 到云端
    写 mq_auth_user_id = userId
  → engine.start()
```

### 场景 C：换设备 + 登录已有账号（新设备本地空）

```
用户输入邮箱 → Magic Link → AuthStore 更新
  → engine.arm(userId)
  → App 检测：hasMeaningfulLocalProgress(localGP) === false + mq_auth_user_id 为空
  → fetch 云端：有数据
  → MergeGuideDialog decide → auto-pull
    把云端数据写入本地（saveGameProgressSilent）
    写 mq_auth_user_id = userId
  → engine.start()
```

### 场景 D：两端都有数据（换设备 + 本地已玩过访客）

```
用户输入邮箱 → Magic Link → AuthStore 更新
  → engine.arm(userId)
  → App 检测：hasMeaningfulLocalProgress(localGP) === true + mq_auth_user_id 为空
  → fetch 云端：有数据
  → MergeGuideDialog decide → wait-user-choice
    [合并到云端]  → merge → 双端写入合并结果 → mq_auth_user_id = userId
    [使用云端]    → discard → 本地被云端覆盖 → mq_auth_user_id = userId
    [任一失败]    → 进入错误态，三个按钮（重试 / 换方向 / 取消登录）
  → engine.start()
```

### 场景 E：归属冲突（本地数据属于 A 账号，登录 B）

```
用户输入邮箱 → Magic Link → AuthStore 更新（supabaseUser = B）
  → engine.arm(userId=B)
  → App 检测：mq_auth_user_id === A（非空且不等于 B）
  → 不 fetch 云端，直接进入归属冲突流程
  → 专用对话框「AccountMismatchDialog」：
      "本设备当前保存着另一个账号（A@xxx）的进度。登录 B 将只加载 B 的云端数据，
       不会把 A 的本地进度带过去。"
      [继续登录 B]  → 清本地 user/game_progress/history/rank_match_sessions
                     → 清空旧账号遗留的 syncState.dirtyKeys（retry 计时器由 arm/shutdown 清理）
                     → 按场景 C 从云端拉 B 的数据 → 写 mq_auth_user_id = B
      [取消登录]    → signOut 回 guest
  → engine.start()
```

> 注意：场景 E 的数据清理仅在用户明确选"继续登录 B"时进行。A 账号云端数据不受影响；若用户此前在 P4 对话框选择"仍然登出"，本地 A 副本可能包含未上云进度，但这些进度不能迁移到 B，也不能通过遗留 `dirtyKeys` 推送到 B。

### 场景 F：持续离线登录

```
用户已有 Supabase session（之前登录过）
  → 启动 app → AuthStore.initialize() 从 localStorage 恢复 session
  → engine.arm(userId)
  → App 检测：mq_auth_user_id === userId（熟路径）
  → 直接 engine.start()（不弹对话框；本地数据就是该账号的）
  → isOnline() === false → SyncStatusIndicator 显示"离线"
  → 网络恢复 → online 事件 → fullSync 自动触发（见文档 04）

如果 mq_auth_user_id 为空（首次登录 + 离线）：
  → 合并判定需要云端数据，当前无网
  → 保持 armed 状态，不进主场景
  → 对话框换为"等待同步"态：
      "需要网络完成首次账号同步，请检查网络"
      [重试]  → 再次 fetch 云端
      [取消登录]  → signOut 回 guest
  → 网络恢复 → 自动重试 decide 流程
```

---

## 模块改造点

### `src/sync/engine.ts` — 三态启动改造

核心变更：把当前"自动 subscribe + 一登录就 initialize + fullSync"的链路拆成三个显式阶段。

**当前行为（需要改）**：
- 模块顶层 `useAuthStore.subscribe` 监听 user 变化 → 登录时调 `initialize(userId)` → 立即 `fullSync`
- 登出时调 `shutdown()` → 清 `dirtyKeys`（RISK-1 源头）

**目标行为**：
- 移除模块顶层 `useAuthStore.subscribe` 自动连接
- 新增 `arm(userId: string)`：注册 repository 的 `setSyncNotify` / `online` / `offline` 监听器 / 30s 轮询 timer / Realtime 通道；**但不触发任何 push / pull / fullSync**
- 新增 `start()`：由 App 层在合并判定确认后显式调用；触发首次 `fullSync()`
- 改造 `shutdown()`：不再清 `dirtyKeys`（修正 RISK-1）；仅清监听器 + runtime 引用
- `markDirty` 保持不变；但内部加 guard：仅在 `status !== 'armed'` 时触发 push（armed 阶段任何写入进 queue 但不上传）

函数签名：

```typescript
interface SyncEngineState {
  status: SyncStatus;          // 'idle' | 'armed' | 'syncing' | 'synced' | 'offline' | 'error'
  retryCount: number;
  syncState: SyncState;
  arm: (userId: string) => void;
  start: () => Promise<void>;
  shutdown: () => void;
  markDirty: (key: DirtyKey) => void;
  fullSync: () => Promise<void>;
}
```

`SyncStatus` 新增 `'armed'`（对应 `src/sync/types.ts`）。

同时在 `src/sync/engine.ts` 模块顶层提前导出退避常量，供 Task 3.3 的 UI 判断复用；Task 3.5 再实现实际 retry timer：

```typescript
export const RETRY_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000] as const;
export const MAX_RETRY = RETRY_DELAYS_MS.length;
```

由 App 层负责调用顺序：

```
AuthStore.supabaseUser = X    →    engine.arm(X)
                                   合并判定 (runMergeFlow)
                                   完成后   →    engine.start()
AuthStore.supabaseUser = null →    engine.shutdown()
```

**App 层监听点**：在 `src/App.tsx` 的 `useEffect` 中 subscribe `useAuthStore`，按 user 变化执行 arm / start / shutdown，不在 engine 模块顶层做。

### `src/sync/local-progress.ts`（新文件）— 纯函数

```typescript
// src/sync/local-progress.ts
import type { GameProgress } from '@/types/gamification';

/**
 * 判定本地 GameProgress 是否包含"有效进度"。
 *
 * 用于首次登录合并判定：只有存在有效进度时才走合并对话框；
 * 无有效进度时走 auto-pull / auto-push 分支。
 *
 * 纯函数：相同输入保证相同输出；不依赖网络 / 时间 / 外部状态。
 *
 * 判定条件（满足任一即返回 true）：
 *   - totalQuestionsAttempted > 0
 *   - campaignProgress 任一 topic 有完成记录 (completedLevels.length > 0)
 *     或 campaignCompleted === true
 *   - advanceProgress 任一 topic 有进度 (heartsAccumulated > 0 或 sessionsPlayed > 0)
 *   - rankProgress.history.length > 0
 *   - rankProgress.activeSessionId 非空（保护未完成段位赛）
 *   - rankProgress.currentTier !== 'apprentice'
 *   - wrongQuestions.length > 0
 *
 * 空 rankProgress = { currentTier: 'apprentice', history: [] } 判 false。
 * 仅 nickname / avatarSeed 不算有效进度（它们不在 GameProgress 结构内）。
 */
export function hasMeaningfulLocalProgress(gp: GameProgress): boolean;
```

### `src/repository/local.ts` — 账号归属锁读写

已有：`getAuthUserIdKey()`、`KEYS.authUserId`。缺读写 helper，需新增：

```typescript
getAuthUserId(): string | null {
  return localStorage.getItem(KEYS.authUserId());
}

setAuthUserId(userId: string): void {
  localStorage.setItem(KEYS.authUserId(), userId);
}

clearAuthUserId(): void {
  localStorage.removeItem(KEYS.authUserId());
}

/**
 * 清空本地账号相关业务数据（不清 sync_state / auth_user_id / 开发沙盒）。
 * 仅由"归属冲突的账号切换"路径调用（见 phase3-01 场景 E）。
 */
clearAccountScopedData(): void {
  localStorage.removeItem(KEYS.user());
  localStorage.removeItem(KEYS.gameProgress());
  localStorage.removeItem(KEYS.history());
  localStorage.removeItem(KEYS.rankMatchSessions());
  localStorage.removeItem(KEYS.sessions());
}

/**
 * 用户已经明确确认放弃当前账号待同步变更后，清空同步队列。
 *
 * 仅由两条路径调用：
 *   1. SignOutConfirmDialog 的"仍然登出"
 *   2. AccountMismatchDialog 的"继续登录"前置清理
 *
 * 常规 `SyncEngine.shutdown()` 禁止调用它，避免重现 RISK-1。
 */
discardPendingSyncAfterUserConfirmation(): void {
  const current = read<SyncState>(KEYS.syncState());
  if (!current) return;
  write(KEYS.syncState(), { ...current, dirtyKeys: [] });
}
```

注意 `clearAccountScopedData` 不走 `clearAll`（后者会清 `mq_progress` legacy key 但逻辑更粗糙）；这里是精准的账号切换清理。

### `src/store/auth.ts` — signOut 前置校验

`signOut` 当前直接调 `supabase.auth.signOut()`。Phase 3 加前置校验：

```typescript
interface AuthState {
  // ... 现有字段 ...
  signOutGuarded: () => Promise<
    | { ok: true }
    | { ok: false; reason: 'dirty'; dirtyKeys: DirtyKey[] }
  >;
  /** 绕过校验强制登出（由 P4 对话框的"仍然登出"按钮调用） */
  signOutForce: () => Promise<void>;
}
```

`signOutGuarded()`：
1. 读 `useSyncEngine.getState().syncState.dirtyKeys`
2. 非空 → 返回 `{ ok: false, reason: 'dirty', dirtyKeys }`
3. 空 → 调 `signOutForce()` 返回 `{ ok: true }`

`signOutForce()`：原 `signOut` 逻辑，不做校验直接登出。

UI 层（Profile 的 `AccountSection` 登出按钮）调 `signOutGuarded`；`ok: false` 时弹 P4 的"登出确认对话框"，用户选"仍然登出"则调 `discardPendingSyncAfterUserConfirmation()` 后再 `signOutForce()`。这一步表达的是用户确认放弃当前账号的待同步队列，不改变 `shutdown()` 的通用行为。

### `src/App.tsx` — 合并编排

新增 `useEffect` 监听 `useAuthStore.supabaseUser` 变化：

```typescript
useEffect(() => {
  const unsubscribe = useAuthStore.subscribe((state, prev) => {
    const nextId = state.supabaseUser?.id ?? null;
    const prevId = prev.supabaseUser?.id ?? null;
    if (nextId === prevId) return;

    if (nextId) {
      // 登录
      useSyncEngine.getState().arm(nextId);
      void runMergeFlow(nextId);  // 异步；完成后内部调 engine.start()
    } else {
      // 登出
      useSyncEngine.getState().shutdown();
    }
  });
  return unsubscribe;
}, []);
```

`runMergeFlow(userId)` 是新的 orchestrator 函数（位置：`src/App.tsx` 同文件内 helper，或新建 `src/sync/merge-flow.ts`）：

```
1. const localAuthId = repository.getAuthUserId()
2. if (localAuthId && localAuthId !== userId) → 打开 AccountMismatchDialog（场景 E）
3. if (localAuthId === userId) → 熟路径，直接 engine.start() 返回
4. // localAuthId 为空（首次登录或 logout 过一次）
5. const localGP = repository.getGameProgress(repository.getUser()?.id ?? '')
6. const hasLocal = hasMeaningfulLocalProgress(localGP)
7. 打开 MergeGuideDialog，内部按 hasLocal + 远端状态决定路径
8. 对话框结束（merge / discard / auto-* 成功）→ engine.start()
9. 对话框取消登录 → engine.shutdown() + supabase.auth.signOut()
```

### `src/components/MergeGuideDialog.tsx` — 重写

Phase 3 文档 `implementation-plan.md` 原稿的 MergeGuideDialog 逻辑散在对话框组件内，耦合 repository 和远端调用。Phase 3 改写为"纯 UI + 接收 orchestrator 注入的状态和回调"：

```tsx
type MergeDialogStep =
  | 'loading'            // decide 中
  | 'wait-user-choice'   // 两端都有，等用户选
  | 'auto-pulling'
  | 'auto-pushing'
  | 'merging'
  | 'discarding'
  | 'merge-error'        // 合并失败
  | 'discard-error'      // 拉取失败
  | 'offline-waiting'    // 离线 + 首次登录无法判定
  | 'success';

interface Props {
  step: MergeDialogStep;
  onConfirmMerge: () => void;        // [合并到云端]
  onConfirmDiscard: () => void;      // [使用云端]
  onRetry: () => void;
  onSwitch: () => void;              // 换方向（merge-error → discard / discard-error → merge）
  onCancelLogin: () => void;         // 取消登录 → signOut
}
```

UI 文案按 P3 / P2 决策：
- 两端都有：标题"发现本地进度"，副本"你的设备上有练习进度，云端账号也有进度"；按钮"合并到云端" / "使用云端"；无"稍后再说"
- merge-error：标题"合并失败"，副本"网络异常，已保留本地数据"；三个按钮"重试合并" / "改用云端数据" / "取消登录"
- discard-error：标题"拉取云端失败"，副本"暂未获取到云端数据"；三个按钮"重试" / "合并本地进度" / "取消登录"
- offline-waiting：标题"首次登录需要网络"，副本"完成一次同步后即可离线使用"；两个按钮"重试" / "取消登录"
- auto-pulling / auto-pushing / merging / discarding：居中 loader + 说明文字；**不可关闭**

现有 `Dialog.tsx` 默认支持 ESC 和点击遮罩关闭。`MergeGuideDialog` / `AccountMismatchDialog` 必须显式阻止这两种退出方式：优先给 `Dialog` 增加 `dismissible={false}`；若不改 `Dialog` API，则传入 no-op `onClose={() => {}}` 并在组件测试里覆盖 ESC / 遮罩点击。

### `src/components/AccountMismatchDialog.tsx`（新文件）— 归属冲突

专用对话框，覆盖场景 E。不复用 `MergeGuideDialog`——两者语义差别大（这里是"警告会清本地数据"，不是"合并 / 取舍"）。

```tsx
interface Props {
  currentLocalAuthId: string;       // 本地记录的旧账号 id（展示用）
  incomingUserId: string;           // 新登录的账号 id
  onProceed: () => void;            // "继续登录 B"
  onCancelLogin: () => void;        // "取消登录"
}
```

文案：
- 标题：「本设备已绑定另一个账号」
- 副本：「本设备当前保存的进度属于另一个账号。登录 {B邮箱} 将只加载该账号的云端数据，本地现有进度不会迁移到新账号。」
- 按钮：[继续登录] / [取消登录]

---

## 实施步骤（checkbox 追踪）

### Task 3.0（启动前技术收口）

- [ ] **Step 1**：`src/sync/types.ts` 给 `SyncStatus` 加 `'armed'`；`src/sync/engine.ts` 提前导出 `RETRY_DELAYS_MS` / `MAX_RETRY` 常量（Task 3.5 再实现 retry 行为）
- [ ] **Step 2**：`src/sync/local-progress.ts` 新建纯函数 + 同目录 `local-progress.test.ts` 覆盖七条判定条件各独立用例 + 边界用例（全空、仅 activeSessionId、仅 apprentice + 空 history）
- [ ] **Step 3**：`src/repository/local.ts` 新增 `getAuthUserId / setAuthUserId / clearAuthUserId / clearAccountScopedData / discardPendingSyncAfterUserConfirmation`；补 `repository.test.ts` 对应用例
- [ ] **Step 4**：`src/sync/engine.ts` 改造：
  - 移除模块顶层 `useAuthStore.subscribe`
  - 新增 `arm(userId)`：注册监听、Realtime 通道、30s 轮询；不触发 fullSync；`set({ status: 'armed' })`
  - 新增 `start()`：`set({ status: isOnline() ? 'syncing' : 'offline' })` → 调 `fullSync()` → 完成后跟随 `fullSync` 的终态
  - `shutdown()` 只清 runtime（不清 dirtyKeys）
  - `markDirty`：当 `status === 'armed'` 时仅入 dirtyKeys 不触发 push
- [ ] **Step 5**：`src/sync/engine.test.ts` 补 arm/start/shutdown 三态流转用例：
  - arm 后不应调用任何 remote.ts 函数（mock `fetch*` 断言 0 调用）
  - arm → start 应触发 fullSync
  - shutdown 后再 arm 应能正常启动
  - RISK-1：shutdown 不清 dirtyKeys
- [ ] **Step 6**：`src/store/auth.ts` 新增 `signOutGuarded / signOutForce`；保留旧 `signOut` 调用点但内部改为 `signOutGuarded` 代理（向后兼容），或集中迁移所有调用点到新方法（建议后者，范围可控）；强制登出路径在用户确认后清空待同步队列
- [ ] **Step 7**：`npm test` / `npm run build` 通过后 commit：`feat(v0.3): SyncEngine 改为 arm/start/shutdown 三态启动 + 账号归属锁 helper`

### Task 3.2（首次登录合并）

- [ ] **Step 8**：`src/components/MergeGuideDialog.tsx` 按新 Props 结构重写（参考 `Dialog.tsx` 现有样式规范）
- [ ] **Step 9**：`src/components/AccountMismatchDialog.tsx` 新建；"继续登录"路径必须先 `discardPendingSyncAfterUserConfirmation()`，再 `clearAccountScopedData()`
- [ ] **Step 10**：`src/sync/merge-flow.ts` 新建 orchestrator：
  - `runMergeFlow(userId, { onShowMerge, onShowMismatch, onCancelLogin })`
  - 内部调 repository / remote.ts / merge.ts；对话框的 state 由调用方（App.tsx）管理
  - 失败路径全部走 P3 的 15s 超时（T7）：`Promise.race([fetch(...), delay(15_000).then(() => { throw new Error('timeout'); })])`
- [ ] **Step 11**：`src/App.tsx` 新增 `useEffect` 订阅 auth 变化，按 §App.tsx 合并编排伪码实现；对话框的 state 用 local useState
- [ ] **Step 12**：合并完成后的收尾：
  - `repository.setAuthUserId(userId)`
  - 把本地 `User.id` / `GameProgress.userId` 改写为 Supabase uid（保持历史逻辑：Phase 3 原草案 L1558~L1569 的 finishMerge 精神）
  - 调 `engine.start()`
- [ ] **Step 13**：`src/sync/merge-flow.test.ts` 覆盖四场景（A/B/C/D）+ 归属冲突（E）+ 离线首次登录（F 的 offline-waiting）
- [ ] **Step 14**：`src/App.tsx` 手动回归：访客模式、场景 A-F 全流程；对话框失败态三按钮可达
- [ ] **Step 15**：`npm test` / `npm run build` 通过后 commit：`feat(v0.3): 首次登录合并引导 + 账号归属冲突保护`

---

## 测试计划

### 单测新增

| 文件 | 覆盖点 | 期望用例数 |
|---|---|---|
| `src/sync/local-progress.test.ts` | 七条判定条件各独立 + 空 GameProgress + 全字段用满 | ~10 |
| `src/sync/engine.test.ts` 增补 | arm/start/shutdown 流转 + armed 状态 markDirty 行为 + shutdown 不清 dirtyKeys | ~6 |
| `src/sync/merge-flow.test.ts` | 六场景 A-F + 超时 + 归属冲突 proceed/cancel | ~12 |
| `src/store/auth.test.ts` 增补 | signOutGuarded 脏数据拦截 + signOutForce 绕过 | ~3 |
| `src/repository/local.test.ts` 增补 | authUserId 读写 + clearAccountScopedData 范围 | ~3 |

### 集成测试

不新增测试文件；由上述单测 + 手动回归覆盖。

### 手动回归清单

- [ ] 访客模式不被任何新逻辑干扰
- [ ] 场景 A（全新账号）：Magic Link 回来后直接进 Home，无对话框
- [ ] 场景 B（访客有进度 + 新账号）：Magic Link 回来短暂 loading 后进 Home，本地进度完整保留
- [ ] 场景 C（换设备登老账号）：Magic Link 回来短暂 loading 后进 Home，云端数据已到本地
- [ ] 场景 D（两端都有）：Magic Link 回来弹合并对话框；点"合并到云端"后进 Home
- [ ] 场景 D（两端都有）→ 点"使用云端"：本地访客数据被覆盖为云端数据
- [ ] 场景 D（两端都有）→ 模拟网络失败：对话框进入错误态，三按钮可点，"取消登录"回访客模式
- [ ] 场景 E（归属冲突）：A 登出后登 B，弹归属冲突对话框；"继续登录"后本地 A 数据被清、B 数据从云端到本地；"取消登录"回访客
- [ ] 场景 F（离线首次登录）：断网登录，弹 offline-waiting 对话框；恢复网络后自动重试进入合并判定

---

## Task 收尾条件

- [ ] Task 3.0 所有 Step 完成 + commit
- [ ] Task 3.2 所有 Step 完成 + commit
- [ ] 单测通过数较 Phase 2 基线 +30 以上
- [ ] 手动回归清单全部通过
- [ ] RISK-1（shutdown 清 dirtyKeys）的修复写入 commit message

---

## 相关文件一览

**新增**：
- `src/sync/local-progress.ts` + `.test.ts`
- `src/sync/merge-flow.ts` + `.test.ts`
- `src/components/AccountMismatchDialog.tsx`

**修改**：
- `src/sync/types.ts`（新增 `armed` 状态）
- `src/sync/engine.ts`（三态改造 + RISK-1 修复）
- `src/sync/engine.test.ts`（补用例）
- `src/store/auth.ts`（signOutGuarded / signOutForce）
- `src/store/auth.test.ts`（补用例）
- `src/repository/local.ts`（authUserId helper + clearAccountScopedData）
- `src/repository/local.test.ts`（补用例）
- `src/App.tsx`（合并编排 useEffect）
- `src/components/MergeGuideDialog.tsx`（Phase 3 草案版本 → 新 Props 结构重写）

**不改动**：
- `src/sync/merge.ts`（Phase 2 已稳定；Task 3.5 会补对称用例但不改函数体）
- `src/sync/remote.ts`（Phase 2 已稳定）
