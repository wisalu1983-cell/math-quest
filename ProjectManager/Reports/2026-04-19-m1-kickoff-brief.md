# Phase 3 段位赛实施子子计划 · M1 启动简报

> 创建日期：2026-04-19  
> 用途：**一次性交接简报**，供下一 agent 领取 Phase 3 实施子子计划的 M1 里程碑前快速对齐设计决策、文件清单和硬约束。  
> 生命周期：M1 领取并启动后本文件即归档，**不登记到 `Plan/README.md`**。  
> 权威源不是本文件；所有规则以对应 Spec/Plan/CLAUDE.md 为准，本文件只做索引与提醒。
>
> **状态：✅ 已归档**（2026-04-19，M1 同日完工）。正式完工记录见 [`../Plan/v0.1/2026-04-18-rank-match-phase3-implementation.md`](../Plan/v0.1/2026-04-18-rank-match-phase3-implementation.md) §6 "2026-04-19：M1 开工 + 完工"。本文件保留作为 M1 接手时的决策快照，不再更新。

---

## 1. 你即将做什么

领取 **Phase 3 段位赛实施子子计划** 的 **M1 里程碑**：类型层 + 常量层 + 入场校验纯函数 + BO 状态机骨架 + 持久化迁移 + 最小 store。

**你不做**：抽题器（M2）、UI（M3）、整体验证与回写（M4）。

---

## 2. 权威文档阅读顺序（按"短平快"排）

1. [`CLAUDE.md`](../../CLAUDE.md)（全文，**特别留意**非显然约束新增的"存档版本升级 · 项目级原则"）
2. [`ProjectManager/Overview.md`](../Overview.md)（活跃控制面，3 分钟过一遍当前主线与状态）
3. [`ProjectManager/Plan/v0.1/2026-04-18-rank-match-phase3-implementation.md`](../Plan/v0.1/2026-04-18-rank-match-phase3-implementation.md)（你的子子计划；**重点读 §M1**）
4. [`ProjectManager/Specs/2026-04-18-rank-match-phase3-implementation-spec.md`](../Specs/2026-04-18-rank-match-phase3-implementation-spec.md)（实施级规格；**§3/§4/§6/§7 是 2026-04-19 新做了大量决策的地方，必须全读**）

其他文档按需查，不默认通读。

---

## 3. 2026-04-19 本 session 固化的关键决策

> 五个 commit 落盘；commit hash 由 `git log --oneline -6` 可查。不要在 M1 里改变这些决策——如果你实际写代码时发现有硬伤，走"回到 Spec 修规格 + 新 commit"的流程，不得在代码里绕过。

| 提交 | 决策要点 | 落地锚点 |
|---|---|---|
| **A1 段位命名统一** | `bronze/silver/gold/platinum/king` → `apprentice/rookie/pro/expert/master`；中文对应 学徒/新秀/高手/专家/大师；原"金属+紫色 + 预设 hex"徽章方案整体作废 | Spec §3.1；`Specs/2026-04-10` §5.2；`Specs/2026-04-13` §3.2 |
| **A2 难度范围硬约束** | 每段位 × 每桶（主考/非主考/复习）显式 difficulty 范围；专家复习池允许 ≤10% `normal` 甜点；大师 `demon` 占比 ≥40%；新增 `validateTierDistribution` 自检钩子 | Spec §5.5 ~ §5.8 |
| **A3 架构 4 小修** | `RankMatchGame` 去 `questionIds`/`correctness`，改走 `practiceSessionId` 反查；`RankMatchSession` 去 `currentGameIndex`，改走派生函数 `getCurrentGameIndex`；入场校验独立为 `entry-gate.ts` 纯函数；`rankMatchMeta` 新增 `primaryTopics: TopicId[]` | Spec §3.3、§3.4、§4.2、§7.1；Plan M1 文件清单 |
| **A4 BO 提前结束强制 + 存档迁移项目级原则** | BO 翻盘数学上不可能即立即 eliminated，不得再生成下一局；`repository.init` 永久废弃 `clearAll()`，必须走 `migrateV{n}ToV{n+1}` 串行迁移链 + 备份落盘 | Spec §7.4、§6.3；`CLAUDE.md` 非显然约束 |
| **B1 PM 治理轻量化** | Overview 降为"活跃控制面"；pm-sync-check 触发范围收缩到"跨源写入 / 里程碑收尾 / 生命周期变化"；三处同步改为"按角色最小同步" | `.cursor/rules/pm-sync-check.mdc`；`Plan/2026-04-19-pm-token-efficiency-optimization.md` |

---

## 4. M1 文件清单（权威源：Plan §M1；本表是同构索引，方便你一眼看全）

| 文件 | 动作 |
|---|---|
| `src/types/gamification.ts` | 修改：加 `RankTier`（apprentice~master）/ `RankMatchBestOf` / `RankMatchGame`（**不含 questionIds/correctness**）/ `RankMatchSession`（**不含 currentGameIndex**）/ `RankProgress`；`GameProgress.rankProgress?`；`GameSessionMode` 加 `'rank-match'`；`PracticeSession.rankMatchMeta.primaryTopics: TopicId[]`；删 L84/L93 两处占位裸注释 |
| `src/types/index.ts` | 修改：重导出新类型 |
| `src/constants/rank-match.ts` | 新增：段位入场表（引 `TOPIC_STAR_CAP` + `2026-04-13` §3.2）；每段位 `bestOf` / `winsToAdvance` / `questionsPerGame`（20/25/25/30）/ `timerMinutes`（仅专家大师 30）/ `newContentPoints` 字典 |
| `src/engine/rank-match/entry-gate.ts` | **新增独立纯函数文件**：`isTierUnlocked(tier, advanceProgress)` + `getTierGaps(tier, advanceProgress)`；只读 `advanceProgress` + 常量表，**不得依赖 store/repository/RankMatchSession** |
| `src/engine/rank-match/match-state.ts` | 新增：`createRankMatchSession`（内部 `require(isTierUnlocked)`）、`startNextGame`（`gameIndex = games.length + 1`）、`onGameFinished`、`getCurrentGameIndex` 派生函数；答题明细**不回写**（走 `practiceSessionId` 反查） |
| `src/repository/local.ts` | 修改：`CURRENT_VERSION: 2 → 3`；新增 `migrateV2ToV3` = `migrateRankProgressIfNeeded`；**`init()` 内"版本不一致即 `clearAll()`" 分支必须彻底移除**，改串行迁移链 + 失败写入 `mq_backup_v{old}_{ts}` 备份 + 告警（项目级原则，Spec §6.3 / `CLAUDE.md`） |
| `src/repository/local.test.ts` | 新增/扩展：v2 存档加载获得默认 `rankProgress`；v3 幂等；未知更老版本走迁移链失败备份路径（**不允许 `clearAll`**）；`clearAll` 仅作为显式用户操作保留 |
| `src/store/rank-match.ts` | 新增：最小 API = `activeRankSession` / `startRankMatch(targetTier)` / `handleGameFinished(practiceSessionSnapshot)` |

---

## 5. 项目级硬约束（违反则 M1 不通过）

1. **禁止** `repository.init` 在版本不一致时 `clearAll()`；必须迁移链 + 备份
2. **禁止**在 `RankMatchGame` 加 `questionIds` / `correctness`；走 `practiceSessionId` 反查
3. **禁止**在 `RankMatchSession` 加 `currentGameIndex`；走派生函数
4. **禁止**把入场校验实现内嵌到 `match-state.ts` / store / 组件里；必须独立 `entry-gate.ts`
5. **禁止**使用旧段位命名（bronze~king、青铜~王者）
6. **禁止**在视觉 token 落地前硬编码十六进制徽章色；M3 才做 UI，M1 不碰

---

## 6. M1 验收门槛

- [ ] `npx tsc --noEmit` 0 错误
- [ ] `npx vitest run` 整体通过数 ≥ 328（基线）+ 新增用例数
- [ ] `localStorage` 中的 v2 老存档加载后自动获得 `rankProgress: { currentTier: 'apprentice', history: [] }`，且 campaign/advance 数据完全保留（手动在 DevTools 验证）
- [ ] 按角色最小同步：本子子计划文件总是回写；`Overview.md` / `Plan/README.md` / `ISSUE_LIST.md` 仅在对应权威信息变化时更新
- [ ] 如本轮涉及跨源写入或里程碑收尾，`pm-sync-check` ✅

---

## 7. 本 session 结束时的环境快照

- 基线提交：`1963efa`（2026-04-19 PM 治理落地 + Phase 3 重排历史归档）
- 本 session 新增 **5 个 commit**（按时间顺序）：
  1. `2a7bb7f` 段位命名统一
  2. `088a324` 难度范围硬约束 + validateTierDistribution
  3. `1c87959` 架构 4 小修
  4. `b0b2999` BO 提前结束 + 存档迁移项目级原则
  5. `1963efa` PM 治理落地 + Phase 3 重排历史
- 工作区应为干净
- `ISSUE_LIST.md` 无新开 ISSUE，`ISSUE-059` 保持开放（与 Phase 3 无直接依赖）

---

## 8. 跨 workstream 说明（你不用管，但要心里有数）

- **UI 设计**：由用户在 ClaudeCode 里独立进行；M1 不产出任何 UI，M3 里程碑才承接用户设计稿实施
- **QA 方法论 skill**（B2）：**尚未从零创作** design-spec 与 implementation 计划；是另一条平行主线，待单独排期，M1 不被其阻塞
- **Phase 4/5+**：本 session 新立的"存档版本升级 · 项目级原则"从 M1 起生效，后续所有 Phase 升级必须沿用，不再为此走临时决策

---

**祝 M1 顺利；有任何设计级的歧义，回到 Spec 改 Spec + 新 commit，不在代码里绕。**
