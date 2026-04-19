# math-quest 项目概览

> 最后更新：2026-04-19  
> 角色：**活跃控制面 / 总管**。本文件只保留项目背景、当前阶段目标、当前主线、当前状态、下一步和入口链接；细节下放到对应专人文档。

---

## 项目背景

**产品**：数学大冒险（math-quest），面向上海五年级学生的游戏化数学练习应用。

**长期问题**：

- 题目生成不能只靠算法随机，需要用真实考试材料校准
- 游戏化不能只做 UI 包装，需要形成完整的长期练习闭环

**长期路线**：

1. 用真题参考库校准生成器质量
2. 完成三层游戏化闭环：闯关 → 进阶 → 段位赛

**当前范围**：聚焦 A 领域（A01-A08 数与运算）；A09、B、C、D 暂不在本阶段范围内。

---

## 当前阶段

**阶段目标**：在 A01-A08 生成器与闯关/进阶已稳定的基础上，完成 Phase 3 段位赛最小闭环，让三层游戏化结构真正跑通。

**当前主线**：Phase 3 段位赛。

**当前状态**：

- Phase 3 三层落盘已完成：Umbrella、实施级 Spec、实施子子计划均已落盘
- 代码基线稳定：`tsc -b` 0 错，`vitest` 328/328，`pm-sync-check` 全绿
- 本阶段明确不做：A03+、A09、B/C/D
- 当前开放问题与历史关闭项不在本页展开，统一看 `ISSUE_LIST.md`

**下一步**：进入 Phase 3 实施子子计划 M1，先做类型、常量、持久化迁移和 store 最小骨架。

---

## 权威入口

### 执行入口

- 当前阶段主计划：[2026-04-16-open-backlog-consolidation.md](Plan/2026-04-16-open-backlog-consolidation.md)
- 当前 Umbrella：[2026-04-18-subplan-4-next-stage-expansion.md](Plan/2026-04-18-subplan-4-next-stage-expansion.md)
- 当前实施子子计划：[2026-04-18-rank-match-phase3-implementation.md](Plan/2026-04-18-rank-match-phase3-implementation.md)

### 规格入口

- 当前实施级唯一入口：[2026-04-18-rank-match-phase3-implementation-spec.md](Specs/2026-04-18-rank-match-phase3-implementation-spec.md)
- 规格导航总索引：[Specs/_index.md](Specs/_index.md)

### 问题与历史

- 开放问题权威源：[ISSUE_LIST.md](ISSUE_LIST.md)
- 计划索引 / 模板 / 归档入口：[Plan/README.md](Plan/README.md)
- 复盘 / 历史机制记录：[Reports/](Reports/)

### 低频扩展

- 人工验证题库：[human-verification-bank-v2.md](human-verification-bank-v2.md)
- QA 产物：[QA/](QA/)
- 真题参考库：[../reference-bank/README.md](../reference-bank/README.md)
