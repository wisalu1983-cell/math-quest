# 文档类型与 skill 路由规则

> 读取场景：新建或修改文档前，需要判断该走哪套项目规则或 skill。
> 高频摘要：先判断文档职责，再调用最窄入口；项目落点、命名和回写规则优先于通用 skill 默认路径。

本文件只负责分流，不复写各规则或 skill 的细则。真正的写入位置、命名、索引和回写条件，以被路由到的入口为准。

## 总原则

1. **先判职责，再写文档**：先判断文档是 PM 状态、Phase 入口、subplan、Spec、Report、QA 产物、版本生命周期材料，还是普通说明 / 提案 / 讨论稿。
2. **项目路由优先**：任何写入 `ProjectManager/`、`QA/` 或版本包的产物，都先服从本项目的落点、命名和回写规则；通用 skill 的默认路径不能覆盖项目路径。
3. **skill 只管写作方法**：skill 负责怎么写、怎么验，不负责替代 `pm-write-routing.md`、`document-ownership.md`、`phase-and-subplan-naming.md`。
4. **多重命中时选更具体入口**：QA、版本生命周期、开发文档、文件格式类 skill 都比普通文档写作更具体；普通文档写作只覆盖没有更具体项目流程的文档。

## 路由短表

| 文档 / 场景 | 先读规则 | skill 路由 |
|---|---|---|
| `Overview.md`、Plan README、索引、Issue、Backlog、PM 状态同步 | `pm-write-routing.md` | 不走写作 skill；只按 PM 路由更新 |
| Phase 入口，如 `Plan/vX.Y/phases/phase-N.md` | `phase-and-subplan-naming.md` + `pm-write-routing.md` | 不默认触发 `dev-doc-flow`；若同时要写实施细节，再创建 / 更新 subplan 并触发 `dev-doc-flow` |
| 子计划 / 详细开发文档，如新功能、优化、bugfix 的 `BL-*`、`ISSUE-*` subplan | `document-ownership.md` + `phase-and-subplan-naming.md` + `pm-write-routing.md` | 触发 `dev-doc-flow` |
| 版本启动、版本收口、切版本轴、补齐版本管理包 | `version-lifecycle.md` | 触发 `version-lifecycle-manager` |
| 设计规格、`Specs/<feature-slug>/current.md`、规格索引 | `document-ownership.md` + `Specs/_index.md` + current spec 模板 | 开发期影响先由 `dev-doc-flow` 写入 subplan 的 `Spec impact`；验收后才回写 current spec |
| QA 用例、测试计划、测试执行、回归报告、视觉 / 体验 QA | `QA/qa-leader-canonical.md` | 触发 `qa-leader` |
| Reports 复盘、机制说明、纯调研 / 诊断报告 | `document-ownership.md` + `pm-write-routing.md` | 需要结构化写作时触发通用文档编写 skill（Codex 下为 `doc-coauthoring`） |
| 普通说明文档、流程说明、提案、讨论稿、决策说明 | 若写入项目目录，先读 `document-ownership.md` 和 `pm-write-routing.md` | 触发通用文档编写 skill（Codex 下为 `doc-coauthoring`） |
| `.docx`、`.pptx`、`.pdf`、`.xlsx` 等文件型产物 | 先按内容职责确认项目落点 | 同时触发对应文件类型 skill，处理格式和渲染验证 |

## 常见边界

- `dev-doc-flow` 只用于会指导实现的新功能、优化、bugfix 详细开发文档，或承载这类实施细节的 subplan。
- `phase-N.md` 是阶段入口和状态路由，不替代 subplan，也不默认使用 `dev-doc-flow`。
- Reports / 普通说明 / 流程材料如果不指导代码实现，优先使用通用文档编写 skill；涉及 PM 状态变化时再按 `pm-write-routing.md` 回写入口。
- 若现有规则、skill 描述和实际任务冲突，先说明冲突，给出建议例外和理由，等待确认后再执行。
