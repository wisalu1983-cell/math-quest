# 开发者工具栏（Dev Tool Panel）· 资料调研报告

> 创建：2026-04-20  
> 所属功能：`dev-tool-panel`（v0.2 主线内对应反馈代号 **F3 · 开发者工具栏**；正式子计划 ID `v0.2-1-1`）  
> 所属版本：v0.2  
> 父计划：`ProjectManager/Plan/v0.2/phases/phase-1.md`
> 状态：✅ 第 2 步完成（资料调研；不做判断）
> 4 步工作流位置：[第 2 步 资料调研]（本文件）→ 第 3 步 方案设计 → 第 4 步 审核

---

## 本报告的作用

按 `Plan/v0.2/04-execution-discipline.md` §4 步工作流第 2 步要求，基于该功能的"预期效果"扫相关代码 / Spec / Issue / 历史记录，产出**事实清单**。**只列"当前是什么状态"，不做判断**。

第 3 步方案设计将基于本报告做架构决策，并另文落盘。

---

## A. 存档层（`src/repository/local.ts`）

| key | 内容 | 当前行为 |
|---|---|---|
| `mq_user` | User 对象（id / nickname / avatarSeed / createdAt / settings）| 单用户单记录 |
| `mq_game_progress` | GameProgress（campaign + advance + rank + wrongQuestions + 统计）| 全局唯一 |
| `mq_sessions` | PracticeSession[]，上限 200 | upsert by id，满则裁前段 |
| `mq_rank_match_sessions` | Record<id, RankMatchSession> | 独立 key |
| `mq_version` | 当前 `CURRENT_VERSION = 3` | 启动时探测 + 迁移 |
| `mq_backup_v{old}_{ts}` | 迁移失败时的旧 GameProgress | 仅迁移链抛错时写 |
| `mq_progress` | 遗留 key | 仅 `clearAll()` 会清；无读写路径 |

- **迁移纪律**（`repository.init`）：旧版本 → 串行走 `MIGRATIONS[n]`；任一步抛错 → 备份 + 丢弃 + 新存档 + 告警；**严禁 `clearAll()` 用于版本兜底**
- **`clearAll()` 当前实现**：逐个 removeItem 上面 5 个 key + 遗留 `mq_progress`；注释声明"仅用户显式操作"
- **没有**独立的"测试数据 key"或"影子存档"机制；所有读写都落到同一组 `mq_*`

## B. Store 结构

| Store | 位置 | 管辖状态 |
|---|---|---|
| `useUserStore` | `store/index.ts` | User（全局单用户） |
| `useGameProgressStore` | `store/gamification.ts` | GameProgress（campaign / advance / rank / wrongQuestions / 统计） |
| `useSessionStore` | `store/index.ts` | 当前进行中的 PracticeSession（currentQuestion / hearts / rankQuestionQueue / pendingWrongQuestions / lastRankMatchAction） |
| `useRankMatchStore` | `store/rank-match.ts` | `activeRankSession`（BO 赛事层） |
| `useUIStore` | `store/index.ts` | currentPage（14 种枚举）· selectedTopicId · viewingSessionId · soundEnabled |

## C. 已有 DEV 钩子（可复用起点）

- `import.meta.env.DEV` 下挂到 window：
  - `window.__MQ_SESSION__` → useSessionStore
  - `window.__MQ_GAME_PROGRESS__` → useGameProgressStore
  - `window.__MQ_UI__` → useUIStore
  - `window.__MQ_RANK_MATCH__` → useRankMatchStore
- `main.tsx` 有 `?preview=a03plus` query 走 `A03PlusComparisonPreview` 预览页（仅 DEV）
- **没有**可视化 DevPanel；目前只能在浏览器控制台调用 store 方法
- **没有**"预设状态快照"表
- **没有**"测试状态 / 正式存档"物理隔离机制

## D. 路由（页面枚举式，无 react-router）

`UIStore.currentPage` 枚举值：

```
'onboarding' | 'home' | 'campaign-map' | 'advance-select' | 'practice'
'summary' | 'progress' | 'profile' | 'wrong-book' | 'history' | 'session-detail'
'rank-match-hub' | 'rank-match-game-result' | 'rank-match-result'
```

- 切页面：`useUIStore.getState().setPage(page)`
- Practice 的三种启动入口（来自 `useSessionStore`）：
  - 闯关：`startCampaignSession(topicId, levelId)`
  - 进阶：`startAdvanceSession(topicId)`
  - 段位赛：`startRankMatchGame(rankSessionId, gameIndex)`（需要 `useRankMatchStore.activeRankSession` 已存在）

## E. 可注入状态的具体数据路径

| 注入项 | 改动落点 | 派生关系 |
|---|---|---|
| 任一关卡位置 | `gameProgress.campaignProgress[topicId].completedLevels[]` + `campaignCompleted` | `isCampaignFullyCompleted` 从 completedLevels 派生 |
| 任一进阶星级（1🌟/2🌟/升星临界）| `gameProgress.advanceProgress[topicId].heartsAccumulated` | 星级由 `getStars(heartsAccumulated, cap)` 派生；临界值 = cap/5 边界 |
| 任一段位等级 | `gameProgress.rankProgress.currentTier` | 枚举 `RankTier` 5 档 |
| 进入段位赛挑战态 | `rankProgress.activeSessionId` + `mq_rank_match_sessions` 里新建活跃 RankMatchSession | BO 序列 + games 数组，状态机 `active` / `suspended` / `completed` / `cancelled` |
| 一局内"剩 N 心" | `useSessionStore.hearts`（非持久化；内存态）| PracticeSession.heartsRemaining（持久化） |
| 一局"刚结束" | `session.completed=true` + `currentQuestion=null` | `endSession()` 会触发 |
| 结算页 | `UIStore.currentPage` = `'summary'` / `'rank-match-game-result'` / `'rank-match-result'` | 需 `useSessionStore.lastSession` 已填 |
| 任一题型直达 | 调 `useSessionStore.startCampaignSession(topicId, levelId)` + `setPage('practice')` | 需 `levelId` 存在于 `CAMPAIGN_MAPS[topicId]` |
| 心数（campaign 模式内）| `useSessionStore.hearts`（运行时）/ PracticeSession.heartsRemaining（持久化）| `CAMPAIGN_MAX_HEARTS` 作为满值 |

## F. 段位赛相关常量 / 类型（`src/constants/rank-match.ts` · `src/types/gamification.ts`）

- `RankTier = 'apprentice' | 'rookie' | 'pro' | 'expert' | 'master'`
- `ChallengeableTier = Exclude<RankTier, 'apprentice'>`（4 档）
- BO：rookie=3 / pro=5 / expert=5 / master=7；胜场 `(bestOf+1)/2`
- 每场题量：20/25/25/30；expert/master 30 分钟计时
- 入场门槛表 `RANK_ENTRY_STARS[tier]`：按 8 题型的最低星级要求矩阵（rookie 4 题各 1★；master 各题 3~5★）
- BO 状态机：`createRankMatchSession` / `onGameFinished` / `startNextGame`（`engine/rank-match/match-state.ts`）
- 段位赛一致性异常：`RankMatchRecoveryError`（Spec `2026-04-18-rank-match-phase3-implementation-spec.md` §5.8 明文禁止静默降级）

## G. 题型 / 闯关地图元数据

- 题型：A01~A08 对应 TopicId：`mental-arithmetic` / `number-sense` / `vertical-calc` / `operation-laws` / `decimal-ops` / `bracket-ops` / `multi-step` / `equation-transpose`
- 闯关地图：`CAMPAIGN_MAPS[topicId].stages[].lanes[].levels[].levelId`（形如 `'mental-arithmetic-S1-LA-L1'`）
- 关卡工具函数：`getCampaignLevel(topicId, levelId)` / `getAllLevelIds(topicId)` / `getSubtypeFilter(...)` 在 `src/constants/campaign.ts`

## H. 空白区（搜遍无既有设计规格约束）

- **Specs**：搜 "F3 / devtool / 开发者工具 / 测试状态注入" 在 `ProjectManager/Specs/` 无有效命中
- **ISSUE_LIST.md**：无相关开放条目
- **Reports/**：无相关历史报告
- 结论：**本功能无既有设计规格约束**，需在本子计划内产出第一份规范

## I. 工程约束（F3 动存档必须遵守）

| 约束 | 出处 | 含义 |
|---|---|---|
| `CURRENT_VERSION = 3` 不可 F3 单方面修改 | `repository/local.ts` §26-28 | 任何 F3 注入操作不能越权改 `mq_version` |
| `clearAll()` 仅限用户显式操作 | `repository/local.ts` §317-319 | F3 如复用此函数需确认范围（不越界到未来 key） |
| GameProgress 写入必须保持 schema 有效 | `repository/local.ts` `runMigrationChain` | 否则下次 `repository.init` 可能走到备份分支 |
| `mq_sessions` 上限 200 | `repository/local.ts` `MAX_SESSIONS` | F3 构造 BO 赛事中途态需同时写入 BO session + PracticeSession，仍受此上限约束 |
| 段位赛一致性异常必须显式处理 | Spec `2026-04-18-rank-match-phase3-implementation-spec.md` §5.8 | F3 构造段位赛活跃态若数据不一致必须抛 `RankMatchRecoveryError`，禁止静默降级 |

## J. 生态约束（来自 `Plan/README.md`）

- **工具性子计划范围规则**（2026-04-20 生效）：F3 不为尚未做的功能预造能力
- **Phase 与子计划命名规则**（2026-04-20 生效）：本功能 = `v0.2-1-1`，正式 ID
- **功能设计文档子目录规则**（2026-04-20 生效）：本文件所在目录 `Specs/dev-tool-panel/` 即是首例
- Plan 文件模板要求头部含"所属版本"等字段

---

## 第 2 步结论

本报告仅列事实。关于"注入面板挂哪个页面 / 是否独立 localStorage namespace / 如何保证零污染 / 如何与现有 DEV 钩子协同"等**架构决策**，一律留到第 3 步方案设计中回答。
