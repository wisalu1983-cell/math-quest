# Automated Result · v0.5 Phase 5 Release Gate

**日期**：2026-05-01  
**结论**：PASS-WITH-NOTES

## 首轮发现与处理

| 发现 | 处理 | 最终结果 |
|---|---|---|
| `phase4-long-division-parity.spec.ts` 默认访问 `127.0.0.1:5178`，与当前 Playwright config 的 `127.0.0.1:5173` 不一致 | 默认 URL 改为相对路径 `/` 和 `/?preview=longdiv-formal`，继续保留环境变量覆盖 | `npx playwright test` 可直接运行 |
| 长除法 parity spec 在 10 workers 并发下偶发渐进输入 reveal 超时；390px virtual-keyboard / formal prototype 混合输入路径下，长链输入还会放大 active slot 竞争 | Playwright 默认 `workers: 1`；parity helper 对可编辑 prototype 输入走原生 `fill + Tab`，对 readOnly 正式练习页走内置键盘并等待 active slot / value 落稳 | 全量 Playwright 58 passed |
| `BL-017` 审计发现多个旧题型存在系统性有限样例池 / 重复风险 | v0.5 只修当前新增 `vertical-calc/cyclic-div`；旧题型系统性治理回流 v0.6 | 不阻塞 v0.5 |

## 最终自动化结果

| 层级 | 结果 |
|---|---|
| Scoped generator tests | ✅ 3 tests passed |
| Vitest 全量 | ✅ 64 files / 773 tests passed |
| Playwright 全量 | ✅ 58 tests passed（1.9m） |
| Build | ✅ 通过 |
| npm audit moderate | ✅ 0 vulnerabilities |
| PM sync | ✅ 通过 |

## 边界

- 本次不声明全仓 lint 无历史债，只对 Phase 5 改动文件执行 eslint。
- 真实 Android Chrome / iOS Safari 的默认内置键盘证据仍按既有计划在线上补验。
