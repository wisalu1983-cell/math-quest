# 视觉与移动端结果

**执行日期**：2026-04-29
**范围**：v0.5 Phase 3 键盘 UI、反馈面板、错题本
**结论**：PASS / RISK。移动模拟与桌面断点通过；真实 iOS / Android 设备未覆盖。

## 截图证据

本轮截图保留在 ignored process artifacts 中：

- `QA/runs/2026-04-29-v05-phase3-input-feedback-qa/artifacts/mobile-keyboard-phase3.png`
- `QA/runs/2026-04-29-v05-phase3-input-feedback-qa/artifacts/expression-keyboard-all-enabled.png`
- `QA/runs/2026-04-29-v05-phase3-input-feedback-qa/artifacts/structured-failure-feedback.png`
- `QA/runs/2026-04-29-v05-phase3-input-feedback-qa/artifacts/decimal-training-failure-feedback.png`
- `QA/runs/2026-04-29-v05-phase3-input-feedback-qa/artifacts/wrong-book-structured-failure.png`
- `QA/runs/2026-04-29-v05-phase3-input-feedback-qa/artifacts/input-flow-matrix-last-feedback.png`

## 键盘布局检查

| 检查项 | 实际结果 | 判定 |
|---|---|---|
| 按键数量 | 20 | PASS |
| 顺序 | `1 2 3 = 删除 / 4 5 6 + − / 7 8 9 × ÷ / . 0 x ( )` | PASS |
| 左右列宽 | 左三列平均 59.9px，右两列平均 43.1px | PASS |
| 单键高度 | 40px | PASS |
| 底部留白 | wrapper padding-bottom 12px；键盘面板距 viewport 底部 107.1px | PASS |
| 答题区空间 | keyboard wrapper 214px；390x844 下保留约 74.6% 非键盘区域 | PASS |
| active slot 文案 | 仅存在 `.sr-only` 的 `aria-live`；非 sr-only 命中 0 | PASS |

## 可用 / 不可用状态

| 场景 | 实际结果 | 判定 |
|---|---|---|
| digit slot active | 数字和删除可用；`= + − × ÷ . x ( )` disabled | PASS |
| enabled 样式 | solid border、opacity 1、数字白底 / 删除 danger 浅底 | PASS |
| disabled 样式 | dashed border、opacity 0.4、灰色文本、`bg-card-2` | PASS |
| expression slot active | 20 个键全部可用 | PASS |
| 符号组色彩 | symbol 为主色浅底 `rgb(255, 240, 235)`、主色文字 `rgb(212, 82, 26)` | PASS |
| 删除键独立色彩 | danger 浅底 `rgb(255, 245, 245)`、danger 文字 `rgb(255, 107, 107)` | PASS |

## `x` / `×` 字体

| 按键 | 字体 | 样式 | 判定 |
|---|---|---|---|
| `x` | `"Times New Roman", Georgia, serif` | italic, 22px | PASS |
| `×` | `Nunito, PingFang SC, Microsoft YaHei UI, sans-serif` | normal, 18px | PASS |

## 移动端键盘策略

| 检查项 | 实际结果 | 判定 |
|---|---|---|
| 真实输入控件 | `readOnly=true` | PASS |
| `inputMode` | `none` | PASS |
| 可见系统键盘按钮 | 未发现 `系统键盘 / 原生键盘 / 呼出键盘 / Done / Next / 下一步` | PASS |
| DEV 按钮 | dev 环境右下角可见 `DEV`，不属于产品 UI | Observation |

## 桌面断点回归

| 检查项 | 实际结果 | 判定 |
|---|---|---|
| 输入控件 | `readOnly=false`，`inputMode=numeric` | PASS |
| 内置键盘 | 作为辅助面板可见 | PASS |
| 依据 | BL-011 §3.3：桌面可保留真实输入焦点和硬键盘输入；内置键盘可作为辅助操作面板 | PASS |

## 小数乘法训练格错因

| 检查项 | 实际结果 | 判定 |
|---|---|---|
| 构造题 | `1.2 × 0.3`，最终答数填 `0.36`，小数点移动位数故意填 `1` | PASS |
| 反馈摘要 | 展示 `未通过原因：小数训练格有错误。` | PASS |
| 具体错因 | 展示 `小数点移动位数错误` | PASS |
| 用户值 / 正确值 | 展示 `你填` 和 `正确是`，截图已保存 | PASS |

## 残余风险

- 真实 Chrome Android / Safari iOS 未在当前环境覆盖；本轮只完成 Chromium mobile emulation。若作为 release gate，应补真实设备或远程浏览器证据。
