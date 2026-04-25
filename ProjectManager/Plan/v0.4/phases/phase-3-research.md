# Phase 3 预研收口：题目质量与生成器诊断

> 所属版本：v0.4
> 所属阶段：v0.4-3
> 创建：2026-04-25
> 状态：✅ 预研收口；实施仍等待 Phase 2 题型 IA 代码稳定后复跑抽样
> 高频替代：只查 Phase 3 范围 / 状态读 [`phase-3.md`](./phase-3.md)

---

## 预研结论

Phase 3 可以先完成诊断口径和方案收口，但**不应直接进入实现**。当前代码中 A04「运算律」/ A06「括号变换」仍作为玩家可见题型存在，`campaign.ts`、`rank-match.ts` 和 `advance.ts` 仍按 8 题型口径工作；这与 Phase 3 的进入条件“Phase 2 后题型 IA 稳定”不一致。

因此本页结论分两层使用：

1. **当前代码事实**：用于识别真实根因、准备诊断脚本和实现方向。
2. **Phase 2 后复跑门**：Phase 2 合并后，必须用同一套抽样口径复跑，再生成实施子计划。

## 已读来源

| 来源 | 用法 |
|---|---|
| [`phase-3.md`](./phase-3.md) | Phase 3 目标、范围、进入 / 收尾条件 |
| [`../03-phase-plan.md`](../03-phase-plan.md) | Phase 2 → Phase 3 硬依赖和决策门 |
| [`../01-research-catalog.md`](../01-research-catalog.md) | `BL-005.4` / `BL-007` / `BL-008` 来源 |
| [`../../../Specs/2026-04-17-generator-redesign-v2.md`](../../../Specs/2026-04-17-generator-redesign-v2.md) | A03 三档、A04/A06/A07 边界、题型梯度数约束 |
| [`../../../Specs/2026-04-16-generator-difficulty-tiering-spec.md`](../../../Specs/2026-04-16-generator-difficulty-tiering-spec.md) | 三档难度主规格 |
| [`../../../Specs/2026-04-15-gamification-phase2-advance-spec.md`](../../../Specs/2026-04-15-gamification-phase2-advance-spec.md) | `TOPIC_STAR_CAP` 与进阶权重 |
| `src/engine/generators/*` / `src/engine/advance.ts` / `src/engine/rank-match/question-picker.ts` / `src/store/index.ts` | 当前生成器、进阶、段位赛、Practice 出题链路 |

## 抽样方式

本次为只读预研，未落正式脚本。抽样用本地已有 `jiti` 执行 TS 模块，统计：

- 闯关：每个 campaign level 抽 30 个 session，按 `topicId + type + prompt + answer + options` 归一化签名查重复。
- 选项题：玩家可见 6 题型按 difficulty `2 / 4 / 6 / 8` 各抽 250 题，统计 MC 选项数。
- A03：`vertical-calc` 第四关候选 `difficulty=4 + int-mul` 抽 500 题；A03 进阶 3★（`heartsAccumulated=38`）抽 80 个 session。
- 段位赛：当前 8 题型口径下，rookie / pro / expert / master 各抽样 30 局。

后续实施前建议把这套逻辑固化为临时诊断脚本，例如 `scripts/diagnose-phase3-question-quality.ts`，但脚本产物只作为验证记录，不必长期保留。

## 3.1 A03 竖式难度与第四关桥接

### 当前事实

`vertical-calc-S1-LB-L2` 当前对应 `difficulty=4` 且 `subtypeFilter=['int-mul','int-div']`。在 `difficulty=4 + int-mul` 的 500 题抽样中：

| 形态 | 数量 |
|---|---:|
| `两位数 × 一位数` | 0 |
| `三位数 × 一位数` | 500 |
| `两位数 × 两位数` | 0 |

样例：`489 × 7`、`846 × 4`、`712 × 9`。

这说明第四关目前没有从“一位乘数竖式”过渡到“多位乘法竖式”的桥接题。Phase 1 已有多位乘法竖式板，Phase 3 可以复用它，但要控制比例，不能把第四关主体难度整体抬走。

A03 进阶 3★ 抽样中，除法题 503 道，其中 468 道可归为“小数化短除 / 小规模整数除法”样本。样例包括：`7 ÷ 4`、`9 ÷ 5`、`13 ÷ 2`、`312.2 ÷ 7`。这与 `BL-005.4` 的“3 星出现心算级题”同类，根因不在星级权重，而在 hard 档 `int-div` / `dec-div` 的样本池仍包含过短表达式。

### 建议方向

1. 第四关桥接：只在 `vertical-calc-S1-LB-L2` 或等价的低档后段入口加入少量 `2位数 × 2位数`，比例保持 10%-20%。题目必须使用 Phase 1 的 `multiplicationBoard`，不能退回单答案输入。
2. A03 进阶 3★：调整 hard 档除法样本池，避免 `7÷4`、`9÷5` 这类可口算短除成为 3★ 高频题；保留“整数÷出小数”的知识点，但换成更需要列竖式的 2-3 位被除数样本。
3. 不改 `TOPIC_STAR_CAP`：A03 仍是 5★ / 三梯度题型，本次只修样本池和低档后段桥接。

## 3.2 非 A04/A06 选项题干扰项

### 当前事实

当前 6 个玩家可见题型里，大部分 MC 已达到 3-4 选项：

| 题型 | 抽样结论 |
|---|---|
| A01 基础计算 | MC 最少 4 项 |
| A02 数感估算 | 低 / 中档多为 3 项；高档 `compare` 存在 2 项判断题 |
| A05 小数计算 | MC 最少 3 项 |
| A07 简便计算 | MC 最少 4 项 |
| A08 方程移项 | MC 最少 4 项 |

唯一明确命中 `BL-007` 的非 A04/A06 样本是 A02 高档概念判断，示例：

- `判断正误："一个数除以一个比 1 小的数，商一定比原数大"`，选项为 `对 / 错`
- `判断正误："小数乘以整数，积一定是小数"`，选项为 `对 / 错`

A05 / A02 的 `> / < / =` 三项比较题不是 2 选项问题；它们是否需要扩成 4 项，应按教学价值单独评估，不作为 Phase 3 首要修复。

### 建议方向

1. Phase 3 首先处理“概念判断类二选一”，不是无差别扩所有 MC。
2. A02 高档 compare 可把 `对 / 错` 改成 3-4 项“原因型选择”，例如“对，因为... / 错，因为反例... / 条件不足...”，让干扰项体现概念混淆。
3. Phase 2 后，A07 新增的 `law-*` / `bracket-*` 知识点题必须复查：迁入后的 simple-judge / error-diagnose 不能重新带回 2 选项判断题。

## 3.3 重复题目诊断

### 当前事实

当前出题链路没有 session 级去重：

- 闯关 / 进阶：`nextQuestion()` 每次直接 `generateQuestion(...)`。
- 段位赛：`pickQuestionsForGame()` 预生成整局题序，但桶内同样直接调用 `generateQuestion(...)`。
- 生成器层：大量概念题来自有限模板池，部分题型数字变量也很少。

因此 `BL-008` 初步定性为“有限模板池 + 无 session 去重”的组合问题，不是单个随机函数 bug。

闯关抽样中，重复风险最高的当前样本包括：

| 位置 | 30 个 session 中出现重复的次数 | 平均重复题数 | 示例 |
|---|---:|---:|---|
| A04 `operation-laws-S2-LB-L2` | 30/30 | 9.50 | 小雨说：78 + 25 + 22 = 25 + (78 + 22)。这个变形对吗？ |
| A02 `number-sense-S2-LB-L2` | 30/30 | 7.83 | 学校组织 580 名学生参加秋游，每辆车限载 30 人，至少要几辆？ |
| A01 `mental-arithmetic-S2-LA-L3` | 30/30 | 6.90 | 按运算顺序计算: 4.3 - 1.6 + 0.4 |
| A05 `decimal-ops-S1-LA-L2` | 30/30 | 3.37 | 把 0.25 化成最简分数，分母是几？ |
| A07 `multi-step-S2-LB-L2` | 26/30 | 1.83 | 把 125 × 16 × 4 拆成能凑整的形式 |

段位赛当前 8 题型口径下，expert / master 也会重复，主要来自 A04/A06 有限模板。Phase 2 后 A04/A06 独立题型会隐藏，但如果迁入 A07 的 `law-*` / `bracket-*` 仍是固定小池，重复感会转移到 A07 lane。

### 诊断策略决策

推荐采用“脚本抽样 + 场景复现”的组合方案：

1. **脚本抽样**：Phase 2 合并后，按 6 个玩家可见题型、三种模式、关键星级水位跑重复率表，给每个问题 lane 建签名和样例。
2. **场景复现**：针对用户反馈最可能触发的路径，至少复现 A07 新低档 lane、A03 第四关、A03 进阶 3★、段位赛 expert / master。
3. **处理分流**：重复率来自模板池过小的，优先扩池；来自 session 内重复的，加 bounded retry 去重；来自设计刻意复现同一题型结构的，只记录为“结构重复”而非 bug。

这等价于关闭 `BL-008` 的待决策项：Phase 3 不直接写修复，先用组合诊断确认重复类型。

## 实施前检查清单

- [ ] Phase 2 题型 IA 代码完成，玩家可见题型收敛为 6 个。
- [ ] A07 `law-*` / `bracket-*` 迁入后，复跑本页抽样口径。
- [ ] 输出正式诊断记录，至少包含重复签名、样例、模式、题型、level / star / tier。
- [ ] 为 Phase 3 子计划确认三条任务顺序：A03 难度 → 选项干扰项 → 重复题去重。
- [ ] 子计划中写明测试：generator 抽样测试、session 去重测试、`npm test -- --run`、`npm run build`。

## 开发方案建议

Phase 3 实施时建议拆成 3 个任务：

| 任务 | 内容 | 首要文件 |
|---|---|---|
| T1 | A03 难度修复：第四关 2×2 桥接 + 进阶 3★ 除法样本池调整 | `src/engine/generators/vertical-calc.ts`、`src/constants/campaign.ts`、generator tests |
| T2 | 选项干扰项：处理 A02 高档二选一；复查 A07 迁入知识点题 | `src/engine/generators/number-sense.ts`、Phase 2 后的 `multi-step` knowledge modules |
| T3 | 重复题诊断与去重：先脚本记录，再决定 bounded retry / 扩池 | `src/store/index.ts`、`src/engine/rank-match/question-picker.ts`、相关 generator |

T3 不建议做全局永久去重。更合适的是“单 session 内 bounded retry + 题型签名”，最多重试 3-5 次，仍重复则接受并记录诊断，避免在小模板池题型里卡死。
