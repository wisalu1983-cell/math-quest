# Phase 3 真实 Supabase 验收记录

> 日期：2026-04-24
> 状态：真实 Supabase 环境已配置；8 个剧本均已通过；最终 test/build 已通过

## 环境配置

当前 worktree 已配置本地 `.env.local`（文件被 `.gitignore` 忽略，不提交）：

- `VITE_SUPABASE_URL`：已配置为 Supabase 项目根 URL（不含 `/rest/v1/`）
- `VITE_SUPABASE_ANON_KEY`：已配置为 `sb_publishable...` 前端 publishable key

Supabase Dashboard 侧人工配置已完成：

- Data API 已启用
- Email provider 已启用
- Auth URL Configuration 已指向本地验收地址 `http://127.0.0.1:5174`
- `supabase/migrations/001_initial_schema.sql` 已执行
- `handle_new_user()` trigger function 已按真实报错修复为 `security definer + search_path = public + public.*` 写法

## 代码侧验证

- `npm test -- --run`：通过，42 个测试文件，637 个测试（2026-04-24 复跑）
- `npm run build`：通过（2026-04-24 复跑）
- 本地页面：`http://127.0.0.1:5174/` 可访问；登录页邮箱输入框与"发送登录链接"按钮可渲染；浏览器 console 无错误
- Supabase Data API：`profiles` 查询返回 `200 OK`；未登录状态下 RLS 返回空数组
- RISK-2 调用点复核：`deleteRankMatchSession` 仅在 `repository/local.test.ts` 与 `dev-tool/injections/rank-active-session.ts` 调用，无产品路径调用者

## 真实 Supabase 剧本

| 剧本 | 状态 | 证据 |
|---|---|---|
| 1. Magic Link 首次登录（全新账号） | 通过 | 测试邮箱 `wiaslu@gmail.com`：App 发送 Magic Link 后登录成功；Home 右上角显示已同步图标；Profile 账号区显示邮箱与"已同步 · 上次同步 刚刚"；SQL 复核 `profiles / game_progress / sync_metadata` 均已初始化，`total_questions_attempted = 0`、`total_questions_correct = 0`、`updated_at = 2026-04-24 09:42:02.298733+00` |
| 2. 访客数据上云（首次登录 · 有本地进度） | 通过 | Admin Magic Link 自动验收；测试邮箱 `wiaslu+mq2-20260424c@gmail.com`，本地访客进度 3/3，登录后云端 `game_progress.total_questions_attempted = 3`、`total_questions_correct = 3`，Profile 账号区显示同步完成；RLS 查询成功 |
| 3. 跨设备拉取（换设备登录已有账号） | 通过 | 清空浏览器上下文后登录同一邮箱 `wiaslu+mq2-20260424c@gmail.com`；无合并对话框，云端 3/3 进度自动拉取到本地，RLS 查询 `game_progress` 为 3/3 |
| 4. 两端都有数据合并 | 通过 | 同一邮箱 `wiaslu+mq2-20260424c@gmail.com` 云端已有 3/3，本地访客 fixture 为 5/5；弹出两端数据合并选择，点击"合并到云端"后云端按 `mergeGameProgress` 规则更新为 5/5，`historyCount = 2` |
| 5. 合并失败错误态 | 通过 | 同一邮箱 `wiaslu+mq2-20260424c@gmail.com`，本地访客 fixture 为 7/7；合并时浏览器离线，出现"合并失败"错误态，"重试合并 / 改用云端数据 / 取消登录"三按钮可见；恢复网络后点击"重试合并"成功，云端更新为 7/7，`historyCount = 3` |
| 6. 段位赛跨设备接管（10 分钟阈值） | 通过 | 真实 Supabase 写入测试段位赛；`wiaslu+mq6-20260424g@gmail.com` 的 `updated_at = 当前时间 - 9 分钟` 时 Hub 显示"另一台设备正在进行中"且无接管按钮；`wiaslu+mq6-20260424h@gmail.com` 的 `updated_at = 当前时间 - 11 分钟` 时 Hub 显示"可在本设备接管"，点击"开始下一局"进入第 2 局；无网络失败、无 console error |
| 7. 持续离线 | 通过 | 自动验收 `wiaslu+mq7-20260424b@gmail.com`；登录完成后模拟 Supabase 网络离线并重新打开 app，AuthStore 从本地 session 恢复、Home 可用、SyncStatus 显示离线、段位赛 Hub 显示离线禁止提示；离线写入 1 次本地进度后 `dirtyKeys` 保留，恢复网络后云端 `total_questions_attempted` 从 0 更新到 1，`dirtyKeys` 清空 |
| 8. 指数退避 + 自愈 | 通过 | 自动验收 `wiaslu+mq8-20260424a@gmail.com`；浏览器层拦截 `game_progress` 写请求，制造 6 次真实 upsert 失败，Home SyncStatus 依次显示"第 1/2/3/4/5 次"重试并最终进入"同步持续失败"，Profile 显示"手动重试"；恢复写通道后点击"手动重试"，云端 `total_questions_attempted` 从 0 更新到 1，`dirtyKeys` 清空；未修改 Supabase RLS 策略 |

## RISK 最终结论

| ID | 结论 | 实施位置 |
|---|---|---|
| RISK-1 | 已修复。`shutdown()` 不清 `dirtyKeys`；`signOutGuarded()` 拦截未同步数据；用户确认强制登出时才清待同步队列，避免跨账号污染。 | Task 3.0 / 3.3 |
| RISK-2 | 降级关闭。产品路径不做物理删除；`deleteRankMatchSession` 已补 doc comment，调用点仅限 dev-tool / 单测。 | Task 3.4 |
| RISK-3 | 已修复。`RETRY_DELAYS_MS = [1,2,4,8,16,30]s`；push 失败指数退避；`online` / `markDirty` / Realtime / 30s 轮询均可自愈，成功后清 `retryCount`。 | Task 3.5 |
| RISK-4 | 已修复。`mergeRankMatchSessions` 新增同优先级、games 更长者胜出的对称测试。 | Task 3.5 |

## 待执行命令

继续真实验收时：

```bash
npm run dev -- --host 127.0.0.1 --port 5174
```

然后按 `ProjectManager/Specs/v03-supabase-account-sync/2026-04-24-phase3-04-resilience-qa.md` 的 8 个剧本逐项补证。
