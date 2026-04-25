# ISSUE_LIST — 当前版本开放问题

> 最后更新：2026-04-25（v0.4 Phase 1：ISSUE-059 已关闭）
> 当前版本：**v0.4**（题目体验系统性修复 —— 见 `Plan/v0.4/`）
> 本文件角色：**只列当前版本开放的 issue**（待修 bug / 欠账 / 实现问题）。历史关闭项走版本归档，未激活需求走 Backlog。

---

## 当前开放数

| 当前开放数 | 是否阻塞当前主线 | 当前需关注项 |
|---|---|---|
| 0 | 否 | 暂无 |

> v0.4 主线 Plan 详见 [Plan/v0.4/README.md](Plan/v0.4/README.md)；主线的执行节奏与候选问题清单以该目录内文档为准。

---

## 开放问题清单

暂无。

---

## 本轮关闭问题

### ISSUE-059 · `dec-div` 高档残留隐藏 `trainingFields`（P2 · 实现一致性）

- **所属版本**：v0.4
- **状态**：✅ 已修复（2026-04-25）
- **来源**：v0.1 延期开放项；2026-04-20 迁入 Backlog；2026-04-25 随 v0.4 启动重新激活
- **类别**：bug / 实现一致性
- **归位**：[`Plan/v0.4/phases/phase-1.md`](Plan/v0.4/phases/phase-1.md)
- **问题摘要**：`dec-div` 高档题仍可能携带隐藏 `trainingFields`，与当前竖式题设计和训练字段暴露策略不一致。
- **修复摘要**：高档 `generateDecimalDiv` 不再输出隐藏 `trainingFields`。
- **关闭证据**：
  - `src/engine/generators/generators.test.ts` 覆盖高档 `dec-div` 不含 `trainingFields`
  - `npm test`：43 files / 643 tests passed
  - QAleader 三层 QA 已完成；QA run 原始结果按制度不入库
- **历史快照**：原始条目详见 [`Plan/v0.1/issues-closed.md`](Plan/v0.1/issues-closed.md)

---

## 历史归档 / 延期入口

| 想看什么 | 去哪里 |
|---|---|
| v0.1 期间 ISSUE-001~064 完整关闭记录 | [`Plan/v0.1/issues-closed.md`](Plan/v0.1/issues-closed.md) |
| v0.1 延期未处理的 issue / 候选项 | [`Backlog.md`](Backlog.md) |
| 项目管理规则 / 模板 / 版本生命周期规则 | [`Plan/README.md`](Plan/README.md) |

---

## 操作规范（简化提醒）

> 完整流转规则见 [`Plan/rules/pm-write-routing.md`](Plan/rules/pm-write-routing.md)；版本收口规则见 [`Plan/version-lifecycle.md`](Plan/version-lifecycle.md)。

1. **新开 issue**：从当前最大 ID 续编（跨版本连续，目前下一个新 ID 从 `ISSUE-065` 起）。写明 P0/P1/P2、所属版本、类别（bug / 实现一致性 / a11y / UI / 等）
2. **关闭 issue**：在本文件内标注关闭并保留关闭证据链；版本收口时由本文件整体搬至 `Plan/vX.Y/issues-closed.md`
3. **延期 issue**：迁入 `Backlog.md`，原 ID 保留；激活时搬回本文件，仍用原 ID
4. **同一条目不同时在两边**：bug 进本文件；未激活需求 / 想法进 Backlog
