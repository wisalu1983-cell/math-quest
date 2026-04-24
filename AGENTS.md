# math-quest AGENTS.md

ALWAYS 遵守本项目 `CLAUDE.md` 中的项目级规则与要求；工具差异项按当前环境等价执行，冲突时先提醒用户决策。

## Worktree 默认

- 实现类任务默认在仓库根 `.worktrees/` 下创建 git worktree
- 当前分支为 `master` / `main` 时，不再单独询问目录位置；默认直接使用 `.worktrees/`
- 只读诊断、纯 QA、纯文档可跳过；用户明确要求直接在当前工作树修改时，以用户要求为准
- 在 worktree 内执行计划或开发文档前，必须确认计划引用的 `ProjectManager / Specs / Reports / subplans / QA` 文档也存在于当前 worktree；缺失时先同步文档，或明确声明以主工作区文档为 source of truth，并在收尾记录差异
