# v0.2-1-1（F3 开发者工具栏）单元测试审计报告

**执行日期**：2026-04-20  
**关联子计划**：[ProjectManager/Plan/v0.2/subplans/2026-04-20-dev-tool-panel.md](../../Plan/v0.2/subplans/2026-04-20-dev-tool-panel.md)（`v0.2-1-1` · DevToolPanel / **F3**）  
**本轮定位**：**单元测试级（Vitest）审计**；不包含浏览器拟真、Playwright、dev server 手工点击验证。  
**用例范围**：新增 **5** 个测试文件、**22** 条用例（在既有 `479` 条基础上 **+22**）；复用 `src/repository/local.test.ts` 中 **6** 条 namespace 用例作为既有证据（不逐条展开）。  
**总计**：**501** 条 Vitest 用例（本轮执行全绿）

**结果统计**：PASS: **14** / FAIL: **0** / RISK: **0** / BLOCKED: **0**  
（说明：下表按「验证项」聚合计数，与 Vitest 用例条数不是 1:1。）

---

## 测试环境

- OS：Windows（PowerShell）
- 项目路径：`math-quest`（Vite 8 + React 19 + TypeScript + Vitest 4.1.x + Zustand）
- Node：与本地开发一致（`npx vitest run` / `npm run build`）

---

## 逐条结果

| ID | 用例名称 | 方法 | 预期 | 实际 | 判定 | 证据 |
|----|----------|------|------|------|------|------|
| QA-UT-BASE | 基线 Vitest 全量回归 | `npx vitest run` | 既有用例全部通过 | 479/479 PASS；Duration **~1.39s**（v4.1.4） | PASS | 终端输出 |
| QA-UT-NS-AGG | Namespace 隔离（T1） | `local.test.ts` §Storage Namespace | `mq_` / `mq_dev_` 前缀、`clearAll` 不跨删、`init` 独立 | 6 条用例均按子计划 T1 描述通过（本轮未改该文件） | PASS | `src/repository/local.test.ts` §436-516 |
| QA-UT-REG | `_registry` 静态断言 | `src/dev-tool/injections/_registry.test.ts` | `id` 全局唯一、`group` 合法、`run` 为函数、展示字段非空 | 4 条断言全部通过 | PASS | 同左测试文件 |
| QA-UT-NS | `namespace.ts` 行为 | `src/dev-tool/namespace.test.ts` | `switchDevNamespace` / `clearDevSandbox` / `applyAndReload` 与存档、Zustand 一致 | 5 条通过 | PASS | 同左测试文件 |
| QA-UT-ADV | `advance` 封顶与清空 | `src/dev-tool/injections/advance.test.ts` | `advance.max.mental-arithmetic` 心数对齐 cap；`advance.clear.all` 心数与场次统计归零 | 2 条通过 | PASS | 同左测试文件 |
| QA-UT-RANK | `buildMidBO` + 构造注入冒烟 | `src/dev-tool/injections/rank-active-session.test.ts` | 非法中途态抛 `RankMatchRecoveryError`；合法 tier×比分下 `games` 长度、末局 `finished:false`、胜负计数；`rank.construct-active-bo.rookie.1-1` 落盘自洽 | 10 条通过 | PASS | 同左测试文件；**实现侧**为支持直接断言，将 `buildMidBO` 设为 `export`（无行为变更） |
| QA-UT-CAMP | `campaign.complete-all` 冒烟 | `src/dev-tool/injections/campaign.smoke.test.ts` | 至少一题型 `isCampaignFullyCompleted` 与 `campaignCompleted` 一致 | 1 条通过 | PASS | 同左测试文件 |
| QA-BUILD-CL | 纯净构建不含 F3 标记 | `npm run build` 后对 `dist/` 全文检索 | `dist/` 内无 `mq-dev-tool-root` / `DevFab` / `DevDrawer` | `grep` 无命中 | PASS | 构建日志 + 检索输出 |
| QA-BUILD-DV | 带 dev-tool 构建含 F3 chunk | `npm run build:with-dev-tool` → `dist-dev/` | 存在独立 `dev-tool-*.js` chunk，且含 `mq-dev-tool-root` 等实现字符串 | 产出 `dist-dev/assets/dev-tool-*.js`；`mq-dev-tool-root` 命中于该 chunk | PASS | 构建日志 + `grep dist-dev` |
| QA-LINT | 本次改动路径 ESLint | `eslint` 限定 `src/dev-tool/**`、`src/repository/local.ts`、`src/main.tsx`、`vite.config.ts` | 0 error | Exit code **0** | PASS | 命令退出码 |

### 非本轮范围（按子计划 §验收 / §七）

以下项依赖浏览器、CI 运行器或人工，**本报告不判定 PASS/FAIL**，仅作交接说明：

- **FAB 可见 / 注入项逐条点击**：需后续浏览器级或专项 QA。
- **CI `deploy.yml` 中 `grep` F3-guard**：需在 GitHub Actions（Linux）首次跑通后确认（本地已做等价 `grep` 思路验证）。
- **`useDevNamespace` 的 React 订阅与重渲染**：未引入 `jsdom` / Testing Library，**未**做单测；`switchDevNamespace` 与 `getStorageNamespace` 已覆盖。若未来要严格覆盖 `emit`，需补充测试环境或抽离订阅逻辑。

---

## 新发现问题

**无**（读码与写测过程中未发现新的实现缺陷；`buildMidBO` 导出仅为可测性，非行为变更。）

---

## 本轮结论

**PASS**：在 **501/501** Vitest 全绿、限定路径 **ESLint 0 error**、**双构建**产物符合「纯净版无 F3 字符串 / dev 版含 dev-tool chunk」的前提下，F3 子计划在 **单元测试可覆盖范围内**验收通过；浏览器与 CI 验证按上表「非本轮范围」跟进。

### 遗留与后续

1. **浏览器级**：FAB、抽屉、各注入项端到端、双路径线上访问体验 — 另开子计划或手工清单。  
2. **`useDevNamespace` 订阅语义**：若产品要求证明 `emit` 触发重渲染，可引入 `jsdom` + `@testing-library/react` 或抽取 listener 模块单测。  
3. **组件层**：`DevFab.tsx` / `DevDrawer.tsx` 按子计划 T6 与本轮约定**不补**组件单测；若日后统一引入 UI 单测再补。  
4. **注入项地毯覆盖**：本轮对 `campaign` / `navigation` / `in-game` 等仅做代表性冒烟；扩展清单时优先扩 `_registry` 断言 + 关键逻辑模块。

---

## 附录 · 新增测试文件清单

| 文件 |
|------|
| `src/dev-tool/injections/_registry.test.ts` |
| `src/dev-tool/namespace.test.ts` |
| `src/dev-tool/injections/advance.test.ts` |
| `src/dev-tool/injections/rank-active-session.test.ts` |
| `src/dev-tool/injections/campaign.smoke.test.ts` |

## 附录 · 实现侧最小变更（可测性）

| 文件 | 变更 |
|------|------|
| `src/dev-tool/injections/rank-active-session.ts` | `buildMidBO` 由内部函数改为 **`export function buildMidBO`**，供单测直接断言边界（逻辑体未改）。 |
