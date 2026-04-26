# 阶段规划总图

> 所属版本：v0.4
> 所属主线：[README](./README.md)
> 分类基础：[`02-classification.md`](./02-classification.md)
> 最近调整：2026-04-26 Phase 5 已完成开发与 QA；v0.4 待版本收口

---

## 五个 Phase 一览

| Phase | 名称 | 主产出 | 启动条件 | 收尾条件 | 状态 |
|---|---|---|---|---|---|
| Phase 1 | 渲染与判定修复 | 颜色、答案兼容、乘法竖式统一、`ISSUE-059` | 读 A03 相关代码 / 规格；按已确认三步路线展开乘法竖式子计划 | 对应手工或自动验证通过；test/build 通过 | ✅ 已完成 |
| Phase 2 | A04/A06 断联并入 A07 | 玩家题型入口收敛、A07 知识点 lane、保留原 A07 低档应用、存档/段位/进阶兼容 | 读 A04/A06/A07 规格、星级/段位规格、存档迁移原则 | A04/A06 不再玩家可见；A07 lane 覆盖原子题型；原 A07 低档应用不丢失；test/build/QA 通过 | ✅ 已完成 |
| Phase 3 | 题目质量与生成器诊断 | 竖式难度、A03 `difficulty=4-5` 乘法分布、A02 compare 质量优化、重复题目治理 | Phase 2 后题型 IA 稳定；读生成器 / 难度 / 星级规格；复跑预研抽样 | 抽样验证有记录；重复题目有 bug/设计结论；test/build 通过 | ✅ 已完成 |
| Phase 4 | 交互设计与教学引导 | 进位/退位格三档规则、compare tip 补证 | 进位/退位格规则已确认；compare tip 已补证 | 用户视角走查 + 三档场景验证；compare tip 补证完成；A03 current spec 回写完成 | ✅ 已完成 |
| Phase 5 | Practice 工程质量 | 状态重置统一机制 | Phase 4 已收口；现有行为测试覆盖 | 重构前后行为等价；回归测试通过 | ✅ 已完成 |

## 建议时序

```text
Phase 1 已完成
  ↓
Phase 2：题型信息架构已稳定
  ↓
Phase 3：在新 IA 上做题目质量与重复题诊断（已完成）
  ↓
Phase 4：处理剩余教学交互规则（已完成）
  ↓
Phase 5：工程质量收尾（已完成）
```

Phase 2 必须排在题目质量诊断前面。原因是 A04/A06 是否作为独立题型，会直接影响选项题扩容样本、重复题诊断样本、段位赛入场条件 / 题型范围和进阶入口。先诊断再改 IA，会让结论口径漂移。

## Phase 间依赖

| 关系 | 性质 | 说明 |
|---|---|---|
| Phase 1 → Phase 2 | 软依赖 | Phase 2 不依赖乘法竖式代码，但 v0.4 已先完成低风险修复 |
| Phase 2 → Phase 3 | 硬依赖 | 题型 IA 稳定后才能定义重复题和选项干扰项的验收口径 |
| Phase 3 → Phase 4 | 软依赖 | 进位格规则与 compare tip 可独立，但建议在生成器诊断后再做完整 QA |
| Phase 4 → Phase 5 | 已满足 | Phase 5 是工程质量，不影响题目体验主线；已在 Phase 4 收口后完成 |

## 决策门

| 决策 | 影响文件 | 未决时处理 |
|---|---|---|
| 乘法竖式三步路线 | `phases/phase-1.md` / 子计划 | 已完成；见 [`subplans/2026-04-25-bl-005-乘法竖式与Phase1修复.md`](./subplans/2026-04-25-bl-005-乘法竖式与Phase1修复.md) |
| A04/A06 题型 IA | `phases/phase-2.md` / 子计划 | 已确认：玩家入口取消，A07 直接拥有运算律 / 括号变换低档知识点 lane；原 A07 低档基础应用继续保留在低档 |
| 旧 A04/A06 存档兼容 | `phases/phase-2.md` / 子计划 | 保留 legacy 数据，不清空历史数据；旧进度不折算到 A07；旧错题/历史不参与新段位复习；必要时走 v4→v5 迁移 |
| 重复题诊断策略 | `phases/phase-3.md` / `phases/phase-3-research.md` | 已采用“脚本抽样 + 场景复现”组合；Phase 2 后复跑已完成，T5 session 内完全重复治理已落地 |
| 进位/退位格三档规则 | `phases/phase-4.md` / `subplans/2026-04-26-phase4-进位退位格规则与compare-tip补证.md` / `../../Specs/a03-vertical-calc/current.md` | 已完成：新增纯逻辑策略层，低档默认跳格纳入过程格且过程错不通过，中档只在统一结果 UI 提示，高档不显示过程格；compare tip 补证通过；current spec 已回写 |
| Phase 5 去留 | `phases/phase-5.md` / `subplans/2026-04-26-phase5-Practice状态重置启动准备.md` | 已完成：`BL-004` Practice 状态重置落地并通过 QAleader 三层验证 |

## 子计划说明

具体子项进入实施前，按 [`../templates/plan-template.md`](../templates/plan-template.md) 在 `subplans/` 下创建独立子计划。当前已有：

- [`subplans/2026-04-25-bl-005-乘法竖式与Phase1修复.md`](./subplans/2026-04-25-bl-005-乘法竖式与Phase1修复.md)：Phase 1 乘法竖式
- [`subplans/2026-04-25-a04-a06-断联并入A07简便计算.md`](./subplans/2026-04-25-a04-a06-断联并入A07简便计算.md)：Phase 2 A04/A06 断联并入 A07
- [`subplans/2026-04-25-phase3-题目质量诊断与实施拆解.md`](./subplans/2026-04-25-phase3-题目质量诊断与实施拆解.md)：Phase 3 题目质量复跑诊断与实施拆解
- [`subplans/2026-04-25-T2-A03乘法两位数乘两位数分布.md`](./subplans/2026-04-25-T2-A03乘法两位数乘两位数分布.md)：Phase 3 T2 A03 乘法分布开发文档
- [`subplans/2026-04-25-T3-A03除法样本池治理.md`](./subplans/2026-04-25-T3-A03除法样本池治理.md)：Phase 3 T3 A03 除法样本池治理开发文档
- [`subplans/2026-04-25-T4-A02compare质量优化.md`](./subplans/2026-04-25-T4-A02compare质量优化.md)：Phase 3 T4 A02 compare 质量优化开发文档
- [`subplans/2026-04-25-T5-session内完全重复治理.md`](./subplans/2026-04-25-T5-session内完全重复治理.md)：Phase 3 T5 session 内完全重复治理开发文档
- [`subplans/2026-04-26-phase4-进位退位格规则与compare-tip补证.md`](./subplans/2026-04-26-phase4-进位退位格规则与compare-tip补证.md)：Phase 4 进位/退位格三档规则与 compare tip 补证开发文档
- [`subplans/2026-04-26-phase5-Practice状态重置启动准备.md`](./subplans/2026-04-26-phase5-Practice状态重置启动准备.md)：Phase 5 Practice 状态重置实施与 QA 记录

后续待展开：无；v0.4 进入版本收口准备。
