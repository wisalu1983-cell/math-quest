# v0.4 Release Gate 测试用例 v1

**执行日期**：2026-04-26
**范围**：v0.4 发布前最终 QA
**QA 深度**：L3 Release Gate
**目标用户画像**：上海五年级学生，数学能力中等，主要移动端使用，桌面端键盘可用。
**设计方法**：风险驱动 / 规格追踪 / 等价类 / 边界值 / 决策表 / 状态迁移 / 统计抽样 / 探索式 charter / 安全最小门禁。

## Traceability Summary

| Task / Spec / Issue | Test Basis | 用例族 | 覆盖目标 |
|---|---|---|---|
| v0.4 Release Gate | `Plan/v0.4/README.md`, `03-phase-plan.md`, `04-execution-discipline.md` | A | 版本收口门禁、历史缺陷回归 |
| BL-005 / ISSUE-059 | `Plan/v0.4/phases/phase-1.md`, `Specs/a03-vertical-calc/current.md` | I, G | 竖式渲染、乘法竖式、小数等价、dec-div 隐藏字段 |
| BL-006 / BL-007 / BL-008 | `Backlog.md`, Phase 2/3 Plan | C, F, H | A04/A06 断联、A07 lane、compare、去重 |
| BL-003 / BL-004 | Phase 4/5 subplan, QA runs | D, I | compare tip、Practice reset |
| v0.3 account sync | v0.3 sync specs and QA run | B, S, K | 账号同步回归、安全降级、本地进度不丢 |
| 儿童可用性 | QA canonical §8, UI spec | X | 移动端可读性、焦点、触摸、反馈 |

## Risk Model

| Risk ID | 风险 | 影响 | 可能性 | 优先级 | 对应用例族 |
|---|---|---|---|---|---|
| R1 | 已修复项整合后回退 | 高 | 中 | P0 | A, D, F, I |
| R2 | 竖式三档规则与 current spec 不一致 | 高 | 中 | P0 | I, G |
| R3 | 生成器质量、难度、去重漂移 | 高 | 中 | P0 | F, H |
| R4 | Practice reset 破坏输入/焦点/退出 | 高 | 中 | P0 | D, G |
| R5 | A04/A06 断联后新旧入口或存档断裂 | 中 | 中 | P1 | C, K |
| R6 | 账号同步和安全降级被误伤 | 高 | 低 | P1 | B, S |
| R7 | 移动端视觉与儿童可用性不足 | 中 | 中 | P1 | X |
| R8 | 发布工程门禁失败 | 高 | 中 | P0 | A, S |

## A：发布门禁与历史回归

设计意图：发布前必须证明当前工作树拥有完整 Phase 证据，并且全量命令在当前版本状态下通过。

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| A-001 | v0.4 Phase 1-5 均有正式 QA 证据 | `Plan/v0.4/README.md`, historical QA runs | R1 | 规格追踪 | P0 | 当前仓库 | 审阅 Phase 1/3/4/5 QA run 与 Phase 2 计划验收记录 | 每个 Phase 的结论可追溯，缺口在 summary 标 RISK | 发布判断有证据，不靠口头印象 | Code Review |
| A-002 | 当前开放 issue 数为 0 | `ISSUE_LIST.md` | R1 | 历史缺陷回归 | P0 | 当前仓库 | 审阅 `ISSUE_LIST.md` | 无开放 P0/P1/P2；`ISSUE-059` 关闭证据存在 | 不带已知阻塞缺陷发布 | Code Review |
| A-003 | 全量 Vitest 门禁 | `QA/capability-registry.md` | R8 | 自动化回归 | P0 | 依赖已安装 | 执行 `npm test` | 全量测试通过 | 用户路径背后的策略和数据模型可靠 | 自动化 |
| A-004 | 生产构建门禁 | `Plan/v0.4/04-execution-discipline.md` | R8 | 发布门禁 | P0 | 依赖已安装 | 执行 `npm run build` | TypeScript 和 Vite build 通过；仅可接受非阻塞 warning | 可生成发布包 | 自动化 |
| A-005 | 标准 Playwright E2E 门禁 | `QA/e2e/*.spec.ts` | R1, R8 | 用户旅程回归 | P0 | Playwright 可运行 | 执行 `npx playwright test` | 所有标准 E2E 通过 | 核心浏览器交互不崩 | 自动化 |
| A-006 | PM 一致性检查 | `Plan/version-lifecycle.md` | R8 | 一致性检查 | P1 | 文档已生成 | 执行 `npx tsx scripts/pm-sync-check.ts` | 通过或仅存在非本轮阻塞项 | 收口资料不漂移 | 自动化 |

## B/C/D/E：核心用户旅程

设计意图：发布测试必须覆盖孩子从进入应用到完成练习闭环的路径。

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| B-001 | 未登录/未配置 Supabase 时可安全进入本地练习 | v0.3 account sync QA | R6 | 状态迁移 | P1 | 无 Supabase env | 打开应用，进入主页和练习入口 | 不阻塞本地练习，不报用户可见错误 | 孩子可以直接练，不被账号系统卡住 | Playwright / 模拟人工 |
| C-001 | 闯关地图可进入 A 领域主链路 | `CampaignMap`, Phase 2 Plan | R5 | 用户旅程 | P0 | fresh profile | 从首页进入地图并选择可用关卡 | A04/A06 不作为新主链路独立入口；A07 可承载相关能力 | 路线清楚，不被旧题型入口误导 | Playwright / 模拟人工 |
| D-001 | 普通答题开始、输入、提交、反馈、下一题闭环 | `Practice.tsx`, smoke e2e | R4 | 状态迁移 | P0 | fresh profile | 进入练习，完成至少一题 | 提交后出现明确反馈，可继续或结算 | 操作路径顺，反馈明确 | Playwright / 模拟人工 |
| E-001 | 结算、历史/错题入口不因 v0.4 改动异常 | Store specs, QA canonical | R1 | 用户旅程 | P1 | 至少完成一题 | 完成练习后查看结果/相关入口 | 结算状态正常；错误题目按规则进入错题 | 孩子知道自己表现和下一步 | 模拟人工 |

## F/H：题目生成与选择题质量

设计意图：v0.4 的题目体验修复核心在生成器质量和教学价值，不能只依赖 UI 测试。

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| F-001 | A03 d4/d5 int-mul 两位数乘两位数分布保持验收带 | Phase 3 QA v2 | R3 | 统计抽样 | P0 | 固定测试样本 | 运行相关 Vitest/诊断覆盖 | 分布落在 Phase 3 验收带，且低档不误伤 | 进阶难度不再出现过低乘法体验 | 自动化 |
| F-002 | A03 advance 3★ 短除候选不回归 | Phase 3 QA v2 | R3 | 边界值 | P0 | 固定测试样本 | 运行 vertical-calc phase3 tests | 3★ 不再抽到心算级短除候选 | 练习难度符合“竖式”预期 | 自动化 |
| F-003 | A02 compare d7/d8 题目质量和 explanation 不回退 | Phase 3 QA v2, BL-007 | R3 | 等价类 / 统计抽样 | P0 | 固定测试样本 | 运行 number-sense phase3 tests | 模板、答案、解释和干扰项符合验收 | 选择题降低猜测感，有教学价值 | 自动化 / 模拟人工 |
| F-004 | campaign / advance / rank session 内完全重复治理有效 | Phase 3 T5 | R3 | 状态迁移 / 决策表 | P0 | 固定 seed 或测试夹具 | 运行 `session-dedupe` 与相关 store tests | 完全重复有 bounded retry，耗尽有诊断口径 | 孩子不会明显连续遇到同题 | 自动化 |
| H-001 | 选择题展示与提交反馈清楚 | BL-007, UI spec | R3, R7 | 探索式 charter | P1 | 浏览器会话 | 抽查 compare/选项题 | 选项可读，反馈解释可理解 | 不像纯猜题，知道为什么错/对 | 模拟人工 |

## G/I：输入、竖式与 Practice 状态

设计意图：v0.4 的高风险交互集中在输入状态、竖式过程格、焦点和答案等价。

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| G-001 | 换题后输入态完全 reset | Phase 5 QA | R4 | 状态迁移 | P0 | Practice 会话 | 运行 `phase5-practice-input-reset.spec.ts` | 普通输入、多空、多选等状态不串题 | 下一题干净，焦点自然 | Playwright |
| G-002 | 退出弹窗不受 input reset 影响 | Phase 5 QA | R4 | 回归 | P1 | Practice 会话 | Playwright / 手工检查退出弹窗 | 弹窗状态独立，确认/取消行为正常 | 不误退出，不困惑 | Playwright / 模拟人工 |
| I-001 | 低档进位/退位格默认焦点进入过程格且过程错不通过 | A03 current spec, Phase 4 QA | R2 | 决策表 | P0 | 固定 dev hook 或 E2E 夹具 | 运行 `phase4-carry-focus.spec.ts` | 低档按计算步骤进入过程格；过程错失败并记录原因 | 孩子被引导写过程，不只猜答案 | Playwright |
| I-002 | 中档过程格不打断答案链路，过程错只提示 | A03 current spec | R2 | 决策表 | P0 | 固定 dev hook 或 E2E 夹具 | 运行 Phase 4 E2E/手工 | 答案正确即通过，过程错仅当前题提示 | 不因辅助过程被过度惩罚 | Playwright / 模拟人工 |
| I-003 | 高档不显示过程格 | A03 current spec | R2 | 等价类 | P1 | 固定高档题 | 浏览器抽查高档竖式 | 只显示答案格，不显示过程格 | 高档练习更简洁 | 模拟人工 |
| I-004 | 小数乘法答案 `56` / `56.0` 等价 | Phase 1 QA | R2 | 等价类 | P0 | 自动化夹具 | 运行 generator/vertical multiplication tests | 数学等价答案判定正确 | 孩子不因无意义小数点被误判 | 自动化 |
| I-005 | `dec-div` 高档不携带隐藏 `trainingFields` | ISSUE-059 | R1, R2 | 回归 | P0 | 自动化夹具 | 运行 generators tests | 高档 `dec-div` 无隐藏训练字段 | 题目行为与设计一致 | 自动化 |

## K/S：存档、账号、安全

设计意图：即使 v0.4 不新增账号能力，发布前仍需保证 v0.3 的本地优先进度、同步降级和依赖安全没有被误伤。

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| K-001 | 旧版本存档迁移不 clearAll | `CLAUDE.md`, rank match spec | R6 | 边界值 / Code Review | P1 | 当前代码 | 审阅 repository init/migration tests | 旧版本走迁移/备份，不静默清空 | 用户数据不丢 | Code Review / 自动化 |
| S-001 | 账号同步 merge/dirtyKeys 回归 | v0.3 sync specs | R6 | 状态迁移 | P1 | 无远端配置 | 运行 sync/auth tests 与 v03 E2E | 本地优先、sign out guard、安全降级成立 | 登录能力不破坏本地练习 | 自动化 |
| S-002 | 依赖安全最小门禁 | QA canonical §9 | R8 | 安全检查 | P1 | 依赖已安装 | 执行 `npm audit` | 无阻塞级别漏洞；若有，summary 裁决 | 发布前知道依赖风险 | 安全 |
| S-003 | secret/env 泄漏检查 | QA canonical §9 | R8 | 安全检查 | P1 | 当前仓库 | `rg` 检查 env/token/key 等 | 无真实 secret 入库；示例/变量名可接受 | 不泄漏账号或服务密钥 | Code Review |

## X：视觉、无障碍与儿童可用性

设计意图：发布门禁必须验证孩子真实看到的界面可读、可点、可理解。

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| X-001 | 移动端 390px / 375px 主旅程无明显横向溢出 | Phase 1 mobile QA, UI spec | R7 | 视觉回归 | P1 | 浏览器视口 | 截图检查首页/地图/Practice/竖式 | 关键文本和输入不溢出，不遮挡 | 手机上能看清和操作 | 视觉 QA |
| X-002 | 竖式数字、符号、输入格对比度和排版可读 | BL-005.1 | R2, R7 | 视觉回归 | P1 | 竖式题 | 截图检查低/中/高档竖式 | 数字和符号清楚，格子稳定 | 孩子不用费劲辨认 | 视觉 QA |
| X-003 | 键盘/触摸焦点顺序符合答题习惯 | QA canonical §8 | R7 | 无障碍检查 | P1 | Practice 会话 | Tab/Enter/触摸操作抽查 | 焦点不跳乱，按钮可达 | 桌面和移动都能顺畅答题 | 模拟人工 |
| X-004 | 反馈文案说明下一步和错因 | QA canonical §8 | R7 | 探索式 charter | P1 | 完成正确/错误题 | 查看成功、失败、警告反馈 | 成败和错因清晰；下一步明确 | 孩子知道该继续还是改正 | 模拟人工 |

## Exploratory Charters

| ID | Charter | Test Basis | Risk | Technique | Priority | Preconditions | Mission / Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| U-001 | 新用户从首页进入闯关并完成一题 | QA canonical, smoke e2e | R1, R7 | Exploratory charter | P0 | fresh storage | 像五年级学生一样从首页进入可用关卡，完成一题并查看反馈 | 无崩溃；入口清楚；反馈可理解 | 第一轮练习顺利完成 | 模拟人工 |
| U-002 | A03 竖式低档/中档/高档题感抽查 | A03 current spec | R2 | Exploratory charter | P1 | dev hook 或固定题 | 对比三档过程格、焦点和提示 | 三档差异符合规则 | 难度逐步提升，不突然惩罚 | 模拟人工 |
| U-003 | compare 题教学提示和解释抽查 | BL-003 / BL-007 | R3, R7 | Exploratory charter | P1 | compare 题 | 查看题干、提示、提交后的 explanation | 提示可见，解释有教学价值 | 孩子能学到判断方法 | 模拟人工 |
| U-004 | 移动端 Practice 视觉与触摸体验 | Phase 1 mobile QA | R7 | Exploratory charter | P1 | 375/390px 视口 | 用触摸路径完成普通题和竖式题 | 无横向滚动和遮挡，触摸目标可点 | 手机上不吃力 | 视觉 QA / 模拟人工 |

## Coverage Matrix

| Risk | Covered By | Residual Risk |
|---|---|---|
| R1 | A-001, A-002, A-003, A-005, C-001, D-001 | 待执行后确认 |
| R2 | I-001, I-002, I-003, I-004, I-005, X-002, U-002 | 待执行后确认 |
| R3 | F-001, F-002, F-003, F-004, H-001, U-003 | 待执行后确认 |
| R4 | D-001, G-001, G-002 | 待执行后确认 |
| R5 | C-001, K-001 | 待执行后确认 |
| R6 | B-001, K-001, S-001 | 待执行后确认 |
| R7 | X-001, X-002, X-003, X-004, U-001, U-004 | 待执行后确认 |
| R8 | A-003, A-004, A-005, A-006, S-002, S-003 | 待执行后确认 |

## Exit Criteria

- P0 用例全部 PASS。
- P1 可有 RISK，但必须写入 summary 的 residual risk 并裁决是否阻塞发布。
- FAIL 必须进入 `ProjectManager/ISSUE_LIST.md` 或经产品裁决接受。
- 自动化失败不得写成 QA PASS。
- 对随机生成器，必须记录样本量 / 验收带 / 自动化证据。

## Execution Summary

| 层级 | 结果 | 证据 |
|---|---|---|
| Code Review | PASS | `code-review-result.md` |
| 自动化 | PASS | `automated-result.md` |
| 拟真人工 | PASS | `manual-result.md` |
| 视觉 | PASS（补测） | `visual-result.md` · `X-002` 已修复并通过用户视觉确认 |

## Defect Triage

| 类型 | 数量 | 处理 |
|---|---:|---|
| FAIL | 0 | `ISSUE-065` 已修复并关闭 |
| RISK | 0 | 无 |
| Observation | 4 | `OBS-CR-01`、`OBS-CR-02`、`OBS-AUTO-01`、`OBS-AUTO-02`，均非阻塞 |
