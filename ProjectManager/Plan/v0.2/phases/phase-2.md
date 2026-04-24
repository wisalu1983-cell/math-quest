# Phase 2 · 三项合并短诊断

> 所属版本：v0.2  
> 正式 ID：`v0.2-2`
> 所属主线：[../README.md](../README.md)
> 总图：[../03-phase-plan.md](../03-phase-plan.md)
> 状态：✅ 完成（2026-04-21，联合诊断报告落盘并通过审阅）

---

## 目标

用一次 session 对 B2 / C1 / D 三项同时产出：

1. **当前实际状态**（现网表现 + 相关代码/Spec 的现状）
2. **根因判断**
3. **性质定性**：设计问题 vs 实现问题
4. **归位建议**：补实现 / 补规则 / 归入 A 组

**不动代码，产出一份联合诊断报告。**

## 为什么合并

三项共性：

- 都是"定性诊断"任务（不是直接修）
- 诊断方法类似：读 Spec → 读代码 → 现网复现
- 合并执行能降低上下文切换成本

## 诊断对象

| 代号 | 问题陈述 | 原始反馈 |
|---|---|---|
| **B2** | 口算进阶 1–2🌟 过程中仍出现个位×个位题目，难度过低 | #4 |
| **C1** | 闯关地图同一行关卡难度无变化；同一知识点关卡应递进 | #8 |
| **D**  | 进阶模式一局结束/每局结算的星级进度表达缺失；心↔星级关系不直观 | #2 + #3 |

## 产出

- **一份联合诊断报告**：建议路径 `ProjectManager/Reports/2026-04-XX-phase-2-diagnosis.md`（具体日期启动时定）
- 每项包含：
  - 现状摘要（含现网截图 / Playwright 复现日志）
  - 相关代码/Spec 引用
  - 根因判断
  - 性质（设计/实现）
  - 归位建议（到 Phase 3 / Phase 4 / 独立小修 之一）
  - 如要修的工作量级估算

## 诊断方法（预计在 4 步工作流的"资料调研"阶段具体化）

| 对象 | 主要调研入口 |
|---|---|
| B2 | `src/practice/generators/` · `Specs/2026-04-17-generator-redesign-v2.md` · `Specs/2026-04-16-generator-subtype-difficulty-buckets.md` · 进阶抽题逻辑 |
| C1 | `src/data/campaign*` · `Specs/2026-04-16-generator-difficulty-tiering-spec.md` · `CampaignMap` 页面 |
| D  | `src/pages/Practice*` 结算相关 · `Specs/2026-04-13-star-rank-numerical-design.md` · `Specs/2026-04-15-gamification-phase2-advance-spec.md` |

## 进入条件

- [x] Phase 1 完成（F3 可用，利于快速造场景复现）

## 收尾条件

- [x] 联合诊断报告落盘并通过用户审阅（报告：[`Reports/2026-04-21-phase-2-diagnosis.md`](../../../Reports/2026-04-21-phase-2-diagnosis.md)，B2 根因已在审阅中修正）
- [x] 每项归位建议已写入本主线的 Phase 3 / Phase 4 / 独立小修 之一（已更新 `phase-3.md` 和 `phase-4.md`）
- [x] 若任一项被定性为"设计本身不到位"，本文档追加"推迟到 Phase 4"的标记（见下方）

> **C1 推迟标记**：C1（闯关地图档内难度递进问题）被定性为**设计问题**——生成器规格未定义档内子梯度，关卡地图设计依赖了一个不存在的能力。此项**不进入 Phase 3**，已登记到 Phase 4 A3 子议题（关卡地图档内递进机制规范化）。

## 对后续 Phase 的影响

- **Phase 3 内容完全由本阶段结论决定**，在 Phase 2 完成前 Phase 3 只保持占位
- 若某项被定性为"设计不到位"，会直接推迟到 Phase 4 一并处理，不进入 Phase 3
