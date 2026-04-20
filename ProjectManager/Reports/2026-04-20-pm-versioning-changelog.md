# 项目管理体系版本化迁移 Changelog

> 日期：2026-04-20
> 触发：v0.1 原型已发布，需要把项目管理体系从"单主线扁平"升级到"按版本归档"形态，以便 v0.2 及后续版本的工作可以按版本边界清晰记账。
> 角色：**规则层面变更记录**。本文件不是 Plan，不进入版本工作目录，放在 `Reports/` 作为项管体系演进的参考史料。

---

## 一、变更目标

用户明确预期：

1. 迭代按版本管理
2. 只有进入下一阶段版本的需求才会被激活开始开发；其他需求可记录但不会被激活
3. 按版本为单位管理相关开发文档
4. 项目管理体系适配这一以版本为阶段的形式

---

## 二、版本命名规则（新立）

- 版本名采用 `vX.Y`（纯数字语义，例：`v0.1` / `v0.2`）
- `X` 升级：大的架构 / 功能闭环升级
- `Y` 升级：当前 X 框架内的迭代
- 不强制对齐 semver；不强制挂 git tag
- 现有成果回溯命名：截止 2026-04-19 完成的"三层游戏化闭环原型"归为 **v0.1**；正在规划的"2026-04-20 用户反馈主线"归为 **v0.2**

---

## 三、目录与文件结构变化

### 新增

| 路径 | 作用 |
|---|---|
| `ProjectManager/Plan/v0.1/` | v0.1 版本归档目录 |
| `ProjectManager/Plan/v0.1/README.md` | v0.1 Plan 索引 + Phase 状态总览 |
| `ProjectManager/Plan/v0.1/00-overview.md` | v0.1 收口快照（从 Overview.md 抽取 Phase 1/2/3 详细状态）|
| `ProjectManager/Plan/v0.1/issues-closed.md` | v0.1 期间全部 ISSUE 的归档（从当时 ISSUE_LIST.md 整体快照）|
| `ProjectManager/Plan/v0.2/` | v0.2 版本工作目录（从 `2026-04-20-user-feedback-main-line/` 重命名而来）|
| `ProjectManager/Backlog.md` | 未激活需求 / 想法 / 延期候选集中地 |

### 物理迁移（`git mv`）

v0.1 期间的 21 个产品版本 Plan 从 `ProjectManager/Plan/` 扁平平铺搬入 `ProjectManager/Plan/v0.1/`：

- 所有 `2026-04-08`/`2026-04-09`/`2026-04-13`/`2026-04-14`/`2026-04-15`/`2026-04-16`/`2026-04-17`/`2026-04-18` 日期前缀的 Plan（除下方两条跨版本工具性 Plan 外）

### 保留根目录（不归某个版本）

| 路径 | 原因 |
|---|---|
| `ProjectManager/Plan/2026-04-17-pm-document-sync-mechanism.md` | 跨版本工具性：项管体系演进 |
| `ProjectManager/Plan/2026-04-19-pm-token-efficiency-optimization.md` | 跨版本工具性：项管体系演进 |

### 重命名

- `ProjectManager/Plan/2026-04-20-user-feedback-main-line/` → `ProjectManager/Plan/v0.2/`

---

## 四、权威文件语义变化

| 文件 | 变更前 | 变更后 |
|---|---|---|
| `Overview.md` | 包含"当前阶段"详细状态（Phase 1/2/3 全部细节）| 只保留当前版本（v0.2）的活跃视图 + 版本轴；v0.1 详细状态已快照到 `Plan/v0.1/00-overview.md` |
| `ISSUE_LIST.md` | 包含 ISSUE-001~064 全量（含全部已关闭记录）| 只列当前版本（v0.2）开放的 issue（当前数为 0）；v0.1 期间关闭的全部搬到 `Plan/v0.1/issues-closed.md`；ISSUE-059 延期迁入 `Backlog.md` |
| `Plan/README.md` | 按主题分组的扁平 Plan 列表 | 顶部版本索引 + 当前版本 Plan 详表 + 跨版本工具性 Plan + 历史版本归档入口 |
| `Backlog.md` | 不存在 | 新建：未激活需求 / 想法 / 延期候选 |

### 活跃视图 vs 归档视图的新规则

- `Overview.md` / `ISSUE_LIST.md` / `Plan/README.md` 只写**当前版本活跃信息**
- 历史版本的详细信息下沉到 `Plan/vX.Y/` 下，通过入口链接回溯

### `Backlog.md` vs `ISSUE_LIST.md` 边界（新立）

- `ISSUE_LIST.md`：已知的具体 bug / 欠账 / 实现问题；生命周期 open → closed
- `Backlog.md`：未激活的需求 / 想法 / 方向 / 延期候选；生命周期 候选 → 纳入 vX.Y / 放弃
- 同一条目不同时在两边

### ISSUE ID 规则（新立）

- ID 跨版本连续，搬到哪里 ID 都不变
- 从 `ISSUE_LIST` 迁到 `Backlog`（延期）：ID 保留
- 从 `Backlog` 重新激活进 `ISSUE_LIST`：用原 ID
- 新开 issue 从当前最大 ID 续编

---

## 五、模板与规则变化

### Plan 文件模板

在 2026-04-17 模板基础上**追加一个必填字段**：

```markdown
> 所属版本：vX.Y（或"跨版本工具性"）
```

### 新增"版本归档规则"段

写入 `Plan/README.md`，包含：

- 版本命名
- 版本工作目录约定
- 跨版本资产清单
- 跨版本工具性 Plan 的特殊位置规则
- 活跃视图 vs 归档视图表
- Backlog vs ISSUE_LIST 边界
- ISSUE ID 规则
- **版本收口动作清单**（5 步：快照 Overview → 归档 ISSUE → 切版本轴 → 更新索引 → 可选 changelog）

---

## 六、引用链路更新

批量全局替换生效：

- `Plan/2026-04-*.md` → `Plan/v0.1/2026-04-*.md`（21 个文件名，20 个外部文件被更新）
- v0.1 目录内 Plan 文件的外部相对路径统一加深一级：
  - `../Specs/` → `../../Specs/`
  - `../Reports/` → `../../Reports/`
  - `../Overview.md` → `../../Overview.md`
  - `../ISSUE_LIST.md` → `../../ISSUE_LIST.md`
  - `../../test-results/` → `../../../test-results/`

被更新的外部文件（20 个）：
- `docs/plans/2026-04-19-rank-match-recovery-implementation.md`
- `reference-bank/CHANGELOG.md`
- `ProjectManager/Overview.md`
- `ProjectManager/ISSUE_LIST.md`
- `ProjectManager/Plan/2026-04-17-pm-document-sync-mechanism.md`（留根工具性 Plan）
- `ProjectManager/QA/2026-04-18-s1s2-verify/qa-result.md`
- `ProjectManager/QA/2026-04-18-s3s4-verify/qa-result.md`
- `ProjectManager/Reports/2026-04-17-frontend-capability-survey.md`
- `ProjectManager/Reports/2026-04-17-pm-sync-check-retrospective.md`
- `ProjectManager/Reports/2026-04-18-phase3-umbrella-replan-history.md`
- `ProjectManager/Reports/2026-04-19-m1-kickoff-brief.md`
- `ProjectManager/Specs/2026-04-14-ui-redesign-spec.md`
- `ProjectManager/Specs/2026-04-15-gamification-phase2-advance-spec.md`
- `ProjectManager/Specs/2026-04-18-a03-block-b-plus-design.md`
- `ProjectManager/Specs/2026-04-18-rank-match-phase3-implementation-spec.md`
- 以及 v0.1 目录内 6 个文件（同级引用中的描述文字部分）

未改动的引用（保留了对两条留根工具性 Plan 的既有路径）：
- `math-quest/.cursor/rules/pm-sync-check.mdc`
- `math-quest/scripts/pm-sync-check.ts`
- `ProjectManager/Reports/2026-04-17-pm-sync-check-retrospective.md` 对 `pm-document-sync-mechanism` 的引用

---

## 七、Backlog 初始化内容

从 v0.1 收口时遗留的开放条目抽取：

- `BL-001` · 本地用户数据存档 / 账号系统前置数据模型（候选）
- `BL-002` · 段位赛晋级动画遗留（候选，等真实反馈触发）
- `ISSUE-059` · `dec-div` 高档残留隐藏 `trainingFields`（候选，延期自 v0.1 ISSUE_LIST；保留原 ID）

---

## 八、不可逆 / 风险项核对

| 风险点 | 处理 |
|---|---|
| `git mv` 21 个文件是否丢失历史 | Git 的 rename 追踪自动保留历史；`git log --follow` 可完整回溯 |
| v0.1 目录内文件的相对路径是否全部校准 | 6 个文件的外部相对路径已机械校准；无外部指向项目根的 `../../` 形式（仅 test-results 这一种，已处理）|
| 外部对旧 `Plan/2026-04-*.md` 的引用是否全部更新 | 全局扫描确认：所有匹配 `Plan/2026-04-(08\|09\|13\|14\|15\|16\|17\|18)-*.md` 的引用均已指向 `Plan/v0.1/*`，仅剩对留根工具性 Plan 的合法引用 |
| `.cursor/rules` 内的 pm-sync-check 规则是否失效 | 未失效：该规则引用的 `pm-document-sync-mechanism.md` 仍留根；脚本逻辑不感知新版本目录 |
| v0.1 目录内同级 Plan 引用 | 未影响：之前用"同级裸文件名"形式，搬家后仍然是同级关系 |
| 文件编码 / 换行 | 所有批量脚本保留了原 BOM 与 CRLF 状态（用 `[System.IO.File]::ReadAllBytes` + `UTF8Encoding($hasBom)` 明确处理）|

---

## 九、后续观察项

1. **v0.2 启动时的新 Plan 创建纪律**：新 Plan 放 `Plan/` 根目录，头部写"所属版本：v0.2"，同时在 `Plan/v0.2/README.md` 的 Plan 索引里挂一行链接；v0.2 收口时决定是否将这些 Plan 搬入 `Plan/v0.2/`（按当前规则，应该搬）
2. **Backlog 条目激活流程**：首次从 Backlog 激活某条（如 `ISSUE-059`）到 `ISSUE_LIST` 时，验证 ID 保留规则是否被正确执行
3. **pm-sync-check 兼容性**：脚本与规则里对 Plan 路径的硬编码是否需要跟着版本化调整；下次运行 `pm-sync-check.ts` 时观察
4. **Plan/v0.1/issues-closed.md 里的旧路径**：标注过"读者需要访问具体链接时回到 `ProjectManager/` 根目录自行解析"，作为归档快照可接受；如果未来频繁回查再考虑批量校准

---

## 十、执行 session

执行人：Agent 会话（2026-04-20）
前置讨论：本项目 `d-01-Garena-GI-ClaudeGameStudio` agent transcript `f91d6405-ab22-42e6-966e-b321b8b9568b`（方案 A 选定：物理搬动 v0.1 文件 + 全局引用更新）
