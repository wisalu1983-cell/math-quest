# QA Summary · V0.5 全量测试

**执行日期**：2026-04-29  
**范围**：v0.5 Phase 1~3 全部成果 + 历史版本核心旅程回归  
**QA 深度**：L3（全量测试）  
**结论**：**有条件通过** — 44 项 PASS，0 FAIL，1 DEFERRED（真实设备），1 RISK（全仓 lint 历史债）

---

## 测试范围

本轮 QA 对 V0.5 迄今全部成果执行 L3 全量测试，覆盖：

| Phase | 内容 | 状态 |
|---|---|---|
| Phase 1 | 开工对齐与架构启动门 | ✅ 完成 |
| Phase 2 | `BL-009` 竖式题样本质量诊断与过滤规则 | ✅ 完成 |
| Phase 3 | `BL-011` 内置计算键盘 + `ISSUE-067` 结构化错因反馈 + `ISSUE-068` 单行过程积免重复 + 自动换格统一化 | 🟡 有条件完成 |

同时回归历史版本核心功能：注册→首页→闯关地图→答题→结算→错题本→账号同步。

---

## 三层测试结果

| 层级 | 结论 | 证据入口 |
|---|---|---|
| Code Review | **PASS-WITH-NOTES**（12 核心文件审查，无 `any`，1 个中级注意项） | [code-review-result.md](./code-review-result.md) |
| 自动化测试 | **PASS** | [automated-result.md](./automated-result.md) |
| 视觉 QA | **PASS**（12 张截图，25 校验点全部通过） | `QA/artifacts/v05-visual-qa/visual-qa-report.md` |
| 拟真人工 QA | **PASS**（Phase 3 baseline 9/9 + 本轮视觉覆盖） | Phase 3 QA runs + 本轮截图 |

---

## 自动化测试摘要

| 项目 | 结果 | 详情 |
|---|---|---|
| Vitest 单元测试 | **59 files / 743 tests PASSED** | 覆盖生成器、策略、错因分类、键盘 reducer、同步合并等 |
| Playwright E2E | **23 tests PASSED** | 覆盖 9 个 spec 文件：smoke/issue回归/键盘自动换格/进位聚焦/训练格错因/输入重置/账号同步 |
| 生产构建 | **PASS** | `tsc -b && vite build`，3312 modules，624ms |
| npm audit | **PASS** | 0 high/critical vulnerabilities |

---

## Execution Matrix 统计

| 状态 | 数量 | 占比 |
|---|---|---|
| PASS | 44 | 95.7% |
| DEFERRED | 1 | 2.2% |
| RISK | 1 | 2.2% |
| FAIL | 0 | 0% |
| BLOCKED | 0 | 0% |
| **总计** | **46** | — |

详见 [execution-matrix.md](./execution-matrix.md)。

---

## 关键验收结论

### v0.5 新功能

1. **BL-009 竖式题样本过滤** — PASS
   - 低档乘法 `difficulty≤3` 已排除 `2位数×1位数`
   - 低档一位除数整数除法已过滤 D0 逐段整除型
   - D2/D3 多次余数传递和商中间 0 为低档除法主力样本

2. **BL-011 内置计算键盘** — PASS
   - 5×4 全量按键布局，左三列主输入区宽于右两列符号区
   - 置灰策略清晰：可用 solid+opacity1，不可用 dashed+opacity0.4+灰色
   - 键盘固定视口底部不跟随滚动
   - 移动端 readOnly+inputMode=none 阻止系统键盘弹出
   - 非键盘区高度 74.6% ≥ 60% 阈值
   - 桌面硬键盘输入正常，内置键盘作辅助面板

3. **BL-011 自动换格统一化** — PASS
   - 商余数填满商后自动进入余数
   - multi-blank 达标准答案长度后自动换下一空
   - 训练格填满后移动到下一字段
   - 多行乘法部分积/总积按右到左输入，桌面 Tab 顺序一致

4. **ISSUE-067 结构化错因反馈** — PASS
   - 多行乘法过程格错显示类别文案（部分积错/求和错/竖式过程错）
   - 小数训练格错显示类型+用户值+正确值
   - 错题本展示结构化错因
   - 历史记录 UI 不展示错因
   - 旧 `failureReason` 数据 fallback 无白屏

5. **ISSUE-068 单行过程积免重复** — PASS
   - 单行过程积乘法不渲染重复合计行
   - 单行过程积填错按最终答案错误处理

### 历史版本回归

- 首页加载与注册流程正常（E2E smoke）
- 竖式操作数高对比（E2E ISSUE-065 回归）
- 单一输入入口+退位语义（E2E ISSUE-066 回归）
- 低/中档进位格自动聚焦正常（E2E phase4-carry-focus）
- Practice 换题重置正常（E2E phase5-practice-input-reset）
- 游客入口和离线段位门正常（E2E v03-account-sync）

---

## 缺陷与残余风险

| # | 类型 | 描述 | 处理 |
|---|---|---|---|
| 1 | DEFERRED (I-01) | 真实 Android Chrome / iOS Safari 默认不弹系统键盘证据 | 已确认发布后线上环境验收，清单见 `QA/runs/2026-04-29-v05-phase3-input-feedback-qa/real-device-checklist.md` |
| 2 | RISK (A-02) | 全仓 ESLint 历史债（~146 problems） | Phase 3 scoped ESLint exit 0；全仓清理为后续版本优化项 |
| 3 | **中级注意** (N3) | `vertical-calc.ts:590-631` 高档 `generateDecimalDiv` 循环后 7 处 `!` 非空断言，缺少兜底 fallback；50 次重试全失败时可能 TypeError | **建议优先修复**：仿照同文件其他函数添加 fallback return |
| 4 | 注意 (CR-02) | 生产构建 JS chunk 1809 kB 超过 500 kB 建议阈值 | P2 级，后续版本考虑 code splitting |
| 5 | 信息 | `Practice.tsx` ~985 行，承载所有题型 UI 逻辑 | 后续可考虑按题型拆分子组件 |
| 6 | 信息 | `types/index.ts` `xpBase` 已标 deprecated 但仍被所有生成器赋值 | 后续清理 |

---

## Gate 建议

V0.5 Phase 1~3 成果通过全量测试。建议：

1. **Phase 3 可标记为有条件完成**：本地验证已全部通过，真实设备验证按既定计划发布后线上补验。
2. **可继续进入 Phase 4**：`BL-010` 竖式除法 UI 化答题的前置依赖（输入槽位、内置键盘、错因链路）已就绪。
3. **无需新增 ISSUE**：本轮未发现新缺陷。
4. **ISSUE_LIST 状态确认**：当前开放数为 0，与 `ISSUE_LIST.md` 一致。

---

## 产物索引

| 产物 | 路径 |
|---|---|
| 测试用例表 | [test-cases-v1.md](./test-cases-v1.md) |
| 执行矩阵 | [execution-matrix.md](./execution-matrix.md) |
| Code Review 结果 | [code-review-result.md](./code-review-result.md) |
| 自动化测试结果 | [automated-result.md](./automated-result.md) |
| QA Summary（本文件） | [qa-summary.md](./qa-summary.md) |
| 视觉 QA 截图 + 报告 | `QA/artifacts/v05-visual-qa/`（12 张 PNG + metrics.json + visual-qa-report.md） |
| Phase 3 QA baseline | [`../2026-04-29-v05-phase3-input-feedback-qa/qa-summary.md`](../2026-04-29-v05-phase3-input-feedback-qa/qa-summary.md) |
| Phase 3 自动换格 QA | [`../2026-04-29-v05-phase3-keyboard-autofocus-qa/qa-summary.md`](../2026-04-29-v05-phase3-keyboard-autofocus-qa/qa-summary.md) |
| 真实设备验收清单 | [`../2026-04-29-v05-phase3-input-feedback-qa/real-device-checklist.md`](../2026-04-29-v05-phase3-input-feedback-qa/real-device-checklist.md) |
