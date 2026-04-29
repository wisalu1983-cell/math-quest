# Phase 3 · 输入与反馈基础设施

> 所属版本：v0.5
> 创建：2026-04-29
> 所属主线：[../README](../README.md)
> 状态：🟡 有条件完成（`BL-011` 内置键盘与结构化错因反馈已实现并通过本地 QA；真实 Android / iOS 设备证据发布后线上补验）

---

## 目标

Phase 3 关闭 `BL-011`，并修复 `ISSUE-067`。本阶段要先把 Practice 计算输入和结构化错因反馈做成可复用基础设施，再让 Phase 4 的长除法 UI 复用同一套输入、提交、错因、错题本链路。

本阶段完成后，开发不应再需要猜以下问题：

- 移动端什么时候默认内置键盘，统一键盘 UI 如何根据 active slot 置灰不可用按键，以及系统键盘能力如何保留但不打扰首版 UI。
- 哪些题型输入要接入内置键盘，哪些不接入。
- 多行乘法过程格 / 小数训练格错时，失败面板和错题本显示什么。
- 结构化错因如何在类型、Store、Practice、WrongBook、同步合并之间传递。

## 输入

- v0.5 Phase 总图：[`../03-phase-plan.md`](../03-phase-plan.md)
- 执行纪律：[`../04-execution-discipline.md`](../04-execution-discipline.md)
- Phase 1 开工边界：[`../subplans/2026-04-28-v05-phase1-开工对齐与跨phase边界.md`](../subplans/2026-04-28-v05-phase1-开工对齐与跨phase边界.md)
- Phase 3 `BL-011` 子计划：[`../subplans/2026-04-29-v05-phase3-BL-011-计算输入内置键盘.md`](../subplans/2026-04-29-v05-phase3-BL-011-计算输入内置键盘.md)
- Phase 3 `ISSUE-067` 子计划：[`../subplans/2026-04-29-v05-phase3-ISSUE-067-结构化错因反馈.md`](../subplans/2026-04-29-v05-phase3-ISSUE-067-结构化错因反馈.md)
- A03 current spec：[`../../../Specs/a03-vertical-calc/current.md`](../../../Specs/a03-vertical-calc/current.md)
- 当前 issue：[`../../../ISSUE_LIST.md`](../../../ISSUE_LIST.md)
- 当前 backlog：[`../../../Backlog.md`](../../../Backlog.md)

## 范围

### 纳入

- `BL-011`：计算输入内置键盘核心能力、键盘面板、系统键盘呼出能力工程保留但 UI 屏蔽、Practice 计算字符输入接入策略。
- `ISSUE-067`：多行乘法竖式过程格 / 小数训练格结构化错因，统一失败面板展示，错题本展示。
- 为 Phase 4 长除法预留输入槽位协议、失败明细协议和键盘按键集合。
- 桌面、375px 手机竖屏、Chrome Android、Safari iOS 的验收口径。

### 不纳入

- 不实现 `BL-010` 长除法 UI；Phase 3 只预留协议，不做长除法板。
- 不重做错题本学习闭环；错题本只展示错题与错因，不支持重做。
- 不让历史记录 UI 展示错因；底层字段可保留，UI 不展示。
- 不依赖 `virtualKeyboardPolicy` 作为核心方案；它只能作为增强能力。
- 不改变 `ISSUE-067` 的判定规则：最终积正确但过程 / 训练格错误仍未通过。

## 子计划

| 子计划 | 目标 | 状态 | 备注 |
|---|---|---|---|
| [`BL-011` 计算输入内置键盘](../subplans/2026-04-29-v05-phase3-BL-011-计算输入内置键盘.md) | 建立统一计算输入模型和内置键盘，移动端默认不弹系统键盘 | 🟡 有条件完成 | 本地 QA 通过；真实 Android / iOS 设备证据发布后线上补验 |
| [`ISSUE-067` 结构化错因反馈](../subplans/2026-04-29-v05-phase3-ISSUE-067-结构化错因反馈.md) | 多行乘法失败时传递过程 / 训练格错因，并在反馈面板与错题本展示 | ✅ 完成 | 类型、Store、错题本、同步合并和旧 `failureReason` fallback 已验证 |

## 执行顺序

1. 先实现 `BL-011` 的纯输入 reducer、槽位协议和键盘组件，不接入全部题型前先用单元测试锁住插入、删除、按槽位显示字符和系统键盘切换。
2. 再接入普通答案、商余数、多空、表达式 / 等式、训练格和竖式格；移动端默认模式下不主动聚焦真实 `input/textarea/contenteditable`。
3. 实现 `ISSUE-067` 的结构化失败明细类型和 Store 传递，保留旧 `failureReason` 字段兼容。
4. 改造 `MultiplicationVerticalBoard`，从 `boolean` 回调升级为结构化 payload，区分最终答案错、过程格错、训练格错。
5. 在 `Practice` 统一失败面板和 `WrongBook` 展示错因；历史记录 UI 不展示。
6. 运行自动化、构建、移动端 / 浏览器拟真 QA；Phase 收口时再回写 current spec。

## 架构决策

| 维度 | Phase 3 决策 |
|---|---|
| 模块 ownership 与依赖方向 | 输入键盘归属 Practice 输入基础设施，建议新增 `src/pages/practice-math-keyboard.*` 或同级目录文件；题型组件只注册输入槽位和提交动作。错因反馈归属 `src/types/index.ts`、`src/store/index.ts`、`src/pages/Practice.tsx`、`src/pages/WrongBook.tsx`；多行乘法板只负责分析本板错误并返回 payload。 |
| 类型与 API 契约 | 新增输入槽位协议和键盘 action；槽位协议需包含按键启用 / 置灰与 sanitize 守门能力；新增结构化失败明细对象，同时保留 `PracticeFailureReason` 旧字符串。后续题型板不得新增裸 `boolean` 提交回调。 |
| 持久化 / 存档 / 迁移 | 失败明细字段均为可选字段，不 bump 存档版本；旧 wrongQuestions / history 只带 `failureReason` 时继续可读。同步合并应保留可选明细对象。 |
| 标识符命名空间与兼容 | 输入槽位 id 使用稳定前缀，如 `answer-main`、`remainder`、`blank-<index>`、`vertical-<row>-<col>`、`mult-<key>`；失败明细 code 使用 `vertical-*` 命名空间，旧 `wrong-answer`、`vertical-process` 不改名。 |
| UI 容量与响应式约束 | 375px 竖屏下键盘固定高度、按钮不溢出、反馈文案不遮挡下一步按钮；答题区高度占整体屏幕高度不得低于 60%；系统键盘呼出按钮首版 UI 屏蔽。 |
| 测试与 QA 映射 | 每个输入 action 有单测；每类接入有至少一个提交链路测试或 Playwright 验证；`ISSUE-067` 覆盖整数多行乘法和小数乘法训练格；移动端截图 / 拟真 QA 检查键盘和失败面板。 |

## 关键交互规则

- 计算字符输入包括普通答案、商余数、多空、表达式 / 等式、竖式格、多行乘法、小数训练格、未来长除法格。
- 选择题、判断题、多选按钮不接入内置键盘。
- 内置键盘采用统一布局，全量按键常驻；当前槽位不允许的按键置灰不可点击。
- 按键置灰只作为 UI 防误触；所有写入仍必须经过 active slot 的 sanitize 规则，兜住桌面键盘、粘贴、系统键盘兜底和测试注入。
- 移动端默认使用内置键盘，不自动弹系统键盘。
- Chrome Android 与 Safari iOS 必须通过默认内置键盘验收；其他浏览器允许降级为“内置键盘优先 + 系统键盘可同时弹出”。
- 系统键盘呼出能力工程保留，但首版 UI 屏蔽，不在答题区或内置键盘面板显示按钮。
- 内置键盘出现时，答题区高度占整体屏幕高度不得低于 60%。
- 过程格错因只显示类别，不显示用户值和正确值。
- 训练格错因显示具体类型、用户值和正确值。
- 错题本显示错因；历史记录 UI 不显示错因。

## 收尾条件

- ✅ `BL-011` 子计划本地验收项通过；真实 Android / iOS 设备证据为发布后线上补验项。
- ✅ `ISSUE-067` 子计划验收项通过。
- 🟡 Chrome Android / Safari iOS 移动端默认内置键盘路径：DEFERRED，用户已确认发布后线上环境验收。
- ✅ 手机竖屏预览和验收中，答题区高度占整体屏幕高度 ≥60%，且无可见系统键盘呼出按钮。
- ✅ 整数多行乘法“部分积错、最终积对”和小数乘法“训练格错、最终答数对”都有自动化或拟真 QA 证据。
- ✅ `npm test -- --run` 通过。
- ✅ `npm run build` 通过。
- ✅ 多源 PM 写入后运行 `npx tsx scripts/pm-sync-check.ts`。
- ✅ 已按 `Spec impact=update-at-phase-close` 回写 `ProjectManager/Specs/a03-vertical-calc/current.md` 与 `Specs/_index.md`。

## 当前状态

Phase 3 已于 2026-04-29 有条件完成。实现侧已落地统一内置键盘、槽位级 sanitize、移动端默认 `readOnly/inputMode=none`、结构化 `failureDetail`、反馈面板与错题本展示、同步合并保留明细。

QA 入口：[`../../../../QA/runs/2026-04-29-v05-phase3-input-feedback-qa/qa-summary.md`](../../../../QA/runs/2026-04-29-v05-phase3-input-feedback-qa/qa-summary.md)。自动化摘要为 59 files / 734 tests passed、13 Playwright tests passed、build 通过、scoped eslint / high audit / diff check 通过；全仓 lint 历史债仍为非阻塞 RISK。

剩余条件：真实 Android Chrome / iOS Safari 证据按用户确认转发布后线上环境验收，清单见 [`../../../../QA/runs/2026-04-29-v05-phase3-input-feedback-qa/real-device-checklist.md`](../../../../QA/runs/2026-04-29-v05-phase3-input-feedback-qa/real-device-checklist.md)。下一步准备进入 Phase 4：`BL-010` 竖式除法 UI 化答题。
