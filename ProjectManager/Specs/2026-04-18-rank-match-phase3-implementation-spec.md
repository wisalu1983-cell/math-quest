# Phase 3 段位赛 — 实施级规格

> 创建：2026-04-18  
> 状态：🟡 草案（待用户确认）  
> 前置产品规格：[`2026-04-10-gamification-redesign.md`](2026-04-10-gamification-redesign.md) §5 / §8 Q9、[`2026-04-13-star-rank-numerical-design.md`](2026-04-13-star-rank-numerical-design.md) §3 / §4、[`2026-04-15-gamification-phase2-advance-spec.md`](2026-04-15-gamification-phase2-advance-spec.md)  
> 承接子计划：[`../Plan/2026-04-18-subplan-4-next-stage-expansion.md`](../Plan/2026-04-18-subplan-4-next-stage-expansion.md)（子计划 4 Umbrella，本阶段唯一主线）  
> 对应实施子子计划：`Plan/2026-04-XX-rank-match-phase3-implementation.md`（待立）

---

## 1. 目标与范围

### 1.1 目标

把 [`2026-04-10-gamification-redesign.md`](2026-04-10-gamification-redesign.md) §5 的段位赛产品级规则，落到可以直接指导 T 字任务与代码提交的实施级规格。本规格覆盖：

- 段位赛**数据模型**（类型层扩充、`rankProgress` 形状、存档迁移）
- 段位赛**会话模型**（扩展 `PracticeSession` vs 新建独立结构的决策与方案）
- 段位赛**状态机**（入场校验 → BO 多局编排 → 单关生命流转 → 晋级/失败结算）
- 段位赛**抽题器算法**（新内容点、主考项、复习题、难度分布）
- 段位赛**存档迁移策略**（`CURRENT_VERSION` 升级 + 旧存档兼容）
- 段位赛**UI 信息架构**（Home 入口 / Hub / Session / Result 四个页面的数据流与交互骨架）

### 1.2 本规格不做什么

- 不复述产品层规则（出题范围 / BO 编排 / 入场星级等）；按事实源分工直接引用 `2026-04-10` 与 `2026-04-13`
- 不给具体的视觉稿（UI Spec `2026-04-14-ui-redesign-spec.md` 已提供视觉语言，页面实现时直接继承）
- 不给赛季、赛季奖励、社交等后续扩展（Phase 3 当前只做"五段位 + BO + 晋级"闭环）

### 1.3 跨系统维度清单（本规格改动）

- [x] GameSessionMode 枚举 / GameProgress 形状
- [x] 持久化 / 存档迁移
- [x] 答题形式 / 验证逻辑（复用 v2.2 生成器，不新增）
- [x] UI 组件（新增段位赛三页 + Home 入口真实化）
- [ ] 难度档位 / 题型梯度数（不改）
- [ ] 关卡结构 / campaign.ts（不改）
- [ ] `TopicId` 枚举（不改）
- [ ] 真题库（不涉及）

---

## 2. 事实源引用分工

按 `_index.md` 与两份产品规格文件头部的"Phase 3 事实源分工"声明：

| 维度 | 事实源 | 本规格处置 |
|------|--------|------------|
| 段位赛出题范围（新秀 A01~A04 等）| `2026-04-10` §5.2 | 算法按其读取；不自行重述 |
| BO 赛制 / 晋级胜场数 W（BO3=2、BO5=3、BO7=4）| `2026-04-10` §5.3 | 状态机直接使用 W 值；不自行重述 |
| 单关规则（题量 20~30、心×3、计时）| `2026-04-10` §5.3 | 算法按其实现；本规格给出每场题量的**首版取值**（见 §5.3）|
| 胜场编排（新内容点 / 主考项 ≥40% / 复习题 ≤25%）| `2026-04-10` §8 Q9 | 抽题器直接实现；本规格给出执行细则（见 §5）|
| 段位入场星级数值表 | `2026-04-13` §3.2 | 入场校验算法直接读取；不自行重述 |
| 心→星级换算 / 心数门槛 | `2026-04-13` §2 / §3.1 | 直接复用 `src/engine/advance.ts::getStars` |
| 时间节奏估算（理论天数、局数） | `2026-04-13` §4 | 本规格不涉及 |

---

## 3. 数据模型（类型层）

### 3.1 新增 `RankTier` 枚举

```typescript
// src/types/gamification.ts
export type RankTier = 'apprentice' | 'rookie' | 'pro' | 'expert' | 'master';
```

> 中英映射：学徒 = `apprentice`、新秀 = `rookie`、高手 = `pro`、专家 = `expert`、大师 = `master`。
>
> 学徒（apprentice）= 初始标签，无段位赛逻辑；`currentTier = 'apprentice'` 表示"尚未通过任何段位赛"。
>
> 原金属+紫色命名方案（青铜/白银/黄金/铂金/王者 + `bronze~king`）已全面废弃；**不得在代码或文档里再引入**。

### 3.2 新增 `RankMatchBestOf`

```typescript
export type RankMatchBestOf = 3 | 5 | 7;
```

> 与 §5.3 表格一一对应：新秀 BO3、高手 BO5、专家 BO5、大师 BO7。

### 3.3 `RankMatchGame` — 单关记录（已完成或进行中）

```typescript
export interface RankMatchGame {
  /** 该局在 BO 序列里的序号，1-based，连续递增 */
  gameIndex: number;
  /** 单局是否已打完 */
  finished: boolean;
  /** 单局是否胜（答完且剩 ≥1 心），finished=false 时为 undefined */
  won?: boolean;
  /** 单局使用的题目 id 序列（从池子里固化下来，便于复盘/回放） */
  questionIds: string[];
  /** 该局每题的对错序列（长度与 questionIds 相同），未答完为 undefined */
  correctness?: boolean[];
  /** 开始 / 结束时间戳 */
  startedAt: number;
  endedAt?: number;
}
```

### 3.4 `RankMatchSession` — 整个 BO 赛事

```typescript
export interface RankMatchSession {
  id: string;
  userId: string;
  /** 挑战的目标段位（不等于当前段位，是"打赢就晋级到"的那个段位） */
  targetTier: Exclude<RankTier, 'apprentice'>;
  bestOf: RankMatchBestOf;
  /** 达到该胜场数即晋级 */
  winsToAdvance: number; // = (bestOf + 1) / 2
  /** BO 序列里的所有已打或已开始的局；按 gameIndex 顺序 */
  games: RankMatchGame[];
  /** 当前活跃局序号；undefined 表示整个 BO 已结束 */
  currentGameIndex?: number;
  /** BO 整体结束后的结论：晋级 / 未晋级 */
  outcome?: 'promoted' | 'eliminated';
  startedAt: number;
  endedAt?: number;
}
```

### 3.5 `RankProgress` — 跨 session 的段位持久化

```typescript
export interface RankProgress {
  /** 当前已达到的最高段位 */
  currentTier: RankTier;
  /** 每段位的尝试历史（时间顺序），用于复盘、失败统计、UI 展示 */
  history: Array<{
    targetTier: Exclude<RankTier, 'apprentice'>;
    outcome: 'promoted' | 'eliminated';
    startedAt: number;
    endedAt: number;
  }>;
  /** 正在进行但未结束的 BO；同一时刻最多 1 场 */
  activeSessionId?: string;
}
```

### 3.6 `GameProgress` 扩展

```typescript
export interface GameProgress {
  userId: string;
  campaignProgress: Partial<Record<TopicId, TopicCampaignProgress>>;
  advanceProgress: AdvanceProgress;
  rankProgress?: RankProgress; // ← 新增
  wrongQuestions: WrongQuestion[];
  totalQuestionsAttempted: number;
  totalQuestionsCorrect: number;
}
```

> `rankProgress` 设为可选字段：旧存档读进来时为 `undefined`，由 `repository.getGameProgress` 用默认值 `{ currentTier: 'apprentice', history: [] }` 回填（见 §6）。

### 3.7 `GameSessionMode` 扩展

```typescript
export type GameSessionMode = 'campaign' | 'advance' | 'wrong-review' | 'rank-match';
```

### 3.8 代码侧占位注释的处置

当前 `src/types/gamification.ts`：
- L84 `// Phase 3 追加 rankProgress` → 替换为真实 `rankProgress?: RankProgress` 字段
- L93 `// Phase 3 追加 'rank-match'` → 替换为真实枚举项

`_index.md` 与 Umbrella Plan 已要求：这两处裸占位注释**必须**在 M1 里程碑内被替换，不允许长期留存。

---

## 4. 会话模型决策（本规格最重要的架构拍板）

### 4.1 决策：**扩展 `PracticeSession`** + **独立 `RankMatchSession`** 双结构共存

段位赛天然是"多题型混合 + BO 多局包装"，与现有 `PracticeSession`（单 `topicId` + 线性题序）不完全匹配。本规格采用**双结构共存**方案而非单一结构方案：

- **`RankMatchSession`**（见 §3.4）承载"BO 赛事级"状态 —— 跨局的胜场累计、目标段位、每局引用
- **每一局仍然走 `PracticeSession`** —— 心×3、20~30 题、线性答题；只是通过新增字段标识它归属于哪个段位赛

### 4.2 `PracticeSession` 的微调

新增 `rankMatchMeta` 可选字段：

```typescript
export interface PracticeSession {
  // ...既有字段
  sessionMode: GameSessionMode; // 新值 'rank-match'
  topicId: TopicId;             // 段位赛场景下仅作"该局占主导的主考题型"标签，不代表唯一题型
  rankMatchMeta?: {
    rankSessionId: string;      // 关联 RankMatchSession.id
    gameIndex: number;          // 该局是 BO 里的第几局（1-based）
    targetTier: Exclude<RankTier, 'apprentice'>;
  };
  // questions: QuestionAttempt[] 继续承载该局的 20~30 道混合题
}
```

### 4.3 为什么采用"双结构"而非合并

| 方案 | 做法 | 优劣 |
|------|------|------|
| A. 单一扩展 `PracticeSession`（给它加"BO 列表"字段） | 让 `PracticeSession` 同时承载单局与赛事 | 语义污染：`heartsRemaining`、`completed` 等字段在 BO 层面毫无意义；`questions` 数组变成二维需要特殊处理 |
| B. 单一新建 `RankMatchSession`（段位赛完全绕开 `PracticeSession`）| 段位赛自建完整答题流 | 会复制一份 `store/index.ts` 里 `submitAnswer`、心数扣除、对错判定、错题入库逻辑；维护成本高 |
| **C. 双结构共存（本规格选用）** | `RankMatchSession` 做 BO 层，每局仍是 `PracticeSession` | 复用现有答题主循环；赛事层与单局层职责清晰；存档与迁移代价最小 |

### 4.4 答题流复用

- `store.submitAnswer` 不动主循环；段位赛的单局走同一链路
- 段位赛单局结束时（答完或心归零），由 `store` 判定该局 `won = heartsRemaining >= 1 && 所有题答完`，回写到 `RankMatchSession.games[i].won`
- 晋级 / 淘汰由 `RankMatchSession` 层判定：累计胜场 ≥ `winsToAdvance` 则 `outcome = 'promoted'`；剩余局数不足以翻盘则 `outcome = 'eliminated'`

---

## 5. 抽题器算法

### 5.1 输入

- `targetTier`：目标段位
- `gameIndex`：当前是 BO 里的第几局（1-based）
- `winsToAdvance`（W）：晋级所需胜场数
- 只读字典：`2026-04-10` §5.2 出题范围表、§8 Q9 新内容点表、`2026-04-13` §3.2 入场星级表
- 用户的 `advanceProgress`（用于推断当前星级与难度档位倾向）

### 5.2 输出

长度为"本场题量"（见 §5.3）的 `Question[]` 数组，按照以下分布生成：

| 类别 | 占比约束 | 来源 |
|------|---------|------|
| **主考项** | ≥40% | 当前段位的"新内容点"映射到具体题型 + 难度档 |
| **段位范围内非主考题** | 剩余比例 | 当前段位出题范围内、但本场不作为主考项的题型 |
| **复习题（来自之前段位）** | ≤25% | 之前段位的新内容点对应题型；可进一步按用户 `advanceProgress` 里薄弱题型加权 |

### 5.3 每场题量首版取值

`2026-04-10` §5.3 规定 "20~30 题/场"；本规格给出具体首版取值供 M2 里程碑直接使用：

| 段位 | 每场题量 | 计时 |
|------|---------|------|
| 新秀（BO3）| **20 题** | 无 |
| 高手（BO5）| **25 题** | 无 |
| 专家（BO5）| **25 题** | 30 分钟 |
| 大师（BO7）| **30 题** | 30 分钟 |

> 这组数值在实施子子计划 M2 验收时按 playtest 复核；如需调整，走"改这个实施规格 + 回写四处"的流程，不得在代码里改硬编码后绕过规格。

### 5.4 胜场编排

按 `2026-04-10` §8 Q9："新内容点预先分配到第 1~W 个胜场，顺序固定。"

- 本规格将"新内容点顺序"作为**确定性排序**，以段位规格表的书写顺序为准（不允许随机）
- 抽题器需要维护一个"虚拟胜场游标"——它随 `RankMatchSession.games` 里胜场数递增，而不是 `gameIndex`（因为中间可能有败局）
- 若用户在第 N 局败北，第 N+1 局仍然使用"原本第 N 胜场"的主考项安排，直到打赢为止

### 5.5 难度范围硬约束（per tier × per bucket）

每场抽题必须同时满足三桶（主考项 / 非主考 / 复习题）的难度范围硬约束，**任一桶越界即视为抽题失败**（走 §5.8 兜底）。本表以 `2026-04-10` §5.2 的"段位出题难度"为产品语义底线，在实施级把隐性约束写死：

| 段位 | 主考项 difficulty | 非主考 difficulty | 复习题 difficulty（来自之前段位）| 复习题比例 |
|---|---|---|---|---|
| 新秀（BO3）| `normal` 2-5 | `normal` 2-5 | — | — |
| 高手（BO5）| `normal` 3-5 或 `hard` 6（按用户该题型星级动态调配）| `normal` 3-5 | `normal` 2-5（来自新秀） | ≤25% |
| 专家（BO5）| `hard` 6-7 为主，`demon` 8 允许且 ≤20% 本场题量 | `hard` 6-7 | `hard` 6-7 为主；**允许 ≤10% 本场复习题 落到 `normal` 5（"甜点"回顾，仅此段位开放）** | ≤25% |
| 大师（BO7）| `hard` 6-7 与 `demon` 8-10 混合，`demon` 占比 ≥40%（兜底下限，避免 BO7 掉档到纯 `hard`）| `hard` 6-7 | `hard` 6-7（来自专家） | ≤25% |

**关键硬约束（违反即抽题失败，不允许静默降级）**：

1. **非主考桶不允许"下放"**：例如专家段位的非主考项不得落到 `normal`，即便用户该题型星级较低——段位即资格线，进入赛场即按段位规格出题
2. **仅专家段位开放 `normal` 甜点**：专家的复习题池允许最多 10% 的 `normal` 5 做"久违的温暖回顾"以降低整体挫败感；**新秀/高手/大师不开放任何 normal 甜点复习题**
3. **大师 demon 占比下限**：大师的主考+非主考合起来的 `demon` 占比不得低于 40%，确保终极段位保持峰值难度
4. **用户星级只在高手主考项内微调 `normal` ↔ `hard` 6 比例**；新秀/专家/大师的主考项按段位硬范围，不受用户星级影响
5. 本表的 `normal`/`hard`/`demon` 档位与 `difficulty` 数字映射沿用现有约定（见 `src/constants/*` 与既有题型生成器），本 Spec 不重新定义

### 5.6 复习题来源采样规则

- ≤25% 的比例硬上限见 §5.5
- 复习题优先从"用户近 N 局里错题频率较高的题型"中取（按 `wrongQuestions` 最近采样，N 由 M2 实施时取值）
- 无错题历史时按之前各段位新内容点均等分布
- 采样后仍需满足 §5.5 的**难度范围硬约束**：例如专家段位如果错题本里恰好是新秀 A01 的 `normal` 2 题，在专家赛场**不允许**整题沿用，需要抽取同题型更高难度（或落入 §5.5 专家"甜点" ≤10% 配额）

### 5.7 校验钩子 `validateTierDistribution`

抽题器**必须**在返回 `Question[]` 之前调用该钩子做"自检"：

```typescript
// src/engine/rank-match/picker-validators.ts
export interface TierDistributionBuckets {
  primary: Question[];
  nonPrimary: Question[];
  review: Question[];
}

export interface TierDistributionResult {
  ok: boolean;
  violations: string[];
}

export function validateTierDistribution(
  tier: Exclude<RankTier, 'apprentice'>,
  buckets: TierDistributionBuckets,
  totalCount: number,
): TierDistributionResult;
```

钩子会至少覆盖以下校验项（M2 实施时补齐）：

- 每桶题目的 `difficulty` 落在 §5.5 表格允许范围
- 各桶占比：主考 ≥40%、复习 ≤25%
- 专家 `normal` 复习题占比 ≤10%；其他段位复习题池 `normal` 数量 = 0
- 大师 `demon` 占主考+非主考合集 ≥40%
- 三桶合计题数 = 本场题量（见 §5.3）

返回 `{ ok: false, violations }` 时，§5.8 据此决定行为。

### 5.8 抽题器失败兜底

当 `validateTierDistribution` 返回 `{ ok: false }` 或生成器抛错时：

- **开发阶段**：直接抛异常中断当前赛事，调用方把 `violations` 写入一条新的 `ISSUE_LIST.md` 记录（含段位、局号、违规项、抽到的题目 id 样本）
- **正式运行（Phase 3 上线后）**：同样不允许静默降级出题；异常上抛到 `RankMatchSession` 顶层，该局 **标记为"系统故障"回滚**（不计入胜场/败场），用户看到错误提示页而非错误题目
- **严禁**：在任何代码分支悄悄把越界题目替换成其他难度后继续出题；也严禁为了"让这局打得下去"而私自松绑 §5.5 的硬约束

---

## 6. 存档迁移策略

### 6.1 版本升级

`src/repository/local.ts::CURRENT_VERSION` 从 `2` 升到 `3`。

### 6.2 迁移函数

在 `local.ts` 新增 `migrateRankProgressIfNeeded(gp: GameProgress)`：

```typescript
export function migrateRankProgressIfNeeded(gp: GameProgress): GameProgress {
  if (gp.rankProgress) return gp;
  return {
    ...gp,
    rankProgress: {
      currentTier: 'apprentice',
      history: [],
    },
  };
}
```

在 `repository.getGameProgress` 中按 `migrateCampaignIfNeeded` → `migrateRankProgressIfNeeded` 顺序调用。

### 6.3 版本跳变时的旧数据处置

`repository.init` 当前逻辑是"版本不一致就清除旧数据"。Phase 3 **不允许**这样做——`CURRENT_VERSION: 2 → 3` 只是追加 `rankProgress` 字段，campaign/advance 数据完全兼容。

实施子子计划 M1 必须把 `init` 改成"版本号递增时调用对应的迁移链"，而不是 `clearAll`。

### 6.4 `RankMatchSession` 的持久化

- `RankMatchSession` 存在独立 key `mq_rank_match_sessions`（类似 `mq_sessions`）
- `PracticeSession`（单局）继续存在 `mq_sessions`，通过 `rankMatchMeta.rankSessionId` 反查关联的赛事
- 活跃赛事（未出 outcome）通过 `rankProgress.activeSessionId` 索引，加载时优先恢复

---

## 7. 状态机

### 7.1 入场校验

进入 `RankMatchHub` 时，对每个段位计算 `isUnlocked`：

```
isUnlocked(tier) =
  ∀ topicId in 入场表(tier):
    getStars(advanceProgress[topicId]?.heartsAccumulated ?? 0, TOPIC_STAR_CAP[topicId]) >= 入场表(tier)[topicId]
```

- 入场表来自 `2026-04-13` §3.2
- 学徒无校验，始终 unlocked；新秀是第一个有校验的段位

### 7.2 BO 赛事生命周期

```
createRankMatchSession(targetTier)
  ├─ 校验 isUnlocked(targetTier) === true
  ├─ 根据 targetTier 计算 bestOf / winsToAdvance
  ├─ 写入 rankProgress.activeSessionId
  └─ 生成 gameIndex=1 的 PracticeSession（走 §5 抽题器）

startNextGame(rankSessionId)
  └─ 生成 gameIndex=N+1 的 PracticeSession

onGameFinished(practiceSession)
  ├─ 回写 RankMatchGame.{finished,won,correctness,endedAt}
  ├─ 统计 totalWins / remainingGames
  ├─ if totalWins >= winsToAdvance  → outcome = 'promoted'
  ├─ if remainingGames < (winsToAdvance - totalWins) → outcome = 'eliminated'
  └─ else → startNextGame

onMatchFinished(rankSession)
  ├─ 写入 rankProgress.history
  ├─ if outcome === 'promoted' → rankProgress.currentTier 升到 targetTier
  ├─ 清空 rankProgress.activeSessionId
  └─ 路由到 RankMatchResult
```

### 7.3 单关生命周期

完全复用现有 `PracticeSession` 答题流；只有两点变更：

1. `heartsRemaining === 0` 判定为"该局输"，不走"重试本局"——段位赛不允许重试单局
2. 单局结束时不直接跳 `SessionSummary`；跳 `RankMatchResult`（中间结算页）+ 自动衔接下一局

---

## 8. UI 信息架构

### 8.1 新增页面

| 路由 | 页面 | 数据源 | 关键交互 |
|------|------|--------|---------|
| `/rank-match` | `RankMatchHub` | `rankProgress` + 入场校验 | 展示五段位卡片（已解锁 / 未解锁 / 已通过）；点击可解锁段位卡片进入 BO 赛事 |
| `/rank-match/session` | 复用现有 `Practice` 页面 | 当前活跃 `PracticeSession`（带 `rankMatchMeta`）| 题头显示"新秀 BO3 第 1 局 / 共 3 局"徽标 |
| `/rank-match/game-result` | `RankMatchGameResult` | 刚结束的 `RankMatchGame` | 展示本局胜负、BO 整体进度、"开始下一局"按钮；自动 3 秒后跳转 |
| `/rank-match/match-result` | `RankMatchResult` | 完整 `RankMatchSession` | BO 最终结论、每局胜负矩阵、薄弱题型复盘、返回 Hub |

### 8.2 Home 入口真实化

当前 `src/pages/Home.tsx` L222 只有文案"刷星升级，向段位赛进发"，且嵌在进阶入口内。改造为：

- 独立段位赛卡片
- 显示当前段位徽标（学徒 / 新秀 / 高手 / 专家 / 大师）
- 若存在 `rankProgress.activeSessionId`，卡片标题变为"继续挑战：{targetTier} BO{bestOf}"
- 若当前段位 < 新秀但未满足新秀入场：显示"差：A01 × 1★"等缺口提示（前 3 项）

### 8.3 路由注册

`src/App.tsx` 增加三条路由；本规格不约束具体实现方式（`react-router` 已在用），由实施子子计划 M3 里程碑处理。

### 8.4 视觉语言

所有页面遵守 `2026-04-14-ui-redesign-spec.md` 阳光版 v5：
- 字号下限 11px
- 色彩从 token 取
- **段位徽标色与 emoji 映射**：原"金属 + 紫色"方案（青铜/白银/黄金/铂金/王者对应 `#C48B5C` / `#9AA6B2` / `#E8B949` / `#6FBEDB` / `#B77BE8`）**已随命名升级整体作废**。新命名（学徒/新秀/高手/专家/大师）需按"智力递进而非金属对比"的语义重新选色与 emoji；具体方案由 UI 实施阶段（另一 agent 在 UI 子任务中）决定，Spec 不再预设 hex 值与 emoji，但保持硬约束：
  - 必须经 `globals.css` CSS 变量暴露（`--rank-apprentice` / `--rank-rookie` / `--rank-pro` / `--rank-expert` / `--rank-master`），禁止组件内写死十六进制
  - 每两相邻段位的徽章色与图标至少在亮度、色相、图形三要素中拉开两项差异，保证小屏下可辨识
  - 学徒（初始标签）色调应体现"入门/未挑战"的中性感，不得与任何"已晋级"段位色调冲突

---

## 9. 验收门槛（规格级）

本规格的"验收"由实施子子计划的 M1~M4 里程碑完成；本规格自身的验收仅针对"规格一致性"：

- [ ] `_index.md` 已登记本文件（维度 B / 维度 C）
- [ ] Plan/README.md 已登记本文件
- [ ] 两份前置产品规格（`2026-04-10` / `2026-04-13`）的头部事实源分工段**已明确指向本文件作为实施级唯一入口**
- [ ] `pm-sync-check` ✅ 全绿

---

## 10. 开放项与风险

### 10.1 开放项

- [ ] 失败局数如何计入"薄弱题型"——本规格先用"最近 2 局错题最多的题型"兜底，playtest 后复盘
- [ ] 大师段位 5 个新内容点 → 4 胜场（2+2+1），本规格未在算法里硬编码"前两场 2 项、后两场 1 项"的具体分配；实施子子计划 M2 按 `2026-04-10` §8 Q9 表的脚注实现
- [ ] "学徒"段位徽章是否可点击挑战新秀：本规格默认"不可点击未满足星级门槛的段位"，由 Hub 视觉灰态 + 提示缺口

### 10.2 风险

- **存档迁移**：`CURRENT_VERSION` 旧迁移逻辑是"清数据"，本规格要求改为"追加迁移链"。该改动影响所有旧用户，不走 M1 就启动其他里程碑会导致数据丢失。
- **多模块联动**：段位赛改动涉及 types / constants / repository / store / pages / 路由全链路；任一层延迟会直接阻塞其他层。建议 M1 覆盖类型 + 持久化 + 迁移 + 最小 store 三项，确保后续层有稳定底盘。
- **抽题器与真实生成器交互**：抽题器从现有 v2.2 生成器取题，若某生成器在"指定难度档 × 指定子题型"组合下无法生成（极少数边缘情况），可能导致赛事中断。实施子子计划需要在 M2 里给出兜底策略（本规格暂不拍死）。

---

## 11. 与后续文档的衔接

- **实施子子计划** `Plan/2026-04-XX-rank-match-phase3-implementation.md`：按本规格 §3~§8 拆 M1~M4 里程碑；第一批代码文件清单在子子计划里显式列出
- **`_index.md`**：本规格新增时同步登记（维度 B）；如后续拆出组件级子规格，再追加登记
- **人机验证题库**：段位赛跨题型抽题会触发大量组合，playtest 发现的问题走 `ISSUE_LIST.md` 挂靠本规格
