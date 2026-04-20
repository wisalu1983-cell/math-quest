# 游戏化重设计 Phase 1：Foundation + 闯关系统 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用新游戏化数据模型替代旧 XP/等级/成就体系，实现完整的闯关（Campaign）系统——8 个题型各自有 Stage×Lane×Level 地图，心值归零判失败，全部通关后解锁进阶。

**Architecture:** 新增 `src/types/gamification.ts`（新类型）和 `src/constants/campaign.ts`（8 题型闯关地图），将 `useProgressStore` 替换为 `useGameProgressStore`，重构 `useSessionStore` 支持三心制 + 题目数量固定的闯关 Session，新增 `CampaignMap` 页面。旧系统（XP/combo/streak/成就）整体移除。

**Tech Stack:** React 19, TypeScript 5.9, Zustand 5, Vitest, TailwindCSS v4

**前置文档：**
- [游戏化重设计规格](../../Specs/2026-04-10-gamification-redesign.md)
- [统一星级与段位数值设计](../../Specs/2026-04-13-star-rank-numerical-design.md)

**后续计划：**
- Phase 2：进阶系统（心→星，难度自动调配）
- Phase 3：段位赛系统（BO3/BO5/BO7）

**执行模型建议：**
- **Task 执行**：Sonnet subagent（代码提供完整，机械执行为主）
- **Task Review**：Opus（两阶段 review 节点，需判断力）
- **中等风险 Task**：Task 11（Practice.tsx 改造）和 Task 14（编译错误清理）需要 review 时格外仔细——前者改复杂文件，后者是开放式修复

---

## 文件地图

| 操作 | 文件 | 说明 |
|------|------|------|
| **新建** | `src/types/gamification.ts` | 新类型：CampaignLevel/Stage/Map, GameProgress, GameSessionMode |
| **新建** | `src/constants/campaign.ts` | 8 个题型的 Stage×Lane×Level 地图数据 |
| **新建** | `src/store/gamification.ts` | `useGameProgressStore`：闯关进度 + 错题本 |
| **新建** | `src/pages/CampaignMap.tsx` | 单题型闯关地图页：Stage/Lane/Level 可视化 |
| **修改** | `src/types/index.ts` | 移除 Achievement/LevelDefinition/ComboState/TopicStats/UserProgress/DailyXPRecord/UnlockedAchievement；修改 PracticeSession/QuestionAttempt/UserSettings |
| **修改** | `src/constants/index.ts` | 移除 LEVELS/ACHIEVEMENTS/calculateXP/getComboMultiplier/getLevelForXP/getXPToNextLevel/DAILY_GOAL_OPTIONS；保留 TOPICS/DIFFICULTY_TIERS |
| **修改** | `src/repository/local.ts` | 更新 GameProgress 默认值 + 新增 campaign_progress 存储 key |
| **修改** | `src/store/index.ts` | 移除 useProgressStore；重构 useSessionStore（3 心制 + 闯关模式）；更新 useUIStore（新页面/状态） |
| **修改** | `src/App.tsx` | 注册 CampaignMap 页面；移除 TopicSelect |
| **修改** | `src/pages/Home.tsx` | 完全重写：题型卡片显示闯关进度，点击进入 CampaignMap |
| **修改** | `src/pages/Practice.tsx` | 移除 XP/连击显示；心值从 5→3；Session 结束时调新 store |
| **修改** | `src/pages/SessionSummary.tsx` | 重写为闯关结果页：通关/失败 + 剩余心数 |
| **修改** | `src/pages/Progress.tsx` | 重写为闯关进度总览：8 题型已过/全部关卡数 |
| **修改** | `src/pages/Profile.tsx` | 移除 XP/等级/连续打卡引用 |
| **修改** | `src/pages/History.tsx` | 移除 XP 列显示 |
| **修改** | `src/pages/SessionDetail.tsx` | 移除 XP 列显示 |
| **移除** | `src/pages/TopicSelect.tsx` | 被 CampaignMap 替代（文件保留但不再路由） |

---

## Task 1: 新增 gamification 类型定义

**Files:**
- Create: `src/types/gamification.ts`

- [ ] **Step 1: 创建文件，写入全部新类型**

```typescript
// src/types/gamification.ts
import type { TopicId } from './index';

// ─── Campaign System ───

/** 单个关卡定义（只读静态数据） */
export interface CampaignLevel {
  levelId: string;         // e.g. "mental-arithmetic-S1-LA-L1"
  difficulty: number;      // 1-7（不含魔王）
  questionCount: number;   // 10-20
}

/** 路线定义（同一阶段内可并行） */
export interface CampaignLane {
  laneId: string;          // e.g. "mental-arithmetic-S1-LA"
  laneLabel: string;       // e.g. "主路线" | "估算" | "比较"
  levels: CampaignLevel[];
}

/** 阶段定义 */
export interface CampaignStage {
  stageId: string;         // e.g. "mental-arithmetic-S1"
  stageLabel: string;      // e.g. "入门" | "进阶" | "挑战" | "Boss战"
  isBoss: boolean;
  lanes: CampaignLane[];
}

/** 单题型完整闯关地图（只读静态数据） */
export interface CampaignMap {
  topicId: TopicId;
  stages: CampaignStage[];
}

// ─── Campaign Progress（用户数据） ───

/** 单个关卡的通关记录 */
export interface LevelCompletion {
  levelId: string;
  bestHearts: number;  // 通关时剩余心数（1-3）
  completedAt: number; // timestamp
}

/** 单题型闯关进度 */
export interface TopicCampaignProgress {
  topicId: TopicId;
  completedLevels: LevelCompletion[];
  campaignCompleted: boolean; // 含 Boss 关全部通关
}

// ─── Unified Game Progress ───

/** 替代旧 UserProgress 的主进度对象 */
export interface GameProgress {
  userId: string;
  campaignProgress: Partial<Record<TopicId, TopicCampaignProgress>>;
  // Phase 2 在此追加 advanceProgress
  // Phase 3 在此追加 rankProgress
  wrongQuestions: import('./index').WrongQuestion[];
  totalQuestionsAttempted: number;
  totalQuestionsCorrect: number;
}

// ─── Session Mode ───

export type GameSessionMode = 'campaign' | 'wrong-review';
// Phase 2 追加 'advance'；Phase 3 追加 'rank-match'
```

- [ ] **Step 2: 在 `src/types/index.ts` 顶部追加 re-export**

在 `src/types/index.ts` 最后一行追加：
```typescript
export type { CampaignLevel, CampaignLane, CampaignStage, CampaignMap,
  LevelCompletion, TopicCampaignProgress, GameProgress, GameSessionMode } from './gamification';
```

- [ ] **Step 3: 运行类型检查确认无报错**

```
cd d:\01-工作\Garena\GI\ClaudeGameStudio\math-quest
npx tsc --noEmit 2>&1 | head -30
```

预期：此时可能有大量错误（旧引用尚存），记录错误数量即可，不必全部修复。

- [ ] **Step 4: Commit**

```bash
git add src/types/gamification.ts src/types/index.ts
git commit -m "feat: 新增游戏化类型定义（Phase 1 Foundation）"
```

---

## Task 2: 移除旧 types/index.ts 中的废弃类型

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: 从 `src/types/index.ts` 删除以下接口/类型**

删除以下全部内容（搜索并移除）：
```typescript
// 删除：Achievement、AchievementCondition
export interface Achievement { ... }
export interface AchievementCondition { ... }

// 删除：LevelDefinition
export interface LevelDefinition { ... }

// 删除：ComboState
export interface ComboState { ... }

// 删除：TopicStats
export interface TopicStats { ... }

// 删除：UserProgress
export interface UserProgress { ... }

// 删除：UnlockedAchievement
export interface UnlockedAchievement { ... }

// 删除：DailyXPRecord
export interface DailyXPRecord { ... }
```

- [ ] **Step 2: 修改 `QuestionAttempt`（移除 xpEarned）**

旧：
```typescript
export interface QuestionAttempt {
  questionId: string;
  question: Question;
  userAnswer: string;
  correct: boolean;
  timeMs: number;
  hintsUsed: number;
  xpEarned: number;      // ← 删除
  attemptedAt: number;
}
```

新：
```typescript
export interface QuestionAttempt {
  questionId: string;
  question: Question;
  userAnswer: string;
  correct: boolean;
  timeMs: number;
  hintsUsed: number;
  attemptedAt: number;
}
```

- [ ] **Step 3: 修改 `PracticeSession`**

旧：
```typescript
export interface PracticeSession {
  id: string;
  userId: string;
  topicIds: TopicId[];
  startedAt: number;
  endedAt?: number;
  difficulty: number;
  mode: 'topic' | 'mixed' | 'daily-challenge' | 'wrong-review';
  questions: QuestionAttempt[];
  xpEarned: number;
  maxCombo: number;
  completed: boolean;
}
```

新：
```typescript
export interface PracticeSession {
  id: string;
  userId: string;
  topicId: TopicId;          // 单题型（不再多题型混合）
  startedAt: number;
  endedAt?: number;
  difficulty: number;        // 该 session 使用的固定难度值
  sessionMode: import('./gamification').GameSessionMode;
  targetLevelId: string | null;  // campaign 模式时的关卡 ID
  questions: QuestionAttempt[];
  heartsRemaining: number;   // 0-3（session 结束时）
  completed: boolean;        // true = 正常结束；false = 心归零失败
}
```

- [ ] **Step 4: 修改 `UserSettings`（移除废弃字段）**

旧：
```typescript
export interface UserSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  dailyGoalXP: number;          // ← 删除
  preferredDifficulty: number;  // ← 删除
}
```

新：
```typescript
export interface UserSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}
```

- [ ] **Step 5: 运行类型检查**

```
npx tsc --noEmit 2>&1 | head -50
```

预期：仍有错误（常量文件/store 还在引用旧类型），记录即可。

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts
git commit -m "refactor: 移除废弃类型（XP/等级/成就/连击）"
```

---

## Task 3: 清理 constants/index.ts

**Files:**
- Modify: `src/constants/index.ts`

- [ ] **Step 1: 将 `src/constants/index.ts` 替换为以下内容**

```typescript
import type { TopicMeta } from '@/types';

export const TOPICS: TopicMeta[] = [
  { id: 'mental-arithmetic', name: '基础计算', description: '整数口算与运算顺序训练', icon: '⚡', color: '#1cb0f6', unlockLevel: 0 },
  { id: 'number-sense', name: '数感估算', description: '培养数字感觉和估算能力', icon: '🎯', color: '#58cc02', unlockLevel: 0 },
  { id: 'vertical-calc', name: '竖式笔算', description: '进位退位逐步练习', icon: '📝', color: '#ff9600', unlockLevel: 0 },
  { id: 'operation-laws', name: '运算律', description: '交换律、结合律、分配律', icon: '🔄', color: '#ce82ff', unlockLevel: 0 },
  { id: 'decimal-ops', name: '小数计算', description: '小数加减乘除运算', icon: '🔢', color: '#ff4b4b', unlockLevel: 0 },
  { id: 'bracket-ops', name: '括号变换', description: '增减括号与符号变换', icon: '🔗', color: '#ffc800', unlockLevel: 0 },
  { id: 'multi-step', name: '简便计算', description: '运用运算律和技巧简化计算', icon: '📊', color: '#2b70c9', unlockLevel: 0 },
  { id: 'equation-transpose', name: '方程移项', description: '方程式解题与移项', icon: '⚖️', color: '#00cd9c', unlockLevel: 0 },
];

export type DifficultyTier = 'normal' | 'hard' | 'demon';

export const DIFFICULTY_TIERS: { id: DifficultyTier; label: string; icon: string; value: number; description: string }[] = [
  { id: 'normal', label: '普通', icon: '😊', value: 5, description: '基础练习，打好根基' },
  { id: 'hard', label: '困难', icon: '😤', value: 7, description: '有一定挑战，需要动脑' },
  { id: 'demon', label: '魔王', icon: '👹', value: 10, description: '最强难度，计算高手专属' },
];

/** 闯关最大心数（固定 3） */
export const CAMPAIGN_MAX_HEARTS = 3;
```

- [ ] **Step 2: 运行测试，确认生成器测试不受影响**

```
npx vitest run 2>&1 | tail -20
```

预期：91 个生成器测试全部通过（生成器不依赖 XP/常量）。如有报错记录。

- [ ] **Step 3: Commit**

```bash
git add src/constants/index.ts
git commit -m "refactor: 移除 XP/等级/成就常量，保留 TOPICS/DIFFICULTY_TIERS"
```

---

## Task 4: 闯关地图数据定义

**Files:**
- Create: `src/constants/campaign.ts`

- [ ] **Step 1: 创建文件，定义全部 8 个题型的 CampaignMap**

> 命名规则：levelId = `{topicId}-S{阶段号}-L{路线字母}-L{关卡号}`
> 难度规则：普通阶段 d=2-5（递增），困难阶段 d=6-7；Boss 关 d=7
> 题量规则：每关 10-20 题，随关卡号递增

```typescript
// src/constants/campaign.ts
import type { CampaignMap } from '@/types/gamification';

// ─── A01 基础计算（偏线性：主干 + Stage1 有一条支线） ───
const mentalArithmeticMap: CampaignMap = {
  topicId: 'mental-arithmetic',
  stages: [
    {
      stageId: 'mental-arithmetic-S1',
      stageLabel: '整数口算',
      isBoss: false,
      lanes: [
        {
          laneId: 'mental-arithmetic-S1-LA',
          laneLabel: '加减主路',
          levels: [
            { levelId: 'mental-arithmetic-S1-LA-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'mental-arithmetic-S1-LA-L2', difficulty: 3, questionCount: 12 },
            { levelId: 'mental-arithmetic-S1-LA-L3', difficulty: 4, questionCount: 15 },
          ],
        },
        {
          laneId: 'mental-arithmetic-S1-LB',
          laneLabel: '乘除支路',
          levels: [
            { levelId: 'mental-arithmetic-S1-LB-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'mental-arithmetic-S1-LB-L2', difficulty: 3, questionCount: 12 },
          ],
        },
      ],
    },
    {
      stageId: 'mental-arithmetic-S2',
      stageLabel: '运算顺序',
      isBoss: false,
      lanes: [
        {
          laneId: 'mental-arithmetic-S2-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'mental-arithmetic-S2-LA-L1', difficulty: 4, questionCount: 15 },
            { levelId: 'mental-arithmetic-S2-LA-L2', difficulty: 5, questionCount: 15 },
            { levelId: 'mental-arithmetic-S2-LA-L3', difficulty: 5, questionCount: 18 },
          ],
        },
      ],
    },
    {
      stageId: 'mental-arithmetic-S3',
      stageLabel: '综合挑战',
      isBoss: false,
      lanes: [
        {
          laneId: 'mental-arithmetic-S3-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'mental-arithmetic-S3-LA-L1', difficulty: 6, questionCount: 18 },
            { levelId: 'mental-arithmetic-S3-LA-L2', difficulty: 7, questionCount: 20 },
            { levelId: 'mental-arithmetic-S3-LA-L3', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'mental-arithmetic-S4',
      stageLabel: 'Boss战',
      isBoss: true,
      lanes: [
        {
          laneId: 'mental-arithmetic-S4-LA',
          laneLabel: 'Boss关',
          levels: [
            { levelId: 'mental-arithmetic-S4-LA-L1', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
  ],
};
// 非 Boss 关题数：10+12+15+10+12+15+15+18+18+20+20 = 165 ✓

// ─── A02 数感估算（树状：多条并行路线） ───
const numberSenseMap: CampaignMap = {
  topicId: 'number-sense',
  stages: [
    {
      stageId: 'number-sense-S1',
      stageLabel: '基础估算',
      isBoss: false,
      lanes: [
        {
          laneId: 'number-sense-S1-LA',
          laneLabel: '估算',
          levels: [
            { levelId: 'number-sense-S1-LA-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'number-sense-S1-LA-L2', difficulty: 3, questionCount: 12 },
          ],
        },
        {
          laneId: 'number-sense-S1-LB',
          laneLabel: '比较大小',
          levels: [
            { levelId: 'number-sense-S1-LB-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'number-sense-S1-LB-L2', difficulty: 3, questionCount: 12 },
          ],
        },
      ],
    },
    {
      stageId: 'number-sense-S2',
      stageLabel: '进阶估算',
      isBoss: false,
      lanes: [
        {
          laneId: 'number-sense-S2-LA',
          laneLabel: '四舍五入',
          levels: [
            { levelId: 'number-sense-S2-LA-L1', difficulty: 4, questionCount: 12 },
            { levelId: 'number-sense-S2-LA-L2', difficulty: 5, questionCount: 15 },
          ],
        },
        {
          laneId: 'number-sense-S2-LB',
          laneLabel: '去尾进一',
          levels: [
            { levelId: 'number-sense-S2-LB-L1', difficulty: 4, questionCount: 12 },
            { levelId: 'number-sense-S2-LB-L2', difficulty: 5, questionCount: 15 },
          ],
        },
        {
          laneId: 'number-sense-S2-LC',
          laneLabel: '逆向推理',
          levels: [
            { levelId: 'number-sense-S2-LC-L1', difficulty: 5, questionCount: 12 },
            { levelId: 'number-sense-S2-LC-L2', difficulty: 5, questionCount: 15 },
          ],
        },
      ],
    },
    {
      stageId: 'number-sense-S3',
      stageLabel: '高阶训练',
      isBoss: false,
      lanes: [
        {
          laneId: 'number-sense-S3-LA',
          laneLabel: '综合估算',
          levels: [
            { levelId: 'number-sense-S3-LA-L1', difficulty: 6, questionCount: 15 },
            { levelId: 'number-sense-S3-LA-L2', difficulty: 7, questionCount: 18 },
          ],
        },
        {
          laneId: 'number-sense-S3-LB',
          laneLabel: '逆向高阶',
          levels: [
            { levelId: 'number-sense-S3-LB-L1', difficulty: 6, questionCount: 15 },
            { levelId: 'number-sense-S3-LB-L2', difficulty: 7, questionCount: 18 },
          ],
        },
      ],
    },
    {
      stageId: 'number-sense-S4',
      stageLabel: 'Boss战',
      isBoss: true,
      lanes: [
        {
          laneId: 'number-sense-S4-LA',
          laneLabel: 'Boss关',
          levels: [
            { levelId: 'number-sense-S4-LA-L1', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
  ],
};
// 非 Boss 题数：10+12+10+12+12+15+12+15+12+15+15+18+15+18 = 191 ✓

// ─── A03 竖式笔算（偏线性） ───
const verticalCalcMap: CampaignMap = {
  topicId: 'vertical-calc',
  stages: [
    {
      stageId: 'vertical-calc-S1',
      stageLabel: '整数笔算',
      isBoss: false,
      lanes: [
        {
          laneId: 'vertical-calc-S1-LA',
          laneLabel: '加减',
          levels: [
            { levelId: 'vertical-calc-S1-LA-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'vertical-calc-S1-LA-L2', difficulty: 3, questionCount: 12 },
            { levelId: 'vertical-calc-S1-LA-L3', difficulty: 4, questionCount: 15 },
          ],
        },
        {
          laneId: 'vertical-calc-S1-LB',
          laneLabel: '乘除',
          levels: [
            { levelId: 'vertical-calc-S1-LB-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'vertical-calc-S1-LB-L2', difficulty: 3, questionCount: 12 },
          ],
        },
      ],
    },
    {
      stageId: 'vertical-calc-S2',
      stageLabel: '小数笔算',
      isBoss: false,
      lanes: [
        {
          laneId: 'vertical-calc-S2-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'vertical-calc-S2-LA-L1', difficulty: 4, questionCount: 12 },
            { levelId: 'vertical-calc-S2-LA-L2', difficulty: 5, questionCount: 15 },
            { levelId: 'vertical-calc-S2-LA-L3', difficulty: 6, questionCount: 18 },
          ],
        },
      ],
    },
    {
      stageId: 'vertical-calc-S3',
      stageLabel: '高阶笔算',
      isBoss: false,
      lanes: [
        {
          laneId: 'vertical-calc-S3-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'vertical-calc-S3-LA-L1', difficulty: 6, questionCount: 15 },
            { levelId: 'vertical-calc-S3-LA-L2', difficulty: 7, questionCount: 18 },
            { levelId: 'vertical-calc-S3-LA-L3', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'vertical-calc-S4',
      stageLabel: 'Boss战',
      isBoss: true,
      lanes: [
        {
          laneId: 'vertical-calc-S4-LA',
          laneLabel: 'Boss关',
          levels: [
            { levelId: 'vertical-calc-S4-LA-L1', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
  ],
};
// 非 Boss 题数：10+12+15+10+12+12+15+18+15+18+20 = 157 ✓

// ─── A04 运算律（严格线性：每阶段 1 条路线） ───
const operationLawsMap: CampaignMap = {
  topicId: 'operation-laws',
  stages: [
    {
      stageId: 'operation-laws-S1',
      stageLabel: '交换律结合律',
      isBoss: false,
      lanes: [
        {
          laneId: 'operation-laws-S1-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'operation-laws-S1-LA-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'operation-laws-S1-LA-L2', difficulty: 3, questionCount: 12 },
            { levelId: 'operation-laws-S1-LA-L3', difficulty: 4, questionCount: 18 },
          ],
        },
      ],
    },
    {
      stageId: 'operation-laws-S2',
      stageLabel: '分配律',
      isBoss: false,
      lanes: [
        {
          laneId: 'operation-laws-S2-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'operation-laws-S2-LA-L1', difficulty: 4, questionCount: 15 },
            { levelId: 'operation-laws-S2-LA-L2', difficulty: 5, questionCount: 18 },
            { levelId: 'operation-laws-S2-LA-L3', difficulty: 5, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'operation-laws-S3',
      stageLabel: '综合运用',
      isBoss: false,
      lanes: [
        {
          laneId: 'operation-laws-S3-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'operation-laws-S3-LA-L1', difficulty: 6, questionCount: 18 },
            { levelId: 'operation-laws-S3-LA-L2', difficulty: 7, questionCount: 20 },
            { levelId: 'operation-laws-S3-LA-L3', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'operation-laws-S4',
      stageLabel: 'Boss战',
      isBoss: true,
      lanes: [
        {
          laneId: 'operation-laws-S4-LA',
          laneLabel: 'Boss关',
          levels: [
            { levelId: 'operation-laws-S4-LA-L1', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
  ],
};
// 非 Boss 题数：10+12+18+15+18+20+18+20+20 = 151 ✓

// ─── A05 小数运算（混合型） ───
const decimalOpsMap: CampaignMap = {
  topicId: 'decimal-ops',
  stages: [
    {
      stageId: 'decimal-ops-S1',
      stageLabel: '加减基础',
      isBoss: false,
      lanes: [
        {
          laneId: 'decimal-ops-S1-LA',
          laneLabel: '加法',
          levels: [
            { levelId: 'decimal-ops-S1-LA-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'decimal-ops-S1-LA-L2', difficulty: 3, questionCount: 12 },
          ],
        },
        {
          laneId: 'decimal-ops-S1-LB',
          laneLabel: '减法',
          levels: [
            { levelId: 'decimal-ops-S1-LB-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'decimal-ops-S1-LB-L2', difficulty: 3, questionCount: 12 },
          ],
        },
      ],
    },
    {
      stageId: 'decimal-ops-S2',
      stageLabel: '乘除基础',
      isBoss: false,
      lanes: [
        {
          laneId: 'decimal-ops-S2-LA',
          laneLabel: '乘法',
          levels: [
            { levelId: 'decimal-ops-S2-LA-L1', difficulty: 3, questionCount: 12 },
            { levelId: 'decimal-ops-S2-LA-L2', difficulty: 5, questionCount: 15 },
          ],
        },
        {
          laneId: 'decimal-ops-S2-LB',
          laneLabel: '除法',
          levels: [
            { levelId: 'decimal-ops-S2-LB-L1', difficulty: 3, questionCount: 12 },
            { levelId: 'decimal-ops-S2-LB-L2', difficulty: 5, questionCount: 15 },
          ],
        },
      ],
    },
    {
      stageId: 'decimal-ops-S3',
      stageLabel: '综合',
      isBoss: false,
      lanes: [
        {
          laneId: 'decimal-ops-S3-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'decimal-ops-S3-LA-L1', difficulty: 5, questionCount: 15 },
            { levelId: 'decimal-ops-S3-LA-L2', difficulty: 6, questionCount: 18 },
            { levelId: 'decimal-ops-S3-LA-L3', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'decimal-ops-S4',
      stageLabel: 'Boss战',
      isBoss: true,
      lanes: [
        {
          laneId: 'decimal-ops-S4-LA',
          laneLabel: 'Boss关',
          levels: [
            { levelId: 'decimal-ops-S4-LA-L1', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
  ],
};
// 非 Boss 题数：10+12+10+12+12+15+12+15+15+18+20 = 151 ✓

// ─── A06 括号变换（严格线性） ───
const bracketOpsMap: CampaignMap = {
  topicId: 'bracket-ops',
  stages: [
    {
      stageId: 'bracket-ops-S1',
      stageLabel: '添括号',
      isBoss: false,
      lanes: [
        {
          laneId: 'bracket-ops-S1-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'bracket-ops-S1-LA-L1', difficulty: 2, questionCount: 12 },
            { levelId: 'bracket-ops-S1-LA-L2', difficulty: 3, questionCount: 15 },
            { levelId: 'bracket-ops-S1-LA-L3', difficulty: 4, questionCount: 18 },
          ],
        },
      ],
    },
    {
      stageId: 'bracket-ops-S2',
      stageLabel: '去括号',
      isBoss: false,
      lanes: [
        {
          laneId: 'bracket-ops-S2-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'bracket-ops-S2-LA-L1', difficulty: 4, questionCount: 15 },
            { levelId: 'bracket-ops-S2-LA-L2', difficulty: 5, questionCount: 18 },
            { levelId: 'bracket-ops-S2-LA-L3', difficulty: 5, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'bracket-ops-S3',
      stageLabel: '除法性质',
      isBoss: false,
      lanes: [
        {
          laneId: 'bracket-ops-S3-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'bracket-ops-S3-LA-L1', difficulty: 6, questionCount: 18 },
            { levelId: 'bracket-ops-S3-LA-L2', difficulty: 7, questionCount: 20 },
            { levelId: 'bracket-ops-S3-LA-L3', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'bracket-ops-S4',
      stageLabel: 'Boss战',
      isBoss: true,
      lanes: [
        {
          laneId: 'bracket-ops-S4-LA',
          laneLabel: 'Boss关',
          levels: [
            { levelId: 'bracket-ops-S4-LA-L1', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
  ],
};
// 非 Boss 题数：12+15+18+15+18+20+18+20+20 = 156 ✓

// ─── A07 简便计算（树状） ───
const multiStepMap: CampaignMap = {
  topicId: 'multi-step',
  stages: [
    {
      stageId: 'multi-step-S1',
      stageLabel: '基础简便',
      isBoss: false,
      lanes: [
        {
          laneId: 'multi-step-S1-LA',
          laneLabel: '交换结合',
          levels: [
            { levelId: 'multi-step-S1-LA-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'multi-step-S1-LA-L2', difficulty: 3, questionCount: 12 },
          ],
        },
        {
          laneId: 'multi-step-S1-LB',
          laneLabel: '分配律',
          levels: [
            { levelId: 'multi-step-S1-LB-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'multi-step-S1-LB-L2', difficulty: 3, questionCount: 12 },
          ],
        },
      ],
    },
    {
      stageId: 'multi-step-S2',
      stageLabel: '进阶技巧',
      isBoss: false,
      lanes: [
        {
          laneId: 'multi-step-S2-LA',
          laneLabel: '正向变换',
          levels: [
            { levelId: 'multi-step-S2-LA-L1', difficulty: 4, questionCount: 12 },
            { levelId: 'multi-step-S2-LA-L2', difficulty: 5, questionCount: 15 },
          ],
        },
        {
          laneId: 'multi-step-S2-LB',
          laneLabel: '变号陷阱',
          levels: [
            { levelId: 'multi-step-S2-LB-L1', difficulty: 4, questionCount: 12 },
            { levelId: 'multi-step-S2-LB-L2', difficulty: 5, questionCount: 15 },
          ],
        },
        {
          laneId: 'multi-step-S2-LC',
          laneLabel: '概念判断',
          levels: [
            { levelId: 'multi-step-S2-LC-L1', difficulty: 4, questionCount: 12 },
            { levelId: 'multi-step-S2-LC-L2', difficulty: 5, questionCount: 15 },
          ],
        },
      ],
    },
    {
      stageId: 'multi-step-S3',
      stageLabel: '高阶综合',
      isBoss: false,
      lanes: [
        {
          laneId: 'multi-step-S3-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'multi-step-S3-LA-L1', difficulty: 6, questionCount: 15 },
            { levelId: 'multi-step-S3-LA-L2', difficulty: 7, questionCount: 18 },
            { levelId: 'multi-step-S3-LA-L3', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'multi-step-S4',
      stageLabel: 'Boss战',
      isBoss: true,
      lanes: [
        {
          laneId: 'multi-step-S4-LA',
          laneLabel: 'Boss关',
          levels: [
            { levelId: 'multi-step-S4-LA-L1', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
  ],
};
// 非 Boss 题数：10+12+10+12+12+15+12+15+12+15+15+18+20 = 178 ✓

// ─── A08 方程移项（混合型） ───
const equationTransposeMap: CampaignMap = {
  topicId: 'equation-transpose',
  stages: [
    {
      stageId: 'equation-transpose-S1',
      stageLabel: '基础移项',
      isBoss: false,
      lanes: [
        {
          laneId: 'equation-transpose-S1-LA',
          laneLabel: '常数移项',
          levels: [
            { levelId: 'equation-transpose-S1-LA-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'equation-transpose-S1-LA-L2', difficulty: 3, questionCount: 12 },
          ],
        },
        {
          laneId: 'equation-transpose-S1-LB',
          laneLabel: '系数处理',
          levels: [
            { levelId: 'equation-transpose-S1-LB-L1', difficulty: 2, questionCount: 10 },
            { levelId: 'equation-transpose-S1-LB-L2', difficulty: 3, questionCount: 12 },
          ],
        },
      ],
    },
    {
      stageId: 'equation-transpose-S2',
      stageLabel: '两步方程',
      isBoss: false,
      lanes: [
        {
          laneId: 'equation-transpose-S2-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'equation-transpose-S2-LA-L1', difficulty: 4, questionCount: 15 },
            { levelId: 'equation-transpose-S2-LA-L2', difficulty: 5, questionCount: 18 },
            { levelId: 'equation-transpose-S2-LA-L3', difficulty: 5, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'equation-transpose-S3',
      stageLabel: '综合',
      isBoss: false,
      lanes: [
        {
          laneId: 'equation-transpose-S3-LA',
          laneLabel: '主路线',
          levels: [
            { levelId: 'equation-transpose-S3-LA-L1', difficulty: 6, questionCount: 18 },
            { levelId: 'equation-transpose-S3-LA-L2', difficulty: 7, questionCount: 20 },
            { levelId: 'equation-transpose-S3-LA-L3', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
    {
      stageId: 'equation-transpose-S4',
      stageLabel: 'Boss战',
      isBoss: true,
      lanes: [
        {
          laneId: 'equation-transpose-S4-LA',
          laneLabel: 'Boss关',
          levels: [
            { levelId: 'equation-transpose-S4-LA-L1', difficulty: 7, questionCount: 20 },
          ],
        },
      ],
    },
  ],
};
// 非 Boss 题数：10+12+10+12+15+18+20+18+20+20 = 155 ✓

// ─── 导出地图索引 ───
export const CAMPAIGN_MAPS: Record<string, CampaignMap> = {
  'mental-arithmetic': mentalArithmeticMap,
  'number-sense': numberSenseMap,
  'vertical-calc': verticalCalcMap,
  'operation-laws': operationLawsMap,
  'decimal-ops': decimalOpsMap,
  'bracket-ops': bracketOpsMap,
  'multi-step': multiStepMap,
  'equation-transpose': equationTransposeMap,
};

/** 获取题型地图 */
export function getCampaignMap(topicId: string): CampaignMap | null {
  return CAMPAIGN_MAPS[topicId] ?? null;
}

/** 获取关卡定义 */
export function getCampaignLevel(topicId: string, levelId: string) {
  const map = getCampaignMap(topicId);
  if (!map) return null;
  for (const stage of map.stages) {
    for (const lane of stage.lanes) {
      for (const level of lane.levels) {
        if (level.levelId === levelId) return level;
      }
    }
  }
  return null;
}

/** 获取所有关卡 ID（按地图顺序） */
export function getAllLevelIds(topicId: string): string[] {
  const map = getCampaignMap(topicId);
  if (!map) return [];
  const ids: string[] = [];
  for (const stage of map.stages) {
    for (const lane of stage.lanes) {
      for (const level of lane.levels) {
        ids.push(level.levelId);
      }
    }
  }
  return ids;
}

/** 判断某题型的闯关是否全部完成（含 Boss 关）*/
export function isCampaignFullyCompleted(topicId: string, completedLevelIds: Set<string>): boolean {
  const map = getCampaignMap(topicId);
  if (!map) return false;
  return getAllLevelIds(topicId).every(id => completedLevelIds.has(id));
}
```

- [ ] **Step 2: 运行类型检查**

```
npx tsc --noEmit 2>&1 | grep "campaign.ts" | head -20
```

预期：campaign.ts 本身无类型错误。

- [ ] **Step 3: Commit**

```bash
git add src/constants/campaign.ts
git commit -m "feat: 定义 8 个题型的闯关地图数据（Stage×Lane×Level）"
```

---

## Task 5: 新建 GameProgress Store

**Files:**
- Create: `src/store/gamification.ts`

- [ ] **Step 1: 创建文件**

```typescript
// src/store/gamification.ts
import { create } from 'zustand';
import type { GameProgress, TopicCampaignProgress, LevelCompletion } from '@/types/gamification';
import type { TopicId, WrongQuestion } from '@/types';
import { repository } from '@/repository/local';
import { isCampaignFullyCompleted } from '@/constants/campaign';

interface GameProgressStore {
  gameProgress: GameProgress | null;

  loadGameProgress: (userId: string) => void;

  /** 记录一次闯关通关（heartsRemaining=0 表示失败，不应调用此函数） */
  recordLevelCompletion: (
    topicId: TopicId,
    levelId: string,
    heartsRemaining: number
  ) => void;

  addWrongQuestion: (wq: WrongQuestion) => void;
  recordAttempt: (correct: boolean) => void;

  /** 判断某关卡是否已通关 */
  isLevelCompleted: (topicId: TopicId, levelId: string) => boolean;

  /** 判断某题型闯关是否全部通关（含 Boss） */
  isTopicCampaignDone: (topicId: TopicId) => boolean;
}

export const useGameProgressStore = create<GameProgressStore>((set, get) => ({
  gameProgress: null,

  loadGameProgress: (userId) => {
    const gp = repository.getGameProgress(userId);
    set({ gameProgress: gp });
  },

  recordLevelCompletion: (topicId, levelId, heartsRemaining) => {
    const gp = get().gameProgress;
    if (!gp) return;

    const existing: TopicCampaignProgress = gp.campaignProgress[topicId] ?? {
      topicId,
      completedLevels: [],
      campaignCompleted: false,
    };

    // 更新 bestHearts（保留最佳）
    const prevIdx = existing.completedLevels.findIndex(l => l.levelId === levelId);
    const newCompletion: LevelCompletion = {
      levelId,
      bestHearts: prevIdx >= 0
        ? Math.max(existing.completedLevels[prevIdx].bestHearts, heartsRemaining)
        : heartsRemaining,
      completedAt: Date.now(),
    };

    const updatedLevels = prevIdx >= 0
      ? existing.completedLevels.map((l, i) => i === prevIdx ? newCompletion : l)
      : [...existing.completedLevels, newCompletion];

    const completedIds = new Set(updatedLevels.map(l => l.levelId));
    const campaignCompleted = isCampaignFullyCompleted(topicId, completedIds);

    const updatedTopic: TopicCampaignProgress = {
      ...existing,
      completedLevels: updatedLevels,
      campaignCompleted,
    };

    const updated: GameProgress = {
      ...gp,
      campaignProgress: { ...gp.campaignProgress, [topicId]: updatedTopic },
    };

    repository.saveGameProgress(updated);
    set({ gameProgress: updated });
  },

  addWrongQuestion: (wq) => {
    const gp = get().gameProgress;
    if (!gp) return;
    const updated = {
      ...gp,
      wrongQuestions: [...gp.wrongQuestions, wq].slice(-100), // 最多保留 100 条
    };
    repository.saveGameProgress(updated);
    set({ gameProgress: updated });
  },

  recordAttempt: (correct) => {
    const gp = get().gameProgress;
    if (!gp) return;
    const updated = {
      ...gp,
      totalQuestionsAttempted: gp.totalQuestionsAttempted + 1,
      totalQuestionsCorrect: gp.totalQuestionsCorrect + (correct ? 1 : 0),
    };
    repository.saveGameProgress(updated);
    set({ gameProgress: updated });
  },

  isLevelCompleted: (topicId, levelId) => {
    const gp = get().gameProgress;
    if (!gp) return false;
    return gp.campaignProgress[topicId]?.completedLevels.some(l => l.levelId === levelId) ?? false;
  },

  isTopicCampaignDone: (topicId) => {
    const gp = get().gameProgress;
    if (!gp) return false;
    return gp.campaignProgress[topicId]?.campaignCompleted ?? false;
  },
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/store/gamification.ts
git commit -m "feat: 新增 useGameProgressStore（闯关进度 + 错题本）"
```

---

## Task 6: 更新 Repository 层

**Files:**
- Modify: `src/repository/local.ts`

- [ ] **Step 1: 将 `src/repository/local.ts` 替换为以下内容**

```typescript
// src/repository/local.ts
import type { User, PracticeSession } from '@/types';
import type { GameProgress } from '@/types/gamification';

const KEYS = {
  user: 'mq_user',
  gameProgress: 'mq_game_progress',  // 替代旧 mq_progress
  sessions: 'mq_sessions',
  version: 'mq_version',
} as const;

const CURRENT_VERSION = 2;  // 版本升级，旧数据清除
const MAX_SESSIONS = 200;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

function write<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('数据保存失败，可能存储空间已满', e);
  }
}

export const repository = {
  init() {
    const version = read<number>(KEYS.version);
    if (version !== CURRENT_VERSION) {
      // 版本升级：清除旧数据，防止结构不兼容
      localStorage.removeItem('mq_progress');  // 旧 key
      write(KEYS.version, CURRENT_VERSION);
    }
  },

  // User
  getUser(): User | null {
    return read<User>(KEYS.user);
  },

  saveUser(user: User): void {
    write(KEYS.user, user);
  },

  // GameProgress
  getGameProgress(userId: string): GameProgress {
    const p = read<GameProgress>(KEYS.gameProgress);
    if (p && p.userId === userId) return p;
    return {
      userId,
      campaignProgress: {},
      wrongQuestions: [],
      totalQuestionsAttempted: 0,
      totalQuestionsCorrect: 0,
    };
  },

  saveGameProgress(progress: GameProgress): void {
    write(KEYS.gameProgress, progress);
  },

  // Sessions
  getSessions(): PracticeSession[] {
    return read<PracticeSession[]>(KEYS.sessions) ?? [];
  },

  saveSession(session: PracticeSession): void {
    const sessions = this.getSessions();
    sessions.push(session);
    if (sessions.length > MAX_SESSIONS) {
      sessions.splice(0, sessions.length - MAX_SESSIONS);
    }
    write(KEYS.sessions, sessions);
  },

  getRecentSessions(limit: number): PracticeSession[] {
    return this.getSessions().slice(-limit);
  },

  clearAll(): void {
    localStorage.removeItem(KEYS.user);
    localStorage.removeItem(KEYS.gameProgress);
    localStorage.removeItem(KEYS.sessions);
    localStorage.removeItem('mq_progress');
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/repository/local.ts
git commit -m "refactor: 更新 repository 使用 GameProgress，CURRENT_VERSION 升至 2"
```

---

## Task 7: 重构 store/index.ts

**Files:**
- Modify: `src/store/index.ts`

- [ ] **Step 1: 将 `src/store/index.ts` 替换为以下内容**

> 移除 useProgressStore；重构 useSessionStore（3 心制 + 闯关模式）；更新 useUIStore

```typescript
// src/store/index.ts
import { create } from 'zustand';
import type { User, TopicId, PracticeSession, Question, QuestionAttempt, WrongQuestion } from '@/types';
import type { GameSessionMode } from '@/types/gamification';
import { repository } from '@/repository/local';
import { useGameProgressStore } from './gamification';
import { nanoid } from 'nanoid';
import { generateQuestion } from '@/engine';
import { CAMPAIGN_MAX_HEARTS } from '@/constants';
import { getCampaignLevel } from '@/constants/campaign';

// ─── User Store ───
interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  loadUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => {
    repository.saveUser(user);
    set({ user });
  },
  loadUser: () => {
    const user = repository.getUser();
    set({ user });
  },
}));

// ─── Session Store ───
interface SessionStore {
  active: boolean;
  session: PracticeSession | null;
  currentQuestion: Question | null;
  currentIndex: number;
  totalQuestions: number;
  hearts: number;            // 0-3（闯关）
  questionStartTime: number;
  showFeedback: boolean;
  lastAnswerCorrect: boolean;
  pendingWrongQuestions: WrongQuestion[];

  startCampaignSession: (topicId: TopicId, levelId: string) => void;
  nextQuestion: () => void;
  submitAnswer: (answer: string) => { correct: boolean };
  endSession: () => PracticeSession;
  abandonSession: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  active: false,
  session: null,
  currentQuestion: null,
  currentIndex: 0,
  totalQuestions: 0,
  hearts: CAMPAIGN_MAX_HEARTS,
  questionStartTime: 0,
  showFeedback: false,
  lastAnswerCorrect: false,
  pendingWrongQuestions: [],

  startCampaignSession: (topicId, levelId) => {
    const user = useUserStore.getState().user;
    if (!user) return;

    const levelDef = getCampaignLevel(topicId, levelId);
    if (!levelDef) return;

    const session: PracticeSession = {
      id: nanoid(10),
      userId: user.id,
      topicId,
      startedAt: Date.now(),
      difficulty: levelDef.difficulty,
      sessionMode: 'campaign',
      targetLevelId: levelId,
      questions: [],
      heartsRemaining: CAMPAIGN_MAX_HEARTS,
      completed: false,
    };

    set({
      active: true,
      session,
      currentIndex: 0,
      totalQuestions: levelDef.questionCount,
      hearts: CAMPAIGN_MAX_HEARTS,
      showFeedback: false,
      pendingWrongQuestions: [],
    });

    get().nextQuestion();
  },

  nextQuestion: () => {
    const { session, currentIndex, totalQuestions } = get();
    if (!session || currentIndex >= totalQuestions) return;

    const question = generateQuestion(session.topicId, session.difficulty);

    set({
      currentQuestion: question,
      questionStartTime: Date.now(),
      showFeedback: false,
    });
  },

  submitAnswer: (answer) => {
    const { currentQuestion, questionStartTime, session, currentIndex, hearts } = get();
    if (!currentQuestion || !session) return { correct: false };

    const timeMs = Date.now() - questionStartTime;
    const correctAnswer = String(currentQuestion.solution.answer);

    const normalize = (s: string) =>
      s.trim()
        .replace(/\s+/g, '')
        .replace(/\.?0+$/, '')           // 去尾零：3.0 → 3
        .replace(/\u2026/g, '...');       // Unicode 省略号 → 三个点

    let correct: boolean;
    const qData = currentQuestion.data;
    if (qData.kind === 'number-sense' && qData.subtype === 'estimate' && qData.acceptedAnswers) {
      const userNum = parseFloat(answer);
      correct = !isNaN(userNum) && qData.acceptedAnswers.includes(userNum);
    } else {
      correct = normalize(answer) === normalize(correctAnswer);
    }

    const attempt: QuestionAttempt = {
      questionId: currentQuestion.id,
      question: currentQuestion,
      userAnswer: answer,
      correct,
      timeMs,
      hintsUsed: 0,
      attemptedAt: Date.now(),
    };

    session.questions.push(attempt);

    const newHearts = correct ? hearts : hearts - 1;

    // 记录答题统计
    useGameProgressStore.getState().recordAttempt(correct);

    set({
      hearts: newHearts,
      showFeedback: true,
      lastAnswerCorrect: correct,
      currentIndex: currentIndex + 1,
    });

    if (!correct) {
      const wq: WrongQuestion = {
        question: currentQuestion,
        wrongAnswer: answer,
        wrongAt: Date.now(),
      };
      set(s => ({ pendingWrongQuestions: [...s.pendingWrongQuestions, wq] }));
    }

    return { correct };
  },

  endSession: () => {
    const { session, hearts, pendingWrongQuestions } = get();
    if (!session) throw new Error('No active session');

    session.endedAt = Date.now();
    session.heartsRemaining = hearts;
    session.completed = true;

    repository.saveSession(session);

    // 闯关通关：hearts > 0
    if (hearts > 0 && session.targetLevelId && session.sessionMode === 'campaign') {
      useGameProgressStore.getState().recordLevelCompletion(
        session.topicId,
        session.targetLevelId,
        hearts
      );
    }

    // 刷新错题本
    const gpStore = useGameProgressStore.getState();
    for (const wq of pendingWrongQuestions) {
      gpStore.addWrongQuestion(wq);
    }

    set({
      active: false,
      currentQuestion: null,
      showFeedback: false,
      pendingWrongQuestions: [],
    });

    return session;
  },

  abandonSession: () => {
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
}));

// ─── UI Store ───
interface UIStore {
  currentPage:
    | 'onboarding'
    | 'home'
    | 'campaign-map'
    | 'practice'
    | 'summary'
    | 'progress'
    | 'profile'
    | 'wrong-book'
    | 'history'
    | 'session-detail';
  setPage: (page: UIStore['currentPage']) => void;
  selectedTopicId: TopicId | null;
  setSelectedTopicId: (id: TopicId | null) => void;
  lastSession: PracticeSession | null;
  setLastSession: (s: PracticeSession | null) => void;
  viewingSessionId: string | null;
  setViewingSessionId: (id: string | null) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  currentPage: 'onboarding',
  setPage: (page) => set({ currentPage: page }),
  selectedTopicId: null,
  setSelectedTopicId: (id) => set({ selectedTopicId: id }),
  lastSession: null,
  setLastSession: (s) => set({ lastSession: s }),
  viewingSessionId: null,
  setViewingSessionId: (id) => set({ viewingSessionId: id }),
  soundEnabled: true,
  toggleSound: () => set(s => ({ soundEnabled: !s.soundEnabled })),
}));

// 保持向后兼容（避免其他文件报错）
export { useGameProgressStore } from './gamification';
```

- [ ] **Step 2: 运行类型检查**

```
npx tsc --noEmit 2>&1 | head -50
```

预期：错误数应明显减少。记录剩余错误来源。

- [ ] **Step 3: Commit**

```bash
git add src/store/index.ts
git commit -m "refactor: 重构 store（移除旧 ProgressStore，3心制 SessionStore，新 UIStore）"
```

---

## Task 8: App.tsx 更新 + 移除 TopicSelect

**Files:**
- Modify: `src/App.tsx`
- (TopicSelect.tsx 不删除，但不再路由)

- [ ] **Step 1: 将 `src/App.tsx` 替换为以下内容**

```typescript
// src/App.tsx
import { useEffect } from 'react';
import { useUserStore, useUIStore } from '@/store';
import { useGameProgressStore } from '@/store/gamification';
import { repository } from '@/repository/local';
import Onboarding from '@/pages/Onboarding';
import Home from '@/pages/Home';
import CampaignMap from '@/pages/CampaignMap';
import Practice from '@/pages/Practice';
import SessionSummary from '@/pages/SessionSummary';
import Progress from '@/pages/Progress';
import WrongBook from '@/pages/WrongBook';
import Profile from '@/pages/Profile';
import History from '@/pages/History';
import SessionDetail from '@/pages/SessionDetail';

export default function App() {
  const { user, loadUser } = useUserStore();
  const { loadGameProgress } = useGameProgressStore();
  const currentPage = useUIStore(s => s.currentPage);
  const setPage = useUIStore(s => s.setPage);

  useEffect(() => {
    repository.init();
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (user) {
      loadGameProgress(user.id);
      if (currentPage === 'onboarding') {
        setPage('home');
      }
    }
  }, [user, loadGameProgress, setPage, currentPage]);

  const pages: Record<typeof currentPage, React.ReactNode> = {
    onboarding: <Onboarding />,
    home: <Home />,
    'campaign-map': <CampaignMap />,
    practice: <Practice />,
    summary: <SessionSummary />,
    progress: <Progress />,
    'wrong-book': <WrongBook />,
    history: <History />,
    'session-detail': <SessionDetail />,
    profile: <Profile />,
  };

  return <>{pages[currentPage]}</>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: App.tsx 注册 CampaignMap 页面，移除 TopicSelect 路由"
```

---

## Task 9: 重写 Home 页面

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: 将 `src/pages/Home.tsx` 替换为以下内容**

```typescript
// src/pages/Home.tsx
import { useUserStore, useUIStore } from '@/store';
import { useGameProgressStore } from '@/store/gamification';
import { TOPICS } from '@/constants';
import { CAMPAIGN_MAPS } from '@/constants/campaign';
import type { TopicId } from '@/types';

export default function Home() {
  const user = useUserStore(s => s.user);
  const gameProgress = useGameProgressStore(s => s.gameProgress);
  const { setPage, setSelectedTopicId } = useUIStore();

  if (!user || !gameProgress) return null;

  const handleTopicClick = (topicId: TopicId) => {
    setSelectedTopicId(topicId);
    setPage('campaign-map');
  };

  return (
    <div className="min-h-dvh bg-bg pb-20 safe-top">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-bg/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold">数学大冒险</h1>
          <div className="text-sm text-text-secondary">{user.nickname}</div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <p className="text-text-secondary text-sm mb-4">选择题型开始闯关</p>

        {/* Topic grid */}
        <div className="grid grid-cols-2 gap-3">
          {TOPICS.map((topic) => {
            const campaignProg = gameProgress.campaignProgress[topic.id];
            const map = CAMPAIGN_MAPS[topic.id];

            // 统计总关卡数和已通关数
            let totalLevels = 0;
            let completedLevels = 0;
            if (map) {
              for (const stage of map.stages) {
                for (const lane of stage.lanes) {
                  totalLevels += lane.levels.length;
                }
              }
            }
            if (campaignProg) {
              completedLevels = campaignProg.completedLevels.length;
            }

            const allDone = campaignProg?.campaignCompleted ?? false;

            return (
              <button
                key={topic.id}
                onClick={() => handleTopicClick(topic.id)}
                className="relative p-4 rounded-2xl border-2 border-border hover:border-primary/50 active:scale-95 bg-bg-card transition-all text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: topic.color + '20' }}
                  >
                    {topic.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">{topic.name}</div>
                    {allDone && (
                      <div className="text-xs text-success">✓ 闯关完成</div>
                    )}
                  </div>
                </div>

                {/* 进度条 */}
                <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: totalLevels > 0 ? `${(completedLevels / totalLevels) * 100}%` : '0%',
                      backgroundColor: allDone ? '#58cc02' : topic.color,
                    }}
                  />
                </div>
                <div className="text-xs text-text-secondary">
                  {completedLevels}/{totalLevels} 关
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-bg/90 backdrop-blur-md border-t border-border safe-bottom">
        <div className="max-w-lg mx-auto flex">
          {[
            { page: 'home' as const, icon: '🏠', label: '首页' },
            { page: 'progress' as const, icon: '📊', label: '进度' },
            { page: 'wrong-book' as const, icon: '📕', label: '错题本' },
            { page: 'profile' as const, icon: '👤', label: '我的' },
          ].map(item => (
            <button
              key={item.page}
              onClick={() => setPage(item.page)}
              className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors
                ${item.page === 'home' ? 'text-primary' : 'text-text-secondary hover:text-text'}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: 重写首页，显示 8 题型闯关进度（关卡数 + 进度条）"
```

---

## Task 10: 新建 CampaignMap 页面

**Files:**
- Create: `src/pages/CampaignMap.tsx`

- [ ] **Step 1: 创建文件**

```typescript
// src/pages/CampaignMap.tsx
import { useUIStore, useSessionStore } from '@/store';
import { useGameProgressStore } from '@/store/gamification';
import { TOPICS } from '@/constants';
import { CAMPAIGN_MAPS } from '@/constants/campaign';
import type { CampaignStage, CampaignLane, CampaignLevel } from '@/types/gamification';
import type { TopicId } from '@/types';

export default function CampaignMap() {
  const { selectedTopicId, setPage, setLastSession } = useUIStore();
  const { startCampaignSession } = useSessionStore();
  const isLevelCompleted = useGameProgressStore(s => s.isLevelCompleted);
  const gameProgress = useGameProgressStore(s => s.gameProgress);

  const topicId = selectedTopicId as TopicId;
  const map = topicId ? CAMPAIGN_MAPS[topicId] : null;
  const topic = TOPICS.find(t => t.id === topicId);

  if (!map || !topic) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <button onClick={() => setPage('home')}>← 返回</button>
      </div>
    );
  }

  /** 判断某路线的首关是否已解锁
   * 规则：
   * - 同阶段内所有路线并行可玩，无顺序依赖
   * - Stage 1 所有关卡直接可玩
   * - Stage N+1 解锁条件：Stage N 的所有路线的所有关卡全部通关
   */
  function isLaneFirstLevelUnlocked(stageIdx: number): boolean {
    if (stageIdx === 0) return true;
    const prevStage = map.stages[stageIdx - 1];
    for (const lane of prevStage.lanes) {
      for (const level of lane.levels) {
        if (!isLevelCompleted(topicId, level.levelId)) return false;
      }
    }
    return true;
  }

  /** 判断关卡是否可玩
   * - 该关所属 Stage 解锁（isLaneFirstLevelUnlocked）
   * - 同一路线内前一关已完成
   */
  function isLevelPlayable(stageIdx: number, laneIdx: number, levelIdx: number): boolean {
    if (!isLaneFirstLevelUnlocked(stageIdx)) return false;
    if (levelIdx === 0) return true;
    const prevLevel = map.stages[stageIdx].lanes[laneIdx].levels[levelIdx - 1];
    return isLevelCompleted(topicId, prevLevel.levelId);
  }

  function getLevelHearts(levelId: string): number | null {
    const prog = gameProgress?.campaignProgress[topicId];
    if (!prog) return null;
    const completion = prog.completedLevels.find(l => l.levelId === levelId);
    return completion?.bestHearts ?? null;
  }

  function handleLevelClick(levelId: string) {
    startCampaignSession(topicId, levelId);
    setPage('practice');
  }

  function renderHearts(count: number | null) {
    if (count === null) return null;
    return (
      <div className="flex gap-0.5 justify-center mt-1">
        {[1, 2, 3].map(i => (
          <span key={i} className={`text-xs ${i <= count ? 'text-red-500' : 'text-gray-300'}`}>❤</span>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg safe-top">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => setPage('home')}
            className="text-text-secondary hover:text-text transition-colors"
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{topic.icon}</span>
            <h1 className="font-bold">{topic.name}闯关</h1>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {map.stages.map((stage, stageIdx) => {
          const stageUnlocked = isLaneFirstLevelUnlocked(stageIdx);
          return (
            <div key={stage.stageId}>
              {/* Stage header */}
              <div className={`mb-3 flex items-center gap-2 ${stageUnlocked ? '' : 'opacity-40'}`}>
                {stage.isBoss && <span className="text-red-500">⚔️</span>}
                <h2 className="font-bold text-base">{stage.stageLabel}</h2>
                {!stageUnlocked && <span className="text-xs text-text-secondary">🔒 完成上一阶段解锁</span>}
              </div>

              {/* Lanes */}
              <div className={`space-y-4 ${stageUnlocked ? '' : 'opacity-40 pointer-events-none'}`}>
                {stage.lanes.map((lane, laneIdx) => (
                  <div key={lane.laneId}>
                    {stage.lanes.length > 1 && (
                      <div className="text-xs text-text-secondary mb-2 ml-1">{lane.laneLabel}</div>
                    )}
                    {/* Levels */}
                    <div className="flex gap-3 flex-wrap">
                      {lane.levels.map((level, levelIdx) => {
                        const playable = isLevelPlayable(stageIdx, laneIdx, levelIdx);
                        const completed = isLevelCompleted(topicId, level.levelId);
                        const hearts = getLevelHearts(level.levelId);

                        return (
                          <button
                            key={level.levelId}
                            onClick={() => playable && handleLevelClick(level.levelId)}
                            disabled={!playable}
                            className={`
                              w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center
                              transition-all active:scale-95
                              ${completed
                                ? 'border-success bg-success/10 text-success'
                                : playable
                                  ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                                  : 'border-border bg-bg-elevated text-text-secondary cursor-not-allowed opacity-50'
                              }
                            `}
                          >
                            <span className="text-lg">
                              {completed ? '✓' : playable ? '▶' : '🔒'}
                            </span>
                            <span className="text-[10px]">{level.questionCount}题</span>
                            {renderHearts(hearts)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/CampaignMap.tsx
git commit -m "feat: 新建 CampaignMap 页面，支持 Stage/Lane/Level 可视化 + 锁定/解锁状态"
```

---

## Task 11: 改造 Practice 页面

**Files:**
- Modify: `src/pages/Practice.tsx`

- [ ] **Step 1: 找到并替换 Practice.tsx 中所有 XP/连击相关引用**

`src/pages/Practice.tsx` 中需要修改的关键点：

a) 删除 `xpEarnedThisQuestion`、`combo` 的解构与所有引用（包括 XP 浮动动画 `showXPFloat`）

b) `submitAnswer` 调用改为只取 `correct`（不再取 `xp`）：
```typescript
// 旧：
const { correct, xp } = submitAnswer(finalAnswer);
// 新：
const { correct } = submitAnswer(finalAnswer);
```

c) 心值显示：hearts 来自 useSessionStore，现在最多 3 颗。确认 `hearts` 显示逻辑使用 `[1,2,3]` 范围（不是 `[1,2,3,4,5]`）：
```typescript
// 找到心值显示部分，替换为：
{[1, 2, 3].map(i => (
  <span key={i} className={i <= hearts ? 'text-red-500' : 'text-gray-300'}>❤</span>
))}
```

d) `endSession` 调用后，**心归零（hearts === 0）时仍正常结束 session**（让 SessionSummary 判断通过/失败），所以 Practice 的自动结束逻辑改为：
```typescript
// 在 submitAnswer 之后的 useEffect 里：
useEffect(() => {
  if (!showFeedback) return;
  // 心归零 → 立即结束 session（不等题目做完）
  if (hearts === 0) {
    const completed = endSession();
    setLastSession(completed);
    setPage('summary');
    return;
  }
  // 题目做完 → 正常结束
  if (currentIndex >= totalQuestions) {
    const completed = endSession();
    setLastSession(completed);
    setPage('summary');
  }
}, [showFeedback, hearts, currentIndex, totalQuestions]);
```

e) 删除 `showXPFloat` 状态和 XP 浮动动画 JSX 块。

f) 删除 progress bar 中基于 XP 的逻辑（如果有），改为纯题目数量进度：`{currentIndex}/{totalQuestions}`

- [ ] **Step 2: 运行 TypeScript 检查**

```
npx tsc --noEmit 2>&1 | grep "Practice.tsx" | head -20
```

预期：Practice.tsx 无类型错误。

- [ ] **Step 3: Commit**

```bash
git add src/pages/Practice.tsx
git commit -m "refactor: Practice 页面移除 XP/连击，心值改为 3，心归零立即结算"
```

---

## Task 12: 改造 SessionSummary 页面

**Files:**
- Modify: `src/pages/SessionSummary.tsx`

- [ ] **Step 1: 将 SessionSummary.tsx 核心结果显示改为闯关通关/失败**

SessionSummary 收到的 `lastSession` 现在有 `heartsRemaining`（0=失败，1-3=通关）。

改写结果显示逻辑：

```typescript
// src/pages/SessionSummary.tsx（核心结构）
import { useUIStore } from '@/store';
import { TOPICS } from '@/constants';

export default function SessionSummary() {
  const { lastSession, setPage } = useUIStore();

  if (!lastSession) {
    setPage('home');
    return null;
  }

  const topic = TOPICS.find(t => t.id === lastSession.topicId);
  const passed = lastSession.heartsRemaining > 0;
  const correctCount = lastSession.questions.filter(q => q.correct).length;
  const totalCount = lastSession.questions.length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center safe-top px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        {/* 通关/失败 Banner */}
        <div className={`py-6 rounded-3xl ${passed ? 'bg-success/10' : 'bg-error/10'}`}>
          <div className="text-5xl mb-2">{passed ? '🎉' : '💔'}</div>
          <h1 className="text-2xl font-bold">{passed ? '通关！' : '失败'}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {topic?.name} · {lastSession.targetLevelId ? '闯关' : '练习'}
          </p>
        </div>

        {/* 剩余心数 */}
        {passed && (
          <div>
            <p className="text-sm text-text-secondary mb-2">剩余心数</p>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3].map(i => (
                <span key={i} className={`text-3xl ${i <= lastSession.heartsRemaining ? '' : 'opacity-20'}`}>
                  ❤️
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 答题统计 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-card rounded-2xl p-4">
            <div className="text-2xl font-bold">{correctCount}/{totalCount}</div>
            <div className="text-xs text-text-secondary">答对题数</div>
          </div>
          <div className="bg-bg-card rounded-2xl p-4">
            <div className="text-2xl font-bold">{accuracy}%</div>
            <div className="text-xs text-text-secondary">正确率</div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3">
          {!passed && (
            <button
              onClick={() => setPage('campaign-map')}
              className="w-full py-3 rounded-2xl bg-primary text-white font-bold"
            >
              再试一次
            </button>
          )}
          {passed && (
            <button
              onClick={() => setPage('campaign-map')}
              className="w-full py-3 rounded-2xl bg-primary text-white font-bold"
            >
              继续闯关
            </button>
          )}
          <button
            onClick={() => setPage('home')}
            className="w-full py-3 rounded-2xl border border-border text-text-secondary"
          >
            回首页
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/SessionSummary.tsx
git commit -m "feat: SessionSummary 重写为闯关通关/失败结果页"
```

---

## Task 13: 简化 Progress 页面

**Files:**
- Modify: `src/pages/Progress.tsx`

- [ ] **Step 1: 将 Progress.tsx 替换为以下内容**

```typescript
// src/pages/Progress.tsx
import { useUIStore } from '@/store';
import { useGameProgressStore } from '@/store/gamification';
import { TOPICS } from '@/constants';
import { CAMPAIGN_MAPS } from '@/constants/campaign';

export default function Progress() {
  const setPage = useUIStore(s => s.setPage);
  const gameProgress = useGameProgressStore(s => s.gameProgress);

  return (
    <div className="min-h-dvh bg-bg pb-20 safe-top">
      <div className="sticky top-0 z-10 bg-bg/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="font-bold">闯关进度</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {TOPICS.map(topic => {
          const map = CAMPAIGN_MAPS[topic.id];
          const prog = gameProgress?.campaignProgress[topic.id];

          let totalLevels = 0;
          if (map) {
            for (const stage of map.stages) {
              for (const lane of stage.lanes) {
                totalLevels += lane.levels.length;
              }
            }
          }
          const completedLevels = prog?.completedLevels.length ?? 0;
          const pct = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;
          const allDone = prog?.campaignCompleted ?? false;

          return (
            <div key={topic.id} className="bg-bg-card rounded-2xl p-4 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: topic.color + '20' }}
                >
                  {topic.icon}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{topic.name}</div>
                  <div className="text-xs text-text-secondary">
                    {completedLevels}/{totalLevels} 关完成
                    {allDone ? ' · ✓ 闯关全通' : ''}
                  </div>
                </div>
                <div className="text-sm font-bold" style={{ color: topic.color }}>{pct}%</div>
              </div>
              <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: allDone ? '#58cc02' : topic.color }}
                />
              </div>
            </div>
          );
        })}

        {/* 总体统计 */}
        {gameProgress && (
          <div className="bg-bg-card rounded-2xl p-4 border border-border mt-4">
            <h2 className="font-bold text-sm mb-2">总体统计</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xl font-bold">{gameProgress.totalQuestionsAttempted}</div>
                <div className="text-xs text-text-secondary">累计答题</div>
              </div>
              <div>
                <div className="text-xl font-bold">
                  {gameProgress.totalQuestionsAttempted > 0
                    ? Math.round(gameProgress.totalQuestionsCorrect / gameProgress.totalQuestionsAttempted * 100)
                    : 0}%
                </div>
                <div className="text-xs text-text-secondary">总正确率</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-bg/90 backdrop-blur-md border-t border-border safe-bottom">
        <div className="max-w-lg mx-auto flex">
          {[
            { page: 'home' as const, icon: '🏠', label: '首页' },
            { page: 'progress' as const, icon: '📊', label: '进度' },
            { page: 'wrong-book' as const, icon: '📕', label: '错题本' },
            { page: 'profile' as const, icon: '👤', label: '我的' },
          ].map(item => (
            <button
              key={item.page}
              onClick={() => setPage(item.page)}
              className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors
                ${item.page === 'progress' ? 'text-primary' : 'text-text-secondary hover:text-text'}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Progress.tsx
git commit -m "feat: Progress 页重写为闯关进度总览（8 题型完成率）"
```

---

## Task 14: 清理其他页面 + 修复编译

**Files:**
- Modify: `src/pages/Profile.tsx`
- Modify: `src/pages/History.tsx`
- Modify: `src/pages/SessionDetail.tsx`
- Modify: `src/pages/WrongBook.tsx`
- Modify: `src/pages/Onboarding.tsx`

- [ ] **Step 1: 找到并修复所有剩余编译错误**

```
npx tsc --noEmit 2>&1
```

对每个报错文件，根据错误信息处理：

**Profile.tsx 常见改动：**
- 删除 `progress.totalXP`、`progress.level`、`progress.currentStreak` 等旧字段引用
- 改用 `useGameProgressStore` 的 `gameProgress.totalQuestionsAttempted`
- 删除 `dailyGoalXP` 设置项
- 删除成就相关展示

**History.tsx 常见改动：**
- `session.xpEarned` → 删除或替换为 `session.heartsRemaining`
- `session.topicIds` → `session.topicId`（单个，非数组）

**SessionDetail.tsx 常见改动：**
- `attempt.xpEarned` → 删除
- `session.xpEarned`、`session.maxCombo` → 删除

**WrongBook.tsx 常见改动：**
- 改用 `useGameProgressStore(s => s.gameProgress?.wrongQuestions ?? [])`
- 删除对旧 `useProgressStore` 的引用

**Onboarding.tsx 常见改动：**
- `user.settings.dailyGoalXP` → 删除；`user.settings.preferredDifficulty` → 删除
- 初始化 `settings: { soundEnabled: true, hapticsEnabled: true }`

- [ ] **Step 2: 修复所有编译错误后再次运行类型检查**

```
npx tsc --noEmit 2>&1
```

预期：**0 个错误**。

- [ ] **Step 3: 运行所有测试**

```
npx vitest run 2>&1 | tail -10
```

预期：91 个生成器测试全部通过。

- [ ] **Step 4: 运行构建**

```
npm run build 2>&1 | tail -20
```

预期：构建成功，无错误。

- [ ] **Step 5: Commit**

```bash
git add src/pages/Profile.tsx src/pages/History.tsx src/pages/SessionDetail.tsx src/pages/WrongBook.tsx src/pages/Onboarding.tsx
git commit -m "refactor: 清理其他页面的废弃 XP/等级/成就引用，修复全部编译错误"
```

---

## Task 15: 验收测试

- [ ] **Step 1: 启动开发服务器**

```
npm run dev
```

在浏览器打开 http://localhost:5173

- [ ] **Step 2: 验证核心流程**

按以下流程操作：

1. **注册流程**：首次打开 → 填写昵称 → 进入首页
   - 预期：首页显示 8 个题型卡片，每卡显示 0/N 关
   
2. **进入闯关地图**：点击任意题型
   - 预期：CampaignMap 显示多个阶段，Stage 1 关卡可点击，Stage 2+ 锁定
   
3. **开始一关**：点击 Stage 1 第一关
   - 预期：Practice 页面显示 3 颗心、题目数 1/10
   
4. **答错 3 次**：故意答错
   - 预期：第 3 次答错后自动跳转 SessionSummary，显示"失败"，无 XP
   
5. **正常通关**：从头完成一关不失去所有心
   - 预期：SessionSummary 显示"通关！"+ 剩余心数
   - 返回 CampaignMap，该关卡标记为 ✓

6. **进度页**：底部导航 → 进度
   - 预期：显示 1/N 关完成，进度条更新

- [ ] **Step 3: 验证数据持久化**

刷新页面后：
- 首页仍显示已完成关卡数
- CampaignMap 中已完成关卡仍显示 ✓
- 下一关解锁（如适用）

- [ ] **Step 4: 最终 Commit**

```bash
git add -A
git commit -m "完成游戏化重设计 Phase 1：Foundation + 闯关系统"
```

---

## Spec Coverage Check

| 规格要求 | 对应 Task |
|---------|---------|
| 三心制（❤️×3，答错扣 1） | Task 7 SessionStore、Task 11 Practice |
| 答错 3 题心归零立即结算 | Task 7 endSession、Task 11 Practice |
| 用户可随时主动退出（不改变进度） | Task 7 abandonSession（不调用 recordLevelCompletion） |
| Stage×Lane×Level 结构 | Task 4 campaign.ts、Task 10 CampaignMap |
| 每题型 ≥150 题（非 Boss） | Task 4（每题型数据注释验证） |
| Boss 关 = 最后阶段（结构统一） | Task 4 isBoss=true 放最后阶段 |
| Stage N+1 需 Stage N 全通 | Task 10 isLaneFirstLevelUnlocked |
| 路线内前一关通关才解锁下一关 | Task 10 isLevelPlayable |
| 移除 XP/等级/成就/连击/连续打卡 | Task 2、Task 3、Task 7、Task 14 |
| 保留错题本 | Task 5 addWrongQuestion、Task 7 endSession |
| 难度不含魔王（d≤7） | Task 4（所有关卡 difficulty≤7） |

---

## 待后续计划

- **Phase 2**（进阶系统）：心→星机制、每题型统一星级进度条、难度自动调配
- **Phase 3**（段位赛）：BO3/BO5/BO7 段位赛
- **ISSUE-001~010**：生成器 Bug 修复（可并行进行，不阻塞游戏化实施）
