# 子计划 4 — 下阶段扩展（本阶段只做 Phase 3 段位赛）

> 创建：2026-04-18  
> 最后刷新：2026-04-19（活跃状态入口收敛：`Overview.md` 负责主管视图；本文件保留 Phase 3 执行事实、跨系统约束与父级承接）  
> 父计划：[`2026-04-16-open-backlog-consolidation.md`](2026-04-16-open-backlog-consolidation.md) §四 子计划 4  
> 设计规格：本计划收敛为单块 Umbrella，只覆盖 Phase 3 段位赛一块扩展工作  
> 状态：✅ 已完成（本阶段收敛目标已达成；Phase 3 主线代码、验证与回写均已入仓）

---

## 一、背景

### 1.1 定位

子计划 1 / 2 / 2.5 / 3 已全部闭环，当前本阶段只保留 **Phase 3 段位赛** 这一条主线。主计划 `§四` 仍需要一个显式“子计划 4”父文件承接范围、约束与引用关系，因此本 Umbrella 继续保留。

当前口径只保留三点：

1. **本阶段只做 Phase 3 段位赛**
2. **A03+ 废弃；A09 / B/C/D 本阶段不做**
3. **Phase 3 启动不再依赖 A03+ / A09 闭环**，直接进入“实施级规格 → 实施子子计划 → 代码”

同日多次重排的完整轨迹与动机已下沉到 [`../../Reports/2026-04-18-phase3-umbrella-replan-history.md`](../../Reports/2026-04-18-phase3-umbrella-replan-history.md)；本节不再重复展开。

本 Umbrella Plan 当前的任务**只有一个**：把 Phase 3 段位赛的范围、跨系统硬约束与文档先行纪律在正式动代码前钉牢，并作为实施子子计划的父级依据。

### 1.2 本 Umbrella Plan 不做什么

- **不直接写业务代码**——业务代码归 Phase 3 实施子子计划
- **不承载 Phase 3 实施级规格本体**——具体实现约束以 [`../../Specs/2026-04-18-rank-match-phase3-implementation-spec.md`](../../Specs/2026-04-18-rank-match-phase3-implementation-spec.md) 为权威（见 §六 文档先行纪律）
- **不承诺 Phase 3 完成时间线**——本子计划只锁范围与硬约束，进度节奏交给实施子子计划
- **不承接 A03+ / A09 / B/C/D**——A03+ 废弃；A09 与 B/C/D 本阶段不做，视 Phase 3 落地后情况再评估是否启用独立子计划承载

### 1.3 前置相关规格（开工前必读）

> 📑 规格索引：[`../../Specs/_index.md`](../../Specs/_index.md)

按"维度矩阵"扫描后命中的生效规格（本阶段只做 Phase 3，清单按此收敛）：

| 规格 | 本计划从中继承的硬约束 |
|---|---|
| [`Specs/2026-04-10-gamification-redesign.md`](../../Specs/2026-04-10-gamification-redesign.md) | 三层游戏化体系（闯关 / 进阶 / 段位赛）；段位赛 §5 五段位、BO 制、新内容点分配、单关规则；"心"作为跨层统一语义 |
| [`Specs/2026-04-13-star-rank-numerical-design.md`](../../Specs/2026-04-13-star-rank-numerical-design.md) | 统一星级（3★/5★）与各段位入场门槛数值；时间节奏测算；心→星→段位换算链 |
| [`Specs/2026-04-15-gamification-phase2-advance-spec.md`](../../Specs/2026-04-15-gamification-phase2-advance-spec.md) | **`TOPIC_STAR_CAP`** 硬约束：A01/A04/A08 为 3★（2 梯度），A02/A03/A05~A07 为 5★（3 梯度）——Phase 3 段位入场资格直接依赖该上限 |
| [`Specs/2026-04-14-difficulty-standard.md`](../../Specs/2026-04-14-difficulty-standard.md) | `difficulty=5` = 上海五年级小升初正常考试水平；段位赛混合题抽题的难度锚点 |
| [`Specs/2026-04-14-ui-redesign-spec.md`](../../Specs/2026-04-14-ui-redesign-spec.md) | 阳光版 v5 视觉语言；段位赛新页面（Hub / Session / Result）必须遵守 |
| [`Specs/2026-04-17-generator-redesign-v2.md`](../../Specs/2026-04-17-generator-redesign-v2.md) | v2.2 题型规格（A01~A08）；段位赛跨题型抽题直接从这 8 个生成器取题 |

> **历史参考**（本阶段不进入 Phase 3 实施链路，但不从文件系统删除）：
> - [`Specs/2026-04-09-a03-block-b-design.md`](../../Specs/2026-04-09-a03-block-b-design.md) — A03 块B 原始设计，已落地
> - [`Specs/2026-04-18-a03-block-b-plus-design.md`](../../Specs/2026-04-18-a03-block-b-plus-design.md) — A03+ 轻量路线设计，本阶段废弃不实施

### 1.4 跨系统维度清单

本 Umbrella（收敛为单块 Phase 3）命中的跨系统维度：

- [x] **星级 / 进阶 / 段位数值** — Phase 3 段位赛，直接依赖进阶星级与 `TOPIC_STAR_CAP`
- [x] **UI 组件 / 卡片尺寸** — Phase 3 段位赛新页面（Hub / Session / Result）
- [x] **答题形式 / 验证逻辑** — 段位赛混合题型统一答题入口（跨题型抽题 + BO 多局包装）
- [x] **GameSessionMode 枚举 / GameProgress 形状** — 新增 `'rank-match'` 与 `rankProgress` 字段
- [x] **持久化 / 存档迁移** — `repository/local.ts` `CURRENT_VERSION` 升级 + `rankProgress` 迁移
- [ ] **难度档位 / 题型梯度数** — 本阶段不改
- [ ] **关卡结构 / campaign.ts** — 本阶段不改
- [ ] **`TopicId` 枚举** — 本阶段不改
- [ ] **真题库** — 本阶段不改

### 1.5 工作脉络

本计划当前口径下的存在意义：

1. **承接主计划 `§四` 的"子计划 4"引用链** —— 即使已收敛为单块，也需要稳定的父文件入口
2. **汇总 Phase 3 的开工前约束** —— 前置规格栏、跨系统维度清单、状态面板都在本文件持有
3. **作为实施子子计划的父级收口依据** —— 代码与里程碑执行细节下放，但范围与约束在这里定稿

---

## 二、本阶段扩展工作范围（单块 = Phase 3 段位赛）

### 2.1 块 P3 — 游戏化 Phase 3（段位赛，本阶段唯一主线）

**定位**：补齐三层游戏化的最后一层，让"闯关→进阶→段位赛"的完整闭环真正跑通。本块是**全新模式**，直接进入代码实施链路。用户 2026-04-18 明确"本阶段只做 Phase 3"，且 Phase 3 启动**不再依赖 A03+ / A09 闭环**——段位赛抽题器基于 v2.2 已稳定的 A01-A08 八个题型，题库多样性已足够。

**范围草图**：
- 类型层：`GameSessionMode` 追加 `'rank-match'`；`GameProgress` 追加 `rankProgress`；新增 `RankTier` / `RankMatchSession` / `RankMatchGame` 类型
- 常量层：五段位定义、入场门槛（已在 `2026-04-13-star-rank-numerical-design.md` §3.2）、BO 赛制、新内容点编排规则（§Q9）、题目数/场与计时规则
- 算法层：
  - 段位赛入场校验（根据 `advanceProgress` 的星级快照）
  - BO 赛制状态机（BO3/BO5/BO7，累积胜场、单局心 ×3 独立重置）
  - 题库抽题器（跨题型混合出题 + 新内容点 ≥40%、主考项保证、复习题 ≤25%）
- 存储层：`repository/local.ts` `CURRENT_VERSION` 升级 + `rankProgress` 持久化与迁移（段位 / 段位赛历史 / 当前活跃段位）
- UI 层：Home 段位赛入口（已占位"刷星升级，向段位赛进发"）、`RankMatchHub` / `RankMatchSession` / `RankMatchResult` 新页面
- 结算层：单局结算、BO 整体结算、晋级动画、失败复盘（展示薄弱题型）

**挂靠子子计划**：[`Plan/v0.1/2026-04-18-rank-match-phase3-implementation.md`](2026-04-18-rank-match-phase3-implementation.md)

**实施级规格**：
- [`../../Specs/2026-04-18-rank-match-phase3-implementation-spec.md`](../../Specs/2026-04-18-rank-match-phase3-implementation-spec.md) — Phase 3 实施级规格：数据模型 + Session 状态机 + 抽题器算法 + `local.ts` 迁移 + UI 页面信息架构

**启动前置条件**：无额外代码前置。Phase 3 产品层规格已基本齐备，直接进入"两份 Specs 事实源对齐 → 实施级规格落盘 → 实施子子计划落盘 → 代码"的链路。

### 2.2 A03+ / A09 / B/C/D 的本阶段处置

- **A03+**：本阶段**废弃不实施**。设计规格 `Specs/2026-04-18-a03-block-b-plus-design.md` 文件保留作历史参考；`_index.md` 状态改为"历史参考（本阶段不实施）"；Umbrella 与主计划相关叙述全部改口；代码侧无改动。
- **A09 分数运算**：本阶段**不做**。若 Phase 3 落地后决定启动，再单独立子计划承载。
- **B/C/D 领域扩展**：本阶段**不做**，且不再以"子计划 5 领域扩展 roadmap"预立名；视 Phase 3 落地后整体节奏再评估。

---

## 三、本阶段执行顺序（单块主线）

| 顺位 | 块 | 切入理由 | 规格齐备度 | 预估工作量 |
|---|---|---|---|---|
| **1（本阶段唯一）** | **P3 段位赛** | 补齐三层游戏化闭环；产品层规格最齐（仅缺实施级）；用户明确本阶段只做 Phase 3 | 高 | 大 |

**当前执行口径**：本阶段只保留 P3 段位赛一块。历史重排轨迹与动机统一看归档报告 [`../../Reports/2026-04-18-phase3-umbrella-replan-history.md`](../../Reports/2026-04-18-phase3-umbrella-replan-history.md)。

---

## 四、跨块硬约束（所有实施子子计划必须遵守）

### 4.1 `TOPIC_STAR_CAP` 的单一事实源

- `Specs/2026-04-15-gamification-phase2-advance-spec.md` 为权威；生成器梯度 / campaign 关卡分段 / 进阶难度档位必须继承
- Phase 3 段位赛入场资格直接读取 `TOPIC_STAR_CAP` 对应的星级上限（如 "A03/A05 需 5★"）
- 本阶段**不改** `TOPIC_STAR_CAP`；任何改动都会直接冲击段位赛入场校验

### 4.2 难度锚点不移位

- `difficulty=5` = 上海五年级小升初正常考试水平（`2026-04-14-difficulty-standard.md`）
- 段位赛混合题抽题的难度锚点以此为准；不允许通过"换一套主观难度"来回避校准

### 4.3 UI 视觉语言不破线

- 所有新页面 / 新组件遵守阳光版 v5（`2026-04-14-ui-redesign-spec.md`）
- 段位赛 Hub / Session / Result 页面视觉与现有 Practice / SessionSummary 对齐；字号不低于 11px；色彩从 token 取，不写死十六进制

### 4.4 答题形式的 v2.2 风格一致性

- 段位赛不引入新答题形式；跨题型抽题直接复用 A01-A08 v2.2 现有的 `questionType` 与答题组件
- 如后续 Phase 3 运行中发现抽题器需要新的题型元数据字段，应反向补入对应生成器规格，而非在段位赛侧各自造轮子

### 4.5 真题参考库（本阶段不涉及）

本阶段只做 Phase 3。真题参考库补充规则保留在主计划 §三·D 段"合流说明"中作为后续子计划的合流纪律，但**本 Umbrella 本阶段不激活任何真题提取工作**。

> 规则来源：主计划 [`2026-04-16-open-backlog-consolidation.md`](2026-04-16-open-backlog-consolidation.md) §三 D 段。

---

## 五、状态面板

| 块 | 规格齐备 | 实施子子计划 | 代码起点 | 状态 |
|---|---|---|---|---|
| **P3 段位赛（本阶段唯一主线）** | ✅ 产品层两份生效规格 + ✅ 实施级规格 `Specs/2026-04-18-rank-match-phase3-implementation-spec.md`（2026-04-18 落盘）| ✅ `Plan/v0.1/2026-04-18-rank-match-phase3-implementation.md` M1-M4 已落地；补跑开新号全量 QA 后新增阻塞项 | 类型/常量/抽题器/Store/UI 三页/路由/Home 入口/薄弱题型聚合已落代码；`npm run build` 绿；`npx vitest run` 459/459；定向 E2E 22/22 PASS；全量回归 Fresh 10/10、Advance 6/6、Rank 8/9，`D-07` 暴露 `ISSUE-064`（段位赛局内刷新后未直达当前 Practice） | 🟡 阻塞中，先修 `ISSUE-064` 再收口 |

> A03+（已废弃）、A09（本阶段不做）、B/C/D（本阶段不做）均不计入本面板。

---

## 六、文档先行纪律（本子计划特别强调）

**背景**：2026-04-18 用户明确提出"避免再出现文档滞后于代码的经典问题"。Phase 3 段位赛的体量大、跨模块深（类型 / 常量 / 存储 / Session / UI / 结算全链路），一旦文档滞后，回写成本会指数级放大。本子计划严格执行以下纪律：

### 6.1 三层落盘

Phase 3 的启动顺序**必须**严格为：

1. **Umbrella Plan 注册主线条目**（已在本文件完成）
2. **Phase 3 规格事实源对齐**：`2026-04-10-gamification-redesign.md` §5 与 `2026-04-13-star-rank-numerical-design.md` §3 之间的残留冲突先统一（见 §八 2026-04-18 回写）
3. **Phase 3 实施级 Specs 落盘**：`Specs/2026-04-18-rank-match-phase3-implementation-spec.md` 写完、在 `Specs/_index.md` 登记、在 `Plan/README.md` 登记
4. **Phase 3 实施子子计划落盘**：按 Plan 模板写完头部（前置规格栏、跨系统维度清单），在 `Plan/README.md` 登记
5. **然后才能动代码**

禁止跳步（例如 3 和 4 并行、或先写代码再补规格）。

### 6.2 里程碑按角色最小同步

每个 M 里程碑完成后，按“主管 / 专人”分工做**最小必要同步**：

- **实施子子计划**：总是回写里程碑状态与证据（必选）
- **`ProjectManager/ISSUE_LIST.md`**：只有 issue 新增 / 关闭 / 状态变化时更新
- **`ProjectManager/Overview.md`**：只有当前阶段目标 / 当前主线 / 当前状态 / 下一步发生变化时更新
- **`ProjectManager/Plan/README.md`**：只有计划生命周期或索引状态发生变化时更新

不再要求每个里程碑机械性“四处同步”。

### 6.3 权威源未回写 = 里程碑不关闭

每个 M 里程碑的验收条件**包含**：该里程碑对应的权威源已回写；如本轮涉及跨源写入或生命周期变化，再运行 `pm-sync-check`。未完成权威回写时里程碑保持 🟡 进行中，不打钩。

### 6.4 新增 Specs 的 `_index.md` 联动

每次新增 Specs 文件，**同一 PR/同一轮**必须更新 `Specs/_index.md`（登记 + 关键断言摘要 + 如跨维度则在交叉矩阵补条目）。`pm-sync-check` 的检查项 1 会拦截漏登记。

### 6.5 代码侧占位注释同步规则

代码里已有的 `// Phase 3 追加 xxx` 占位注释（`src/types/gamification.ts` L84/L93）：在 Phase 3 实施子子计划的 M1 里程碑内必须被**真实代码或更精确的 TODO 引用替换**，不允许长期以裸注释存在。其他块如在代码里留占位注释，适用同规则。

---

## 七、推进方式

1. **当前已完成**：Umbrella 收敛为单块 Phase 3 + Phase 3 规格事实源对齐 + Phase 3 实施级 Specs 落盘 + Phase 3 实施子子计划落盘
2. **下一 session 的起点**：Phase 3 实施子子计划 M1 进场（类型 / 持久化 / store 基础）；如该轮涉及跨源写入或里程碑收尾，再运行 `pm-sync-check`
3. Phase 3 M1 完成后 → M2（段位赛 session 状态机 + 混合抽题）→ M3（入口 / 页面 / 结算链路）→ M4（验证 / 回写 / `pm-sync-check`）
4. Phase 3 整体闭环后，再评估是否启用 A03+ / A09 / B/C/D 的后续子计划；本阶段不承诺启动时机

> A03+ 设计规格 `Specs/2026-04-18-a03-block-b-plus-design.md` 保留作历史参考，不进入代码实施链路。

---

## 八、回写段

> 详细历史已下沉到归档报告：[2026-04-18-phase3-umbrella-replan-history.md](../../Reports/2026-04-18-phase3-umbrella-replan-history.md)。本节保留短摘要和既有锚点，避免打断外部引用链。

### 2026-04-18：Umbrella Plan 落盘

- 本文件落盘
- Plan/README.md 登记
- Overview.md 指向本 Umbrella
- 主计划 `2026-04-16-open-backlog-consolidation.md` §四/§五/§六 引用本 Umbrella
- `pm-sync-check` ✅ 全绿

### 2026-04-18（同日）：内部重排序（方案 C）

- 范围从初版的 `P3 → A03+ → A09 → B/C/D` 收敛为 `A03+ → A09 → P3`
- `B/C/D` 移出当前 Umbrella
- 详细动机与当时判断见归档报告 `§二.2`

### 2026-04-18（同日）：A03+ 设计改口并落规格

- `A03+` 一度收敛为轻量路线，只保留过程格结算纠错的小优化
- 对应规格落盘为 `Specs/2026-04-18-a03-block-b-plus-design.md`
- 详细背景与当时口径见归档报告 `§二.3`

### 2026-04-18（同日再次重排）：收敛为单块 Phase 3

- 最终用户决策收敛为：只做 `Phase 3`；`A03+ / A09 / B/C/D` 本阶段不做
- `A03+` 规格保留，但降级为历史参考
- `Phase 3` 启动不再依赖 `A03+ / A09` 闭环
- 详细重排动机与同步影响见归档报告 `§二.4`

### 2026-04-18（同日）：Phase 3 实施级规格与实施子子计划同步落盘

- 新增规格：`Specs/2026-04-18-rank-match-phase3-implementation-spec.md`（维度 B / 维度 C 双登记；事实源分工已显式指向 `2026-04-10` 与 `2026-04-13`）
- 新增计划：`Plan/v0.1/2026-04-18-rank-match-phase3-implementation.md`（M1~M4 里程碑，M1 涵盖类型 + 常量 + 持久化迁移 + store 最小骨架）
- 两份文件已双向引用；`Plan/README.md` 已登记；`_index.md` 维度 B/C 已登记
- `pm-sync-check` ✅ 全绿
- **三层落盘已到位**（Umbrella + 实施级 Specs + 实施子子计划），代码启动前置已清

### 下一步

→ 用户领取 M1 后，首批代码改动从 `src/types/gamification.ts` / `src/types/index.ts` / `src/constants/rank-match.ts`（新增）/ `src/engine/rank-match/match-state.ts`（新增）/ `src/repository/local.ts` / `src/store/rank-match.ts`（新增）六组开始；相应测试同步 TDD 落地；M1 验收门槛见实施子子计划 §2。

---

## 九、本阶段未承载范围（仅作参考清单）

以下工作**本阶段不做**，未来启动时各自立独立子计划承载；本 §四"跨块硬约束"与 §六"文档先行纪律"届时仍然适用：

- **A03+ 块B Plus 困难档过程纠错优化** — 设计规格 `Specs/2026-04-18-a03-block-b-plus-design.md` 已落盘但本阶段废弃，视 Phase 3 落地后再评估是否重启
- **A09 分数运算生成器** — 规格未落；若启动需完整"生成器规格 + v2.2 补丁 + 真题 Step 0 30-35 题"链路
- **B/C/D 领域扩展（几何 / 应用题 / 统计）** — 多季度工程；每领域需独立领域级规格 + 教材对应 + 题型清单 + 生成器 + 闯关地图 + UI 组件；每主题 Step 0 先提 30-35 题真题

> 本阶段不对上述任何一项承诺启动时机；本 §九只作为"这些曾被提过但当前搁置"的索引，避免后续重复讨论。

