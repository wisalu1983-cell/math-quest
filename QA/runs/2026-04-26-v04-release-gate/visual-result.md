# v0.4 Release Gate Visual QA Result

**执行日期**：2026-04-26
**设计规格来源**：`ProjectManager/Specs/2026-04-14-ui-redesign-spec.md`、`ProjectManager/Plan/v0.4/phases/phase-1.md`、`ProjectManager/Plan/v0.4/subplans/2026-04-25-bl-005-乘法竖式与Phase1修复.md`、`src/styles/globals.css`
**校验页面 / 组件**：学习首页、Practice 答题页、legacy single-line `VerticalCalcBoard`、compare tip。
**工具**：Playwright 临时执行脚本 `artifacts/manual-visual-release-gate.mjs`；截图与 raw JSON 位于 `artifacts/`。
**结论**：PASS（2026-04-26 补测后）。首轮发现 `X-002` 单行竖式已知操作数低对比并登记 `ISSUE-065`；修复后真实操作数 / 运算符已改为高对比正文色，空白对齐格仍保持浅色占位。

## 摘要

| 维度 | 校验点数 | PASS | FAIL | WARN | SKIP |
|---|---:|---:|---:|---:|---:|
| Token 一致性 | 1 | 1 | 0 | 0 | 0 |
| 多视口适配 | 5 | 5 | 0 | 0 | 0 |
| 视觉还原 / 可读性 | 3 | 3 | 0 | 0 | 0 |
| 交互状态 | 2 | 2 | 0 | 0 | 0 |
| **总计** | **11** | **11** | **0** | **0** | **0** |

## 详细结果

### Token 一致性

| ID | 校验点 | Spec 值 / 预期 | 实际值 | 判定 | 证据 |
|---|---|---|---|---|---|
| X-005 | 阳光版主色和背景 token | `--color-primary #FF6B35`，`--color-bg #FFF8F3` | `#FF6B35` / `#FFF8F3` | PASS | `artifacts/manual-visual-results.json` |

### 多视口适配

| ID | 校验点 | Spec 值 / 预期 | 实际值 | 判定 | 证据 |
|---|---|---|---|---|---|
| X-001-home-390 | 首页 390px 无横向溢出 | 关键内容不溢出，不遮挡 | `scrollWidth=390`, `viewport=390` | PASS | `artifacts/U-001-after-home.png` |
| X-001-practice-375 | Practice 375px 无横向溢出 | 竖式卡片在手机竖屏可容纳 | `scrollWidth=375`, `viewport=375` | PASS | `artifacts/X-001-practice-375.png` |
| X-001-practice-390 | Practice 390px 无横向溢出 | 同上 | `scrollWidth=390`, `viewport=390` | PASS | `artifacts/X-001-practice-390.png` |
| X-001-practice-768 | Practice 768px 无横向溢出 | 平板布局不拉裂 | `scrollWidth=768`, `viewport=768` | PASS | `artifacts/X-001-practice-768.png` |
| X-001-practice-1280 | Practice 1280px 无横向溢出 | 桌面布局居中且不溢出 | `scrollWidth=1280`, `viewport=1280` | PASS | `artifacts/X-001-practice-1280.png` |

### 视觉还原 / 可读性

| ID | 校验点 | Spec 值 / 预期 | 实际值 | 判定 | 证据 |
|---|---|---|---|---|---|
| X-002 | 单行竖式已知操作数可读性 | `BL-005.1` / Phase 1 T6：竖式数字 / 符号使用高对比 token，不使用浅灰主体数字 | 补测后 `999` / `888` / `+` 使用高对比正文色；空白对齐格仍为浅色占位 | PASS | `artifacts/X-002-issue-065-before-after.png`; `artifacts/X-002-issue-065-after.png`; `QA/e2e/issue-065-vertical-operand-contrast.spec.ts` |
| X-003 | 低档过程错误反馈可发现 | 失败原因应清楚，不只显示技术状态 | 统一失败面板有“未通过原因：进位/退位格填写错误” | PASS | `artifacts/I-001-low-unified-process-fail.png` |
| X-004 | 中档过程提示可读 | 过程提示只在成功面板当前题提示 | 黄色边框提示显示“过程有误，但本题答案正确，已通过” | PASS | `artifacts/I-002-mid-warning-pass.png` |

### 交互状态

| ID | 校验点 | Spec 值 / 预期 | 实际值 | 判定 | 证据 |
|---|---|---|---|---|---|
| X-006 | 低档焦点状态 | 填完个位答案后进入十位进位格 | 进位格 active 样式可见 | PASS | `artifacts/I-001-low-focus-process.png` |
| X-007 | compare tip 视觉可达 | 题干阶段方法提示可见 | tip 显示在题卡下方，文案清楚 | PASS | `artifacts/U-003-compare-tip-visible.png` |

## 补测记录

| 校验点 | 首轮结果 | 修复后结果 | 证据 |
|---|---|---|---|
| `X-002` 单行竖式已知操作数可读性 | FAIL：真实数字复用 `.digit-cell-empty`，呈浅灰低对比 | PASS：真实 `999` / `888` / `+` 为正文黑色，空白占位格仍为浅灰 | `artifacts/X-002-issue-065-before-after.png`；`npx playwright test QA/e2e/issue-065-vertical-operand-contrast.spec.ts` |

## FAIL 项汇总

无。

## 缺陷分流

| 类型 | 数量 | 处理 |
|---|---:|---|
| FAIL | 0 | `ISSUE-065` 已修复并关闭于 `ProjectManager/ISSUE_LIST.md` |
| RISK | 0 | 无 |
| Observation | 0 | 无 |
