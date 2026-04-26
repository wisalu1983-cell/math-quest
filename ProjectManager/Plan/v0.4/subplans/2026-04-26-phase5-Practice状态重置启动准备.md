# Phase 5 Practice 状态重置启动准备

> 创建：2026-04-26
> 所属版本：v0.4
> 父计划：v0.4-5
> 设计规格：N/A（工程质量重构，不新增跨版本产品规格；继承下方规格与证据约束）
> 状态：✅ 已完成开发与 QA（TDD + QAleader 三层验证通过）

---

## 一、背景

本计划承接 `BL-004`：Practice 答题页在切换下一题时手动重置多份输入状态。当前没有明确用户可见 bug，但该实现继续承载多题型、训练格、段位赛恢复和后续交互时，维护风险会上升。

本轮用户同步：Phase 4 已完成收口。Phase 5 已按本文闸门完成 TDD 实施、浏览器等价验证和 QAleader 三层 QA；未改变 Phase 4 反馈 / 提交流程。

### 前置相关规格 / 证据

| 规格 / 证据 | 本计划继承的硬约束 |
|---|---|
| `ProjectManager/Specs/_index.md` | Practice 页面改造要检查 UI / UX 约束；若新增持久化字段，必须检查同步合并策略。本计划目标是不新增持久化字段。 |
| `ProjectManager/Specs/2026-04-14-ui-redesign-spec.md` | 答题页保持阳光版 v5：无底部导航、反馈状态机、成功 / 失败面板、移动端可读性。本 Phase 不改视觉语言。 |
| `ProjectManager/Specs/v03-supabase-account-sync/2026-04-23-v03-supabase-账号与同步系统.md` | Repository 接口不变；Zustand stores 不感知同步存在。Phase 5 不新增云端字段，不触发存档版本升级。 |
| `ProjectManager/Backlog.md#BL-004` | `BL-004` 已纳入 v0.4 Phase 5；定位为工程质量 / 技术债，必须行为等价。 |
| `src/pages/Practice.tsx` | 原本地输入态集中在 `answer`、`remainderInput`、`selectedOption`、`selectedOptions`、`blankValues`、`trainingComplete`、`trainingValues`；原换题 effect 按题目变化逐项清空并执行聚焦。Phase 5 已替换为 `usePracticeInputState(currentQuestion)`。 |
| `src/store/index.ts` | `submitAnswer()` 负责提交、反馈、扣心、错题和 session 记录；`nextQuestion()` 负责换题和清 store 反馈。Phase 5 不改变这些业务语义。 |

### 跨系统维度清单

- [ ] 难度档位 / 题型梯度数：不涉及。
- [ ] 星级 / 进阶 / 段位数值：不涉及。
- [ ] 关卡结构 / campaign.ts：不涉及。
- [x] UI 组件 / 卡片尺寸：只做状态管理重构，不改布局和视觉 token。
- [x] 答题形式 / 验证逻辑：覆盖 Practice 当前承载的输入形态，但不改判定规则。
- [ ] 存档 / 同步 / 数据迁移：不新增持久化字段；若实施中改变该前提，必须另行补同步合并测试。
- [x] QA / 验收产物：需要行为等价测试、全量 test/build、必要的浏览器走查。

## 二、目标与范围

### 目标

- 把 Practice 页“换题时手动清多份 state”的实现收敛为单一初始化 / 重置机制。
- 在重构前先补行为基线，保证切题、反馈、训练格、多输入题型、段位赛路径行为等价。
- 让后续新增答题形态时，只需要在一个入口声明初始输入状态。

### 非目标

- 不改变题目生成、题型判定、答题正确性、扣心、错题本或历史记录语义。
- 不顺手调整 Practice 页面视觉、布局、文案、动效。
- 不修改 Phase 4 的进位/退位格策略；只兼容 Phase 4 已接入的反馈状态。
- 不引入新的持久化字段或存档迁移。

## 三、当前状态盘点

| 维度 | 当前行为 | Phase 5 风险 |
|---|---|---|
| 普通输入 | `answer` 在换题 effect 中清空 | 新增输入态时容易漏清。 |
| 除法余数输入 | `answer` + `remainderInput` 分别清空；空余数提交为 `0` | 重构必须保留空余数语义。 |
| 单选 / 多选 | `selectedOption` / `selectedOptions` 清空 | 不能在提交反馈态提前清空，否则反馈页可能丢当前题上下文。 |
| 多空填空 | `blankValues` 按 `solution.blanks.length` 初始化 | 新机制必须依赖题目结构，而不只是固定空数组。 |
| 小数训练格 | `trainingComplete=false`，`trainingValues=[]` | 训练格完成态和过程值必须随题目重置，不随提交重置。 |
| 自动聚焦 | 换题后聚焦 `inputRef` | 新机制若拆组件，需保留首输入聚焦。 |
| 非输入态 | `shakeWrong`、弹窗、confetti、rank-match auto suspend refs 不在换题 reset 中 | 不应混入答题输入重置机制。 |

## 四、工程方案定稿

### 4.1 采用方案

采用 **纯初始化函数 + 本地 reducer + `usePracticeInputState()` hook**。

核心做法：

1. 新建 `src/pages/practice-input-state.ts`，定义 Practice 页专属的输入态模型 `PracticeAnswerState`。
2. 用纯函数 `createInitialPracticeAnswerState(question)` 根据当前题目生成初始输入态。
3. 同文件导出 `usePracticeInputState(question)`，在 hook 内部封装 reducer、换题 reset effect 和聚焦副作用。
4. `Practice.tsx` 只消费 hook 返回的 `state`、`inputRef` 和 setter facade，不直接裸用 reducer。
5. 当 `currentQuestion` 变化时，只触发 hook 内部一次 reset effect，替代原多 setter 清空和 `inputRef.current.focus()`。

这个方案只收敛 Practice 页内部 UI 暂态，不改变 `useSessionStore`、题目生成器、判题逻辑、错题本、历史记录或同步数据结构。

最终调用面：

```ts
const {
  state: answerState,
  inputRef,
  setAnswer,
  setRemainderInput,
  selectOption,
  toggleSelectedOption,
  setBlankValue,
  setTrainingComplete,
  setTrainingValues,
} = usePracticeInputState(currentQuestion);
```

`Practice.tsx` 的渲染层继续以“读值 + 调 setter”的方式工作；区别只是值和 setter 统一来自 hook，而不是分散的多个 `useState`。`resetForQuestion` 保持为 hook 内部实现细节，不暴露给页面消费。

### 4.2 目标状态模型

`PracticeAnswerState` 首版字段固定为：

```ts
interface PracticeAnswerState {
  answer: string;
  remainderInput: string;
  selectedOption: string | null;
  selectedOptions: string[];
  blankValues: string[];
  trainingComplete: boolean;
  trainingValues: string[];
}
```

初始化规则：

| 题型 / 场景 | 初始状态 |
|---|---|
| 普通输入 | `answer=''` |
| 除法余数输入 | `answer=''`、`remainderInput=''`，提交时继续沿用空余数等同 `0` |
| 单选 | `selectedOption=null` |
| 多选 | `selectedOptions=[]` |
| 多空填空 | `blankValues=Array(solution.blanks.length).fill('')` |
| 小数训练格 | `trainingComplete=false`、`trainingValues=[]` |
| 其他题型 | 不需要的字段保持空初始值 |

### 4.3 Hook 与 Reducer 边界

优点：

- 最小改动，不改变 Practice 与 store 的职责边界。
- 初始状态可用 Vitest 纯函数覆盖，TDD 成本低。
- 后续新增输入形态时，集中修改一个初始化入口。

`practice-input-state.ts` 分三层：

| 层 | 导出 | 责任 |
|---|---|---|
| 纯函数 | `createInitialPracticeAnswerState(question)` | 根据题目派生初始输入态；无 React、无 DOM。 |
| reducer | `practiceAnswerReducer(state, action)` | 处理输入态动作；无业务提交、无 DOM。 |
| hook | `usePracticeInputState(question)` | 封装 `useReducer`、换题 reset effect、`inputRef` 和 focus 副作用，并返回 setter facade。 |

reducer action 集：

| Action | 作用 |
|---|---|
| `resetForQuestion(question)` | 由 `createInitialPracticeAnswerState(question)` 重建整份输入态 |
| `setAnswer(value)` | 更新普通输入 / 表达式输入答案 |
| `setRemainderInput(value)` | 更新余数输入 |
| `selectOption(value)` | 更新单选 |
| `toggleSelectedOption(letter)` | 更新多选 |
| `setBlankValue(index, value)` | 更新指定填空 |
| `setTrainingComplete(value)` | 更新训练格完成态 |
| `setTrainingValues(values)` | 更新训练格填写值 |

focus 归属：

- `inputRef` 由 `usePracticeInputState(question)` 创建并返回。
- hook 内部 reset effect 在 dispatch `resetForQuestion(question)` 后执行 `inputRef.current?.focus()`。
- `Practice.tsx` 不再单独写换题聚焦 effect，避免 reset 和 focus 分成两个入口。
- 如果当前题型没有可聚焦输入框，`inputRef.current` 为 `null` 时静默跳过；竖式板等自管理焦点的题型不被 hook 强行接管。

非输入态保持在 `Practice.tsx` 原有 state / ref：

- `shakeWrong`
- `showQuitConfirm`
- `showRestartConfirm`
- `showConfetti`
- `sessionEndedRef`
- `allowUnmountAutoSuspendRef`

这些状态不随题目初始化模型管理，避免把弹窗、动画和段位赛中断逻辑混进答题输入状态。

### 4.4 不采用方案

| 方案 | 不采用原因 |
|---|---|
| 按题目 `key` remount 子组件 | 需要拆较大 JSX 子树，容易在 Phase 4 验收后引入 UI 与焦点副作用。 |
| 把输入态上移到 Zustand store | 这些是纯 UI 暂态，不应进入业务 store / 同步边界。 |
| 保留现状只加注释 | 不能降低后续新增题型漏 reset 的风险。 |

## 五、实施拆解

| Task | 内容 | 状态 | 证据 |
|---|---|---|---|
| T0 | 启动准备：梳理来源、边界、状态盘点、方案定稿和验收门 | ✅ | 本文档 |
| T1 | RED：为 `createInitialPracticeAnswerState()` 写失败测试，覆盖普通输入、余数输入、单选、多选、多空、训练格 | ✅ | `src/pages/practice-input-state.test.ts` |
| T2 | GREEN：实现 `PracticeAnswerState` 与 `createInitialPracticeAnswerState(question)` 纯函数 | ✅ | `src/pages/practice-input-state.ts` |
| T3 | RED：为 reducer 写输入态动作测试，覆盖 reset、set、toggle、blank、training values | ✅ | `src/pages/practice-input-state.test.ts` |
| T4 | GREEN：实现 reducer / action，并保持测试通过 | ✅ | `src/pages/practice-input-state.ts` |
| T5 | 实现 `usePracticeInputState(question)` hook，并接入 `Practice.tsx`：替代原多 setter effect，所有 UI 读写改走 hook 返回的 state / setter facade | ✅ | `src/pages/practice-input-state.ts`、`src/pages/Practice.tsx` |
| T6 | 增补浏览器等价走查：覆盖换题后输入清空、多空长度重建、换题后首输入聚焦、退出弹窗不受影响 | ✅ | `QA/e2e/phase5-practice-input-reset.spec.ts`、`QA/runs/2026-04-26-v04-phase5-practice-reset/` |
| T7 | 全量验证与 PM 回写 | ✅ | `npm test`、`npm run build`、`npx playwright test`、Phase 5 / Overview 回写 |

### T1 测试要求

先写 `src/pages/practice-input-state.test.ts`，至少覆盖：

- numeric-input：`answer` 初始为空。
- mental division remainder：`answer` 和 `remainderInput` 初始为空。
- multiple-choice：`selectedOption` 初始为 `null`。
- multi-select：`selectedOptions` 初始为空数组。
- multi-blank：按 `solution.blanks.length` 初始化 `blankValues`。
- trainingFields：`trainingComplete=false` 且 `trainingValues=[]`。

第一次运行：

```powershell
npm test -- src/pages/practice-input-state.test.ts
```

预期：失败，原因是 `practice-input-state.ts` / `createInitialPracticeAnswerState` 尚不存在。

### T3 测试要求

继续在同一测试文件中覆盖 reducer：

- `setAnswer` 只改 `answer`。
- `toggleSelectedOption` 第二次点击同一选项会取消。
- `setBlankValue` 只更新目标空位。
- `resetForQuestion` 会抛弃上一题输入，并按新题 blanks 长度重建。
- `setTrainingValues` 后再 `resetForQuestion` 会清空训练格值和完成态。

预期：先失败，再实现 reducer 让它通过。

### T5 接入要求

- `Practice.tsx` 不直接调用 `useReducer`。
- `Practice.tsx` 不保留换题 reset / focus effect。
- `handleSubmit` 从 `answerState` 读取 `answer`、`remainderInput`、`selectedOption`、`selectedOptions`、`blankValues`、`trainingValues`。
- JSX 中原来的 `setAnswer`、`setRemainderInput`、`setSelectedOption`、`setSelectedOptions`、`setBlankValues`、`setTrainingComplete`、`setTrainingValues` 调用，替换为 hook 返回的同语义方法。
- 训练格 `onComplete` 继续只表达“训练格已完成”，不直接触发提交。

## 六、启动 / 实施闸门

实施前闸门已满足：

- ✅ Phase 4 已完成收口；实施前已复核 `Practice.tsx` 的 Phase 4 反馈 / 提交流程。
- ✅ T1 行为基线测试先行，并按 TDD 红 / 绿路径约束初始化函数与 reducer。
- ✅ 未发现需要先补的 Phase 4 回归补丁。

## 七、验收

- [x] `npm test -- src/pages/practice-input-state.test.ts`：1 file / 11 tests passed
- [x] `npm test`：55 files / 713 tests passed
- [x] `npm run build`：TypeScript + Vite build 通过，仅既有 chunk size warning
- [x] `npx playwright test QA/e2e/phase5-practice-input-reset.spec.ts`：3 tests passed
- [x] `npx playwright test`：8 tests passed
- [x] 用户视角确认：切到下一题时，上一题输入不残留；提交反馈页不被提前清空；退出弹窗不受影响。

## 八、回写

- 已回写：`ProjectManager/Plan/v0.4/phases/phase-5.md`、`ProjectManager/Plan/v0.4/README.md`、`ProjectManager/Plan/v0.4/03-phase-plan.md`、`ProjectManager/Overview.md`、`ProjectManager/Backlog.md`。
- QA 记录：`QA/runs/2026-04-26-v04-phase5-practice-reset/qa-summary.md`。
- `BL-004` 已落地，待 v0.4 版本正式收口时从 Backlog 活跃区移入归档。

## 九、实施与 QA 结果

- 实现：新增 `src/pages/practice-input-state.ts`，将 Practice 输入态初始化、reducer、reset effect 与 focus 副作用统一封装进 `usePracticeInputState(currentQuestion)`。
- 接入：`Practice.tsx` 不再保留 7 个分散输入态 `useState` 与原换题 reset/focus effect；渲染和提交仍按原题型语义读取输入值。
- 测试：新增 `src/pages/practice-input-state.test.ts` 和 `QA/e2e/phase5-practice-input-reset.spec.ts`。
- QA：QAleader 三层验证通过，未发现新 ISSUE；完整记录见 `QA/runs/2026-04-26-v04-phase5-practice-reset/`。
