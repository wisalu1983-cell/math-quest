# Risk Model · v0.5 Phase 4 BL-010 长除法 UI

**日期**：2026-04-30  
**QA 深度**：L2 Professional  
**范围**：A03 竖式除法 UI 化答题生产实现、生成器挂载、长除法过程判定、结构化错因、移动端视觉证据。

## 风险清单

| ID | 风险 | 优先级 | 覆盖方式 | 本轮结果 |
|---|---|---:|---|---|
| R1 | 长除法标准过程生成错误，导致正确输入被判错 | P0 | `src/engine/longDivision.test.ts` | PASS |
| R2 | 整数、小数除法、取近似、循环小数边界转换错误 | P0 | `longDivision.test.ts`、`generators.test.ts`、预览 E2E 回归 | PASS |
| R3 | slot 顺序、自动换格、键盘输入顺序与“商、乘、减、落”不一致 | P0 | `QA/e2e/phase4-long-division.spec.ts` | PASS |
| R4 | 过程错因泄露中间正确值，或 fallback 落到 legacy 进位 / 退位文案 | P0 | `practiceFailureDisplay.test.ts`、Phase4 E2E | PASS |
| R5 | 375px / 390px 手机视口下长除法板被键盘遮挡或不可见 | P0 | Phase4 E2E 截图与可见性断言 | PASS |
| R6 | 新长除法字段破坏旧题或旧 numeric-input 除法回放 | P1 | 生成器保留显式 `longDivisionBoard` 分支，旧题缺字段走 legacy 路径 | PASS |
| R7 | PM / current spec 没有回写，长期事实源缺失 | P1 | 本 QA 后回写 subplan、phase、Overview、A03 current spec，并跑 `pm-sync-check` | 待 PM 收口 |
| R8 | 全仓 lint 历史债混入 Phase4 结论 | P1 | scoped ESLint PASS；全仓 lint 单独记录 baseline failure | RISK |
| R9 | 真实 Android Chrome / iOS Safari 未在本地补证 | P2 | 沿 Phase3 已确认的发布后线上补验口径 | DEFERRED |

## 结论

P0 / P1 功能风险均有自动化或视觉证据覆盖。残余风险为全仓 lint 既有基线失败与真实设备发布后补验，均不阻塞 Phase4 本地 L2 收口。
