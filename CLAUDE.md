# math-quest CLAUDE.md

## Session 启动

1. 读 `ProjectManager/Overview.md`：背景、当前阶段、主线、状态、下一步
2. 需要细节时，沿 `Overview.md` 入口进入对应权威文档，不默认通读 ProjectManager
3. `pm-sync-check` 仅在跨源写入、里程碑收尾、Plan/Spec/Issue 生命周期变化时跑；纯诊断/只读豁免（详见 `.cursor/rules/pm-sync-check.mdc`）

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
| 新建 QA 产物 | `QA/<date>-<tag>/`，在对应 Plan 或 Report 引用 |
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
| 生成器规格 / 难度档位 / 子题型 | `ProjectManager/Specs/2026-04-17-generator-redesign-v2.md` |
| QA 流程规范 / 产物 | `QA/qa-leader-canonical.md` · `ProjectManager/QA/` |
| 真题参考库 | `reference-bank/README.md` |
