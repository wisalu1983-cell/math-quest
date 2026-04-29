# QA 总结

**执行日期**：2026-04-29
**范围**：v0.5 Phase 3 `BL-011` 计算输入内置键盘 + `ISSUE-067` 结构化错因反馈
**结论**：有条件通过。当前工具覆盖下未发现新 FAIL；小数乘法训练格错因端到端证据已补齐；真实 Chrome Android / Safari iOS 设备验证已改为发布后在线上环境验收。

## 结果汇总

| 层级 | 结论 | 证据 |
|---|---|---|
| 测试用例设计 | PASS | `test-cases-v1.md` 覆盖键盘 UI、输入流、错因反馈、数据契约、回归和安全最小检查 |
| Code Review | PASS | `code-review-result.md`，未发现阻塞缺陷 |
| 自动化测试 | PASS / RISK | `automated-result.md`，Vitest/build/Playwright/scoped lint/audit 通过；全仓 lint 为历史 RISK |
| 视觉 QA | PASS / RISK | `visual-result.md`，移动模拟通过；真实设备未覆盖 |
| 拟真人工 QA | PASS | `manual-result.md`，9/9 PASS |
| 真实设备待补 | DEFERRED | `real-device-checklist.md`，已改为发布后在线上环境验收 |

## 关键验收结论

- 键盘已满足 5 列 x 4 行固定布局：`1 2 3 = 删除 / 4 5 6 + − / 7 8 9 × ÷ / . 0 x ( )`。
- 左三列与右两列宽度有差异：左侧平均 59.9px，右侧平均 43.1px。
- 可用 / 不可用状态清晰：可用为 solid + opacity 1；不可用为 dashed + opacity 0.4 + 灰色。
- 数字区、符号区、删除键三组视觉差异成立；`x` 字体与 `×` 已明显区分。
- 手机模拟下不显示系统键盘入口，真实输入为 `readOnly=true`、`inputMode=none`。
- 普通数字、商余数、多空、等式、训练格、legacy 竖式、多行乘法都能通过内置键盘完成关键路径。
- 多行乘法“最终答案对、过程错”会进入结构化过程失败，并在反馈页和错题本展示 `部分积填写错误`。
- 小数乘法“训练格错、最终答数对”已通过浏览器端到端验证，反馈页展示 `小数点移动位数错误`、用户值和正确值。
- `failureDetail` 在 store / sync / wrongbook 链路中保留。

## 自动化摘要

| 项目 | 结果 |
|---|---|
| Vitest | 59 files / 734 tests passed |
| Playwright e2e | 13 tests passed |
| Build | PASS，仅 Vite chunk size warning |
| Scoped eslint | PASS |
| Full lint | RISK，146 historical problems |
| High audit | PASS，0 vulnerabilities |
| diff check | PASS |

## 缺陷处理

| 类型 | 数量 | 处理 |
|---|---:|---|
| FAIL | 0 | 无需新增 `ProjectManager/ISSUE_LIST.md` |
| RISK | 1 | 全仓 lint 历史债 |
| DEFERRED | 1 | 真实 Android Chrome / iOS Safari 验证转为发布后线上验收 |
| Observation | 1 | dev 环境右下角 `DEV` 按钮可见，不属于产品 UI |

## Gate 建议

Phase3 当前可继续进入用户确认 / 收口回写。真实 Chrome Android 与 Safari iOS 设备验证不再卡本地环境，发布后在在线环境按 `real-device-checklist.md` 补证并关闭。
