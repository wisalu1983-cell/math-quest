# 吸收 Gstack QA 体系、优化现有 QA Leader 的方案

**日期**: 2026-04-18  
**状态**: 研究方案 / 待评审  
**范围**: QA 方法论、流程分层、报告模板、Issue 分流、浏览器测试 runner 策略  

---

## 1. 背景

当前项目已经具备一套可运行、可归档、可回写项目管理文档的 QA 体系：

- 规范源: [`QA/qa-leader-canonical.md`](../QA/qa-leader-canonical.md)
- Claude Code 适配: [`/.claude/skills/qa-leader/SKILL.md`](../.claude/skills/qa-leader/SKILL.md)
- 已有报告样例:
  - [`ProjectManager/Reports/2026-04-15-full-qa-results.md`](../ProjectManager/Reports/2026-04-15-full-qa-results.md)
  - [`ProjectManager/Reports/2026-04-15-visual-qa-results.md`](../ProjectManager/Reports/2026-04-15-visual-qa-results.md)
  - [`ProjectManager/Reports/2026-04-17-qa-issue057-session.md`](../ProjectManager/Reports/2026-04-17-qa-issue057-session.md)

这套体系的优势是：

- 强项目定制：测试用例从 Spec 出发，不是纯通用巡检
- 强闭环：Issue、Overview、Plan、QA 报告之间可以回写
- 强分层：Code Review、自动化测试、拟真人工 QA 已拆开
- 强证据：已有 Playwright、截图、人工体验记录

但当前体系也存在几个可以优化的空位：

- 浏览器 QA 还缺少统一的模式定义，例如 quick / full / regression / diff-aware
- 缺少统一的 issue taxonomy 和 health score 机制
- 浏览器巡检报告格式仍偏“按批次自由发挥”，可进一步标准化
- 对“哪些问题应自动进入修复闭环，哪些问题必须留给产品/人工判断”的分流规则尚未制度化

---

## 2. 本次研究对象

本次研究基于本地隔离副本：

- Gstack 源码副本: [`/.research/gstack-src`](../.research/gstack-src)

关键参考文件：

- Gstack 架构说明: [`/.research/gstack-src/ARCHITECTURE.md`](../.research/gstack-src/ARCHITECTURE.md)
- `/browse` 说明: [`/.research/gstack-src/browse/SKILL.md`](../.research/gstack-src/browse/SKILL.md)
- `/qa-only` 说明: [`/.research/gstack-src/qa-only/SKILL.md`](../.research/gstack-src/qa-only/SKILL.md)
- `/qa` 说明: [`/.research/gstack-src/qa/SKILL.md`](../.research/gstack-src/qa/SKILL.md)
- 共享 QA methodology 生成源: [`/.research/gstack-src/scripts/resolvers/utility.ts`](../.research/gstack-src/scripts/resolvers/utility.ts)
- 报告模板: [`/.research/gstack-src/qa/templates/qa-report-template.md`](../.research/gstack-src/qa/templates/qa-report-template.md)
- Issue taxonomy: [`/.research/gstack-src/qa/references/issue-taxonomy.md`](../.research/gstack-src/qa/references/issue-taxonomy.md)

---

## 3. 总结结论

### 3.1 要吸收什么

应吸收 Gstack 的 **QA 方法论和结构化输出能力**，主要包括：

- diff-aware 浏览器测试模式
- quick / full / regression 模式定义
- 统一的 severity / category taxonomy
- health score 与 baseline 对比
- issue 发现时即时落盘的报告纪律
- report-only 护栏
- 对“客观可验证问题”进入 fix loop 的分类思想

### 3.2 不吸收什么

不应将 Gstack 的 **运行时与平台依赖** 直接并入主流程，尤其是：

- `browse` daemon 本身
- Bun / Node 双运行时适配链
- Gstack 的 CLI 命令面
- 与当前 Windows 原生环境强耦合的不稳定实现细节

### 3.3 结论性策略

**吸收方法论，不强绑定运行时；先把 QA 情境层与 runner 层解耦。**  
`qa-leader` 继续作为项目唯一的总编排器，但它的核心不应再是“固定跑哪一个工具”，而应是：

- 固定保留 QA 情境模式
- 按项目类型和测试目标选择更合适的 runner/provider
- 保持统一的 taxonomy、报告结构、Issue 分流和证据纪律

在这个框架下：

- Playwright 继续作为当前浏览器产品中的默认稳定回归 runner
- browser runner 是浏览器产品中探索式 QA 的关键执行器
- 但 browser 能力不是所有项目的通用必选项；系统/Agent 类项目需要的是对应的状态/日志/协议 explorer runner

### 3.4 优先级判断基准的修正

本方案的优先级判断，**不能只依据项目当前所处阶段**。  
更合理的基准应同时考虑两件事：

1. **项目生命周期里会反复出现的 QA 情境**
   - 发现问题 / 理解问题
   - 围绕变更做定向验证
   - 回归守门
   - 主观体验判断
2. **项目的主风险面**
   - 浏览器产品型项目：UI、交互、页面状态、console/network
   - 系统/Agent 型项目：状态一致性、协议契约、日志可观察性、行为链条

因此，真正应优先建设的是：

- `qa-leader` 的情境分流骨架
- `mode` 与 `runner` 的解耦设计
- 跨 runner 通用的报告、taxonomy、Issue 分流与 baseline 机制

而不是在一开始就把某一个具体 runner 当作整个体系本身。

---

## 4. `/browse`、Playwright、`qa-only`、`qa` 与现有体系的关系

### 4.1 `/browse` 与 Playwright

二者不是简单替代关系，而是 **底层-上层** 关系：

- Playwright 更像浏览器自动化底座，适合稳定脚本、回归测试、CI、长期维护测试资产
- `/browse` 更像建立在 Playwright/Chromium 之上的 agent 交互式浏览器层，适合探索、试玩、现场复现、保留会话状态、边操作边查 console/network

对本项目的流程理解可收敛为：

- **发现问题、理解问题**：更偏 `/browse` 思路
- **固化检查、守住质量**：更偏 Playwright 思路

### 4.2 `qa-only` 与现有 `qa-leader`

`qa-only` 不是 `qa-leader` 的替代品。

- `qa-only` 更像浏览器巡检工作流
- `qa-leader` 是项目级 QA 编排器

`qa-leader` 的职责仍然包括：

- 测试用例设计
- 三层 QA 编排
- Issue 分流
- 产品裁决与文档回写

因此，`qa-only` 适合被吸收为：

- 第二层浏览器 QA 的一种方法论模板
- 报告模板与 issue taxonomy 的来源
- quick/full/regression/diff-aware 模式的参考实现

### 4.3 `qa` 与现有 Issue 流程

Gstack `/qa` 的核心价值不是“会修 bug”本身，而是它引入了：

- fix loop
- fix status 分类
- before/after 证据
- regression test 回补
- 停止机制和风险预算

这些能力对当前项目仍然有借鉴价值，但不能原封不动照搬。

### 4.4 QA 情境与 runner 的关系

本次讨论后，`qa-leader` 中最需要固化的不是“默认工具”，而是：

- **先判断测试情境**
- **再分配最合适的 runner**

建议固定保留以下 QA 情境：

- `explore`：发现问题、理解问题、试玩和排查
- `diff-aware`：围绕本次改动范围做定向验证
- `regression`：回归守门、版本收束、历史问题防回归
- `human-judgment`：体验、表达、节奏、产品判断

同一种 QA 情境，在不同项目里可以对应不同 runner：

- 对 `MathQuest` 这类浏览器产品，`explore` 更适合 browser runner，`regression` 更适合 Playwright
- 对 `TinyMB` 这类系统/Agent 项目，`explore` 更适合状态/日志/协议 explorer runner，而不是 browser runner

这意味着：

- browser 能力是**浏览器产品型项目**里探索式 QA 的关键执行器
- 但 browser 能力不是**所有项目**的通用前置条件
- 真正需要被制度化的是“探索式 QA”这条腿，而不是某个具体实现

---

## 5. 对当前 Issue 流程的修正理解

本次讨论已明确，当前项目并不是“所有 Issue 都要走产品裁决”。

更准确的描述是：以下两类问题仍然必须保留给人工判断或裁决：

1. **Agent 无法高置信度给出结论的问题**
2. **需要真人主观判断的体验类问题**

据此，Issue 应分为三类：

| 类型 | 定义 | 处理方式 |
|---|---|---|
| A 类：客观 + 高置信度 + 可验证 | 如死按钮、确定性 console error、明显状态同步 bug | 可进入自动 fix loop |
| B 类：客观但低置信度 / 修复面大 | 如根因不明、跨模块影响大、可能是脚本误判 | 记录 Issue，不自动修 |
| C 类：体验 / 产品判断类 | 如节奏、奖励感、视觉愉悦度、表达是否适龄 | 记录 Issue，进入人工判断/产品裁决 |

这意味着：  
Gstack `/qa` 的 fix loop 思路 **有明显可借鉴部分**，但应当只服务于 A 类问题，而不是作为默认总流程。

---

## 6. 推荐的新 QA Leader 结构

推荐将现有 `qa-leader` 优化为下面的结构：

```text
qa-leader
├─ 步骤 0: 测试用例设计 / 批次定义
├─ 第一层: Code Review
├─ 第二层: QA 情境层
│  ├─ explore
│  ├─ diff-aware
│  ├─ regression
│  └─ human-judgment
├─ 第三层: runner/provider 层
│  ├─ browser product / regression: Playwright
│  ├─ browser product / explore: browser runner（未来可为 gstack-like）
│  ├─ system project / explore: state-log-protocol explorer
│  ├─ visual/manual: visual-screenshot-qa / agent-as-user-qa
│  └─ shared output: taxonomy / report / baseline / health score
├─ 第三层半: Objective Fix Loop（仅 A 类问题）
│  ├─ verified / best-effort / reverted / deferred
│  └─ regression test 回补
└─ 汇总: ISSUE_LIST / Overview / Plan / Reports 回写
```

其中最重要的变化有五个：

1. `qa-leader` 先定义测试情境，再决定 runner，而不是先绑死某个工具
2. 探索式 QA 被提升为一级能力，而不是“手工补充项”
3. 新增统一 taxonomy 和 health score
4. 新增 baseline / regression 概念
5. 新增只服务 A 类问题的 fix loop，而不是让所有 QA 结果都自动进入修复

---

## 7. 应吸收的具体能力

### 7.1 QA 情境模式与执行强度

建议在 `qa-leader` 中固定四种**情境模式**：

- `explore`
  - 目标：发现问题、理解问题、快速试玩、现场排查
  - 使用时机：功能刚做完、问题尚未成形、需要先建立 bug list / 优化 list
- `diff-aware`
  - 目标：围绕当前变更范围做定向验证
  - 使用时机：feature branch、当轮小范围改动、局部修复后确认影响面
- `regression`
  - 目标：对比 baseline，识别修复项和新增问题
  - 使用时机：版本收束、封板前回归、历史问题防回归
- `human-judgment`
  - 目标：处理体验、节奏、表达、适龄性等主观判断问题
  - 使用时机：拟真人工 QA、设计/产品体验评估、视觉与交互感受验证

在情境模式之外，再定义两种**执行强度**：

- `quick`
  - 目标：30 秒到 2 分钟的 smoke / spot check
  - 使用时机：修一个小 bug 后快速确认、局部功能首次摸查
- `full`
  - 目标：完整巡检 / 完整批次执行
  - 使用时机：阶段验收、批量修复后整体验证、版本封板前复核

这样可以避免把“测试情境”和“执行力度”混为一层概念。

### 7.2 Issue Taxonomy

建议在当前 QA 体系中引入统一的 category：

- `visual`
- `functional`
- `ux`
- `content`
- `performance`
- `console`
- `accessibility`

severity 则推荐保留项目已有的 P0/P1/P2/P3 表达，但建立与 Gstack 风格的语义映射：

- `P0` ≈ critical
- `P1` ≈ high
- `P2` ≈ medium
- `P3` ≈ low

这样既保持项目现有管理语言，又能吸收结构化评分逻辑。

### 7.3 QA 报告模板

建议引入标准化报告结构，最少包括：

- 元信息：日期、范围、模式、环境、分支、提交
- Health Score 总分与分项
- Top 3 Things to Fix
- Console Health 摘要
- Summary 统计
- Issues 详细条目
- Regression 对比区块

### 7.4 Baseline / Regression

建议每轮浏览器 QA 除 Markdown 报告外，再输出一份结构化 baseline JSON，至少包含：

- date
- scope
- mode
- healthScore
- issues
- categoryScores

这样下轮 regression 可以回答：

- 哪些问题消失了
- 哪些问题新增了
- 总体质量分提升还是下降

### 7.5 即时落盘纪律

建议吸收 Gstack 的一个重要纪律：

**issue 发现时立即写入报告草稿，不要等 session 末尾再回忆。**

这样能减少：

- 证据遗漏
- 严重度漂移
- 复现步骤失真

---

## 8. 不建议直接吸收的内容

以下内容当前不建议直接并入主流程：

### 8.1 Gstack `browse` 运行时

原因：

- 与 Bun / Node 双链路强耦合
- Windows 原生环境下仍存在兼容性复杂度
- 当前项目已有可用 Playwright runner，不应为了方法论收益引入运行时不稳定性

### 8.2 “用户一叫 QA 就必须浏览器巡检”的绝对规则

本项目已有三层 QA 模型。某些任务是：

- generator 逻辑
- store 状态
- repository 迁移

这些不应被强制浏览器优先。

### 8.3 “完全不读源码”的 report-only 规则

Gstack 的 `qa-only` 强调测试者视角，不看源码。  
本项目不必机械照搬。

更适合本项目的规则是：

- 在问题**发现阶段**优先遵循用户视角
- 在**分类与归因阶段**允许有限读源码辅助判断可信度
- 但在 report-only 模式中，不给出过度自信的修法承诺

---

## 9. 当前 Windows 环境下的前置条件判断

### 9.1 已满足

- 项目已有 `playwright` 依赖
- 当前 QA 体系已有 Playwright、视觉 QA、拟真 QA、报告归档
- 项目已有 `qa-leader` 规范源和多层流程
- `code-review` / `requesting-code-review` 等外围能力已接入

### 9.2 未满足

- 当前机器未准备 Gstack 所需的完整 Bun / browse 运行时
- Gstack 在 Windows 原生环境下仍需额外的 Node server bundle 适配
- 现阶段不应把 Gstack browse 当作现成稳定 runner 挂进主流程

### 9.3 结论

**当前环境足以吸收 Gstack QA 方法论，并足以先把 `qa-leader` 的情境分流骨架立起来；但仍不足以将 Gstack browse 作为主流程依赖。**

补充判断：

- 对浏览器产品型项目，Windows 下的 browser runner 是后续重要增强项
- 但它不是整个 QA 架构落地的通用前置条件
- 当前应优先保证 `mode` / `runner` 解耦、报告结构、Issue 分流与默认 runner 的稳定化

---

## 10. 推荐落地路径

### Phase 1：先定架构骨架与规范

目标：先把 `qa-leader` 的情境层、runner 层、共享产物层定义清楚；不强依赖新运行时

建议产出：

- 更新 `QA/qa-leader-canonical.md`
- 明确 QA 情境模式：`explore / diff-aware / regression / human-judgment`
- 明确执行强度：`quick / full`
- 新增 runner/provider 约定与分流矩阵
- 新增 QA taxonomy 文档
- 新增结构化 QA 报告模板
- 新增 baseline JSON 约定
- 明确 A/B/C 三类 Issue 分流规则

### Phase 2：稳住默认 runner，并让它适配新模式

目标：让现有稳定 runner 支持新的 QA 情境和执行强度。  
对于当前浏览器产品型项目，这一步具体表现为让现有 Playwright 流程支持：

- quick
- diff-aware
- regression
- full

这一阶段的重点是把“当前默认 runner”工程化为稳定守门腿，而不是补探索式 runner。

### Phase 3：补第一条探索式 runner

目标：为 `explore` 情境补上一条独立执行腿，但根据项目类型选择最合适实现：

- 浏览器产品型项目：优先做 Windows 可用的 browser runner
- 系统/Agent 型项目：优先做 state-log-protocol explorer runner

注意：这一步的目标不是“必须还原 Gstack 原版 `/browse`”，而是让 `qa-leader` 真正拥有探索式 QA 能力。

### Phase 4：增加 Objective Fix Loop（仅 A 类 Issue）

目标：将 `/qa` 的部分思想引入：

- verified / best-effort / reverted / deferred
- regression test 回补
- before/after 证据
- 风险预算与停止机制

这一阶段应严格限定在 **高置信度、客观、可验证** 的问题上。

### Phase 5：扩展 provider 生态

目标：在已有分流骨架和第一条 explorer runner 稳定后，再扩展更多 provider：

- `playwright` 继续作为浏览器产品中的默认回归 provider
- 浏览器产品可继续评估 `gstack-like browse` provider
- 系统/Agent 项目可补更多状态回放、日志分析、协议契约验证 provider

注意：这一步是扩展项，不是前置项。

---

## 11. 风险与边界

### 11.1 风险

- 如果过早把 fix loop 扩大到 B/C 类问题，容易引入误修
- 如果把 Gstack runtime 强绑定进主流程，Windows 环境会放大平台维护成本
- 如果 health score 过早被当作硬 KPI，可能遮蔽项目真正重视的体验判断

### 11.2 边界

本方案明确不主张：

- 直接把 Gstack 整体 vendoring 进项目主流程
- 当前就在 Windows 环境里部署 Gstack browse 作为正式依赖
- 把所有 Issue 都改造成自动修复驱动

本方案主张的是：

- 先吸收 QA 方法论
- 保持 `qa-leader` 的项目编排中心地位
- 保持 Playwright 作为当前稳定执行层
- 仅在高置信度问题上吸收 `/qa` fix loop 的一部分思想

---

## 12. 最终建议

对于 `qa-leader` 的当前演进，最合理的吸收策略是：

1. **保留 `qa-leader` 为唯一总编排器**
2. **优先把 QA 情境模式和 runner/provider 解耦设计写进体系**
3. **吸收 Gstack 的 `qa-only` 方法论、taxonomy、health score、baseline 与报告模板**
4. **把探索式 QA 作为一级能力保留，但不要把它和某一个具体 runner 绑定**
5. **继续把 Playwright 用作浏览器产品中的默认回归执行层，而不是把它误当成所有项目的唯一 runner**
6. **按项目类型补第一条 explorer runner：浏览器产品优先 browser runner，系统/Agent 项目优先 state-log-protocol explorer runner**
7. **只对 A 类 Issue 引入有限的 objective fix loop**
8. **将 Gstack browse 运行时兼容性工作视为浏览器产品方向的重要增强项，而不是整个主流程的前置依赖**

一句话总结：

> **先立分情境 QA 的骨架，再按项目类型补不同的探索式执行腿。**
