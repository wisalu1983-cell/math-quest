# v0.5 Phase 5 · ISSUE-069 reverse-round 填空答案口径修复

> 创建：2026-05-01
> 所属版本：v0.5
> 父计划：[`Phase 5 · Release Gate 与 Living Spec 回写`](../phases/phase-5.md)
> 设计规格：[`Specs/2026-04-22-逆向推理A3回验.md`](../../../Specs/2026-04-22-逆向推理A3回验.md)
> 功能 current spec：N/A（A02 reverse-round 暂无独立 current spec）
> Spec impact：none（修正已知 bug，不新增长期数据契约或 QA 口径）
> 状态：✅ 完成（TDD 红绿、全量 Vitest、build 与 issue 关闭已完成）

---

## 一、背景

### 前置相关规格

| 规格 | 本计划继承的硬约束 |
|---|---|
| [`Specs/_index.md`](../../../Specs/_index.md) | A02 `reverse-round` 属于题目生成器 / 题型设计维度，需继承生成器重设计和逆向推理规格。 |
| [`Specs/2026-04-22-逆向推理A3回验.md`](../../../Specs/2026-04-22-逆向推理A3回验.md) | `reverse-round` 有多 prompt 模板；题干口径应服务逆向推理，而不是制造答题粒度冲突。 |
| [`ISSUE_LIST.md`](../../../ISSUE_LIST.md) | `ISSUE-069` 明确限定修复模板 4 答案口径，不扩大到高档或其他模板。 |

### Current spec 影响评估

| 项 | 结论 |
|---|---|
| 是否改变长期功能行为 / 数据契约 / QA 口径 | 否。修正模板 4 的 bug，使答案粒度与题干空格粒度一致。 |
| 预计回写位置 | N/A |
| 待 phase 验收后回写的要点 | 无；关闭 issue 时归档到 v0.5 `issues-closed.md`。 |

### 需求质量与验收映射

| 关键需求 / 约束 | 来源 | 验收方式 |
|---|---|---|
| 题干问“□ 里最大能填几”时，`solution.answer` 为 `4`。 | `ISSUE_LIST.md` | `src/engine/generators/number-sense.phase5.test.ts` |
| 题干问“□ 里最小能填几”时，`solution.answer` 为 `5`。 | `ISSUE_LIST.md` | `src/engine/generators/number-sense.phase5.test.ts` |
| explanation 仍展示完整小数，帮助学生理解为什么填 4 / 5。 | `ISSUE_LIST.md` 建议修复方向 | scoped generator test |
| 其他 `reverse-round` 模板继续保留完整小数答案。 | `ISSUE_LIST.md` 非目标 | 既有 generator tests + 全量 Vitest |

### 关键决策与备选方案

| 选项 | 结论 | 原因 / 后果 |
|---|---|---|
| 选定方案：仅模板 4 返回方框内数字，explanation 展示完整小数 | 采用 | 最小修复题干答案冲突，不改变其他模板语义。 |
| 未采用方案：把题干改成“这个一位小数最大 / 最小是多少” | 放弃 | 会改用户看到的题型意图，且与截图反馈中“□ 里填几”的练习目标不一致。 |
| 未采用方案：给判题层加特殊兼容，让 `4` 和 `91.4` 都算对 | 放弃 | 会掩盖题目数据口径错误，并让错题本正确答案继续显示完整小数。 |

### 游戏 / 学习体验影响

| 项 | 结论 |
|---|---|
| 是否影响玩法 / 学习体验 | 是 |
| 玩家 / 学生目标 | 按题干填写方框内数字，并得到一致判定。 |
| 学习目标或训练价值 | 强化四舍五入边界中 `4` / `5` 的最大最小判断。 |
| 误解 / 挫败 / 难度风险 | 修复前会把正确填数判错，造成规则误解；修复后 explanation 保留完整数以降低理解成本。 |
| 体验验证方式 | generator 单测、判题 helper 断言、全量回归。 |

### 跨系统维度清单

- [x] 难度档位 / 题型梯度数：仅 `difficulty <= 7` 的 `reverse-round` 模板 4。
- [ ] 星级 / 进阶 / 段位数值：不影响。
- [ ] 关卡结构 / campaign.ts：不影响。
- [ ] UI 组件 / 卡片尺寸：不影响。
- [x] 答题形式 / 验证逻辑：numeric-input 标准答案从完整小数改为单个数字。
- [ ] 存档 / 同步 / 数据迁移：不影响。
- [x] QA / 验收产物：新增 Phase 5 generator 回归测试。

## 二、目标与范围

### 目标

- 修复模板 4 的 `solution.answer`，让学生输入 `4` / `5` 可通过。
- 修正 explanation，使错题反馈能同时说明“方框填几”和“完整一位小数是多少”。
- 补自动化测试，防止模板 4 回退成完整小数答案。

### 非目标

- 不调整 `reverse-round` 其他模板。
- 不改变高档“两位小数保留一位小数”的答案口径。
- 不新增判题层特殊兼容。

## 三、实施拆解

| Task | 内容 | 状态 | 证据 |
|---|---|---|---|
| T1 | 写失败测试，固定模板 4 最大 / 最小两条分支 | ✅ | `npm test -- src/engine/generators/number-sense.phase5.test.ts --run` 曾红灯，返回 `51.4` / `50.5` |
| T2 | 修改 `generateReverseRound()` 模板 4 的 `solution.answer` 与 explanation | ✅ | `src/engine/generators/number-sense.ts` |
| T3 | scoped 测试变绿 | ✅ | 2 tests passed |
| T4 | 全量 test / build | ✅ | `npm test -- --run` 64 files / 773 tests passed；`npm run build` passed |
| T5 | 关闭 `ISSUE-069` 并归档 | ✅ | `ISSUE_LIST.md` 当前开放数为 0；归档见 `issues-closed.md` |
| T6 | PM sync | ✅ | `npx tsx scripts/pm-sync-check.ts` passed |

## 四、验收

- [x] `npm test -- src/engine/generators/number-sense.phase5.test.ts --run` 通过。
- [x] `npm test -- --run` 通过。
- [x] `npm run build` 通过。
- [x] `npx tsx scripts/pm-sync-check.ts` 通过。

## 五、回写

- 已更新 `ProjectManager/ISSUE_LIST.md`，并把 `ISSUE-069` 归档到 `ProjectManager/Plan/v0.5/issues-closed.md`。
- 已更新 `ProjectManager/Overview.md`、`Plan/v0.5/README.md`、`Plan/v0.5/03-phase-plan.md` 中 Phase 5 状态。
- 不回写 current spec。
