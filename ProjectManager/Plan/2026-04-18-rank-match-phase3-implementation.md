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
> 状态：🟡 子子计划骨架已落盘，等待 M1 领取  
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
