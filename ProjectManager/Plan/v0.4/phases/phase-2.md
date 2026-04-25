# Phase 2：A04/A06 降阶并入 A07

> 所属：v0.4-2
> 状态：🟡 方案已定，待实施
> 来源：2026-04-25 题型 IA 决策 / `BL-006` / `BL-007` 局部
> 子计划：[`../subplans/2026-04-25-a04-a06-downshift-to-a07.md`](../subplans/2026-04-25-a04-a06-downshift-to-a07.md)

---

## 目标

取消玩家主界面上的「运算律」「括号变换」两个独立大题型，把它们降阶为 A07「简便计算」低档知识点 lane。原 A04/A06 的所有子题型仍保留训练价值，但不再作为玩家可见题型、独立星级或段位赛主轴。

## 范围

| 子项 | 内容 | 备注 |
|---|---|---|
| 2.1 | 玩家可见题型从 8 个收敛为 6 个 | A04/A06 仅保留 internal / legacy source |
| 2.2 | A07 低档新增「运算律」「括号变换」知识点 lane，并保留原 A07 低档基础应用 lane | A04/A06 lane 覆盖原子题型；原 A07 `bracket-normal` / `extract-factor` 不整体后移 |
| 2.3 | `multi-step` 生成器聚合原 A04/A06 能力 | 新题玩家归属规范化为 `multi-step` |
| 2.4 | 运算律 lane 收口 `BL-006` 槽位误导和操作说明 | 原独立 A04 UX 问题随降阶一起解决 |
| 2.5 | A04/A06 相关选项题处理 3~4 个有效干扰项 | `BL-007` 中与本迁移直接相关的部分 |
| 2.6 | 进阶 / 段位赛 / 历史错题 / 存档兼容 | 不清空旧 A04/A06 历史数据 |

## 不纳入本 Phase

| 子项 | 去向 |
|---|---|
| A03 竖式难度排查与第四关 `2位数 × 2位数` 桥接 | Phase 3 |
| 其他题型的选项干扰项扩容 | Phase 3 |
| `BL-008` 重复题目诊断 | Phase 3 |
| `BL-005.2` 进位格三档规则 | Phase 4 |
| `BL-003` compare tip 补证 | Phase 4 |
| Practice 状态重置 | Phase 5 / 待确认 |

## 进入条件

- 读 [`../subplans/2026-04-25-a04-a06-downshift-to-a07.md`](../subplans/2026-04-25-a04-a06-downshift-to-a07.md)
- 读 `generator-redesign-v2.md` 中 A04/A06/A07 的旧边界，确认本 Phase 是玩家可见 IA 改动，不是删除能力
- 读 `gamification-phase2-advance-spec.md` 与 `rank-match-phase3-implementation-spec.md`，确认隐藏题型后星级和段位赛范围如何同步
- 读 `repository/local.ts` 存档版本迁移原则，确认不使用 `clearAll()`

## 收尾条件

- Home / Campaign / Advance / Profile / WrongBook / Rank 相关入口均不再把 A04/A06 作为玩家独立题型展示
- A07 低档能进入「运算律」「括号变换」lane，且覆盖原 A04/A06 全部子题型
- 原 A07 低档基础应用子题型仍留在低档
- 新生成的知识点题玩家归属为「简便计算」
- 旧 A04/A06 历史数据不丢失，启动不清空存档
- `npm test -- --run` 和 `npm run build` 通过
- QAleader 三层 QA 完成；QA run 原始产物不入库，只在本 Phase / 子计划记录结论
