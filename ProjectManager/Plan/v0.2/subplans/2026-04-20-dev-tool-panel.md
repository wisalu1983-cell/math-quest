# 开发者工具栏子计划

> 创建：2026-04-20
> 所属版本：v0.2
> 正式 ID：`v0.2-1-1`
> 父计划：[`Plan/v0.2/phases/phase-1.md`](../phases/phase-1.md)（Phase 1 · 效率基建 + 低成本修复）
> 设计规格：
> - 调研：[`Specs/dev-tool-panel/2026-04-20-research-findings.md`](../../../Specs/dev-tool-panel/2026-04-20-research-findings.md)
> - 方案：[`Specs/dev-tool-panel/2026-04-20-design-proposal.md`](../../../Specs/dev-tool-panel/2026-04-20-design-proposal.md)
> 状态：🟡 进行中（方案已审核通过，进入实施）
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
