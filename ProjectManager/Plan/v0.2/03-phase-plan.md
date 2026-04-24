# 阶段规划总图

> 所属版本：v0.2  
> 所属主线：[README](./README.md)
> 分类基础：[`02-classification.md`](./02-classification.md)
> 命名规则：`Plan/README.md` §Phase 与子计划命名规则（2026-04-20 生效）

---

## 五个 Phase 一览

> 正式 ID：`v0.2-1` ~ `v0.2-5`；本文档内一律用简写 `Phase 1` ~ `Phase 5`、子计划 `1-1` / `4-1` 等。

| Phase | 名称 | 主产出 | 启动条件 | 收尾条件 |
|---|---|---|---|---|
| **1** | 效率基建 + 低成本修复 | F3 工具栏可用；B1 / E1 上线 | 主线整体方向确认 | F3 可用 + B1/E1 合并入仓 + 通过回归 |
| **2** | 三项合并短诊断 | 联合诊断报告（B2 / C1 / D）| Phase 1 完成 | 报告落盘；三项各有归位建议 |
| **3** | 诊断结论执行 | Phase 2 结论里定性为"实现/规则问题"的修复 | Phase 2 完成 | 涉及项通过回归；归 A 组的项已登记到 Phase 4 |
| **4** | 题型教育设计重梳理 | A3 总则 + A1/A2 重设计 + A4 验证 + F1 落地 | `4-1` 可与 Phase 1/2 并行；`4-2`/`4-3` 需 A3 通过 | A 组规格/实现两端收敛；F1 Tips 库上线 |
| **5** | 历史答题记录 | F2 本地版 | Phase 1 完成后任意时机 | F2 覆盖闯关/进阶/段位三模式 |

## 时序示意

```
时间轴 →
 Phase 1   [1-1 F3]──[1-2 B1+E1]
 Phase 2                              [三项合并诊断]
 Phase 3                                          [结论执行 1~3 子计划]
 Phase 4   [4-1 A3 起草，可与 Phase 1/2 并行] ────── [4-2 A1+A2] ── [4-3 A4] ── [4-4 F1]
 Phase 5                                                          [F2，可在 Phase 3/4 期间穿插]
```

## 并行可能性

- **`4-1`（A3 起草）**：纯设计讨论、不动代码，可与 Phase 1/2 并行启动，不占用工程带宽
- **Phase 5（F2）**：本地存档独立，可穿插于 Phase 3/4 期间执行
- **`1-1`（F3）与 `1-2`（B1+E1）**：之间无硬依赖，按工程带宽决定串行或并行

## Phase 之间的硬依赖 vs 软依赖

| 关系 | 性质 | 说明 |
|---|---|---|
| Phase 1 → Phase 2 | **软依赖** | 不是 Phase 2 技术上必须等 Phase 1，而是 Phase 1 的 F3 工具栏能大幅降低 Phase 2 的诊断成本 |
| Phase 2 → Phase 3 | **硬依赖** | Phase 3 内容由 Phase 2 诊断报告决定 |
| Phase 1/2 → `4-1` | **无依赖** | `4-1` 纯文档起草可并行启动 |
| A3 → A1/A2/A4 | **硬依赖**（Phase 4 内部）| A3 先通过，下游才开工 |
| A1/A2 → F1 | **硬依赖**（Phase 4 内部）| F1 内容源于 A1/A2 的"题型-技巧"映射 |
| Phase 1 → Phase 5 | **软依赖** | F3 工具栏能帮助 F2 造测试数据 |

## 各 Phase 详情

- Phase 1 → [`phases/phase-1.md`](./phases/phase-1.md)
- Phase 2 → [`phases/phase-2.md`](./phases/phase-2.md)
- Phase 3 → [`phases/phase-3.md`](./phases/phase-3.md)（占位）
- Phase 4 → [`phases/phase-4.md`](./phases/phase-4.md)
- Phase 5 → [`phases/phase-5.md`](./phases/phase-5.md)

## 不在本规划里展开的内容

- 每个 Phase 内子计划的：子项拆解、里程碑、验收清单、工作量估算
- 具体代码位置、Spec 修改内容、测试用例

**→ 等到 Phase 启动时，另建独立 `Plan/v0.2/subplans/YYYY-MM-DD-<feature-slug>.md` 文件展开。**
