# 自动化测试结果

**执行日期**：2026-04-29
**范围**：v0.5 Phase 3 输入键盘与结构化错因反馈
**结论**：PASS / RISK。Phase3 变更范围自动化通过；全仓 lint 仍有既有历史债。

## 命令结果

| 命令 | 结果 | 证据 |
|---|---|---|
| `npm test -- --run` | PASS | 59 files / 734 tests passed |
| `npx eslint <Phase3 changed files>` | PASS | 无输出，exit 0 |
| `npm run build` | PASS | TypeScript + Vite build exit 0；仅 Vite chunk size warning |
| `npx playwright test` | PASS | 13 tests passed |
| `npm audit --audit-level=high` | PASS | found 0 vulnerabilities |
| `git diff --check` | PASS | 无输出，exit 0 |
| `npm run lint` | RISK | 146 problems，集中在既有非 Phase3 文件和历史测试 `any` / Hook 规则；本轮 touched files scoped lint 已通过 |

## Phase3 专项模拟自动化

| 覆盖项 | 结果 | 证据 |
|---|---|---|
| 移动端键盘 DOM 量测 | PASS | 20 keys；左侧平均 59.9px，右侧平均 43.1px；disabled 为 dashed + opacity 0.4 |
| `x` / `×` 字体区分 | PASS | `x` 为 `"Times New Roman", Georgia, serif`、italic、22px；`×` 为 UI sans normal 18px |
| 移动端系统键盘默认屏蔽 | PASS | 输入格 `readOnly=true`、`inputMode=none`；无系统键盘呼出按钮文案 |
| 桌面回归 | PASS | 桌面输入格 `readOnly=false`、`inputMode=numeric`；内置键盘作为辅助面板保留 |
| 普通数字 / 商余数 / 多空 / 等式 / 训练格 | PASS | 5 条输入流全部用内置键盘提交成功，无 pageerror / console error |
| legacy 竖式 | PASS | `50 - 20` 用内置键盘填 `30` 并判定正确 |
| 多行乘法结构化失败 | PASS | `424 × 4` 总积正确、部分积错误时进入过程失败，并展示 `部分积填写错误` |
| 小数乘法训练格结构化失败 | PASS | `QA/e2e/phase3-decimal-training-failure.spec.ts`：`1.2 × 0.3` 最终答数正确、移动位数填错时展示用户值和正确值 |
| 错题本回显 | PASS | session 结束后错题本保留结构化 message 与 category |

## 主要自动化覆盖文件

- `src/pages/practice-math-keyboard.test.ts`
- `src/pages/PracticeMathKeyboard.test.ts`
- `src/engine/verticalMultiplicationErrors.test.ts`
- `src/utils/practiceFailureDisplay.test.ts`
- `src/store/index.test.ts`
- `src/sync/merge.test.ts`
- `QA/e2e/*.spec.ts`
- `QA/e2e/phase3-decimal-training-failure.spec.ts`

## 已知非阻塞风险

- 全仓 `npm run lint` 仍失败，失败点包括 `ConfettiEffect.tsx`、`SyncStatusIndicator.tsx`、`TopicIcon.tsx`、历史 generator tests 的 `any`、`CampaignMap.tsx` Hook 规则、`RankMatchHub.tsx` render-time `Date.now()` 等。本轮 Phase3 touched files 的定向 eslint 已通过。
- 本轮没有真实 Chrome Android / Safari iOS 设备；移动端结论基于 Playwright Chromium mobile viewport + touch emulation。
