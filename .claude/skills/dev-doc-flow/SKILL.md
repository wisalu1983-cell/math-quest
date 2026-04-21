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
- 纯 PM 状态同步：按 `CLAUDE.md` 和 `Plan/README.md` 现有规则处理
- 纯代码实现且用户未要求产出文档：不强制使用本 skill

## 开始前先判断任务挂靠

- 若任务已明确属于某个 `vX.Y / phase-N`，优先走“版本-phase 阅读路径”
- 若任务尚未挂靠版本 / phase，再退回全局入口：`ProjectManager/Overview.md` → `ProjectManager/Plan/README.md` → `ProjectManager/Specs/_index.md`

## 版本-phase 阅读路径

1. 先读 `ProjectManager/Plan/vX.Y/README.md`
2. 再读对应 `ProjectManager/Plan/vX.Y/phases/phase-N.md`
3. 如果本次要新起一篇开发文档或子计划，再读 `ProjectManager/Plan/vX.Y/04-execution-discipline.md`
4. 如果要判断 phase 依赖、归位或并行关系，再读 `ProjectManager/Plan/vX.Y/03-phase-plan.md`
5. 再读 phase 文档直接点名的 `Specs / Reports / subplans / QA`
6. 当前版本包状态与活跃状态可能未完全同步时，再快速看 `ProjectManager/Overview.md` 做状态校验
7. 需要落盘、命名、索引时，再看 `ProjectManager/Plan/README.md`
8. phase 文档没给出规格入口时，再看 `ProjectManager/Specs/_index.md`
9. 如果是 bugfix / issue 驱动，再看 `ProjectManager/ISSUE_LIST.md`
10. 如果涉及验收或回归风险，再看相关 `QA/` 产物

不要默认通读整个 `ProjectManager/Plan/vX.Y/`、整个 `ProjectManager/Specs/` 或整个 `QA/`。

## 第一步：先确认文档归属方式

- 版本-phase 任务优先沿当前版本文档包进入，不默认从全局索引起步
- 文档落点、命名、功能子目录、`subplans` 位置，一律沿用 `ProjectManager/Plan/README.md`
- 本 skill 不复写 `math-quest` 现有管理规则，只负责补开发文档的写作流程与模板
- QA 方案、测试执行、回归报告统一交给 `qa-leader`
- 若一份文档同时包含“方案”和“实施动作”，优先按现有 `Specs / Plan` 分工处理；无法明确时，先提醒用户决策
- 若发现版本包状态、`Overview.md`、现有规则彼此冲突，或本次任务难以判断归属，必须先提醒用户决策，不擅自新增口径

## 第二步：选择文档类型

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

## 第三步：写作纪律

- 若任务已明确属于某个 `vX.Y / phase-N`，优先沿版本-phase 路径收集上下文，不默认回到全局入口
- 仅在需要校验活跃状态时看 `ProjectManager/Overview.md`；仅在需要落盘、命名、索引时查 `ProjectManager/Plan/README.md`
- phase 文档未给出规格入口时，再查 `ProjectManager/Specs/_index.md`；bugfix / issue 驱动时，再查 `ProjectManager/ISSUE_LIST.md`
- 中文为主，技术标识符保留原文
- 必须引用具体权威源路径，不靠记忆复述
- 只改本次任务相关内容，不重写无关章节
- 信息不足时先标缺口，不编造设计结论
- 若文档会影响当前主线、当前状态、下一步，再按现有规则回写 `Overview.md`
- 若新建了 `Specs/` 文档，需同步考虑 `ProjectManager/Specs/_index.md`
- 若版本包状态、全局状态或现有规则彼此冲突，必须先提醒用户决策

## 第四步：与现有项目机制对齐

- 需要实施计划时，沿用 `ProjectManager/Plan/README.md` 的现有规则处理
- 需要测试方案或回归执行时，转给 `qa-leader`
- 需要状态同步时，遵守 `CLAUDE.md` 和 `pm-sync-check.mdc`

## 快速判断

如果你在写：

- “这个功能要做什么、怎么做、边界是什么” → 新功能开发文档
- “现在为什么不好、要怎么优化、怎么验证有效” → 优化开发文档
- “这个问题怎么复现、根因是什么、修哪里、怎么防回归” → bugfix 开发文档

## 最终目标

让 `math-quest` 的开发文档从“每次临时发挥”升级为“可复用、可追溯、可落盘、可被 QA 和 Plan 消费”的项目内能力。
