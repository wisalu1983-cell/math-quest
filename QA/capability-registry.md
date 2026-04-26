# QA 能力台账

本文件只回答一件事：**当前已有哪类 QA 能力、什么时候该用、从哪里进。**

- 流程与执行顺序以 `QA/qa-leader-canonical.md` 为准
- 方法论背景见 `QA/qa-system-methodology.md`
- `qa-leader` 启动时，先按任务类型和 QA 深度筛选本表
- 当前能力能覆盖时直接复用；只有本表没有覆盖时才新造脚本或工具

## AI 助手快速入口

| 测试类型 | 入口 | 说明 |
|---|---|---|
| 单元 / 策略 / 生成器 | `npm test` | 标准入口，等同 `vitest run` |
| 浏览器 / E2E / 视觉基础 | `npx playwright test` | 标准入口，覆盖 `QA/e2e/*.spec.ts`，自动拉起 dev server |
| 生产构建 | `npm run build` | 发布前或高风险改动后执行 |
| 变更范围 lint | `npx eslint <files>` | 当前全仓 lint 有历史债务时使用 scoped gate |
| PM 一致性 | `npx tsx scripts/pm-sync-check.ts` | 仅在 PM 规则触发时运行 |
| 专业用例模板 | `QA/templates/test-cases-professional-template.md` | L2 / L3 测试设计起点 |

## 测试设计 / 管理能力

| 能力 | 适用任务类型 | 实际入口 | 输入要求 | 输出位置 | 当前状态 |
|---|---|---|---|---|---|
| QA canonical | 制度 / 混合 | `QA/qa-leader-canonical.md` | QA 任务范围、阶段情境 | 不直接产生产物 | 已可用 |
| QA 方法论说明 | 制度 / 审计 | `QA/qa-system-methodology.md` | 审阅 QA 体系时读取 | 不直接产生产物 | 已可用 |
| 专业测试用例模板 | L2 / L3 | `QA/templates/test-cases-professional-template.md` | Test basis、风险、用户画像 | `QA/runs/<date>-<scope>/test-cases-vN.md` | 已可用 |
| QA Leader 适配件同步 | 制度 / 工具变更 | `QA/scripts/sync-qa-leader-adapters.ps1` | canonical 已更新 | `.agents` / `.claude` / `.cursor` 适配件 | 已可用 |
| QA 自检用例 | 制度 / 工具变更 | `QA/qa-system-self-test.md` | 修改 skill / rule / registry 后 | 自检报告或命令输出 | 已存在，内容需随本轮制度升级后续补测 |

## 自动化能力

| 工具 / 能力 | 适用任务类型 | 实际入口 | 输入要求 | 输出位置 | 当前状态 |
|---|---|---|---|---|---|
| Vitest | 自动化 / L1-L3 | `npm test` 或 `npm test -- <files> --run` | 目标模块、可运行依赖 | 命令输出；正式摘要写入 `QA/runs` | 已可用 |
| Playwright Test | 自动化 / 视觉 / 混合 | `npx playwright test` 或指定 `QA/e2e/*.spec.ts` | 本地页面、视口、夹具 | `QA/artifacts/playwright-test-results/`；正式摘要写入 `QA/runs` | 已可用 |
| TypeScript + Vite build | 发布 / 高风险回归 | `npm run build` | 依赖安装完成 | 命令输出；正式摘要写入 `QA/runs` | 已可用 |
| ESLint scoped gate | Code Review / 自动化 | `npx eslint <changed-files>` | 变更文件列表 | 命令输出 | 已可用；全仓 lint 有历史债务时优先 scoped |
| PM sync check | PM 一致性 | `npx tsx scripts/pm-sync-check.ts` | 多源 PM 文档改动 | 命令输出 | 已可用，按 PM 规则触发 |

## 视觉 / 拟真人工 / 无障碍能力

| 工具 / 能力 | 适用任务类型 | 实际入口 | 输入要求 | 输出位置 | 当前状态 |
|---|---|---|---|---|---|
| `visual-screenshot-qa` | 视觉 / UI 回归 | 全局 skill；同步参考 `QA/sync-qa-skills.ps1` | 目标页面、设计规格、视口 | 视觉报告；截图默认 artifacts | 已可用 |
| `agent-as-user-qa` | 拟真人工 / 体验 | 全局 skill；同步参考 `QA/sync-qa-skills.ps1` | 用户画像、charter、用例批次 | PASS/FAIL/RISK 报告；截图默认 artifacts | 已可用 |
| WCAG / Xbox 可访问性检查 | 无障碍 / 儿童可用性 | QA canonical checklist + Playwright / 人工走查 | 视口、焦点路径、触摸/键盘路径 | `manual-result.md` 或 `visual-result.md` | 制度已纳入；自动化工具待补强 |

## 安全 / 隐私能力

| 工具 / 能力 | 适用任务类型 | 实际入口 | 输入要求 | 输出位置 | 当前状态 |
|---|---|---|---|---|---|
| 依赖风险检查 | 安全 / release | `npm audit` | 依赖安装完成 | 命令输出；summary 记录结论 | 已可用 |
| Secret / env 检查 | 安全 / release / account-sync | Code Review + `rg` 检查 `.env`、key、token | 变更范围、配置文件 | code-review-result.md | 手工可用，自动化待补强 |
| OWASP / NIST 最小清单 | 安全 / account-sync | `QA/qa-leader-canonical.md` §9 | 账号、同步、远端服务、用户数据变更 | QA summary / security result | 制度已纳入 |

## 仓库内历史 QA 脚本（存档）

这些脚本直接调用 Playwright API 或旧夹具，默认不是标准入口。复用前必须确认输出路径、dev server、造数和断言仍适用。

| 工具 / 能力 | 适用任务类型 | 实际入口 | 输入要求 | 输出位置 | 当前状态 |
|---|---|---|---|---|---|
| 视觉修复验证脚本 | 视觉 / 自动化 | `QA/scripts/verify-qa-fixes.py` | 本地 dev server，默认 `http://localhost:5178` | 默认 `QA/artifacts/fix-verify/` | 历史脚本 |
| 视觉修复验证脚本 v2 | 视觉 / 自动化 | `QA/scripts/verify-qa-fixes-v2.py` | 本地 dev server，默认 `http://localhost:5178` | 默认 `QA/artifacts/fix-verify/` | 历史脚本 |
| Practice 页面专项验证 | 自动化 / 视觉 | `QA/scripts/verify-practice.py` | 本地 dev server，Practice 场景 | 默认 `QA/artifacts/fix-verify/` | 历史脚本 |
| 剩余 UI 问题专项验证 | 自动化 / 视觉 | `QA/scripts/verify-remaining.py` | 本地 dev server，首页 / 导航场景 | 默认 `QA/artifacts/fix-verify/` | 历史脚本 |
| B2 进阶截图脚本 | 视觉 / 自动化 | `QA/scripts/b2-advance-screenshot.mjs` | 本地 dev server，注入进度 | `QA/artifacts/b2-screenshots/` | 历史脚本 |
| ISSUE-057 会话验证脚本 | 视觉 / 自动化 | `QA/scripts/qa-run.mjs` | 本地 dev server，预置 localStorage | `QA/artifacts/shots/` 与 JSON | 历史脚本 |

## 现成历史脚本（必要时复用）

| 工具 / 能力 | 适用任务类型 | 实际入口 | 输入要求 | 输出位置 | 当前状态 |
|---|---|---|---|---|---|
| 全量回归脚本 | 混合 / 全量回归 | `QA/runs/2026-04-19-full-regression/full-regression.mjs` | 本地 dev server；Fresh / Advance / Rank 路径可执行 | 对应 run 目录；截图默认 artifacts | 已存在，复用前先核对 |
| v2.1 冒烟测试脚本 | 自动化 / 冒烟 | `QA/runs/2026-04-17-v2-smoke/smoke.py` | 本地 dev server；Campaign Map 与 Practice 可达 | 对应 run 目录 | 已存在，复用前先核对 |

## 入库规则提示

正式测试体系、工具、测试工作生产资料和测试结论可以同步入库；截图、视频、trace、raw JSON、临时诊断输出和大体积 artifacts 默认忽略。具体以 `.gitignore` 和 `QA/qa-leader-canonical.md` §11 为准。
