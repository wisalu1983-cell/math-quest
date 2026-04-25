---
name: low-frequency-project-rules-progressive-disclosure
description: 低频项目管理规则不要塞进全局常读文档，应做成渐进式披露入口
type: user
status: candidate
pattern_key: low-frequency-project-rules-progressive-disclosure
source_tool: codex
source_session: 019dc204-6a70-75d3-8e49-33062a85a287
source_timestamp_start: 2026-04-25T09:10:22.5566371+08:00
source_timestamp_end: 2026-04-25T09:10:22.5566371+08:00
seen_count: 1
first_seen: 2026-04-25
last_seen: 2026-04-25
---

用户明确偏好：开新版本、版本生命周期这类低频项目管理规范，不要直接写进全局常读的项目管理文档；应采用渐进式披露，只在常用入口里放短链接，细则放独立低频文档。

**Why:** 开新版本不是高频动作。如果把完整规范写进全局文档，会让每次会话或日常查规则时读到不相关内容，增加上下文噪音。

**How to apply:** 新增或调整低频项目管理规则时，优先创建独立指南文档；全局 `Overview.md` 不放；`Plan/README.md` 只放一行入口或速查链接。只有在处理版本启动、收口、结构诊断等触发场景时才读取低频指南。
