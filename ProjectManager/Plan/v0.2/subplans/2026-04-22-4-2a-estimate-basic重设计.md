# v0.2-4-2A · estimate-basic 生成器重设计

> 创建：2026-04-22
> 所属版本：v0.2
> 父计划：[Phase 4 · 题型教育设计重梳理](../phases/phase-4.md)
> 正式 ID：`v0.2-4-2A`
> 状态：✅ 已完成（2026-04-22）

---

## 前置设计文档

| 文档 | 关键章节 |
|---|---|
| [`Specs/2026-04-22-估算能力与基础技巧类排查.md`](../../../Specs/2026-04-22-估算能力与基础技巧类排查.md) | §二 estimate-basic 重设计 |

---

## 变更范围

| 文件 | 变更内容 |
|---|---|
| `src/types/index.ts` | `NumberSenseData` 新增 `tolerance?: number` |
| `src/engine/generators/number-sense.ts` | `generateEstimateBasic` 重写 |
| `src/store/index.ts` | `submitAnswer` 新增 tolerance 区间验证分支 |

---

## 实施要点

1. **prompt 格式**：从 `"估算 X，结果取整Y数"` 改为 `"估算 X，大约是多少？"`
2. **乘法为主**：d≥3 时 × 占 70%；+/- 限三位数以上操作数
3. **数字设计**：× 优先选接近整数的小数或近百整数变体（含自然凑整路径）
4. **答案存精确值**：`solution.answer = exact`（不再存"最近整百数"）
5. **容忍范围**：× 用 ±15%，+/- 用 ±10%，存于 `data.tolerance`
6. **验证逻辑**：store `submitAnswer` 检测 `tolerance` 字段走区间比较

---

## 验收标准

- vitest 全绿
- 生成的 estimate-basic 题 prompt 不再含"结果取整X数"
- 乘法题比例 ≥70%（d=3~5 采样）
- 合理估算值（如 `457×23` 估 9200）被判为正确
