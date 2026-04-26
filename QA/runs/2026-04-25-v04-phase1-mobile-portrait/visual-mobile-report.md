# v0.4 Phase 1 移动端竖屏视觉 QA

**执行日期**：2026-04-25  
**范围**：真实游戏练习页中的 `MultiplicationVerticalBoard`  
**工具**：Playwright / headless Chromium  
**规格来源**：

- `src/styles/globals.css`：阳光版 v5 token（暖白背景、白卡片、橙色主操作、高对比正文）
- `ProjectManager/Plan/v0.4/subplans/2026-04-25-bl-005-multiplication-vertical-board.md`：乘法竖式交互与移动端不挤压要求
- `ProjectManager/Plan/v0.4/phases/phase-1.md`：Phase 1 收尾条件

## 摘要

| 维度 | 判定 | 证据 |
|---|---|---|
| 多位整数乘法 390px 竖屏 | PASS | `artifacts/mobile-mult-integer.png` |
| 小数乘法 390px 竖屏 | PASS | `artifacts/mobile-mult-decimal.png` |
| 多位整数乘法 375px 竖屏 | PASS | `artifacts/mobile-375-mult-integer.png` |
| 小数乘法 375px 竖屏 | PASS | `artifacts/mobile-375-mult-decimal.png` |
| 页面级横向滚动 | PASS | 375px / 390px 均 `scrollX = 0`，无越界元素 |

## 发现与修复

| 项目 | 结果 |
|---|---|
| 初始发现 | 小数乘法底部 `最终答数` 输入框在 390px 竖屏下撑出右侧边界。 |
| 修复 | `最终答数` 行增加 `min-w-0`，输入框改为 `w-0 min-w-0 flex-1`，允许在 flex/grid 容器内正确收缩。 |
| 回归 | 390px 和 375px 真实练习页复测通过。 |

## 关键指标

| 视口 | 场景 | `documentScrollWidth` | `documentClientWidth` | `scrollX after right scroll` | 结论 |
|---|---|---:|---:|---:|---|
| 390x844 | 多位整数乘法 | 390 | 390 | 0 | PASS |
| 390x844 | 小数乘法 | 390 | 390 | 0 | PASS |
| 375x812 | 多位整数乘法 | 375 | 375 | 0 | PASS |
| 375x812 | 小数乘法 | 375 | 375 | 0 | PASS |

## 结论

Phase 1 乘法竖式模块在手机竖屏下可读、可操作，无页面级横向溢出；此前“真实移动端截图缺失”的残余风险已补齐。
