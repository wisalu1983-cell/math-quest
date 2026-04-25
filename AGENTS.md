# math-quest AGENTS.md

## Codex 轻入口

1. 本项目级规则以 `CLAUDE.md` 为主入口；本文件只记录 Codex / Agent 环境适配，不维护 PM、QA、版本生命周期的复制版流程。
2. Session 启动先读 `CLAUDE.md` 的高频必读层，再读 `ProjectManager/Overview.md`；需要细节时按 `CLAUDE.md` 的低频任务索引进入。
3. 工具差异按当前 Codex 环境等价执行；若 `CLAUDE.md`、skill、实际工具能力冲突，先提醒用户决策。

---

## Codex 执行适配

- 实现类任务默认按 `CLAUDE.md` 使用仓库根 `.worktrees/`；只读诊断、纯 QA、纯文档可跳过。
- `CLAUDE.md` 提到 `.claude/skills/*` 时，若 Codex 可用的同名 skill 位于 `.agents/skills/*`，优先使用 `.agents` 版本；不要维护两份流程。
- 版本生命周期 canonical skill：`.agents/skills/version-lifecycle-manager/SKILL.md`。
- QA 编排 canonical 入口：`.agents/skills/qa-leader/SKILL.md`；规范源见 `QA/qa-leader-canonical.md`。

---

## 快速索引

| 想了解 | 去哪里 |
|---|---|
| 高频项目规则 / 低频任务索引 | `CLAUDE.md` |
| 当前主线 / 状态 / 下一步 | `ProjectManager/Overview.md` |
| PM 写入路由 | `ProjectManager/Plan/rules/pm-write-routing.md` |
| 计划索引 / 规格导航 | `ProjectManager/Plan/README.md` · `ProjectManager/Specs/_index.md` |
| QA 流程与产物 | `QA/qa-leader-canonical.md` · `QA/` |
