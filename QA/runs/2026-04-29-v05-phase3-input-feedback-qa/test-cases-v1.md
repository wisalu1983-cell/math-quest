# v0.5 Phase 3 输入键盘与错因反馈测试用例 v1

**执行日期**：2026-04-29
**范围**：v0.5 Phase 3 `BL-011` 计算输入内置键盘、`ISSUE-067` 结构化错因反馈
**QA 深度**：L2 Professional
**目标用户画像**：6-12 岁小学生，主要在手机竖屏下连续作答，依赖清晰按钮状态和及时反馈。
**设计方法**：规格追踪、风险驱动、等价类、状态迁移、移动端视觉走查、模拟人工 charter。

## Traceability Summary

| Task / Spec / Issue | Test Basis | 用例族 | 覆盖目标 |
|---|---|---|---|
| `BL-011` 计算输入内置键盘 | `ProjectManager/Plan/v0.5/subplans/2026-04-29-v05-phase3-BL-011-计算输入内置键盘.md` | K-UI / K-FLOW / K-A11Y | 统一键盘 UI、槽位启用规则、移动端默认内置键盘、桌面保留输入效率 |
| `ISSUE-067` 结构化错因反馈 | `ProjectManager/Plan/v0.5/subplans/2026-04-29-v05-phase3-ISSUE-067-结构化错因反馈.md` | F-FAIL / F-WB / F-DATA | 多行乘法过程错因、训练格错因、错题本与持久化字段 |
| Phase 3 总计划 | `ProjectManager/Plan/v0.5/phases/phase-3.md` | REG / SEC | 自动化回归、构建、lint、安全最小检查 |
| A03 竖式规格 | `ProjectManager/Specs/a03-vertical-calc/current.md` | K-FLOW / REG | legacy 竖式单一字符消费链路不回退 |

## Risk Model

| Risk ID | 风险 | 影响 | 可能性 | 优先级 | 对应用例族 |
|---|---|---|---|---|---|
| R1 | 手机键盘布局不符合 5x4、左右列宽和分组要求 | 高 | 中 | P0 | K-UI |
| R2 | 可用 / 不可用按键不明显，儿童误以为能点 | 中 | 中 | P1 | K-UI |
| R3 | 移动端点击输入槽位仍弹系统键盘或显示系统键盘按钮 | 高 | 中 | P0 | K-A11Y |
| R4 | 普通答案、商余数、多空、表达式、训练格、竖式格接入不完整 | 高 | 中 | P0 | K-FLOW |
| R5 | 结构化 `failureDetail` 丢失，反馈页 / 错题本无法解释过程错因 | 高 | 中 | P0 | F-FAIL / F-WB / F-DATA |
| R6 | 桌面键盘、粘贴、测试注入绕过 slot sanitize | 中 | 中 | P1 | REG |
| R7 | 新字段破坏 store、sync、build 或已有 e2e | 高 | 中 | P0 | REG |
| R8 | 真实 Chrome Android / Safari iOS 与 Playwright 移动模拟不一致 | 中 | 低 | P1 | K-A11Y |

## K-UI：统一键盘视觉与布局

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| K-001 | 375px 手机竖屏键盘为 5 列 x 4 行 | BL-011 §3.2、用户 UI 需求 | R1 | 规格追踪 | P0 | 移动视口，竖式乘法题 | 打开 `424 × 4` 多行乘法题，读取键盘按钮 DOM 顺序 | 20 个按钮，顺序为 `1 2 3 = 删除 / 4 5 6 + − / 7 8 9 × ÷ / . 0 x ( )` | 按键稳定不跳动 | Playwright DOM + 截图 |
| K-002 | 左三列宽，右两列窄 | 用户 UI 需求 | R1 | 视觉量测 | P0 | 同 K-001 | 量测左列、右列按钮平均宽度 | 左侧平均宽度明显大于右侧 | 数字区更易点，符号区紧凑 | Playwright DOM |
| K-003 | 可用 / 不可用按键显著区分 | BL-011 §3.2、用户反馈 | R2 | 视觉量测 | P1 | digit slot active | 比较 enabled/disabled 样式 | enabled solid/opacity 1；disabled dashed/opacity 0.4/灰色 | 灰键明显不可点 | Playwright DOM + 截图 |
| K-004 | 数字区、符号区、删除键三组有统一但不同的色彩 | 用户 UI 需求 | R2 | 视觉走查 | P1 | expression slot active | 激活等式输入，读取 symbol/delete/input 样式 | 数字白底，符号主色浅底，删除 danger 浅底 | 分组清楚，不突兀 | Playwright DOM + 截图 |
| K-005 | `x` 变量字体与乘号区分 | 用户反馈 | R2 | 视觉量测 | P1 | 任一键盘场景 | 比较 `x` 与 `×` 字体 | `x` 为 serif italic 22px；`×` 为 UI sans normal 18px | 变量 x 不像乘号 | Playwright DOM |
| K-006 | 键盘底部有留白且不压迫答题区 | 用户反馈、BL-011 §3.6 | R1 | 布局量测 | P1 | 390x844 视口 | 量测 wrapper 高度、底部 padding、保留空间 | wrapper `pb=12px`，保留答题区约 74.6% | 底部不贴边，主内容可读 | Playwright DOM + 截图 |

## K-FLOW：输入接入链路

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| K-101 | 普通数字题用内置键盘提交 | BL-011 §3.1 | R4 | 等价类 | P0 | `12 + 8 = ?` | 点 `2`、`0`、确认 | 判定正确，进入反馈态 | 可不用系统键盘完成 | 模拟人工 |
| K-102 | 商余数双槽位用内置键盘提交 | BL-011 §3.1 | R4 | 状态迁移 | P0 | `22 ÷ 3 = ?` | 商填 `7`，余数填 `1`，确认 | 判定正确 | 槽位切换明确 | 模拟人工 |
| K-103 | 多空填空用内置键盘提交 | BL-011 §3.1 | R4 | 状态迁移 | P0 | 三空题 | 三个空分别填 `12 / 8 / 20`，确认 | 判定正确 | 多槽位不混写 | 模拟人工 |
| K-104 | 等式输入支持 `x` 与 `=` | BL-011 §3.1 | R4 | 等价类 | P0 | `3x = 6` | 输入 `3x=6`，确认 | 判定正确 | 表达式字符完整可输入 | 模拟人工 |
| K-105 | 小数训练格和正式答案都能用内置键盘 | BL-011 §3.1 | R4 | 状态迁移 | P0 | 带训练格 numeric 题 | 先填训练格，再填答案 | 训练格完成后解锁答案并判定正确 | 作答流程连续 | 模拟人工 |
| K-106 | legacy 竖式格用内置键盘提交 | A03 spec、BL-011 §5.3 | R4 / R7 | 回归 | P0 | `50 - 20` legacy vertical | 竖式格填 `30`，提交 | 判定正确 | 不恢复双消费问题 | 模拟人工 |
| K-107 | 多行乘法竖式格用内置键盘提交并可触发过程失败 | ISSUE-067 | R4 / R5 | 状态迁移 | P0 | `424 × 4` 多行乘法 | 部分积填错，总积填对，提交 | 反馈为过程失败，不是最终答案错 | 能解释“答案对但过程错” | 模拟人工 + DOM |

## F-FAIL / F-WB / F-DATA：结构化错因

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| F-001 | 多行乘法部分积错误分类 | ISSUE-067 | R5 | 决策表 | P0 | 总积正确，部分积错误 | 提交 `424 × 4` 错误过程 | `failureReason=vertical-multiplication-process`，展示 `部分积填写错误` | 知道错在过程 | Unit + 模拟人工 |
| F-002 | 小数训练格错误分类 | ISSUE-067 | R5 | 决策表 / 浏览器端到端 | P0 | 小数乘法训练字段错误 | `1.2 × 0.3` 最终答数填对，小数点移动位数填错 | `vertical-training-field`，反馈面板展示字段 label/user/expected | 反馈具体错因 | Unit + Playwright |
| F-003 | WrongBook 回显结构化错因 | ISSUE-067 | R5 | 数据流 | P0 | 失败题入错题本 | 结束 session 后打开错题本 | 错题本保留 message 与 category | 复习时仍能看到原因 | 模拟人工 |
| F-004 | store / sync 保留 `failureDetail` | ISSUE-067 | R5 / R7 | 数据契约 | P0 | 本地 attempt、wrong question、merge | 跑 store/sync 单测 | 结构化字段不丢失 | 跨会话稳定 | Vitest |

## REG / SEC：回归与安全

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| R-001 | 全量 Vitest | QA capability registry | R7 | 回归 | P0 | 依赖已安装 | `npm test -- --run` | 全部通过 | 不破坏既有功能 | 自动化 |
| R-002 | 标准 Playwright e2e | QA capability registry | R7 | 回归 | P0 | dev server 可启动 | `npx playwright test` | 全部通过 | 核心路径可达 | 自动化 |
| R-003 | 生产构建 | QA capability registry | R7 | 构建验证 | P0 | 依赖已安装 | `npm run build` | exit 0 | 可发布构建 | 自动化 |
| R-004 | 变更范围 lint | QA capability registry | R7 | 静态检查 | P1 | touched files | `npx eslint <changed files>` | exit 0 | 不新增 lint 债 | 自动化 |
| R-005 | 全仓 lint 基线记录 | QA capability registry | R7 | 静态检查 | P2 | 全仓 | `npm run lint` | 已知历史失败需记录 | 不误判本轮 | 自动化 |
| S-001 | 高危依赖审计 | QA capability registry | R7 | 安全最小清单 | P1 | 依赖已安装 | `npm audit --audit-level=high` | 0 vulnerabilities | 无新增高危依赖风险 | 自动化 |

## Coverage Matrix

| Risk | Covered By | Residual Risk |
|---|---|---|
| R1 | K-001, K-002, K-006 | 无新 FAIL |
| R2 | K-003, K-004, K-005 | 儿童真实困惑度仍建议后续观察 |
| R3 | K-A11Y 检查、K-006 | 未覆盖真实 Safari iOS / Chrome Android 设备 |
| R4 | K-101 至 K-107 | 无新 FAIL |
| R5 | F-001 至 F-004 | 无新 FAIL |
| R6 | Unit / scoped lint /桌面输入检查 | 无新 FAIL |
| R7 | R-001 至 R-005 | 全仓 lint 历史债保留 |
| R8 | 移动模拟检查 | 真实设备验证 pending |

## Exit Criteria

- P0 用例全部 PASS。
- P1 若无法用当前工具覆盖真实设备，写入 residual risk。
- 自动化失败不得写成 PASS。
- 新 FAIL 必须进入 `ProjectManager/ISSUE_LIST.md`；本轮未发现需新增的问题。

## Execution Summary

| 层级 | 结果 | 证据 |
|---|---|---|
| Code Review | PASS | `code-review-result.md` |
| 自动化 | PASS / RISK | `automated-result.md`；全仓 lint 为历史 RISK |
| 拟真人工 / 视觉 | PASS / RISK | `visual-result.md`、`manual-result.md`；真实设备为 residual risk |

## Defect Triage

| 类型 | 数量 | 处理 |
|---|---:|---|
| FAIL | 0 | 无需新增 `ISSUE_LIST.md` |
| RISK | 2 | 全仓 lint 历史债；真实 iOS/Android 设备未覆盖 |
| Observation | 1 | 桌面内置键盘作为辅助面板可见，符合 BL-011 §3.3 / §3.6 |
