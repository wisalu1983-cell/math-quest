# Current Spec 文档流试点工作结果报告

> 日期：2026-04-26
> 工作分支：`codex/living-spec-docs-trial`
> 工作目录：`E:\Projects\MathQuest\.worktrees\living-spec-docs-trial`
> 状态：已通过主 PM 验收并进入正式试行；Phase 4 收口已作为首个正式用例执行
> 验收对象：Living Spec / Current Spec 文档制度试点

---

## 1. 任务背景

本次任务源于一个文档管理问题：同一功能在后续版本持续优化时，最初设计文档、版本 subplan、优化开发文档会分散在不同版本目录中；将来回顾功能当前状态时，缺少一个可直接读取的权威入口。

经讨论后确定试点方向：

- `Plan/vX.Y/subplans/` 继续承载版本实施计划、开发过程、验收证据和变更 delta。
- `Specs/<feature-slug>/current.md` 承载功能当前权威状态。
- `current.md` 不在开发开始时提前改写；只在 phase / subplan 验收确认、准备合并或收口时吸收已确认变化。
- 开发期通过 `Spec impact` 字段记录预计影响和待回写要点。

## 2. 试点范围

本次选择 v0.2 功能 `dev-tool-panel` 作为试点，原因：

| 条件 | 结论 |
|---|---|
| 与 v0.4 当前主线无关 | 是，属于 v0.2 Phase 1 工具能力 |
| 已有功能级 Specs 子目录 | 是，`ProjectManager/Specs/dev-tool-panel/` |
| 已有版本 subplan 与 QA 证据 | 是，`Plan/v0.2/subplans/2026-04-20-dev-tool-panel.md` 与 `QA/runs/2026-04-20-f3-dev-tool-unit-test/qa-result.md` |
| 当前索引存在漂移 | 是，`Specs/_index.md` 原先仍标记为“仅调研；规格未定” |
| 适合验证 current spec 聚合能力 | 是，功能已有后续扩展，如 history records 注入项 |

## 3. 已交付内容

### 3.1 制度与模板

| 文件 | 变更摘要 |
|---|---|
| `ProjectManager/Plan/rules/document-ownership.md` | 增加 `current.md` 权威定位、开发期不回写、验收确认后回写、`Spec impact` 规则 |
| `ProjectManager/Plan/templates/plan-template.md` | 增加 `功能 current spec`、`Spec impact`、`Current spec 影响评估`、收口回写要求 |
| `ProjectManager/Plan/templates/current-spec-template.md` | 新增 current spec 模板，规定当前承诺、当前行为、边界、来源证据、变更记录 |
| `ProjectManager/Plan/version-lifecycle.md` | 在版本过程和版本收口中加入 current spec 回写门槛 |
| `.claude/skills/dev-doc-flow/SKILL.md` | 固化 Living Spec 决策门和 phase 收口 / 合并前回写流程 |
| `ProjectManager/Plan/README.md` | 增加 current spec 模板入口 |

### 3.2 试点功能 current spec

| 文件 | 内容摘要 |
|---|---|
| `ProjectManager/Specs/dev-tool-panel/current.md` | 新增 Dev Tool Panel 当前权威规格，聚合启用条件、namespace 隔离、注入项范围、双构建、noindex、边界与来源证据 |
| `ProjectManager/Specs/_index.md` | 将 `dev-tool-panel` 从“进行中 / 仅调研”校正为 `dev-tool-panel/current.md` 生效入口，并登记到维度 C / D |

## 4. 关键制度结论

本次试点制度采用“开发期 delta，收口期 current”的口径：

| 阶段 | `subplan` 职责 | `current.md` 职责 |
|---|---|---|
| 开发文档定稿 / 正式开工 | 引用当前 `current.md`，写清目标变更和 `Spec impact` | 保持当前已生效事实，不提前写未来态 |
| 开发 / 联调 / 验收中 | 记录过程、决策变化、待回写要点 | 不回写 |
| phase 验收确认 / 准备合并 / 收口 | 标记完成，链接验收证据和 current spec | 吸收已验收变化，更新为新的当前权威状态 |

这样可以避免 `current.md` 被未完成方案污染，同时避免版本结束后长期忘记补档。

## 5. 试点发现

### 5.1 试点验证了问题确实存在

`dev-tool-panel` 的历史状态已经完成并通过 QA，但 `Specs/_index.md` 仍写着“仅调研；规格未定”。这说明仅靠 dated docs + subplan，确实容易让索引与功能当前状态脱节。

### 5.2 `current.md` 能有效压缩回顾成本

原先回顾 Dev Tool Panel 需要读：

- 调研报告
- 方案设计
- v0.2 subplan
- QA run
- 当前代码入口
- 后续 history records 注入项代码

现在可先读 `Specs/dev-tool-panel/current.md` 获取当前承诺，再按来源表追溯细节。

### 5.3 回写时机必须放在 merge gate / phase close

如果开发开始时就改 `current.md`，它会变成目标规格而不是当前事实。一旦开发中调整、验收失败或部分延期，长期事实源会产生误导。本次规则已明确：开发期只标 `Spec impact`，验收确认后再回写。

## 6. 验证结果

| 验证项 | 命令 / 方法 | 结果 |
|---|---|---|
| PM 文档一致性 | `npx tsx scripts/pm-sync-check.ts` | 通过，未发现不一致 |
| 自动化测试基线 | `npm test` | 53 个 test files / 687 tests 通过 |
| Worktree 隔离 | `git worktree list` / `git status` | 变更仅在 `codex/living-spec-docs-trial` 测试分支 |

## 7. 待主 PM 验收项

请主 PM 验收以下决策是否可作为正式制度合入：

1. 是否接受 `Specs/<feature-slug>/current.md` 作为功能当前权威状态入口。
2. 是否接受 current spec 只在 phase 验收确认、准备合并 / 收口时回写。
3. 是否接受开发期只在 subplan 记录 `Spec impact` 和待回写要点。
4. 是否接受 `Plan` 模板新增 `功能 current spec` 与 `Spec impact` 字段。
5. 是否接受 `dev-tool-panel/current.md` 作为首个试点样例。

## 8. 建议验收结论

建议主 PM 若认可本方案，则按以下路径推进：

1. 批准本试点制度进入正式分支。
2. 保留 `dev-tool-panel/current.md` 作为首个样例。
3. 后续每个新 subplan 必填 `Spec impact`。
4. 在 phase / 版本收口 checklist 中增加 current spec 回写检查。
5. 暂不批量迁移全部历史功能，优先对 A02、A03、账号同步等高频回顾功能逐步补 current spec。

## 9. 风险与边界

| 风险 | 说明 | 建议 |
|---|---|---|
| 文档工作量增加 | 每个 durable change 需要多一步 `Spec impact` 判断 | 只对长期行为 / 契约变化要求回写；`none` 可跳过 |
| current spec 被写成过程文档 | 如果没有模板约束，容易复制 subplan 细节 | 使用 `current-spec-template.md`，只写当前承诺与当前行为 |
| 历史功能迁移成本高 | 全量补 `current.md` 会消耗较多时间 | 不做大迁移，随新任务或高频回顾逐步补 |
| 自动检查有限 | 脚本很难自动判断 durable change | 用模板字段 + skill 决策门强制 agent 显式回答 |

## 10. 结论

本次试点已在隔离 worktree 中完成规则、模板、skill 与样例 current spec 的闭环。验证结果显示文档索引未破坏、测试基线通过。主 PM 已认可该制度进入正式分支，并要求以 v0.4 Phase 4 收口作为首个正式试行用例。

## 11. 正式试行执行结果

主 PM 验收后，已在 `master` 执行首个正式用例：v0.4 Phase 4 收口。

| 检查项 | 执行结果 |
|---|---|
| 制度合入 | `document-ownership.md`、`plan-template.md`、`current-spec-template.md`、`version-lifecycle.md`、`dev-doc-flow` skill 已进入正式工作树 |
| subplan 标注 | Phase 4 subplan 已补 `功能 current spec` 与 `Spec impact`：`BL-005.2=update-at-phase-close`，`BL-003=none` |
| current spec 回写 | 已新增 `ProjectManager/Specs/a03-vertical-calc/current.md`，只写 Phase 4 验收后的当前事实 |
| 索引更新 | `ProjectManager/Specs/_index.md` 已登记 `a03-vertical-calc/current.md` 与 `dev-tool-panel/current.md` |
| Phase 收口 | Phase 4、v0.4 README / Phase 总图 / Overview 已从“最终验收中”更新为“已完成” |

正式试行初步结论：通过。`Spec impact` 字段在收口时迫使 durable change 显式分流，`current.md` 没有在开发期提前污染，并在 Phase 4 结束时完成权威状态回写。
