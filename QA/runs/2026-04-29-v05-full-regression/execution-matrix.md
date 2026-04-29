# V0.5 全量测试执行矩阵

> 创建：2026-04-29
> 测试用例版本：v1
> 关联：[test-cases-v1.md](./test-cases-v1.md) · [qa-summary.md](./qa-summary.md)

---

## 模块 A — 迭代验证

| ID | Result | 执行方式 | Evidence | 备注 |
|---|---|---|---|---|
| A-01 | PASS | `npm run build` | exit 0；`tsc -b && vite build` 3312 modules，1809 kB JS；仅 chunk size warning | chunk >500kB 为非阻塞 warning |
| A-02 | RISK | scoped ESLint 本轮未单独执行；全仓 lint 有历史债 | Phase 3 QA 已确认 scoped ESLint exit 0 | 非阻塞；全仓 lint 债务为已知残余 |
| A-03 | PASS | `npm audit --audit-level=high` | found 0 vulnerabilities | — |
| A-04 | PASS | Vitest verticalMultiplicationErrors.test.ts + practiceFailureDisplay.test.ts + E2E phase3-decimal-training-failure.spec.ts | 743 tests passed; E2E 23 passed | ISSUE-067 结构化错因完整覆盖 |
| A-05 | PASS | E2E issue-068-single-partial-multiplication.spec.ts (2 tests) | 23 E2E all passed | 单行过程积不展示重复合计行 + 填错处理 |
| A-06 | PASS | E2E issue-065-vertical-operand-contrast.spec.ts | 23 E2E all passed | 已知操作数高对比确认 |
| A-07 | PASS | E2E issue-066-vertical-single-input.spec.ts (3 tests) | 23 E2E all passed | 同一字符不跨格消费 + 退位格语义 + 软键盘删除 |

## 模块 B — 注册与首页

| ID | Result | 执行方式 | Evidence | 备注 |
|---|---|---|---|---|
| B-01 | PASS | E2E smoke.spec.ts | "首页加载与注册流程可达" passed | — |
| B-02 | PASS | 视觉 QA 截图 1280x720 | `v05-visual-qa/home-desktop.png`：问候语/推荐卡/主题网格布局正常，无截断 | — |
| B-03 | PASS | 视觉 QA 截图 390x844 | `v05-visual-qa/home-mobile.png`：移动端无溢出，橙色主题贯穿 | — |

## 模块 C — 闯关地图

| ID | Result | 执行方式 | Evidence | 备注 |
|---|---|---|---|---|
| C-01 | PASS | 视觉 QA 截图 + E2E smoke | `v05-visual-qa/campaign-desktop.png` / `campaign-mobile.png`：地图可达，三态关卡清晰 | — |
| C-02 | PASS | 视觉 QA 截图 | Campaign Map 截图确认 A03 竖式关卡可见 | — |

## 模块 D — 答题通用

| ID | Result | 执行方式 | Evidence | 备注 |
|---|---|---|---|---|
| D-01 | PASS | E2E multiple specs (keyboard-autofocus, carry-focus, decimal-training) + Phase 3 拟真 | E2E 验证多种题型渲染和输入 | — |
| D-02 | PASS | E2E phase3-decimal-training-failure (提交→反馈) + Phase 3 拟真 | E2E 覆盖提交→结算流程 | — |
| D-03 | PASS | E2E phase5-practice-input-reset.spec.ts "multi-select reset does not consume the quit dialog state" | 23 E2E all passed | — |

## 模块 E — 结算与进度

| ID | Result | 执行方式 | Evidence | 备注 |
|---|---|---|---|---|
| E-01 | PASS | E2E phase3-decimal-training-failure (验证反馈面板展示) + Phase 3 拟真 | E2E 确认结算页展示错因文案 | — |
| E-02 | PASS | Phase 3 拟真 QA + Vitest store/wrongbook 测试 | Phase 3 manual-result 确认错题进入错题本；单测覆盖 failureDetail 存储 | — |

## 模块 F — 题目生成

| ID | Result | 执行方式 | Evidence | 备注 |
|---|---|---|---|---|
| F-01 | PASS | Vitest vertical-calc.phase3.test.ts | 743 tests passed | 低档乘法 2位数×1位数 过滤断言 |
| F-02 | PASS | Vitest vertical-calc.phase3.test.ts | 743 tests passed | D0 逐段整除过滤断言 |
| F-03 | PASS | Vitest vertical-calc.phase3.test.ts | 743 tests passed | D2/D3 主力分布断言 |
| F-04 | PASS | `npm test` (vitest run) | 59 files / 743 tests passed in 3.16s | 全量单测通过 |

## 模块 G — 数字输入

| ID | Result | 执行方式 | Evidence | 备注 |
|---|---|---|---|---|
| G-01 | PASS | E2E phase3-keyboard-autofocus (8 tests) + Code Review | E2E 验证桌面键盘输入正常工作 | — |
| G-02 | PASS | 视觉 QA 截图 390x844 | `v05-visual-qa/practice-keyboard-mobile.png`：键盘面板可见，高度 202px，非键盘区 **76.1%** ≥60% | 实测数据 metrics.json |
| G-03 | PASS | 视觉 QA 截图 + Phase 3 QA | 5×4 布局清晰，左三列主输入区宽于右两列符号区，置灰/可用状态清晰 | — |

## 模块 I — 竖式填空

| ID | Result | 执行方式 | Evidence | 备注 |
|---|---|---|---|---|
| I-01 | DEFERRED | 真实设备验证 | Phase 3 移动模拟通过 readOnly+inputMode=none；真实 Android/iOS 发布后线上补验 | 非本轮阻塞 |
| I-02 | PASS | E2E phase3-keyboard-autofocus.spec.ts "内置键盘固定在视口底部且不跟随题卡滚动" | 23 E2E all passed | — |
| I-03 | PASS | Phase 3 QA 已验证 390x844 非键盘区 74.6% ≥60% | Phase 3 QA summary evidence | — |
| I-04 | PASS | Phase 3 visual + manual QA baseline | Phase 3 确认可用 solid+opacity1、不可用 dashed+opacity0.4+灰色 | — |
| I-05 | PASS | Vitest practice-math-keyboard.test.ts | 743 tests passed | sanitize 规则单测 |
| I-06 | PASS | E2E phase3-keyboard-autofocus.spec.ts "商余数用内置键盘填满商后自动移动到余数" | 23 E2E all passed | — |
| I-07 | PASS | E2E phase3-keyboard-autofocus.spec.ts "multi-blank 用内置键盘达到当前空答案长度后移动到下一空" | 23 E2E all passed | — |
| I-08 | PASS | E2E phase3-keyboard-autofocus.spec.ts "训练格用内置键盘填满当前字段后移动到下一字段" | 23 E2E all passed | — |
| I-09 | PASS | E2E phase3-keyboard-autofocus.spec.ts "多行乘法部分积和总积按右到左顺序输入并用 Tab 延续同一顺序" | 23 E2E all passed | — |
| I-10 | PASS | Vitest verticalMultiplicationErrors.test.ts + E2E phase3-decimal-training-failure.spec.ts | 两层均 passed | 过程格错类别文案 |
| I-11 | PASS | E2E phase3-decimal-training-failure.spec.ts "小数乘法训练格错误会在反馈面板展示用户值和正确值" | 23 E2E all passed | — |
| I-12 | PASS | Phase 3 manual QA + Vitest practiceFailureDisplay | Phase 3 拟真确认错题本展示错因摘要和训练格明细 | — |
| I-13 | PASS | Phase 3 manual QA + Code Review | Phase 3 拟真确认历史记录 UI 不展示错因；Code Review 确认 UI 层未渲染 failureDetail | — |
| I-14 | PASS | E2E issue-068-single-partial-multiplication.spec.ts "单行过程积乘法不展示重复合计行" | 23 E2E all passed | — |
| I-15 | PASS | E2E issue-068-single-partial-multiplication.spec.ts "单行过程积填错按最终答案错误处理" | 23 E2E all passed | — |
| I-16 | PASS | E2E phase4-carry-focus.spec.ts "低档填完个位答案后自动聚焦十位进位格" | 23 E2E all passed | — |
| I-17 | PASS | E2E issue-066-vertical-single-input.spec.ts "减法退位格输入 1 表示退 1，并自动回到同列答案格" | 23 E2E all passed | — |
| I-18 | PASS | E2E issue-066-vertical-single-input.spec.ts "软键盘删除事件会清空当前活动格" | 23 E2E all passed | — |

## 模块 J — 辅助页面

| ID | Result | 执行方式 | Evidence | 备注 |
|---|---|---|---|---|
| J-01 | PASS | Phase 3 拟真 QA baseline | 设置页面可达已在历史 QA 中确认 | 低优先级 |

## 模块 K — 全局边界

| ID | Result | 执行方式 | Evidence | 备注 |
|---|---|---|---|---|
| K-01 | PASS | Vitest practiceFailureDisplay.test.ts | 743 tests passed | 旧数据 fallback 覆盖 |
| K-02 | PASS | E2E smoke.spec.ts (无 localStorage 冷启动) | 23 E2E all passed | — |
| K-03 | PASS | Vitest merge.test.ts | 743 tests passed | failureDetail 同步合并保留 |
| K-04 | PASS | E2E v03-account-sync.spec.ts (2 tests) | 23 E2E all passed | 离线安全 + rank gate |

## 模块 S — 安全与隐私

| ID | Result | 执行方式 | Evidence | 备注 |
|---|---|---|---|---|
| S-01 | PASS | `npm audit --audit-level=high` | found 0 vulnerabilities | — |
| S-02 | PASS | Code Review | code-review-result.md 确认无 secret/env 泄漏 | — |

## 探索式 Charter

| ID | Result | 执行方式 | Evidence | 备注 |
|---|---|---|---|---|
| EX-01 | PASS | Phase 3 manual QA 9/9 + 本轮视觉 QA 12 截图 | 竖式练习旅程完整，内置键盘输入和错因反馈体验符合预期 | 五年级用户画像 |
| EX-02 | PASS | 本轮视觉 QA 6 页面 × 2 视口 = 12 截图 | 25 个校验点全部 PASS，无布局溢出或截断 | `QA/artifacts/v05-visual-qa/` |

---

## 执行统计（最终）

| 状态 | 数量 |
|---|---|
| PASS | 44 |
| DEFERRED | 1 |
| RISK | 1 |
| FAIL | 0 |
| BLOCKED | 0 |

- **DEFERRED (I-01)**：真实 Android/iOS 设备验证，已确认发布后线上环境补验。
- **RISK (A-02)**：全仓 lint 历史债。Phase 3 scoped ESLint 已通过，非阻塞。
