# 游戏化 Phase 2：进阶系统规格

> 创建日期：2026-04-15  
> 状态：草稿（待用户确认）  
> 前置文档：  
> - [游戏化重新设计规格](2026-04-10-gamification-redesign.md)  
> - [统一星级与段位数值设计](2026-04-13-star-rank-numerical-design.md)  
> - Phase 1 实施计划：[2026-04-13-gamification-phase1-foundation-campaign.md](../Plan/v0.1/2026-04-13-gamification-phase1-foundation-campaign.md)

---

## 1. 系统定位与解锁条件

### 1.1 进阶是什么

进阶（Advance）是玩家完成某题型全部闯关后进入的**主战场**——通过反复练习积累心数，升星，最终达到段位赛的入场门槛。

| 维度 | 闯关 | 进阶 |
|------|------|------|
| 目的 | 学会某题型（一次性） | 练熟综合能力（反复） |
| 解锁条件 | 初始开放 | 该题型闯关全部通关（含 Boss 关） |
| 题目范围 | 按路线/阶段过滤子题型 | 该题型全部知识点混合 |
| 难度控制 | 预设固定（普通→困难） | 根据当前星级自动调配 |
| 终止条件 | 答完全部题目 | 答完全部题目 OR 心归零 |
| 奖励 | 解锁下一关卡 | 累计心数 → 升星 |
| 失败惩罚 | 无（重试） | 无（但 +0 心） |

### 1.2 解锁粒度

每题型**独立解锁**。A01 闯关通关 → A01 进阶开放；其余题型进阶各自等待。

---

## 2. Session 结构

### 2.1 题量与心数

| 参数 | 值 |
|------|---|
| 每局题数 | **15 题**（固定） |
| 初始心数 | ❤️❤️❤️（3 颗） |
| 答错 | -1 心 |
| 答对 | 心不变 |

> 15 题 ≈ 13 分钟答题 + 2 分钟结算 = 15 分钟/局，与时间节奏规格（17 分钟/局）基本吻合。

### 2.2 终止条件

| 条件 | 结算结果 |
|------|---------|
| 答完全部 15 题（无论心数多少） | 正常结算，`heartsEarned = heartsRemaining` |
| 心归零（答错 3 题，第 15 题前） | 立即结算，`heartsEarned = 0` |
| 用户主动退出（quit） | **不改变任何进度**；保存答题历史，错题写入错题本 |

### 2.3 心→进度换算

| 答错题数 | 剩余心数 | 本次投入进度（heartsEarned） |
|---------|---------|--------------------------|
| 0 题 | ❤️❤️❤️ | **+3** |
| 1 题 | ❤️❤️🖤 | **+2** |
| 2 题 | ❤️🖤🖤 | **+1** |
| 3 题 | 🖤🖤🖤 | **+0**（白练，不扣） |

> 心归零时：第 3 道错题已被扣心后立即触发结算，此时 heartsRemaining = 0，heartsEarned = 0。  
> 主动退出时：heartsEarned 不应用到进度（即使此时 heartsRemaining > 0）。

---

## 3. 星级体系

### 3.1 星级上限（按题型）

| 题型 | 梯度 | 星级上限 |
|------|------|---------|
| A01 基础计算 | 2 梯度（普通+困难） | **3★** |
| A02 数感估算 | 3 梯度 | **5★** |
| A03 竖式笔算 | 3 梯度 | **5★** |
| A04 运算律 | 2 梯度 | **3★** |
| A05 小数运算 | 3 梯度 | **5★** |
| A06 括号变换 | 3 梯度 | **5★** |
| A07 简便计算 | 3 梯度 | **5★** |
| A08 方程移项 | 2 梯度 | **3★** |

### 3.2 心数门槛

每颗星的心数门槛**与题型梯度无关**，3★ 封顶题型在 3★ 后不再延伸：

| 星级 | 本星新增心数 | 累计心数 |
|------|------------|---------|
| 0 → 1★ | **6** | 6 |
| 1 → 2★ | **12** | 18 |
| 2 → 3★ | **20** | 38 |
| 3 → 4★ | **20** | 58 |
| 4 → 5★ | **20** | 78 |

常量定义：
```typescript
export const STAR_THRESHOLDS_3 = [6, 18, 38] as const;       // 3★ 封顶题型
export const STAR_THRESHOLDS_5 = [6, 18, 38, 58, 78] as const; // 5★ 封顶题型
export const TOPIC_STAR_CAP: Record<TopicId, 3 | 5> = {
  'mental-arithmetic': 3,  // A01
  'number-sense':      5,  // A02
  'vertical-calc':     5,  // A03
  'operation-laws':    3,  // A04
  'decimal-ops':       5,  // A05
  'bracket-ops':       5,  // A06
  'multi-step':        5,  // A07
  'equation-transpose': 3, // A08
};
```

### 3.3 currentStars 计算函数

```typescript
function getStars(heartsAccumulated: number, cap: 3 | 5): number {
  const thresholds = cap === 3 ? STAR_THRESHOLDS_3 : STAR_THRESHOLDS_5;
  let stars = 0;
  for (const threshold of thresholds) {
    if (heartsAccumulated >= threshold) stars++;
    else break;
  }
  return stars;
}

// 当前星内进度（0.0 ~ 1.0），用于星级 UI 进度条
function getStarProgress(heartsAccumulated: number, cap: 3 | 5): number {
  const stars = getStars(heartsAccumulated, cap);
  if (stars >= cap) return 1.0;
  const thresholds = cap === 3 ? STAR_THRESHOLDS_3 : STAR_THRESHOLDS_5;
  const prevThreshold = stars === 0 ? 0 : thresholds[stars - 1];
  const nextThreshold = thresholds[stars];
  return (heartsAccumulated - prevThreshold) / (nextThreshold - prevThreshold);
}
```

---

## 4. 难度自动调配

### 4.1 设计目标

系统根据玩家当前星级，**每道题独立**随机选择难度档，无需玩家手动选择。

### 4.2 难度档定义

| 档位 | difficulty 范围 | 选择方式 |
|------|--------------|---------|
| 普通（Normal） | 2 ~ 5 | 随机均匀 |
| 困难（Hard） | 6 ~ 7 | 随机均匀 |
| 魔王（Demon） | 8 ~ 10 | 随机均匀 |

> difficulty=1 保留作极简入门题，进阶不出。

### 4.3 档位权重表（按星级）

> ⚠️ **v0.2 方向A调整（2026-04-21）**：0★/1★/2★ Normal 比例大幅压缩，让通关高难度闯关后进阶起步即有挑战性。详见 `Plan/v0.2/subplans/2026-04-21-b2-进阶权重表调整.md`。

| 星级（currentStars） | Normal% | Hard% | Demon% |
|--------------------|---------|-------|--------|
| 0★ | ~~100~~ → **40** | ~~0~~ → **60** | 0 |
| 1★ | ~~60~~ → **20** | ~~40~~ → **80** | 0 |
| 2★ | ~~20~~ → **0** | ~~80~~ → **100** | 0 |
| 3★（3★ 封顶题型） | 0 | 100 | 0 |
| 3★（5★ 题型） | 0 | 80 | 20 |
| 4★ | 0 | 50 | 50 |
| 5★ | 0 | 10 | 90 |

**星级间线性插值**：实际权重在相邻两行之间按 `starProgress`（0~1）线性内插。例如玩家处于 1★ 且 50% 进度时：
- Normal% = lerp(20, 0, 0.5) = 10
- Hard% = lerp(80, 100, 0.5) = 90

### 4.4 pickAdvanceDifficulty() 算法

```typescript
function pickAdvanceDifficulty(topicId: TopicId, heartsAccumulated: number): number {
  const cap = TOPIC_STAR_CAP[topicId];
  const stars = getStars(heartsAccumulated, cap);
  const progress = getStarProgress(heartsAccumulated, cap);

  // 获取当前星级及下一星级的权重向量 [normal, hard, demon]
  const weights = getTierWeights(stars, progress, cap);
  
  // 按权重随机选择档位
  const tier = pickTier(weights);  // 'normal' | 'hard' | 'demon'
  
  return pickDifficultyInTier(tier);
}

function pickDifficultyInTier(tier: string): number {
  switch (tier) {
    case 'normal': return randInt(2, 5);
    case 'hard':   return randInt(6, 7);
    case 'demon':  return randInt(8, 10);
    default:       return 3;
  }
}
```

> 具体的 `getTierWeights` 实现按 §4.3 表做线性插值，参考边界条件：
> - 3★ 封顶题型：stars ≥ 3 时 Demon 永远为 0。  
> - 5★ 题型：stars = 3 时用"3★（5★ 题型）"行权重。

---

## 5. 数据结构

### 5.1 新增类型（追加至 `src/types/gamification.ts`）

```typescript
/** 单题型进阶进度 */
export interface TopicAdvanceProgress {
  topicId: TopicId;
  heartsAccumulated: number; // 累计已投入心数（不随时间/星级衰减）
  sessionsPlayed: number;    // 总局数（含白练局）
  sessionsWhite: number;     // 白练局数（heartsEarned = 0 的局）
  unlockedAt: number;        // 解锁时间戳
}

/** 进阶系统进度（全题型汇总） */
export type AdvanceProgress = Partial<Record<TopicId, TopicAdvanceProgress>>;
```

### 5.2 更新 `GameProgress`

```typescript
export interface GameProgress {
  userId: string;
  campaignProgress: Partial<Record<TopicId, TopicCampaignProgress>>;
  advanceProgress: AdvanceProgress;   // ← 新增（Phase 2）
  // Phase 3 追加 rankProgress
  wrongQuestions: WrongQuestion[];
  totalQuestionsAttempted: number;
  totalQuestionsCorrect: number;
}
```

### 5.3 更新 `GameSessionMode`

```typescript
export type GameSessionMode = 'campaign' | 'advance' | 'wrong-review';
// Phase 3 追加 'rank-match'
```

---

## 6. Store 变更

### 6.1 gamification.ts 新增操作

```typescript
interface GameProgressStore {
  // ... 现有操作 ...

  /** 解锁某题型进阶（闯关通关时自动触发） */
  unlockAdvance: (topicId: TopicId) => void;

  /** 进阶 session 正常结算（心 > 0 用完全部题或提前归零） */
  recordAdvanceSession: (topicId: TopicId, heartsEarned: number) => void;

  /** 获取某题型进阶进度（含派生星级） */
  getAdvanceProgress: (topicId: TopicId) => {
    progress: TopicAdvanceProgress | null;
    currentStars: number;
    starProgress: number; // 当前星内进度 0~1
    cap: 3 | 5;
  };

  /** 判断某题型进阶是否已解锁 */
  isAdvanceUnlocked: (topicId: TopicId) => boolean;
}
```

### 6.2 recordLevelCompletion 联动解锁进阶

在 `recordLevelCompletion` 末尾：若 `campaignCompleted === true`（此次通关导致题型全通），自动调用 `unlockAdvance(topicId)`。

### 6.3 store/index.ts 新增操作

```typescript
interface SessionStore {
  // ... 现有 ...
  startAdvanceSession: (topicId: TopicId) => void;
}
```

#### startAdvanceSession 实现要点

```typescript
startAdvanceSession: (topicId) => {
  const user = useUserStore.getState().user;
  if (!user) return;

  const gp = useGameProgressStore.getState().gameProgress;
  const advProgress = gp?.advanceProgress[topicId];
  const heartsAcc = advProgress?.heartsAccumulated ?? 0;

  // 为本 session 预生成 15 道题的 difficulty 序列
  // 每道题独立 pick，保证整体比例
  const difficulties = Array.from({ length: ADVANCE_QUESTION_COUNT }, () =>
    pickAdvanceDifficulty(topicId, heartsAcc)
  );

  const session: PracticeSession = {
    id: nanoid(10),
    userId: user.id,
    topicId,
    startedAt: Date.now(),
    difficulty: difficulties[0], // session 级难度取第 1 题（用于 nextQuestion 首次调用）
    sessionMode: 'advance',
    targetLevelId: null,         // 进阶无 level
    questions: [],
    heartsRemaining: CAMPAIGN_MAX_HEARTS,
    completed: false,
    advanceDifficulties: difficulties, // 预生成难度序列，新增字段
  };

  set({
    active: true,
    session,
    currentIndex: 0,
    totalQuestions: ADVANCE_QUESTION_COUNT,
    hearts: CAMPAIGN_MAX_HEARTS,
    showFeedback: false,
    pendingWrongQuestions: [],
  });

  get().nextQuestion();
},
```

> **advanceDifficulties 字段**：为避免逐题动态调难度时出现连续偏题，在 session 开始前预生成全部 15 道题的难度序列，保证整体比例符合权重设计。  
> 该字段加入 `PracticeSession`（`src/types/index.ts`），类型为 `number[] | undefined`。

#### nextQuestion 进阶分支

```typescript
nextQuestion: () => {
  const { session, currentIndex, totalQuestions } = get();
  if (!session || currentIndex >= totalQuestions) return;

  const difficulty = session.sessionMode === 'advance' && session.advanceDifficulties
    ? session.advanceDifficulties[currentIndex]
    : session.difficulty; // 闯关使用固定 difficulty

  const question = generateQuestion(session.topicId, difficulty, undefined);
  // 进阶：不传 subtypeFilter，全题型混合
  // ...
},
```

#### endSession 进阶分支

```typescript
endSession: () => {
  const { session, hearts, pendingWrongQuestions } = get();
  // ...
  if (completedSession.sessionMode === 'advance') {
    const heartsEarned = hearts; // heartsRemaining 即 heartsEarned
    useGameProgressStore.getState().recordAdvanceSession(
      completedSession.topicId,
      heartsEarned
    );
  }
  // ...
},
```

#### abandonSession 进阶分支

用户主动退出时（现有 `abandonSession`）：
- 不调用 `recordAdvanceSession`（进度不变）
- **需要**保存错题本（将 `pendingWrongQuestions` 写入 wrongQuestions）
- 保存 session 历史（`completed: false`）

更新 `abandonSession`：
```typescript
abandonSession: () => {
  const { session, hearts, pendingWrongQuestions } = get();
  
  if (session && pendingWrongQuestions.length > 0) {
    const gpStore = useGameProgressStore.getState();
    for (const wq of pendingWrongQuestions) {
      gpStore.addWrongQuestion(wq);
    }
  }
  
  // 保存中止历史
  if (session) {
    repository.saveSession({
      ...session,
      endedAt: Date.now(),
      heartsRemaining: hearts,
      completed: false,
    });
  }

  set({
    active: false,
    session: null,
    currentQuestion: null,
    currentIndex: 0,
    hearts: CAMPAIGN_MAX_HEARTS,
    showFeedback: false,
    lastAnswerCorrect: false,
    pendingWrongQuestions: [],
  });
},
```

---

## 7. UI 变更

### 7.1 新页面：AdvanceSelect（进阶选题）

**路由 ID**：`'advance-select'`（加入 UIStore.currentPage 类型）

**功能**：
- 列出全部 8 个题型
- 已解锁（闯关通关）：显示星级进度条 + "开始练习"按钮
- 未解锁：灰色锁状态，提示"完成全部闯关后解锁"
- 星级进度条：N 颗实心星 + 当前星内进度条（0~100%）

**导航入口**：
- Home 页底部新增"进阶训练"入口卡片（若存在任一已解锁题型时显示）

**导航出口**：
- "开始练习" → `startAdvanceSession(topicId)` → `setPage('practice')`

### 7.2 Practice.tsx（最小变更）

进阶 session 与闯关共用 Practice.tsx，现有逻辑基本兼容，以下点需调整：

| 调整点 | 变更说明 |
|--------|---------|
| 退出弹窗文案 | advance 模式：提示"退出不计入进度，确认退出？"（闯关："确认退出关卡？"） |
| 心归零触发时机 | 与闯关相同（已有逻辑）：hearts=0 时调 `endSession()`，不是 `abandonSession()` |
| 题目进度显示 | 显示"第 X / 15 题"（闯关与进阶相同格式） |

### 7.3 SessionSummary.tsx（增加进阶视图）

**闯关视图（现有）**：通关/失败 + 剩余心数 + 正确率 + 按钮

**进阶视图（新增）**：

```
┌──────────────────────────────┐
│  🌟 练习结算                  │
│  [题型名] · 进阶模式          │
├──────────────────────────────┤
│  本次投入  ❤️❤️🖤  +2 颗心    │
│                              │
│  进度变化  ⭐⭐☆  →  ⭐⭐⭐☆    │
│  [进度条动画：从旧进度→新进度] │
│  [若升星：星星发光特效]        │
├──────────────────────────────┤
│  答对  11/15  正确率  73%     │
├──────────────────────────────┤
│  [再来一局]   [选择其他题型]   │
│  [回首页]                    │
└──────────────────────────────┘
```

**白练局（heartsEarned = 0）**：
- Banner："已完成！下次加油～"（不用"失败"措辞）
- 显示 "+0 心 · 白练"，不做负反馈

**升星时**：
- 星级进度条动画结束后，新星闪烁亮起
- Toast："恭喜！升至 N★！"

### 7.4 Home.tsx（最小变更）

在题型列表或专属区块中，若 `isAdvanceUnlocked(topicId) === true`，在题型卡片下方增加：

```
⭐ N★ · 进阶 [开始] →
```

或在页面底部增加独立"进阶训练"卡片（推荐，UI 分区清晰）。

具体 UI 实现留 Phase 2 开发阶段确定。

---

## 8. Repository 变更

`src/repository/local.ts` 的 `getGameProgress` 函数需在初始化时加入 `advanceProgress: {}`：

```typescript
function defaultGameProgress(userId: string): GameProgress {
  return {
    userId,
    campaignProgress: {},
    advanceProgress: {},  // ← 新增
    wrongQuestions: [],
    totalQuestionsAttempted: 0,
    totalQuestionsCorrect: 0,
  };
}
```

同时，已有存储的 `GameProgress`（没有 `advanceProgress` 字段）需在 `getGameProgress` 读取时做迁移：

```typescript
const stored = localStorage.getItem(key);
if (stored) {
  const parsed = JSON.parse(stored);
  // 向前兼容迁移
  if (!parsed.advanceProgress) parsed.advanceProgress = {};
  return parsed as GameProgress;
}
```

---

## 9. 常量新增（`src/constants/index.ts` 或新文件 `src/constants/advance.ts`）

```typescript
export const ADVANCE_QUESTION_COUNT = 15;

export const STAR_THRESHOLDS_3 = [6, 18, 38] as const;
export const STAR_THRESHOLDS_5 = [6, 18, 38, 58, 78] as const;

export const TOPIC_STAR_CAP: Record<TopicId, 3 | 5> = {
  'mental-arithmetic': 3,
  'number-sense':      5,
  'vertical-calc':     5,
  'operation-laws':    3,
  'decimal-ops':       5,
  'bracket-ops':       5,
  'multi-step':        5,
  'equation-transpose': 3,
};

// 档位权重表（星级 → [normal%, hard%, demon%]）
// 每行对应 0~5★（含 3★ 封顶题型的特殊行）
export const TIER_WEIGHTS_5STAR: Record<number, [number, number, number]> = {
  0: [100, 0,  0],
  1: [60,  40, 0],
  2: [20,  80, 0],
  3: [0,   80, 20],
  4: [0,   50, 50],
  5: [0,   10, 90],
};
export const TIER_WEIGHTS_3STAR: Record<number, [number, number, number]> = {
  0: [100, 0,   0],
  1: [60,  40,  0],
  2: [20,  80,  0],
  3: [0,   100, 0], // demon 永远为 0
};
```

---

## 10. 实施任务清单

> 实施前需用户确认本规格。确认后在 Phase 2 实施计划文档中细化各 Task。

| # | 任务 | 文件范围 | 说明 |
|---|------|---------|------|
| T1 | 常量 | `constants/advance.ts`（新建） | 星级门槛、星级上限、题量、档位权重表 |
| T2 | 类型 | `types/gamification.ts` | 新增 `TopicAdvanceProgress`, `AdvanceProgress`；更新 `GameProgress`, `GameSessionMode` |
| T3 | 类型 | `types/index.ts` | `PracticeSession` 新增 `advanceDifficulties?: number[]` |
| T4 | 工具函数 | `engine/advance.ts`（新建） | `getStars()`, `getStarProgress()`, `pickAdvanceDifficulty()` |
| T5 | Repository | `repository/local.ts` | `defaultGameProgress` + 向前兼容迁移 |
| T6 | Store | `store/gamification.ts` | 新增 `unlockAdvance`, `recordAdvanceSession`, `getAdvanceProgress`, `isAdvanceUnlocked`；更新 `recordLevelCompletion` 联动解锁 |
| T7 | Store | `store/index.ts` | 新增 `startAdvanceSession`；更新 `nextQuestion`（进阶分支）；更新 `endSession`（进阶分支）；更新 `abandonSession`（保存错题+历史） |
| T8 | UIStore | `store/index.ts` | `currentPage` 新增 `'advance-select'` |
| T9 | 新页面 | `pages/AdvanceSelect.tsx` | 题型列表 + 星级进度 + 开始按钮 |
| T10 | 结算 | `pages/SessionSummary.tsx` | 进阶视图：+N心、进度条动画、升星特效 |
| T11 | 首页入口 | `pages/Home.tsx` | 进阶入口卡片（若有解锁题型） |
| T12 | 路由 | `App.tsx` | 新增 `advance-select` 路由 |
| T13 | Practice | `pages/Practice.tsx` | 退出弹窗文案按 sessionMode 区分 |
| T14 | 测试 | `engine/advance.test.ts`（新建） | `getStars`, `getStarProgress`, `pickAdvanceDifficulty` 单元测试 |
| T15 | 构建验证 | — | `tsc --noEmit`，91+ 测试通过 |

**预估工作量**：T1~T8 纯逻辑层（约 3~4 小时），T9~T13 UI 层（约 3 小时），T14~T15 验证（1 小时）。共约 7~8 小时可完成。

---

## 11. 待后续确认的问题

以下问题在开始 Phase 2 开发前请用户确认：

### Q1. 进阶 session 题量是否固定为 15 题？

**背景**：15 题 ≈ 15 分钟/局，匹配时间节奏规格。但 Q2~Q5 的设计可能影响该值。

- **方案 A（推荐）**：固定 15 题，无论心数多少都打完（心归零则提前结算）
- **方案 B**：无固定题量，出题直至心归零（白练局题数不固定，可能只答 5 题就归零）

### Q2. 难度预生成 vs 逐题实时算？

**背景**：session 开始时预生成 15 道题的 difficulty（本规格推荐），保证整体比例不因随机抖动偏离设计目标。

- **方案 A（推荐）**：session 开始时预生成 `advanceDifficulties[]`，按序取
- **方案 B**：每道题实时 `pickAdvanceDifficulty()`（代码更简单，但统计比例可能偏差）

### Q3. 主动退出的错题是否写入错题本？

本规格建议「是」——主动退出时已答错的题应进错题本（用户花时间做了，理应保留）。请确认。

### Q4. AdvanceSelect 页面入口位置？

- **方案 A**：Home 页底部独立"进阶训练"卡片，点击进入 AdvanceSelect 页
- **方案 B**：Home 题型卡片内新增"进阶 N★ [→]"按钮，直接启动对应题型进阶

### Q5. 进阶结算后的按钮设计？

- "再来一局" → 立即开始同题型进阶（推荐）
- "选择其他题型" → 返回 AdvanceSelect
- "回首页" → 返回 Home

是否还需要"查看错题"快捷入口？

---

## 12. 不在 Phase 2 范围内

以下内容明确推迟到后续：
- 段位赛系统（Phase 3）
- 进阶 session 答题中止的完整处理逻辑（心归零/主动退出/异常中断的细节边界，当前规格采用简化处理）
- 进阶难度比例曲线的 playtest 校准（当前采用设计初值，上线后调参）
- 高星段实际心数增长率校准（同上）
- 进阶 session 平均题目数统计功能
