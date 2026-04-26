# v0.4 Phase 4 执行报告

**执行日期**：2026-04-26  
**范围**：A03 竖式进位/退位格三档规则、错题原因链路、A02 compare tip 补证  
**目标用户画像**：6-12 岁小学生，数学能力中等，主要用移动端答题，桌面端需要键盘可用。  
**结论**：PASS。Phase 4 目标功能、自动化与拟真人工浏览器验收均通过；2026-04-26 复测已修正低档默认跳格必须进入进位/退位格的偏差；`npm run lint` 仍失败于既有 lint 债，本轮改动文件 scoped lint 通过。

## 第一层：Code Review

| 检查点 | 结果 | 说明 |
|---|---|---|
| 策略层边界 | PASS | 新增 `src/engine/vertical-calc-policy.ts`，不依赖 React/Zustand/DOM。 |
| UI 与策略分层 | PASS | `VerticalCalcBoard` 消费策略输出，负责渲染、本地复盘和键盘事件，不再自行散落三档判定。 |
| failureReason 链路 | PASS | `submitAnswer -> pendingWrongQuestions -> addWrongQuestion` 保留 `failureReason`；rank 恢复 pending 错题时也保留。 |
| stepOrder 数据源 | PASS | `buildVerticalCalcPolicyColumns(VerticalCalcStep[])` 明确从 generator steps 派生列，并补齐 0 过程格。 |
| 旧决策残留 | 已修正 | 代码审查发现低档默认焦点链曾错误复用中档答案链路；已改为低档按计算步骤进入下一列过程格，并补自动化与浏览器复测。 |

## 第二层：自动化测试

| 命令 / 范围 | 结果 |
|---|---|
| `npm test -- src/engine/vertical-calc-policy.test.ts src/store/index.test.ts src/sync/merge.test.ts src/utils/method-tips.test.ts --run` | PASS：4 files / 55 tests |
| `npm test -- --run` | PASS：54 files / 702 tests |
| `npm run build` | PASS |
| `npx playwright test QA/e2e/phase4-carry-focus.spec.ts` | PASS：2 tests，固定 `999+888` 低档 / 中档焦点差异。 |
| `npx eslint src/engine/vertical-calc-policy.ts src/engine/vertical-calc-policy.test.ts QA/e2e/phase4-carry-focus.spec.ts` | PASS：本轮改动文件 scoped lint 通过。 |
| `npm run lint` | 历史记录：全局 lint 仍失败于既有债；本轮使用 scoped lint 控制新增文件。 |

## 第三层：拟真人工 QA

| ID | 用户预期 | 操作路径 | 实际观察 | 判定 | 证据 |
|---|---|---|---|---|---|
| I-01 | 低档题填完个位答案后，下一步应自然进入十位进位格。 | 固定 `999+888 d=5`，输入个位答案 `7`。 | 十位进位格获得 active 样式；学生下一步直接记录进位。 | PASS | `manual-artifacts/I-01-v2-low-after-unit-focus.png` |
| I-02 | 低档答案对但进位格错时先板内复盘，再进入统一失败面板并扣心、记错题原因。 | 固定 `999+888 d=5`，答案填对，十位进位填 `0`。 | 板内显示“未通过：进位/退位格填写错误”；点继续后统一失败面板显示原因；心数 3→2；pending 错题带 `vertical-process`。 | PASS | `manual-artifacts/I-02-local-fail.png`、`I-02-unified-feedback.png` |
| I-03 | 中档过程格错误不扣心、不进错题本，只在成功面板提示。 | 固定 `999+888 d=6`，答案填对，过程格填错。 | 直接进入成功面板，显示黄色过程提示；心数不变；无 pending 错题。 | PASS | `manual-artifacts/I-03-warning-pass.png` |
| I-10 | 中档填完个位答案后不被过程格打断。 | 固定 `999+888 d=6`，输入个位答案 `7`。 | 十位答案格获得 active 样式；中档仍保持答案格链路。 | PASS | `manual-artifacts/I-10-v2-mid-after-unit-focus.png` |
| I-04 | 高档不显示进位/退位格，只填写答案。 | 固定 `999+888 d=8`，检查竖式网格并提交正确答案。 | 只有两行操作数和一行答案；提交后统一成功面板。 | PASS | `manual-artifacts/I-04-high-pass.png` |
| I-05 | 桌面端 `Tab` 可从 0 过程格跳到同列答案格，`Enter` 可提交且不跳过反馈。 | 固定 `123+456 d=5`，填个位答案，点 0 过程格后按 Tab，再填答案并按 Enter。 | 0 过程格留空不阻塞；Tab 跳到同列答案格；Enter 停在统一成功反馈，不直接进入结算。 | PASS | `manual-artifacts/I-05-desktop-tab-enter-zero-process.png` |
| F-01 | d=8 compare 概念题能稳定显示方法提示。 | dev hook 固定 number-sense compare multi-select 题。 | 题干下显示“遇到‘一定’，先找反例”。 | PASS | `manual-artifacts/F-01-compare-tip.png` |

## 新发现问题

无新增功能缺陷。`npm run lint` 暴露的全局 lint 债不是本轮引入，未写入当前 Phase 4 缺陷。

## 本轮结论

Phase 4 实现与最终设计决策匹配：低档默认跳格纳入进位/退位格且过程错不通过，中档默认跳格仍走答案链路且过程错误只做当前题提示，高档隐藏过程格，compare tip 可控补证通过。
