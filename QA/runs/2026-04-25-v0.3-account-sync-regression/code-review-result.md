# Code Review Result

日期：2026-04-25

结论：未发现阻塞 v0.3 scoped QA 收口的问题。

## 审查范围

- `src/sync/engine.ts`
- `src/sync/merge-flow.ts`
- `src/sync/merge.ts`
- `src/sync/local-progress.ts`
- `src/sync/remote.ts`
- `src/store/auth.ts`
- `src/components/AccountSection.tsx`
- `src/components/SignOutConfirmDialog.tsx`
- `src/pages/Profile.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/RankMatchHub.tsx`

## 核对点

### dirtyKeys 与重试

- `useSyncEngine.markDirty()` 会持久化 dirtyKeys，并在有 active user 且在线时触发 `push()`。
- `push()` 按 dirty key 分类上推，失败项保留在 dirtyKeys，成功后清空并更新时间。
- `recordFailure()` 使用指数退避，达到 `MAX_RETRY` 后进入 error 且不继续无限重试。
- `shutdown()` 只解绑 runtime / realtime / notify，不清 dirtyKeys，符合“登出或 auth 状态切换不静默丢待同步队列”的要求。

### 拉取与合并

- `pull()` 对 `profiles` 仅在本地 profile 不脏时覆盖，避免本地待同步昵称/头像被远端旧值覆盖。
- `game_progress`、`history_records`、`rank_match_sessions` 走 merge 后静默保存，再回写远端，符合双端合并闭环。
- `mergeRankMatchSessions()` 已有同状态 games 更长者优先、updatedAt 保留、completed 优先等测试覆盖。

### 首次登录合并流

- `runMergeFlow()` 覆盖本地/云端空、有本地、有云端、两边都有、离线等待、账号不一致等路径。
- 账号不一致时先弹确认；只有用户确认继续后才调用 `discardPendingSyncAfterUserConfirmation()` 与 `clearAccountScopedData()`。
- 合并/丢弃失败路径提供 retry / switch / cancel，避免一次远端失败直接丢数据。

### Auth 与 UI 防误操作

- `signOutGuarded()` 在 dirtyKeys 非空时返回阻断结果，Profile 侧弹 `SignOutConfirmDialog`，用户明确选择“仍然登出”后才丢弃 pending sync。
- Supabase 未配置时 `AccountSection` 显示“当前版本未接入账号系统。”，不提供不可完成的登录动作。
- LoginPage 的 Magic Link 提交在 email 为空时禁用，未配置 Supabase 时 store 返回显式错误。
- RankMatchHub 使用 `useOnlineStatus()`；离线时新开挑战按钮禁用，并显示离线说明。

## 残余风险

- 本地环境未配置 Supabase，因此本轮 Code Review 只能结合已有 2026-04-24 真实 Supabase 验收记录判断远端闭环；本轮浏览器测试不会再次真实发送 Magic Link 或写 Supabase。
- `useAuthStore.signOut()` 目前会忽略 `signOutGuarded()` 的返回值；当前 UI 使用的是 `signOutGuarded()`，暂不构成 v0.3 阻塞，但若后续有新调用方直接用 `signOut()`，建议改为返回 guard 结果或移除该薄封装以免误用。
