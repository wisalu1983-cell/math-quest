# ISSUE_LIST — 当前版本开放问题

> 最后更新：2026-05-01（`ISSUE-069` 已随 v0.5 Phase 5 修复并归档）
> 当前版本：**v0.5 Phase 5 已收口**（入口：[`Plan/v0.5/README.md`](Plan/v0.5/README.md)）
> 本文件角色：**只列当前版本开放的 issue**（待修 bug / 欠账 / 实现问题）。历史关闭项走版本归档，未激活需求走 Backlog。

---

## 当前开放数

| 当前开放数 | 是否阻塞当前主线 | 当前需关注项 |
|---|---|---|
| 0 | 否 | 无 |

> v0.5 版本包已创建；v0.4 已发布版本入口见 [Plan/v0.4/README.md](Plan/v0.4/README.md)。

---

## 开放问题清单

当前无开放 issue。

---

## 本轮关闭问题

- `ISSUE-067` 多行乘法竖式判错面板缺少过程 / 训练格错因：已随 v0.5 Phase 3 修复并归档到 [`Plan/v0.5/issues-closed.md`](Plan/v0.5/issues-closed.md)。
- `ISSUE-068` 单行过程积乘法竖式要求重复填写答数：已随 v0.5 Phase 3 小修关闭，归档到 [`Plan/v0.5/issues-closed.md`](Plan/v0.5/issues-closed.md)。
- `ISSUE-069` reverse-round 填空题答案口径冲突：已随 v0.5 Phase 5 修复并归档到 [`Plan/v0.5/issues-closed.md`](Plan/v0.5/issues-closed.md)。
- v0.4 关闭问题归档见 [`Plan/v0.4/issues-closed.md`](Plan/v0.4/issues-closed.md)。

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

1. **新开 issue**：从当前最大 ID 续编（跨版本连续，目前下一个新 ID 从 `ISSUE-070` 起）。写明 P0/P1/P2、所属版本、类别（bug / 实现一致性 / a11y / UI / 等）
2. **关闭 issue**：在本文件内标注关闭并保留关闭证据链；版本收口时由本文件整体搬至 `Plan/vX.Y/issues-closed.md`
3. **延期 issue**：迁入 `Backlog.md`，原 ID 保留；激活时搬回本文件，仍用原 ID
4. **同一条目不同时在两边**：bug 进本文件；未激活需求 / 想法进 Backlog
