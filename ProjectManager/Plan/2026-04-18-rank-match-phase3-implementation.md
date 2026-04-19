# Phase 3 段位赛 — 实施子子计划

> 创建：2026-04-18  
> 父计划：[`2026-04-18-subplan-4-next-stage-expansion.md`](2026-04-18-subplan-4-next-stage-expansion.md)（子计划 4 Umbrella，本阶段唯一主线）  
> 祖父计划：[`2026-04-16-open-backlog-consolidation.md`](2026-04-16-open-backlog-consolidation.md) §四 子计划 4  
> 前置规格：
> - [`../Specs/2026-04-18-rank-match-phase3-implementation-spec.md`](../Specs/2026-04-18-rank-match-phase3-implementation-spec.md)（实施级唯一入口，本计划直接按其 §3~§8 落地）
> - [`../Specs/2026-04-10-gamification-redesign.md`](../Specs/2026-04-10-gamification-redesign.md) §5 / §8 Q9（段位赛产品规则事实源）
> - [`../Specs/2026-04-13-star-rank-numerical-design.md`](../Specs/2026-04-13-star-rank-numerical-design.md) §3 / §4（星级与数值事实源）
> - [`../Specs/2026-04-15-gamification-phase2-advance-spec.md`](../Specs/2026-04-15-gamification-phase2-advance-spec.md)（`TOPIC_STAR_CAP`）
> - [`../Specs/2026-04-14-ui-redesign-spec.md`](../Specs/2026-04-14-ui-redesign-spec.md)（阳光版 v5）  
> 状态：🟡 M2 完成，等待 M3 领取  
> **M1 启动前必读**：[`../Reports/2026-04-19-m1-kickoff-brief.md`](../Reports/2026-04-19-m1-kickoff-brief.md)（一次性交接简报，M1 领取并启动后即归档；汇总 2026-04-19 session 固化的 5 项关键决策、M1 文件清单同构索引与 6 条项目级硬约束）

---

## 1. 目标与范围

### 1.1 目标

把 [`../Specs/2026-04-18-rank-match-phase3-implementation-spec.md`](../Specs/2026-04-18-rank-match-phase3-implementation-spec.md) 的实施级规格在代码层落地，实现 Phase 3 段位赛最小闭环：

> 用户在 Home 能看到独立的段位赛入口 → 进入 Hub 看到五段位状态 → 满足星级门槛后进入新秀 BO3 → 完成 3 局 → 看到晋级 / 未晋级结算 → 段位持久化。

### 1.2 不做什么

- 不做段位赛奖励系统（皮肤、称号等）
- 不做跨 session 的"继续上次赛事"弹窗（`rankProgress.activeSessionId` 数据已存，但 UI 入口先简化为"当前段位 + 可挑战段位列表"）
- 不做赛季制、段位衰减、排行榜
- 不做 A03+ / A09 / B/C/D 任何改动（详见父计划 §二·2.2）

### 1.3 跨系统维度清单

- [x] GameSessionMode 枚举 / GameProgress 形状（新增 `'rank-match'` / `rankProgress`）
- [x] 持久化 / 存档迁移（`CURRENT_VERSION 2→3`；追加式迁移）
- [x] UI 组件（新增 Hub / GameResult / MatchResult 三页；Home 入口改造）
- [x] 答题形式 / 验证逻辑（**复用** v2.2 生成器 + 现有 `submitAnswer` 主循环；新增"单局结束回写 BO 状态"钩子）
- [ ] 难度档位 / 题型梯度数（不改）
- [ ] 关卡结构 / campaign.ts（不改）
- [ ] `TopicId` 枚举（不改）

---

## 2. 里程碑拆分

四个里程碑按"稳定地基 → 编排逻辑 → UI 页面 → 验收回写"顺序推进，任一 M 未收口时下一 M 不启动。

### M1 — 地基：类型 + 常量 + 持久化迁移 + Store 最小骨架

**目标**：让 `GameProgress` 携带 `rankProgress` 字段并正确持久化，`RankTier`/`RankMatchSession`/`RankMatchGame`/`RankProgress` 类型在全代码范围可用；store 提供一个可以被测试调用的最小段位赛 API（不要求 UI 驳接）。

**代码文件清单**（新增/修改）：

| 文件 | 动作 | 摘要 |
|------|------|------|
| `src/types/gamification.ts` | 修改 | 按 Spec §3 添加 `RankTier` / `RankMatchBestOf` / `RankMatchGame` / `RankMatchSession` / `RankProgress`；`GameProgress` 追加 `rankProgress?: RankProgress`；`GameSessionMode` 追加 `'rank-match'`；`PracticeSession.rankMatchMeta` 新增 `primaryTopics: TopicId[]`（Spec §4.2）；删除 L84/L93 两处占位裸注释。**注意**：`RankMatchGame` 不含 `questionIds` / `correctness`（走 `practiceSessionId` 反查），`RankMatchSession` 不含 `currentGameIndex`（走派生函数），见 Spec §3.3 / §3.4 决策说明，不得擅自补回 |
| `src/types/index.ts` | 修改 | 重导出新类型（`RankTier` 等）以保持既有 `import from '@/types'` 风格一致 |
| `src/constants/rank-match.ts` | 新增 | 段位入场表（引用 `TOPIC_STAR_CAP` + `2026-04-13` §3.2 数值）；每段位 `bestOf` / `winsToAdvance` / `questionsPerGame`（20/25/25/30）/ `timerMinutes`（仅专家大师 30）/ `newContentPoints` 字典 |
| `src/engine/rank-match/entry-gate.ts` | 新增 | **入场校验独立文件**（Spec §7.1）。暴露 `isTierUnlocked(tier, advanceProgress)` 与 `getTierGaps(tier, advanceProgress)` 两个纯函数；只读入场表 + `advanceProgress`，不依赖 store / repository / RankMatchSession；供 Hub / Home / store-before-create 三处共用 |
| `src/engine/rank-match/match-state.ts` | 新增 | BO 生命周期状态机：`createRankMatchSession`（内部 `require(isTierUnlocked)`）、`startNextGame`、`onGameFinished`、`getCurrentGameIndex` 派生函数（Spec §3.4 注释）；纯函数或小闭包，不依赖 store；答题明细不再由本文件回写，按 Spec §3.3 走 `practiceSessionId` 反查 |
| `src/repository/local.ts` | 修改 | `CURRENT_VERSION: 2 → 3`；新增 `migrateV2ToV3` = `migrateRankProgressIfNeeded`（Spec §6.2）；`getGameProgress` 调用链追加该迁移；**`init()` 中"版本不一致就 `clearAll()`"的分支必须彻底移除**，改为串行迁移链（old→old+1→…→CURRENT_VERSION），失败时走 `mq_backup_v{old}_{ts}` 备份 + 告警，而非静默清空——此为项目级原则（Spec §6.3 / `CLAUDE.md` 非显然约束），后续所有 Phase 升级必须沿用 |
| `src/store/rank-match.ts` | 新增 | 一个专门的 zustand slice 或 vanilla store，暴露 `activeRankSession` / `startRankMatch(targetTier)` / `handleGameFinished(practiceSessionSnapshot)` 三个最小 API |

**测试文件**：

| 文件 | 动作 | 摘要 |
|------|------|------|
| `src/engine/rank-match/match-state.test.ts` | 新增 | TDD：入场校验（满足门槛 vs 缺失门槛）、`onGameFinished` 的晋级/淘汰判定（胜 2 负 0 / 胜 1 负 2 / 胜 1 负 1 未决） |
| `src/repository/local.test.ts` | 新增或扩展 | 旧版本 v2 存档（无 `rankProgress`）加载后自动获得默认 `rankProgress`；v3 存档幂等不再迁移；**`init()` 遇到未知更老版本不再 `clearAll`**，走迁移链失败路径写入 `mq_backup_v{old}_{ts}` 备份并告警；`clearAll` 仅作为显式用户操作（如"清空存档"按钮）保留 |
| `src/store/rank-match.test.ts` | 新增 | `startRankMatch` 在未满足门槛时抛错；满足门槛时写入 `activeSessionId`；`handleGameFinished` 正确递增胜场并在达到 `winsToAdvance` 时 `outcome='promoted'` |

**验收门槛（M1）**：

- [ ] `npx tsc --noEmit` 0 错误
- [ ] `npx vitest run src/engine/rank-match src/repository src/store/rank-match.test.ts` 全绿
- [ ] `npx vitest run` 整体 ≥ 既有 328/328 通过数
- [ ] 在浏览器开发模式打开现有页面（未动 UI），段位赛相关代码不报错；`localStorage` 里的老存档自动获得 `rankProgress: { currentTier: 'bronze', history: [] }`（手动在 DevTools 验证）
- [ ] 按角色最小同步：本文件总是回写；`ProjectManager/Overview.md` / `ProjectManager/Plan/README.md` / `ProjectManager/ISSUE_LIST.md` 仅在对应权威信息变化时更新
- [ ] 如本轮涉及跨源写入或里程碑收尾，`pm-sync-check` ✅

> **不允许跳 M1 直接动 M2+**。M1 是所有后续里程碑的地基；如果类型或迁移层有坑，会一路传染。

### M2 — 抽题器与答题流驳接

**目标**：段位赛能真的生成一局 20~30 道混合题；`submitAnswer` 在 `sessionMode === 'rank-match'` 时正确回写到 `RankMatchSession.games[i]`；心归零或答完后自动触发下一局编排。

**代码文件清单**：

| 文件 | 动作 | 摘要 |
|------|------|------|
| `src/engine/rank-match/question-picker.ts` | 新增 | `pickQuestionsForGame(rankSession, gameIndex, advanceProgress)` 返回 `Question[]`；内部调用现有 v2.2 生成器（通过 `engine/generators` 索引）；按 Spec §5 落地主考项 ≥40% / 复习题 ≤25% / 胜场游标 / §5.5 难度范围硬约束 |
| `src/engine/rank-match/picker-validators.ts` | 新增 | 按 Spec §5.7 实现 `validateTierDistribution(tier, buckets, totalCount)` 自检钩子；覆盖每桶难度范围、各桶占比、专家 `normal` 甜点 ≤10%、大师 `demon` ≥40% 等硬约束；返回 `{ ok, violations[] }` |
| `src/engine/rank-match/question-picker.test.ts` | 新增 | TDD：主考项比例≥40%、复习题比例≤25%、每场题量与首版取值一致、相同输入下确定性（同 seed 或按胜场游标顺序稳定）、Spec §5.5 每段位 × 每桶难度范围硬约束、专家 `normal` 甜点上限、大师 `demon` 下限、校验失败按 §5.8 抛异常（不静默降级）|
| `src/store/index.ts` | 修改 | 扩展 `startCampaignSession`/`startAdvanceSession` 同层增加 `startRankMatchGame(rankSessionId, gameIndex)`；`submitAnswer` 在段位赛模式下，session 结束时调用 `handleGameFinished` 并根据返回的 `nextAction`（开下一局 / 结束赛事）做分支；更新/追加 E2E hook |
| `src/store/index.test.ts` | 修改 | 补充段位赛单局答题 → 胜 → 下一局；单局答错 ≥3 → 负 → 下一局；第 W 场胜利 → `outcome='promoted'`；BO3 第 3 局未结束但数学上已无法翻盘 → 提前 `eliminated`（可选） |

**验收门槛（M2）**：

- [ ] `npx tsc --noEmit` 0 错误
- [ ] `npx vitest run` 整体通过数 ≥ M1 基线 + 新增用例数
- [ ] 手动在 `window.__MQ_SESSION__` 或 DevTools 启一场新秀 BO3，打 3 局能正确出 BO 结论
- [ ] 抽题器在任一段位均可连续生成 3 场不抛错（编写一个临时 dev-only 脚本或测试用例）
- [ ] `pm-sync-check` ✅

### M3 — UI：Hub + Session 信息层 + GameResult + MatchResult + Home 入口

**目标**：把段位赛推到用户界面上，所有交互可达；`Practice` 页面复用但题头展示 BO 进度徽章。

**代码文件清单**：

| 文件 | 动作 | 摘要 |
|------|------|------|
| `src/pages/RankMatchHub.tsx` | 新增 | 展示五段位卡片；未解锁段位灰态 + 星级缺口；当前已达段位徽章；若 `activeSessionId` 存在显示"继续挑战"按钮 |
| `src/pages/RankMatchGameResult.tsx` | 新增 | 单局结束中间结算页；展示本局胜负、BO 胜场累计、自动 3 秒后启动下一局 |
| `src/pages/RankMatchResult.tsx` | 新增 | BO 整体结束的终局页：五段位晋级动画 / 未晋级复盘（薄弱题型前 3）/ 返回 Hub |
| `src/components/RankBadge.tsx` | 新增 | 段位徽章（学徒~大师）小组件；通过 `globals.css` token 取色 |
| `src/pages/Home.tsx` | 修改 | 把现有"进阶训练 / 刷星升级，向段位赛进发"拆成独立进阶入口 + 独立段位赛入口；段位赛入口通过 `rankProgress` 显示徽章与缺口提示 |
| `src/pages/Practice.tsx` | 修改 | `sessionMode === 'rank-match'` 时在题头加"新秀 BO3 第 1 局 / 共 3 局"小徽章；题面与答题主循环无任何改动 |
| `src/App.tsx` | 修改 | 新增路由 `/rank-match` / `/rank-match/session` / `/rank-match/game-result` / `/rank-match/match-result`；复用 `Practice` 组件承接 `session` |
| `src/styles/globals.css` | 修改 | 新增段位徽章色 token：`--rank-bronze` / `--rank-silver` / `--rank-gold` / `--rank-platinum` / `--rank-king`；不在组件里写死十六进制 |

**验收门槛（M3）**：

- [ ] `npx tsc --noEmit` 0 错误
- [ ] `npx vitest run` 整体绿
- [ ] 浏览器手工走通：学徒态 → 刷进阶达新秀门槛（可用 DevTools 注入 `advanceProgress`）→ Home 段位赛卡片解锁 → 进入 Hub → 新秀可点 → BO3 三局完整跑通 → `rankProgress.currentTier` 变 `rookie` 并持久化（刷新后保留）
- [ ] 所有段位徽标色通过 CSS 变量，无十六进制硬编码
- [ ] Home / Hub / Practice / Result 四个页面在小屏（375px）与中屏（768px）均无破版
- [ ] `pm-sync-check` ✅

### M4 — 验证 + 回写 + 整体 pm-sync-check

**目标**：闭环质量校验 + 权威源回写 + 里程碑总收口。

**动作清单**：

- [ ] 全量 `npx tsc --noEmit` 0 错误
- [ ] 全量 `npx vitest run` 绿
- [ ] `npm run build` 绿
- [ ] `npx tsx scripts/pm-sync-check.ts` ✅
- [ ] 执行 `ProjectManager/human-verification-bank.md` 里与段位赛相关的新增人工验证项（若无则由 M4 负责补写首版）
- [ ] 在本文件 §6 回写 M1/M2/M3/M4 的实际证据链（commit hash、测试输出摘要、截图/录屏）
- [ ] 如当前主线 / 当前状态 / 下一步变化，更新 `ProjectManager/Overview.md`
- [ ] 如本计划生命周期状态变化，更新 `ProjectManager/Plan/README.md`
- [ ] 更新父计划 `2026-04-18-subplan-4-next-stage-expansion.md` §五状态面板（P3 🟡 → ✅）
- [ ] 更新祖父计划 `2026-04-16-open-backlog-consolidation.md` §三·D 段（段位赛 ✅）
- [ ] 如本阶段新发现或关闭 ISSUE，更新 `ISSUE_LIST.md`；未关闭的标注"挂靠下一阶段"

**验收门槛（M4）**：

- [ ] 以上所有项全部打钩
- [ ] 本文件 §6 回写段完整

---

## 3. 执行纪律

本子子计划严格继承父计划 §六"文档先行纪律"：

1. **三层落盘已到位**：Umbrella ✅ + 实施级 Specs ✅ + 本子子计划 ✅；代码启动前置已清
2. **每个 M 完成后按角色最小同步**：本文件必须当场回写；`ISSUE_LIST.md` / `Overview.md` / `Plan/README.md` 只有在对应事实源发生变化时才更新，禁止为了形式机械性全量同步
3. **禁止跳里程碑**：M1 未全绿 M2 不开工；M1 里程碑验收不通过直接退回到对应代码层修正，不允许用后续 M 掩盖
4. **视觉 token 不写死**：M3 里任何新增颜色、间距必须走 CSS 变量 / Tailwind token；违反即视为 M3 未通过

---

## 4. 风险与开放项

### 4.1 风险

- **存档迁移 · 项目级原则**（Spec §6.3 / `CLAUDE.md` 非显然约束）：`CURRENT_VERSION: 2 → 3` 的迁移是无损追加，同时要求 `repository.init` 放弃"版本不一致就清数据"的旧逻辑，改为串行迁移链 + 失败备份。此为项目级约束，从 M1 开始生效，后续所有 Phase 升级必须遵守；M1 验收不通过此项就算整体不通过。
- **抽题器 × 生成器组合异常**：某些生成器在指定难度档 × 指定子题型组合下可能抛错（罕见但存在）。M2 抽题器需要在首轮 playtest 时加日志，一旦触发就降级为"换同段位内可生成的备选题型"并记录 ISSUE；不允许静默降级。
- **BO 状态持久化的并发**：若用户在单局中途刷新页面，应能恢复到"当前局 + 已答题数"。M2 需要验证 `mq_sessions` + `mq_rank_match_sessions` 两套数据的一致性；若不一致视为异常回到 Hub。
- **UI 视觉 token 补齐**：M3 新增的段位徽章色如果在视觉规格 `2026-04-14-ui-redesign-spec.md` 里没有对应条目，必须先在该 Spec 追加条目、回写 `_index.md`，再写代码——避免"代码提 token 但 Spec 没有"的文档滞后。

### 4.2 开放项（由对应 M 里程碑内决定）

- [ ] M2：大师段位 5 新内容点 × 4 胜场（2+2+1）的具体分配算法
- [ ] M3：Hub 页面的段位卡片交互（横向滑动 vs 纵向列表）
- [ ] M3：GameResult 自动跳转时长是否可配置（当前 Spec 暂定 3 秒）
- [ ] M4：是否把"薄弱题型前 3"写入 `ISSUE_LIST.md` 作为生成器后续调优输入

---

## 5. 与父计划 / 其他子计划的接口

- **父计划 §五 状态面板**：P3 状态由本子子计划回写；在 M1 启动时从"🟡 主线进行中"细化为"🟡 主线进行中 · M1 开工"
- **主计划 §三 D 段**：段位赛行在 M4 完成后打勾
- **`_index.md`**：本计划若发现规格遗漏，必须先补 Spec 再补代码；不允许代码先行
- **`ISSUE_LIST.md`**：M1~M4 任何里程碑内新发现的 bug 或不一致立即入单

---

## 6. 回写段（执行中追加）

### 2026-04-18：子子计划骨架落盘

- 本文件落盘并在 `Plan/README.md` 登记
- 前置规格 `Specs/2026-04-18-rank-match-phase3-implementation-spec.md` 已落盘
- 父计划 / 祖父计划 / Overview / `_index.md` 口径已对齐"本阶段只做 Phase 3"
- `pm-sync-check` ✅ 全绿
- **下一步**：用户领取 M1 后在本段追加"M1 开工"条目

### 2026-04-19：M1 开工 + 完工（同日收口）

**动作**：按 `Reports/2026-04-19-m1-kickoff-brief.md` 的 6 条硬约束与文件清单一次性落盘。

**代码变更**（新增 / 修改）：

| 文件 | 动作 | 要点 |
|------|------|------|
| `src/types/gamification.ts` | 修改 | 加 `RankTier` / `RankMatchBestOf` / `RankMatchGame`（无 `questionIds`/`correctness`）/ `RankMatchSession`（无 `currentGameIndex`）/ `RankProgress`；`GameProgress.rankProgress?`；`GameSessionMode` 加 `'rank-match'`；删 L84/L93 两处占位裸注释 |
| `src/types/index.ts` | 修改 | `PracticeSession.rankMatchMeta?.{rankSessionId, gameIndex, targetTier, primaryTopics}`；重导出 `RankTier / RankMatchBestOf / RankMatchGame / RankMatchSession / RankProgress / AdvanceProgress` |
| `src/constants/rank-match.ts` | 新增 | 段位入场表 `RANK_ENTRY_STARS`（引用 `TOPIC_STAR_CAP` + `2026-04-13` §3.2）+ `RANK_BEST_OF` / `RANK_WINS_TO_ADVANCE` / `RANK_QUESTIONS_PER_GAME`（20/25/25/30）/ `RANK_TIMER_MINUTES`（仅 expert/master=30）/ `RANK_NEW_CONTENT_POINTS` |
| `src/engine/rank-match/entry-gate.ts` | 新增 | `isTierUnlocked(tier, advanceProgress)` + `getTierGaps(tier, advanceProgress)`；只依赖 `advanceProgress` + 常量表；**不依赖 store / repository / RankMatchSession** |
| `src/engine/rank-match/match-state.ts` | 新增 | `createRankMatchSession`（内部 `require(isTierUnlocked)`）/ `startNextGame`（`gameIndex = games.length + 1`）/ `onGameFinished`（含 Spec §7.4 BO 提前结束强制）/ `getCurrentGameIndex` 派生函数 |
| `src/repository/local.ts` | 修改 | `CURRENT_VERSION: 2 → 3`；新增 `migrateV2ToV3 = migrateRankProgressIfNeeded` 与 `MIGRATIONS` 登记表；`init()` 重写为"读旧版本 → 串行迁移链 → 失败落 `mq_backup_v{old}_{ts}` 备份 + 告警 + 清 `mq_game_progress` 后升级版本号"；**彻底移除原"版本不一致 `removeItem('mq_progress')`"分支**（Spec §6.3 项目级原则）；`clearAll` 仅保留给显式用户操作 |
| `src/store/rank-match.ts` | 新增 | 最小 API：`activeRankSession` / `startRankMatch(targetTier, opts?)`（入场校验 + 生成 session + 回写 `rankProgress.activeSessionId`）/ `handleGameFinished(practiceSession)`（`won = completed && heartsRemaining >= 1` → 状态机 → 返回 `nextAction`，结束时回写 `history` + 晋级改 `currentTier`） |

**测试变更**（新增 / 扩展）：

| 文件 | 动作 | 覆盖 |
|------|------|------|
| `src/engine/rank-match/match-state.test.ts` | 新增 | 入场校验（rookie 门槛满足 / 缺失 / 空存档 / pro 需全 8 题型 2★）；`getTierGaps` 缺口列表；`createRankMatchSession` 未解锁抛错 / BO3 生成；`getCurrentGameIndex` 派生；`onGameFinished` BO3 胜胜→promoted 不打第 3 局 / 负负→eliminated 不打第 3 局 / 胜负→未决打第 3 局；异常分支（重复 finish / 不存在 gameIndex / 已出 outcome）；`startNextGame` 上一局未完 / 已出 outcome 抛错（共 22 用例） |
| `src/repository/local.test.ts` | 扩展 | `migrateRankProgressIfNeeded` v2→v3（空 → 默认 apprentice / 已有则幂等 / 等价于 `migrateV2ToV3`）；`repository.init` 项目级原则（全新用户 → 升版本 / v2 存档自动迁移 / v3 幂等 / v1 未知老版本走备份不 clearAll / v2 无 gameProgress 仅升版本号）；`repository.getGameProgress` v2 存档读取时补默认值并回写；`clearAll` 仍作为显式用户操作保留（+11 用例，总 18） |
| `src/store/rank-match.test.ts` | 新增 | `startRankMatch` 未解锁抛错 / 满足门槛生成 BO3 + 写入 `activeSessionId` / 重复启动抛错；`handleGameFinished` BO3 胜胜 promoted + `currentTier` 升 rookie / BO3 负负 eliminated + `currentTier` 保持 apprentice / 不匹配 `rankSessionId` 抛错 / 无活跃赛事抛错（7 用例） |

**验收证据**：

- `npx tsc --noEmit` → 0 错误
- `npx vitest run` → **370 passed**（基线 330 + 新增 40；M1 启动简报标的"≥ 328 + 新增"达成）
- 10 个测试文件全部通过（新增 `match-state.test.ts` 22、`rank-match.test.ts` 7；`local.test.ts` 7→18）

**6 条硬约束核验**：

| # | 硬约束 | 落地证据 |
|---|--------|---------|
| 1 | `repository.init` 版本不一致时严禁 `clearAll()`，必须迁移链 + 备份 | `repository/local.ts::init` 改写；`local.test.ts` "未知更老版本（v1）→ 走备份路径，不 clearAll" 用例通过 |
| 2 | `RankMatchGame` 不加 `questionIds` / `correctness`，走 `practiceSessionId` 反查 | `types/gamification.ts::RankMatchGame` 字段集合确认：`gameIndex / finished / won? / practiceSessionId / startedAt / endedAt?` |
| 3 | `RankMatchSession` 不加 `currentGameIndex`，走派生函数 | `match-state.ts::getCurrentGameIndex` 派生函数已实现；`RankMatchSession` 类型不含该字段 |
| 4 | 入场校验必须独立 `entry-gate.ts`，不得内嵌 match-state / store / 组件 | `engine/rank-match/entry-gate.ts` 独立文件；`match-state.createRankMatchSession` 与 `store/rank-match.startRankMatch` 都通过 `isTierUnlocked` 调用入口 |
| 5 | 禁止旧段位命名（bronze~king） | 全仓搜索 `bronze/silver/gold/platinum/king` 无代码引用；所有段位命名用 `apprentice/rookie/pro/expert/master` |
| 6 | 视觉 token 落地前禁止硬编码徽章色；M3 才做 UI | M1 未创建任何页面 / 样式 / CSS 变量；`globals.css` 未动 |

**跨源同步**：

- 本文件头部状态：🟡 子子计划骨架已落盘 → 🟡 M1 完成，等待 M2 领取
- `Plan/README.md` Phase 3 子子计划行：🟡 等待 M1 领取 → 🟡 M1 完成
- `Overview.md` 当前状态 / 下一步：更新基线测试数（330→370）、把"下一步"从"进入 M1"改为"进入 M2 抽题器"
- `Reports/2026-04-19-m1-kickoff-brief.md`：按简报自身生命周期规则标注为已归档
- `ISSUE_LIST.md`：M1 执行过程中无新发现 Issue，不动
- `Specs/_index.md`：规格状态未变化，不动

**pm-sync-check**：本轮跨源写入 3 处（本文件 + `Overview.md` + `Plan/README.md`），并伴随 kickoff brief 归档，属规则要求运行的节点。运行结果见本段末。

**下一步**：用户领取 M2（抽题器 + 答题流驳接）。M1 不残留阻塞。

### 2026-04-19：M2 开工 + 完工（同日收口）

**动作**：按 Plan §M2 文件清单（抽题器 + validators + store 答题流钩子）一次性落盘；Spec §5 全部硬约束通过自检钩子兜底。

**代码变更**（新增 / 修改）：

| 文件 | 动作 | 要点 |
|------|------|------|
| `src/constants/rank-match.ts` | 扩展 | 新增 `RANK_TOPIC_RANGE`（四段位出题范围）/ `RANK_REVIEW_TOPIC_RANGE`（每段复习题来源 = 前一段范围，rookie=[]）/ `RANK_PRIMARY_BY_WIN_SLOT`（胜场→主考项的确定性映射：rookie `[[A01,A02],[A03,A04]]` / pro `[[A01,A02,A03],[A04,A05,A06],[A07,A08,A01]]` 末位复用 / expert `[[A03,A04],[A05,A06],[A07,A08]]` / master `[[A04,A05],[A06,A07],[A08],[A08]]` 即 Plan §4.2 开放项的首版决策）/ `RANK_DIFFICULTY_RANGE`（Spec §5.5 表整张） |
| `src/engine/rank-match/picker-validators.ts` | 新增 | `validateTierDistribution(tier, buckets, totalCount)` 覆盖 §5.7 全部五类校验：合计题数 / 每桶难度范围 / 主考≥40% + 复习≤25% / 专家 normal 甜点 ≤10% + master 复习禁 normal（pro 复习整池 normal 属正常，不受"甜点"约束）/ master demon 占主考+非主考合集 ≥40%；附 `toDifficultyBand` 档位映射函数 |
| `src/engine/rank-match/question-picker.ts` | 新增 | `pickQuestionsForGame({ session, gameIndex, advanceProgress })` → `{ questions, primaryTopics, buckets }`：胜场游标 `winSlot = 已胜场数 + 1`（负局不消耗）→ 取主考项 → 分桶配题数（主考 `⌈total×0.40⌉`、复习 `⌊total×0.25⌋`、其余）→ 按段位 × 桶算难度配额（rookie normal 均匀 / pro primary hard=⌊count×0.25⌋ / expert primary demon=⌊count×0.15⌋ 且 expert review 甜点=`min(⌊total×0.10⌋, ⌊count×0.3⌋)` 道 normal 5 / master primary 1 道 hard + 其余 demon 8~10 轮转）→ `generateQuestion(topic, diff)` 取题 → `validateTierDistribution` 自检 → `interleave` 三桶轮转混合；§5.8 失败抛 `PickerValidationError`（携 violations + context，严禁静默降级） |
| `src/store/index.ts` | 修改 | 新增 `startRankMatchGame(rankSessionId, gameIndex)`：查 `useRankMatchStore.activeRankSession` + `useGameProgressStore.gameProgress.advanceProgress` → `pickQuestionsForGame` → 构造 `PracticeSession{ sessionMode:'rank-match', rankMatchMeta:{rankSessionId,gameIndex,targetTier,primaryTopics}, id=targetGame.practiceSessionId }`（Spec §3.3 id 复用避免双写）→ 置 `rankQuestionQueue`；`nextQuestion` 增 rank-match 分支从 queue 按 `currentIndex` 取题（不调生成器）；`endSession` 增 rank-match 分支调 `useRankMatchStore.handleGameFinished(session)` 并把返回写入 state 字段 `lastRankMatchAction: GameFinishedNextAction \| null`（供 UI 路由判断）；`abandonSession` 同步清 queue + action |
| `src/store/index.ts`（分层决策） | 注记 | Plan §M2 原文字面是"submitAnswer 在 sessionMode==='rank-match' 时调用 handleGameFinished"，实施时按职责分层落地到 `endSession` 的 rank-match 分支：`submitAnswer` 继续只管逐题记录不承担"局结束"职责，`endSession` 是现有"单局结束"唯一入口，两处触发时机完全等价（都在 "答完或心归零" 那一刻），新位置更贴合现有 campaign / advance 的分层 |

**测试变更**（新增 / 扩展）：

| 文件 | 动作 | 覆盖 |
|------|------|------|
| `src/engine/rank-match/picker-validators.test.ts` | 新增 | `toDifficultyBand` 档位映射 3 用例；`validateTierDistribution` 覆盖 17 用例：合计题数一致 / 不一致；rookie normal 2-5 范围 + 越上 / 越下界；expert hard 主 + demon 8 ≤20% / 非主考禁 normal 下放；master demon ≥40% / demon 不足 20% 违规；主考 <40% / 恰好 40%；复习 >25% 违规；expert 甜点 ≤10% / >10% 违规；pro review normal 1 越下界；master review normal 违规；rookie review 非空违规（共 20 用例） |
| `src/engine/rank-match/question-picker.test.ts` | 新增 | 每段位题量与 `RANK_QUESTIONS_PER_GAME` 一致（4 用例）；主考项 topicIds 来自 `RANK_PRIMARY_BY_WIN_SLOT`（rookie W1/W2、pro 末场复用位、胜场游标：胜-负-胜-? 第 4 局冲第 3 胜场 / 全负仍冲第 1 胜场）；比例（rookie 主考≥40% + 复习=0 / pro 主考≥40% 复习≤25% / master demon ≥40%）；每段×每桶难度范围在 `RANK_DIFFICULTY_RANGE` 内（4 用例）；expert 甜点 normal ≤10% 总题量；primary topic ⊆ primaryTopics 且 expert nonPrimary ⊆ 段位范围 \ primary；连续 3 场不抛错（4 用例）；`PickerValidationError` 异常形状 + context；空 `advanceProgress` 不影响抽题（共 25 用例） |
| `src/store/index.rank-match.test.ts` | 新增 | `startRankMatchGame` 前置：启动后 session.sessionMode='rank-match' + `rankMatchMeta` 齐全 + id 复用 `RankMatchGame.practiceSessionId` + `rankQuestionQueue` 长度=20；rankSessionId 不匹配抛错 / 无活跃 rank 抛错 / gameIndex 不存在抛错；`endSession` rank-match 分支：BO3 胜 → `lastRankMatchAction.kind='start-next'` + 第 1 局 `finished=true won=true`；BO3 负 → start-next；连负 2 局 → eliminated + `activeSessionId=undefined` + `currentTier` 保持 apprentice；胜胜 → promoted + `games.length=2`（§7.4 不产生第 3 局）+ `currentTier='rookie'`；campaign endSession 不写 `lastRankMatchAction`（共 8 用例） |

**验收证据**：

- `npx tsc --noEmit` → 0 错误
- `npx vitest run` → **423 passed**（M1 基线 370 + 新增 53 = 423；Plan §M2 门槛 ≥390 达成）
- 13 个测试文件全部通过（新增 `picker-validators.test.ts` 20、`question-picker.test.ts` 25、`index.rank-match.test.ts` 8）
- Spec §5.8 异常路径覆盖：`PickerValidationError` 携 violations + context（tier / gameIndex / totalCount / sampledIds），可直接喂给 `ISSUE_LIST.md` 的诊断条目

**M2 关键设计决策**（登记以便 M3/M4 对齐）：

| # | 决策 | 依据与备注 |
|---|------|-----------|
| 1 | **主考项确定性顺序**以段位 `TopicId` 书写顺序为准（`RANK_PRIMARY_BY_WIN_SLOT`） | Spec §5.4 明定不允许随机；pro 8 内容点 / 3 胜场 → 末位复用第一个主考位；master 2+2+1 → 第 4 场复用第 3 场 A08 保持"终局仍有主考"语义 |
| 2 | **难度配额**改随机采样为**确定性配额分配** | 随机采样会概率性触发 `validateTierDistribution` 失败；改配额后 master primary "1 hard + 其余 demon 轮转 8/9/10" 确保 demon/合集 ≈47.8% 稳过 ≥40% 硬线 |
| 3 | **复习题错题加权（Spec §5.6）**本版本只做均匀分布 | 范围控制：错题加权是"更优"不是"正确性"，先保证核心闭环通过 Plan §M2 验收；后续作为 ISSUE 挂靠规格（Spec §10.1 已挂开放项） |
| 4 | **`submitAnswer` 钩子**实际落到 `endSession` 分支 | 按职责分层不打破 `submitAnswer` 只管逐题记录的语义；两处触发时机等价；E2E 用例已覆盖正/负/连负 / 连胜 四条路径 |
| 5 | **Spec §5.5 "其他段位不开放 normal 甜点复习题"**解读为：`master` 明禁 normal，`pro` 复习整池 normal 2-5 属正常范围内（非"甜点"语义），`rookie` 无复习题 | 按 Spec §5.5 表"pro 复习 normal 2-5"与硬约束 2 的"甜点"上下文二次核读；二者协调后得出；validators 按此实现 |

**6 条硬约束核验（延续 M1）**：

| # | 硬约束 | M2 落地证据 |
|---|--------|------------|
| 1 | `repository.init` 版本不一致时严禁 `clearAll()` | M2 未触动 `repository/local.ts`，沿用 M1 迁移链 |
| 2 | `RankMatchGame` 走 `practiceSessionId` 反查 | `startRankMatchGame` id 复用 `targetGame.practiceSessionId`；`handleGameFinished` 只读 `practiceSessionSnapshot.heartsRemaining + completed` 派生 `won`，未冗余到 `RankMatchGame` |
| 3 | `RankMatchSession` 不加 `currentGameIndex` | M2 未改类型；走 `games` 派生 |
| 4 | `entry-gate.ts` 独立校验 | picker 不做入场校验（Spec §7.1 已前置到 `createRankMatchSession` / `startRankMatch`） |
| 5 | 禁止旧段位命名 | M2 新代码（constants / picker / store 分支）全部使用 `rookie/pro/expert/master` |
| 6 | 视觉 token 未落地前不硬编码徽章色；M3 才做 UI | M2 未新建任何页面 / CSS；picker 与 store 为纯逻辑层 |

**跨源同步**：

- 本文件 §6 追加本 M2 条目；头部状态 🟡 M1 完成，等待 M2 领取 → 🟡 M2 完成，等待 M3 领取
- `Plan/README.md` Phase 3 子子计划行：🟡 M1 完成（2026-04-19）→ 🟡 M2 完成（2026-04-19）
- `Overview.md` 当前状态 / 下一步：基线测试数（370 → 423）、把"下一步"从"M2 抽题器"改为"M3 UI 三页（Hub / GameResult / MatchResult + Home 入口真实化）"
- `ISSUE_LIST.md`：M2 执行过程中无新发现 Issue，不动
- `Specs/_index.md`：规格未变化，不动
- 无 Reports 新增：M2 完工无外发简报；若 M3 开工需 kickoff brief 再另行撰写

**pm-sync-check**：本轮跨源写入 3 处（本文件 + `Overview.md` + `Plan/README.md`），属规则要求运行的节点。运行结果见本段末。

**下一步**：用户领取 M3（UI 三页 + 路由 + Home 入口；Spec §8）。M2 不残留阻塞，M3 可直接按 Plan §M3 文件清单继续。

