# 版本管理包模板

> 所属版本：跨版本工具性
> 读取场景：开新版本 `vX.Y` 时
> 强制性：新版本启动必须使用本模板；若某项不适用，必须在版本 README 标注 N/A 和原因。

---

## 必建文件清单

在 `ProjectManager/Plan/vX.Y/` 下创建：

- [ ] `README.md`
- [ ] `00-overview.md`
- [ ] `01-<source-kind>.md`
- [ ] `02-classification.md`
- [ ] `03-phase-plan.md`
- [ ] `04-execution-discipline.md`
- [ ] `phases/phase-1.md`（以及已知后续 Phase）
- [ ] `subplans/`（可延迟创建；若不创建，在 README 标注“具体子计划启动时创建”）

## README.md 骨架

```markdown
# vX.Y 〈版本主线名〉 · 主线

> 所属版本：vX.Y
> 创建：YYYY-MM-DD
> 状态：📋 待开工 / 🟡 进行中 / ✅ 已收口
> 设计规格：〈Specs 路径或 N/A〉

---

## 读取提示

- 查入口和状态：读本文件
- 查背景 / 目标 / 收口事实：读 `00-overview.md`
- 查来源证据：读 `01-*.md`
- 查分类和边界：读 `02-classification.md`
- 查 Phase 总图：读 `03-phase-plan.md`
- 查执行纪律：读 `04-execution-discipline.md`

## 导航入口

| 想了解什么 | 打开哪个文件 |
|---|---|
| 版本背景、目标、阶段结构 | [`00-overview.md`](./00-overview.md) |
| 来源 / 需求 / 证据链 | [`01-<source-kind>.md`](./01-<source-kind>.md) |
| 功能分类、依赖关系、边界 | [`02-classification.md`](./02-classification.md) |
| Phase 总图、时序、进入 / 收尾条件 | [`03-phase-plan.md`](./03-phase-plan.md) |
| 执行纪律、验收、PM 回写规则 | [`04-execution-discipline.md`](./04-execution-discipline.md) |
| 各 Phase 范围 | [`phases/`](./phases/) |

## 当前状态

- 〈状态要点〉
```

## 00-overview.md 内容

- 背景
- 目标
- 阶段结构
- 当前 / 收口事实
- 范围边界

启动时写静态规划快照；收口时更新为最终收口快照。

## 01-*.md 命名

- 用户反馈驱动：`01-feedback-catalog.md`
- 规格 / commit / 验收证据驱动：`01-source-catalog.md`
- 外部调研驱动：`01-research-catalog.md`

## 版本启动后必须回写

- [ ] `ProjectManager/Plan/README.md` 当前版本索引
- [ ] `ProjectManager/Overview.md` 当前版本轴和入口
- [ ] `ProjectManager/Specs/_index.md` 新增规格入口（如有）
- [ ] `ProjectManager/ISSUE_LIST.md` / `Backlog.md` 关联来源（如有）
- [ ] `pm-sync-check` 通过
