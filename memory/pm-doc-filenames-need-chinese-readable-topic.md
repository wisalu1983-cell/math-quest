---
name: pm-doc-filenames-need-chinese-readable-topic
description: MathQuest PM 文档命名要优先保留中文可读主题，发现规则与历史实践漂移时先核对并修正规则
type: feedback
status: candidate
pattern_key: mathquest-pm-doc-filenames-chinese-readable-topic
source_tool: codex
source_session: codex-desktop-current-thread
source_timestamp_start: 2026-04-25T16:11:47.217+08:00
source_timestamp_end: 2026-04-25T16:11:47.217+08:00
seen_count: 1
first_seen: 2026-04-25
last_seen: 2026-04-25
---

MathQuest 的 PM / Plan 讨论文档命名应优先保留中文可读主题，而不是只写英文 feature slug。若当前规则文档写着 `YYYY-MM-DD-<feature-slug>.md`，但历史实践和用户协作偏好显示日期后应含中文主题，需要先指出规则漂移，再把命名规则、现有新文档文件名和引用一起修正。

**Why:** 用户会通过文件名快速识别文档内容；纯英文 slug 在当前项目 PM 目录里不符合中文协作语境，也容易让后续检索和交接变钝。
**How to apply:** 新建或改名 PM 文档前，先读 `ProjectManager/Plan/rules/phase-and-subplan-naming.md` 与 `ProjectManager/Plan/rules/document-ownership.md`。若文档是面向需求/开发讨论的 Plan、样题模拟、阶段辅助文档，文件名采用日期 + 中文可读主题；保留必要的 A04/A07/BL-005 等代号。改名时必须同步 `ProjectManager` 内所有 Markdown 链接。
