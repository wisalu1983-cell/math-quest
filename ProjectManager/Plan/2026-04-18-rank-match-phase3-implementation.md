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
> 状态：🟡 待最终收口；全量 QA 阻塞已清，待统一提交与生命周期收口（详见 `ISSUE_LIST.md` 与 §6 最新回写）  
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

- [x] 全量 `npx tsc --noEmit` 0 错误（M4 完工节点）
- [x] 全量 `npx vitest run` 绿（M4 完工节点：459/459）
- [x] `npm run build` 绿（M4 完工节点）
- [x] `npx tsx scripts/pm-sync-check.ts` ✅（见 §6 M4 段，收口动作）
- [x] 执行 `ProjectManager/human-verification-bank.md` 里与段位赛相关的新增人工验证项（由 `test-results/phase3-rank-match/m4-user-qa-report.md` 覆盖）
- [x] 在本文件 §6 回写 M1/M2/M3/M4 的实际证据链（commit hash 待补）
- [x] 如当前主线 / 当前状态 / 下一步变化，更新 `ProjectManager/Overview.md`（收口动作）
- [x] 如本计划生命周期状态变化，更新 `ProjectManager/Plan/README.md`（收口动作）
- [x] 更新父计划 `2026-04-18-subplan-4-next-stage-expansion.md` 状态面板（本轮同步为“阻塞已清，待统一提交与收口”）
- [x] 更新祖父计划 `2026-04-16-open-backlog-consolidation.md` §三·D 段（同步最新测试基线与全量 QA 状态）
- [x] 如本阶段新发现或关闭 ISSUE，更新 `ISSUE_LIST.md`；未关闭的标注"挂靠下一阶段"（ISSUE-062/063 本轮新增并已关闭；晋级动画按用户决策不入单）

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
| 3 | **复习题错题加权（Spec §5.6）**本版本只做均匀分布（ISSUE-061 已补做 · 见下方 2026-04-19 遗留补做小节） | 范围控制：错题加权是"更优"不是"正确性"，先保证核心闭环通过 Plan §M2 验收；后续作为 ISSUE 挂靠规格（Spec §10.1 已挂开放项） |
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

### 2026-04-19：M2 遗留补做（ISSUE-060 P1 + ISSUE-061 P2）

**背景**：M2 完工复盘识别出两项遗留——`ISSUE-060`（Plan §4.1 明文列出的"单局中途刷新恢复"风险未兑现验收，阻塞 Phase 3 上线）与 `ISSUE-061`（Spec §5.6 复习题错题加权，M2 首版主动挂单为后续处理）。本小节同日（2026-04-19）独立 session 收口，TDD 红→绿，不动 M3 UI 作用域。

#### 任务 A · ISSUE-060（P1）：段位赛单局刷新恢复

**决策（方案 A 变体 A2）**

- 把本局预生成题序写入 `PracticeSession.rankQuestionQueue`（PracticeSession 本就是单局容器），随 `mq_sessions` 一并持久化 —— 比方案 B"续抽"简单得多，无需让 picker 承担"前 N 题已定"的续抽语义
- `RankMatchSession` 独立走 `mq_rank_match_sessions`（Spec §6.4），与 PracticeSession 分 key 存储，CRUD 由 repository 层提供
- 恢复路径分两层：`loadActiveRankMatch` 恢复 BO 赛事层，`resumeRankMatchGame` 恢复单局答题层——两层解耦便于 M3 UI 按"局间 / 局中"分别路由
- **一致性异常**一律抛 `RankMatchRecoveryError` + 清 `activeSessionId`（Spec §5.8 明文禁止静默降级）；启动路径对异常安静收尾（写 console.warn 不打断加载）

**代码变更**

| 文件 | 动作 | 要点 |
|------|------|------|
| `src/types/index.ts` | 扩展 | `PracticeSession` 追加 `rankQuestionQueue?: Question[]`；仅 rank-match session 写入 |
| `src/repository/local.ts` | 扩展 | 新增 `mq_rank_match_sessions` 独立 key + 4 个 CRUD 方法；`saveSession` 改为**按 id upsert**（历史 push 行为在 rank-match 多次落盘下会产生重复条目，回放时会拿到最早的空版本，ISSUE-060 修复路径必须解决此隐性约束）；`clearAll` 同步清新 key |
| `src/store/rank-match.ts` | 扩展 | 新增 `RankMatchRecoveryError` 导出；`startRankMatch` / `handleGameFinished` 每次执行都落盘；新增 `loadActiveRankMatch(userId)`：`rankProgress.activeSessionId` 为空 / 存档不存在 / userId 不匹配 / outcome 已出 → 安静清 activeSessionId 返回 null |
| `src/store/index.ts` | 扩展 | `startRankMatchGame` 把 `rankQuestionQueue` 写入 session 并立即 `saveSession`；`submitAnswer` 在 rank-match 分支每题增量 `saveSession`；新增 `resumeRankMatchGame(practiceSessionId)`：PracticeSession 不存在 / 已 completed / 缺 rankMatchMeta / rankSessionId 不一致 / queue 缺失或长度错 / 已答数越界 —— 任一项不满足抛 `RankMatchRecoveryError` + 清 `activeSessionId` |

**测试新增**

| 文件 | 动作 | 覆盖 |
|------|------|------|
| `src/repository/local.test.ts` | 扩展 | +6 条：`RankMatchSession` save/get/delete 正常路径 / 不存在返回 null / upsert 覆盖 / 多 id 精确命中 / 独立 key 不与 `mq_sessions` 混存 |
| `src/store/rank-match.test.ts` | 扩展 | +7 条：`startRankMatch` 后存档有 session / `handleGameFinished` 每次落盘 / `loadActiveRankMatch` 5 类启动恢复场景（无 activeSessionId / 正常恢复 / 存档缺失 / userId 不匹配 / outcome 已出） |
| `src/store/index.rank-match-resume.test.ts` | 新建 | +9 条：第 1 局途中刷新正常恢复（currentIndex / 题 id / hearts / totalQuestions）/ 刷新后 nextQuestion 从 queue 继续 / 局间刷新（完成 1 局但 BO 未出 outcome）/ 传"已完成"ps-id 抛错 / 4 类一致性异常（PracticeSession 不存在 / rankSessionId 不一致 / 已答>queue / queue 缺失）/ 启动即落盘 |

**硬约束核验**

| # | 硬约束 | 证据 |
|---|--------|------|
| 1 | 不允许静默降级 | 任何一致性异常必抛 `RankMatchRecoveryError` + 清 `activeSessionId`；启动路径安静收尾但仍 console.warn |
| 2 | 不碰 M3 UI 作用域 | `App.tsx` / `pages/` / `components/` 本次零改动；恢复入口通过 store 方法暴露给 M3 |
| 3 | TDD 红→绿 | 22 条新测先单跑失败（`TypeError: saveRankMatchSession is not a function` / `loadActiveRankMatch is not a function` / `RankMatchRecoveryError` 未导出等），实现后全绿 |

#### 任务 B · ISSUE-061（P2）：复习题错题频次加权

**决策**

- **窗口 N = 50** 最近错题（按 wrongAt desc 截取），写入 `REVIEW_WRONG_WINDOW` 常量
- **过滤规则**：`topicId ∈ reviewTopics` 且 `difficulty >= reviewRange.min`（§5.6 第 4 条"低档错题不沿用"——低于复习池下限的错题来自玩家早已翻页的基础字段）
- **分配算法**：保底 1 道/主题（保证"各段位覆盖全部上一段 topic"）+ 余量按原始错题次数最大余数法分配；无错题历史回落均匀分布（平局按 `reviewTopics` 原顺序决，保证确定性）
- **权重选择**（为什么用 rawCount 而不是 `1 + count` 平滑权重分余量）：保底 1 已保障主题覆盖，余量按真实次数分配更贴"近期薄弱点"直觉；用"1+count"会在 remaining 分配中再叠加均匀成分，把信号稀释
- **甜点约束不动**：专家段 review 桶 normal-5 比例由 `allocateDifficulties` 继续控制 ≤10% 总题量；本次改动只影响主题分布，不改难度分布；甜点"优先给错过的 normal 题型"由"主题加权 × 难度配额"自然组合产生

**代码变更**

| 文件 | 动作 | 要点 |
|------|------|------|
| `src/engine/rank-match/review-weighting.ts` | 新建 | `distributeReviewTopics(params)` 纯函数 + `REVIEW_WRONG_WINDOW = 50`；最大余数法分余量；count<numTopics 罕见路径按 rawCount desc 取前 count 个主题各 1 道 |
| `src/engine/rank-match/question-picker.ts` | 修改 | `PickQuestionsParams` 追加 `wrongQuestions?`；review 桶先用 `distributeReviewTopics` 预计算主题序列；`generateBucket` 新增 `topicsPerSlot?` 参数供复习桶按预计算序列映射，主考 / 非主考桶仍 round-robin 不变 |
| `src/store/index.ts` | 修改 | `startRankMatchGame` 把 `gp.wrongQuestions` 传给 `pickQuestionsForGame` |

**测试新增**

| 文件 | 动作 | 覆盖 |
|------|------|------|
| `src/engine/rank-match/review-weighting.test.ts` | 新建 | +10 条：基础契约 3（长度 / 主题合法 / count=0）/ 无历史回落 2（空输入 / 全被低档过滤）/ 加权分配 3（5:1:1:1 比例 / 保底 1 道/主题 / windowSize 窗口过滤）/ 低档过滤 1（difficulty < reviewRange.min）/ 确定性 1（相同输入相同输出） |

**硬约束核验**

| # | 硬约束 | 证据 |
|---|--------|------|
| 1 | Spec §5.5 难度范围不放宽 | `allocateDifficulties` 未改，继续覆盖 §5.5 表；`validateTierDistribution` 全量通过 |
| 2 | `validateTierDistribution` 全量校验 | 原有 20 + 25 + 8 = 53 条 picker/store 测试零回归 |
| 3 | 低档错题不整题沿用 | `distributeReviewTopics` 只加权主题（TopicId），题目由 `generateQuestion(topic, diff)` 按段位难度重生；错题原对象不进最终题序 |
| 4 | 专家 normal 甜点优先错过的 normal 主题 | 由"主题加权 × 难度配额"组合产生：专家 review 主题分布跟错题倾斜 → 在那些主题的 ≤2 道 normal-5 配额里就自然命中错题频高主题 |

#### 合并验收证据

- `npx tsc --noEmit` → 0 错
- `npx vitest run` → **15 套 / 455 tests PASS**（M2 基线 423 → 任务 A 后 445（+22）→ 任务 B 后 455（+10））
- 零测试回归；M3 UI 作用域零触碰
- 对应 `ISSUE_LIST.md` 两条 Issue 均已标记 ✅ 已关闭并附完整关闭记录

#### 跨源同步

- 本文件 §6 追加本补做条目；M2 决策表第 3 条追加 "ISSUE-061 已补做" 锚点
- `ISSUE_LIST.md`：060 / 061 从"⬜ 开放"改为"✅ 已关闭"，头部"当前开放数 3 → 1"
- `Plan/README.md` Phase 3 行追加"遗留已补做（060+061）"标注
- `Overview.md`：基线测试数 423 → 455，补做事实入账
- `Specs/_index.md`：规格未变，不动

#### 下一步

- UI 层接入入口归属 M3：`useRankMatchStore.loadActiveRankMatch(userId)` 应在 App 启动 / 用户加载完成后调用；`useSessionStore.resumeRankMatchGame(practiceSessionId)` 应在 Practice 入口判定到 rank-match 活跃且 `session==null` 时调用；M3 UI 负责对两个入口的异常（`RankMatchRecoveryError`）做"回 Hub + 提示"路由

#### pm-sync-check 结果（2026-04-19 补做）

- 执行：`npx tsx scripts/pm-sync-check.ts`
- 结果：错误 0 / 警告 1 / 信息 0
- 警告说明（**启发式误报，已评估后跳过**）：脚本在 `Plan/README.md:158` 看到"含遗留 ISSUE-060/061 已补做"字样中的 `ISSUE-060` token，启发式上下文暗示"in-progress"，但权威源 `ISSUE_LIST.md` 两条 issue 均已标记 `✅ 已关闭`；README.md:158 的实际语义是"子子计划含 M2 遗留已补做"，与 ISSUE 状态一致。此警告属脚本启发式限制，不反映真实不一致

---

### 2026-04-19：M3 开工 + 完工（同日收口）

**背景**：M2 遗留补做已收口，store 层已准备好两个恢复入口（`loadActiveRankMatch` / `resumeRankMatchGame`）。本 session 按 Spec §8 落地三个 UI 页面、注册路由、改造 Home 入口，并接入刷新恢复。

**代码变更表**：

| 文件 | 动作 | 摘要 |
|------|------|------|
| `src/styles/globals.css` | 修改 | 新增段位徽章色 `--rank-apprentice` / `--rank-rookie` / `--rank-pro` / `--rank-expert` / `--rank-master`（Spec §8.4 命名，语义：智力递进，每级色相/亮度明显区分） |
| `src/store/index.ts` | 修改 | UIStore `currentPage` 联合类型新增 `rank-match-hub` / `rank-match-game-result` / `rank-match-result` 三条路由 |
| `src/components/RankBadge.tsx` | 新增 | 段位徽章小组件；emoji 映射（学徒📖/新秀🌱/高手⚡/专家💎/大师🔥）；颜色严格走 `var(--rank-*)` CSS 变量；支持 sm/md/lg 尺寸、showLabel、dimmed 属性 |
| `src/pages/RankMatchHub.tsx` | 新增 | 段位赛大厅；五段位卡片（已解锁可点/未解锁灰态+星级缺口/已通过标注）；`activeRankSession` 存在时改为进行中赛事卡（含胜负矩阵 + "继续第X局"按钮）；异常用 errorMsg state 展示，不抛 |
| `src/pages/RankMatchGameResult.tsx` | 新增 | 单局结算中间页；展示本局胜负、BO 累计比分、胜负矩阵；3 秒倒计时自动跳转；`lastRankMatchAction.kind` 判断：`start-next` → `startRankMatchGame` + practice，`promoted/eliminated` → `rank-match-result` |
| `src/pages/RankMatchResult.tsx` | 新增 | BO 总结算页；晋级展示段位升级动画、未晋级展示薄弱题型前 3（最近 2 局错题按 primaryTopics 聚合）；`rankSession.games.length < bestOf` 时显示"BO{n} 第{k}局定胜负"提前结束标注（Spec §7.4）；返回 Hub |
| `src/App.tsx` | 修改 | 注册三条新路由页面；`useEffect[user]` 中加 `loadActiveRankMatch(user.id)` 调用；`RankMatchRecoveryError` → `console.warn` + 路由回 `rank-match-hub` |
| `src/pages/Home.tsx` | 修改 | 导入 `useRankMatchStore`、`isTierUnlocked`、`getTierGaps`、`RANK_BEST_OF`、`RankBadge`；进阶训练副文案改为"刷星升级，积累段位赛入场资格"；新增独立段位赛卡片：活跃赛事显示"继续挑战：X BO{n}" + 胜负情况，否则按 currentTier 展示下一可挑战段位 / 缺口提示 |
| `src/pages/Practice.tsx` | 修改 | 导入 `useRankMatchStore`、`RankMatchRecoveryError`；解构 `resumeRankMatchGame`；新增 `useEffect`：`activeRankSession && !session` 时调 `resumeRankMatchGame(lastUnfinishedGame.practiceSessionId)`，捕获 `RankMatchRecoveryError` → 路由回 Hub；`handleNext` 增 rank-match 分支：`endSession()` 后若 `completedSession.sessionMode === 'rank-match'` 则跳 `rank-match-game-result`；题头新增 BO 进度徽标行（段位名称 · BO{n} · 第{x}局） |
| `src/store/index.rank-match-pages.test.ts` | 新增（测试）| 4 条 UIStore 新路由类型 TDD 测试（红测试先写，tsc TS2345 证明红，UIStore 类型扩展后绿） |

**测试变更表**：

| 测试文件 | 变化 |
|----------|------|
| `src/store/index.rank-match-pages.test.ts` | +4 条：`rank-match-hub` / `rank-match-game-result` / `rank-match-result` 跳转 + 回 home |

**验收证据**：

- `npx tsc --noEmit`：**0 错误**（含所有新 `.tsx` 文件类型检查）
- `npx vitest run`：**459 通过 / 0 失败**（基线 455 + 本次 +4）
- 所有段位徽标色经 CSS 变量，无十六进制硬编码（grep `--rank-` 验证）
- `pm-sync-check`：错误 0 / 警告 1（同 M2 遗留补做同一启发式误报，已评估跳过）

**6 条硬约束核验**：

| # | 硬约束 | 核验结果 |
|---|--------|---------|
| 1 | TDD 红→绿 | `index.rank-match-pages.test.ts` 4 条先写（tsc TS2345 证红），UIStore 类型扩展后绿 ✅ |
| 2 | 不允许静默降级 | App.tsx `loadActiveRankMatch` 异常：捕获 `RankMatchRecoveryError` → 路由回 Hub + `console.warn`；Practice.tsx `resumeRankMatchGame` 异常：同路由回 Hub；无任何吞异常分支 ✅ |
| 3 | 路由走 `useUIStore.currentPage` | 全部页面跳转经 `setPage()`，无 `react-router` 调用 ✅ |
| 4 | Store 拆分规矩 | 段位赛 store 数据用 `useRankMatchStore`，无 `useProgressStore` 废弃旧名 ✅ |
| 5 | 基线不退 | 基线 455 → 收口 459，tsc 0 错 ✅ |
| 6 | 段位徽章色走 CSS 变量 | `globals.css` 定义 `--rank-*` 5 个变量；`RankBadge.tsx` 用 `var(--rank-${tier})`；Hub/GameResult/MatchResult/Home 均 `var(--rank-*)` 取色，无硬编码十六进制 ✅ |

**M3 关键设计决策**：

| # | 决策 | 原因 |
|---|------|------|
| 1 | CSS 变量命名按 Spec §8.4（`--rank-apprentice` 等）而非 Plan 文件草案（`--rank-bronze` 等） | Spec 是权威源；Plan 草案用的是旧命名方案，规格明确已随命名升级整体作废 |
| 2 | `RankMatchGameResult` 从 `useSessionStore.lastRankMatchAction` 取路由 action | action 在 `endSession()` 时由 store 写入；GameResult 只读，不需要自行调 handleGameFinished |
| 3 | 薄弱题型用 `primaryTopics[0]` 兜底聚合（Spec §10.1 兜底策略） | rank-match session 的 `topicId` 字段是"兼容占位"（types/index.ts L218），读路径一律走 `rankMatchMeta` |
| 4 | App.tsx 的 `loadActiveRankMatch` 在 `useEffect[user]` 中调用 | user 加载完成才有 userId；与 `loadGameProgress` 同一 effect，确保时序正确 |
| 5 | Practice 恢复异常路由到 Hub（非 Home） | 用户上下文明确是段位赛，直接回 Hub 比回 Home 体验更连贯；Spec §5.8 仅要求"显式路由"，未限制目标 |

**pm-sync-check 结果（M3 完工）**：

- 执行：`npx tsx scripts/pm-sync-check.ts`
- 结果：错误 0 / 警告 1 / 信息 0
- 警告说明（**启发式误报，已评估后跳过**）：同 M2 遗留补做章节描述；README.md:158 历史记录包含 ISSUE-060 token，权威源 ISSUE_LIST.md 已标 ✅ 关闭，不反映真实不一致

**下一步**：领取 M4（验证 + 回写 + 整体 pm-sync-check）。

### 2026-04-19：M4 开工 + 完工（同日收口）

**整体思路**：M4 从"单纯回写"扩展为"build 修复 + 真·用户旅程 E2E + 文档收口"。M3 完工后首次跑 `npm run build` 发现 5 个 build-only 报错（`tsc --noEmit` 不覆盖的类型/erasableSyntaxOnly 路径），用户决策"归到 M4 验证项，由 QA leader 一并处理"。E2E 过程暴露两个真 bug（hooks 顺序错、单局推进时 next game placeholder 缺失），一并修复。

**本里程碑实际涉及的改动**（git 未 commit 前的工作目录状态）：

1. **Build 修复（M3 设计审查漏网）**：
   - `src/utils/ui-accessibility.ts` 的 `AppPage` 联合类型 + `PAGE_TITLES` 补上 `rank-match-hub / rank-match-game-result / rank-match-result`
   - `src/engine/rank-match/question-picker.ts::PickerValidationError` 把 constructor parameter properties 改成显式 `readonly` 声明，配合 `erasableSyntaxOnly`
   - `src/store/rank-match.ts::RankMatchRecoveryError` 同上
   - `src/pages/RankMatchGameResult.tsx` 去掉未使用的 `RankTier` import
   - `src/pages/RankMatchResult.tsx` 去掉未使用的 `eliminated` 局部变量

2. **ISSUE-062（M4 新发现并修复）· Practice hooks 顺序**：
   - 现象：E2E 跑段位赛第 1 局结算时，React 抛 `Rendered fewer hooks than expected`
   - 根因：`src/pages/Practice.tsx` 有一条 `if (!currentQuestion) return <LoadingScreen />` 早退位于 `useCallback / useEffect` 之前；`currentQuestion` 在组件生命周期中可能为 `null`（段位赛结算时 session 被清），违反 hooks 规则
   - 修复：把早退移到所有 hook 之后；依赖 `currentQuestion` 的派生量改用 `currentQuestion?.` 可空访问
   - 回归验证：459/459 vitest + E2E 22/22 PASS

3. **ISSUE-063（M4 新发现并修复）· startRankMatchGame 找不到下一局 placeholder**：
   - 现象：E2E 跑 GameResult → `navigateNext()` 时 `startRankMatchGame(rank.id, games.length + 1)` 抛 `gameIndex 2 not found`
   - 根因：`rank-match.handleGameFinished` 仅在 BO 层更新战绩，**没有**把下一局 placeholder 追加到 `games[]`；UI 层的 `RankMatchGameResult.navigateNext` 期望 `games[next]` 已存在
   - 修复方案：在 `session` 层的 `startRankMatchGame` 里按需 inflate：若 `gameIndex === games.length + 1 && !session.outcome`，通过 `match-state.startNextGame` 生成 placeholder（预分配 `practiceSessionId` + 落盘）
   - 为什么 inflate 放 session 层而非 BO 层：保持 `getCurrentGameIndex(activeRankSession)` 的"局间 undefined"语义不变，刷新恢复仍能正确分流到 GameResult / 下一局路径；单测 `index.rank-match-resume.test.ts` 的场景 3 不用动
   - 回归验证：
     - 补测 `rank-match.test.ts / index.rank-match.test.ts` 中"start-next 时不手工推进也能跑第 2 局"的断言
     - 459/459 vitest + E2E 22/22 PASS

4. **E2E 拟真 QA（`agent-as-user-qa` 协议）**：
   - 新增脚本 `test-results/phase3-rank-match/m4-e2e.mjs`：自写 Playwright，走完整旅程（onboarding → Home → Hub → 新秀 BO3 两连胜晋级 → Home/Hub 显示"已通过" → 重置后连败走 MatchResult 失败复盘 → 刷新恢复）
   - `src/store/index.ts` / `src/store/rank-match.ts` 在 `import.meta.env.DEV` 下把 `useUIStore / useSessionStore / useGameProgressStore / useRankMatchStore` 挂到 `window.__MQ_*__` 作为 E2E 钩子；生产构建不打包（`import.meta.env.DEV` 在 prod 为 false），不扩大攻击面
   - 四栏报告：`test-results/phase3-rank-match/m4-user-qa-report.md`
   - 原始数据：`m4-e2e-raw.json`；截图证据：`m4-user-qa-artifacts/`
   - 结果：**22 条 PASS / 0 FAIL / 0 RISK / 0 BLOCKED**

**M4 验收项完成情况**：

- [x] 全量 `npx tsc --noEmit` 0 错误（build 链路内隐式验证）
- [x] 全量 `npx vitest run` 绿（459/459，含 ISSUE-063 修复后的补测）
- [x] `npm run build` 绿（见本段第 1 条修复后）
- [x] E2E 主路径 + 刷新恢复 + 失败复盘全部 PASS（`m4-user-qa-report.md`）
- [x] `npx tsx scripts/pm-sync-check.ts` ✅（本轮回写完成后已复跑，全绿）
- [x] `human-verification-bank.md` 段位赛条目：Phase 3 的核心体验条目已由 `m4-user-qa-report.md` 覆盖；人工验证入口文件本批不单独新增，避免与本报告重复
- [x] 本文件 §6 回写完成（即当前段）
- [x] `Overview.md` 更新（已同步 `ISSUE-064` 关闭与全量 QA 复跑结果）
- [x] `Plan/README.md` 更新（已同步“待最终收口”状态）
- [x] 父计划 `2026-04-18-subplan-4-next-stage-expansion.md` 状态面板更新（已同步“阻塞已清，待统一提交与收口”）
- [x] 祖父计划 `2026-04-16-open-backlog-consolidation.md` §三·D 段更新（已同步 `vitest 473/473` 与全量 QA 全绿）
- [x] `ISSUE_LIST.md`：ISSUE-062 / ISSUE-063 新增并标 ✅ 已关闭；晋级动画（M3 设计审查 m-3 漏网）按用户决策**不入 ISSUE_LIST**，只在本段记录

**关于晋级动画（M3 设计审查 m-3）**：

- 现象：MatchResult 晋级时的段位徽章切换是静态文本 `学徒→新秀`，无动画
- 设计审查曾建议补一段 600ms 级粒子/徽章放大动画
- 本阶段决策（用户选 B）：**不挂 ISSUE_LIST、不开子计划**；留待 Phase 3 上线后用真实用户反馈决定是否投入
- 风险确认：不影响功能闭环与核心体验（晋级信息依然可见 + 段位已落盘）；仅为 P3 惊喜感优化

**Commit hash**：本次 M3+M4 连同 build 修复尚未 commit（工作目录状态如 `git status` 所示）；由 PM 审阅本段 + `m4-user-qa-report.md` 后统一提交，hash 待补回此段。

**下一步**：补跑开新号全量回归并判断是否可以真正收口；若出现阻塞项，则先回到实现层修复后再做统一 commit。

### 2026-04-19：补跑开新号全量回归（QA Leader），发现 `ISSUE-064`

**背景**：M4 段主要覆盖“段位赛定向 E2E + build 修复 + 四栏回写”。为回答“开新号全量跑一次这个 MathQuest 游戏”的任务，本轮又按 QA Leader 三层流程追加了从新账号起步的整链回归，覆盖新号主路径、中盘夹具、段位赛夹具与工程基线。

**新增产物**：

- `ProjectManager/QA/2026-04-19-full-regression/test-cases-v1.md`
- `ProjectManager/QA/2026-04-19-full-regression/full-regression.mjs`
- `ProjectManager/QA/2026-04-19-full-regression/auto-result.md`
- `ProjectManager/QA/2026-04-19-full-regression/batch-1-fresh-user-result.md`
- `ProjectManager/QA/2026-04-19-full-regression/batch-2-advance-result.md`
- `ProjectManager/QA/2026-04-19-full-regression/batch-3-rank-match-result.md`
- `ProjectManager/QA/2026-04-19-full-regression/artifacts/`

**结果摘要**：

- Fresh User：10/10 PASS
- Advance & Persistence：6/6 PASS
- Rank Match：8/9 PASS
- 自动化基线：
  - `npm run build` ✅
  - `npx vitest run` ✅（459/459）
  - `npm run lint` ❌（127 条现有基线 error，已记入 `auto-result.md`）

**唯一真实失败**：

- `D-07 / ISSUE-064`：段位赛局内刷新后，应用回到 `home`，只显示“继续挑战：新秀 BO3”卡片，**没有直接恢复到当前 `practice`**
- 数据层面未丢局、未丢题序，说明 `loadActiveRankMatch` 能恢复 BO 层；但局内 `PracticeSession` 的恢复只挂在 `Practice.tsx` 页面 effect，刷新后默认页停在 `home`，导致这段恢复逻辑没有执行机会
- 该问题违背实施级 Spec §5.8 “回到刚才那一刻”的恢复要求，因此本计划状态从“待收口”改为“阻塞收口”

**结论**：

- M1~M4 的**代码落地与定向验证**仍成立，`ISSUE-062` / `ISSUE-063` 也确已修复
- 但以“全量 QA / 开新号全链路”口径看，Phase 3 还**不能**宣布关闭；必须先修 `ISSUE-064`，再复跑对应批次

**下一步**：修复 `ISSUE-064` → 复跑 `D-07` 与 Rank Batch → 若恢复全绿，再继续父/祖计划与生命周期收口动作。

### 2026-04-19：修复 `ISSUE-064` 并复跑 D-07 / Rank Batch

**背景**：上一条回写确认了 Phase 3 在“定向验证”口径下成立，但开新号全量回归的 `D-07` 暴露出最后一个真实阻塞项：段位赛局内刷新后只回到 Home 活跃卡片，没有直接恢复到当前 `Practice`。同一轮设计讨论又把“主动中断 / 放弃重开”的长期语义一并钉成可持久化会话状态，以兼容后续本地存档与账号系统。

**本轮设计收口**：

- `RankMatchSession` 引入生命周期状态：`active / suspended / completed / cancelled`
- “意外退出”仍由启动期自动恢复兜底
- “主动中断”不再自动直跳 `Practice`，而是回到 `RankMatchHub` 让用户自己继续或重开
- “放弃，重新开始”对用户视角等同删除，但底层保留 `cancelled` 会话记录，不写入可见历史，不影响段位结算

**代码变更**：

| 文件 | 动作 | 要点 |
|------|------|------|
| `src/types/gamification.ts` | 修改 | `RankMatchSession` 追加 `status / suspendedAt / cancelledAt`；新增 `RankMatchSessionStatus` |
| `src/engine/rank-match/match-state.ts` | 修改 | `createRankMatchSession` 默认 `status='active'`；终局 `onGameFinished` 写 `status='completed'` |
| `src/repository/local.ts` | 修改 | 对旧 `mq_rank_match_sessions` 做 **read-time 归一化**：缺 `status` 且无 `outcome` → `active`，有 `outcome` → `completed`；归一化后立即回写 |
| `src/store/rank-match.ts` | 修改 | 新增 `suspendActiveMatch / reactivateSuspendedMatch / cancelActiveMatch`；`loadActiveRankMatch` 识别 `suspended` 并拒绝恢复 `cancelled / completed` |
| `src/store/index.ts` | 修改 | 新增 `suspendRankMatchSession / cancelRankMatchSession`；`resumeRankMatchGame` 从已答记录重建 `pendingWrongQuestions`，避免刷新/中断后丢错题累计 |
| `src/engine/rank-match/recovery-policy.ts` | 新增 | 把启动恢复分流提成纯函数：`auto-resume-practice / stay-home / clear-and-ignore` |
| `src/App.tsx` | 修改 | 启动期恢复改为在 **用户加载/刷新启动** 时执行；`active + unfinished` 自动恢复到 `practice`，不再把页面切换误判成一次“启动恢复” |
| `src/pages/Practice.tsx` | 修改 | 段位赛退出弹窗改为 `继续练习 / 中断并保存 / 放弃，重新开始`；新增二次确认 |
| `src/pages/RankMatchHub.tsx` | 修改 | `suspended` 会话显示“中断中的挑战”，支持继续当前对局或放弃重开 |
| `src/pages/Home.tsx` | 修改 | 活跃赛事卡片增加“中断中的挑战”提示文案 |

**测试新增 / 扩展**：

| 文件 | 动作 | 覆盖 |
|------|------|------|
| `src/engine/rank-match/match-state.test.ts` | 扩展 | 新会话默认 `status='active'`；终局写 `status='completed'` |
| `src/repository/local.test.ts` | 扩展 | 旧 `RankMatchSession` 缺 `status` 的归一化 |
| `src/store/rank-match.test.ts` | 扩展 | `suspend / reactivate / cancel` 三条状态流转；`loadActiveRankMatch` 对 `suspended / cancelled` 的处理 |
| `src/store/index.rank-match-lifecycle.test.ts` | 新增 | `suspendRankMatchSession` / `cancelRankMatchSession` 行为 |
| `src/store/index.rank-match-resume.test.ts` | 扩展 | `resumeRankMatchGame` 会重建 `pendingWrongQuestions` |
| `src/engine/rank-match/recovery-policy.test.ts` | 新增 | 启动恢复纯函数分流 |

**验收证据**：

- `npx vitest run` → **18 files / 473 tests PASS**
- `npm run build` → ✅
- `ReadLints`（本轮变更文件）→ 无新增 lint error
- `ProjectManager/QA/2026-04-19-full-regression/full-regression.mjs` 复跑两次：
  - 第 1 次：`D-07` 转绿，但暴露 `D-01` 被 `App.tsx` 的 effect 依赖误触发
  - 第 2 次（收紧 `App` 启动恢复 effect 后）：Fresh 10/10 PASS，Advance 6/6 PASS，Rank 9/9 PASS，`console critical total: 0`
- 关键观察：
  - `D-07`：`刷新前 index=5 qid=kinzfgUaTZ；刷新后 page=practice index=5 qid=kinzfgUaTZ`
  - `D-08`：仍保持 `刷新后 page=home；可继续赛事=true`

**结论**：

- `ISSUE-064` 已关闭
- Phase 3 在“开新号全量回归”口径下的最后一个阻塞项已清除
- 当前真正开放问题只剩 `ISSUE-059`（非当前主线）

**下一步**：统一提交本轮代码与文档改动，继续执行父计划 / 祖父计划的最终收口动作。

