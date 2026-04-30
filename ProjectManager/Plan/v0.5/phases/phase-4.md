# Phase 4 · 竖式除法 UI 化答题

> 所属版本：v0.5
> 创建：2026-04-29
> 所属主线：[../README](../README.md)
> 状态：🟡 `BL-010` Q1-Q7 已补齐；UI 审核稿已按 2026-04-30 用户确认收口，可进入 coding

---

## 目标

Phase 4 承接 `BL-010` 竖式除法 UI 化答题功能。本阶段目标是把 A03 除法从“最终答案输入 / 普通训练格”推进到可交互、可判定、可反馈的长除法答题 UI：学生需要在结构化竖式界面中完成关键过程格和扩展训练格，系统按严格过程规则判定，并接入 Phase 3 已完成的输入槽位、内置键盘、结构化错因、反馈面板和错题本链路。

本文件只作为 Phase 4 阶段级入口，记录目标、输入、范围、决策门和收尾条件。完整数据结构、轮次模型、组件拆解、实现任务和验收映射下沉到 `BL-010` 子计划。

## 输入

- v0.5 Phase 总图：[`../03-phase-plan.md`](../03-phase-plan.md)
- 执行纪律：[`../04-execution-discipline.md`](../04-execution-discipline.md)
- Phase 1 开工边界：[`../subplans/2026-04-28-v05-phase1-开工对齐与跨phase边界.md`](../subplans/2026-04-28-v05-phase1-开工对齐与跨phase边界.md)
- Phase 3 输入与反馈基础设施：[`phase-3.md`](phase-3.md)
- Phase 3 `BL-011` 内置键盘子计划：[`../subplans/2026-04-29-v05-phase3-BL-011-计算输入内置键盘.md`](../subplans/2026-04-29-v05-phase3-BL-011-计算输入内置键盘.md)
- Phase 3 `BL-011` 自动换格统一化子计划：[`../subplans/2026-04-29-v05-phase3-BL-011-自动换格统一化.md`](../subplans/2026-04-29-v05-phase3-BL-011-自动换格统一化.md)
- Phase 3 `ISSUE-067` 结构化错因反馈子计划：[`../subplans/2026-04-29-v05-phase3-ISSUE-067-结构化错因反馈.md`](../subplans/2026-04-29-v05-phase3-ISSUE-067-结构化错因反馈.md)
- A03 current spec：[`../../../Specs/a03-vertical-calc/current.md`](../../../Specs/a03-vertical-calc/current.md)
- 当前 Backlog：[`../../../Backlog.md`](../../../Backlog.md)
- 当前 issue：[`../../../ISSUE_LIST.md`](../../../ISSUE_LIST.md)

## 范围

### 纳入

- `BL-010`：动态长除法核心板，覆盖商位、乘积、相减、余数、落位 / 补 0 等关键过程。
- 整数除法、小数 ÷ 整数、小数 ÷ 小数、取近似、循环小数的 UI 化答题口径。
- 小数 ÷ 整数的小数点系统预置，不作为学生输入格。
- 小数 ÷ 小数的扩倍转换作为计算前确认环节，通过后才进入实际竖式计算。
- 取近似只在计算后填写保留位数结果，不额外填写第 X+1 位数字。
- 循环小数使用“完整非循环部分 + 循环节”结构化输入；系统按中国常见循环点格式展示标准答数，循环节与展示长度需有上限。
- 复用 Phase 3 输入槽位、内置键盘、slot 级 `enabledKeys` / `sanitizeInput` / `shouldAutoAdvance`。
- 接入结构化错因：长除法过程格错误只显示类别；扩展训练格错误显示类型、用户值和正确值。
- 接入错题本；历史记录 UI 不展示错因。
- 桌面与 375px 手机竖屏适配，包含键盘固定视口底部时的答题区高度检查。

### 不纳入

- 不实现短除法方向；短除法与心算差异小，不作为本次 UI 化重点。
- 不把 `ISSUE-069` 并入 Phase 4；该问题作为 v0.5 Release Gate 前 P1 correctness hotfix 处理。
- 不重做 Phase 3 内置键盘基础设施；Phase 4 只按已有 slot 协议注册长除法输入格。
- 不新增错题本重做、同类题推荐或回到相关关卡入口。
- 不提前回写 `ProjectManager/Specs/a03-vertical-calc/current.md`；仅在 Phase 验收确认后按 Living Spec 制度回写。

## 前置状态

- ✅ Phase 1 已确认 `BL-010` 相关产品 / 体验决策：学生自己填写落位 / 补 0；循环小数采用“非循环部分 + 循环节”；超限题转入取近似题池。
- ✅ Phase 2 已完成 `BL-009`：低档竖式题样本过滤已减少明显口算型除法样例。
- 🟡 Phase 3 有条件完成：本地输入槽位、内置键盘、自动换格、结构化错因、错题本链路均已通过 QA；真实 Android Chrome / iOS Safari 默认内置键盘证据发布后线上补验，不阻塞 Phase 4 本地启动。
- ✅ v0.5 Phase 1~3 全量 QA 已通过本地与自动化门禁，保留真实设备 DEFERRED 和全仓 lint 历史 RISK。
- ✅ `ISSUE-068` 单行过程积乘法免重复答数已随 Phase 3 小修关闭，并被 v0.5 Phase 1~3 全量 QA 覆盖。

## 子计划

| 子计划 | 目标 | 状态 | 备注 |
|---|---|---|---|
| [`BL-010` 竖式除法 UI 化答题](../subplans/2026-04-29-v05-phase4-BL-010-竖式除法UI化答题.md) | 写明长除法轮次模型、输入格顺序、训练格、判定、错因、UI 容量、测试与 QA 映射 | 🟡 进行中 | Q1-Q7 已补齐；UI 审核稿已按 2026-04-30 用户确认收口，可进入 coding |

## 决策门

| 决策 | 处理要求 |
|---|---|
| 长除法数据结构 | 子计划必须明确轮次结构、每轮商位 / 乘积 / 余数 / 落位或补 0 的来源，以及如何从题目对象生成标准过程。 |
| 输入格 ownership | 长除法组件只注册 slot；内置键盘、按键置灰、sanitize、自动换格沿用 `src/pages/practice-math-keyboard.ts` 机制。 |
| 提交 API | 不新增裸 `boolean` 回调；必须返回可被 `Practice` 统一消费的结构化 payload，并兼容现有 `VerticalCalcCompletePayload` / `PracticeFailureDetail` 语义。 |
| 错因分类 | 过程格错误按类别展示，不暴露具体过程正确值；训练格错误展示类型、用户值、正确值。 |
| 小数 / 取近似 / 循环小数 | 子计划必须分别写清小数点预置、扩倍确认环节、取近似结果格、循环小数结构化输入、中国循环点标准格式和长度上限。 |
| UI 容量 | 375px 手机竖屏下，长除法板、失败面板、内置键盘不能互相遮挡；键盘出现时答题区高度占比仍需满足既有 60% 约束。 |
| 存档 / 同步 | 默认不新增必填字段；若新增 `failureReason` 或 `failureDetail` 扩展值，必须保持可选与旧数据兼容。 |
| Living Spec | `Spec impact` 预计为 `update-at-phase-close`；开发期只列待回写要点，验收确认后再回写 current spec。 |

## 收尾条件

- `BL-010` 子计划已创建，并满足 `dev-doc-flow` 的实现架构决策门、需求质量与验收可测性门、关键决策与备选方案门、游戏 / 学习体验验证门、Living Spec 决策门。
- 动态长除法核心板覆盖整数除法、小数 ÷ 整数、小数 ÷ 小数、取近似、循环小数的代表性题型。
- 所有需填写的过程格和训练格必须正确才通过；最终答案正确但过程 / 训练格错误时能给出明确错因。
- 长除法输入格接入 Phase 3 内置键盘和自动换格机制；桌面 Tab 顺序与 slot 顺序一致。
- 375px 手机竖屏下长除法板、内置键盘、反馈面板无文本溢出、遮挡或不可操作区域。
- `npm test -- --run` 通过。
- `npm run build` 通过。
- 涉及 UI / 体验时，有截图或拟真人工 QA 记录。
- 涉及 PM 多源写入时，`npx tsx scripts/pm-sync-check.ts` 通过。
- Phase 验收确认后，按 `Spec impact=update-at-phase-close` 回写 `ProjectManager/Specs/a03-vertical-calc/current.md` 与 `ProjectManager/Specs/_index.md`。

## 当前状态

Phase 4 阶段入口已建立，`BL-010` 子计划 Q1-Q7 已补齐：长除法轮次模型、数据结构、输入格顺序、题型覆盖样例、错因枚举、UI 容量验证和测试映射已写入子计划。UI 审核稿已按 2026-04-30 用户确认收口，当前预览版暂无其他问题。

下一步：进入 `BL-010` 正式代码实现；实现完成后按 Phase 4 L2 QA 和 Living Spec 回写流程收口。
