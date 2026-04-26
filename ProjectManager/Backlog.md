# Backlog（未激活需求 / 想法 / 延期候选）

> 最后更新：2026-04-26（v0.4 已发布；BL-003 ~ BL-008 已落地归档）
> 角色：**未激活的需求 / 想法 / 方向 / 延期候选**集中地。只有被正式纳入某个版本之后，条目才会展开为正式 Plan；已纳入当前版本但尚未收口的条目可暂存在本文件作为来源索引，版本收口时必须归档或回流。
>
> **与 `ISSUE_LIST.md` 的边界**：
> - `ISSUE_LIST.md` — 已知的具体 bug / 欠账 / 实现问题；生命周期 open → closed
> - `Backlog.md`（本文件） — 未激活的需求 / 想法 / 方向 / 延期候选；生命周期 候选 → 纳入 vX.Y / 放弃
> - 同一条目不同时在两边

---

## 状态说明

- **候选**：记录下来但未纳入任何版本
- **已纳入 vX.Y**：已被当前或进行中的版本正式激活；版本收口前可保留完整条目，收口时必须退出活跃区
- **延期至 vX.Y / 候选**：版本收口时未做完、仍值得保留的条目；回到活跃区并写清延期原因
- **已落地 vX.Y**：只出现在 `已落地归档` 区，保留一行索引，不再保留长篇正文
- **已放弃**：评估后决定不做；进入 `已放弃归档`，保留一行理由供未来回溯

---

## 活跃候选 / 已纳入当前版本

### BL-002 · 段位赛晋级动画遗留

- **来源**：v0.1 Phase 3 M3 设计审查 m-3 漏网项
- **背景**：段位赛晋级时机的动画表现未做完整设计与实现。v0.1 收口时按用户决策**不入 ISSUE_LIST**，等 Phase 3 上线后按真实用户反馈评估
- **类别**：体验 / UI 动效
- **状态**：候选（等真实反馈触发；v0.2 主线如有相关用户反馈可提升为 ISSUE 处理）

---

## 流转规则

### 候选 → 纳入 vX.Y

当决定把某条候选正式纳入某版本时：
1. 在当前版本的主 Plan / 子计划里引用本条目
2. 本文件把该条目状态改为 **已纳入 vX.Y**，并附上具体 Plan 链接
3. 如果属于 bug 类（如 `ISSUE-059`），同步把条目从 Backlog 移回 `ISSUE_LIST.md`（原 ID 保留）

### 候选 → 已放弃

评估后决定不做时：
1. 状态改为 **已放弃**
2. 保留条目 + 放弃理由，供未来回溯
3. 不删除（避免失去历史信息）

### 激活后归档

版本收口时，Backlog 归档是**必做动作**，不再作为可选整理项。

**触发条件**：

1. 执行 `ProjectManager/Plan/version-lifecycle.md` 的 `版本收口动作`
2. 或某个 `已纳入 vX.Y` 条目被明确关闭 / 延期 / 放弃
3. 或切换版本轴前需要清理当前版本活跃视图

**执行方式**：

1. 扫描本文件中所有状态为 **已纳入 vX.Y** / **已激活至 vX.Y** 的条目。
2. 已完成条目：从 `活跃候选 / 已纳入当前版本` 移出，只在 `已落地归档` 保留一行：`ID / 标题 / 落地版本 / 日期 / Plan 链接 / 一句话结果`。
3. 未完成但仍要做：保留或回流到活跃区，状态改为 **候选** 或 **延期至 vX.Z**，写清延期原因和下一判断点。
4. 决定不做：移入 `已放弃归档`，保留一行放弃理由。
5. bug 类条目不在 Backlog 长期归档；关闭走 `Plan/vX.Y/issues-closed.md`，延期才回到 Backlog，并保留原 ISSUE ID。
6. 若本轮同时改动 Backlog 与 Plan / ISSUE / Overview，按规则运行 `pm-sync-check`。

**稳定执行检查**：

- 版本收口入口：[`Plan/version-lifecycle.md`](Plan/version-lifecycle.md) 已把 Backlog 归档列为收口动作。
- PM 写入入口：[`Plan/rules/pm-write-routing.md`](Plan/rules/pm-write-routing.md) 规定 Backlog 生命周期变化属于关键节点。
- 当前版本入口：`Plan/v0.4/04-execution-discipline.md` 记录 v0.4 的 Backlog 收口处理方式。
- 工具提醒入口：`.cursor/rules/pm-sync-check.mdc` 在版本收口触发项中包含 Backlog 归档。

---

## 已落地归档

- **BL-001 · 本地用户数据存档 / 账号系统前置数据模型**：已落地 v0.3（2026-04-24），扩大为 Supabase 在线账号与数据同步主线。入口：[`Plan/v0.3/README.md`](Plan/v0.3/README.md)
- **BL-003 · compare 概念题方法提示补证**：已落地 v0.4（2026-04-26），Phase 4 用可控题对象与浏览器证据补齐 compare tip 可达性。入口：[`Plan/v0.4/phases/phase-4.md`](Plan/v0.4/phases/phase-4.md) · [`QA/runs/2026-04-26-v04-release-gate/qa-summary.md`](../QA/runs/2026-04-26-v04-release-gate/qa-summary.md)
- **BL-004 · Practice 答题页状态重置实现清理**：已落地 v0.4（2026-04-26），统一为 `usePracticeInputState()`，换题 reset 与首输入聚焦通过回归。入口：[`Plan/v0.4/phases/phase-5.md`](Plan/v0.4/phases/phase-5.md) · [`QA/runs/2026-04-26-v04-phase5-practice-reset/qa-summary.md`](../QA/runs/2026-04-26-v04-phase5-practice-reset/qa-summary.md)
- **BL-005 · 竖式笔算体验问题集**：已落地 v0.4（2026-04-26），覆盖竖式颜色、乘法竖式、小数答案等价、难度分布、进位/退位格三档规则；release gate 补测关闭 `ISSUE-065`。入口：[`Plan/v0.4/README.md`](Plan/v0.4/README.md) · [`Specs/a03-vertical-calc/current.md`](Specs/a03-vertical-calc/current.md)
- **BL-006 · 运算律填数字题 UX 问题**：已落地 v0.4（2026-04-26），随 A04/A06 玩家入口断联并迁入 A07 知识点 lane 收口。入口：[`Plan/v0.4/phases/phase-2.md`](Plan/v0.4/phases/phase-2.md)
- **BL-007 · 选项题干扰项不足**：已落地 v0.4（2026-04-26），A04/A06 相关题随 Phase 2 收敛，A02 compare 质量在 Phase 3 优化并通过专项验证。入口：[`Plan/v0.4/phases/phase-2.md`](Plan/v0.4/phases/phase-2.md) · [`Plan/v0.4/phases/phase-3.md`](Plan/v0.4/phases/phase-3.md)
- **BL-008 · 闯关题目重复问题**：已落地 v0.4（2026-04-26），完成 campaign / advance / rank-match session 内完全重复治理。入口：[`Plan/v0.4/phases/phase-3.md`](Plan/v0.4/phases/phase-3.md) · [`QA/runs/2026-04-26-v04-release-gate/qa-summary.md`](../QA/runs/2026-04-26-v04-release-gate/qa-summary.md)

## 已放弃归档

当前无。
