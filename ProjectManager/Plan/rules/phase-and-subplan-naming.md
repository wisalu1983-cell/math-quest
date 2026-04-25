# Phase 与子计划命名规则

> 所属版本：跨版本工具性
> 读取场景：新建 Phase、子计划、跨版本引用、Issue / Backlog 来源标注时
> 高频摘要：Phase 用 `vX.Y-P`；子计划用 `vX.Y-P-N`；协作文档文件名在日期后优先使用中文可读主题，专用术语和代号可保留原文。

---

## 命名格式

| 层级 | 正式 ID | 上下文内简写 | 文件位置 |
|---|---|---|---|
| Phase 级 | `vX.Y-P` | `Phase P` | `Plan/vX.Y/phases/phase-P.md` |
| 子计划级 | `vX.Y-P-N` | `P-N` | `Plan/vX.Y/subplans/YYYY-MM-DD-<代号>-<中文可读主题>.md` |

示例：

- v0.2 的第 1 个 Phase → 正式 `v0.2-1`，在 v0.2 文档内简写为 `Phase 1`
- v0.2 第 1 个 Phase 的第 1 个子计划 → 正式 `v0.2-1-1`，在 v0.2 文档内简写为 `1-1`

## 使用规则

1. Phase 文件内部可用简写 `Phase N` / `N-M`，已隐式绑定版本号。
2. 跨上下文引用必须用完整 ID `vX.Y-N` / `vX.Y-N-M`。
3. 子计划文件放 `Plan/vX.Y/subplans/YYYY-MM-DD-<代号>-<中文可读主题>.md`，头部标注正式父计划 ID。
4. Phase 文件统一放 `Plan/vX.Y/phases/phase-N.md`。
5. 新 Phase 子项登记到 ISSUE / Backlog / Reports 时，用正式 ID 做来源引用。

## 文件名语言

版本计划、子计划、开发文档、讨论样题等面向协作阅读的文档，文件名在日期后优先使用中文可读主题。

- 保留必要代号：`A04`、`A07`、`BL-005`、`ISSUE-059`、`Phase1` 等可留原文。
- 保留专用术语：TopicId、生成器 subtype、框架 / 库名等可留原文。
- 固定版本骨架例外：`README.md`、`00-overview.md`、`01-*.md`、`02-classification.md`、`03-phase-plan.md`、`04-execution-discipline.md`、`phases/phase-N.md` 不改成中文名。
- Phase 辅助讨论文档、模拟样题、临时方案稿若需要落盘，使用 `YYYY-MM-DD-<代号>-<中文可读主题>.md`，并放在最贴近的版本目录或 Phase 目录下。

## 历史兼容

2026-04-20 之前旧文档可能使用希腊字母。查旧文档时按下表对照，新文档不再使用：

| 旧称呼 | 新称呼 |
|---|---|
| Phase alpha | Phase 1 |
| Phase beta | Phase 2 |
| Phase gamma | Phase 3 |
| Phase delta | Phase 4 |
| Phase epsilon | Phase 5 |
