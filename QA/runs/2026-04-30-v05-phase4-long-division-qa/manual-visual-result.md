# Manual / Visual Result · v0.5 Phase 4 BL-010 长除法 UI

**日期**：2026-04-30  
**结果**：PASS，真实设备补验 DEFERRED。

## Visual Evidence

| 视口 | 证据 | 观察 |
|---|---|---|
| 375x812 mobile | `artifacts/long-division-mobile-375.png` | 长除法板可见；内置键盘贴底；题干、竖式板、按键没有文本重叠。 |
| 390x844 mobile | `artifacts/long-division-mobile-390.png` | 长除法板可见；内置键盘贴底；active slot 焦点明确。 |
| 1024x768 desktop | `artifacts/long-division-desktop-1024.png` | 截取长除法板区域；结构非空、商位 / 乘积 / 余数格可辨识。 |

## Interaction Review

| 项 | 结果 | 证据 |
|---|---|---|
| 商位输入后自动进入乘积格 | PASS | `QA/e2e/phase4-long-division.spec.ts` |
| 乘积输入后自动进入余数与落位格 | PASS | `QA/e2e/phase4-long-division.spec.ts` |
| 正确过程提交后进入成功反馈 | PASS | `QA/e2e/phase4-long-division.spec.ts` |
| 过程错误进入结构化失败反馈 | PASS | `QA/e2e/phase4-long-division.spec.ts` |
| 过程错误不泄露中间正确值 | PASS | `QA/e2e/phase4-long-division.spec.ts` |

## Deferred

- 未在真实 Android Chrome / iOS Safari 设备上执行；沿 Phase 3 已确认口径，真实设备证据在发布后线上环境补验。
- 本轮为 Phase4 L2 功能 QA；v0.5 Release Gate 仍需独立 L3 全量回归。
