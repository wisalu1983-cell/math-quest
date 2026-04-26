# QA 目录

`QA/` 是 math-quest 的单一 QA 根目录。

- `qa-leader-canonical.md`：QA 规则源
- `qa-system-methodology.md`：QA 体系方法论与外部依据
- `capability-registry.md`：现成工具与脚本台账
- `templates/`：正式 QA 用例 / 报告模板
- `qa-system-self-test.md`：QA 体系自检说明
- `sync-qa-skills.ps1`：全局 QA skill 同步脚本
- `scripts/sync-qa-leader-adapters.ps1`：从 canonical 同步 Cursor / Claude Code / Codex QA Leader 适配件
- `runs/`：正式 QA 执行产物与报告
- `scripts/`：仓库内可复用 QA 脚本
- `artifacts/`：未归档到正式 run 的临时 / 历史 QA 证据

项目管理文档只链接这里的 QA 资产，不再在 `ProjectManager/` 或 `scripts/` 下另建 QA 目录。

## Git 归档口径

可以同步入库：

- QA 体系、工具、模板、能力台账
- 正式测试用例、测试设计方法、执行报告、QA 总结
- 正式、可复用、手写的 QA 脚本

默认不入库：

- 截图、视频、trace、Playwright report
- raw JSON、raw console log、临时诊断输出
- 大批量 artifacts、缓存、下载件

若某个小型证据必须长期保存，需在对应 QA summary 中标注为“长期证据”。
