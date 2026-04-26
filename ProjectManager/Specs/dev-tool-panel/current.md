# Dev Tool Panel Current Spec

> 功能 slug：`dev-tool-panel`
> 当前状态：已实施并作为开发 / 测试工具生效
> 首次建立：2026-04-26
> 最近确认：2026-04-26
> 最近来源：`ProjectManager/Plan/v0.2/subplans/2026-04-20-dev-tool-panel.md`、`QA/runs/2026-04-20-f3-dev-tool-unit-test/qa-result.md`、当前代码入口

---

## 1. 当前承诺

- 开发者工具栏是仅供开发 / 测试使用的状态注入工具，用于快速构造 campaign、advance、rank-match、局内状态、页面导航和历史记录测试场景。
- 本地开发环境默认启用；生产环境只有显式 `VITE_ENABLE_DEV_TOOL=1` 的 dev 构建启用。
- 纯净生产构建不得包含 F3 工具入口或 dev-tool chunk。
- 工具栏支持 `mq_` 正式数据与 `mq_dev_` 测试沙盒 namespace 切换；沙盒清理不得跨 namespace 删除正式数据。
- 注入项通过声明式 registry 管理，新增组必须进入 `src/dev-tool/injections/_registry.ts`。

## 2. 当前行为

### 2.1 启用与挂载

- `src/main.tsx` 只在 `import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_TOOL === '1'` 为真时动态 import `@/dev-tool`。
- `src/dev-tool/index.tsx` 将工具挂载到 `document.body` 下的 `mq-dev-tool-root`。
- UI 入口是右下角 FAB，点击后打开右侧抽屉。

### 2.2 Namespace 与数据隔离

- `src/repository/local.ts` 暴露 `setStorageNamespace(ns)` / `getStorageNamespace()`，当前 namespace 控制 repository key 前缀。
- `main` namespace 使用 `mq_*`；`dev` namespace 使用 `mq_dev_*`。
- `switchDevNamespace()` 会清理当前 session / active BO 内存态，切换 namespace 后重新执行 repository / store 加载。
- `clearDevSandbox()` 只能在 `dev` namespace 下调用，并只清理测试沙盒。

### 2.3 注入项范围

当前 registry 包含以下组：

| 分组 | 当前能力 |
|---|---|
| `campaign` | 解锁指定题型关卡、全部通关等 campaign 进度注入 |
| `advance` | 设置 / 清空题型进阶心数与星级，遵守 `TOPIC_STAR_CAP` |
| `rank` | 设置段位等级、构造 / 清理 rank-match BO 中途态 |
| `in-game` | 调整当前局心数、结束当前 session |
| `navigation` | 跳转页面、直达题型 / 关卡 |
| `ext` | 历史记录测试数据：追加覆盖三模式 / 三结果的随机历史记录、清空当前 namespace 历史记录 |

### 2.4 双构建

- `npm run build` 产出纯净版，base 为 `/math-quest/`。
- `npm run build:with-dev-tool` 产出带 dev-tool 的构建，base 为 `/math-quest/dev/`。
- GitHub Pages workflow 先构建纯净版，再构建 dev-tool 版并合并到 `dist/dev/`。
- Workflow 含 F3 guard：纯净版 `dist/` 中若命中 `mq-dev-tool-root` 则失败。

### 2.5 搜索引擎屏蔽

- `public/robots.txt` 对两版构建均生效。
- `index.html` 含 noindex / nofollow meta。

## 3. 非承诺 / 边界

- Dev Tool Panel 不是面向学生或真实用户的产品功能。
- 纯净生产版不得显示 FAB，也不得生成 dev-tool chunk。
- F3 不负责为尚未实现的产品功能预造具体注入能力；新产品功能需要测试状态时，随该功能的 subplan 补充注入项。
- F3 构造的 rank-match BO 中途态用于测试；若构造出的 PracticeSession 与 BO session 不一致，应按 rank-match 规格显式处理异常，不静默降级。
- 旧设计中的“`ext` 仅预留、不实现具体项”已随历史记录功能完成而更新：当前 `ext` 已包含 history records 注入项。

## 4. 来源与证据

| 类型 | 路径 | 说明 |
|---|---|---|
| 调研 | `ProjectManager/Specs/dev-tool-panel/2026-04-20-research-findings.md` | 存档 key、Store、DEV 钩子和可注入状态事实清单 |
| 方案 | `ProjectManager/Specs/dev-tool-panel/2026-04-20-design-proposal.md` | 初版 4 个决策点、双构建方案、注入项清单 |
| 版本 subplan | `ProjectManager/Plan/v0.2/subplans/2026-04-20-dev-tool-panel.md` | v0.2-1-1 实施与落盘记录 |
| QA | `QA/runs/2026-04-20-f3-dev-tool-unit-test/qa-result.md` | 单元测试、限定路径 lint、双构建审计 |
| 代码入口 | `src/main.tsx`、`src/dev-tool/index.tsx`、`src/dev-tool/namespace.ts`、`src/dev-tool/injections/_registry.ts` | 当前实现入口 |
| 构建入口 | `package.json`、`vite.config.ts`、`.github/workflows/deploy.yml` | 双构建与纯净版 guard |

## 5. 变更记录

| 日期 | 来源 | 当前状态变化 |
|---|---|---|
| 2026-04-20 | `ProjectManager/Plan/v0.2/subplans/2026-04-20-dev-tool-panel.md` | F3 开发者工具栏初版落地，包含 namespace、FAB/Drawer、声明式注入项、双构建与 noindex |
| 2026-04-20 | `QA/runs/2026-04-20-f3-dev-tool-unit-test/qa-result.md` | F3 单元测试级审计通过；纯净版无 F3 字符串、dev 版含 dev-tool chunk |
| 2026-04-26 | Living Spec 试点 | 建立本 `current.md`，将已完成状态从历史 subplan / QA / 代码入口收敛为当前权威入口 |
