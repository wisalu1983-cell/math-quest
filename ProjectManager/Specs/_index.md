# Specs 规格矩阵（_index）

> 版本：v1.14 | 创建：2026-04-17 | 上次修订：2026-04-28（v0.5 Phase 2 回写 A03 竖式样本过滤 current spec 约束）
> 用途：**新计划启动前的必查清单**——按讨论维度定位已有规格，避免漏检历史约束。
> 读取提示：启动新 Plan 时先读“使用方法”和相关维度；不要默认通读全部规格摘要。维护规则只在新增 / 修改 Spec 时读取。

## 为什么要这个文件

2026-04-17 的 v2.1 生成器改造过程中，**漏检了 2026-04-15 进阶规格里对 A01/A04/A08 "2 梯度" 的硬约束**，导致反复在"三档梯度拉不开"上踩坑。根因是工作流缺"动手前扫兄弟规格"这一步。

本文件是对这个教训的机制补救：**任何新 Plan 在"前置相关规格"栏里，必须先扫过本索引，列出与本计划讨论同维度的规格作为硬约束输入。**

---

## 使用方法

1. **启动新 Plan 前**：按你要做的事属于哪个维度，在下方矩阵里找所有"状态=生效"的 Spec 读一遍
2. **写 Plan 的"前置相关规格"栏**：把命中的 Spec 文件名和它里面和你相关的**关键断言**抄到 Plan 头部
3. **修改 Spec 或发现 Spec 之间互相矛盾时**：必须同步回写本索引（更新状态 / 交叉引用 / 关键断言摘要）

---

## 维度矩阵

### 维度 A：题目生成器 / 题型设计

| Spec | 状态 | 关键断言（关乎其他模块的最重要约束） |
|------|------|-----------------------------------|
| `2026-04-17-generator-redesign-v2.md` | **生效**（v2.2，含 2026-04-22 增补） | 8 个题型生成器的最新规格；Phase 4 已补充 A02 重设计与 C1 档内子梯度的引用优先级 |
| `2026-04-16-generator-difficulty-tiering-spec.md` | **生效** | 三档难度定义主规格：基础档/提高档/挑战档的认知目标与边界 |
| `2026-04-16-generator-subtype-difficulty-buckets.md` | 历史参考 | 实现导向的旧版子题型分档，已被 v2.1 替代；不作为产品分档主依据 |
| `2026-04-14-difficulty-standard.md` | **生效** | `difficulty=5` 的锚点定义：上海五年级小学毕业生正常考试应做对 |
| `2026-04-08-generator-improvements.md` | **生效（部分落地）** | 基于 280 道真题校准的生成器盲区清单 |
| `2026-04-08-reference-bank-extraction-design.md` | 生效 | 真题库提取方法和覆盖策略 |
| `a03-vertical-calc/current.md` | **生效（current spec；v0.5 Phase 2 已回写）** | A03 `vertical-fill` 当前权威行为：低档非 0 过程格必填且过程错不通过；中档答案对即通过且只给当前题过程提示；高档不显示过程格；单行竖式已知操作数 / 运算符使用高对比正文色；低档乘法过滤 `2位数 × 1位数`；低档一位除数整数除法过滤 D0，并以 D2/D3 为主；过程失败原因字段可选、不 bump 存档版本 |
| `2026-04-09-a03-block-b-design.md` | **生效（已落地）** | A03 VerticalCalcBoard 组件设计 |
| `2026-04-18-a03-block-b-plus-design.md` | **历史参考（本阶段废弃）** | 2026-04-18 二次重排后 A03+ 不进入代码实施；设计规格文件保留以备未来重启时参考；本阶段任何改动都**不得**再引用其作为生效规格 |
| `2026-04-22-审题原则总则.md` | **生效** | A3 审题原则总则：审题步骤定义（A/B/B'/C/D）、双机制设计原则、适用题型矩阵；作为 4-2/4-3/4-4 设计依据 |
| `2026-04-22-估算能力与基础技巧类排查.md` | **生效** | 4-2 产出：A02 各子题型"题型-技巧"映射表；estimate-basic prompt 格式变更（去掉精度指定 + ±15% 接受范围）；floor-ceil-basic 删除决策（选方案 B，扩情景池至 20 道）；F1 Tips 库可提炼内容边界 |
| `2026-04-22-逆向推理A3回验.md` | **生效** | 4-3 产出：reverse-round 第 1 关回验 A3 机制一成立；hints 过度提示问题及改进方向；5 组 prompt 模板扩充；高档扩展路径（两位小数 + 最大最小差值题） |

**本维度的跨系统硬约束**：
- 所有新题型设计必须参考"档位定义主规格"`2026-04-16-generator-difficulty-tiering-spec.md`
- **题型梯度数不必统一 3 档**，以 `TOPIC_STAR_CAP`（见维度 B）为准

### 维度 B：游戏化 / 星级 / 进阶 / 关卡

| Spec | 状态 | 关键断言 |
|------|------|---------|
| `2026-04-15-gamification-phase2-advance-spec.md` | **生效** | ⚠️ **硬约束**：`TOPIC_STAR_CAP`——A01/A04/A08 为 3★（2 梯度），其余 5 题型为 5★（3 梯度）；进阶难度档位权重表 |
| `2026-04-13-star-rank-numerical-design.md` | **生效** | 统一星级与段位数值基线；**Phase 3 段位赛事实源分工**：本文件为段位入场星级数值表（§3.2）、心→星级换算、时间节奏的单一事实源；段位赛 BO 编排规则引用 `2026-04-10` |
| `2026-04-10-gamification-redesign.md` | **生效** | 游戏化整体设计；**Phase 3 段位赛事实源分工**：本文件为段位赛出题范围（§5.2）、BO 赛制（§5.3）、胜场编排（§8 Q9）的单一事实源；段位入场星级数值引用 `2026-04-13` §3.2 |
| `2026-04-18-rank-match-phase3-implementation-spec.md` | **生效（实施级；2026-04-18 落盘）** | Phase 3 段位赛实施级唯一入口；定义 `RankTier`/`RankMatchSession`/`RankMatchGame`/`RankProgress` 数据模型；双结构会话（BO 用 `RankMatchSession` 包装，每局仍是 `PracticeSession`）；`CURRENT_VERSION 2→3` + `rankProgress` 追加式迁移（禁用旧 init 清数据逻辑）；跨题型抽题器按段位新内容点编排（主考项 ≥40%、复习题 ≤25%、每场题量首版 20/25/25/30）|
| `2026-04-18-a03-block-b-plus-design.md` | **历史参考（本阶段废弃）** | 通过判定优化规则本阶段不落地；文件保留以备未来重启时参考 |

**本维度的跨系统硬约束**：
- **`TOPIC_STAR_CAP` 是题型梯度数的权威定义**——生成器梯度 / campaign 关卡分段 / 进阶难度档位都必须继承它
- A01/A04/A08 的生成器**只允许 2 档梯度**（Normal + Hard），对应 3★ 封顶
- A02/A03/A05/A06/A07 的生成器 **3 档梯度**（Normal + Hard + Demon），对应 5★ 封顶

### 维度 C：UI / UX

| Spec | 状态 | 关键断言 |
|------|------|---------|
| `2026-04-14-ui-redesign-spec.md` | **生效**（阳光版 v5 已批准） | 全产品视觉语言 + 组件规范；字号下限 11px；关卡卡片固定 96px |
| `2026-04-18-rank-match-phase3-implementation-spec.md` | **生效（实施级；2026-04-18 落盘）** | Phase 3 段位赛 UI 信息架构：新增 `/rank-match` / `/rank-match/session` / `/rank-match/game-result` / `/rank-match/match-result` 四个页面；Home 段位赛入口需独立卡片化（替代现有"进阶训练"里的占位文案）；段位徽标色需作为 token 进入 `globals.css`，不允许在组件里写死 |
| `a03-vertical-calc/current.md` | **生效（current spec；v0.5 Phase 2 已回写）** | A03 竖式板过程格显示 / 跳格 / 本地复盘 / 统一结果 UI / 单行竖式操作数高对比 / 低档竖式样本过滤的当前行为入口 |
| `2026-04-18-a03-block-b-plus-design.md` | **历史参考（本阶段废弃）** | 过程格错误提示 UI 方案本阶段不落地；文件保留以备未来重启时参考 |
| `dev-tool-panel/current.md` | **生效（已实施；current spec 试点）** | Dev Tool Panel 当前 UI 入口为 DEV / 显式 dev 构建下的右下 FAB + 右侧抽屉；纯净生产版不得显示入口或包含 dev-tool chunk |

**本维度的跨系统硬约束**：
- 任何新增 UI 组件 / 页面必须遵守阳光版 v5 的色彩、字号、间距约定
- 任何涉及题目渲染的改动（如新答题形式）必须评估是否突破 UI Spec 的卡片尺寸约束

### 维度 D：工具 / 基建

| Spec | 状态 | 关键断言 |
|------|------|---------|
| `dev-tool-panel/current.md` | **生效（已实施；current spec 试点）** | F3 是开发 / 测试状态注入工具；`mq_` / `mq_dev_` namespace 隔离；注入项经 `_registry.ts` 声明式注册；纯净版 `npm run build` 不含 F3，`build:with-dev-tool` 产出 `/math-quest/dev/` |
| `2026-04-21-pm-sync-check-子目录适配修复.md` | **待实施** | pm-sync-check 脚本 4 处修复：Specs 子目录扫描覆盖（Check 1a/2）、Plan→Spec 引用解析（Check 4）、Backlog↔ISSUE_LIST ID 互斥（新 Check 6） |

### 维度 E：在线服务 / 账号 / 同步

| Spec | 状态 | 关键断言 |
|------|------|---------|
| `v03-supabase-account-sync/2026-04-23-v03-supabase-账号与同步系统.md` | **生效（v0.3 已上线，2026-04-24）** | Supabase Magic Link 登录 + 本地优先后台同步架构；5 张 Supabase 表（profiles / game_progress / history_records / rank_match_sessions / sync_metadata）+ RLS；合并策略：GameProgress 字段级 max/union、History 追加去重、RankMatch 状态优先级；段位赛必须联网启动；访客模式保留；本地存档 v3→v4 |
| `v03-supabase-account-sync/2026-04-24-phase3-00-index.md` | **已实施（v0.3 Phase 3 收口，2026-04-24）** | Phase 3 开发文档总览；固定启动门控、首次登录合并、同步状态、账号隔离、段位赛联网、同步韧性、真实 Supabase 验收与 RISK 收口规则 |
| `v03-supabase-account-sync/2026-04-24-phase3-01-startup-and-merge.md` | **已实施（v0.3 Phase 3，2026-04-24）** | SyncEngine `arm/start/shutdown` 三态门控；`hasMeaningfulLocalProgress`；首次登录本地/云端六场景；账号归属锁与账号不匹配保护 |
| `v03-supabase-account-sync/2026-04-24-phase3-02-sync-status-ui.md` | **已实施（v0.3 Phase 3，2026-04-24）** | Home/Profile 同步状态展示；账号区；登出未同步保护；Onboarding 登录入口；持续离线时保持登录态 |
| `v03-supabase-account-sync/2026-04-24-phase3-03-rank-match-online.md` | **已实施（v0.3 Phase 3，2026-04-24）** | 段位赛开始/下一局联网门控；Practice 离开自动 suspend；远端活跃段位赛 10 分钟接管；跨设备段位赛状态规则 |
| `v03-supabase-account-sync/2026-04-24-phase3-04-resilience-qa.md` | **已实施（v0.3 Phase 3，2026-04-24）** | SyncEngine 指数退避与自愈触发器；RISK-3/RISK-4 测试补强；真实 Supabase 8 个验收剧本与收尾报告要求 |

**本维度的跨系统硬约束**：
- 任何新增持久化数据字段都需要同步更新合并策略（`src/sync/merge.ts`）
- Repository 接口不变——Zustand stores 不感知同步存在
- `CURRENT_VERSION` 递增必须注册对应 `migrateV{n}ToV{n+1}` 函数

---

## 维度交叉矩阵（快速查询：我在做 X 要查哪些 Spec）

| 你的工作类型 | 必查 Spec（按维度） |
|-----------|------------------|
| 新增/修改题目生成器 | A 全部 + B 的 `TOPIC_STAR_CAP` + C 的卡片渲染约束 |
| 修改关卡结构 / campaign.ts | A 的档位主规格 + **B 全部** + C 的关卡卡片视觉 |
| 修改星级/进阶/段位逻辑 | **B 全部** |
| 新增答题形式 / Practice 页面改造 | A 的题型规格 + C 全部 |
| 调整现有题型的过程格/反馈判定 | A 的 `a03-vertical-calc/current.md` + B 的进阶/通过语义约束 + C 的反馈面板表现规范 |
| 真题库扩充 | A 的 `generator-improvements` + `reference-bank-extraction-design` |
| 跨题型难度系统改动 | A + B 全部（高风险区） |
| QA 流程 / 报告 / Issue 分流改动 | 执行约束见 `qa-methodology` skill（`E:/Projects/QALeader`） |
| 段位赛 / Phase 3 相关改动 | B 的 `2026-04-10 §5 / §8 Q9` + `2026-04-13 §3 / §4` + `2026-04-18-rank-match-phase3-implementation-spec.md` + C 的 UI 视觉语言 |

---

## 维护规则

1. **新增一份 Spec**：必须在本索引对应维度下登记；如跨维度，多处登记并在"交叉矩阵"补条目。
2. **废弃/替代一份 Spec**：必须把被替代的标 `历史参考`，并在"关键断言"里指向新规格文件。
3. **修改一份 Spec 里的关键断言**：必须同步更新本索引里该行的"关键断言"摘要。
4. **本索引自身修订**：每次修订在顶部"版本"行递增，便于回溯。

## 路径兼容规则（2026-04-20 追加）

配合 [`Plan/rules/document-ownership.md`](../Plan/rules/document-ownership.md) 的功能设计文档归属规则，本索引的条目路径书写约定如下：

- **老条目（2026-04-20 之前扁平放在 `Specs/` 根）**：继续写纯文件名（= 相对 `Specs/` 的相对路径），**不做回溯迁移**。例：`2026-04-17-generator-redesign-v2.md`
- **新条目（2026-04-20 之后按功能子目录归档）**：写 `<feature-slug>/<YYYY-MM-DD-xxx>.md` 或 `<feature-slug>/current.md`（同样是相对 `Specs/` 的相对路径）。例：`dev-tool-panel/current.md`
- **跨功能共用规格**（如全局难度标准、全产品视觉语言）：仍保留在 `Specs/` 根，沿用扁平写法

本文件的三条维护规则对两种路径同时生效，不区分新老。
