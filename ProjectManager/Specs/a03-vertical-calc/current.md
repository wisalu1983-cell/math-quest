# A03 Vertical Calc Current Spec

> 功能 slug：`a03-vertical-calc`
> 当前状态：已实施并作为 A03 竖式笔算当前权威行为生效
> 首次建立：2026-04-26
> 最近确认：2026-04-30
> 最近来源：`ProjectManager/Plan/v0.5/phases/phase-4.md`、`ProjectManager/Plan/v0.5/subplans/2026-04-29-v05-phase4-BL-010-竖式除法UI化答题.md`、`ProjectManager/Plan/v0.5/subplans/2026-04-30-v05-phase4-BL-010-竖式除法正式版原型还原修复.md`、`QA/runs/2026-04-30-v05-phase4-long-division-qa/qa-summary.md`、`QA/runs/2026-04-30-v05-phase4-long-division-parity-qa/qa-summary.md`、当前代码入口

---

## 1. 当前承诺

- A03 `vertical-calc` 是 5 星 / 3 档题型；低档训练基础竖式步骤，中档增加一个明确负担，高档以结构性负担为主。
- `vertical-fill` 的单行加 / 减 / 乘过程格规则由 `src/engine/vertical-calc-policy.ts` 统一判定；UI 只消费策略输出。
- 低档 `difficulty<=5` 必须训练进位 / 退位过程：非 0 过程格必填，答案对但过程格错仍未通过。
- 中档 `difficulty=6-7` 不因过程格惩罚学生：答案正确即通过，过程格错误只给当前题提示。
- 高档 `difficulty>=8` 不显示进位 / 退位过程格，只填写答案格。
- 新增错题原因字段均为可选字段，不触发存档版本升级；同步合并必须保留低档过程失败原因。
- 单行竖式中的已知操作数与运算符必须使用高对比正文色；只有空白对齐格可使用浅色占位样式。
- 单行竖式输入必须只有一个字符消费入口：hidden input 的 `onInput` 负责数字、`-`、软键盘与粘贴，`onKeyDown` 只处理 `Backspace` / `Delete` / `Enter` / `Tab` 控制键。
- A03 低档竖式样本必须排除第一批已确认的心算候选：`difficulty<=3` 的 `int-mul` 不生成 `2位数 × 1位数`；`difficulty<=5` 的一位除数整数除法过滤 D0 逐段整除型，并以 D2 多次余数传递、D3 商中间 0 为主。
- A03 / Practice 计算字符输入在移动端默认使用内置计算键盘；首版 UI 不显示系统键盘呼出按钮，工程层保留当前槽位系统键盘状态。
- 内置计算键盘必须固定在视口底部，不随题卡或页面内容一起滚动；实现上需避免被题卡 / transform 布局上下文限制。
- 内置键盘使用 5 列 x 4 行全量按键布局：`1 2 3 = 删除 / 4 5 6 + - / 7 8 9 × ÷ / . 0 x ( )`；左三列主输入区宽于右两列符号区，删除键独立使用危险色语义。
- 计算输入槽位通过 `enabledKeys` 决定按键可用 / 置灰，通过 `sanitizeInput` 兜底桌面键盘、粘贴、系统键盘和测试注入；不可只依赖 UI disabled 防守。
- 计算输入槽位可声明 `shouldAutoAdvance`；默认不自动换格，`delete` 不自动换格，题型所需答案长度由题型组件闭包捕获，不由键盘层传题目语义。
- 商余数、multi-blank、trainingFields 按各自标准答案长度自动进入下一 slot；普通单答案、表达式 / 等式和最终答数不自动换格。
- 多行乘法竖式的部分积 / 总积按实际笔算从右侧低位到左侧高位输入；桌面 `Tab` / `Shift+Tab` 顺序必须与内置键盘 slot 顺序一致。
- 多行乘法竖式最终答案正确但部分积 / 合计过程格错误时，仍判未通过，并展示过程类别文案；小数乘法训练格错误时展示训练格类型、用户值和正确值。
- A03 除法题可通过显式 `longDivisionBoard` 进入长除法 UI；旧 `numeric-input + operation='÷'` 且无该字段的历史题继续走旧路径，不要求迁移。
- 长除法 UI 覆盖整数除法、小数 ÷ 整数、小数 ÷ 小数、取近似和循环小数结构化输入；小数 ÷ 小数先完成扩倍字段，扩倍确认通过后转换区退出主输入区，主体替换为实际竖式计算；循环小数填写完整非循环部分和循环节。
- 长除法核心板使用纸面长除法版式：弯除号、横线、被除数逐位排布、商位在上方，乘积和余数 / 落位按位对齐。
- 长除法核心过程字段按“商位 -> 乘积 -> 余数 / 落位或最终余数”顺序输入；UI 层拆为逐位小格和 digit-level slot，字段值仍聚合到原 `fieldId`，所有可见过程格与结构化字段均正确才通过。
- 长除法过程格错误使用 `failureReason='vertical-long-division-process'` 与 `failureDetail.source='long-division'`；反馈只展示类别，不暴露中间过程正确值。
- `failureDetail` 为可选结构化错因对象，不触发存档版本升级；当前反馈、错题本、历史记录底层数据和同步合并必须保留该字段，历史记录 UI 不展示错因。

## 2. 当前行为

### 2.1 适用范围

- 本 current spec 约束 A03 `vertical-calc` 的 `vertical-fill` 交互与判定，包含单行 `+` / `-` / `×` 过程格、多行乘法竖式和长除法 UI。
- 多行乘法竖式仍由 `src/components/MultiplicationVerticalBoard.tsx` 承载。
- 长除法竖式由 `src/components/LongDivisionBoard.tsx` 承载，并通过 `VerticalCalcBoard` 内部数据分支挂载。

### 2.2 样本准入与过滤

- `src/engine/generators/vertical-calc.ts` 是 A03 竖式题样本准入规则的主 ownership。
- `difficulty<=3` 的 `int-mul` 排除 `2位数 × 1位数`，低档起步改为 `3位数 × 1位数`。
- `difficulty<=5` 的 `int-div` 保持一位除数整数商样本，但过滤 D0 逐段整除型，例如 `888 ÷ 4`、`844 ÷ 4`、`208 ÷ 4`。
- 一位除数整数除法低档分层：D1 为单次余数传递、少量过渡；D2 为多次余数传递且最后整除；D3 为商中间 0。D2 / D3 是低档除法主力样本。
- 抽样诊断的 P0 强候选口径为 `mul-2d-by-1d` 与除一位整数 D0；P1 复核项 `3位数 × 1位数`、`4位数 ÷ 1位数` 暂不整体过滤。

### 2.3 过程格三档策略

| 维度 | 低档 `difficulty<=5` | 中档 `difficulty=6-7` | 高档 `difficulty>=8` |
|---|---|---|---|
| 过程格显示 | 显示进位 / 退位格，包括期望值为 0 的过程格 | 显示进位 / 退位格，过程格可选 | 不显示过程格 |
| 过程格必填 | 所有期望值非 0 的过程格必填；期望值为 0 的过程格可留空，留空等同 0 | 不必填；用户填了才参与过程提示判断 | 无过程格 |
| 提交条件 | 答案格全填，且非 0 过程格全填 | 答案格全填 | 答案格全填 |
| 结果判定 | 答案错为 `failWrongAnswer`；答案对但过程格错为 `failProcess` | 答案对即通过；填写过的过程格错为 `passWithProcessWarning` | 答案对即通过 |
| 错题 / 历史 | `failProcess` 扣心、进错题本，并记录 `failureReason='vertical-process'` | 过程提示只保存在当前反馈状态，不写错题本 / 历史原因 / 统计 | 无过程提示 |

### 2.4 填写与跳格

- 答案格完整条件是单个数字 `0-9`。
- 加法过程格完整条件是 `0` 或 `1`。
- 减法过程格完整条件是 `0` 或 `-1`；单独 `-` 不完整，不能触发自动跳格。用户在退位格输入 `1` 时，UI 语义解释为“退 1”，内部保存为 `-1`，格内显示为 `退1`。
- 乘法过程格完整条件是 `0-8`。
- hidden input 使用非受控 DOM 值；每次 `onInput` 消费或拒绝输入后都清空 DOM value，避免同一字符残留或跨格重复消费。
- 粘贴 / 组合输入若一次产生多个字符，竖式板拒绝整段输入并清空 hidden input，继续要求逐格填写。
- 软键盘删除事件 `inputType='deleteContentBackward'` / `deleteContentForward` 清空当前活动格；硬键盘 `Backspace` / `Delete` 保持相同清空语义。
- 低档默认焦点顺序按计算步骤进入过程格，例如 `999+888` 填完个位答案后聚焦十位进位格，进位格填完后聚焦十位答案格。
- 低档 0 过程格不自动跳过；用户可填 `0`，也可点击 / 触摸 / `Enter` / `Tab` 跳到下一格。
- 中档默认只沿答案格跳转；用户主动选中过程格并填完整后，回到同列答案格。
- 高档只在答案格之间移动。

### 2.5 反馈与数据契约

- `VerticalCalcBoard` 对 `Practice` 的完成 payload 使用 `VerticalCalcCompletePayload`：
  - `pass`
  - `failWrongAnswer`
  - `failProcess`
  - `passWithProcessWarning`
- `failProcess` 在竖式板内先显示本地复盘，再进入统一失败结果 UI。
- `passWithProcessWarning` 不在竖式板标红，只在统一成功结果 UI 显示“进位/退位过程有误，但本题答案正确，已通过”。
- `QuestionAttempt`、`HistoryQuestionRecord`、`WrongQuestion` 可带 `failureReason?: 'wrong-answer' | 'vertical-process' | 'vertical-multiplication-process' | 'vertical-long-division-process' | 'vertical-training-field'`。
- `QuestionAttempt`、`HistoryQuestionRecord`、`WrongQuestion` 可带 `failureDetail?: PracticeFailureDetail`；该字段为可选，不 bump 存档版本。
- `processWarning='vertical-process-warning'` 只用于当前反馈面板，不持久化为错题原因。
- 多行乘法竖式提交使用结构化 `VerticalCalcCompletePayload`，不再只返回 `boolean`；`classifyMultiplicationErrors()` 负责区分最终答案错、过程格错、训练格错和过程格 + 训练格同时错。
- 最终答案错误时仍按普通错答展示，不额外暴露过程格正确值。
- 最终答案正确但多行乘法过程格错误时，统一失败面板展示“你的最终答案是对的，但竖式里的计算步骤有错误。把步骤也写对，才能通过哦。”方向文案，并显示 `部分积填写错误`、`竖式求和过程填写错误` 或 `竖式过程填写错误` 等类别。
- 最终答案正确但小数乘法训练格错误时，统一失败面板展示训练格明细，例如“小数点移动位数错误：你填 1，正确是 2”；用户值为空时显示“未填写”。
- 错题本展示结构化错因摘要和训练格明细；历史记录 UI 不展示错因，但底层记录可保留 `failureReason` / `failureDetail` 供未来分析。
- 旧错题只有 `failureReason='vertical-process'` 且没有 `failureDetail` 时，仍显示旧文案 fallback，不白屏、不显示技术字段。
- 长除法过程错因即使缺少 `failureDetail`，fallback 也必须显示“本题未通过：竖式过程有误。”，不得落到 legacy 进位 / 退位文案。

### 2.6 长除法 UI

- 新生成的 A03 除法 `vertical-fill` 题通过 `data.longDivisionBoard` 显式声明长除法任务；`VerticalCalcBoard` 先识别多行乘法板，再识别长除法板，最后才走 legacy 单行竖式。
- `LongDivisionBoardData` 至少包含原始被除数 / 除数、工作被除数 / 除数、最终答案、商位起点、商小数点位置、板宽、轮次数组、标准答案字典；字段为题目数据的一部分，不依赖 UI 临时推断。
- 每轮长除法标准过程包含当前工作数、商位、乘积、余数，以及落位 / 补 0 后的新工作数；最后一轮没有新工作数时填写最终余数。
- 输入顺序为前置扩倍字段（如有） -> 每轮商位、乘积、余数与落位 / 最终余数 -> 后置结果字段（如有）。桌面 `Tab` 顺序与内置键盘 slot 顺序一致；核心过程字段在 UI 上拆成逐位小格，digit slot 回写完整字段字符串。
- 整数除法与小数 ÷ 整数直接进入长除法板；商的小数点由系统预置，不作为学生输入格。
- 小数 ÷ 小数先填写扩倍倍数、转换后除数、转换后被除数；转换后除数必须可归一为整数。转换确认通过后，转换区不再作为主输入区显示，页面进入实际竖式计算。中档转换错在本地提示并停留，高档转换错直接进入结构化失败反馈。
- 长除法板初始只显示当前可填写的第一格；后续过程格按 active slot、已填写值和 submitted 状态逐步显现，避免一次性铺满未到达的过程。
- 长除法板视觉必须保留纸面竖式心智：除数在左、弯除号包住被除数、商在上方、乘减横线和工作数按位对齐；移动端允许板内自适应压缩或局部滚动，但不得造成全页横向滚动。
- 取近似题计算到保留位后一位，并在长除法板后填写“保留 X 位小数”结果字段。
- 循环小数题填写完整非循环部分和循环节；生产入口为高档 `cyclic-div`，循环节最长 3 位，超限样例不进入该结构化题池；竖式商位末尾显示省略号，结果区显示带循环点的“标准格式答数”预览。
- 长除法过程格错误只展示具体步骤类别，例如 `第 1 轮商位错误`、`第 2 轮乘积错误`、`第 3 轮余数与落位错误`、`第 4 轮最终余数错误`；扩倍字段、取近似字段、循环字段属于结构化字段错误，可展示用户值和正确值。
- 长除法板接入 Phase 3 内置键盘、slot 级 `enabledKeys` / `sanitizeInput` / `shouldAutoAdvance`；过程格数字键有效，结构化小数字段允许小数点。
- 375x812、390x844 与桌面视口均需有 QA 证据；移动端键盘固定底部时非键盘区高度比例需不低于 60%。

### 2.7 内置计算键盘

- 输入基础设施由 `src/pages/practice-math-keyboard.ts`、`src/pages/PracticeMathKeyboard.tsx` 和 `Practice.tsx` 的 slot 注册共同承载；题型组件只声明输入槽位、当前值、可用按键、sanitize 和 setter。
- 移动端 / 触摸设备默认走内置键盘，真实输入控件使用 `readOnly=true` 与 `inputMode='none'`，避免主动弹系统键盘；桌面保留真实输入焦点与硬键盘输入，内置键盘作为辅助面板。
- 键盘面板通过 portal 挂到 `document.body` 并固定在视口底部；答题内容需要保留可滚动底部空间，避免当前输入和提交按钮被固定键盘永久遮挡。
- 当前填写格必须有明确 active 样式；active slot 变化通过隐藏的 `aria-live='polite'` 播报槽位 label。
- 统一键盘全量按键常驻；数字 / 小数点 / 变量 `x` 属主输入区，运算符 / 等号 / 括号属符号区，删除键独立分组。
- `x` 使用计算式未知数字体，与乘号 `×` 的 UI sans 字体区分。
- 不适用于当前 slot 的按键必须显著禁用：disabled、虚线边框、低透明度和灰色 token 共同表达不可用。
- `MathInputSlot.shouldAutoAdvance` 是自动换格的统一声明入口。键盘层在有效非删除键写入后调用该声明，若返回 true，则按当前 `slots` 顺序激活下一 slot。
- 完成条件需要的外部信息，例如商长度、blank 标准答案长度、training field 标准答案长度、乘法格预期长度，必须由对应题型组件在构建 slot 时闭包捕获。
- 商余数中只有商达到标准长度后自动进入余数，余数不继续自动跳；multi-blank 和 trainingFields 按字段顺序逐格移动；普通答案、表达式 / 等式、最终答数不自动跳。
- legacy 单行竖式继续由 `getNextFocus()` 保留低 / 中 / 高三档动态策略；内置键盘仍通过统一 slot `setValue` 写入。
- 多行乘法板的操作数空格按左到右，部分积 / 总积按行内右到左、行序上到下；桌面 `Tab` / `Shift+Tab` 与同一 `orderedInputKeys` 保持一致。
- 首版 UI 不显示系统键盘呼出按钮；工程状态 `useSystemKeyboardForSlotId` 或等价能力可用于后续辅助功能 / 设置入口。
- QA 已验证 390x844 手机模拟下非键盘区高度占比为 74.6%，满足答题区高度占比 ≥60%。
- 真实 Android Chrome / iOS Safari 默认不弹系统键盘证据因本地局域网访问不稳定，已转发布后线上环境验收；清单见 `QA/runs/2026-04-29-v05-phase3-input-feedback-qa/real-device-checklist.md`。

### 2.8 视觉可读性

- `VerticalCalcBoard` legacy single-line board 中，已知操作数、运算符、小数点和答案输入内容都属于主体信息，不得复用 `.digit-cell-empty` 的 `text-text-3` 占位色。
- 空白对齐格继续使用 `.digit-cell-empty`，保留 `text-text-3` 的低强调占位样式。
- release gate 复测以 `999 + 888` 为固定样例，要求 `999`、`888`、`+` 为 `text-text` 高对比正文色，空白对齐格仍为浅灰。

## 3. 非承诺 / 边界

- 本 current spec 只吸收 `BL-009` 第一批 P0 样本准入规则；`3位数 × 1位数`、`4位数 ÷ 1位数`、无进退位低档加减仍属 P1/P2 待复核，不在本次整体过滤。
- 本 current spec 不改变 A03 星级数、关卡结构、段位赛赛制或进阶心数。
- 中档过程格错误不代表学生本题失败，不进入错题本、历史原因、统计或段位复习权重。
- `BL-003` compare tip 在 Phase 4 只是补证既有行为，不归入本 A03 current spec。
- 全局 lint 仍有既有债；Phase 4 使用本轮改动文件 scoped lint 控制新增风险。
- 内置键盘的真实设备证据尚未在本地 dev server 补齐；发布后线上环境补证前，不能宣称 Android Chrome / iOS Safari 真实设备已通过。
- 错题本重做、同类题推荐、回到相关关卡等学习行动路径不属于 Phase 3 当前承诺；后续候选见 `BL-013`。

## 4. 来源与证据

| 类型 | 路径 | 说明 |
|---|---|---|
| 当前 phase subplan | `ProjectManager/Plan/v0.4/subplans/2026-04-26-phase4-进位退位格规则与compare-tip补证.md` | Phase 4 完整设计、实施拆解、验收结论和 `Spec impact` |
| Phase 入口 | `ProjectManager/Plan/v0.4/phases/phase-4.md` | Phase 4 范围、决策和收尾状态 |
| 历史规格 | `ProjectManager/Specs/2026-04-09-a03-block-b-design.md` | A03 竖式交互历史基线 |
| 难度规格 | `ProjectManager/Specs/2026-04-16-generator-difficulty-tiering-spec.md` | 低 / 中 / 高三档认知边界 |
| 生成器规格 | `ProjectManager/Specs/2026-04-17-generator-redesign-v2.md` | A03 仍为 3 档题型 |
| QA / 验收 | `QA/runs/2026-04-26-v04-phase4-carry-policy/phase4-result.md` | Code Review、自动化、Playwright、拟真人工结论 |
| v0.4 hotfix | `ProjectManager/Plan/v0.4/subplans/2026-04-26-ISSUE-066-竖式输入单入口与退位语义.md` | `ISSUE-066` 根因、单一输入入口方案、联动检查和验收记录 |
| Hotfix QA | `QA/runs/2026-04-26-v04-hotfix-vertical-input/qa-summary.md` | `ISSUE-066` 红绿回归、全量 Playwright、全量单测和 build 证据 |
| Release Gate QA | `QA/runs/2026-04-26-v04-release-gate/qa-summary.md`、`QA/runs/2026-04-26-v04-release-gate/visual-result.md` | `ISSUE-065` 单行竖式高对比回归补测通过 |
| v0.5 Phase 2 subplan | `ProjectManager/Plan/v0.5/subplans/2026-04-28-v05-phase2-BL-009-竖式题样本质量诊断与过滤规则.md` | `BL-009` 诊断、过滤规则、实施后复测和验收命令 |
| v0.5 Phase 3 phase | `ProjectManager/Plan/v0.5/phases/phase-3.md` | Phase 3 范围、收尾条件、有条件完成状态和 Phase 4 准备状态 |
| v0.5 Phase 3 keyboard subplan | `ProjectManager/Plan/v0.5/subplans/2026-04-29-v05-phase3-BL-011-计算输入内置键盘.md` | 统一内置键盘、槽位协议、移动端默认策略、真实设备补验证据口径 |
| v0.5 Phase 3 keyboard auto-advance follow-up | `ProjectManager/Plan/v0.5/subplans/2026-04-29-v05-phase3-BL-011-自动换格统一化.md` | slot 级自动换格、固定底部、乘法右到左输入顺序和桌面 Tab 顺序 |
| v0.5 Phase 3 failure subplan | `ProjectManager/Plan/v0.5/subplans/2026-04-29-v05-phase3-ISSUE-067-结构化错因反馈.md` | 结构化错因、反馈面板、错题本、旧数据 fallback、同步合并 |
| Phase 3 QA | `QA/runs/2026-04-29-v05-phase3-input-feedback-qa/qa-summary.md` | Phase 3 QA 有条件通过；test/build/e2e/scoped lint/audit/diff check 通过；真实设备证据发布后补验 |
| Phase 3 keyboard auto-advance QA | `QA/runs/2026-04-29-v05-phase3-keyboard-autofocus-qa/qa-summary.md` | L2 QA 通过；TDD red-green、全量 Vitest、全量 Playwright、scoped ESLint、build、PM sync check 通过；编辑回填保留观察 |
| v0.5 Phase 4 subplan | `ProjectManager/Plan/v0.5/subplans/2026-04-29-v05-phase4-BL-010-竖式除法UI化答题.md` | 长除法 UI 化答题范围、轮次模型、错因边界、响应式约束和 QA 映射 |
| v0.5 Phase 4 formal prototype repair | `ProjectManager/Plan/v0.5/subplans/2026-04-30-v05-phase4-BL-010-竖式除法正式版原型还原修复.md` | 正式 `LongDivisionBoard` 还原 formal prototype：纸面逐位长除法、逐步显现、小数 ÷ 小数扩倍通过后转换区退出 |
| Phase 4 long division QA | `QA/runs/2026-04-30-v05-phase4-long-division-qa/qa-summary.md` | L2 QA PASS-WITH-NOTES；长除法生产实现、375 / 390 / 桌面视觉证据、全量 Vitest、全量 Playwright、build、scoped ESLint 通过 |
| Phase 4 long division parity QA | `QA/runs/2026-04-30-v05-phase4-long-division-parity-qa/qa-summary.md` | formal prototype vs production parity QA PASS；六个子题型 UI 逐步骤签名、每个竖式步骤错误类别、小数 ÷ 小数扩倍错误、取近似 / 循环小数结构化结果错误通过 |
| 长除法实现 | `src/engine/longDivision.ts`、`src/components/LongDivisionBoard.tsx`、`src/engine/generators/vertical-calc.ts` | 长除法数据生成、过程判定、生产 UI 挂载和 A03 除法生成器入口 |
| BL-009 诊断脚本 | `scripts/diagnose-bl009-vertical-samples.mjs` | 固定 seed 抽样诊断与 P0/P1 口径 |
| BL-009 生成器测试 | `src/engine/generators/vertical-calc.phase3.test.ts` | 低档乘法过滤、低档一位除数整数除法 D0 过滤和 D2/D3 主力分布断言 |
| 策略代码 | `src/engine/vertical-calc-policy.ts`、`src/engine/vertical-calc-policy.test.ts` | 三档策略、跳格、提交、结果分类 |
| 生成器代码 | `src/engine/generators/vertical-calc.ts` | A03 竖式样本生成与 BL-009 P0 过滤规则 |
| UI / Store | `src/components/VerticalCalcBoard.tsx`、`src/components/MultiplicationVerticalBoard.tsx`、`src/components/DecimalTrainingGrid.tsx`、`src/pages/Practice.tsx`、`src/pages/PracticeMathKeyboard.tsx`、`src/pages/WrongBook.tsx`、`src/store/index.ts` | 竖式板接入、统一键盘、统一反馈、错题原因链路 |
| 输入基础设施 | `src/pages/practice-math-keyboard.ts`、`src/pages/practice-math-keyboard.test.ts`、`src/pages/PracticeMathKeyboard.test.ts` | 键盘 reducer、slot state、按键集合、sanitize、组件渲染和 a11y 验证 |
| 错因基础设施 | `src/engine/verticalMultiplicationErrors.ts`、`src/engine/verticalMultiplicationErrors.test.ts`、`src/utils/practiceFailureDisplay.ts`、`src/utils/practiceFailureDisplay.test.ts` | 多行乘法错误分类、结构化显示 helper 和旧数据 fallback |
| 数据 / 同步 | `src/types/index.ts`、`src/sync/merge.test.ts` | 可选原因字段和同步合并保留 |

## 5. 变更记录

| 日期 | 来源 | 当前状态变化 |
|---|---|---|
| 2026-04-09 | `ProjectManager/Specs/2026-04-09-a03-block-b-design.md` | 建立 A03 竖式交互基础设计 |
| 2026-04-25 | `ProjectManager/Plan/v0.4/subplans/2026-04-25-bl-005-乘法竖式与Phase1修复.md` | 多位整数乘法竖式与小数答案兼容在 v0.4 Phase 1 落地 |
| 2026-04-26 | `ProjectManager/Plan/v0.4/subplans/2026-04-26-phase4-进位退位格规则与compare-tip补证.md` | Phase 4 验收后建立本 current spec，吸收低 / 中 / 高过程格策略、反馈与可选数据契约 |
| 2026-04-26 | `QA/runs/2026-04-26-v04-release-gate/visual-result.md` | release gate 补测关闭 `ISSUE-065`，补充单行竖式已知操作数 / 运算符高对比当前承诺 |
| 2026-04-26 | `ProjectManager/Plan/v0.4/subplans/2026-04-26-ISSUE-066-竖式输入单入口与退位语义.md` | v0.4 hotfix 关闭 `ISSUE-066`：单行竖式 hidden input 改为单一字符输入入口；退位格支持 `1 -> -1` 语义输入并显示 `退1`；软键盘删除清当前格 |
| 2026-04-28 | `ProjectManager/Plan/v0.5/subplans/2026-04-28-v05-phase2-BL-009-竖式题样本质量诊断与过滤规则.md` | v0.5 Phase 2 关闭 `BL-009` 第一批 P0：低档乘法过滤 `2位数 × 1位数`；低档一位除数整数除法过滤 D0，并以 D2/D3 为主 |
| 2026-04-29 | `ProjectManager/Plan/v0.5/phases/phase-3.md`、`QA/runs/2026-04-29-v05-phase3-input-feedback-qa/qa-summary.md` | v0.5 Phase 3 有条件完成：统一内置计算键盘、槽位级 sanitize、移动端默认内置键盘策略、结构化 `failureDetail`、多行乘法过程 / 训练格错因、错题本展示和同步合并保留已落地；真实 Android / iOS 设备证据发布后线上补验 |
| 2026-04-29 | `ProjectManager/Plan/v0.5/subplans/2026-04-29-v05-phase3-BL-011-自动换格统一化.md`、`QA/runs/2026-04-29-v05-phase3-keyboard-autofocus-qa/qa-summary.md` | Phase 3 `BL-011` follow-up 完成：内置键盘固定视口底部；slot 级 `shouldAutoAdvance` 生效；商余数、多空、训练格自动换格；多行乘法部分积 / 总积右到左；桌面 Tab 顺序与 slot 顺序一致 |
| 2026-04-30 | `ProjectManager/Plan/v0.5/phases/phase-4.md`、`QA/runs/2026-04-30-v05-phase4-long-division-qa/qa-summary.md` | Phase 4 `BL-010` 完成：A03 除法题显式长除法 UI、扩倍 / 取近似 / 循环结构化字段、长除法过程错因、375 / 390 / 桌面视觉证据已落地；全仓 lint 历史债与真实设备补验保留为后续风险 |
| 2026-04-30 | `ProjectManager/Plan/v0.5/subplans/2026-04-30-v05-phase4-BL-010-竖式除法正式版原型还原修复.md`、`QA/runs/2026-04-30-v05-phase4-long-division-parity-qa/qa-summary.md` | `BL-010` 正式版还原 formal prototype：生产长除法核心板改为纸面逐位输入，过程格按 active slot / 已填写 / submitted 逐步显现，小数 ÷ 小数扩倍确认通过后转换区退出主输入区，过程错误改为步骤级 label，循环小数补齐省略号和标准格式答数预览 |
