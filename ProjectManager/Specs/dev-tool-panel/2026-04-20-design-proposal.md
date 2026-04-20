# 开发者工具栏（Dev Tool Panel）· 方案设计定稿

> 创建：2026-04-20  
> 所属功能：`dev-tool-panel`（v0.2 主线内对应反馈代号 **F3**；正式子计划 ID `v0.2-1-1`）  
> 所属版本：v0.2  
> 父计划：`ProjectManager/Plan/v0.2/phases/phase-1.md`
> 前置调研：[`./2026-04-20-research-findings.md`](./2026-04-20-research-findings.md)
> 状态：✅ 第 3 步完成（用户已逐项拍板 4 个决策点 + 外网发布策略）
> 4 步工作流位置：第 2 步 ✅ → [第 3 步 方案设计]（本文件）→ 第 4 步 审核

---

## 代号速查

| 代号 / 术语 | 梗概 |
|---|---|
| **F3 · 开发者工具栏** | v0.2 反馈中编号 F3 的诉求：一键把本地状态拨到任意测试场景，仅 DEV 可见 |
| **Namespace 切换** | 把 localStorage 的 key 前缀从 `mq_` 换到 `mq_dev_` 做数据域隔离 |
| **tree-shake** | Vite 构建时把不会执行的代码物理丢弃，让生产产物里根本没有那段代码 |
| **声明式清单（D1）** | 所有注入项集中在 `injections/` 目录下，每组一个文件导出数组；聚合到一个 `_registry.ts` 便于审查 |

---

## 一、4 个决策点 · 锁定结果

| 点 | 决策 | 理由 |
|---|---|---|
| **A · 存档隔离** | **A1 · Namespace 切换** | 与 `repository` 既有的迁移/备份纪律最贴合；足以解决"不污染正式数据"；"多场景并存 / 测 onboarding"等账号级诉求当前频率不高，不值得付产品级改造代价 |
| **B · UI 形态** | **B1 · 悬浮 FAB + 侧栏抽屉** | 不打断当前调试页上下文；侧栏天然适合"分组 + 长列表"的注入项展示 |
| **C · 触发方式** | **DEV 自动显示** + **生产双构建双路径** | DEV 环境右下角 FAB 常驻；生产环境分两份产物：`/math-quest/` 纯净版 + `/math-quest/dev/` 带 F3 版 |
| **D · 注入项组织** | **D1 · 声明式清单** | `injections/` 目录下每组一个文件 + `_registry.ts` 聚合；审查和扩展最直观；与"工具性子计划范围规则"里"预留扩展位不预实现"的纪律对齐 |

## 二、架构设计

### 2.1 目录结构

```
src/dev-tool/
├── index.tsx               DevTool 入口（DEV_TOOL_ENABLED 守卫）
├── DevFab.tsx              右下角悬浮按钮（56x56 圆形，带"DEV"标识）
├── DevDrawer.tsx           侧栏抽屉（右侧，Tailwind 样式对齐现有设计）
├── namespace.ts            namespace 切换（A1 配套：start/stop/clear）
├── types.ts                DevInjection 类型定义
└── injections/
    ├── _registry.ts        聚合导出 allInjections
    ├── campaign.ts         关卡位置注入（8 题型 × 关卡 cursor）
    ├── advance.ts          进阶星级注入（任一题型任一星级 + 升星临界）
    ├── rank-progress.ts    段位等级注入（5 档切换）
    ├── rank-active-session.ts  BO 赛事中途态构造
    ├── in-game.ts          局内心数 / 刚结束状态
    └── navigation.ts       页面跳转 / 题型直达
```

### 2.2 核心类型

```ts
// src/dev-tool/types.ts
export type DevInjectionGroup =
  | 'campaign' | 'advance' | 'rank' | 'in-game' | 'navigation' | 'ext';

export interface DevInjection {
  id: string;               // 全局唯一标识
  group: DevInjectionGroup;
  label: string;            // UI 显示
  description: string;      // 更详细说明，hover 展示
  run(): Promise<void> | void;
}
```

### 2.3 总开关（关键）

```ts
// src/dev-tool/index.tsx
export const DEV_TOOL_ENABLED =
  import.meta.env.DEV ||                             // 本地开发自动开
  import.meta.env.VITE_ENABLE_DEV_TOOL === '1';      // 生产构建显式开

export function mountDevTool() {
  if (!DEV_TOOL_ENABLED) return;                     // tree-shake 边界
  // 挂载 DevFab 到 body
}
```

### 2.4 Namespace 切换（A1 实现细节）

改动 `src/repository/local.ts`：

```ts
// 新增：所有 key 构造经过 prefix
let keyPrefix = 'mq_';

export function setStorageNamespace(ns: 'main' | 'dev') {
  keyPrefix = ns === 'dev' ? 'mq_dev_' : 'mq_';
}

const STORAGE_KEY_USER          = () => `${keyPrefix}user`;
const STORAGE_KEY_GAME_PROGRESS = () => `${keyPrefix}game_progress`;
// ... 其余 4 个 key 同样改造
```

**运行期**：
1. 默认启动时 prefix = `mq_`，与现有行为完全一致
2. F3 抽屉顶部有 `[ 正式数据 / 测试沙盒 ]` 切换开关
3. 切到"测试沙盒"时：`setStorageNamespace('dev')` → 所有后续读写落 `mq_dev_*` → 重新触发 `repository.init()` 加载沙盒数据（若不存在则走 onboarding 首启）
4. 切回"正式数据"：`setStorageNamespace('main')` → 重新触发 init → 读回真实数据
5. 抽屉有 `[ 清空测试沙盒 ]` 按钮：逐个 removeItem `mq_dev_*`

**绝对红线**：
- ❌ F3 任何操作不得触碰 `mq_*`（仅 `mq_dev_*`），除非用户在"正式数据"模式下主动点某个注入项（此时视为用户自担风险）
- ❌ F3 不得修改 `mq_version`
- ❌ F3 不得越界到 `mq_backup_*` 迁移备份 key

### 2.5 注入项清单（初版）

| 分组 | 注入项 ID | 描述 | 数据落点 |
|---|---|---|---|
| `campaign` | `campaign.unlock-level` | 推进任一题型的关卡 cursor 到指定 levelId | `gameProgress.campaignProgress[topicId].completedLevels[]` |
| `campaign` | `campaign.complete-all` | 全部题型全关卡通关 | 同上 |
| `advance` | `advance.set-stars` | 设定任一题型进阶星级（支持升星临界值）| `advanceProgress[topicId].heartsAccumulated` 按 cap 反推 |
| `rank` | `rank.set-tier` | 段位设为 apprentice / rookie / pro / expert / master | `rankProgress.currentTier` |
| `rank` | `rank.construct-active-bo` | 构造任一段位 BO 赛事中途态（如 BO5 打到 2:1）| `mq_dev_rank_match_sessions` + `rankProgress.activeSessionId` |
| `rank` | `rank.clear-active` | 清空活跃 BO（修复一致性异常）| 同上 |
| `in-game` | `in-game.set-hearts` | 当前局剩余心数 = 1/2/3 | `useSessionStore.hearts` + PracticeSession.heartsRemaining |
| `in-game` | `in-game.finish-session` | 一键结束当前局走到结算页 | `useSessionStore.endSession()` |
| `navigation` | `nav.goto-topic` | 跳题型首关：`startCampaignSession(topicId, firstLevelId)` + 跳 practice | `useSessionStore.startCampaignSession` + `setPage('practice')` |
| `navigation` | `nav.goto-page` | 跳到任一 currentPage 枚举 | `useUIStore.setPage` |
| `ext` | — | **预留扩展位**，标注"待 `v0.2-5-1`（F2 历史记录）开工时填入" | — |

## 三、生产双构建双路径发布方案

### 3.1 URL 形态（GitHub Pages）

- **纯净版**：`https://<user>.github.io/math-quest/`（与当前完全一致，无破坏性变更）
- **测试版**：`https://<user>.github.io/math-quest/dev/`

### 3.2 Vite 配置改动

```ts
// vite.config.ts
export default defineConfig(() => {
  const isProd = process.env.NODE_ENV === 'production';
  const devToolEnabled = process.env.VITE_ENABLE_DEV_TOOL === '1';
  const base = !isProd
    ? '/'
    : devToolEnabled
      ? '/math-quest/dev/'
      : '/math-quest/';
  return {
    base,
    // ... 其余保持不变
  };
});
```

### 3.3 package.json 改动

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "build:with-dev-tool": "cross-env VITE_ENABLE_DEV_TOOL=1 tsc -b && cross-env VITE_ENABLE_DEV_TOOL=1 vite build --outDir dist-dev"
  },
  "devDependencies": {
    "cross-env": "^7.x"
  }
}
```

（Windows 本地开发也能跑，不只 Linux CI）

### 3.4 `.github/workflows/deploy.yml` 改动

```yaml
- name: Build (clean)
  run: npm run build                               # → dist/

- name: Build (with dev tool)
  run: npm run build:with-dev-tool                 # → dist-dev/

- name: Merge outputs
  run: |
    mkdir -p dist/dev
    cp -r dist-dev/* dist/dev/

- name: Deploy to gh-pages
  uses: peaceiris/actions-gh-pages@v4
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./dist
```

### 3.5 搜索引擎屏蔽（两版都加）

- **`public/robots.txt`**（新建）：`User-agent: *\nDisallow: /`——同时被两次 build 拷入 `dist/` 和 `dist/dev/`
- **`index.html` `<head>` 内**：`<meta name="robots" content="noindex, nofollow">` + `<meta name="googlebot" content="noindex, nofollow">`

## 四、风险 / 缓解

| 风险 | 发生概率 | 缓解 |
|---|---|---|
| `namespace.ts` 改 `repository` 层影响生产路径 | 中 | 默认 prefix=`mq_`；所有生产调用路径不切换；加 vitest 单测覆盖"切换前后各 key 构造正确" |
| tree-shake 未干净，F3 代码漏进纯净版 bundle | 中 | 发布前跑 `npm run build` 后用 `rg "dev-tool\|DevFab" dist/assets/` 扫一下；出现即调整入口导入方式 |
| 构造 BO 赛事中途态时 store ↔ localStorage 不同步 | 高 | 每个注入项 `run()` 内**先写存档再 `repository.init()` 重载 store**；或统一走一个 `applyAndReload()` helper |
| 用户在"正式数据"模式下误点注入项污染真实进度 | 中 | 抽屉顶部显著横条标"⚠️ 正式数据模式"；每个注入项 `run()` 前若检测到 namespace=main 弹二次确认 |
| 双构建产物路径冲突（资源 404）| 中 | 两次 build 用不同 `base`（`/math-quest/` vs `/math-quest/dev/`）；部署后 curl 各自 index 验证 |
| robots.txt 不能 100% 防所有爬虫 | 低 | 叠加 meta noindex；GitHub Pages 本身 repo 私有/公开不影响爬虫（我们 repo 是公开的）；教育类 app 无敏感数据，风险可控 |

## 五、工作量估算

| 工作块 | 小时 | 说明 |
|---|---|---|
| Namespace 切换改造 `repository/local.ts` + 单测 | 3h | 覆盖所有 key 改写；+ 2~3 条 vitest case |
| `src/dev-tool/` 骨架（FAB + Drawer + types + registry） | 3h | Tailwind 样式对齐现网设计 |
| 注入项 6 组实现 + 联调 | 4h | 每组 0.5~1h，包含 apply-and-reload helper |
| 双构建改造（vite.config + package.json + workflow） | 1.5h | 含 CI 验证一次 |
| robots.txt + meta noindex | 0.3h | — |
| vitest 绿 + lint 绿回归 | 1h | — |
| Plan / Spec 文档收尾 | 1h | — |
| **合计** | **~13.8h ≈ 2 人日** | Phase 1 定位"效率基建"可接受 |

## 六、验收标准

1. **DEV 启动**：`npm run dev` 后浏览器自动显示右下角 FAB；点击打开侧栏抽屉
2. **Namespace 隔离**：抽屉切换到"测试沙盒"后，浏览器 F12 `localStorage` 面板显示 `mq_dev_*` 一组 key；切回"正式数据"时真实进度原样恢复
3. **注入项有效性**：每条注入项执行后，UI 显示的状态与注入目标一致（例：段位设为 master 后 `/rank-match` 页 UI 反映 master）
4. **双构建产物**：
   - `dist/index.html` 不含 `DevFab` 字符串（grep 验证）
   - `dist/dev/index.html` 含 F3 代码
   - `dist/robots.txt` 与 `dist/dev/robots.txt` 都含 `Disallow: /`
   - 两个 index.html 都含 `<meta name="robots" content="noindex...">`
5. **生产发布后**：
   - `https://<user>.github.io/math-quest/` 打开无 F3 入口
   - `https://<user>.github.io/math-quest/dev/` 打开有 F3 入口
6. **既有工程**：`npm run build` 绿；`vitest` 全绿（新增 namespace 测试也通过）；`npm run lint` 不新增 error

## 七、开工时自检清单（工具性子计划范围规则配套）

- [x] `campaign` / `advance` / `rank` / `in-game` / `navigation` 5 组注入项对应的产品功能均已运行在现仓库（见调研报告 E 节）
- [x] `ext` 扩展位**不预实现**任何具体项，仅留挂点；待 `v0.2-5-1`（F2 历史记录）开工时新增 `src/dev-tool/injections/history-records.ts` 注册到 `_registry.ts`
- [x] 未向 `v0.2` 后续 Phase（2/3/4/5）中尚未实现的功能预造工具能力
