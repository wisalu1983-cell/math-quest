# PM 写入路由规则

> 所属版本：跨版本工具性
> 读取场景：需要改 Plan / Spec / Issue / Backlog / QA / Overview 时
> 高频摘要：先改权威源，再按影响回写 `Overview.md`；`pm-sync-check` 只在关键节点跑。

---

## 核心规则

1. **先改权威源，再改主管**
   信息变化时，先改对应的 Plan / Spec / Issue / Report / QA；只有当变化影响活跃视图时，才回写 `Overview.md`。

2. **Plan 持有执行事实，不持有项目总览**
   活跃计划只写范围、里程碑、阻塞、证据和当前决策结果；项目背景、当前阶段状态、下一步统一由 `Overview.md` 汇总。

3. **索引只在生命周期变化时更新**
   `Plan/README.md` 和 `Specs/_index.md` 只在新建、归档、生效状态变化、文件改名、入口关系变化时更新；日常里程碑推进不要求同步索引。

4. **关闭事项退出活跃视图**
   issue / plan / 路线一旦关闭或废弃，应从活跃视图移出；`Overview.md` 只保留结果性结论，详细过程留在对应 Plan 或 Report。

5. **新 Plan 开工前先扫规格索引**
   新计划启动前，先按维度扫描 `ProjectManager/Specs/_index.md` 中的生效规格，再把真正相关的硬约束写进 Plan 头部。

## 变更路由短表

| 发生什么 | 先更新哪里 | 什么时候再回写 `Overview.md` |
|---|---|---|
| 活跃计划里程碑推进 / 范围调整 | 对应 `Plan/*.md` | 当前主线 / 当前状态 / 下一步变化时 |
| 新发现问题 / 关闭问题 | `ISSUE_LIST.md` | 影响活跃视图时 |
| Backlog 条目纳入版本 / 延期 / 落地 / 放弃 | `Backlog.md` + 对应 `Plan/vX.Y/` | 影响当前主线、版本状态或下一步时 |
| 新建设计规格 / 规格状态变化 | 对应 `Specs/*.md` + `Specs/_index.md` | 当前阶段入口或生效约束变化时 |
| 新建 / 归档计划、报告 | `Plan/README.md` | 当前权威入口变化时 |
| 新建 QA 产物 | `QA/runs/<date>-<scope>/` | 对应 Plan / Phase / Report 引用；影响当前状态时回写 |
| 历史复盘 / 机制说明 / 重排归档 | `Reports/` | 默认不回写；除非活跃结论也变了 |

## pm-sync-check 触发

仅在以下场景运行 `npx tsx scripts/pm-sync-check.ts`：

- 同一轮改了 2 个及以上权威源 / 索引源
- 准备关闭一个里程碑或声明某块完成
- 新建 / 归档 / 废弃 Plan、Spec、Issue 的入口关系
- 版本启动 / 版本收口 / 切版本轴
- Backlog 条目发生纳入版本、延期、落地归档或放弃归档

纯诊断、只读分析、纯 `Overview.md` 精简、纯历史阅读，不默认 pre-flight。

## ISSUE / Backlog 边界

- `ISSUE_LIST.md`：已知的具体 bug / 欠账 / 实现问题；生命周期 open → closed。
- `Backlog.md`：未激活的需求 / 想法 / 方向 / 延期候选；生命周期候选 → 纳入某版本 / 放弃。
- 同一条目不同时在两边：bug 进 ISSUE；需求 / 候选进 Backlog。
- ISSUE ID 跨版本连续，迁移到 Backlog 或归档时 ID 不变。
- 已落地的 Backlog 条目不保留长篇正文；版本收口时必须移出活跃区，只在 `已落地归档` 保留一行索引。未完成项才回流为候选 / 延期项。
