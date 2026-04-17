# 游戏化 Phase 2 实施计划：进阶系统

> 创建：2026-04-15  
> 前置规格：[Specs/2026-04-15-gamification-phase2-advance-spec.md](../Specs/2026-04-15-gamification-phase2-advance-spec.md)  
> 状态：✅ 开发完成 + 浏览器验收通过（2026-04-16 QA Leader 全量流程，[验收报告](../../test-results/phase2-advance-acceptance/qa-result.md)）

---

## 2026-04-16 对齐更新

在 `2026-04-16` 的后续优化中，`Home.tsx` 的进阶入口口径发生了变化：
- 原计划口径：**有解锁题型时显示进阶入口**
- 当前实现口径：**进阶入口始终显示；未解锁时呈锁定态，解锁后可点击进入 `advance-select`**

此外，Phase 2 复用的共享页面/交互在后续优化中也已有验收通过的更新：
- `ISSUE-046`：心数与 `session.heartsRemaining` 同步
- `ISSUE-050`：首页进阶入口改为“锁定态 / 解锁态”双状态
- `ISSUE-052`：`Practice` 在 `>15` 题时使用数字进度（Phase 2 固定 20 题，直接受影响）
- `ISSUE-054`：长题面不折行，按长度动态字号
- `ISSUE-055` / `ISSUE-017`：竖式题焦点不跳屏、退位提示可发现性增强

因此，本文件现明确区分两类事项：
1. **T1-T15**：实现与构建/单测任务，已完成
2. **A1-A6**：真实浏览器验收任务，待执行

---

## 最终确认的设计决策

| 决策点 | 结论 |
|--------|------|
| 每局题数 | **20 题** |
| 子题型权重存放 | **方案 B**：每个生成器 export `getSubtypeEntries(difficulty): SubtypeDef[]` |
| 子题型选取 | **全局合并 SWOR**：跨所有活跃难度档合并子题型池，整局选 ≤4 个，再按档分配槽位 |
| 难度档定义 | 普通 ≤5 / 困难 6-7 / 魔王 ≥8，与生成器 entries 切换逻辑完全对齐 |
| 跨局收敛 | SWOR 数学性质保证，无需额外跨局状态存储 |
| 主动退出 | 不改变进度；错题写入错题本；保存中止历史（completed: false） |

---

## 任务清单

### 层 1：类型与常量（基础设施）

- [x] **T1** `types/gamification.ts` — 新增 `SubtypeDef`, `TopicAdvanceProgress`, `AdvanceProgress`；更新 `GameProgress`, `GameSessionMode`
- [x] **T2** `types/index.ts` — `PracticeSession` 新增 `advanceSlots?: AdvanceSlot[]`
- [x] **T3** `constants/advance.ts`（新建）— 星级门槛、难度档权重表、ADVANCE_QUESTION_COUNT、TOPIC_STAR_CAP

### 层 2：生成器 export（单源权重）

- [x] **T4** 8 个生成器各 export `getSubtypeEntries(difficulty: number): SubtypeDef[]`
  - `mental-arithmetic.ts` — 单一 entries，所有 difficulty 相同
  - `number-sense.ts` — 单一 entries
  - `vertical-calc.ts` — 三档 entries（≤5 / 6-7 / ≥8）
  - `operation-laws.ts` — 三档
  - `decimal-ops.ts` — 三档
  - `bracket-ops.ts` — 三档（注意普通档 weight=0 的条目须过滤）
  - `multi-step.ts` — 三档
  - `equation-transpose.ts` — 三档

### 层 3：进阶引擎

- [x] **T5** `engine/advance.ts`（新建）
  - `getStars(heartsAccumulated, cap)` → number
  - `getStarProgress(heartsAccumulated, cap)` → 0~1
  - `getFractionalStars(heartsAccumulated, cap)` → 0.0~5.0
  - `getTierCounts(topicId, heartsAccumulated, total)` → {normal, hard, demon}
  - `buildMergedPool(topicId, tierCounts)` → 合并子题型池（按题量加权）
  - `weightedSwor(pool, k)` → 选出 ≤k 个子题型
  - `distributeSlots(selected, tierEntries, count)` → 按比例分槽（最大余数法）
  - `buildAdvanceSlots(topicId, heartsAccumulated)` → `AdvanceSlot[]`（20 个）
  - `pickAdvanceSlotDifficulty(tier)` → number

### 层 4：Repository

- [x] **T6** `repository/local.ts` — `defaultGameProgress` 加 `advanceProgress: {}`；读取时向前兼容迁移

### 层 5：Store

- [x] **T7** `store/gamification.ts` — 新增 `unlockAdvance`, `recordAdvanceSession`, `getAdvanceProgress`, `isAdvanceUnlocked`；`recordLevelCompletion` 末尾联动解锁
- [x] **T8** `store/index.ts`
  - `SessionStore` 新增 `startAdvanceSession(topicId)`
  - `nextQuestion` 进阶分支：按 `advanceSlots[currentIndex]` 取 difficulty + subtypeFilter
  - `endSession` 进阶分支：调 `recordAdvanceSession(topicId, heartsRemaining)`
  - `abandonSession` 更新：保存错题 + 中止历史
  - `UIStore.currentPage` 新增 `'advance-select'`

### 层 6：UI

- [x] **T9** `pages/AdvanceSelect.tsx`（新建）— 题型列表 + 星级进度 + 开始按钮
- [x] **T10** `pages/SessionSummary.tsx` — 进阶结算视图（+N心, 进度条动画, 升星提示）
- [x] **T11** `pages/Home.tsx` — 进阶入口区块（入口始终显示；未解锁时锁定态，解锁后可点击进入）
- [x] **T12** `App.tsx` — 新增 `advance-select` 路由
- [x] **T13** `pages/Practice.tsx` — 退出弹窗文案按 sessionMode 区分

### 层 7：测试与验证

- [x] **T14** `engine/advance.test.ts`（新建）— `getStars`, `buildMergedPool`, `weightedSwor`, `buildAdvanceSlots` 单元测试
- [x] **T15** 构建验证：`tsc --noEmit` 0 错误；`vitest run` 全通（当前总线 167/167）

### 层 8：浏览器验收（待执行）

- [x] **A1** `pages/Home.tsx` — ✅ 验收通过：锁定卡片可见、文案正确、不可误跳转（B-20/21 PASS）
- [x] **A2** `pages/Home.tsx` — ✅ 验收通过：解锁态切换、主题卡星级同步、刷新后状态保持（B-23/24/25 PASS）
- [x] **A3** `pages/AdvanceSelect.tsx` — ✅ 验收通过：题型列表、已解锁/未解锁分区、星级进度、开始按钮（G-10~16 PASS）
- [x] **A4** `pages/Practice.tsx` — ✅ 验收通过：20 题数字进度、退出文案区分、心数机制、难度调配（D-20~31 PASS）
- [x] **A5** `pages/SessionSummary.tsx` — ✅ 验收通过：+N 心、星级进度、答题统计、再来一局/回首页导航（E-10~17 PASS）
- [x] **A6** `store/* + repository/local.ts` — ✅ 验收通过：进度持久化、刷新保留、数据兼容、0 JS 错误（K-10~14 PASS）

---

## 关键算法：buildAdvanceSlots

```
输入: topicId, heartsAccumulated
输出: AdvanceSlot[] (20个)

1. cap = TOPIC_STAR_CAP[topicId]
2. fractionalStars = getFractionalStars(heartsAccumulated, cap)
3. tierCounts = getTierCounts(fractionalStars, 20)
   → {normal: N1, hard: N2, demon: N3}, N1+N2+N3 = 20

4. 对每个 count>0 的档位，getSubtypeEntries(repDifficulty) 取该档子题型
5. 按题量归一化权重后合并为 mergedPool
6. SWOR 从 mergedPool 选出 4 个 tag（≤4时全选）

7. 对每个 count>0 的档位：
   a. filter selected tags → 只保留该档有(weight>0)的
   b. 按该档原始权重 distributeSlots → 整数槽位
   c. 为每个槽位 randInt(tierMin, tierMax) 得到 difficulty

8. 合并所有槽位，shuffle，返回
```

## 边界情况

| 情况 | 处理 |
|------|------|
| A06 普通档 weight=0 的 tag | `getSubtypeEntries` 过滤 weight>0 后返回 |
| 选中 tag 在某档不存在 | distributeSlots 内 filter 后按可用 tag 重分配 |
| 单档 <4 题但 pool >4 tag | SWOR 正常选 4，按比例分配（最少 0 槽）|
| 题目数取整 | 最大余数法，保证总数精确等于该档 count |
| 0★ 单档 all-normal | 正常流程，只有 normal 档，tierCounts={normal:20,...} |
