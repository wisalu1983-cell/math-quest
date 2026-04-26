# 功能 Current Spec 模板

> 所属版本：跨版本工具性
> 读取场景：phase 验收确认、准备合并 / 收口时，为长期功能创建或回写 `Specs/<feature-slug>/current.md`
> 使用方式：复制到 `ProjectManager/Specs/<feature-slug>/current.md`，只保留已验收确认的当前状态。

---

# 〈功能名〉Current Spec

> 功能 slug：`<feature-slug>`
> 当前状态：生效 / 已实施 / 历史参考
> 首次建立：YYYY-MM-DD
> 最近确认：YYYY-MM-DD
> 最近来源：〈Plan / Phase / QA / commit〉

---

## 1. 当前承诺

用 3-6 条写清该功能现在对用户、开发者或系统承诺什么。

## 2. 当前行为

按最稳定的维度组织，例如入口、状态流、数据契约、UI、权限、构建、QA 口径。只写当前生效行为，不写备选方案。

## 3. 非承诺 / 边界

列出当前明确不保证、不支持或仅限开发 / 测试的行为。

## 4. 来源与证据

| 类型 | 路径 | 说明 |
|---|---|---|
| 版本 subplan | `ProjectManager/Plan/vX.Y/subplans/...` | phase 验收确认后的来源 |
| 设计 / 决策 | `ProjectManager/Specs/<feature-slug>/YYYY-MM-DD-....md` | 历史方案或 ADR |
| QA / 验收 | `QA/runs/...` | 验收证据 |
| 代码入口 | `src/...` | 当前实现入口 |

## 5. 变更记录

| 日期 | 来源 | 当前状态变化 |
|---|---|---|
| YYYY-MM-DD | 〈来源〉 | 〈已验收确认的变化〉 |
