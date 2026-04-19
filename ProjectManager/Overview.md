# math-quest 项目概览

> 最后更新：2026-04-19（M2 完工）  
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
- **M1 已完工**（2026-04-19）：类型层 + 常量层 + `entry-gate.ts` 纯函数入场校验 + `match-state.ts` BO 状态机（含 §7.4 提前结束强制）+ `repository/local.ts` 迁移链（v2→v3，项目级原则落地）+ 段位赛最小 store。6 条项目级硬约束全部核验通过
- **M2 已完工**（2026-04-19，同日收口）：抽题器（`question-picker.ts` 胜场游标 + 三桶分配 + 难度配额 + 交错混合）+ 自检钩子（`picker-validators.ts` 覆盖 Spec §5.7 五类硬约束）+ 段位赛答题流驳接（`store/index.ts::startRankMatchGame` 预生成题序；`endSession` 的 rank-match 分支调用 `handleGameFinished` 并通过新字段 `lastRankMatchAction` 供 UI 路由）。Spec §5.8 校验失败走 `PickerValidationError`，不允许静默降级
- 代码基线稳定：`tsc --noEmit` 0 错，`vitest` **370 → 423**（M2 新增 53 用例：validators 20 + picker 25 + store E2E 8），`pm-sync-check` 按节点已跑
- 本阶段明确不做：A03+、A09、B/C/D
- 当前开放问题与历史关闭项不在本页展开，统一看 `ISSUE_LIST.md`

**下一步**：领取 Phase 3 实施子子计划 **M3**（UI 三页 + 路由 + Home 入口真实化）——按 Spec §8 落地 `RankMatchHub` / `RankMatchGameResult` / `RankMatchResult` 三个页面、注册三条路由、把 `Home.tsx` 的"刷星升级"文案改造为独立段位赛卡片；段位徽章色通过 `globals.css` 的 `--rank-*` CSS 变量暴露（Spec §8.4）。

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
