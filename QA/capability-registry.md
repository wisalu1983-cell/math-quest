# QA 能力台账

本文件只回答一件事：**当前已有哪类 QA 能力、什么时候该用、从哪里进。**

- 不重复定义 QA 流程；流程与执行顺序以 `QA/qa-leader-canonical.md` 为准
- `qa-leader` 启动时，先按任务类型（自动化 / 视觉 / 拟真人工 / 混合）筛选本表
- 当前已有能力能覆盖时，直接复用；只有本表没有覆盖时，才允许新造脚本或工具

## AI 助手快速入口

| 测试类型 | 命令 | 说明 |
|---|---|---|
| 全部单元测试 | `npm test` | 标准入口，等同 `vitest run`，覆盖 `src/**/*.test.ts` |
| 浏览器测试 | `npx playwright test` | 标准入口，覆盖 `QA/e2e/*.spec.ts`，自动拉起本地 dev server |
| 历史 QA 脚本 | 见下方“仓库内历史 QA 脚本（存档）” | 非标准入口；仅在明确需要复用旧脚本时使用，通常需手动准备 dev server / 造数 |

## 内置 / 全局能力

| 工具 / 能力 | 适用任务类型 | 实际入口 | 输入要求 | 输出位置 | 当前状态 |
|---|---|---|---|---|---|
| Vitest | 自动化 | `npm test`（等同 `npx vitest run`） | 目标模块、相关测试文件、可运行的本地依赖 | 正式 run 结果写入 `QA/runs/<date>-<scope>/`；命令行输出保留在终端 | 已可用（当前全绿：24 files / 524 tests / 0 failed） |
| Playwright Test 框架 | 自动化 / 视觉 / 混合 | `npx playwright test` | 本地可访问页面、视口要求、必要造数 | 运行产物输出到 `QA/artifacts/playwright-test-results/`；命令行结果保留在终端 | 已可用（当前已接通：`QA/e2e/smoke.spec.ts` 1 passed） |
| Playwright API 脚本 | 视觉 / 自动化 | 见“仓库内历史 QA 脚本（存档）”各条目 | 本地 dev server、必要造数、脚本自己的入口参数 | 截图/JSON/报告按脚本各自约定输出 | 仅用于历史脚本（存档），不属于标准 QA 入口 |
| `visual-screenshot-qa` | 视觉 | 全局 skill；同步参考 `QA/sync-qa-skills.ps1` | 目标页面、对照标准、视口要求 | 视觉截图证据 + 当轮 QA 报告 | 已可用（仓库外全局 skill） |
| `agent-as-user-qa` | 拟真人工 / 混合 | 全局 skill；同步参考 `QA/sync-qa-skills.ps1` | 用户画像、场景、批次用例 | PASS/FAIL/RISK 判定 + 截图证据 | 已可用（仓库外全局 skill） |
| `verification-before-completion` | 拟真人工 / 混合 | obra skill | 已有执行记录与证据 | 收尾时的证据纪律，不单独产生产物 | 已可用 |

## 仓库内历史 QA 脚本（存档）

| 工具 / 能力 | 适用任务类型 | 实际入口 | 输入要求 | 输出位置 | 当前状态 |
|---|---|---|---|---|---|
| 视觉修复验证脚本 | 视觉 / 自动化 | `QA/scripts/verify-qa-fixes.py` | 本地 dev server；默认 `http://localhost:5178`；localStorage 造数 | 默认 `QA/artifacts/fix-verify/`；可用环境变量 `QA_OUT_DIR` 覆盖 | 历史脚本（存档）；直接调用 Playwright API，非 Playwright Test 标准入口 |
| 视觉修复验证脚本 v2 | 视觉 / 自动化 | `QA/scripts/verify-qa-fixes-v2.py` | 本地 dev server；默认 `http://localhost:5178`；localStorage 造数 | 默认 `QA/artifacts/fix-verify/`；可用环境变量 `QA_OUT_DIR` 覆盖 | 历史脚本（存档）；直接调用 Playwright API，非 Playwright Test 标准入口 |
| Practice 页面专项验证 | 自动化 / 视觉 | `QA/scripts/verify-practice.py` | 本地 dev server；默认 `http://localhost:5178`；Practice 相关场景 | 默认 `QA/artifacts/fix-verify/`；可用环境变量 `QA_OUT_DIR` 覆盖 | 历史脚本（存档）；直接调用 Playwright API，非 Playwright Test 标准入口 |
| 剩余 UI 问题专项验证 | 自动化 / 视觉 | `QA/scripts/verify-remaining.py` | 本地 dev server；默认 `http://localhost:5178`；首页 / 导航相关场景 | 默认 `QA/artifacts/fix-verify/`；可用环境变量 `QA_OUT_DIR` 覆盖 | 历史脚本（存档）；直接调用 Playwright API，非 Playwright Test 标准入口 |
| B2 进阶截图脚本 | 视觉 / 自动化 | `QA/scripts/b2-advance-screenshot.mjs` | 本地 dev server；注入已通关 A01 的 GameProgress | 当前输出 `QA/artifacts/b2-screenshots/` | 历史脚本（存档）；直接调用 Playwright API，非 Playwright Test 标准入口 |
| ISSUE-057 会话验证脚本 | 视觉 / 自动化 | `QA/scripts/qa-run.mjs` | 本地 dev server；默认 `http://localhost:5177`；预置 `mq_user` / `mq_game_progress` 造数 | 输出 `QA/artifacts/shots/` 与 `QA/artifacts/b3-results.json` | 历史脚本（存档）；直接调用 Playwright API，非 Playwright Test 标准入口 |

## 现成历史脚本（必要时复用）

| 工具 / 能力 | 适用任务类型 | 实际入口 | 输入要求 | 输出位置 | 当前状态 |
|---|---|---|---|---|---|
| 全量回归脚本 | 混合 / 全量回归 | `QA/runs/2026-04-19-full-regression/full-regression.mjs` | 本地 dev server；Fresh / Advance / Rank 三条路径可执行 | 产物写入对应 run 自身目录；复用前先确认输出路径与断言仍适用 | 已存在，复用前先核对 |
| v2.1 冒烟测试脚本 | 自动化 / 冒烟 | `QA/runs/2026-04-17-v2-smoke/smoke.py` | 本地 dev server；能进入 Campaign Map 与 Practice | 产物写入对应 run 自身目录；复用前先确认题型范围仍适用 | 已存在，复用前先核对 |
