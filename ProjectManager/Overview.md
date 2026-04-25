# math-quest 项目概览

> 最后更新：2026-04-25（v0.3 管理配套文档 00-04 已重建；账号同步 scoped QAleader 已补跑通过）
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
| **当前版本** | **v0.3** | ✅ 已上线（Phase 1/2/3 完成，账号同步系统生效） | [Plan/v0.3/](Plan/v0.3/) |
| 上一版本 | v0.2 | ✅ 已收工（2026-04-23；`qa-leader` 三层 QA 完成） | [Plan/v0.2/](Plan/v0.2/) |
| 更早版本 | v0.1 | ✅ 已发布（2026-04-19 收口，三层游戏化闭环完成） | [Plan/v0.1/](Plan/v0.1/) |

> 版本命名见 [Plan/rules/phase-and-subplan-naming.md](Plan/rules/phase-and-subplan-naming.md)，版本生命周期规则见 [Plan/version-lifecycle.md](Plan/version-lifecycle.md)。本文件只呈现当前版本活跃信息；历史版本请进入对应 `Plan/vX.Y/` 目录。

---

## 当前阶段（v0.3）

**阶段目标**：接入 Supabase 在线账号系统，实现跨设备数据同步。

**主线**：邮箱 Magic Link 登录 + 本地优先后台同步 + 多设备冲突确定性合并（3 Phase：基建+认证 → 同步引擎 → UI+验收）。

**当前状态**：

- ✅ BL-001 已正式纳入 v0.3，版本入口与实施计划已落盘
- ✅ 设计规格与实施计划完成，按 `implementation-plan.md` 执行中
- ✅ Phase 1（基建 + 认证）完成：Supabase 客户端、AuthStore、LoginPage、v3→v4 迁移均就绪（commit `da17015`）
- ✅ Phase 2（同步引擎）完成 2026-04-24：`src/sync/*` 四件套 + Repository `markDirty` 桥接 + silent 写；`npm test` 34 files / 582 tests 全绿，`npm run build` 通过（commit 链 `a9a1866` → `77217c9` → `07d6bc5` → `684d536`）
- ✅ Phase 3（UI + 验收）已完成并上线：账号同步 UI、首次登录合并、账号隔离、段位赛联网门控、同步韧性与 4 条 RISK 均已闭环；真实 Supabase 8 个验收剧本通过，记录见 [`Plan/v0.3/phases/phase-3-acceptance.md`](Plan/v0.3/phases/phase-3-acceptance.md)
- ✅ v0.3 账号同步 scoped QAleader 三层回归已于 2026-04-25 补跑通过：Code Review / 自动化 / 拟真人工 QA 均通过，记录见 [`../QA/runs/2026-04-25-v0.3-account-sync-regression/qa-summary.md`](../QA/runs/2026-04-25-v0.3-account-sync-regression/qa-summary.md)
- ✅ v0.3 已发布到 GitHub Pages：主干 commit `f34dc38`，线上地址 [`https://wisalu1983-cell.github.io/math-quest/`](https://wisalu1983-cell.github.io/math-quest/)
- ✅ v0.3 管理配套文档 `00-04` 已于 2026-04-25 按当前版本状态与历史 commit 证据事后重建，入口见 [`Plan/v0.3/README.md`](Plan/v0.3/README.md)
- ✅ 改动范围与已收工的 v0.2 解耦：v0.3 聚焦 auth / sync / Supabase，不回头改 v0.2 的生成器、Tips、历史记录主线

**入口**：
- 设计规格：[`Specs/v03-supabase-account-sync/2026-04-23-v03-supabase-账号与同步系统.md`](Specs/v03-supabase-account-sync/2026-04-23-v03-supabase-账号与同步系统.md)
- 实施计划：[`Plan/v0.3/implementation-plan.md`](Plan/v0.3/implementation-plan.md)
- Phase 3 收口与真实 Supabase 验收：[`Plan/v0.3/phases/phase-3.md`](Plan/v0.3/phases/phase-3.md) · [`Plan/v0.3/phases/phase-3-acceptance.md`](Plan/v0.3/phases/phase-3-acceptance.md)
- QAleader 补跑记录：[`../QA/runs/2026-04-25-v0.3-account-sync-regression/qa-summary.md`](../QA/runs/2026-04-25-v0.3-account-sync-regression/qa-summary.md)
- Backlog 来源：BL-001（已纳入 v0.3）

**下一步**：做 v0.3 版本级收口决策。若不追加 v0.3 功能，基于已重建的 `Plan/v0.3/00-overview.md` 快照切入下一版本规划；若线上观察到新问题，进入 `ISSUE_LIST.md` 或 `Backlog.md`。

---

## 上一版本收口（v0.2）

**收口结论**：v0.2 已于 2026-04-23 收工。

**收口事实**：

- ✅ Phase 1~5 全部完成
- ✅ `qa-leader` 三层全量 QA 已完成：Code Review / 自动化 / 拟真人工 QA 全部通过
- ✅ 正式收口报告已归档：[`QA/runs/2026-04-23-v0.2-full-regression/qa-summary.md`](../QA/runs/2026-04-23-v0.2-full-regression/qa-summary.md)
- ✅ 本轮遗留项已转入 Backlog：`BL-003` compare 概念题方法提示补证、`BL-004` Practice 答题页状态重置实现清理

---

## 权威入口

### 版本活跃入口

- 当前版本根目录：[Plan/v0.3/](Plan/v0.3/)
- 当前版本入口：[Plan/v0.3/README.md](Plan/v0.3/README.md)
- 当前版本收口快照：[Plan/v0.3/00-overview.md](Plan/v0.3/00-overview.md)
- 当前实施计划：[Plan/v0.3/implementation-plan.md](Plan/v0.3/implementation-plan.md)
- 当前设计规格：[Specs/v03-supabase-account-sync/2026-04-23-v03-supabase-账号与同步系统.md](Specs/v03-supabase-account-sync/2026-04-23-v03-supabase-账号与同步系统.md)

### 全局管理入口

- 开放问题权威源：[ISSUE_LIST.md](ISSUE_LIST.md)
- 未激活候选 / 延期条目：[Backlog.md](Backlog.md)
- 计划索引 / 规则入口 / 模板入口：[Plan/README.md](Plan/README.md)
- 规格导航总索引：[Specs/_index.md](Specs/_index.md)
- 复盘 / 历史机制记录：[Reports/](Reports/)

### 历史版本

- v0.2 版本归档：[Plan/v0.2/](Plan/v0.2/)（[README](Plan/v0.2/README.md) · [收口快照](Plan/v0.2/00-overview.md) · [QA 总结](../QA/runs/2026-04-23-v0.2-full-regression/qa-summary.md)）
- v0.1 版本归档：[Plan/v0.1/](Plan/v0.1/)（[README](Plan/v0.1/README.md) · [收口快照](Plan/v0.1/00-overview.md) · [已关闭 issue](Plan/v0.1/issues-closed.md)）

### 低频扩展

- 人工验证题库：[human-verification-bank-v2.md](human-verification-bank-v2.md)
- QA 产物：[QA/](QA/)
- 真题参考库：[../reference-bank/README.md](../reference-bank/README.md)
