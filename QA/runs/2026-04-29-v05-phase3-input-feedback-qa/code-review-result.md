# Code Review 结果

**执行日期**：2026-04-29
**范围**：v0.5 Phase 3 输入键盘与结构化错因反馈
**结论**：PASS。未发现需要阻塞 Phase3 验收的缺陷。

## Review 范围

| 模块 | 文件 |
|---|---|
| 键盘 reducer / UI | `src/pages/practice-math-keyboard.ts`、`src/pages/PracticeMathKeyboard.tsx` |
| Practice 接入 | `src/pages/Practice.tsx`、`src/pages/practice-input-state.ts`、`src/components/DecimalTrainingGrid.tsx` |
| 竖式接入 | `src/components/VerticalCalcBoard.tsx`、`src/components/MultiplicationVerticalBoard.tsx` |
| 错因分类 / 展示 | `src/engine/verticalMultiplicationErrors.ts`、`src/utils/practiceFailureDisplay.ts` |
| 数据契约 | `src/types/index.ts`、`src/store/index.ts`、`src/pages/WrongBook.tsx`、`src/sync/merge.test.ts` |
| 测试 | 对应 `.test.ts` 文件与现有 `QA/e2e/*.spec.ts` |

## 重点检查

| 检查项 | 结果 | 说明 |
|---|---|---|
| 输入协议单一数据源 | PASS | `enabledKeys` 控制 UI 可用性，`sanitizeInput` 做写入守门，键盘不另建答案状态 |
| UI disabled 不能绕过 | PASS | disabled button 不触发写入；直接输入 / 测试注入仍走 sanitize |
| 移动端默认策略 | PASS | 移动视口下真实输入 `readOnly` + `inputMode=none` |
| 桌面回归 | PASS | 桌面真实输入仍可 focus 和键盘输入；内置键盘仅辅助 |
| 结构化错因分类 | PASS | 最终答案错、过程格错、训练字段错可区分 |
| store / wrongbook / sync 字段 | PASS | `failureDetail` 进入 attempt、pending wrong question、wrongbook display、merge test |
| 可访问性基础 | PASS | 删除键有 aria-label；active slot 有 sr-only `aria-live`；无可见 active label 噪音 |
| 安全 / 隐私 | PASS | 未新增 env、secret、远端调用或依赖；`npm audit --audit-level=high` 通过 |

## Findings

无阻塞缺陷。

## Observations

- `useSystemKeyboardForSlotId` 状态仍保留，但首版 UI 不展示入口，符合 BL-011 §3.4。
- 桌面宽屏下内置键盘作为辅助面板可见，且真实输入仍可用，符合 BL-011 §3.3 / §3.6。
- `npm run lint` 的失败来自全仓既有基线；本轮 touched files 的 scoped eslint 已通过。

## 评审收尾处理

| 项 | 处理 |
|---|---|
| `practice-math-keyboard.ts` React import 在文件末尾 | 已移至文件顶部 |
| `classifyMultiplicationErrors` 缺少过程格 + 训练格同时错测试 | 已补联合场景单测 |
| `merge.test.ts` 两个同名 `describe('mergeWrongQuestions')` | 已合并为一个 describe |
| `applyMaxLength` 超长截尾策略 | 暂不改，需要产品确认“截尾保留最新输入”还是“拒绝超长输入” |
| 键盘默认触摸高度 40px | 暂不改，和“键盘紧凑、少压迫主界面内容”的产品约束存在取舍 |
| `WrongBook.tsx` IIFE 展示逻辑 | 暂不改，可读性优化非 Phase3 关闭条件 |

## 建议

- 若 Phase3 后续进入 release gate，补真实 Chrome Android / Safari iOS 设备截图或远程浏览器证据。
- 全仓 lint 历史债建议单独排期，不建议混入 Phase3 键盘 / 错因反馈收口。
