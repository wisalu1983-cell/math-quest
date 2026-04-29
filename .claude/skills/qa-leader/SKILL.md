---
name: qa-leader
description: |
  MathQuest QA Leader: preflight by task type and project phase,
  reuse QA/capability-registry.md, then run L0-L3 risk-based QA
  across code review, automation, simulated human, visual, security, accessibility,
  defect triage, and PM writeback. Triggers: QA, testing, visual QA, experience testing.
---

<!-- QA Leader adapter - Claude Code -->
<!-- Canonical source: math-quest/QA/qa-leader-canonical.md -->
<!-- Edit the canonical source first; this file is generated. -->

# QA Leader 编排器

本文件是 math-quest 项目 QA 体系的规范源（canonical source）。
Cursor 侧（`.cursor/rules/qa-leader.mdc`）、Claude Code 侧（`.claude/skills/qa-leader/SKILL.md`）和 Codex 侧（`.agents/skills/qa-leader/SKILL.md`）
各自加环境特定 frontmatter 后引用本文件内容。编辑请先改本文件，再同步适配件。

本体系面向小型游戏 / 软件团队：保留长期实战验证的方法论，但避免重型测试管理平台。
核心原则是：风险驱动、规格追踪、自动化分层、探索式体验 QA 可审计、正式结论入库、过程大产物不入库。

## 触发条件

当用户要求以下操作时，启动本编排器：

- "跑一轮 QA" / "全量测试" / "QA 测试"
- "写测试用例" / "设计测试方案"
- "视觉 QA" / "体验测试" / "拟真 QA"
- 指定某个 phase、batch、issue、backlog 或 release gate 的测试执行
- 修改 QA 制度、测试模板、测试工具台账或 QA 归档规则

---

## 0. 最小 Preflight

每轮 QA 先做最小 preflight，再决定测试深度。不要一上来新造脚本或套旧用例。

1. 判断任务类型：`自动化` / `视觉` / `拟真人工` / `安全` / `无障碍` / `混合`
2. 判断阶段情境：hotfix、feature、generator、UI/UX、account/sync、release、制度迭代
3. 读取 `QA/capability-registry.md`，优先复用现成工具、skill、模板和脚本
4. 当前工具库能覆盖时直接复用；registry 明确没有覆盖时，才新增脚本或工具
5. 正式 QA 文档与结论统一归档到 `QA/runs/<date>-<scope>/`
6. 标准 Playwright Test 用例统一维护在 `QA/e2e/`
7. 可复用独立 QA 脚本统一维护在 `QA/scripts/`
8. 临时截图、trace、raw JSON、Playwright report、视频和大体积证据默认放入被忽略的 artifacts 目录

### 标准自动化入口

1. `npm test`
   - 标准单元测试入口，等同 `vitest run`
   - 覆盖 `src/**/*.test.ts`
   - 如果失败，先报告失败用例，不继续把 QA 结论写成 PASS
2. `npx playwright test`
   - 标准浏览器测试入口
   - 覆盖 `QA/e2e/*.spec.ts`
   - 由 `playwright.config.ts` 自动拉起本地 dev server
   - 如果失败，先报告失败用例，不继续把结果写成 PASS
3. `QA/scripts/`
   - 多数为历史脚本或专项工具，不是默认入口
   - 只有 capability registry 或当前测试方案明确要求时才运行

---

## 1. QA 深度分级

不同情境用不同深度，避免小修过测，也避免高风险变更只跑 smoke。

| 深度 | 适用情境 | 必需产物 | 必需验证 |
|---|---|---|---|
| L0 Smoke | 文案、小样式、低风险文档改动 | 简短 QA 记录或 PR 说明 | 相关页面/文档自检 |
| L1 Standard | 普通 feature、bugfix、局部 UI 修复 | `test-cases-vN.md` 基础表 + execution matrix/result/summary | 相关 Vitest / Playwright / 手工检查 |
| L2 Professional | 题目生成器、教学体验、复杂状态、存档迁移、账号同步、跨模块重构 | 专业用例表 + risk model + coverage matrix + execution matrix + 三层报告 | Code Review、自动化、拟真人工 / 视觉 QA |
| L3 Release Gate | 版本收口、上线前、全量回归、高影响风险关闭 | release QA summary + 回归矩阵 + issue 分流 | 全量测试、关键用户旅程、历史缺陷回归、残余风险裁决 |

### 情境矩阵

| 情境 | 默认深度 | 重点 |
|---|---|---|
| Hotfix / 单点 bug | L1；若影响存档/付费/账号升 L2 | 原缺陷复现、回归用例、相邻路径 |
| 普通功能 | L1 | 正向路径、边界、失败反馈、回归门 |
| 题目生成 / 随机分布 | L2 | test basis、风险、统计抽样、oracle、题感 charter |
| 教育体验 / 游戏循环 | L2 | 用户画像、动机、节奏、反馈、成就/挫败感 |
| UI / 视觉 / 移动端 | L1-L2 | 多视口、焦点、可读性、视觉 token、截图证据 |
| 账号 / 同步 / 存档迁移 | L2-L3 | 数据不丢、离线/重试/冲突、旧版本兼容、安全降级 |
| 安全 / 隐私 | L2 | NIST / OWASP 最小检查、secret、依赖、认证授权、输入边界 |
| 无障碍 / 儿童用户 | L1-L2 | WCAG/Xbox 可读性、键盘/触摸、焦点、时间压力、闪烁、认知负担 |
| 版本收口 | L3 | 当前开放 issue、已修回归、核心旅程、发布阻塞项 |
| QA 制度 / 工具变更 | L1-L2 | 自检用例、适配件同步、归档规则、工具入口一致性 |

---

## 2. 输入要求

正式 QA 用例必须从测试依据出发。

1. 通读 `ProjectManager/Overview.md`，获取项目目标、当前版本、当前状态
2. 通读相关 `ProjectManager/Plan/vX.Y/` phase / subplan
3. 通读相关 `ProjectManager/Specs/` current spec 或实施规格
4. 对照 `src/` 实际实现理解当前能力边界
5. 查阅 `ProjectManager/ISSUE_LIST.md` 和相关 Backlog，了解已知问题和裁决
6. 对随机生成、教育题感、体验反馈类任务，必须补目标用户画像和 oracle

---

## 3. 测试用例设计规范

用例不是命令清单。用例必须回答：基于什么规格、覆盖什么风险、用什么技术验证、什么结果才算通过。

### 基础字段

L1 及以上 QA 至少包含：

| 列 | 必填 | 说明 |
|----|------|------|
| ID | 是 | 模块缩写-序号，如 `A-01`、`I-05` |
| 用例名称 / Test Condition | 是 | 简短描述测试条件 |
| Test Basis / 依据 | 是 | Plan、Spec、Issue、Backlog、代码模块或产品裁决 |
| 操作 / Procedure | 是 | 可复现的具体操作或命令 |
| 预期结果 / Oracle | 是 | 功能正确性、数据正确性或统计验收带 |
| 预期体验 / Expected UX | 是 | 用户视角感受、教学价值或可理解性 |
| 优先级 | 是 | P0(阻塞)/P1(重要)/P2(增强) |
| 验证方式 | 是 | Code Review / 自动化 / 视觉 QA / 模拟人工 / 安全 / 无障碍 |

### 专业字段

L2 / L3 或高风险任务必须增加：

| 列 | 必填 | 说明 |
|----|------|------|
| Risk | 是 | 风险 ID，如 `R1`；风险在 risk model 中定义 |
| Technique | 是 | 等价类、边界值、决策表、状态迁移、组合覆盖、统计抽样、探索式 charter 等 |
| Preconditions | 是 | 版本、夹具、存档、账号、网络、seed、视口等前置条件 |
| Evidence | 执行时必填 | 命令输出、截图路径、报告、代码引用或诊断数据 |
| Result | 执行时必填 | PASS / FAIL / RISK / BLOCKED |

### 执行矩阵硬性要求

L1 及以上 QA 在声明 PASS / FAIL / RISK 前，必须为测试用例表中的每个 Functional Case 和 Exploratory Charter 留下用例 ID 级执行记录。

1. 记录可以写在 `test-cases-vN.md` 的 Result / Evidence 列，也可以单独写入 `execution-matrix.md`；若单独成文，`qa-summary.md` 必须链接它。
2. execution matrix 至少包含：`ID`、`Result`、`补测/执行方式`、`Evidence`、`备注/残余风险`。
3. 命令级 PASS 不能替代用例级 PASS；必须能从每个用例 ID 追溯到具体测试名、源码行、截图、手工记录或命令输出。
4. 每个测试用例 ID 必须且只能有一个当前执行结论；未执行必须标 `BLOCKED` 或 `SKIP` 并说明原因。
5. 探索式 charter 也必须进入矩阵。若结论是 `RISK`，必须写清用户感知、后续观察条件和是否阻塞。
6. Exit Criteria 只能基于执行矩阵判断。若矩阵缺任何 P0 / P1 用例结果，不得声明本轮 QA PASS。

### 必备结构

L2 / L3 测试方案必须包含：

1. `Traceability Summary`：Task / Spec / Risk / 用例族映射
2. `Risk Model`：风险、影响、可能性、优先级、覆盖用例
3. `Coverage Matrix`：每个风险由哪些用例覆盖
4. `Execution Matrix`：每个测试用例 ID 的 Result / Evidence 映射
5. `Exit Criteria`：P0 必过项、可接受 RISK、非阻塞项边界
6. `Residual Risk`：剩余风险和后续观察项

### 常用测试设计技术

| Technique | 适用场景 |
|---|---|
| 等价类 | 题型、输入类型、账号状态、设备视口、难度档位 |
| 边界值 | 难度边界、数值范围、存档版本、retry 上限、屏宽 |
| 决策表 | 答案正确性 × 过程格 × 难度；登录状态 × 网络状态 × dirtyKeys |
| 状态迁移 | session 生命周期、rank match、同步状态、错题本流转 |
| 组合覆盖 | 模式 × 题型 × 难度 × 输入形态 |
| 统计抽样 | 随机生成器分布、重复率、选项均衡 |
| 经验/缺陷驱动 | 历史 bug、用户反馈、Backlog 高风险项 |
| 探索式 charter | 游戏体验、题感、教学解释、视觉可读性 |
| 安全检查 | threat / secret / dependency / input / auth / data persistence |
| 无障碍检查 | 键盘/触摸可达、焦点、对比度、闪烁、时间压力、认知负担 |

---

## 4. 模块划分原则

按游戏生命周期映射，不按代码模块：

1. **A — 迭代验证**：版本间回归、已修 ISSUE 确认、发布门禁
2. **B — 注册与首页**：新用户注册、主页信息展示、账号入口
3. **C — 闯关地图**：关卡解锁、路线选择、进度展示
4. **D — 答题通用**：开始答题、提交、退出确认、统一反馈
5. **E — 结算与进度**：答题结果、历史记录、错题、成就
6. **F — 题目生成**：生成器正确性、分布、边界、教学梯度
7. **G — 数字输入**：数字键盘、普通输入、余数、小数等
8. **H — 选择题**：选项展示、选择反馈、解释质量
9. **I — 竖式填空**：竖式计算板、过程格、焦点、错因
10. **J — 辅助页面**：设置、帮助、关于、个人中心
11. **K — 全局边界**：网络异常、存储极限、多标签页、旧存档
12. **S — 安全与隐私**：认证、同步、secret、依赖、输入边界
13. **X — 无障碍与儿童可用性**：可读性、焦点、触摸、时间压力、认知负担

---

## 5. 版本迭代规则

- 每轮修复/迭代后，在上一版基础上创建新版：`v1 -> v2 -> v3`
- 新版必须覆盖：新功能正向验证 + 旧缺陷回归 + 已修 ISSUE 确认关闭
- 已知缺陷用 `[KNOWN-DEFECT]` 标记；修复后转为正向验证用例
- 文件命名：`QA/runs/<date>-<scope>/test-cases-v{N}.md`
- 若上一版用例被判定过于简单，必须保留旧版并新增新版，不直接覆盖历史

---

## 6. 第一层：Code Review

静态代码审查在自动化和拟真人工前执行；无新代码变更时可跳过，但要说明。

关注重点：

- 架构边界：组件、store、engine、repository 是否按约定分层
- 规格符合：实现是否匹配 Plan / Spec / Issue 裁决
- 死代码：未使用 import、函数、组件、旧字段
- 类型安全：TypeScript 类型是否完整，是否有 `any` 逃逸
- 数据安全：旧存档迁移、同步、dirtyKeys、secret、依赖风险
- 测试设计：是否有对应单测 / 集成 / E2E / 体验 charter

---

## 7. 第二层：自动化测试

自动化覆盖用例表中标记为自动化的部分，工具入口以 `QA/capability-registry.md` 为准。

### Vitest 覆盖范围

- 题目生成器：输出正确性、选项数量、难度分布、统计抽样
- 数据模型：normalize、分数、进度、错题、存档迁移
- Campaign / Advance / Rank：解锁、挑题、session 状态
- 纯策略：竖式策略、提示策略、去重策略、同步 merge

### Playwright 覆盖范围

- 用户旅程：注册 → 首页 → 地图 → 答题 → 结算 → 历史/错题
- 交互验证：输入、按钮、焦点、弹窗、导航
- 数据持久化：localStorage、刷新恢复、旧存档
- 多视口：移动端、桌面端、关键窄屏

### 自动化纪律

- 优先小而快的单测；E2E 只覆盖用户可见关键路径
- 随机生成必须固定 seed / 足够样本 / 验收带
- 大型浏览器测试需要说明为何不能下沉到单元或集成层
- flaky 不能直接标 PASS；必须复跑、归因、隔离或降级为 RISK
- 自动化执行完成后，必须把每个相关用例 ID 写入 execution matrix；只记录“命令通过”不算完成用例执行记录

---

## 8. 第三层：拟真人工 / 视觉 / 无障碍 QA

拟真人工不是随意试用，必须可审计。

### 执行要求

1. 测试前确定目标用户画像：math-quest 默认是上海五年级学生，数学能力中等
2. 按 charter 执行，每批 10-20 条用例或 45-90 分钟 session
3. 每条记录使用四栏协议：用户预期 / 操作路径 / 实际观察 / 判定与证据，并带上对应用例 ID
4. 每条 FAIL 和 RISK 必须附证据；PASS 可附代表性证据
5. 体验问题必须写用户感知，不只写技术现象
6. 每个 charter 的最终 Result / Evidence 必须同步到 execution matrix；分组总结不能替代 ID 级记录

### 视觉与无障碍重点

- 多视口布局、文本不截断、关键输入不溢出
- 焦点顺序、键盘/触摸可达、按钮命名可理解
- 对比度、闪烁/动画、时间压力、儿童认知负担
- 游戏反馈是否清楚：成功、失败、警告、错因、下一步

---

## 9. 安全 / 隐私最小门禁

涉及账号、同步、远端服务、用户数据、依赖升级或上线时必须执行。

最小检查：

- `npm audit` 或依赖风险说明
- secret / env 泄漏检查
- 认证、授权、离线降级、重试、超时、冲突合并
- 输入边界与非法状态
- 本地存档和远端数据不丢、不串号
- 使用 OWASP / NIST 作为检查清单，而不是全量安全认证

---

## 10. 缺陷流转规范

### 发现阶段

QA 发现问题后，写入 `ProjectManager/ISSUE_LIST.md`，每条包含：

| 字段 | 说明 |
|------|------|
| 编号 | `ISSUE-{NNN}`，递增 |
| 优先级 | P0(阻塞)/P1(重要)/P2(增强) |
| 来源 | QA 层级 + 用例 ID，如 `Auto F-DIV-03` |
| 现象 | 客观描述看到了什么 |
| 用户感知 | 对用户体验 / 教学 / 数据安全的影响 |
| 建议方向 | 建议修复方向，可选 |
| 状态 | `⬜ 待修复` / `⬜ 待评估` |

### 产品裁决阶段

| 裁决 | 状态变更 | 后续动作 |
|------|---------|---------|
| 接受 | `✅ 按产品决策接受（不修复）` | 添加产品结论；下轮用例移除 FAIL 预期 |
| 修复 | `⬜ 待修复` → `✅ 已修复` | 进入修复排期；下轮添加回归验证 |
| 降级/跟踪 | 调整优先级，保持 `⬜ 待评估` | 保留为体验增强项或 Backlog |

### 回写要求

裁决后按影响同步：

- `ProjectManager/ISSUE_LIST.md`
- 当轮 QA 计划 / 结果报告
- 对应 Plan / Phase / Subplan
- 影响当前状态时回写 `ProjectManager/Overview.md`

---

## 11. QA 产物与 Git 归档规则

正式测试工作生产资料和正式结论可以入库；测试过程大产物默认不入库。

### 应入库

- `QA/qa-leader-canonical.md`
- `QA/capability-registry.md`
- `QA/templates/*.md`
- `QA/runs/<date>-<scope>/test-cases-vN.md`
- `QA/runs/<date>-<scope>/execution-matrix.md`
- `QA/runs/<date>-<scope>/test-design-methodology.md`
- `QA/runs/<date>-<scope>/qa-summary.md`
- `QA/runs/<date>-<scope>/*-result.md`
- 正式、可复用、手写的 QA 脚本或 Playwright spec

### 默认不入库

- 截图、视频、trace、Playwright report
- raw JSON、raw console log、临时诊断输出
- 大批量 artifacts、临时下载文件、生成缓存
- 只服务当次排查、不可复用的脚本

### 例外

关键 FAIL / RISK 证据可以在报告中引用路径；如需长期保存小型证据，必须在报告中标记为“长期证据”，并避免批量提交。

---

## 12. 产出物目录结构

```
QA/
  qa-leader-canonical.md
  capability-registry.md
  templates/
    test-cases-professional-template.md
  e2e/
    {test-name}.spec.ts
  scripts/
    {script-name}.py / {script-name}.mjs
  artifacts/
    ... ignored process artifacts ...
  runs/<date>-<scope>/
    test-design-methodology.md
    test-cases-v{N}.md
    execution-matrix.md
    code-review-result.md
    automated-result.md
    manual-result.md
    visual-result.md
    qa-summary.md
    artifacts/
      ... ignored screenshots / raw evidence ...
```

---

## 13. 执行编排

```
步骤 0: 最小 preflight（任务类型 → 情境 → registry → 复用工具）
    ↓
步骤 1: 选择 QA 深度（L0/L1/L2/L3）
    ↓
步骤 2: 设计/更新测试用例（basis → risk → technique → oracle → 预置 execution matrix）
    ↓
第一层: Code Review（无新代码可说明跳过）
    ↓
第二层: 自动化测试（Vitest + Playwright + 专项脚本 + 安全/无障碍检查）
    ↓
第三层: 拟真人工 / 视觉 QA（charter + 四栏协议 + 证据）
    ↓
汇总: execution matrix 完整性检查 → 缺陷分流 → ISSUE_LIST → 产品裁决 → 文档回写 → 残余风险
```

用户可指定范围：

- "只跑自动化"：执行第二层；仍需最小 preflight
- "只做体验测试"：执行第三层；需用户画像和 charter
- "视觉回归"：执行视觉 / 多视口 / token / 可读性
- "全量 QA"：按 L3 release gate 执行
- "写测试用例"：至少输出 L1 表；高风险任务输出 L2 专业结构
