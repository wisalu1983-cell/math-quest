# A03 Vertical Calc Current Spec

> 功能 slug：`a03-vertical-calc`
> 当前状态：已实施并作为 A03 竖式笔算当前权威行为生效
> 首次建立：2026-04-26
> 最近确认：2026-04-26
> 最近来源：`ProjectManager/Plan/v0.4/subplans/2026-04-26-phase4-进位退位格规则与compare-tip补证.md`、`QA/runs/2026-04-26-v04-phase4-carry-policy/phase4-result.md`、当前代码入口

---

## 1. 当前承诺

- A03 `vertical-calc` 是 5 星 / 3 档题型；低档训练基础竖式步骤，中档增加一个明确负担，高档以结构性负担为主。
- `vertical-fill` 的单行加 / 减 / 乘过程格规则由 `src/engine/vertical-calc-policy.ts` 统一判定；UI 只消费策略输出。
- 低档 `difficulty<=5` 必须训练进位 / 退位过程：非 0 过程格必填，答案对但过程格错仍未通过。
- 中档 `difficulty=6-7` 不因过程格惩罚学生：答案正确即通过，过程格错误只给当前题提示。
- 高档 `difficulty>=8` 不显示进位 / 退位过程格，只填写答案格。
- 新增错题原因字段均为可选字段，不触发存档版本升级；同步合并必须保留低档过程失败原因。

## 2. 当前行为

### 2.1 适用范围

- 本 current spec 约束 A03 `vertical-calc` 的 `vertical-fill` 交互与判定，尤其是单行 `+` / `-` / `×` 的过程格。
- 多行乘法竖式仍由 `src/components/MultiplicationVerticalBoard.tsx` 承载。
- 除法本轮不新增进位 / 退位过程格策略。

### 2.2 过程格三档策略

| 维度 | 低档 `difficulty<=5` | 中档 `difficulty=6-7` | 高档 `difficulty>=8` |
|---|---|---|---|
| 过程格显示 | 显示进位 / 退位格，包括期望值为 0 的过程格 | 显示进位 / 退位格，过程格可选 | 不显示过程格 |
| 过程格必填 | 所有期望值非 0 的过程格必填；期望值为 0 的过程格可留空，留空等同 0 | 不必填；用户填了才参与过程提示判断 | 无过程格 |
| 提交条件 | 答案格全填，且非 0 过程格全填 | 答案格全填 | 答案格全填 |
| 结果判定 | 答案错为 `failWrongAnswer`；答案对但过程格错为 `failProcess` | 答案对即通过；填写过的过程格错为 `passWithProcessWarning` | 答案对即通过 |
| 错题 / 历史 | `failProcess` 扣心、进错题本，并记录 `failureReason='vertical-process'` | 过程提示只保存在当前反馈状态，不写错题本 / 历史原因 / 统计 | 无过程提示 |

### 2.3 填写与跳格

- 答案格完整条件是单个数字 `0-9`。
- 加法过程格完整条件是 `0` 或 `1`。
- 减法过程格完整条件是 `0` 或 `-1`；单独 `-` 不完整，不能触发自动跳格。
- 乘法过程格完整条件是 `0-8`。
- 低档默认焦点顺序按计算步骤进入过程格，例如 `999+888` 填完个位答案后聚焦十位进位格，进位格填完后聚焦十位答案格。
- 低档 0 过程格不自动跳过；用户可填 `0`，也可点击 / 触摸 / `Enter` / `Tab` 跳到下一格。
- 中档默认只沿答案格跳转；用户主动选中过程格并填完整后，回到同列答案格。
- 高档只在答案格之间移动。

### 2.4 反馈与数据契约

- `VerticalCalcBoard` 对 `Practice` 的完成 payload 使用 `VerticalCalcCompletePayload`：
  - `pass`
  - `failWrongAnswer`
  - `failProcess`
  - `passWithProcessWarning`
- `failProcess` 在竖式板内先显示本地复盘，再进入统一失败结果 UI。
- `passWithProcessWarning` 不在竖式板标红，只在统一成功结果 UI 显示“进位/退位过程有误，但本题答案正确，已通过”。
- `QuestionAttempt`、`HistoryQuestionRecord`、`WrongQuestion` 可带 `failureReason?: 'wrong-answer' | 'vertical-process'`。
- `processWarning='vertical-process-warning'` 只用于当前反馈面板，不持久化为错题原因。

## 3. 非承诺 / 边界

- 本 current spec 不重做 A03 生成器分布；Phase 3 的乘法分布与除法样本池治理仍由对应 Phase 3 文档承载。
- 本 current spec 不改变 A03 星级数、关卡结构、段位赛赛制或进阶心数。
- 中档过程格错误不代表学生本题失败，不进入错题本、历史原因、统计或段位复习权重。
- `BL-003` compare tip 在 Phase 4 只是补证既有行为，不归入本 A03 current spec。
- 全局 lint 仍有既有债；Phase 4 使用本轮改动文件 scoped lint 控制新增风险。

## 4. 来源与证据

| 类型 | 路径 | 说明 |
|---|---|---|
| 当前 phase subplan | `ProjectManager/Plan/v0.4/subplans/2026-04-26-phase4-进位退位格规则与compare-tip补证.md` | Phase 4 完整设计、实施拆解、验收结论和 `Spec impact` |
| Phase 入口 | `ProjectManager/Plan/v0.4/phases/phase-4.md` | Phase 4 范围、决策和收尾状态 |
| 历史规格 | `ProjectManager/Specs/2026-04-09-a03-block-b-design.md` | A03 竖式交互历史基线 |
| 难度规格 | `ProjectManager/Specs/2026-04-16-generator-difficulty-tiering-spec.md` | 低 / 中 / 高三档认知边界 |
| 生成器规格 | `ProjectManager/Specs/2026-04-17-generator-redesign-v2.md` | A03 仍为 3 档题型 |
| QA / 验收 | `QA/runs/2026-04-26-v04-phase4-carry-policy/phase4-result.md` | Code Review、自动化、Playwright、拟真人工结论 |
| 策略代码 | `src/engine/vertical-calc-policy.ts`、`src/engine/vertical-calc-policy.test.ts` | 三档策略、跳格、提交、结果分类 |
| UI / Store | `src/components/VerticalCalcBoard.tsx`、`src/pages/Practice.tsx`、`src/pages/WrongBook.tsx`、`src/store/index.ts` | 竖式板接入、统一反馈、错题原因链路 |
| 数据 / 同步 | `src/types/index.ts`、`src/sync/merge.test.ts` | 可选原因字段和同步合并保留 |

## 5. 变更记录

| 日期 | 来源 | 当前状态变化 |
|---|---|---|
| 2026-04-09 | `ProjectManager/Specs/2026-04-09-a03-block-b-design.md` | 建立 A03 竖式交互基础设计 |
| 2026-04-25 | `ProjectManager/Plan/v0.4/subplans/2026-04-25-bl-005-乘法竖式与Phase1修复.md` | 多位整数乘法竖式与小数答案兼容在 v0.4 Phase 1 落地 |
| 2026-04-26 | `ProjectManager/Plan/v0.4/subplans/2026-04-26-phase4-进位退位格规则与compare-tip补证.md` | Phase 4 验收后建立本 current spec，吸收低 / 中 / 高过程格策略、反馈与可选数据契约 |
