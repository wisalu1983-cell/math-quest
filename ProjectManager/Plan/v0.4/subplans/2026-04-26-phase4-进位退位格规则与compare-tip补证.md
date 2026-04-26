# Phase 4 进位/退位格规则与 compare tip 补证开发文档

> 创建：2026-04-26
> 所属版本：v0.4
> 父计划：v0.4-4
> 设计规格：`ProjectManager/Specs/2026-04-17-generator-redesign-v2.md`（v2.2）、`ProjectManager/Specs/2026-04-16-generator-difficulty-tiering-spec.md`（v1.0）、`ProjectManager/Specs/2026-04-09-a03-block-b-design.md`、`ProjectManager/Specs/2026-04-14-ui-redesign-spec.md`
> 功能 current spec：`ProjectManager/Specs/a03-vertical-calc/current.md`
> Spec impact：`update-at-phase-close`（`BL-005.2` A03 竖式过程格策略已回写）；`none`（`BL-003` compare tip 仅补证）
> 历史计划参考：`ProjectManager/Plan/v0.2/subplans/2026-04-22-4-4-method-tips.md`
> 状态：✅ 已实施并通过 QAleader 验收（2026-04-26）

---

## 一、背景

本计划承接 v0.4 Phase 4 的两个子项：

- `BL-005.2`：A03 竖式笔算进位/退位格按难度分层的显示、跳格、提交、判定、反馈、错题本规则。
- `BL-003`：A02 compare 概念题方法提示补证。

本计划是版本-phase 任务，主文档落在 `ProjectManager/Plan/v0.4/subplans/`。开发期不提前改写 current spec；Phase 4 验收通过后，`BL-005.2` 已按 Living Spec 制度回写到 `ProjectManager/Specs/a03-vertical-calc/current.md`。`BL-003` compare tip 本轮只补证既有行为，不改变 current spec。

### 前置相关规格

| 规格 / 证据 | 本计划继承的硬约束 |
|---|---|
| `ProjectManager/Specs/_index.md` | 调整现有题型的过程格/反馈判定时，必须查 A03 竖式规格、难度规格、UI 反馈规范；`2026-04-18-a03-block-b-plus-design.md` 标为历史参考，本阶段不能作为生效规格。 |
| `ProjectManager/Specs/2026-04-17-generator-redesign-v2.md` | A03 竖式笔算是 3 档题型；低档是基础竖式，中档新增一个明确负担，高档要有结构性升级。 |
| `ProjectManager/Specs/2026-04-16-generator-difficulty-tiering-spec.md` | 低档要让学生练到基础步骤；中档只新增一个明确负担；高档不靠简单数字放大，而靠结构性负担。 |
| `ProjectManager/Specs/2026-04-09-a03-block-b-design.md` | `VerticalCalcBoard` 是 A03 竖式交互入口；本计划只改现有竖式过程格规则，不重做小数乘除训练格方案。 |
| `ProjectManager/Specs/2026-04-14-ui-redesign-spec.md` | 答题页结果反馈走统一成功/失败面板；错误反馈用暖黄色鼓励态；题目 UI 遵守阳光版 v5 可读性和移动端容量约束。 |
| `ProjectManager/Plan/v0.2/subplans/2026-04-22-4-4-method-tips.md` | `compare` tip 触发条件为 `topicId=number-sense`、`subtype=compare`、`d<=8`、题型为 multi-select 或题干含“判断正误”；文案为“遇到‘一定’，先找反例”。 |
| `QA/runs/2026-04-22-4-tips-ui-qa/qa-result.md` | T04 曾在 `S3-LB-L2 d=8` 通过 compare tip 浏览器验收；但 `Backlog.md` 引用的 2026-04-23 收口补证路径当前工作区不存在，本 Phase 必须重新补证。 |
| `ProjectManager/Backlog.md` | `BL-005.2` 与 `BL-003` 均已纳入 v0.4 Phase 4；`BL-005.2` 的旧描述“简单难度答对即通过”已被本轮用户决策覆盖，以本文为准。 |

### Current spec 影响评估

| 项 | 结论 |
|---|---|
| 是否改变长期功能行为 / 数据契约 / QA 口径 | 是。`BL-005.2` 改变 A03 `vertical-fill` 过程格显示、跳格、提交拦截、结果分类、错题原因与 QA 口径；`BL-003` 只补证 compare tip 可达性，不改变长期行为。 |
| 预计回写位置 | `ProjectManager/Specs/a03-vertical-calc/current.md` |
| 已在 phase 验收后回写的要点 | 低档 / 中档 / 高档过程格策略；`VerticalCalcCompletePayload`；`failureReason='vertical-process'` 与 `processWarning='vertical-process-warning'`；可选持久化字段不 bump `CURRENT_VERSION`；相关代码与 QA 证据。 |

### 跨系统维度清单

- [x] 难度档位 / 题型梯度数：低 / 中 / 高三档规则均变更，但不改变 A03 3 档结构。
- [ ] 星级 / 进阶 / 段位数值：不改星级数值、进阶心数、段位赛赛制。
- [ ] 关卡结构 / campaign.ts：不改关卡结构和 lane。
- [x] UI 组件 / 卡片尺寸：改 `VerticalCalcBoard` 过程格显示、跳格和本地失败展示；改 Practice 统一反馈面板文案。
- [x] 答题形式 / 验证逻辑：新增竖式过程格策略判定器；改提交条件、结果类型、错题记录原因。
- [x] 存档 / 同步 / 数据迁移：需要给错题/答题记录增加可选失败原因字段；字段可选，不 bump `CURRENT_VERSION`，但要补类型和同步合并测试。
- [x] QA / 验收产物：需要策略单测、组件交互测试、store 流程测试、compare tip 补证、移动端/桌面手工走查。

## 二、目标与范围

### 目标

- 把 A03 `vertical-fill` 的进位/退位格规则按低 / 中 / 高三档确定并落地。
- 把复杂规则从 `VerticalCalcBoard` 中抽到纯逻辑策略层，UI 不自行推断规则。
- 保证低档题真正训练进位/退位过程：非 0 过程格必须填，填错不通过。
- 保证中档题不过度惩罚过程格：答案正确即通过，过程格错误只在统一结果 UI 给当前题提示。
- 保证高档题保持挑战感：不显示进位/退位格，只看最终答案。
- 补齐 compare tip 的可达性证据，确认目标场景仍能稳定把提示展示给学生。

### 非目标

- 不重做 `MultiplicationVerticalBoard` 的多行部分积交互。
- 不改 A03 生成器分布、题目数量、关卡结构。
- 开发期不提前新增目标态 Spec；验收收口后只回写已确认的 A03 current spec。
- 不把中档过程格错误写入错题本、历史原因、统计或段位复习权重。
- 不在答题过程中给任何答案格或过程格即时正确/错误提示。

## 三、已确认产品决策

### 3.1 三档规则矩阵

| 维度 | 低档 `difficulty<=5` | 中档 `difficulty=6-7` | 高档 `difficulty>=8` |
|---|---|---|---|
| 过程格显示 | 显示进位/退位格；包括期望值为 0 的过程格。 | 显示进位/退位格；过程格可选。 | 不显示进位/退位格。 |
| 过程格必填 | 所有期望值非 0 的过程格必填。期望值为 0 的过程格可留空，留空等同 0。 | 不必填。用户填了才参与过程提示判断。 | 无过程格。 |
| 答案格必填 | 必填。 | 必填。 | 必填。 |
| 提交条件 | 答案格全填，且非 0 过程格全填。 | 答案格全填。 | 答案格全填。 |
| 提交拦截 | 非 0 过程格未填时不能提交，并显眼提示“请把进位/退位格填完整”。 | 不因过程格拦截提交。 | 无过程格拦截。 |
| 答题中提示 | 不提示正确/错误。 | 不提示正确/错误。 | 不提示正确/错误。 |
| 结果判定 | 答案错则未通过；答案对但过程格错也未通过。 | 答案对即通过；用户填写的过程格有错时，通过但给当前题过程提示。 | 答案对即通过。 |
| 扣心 | `failWrongAnswer` 和 `failProcess` 都扣心。 | 答案正确时不扣心，即使过程格有错。 | 答案正确时不扣心。 |
| 错题本 | `failProcess` 进入错题本，原因类型为“进位/退位格填写错误”。 | 不进入错题本。 | 无过程格原因。 |
| 历史 / 统计 | 作为一次错误答题进入正常 session 记录；原因字段可选保存。 | 过程提示不写历史、不计统计。 | 无过程提示。 |

### 3.2 填写完整判定

| 格子类型 | 填写完整条件 |
|---|---|
| 答案格 | 单个数字 `0-9`。 |
| 加法过程格 | `0` 或 `1`。 |
| 减法过程格 | `0` 或 `-1`；单独 `-` 不完整，不能触发自动跳格。 |
| 乘法过程格 | `0-8`。 |

### 3.3 跳格规则

| 场景 | 规则 |
|---|---|
| 低档默认跳格 | 按计算步骤纳入过程格。例：`999+888` 填完个位答案后，自动聚焦十位进位格；填完十位进位格后，再聚焦十位答案格。 |
| 低档主动填写过程格 | 用户主动选中过程格并填完整后，自动聚焦同列答案格；若同列答案格已完成，则继续找下一个未完成答案格。 |
| 低档 0 过程格 | 不自动跳过。用户可填 `0`，也可手动跳到下一个格子。 |
| 低档手动跳过方式 | 移动端触摸下一个格子；桌面端鼠标点击、`Enter`、`Tab`。`Enter` / `Tab` 只允许跳过当前期望值为 0 的过程格，或移动已填完整的当前格。 |
| 中档默认跳格 | 填完答案格后，默认找下一个答案格，不自动进入过程格。 |
| 中档主动填写过程格 | 用户主动选中过程格并填完整后，自动聚焦同列答案格。 |
| 高档跳格 | 只在答案格之间移动。 |

### 3.4 反馈位置

| 结果类型 | 反馈位置与流程 |
|---|---|
| `pass` | 直接进入统一成功结果 UI。 |
| `failWrongAnswer` | 进入统一失败结果 UI；低档竖式板可在进入统一 UI 前显示错误格复盘。 |
| `failProcess` | 仅低档出现。先在竖式板本地复盘过程格错误，明确显示“未通过：进位/退位格填写错误”；用户点继续后进入统一失败结果 UI，扣心并加入错题本。 |
| `passWithProcessWarning` | 仅中档出现。竖式板不标红、不加黄色块；只在统一成功结果 UI 中显示当前题过程提示，提示结束即结束。 |

## 四、选定方案

采用 B 方案：新增“竖式过程格策略判定器”。

### 4.1 模块 ownership 与依赖方向

| 模块 | 职责 |
|---|---|
| `src/engine/vertical-calc-policy.ts` | 新增纯逻辑策略层。接收题目过程模型、难度、运算类型、填写状态和用户动作，输出显示、跳格、提交、结果分类。不得依赖 React、Zustand、DOM。 |
| `src/components/VerticalCalcBoard.tsx` | 渲染竖式格子；调用策略层决定可见格、必填格、跳格、提交拦截和本地复盘。不得自行写低/中/高规则分支。 |
| `src/pages/Practice.tsx` | 承接竖式板提交 payload，显示统一成功/失败结果 UI 和中档过程提示。 |
| `src/store/index.ts` | 承接低档 `failProcess` 的扣心、错题本、session 记录；中档 `passWithProcessWarning` 只保存在当前反馈状态。 |
| `src/pages/WrongBook.tsx` | 当错题带 `failureReason='vertical-process'` 时，显示“未通过原因：进位/退位格填写错误”。 |
| `src/utils/method-tips.ts` | compare tip 逻辑原则上不改；Phase 4 只补证。只有补证失败时才进入修复。 |

### 4.2 策略层输入契约

`vertical-calc-policy` 必须接收以下标准化输入：

| 输入项 | 类型要求 | 说明 |
|---|---|---|
| `operation` | 四种运算符之一：加、减、乘、除 | 本期只对 `+` / `-` / 单行 `×` 的过程格判定生效；`÷` 无过程格策略变更。 |
| `difficulty` | `number` | 映射为 `low` / `mid` / `high`。 |
| `columns` | 每列包含 `answerExpected`、`processExpected`、`hasProcessSlot` | `processExpected=0` 必须保留，不能因为是 0 而丢失。 |
| `stepOrder` | `VerticalCalcStep[]` 派生的有序 work item | 标准列由 generator steps 派生；缺失的 0 过程格由策略层按列补齐。低档默认焦点顺序为“当前答案格 → 下一列过程格 → 下一列答案格”，中档/高档默认焦点顺序只包含答案格；主动选中过程格时再按同列答案格回流。 |
| `values` | `{ answers: Record<number,string>; processes: Record<number,string> }` | 空字符串 / `undefined` 表示未填；不得把空值提前归一成 0。 |
| `activeCell` | `CellId` 或 `null` | `CellId` 取 `{ kind:'answer' }` 或 `{ kind:'process' }` 并带列号。 |
| `action` | `inputDigit` / `inputMinus` / `clear` / `clickCell` / `enter` / `tab` / `submit` | 策略层必须能判断动作是否触发跳格或提交拦截。 |

### 4.3 策略层输出契约

`vertical-calc-policy` 必须输出以下确定结果：

| 输出项 | 取值 |
|---|---|
| `visibleCells` | 低档/中档：答案格 + 过程格；高档：答案格。 |
| `requiredCells` | 所有答案格；低档期望值非 0 的过程格；中档/高档不要求过程格。 |
| `completion` | 当前格是否填完整；减法 `-` 必须返回未完成。 |
| `nextFocus` | 下一个焦点格，或 `null`。 |
| `canSubmit` | 是否允许提交。 |
| `submitBlockReason` | 低档非 0 过程格未填时返回 `missing-process`；其他情况为 `null`。 |
| `submitResult` | `pass` / `failWrongAnswer` / `failProcess` / `passWithProcessWarning`。 |
| `feedbackReason` | `wrong-answer` / `vertical-process` / `vertical-process-warning` / `null`。 |
| `wrongCells` | 提交后需要本地复盘的错误格；中档 `passWithProcessWarning` 不输出板上错误格。 |

### 4.4 结果优先级

提交时按以下顺序判定：

1. 答案格有误：`failWrongAnswer`。
2. 答案格全对，且低档过程格有误：`failProcess`。
3. 答案格全对，且中档用户填写过的过程格有误：`passWithProcessWarning`。
4. 其他情况：`pass`。

中档过程格留空不算错误；低档期望值为 0 的过程格留空按 0 处理。

## 五、实施拆解

| Task | 内容 | 状态 | 证据 |
|---|---|---|---|
| T1 | 策略层单测先行：覆盖显示、必填、填写完整、跳格、提交拦截、结果分类 | ✅ | `src/engine/vertical-calc-policy.test.ts` |
| T2 | 实现 `vertical-calc-policy` 纯函数层 | ✅ | `src/engine/vertical-calc-policy.ts` |
| T3 | `VerticalCalcBoard` 接入策略层，移除组件内散落的低/中/高过程格判定 | ✅ | `src/components/VerticalCalcBoard.tsx` |
| T4 | Practice / store 接入竖式提交 payload，支持 `failProcess` 与 `passWithProcessWarning` | ✅ | `src/pages/Practice.tsx`、`src/store/index.ts`、`src/store/index.test.ts` |
| T5 | 错题本展示低档过程失败原因；补可选持久化字段与同步合并测试 | ✅ | `src/types/index.ts`、`src/pages/WrongBook.tsx`、`src/sync/merge.test.ts` |
| T6 | compare tip 补证：复核触发测试并补浏览器/脚本证据 | ✅ | `src/utils/method-tips.test.ts`、`QA/runs/2026-04-26-v04-phase4-carry-policy/phase4-result.md` |
| T7 | QAleader 三层验收：单测、build、桌面/移动端拟真走查 | ✅ | `QA/runs/2026-04-26-v04-phase4-carry-policy/phase4-result.md` |

### T1 测试要求

必须先写失败测试，至少覆盖：

- 低档 `999+888`：填完个位答案后，下一焦点是十位进位格；主动选中 / 自动到达十位进位格并填 `1` 后，下一焦点是十位答案格。
- 低档无进位列：期望值为 0 的过程格可见，默认不会被自动跳过；按 `Enter` / `Tab` 可跳到下一格。
- 低档非 0 过程格未填：答案格全填也 `canSubmit=false`，`submitBlockReason='missing-process'`。
- 低档答案正确但过程格错：`submitResult='failProcess'`，`feedbackReason='vertical-process'`。
- 低档期望 0 过程格留空：按 0 判定，不阻塞提交。
- 中档答案格跳格：填完答案格默认跳下一个答案格，不进过程格。
- 中档主动填过程格：过程格填完整后跳同列答案格。
- 中档答案正确但过程格错：`passWithProcessWarning`，不输出板上错误格。
- 高档：不输出任何过程格。
- 减法过程格：输入 `-` 后不跳格，输入 `-1` 后才算完整。
- 乘法过程格：只接受 `0-8` 作为完整过程值。

### T4 提交流程要求

竖式板对 Practice 的提交 payload 固定为：

```ts
type VerticalCalcCompletePayload =
  | { result: 'pass'; answer: string }
  | { result: 'failWrongAnswer'; answer: string; failureReason: 'wrong-answer' }
  | { result: 'failProcess'; answer: string; failureReason: 'vertical-process' }
  | { result: 'passWithProcessWarning'; answer: string; warningReason: 'vertical-process-warning' };
```

Practice / store 的处理规则：

- `pass`：调用 `submitAnswer(answer)`，正确。
- `failWrongAnswer`：调用 `submitAnswer(answer, { failureReason:'wrong-answer' })`，错误。
- `failProcess`：调用 `submitAnswer(answer, { failureReason:'vertical-process' })`，错误，扣心，进入错题本。
- `passWithProcessWarning`：调用 `submitAnswer(answer, { processWarning:'vertical-process-warning' })`，正确；只设置当前反馈面板提示，不写错题本、不写历史原因、不计额外统计。

### T5 持久化要求

新增可选原因字段，不做存档版本升级：

```ts
type PracticeFailureReason = 'wrong-answer' | 'vertical-process';
type PracticeProcessWarning = 'vertical-process-warning';

interface QuestionAttempt {
  failureReason?: PracticeFailureReason;
}

interface HistoryQuestionRecord {
  failureReason?: PracticeFailureReason;
}

interface WrongQuestion {
  failureReason?: PracticeFailureReason;
}
```

原因：

- 旧存档没有该字段时仍合法。
- `wrongQuestions` 和 `historyRecords` 通过 JSON 字段保存，同步合并会保留对象字段。
- 不新增顶层 `GameProgress` 字段，不需要 bump `CURRENT_VERSION`。

测试必须证明：

- 低档 `failProcess` 进入 `pendingWrongQuestions` 和 `gameProgress.wrongQuestions` 时带 `failureReason='vertical-process'`。
- `mergeWrongQuestions()` 合并带原因字段的错题时不会丢字段。
- 中档 `passWithProcessWarning` 不进入 `pendingWrongQuestions`，不带 `failureReason` 写入 history。

## 六、验收

### 自动化验收

- [x] `npm test -- src/engine/vertical-calc-policy.test.ts`
- [x] `npm test -- src/store/index.test.ts src/sync/merge.test.ts src/utils/method-tips.test.ts`
- [x] `npm test -- --run`
- [x] `npm run build`
- [x] `npx playwright test QA/e2e/phase4-carry-focus.spec.ts`：固定 `999+888` 复测低档 / 中档焦点差异。
- [x] `npx eslint src/engine/vertical-calc-policy.ts src/engine/vertical-calc-policy.test.ts QA/e2e/phase4-carry-focus.spec.ts`
- [ ] `npm run lint`：当前失败于既有全局 lint 债（146 errors / 1 warning）；本轮改动文件 scoped lint 通过。

### 手工 / 拟真验收

| 场景 | 必须验证 |
|---|---|
| 低档加法 `999+888` | 过程格显示；填完个位答案后跳十位进位格；填完进位格后跳十位答案格；非 0 进位格未填不能提交；填错后未通过、扣心、进错题本。 |
| 低档无进位加法 | 0 过程格显示；留空可提交；可通过 `Enter` / `Tab` 或点击跳过。 |
| 低档减法退位 | `-` 不跳格；`-1` 才跳格；非 0 退位格未填不能提交。 |
| 低档乘法进位 | 过程格允许 `0-8`；非 0 进位格错时 `failProcess`。 |
| 中档过程格错误 | 答案正确仍通过；竖式板不标红、不显示黄色块；统一成功结果 UI 给当前题过程提示。 |
| 中档过程格留空 | 答案正确直接通过，无过程提示。 |
| 高档竖式 | 不显示过程格；只填答案格。 |
| 错题本 | 低档 `failProcess` 错题显示“未通过原因：进位/退位格填写错误”。 |
| compare tip | 目标 compare 概念题 `d<=8` 可稳定显示“遇到‘一定’，先找反例”；Boss `d=9` 不显示。 |
| 移动端 | 375px / 390px 竖屏下过程格、提示、按钮不重叠，触摸切格可用。 |
| 桌面端 | 鼠标点击、`Enter`、`Tab` 切格符合规则。 |

## 七、风险与回滚思路

| 风险 | 控制 |
|---|---|
| 竖式板组件继续堆逻辑，难以验证 | 规则必须先落到 `vertical-calc-policy` 纯函数；组件只消费输出。 |
| 低档 0 过程格被误判为必填 | 测试覆盖“留空等同 0，可提交”。 |
| 减法 `-1` 半截输入时提前跳格 | 测试覆盖 `-` 不完整，`-1` 完整。 |
| 中档过程错误误进错题本或历史 | store 测试覆盖 warning 不持久化。 |
| 新增持久化字段破坏旧存档 | 字段全部可选，不 bump version；同步合并测试覆盖字段保留。 |
| compare tip 补证依赖随机抽题不稳定 | 优先用可控题对象测试 `getMethodTip()`；浏览器补证使用固定 seed / 固定关卡 / dev hook 获取目标题。 |

回滚方式：

- 若策略层接入出问题，可回退 `VerticalCalcBoard` 对策略层的调用，恢复旧组件行为。
- `WrongQuestion.failureReason` 等可选字段不影响旧数据；回滚 UI 后字段留存在存档中也不会破坏读取。
- compare tip 补证若失败，先记录失败样本，再单独修 `getMethodTip()` 或生成器触发条件。

## 八、回写

- 实施完成后回写 `ProjectManager/Plan/v0.4/phases/phase-4.md`。
- 若新增 QA run，回写本计划与 Phase 4；原始 QA run 是否入库按 QAleader 规则执行。
- 若 Phase 4 全部完成，更新 `ProjectManager/Plan/v0.4/README.md`、`ProjectManager/Plan/v0.4/03-phase-plan.md` 和 `ProjectManager/Overview.md`。
- `BL-003`、`BL-005.2` 已在 v0.4 收口时从 `Backlog.md` 活跃区移入已落地归档。
