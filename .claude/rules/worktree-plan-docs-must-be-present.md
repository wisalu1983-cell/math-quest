ALWAYS 在 math-quest 的 worktree 内执行计划或开发文档前，先确认该计划引用的 ProjectManager、Specs、Reports、subplans、QA 文档也存在于当前 worktree。

ALWAYS 如果引用文档在 worktree 内缺失，先同步缺失文档，或明确声明本次以主工作区文档为 source of truth，并在收尾记录这个源头差异。
