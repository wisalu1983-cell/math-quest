# QA 体系制度升级总结

**日期**：2026-04-26
**分支**：`codex/qa-system-upgrade`
**工作区**：`E:\Projects\MathQuest\.worktrees\qa-system-upgrade`
**结论**：PASS，建议提交给 QA 专家评审。

## 本轮变更

| 类别 | 文件 |
|---|---|
| QA 制度源 | `QA/qa-leader-canonical.md` |
| 方法论说明 | `QA/qa-system-methodology.md` |
| 能力台账 | `QA/capability-registry.md` |
| 专业模板 | `QA/templates/test-cases-professional-template.md` |
| 适配件 | `.agents/skills/qa-leader/SKILL.md`、`.claude/skills/qa-leader/SKILL.md`、`.cursor/rules/qa-leader.mdc` |
| 同步工具 | `QA/scripts/sync-qa-leader-adapters.ps1` |
| Git 归档规则 | `.gitignore`、`QA/README.md` |
| 本轮正式 QA 产物 | `QA/runs/2026-04-26-qa-system-upgrade/` |

## 制度短板修复

| 原短板 | 本轮修复 |
|---|---|
| 测试用例过于简单 | 新增 L2/L3 专业结构：Test Basis、Risk、Technique、Oracle、Coverage Matrix、Exit Criteria、Residual Risk |
| QA 情境没有分级 | 新增 L0 Smoke、L1 Standard、L2 Professional、L3 Release Gate |
| 工具入口分散 | `QA/capability-registry.md` 登记标准入口、历史脚本、模板和同步工具 |
| 多 agent QA 规则可能漂移 | canonical 作为唯一制度源，脚本同步 Cursor / Claude Code / Codex 三入口 |
| 正式 QA 结论被 `.gitignore` 阻断 | `.gitignore` 允许 `QA/runs/**/*.md` 和正式脚本入库 |
| 过程产物可能污染仓库 | 截图、视频、trace、raw JSON、Playwright report、大型 artifacts 继续忽略 |
| 安全/无障碍缺少 gate | canonical 和 registry 增加 NIST / OWASP / WCAG / Xbox 可访问性最小检查 |

## 验证结果

| 验证项 | 结果 |
|---|---|
| QA Leader 适配件 DryRun | PASS：`changed: 0 / unchanged: 3 / total: 3` |
| 旧 `test-results/{phase}` 路径回归 | PASS：未发现 |
| `.gitignore` 正式 QA Markdown / 脚本 | PASS：未被忽略 |
| `.gitignore` 截图 / raw JSON artifact | PASS：继续忽略 |
| `git diff --check` | PASS |
| `npm test -- --run` | PASS：55 files / 713 tests |

## 残余风险

| 风险 | 判定 | 处理 |
|---|---|---|
| 历史 run 中仍有旧格式简单用例 | 接受 | 保留历史；后续新 run 使用新版模板 |
| 安全/无障碍目前以制度和 checklist 为主 | RISK | 后续账号、同步、release gate 时补自动化工具 |
| QA 专家评审可能要求调整字段或流程重量 | 接受 | 已将方法论、用例、结果集中在本 run 目录，便于逐项审阅 |

## 入库口径

正式 QA 体系、工具、测试工作生产资料和测试结论可以同步。截图、视频、trace、raw JSON、临时诊断输出和大型 artifacts 默认不入库。若个别小型证据需要长期保留，必须在 summary 中标注为“长期证据”。
