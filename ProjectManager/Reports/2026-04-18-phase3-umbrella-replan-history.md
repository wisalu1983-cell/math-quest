# Phase 3 Umbrella 同日重排归档报告

> 创建：2026-04-19  
> 来源：从 [`../Plan/2026-04-18-subplan-4-next-stage-expansion.md`](../Plan/2026-04-18-subplan-4-next-stage-expansion.md) `§八` 下沉整理  
> 对应计划：[`../Plan/2026-04-18-subplan-4-next-stage-expansion.md`](../Plan/2026-04-18-subplan-4-next-stage-expansion.md)  
> 状态：✅ 归档  
> 用途：保留 2026-04-18 同日多次重排的完整轨迹，避免活跃计划继续承载高 token 历史推理

---

## 一、结论速览

2026-04-18 当天，子计划 4 Umbrella 的范围经历了三次收敛，最终稳定口径为：

- **本阶段只做 Phase 3 段位赛**
- **A03+ 废弃；A09 / B/C/D 本阶段不做**
- **Phase 3 启动不再依赖 A03+ / A09 闭环**

最终留下的执行链路是：

**产品层规格事实源对齐 → Phase 3 实施级规格 → Phase 3 实施子子计划 → 代码。**

---

## 二、时间线

### 1. 初版 Umbrella 落盘

- 初版把 `P3 / A03+ / A09 / B/C/D` 全部纳入同一个 Umbrella。
- 这样做的好处是“下阶段扩展”有统一父文件承接，但坏处是活跃范围过大，执行焦点不清。

### 2. 同日第一次重排：方案 C

- 用户先强调优先把闯关和进阶相关补强放在段位赛之前。
- 因为 `A03+` 与 `A09` 都更接近“既有模式内容补强”，Umbrella 收敛为：
  - `A03+ → A09 → Phase 3`
- `B/C/D` 被移出当前 Umbrella，原先一度考虑未来用“子计划 5”承接。

### 3. 同日：A03+ 设计改口并落规格

- 在第一次重排后，`A03+` 又进一步缩成轻量路线：
  - 不引入新的部分积板 / 试商板
  - 只保留“困难档过程格填错但答案正确时仍判通过”的小优化
- 对应规格文件仍然落盘为：
  - [`../Specs/2026-04-18-a03-block-b-plus-design.md`](../Specs/2026-04-18-a03-block-b-plus-design.md)

### 4. 同日再次重排：收敛为单块 Phase 3

- 随后用户做出更明确的阶段决策：
  - `A03+` 废弃
  - `A09` 不做
  - `B/C/D` 不做
  - 直接开始 `Phase 3`
- 这是当天最关键的一次收敛，原因不是 `A03+` 或 `A09` 没价值，而是继续在“内容补强 vs 模式补齐”之间摇摆，会持续推迟段位赛落地。

### 5. 同日收口：Phase 3 文档三层落盘

- 范围收敛稳定后，同日补齐了真正开工需要的三层文档：
  - Umbrella：[`../Plan/2026-04-18-subplan-4-next-stage-expansion.md`](../Plan/2026-04-18-subplan-4-next-stage-expansion.md)
  - 实施级 Spec：[`../Specs/2026-04-18-rank-match-phase3-implementation-spec.md`](../Specs/2026-04-18-rank-match-phase3-implementation-spec.md)
  - 实施子子计划：[`../Plan/2026-04-18-rank-match-phase3-implementation.md`](../Plan/2026-04-18-rank-match-phase3-implementation.md)

---

## 三、为什么把这段历史下沉到 Reports

这段历史需要保留，但不应该继续占用活跃计划的默认阅读面，原因有三点：

- 它解释的是“为什么当前口径会长成这样”，不是“现在该执行什么”
- 它属于同日决策轨迹，默认只在追溯、复盘、争议澄清时才有阅读价值
- 它长期停留在活跃计划里，会让 agent 在每次 planning 时重复吞下已经稳定的旧推理

所以更合适的结构是：

- 活跃计划里只保留当前口径和一条归档入口
- 完整轨迹转入 `Reports/`

---

## 四、受影响文档

这次同日重排最终影响了以下事实源或入口文档：

- [`../Overview.md`](../Overview.md)
- [`../Plan/README.md`](../Plan/README.md)
- [`../Plan/2026-04-16-open-backlog-consolidation.md`](../Plan/2026-04-16-open-backlog-consolidation.md)
- [`../Plan/2026-04-18-subplan-4-next-stage-expansion.md`](../Plan/2026-04-18-subplan-4-next-stage-expansion.md)
- [`../Specs/_index.md`](../Specs/_index.md)

其中真正留下为长期事实源的只有：

- 当前范围与约束：Umbrella / 实施级 Spec / 实施子子计划
- 历史推理：本报告

---

## 五、当前应如何使用这段历史

- 想知道**现在做什么**：先看 [`../Overview.md`](../Overview.md)
- 想知道 **Phase 3 当前执行事实**：看 [`../Plan/2026-04-18-subplan-4-next-stage-expansion.md`](../Plan/2026-04-18-subplan-4-next-stage-expansion.md)
- 想知道 **为什么最后只剩 Phase 3**：看本报告

这份报告是归档，不是活跃入口。
