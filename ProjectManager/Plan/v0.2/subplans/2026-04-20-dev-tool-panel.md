# 开发者工具栏子计划

> 创建：2026-04-20
> 所属版本：v0.2
> 正式 ID：`v0.2-1-1`
> 父计划：[`Plan/v0.2/phases/phase-1.md`](../phases/phase-1.md)（Phase 1 · 效率基建 + 低成本修复）
> 设计规格：
> - 调研：[`Specs/dev-tool-panel/2026-04-20-research-findings.md`](../../../Specs/dev-tool-panel/2026-04-20-research-findings.md)
> - 方案：[`Specs/dev-tool-panel/2026-04-20-design-proposal.md`](../../../Specs/dev-tool-panel/2026-04-20-design-proposal.md)
> 状态：🟢 实施完成（2026-04-20 当日代码落盘 + 本地双构建验证通过，待 CI 首次生产发布）
> 短代号：DevToolPanel（对应 v0.2 反馈中 **F3**）

---

## 一、背景

v0.2 主线下的 Phase 1 杠杆性子计划：建一个仅 DEV 可见的**本地状态一键注入面板**，把后续 Phase 2~5 的人工验证场景（段位赛中途态、进阶星级、关卡 cursor、BO 一致性异常等）从"手动打到那个状态"压缩到"点一下即达"。

同时解决一个上线外网诉求：**生产环境双构建双路径发布**——纯净版（无 F3）供真实测试，测试版（带 F3）供作者在外网调试。

### 前置相关规格（开工前必读）

> 📑 规格索引：[`Specs/_index.md`](../../../Specs/_index.md)

| 规格 | 本计划从中继承的硬约束 |
|---|---|
| [`Specs/dev-tool-panel/2026-04-20-design-proposal.md`](../../../Specs/dev-tool-panel/2026-04-20-design-proposal.md) | 本子计划的方案定稿（4 决策点 + 双构建方案 + 注入项清单 + 验收标准）|
| [`Specs/dev-tool-panel/2026-04-20-research-findings.md`](../../../Specs/dev-tool-panel/2026-04-20-research-findings.md) | 存档层 key 清单、Store 结构、既有 DEV 钩子、注入项与数据路径映射 |
| `Specs/2026-04-18-rank-match-phase3-implementation-spec.md` | 段位赛一致性异常不得静默降级（§5.8）：F3 构造活跃 BO 态失败时必须抛 `RankMatchRecoveryError` |
| `Specs/2026-04-15-gamification-phase2-advance-spec.md` | `TOPIC_STAR_CAP`：A01/A04/A08 = 3★ / 其余 = 5★；F3 的"进阶星级注入"按 cap 反推 heartsAccumulated 时要尊重此表 |
| `Specs/2026-04-14-ui-redesign-spec.md` | 阳光版 v5：F3 的 FAB + 抽屉 UI 色彩 / 字号 / 间距应与主站一致，不强加冲突样式 |

### 跨系统维度清单

- [ ] 难度档位 / 题型梯度数
- [x] 星级 / 进阶 / 段位数值（注入项需遵守 `TOPIC_STAR_CAP`）
- [ ] 关卡结构 / campaign.ts（只读不改）
- [x] UI 组件 / 卡片尺寸（新增 FAB + Drawer，不改现有组件）
- [ ] 答题形式 / 验证逻辑
- [x] 其他：**存档层 key 构造**（引入 namespace 前缀，影响所有 `mq_*` 读写路径）

### 工作脉络

4 步工作流（见 [`Plan/v0.2/04-execution-discipline.md`](../04-execution-discipline.md)）执行情况：

| 步骤 | 状态 | 产出 |
|---|---|---|
| 1. 预期效果提炼 | ✅ | 对话中确认：验证时间成本降低、不污染正式数据、覆盖段位/进阶/关卡/局内心数/页面跳转/题型直达 |
| 2. 资料调研 | ✅ | [`Specs/dev-tool-panel/2026-04-20-research-findings.md`](../../../Specs/dev-tool-panel/2026-04-20-research-findings.md) |
| 3. 方案设计 | ✅ | [`Specs/dev-tool-panel/2026-04-20-design-proposal.md`](../../../Specs/dev-tool-panel/2026-04-20-design-proposal.md) |
| 4. 审核 | ✅ | 2026-04-20 用户逐项拍板 4 决策点 + 双构建方案 + robots 屏蔽策略 |

---

## 二、实施任务

### T1 · 存档层 namespace 切换（~3h）

**文件**：`src/repository/local.ts`

- 引入 `let keyPrefix = 'mq_'`
- 所有 `STORAGE_KEY_*` 常量改为函数，运行时拼前缀
- 导出 `setStorageNamespace(ns: 'main' | 'dev')`：更新 `keyPrefix`
- `clearAll()` 的清理范围限定在**当前 namespace**下的 key（不跨 namespace 删除）

**单测**（新增 `src/repository/local.test.ts` 或补充现有测试）：
- default prefix 是 `mq_`
- 切到 `dev` 后 key 构造为 `mq_dev_*`
- 切回 `main` 读取的是原来 `mq_*` 数据（不互相覆盖）

### T2 · `src/dev-tool/` 骨架（~3h）

**新增文件**：
- `src/dev-tool/types.ts`：`DevInjection` / `DevInjectionGroup`
- `src/dev-tool/index.tsx`：`DEV_TOOL_ENABLED` 常量 + `mountDevTool()` 入口
- `src/dev-tool/DevFab.tsx`：右下角悬浮按钮
- `src/dev-tool/DevDrawer.tsx`：侧栏抽屉(分组列表 + namespace 切换开关 + 清空测试沙盒按钮)
- `src/dev-tool/namespace.ts`：封装 `useDevNamespace()` hook（`'main' | 'dev'` 状态 + 切换函数 + 触发 repo 重载）

**入口挂载**：`src/main.tsx` 在 `ReactDOM.createRoot(...).render(<App />)` 之后调 `mountDevTool()`

### T3 · 注入项实现（~4h）

**新增文件** `src/dev-tool/injections/`：

- `campaign.ts`：`unlock-level` / `complete-all`
- `advance.ts`：`set-stars`（按 `TOPIC_STAR_CAP` 反推 heartsAccumulated）
- `rank-progress.ts`：`set-tier`（5 档）
- `rank-active-session.ts`：`construct-active-bo`（支持 rookie BO3 / pro/expert BO5 / master BO7 的 2:1 / 3:2 / 4:3 常用中途态）+ `clear-active`
- `in-game.ts`：`set-hearts`（1/2/3）/ `finish-session`
- `navigation.ts`：`goto-topic` × 8 题型 + `goto-page` × 14 页面
- `_registry.ts`：import 上面 6 个文件，`export const allInjections: DevInjection[]`

每个 `run()` 内部通用 helper：

```ts
async function applyAndReload(mutate: () => void | Promise<void>) {
  await mutate();                    // 改 localStorage
  await repository.init();           // 重新加载到 store
}
```

### T4 · 双构建改造（~1.5h）

- `vite.config.ts`：`base` 按 `VITE_ENABLE_DEV_TOOL` 切换为 `/math-quest/dev/` 或 `/math-quest/`
- `package.json`：新增 `build:with-dev-tool` script + `cross-env` devDependency
- `.github/workflows/deploy.yml`：串行跑两次 build → 合并输出目录 → 一次部署

**验证**：本地跑两次 build，对比两份 `index.html` + `assets/` 路径正确；手工 grep `dist/` 不含 `DevFab`

### T5 · 搜索引擎屏蔽（~0.3h）

- `public/robots.txt` 新建：`User-agent: *\nDisallow: /`
- `index.html` `<head>` 内加 meta noindex / nofollow

### T6 · 回归 + 收尾（~2h）

- `npm run build` 绿
- `vitest` 全绿（含 T1 新增用例）
- `npm run lint` 不引入新 error
- 本地 `preview` 验证双产物
- 记录首次生产发布验证截图（`Reports/` 或 Issue comment，按需）

---

## 三、验收标准

见 [`Specs/dev-tool-panel/2026-04-20-design-proposal.md` §六](../../../Specs/dev-tool-panel/2026-04-20-design-proposal.md)。

关键关门条件：
1. **生产纯净版**产物不含 F3 任何代码（grep 验证）
2. **生产测试版** URL 打开可见 FAB 并能成功注入所有清单项
3. **namespace 切换**往返正式/测试沙盒，正式数据零改变

## 四、风险 / 回滚

### 回滚策略

本子计划所有改动都在新文件 `src/dev-tool/` 下 + 少量既有文件（`vite.config.ts` / `package.json` / `repository/local.ts` / `main.tsx` / `index.html` / `.github/workflows/deploy.yml`）。

- **代码回滚**：`git revert <commit>` 即可，不涉及数据层 schema 变更
- **数据回滚**：namespace 切换是运行时行为，`mq_*`（正式数据）全程未被触碰；`mq_dev_*` 可随时 `clearAll()` 清理
- **CI 回滚**：deploy.yml 回滚后下一次 push 即恢复单 build 部署

### 主风险

见方案设计 §四，最关键两条：
1. `repository/local.ts` 改造面覆盖所有 key 路径——通过单测守护
2. 双构建 tree-shake 不干净——通过 grep 验证 + CI 工序

## 五、依赖关系

- **前置**：无硬依赖。Phase 1 进入条件（v0.2 主线方向确认）已达成
- **对后续 Phase 的作用**：Phase 2/3/4/5 的人工验证场景均可复用 F3 注入项
- **未来扩展对接**：`v0.2-5-1`（F2 历史记录）开工时，在 `src/dev-tool/injections/` 新增 `history-records.ts` 注册到 `_registry.ts`，本子计划不提前为其建能力

## 六、时间估算

**合计 ~13.8h ≈ 2 人日**，落在 Phase 1 容量内。拆分见 §二各任务。

## 七、实施落盘（2026-04-20）

### 已完成任务

| 任务 | 状态 | 关键产出 |
|---|---|---|
| T1 · 存档层 namespace 切换 | ✅ | `src/repository/local.ts` 引入 `keyPrefix` + `setStorageNamespace`/`getStorageNamespace`；`clearAll()` 按 namespace 精确清理；`local.test.ts` 新增 6 条用例（32/32 绿）|
| T2 · `src/dev-tool/` 骨架 | ✅ | `types.ts` / `index.tsx`（动态 import + tree-shake 友好）/ `DevFab.tsx` / `DevDrawer.tsx` / `namespace.ts`（含 `applyAndReload` helper） |
| T3 · 注入项实现 | ✅ | 6 组 + `_registry.ts`：campaign 9 条（含 complete-all）/ advance 10 条（封顶 + 清空）/ rank 5 档 + 4 个 BO 中途态 + 清活跃 / in-game 3 心位 + finish-session / navigation 14 页面 + 8 题型直达 |
| T4 · 双构建 | ✅ | `vite.config.ts` base 按 `VITE_ENABLE_DEV_TOOL` 切换；`package.json` 新增 `build:with-dev-tool` + `cross-env@^7.0.3` 依赖；`.github/workflows/deploy.yml` 串行双 build + merge + F3-guard grep |
| T5 · 搜索引擎屏蔽 | ✅ | `public/robots.txt`（两版 build 均含）+ `index.html` meta robots/googlebot noindex,nofollow |
| T6 · 回归验证 | ✅ | `vitest` 479/479 绿；本次改动文件 `eslint` 零 error；`npm run build` / `npm run build:with-dev-tool` 双双成功；grep 验证 `dist/` 不含 `mq-dev-tool-root`/`DevFab`/`DevDrawer`，仅 `dist/dev/assets/dev-tool-*.js` 含 F3 代码 |

### 主要实现要点

1. **Tree-shake 纯净度**：`main.tsx` 用 `if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_TOOL === '1') { import('@/dev-tool').then(...) }` 把动态 import 放在编译期常量守卫下。纯净版 build 下常量折叠为 `false`，Rollup DCE 把整块 dev-tool 代码及其依赖全部丢弃，不生成 `dev-tool-*.js` chunk。带 F3 版 build 下产出 `assets/dev-tool-*.js`（14.58 kB gzip 5.51 kB）。
2. **namespace 切换语义**：`switchDevNamespace(ns)` 清掉当前 session/active BO 的内存态 → `setStorageNamespace` → `repository.init()` → 重新加载 user/gameProgress/activeRankMatch。沙盒为空时自动回 onboarding，复用主 App 已有的 `user === null` → `onboarding` 引导逻辑。
3. **注入项一致性**：每个注入项 `run()` 内部先直接 `repository.saveXxx` 改存档，再 `applyAndReload()` 触发 gameProgress/rankMatch 重载；段位赛 BO 中途态构造复用 `nanoid` + `RANK_BEST_OF`/`RANK_WINS_TO_ADVANCE` 常量表，对 wins/losses 组合做边界校验，违反则抛 `RankMatchRecoveryError`（尊重 Spec §5.8）。
4. **双构建验证链**：workflow 里加了 `grep -r "mq-dev-tool-root" dist/` 断言，本地也跑过：纯净版 `dist/` grep 零命中，`dist/dev/` 命中 `assets/dev-tool-*.js`。

### 非阻断性疑问（请您择时拍板）

1. **清理 pre-existing lint（161 errors / 1 warning）是否纳入本子计划**？我已确认本次改动文件 `src/dev-tool/` + `src/repository/local.ts` + `src/main.tsx` 零 lint error。但 `RankMatchGameResult.tsx` / `store/*.ts` / `test-results/*.ts` 有大量 pre-existing 问题。Plan §T6 明确只要求"不引入新 error"，已满足。建议另起一个"代码卫生修缮"子计划处理。
2. **测试沙盒首次切换后需重新 Onboarding**：切到 `dev` 后发现沙盒里没有 user → 跳 onboarding 让用户创建一个 dev 账号。未来若觉得繁琐可以新增一个"沙盒快速初始化"注入项（一键造 user + 默认进度），但本子计划未预实现，遵循"工具性子计划不为未来功能预造能力"的纪律。
3. **BO 中途态刷新恢复的期望行为**：F3 构造的"末局未开始"BO，其 `practiceSessionId` 是占位 nanoid，没有对应的 PracticeSession。若用户在 Hub 点击开始该局但**刷新浏览器**，App 启动路径会 `resumeRankMatchGame(占位 id)` → 找不到 PracticeSession → 按 Spec §5.8 抛 `RankMatchRecoveryError`，UI 回 Hub，activeSessionId 被清。这符合项目"段位赛一致性异常不得静默降级"的原则；只想提醒：**F3 注入的 BO 不允许"在 practice 页刷新"恢复**——预期用户应在 Hub → 开始第 N 局 → 走完该局或在 practice 页内操作（不刷新）。
4. **FAB 颜色在 dev namespace 时从黑变绿**：这是我自己加的视觉区分，Plan 未明确要求。如觉多余可去掉。
5. **`Navigation` 组"跳转 onboarding"入口**：我加了跳 onboarding 页的按钮。若你希望用"切到测试沙盒 + 清空沙盒"来触发 onboarding 才是正途，这个直接跳转入口可以移除（当前行为：跳到 onboarding 但 user 仍存在，App 的 effect 可能立刻把它换回 home）。

### 验收清单对齐（Spec §六）

- [x] DEV 启动：`npm run dev` 启动，动态 import 注入，FAB 在右下角可见
- [x] Namespace 隔离（单测覆盖）：`local.test.ts` 6 条新增用例全绿
- [x] 注入项有效性：用户 2026-04-21 人工 QA 确认通过
- [x] 双构建产物：`dist/` 纯净 + `dist/dev/` 带 F3 + 两处 robots.txt + meta noindex 全部就绪
- [ ] 生产发布后：待本次改动 push 到 master 触发 CI，按 workflow 新增的 grep-guard 断言通过
- [x] 既有工程：`vitest` 501/501 绿（含本子计划新增 22 条，详见 `QA/2026-04-20-f3-dev-tool-unit-test/qa-result.md`）；`npm run build` 绿；本次改动文件 `eslint` 零新 error

