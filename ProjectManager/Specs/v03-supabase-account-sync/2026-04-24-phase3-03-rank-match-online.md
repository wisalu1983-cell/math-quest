# Phase 3 · Task 3.4 · 段位赛联网 + 自动 suspend + 跨设备接管

> 属于：v0.3 Phase 3
> 总览：[`00-index`](./2026-04-24-phase3-00-index.md)
> 产品规则：[`Plan/v0.3/phases/phase-3.md`](../../Plan/v0.3/phases/phase-3.md#预研收口结论) · 段位赛联网
> 关键决策：P1（方案 C · 10 分钟阈值）、P5（status 表达生命周期，不做物理删除）、T6（B 设备直接继续写入，无需改 status）
> 前置任务：[`01-startup-and-merge`](./2026-04-24-phase3-01-startup-and-merge.md)

---

## 目标

1. **段位赛入口联网门控**：段位赛要求联网，离线时入口禁用且文案明确
2. **方案 C · 自动 suspend**：离开 Practice 页（用户未完成当前 BO）即自动 `suspendActiveMatch()`，把异常离开与主动中断拉平成统一语义
3. **方案 C · 10 分钟跨设备接管**：B 设备看到远端 `active + updated_at > 10min` 时视为可接管，直接本地继续打，通过 `mergeRankMatchSessions` 覆盖回云端
4. **闭环 RISK-1 的段位赛部分**：登出前校验段位赛相关 dirtyKeys（由 Task 3.0 的 `signOutGuarded` 复用）
5. **闭环 RISK-2**：核实 `deleteRankMatchSession` 无产品路径调用者；补 doc comment 约束未来调用者；本 Phase 不实现 soft-delete

---

## 关键规则（不可违反）

1. **段位赛发起动作的联网判定只看 `navigator.onLine`**，不依赖 `SyncEngine.status`——用户可能已登录但 `syncing` 中，此时段位赛应允许进入（只要联网）。覆盖：开始新系列、系列内下一局、10 分钟接管后的下一局、放弃后重开
2. **`status` 是段位赛生命周期的唯一真相**：`active` / `suspended` / `cancelled` / `completed`；云端历史数据只追加，不做物理删除
3. **自动 suspend 只对 `status === 'active'` 且非 `outcome` 已定的 session 生效**；对已 `suspended` / `cancelled` / `completed` 的 session 不做操作
4. **跨设备接管是"合并继续"而不是"废旧开新"**：本地继续打 → 写入本地 → 下一次 push 覆盖云端。不要把远端旧 active 强制标 cancelled
5. **已登录但云端 `active + 新鲜（<10 min）+ 本地无 activeSessionId`** 时，本地不得自动把它当成可接管的对局——意味着另一台设备正在打，应提示用户"有一台设备正在进行中"
6. **`deleteRankMatchSession` 只能由 dev-tool / 单测调用**：doc comment 明确声明；产品代码不允许调用

---

## 数据流与状态机

### 段位赛 session 状态扩展视角

`RankMatchSession.status` 已有四态：`active / suspended / cancelled / completed`。配合 `updated_at`（Supabase 行级时间戳）可派生出 Phase 3 的接管逻辑：

```
云端状态 × updated_at 时效 ─▶ 本地 B 设备看到后的处理

active + updated_at ≤ 10 min ─▶ "另一台设备正在进行中"
  （不可接管；用户明确点"放弃"才清除）

active + updated_at > 10 min  ─▶ 可接管：本地继续打
  （后续写入通过 mergeRankMatchSessions 覆盖回云端）

suspended                      ─▶ 可接管：reactivateSuspendedMatch 正常流程
  （Phase 2 已支持）

cancelled / completed          ─▶ 不可再打，仅历史展示
```

### 关键动作：B 设备接管

```
A 设备：开始打 bo rookie → 断电 / 关页（没主动 suspend）
         ↓（这里原本会因为 "beforeunload 没触发自动 suspend" 而留在 active）
         （Phase 3 加了自动 suspend hook，但"断电"场景仍可能保留 active）

云端：rank_match_sessions 行 updated_at = T, status = active, games = [g1 finished win]

B 设备打开 app → engine.fullSync 拉取 → 本地 rankMatchSessions 包含这条
  ↓
  用户从 Home 点进段位赛 hub
  ↓
  Hub 看到 activeRankSession（本地 gameProgress.rankProgress.activeSessionId）
  ↓
  Hub 加 takeover 判定：activeSessionId 对应的 session，如果：
    - status === 'active'
    - Date.now() - updatedAt > 10 * 60 * 1000
    → 可接管（按 suspended 视同处理：展示"继续第 N 局"按钮）

  反之：
    - status === 'active' + 时间 < 10 min
    → 展示"另一台设备正在进行中"信息；按钮 disabled；提供"等待 ＼ 放弃"选项
```

### 自动 suspend 数据流

```
用户在 Practice 页（rank-match session active）
  ↓
任何方式离开 Practice（setPage 改变、关页 beforeunload、路由返回）
  ↓
Practice.tsx 组件 useEffect cleanup + beforeunload handler 都会触发：
  if (session.sessionMode === 'rank-match' && !sessionEndedNormally) {
    useSessionStore.getState().suspendRankMatchSession();  // 已存在，抽到 cleanup
  }
  ↓
suspendRankMatchSession 内部：
  - repository.saveSession(practiceSession)  // 保存当前答题进度
  - useRankMatchStore.getState().suspendActiveMatch()  // 把 RankMatchSession.status 改 suspended
  ↓
markDirty('rank_match_sessions')（由 repository.setRankMatchSession 内部已触发）
  ↓
SyncEngine 定时 flush → push 到云端
```

---

## 模块改造点

### `src/sync/merge.ts` — 不需要改

现有的 `mergeRankMatchSessions` 已经按 `STATUS_PRIORITY` + `games.length` + `updated_at` 三级优先级合并。B 设备接管后写入的新 session 会因 games 更长 + updated_at 更新而胜出。

确认：`STATUS_PRIORITY = { completed: 3, cancelled: 2, suspended: 1, active: 0 }`。两端都 active 时落到 games 更长者。符合 T6 的设计。

### `src/pages/Practice.tsx` — 自动 suspend

**当前行为**：L165-169 仅"用户点退出确认对话框"走 `suspendRankMatchSession`。

**目标**：在任何方式离开 Practice 时触发 suspend，覆盖：
- setPage 被改到别的页面
- 关闭 tab / 刷新（beforeunload）
- 系统级 app 退后台（pagehide）

**实现**：

```tsx
import { useEffect, useRef } from 'react';

// 在 Practice 组件内：
const sessionEndedRef = useRef(false);  // 标记是否"正常结束"（答完 / 用户确认退出 / 用户确认重开）

// 在 session 正常结束的地方（BO 胜负已分、用户确认退出、用户确认重开）设置：
// sessionEndedRef.current = true;
// 具体打点位置：
//   - handleQuitConfirm（已有）→ suspendRankMatchSession 已调用，打 sessionEndedRef.current = true
//   - handleRestartRankMatch → cancelRankMatchSession 已调用，打 true
//   - session 完成进入 rank-match-result 页前 → true
//   - 非段位赛模式：打 true（不需要自动 suspend）

useEffect(() => {
  return () => {
    // 组件卸载：只要不是"正常结束"，且当前是活跃段位赛 session，自动 suspend
    const { session } = useSessionStore.getState();
    if (
      !sessionEndedRef.current &&
      session?.sessionMode === 'rank-match' &&
      session.endedAt == null
    ) {
      useSessionStore.getState().suspendRankMatchSession();
    }
  };
}, []);

useEffect(() => {
  const onBeforeUnload = () => {
    const { session } = useSessionStore.getState();
    if (
      !sessionEndedRef.current &&
      session?.sessionMode === 'rank-match' &&
      session.endedAt == null
    ) {
      useSessionStore.getState().suspendRankMatchSession();
    }
  };
  const onPageHide = () => onBeforeUnload();
  window.addEventListener('beforeunload', onBeforeUnload);
  window.addEventListener('pagehide', onPageHide);
  return () => {
    window.removeEventListener('beforeunload', onBeforeUnload);
    window.removeEventListener('pagehide', onPageHide);
  };
}, []);
```

注意事项：
- `beforeunload` 在部分移动端浏览器不可靠，但 `pagehide` + useEffect cleanup 足够兜底绝大多数情况
- iOS Safari 关应用时 `pagehide` 可能只有约 100ms 的同步写入窗口——`suspendRankMatchSession` 内部都是同步 localStorage 写入，满足
- 不做异步网络调用（push 依赖后台 SyncEngine）

### `src/store/rank-match.ts` — 无需改

`suspendActiveMatch` 已存在，行为满足。

### `src/pages/RankMatchHub.tsx` — 接管判定 + 联网门控

**当前行为**：看到 `activeRankSession` 就展示"继续第 N 局" / "继续当前对局"按钮。未考虑"云端可能另一台设备还在进行"。

**目标变更**：

1) 入口列表（未有 activeRankSession 时）——联网门控：

```tsx
const online = useOnlineStatus();  // 新 hook：监听 navigator.onLine + online/offline events

// 在 handleStartChallenge 之前加门控：
function handleStartChallenge(tier: Exclude<RankTier, 'apprentice'>) {
  if (!online) {
    setErrorMsg('段位赛需要联网才能进行');
    return;
  }
  // ...原逻辑
}
```

UI 层面：离线时"挑战"按钮 disabled，下方展示"段位赛需要联网才能进行"副文案：

```tsx
{!online && (
  <div className="mb-4 p-3 bg-warning-lt rounded-xl border border-warning/30 text-[13px] text-warning font-semibold">
    当前离线，段位赛需要联网才能进行。恢复网络后可开始挑战。
  </div>
)}
// 挑战按钮：
<button disabled={!unlocked || !online} ...>挑战</button>
```

2) 活跃赛事视图（有 activeRankSession 时）——先复用联网门控，再加"另一台设备正在进行"判定：

所有会新建或推进段位赛局的按钮都要受 `online` 门控：
- 本机 active 且局间：`startRankMatchGame(activeRankSession.id, nextIdx)`
- stale active 接管且局间：`handleTakeoverMatch()` 内部的 `startRankMatchGame`
- 放弃重开：`handleRestartMatch()` 内部的 `startRankMatch` + `startRankMatchGame`

继续未完成 PracticeSession（`resumeRankMatchGame`）不强制联网；局中断网时当前局继续，本地完成后交给 SyncEngine 恢复联网后推送。

```tsx
const TAKEOVER_THRESHOLD_MS = 10 * 60 * 1000;

const isAnotherDeviceActive =
  activeRankSession.status === 'active' &&
  Date.now() - activeRankSession.updatedAt <= TAKEOVER_THRESHOLD_MS &&
  !wasStartedByThisDevice(activeRankSession);
  // wasStartedByThisDevice：新 helper，见下
```

`wasStartedByThisDevice` 如何判定：
- 方案 A（推荐）：`src/sync/engine.ts` 在 `arm(userId)` 时生成一个 session-scoped `deviceId`（nanoid，仅内存，不写 localStorage）；`startRankMatch` 写入 session 时把 `deviceId` 塞进 session 的自定义字段（不在 RankMatchSession 接口上——用 repository 层的内存映射 `Set<sessionId>` 记录"本 session 起到的 sessionId"）
- 方案 B（最小化）：不引入 deviceId；改为"本地 rankMatchSessions 里 session.updatedAt 与 rankProgress.activeSessionId 被本设备写入的时间一致"。但这需要额外记录"本设备最后写入时间"，复杂
- 方案 C（折中）：直接拿**本地 gameProgress.rankProgress.activeSessionId 是否来自于本次应用启动周期的 `startRankMatch` 调用**来判定。即 `rankMatchStore` 加一个内存 state `startedInThisSession: Set<string>`

采用**方案 C**（最简单且足够）：

```typescript
// src/store/rank-match.ts 添加内存 state：
startedInThisSession: new Set<string>(),  // 仅内存，页面刷新即清

// startRankMatch 内部：
state.startedInThisSession.add(newSession.id);

// reactivateSuspendedMatch 内部：
state.startedInThisSession.add(reactivatedSession.id);
```

Hub 判定：

```tsx
const startedInThisSession = useRankMatchStore(s => s.startedInThisSession);
const isAnotherDeviceActive =
  activeRankSession.status === 'active' &&
  !startedInThisSession.has(activeRankSession.id) &&
  Date.now() - activeRankSession.updatedAt <= TAKEOVER_THRESHOLD_MS;

const isStaleActiveTakeoverable =
  activeRankSession.status === 'active' &&
  !startedInThisSession.has(activeRankSession.id) &&
  Date.now() - activeRankSession.updatedAt > TAKEOVER_THRESHOLD_MS;
```

UI：

```tsx
{isAnotherDeviceActive ? (
  // 另一台设备正在进行中
  <div className="flex flex-col gap-3">
    <p className="text-[13px] text-text-2">
      检测到你有一台设备正在进行此挑战。{' '}
      {TAKEOVER_MINUTES_LEFT(activeRankSession.updatedAt)} 后可在本设备接管继续。
    </p>
    <button
      onClick={() => setShowAbandonConfirm(true)}
      className="w-full btn-secondary rounded-2xl text-center"
    >
      放弃这局挑战
    </button>
  </div>
) : isStaleActiveTakeoverable ? (
  // 10 分钟无响应，可接管
  <div className="flex flex-col gap-3">
    <p className="text-[13px] text-text-2">
      这场挑战在另一台设备上超过 10 分钟无响应，本设备可接管继续。
    </p>
    <button
      onClick={handleTakeoverMatch}
      className="w-full btn-flat rounded-2xl text-center"
    >
      继续第 {currentIdx ?? '下一'} 局
    </button>
    <button
      onClick={() => setShowRestartConfirm(true)}
      className="w-full btn-secondary rounded-2xl text-center"
    >
      放弃，重新开始
    </button>
  </div>
) : activeRankSession.status === 'suspended' ? (
  // 已有逻辑：可继续
) : (
  // 已有逻辑：本机起的 active，展示"继续第 N 局"
)}
```

`handleTakeoverMatch`：

```tsx
function handleTakeoverMatch() {
  const { resumeRankMatchGame } = useSessionStore.getState();
  // 不需要 reactivateSuspendedMatch（session 本来就是 active）
  // 直接找到未完成的 game，进 Practice；进了 Practice 会触发 markDirty，推远端覆盖
  const currentIdx = getCurrentGameIndex(activeRankSession);
  if (currentIdx !== undefined) {
    const targetGame = activeRankSession.games.find(g => g.gameIndex === currentIdx);
    if (targetGame) {
      resumeRankMatchGame(targetGame.practiceSessionId);
      useRankMatchStore.getState().markAsStartedInThisSession(activeRankSession.id);
      setPage('practice');
      return;
    }
  }
  // 局间：开始下一局
  if (!online) {
    setErrorMsg('段位赛需要联网才能开始下一局');
    return;
  }
  const nextIdx = activeRankSession.games.length + 1;
  useSessionStore.getState().startRankMatchGame(activeRankSession.id, nextIdx);
  useRankMatchStore.getState().markAsStartedInThisSession(activeRankSession.id);
  setPage('practice');
}
```

"放弃这局挑战"按钮（用于 `isAnotherDeviceActive`）：调 `cancelActiveMatch()` 将本地 session 标为 cancelled，会 push 到云端。另一台设备下次同步就会看到 cancelled，出现在历史而非 active。

### `src/hooks/useOnlineStatus.ts`（新文件）

```typescript
import { useEffect, useState } from 'react';

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(
    typeof window === 'undefined' ? true : navigator.onLine
  );
  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);
  return online;
}
```

小组件用 hook 比 Zustand 更轻量；SyncEngine 本身已有监听，但那是 engine 内部用。

### `src/store/rank-match.ts` — 新增 `startedInThisSession`

```typescript
interface RankMatchState {
  // ...现有字段...
  startedInThisSession: Set<string>;
  markAsStartedInThisSession: (sessionId: string) => void;
}

startedInThisSession: new Set<string>(),
markAsStartedInThisSession: (sessionId) =>
  set(state => {
    const next = new Set(state.startedInThisSession);
    next.add(sessionId);
    return { startedInThisSession: next };
  }),

// startRankMatch 末尾：
state.markAsStartedInThisSession(newSession.id);  // 或直接操作 set

// reactivateSuspendedMatch 末尾：
state.markAsStartedInThisSession(reactivatedSession.id);
```

### `src/repository/local.ts` — RISK-2 doc comment

给 `deleteRankMatchSession` 加 JSDoc：

```typescript
/**
 * 物理删除一条段位赛 session。
 *
 * **仅供 dev-tool 和单测调用**。产品路径不允许调用——段位赛生命周期由
 * `RankMatchSession.status`（active / suspended / cancelled / completed）表达，
 * 不做跨端物理删除。
 *
 * 本方法不触发 SyncEngine.markDirty，因此本地删除**不会**同步到云端。
 * 只要调用方遵守"仅 dev-tool / 单测"约束，这一行为就是正确的
 * （dev-tool 清理本地沙盒时，云端数据不应该受影响）。
 *
 * 相关决策：Phase 3 RISK-2（已降级关闭），见 Specs/v03-supabase-account-sync/2026-04-24-phase3-00-index.md。
 */
deleteRankMatchSession(id: string): void {
  // ...现有实现
}
```

此外：**Phase 3 代码 review 阶段**需要在 `npm run lint` 或手动检查中确认"没有新的产品路径调用者"。可选：加一个简单的 ESLint 规则或 codeowners 约束——但 v0.3 暂不引入 lint 规则，靠 doc comment + review 即可。

---

## 实施步骤

- [ ] **Step 1**：`src/hooks/useOnlineStatus.ts` + 简单 test（2 用例）
- [ ] **Step 2**：`src/store/rank-match.ts` 新增 `startedInThisSession` + `markAsStartedInThisSession`；`startRankMatch` / `reactivateSuspendedMatch` 末尾标记；补测试
- [ ] **Step 3**：`src/pages/Practice.tsx` 加组件卸载 + beforeunload + pagehide 的自动 suspend；用 `sessionEndedRef` 区分正常结束与异常离开
- [ ] **Step 4**：`src/pages/RankMatchHub.tsx` 加联网门控 + takeover 三态判定 UI
- [ ] **Step 5**：`src/repository/local.ts` `deleteRankMatchSession` 加 doc comment
- [ ] **Step 6**：新增测试：
  - `src/pages/Practice.test.tsx` 或 `src/store/index.rank-match-lifecycle.test.ts` 中补"unmount 时自动 suspend"用例
  - `src/store/rank-match.test.ts` 补 `startedInThisSession` 行为用例
  - `src/pages/RankMatchHub.test.tsx` 新增：`isAnotherDeviceActive` / `isStaleActiveTakeoverable` / 离线门控三路径
- [ ] **Step 7**：手动回归：
  - 打一局段位赛到第 1 局结束 → 直接返回 Home（不点退出确认）→ Hub 看到"中断中的挑战"，可继续（=自动 suspend 生效）
  - 打一局段位赛到第 1 局结束 → 刷新页面 → 仍可继续（=pagehide / unload 生效）
  - 构造"另一台设备 active + 时间 < 10 min"（通过 dev-tool 设置 updatedAt）→ Hub 显示"另一台设备正在进行中" + 按钮 disabled
  - 构造"另一台设备 active + 时间 > 10 min"→ Hub 显示"继续第 N 局"可接管
  - 断网 → 段位赛入口 disabled + 提示"段位赛需要联网"
  - 段位赛完成一局后断网进 Profile 点登出 → SignOutConfirmDialog 展示 "段位赛记录" 在未同步列表里（验证 RISK-1 段位赛视角）
- [ ] **Step 8**：commit `feat(v0.3): 段位赛联网门控 + 离开 Practice 自动 suspend + 10 分钟跨设备接管`

---

## 测试计划

### 单测新增

| 文件 | 覆盖点 | 期望用例数 |
|---|---|---|
| `src/hooks/useOnlineStatus.test.ts` | 初始 online / 响应 offline 事件 / 响应 online 事件 | 3 |
| `src/store/rank-match.test.ts` 增补 | `startedInThisSession` 在 startRankMatch / reactivateSuspendedMatch 时标记 | 2 |
| `src/store/index.rank-match-lifecycle.test.ts` 增补 | Practice unmount 时自动 suspend + 正常结束不重复 suspend | 3 |
| `src/pages/RankMatchHub.test.tsx`（新建） | 离线态按钮 disabled + takeover 三路径 UI | 6 |

### 手动回归

见 Step 7。

---

## Task 收尾条件

- [ ] 所有 Step 完成 + commit
- [ ] 新增单测通过；整体 test count +14 左右
- [ ] 手动回归通过
- [ ] RISK-2 doc comment 已写入代码

---

## 相关文件一览

**新增**：
- `src/hooks/useOnlineStatus.ts` + `.test.ts`
- `src/pages/RankMatchHub.test.tsx`

**修改**：
- `src/store/rank-match.ts`（startedInThisSession）
- `src/store/rank-match.test.ts`（补用例）
- `src/pages/Practice.tsx`（自动 suspend hooks）
- `src/pages/RankMatchHub.tsx`（联网门控 + takeover 判定）
- `src/repository/local.ts`（deleteRankMatchSession doc comment）
- `src/store/index.rank-match-lifecycle.test.ts`（补 unmount 用例）

**不改动**：
- `src/sync/merge.ts`（mergeRankMatchSessions 无需改）
- `src/types/gamification.ts`（RankMatchSession 已有 status / updatedAt）
- `src/store/index.ts`（suspendRankMatchSession 已有）
