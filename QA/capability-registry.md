# QA 能力台账

本文件只回答一件事：**当前已有哪类 QA 能力、什么时候该用、从哪里进。**

- 不重复定义 QA 流程；流程与执行顺序以 `QA/qa-leader-canonical.md` 为准
- `qa-leader` 启动时，先按任务类型（自动化 / 视觉 / 拟真人工 / 混合）筛选本表
- 当前已有能力能覆盖时，直接复用；只有本表没有覆盖时，才允许新造脚本或工具

## 内置 / 全局能力

| 工具 / 能力 | 适用任务类型 | 实际入口 | 输入要求 | 输出位置 | 当前状态 |
|---|---|---|---|---|---|
| Vitest | 自动化 | `npx vitest run` | 目标模块、相关测试文件、可运行的本地依赖 | 正式 run 结果写入 `QA/runs/<date>-<scope>/`；命令行输出保留在终端 | 已可用 |
| Playwright | 自动化 / 视觉 / 混合 | `npx playwright test`，或调用仓库内 Playwright/脚本入口 | 本地可访问页面、视口要求、必要造数 | 截图/JSON/报告优先写入当前 run 目录 `artifacts/` | 已可用 |
| `visual-screenshot-qa` | 视觉 | 全局 skill；同步参考 `QA/sync-qa-skills.ps1` | 目标页面、对照标准、视口要求 | 视觉截图证据 + 当轮 QA 报告 | 已可用（仓库外全局 skill） |
| `agent-as-user-qa` | 拟真人工 / 混合 | 全局 skill；同步参考 `QA/sync-qa-skills.ps1` | 用户画像、场景、批次用例 | PASS/FAIL/RISK 判定 + 截图证据 | 已可用（仓库外全局 skill） |
| `verification-before-completion` | 拟真人工 / 混合 | obra skill | 已有执行记录与证据 | 收尾时的证据纪律，不单独产生产物 | 已可用 |

## 仓库内可复用 QA 脚本

| 工具 / 能力 | 适用任务类型 | 实际入口 | 输入要求 | 输出位置 | 当前状态 |
|---|---|---|---|---|---|
| 视觉修复验证脚本 | 视觉 / 自动化 | `QA/scripts/verify-qa-fixes.py` | 本地 dev server；默认 `http://localhost:5178`；localStorage 造数 | 默认 `QA/artifacts/fix-verify/`；可用环境变量 `QA_OUT_DIR` 覆盖 | 已归位，可复用 |
| 视觉修复验证脚本 v2 | 视觉 / 自动化 | `QA/scripts/verify-qa-fixes-v2.py` | 本地 dev server；默认 `http://localhost:5178`；localStorage 造数 | 默认 `QA/artifacts/fix-verify/`；可用环境变量 `QA_OUT_DIR` 覆盖 | 已归位，可复用 |
| Practice 页面专项验证 | 自动化 / 视觉 | `QA/scripts/verify-practice.py` | 本地 dev server；默认 `http://localhost:5178`；Practice 相关场景 | 默认 `QA/artifacts/fix-verify/`；可用环境变量 `QA_OUT_DIR` 覆盖 | 已归位，可复用 |
| 剩余 UI 问题专项验证 | 自动化 / 视觉 | `QA/scripts/verify-remaining.py` | 本地 dev server；默认 `http://localhost:5178`；首页 / 导航相关场景 | 默认 `QA/artifacts/fix-verify/`；可用环境变量 `QA_OUT_DIR` 覆盖 | 已归位，可复用 |
| B2 进阶截图脚本 | 视觉 / 自动化 | `QA/scripts/b2-advance-screenshot.mjs` | 本地 dev server；注入已通关 A01 的 GameProgress | 当前输出 `QA/b2-screenshots/`，后续正式归档时再并入 run 目录 | 已存在，可复用 |

## 现成历史脚本（必要时复用）

| 工具 / 能力 | 适用任务类型 | 实际入口 | 输入要求 | 输出位置 | 当前状态 |
|---|---|---|---|---|---|
| 全量回归脚本 | 混合 / 全量回归 | `QA/runs/2026-04-19-full-regression/full-regression.mjs` | 本地 dev server；Fresh / Advance / Rank 三条路径可执行 | 产物写入对应 run 自身目录；复用前先确认输出路径与断言仍适用 | 已存在，复用前先核对 |
| v2.1 冒烟测试脚本 | 自动化 / 冒烟 | `QA/runs/2026-04-17-v2-smoke/smoke.py` | 本地 dev server；能进入 Campaign Map 与 Practice | 产物写入对应 run 自身目录；复用前先确认题型范围仍适用 | 已存在，复用前先核对 |
