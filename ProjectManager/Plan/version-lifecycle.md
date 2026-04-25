# 版本生命周期管理指南

> 所属版本：跨版本工具性
> 维护位置：`ProjectManager/Plan/version-lifecycle.md`
> 触发场景：开新版本、版本过程中重排管理结构、版本收口 / 切版本轴
> 设计原则：低频规则采用渐进式披露；日常会话不默认阅读本文件，需要处理版本生命周期时再进入。

---

## 适用范围

本文件规定“开新版本”和“版本开发过程中”的项目管理动作。日常开发、普通 issue 修复、单个子计划推进，仍按 `ProjectManager/Plan/README.md` 的常用规则和具体 Plan / Spec 执行。

参考规格：`Plan/v0.2/README.md` 的渐进式披露结构：

- `README.md` 只做版本入口和导航
- `00-overview.md` 承载版本背景、目标、阶段结构
- `01-*` 承载来源材料 / 反馈 / 需求证据
- `02-classification.md` 承载分类、依赖、边界
- `03-phase-plan.md` 承载 Phase 总图、时序、进入 / 收尾条件
- `04-execution-discipline.md` 承载执行纪律、验收、回写规则
- `phases/` 承载各 Phase 范围
- `subplans/` 只在具体 Phase / 子项启动时逐步展开

## 开新版本动作

当 Backlog / Issue / 版本决策正式激活为新版本 `vX.Y` 时，创建 `ProjectManager/Plan/vX.Y/`，并完成以下动作：

1. 创建 `README.md`：只做版本入口、状态、导航，不承载详细正文。
2. 创建 `00-overview.md`：启动时写静态规划快照；收口时更新为最终收口快照。不要等收口时才第一次创建。
3. 创建 `01-*.md`：按来源性质命名。反馈主线可用 `01-feedback-catalog.md`；规格 / commit / 验收证据主线可用 `01-source-catalog.md`。
4. 创建 `02-classification.md`：写功能分类、依赖关系、范围边界。
5. 创建 `03-phase-plan.md`：写 Phase 总图、时序、进入条件、收尾条件。
6. 创建 `04-execution-discipline.md`：写本版本专属执行纪律、验收规则、PM 回写规则。
7. 创建 `phases/phase-N.md`：至少为已知 Phase 建入口；未知 Phase 可在 `03-phase-plan.md` 标注待展开。
8. `subplans/` 默认延迟创建：只有具体 Phase / 子项启动时才建实施级 Plan。
9. 更新 `ProjectManager/Plan/README.md` 的版本索引，只放入口和状态，不复制本文件规则正文。
10. 若新版本成为当前版本，再更新 `ProjectManager/Overview.md` 的版本轴、当前阶段和入口。

若某个文件不适用，不能静默省略；必须在 `README.md` 的导航或说明中标注 `N/A` 及原因。

## 版本开发过程动作

版本进行中按“权威源先行、主管后同步”执行：

| 发生什么 | 写入位置 |
|---|---|
| Phase 范围 / 进入条件 / 收尾条件变化 | `Plan/vX.Y/03-phase-plan.md` 或对应 `phases/phase-N.md` |
| 具体功能实施计划启动 | `Plan/vX.Y/subplans/YYYY-MM-DD-<feature-slug>.md` |
| 功能设计 / 调研 / 方案变化 | `Specs/<feature-slug>/YYYY-MM-DD-<topic>.md`；跨功能规格留在 `Specs/` 根 |
| 发现或关闭具体问题 | `ISSUE_LIST.md`；若延期为候选，迁入 `Backlog.md` |
| QA run 生成 | `QA/runs/<date>-<scope>/`，并在对应 Plan / Phase / Summary 中引用 |
| 历史复盘 / 机制说明 | `Reports/YYYY-MM-DD-<topic>.md` |
| 影响当前版本状态 / 下一步 | 先改权威源，再回写 `Overview.md` |

版本 `README.md` 只维护入口、状态、导航和必要 N/A 说明；不要把阶段细节、长期规则或每日进展堆进 README。

## 文档归属规则

当前项目已确认的归属规则如下：

- **Specs 侧按功能聚合**：某个具体功能的设计、调研、方案、决策材料放到 `ProjectManager/Specs/<feature-slug>/`。
- **Plan 侧按版本聚合**：实施动作绑定版本，放到 `ProjectManager/Plan/vX.Y/subplans/YYYY-MM-DD-<feature-slug>.md`。
- **Plan 与 Specs 不镜像目录结构**：二者通过文件名 slug、Plan 头部 `设计规格：` 字段和索引互相指向。
- **Reports 侧放复盘 / 机制说明**：不属于某个具体功能规格，也不是实施计划的材料，放 `ProjectManager/Reports/`。
- **QA 侧放正式测试产物**：正式 QA 结果放仓库根 `QA/runs/`；可复用脚本放 `QA/scripts/` 或对应测试目录。

## 版本收口动作

版本完工、准备切到下一版本时：

1. 更新 `00-overview.md` 为最终收口快照。
2. 确认 `01-04` 与 `phases/` 记录能追溯需求、分类、阶段和执行纪律。
3. 归档本版本关闭的 issue；延期候选进入 Backlog。
4. 确认 QA 结论：若需要正式 QAleader，必须存在 `QA/runs/<date>-<scope>/qa-summary.md`。
5. 更新 `Plan/vX.Y/README.md` 状态。
6. 更新 `ProjectManager/Plan/README.md` 版本索引。
7. 若版本轴切换，更新 `ProjectManager/Overview.md`。
8. 涉及跨源写入、Plan / Spec / Issue 生命周期变化时运行 `pm-sync-check`。

## 渐进式披露约束

- 本文件是低频指南，不并入 `ProjectManager/Overview.md`。
- `ProjectManager/Plan/README.md` 只保留本文件入口，不复写细则。
- Agent 只有在开新版本、版本收口、版本管理文档缺失诊断、版本结构重排时才需要读取本文件。
