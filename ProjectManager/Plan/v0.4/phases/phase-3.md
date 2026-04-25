# Phase 3：题目质量与生成器诊断

> 所属：v0.4-3
> 状态：✅ 已完成（T0-T5 实施与自动化验收通过）
> 来源：`BL-005.4` / `BL-007` / `BL-008`
> 预研：[`phase-3-research.md`](./phase-3-research.md)
> 子计划：[`../subplans/2026-04-25-phase3-题目质量诊断与实施拆解.md`](../subplans/2026-04-25-phase3-题目质量诊断与实施拆解.md)

---

## 目标

在 A04/A06 断联并入 A07 后，再修复题目本身的质量问题：竖式难度要匹配进阶星级，非 A04/A06 的选项题要降低猜测概率，重复题目要先查清真实原因再处理。

预研已收口，见 [`phase-3-research.md`](./phase-3-research.md)。Phase 2 题型 IA 已完成，Phase 3 已按同一口径复跑抽样并创建实施子计划；T0-T5 已完成实现和自动化验收。

## 范围

| 子项 | 内容 | 备注 |
|---|---|---|
| 3.1 | A03 竖式难度梯度排查，剔除心算级题目混入 | 必查生成器难度、闯关关卡梯度和 `TOPIC_STAR_CAP` |
| 3.1a | A03 `difficulty=4-5` 的 `int-mul` 分支加入低比例 `2位数 × 2位数` 乘法 | 生成器档位分布修正；抽样期望 15%，验收允许 10%-20%。第四关因使用 `difficulty=4` 自然继承该分布，复用 Phase 1 多位乘法竖式板 |
| 3.2 | A02 compare 质量优化：d=7 提升为二步结构 / 误导性比较；d=8 保留 `对 / 错` 二选一并扩概念池与 explanation | A04/A06 相关部分已随 Phase 2 收口；A07 迁入知识点由 T1 诊断覆盖 |
| 3.3 | 闯关 / 进阶 / 段位赛重复题目诊断与 session 内完全重复治理 | T1 已完成复跑抽样；T5 已实现 bounded retry |

## 进入条件（已满足）

- Phase 2 完成，玩家可见题型和 A07 lane 结构稳定
- 读 `generator-redesign-v2.md`
- 读 `generator-difficulty-tiering-spec.md`
- 读 `gamification-phase2-advance-spec.md` 的 `TOPIC_STAR_CAP`
- 复核 `vertical-calc-S1-LB-L1/L2` 当前题目分布：第三关保持两位乘一位，第四关以三位乘一位 / 四位除一位为主，并确认第四关通过 A03 `difficulty=4` 生成器分布自然获得 `2位数 × 2位数`
- 为 `BL-008` 确认诊断方式：已采用“脚本抽样 + 场景复现”口径；Phase 2 后复跑样本已写入实施子计划

## 收尾条件

- [x] 难度修复有抽样验证记录。
- [x] A03 `difficulty=4-5 + int-mul` 中 `2位数 × 2位数` 抽样占比在 10%-20%，且不会替代 `三位数 × 一位数` 主体分布。
- [x] A03 进阶 3★ 不再出现 `两位数 ÷ 一位数` 整数短除候选。
- [x] A02 compare d=7/d=8 按 T4 开发文档完成质量优化；d=8 `对 / 错` 二选一保留但题池与 explanation 达标。
- [x] 重复题目有明确结论：session 内完全重复已用 bounded retry 治理；结构重复和小模板池耗尽作为后续扩池观察，不挂开放 bug。
- [x] `npm test -- --run` 和 `npm run build` 通过。
