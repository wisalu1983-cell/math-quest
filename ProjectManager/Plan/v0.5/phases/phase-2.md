# Phase 2 · 竖式题样本质量诊断

> 所属版本：v0.5
> 创建：2026-04-28
> 所属主线：[../README](../README.md)
> 状态：✅ 完成

---

## 目标

关闭 `BL-009`：用固定 seed 抽样诊断 A03 竖式题样本质量，确认并实现第一批“普通五年级学生大概率可心算完成”的强制过滤规则，让闯关低档竖式题更符合“必须通过竖式训练完成”的学习目标。

## 输入

- v0.5 Phase 总图：[`../03-phase-plan.md`](../03-phase-plan.md)
- 执行纪律：[`../04-execution-discipline.md`](../04-execution-discipline.md)
- Phase 1 开工边界：[`../subplans/2026-04-28-v05-phase1-开工对齐与跨phase边界.md`](../subplans/2026-04-28-v05-phase1-开工对齐与跨phase边界.md)
- Phase 2 子计划：[`../subplans/2026-04-28-v05-phase2-BL-009-竖式题样本质量诊断与过滤规则.md`](../subplans/2026-04-28-v05-phase2-BL-009-竖式题样本质量诊断与过滤规则.md)
- A03 current spec：[`../../../Specs/a03-vertical-calc/current.md`](../../../Specs/a03-vertical-calc/current.md)

## 范围

- 诊断 A03 campaign lane 与 focused generator bucket 中的低负担竖式样本。
- 确认低档整数乘法、低档一位除数整数除法的第一批 P0 过滤规则。
- 在 `src/engine/generators/vertical-calc.ts` 落地生成器规则。
- 用自动化测试、固定 seed 抽样复测和 build 验收。

## 已确认规则

- `difficulty<=3` 的 `int-mul` 排除 `2位数 × 1位数`，低档起步改为 `3位数 × 1位数`。
- `difficulty<=5` 的一位除数整数除法过滤 D0 逐段整除型，例如 `888 ÷ 4`、`844 ÷ 4`、`208 ÷ 4`。
- 低档一位除数整数除法以 D2 多次余数传递、D3 商中间 0 为主；D1 单次余数传递只作为少量过渡。
- P1/P2 复核项 `3位数 × 1位数`、`4位数 ÷ 1位数`、无进退位低档加减暂不整体过滤。

## 收尾条件

- 抽样结果有证据，且 P0 强候选口径可复跑。
- 过滤规则经用户确认。
- 生成器规则和反例保护测试通过。
- 实施后固定 seed 复测 P0 强候选为 0。
- `ProjectManager/Specs/a03-vertical-calc/current.md` 已回写当前行为。

## 当前状态

Phase 2 已于 2026-04-28 收口。`BL-009` 子计划、诊断脚本、生成器实现、自动化测试、实施后复测与 A03 current spec 回写均已完成。下一步进入 Phase 3：`BL-011` 内置键盘 + `ISSUE-067` 错因反馈基础设施。
