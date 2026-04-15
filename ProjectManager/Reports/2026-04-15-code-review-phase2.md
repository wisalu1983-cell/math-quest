# Code Review 报告：Phase 2 进阶系统 + 全量代码审查

> **审查日期**：2026-04-15  
> **审查范围**：math-quest 全量源代码（含 Phase 1 闯关系统 + Phase 2 进阶系统 + UI 阳光版 v5）  
> **审查基线**：Phase 1 验收通过（48/48 PASS）+ Phase 1 深度 QA（14 PASS / 1 RISK）  
> **审查方法**：逐文件静态分析 + 架构级交叉审查 + 数据流追踪

---

## 一、总体评价

### 优点

1. **类型系统设计良好**：`TopicId` 联合类型、`QuestionData` 判别联合、`GameProgress` 层次结构清晰，类型安全贯穿主干。
2. **状态管理架构清晰**：Zustand 三 store 分治（User / Session / GameProgress），职责边界明确，store 间通过 `getState()` 跨读而非嵌套订阅。
3. **游戏化数值设计有专业度**：SWOR 算法、最大余数法取整、星级断点插值——数值层算法正确、边界处理完备（单元测试 166 通过）。
4. **组件提取合理**：BottomNav、Hearts、ProgressBar、Dialog、LoadingScreen 等基础组件已抽取，消除了原来 5 份重复代码。
5. **无障碍基础已搭建**：skip-link、aria-label、aria-live、role="progressbar"、prefers-reduced-motion 等 WCAG AA 核心项已覆盖。
6. **向前兼容迁移策略**：`repository.getGameProgress` 中对 `advanceProgress` 的迁移处理，保证老用户数据不丢。

### 主要风险

| 风险等级 | 数量 | 说明 |
|----------|------|------|
| 🔴 严重 (P0) | 3 | 影响功能正确性或数据安全 |
| 🟡 重要 (P1) | 6 | 影响健壮性或可维护性 |
| 🔵 改进 (P2) | 8 | 代码质量/体验/性能优化建议 |

---

## 二、严重问题 (P0)

### CR-001: `VerticalCalcBoard.handleSubmit` 前向引用 `highestNonZeroCol`

**位置**：`src/components/VerticalCalcBoard.tsx` — `handleSubmit`（L174）引用 `highestNonZeroCol`（L342 定义）

**问题**：`handleSubmit` 函数体在 L186 使用了 `highestNonZeroCol`，但该 `useMemo` 在 L342 才声明。JavaScript 函数闭包在执行时才解析绑定，所以运行时不会报错——但这依赖 React hooks 的执行顺序保证，且严重违反代码可读性。更关键的是，如果未来有人将 `handleSubmit` 提取为独立函数或 `useCallback`，这个隐式依赖会直接导致 `ReferenceError`。

**风险**：当前运行正确，但**重构即爆**。

**建议**：将 `highestNonZeroCol` 的 `useMemo` 移到 `handleSubmit` 定义之前（L173 前）。

---

### CR-002: `VerticalCalcBoard` 浮点计算答案位数

**位置**：`src/components/VerticalCalcBoard.tsx:53-54`

```typescript
const answerDigits = String(Math.abs(
  operation === '+' ? a + b : operation === '-' ? a - b : operation === '×' ? a * b : Math.floor(a / b)
)).split('').map(Number);
```

**问题**：当操作数包含小数时（`decimalPlaces > 0`），`a + b` / `a * b` 等运算会产生 JavaScript 典型浮点精度问题。例如 `0.1 + 0.2 = 0.30000000000000004`，`String(...)` 后位数错误，整个竖式布局列数计算将出错。

**风险**：小数竖式题在特定操作数组合下，布局列数不匹配，显示异常甚至交互崩溃。

**建议**：
- 使用整数化计算：`Math.round((a + b) * 10**dp) / 10**dp`
- 或直接从 `steps` 数组推算答案位数，而非重新计算

---

### CR-003: 版本迁移策略不完整

**位置**：`src/repository/local.ts:33-39`

```typescript
init() {
  const version = read<number>(KEYS.version);
  if (version !== CURRENT_VERSION) {
    localStorage.removeItem('mq_progress');
    write(KEYS.version, CURRENT_VERSION);
  }
}
```

**问题**：版本不匹配时只清除了旧 key `mq_progress`（Phase 0 时代的残留），但不处理 `mq_game_progress`、`mq_sessions`、`mq_user` 的结构变化。如果 `CURRENT_VERSION` 从 2 升到 3（比如 Phase 3 加入 `rankProgress`），旧结构的 `mq_game_progress` 会被原样读取，而新字段缺失只靠 `getGameProgress` 中的 `if (!raw.advanceProgress)` 一行补丁处理。

**风险**：每次加新字段都需要在 `getGameProgress` 中加一行迁移补丁，容易遗漏；且无法处理**字段类型变更**或**字段重命名**的场景。

**建议**：引入结构化迁移机制——按版本号执行迁移函数链，而非依赖读取时的隐式补丁：

```typescript
const MIGRATIONS: Record<number, (data: any) => any> = {
  2: (data) => ({ ...data, advanceProgress: data.advanceProgress ?? {} }),
  3: (data) => ({ ...data, rankProgress: data.rankProgress ?? {} }),
};
```

---

## 三、重要问题 (P1)

### CR-004: 无 React Error Boundary

**位置**：全应用

**问题**：整个 App 没有 ErrorBoundary。任何组件的运行时错误（如生成器返回了意外结构的 `data`）会导致白屏崩溃，用户无法恢复，只能清缓存。对于面向小学生的教育产品，这是不可接受的。

**建议**：在 `App.tsx` 中包裹 ErrorBoundary，降级到"出了点问题，点击回到首页"的兜底 UI。

---

### CR-005: localStorage 写入过于频繁

**位置**：`store/gamification.ts` — `recordAttempt` + `addWrongQuestion`

**问题**：每道题提交时调用链：`submitAnswer` → `recordAttempt(correct)` → JSON.stringify 全量 GameProgress → localStorage.setItem。如果答错，还会追加 `addWrongQuestion` → 再次全量写入。即**每道题 1-2 次全量序列化+写入**。

**影响**：
- 20 题的进阶 session 产生 20-40 次 localStorage 写入
- GameProgress 对象含 wrongQuestions（最多 100 条完整 Question），序列化体积可达 200KB+
- 低端安卓设备上可能产生卡顿（localStorage.setItem 是同步阻塞的）

**建议**：
- 短期：答题过程中只在内存累积，session 结束时一次性 flush
- 中期：使用 `requestIdleCallback` 或 debounce 延迟写入

---

### CR-006: `PracticeSession.questions` 存储完整 Question 对象

**位置**：`types/index.ts:149` — `QuestionAttempt.question: Question`

**问题**：每条 `QuestionAttempt` 包含完整的 `Question` 对象（含 solution、hints、data 等），一个 session 20 题 × 每题约 500B = 10KB，200 个 session 约 2MB。加上 `wrongQuestions` 同样存储完整 Question（最多 100 条），localStorage 的 5-10MB 限额会逐步逼近。

**建议**：
- `QuestionAttempt` 中只存 `questionId` + `prompt` + `userAnswer` + `correct` 等摘要
- `wrongQuestions` 中保留完整 Question（因为需要展示题目），但控制上限

---

### CR-007: `App.tsx` 第二个 useEffect 依赖数组包含 `currentPage`

**位置**：`src/App.tsx:29-36`

```typescript
useEffect(() => {
  if (user) {
    loadGameProgress(user.id);
    if (currentPage === 'onboarding') {
      setPage('home');
    }
  }
}, [user, loadGameProgress, setPage, currentPage]);
```

**问题**：`currentPage` 在依赖数组中意味着**每次页面切换都会重新执行 `loadGameProgress(user.id)`**，这会触发一次 localStorage 全量读取 + 全量写入（`loadGameProgress` 内部先 get 再 save）。用户在 8 个页面间切换时，每次都重新加载进度是多余的。

**建议**：将 `currentPage` 相关逻辑分离为独立 effect，`loadGameProgress` 只在 `user` 变化时执行：

```typescript
useEffect(() => {
  if (user) loadGameProgress(user.id);
}, [user, loadGameProgress]);

useEffect(() => {
  if (user && currentPage === 'onboarding') setPage('home');
}, [user, currentPage, setPage]);
```

---

### CR-008: `Practice.tsx` 多处 `as any` 类型断言

**位置**：`src/pages/Practice.tsx:47, 53-54`

```typescript
(currentQuestion.data as { operator?: string })?.operator === '÷';
// ...
(currentQuestion.data as any).trainingFields
```

**问题**：绕过了类型系统的保护。如果 `currentQuestion.data` 的 `kind` 字段意外为其他值，运行时不会报错但会产生错误行为。

**建议**：使用判别联合的类型守卫：

```typescript
if (currentQuestion.data.kind === 'mental-arithmetic' && currentQuestion.data.operator === '÷')
```

---

### CR-009: 进阶模式退出文案与实际行为不完全一致

**位置**：`src/pages/Practice.tsx:335`

```
'退出不计入进度，但已答错的题会保存到错题本'
```

**问题**：文案说"不计入进度"，但 `abandonSession` 实际行为是：
1. 保存错题到错题本 ✓
2. 保存中止历史到 sessions（`completed: false`）
3. 不调用 `recordAdvanceSession`，所以心数不累计 ✓

但"保存中止历史"意味着 History 页面会出现一条未完成记录，这在用户理解中可能和"不计入记录"矛盾。

**建议**：统一文案和实际行为的描述——改为"退出后本次练习不计分，但答错的题会记录到错题本"。

---

## 四、改进建议 (P2)

### CR-010: `AdvanceSelect` 使用 `topic.icon`（emoji）而非 `TopicIcon` 组件

**位置**：`src/pages/AdvanceSelect.tsx:97`

**问题**：所有其他页面（Home、CampaignMap、Progress、WrongBook、Profile）都使用 SVG `TopicIcon` 组件，唯独 AdvanceSelect 用 `topic.icon`（emoji 字符）。视觉不一致。

---

### CR-011: 硬编码颜色值绕过设计 token

**位置**：
- `Practice.tsx:127` — `borderColor: '#FFD5D5'`
- `Practice.tsx:297` — `color: '#7A5C00'`
- `VerticalCalcBoard.tsx:303,398,421` — `color: '#e53935'`

**问题**：这些颜色不在设计 token 系统中，换主题时无法自动跟随。

---

### CR-012: `Question.xpBase` 和 `UserSettings.hapticsEnabled` 死字段

**位置**：`types/index.ts:46,25`

**问题**：`xpBase` 标记了 `@deprecated`，`hapticsEnabled` 声明后无任何代码引用。保留在 interface 中会给新开发者造成困惑。

---

### CR-013: `wrongQuestions` 无去重机制

**位置**：`store/gamification.ts:112`

**问题**：同一道题连续做错多次（比如重试同一关卡），会在 `wrongQuestions` 中出现多条记录。错题本 UI 也不做合并展示。

**建议**：按 `question.prompt` + `question.topicId` 去重，保留最近一次。

---

### CR-014: `WrongBook` 使用数组索引作为 React key

**位置**：`src/pages/WrongBook.tsx:63` — `key={i}`

**问题**：如果 wrongQuestions 列表被修改（如未来加入"移除"功能），索引 key 会导致 DOM 复用错误。

---

### CR-015: `CampaignMap` 内嵌函数每次渲染重建

**位置**：`src/pages/CampaignMap.tsx:29-51`

**问题**：`isStageUnlocked`、`isLevelPlayable`、`getBestHearts` 三个函数定义在组件内部，每次渲染都重新创建。虽然 JavaScript 函数创建本身开销很小，但结合地图可能有 40+ 关卡的循环渲染，以及这些函数被作为条件判断依赖，如果未来引入 React.memo 优化，这些函数会破坏 memo 缓存。

---

### CR-016: 缺少关键日志和错误上报

**位置**：全应用

**问题**：除了 `repository.local.ts` 的一处 `console.error`，整个应用没有任何错误日志、用户行为日志或性能度量。对于一个需要迭代优化的教育产品，缺少数据支撑。

---

### CR-017: 进阶结算页"再来一局"跳转到选择页而非直接开始

**位置**：`src/pages/SessionSummary.tsx:128` — `setPage('advance-select')`

**问题**：用户结算后点击"再来一局"，会跳回 AdvanceSelect 页面，需要再次手动点"开始"。对于频繁刷星的用户，这多了一步操作。这不是 bug，是体验设计选择，但值得权衡。

---

## 五、与上一轮测试结果对照

### 对照 Phase 1 验收（48/48 PASS, 2026-04-13）

| 原测试项 | 本轮审查结论 |
|----------|--------------|
| A-03 选择年级后进入首页 | 已删除年级选择，Onboarding 仅收集昵称。**测试用例 A-03 需更新** |
| B-01 显示 8 个题型卡片 | Home 页正常渲染 8 个 TOPICS ✓ |
| D-12 无 XP/连击显示 | 旧 XP 体系已完全移除 ✓，但 `Question.xpBase` 类型残留（CR-012）|
| CONSOLE 无控制台错误 | 需 Phase 2 浏览器验收重新验证 |

### 对照 Phase 1 深度 QA Batch 1（14 PASS / 1 RISK）

| 原测试项 | 本轮审查结论 |
|----------|--------------|
| I-02 退位提示可发现性弱（RISK） | 未修复，仍作为 P2 跟踪 ✓ |
| I-05 竖式填完不自动判定 | 按产品决策接受 ✓，`canSubmit` 条件判断正确 |
| I-08 错误反馈无完整正确竖式 | 按产品决策接受 ✓ |

### Phase 2 新增代码审查

| 模块 | 结论 |
|------|------|
| `engine/advance.ts` | 算法正确，SWOR + 最大余数法实现规范。有 166 个单元测试覆盖 |
| `store/gamification.ts` 进阶部分 | `recordAdvanceSession` / `unlockAdvance` 逻辑正确。`getAdvanceProgress` 派生星级计算正确 |
| `store/index.ts` 进阶分支 | `startAdvanceSession` / `nextQuestion` 进阶分支 / `endSession` 进阶分支均正确 |
| `pages/AdvanceSelect.tsx` | 功能正确，UI 布局合理。图标不一致（CR-010） |
| `pages/SessionSummary.tsx` 进阶视图 | 功能正确，升星动画实现合理 |
| `constants/advance.ts` | 数值设计合理，断点表覆盖 0~cap 全范围 |

---

## 六、优先级建议

### 立即处理（Phase 2 验收前）
1. **CR-002** — 竖式浮点精度（可能影响小数竖式题的正确性）
2. **CR-004** — Error Boundary（防止白屏崩溃）

### 近期处理（Phase 3 开发前）
3. **CR-001** — `highestNonZeroCol` 前向引用
4. **CR-003** — 版本迁移策略
5. **CR-007** — App.tsx useEffect 依赖
6. **CR-008** — `as any` 类型断言

### 中期处理
7. **CR-005** — localStorage 写入优化
8. **CR-006** — Session 数据体积优化
9. **CR-013** — 错题去重
10. **CR-010~017** — P2 级代码质量改进

---

*审查人：Agent Code Review*  
*审查状态：完成*
