# math-quest CLAUDE.md

## Session 启动

1. 读 `ProjectManager/Overview.md`：背景、当前阶段、主线、状态、下一步
2. 需要细节时，沿 `Overview.md` 入口进入对应权威文档，不默认通读 ProjectManager
3. `pm-sync-check` 仅在跨源写入、里程碑收尾、Plan/Spec/Issue 生命周期变化时跑；纯诊断/只读豁免（详见 `.cursor/rules/pm-sync-check.mdc`）

---

## Worktree 默认

- **实现任务默认隔离开发**：新增功能、业务逻辑修改、跨文件重构、执行实施计划时，默认先开 git worktree；只读诊断、纯 QA、纯文档可跳过
- **默认目录**：仓库根目录 `.worktrees/`
- **默认行为**：当前分支为 `master` / `main` 时，若用户没有明确要求直接在当前工作树修改，agent 直接使用 `.worktrees/`，不再单独询问目录位置
- **安全前置**：创建项目内 worktree 前必须先确认 `.worktrees/` 已被 `.gitignore` 忽略
- **文档前置**：在 worktree 内执行计划或开发文档前，必须确认该计划引用的 `ProjectManager / Specs / Reports / subplans / QA` 文档也存在于当前 worktree；若缺失，先同步文档，或明确声明以主工作区文档为 source of truth，并在收尾记录这个源头差异

---

## 开发文档路由

当用户明确要求撰写以下文档时：

- 新功能开发文档
- 优化方案 / 优化开发文档
- bugfix / 修复方案 / 修复开发文档

按以下顺序处理：

1. 若任务已明确属于某个 `vX.Y / phase-N`，先读 `ProjectManager/Plan/vX.Y/README.md` 与对应 `ProjectManager/Plan/vX.Y/phases/phase-N.md`
2. 再读 phase 文档直接点名的 `Specs / Reports / subplans / QA`
3. 若要新起一篇开发文档或子计划，再补读当前版本的 `04-execution-discipline.md`
4. 若需要判断 phase 依赖、归位或并行关系，再补读当前版本的 `03-phase-plan.md`
5. 当前版本包状态与活跃状态可能未完全同步时，再快速读 `ProjectManager/Overview.md` 做状态校验
6. 需要确认命名、子计划位置、功能设计文档目录或 Plan 模板时，再定位 `ProjectManager/Plan/README.md` 的对应小节，不默认通读全文
7. phase 文档未给出相关规格入口时，再查 `ProjectManager/Specs/_index.md`
8. 如果是 bugfix / issue 驱动，再读 `ProjectManager/ISSUE_LIST.md`
9. 激活 `.claude/skills/dev-doc-flow/SKILL.md`
10. 若任务尚未归属版本 / phase，或与现有 `ProjectManager` 管理规则冲突，或文档归属不明确，先提醒用户决策，不在本文件中重复定义新规则

---

## QA 路由

当用户明确要求以下任务时：

- 跑一轮 QA / 全量测试 / QA 测试
- 写测试用例 / 设计测试方案
- 视觉 QA / 体验测试 / 拟真 QA

按以下顺序处理：

1. 激活 `.claude/skills/qa-leader/SKILL.md`
2. 先按 `qa-leader` 的步骤 0 判断本次 QA 任务类型（自动化 / 视觉 / 拟真人工 / 混合）
3. 再读 `QA/capability-registry.md`，优先复用已有工具、skill 和脚本；当前没有覆盖时才新造
4. 正式 QA 文档与结果统一归档到 `QA/runs/<date>-<scope>/`
5. 可复用 QA 脚本统一放 `QA/scripts/`
6. 不默认翻历史 QA run；只有用户明确要求参考某轮历史结果时，才进入对应归档

---

## PM 写入规则

**顺序：先改权威源，再按需改 Overview。**

| 发生什么 | 更新哪里 |
|---------|---------|
| 完成/调整活跃计划行为 | `Plan/*.md`；影响主线/状态/下一步时再改 `Overview.md` |
| 发现新问题 | `ISSUE_LIST.md`；影响活跃视图时再改 `Overview.md` |
| 关闭 Issue | `ISSUE_LIST.md` 标记；仅历史项不改 `Overview.md` |
| 规格新建/状态变化 | `Specs/*.md` + `Specs/_index.md`；影响阶段入口时再改 `Overview.md` |
| 新建/归档实施计划 | `Plan/README.md`；影响活跃入口时再改 `Overview.md` |
| 新建 QA 产物 | 交给 `qa-leader`；正式产物归档到 `QA/runs/`，在对应 Plan 或 Report 引用 |
| 历史复盘/机制说明 | `Reports/`，不默认回写 `Overview.md` |

---

## 非显然约束

- **路由**：`react-router-dom` 已安装但禁用，页面路由统一用 `useUIStore.currentPage`
- **Store**：拆两文件——`src/store/index.ts`（`useUserStore`/`useSessionStore`/`useUIStore`）+ `src/store/gamification.ts`（`useGameProgressStore`）；`useProgressStore` 是废弃旧名，不存在
- **空壳**：`src/pages/TopicSelect.tsx` 已被 `CampaignMap` 替代，不要加逻辑
- **废弃字段**：`User.grade`、`Question.xpBase`，新代码不要依赖
- **生成器**：纯函数签名 `{ difficulty, id?, subtypeFilter? } → Question`，不引入副作用；子题型过滤走 `CampaignLane.subtypeFilter` + `pickSubtype()`（会重新归一化权重）
- **存档版本升级**（项目级原则，Phase 3 M1 起永久生效）：`repository.init` 遇到旧版本号**禁止 `clearAll()`**，必须走 `migrateV{n}ToV{n+1}` 串行迁移链；迁移链任一步抛错时，存档落到 `mq_backup_v{old}_{ts}` 备份后提示用户，而不是悄悄擦除。`clearAll` 只能作为显式用户动作（"清空存档"按钮）保留。详见 `ProjectManager/Specs/2026-04-18-rank-match-phase3-implementation-spec.md` §6.3

---

## 扩展索引

| 想了解 | 去哪里 |
|---|---|
| 当前主线 / 状态 / 下一步 | `ProjectManager/Overview.md` |
| Issue 细节 | `ProjectManager/ISSUE_LIST.md` |
| 计划索引 / 规格导航 | `ProjectManager/Plan/README.md` · `ProjectManager/Specs/_index.md` |
| pm-sync-check 触发规则 | `.cursor/rules/pm-sync-check.mdc` |
| 开发文档流 | `.claude/skills/dev-doc-flow/SKILL.md` |
| 生成器规格 / 难度档位 / 子题型 | `ProjectManager/Specs/2026-04-17-generator-redesign-v2.md` |
| QA 根目录 | `QA/README.md` |
| QA 流程规范 | `QA/qa-leader-canonical.md` |
| QA 工具台账 | `QA/capability-registry.md` |
| 真题参考库 | `reference-bank/README.md` |
