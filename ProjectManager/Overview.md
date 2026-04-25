# math-quest 项目概览

> 最后更新：2026-04-25（v0.4 乘法竖式三步路线已确认）
> 角色：**活跃控制面 / 总管**。本文件只保留项目背景、版本轴、当前阶段目标、当前主线、当前状态、下一步和入口链接；细节下放到对应专人文档或版本归档。

---

## 项目背景

**产品**：数学大冒险（math-quest），面向上海五年级学生的游戏化数学练习应用。

**长期问题**：

- 题目生成不能只靠算法随机，需要用真实考试材料校准
- 游戏化不能只做 UI 包装，需要形成完整的长期练习闭环

**长期路线**：

1. 用真题参考库校准生成器质量
2. 完成三层游戏化闭环：闯关 → 进阶 → 段位赛
3. 基于真实用户反馈持续打磨体验与能力训练设计

**当前范围**：聚焦 A 领域（A01-A08 数与运算）；A09、B、C、D 暂不在本阶段范围内。

---

## 版本轴

| 阶段 | 版本 | 状态 | 入口 |
|---|---|---|---|
| **当前版本** | **v0.4** | 📋 前置准备完成；需求讨论中 | [Plan/v0.4/](Plan/v0.4/) |
| 上一版本 | v0.3 | ✅ 已上线（账号同步系统生效；管理配套文档已重建） | [Plan/v0.3/](Plan/v0.3/) |
| 更早版本 | v0.2 | ✅ 已收工（2026-04-23；`qa-leader` 三层 QA 完成） | [Plan/v0.2/](Plan/v0.2/) |
| 更早版本 | v0.1 | ✅ 已发布（2026-04-19 收口，三层游戏化闭环完成） | [Plan/v0.1/](Plan/v0.1/) |

> 版本命名见 [Plan/rules/phase-and-subplan-naming.md](Plan/rules/phase-and-subplan-naming.md)，版本生命周期规则见 [Plan/version-lifecycle.md](Plan/version-lifecycle.md)。本文件只呈现当前版本活跃信息；历史版本请进入对应 `Plan/vX.Y/` 目录。

---

## 当前阶段（v0.4）

**阶段目标**：系统性修复题目体验问题，落地 4.25 真实用户反馈，并清理 v0.2 遗留技术债。

**主线**：题目体验系统性修复（4 Phase：渲染与判定修复 → 题目质量与生成器诊断 → 交互设计与教学引导 → Practice 工程质量）。

**当前状态**：

- ✅ v0.4 预研报告已完成，入口见 [`Reports/2026-04-25-v0.4-prereport.md`](Reports/2026-04-25-v0.4-prereport.md)
- ✅ v0.4 版本管理包已建立：`README + 00-04 + phases/phase-1..4`
- ✅ `BL-003` ~ `BL-008` 已纳入 v0.4 规划视图；`ISSUE-059` 已重新挂入当前版本 `ISSUE_LIST.md`
- 📋 尚未开始代码实现；当前进入需求讨论和子项决策阶段
- ✅ `BL-005.3` 乘法竖式统一方向已确认：多位整数乘法模块 → 小数乘法复用 → 小数点定位 / 答案等价
- 📋 剩余待决策项：进位格三档规则、重复题目诊断策略、Phase 4 是否保留在 v0.4

**入口**：

- 版本入口：[`Plan/v0.4/README.md`](Plan/v0.4/README.md)
- 启动快照：[`Plan/v0.4/00-overview.md`](Plan/v0.4/00-overview.md)
- 来源证据：[`Plan/v0.4/01-research-catalog.md`](Plan/v0.4/01-research-catalog.md)
- Phase 总图：[`Plan/v0.4/03-phase-plan.md`](Plan/v0.4/03-phase-plan.md)
- 当前开放 issue：[`ISSUE_LIST.md`](ISSUE_LIST.md)
- Backlog 来源：[`Backlog.md`](Backlog.md)

**下一步**：进入 v0.4 具体需求讨论，优先确认 `BL-005.2` 进位格三档规则；`BL-005.3` 开工前需落独立子计划。

---

## 上一版本收口（v0.3）

**收口结论**：v0.3 已完成账号同步系统并上线。

**收口事实**：

- ✅ Phase 1（基建 + 认证）、Phase 2（同步引擎）、Phase 3（UI + 验收）全部完成
- ✅ 真实 Supabase 8 个验收剧本通过，记录见 [`Plan/v0.3/phases/phase-3-acceptance.md`](Plan/v0.3/phases/phase-3-acceptance.md)
- ✅ v0.3 账号同步 scoped QAleader 三层回归已于 2026-04-25 补跑通过，记录见 [`../QA/runs/2026-04-25-v0.3-account-sync-regression/qa-summary.md`](../QA/runs/2026-04-25-v0.3-account-sync-regression/qa-summary.md)
- ✅ v0.3 已发布到 GitHub Pages：主干 commit `f34dc38`，线上地址 [`https://wisalu1983-cell.github.io/math-quest/`](https://wisalu1983-cell.github.io/math-quest/)
- ✅ v0.3 管理配套文档 `00-04` 已于 2026-04-25 重建，入口见 [`Plan/v0.3/README.md`](Plan/v0.3/README.md)

---

## 历史版本提示

- v0.2 已于 2026-04-23 收工，正式收口报告见 [`QA/runs/2026-04-23-v0.2-full-regression/qa-summary.md`](../QA/runs/2026-04-23-v0.2-full-regression/qa-summary.md)
- v0.1 已于 2026-04-19 收口，三层游戏化闭环完成

---

## 权威入口

### 版本活跃入口

- 当前版本根目录：[Plan/v0.4/](Plan/v0.4/)
- 当前版本入口：[Plan/v0.4/README.md](Plan/v0.4/README.md)
- 当前版本启动快照：[Plan/v0.4/00-overview.md](Plan/v0.4/00-overview.md)
- 当前版本来源证据：[Plan/v0.4/01-research-catalog.md](Plan/v0.4/01-research-catalog.md)
- 当前版本 Phase 总图：[Plan/v0.4/03-phase-plan.md](Plan/v0.4/03-phase-plan.md)

### 全局管理入口

- 开放问题权威源：[ISSUE_LIST.md](ISSUE_LIST.md)
- 未激活候选 / 延期条目：[Backlog.md](Backlog.md)
- 计划索引 / 规则入口 / 模板入口：[Plan/README.md](Plan/README.md)
- 规格导航总索引：[Specs/_index.md](Specs/_index.md)
- 复盘 / 历史机制记录：[Reports/](Reports/)

### 历史版本

- v0.3 版本归档：[Plan/v0.3/](Plan/v0.3/)（[README](Plan/v0.3/README.md) · [收口快照](Plan/v0.3/00-overview.md) · [真实 Supabase 验收](Plan/v0.3/phases/phase-3-acceptance.md)）
- v0.2 版本归档：[Plan/v0.2/](Plan/v0.2/)（[README](Plan/v0.2/README.md) · [收口快照](Plan/v0.2/00-overview.md) · [QA 总结](../QA/runs/2026-04-23-v0.2-full-regression/qa-summary.md)）
- v0.1 版本归档：[Plan/v0.1/](Plan/v0.1/)（[README](Plan/v0.1/README.md) · [收口快照](Plan/v0.1/00-overview.md) · [已关闭 issue](Plan/v0.1/issues-closed.md)）

### 低频扩展

- 人工验证题库：[human-verification-bank-v2.md](human-verification-bank-v2.md)
- QA 产物：[QA/](QA/)
- 真题参考库：[../reference-bank/README.md](../reference-bank/README.md)
