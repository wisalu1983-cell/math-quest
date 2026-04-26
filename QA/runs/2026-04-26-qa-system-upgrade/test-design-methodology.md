# QA 体系制度升级测试设计方法

**执行日期**：2026-04-26
**范围**：QA canonical、能力台账、模板、适配件同步、Git 归档规则
**QA 深度**：L2 Professional
**方法论来源**：`QA/qa-system-methodology.md`

## 设计目标

本轮不是普通功能 QA，而是 QA 体系本身的制度迭代。因此测试设计重点不是“页面是否能点”，而是确认后续所有 agent 和人工 QA 都会获得更专业、更一致、可审计的工作入口。

## Test Basis

| 来源 | 用途 |
|---|---|
| `QA/qa-system-methodology.md` | 外部方法论依据与本项目适配原则 |
| `QA/qa-leader-canonical.md` | QA 编排制度源 |
| `QA/capability-registry.md` | 现有工具、脚本、模板入口 |
| `QA/templates/test-cases-professional-template.md` | L2/L3 专业测试用例模板 |
| `.agents/skills/qa-leader/SKILL.md` | Codex QA Leader 入口 |
| `.claude/skills/qa-leader/SKILL.md` | Claude Code QA Leader 入口 |
| `.cursor/rules/qa-leader.mdc` | Cursor QA Leader 入口 |
| `.gitignore` | 正式 QA 资料与过程 artifact 的入库边界 |

## 风险驱动

本轮优先覆盖四类风险：

| Risk | 说明 | 设计响应 |
|---|---|---|
| R1 | 测试用例继续退化为简单功能清单 | canonical 和模板强制 Test Basis / Risk / Technique / Oracle / Coverage Matrix |
| R2 | 不同 agent 环境读取到不同 QA 规则 | 新增同步脚本并用 DryRun 验证三适配件一致 |
| R3 | Git 继续忽略正式结论或误收大产物 | `.gitignore` 改为允许正式 Markdown / 脚本，继续忽略 artifacts |
| R4 | 工具入口未登记导致重复造轮子 | capability registry 记录标准入口、模板和同步脚本 |

## 测试技术

| 技术 | 本轮用途 |
|---|---|
| Checklist | 检查 canonical、registry、模板是否包含制度必备项 |
| Regression | 检查旧 `test-results/{phase}` 路径是否从制度入口移除 |
| Tool check | 运行同步脚本 DryRun 和 Git ignore 判定 |
| Baseline automation | 运行项目单测，确认制度变更未破坏现有测试基线 |
| Traceability matrix | 将制度风险映射到测试用例和正式结论 |

## Exit Criteria

- Q-CAN / Q-REG / Q-ADP / Q-GIT P0 用例全部 PASS。
- QA Leader 三个适配件 DryRun 显示 `changed: 0 / unchanged: 3 / total: 3`。
- `QA/runs/**/*.md` 和正式 QA 脚本可入库。
- `QA/runs/**/artifacts/` 下截图、raw JSON 等过程产物继续被忽略。
- `git diff --check` 无 whitespace error。
- `npm test -- --run` 通过。

## Residual Risk

| 风险 | 状态 | 后续处理 |
|---|---|---|
| 历史 QA 用例仍有简单版本 | 接受 | 保留历史，不回写覆盖；后续真实 QA run 按新版模板新增 vN |
| 安全/无障碍自动化能力仍偏手工 | RISK | 已纳入制度和台账，后续账号/同步/release 任务再补工具化 |
| QA 专家可能提出更重型流程要求 | 接受 | 本体系定位小型团队轻量专业化，后续按评审意见增量调整 |
