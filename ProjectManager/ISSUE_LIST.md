# ISSUE_LIST — 当前版本开放问题

> 最后更新：2026-04-24（v0.3 Phase 3 收口检查：当前版本无开放 issue）
> 当前版本：**v0.3**（Supabase 在线账号与数据同步 —— 见 `Plan/v0.3/`）
> 本文件角色：**只列当前版本开放的 issue**（待修 bug / 欠账 / 实现问题）。历史关闭项走版本归档，未激活需求走 Backlog。

---

## 当前开放数

| 当前开放数 | 是否阻塞当前主线 | 当前需关注项 |
|---|---|---|
| 0 | —— | v0.3 账号同步主线无已立案开放 issue |

> v0.3 主线 Plan 详见 [Plan/v0.3/README.md](Plan/v0.3/README.md)；主线的执行节奏与候选问题清单以该目录内文档为准。

---

## 开放问题清单

（当前无 v0.3 阶段已立案的 bug / 欠账）

---

## 历史归档 / 延期入口

| 想看什么 | 去哪里 |
|---|---|
| v0.1 期间 ISSUE-001~064 完整关闭记录 | [`Plan/v0.1/issues-closed.md`](Plan/v0.1/issues-closed.md) |
| v0.1 延期未处理的 issue / 候选项 | [`Backlog.md`](Backlog.md) |
| 项目管理规则 / 模板 / 版本归档规则 | [`Plan/README.md`](Plan/README.md) |

---

## 操作规范（简化提醒）

> 完整规则见 `Plan/README.md` 版本归档规则。

1. **新开 issue**：从当前最大 ID 续编（跨版本连续，目前下一个新 ID 从 `ISSUE-065` 起）。写明 P0/P1/P2、所属版本、类别（bug / 实现一致性 / a11y / UI / 等）
2. **关闭 issue**：在本文件内标注关闭并保留关闭证据链；版本收口时由本文件整体搬至 `Plan/vX.Y/issues-closed.md`
3. **延期 issue**：迁入 `Backlog.md`，原 ID 保留；激活时搬回本文件，仍用原 ID
4. **同一条目不同时在两边**：bug 进本文件；未激活需求 / 想法进 Backlog
