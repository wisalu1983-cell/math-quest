# v0.4 Hotfix · ISSUE-066 竖式输入单入口 QA Summary

> 日期：2026-04-26
> 范围：`ISSUE-066` 竖式板隐藏输入双入口导致 `0` 跨格重复消费；退位格输入心智不清
> 结论：PASS

---

## 1. 风险模型

| 风险 | 覆盖方式 | 结果 |
|---|---|---|
| 同一字符被 `keydown` 与 `input/change` 双入口消费 | 新增 e2e 模拟同一 `0` 先触发 `keydown` 再触发 `input` | PASS |
| 退位格要求用户知道内部值 `-1` | 新增 e2e 验证减法过程格输入 `1` 归一为退位值并显示 `退1` | PASS |
| 单入口改造破坏软键盘删除 | 新增 e2e 覆盖 `inputType='deleteContentBackward'` 清当前格 | PASS |
| 单入口改造破坏既有低 / 中档焦点规则 | 复跑 `phase4-carry-focus.spec.ts` | PASS |
| 策略层判定被误改 | 复跑 `vertical-calc-policy.test.ts` | PASS |

## 2. 自动化结果

| 命令 | 结果 |
|---|---|
| `npx playwright test QA/e2e/issue-066-vertical-single-input.spec.ts` | 3 passed |
| `npm test -- src/engine/vertical-calc-policy.test.ts` | 1 file / 12 tests passed |
| `npx playwright test QA/e2e/phase4-carry-focus.spec.ts` | 2 passed |
| `npx eslint src/components/VerticalCalcBoard.tsx QA/e2e/issue-066-vertical-single-input.spec.ts` | passed |
| `npm test -- --run` | 55 files / 713 tests passed |
| `npx playwright test` | 12 passed |
| `npm run build` | passed；仅 Vite chunk size warning |

## 3. 验收结论

- `VerticalCalcBoard` legacy single-line board 已改为单一字符输入入口：`onInput` 唯一消费文本输入，`onKeyDown` 只处理控制键。
- 同一 `0` 不再跨格重复写入。
- 减法退位格输入 `1` 会显示为 `退1`，内部仍按 `-1` 参与现有策略判定。
- 既有低档 / 中档自动跳格规则保持。

## 4. 复跑 QA（用户要求）

> 复跑时间：2026-04-26

| 命令 | 结果 |
|---|---|
| `npx playwright test QA/e2e/issue-066-vertical-single-input.spec.ts` | 3 passed |
| `npx playwright test QA/e2e/phase4-carry-focus.spec.ts` | 2 passed |
| `npm test -- src/engine/vertical-calc-policy.test.ts` | 1 file / 12 tests passed |
| `npx eslint src/components/VerticalCalcBoard.tsx QA/e2e/issue-066-vertical-single-input.spec.ts` | passed |
| `npm test -- --run` | 55 files / 713 tests passed |
| `npx playwright test` | 12 passed |
| `npm run build` | passed；仅 Vite chunk size warning |
| `npx tsx scripts/pm-sync-check.ts` | passed；未发现不一致 |

## 5. 测试缺口复盘

旧用例漏掉本缺陷的根本原因是测试模型只覆盖了“填格后焦点跳转结果”，没有把隐藏输入框本身作为独立风险源建模。

具体缺口：

- 旧 `phase4-carry-focus.spec.ts` 使用 `page.keyboard.press()` 覆盖桌面键盘正常路径，没有模拟同一字符先后经过 `keydown` 与 `input/change` 两条入口。
- 旧用例关注低档 / 中档的焦点顺序，没有验证输入事件所有权、DOM value 残留、字符消费后清空这些机制约束。
- 旧样本主要是 `7` 和加法进位；`0` 同时容易被答案格和过程格接受，更能暴露跨格重复消费。
- 旧用例没有覆盖移动端 / 软键盘式 `input` 事件，也没有覆盖 `inputType='deleteContentBackward'` 删除路径。
- 旧退位体验用例验证的是内部规则 `-1`，没有覆盖五年级用户更自然的输入心智：在退位格输入 `1` 表示“退 1”。

后续竖式板输入类测试需要固定纳入：

- 同一字符不会被多个事件入口重复消费。
- 字符消费或拒绝后隐藏 input 的 DOM value 必须清空。
- 桌面键盘与软键盘 `input` 路径等价。
- 删除路径同时覆盖控制键和 `inputType`。
- 输入样本包含 `0` 这类答案格 / 过程格交集值。
- 内部符号与用户语义存在差异时，必须把用户语义映射纳入 oracle。
