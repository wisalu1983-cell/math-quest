# 预研与来源证据目录

> 所属版本：v0.4
> 所属主线：[README](./README.md)
> 来源报告：[`../../Reports/2026-04-25-v0.4-prereport.md`](../../Reports/2026-04-25-v0.4-prereport.md)

---

## 核心来源

| 来源 | 内容 | v0.4 用法 |
|---|---|---|
| [`2026-04-25-v0.4-prereport.md`](../../Reports/2026-04-25-v0.4-prereport.md) | v0.4 定性、Backlog 入选、Phase 草案、待决策项 | 本版本启动规划的直接依据 |
| [`phase-3-research.md`](./phases/phase-3-research.md) | Phase 3 题目质量与生成器诊断预研收口 | `BL-005.4` / `BL-007` / `BL-008` 实施前诊断口径 |
| [`../../Backlog.md`](../../Backlog.md) | `BL-003` ~ `BL-008` 详情 | 需求来源与候选生命周期事实源 |
| [`../../ISSUE_LIST.md`](../../ISSUE_LIST.md) | `ISSUE-059` 当前开放 issue | bug 生命周期事实源 |
| [`../../Specs/_index.md`](../../Specs/_index.md) | 生成器、游戏化、UI、同步相关规格索引 | 开工前的规格检索入口 |

## 已纳入条目

| ID | 来源 | 摘要 | v0.4 初始归位 |
|---|---|---|---|
| `BL-005` | 4.25 真实用户反馈 | 竖式笔算体验问题集：颜色、进位格、乘法交互、难度、小数答案兼容 | Phase 1 + Phase 3 + Phase 4 |
| `BL-006` | 4.25 真实用户反馈 | 运算律填数字题槽位误导、缺操作说明 | Phase 2（随 A07 运算律 lane 收口） |
| `BL-007` | 4.25 真实用户反馈 | 选项题只有 2 个选项，猜测概率过高 | Phase 2 局部 + Phase 3 |
| `BL-008` | 4.25 真实用户反馈 | 闯关题目重复，需先诊断再定性 | Phase 3 |
| `BL-003` | v0.2 收口 QA | compare 概念题方法提示补证 | Phase 4 |
| `BL-004` | v0.2 收口 Code Review | Practice 答题页状态重置实现清理 | Phase 5 |
| `ISSUE-059` | v0.1 延期 issue | `dec-div` 高档残留隐藏 `trainingFields` | Phase 1 |

## 必查规格

| 涉及范围 | 必查入口 | 关键约束 |
|---|---|---|
| 竖式笔算 / 生成器 | [`../../Specs/2026-04-17-generator-redesign-v2.md`](../../Specs/2026-04-17-generator-redesign-v2.md) | A03 竖式笔算最新规格 |
| 难度分档 | [`../../Specs/2026-04-16-generator-difficulty-tiering-spec.md`](../../Specs/2026-04-16-generator-difficulty-tiering-spec.md) | 三档难度定义主规格 |
| 星级梯度 | [`../../Specs/2026-04-15-gamification-phase2-advance-spec.md`](../../Specs/2026-04-15-gamification-phase2-advance-spec.md) | `TOPIC_STAR_CAP`：A01/A04/A08 为 3★，其余为 5★ |
| UI / UX | [`../../Specs/2026-04-14-ui-redesign-spec.md`](../../Specs/2026-04-14-ui-redesign-spec.md) | 阳光版 v5；字号下限 11px；卡片尺寸约束 |
| 新持久化字段 | [`../../../src/sync/merge.ts`](../../../src/sync/merge.ts) | 如新增持久化字段，必须同步更新云端合并策略 |

## 已确认决策

1. `BL-005.3` 乘法竖式统一方向：采用“整数乘法模块优先”的三步迭代路线。
   - 先做多位整数乘法竖式模块
   - 再让小数乘法复用整数乘法模块
   - 最后加强小数点定位训练与答案等价判定
2. 小数乘法不单独造完整竖式板。它按中国小学标准算法拆成“整数乘法竖式子步骤 + 小数点定位步骤”。
3. A04「运算律」和 A06「括号变换」取消玩家独立大题型入口，断联并入 A07「简便计算」低档知识点 lane。
   - 原 A04/A06 子题型能力不删除，但迁入 A07 作为 A07 自有 lane 内部训练内容。
   - 玩家可见题型、进阶入口和段位赛题型范围同步改为 6 个主题型。
   - 旧 `operation-laws` / `bracket-ops` 数据只保留为 legacy 兼容，不清空历史存档，不折算到新 A07 lane。
4. `BL-008` 重复题目诊断策略：采用“脚本抽样 + 场景复现”组合方案；Phase 2 题型 IA 代码稳定后复跑抽样，再进入修复实施。

## 待决策项

1. `BL-005.2` 进位格三档规则：简单 / 中档 / 高档各自如何判定和反馈？
2. `BL-004` Phase 5：保留在 v0.4，还是在前四个 Phase 工作量偏大时延期到 v0.5？
