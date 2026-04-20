# 计划目录

> 所有项目管理文档统一存放于 `ProjectManager/` 下：
> - `Plan/` — 实施计划
> - `Specs/` — 设计规格（计划的前置设计文档）
> - `Reports/` — 调研/审视报告
> - `ISSUE_LIST.md` — 待解决问题清单
> - `Overview.md` — 活跃控制面（项目背景 / 当前阶段 / 当前状态 / 下一步 / 权威入口）

---

## 计划维护规则

本文件是**索引与模板入口**，不是项目当前状态总览。想看“现在在干什么”，请先读 [`../Overview.md`](../Overview.md)。

后续统一遵守以下最小规则：

1. **先改权威源，再改主管**  
   信息变化时，先改对应的 Plan / Spec / Issue / Report；只有当变化影响活跃视图时，才回写 `Overview.md`。

2. **Plan 持有执行事实，不持有项目总览**  
   活跃计划只写范围、里程碑、阻塞、证据和当前决策结果；项目背景、当前阶段状态、下一步统一由 `Overview.md` 汇总。

3. **索引只在生命周期变化时更新**  
   `Plan/README.md` 和 `Specs/_index.md` 只在新建、归档、生效状态变化、文件改名、入口关系变化时更新；日常里程碑推进不要求同步本索引。

4. **关闭事项退出活跃视图**  
   issue / plan / 路线一旦关闭或废弃，应从活跃视图移出；`Overview.md` 只保留结果性结论，详细过程留在对应 Plan 或 Report。

5. **新 Plan 开工前先扫 `Specs/_index.md`**  
   新计划启动前，先按维度扫描 [`../Specs/_index.md`](../Specs/_index.md) 中的生效规格，再把真正相关的硬约束写进 Plan 头部。

6. **`pm-sync-check` 只在关键节点运行**  
   仅在以下场景运行 `npx tsx scripts/pm-sync-check.ts`：
   - 同一轮改了 2 个及以上权威源 / 索引源
   - 准备关闭一个里程碑或声明某块完成
   - 新建 / 归档 / 废弃 Plan、Spec、Issue 的入口关系
   
   纯诊断、只读分析、纯 `Overview.md` 精简、纯历史阅读，不默认 pre-flight。

### 变更路由短表

| 发生什么 | 先更新哪里 | 什么时候再回写 `Overview.md` |
|------|------|------|
| 活跃计划里程碑推进 / 范围调整 | 对应 `Plan/*.md` | 当前主线 / 当前状态 / 下一步变化时 |
| 新发现问题 / 关闭问题 | `ISSUE_LIST.md` | 影响活跃视图时 |
| 新建设计规格 / 规格状态变化 | 对应 `Specs/*.md` + `Specs/_index.md` | 当前阶段入口或生效约束变化时 |
| 新建 / 归档计划、报告 | `Plan/README.md` | 当前权威入口变化时 |
| 历史复盘 / 机制说明 / 重排归档 | `Reports/` | 默认不回写；除非活跃结论也变了 |

一句话：**先改左列的权威源，再判断主管是否需要同步结果。**

---

## 版本归档规则（2026-04-20 生效）

项目以版本为单位管理迭代。每个版本的活跃工作、收口快照、已关闭 issue 都收纳在对应版本目录内。

### 核心规定

1. **版本命名**：`vX.Y`（例：`v0.1` / `v0.2`）。`X` 升级用于大的架构 / 功能闭环升级；`Y` 升级用于当前 X 框架内的迭代。不强制对齐 semver，也不强制挂 git tag。
2. **版本工作目录**：每个版本在 `Plan/` 下建一个 `vX.Y/` 子目录；该版本所有主计划、子计划、phase 文件、版本级 overview、已关闭 issue 归档都放在里面。
3. **跨版本资产不按版本分**：`Specs/`、`Reports/`、`QA/`、`human-verification-bank-v2.md` 仍在原位，按需从版本目录里用相对路径引用。
4. **跨版本工具性 Plan**：项管体系本身演进 / 工具机制类的 Plan（不属于任何产品版本），保留在 `Plan/` 根目录，用"所属版本：跨版本工具性"标注。
5. **新建 Plan 必填"所属版本"字段**：见下方 Plan 文件模板。

### 活跃视图 vs 归档视图

| 文件 | 活跃视图只写什么 | 归档去向 |
|---|---|---|
| `Overview.md` | 当前版本的项目概览 / 状态 / 下一步 | 版本收口时抽取为 `Plan/vX.Y/00-overview.md` 快照 |
| `ISSUE_LIST.md` | **当前版本开放**（未关闭）的 issue | 已关闭 → `Plan/vX.Y/issues-closed.md`；未关闭但延期 → `Backlog.md` |
| `Plan/README.md` 索引 | 当前版本详细 Plan 表 + 历史版本入口链接 | 历史版本 Plan 详表下沉到 `Plan/vX.Y/README.md` |
| `Backlog.md` | 未激活的需求 / 想法 / 延期候选 | 激活时条目在某版本里展开为正式 Plan；放弃时标注放弃 |

### Backlog vs ISSUE_LIST 边界

- **`ISSUE_LIST.md`**：已知的具体 bug / 欠账 / 实现问题；生命周期 open → closed
- **`Backlog.md`**：未激活的需求 / 想法 / 方向 / 延期候选；生命周期 候选 → 纳入某版本 / 放弃
- 同一条目不同时在两边：bug 进 ISSUE；需求 / 候选进 Backlog

### ISSUE ID 规则

- ID **跨版本连续**，搬到哪里 ID 都不变
- 从 `ISSUE_LIST` 迁到 `Backlog`（延期）：ID 保留，状态标"候选（延期自 ISSUE-xxx）"
- 从 `Backlog` 重新激活进 `ISSUE_LIST`：用原 ID
- 新开 issue：从当前最大 ID 续编

### 版本收口动作清单

一个版本完工、准备切到下一版本时按以下步骤：

1. **快照 Overview**：把 `Overview.md` 当前状态详细内容抽取，写入 `Plan/vX.Y/00-overview.md`（该版本收口快照）
2. **归档 ISSUE**：把 `ISSUE_LIST.md` 里本版本已关闭的 issue 搬到 `Plan/vX.Y/issues-closed.md`；未关闭且决定延期的迁入 `Backlog.md`
3. **切版本轴**：`Overview.md` 顶部"当前版本 / 上一版本"字段切换
4. **更新索引**：`Plan/README.md` 顶部版本索引把收口版本标注"已发布"；当前版本切到新版本
5. **变更日志**（可选）：规则层面调整才留 `Reports/YYYY-MM-DD-*-changelog.md`；纯版本切换无需留

---

## Plan 文件模板（2026-04-20 更新，在 2026-04-17 基础上追加"所属版本"字段）

所有**新建**的 Plan 文件头部必须包含以下栏目：

```markdown
# 〈计划名〉

> 创建：YYYY-MM-DD  
> 所属版本：vX.Y（或"跨版本工具性"）  
> 父计划：〈如有〉  
> 设计规格：〈对应 Specs/*.md〉  
> 状态：⬜ 待排期 / 🟡 进行中 / ✅ 完成

---

## 一、背景

### 前置相关规格（开工前必读）

> 📑 规格索引：`ProjectManager/Specs/_index.md`

| 规格 | 本计划从中继承的硬约束 |
|------|--------------------|
| 〈规格路径〉 | 〈关键断言摘要〉 |
| ... | ... |

### 跨系统维度清单

本计划会改动以下跨系统维度（session 交接时按此清单扫兄弟规格）：

- [ ] 难度档位 / 题型梯度数
- [ ] 星级 / 进阶 / 段位数值
- [ ] 关卡结构 / campaign.ts
- [ ] UI 组件 / 卡片尺寸
- [ ] 答题形式 / 验证逻辑
- [ ] 其他：〈具体列出〉

### 工作脉络

...
```

---

## 版本索引

| 版本 | 状态 | 入口 |
|---|---|---|
| **v0.2** | 📋 规划中 · 当前版本 | [v0.2/](./v0.2/) |
| v0.1 | ✅ 已发布（2026-04-19 收口） | [v0.1/](./v0.1/) |

历史版本 Plan 的详细表格下沉至对应 `Plan/vX.Y/README.md`。本页索引只列版本入口与当前版本详表。

---

## 当前版本（v0.2）Plan 详表

> 主线：2026-04-20 现网体验反馈 + 题型教育设计重梳理 · 见 [v0.2/README.md](./v0.2/README.md)

| 文件 | 内容 | 状态 |
|---|---|---|
| [v0.2/README.md](./v0.2/README.md) | 主线 README（父计划入口）| ⬜ 规划中，等待启动授权 |
| [v0.2/00-overview.md](./v0.2/00-overview.md) | 主线概览（背景 / 目标 / 阶段结构）| |
| [v0.2/01-feedback-catalog.md](./v0.2/01-feedback-catalog.md) | 反馈原文目录与归类映射 | |
| [v0.2/02-classification.md](./v0.2/02-classification.md) | 分类与依赖关系 | |
| [v0.2/03-phase-plan.md](./v0.2/03-phase-plan.md) | 阶段规划总图 | |
| [v0.2/04-execution-discipline.md](./v0.2/04-execution-discipline.md) | 执行纪律：每个子项的 4 步工作流 | |
| [v0.2/phases/phase-alpha.md](./v0.2/phases/phase-alpha.md) | Phase α · 效率基建 + 低成本修复 | ⬜ 待启动 |
| [v0.2/phases/phase-beta.md](./v0.2/phases/phase-beta.md) | Phase β · 三项合并短诊断 | ⬜ 待启动（前置：α 完成）|
| [v0.2/phases/phase-gamma.md](./v0.2/phases/phase-gamma.md) | Phase γ · 诊断结论执行 | ⬜ 占位（β 诊断报告后充实）|
| [v0.2/phases/phase-delta.md](./v0.2/phases/phase-delta.md) | Phase δ · 题型教育设计重梳理 | ⬜ 待启动（δ-1 可与 α/β 并行）|
| [v0.2/phases/phase-epsilon.md](./v0.2/phases/phase-epsilon.md) | Phase ε · 历史答题记录 | ⬜ 待启动 |

---

## 跨版本工具性 Plan（`Plan/` 根目录）

项管体系本身演进 / 工具机制类的 Plan，不属于任何产品版本。

| 文件 | 内容 | 状态 |
|---|---|---|
| [2026-04-17-pm-document-sync-mechanism.md](./2026-04-17-pm-document-sync-mechanism.md) | 历史机制方案：文档同步机制首次设计、L1+L2 落地与回溯验证背景 | ✅ 历史记录 |
| [2026-04-19-pm-token-efficiency-optimization.md](./2026-04-19-pm-token-efficiency-optimization.md) | 项目管理文档体系轻量化优化方案 | ✅ 完成 |

---

## 历史版本归档入口

- **v0.1**：[v0.1/README.md](./v0.1/README.md) — 原型，三层游戏化闭环完成（Phase 1/2/3），2026-04-19 收口
  - 收口快照：[v0.1/00-overview.md](./v0.1/00-overview.md)
  - 已关闭 issue：[v0.1/issues-closed.md](./v0.1/issues-closed.md)

---

## 跨版本资产（不按版本分）

### 设计规格（`../Specs/`）

> 📑 **总索引**：[`Specs/_index.md`](../Specs/_index.md) —— 按维度分类的规格矩阵，新 Plan 开工前必读。详细 Specs 列表不在本页展开。

### 审视报告（`../Reports/`）

> 📑 见 [`../Reports/`](../Reports/) 目录，按日期归档。

### QA 产物（`../QA/`）

> 📑 见 [`../QA/`](../QA/) 目录。

## 说明

- 当前阶段目标、当前主线、当前状态、下一步，统一看 [`../Overview.md`](../Overview.md)。
- 本文件只保留计划索引、模板入口和归档入口；不再复写项目活跃状态。
