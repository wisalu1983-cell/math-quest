# Matt Pocock Skills Repo 调研与项目 Agent 架构设计

## 一、调研对象

- **Repo**: [github.com/mattpocock/skills](https://github.com/mattpocock/skills)
- **Stars**: 44,900+ | Forks: 3,600+ | License: MIT
- **定位**: "Skills for Real Engineers" — 给 Claude Code 等 coding agent 用的工程实践 skill 集合
- **作者**: Matt Pocock（Total TypeScript 作者，TypeScript 社区知名人物）

---

## 二、Repo 结构与内容

### 目录结构

```
skills/
├── engineering/         ← 核心，日常代码工作
│   ├── grill-with-docs  ← 需求质询 + 领域语言 + ADR
│   ├── tdd              ← 红绿重构 TDD 循环
│   ├── diagnose          ← 结构化 debug 六阶段
│   ├── improve-codebase-architecture ← 架构深化分析
│   ├── triage            ← Issue 分诊状态机
│   ├── to-issues         ← 计划拆分为 GitHub issues
│   ├── to-prd            ← 对话转 PRD
│   ├── zoom-out          ← 代码高层视角解释
│   └── setup-matt-pocock-skills ← 初始化配置
├── productivity/        ← 通用工作流
│   ├── grill-me          ← 通用版质询（非代码场景）
│   ├── caveman           ← 极度压缩输出，省 75% token
│   └── write-a-skill     ← 教你写 skill
├── misc/                ← 不常用工具
├── personal/            ← 个人专用
└── deprecated/          ← 废弃
```

### 配套体系

- **CONTEXT.md** — 项目领域术语表，贯穿所有 skill，减少 agent 冗余输出和误解
- **docs/adr/** — 架构决策记录（ADR），记录不可逆的、反直觉的、有真实权衡的决策
- **安装方式**: `npx skills@latest add mattpocock/skills`

---

## 三、核心设计理念

Matt 围绕 AI coding 的四个常见失败模式设计 skill：

| 失败模式 | 对应 Skill | 核心方法 |
|---------|-----------|---------|
| Agent 没理解你要什么 | `/grill-with-docs`, `/grill-me` | 动手前深度质询，逼你想清楚 |
| Agent 太啰嗦 | `CONTEXT.md` 术语表 | 建立共享领域语言，20 个字压缩成 1 个术语 |
| 代码不工作 | `/tdd`, `/diagnose` | 反馈循环是核心，红绿重构 + 六阶段调试 |
| 代码变成泥球 | `/improve-codebase-architecture` | Deep module 理论，定期架构审查 |

### "不是给 Vibe Coding 用的" 具体体现

**1. 强制"先想后做"的关卡**
- `/tdd` 要求先跟用户确认接口设计、确认测试行为、拿到 approval，才写第一行代码
- `/diagnose` Phase 1 花全文最大篇幅说一件事：建反馈循环，且明确禁止跳过
- `/grill-with-docs` 整个 skill 目的就是在动手前把方案盘清楚

**2. 垂直切片 vs 一次性生成**
- `/tdd` 明确反对水平切片（先写所有测试再写所有实现），要求一次只做一个 test→impl 循环
- Vibe coding 的典型模式是让 agent 一口气生成整个 feature

**3. 要求用户有工程判断力**
- `/improve-codebase-architecture` 用 John Ousterhout 的 deep module 理论，定义了完整术语表（Module/Interface/Depth/Seam/Adapter/Leverage/Locality）
- 预设用户能判断重构建议是否合理

**4. 拒绝自动驾驶**
- 多个 skill 在关键节点要求人类决策，且不是走过场
- `/diagnose` Phase 3 要求先列 3-5 个假设展示给用户再测试
- `/grill-with-docs` 遇到术语冲突会主动挑战用户

**5. 配套基础设施有门槛**
- CONTEXT.md 和 ADR 需要持续维护，需要理解领域建模
- README 原文："GSD、BMAD、Spec-Kit 帮你管流程（适合 vibe coder），我的 skill 要求你自己管"

---

## 四、对非程序背景用户的适配性分析

### 原始适配评估（12 个 skill）

| 分类 | Skill | 适配度 |
|------|-------|--------|
| 完全能用 | `/grill-me`, `/caveman`, `/write-a-skill` | ✅ 不涉及代码 |
| 表面能用实际卡住 | `/grill-with-docs`, `/to-prd`, `/to-issues`, `/triage` | ⚠️ 核心功能绑定代码库或 issue tracker |
| 完全不适用 | `/tdd`, `/diagnose`, `/improve-codebase-architecture`, `/zoom-out`, `/setup` | ❌ 纯工程工作 |

**结论：12 个 skill 里，只有 `/grill-me` 对非程序用户真正可用。** 这组 skill 的设计目标就是给写代码的工程师用的。

---

## 五、解决方案探索过程

### 方案一：设立独立的工程师 Agent

**思路**：用户和执行 skill 的 agent 对话，遇到工程判断节点时拉出一个工程师 agent 来回答。

**发现的问题**：
- 变成三方对话（skill agent ↔ 工程师 agent ↔ 用户），信息传递有损耗
- 需要用户判断"什么时候该拉工程师"——但用户有产品管理能力，可以判断
- 上下文在两个 agent 之间割裂

### 方案二：让 Skill Agent 本身就是技术合伙人

**思路**：不拆两个 agent，让执行 Matt skill 的 agent 本身具备资深工程师的判断力和技术合伙人的角色意识。

**优势**：
- 回到 Matt 设计的原始两方对话模型，最干净
- 上下文完整，不需要 agent 间传递
- Agent 自己知道什么该自决、什么该问用户

**核心改造**：在 agent 的 prompt 层面加一条覆盖规则（不改 Matt 的 skill 文件本身）：

> skill 流程中所有要求 user confirm 或 approval 的节点，先判断是工程问题还是产品问题。工程技术类由你自行判断并执行，只把结论和理由告诉用户。只有涉及产品方向、优先级、业务规则的决策才问用户。

**Agent 需要的五个核心能力**：

1. **完整的代码库心智模型** — 持续了解项目结构，维护 CONTEXT.md 和 ADR
2. **双语翻译** — 工程结论用业务语言表达，让产品人能理解和判断
3. **主动标记决策类型** — 告知用户"这个我自决了"还是"这个需要你定"
4. **Matt skill 流程的原生理解** — 知道每个阶段期望什么输出
5. **实际执行能力** — 不只是顾问，也能写代码、跑测试、修 bug

---

## 六、项目 Agent 架构设计

### 讨论背景

用户的实际情况：
- 个人开发项目，用户担任制作人角色
- 当前主 agent 通过 skill 和 rules 同时扮演技术合伙人、PM 和 QA
- 用户已经在实践中把大多数工程技术决策委托给主 agent
- 遇到过 agent 问工程问题，用户需要手动说"工程问题你自己判断"

### 是否需要拆分角色？

**PM 不需要拆。** 项目规模不大，用户自己就是制作人（定方向、排优先级），主 agent 辅助管任务列表和进度即可。且 Matt 的 `/to-prd`、`/to-issues`、`/triage` 已经覆盖了大部分 PM 职能，再拆 PM agent 会和这些 skill 重叠。

**QA 值得拆。** 原因：

> 同一个 agent 写完代码再测自己，就像作者校对自己的文章——错别字永远看不出来，因为脑子里自动补全了。

- 同一上下文里的开发和测试存在确认偏误（confirmation bias），这不是 prompt 能解决的
- 独立 QA agent 没有实现过程的上下文污染，只看到"需求是什么"和"交付物是什么"
- 天然更容易发现需求与实现之间的缺口

### 最终推荐架构

```
┌─────────────────────────────────────────────┐
│                   卡拉（制作人）               │
│         方向、优先级、产品决策、最终验收         │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│          主 Agent（技术合伙人 + PM）           │
│                                             │
│  · Matt Pocock Skills 全套                   │
│  · 工程技术决策自主判断                        │
│  · 产品决策上报卡拉                           │
│  · 任务管理、进度追踪                          │
│  · 结论用业务语言表达                          │
└──────────────────┬──────────────────────────┘
                   │ 开发完成时调出
                   ▼
┌─────────────────────────────────────────────┐
│             QA 子 Agent（独立验收）            │
│                                             │
│  · 不看实现过程，只看需求和交付物              │
│  · 从用户/产品角度验证                        │
│  · 对抗性测试，不信任开发者的自测结论           │
└─────────────────────────────────────────────┘
```

### 判断是否需要拆子 Agent 的三个信号

| 信号 | 含义 | 动作 |
|------|------|------|
| **自己审自己放水** | 上线后反复出现"QA 应该抓到"的 bug | 拆 QA |
| **角色优先级打架** | 赶进度跳过重构，或追求质量拖慢交付 | 拆出冲突的角色 |
| **Prompt 太长能力下降** | Agent 开始忘记规则或表现波动 | 拆来减负 |

没出现这些信号之前，不拆。一个 agent 上下文完整的优势大于角色分离的优势。

---

## 七、关键结论

1. **Matt 的 skill repo 可以用，但需要在 agent prompt 层加适配规则**，让 agent 自动分流工程判断和产品决策，不需要用户每次手动说"工程问题你自己判断"

2. **不需要改 Matt 的 skill 文件本身**，适配层在 agent 的 system prompt 里做覆盖

3. **当前"一个 agent 三个角色"的架构可以继续用**，PM 职能保留在主 agent，QA 是最值得优先拆出的角色

4. **拆分的时机不是现在就决定的**，而是根据实际使用中出现的信号来判断
