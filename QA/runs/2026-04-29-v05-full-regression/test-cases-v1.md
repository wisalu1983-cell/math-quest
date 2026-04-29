# V0.5 全量测试用例表 v1

> 测试范围：v0.5 Phase 1~3 迄今成果 + 历史版本回归
> QA 深度：L3（用户要求全量测试）
> 创建：2026-04-29
> Test Basis：`ProjectManager/Overview.md`、`Plan/v0.5/README.md`、`Plan/v0.5/phases/phase-2.md`、`Plan/v0.5/phases/phase-3.md`、`Specs/a03-vertical-calc/current.md`、`ISSUE_LIST.md`、`Backlog.md`

---

## Risk Model

| Risk ID | 风险 | 影响 | 可能性 | 优先级 |
|---|---|---|---|---|
| R1 | 内置键盘移动端不弹系统键盘失败 | 高（触摸设备用户无法正常输入） | 中（readOnly+inputMode=none 策略依赖浏览器行为） | P0 |
| R2 | 键盘置灰逻辑不准确，允许非法输入 | 高（破坏答案合法性） | 低（sanitize 兜底） | P1 |
| R3 | 自动换格逻辑跳错格 | 中（影响输入流畅度） | 低（已有 E2E 覆盖） | P1 |
| R4 | 结构化错因丢失或不展示 | 中（学生看不到"为什么没通过"） | 低（已有单测+E2E） | P1 |
| R5 | BL-009 过滤规则漏网口算题 | 中（竖式训练出现不需要竖式的题） | 低（已有 generator 单测） | P1 |
| R6 | 旧存档/旧错题数据 fallback 白屏 | 高（用户数据丢失感） | 低（可选字段+fallback 机制） | P1 |
| R7 | 生产构建失败或 chunk 过大影响加载 | 中（影响发布） | 低（当前仅 warning） | P2 |
| R8 | 历史版本功能回归：注册/地图/答题/结算 | 高（核心功能不可用） | 低 | P0 |
| R9 | 同步合并丢失 failureDetail | 中（多设备用户错题信息不一致） | 低（已有 merge 单测） | P1 |
| R10 | 全仓 lint 历史债引入隐蔽 bug | 低 | 低 | P2 |

---

## Coverage Matrix

| Risk | 覆盖用例 |
|---|---|
| R1 | I-01, I-02, I-03 |
| R2 | I-04, I-05 |
| R3 | I-06, I-07, I-08, I-09 |
| R4 | I-10, I-11, I-12, I-13 |
| R5 | F-01, F-02, F-03 |
| R6 | K-01, K-02 |
| R7 | A-01 |
| R8 | B-01, C-01, D-01, E-01 |
| R9 | K-03 |
| R10 | A-02 |

---

## 模块 A — 迭代验证

| ID | 用例名称 | Test Basis | 优先级 | 验证方式 | Risk |
|---|---|---|---|---|---|
| A-01 | 生产构建通过 | Phase 3 收尾条件 | P0 | 自动化 `npm run build` | R7 |
| A-02 | Scoped ESLint v0.5 变更文件无新错 | Phase 3 收尾条件 | P2 | 自动化 `npx eslint` | R10 |
| A-03 | npm audit 无 high/critical 漏洞 | QA canonical §9 | P1 | 自动化 `npm audit` | — |
| A-04 | ISSUE-067 已修复回归 | issues-closed.md | P0 | 自动化+拟真 | — |
| A-05 | ISSUE-068 已修复回归 | issues-closed.md | P0 | 自动化 | — |
| A-06 | ISSUE-065 竖式高对比回归 | v0.4 release gate | P1 | 自动化 E2E | — |
| A-07 | ISSUE-066 单入口输入回归 | v0.4 hotfix | P1 | 自动化 E2E | — |

## 模块 B — 注册与首页

| ID | 用例名称 | Test Basis | 优先级 | 验证方式 | Risk |
|---|---|---|---|---|---|
| B-01 | 首页加载正常，注册流程可达 | smoke.spec.ts | P0 | 自动化 E2E | R8 |
| B-02 | 首页桌面端布局无截断 | QA canonical §8 | P1 | 视觉 QA | — |
| B-03 | 首页移动端（375px）布局无溢出 | QA canonical §8 | P1 | 视觉 QA | — |

## 模块 C — 闯关地图

| ID | 用例名称 | Test Basis | 优先级 | 验证方式 | Risk |
|---|---|---|---|---|---|
| C-01 | 注册后可进入闯关地图 | 核心用户旅程 | P0 | 拟真人工 | R8 |
| C-02 | A03 竖式关卡在地图上可见可选 | v0.5 scope | P1 | 拟真人工 | — |

## 模块 D — 答题通用

| ID | 用例名称 | Test Basis | 优先级 | 验证方式 | Risk |
|---|---|---|---|---|---|
| D-01 | 开始答题后题目正确渲染 | 核心用户旅程 | P0 | 拟真人工 | R8 |
| D-02 | 提交答案后进入结算 | 核心用户旅程 | P0 | 拟真人工 | R8 |
| D-03 | 退出确认弹窗正常工作 | v0.4 Phase 5 | P1 | 自动化 E2E | — |

## 模块 E — 结算与进度

| ID | 用例名称 | Test Basis | 优先级 | 验证方式 | Risk |
|---|---|---|---|---|---|
| E-01 | 答题结算页显示结果和正确答案 | 核心用户旅程 | P0 | 拟真人工 | R8 |
| E-02 | 错题进入错题本 | ISSUE-067 subplan | P1 | 拟真人工 | — |

## 模块 F — 题目生成

| ID | 用例名称 | Test Basis | 优先级 | 验证方式 | Risk |
|---|---|---|---|---|---|
| F-01 | 低档乘法不生成 2位数×1位数 | BL-009 P0 过滤规则 | P0 | 自动化 Vitest | R5 |
| F-02 | 低档一位除数整数除法过滤 D0 逐段整除型 | BL-009 P0 过滤规则 | P0 | 自动化 Vitest | R5 |
| F-03 | 低档除法以 D2/D3 为主力样本 | BL-009 current spec §2.2 | P1 | 自动化 Vitest | R5 |
| F-04 | 生成器 743 项单测全部通过 | 全量自动化 | P0 | 自动化 Vitest | — |

## 模块 G — 数字输入（内置键盘）

| ID | 用例名称 | Test Basis | 优先级 | 验证方式 | Risk |
|---|---|---|---|---|---|
| G-01 | 桌面端硬键盘输入正常 | current spec §2.6 | P0 | 拟真人工 | — |
| G-02 | 内置键盘面板在移动端可见 | BL-011 subplan | P0 | 视觉 QA | R1 |
| G-03 | 内置键盘按钮尺寸和布局合理 | current spec §2.6 | P1 | 视觉 QA | — |

## 模块 I — 竖式填空（核心 v0.5 功能）

| ID | 用例名称 | Test Basis | 优先级 | 验证方式 | Risk |
|---|---|---|---|---|---|
| I-01 | 移动端内置键盘不弹系统键盘 | current spec §2.6 | P0 | 视觉+拟真 | R1 |
| I-02 | 内置键盘固定视口底部不跟随滚动 | current spec §2.6、E2E phase3-keyboard-autofocus | P0 | 自动化 E2E | R1 |
| I-03 | 非键盘区高度 ≥60% 视口 | current spec §2.6 | P0 | 视觉 QA | R1 |
| I-04 | 当前槽位不可用按键正确置灰 | current spec §2.6 | P1 | 拟真人工 | R2 |
| I-05 | sanitize 拒绝非法输入（粘贴、多字符） | current spec §2.4 | P1 | 自动化 Vitest | R2 |
| I-06 | 商余数填满商后自动进入余数 | current spec §2.6 E2E | P1 | 自动化 E2E | R3 |
| I-07 | multi-blank 达到答案长度后自动换格 | current spec §2.6 E2E | P1 | 自动化 E2E | R3 |
| I-08 | 训练格填满后移动到下一字段 | current spec §2.6 E2E | P1 | 自动化 E2E | R3 |
| I-09 | 多行乘法部分积/总积按右到左输入，Tab 顺序一致 | current spec §2.6 E2E | P1 | 自动化 E2E | R3 |
| I-10 | 多行乘法过程格错时显示类别文案 | ISSUE-067、current spec §2.5 | P0 | 自动化+拟真 | R4 |
| I-11 | 小数训练格错时显示用户值/正确值 | ISSUE-067、E2E phase3-decimal-training-failure | P0 | 自动化 E2E | R4 |
| I-12 | 错题本展示结构化错因 | ISSUE-067 subplan | P1 | 拟真人工 | R4 |
| I-13 | 历史记录 UI 不展示错因 | current spec §2.5 | P1 | 拟真人工 | R4 |
| I-14 | 单行过程积乘法不展示重复合计行 | ISSUE-068、E2E issue-068 | P0 | 自动化 E2E | — |
| I-15 | 单行过程积填错按最终答案错误处理 | ISSUE-068、E2E issue-068 | P1 | 自动化 E2E | — |
| I-16 | 低档填完个位答案后自动聚焦进位格 | current spec §2.4、E2E phase4-carry-focus | P1 | 自动化 E2E | R3 |
| I-17 | 减法退位格输入1表示退1并自动回答案格 | ISSUE-066、E2E issue-066 | P1 | 自动化 E2E | — |
| I-18 | 软键盘删除清空当前活动格 | ISSUE-066、E2E issue-066 | P1 | 自动化 E2E | — |

## 模块 J — 辅助页面

| ID | 用例名称 | Test Basis | 优先级 | 验证方式 | Risk |
|---|---|---|---|---|---|
| J-01 | 设置页面可达 | 核心用户旅程 | P2 | 拟真人工 | — |

## 模块 K — 全局边界

| ID | 用例名称 | Test Basis | 优先级 | 验证方式 | Risk |
|---|---|---|---|---|---|
| K-01 | 旧错题只有 failureReason 无 failureDetail 时 fallback 正常 | current spec §2.5 | P0 | 自动化 Vitest | R6 |
| K-02 | 无 localStorage 冷启动无白屏 | 核心边界 | P0 | 自动化 E2E smoke | R6 |
| K-03 | 同步合并保留 failureDetail | current spec §2.5、merge.test.ts | P1 | 自动化 Vitest | R9 |
| K-04 | 离线状态下不弹同步错误影响答题 | v0.3 account sync | P1 | 自动化 E2E | — |

## 模块 S — 安全与隐私

| ID | 用例名称 | Test Basis | 优先级 | 验证方式 | Risk |
|---|---|---|---|---|---|
| S-01 | npm audit 无 high/critical | QA canonical §9 | P1 | 自动化 | — |
| S-02 | 代码中无 secret/env 泄漏 | QA canonical §9 | P1 | Code Review | — |

## 探索式 Charter

| ID | Charter | 目标用户画像 | 优先级 | 验证方式 |
|---|---|---|---|---|
| EX-01 | 作为五年级学生，在手机上完成一轮竖式乘法练习，感受内置键盘和错因反馈 | 上海五年级，数学中等 | P1 | 拟真人工 |
| EX-02 | 多视口下检查键盘、竖式板、反馈面板的布局完整性 | — | P1 | 视觉 QA |

---

## Exit Criteria

- 所有 P0 用例必须 PASS
- P1 用例允许 ≤2 个 RISK（非阻塞，有后续观察条件）
- 不允许 P0/P1 FAIL
- 真实 Android/iOS 设备证据已确认延后到发布后线上验收，本轮不作为阻塞项
