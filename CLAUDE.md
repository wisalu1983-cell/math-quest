# math-quest CLAUDE.md

## Session 高频必读

1. 先读 `ProjectManager/Overview.md`：只获取背景、当前阶段、主线、状态、下一步。
2. 默认只读本文件 + `Overview.md`；需要细节时沿 `Overview.md` 或下方低频索引进入，不默认通读 `ProjectManager/`。
3. `pm-sync-check` 仅在跨源写入、里程碑收尾、Plan / Spec / Issue 生命周期变化时跑；纯诊断、只读分析、纯文档结构诊断豁免。

---

## 高频写入与执行约束

- **实现任务默认隔离开发**：新增功能、业务逻辑修改、跨文件重构、执行实施计划时，默认先开 git worktree；只读诊断、纯 QA、纯文档可跳过。
- **默认 worktree 位置**：仓库根目录 `.worktrees/`；当前分支为 `master` / `main` 且用户未要求直接改当前工作树时，直接使用 `.worktrees/`，不单独询问目录位置。
- **worktree 安全前置**：创建项目前先确认 `.worktrees/` 已被 `.gitignore` 忽略。
- **worktree 文档前置**：在 worktree 内执行计划或开发文档前，确认该计划引用的 `ProjectManager / Specs / Reports / subplans / QA` 文档也存在于当前 worktree；缺失时先同步文档，或声明以主工作区文档为 source of truth，并在收尾记录差异。
- **PM 写入顺序**：先改权威源，再按影响回写 `Overview.md`。详细路由只在需要写 `Plan / Spec / Issue / Backlog / QA / Overview` 时读取 `ProjectManager/Plan/rules/pm-write-routing.md`。
- **协作文档命名**：版本计划、子计划、开发文档、讨论样题等文件名在日期后优先使用中文可读主题；专用术语、TopicId、Phase / BL / ISSUE 编号等代号可保留原文；固定版本骨架文件除外。

---

## 高频代码硬约束

- **路由**：`react-router-dom` 已安装但禁用，页面路由统一用 `useUIStore.currentPage`。
- **Store**：拆两文件：`src/store/index.ts`（`useUserStore` / `useSessionStore` / `useUIStore`）+ `src/store/gamification.ts`（`useGameProgressStore`）；`useProgressStore` 是废弃旧名，不存在。
- **空壳**：`src/pages/TopicSelect.tsx` 已被 `CampaignMap` 替代，不要加逻辑。
- **废弃字段**：`User.grade`、`Question.xpBase`，新代码不要依赖。
- **生成器**：纯函数签名 `{ difficulty, id?, subtypeFilter? } -> Question`，不引入副作用；子题型过滤走 `CampaignLane.subtypeFilter` + `pickSubtype()`（会重新归一化权重）。
- **存档版本升级**：`repository.init` 遇到旧版本号禁止 `clearAll()`，必须走 `migrateV{n}ToV{n+1}` 串行迁移链；迁移任一步抛错时，存档落到 `mq_backup_v{old}_{ts}` 备份后提示用户。`clearAll` 只能作为显式用户动作保留。详见 `ProjectManager/Specs/2026-04-18-rank-match-phase3-implementation-spec.md` §6.3。

---

## 低频任务索引

低频规则只在触发对应任务时读取；不要把长流程复制回本文件。

| 触发场景 | 读取入口 |
|---|---|
| 当前主线 / 状态 / 下一步 | `ProjectManager/Overview.md` |
| 写 ProjectManager、判断 PM 写入路由、确认 `pm-sync-check` | `ProjectManager/Plan/rules/pm-write-routing.md` · `.cursor/rules/pm-sync-check.mdc` |
| 判断 Spec / Plan / Report / QA 归属，或确认文件命名细则 | `ProjectManager/Plan/rules/document-ownership.md` |
| 写新功能、优化、bugfix 开发文档或子计划 | `.claude/skills/dev-doc-flow/SKILL.md` |
| 开新版本、版本收口、切版本轴、检查或补齐 `Plan/vX.Y` 管理包 | `.claude/skills/version-lifecycle-manager/SKILL.md` · canonical source: `.agents/skills/version-lifecycle-manager/SKILL.md` · `ProjectManager/Plan/version-lifecycle.md` |
| QA、测试用例、视觉 QA、体验测试、拟真人工 QA | `.claude/skills/qa-leader/SKILL.md` · canonical source: `.agents/skills/qa-leader/SKILL.md` · `QA/qa-leader-canonical.md` · `QA/capability-registry.md` |
| 查当前版本计划、模板、阶段入口 | `ProjectManager/Plan/README.md` |
| 查设计规格导航 | `ProjectManager/Specs/_index.md` |
| 查 issue / backlog 细节 | `ProjectManager/ISSUE_LIST.md` · `ProjectManager/Backlog.md` |
| 查生成器规格、难度档位、子题型 | `ProjectManager/Specs/2026-04-17-generator-redesign-v2.md` |
| 查历史复盘或机制说明 | `ProjectManager/Reports/` |
| 查真题参考库 | `reference-bank/README.md` |
