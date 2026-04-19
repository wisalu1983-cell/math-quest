# Phase 3 段位赛恢复与中断语义 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复 `ISSUE-064` 的局内刷新恢复，同时落地“中断并保存 / 放弃，重新开始”的双恢复语义，并让数据模型兼容后续本地存档与账号系统。

**Architecture:** 在 `RankMatchSession` 上引入正式的生命周期状态，区分 `active / suspended / completed / cancelled`。启动期恢复从 `Practice.tsx` 上提到 `App.tsx`，由纯函数恢复策略决定“自动进 Practice、停在 Home、还是回 Hub”。主动中断与放弃重开通过 store 显式动作实现，不再复用当前语义模糊的 `abandonSession()`。

**Tech Stack:** React 19、Zustand、TypeScript、Vitest、Playwright、localStorage repository

---

### Task 1: 生命周期状态模型与持久化归一化

**Files:**
- Create: `src/engine/rank-match/recovery-policy.test.ts`
- Modify: `src/types/gamification.ts`
- Modify: `src/types/index.ts`
- Modify: `src/engine/rank-match/match-state.ts`
- Modify: `src/engine/rank-match/match-state.test.ts`
- Modify: `src/repository/local.ts`
- Modify: `src/repository/local.test.ts`

**Step 1: Write the failing test**

先写最小红灯，覆盖三个事实：

```ts
it('新创建的 RankMatchSession 默认 status=active', () => {
  const session = createRankMatchSession(/* ... */);
  expect(session.status).toBe('active');
});

it('onGameFinished 产出 promoted/eliminated 时写成 completed', () => {
  const { session } = onGameFinished(/* ... */);
  expect(session.status).toBe('completed');
});

it('旧 mq_rank_match_sessions 缺 status 时，read-time 归一化为 active 或 completed', () => {
  localStorage.setItem('mq_rank_match_sessions', JSON.stringify({
    s1: { id: 's1', outcome: undefined, games: [], /* ...legacy */ },
    s2: { id: 's2', outcome: 'promoted', games: [], /* ...legacy */ },
  }));

  const all = repository.getRankMatchSessions();
  expect(all.s1.status).toBe('active');
  expect(all.s2.status).toBe('completed');
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/engine/rank-match/match-state.test.ts src/repository/local.test.ts
```

Expected:
- `status` 字段不存在导致断言失败
- 旧存档读回后没有 `status`

**Step 3: Write minimal implementation**

只做最小模型升级，不在此任务里碰 UI：

```ts
export type RankMatchSessionStatus =
  | 'active'
  | 'suspended'
  | 'completed'
  | 'cancelled';

export interface RankMatchSession {
  // ...
  status: RankMatchSessionStatus;
  suspendedAt?: number;
  cancelledAt?: number;
}
```

实现细节：

1. `createRankMatchSession()` 生成新会话时写入 `status: 'active'`
2. `onGameFinished()` 产生 `promoted` 或 `eliminated` 时，把最终 session 写成：

```ts
{ ...session, games, status: 'completed', outcome: 'promoted', endedAt: now }
```

3. `repository.getRankMatchSessions()` 增加读时归一化：

```ts
function normalizeRankMatchSession(raw: RankMatchSession): RankMatchSession {
  if (raw.status) return raw;
  return {
    ...raw,
    status: raw.outcome ? 'completed' : 'active',
  };
}
```

4. 若归一化后内容发生变化，立即回写 `mq_rank_match_sessions`，让旧数据只迁一次
5. `src/types/index.ts` 重导出 `RankMatchSessionStatus`

**Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run src/engine/rank-match/match-state.test.ts src/repository/local.test.ts
```

Expected:
- PASS
- 不引入 `CURRENT_VERSION` 的全局重构
- 旧 session 在 read-time 被补齐 `status`

**Step 5: Commit**

仅当用户明确要求提交时执行：

```bash
git add src/types/gamification.ts src/types/index.ts src/engine/rank-match/match-state.ts src/engine/rank-match/match-state.test.ts src/repository/local.ts src/repository/local.test.ts
git commit -m "为段位赛会话补齐生命周期状态模型"
```

---

### Task 2: Store 层显式支持中断、恢复和取消

**Files:**
- Create: `src/store/index.rank-match-lifecycle.test.ts`
- Modify: `src/store/rank-match.ts`
- Modify: `src/store/rank-match.test.ts`
- Modify: `src/store/index.ts`
- Modify: `src/store/index.rank-match-resume.test.ts`

**Step 1: Write the failing test**

先把主动动作写成红灯：

```ts
it('suspendActiveMatch 把 active session 变成 suspended，并保留 activeSessionId', () => {
  const rank = useRankMatchStore.getState().startRankMatch('rookie');
  const next = useRankMatchStore.getState().suspendActiveMatch();
  expect(next.status).toBe('suspended');
  expect(useGameProgressStore.getState().gameProgress?.rankProgress?.activeSessionId).toBe(rank.id);
});

it('reactivateSuspendedMatch 把 suspended 重新切回 active', () => {
  useRankMatchStore.getState().suspendActiveMatch();
  const next = useRankMatchStore.getState().reactivateSuspendedMatch();
  expect(next.status).toBe('active');
});

it('cancelActiveMatch 把会话标记为 cancelled，清空 activeSessionId，且不写 history', () => {
  useRankMatchStore.getState().cancelActiveMatch();
  expect(useGameProgressStore.getState().gameProgress?.rankProgress?.activeSessionId).toBeUndefined();
  expect(useGameProgressStore.getState().gameProgress?.rankProgress?.history).toHaveLength(0);
});

it('suspendRankMatchSession 会保存当前 PracticeSession，并清空 SessionStore 内存态', () => {
  // startRankMatchGame -> suspendRankMatchSession
  expect(useSessionStore.getState().session).toBeNull();
  expect(useRankMatchStore.getState().activeRankSession?.status).toBe('suspended');
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/store/rank-match.test.ts src/store/index.rank-match-lifecycle.test.ts src/store/index.rank-match-resume.test.ts
```

Expected:
- `suspendActiveMatch` / `reactivateSuspendedMatch` / `cancelActiveMatch` / `suspendRankMatchSession` 未定义

**Step 3: Write minimal implementation**

新增 store 动作，不复用当前 `abandonSession()`：

在 `src/store/rank-match.ts` 中新增：

```ts
suspendActiveMatch: () => RankMatchSession;
reactivateSuspendedMatch: () => RankMatchSession;
cancelActiveMatch: () => RankMatchSession;
```

推荐最小实现：

```ts
const next = { ...session, status: 'suspended', suspendedAt: Date.now() };
repository.saveRankMatchSession(next);
set({ activeRankSession: next });
```

```ts
const next = { ...session, status: 'active', suspendedAt: undefined };
repository.saveRankMatchSession(next);
set({ activeRankSession: next });
```

```ts
const next = {
  ...session,
  status: 'cancelled',
  cancelledAt: Date.now(),
  endedAt: Date.now(),
};
repository.saveRankMatchSession(next);
writeRankProgress(prev => ({ ...prev, activeSessionId: undefined }));
set({ activeRankSession: null });
```

在 `src/store/index.ts` 中新增：

```ts
suspendRankMatchSession: () => void;
cancelRankMatchSession: () => void;
```

实现要求：

1. 仅对 `sessionMode === 'rank-match'` 生效
2. `suspendRankMatchSession()` 先 `repository.saveSession(session)`，再调用 `useRankMatchStore.getState().suspendActiveMatch()`，最后清空内存态
3. `cancelRankMatchSession()` 调用 `cancelActiveMatch()` 后清空内存态
4. 不把 `cancelled` 写进 `rankProgress.history`
5. `loadActiveRankMatch()` 允许恢复 `status === 'active' || status === 'suspended'`

**Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run src/store/rank-match.test.ts src/store/index.rank-match-lifecycle.test.ts src/store/index.rank-match-resume.test.ts
```

Expected:
- PASS
- `suspended` 会话仍由 `activeSessionId` 指向
- `cancelled` 会话不会影响历史与当前段位

**Step 5: Commit**

仅当用户明确要求提交时执行：

```bash
git add src/store/rank-match.ts src/store/rank-match.test.ts src/store/index.ts src/store/index.rank-match-lifecycle.test.ts src/store/index.rank-match-resume.test.ts
git commit -m "为段位赛补齐中断与取消的状态流转"
```

---

### Task 3: 提取恢复策略并接到 App / Practice / Hub / Home

**Files:**
- Create: `src/engine/rank-match/recovery-policy.ts`
- Create: `src/engine/rank-match/recovery-policy.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/pages/Practice.tsx`
- Modify: `src/pages/RankMatchHub.tsx`
- Modify: `src/pages/Home.tsx`

**Step 1: Write the failing test**

先用纯函数把“启动后去哪”定死，避免直接写进组件里不可测：

```ts
it('active + unfinished game -> auto-resume-practice', () => {
  expect(decideRankMatchRecovery({ status: 'active', hasUnfinishedGame: true })).toBe('auto-resume-practice');
});

it('active + between games -> stay-home', () => {
  expect(decideRankMatchRecovery({ status: 'active', hasUnfinishedGame: false })).toBe('stay-home');
});

it('suspended + unfinished game -> stay-home', () => {
  expect(decideRankMatchRecovery({ status: 'suspended', hasUnfinishedGame: true })).toBe('stay-home');
});

it('cancelled/completed -> clear-and-ignore', () => {
  expect(decideRankMatchRecovery({ status: 'cancelled', hasUnfinishedGame: false })).toBe('clear-and-ignore');
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/engine/rank-match/recovery-policy.test.ts
```

Expected:
- `decideRankMatchRecovery` 不存在

**Step 3: Write minimal implementation**

新增纯函数：

```ts
export type RankMatchRecoveryDecision =
  | 'auto-resume-practice'
  | 'stay-home'
  | 'clear-and-ignore';

export function decideRankMatchRecovery(params: {
  status: RankMatchSessionStatus;
  hasUnfinishedGame: boolean;
}): RankMatchRecoveryDecision {
  // ...
}
```

然后接回页面：

1. `App.tsx`
   - 先 `loadGameProgress`
   - 再 `loadActiveRankMatch`
   - 若 decision 是 `auto-resume-practice`：
     - 找到未完成局
     - `resumeRankMatchGame(practiceSessionId)`
     - `setPage('practice')`
   - 若 decision 是 `stay-home`：
     - 保持当前 `home`
   - 若 decision 是 `clear-and-ignore`：
     - 调清理逻辑后留在 `home`
2. `Practice.tsx`
   - 段位赛退出弹窗改为三按钮
   - 新增二次确认态：`放弃，重新开始`
   - 不再承担启动恢复的主入口
3. `RankMatchHub.tsx`
   - 当 `activeRankSession.status === 'suspended'` 时：
     - 主按钮文案为 `继续当前对局`
     - 次按钮为 `放弃，重新开始`
   - 点击继续时先 `reactivateSuspendedMatch()`，再 `resumeRankMatchGame()`
   - 点击放弃时先二次确认，再 `cancelActiveMatch()`，然后立刻 `startRankMatch(tier)` + `startRankMatchGame(..., 1)`
4. `Home.tsx`
   - 若当前可恢复会话是 `suspended`，副文案提示“你有一场中断中的挑战”
   - 点击仍只进入 `rank-match-hub`

**Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run src/engine/rank-match/recovery-policy.test.ts src/store/rank-match.test.ts src/store/index.rank-match-lifecycle.test.ts src/store/index.rank-match-resume.test.ts
```

Expected:
- 恢复分流纯逻辑 PASS
- store 侧 continue/cancel 行为 PASS

**Step 5: Commit**

仅当用户明确要求提交时执行：

```bash
git add src/engine/rank-match/recovery-policy.ts src/engine/rank-match/recovery-policy.test.ts src/App.tsx src/pages/Practice.tsx src/pages/RankMatchHub.tsx src/pages/Home.tsx
git commit -m "修复段位赛刷新恢复并接入中断重开入口"
```

---

### Task 4: 全量验证、复跑 Rank QA、回写项目记录

**Files:**
- Modify: `ProjectManager/QA/2026-04-19-full-regression/batch-3-rank-match-result.md`
- Modify: `ProjectManager/QA/2026-04-19-full-regression/auto-result.md`
- Modify: `ProjectManager/QA/2026-04-19-full-regression/artifacts/raw-results.json`
- Modify: `ProjectManager/ISSUE_LIST.md`
- Modify: `ProjectManager/Overview.md`
- Modify: `ProjectManager/Plan/2026-04-18-rank-match-phase3-implementation.md`
- Modify: `ProjectManager/Plan/README.md`

**Step 1: Run focused tests before QA**

Run:

```bash
npx vitest run src/engine/rank-match/match-state.test.ts src/repository/local.test.ts src/store/rank-match.test.ts src/store/index.rank-match-lifecycle.test.ts src/store/index.rank-match-resume.test.ts src/engine/rank-match/recovery-policy.test.ts
```

Expected:
- 所有新增和相关回归测试通过

**Step 2: Run full baseline verification**

Run:

```bash
npx vitest run
npm run build
```

Expected:
- `vitest` 全绿
- `build` 全绿

**Step 3: Re-run D-07 and rank batch using existing QA harness**

当前 `ProjectManager/QA/2026-04-19-full-regression/full-regression.mjs` 没有 batch filter，因此先沿用现有脚本，重点检查 Rank 批次结果。

先在独立终端启动 dev server：

```bash
npm run dev
```

再执行：

```bash
node ProjectManager/QA/2026-04-19-full-regression/full-regression.mjs
```

检查重点：

1. `batch-3-rank-match-result.md` 中 `D-07` 由 FAIL -> PASS
2. Rank batch 汇总变为全绿
3. `D-08` 继续保持 PASS
4. 新增“中断并保存 / 放弃，重新开始”路径没有产生关键 `pageerror`

**Step 4: Write back PM documents**

按项目规则，先改权威源，再改 Overview：

1. `ProjectManager/ISSUE_LIST.md`
   - 把 `ISSUE-064` 改为 `✅ 已关闭`
   - 关闭记录中写明：
     - 局内意外退出改为启动期自动恢复
     - 主动中断与放弃重开作为新语义一并落地
2. `ProjectManager/Plan/2026-04-18-rank-match-phase3-implementation.md`
   - 追加本轮修复与复跑结果
   - 把“阻塞中”改成“待最终收口”或本轮真实状态
3. `ProjectManager/Overview.md`
   - 更新当前状态与下一步
4. `ProjectManager/Plan/README.md`
   - 若子子计划行的阻塞状态已变化，同步更新索引

**Step 5: Run pm-sync-check**

Run:

```bash
npx tsx scripts/pm-sync-check.ts
```

Expected:
- 全绿，或仅有明确可解释的启发式警告

**Step 6: Commit**

仅当用户明确要求提交时执行：

```bash
git add ProjectManager/QA/2026-04-19-full-regression ProjectManager/ISSUE_LIST.md ProjectManager/Overview.md ProjectManager/Plan/2026-04-18-rank-match-phase3-implementation.md ProjectManager/Plan/README.md
git commit -m "修复段位赛恢复缺陷并补齐中断重开语义"
```
