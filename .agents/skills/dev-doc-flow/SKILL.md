---
name: dev-doc-flow
description: Use when math-quest 项目中需要撰写新功能、优化、bugfix 相关的开发文档、方案文档或实施入口时
---

# math-quest 开发文档流

本 skill 用于 `math-quest` 项目中与开发直接相关的文档工作，目标是让新功能、优化、bugfix 三类文档拥有稳定的入口、固定的结构，以及与现有管理体系兼容的归属判断。

## 适用范围

- 新功能开发文档
- 优化开发文档
- bugfix 开发文档

## 不适用范围

- QA 用例、测试执行、回归报告：改走 `qa-leader`
- 纯 PM 状态同步：按 `AGENTS.md` 和 `Plan/README.md` 现有规则处理
- 纯代码实现且用户未要求产出文档：不强制使用本 skill

## 开始前先判断任务挂靠

- 若任务已明确属于某个 `vX.Y / phase-N`，优先走“版本-phase 阅读路径”
- 若任务尚未挂靠版本 / phase，再退回全局入口：`ProjectManager/Overview.md` → `ProjectManager/Plan/README.md` → `ProjectManager/Specs/_index.md`
- A / B / C 只是**写作结构标签**，不是独立资产类型；若任务属于某个版本的某个 phase，默认主文档仍是对应 `subplan`
- 若任务改变长期功能行为、数据契约、QA 口径或跨版本约束，必须做 `current spec` 影响评估；开发期只标待回写，phase 验收确认并准备合并 / 收口时才回写 `Specs/<feature-slug>/current.md`

## 版本-phase 阅读路径

1. 先读 `ProjectManager/Plan/vX.Y/README.md`
2. 再读对应 `ProjectManager/Plan/vX.Y/phases/phase-N.md`
3. 如果本次要新起一篇开发文档或子计划，再读 `ProjectManager/Plan/vX.Y/04-execution-discipline.md`
4. 如果要判断 phase 依赖、归位或并行关系，再读 `ProjectManager/Plan/vX.Y/03-phase-plan.md`
5. 再读 phase 文档直接点名的 `Specs / Reports / subplans / QA`
6. 当前版本包状态与活跃状态可能未完全同步时，再快速看 `ProjectManager/Overview.md` 做状态校验
7. 需要落盘、命名、索引时，再按需定位 `ProjectManager/Plan/README.md`：
   - 查 Phase / 子计划命名：`Phase 与子计划命名规则`
   - 查 `subplan` 位置：`子计划 Plan 文件位置规则`
   - 查功能设计文档目录：`功能设计文档子目录规则`
   - 查 Plan 头部与章节：`Plan 文件模板`
8. phase 文档没给出规格入口时，再看 `ProjectManager/Specs/_index.md`
9. 如果是 bugfix / issue 驱动，再看 `ProjectManager/ISSUE_LIST.md`
10. 如果涉及验收或回归风险，再看相关 `QA/` 产物

不要默认通读整个 `ProjectManager/Plan/vX.Y/`、整个 `ProjectManager/Specs/` 或整个 `QA/`。

## 第一步：先确认文档归属方式

- 版本-phase 任务优先沿当前版本文档包进入，不默认从全局索引起步
- 若任务属于某个版本的某个 phase，**默认主文档落到** `ProjectManager/Plan/vX.Y/subplans/YYYY-MM-DD-<代号>-<中文可读主题>.md`
- 只有以下情况才拆去别处：
  - 长期生效、跨版本复用的设计约束 → `Specs/`
  - 纯诊断、纯调研、纯复盘 → `Reports/`
- 如果该功能已有 `ProjectManager/Specs/<feature-slug>/current.md`，subplan 头部必须写 `功能 current spec：...`
- 如果该功能暂无 `current.md`，但本次是已验收功能的 phase 收口 / 合并前回写，可以创建 `current.md`；如果仍在开发或验收中，只在 subplan 写 `Spec impact`，不要提前创建或改写 current spec
- 文档落点、命名、功能子目录、`subplans` 位置，一律沿用 `ProjectManager/Plan/README.md`
- 本 skill 不复写 `math-quest` 现有管理规则，只负责补开发文档的写作流程与模板
- QA 方案、测试执行、回归报告统一交给 `qa-leader`
- 若一份文档同时包含“方案”和“实施动作”，优先按现有 `Specs / Plan` 分工处理；无法明确时，先提醒用户决策
- 若发现版本包状态、`Overview.md`、现有规则彼此冲突，或本次任务难以判断归属，必须先提醒用户决策，不擅自新增口径

## 第二步：先判断是不是“续写模式”

如果现有文档已经覆盖了 4 步工作流的前半段，不要机械重跑整套流程：

- 诊断单 / 调研报告已经覆盖“资料调研” → 视为步骤 2 已完成
- 现有 phase 文档、对话记录或旧 subplan 已明确“预期效果” → 视为步骤 1 已完成
- 用户已确认某个方向 / 方案 → 视为步骤 4 已通过

此时当前任务的目标是：

- 直接把对应 `task` 的 `subplan` 补齐成完整文档
- 补齐缺失的结构、约束、风险、验证与实施步骤
- 不重复抄写已有诊断，只引用其结论和证据路径

## 第三步：如果输出是 subplan，必须贴合 Plan 模板

版本-phase task 的主文档若落在 `subplans/`，至少要满足 `Plan 文件模板` 的以下部分：

- 头部：`创建 / 所属版本 / 父计划 / 设计规格 / 功能 current spec / Spec impact / 状态`
- `前置相关规格（开工前必读）`
- `跨系统维度清单`
- `Current spec 影响评估`
- `工作脉络`

如果该 task 同时承担开发文档作用，再在正文中套用下方 A / B / C 的写作结构。

### 实现架构决策门

凡是会指导代码实现的开发文档，在声明“方案已定 / 可开工 / 正式完整”前，必须显式回答以下实现架构问题；无法回答时标为阻塞项，不得只用产品口径代替：

- 模块 ownership 与依赖方向：能力归属哪个模块，是否允许引用旧模块，是否需要抽取共享 helper。
- 类型与 API 契约：是否需要新增更窄类型、运行时 guard、公共入口或兼容层。
- 持久化 / 存档 / 版本迁移：是否需要 bump version、迁移链、旧数据兼容、未完成 session 处理。
- 标识符命名空间与向后兼容：新增或迁入的 id 是否有冲突，是否需要 namespace，旧 id 在哪里仍可出现。
- UI 容量与响应式约束：如果改动会改变页面结构、lane 数、卡片数量或交互密度，必须写入桌面 / 手机竖屏验收点。
- 测试与 QA 映射：每个架构决策至少要对应单测、集成测试、构建检查或拟真人工 QA 中的一类验收。

这道门用于区分“需求设计已经澄清”和“开发文档已经可执行”。如果缺少其中任一维度，文档只能标“待架构补丁”，不能标“正式完整”。

### 需求质量与验收可测性门

凡是会指导代码实现的开发文档，在声明“可开工 / 正式完整”前，必须检查关键需求是否满足：

- 来源可追踪：每个关键需求 / 约束能追到 Plan、Spec、Issue、Backlog、报告、代码诊断或用户确认。
- 表述无歧义：不得使用无法验收的模糊词；若存在 TBD / 待确认项，必须标为阻塞或待澄清。
- 可实现：方案力度与项目规模、当前架构、时间风险匹配；高风险方案必须显式说明风险。
- 可验证：每个关键需求至少对应一种验收方式：单测、集成测试、构建检查、Playwright、拟真人工 QA、截图证据、统计抽样或用户验证。
- 边界明确：必须写清非目标、降级行为、失败路径或不处理原因。

缺任一项时，文档不能标“可开工 / 正式完整”，只能标“待需求补丁”或“待验收映射补丁”。

### 关键决策与备选方案门

凡是改变模块边界、数据契约、输入 / 反馈模式、QA 口径、跨 Phase 复用能力或长期 current spec 的开发文档，必须写：

- 选定方案
- 至少一个未采用方案
- 放弃原因
- 采用后的后果 / 风险 / 后续约束

低风险文案、小样式、纯测试补强可以豁免；豁免时写一句原因即可。

### 游戏 / 学习体验验证门

若需求影响玩法闭环、题型难度、学习反馈、奖励 / 进阶、错题体验、移动交互或学生挫败感，文档必须写清：

- 玩家 / 学生目标
- 学习目标或训练价值
- 对核心练习循环的影响
- 难度、误解、挫败或作弊风险
- 反馈机制如何帮助学生理解结果
- 体验验证方式：拟真人工 QA、真实用户观察、截图走查、统计样本或数据指标

不影响游戏 / 学习体验的内部工程任务可豁免，并说明“不影响玩法 / 学习体验”。

### Living Spec 决策门

写 subplan 或开发文档时，必须显式回答：

1. 是否改变长期功能行为 / 数据契约 / QA 口径 / 跨版本约束？
2. 对应功能 current spec 是哪个 `Specs/<feature-slug>/current.md`？
3. 如果预计影响 current spec，本 phase 验收通过后要回写哪些要点？

`Spec impact` 取值：

| 值 | 使用场景 |
|---|---|
| `update-at-phase-close` | 本变更若验收通过，将改变长期功能当前状态；开发期只列待回写要点 |
| `none` | 纯诊断、一次性脚本、测试补强或内部实现调整，不改变长期功能承诺 |
| `deferred` | 已知需要回写但本 phase 不处理，必须写清原因和下一处理点 |

硬规则：功能还在开发、联调或验收中时，不回写 `current.md`。只有 phase 验收确认并准备合并 / 收口时，才把已确认变化写入 `current.md`，并同步考虑 `Specs/_index.md`。

## 第四步：选择文档类型

### A. 新功能开发文档

适用于新增页面、流程、机制、学习功能、工具能力。

建议结构：

1. 背景
2. 目标
3. 用户与学习目标
4. 范围
5. 交互 / 状态流
6. 数据 / 配置 / 持久化影响
7. 边界情况与失败路径
8. 验收点
9. 与现有 Spec / Plan / Issue 的关系

### B. 优化开发文档

适用于性能、交互、信息架构、题型生成、流程效率、工程可维护性优化。

建议结构：

1. 现状与证据
2. 问题定义
3. 优化目标
4. 可选方案对比
5. 选定方案
6. 风险与回滚思路
7. 验证方法
8. 对现有 Spec / Plan / QA 的影响

### C. bugfix 开发文档

适用于已有问题的根因分析、修复范围界定、回归风险控制。

建议结构：

1. 问题现象
2. 复现路径
3. 用户影响
4. 根因
5. 修复范围
6. 非目标
7. 回归风险
8. 验证与 QA
9. Issue / Plan 对应关系

## 第五步：写作纪律

- 若任务已明确属于某个 `vX.Y / phase-N`，优先沿版本-phase 路径收集上下文，不默认回到全局入口
- 仅在需要校验活跃状态时看 `ProjectManager/Overview.md`；仅在需要落盘、命名、索引时按需定位 `ProjectManager/Plan/README.md` 的对应小节
- phase 文档未给出规格入口时，再查 `ProjectManager/Specs/_index.md`；bugfix / issue 驱动时，再查 `ProjectManager/ISSUE_LIST.md`
- 中文为主，技术标识符保留原文；版本计划、子计划、开发文档、讨论样题等面向协作阅读的文件名也遵守中文可读主题，专用术语和代号除外
- 必须引用具体权威源路径，不靠记忆复述
- 只改本次任务相关内容，不重写无关章节
- 信息不足时先标缺口，不编造设计结论
- 若文档会影响当前主线、当前状态、下一步，再按现有规则回写 `Overview.md`
- 若新建了 `Specs/` 文档，需同步考虑 `ProjectManager/Specs/_index.md`
- 若新建或回写 `Specs/<feature-slug>/current.md`，必须在正文列出来源：对应 version subplan、验收 / QA 证据、关键代码入口；不能把未验收方案写成当前事实
- 若版本包状态、全局状态或现有规则彼此冲突，必须先提醒用户决策

## 第六步：与现有项目机制对齐

- 版本-phase task 默认让 `subplan` 同时承担“实施计划 + 开发文档”职责，不默认拆成两份
- `current.md` 不替代 subplan；它只在 phase 验收确认后吸收已发布 / 待合并的当前状态
- 需要测试方案或回归执行时，转给 `qa-leader`
- 需要状态同步时，遵守 `AGENTS.md` 和 `pm-sync-check.mdc`

## 第七步：Phase 收口 / 合并前回写 current spec

当本次任务是 phase 收口、版本收口或合并前整理，并且 subplan 标了 `Spec impact=update-at-phase-close`：

1. 先确认验收状态：phase 文档、subplan 状态、QA 证据或用户确认必须已完成。
2. 读取对应功能已有 `current.md`；没有则按 `ProjectManager/Plan/rules/document-ownership.md` 创建。
3. 只写“当前已确认状态”，不要搬运开发过程、备选方案或失败尝试。
4. 在 `current.md` 的来源段链接 version subplan、dated design docs、QA / 验收记录和关键代码入口。
5. 更新 `ProjectManager/Specs/_index.md` 中该功能的当前入口和关键断言。
6. 若发现 subplan 里仍有未验收项，把它留在 subplan / Backlog，不写入 current spec。

## 快速判断

如果你在写：

- “这个功能要做什么、怎么做、边界是什么” → 新功能开发文档
- “现在为什么不好、要怎么优化、怎么验证有效” → 优化开发文档
- “这个问题怎么复现、根因是什么、修哪里、怎么防回归” → bugfix 开发文档

## 最终目标

让 `math-quest` 的开发文档从“每次临时发挥”升级为“可复用、可追溯、可落盘、可被 QA 和 Plan 消费”的项目内能力。
