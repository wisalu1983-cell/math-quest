# Matt skills 与 MathQuest v0.6 项目治理讨论提炼

## 高度概要

本轮讨论围绕一个问题展开：MathQuest 后续是否应吸收 Matt Pocock skills repo 的工程工作方法，并在 v0.6 开始调整项目治理结构。

最终结论是：Matt repo 不适合作为 MathQuest 的完整项目管理体系替代品，但非常适合作为“开发执行质量控制层”。MathQuest 应继续保留自己的版本计划、教育设计、QA leader、Living Spec 和 PM 文档治理；在开发执行层吸收 Matt 的 `grill-me`、`design-an-interface`、`tdd`、`diagnose`、`to-issues`、`improve-codebase-architecture` 等方法。

v0.6 的推荐治理简化为三层：主 agent 继续负责产品、项目、文档、版本治理和需求澄清；开发子 agent 负责技术方案、开发模式判定、实现、TDD、refactor 和架构检查；QA 子 agent 负责测试策略、用例、自动化 / 拟真 / 视觉 QA、缺陷分流和 release gate。学习设计、发布、Spec 事实源治理不另拆常驻角色，仍由主 agent 统筹，必要时临时引入专项 reviewer。

开发方式不应固定为 vertical slice 或横向模式。每个版本预研后，应先做一次“开发模式判定”，再制定后续版本计划。用户可见功能优先 vertical slice；账号同步、存档迁移、共享输入协议等高风险基础设施采用 foundation slice + vertical slice；纯诊断走 diagnostic phase；Release Gate 走 stabilization / QA phase。

## 背景

用户提供了一份 `source-matt-pocock-skills-analysis.md`，内容分析了 Matt Pocock skills repo 的定位、核心 skill、工程哲学和对 MathQuest agent 架构的启发。

该材料指出 Matt repo 主要解决 AI coding 的四类失败模式：

- Agent 没理解需求：用 `grill-me` / `grill-with-docs` 深度质询。
- Agent 过度啰嗦或术语漂移：用共享领域语言和上下文文档压缩沟通。
- 代码不工作：用 `tdd` 和 `diagnose` 建立反馈循环。
- 代码变泥球：用架构审查和 deep module 思想定期清理。

MathQuest 当前已经有较成熟的项目治理能力：

- `ProjectManager/Overview.md` 作为活跃控制面。
- `Plan/vX.Y/` 版本包、Phase、subplan、Issue、Backlog。
- `dev-doc-flow` 约束开发文档和子计划。
- `qa-leader` 约束 L0-L3 QA。
- `Specs/<feature-slug>/current.md` 作为长期事实源。
- `pm-sync-check` 控制跨源文档一致性。

因此讨论重点不是“是否整套迁移 Matt repo”，而是“哪些方法可以补 MathQuest 缺口，哪些方法可以让已有工作流更简洁高效”。

## 讨论过程

### 1. Matt repo 与 MathQuest 现有方法的关系

讨论先比较了 Matt repo 的方法和 MathQuest 当前机制。

一致处：

- Matt 的动手前质询，对应 MathQuest `dev-doc-flow` 的需求质量门、架构决策门和 Living Spec 门。
- Matt 的 TDD 和 diagnose，对应 MathQuest 的证据先行、测试验证、QA leader。
- Matt 的架构审查，对应 MathQuest 开发文档中的模块 ownership、类型/API、持久化、兼容性和 QA 映射。
- Matt 的共享语言和 ADR 思想，对应 MathQuest 的 Overview、Spec、Plan、Issue、Backlog。

差异处：

- Matt repo 默认用户是工程师，能参与接口、架构、重构判断。
- MathQuest 的用户是制作人，技术判断应由 agent 承担，产品方向和体验取舍才交给用户。
- Matt 的 `to-prd`、`to-issues` 和完整 `CONTEXT.md + ADR` 体系不应替换 MathQuest 已有 ProjectManager。
- MathQuest 的 QA leader、Living Spec 和版本治理比 Matt repo 更项目化。

### 2. 可吸收的 Matt 方法

按“补缺环节”和“简化效率”两条原则，筛出最值得吸收的六项：

| 方法 | 吸收价值 | 在 MathQuest 中的落法 |
|---|---|---|
| Design It Twice | 防止关键接口第一稿定坏 | 复杂接口如 `LongDivisionTask`、提交 payload、slot 注册先比较 2-3 种形状 |
| Tracer Bullet / Vertical Slice | 让用户可见闭环更早出现 | 每个功能先跑通一个端到端薄片 |
| Feedback Loop First | 避免凭经验修 bug | bugfix 先建最小复现和回归信号 |
| HITL / AFK | 区分需要用户确认和 agent 可独立执行 | subplan task 表增加 `HITL/AFK` |
| 轻量统一语言表 | 减少术语重复解释 | 不新建重型 CONTEXT，优先放到 current spec 或轻量 glossary |
| Architecture Friction Review | 避免 slice 堆积成泥球 | 每 2-3 个 slice 检查重复、浅封装、接口漂移、测试困难点 |

### 3. `grill-me` 与 `structured-thinking-dialogue`

讨论确认两者相似但层级不同。

- `grill-me` 更像计划压力测试器：针对已有计划逐问逐答，逼近决策树。
- `structured-thinking-dialogue` 更像完整思考脚手架：从命题、假设、路径、拆解、框架到压力测试。

建议是：不单独用 `grill-me` 替代本地 `structured-thinking-dialogue`，而是把 `grill-me` 吸收成其中的“压力追问模式”，尤其用于 coding 前 UI / 接口方案确认。

### 4. 新项目初始化与 MathQuest 老项目改造的差异

新项目可以一开始就吸收 Matt 的最小治理骨架：

- `Overview`
- `Glossary`
- `Decision Log / ADR-lite`
- `Plan`
- `Specs/current`
- `QA minimal`
- `Issue / Backlog`

MathQuest 作为已有项目，则不适合新增第二套治理入口，应把 Matt 方法嵌入现有 `dev-doc-flow`、版本包、QA 和 current spec。

### 5. Vertical slice 的收益与风险

用户追问 vertical slice 是否会重复造轮子。结论是：会，所以必须配套 refactor 和架构检查。

实战原则：

- 第一片允许轻微重复。
- 第二片出现真实重复时抽共享逻辑。
- 第三片验证抽象是否稳定。
- 每片结束做小 refactor 门，删除硬编码、补测试、确认没有 preview-only 泄漏。

以 `BL-010` 为例：

- 切片 1：`936 ÷ 4` 整数多轮长除法。
- 切片 2：`824 ÷ 4` 商中间 0，并抽 `buildLongDivisionRounds()`。
- 切片 3：`5.76 ÷ 3` 小数点预置。
- 切片 4：`15.6 ÷ 0.24` 前置扩倍训练格。
- 切片 5：取近似后置结果格。
- 切片 6：循环小数结构化结果。

### 6. 对 MathQuest 历史过程的反事实复盘

讨论回顾了 v0.1 到 v0.5 的实际开发历程。

如果从一开始采用 vertical slice，收益主要会出现在：

- v0.1 生成器重做：更早发现 Practice UI 指令丢失、长题面截断、题型体验不成立。
- v0.1 段位赛：更早暴露 build-only 报错、E2E 真 bug、刷新恢复问题。
- v0.3 账号同步：更早用真实 Supabase 跑通最小登录和同步闭环。

不如原流程的地方：

- 教育设计全局一致性可能更弱。A01/A04/A08 梯度、A05 与 A02/A03 重叠、星级上限这类问题仍需要全局规格收敛。
- 高风险基础设施不适合纯 vertical slice，仍需要 foundation slice。
- QA 如果每片都跑全套，会产物膨胀，应该采用“小片轻验证 + feature L2 + 版本 L3”。

最终结论：MathQuest 不应全盘切成 vertical slice，而应在版本预研后做开发模式判定。

### 7. 版本预研后的开发模式判定

讨论形成一个固定流程：

```text
版本预研
→ 开发模式判定
→ 版本计划：Phase / Slice / Foundation / Diagnostic 的组合
→ 每个子项进入 dev-doc-flow 或 qa-leader
→ 版本收口与 current spec 回写
```

判定表：

| 预研结果类型 | 推荐模式 |
|---|---|
| 用户可见功能、交互链路、题型体验 | vertical slice |
| 账号同步、存档迁移、共享输入协议、底层架构 | foundation slice + vertical slice |
| 纯诊断、题目质量抽样、规则确认 | diagnostic phase |
| 多个功能互相独立 | 并行小 slice / 独立 subplan |
| 教育体系、题型 IA、难度分档、版本方向 | 先做全局设计 / 规格收敛，再切 slice |
| Release Gate、历史回归、版本收口 | stabilization / QA phase |

### 8. 三类角色分工

讨论最后收敛为 v0.6 轻量角色分工：

| 角色 | 职责 |
|---|---|
| 主 agent | 产品 / 项目 / 文档 / 版本治理 / 需求澄清 / 体验决策辅助 |
| 开发子 agent | 技术方案、开发模式判定、实现、TDD、refactor、架构检查 |
| QA 子 agent | 测试策略、用例、自动化 / 拟真 / 视觉 QA、缺陷分流、release gate |

不再额外拆产品、项目、学习设计、发布等常驻子 agent。学习设计、Release、Spec 事实源治理仍由主 agent 统筹，只在需要时临时引入专项 reviewer。

### 9. 跨工具复用

讨论确认：同一个子 agent 的“角色脑子”可以跨 Claude Code、Codex 和 Cursor 复用，但配置文件不能完全通用。

推荐结构：

```text
ProjectManager/AgentRoles/development-leader.md   # 平台无关 canonical
.claude/agents/development-leader.md              # Claude Code 适配
.codex/agents/development-leader.toml             # Codex 适配
.cursor/rules/development-leader.mdc              # Cursor 适配
```

Claude Code 支持独立 subagent；Codex 支持 `.codex/agents/*.toml`；Cursor 更偏 Custom Mode / Rules，不等价于独立 subagent thread。

## 关键结论

1. Matt repo 应作为工程执行质量控制层，不替代 MathQuest 的项目管理体系。
2. MathQuest v0.6 可试行“主 agent + 开发子 agent + QA 子 agent”的轻量三角色架构。
3. 每个版本预研后应新增“开发模式判定”，再制定后续 Phase / Slice / Foundation / Diagnostic 组合计划。
4. Vertical slice 适合用户可见功能和交互体验，但必须配套 refactor、接口设计和架构摩擦检查。
5. 横向模式仍适用于基础设施和高风险数据任务；Matt 的 TDD、diagnose、interface design、architecture review 在横向模式里仍然适用。
6. v0.6 不建议一开始大改全项目流程，应选择一个中等复杂功能试点。
7. 子 agent 角色说明应先做一份平台无关 canonical，再分别适配 Claude Code、Codex 和 Cursor。

## 待办事项

### v0.5 收口前

- 不改变当前 v0.5 执行方式。
- 继续完成 `BL-010`、`ISSUE-069`、Release Gate、current spec 回写和版本收口。

### v0.6 启动时

- 在 `Plan/v0.6/01-*` 或 `03-phase-plan.md` 增加“开发模式判定”短表。
- 对每个 BL / ISSUE 标记推荐模式：`vertical slice`、`foundation slice`、`diagnostic phase`、`stabilization / QA phase`。
- 在 v0.6 的 `04-execution-discipline.md` 写入 slice 执行纪律：小片轻验证、2-3 片 refactor、feature L2、版本 L3。

### 角色与适配

- 新建平台无关角色说明：`ProjectManager/AgentRoles/development-leader.md`。
- 后续按需生成 `.claude/agents/development-leader.md`、`.codex/agents/development-leader.toml`、`.cursor/rules/development-leader.mdc`。
- QA 子 agent 可先复用现有 `qa-leader`，不急于新建更细角色。

### 流程模板

- 在 `dev-doc-flow` 或 subplan 模板中考虑增加 Slice 表字段：
  - `Slice ID`
  - `用户可见闭环`
  - `范围`
  - `HITL/AFK`
  - `依赖`
  - `测试信号`
  - `refactor 检查点`
  - `Spec/QA 影响`
- 该改动建议在 v0.6 试点后再固化，避免一次性改重。

### evolve 后续

- 本轮 evolve clean text 提取被 hardlink 检查阻塞，详情见 [`evolve-extraction-status.md`](./evolve-extraction-status.md)。
- 若后续需要严格的 evolve 产物，应先按 hardlink 修复指南处理 `evolve-review` 的 hardlink 不一致，再重新运行提取脚本。

## 验证边界

本归档没有改变任何产品功能、版本状态、Issue 生命周期或 QA 结论。因此未更新 `Overview.md`，也未运行 `pm-sync-check`。

