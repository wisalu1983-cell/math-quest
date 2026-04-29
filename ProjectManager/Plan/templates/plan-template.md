# Plan 文件模板

> 所属版本：跨版本工具性
> 读取场景：新建实施计划 / 子计划时复制结构
> 使用方式：复制本模板，替换占位内容；不要把模板正文粘到 `Plan/README.md`。

---

# 〈计划名〉

> 创建：YYYY-MM-DD
> 所属版本：vX.Y（或“跨版本工具性”）
> 父计划：〈如有，使用正式 ID，如 v0.4-1 / v0.4-1-1〉
> 设计规格：〈对应 Specs/*.md；无则写 N/A 并说明原因〉
> 功能 current spec：〈Specs/<feature-slug>/current.md；无长期功能归属则写 N/A〉
> Spec impact：update-at-phase-close / none / deferred（开发期不直接回写 current spec）
> 状态：⬜ 待排期 / 🟡 进行中 / ✅ 完成 / 🗄️ 归档

---

## 一、背景

### 前置相关规格

> 规格索引：`ProjectManager/Specs/_index.md`

| 规格 | 本计划继承的硬约束 |
|---|---|
| 〈规格路径〉 | 〈关键断言摘要〉 |

### Current spec 影响评估

| 项 | 结论 |
|---|---|
| 是否改变长期功能行为 / 数据契约 / QA 口径 | 是 / 否 |
| 预计回写位置 | `ProjectManager/Specs/<feature-slug>/current.md` / N/A |
| 待 phase 验收后回写的要点 | 〈开发期只列待回写，不提前修改 current spec〉 |

### 需求质量与验收映射

| 关键需求 / 约束 | 来源 | 验收方式 |
|---|---|---|
| 〈需求〉 | 〈Plan / Spec / Issue / Backlog / 诊断 / 用户确认〉 | 〈单测 / e2e / QA / 截图 / 统计抽样〉 |

### 关键决策与备选方案

| 选项 | 结论 | 原因 / 后果 |
|---|---|---|
| 选定方案：〈方案〉 | 采用 | 〈为什么采用；带来什么约束〉 |
| 未采用方案：〈方案〉 | 放弃 | 〈为什么放弃〉 |

### 游戏 / 学习体验影响

| 项 | 结论 |
|---|---|
| 是否影响玩法 / 学习体验 | 是 / 否 |
| 玩家 / 学生目标 | 〈如不影响，写 N/A〉 |
| 学习目标或训练价值 | 〈如不影响，写 N/A〉 |
| 误解 / 挫败 / 难度风险 | 〈风险与处理〉 |
| 体验验证方式 | 〈拟真人工 QA / 用户观察 / 截图 / 数据指标 / N/A〉 |

### 跨系统维度清单

- [ ] 难度档位 / 题型梯度数
- [ ] 星级 / 进阶 / 段位数值
- [ ] 关卡结构 / campaign.ts
- [ ] UI 组件 / 卡片尺寸
- [ ] 答题形式 / 验证逻辑
- [ ] 存档 / 同步 / 数据迁移
- [ ] QA / 验收产物

## 二、目标与范围

### 目标

- 〈目标 1〉
- 〈目标 2〉

### 非目标

- 〈明确不做什么〉

## 三、实施拆解

| Task | 内容 | 状态 | 证据 |
|---|---|---|---|
| T1 | 〈任务〉 | ⬜ | 〈PR / commit / 测试〉 |

## 四、验收

- [ ] 相关单元测试 / 自动化测试通过
- [ ] 需要 build 时，`npm run build` 通过
- [ ] 涉及 UI / 体验时，有截图或拟真人工 QA 记录
- [ ] 涉及 PM 多源写入时，`pm-sync-check` 通过

## 五、回写

- 影响当前状态 / 下一步时：回写 `ProjectManager/Overview.md`
- 新增 / 关闭 issue 时：更新 `ProjectManager/ISSUE_LIST.md`
- 新增 QA run 时：在本计划或对应 Phase 引用 `QA/runs/<date>-<scope>/`
- `Spec impact=update-at-phase-close` 时：仅在 phase 验收确认并准备合并 / 收口时回写功能 `current.md`，并同步考虑 `ProjectManager/Specs/_index.md`
- `Spec impact=none/deferred` 时：在本节写明原因或下一处理点
