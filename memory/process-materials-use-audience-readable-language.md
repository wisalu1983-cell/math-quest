---
name: process-materials-use-audience-readable-language
description: math-quest 流程介绍材料要先用通用项目管理语言解释，再保留内部术语定位
type: user
status: candidate
pattern_key: mathquest-process-materials-audience-readable-language
source_tool: codex
source_session: 019dce3e-f35f-7d71-88ed-e1a07521b8e5
source_timestamp_start: 2026-04-27T17:56:05.521+08:00
source_timestamp_end: 2026-04-27T17:56:05.521+08:00
seen_count: 1
first_seen: 2026-04-27
last_seen: 2026-04-27
---

math-quest 的项目管理 / 版本流程介绍材料，目标读者可能不了解 math-quest，但具备游戏或软件开发、项目管理经验。文案不能只写内部文件名、内部状态枚举或项目专用术语。

**Why:** 用户指出版本开发流程图中的 `Spec impact`、`update-at-phase-close / none / deferred` 等描述，对不了解 math-quest 背景的人不可读。流程介绍材料的目的不是训练读者记住内部术语，而是让外部或跨团队读者先理解流程。
**How to apply:** 写这类材料时，卡片标题和正文先使用通用概念（如“需求池”“缺陷清单”“版本计划目录”“规格影响判断”），再在括号中保留内部术语或文件名（如 Backlog、ISSUE_LIST、Plan/vX.Y、Specs/_index）用于定位。内部状态枚举要转成白话解释，例如“需要更新 / 没有影响 / 等验收后再确认”。
