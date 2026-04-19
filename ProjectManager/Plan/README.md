# 计划目录

> 所有项目管理文档统一存放于 `ProjectManager/` 下：
> - `Plan/` — 实施计划
> - `Specs/` — 设计规格（计划的前置设计文档）
> - `Reports/` — 调研/审视报告
> - `ISSUE_LIST.md` — 待解决问题清单
> - `Overview.md` — 活跃控制面（项目背景 / 当前阶段 / 当前状态 / 下一步 / 权威入口）

---

## 计划维护规则

本文件是**索引与模板入口**，不是项目当前状态总览。想看“现在在干什么”，请先读 [`../Overview.md`](../Overview.md)。

后续统一遵守以下最小规则：

1. **先改权威源，再改主管**  
   信息变化时，先改对应的 Plan / Spec / Issue / Report；只有当变化影响活跃视图时，才回写 `Overview.md`。

2. **Plan 持有执行事实，不持有项目总览**  
   活跃计划只写范围、里程碑、阻塞、证据和当前决策结果；项目背景、当前阶段状态、下一步统一由 `Overview.md` 汇总。

3. **索引只在生命周期变化时更新**  
   `Plan/README.md` 和 `Specs/_index.md` 只在新建、归档、生效状态变化、文件改名、入口关系变化时更新；日常里程碑推进不要求同步本索引。

4. **关闭事项退出活跃视图**  
   issue / plan / 路线一旦关闭或废弃，应从活跃视图移出；`Overview.md` 只保留结果性结论，详细过程留在对应 Plan 或 Report。

5. **新 Plan 开工前先扫 `Specs/_index.md`**  
   新计划启动前，先按维度扫描 [`../Specs/_index.md`](../Specs/_index.md) 中的生效规格，再把真正相关的硬约束写进 Plan 头部。

6. **`pm-sync-check` 只在关键节点运行**  
   仅在以下场景运行 `npx tsx scripts/pm-sync-check.ts`：
   - 同一轮改了 2 个及以上权威源 / 索引源
   - 准备关闭一个里程碑或声明某块完成
   - 新建 / 归档 / 废弃 Plan、Spec、Issue 的入口关系
   
   纯诊断、只读分析、纯 `Overview.md` 精简、纯历史阅读，不默认 pre-flight。

### 变更路由短表

| 发生什么 | 先更新哪里 | 什么时候再回写 `Overview.md` |
|------|------|------|
| 活跃计划里程碑推进 / 范围调整 | 对应 `Plan/*.md` | 当前主线 / 当前状态 / 下一步变化时 |
| 新发现问题 / 关闭问题 | `ISSUE_LIST.md` | 影响活跃视图时 |
| 新建设计规格 / 规格状态变化 | 对应 `Specs/*.md` + `Specs/_index.md` | 当前阶段入口或生效约束变化时 |
| 新建 / 归档计划、报告 | `Plan/README.md` | 当前权威入口变化时 |
| 历史复盘 / 机制说明 / 重排归档 | `Reports/` | 默认不回写；除非活跃结论也变了 |

一句话：**先改左列的权威源，再判断主管是否需要同步结果。**

---

## Plan 文件模板（2026-04-17 生效）

所有**新建**的 Plan 文件头部必须包含以下栏目（可参考 `2026-04-17-generator-redesign-v2-implementation.md` §一、背景）：

```markdown
# 〈计划名〉

> 创建：YYYY-MM-DD  
> 父计划：〈如有〉  
> 设计规格：〈对应 Specs/*.md〉  
> 状态：⬜ 待排期 / 🟡 进行中 / ✅ 完成

---

## 一、背景

### 前置相关规格（开工前必读）

> 📑 规格索引：`ProjectManager/Specs/_index.md`

| 规格 | 本计划从中继承的硬约束 |
|------|--------------------|
| 〈规格路径〉 | 〈关键断言摘要〉 |
| ... | ... |

### 跨系统维度清单

本计划会改动以下跨系统维度（session 交接时按此清单扫兄弟规格）：

- [ ] 难度档位 / 题型梯度数
- [ ] 星级 / 进阶 / 段位数值
- [ ] 关卡结构 / campaign.ts
- [ ] UI 组件 / 卡片尺寸
- [ ] 答题形式 / 验证逻辑
- [ ] 其他：〈具体列出〉

### 工作脉络

...
```

---

## 设计规格（Specs/）

> 📑 **总索引**：[`Specs/_index.md`](../Specs/_index.md) —— 按维度分类的规格矩阵，新 Plan 开工前必读。

| 文件 | 内容 |
|------|------|
| [_index.md](../Specs/_index.md) | **规格矩阵**（2026-04-17 新增；维度化索引 + 关键硬约束摘要）|
| [2026-04-08-generator-improvements.md](../Specs/2026-04-08-generator-improvements.md) | 生成器改进总规格（含执行状态，全部完成）|
| [2026-04-08-reference-bank-extraction-design.md](../Specs/2026-04-08-reference-bank-extraction-design.md) | 真题库提取设计 |
| [2026-04-09-a03-block-b-design.md](../Specs/2026-04-09-a03-block-b-design.md) | A03 块B 组件重构设计 |
| [2026-04-18-a03-block-b-plus-design.md](../Specs/2026-04-18-a03-block-b-plus-design.md) | A03 块B Plus 轻量路线设计：保留现有乘除法答题方式，困难档新增过程格结算纠错提示（**2026-04-18 二次重排后本阶段废弃；设计保留作历史参考**） |
| [2026-04-10-gamification-redesign.md](../Specs/2026-04-10-gamification-redesign.md) | 游戏化重新设计规格（三层体系：闯关→进阶→段位赛） |
| [2026-04-13-star-rank-numerical-design.md](../Specs/2026-04-13-star-rank-numerical-design.md) | 统一星级与段位数值设计（星级体系、心数门槛、段位门槛、时间节奏） |
| [2026-04-16-generator-difficulty-tiering-spec.md](../Specs/2026-04-16-generator-difficulty-tiering-spec.md) | 生成器三档难度定义规范（题库边界 + 用户感知版；主规格之一） |
| [2026-04-16-generator-subtype-difficulty-buckets.md](../Specs/2026-04-16-generator-subtype-difficulty-buckets.md) | 生成器子题型三档难度设计（旧实现导向整理，保留作测试/实现参考） |
| [2026-04-17-generator-redesign-v2.md](../Specs/2026-04-17-generator-redesign-v2.md) | 生成器题型优化设计 **v2.2**（去重 + 陷阱体系 + 答题形式重做；A01/A04/A08 压 2 档对齐进阶规格；实施中）|
| [2026-04-18-rank-match-phase3-implementation-spec.md](../Specs/2026-04-18-rank-match-phase3-implementation-spec.md) | **Phase 3 段位赛实施级规格**（2026-04-18 落盘）——定义 `RankTier`/`RankMatchSession`/`RankMatchGame`/`RankProgress` 数据模型；BO 用 `RankMatchSession` 包装、每局仍是 `PracticeSession` 的双结构会话；`CURRENT_VERSION 2→3` 追加式迁移；跨题型抽题器按段位新内容点编排（主考项 ≥40%、复习题 ≤25%、每场题量 20/25/25/30）|

## 实施计划（Plan/）

| 文件 | 内容 | 状态 |
|------|------|------|
| [2026-04-09-phase0-classification-adjustment.md](2026-04-09-phase0-classification-adjustment.md) | Phase 0 分类调整 | ✅ 完成 |
| [2026-04-09-phase1-p0-improvements.md](2026-04-09-phase1-p0-improvements.md) | Phase 1 P0 高频考点 | ✅ 完成 |
| [2026-04-09-phase2-p1-extensions.md](2026-04-09-phase2-p1-extensions.md) | Phase 2 P1 参数扩展 | ✅ 完成 |
| [2026-04-09-phase3-p2-question-types.md](2026-04-09-phase3-p2-question-types.md) | Phase 3 P2 题型扩展 | ✅ 完成 |
| [2026-04-09-a03-decimal-generator.md](2026-04-09-a03-decimal-generator.md) | A03 块A 生成器小数支持 | ✅ 完成 |
| [2026-04-09-a03-block-b-component.md](2026-04-09-a03-block-b-component.md) | A03 块B 组件重构 | ✅ 完成 |
| [2026-04-08-reference-bank-extraction.md](2026-04-08-reference-bank-extraction.md) | 真题库提取（A01-A08）| ✅ 完成 312题 |

## 审视报告（Reports/）

| 文件 | 内容 |
|------|------|
| [2026-04-09-A03-vertical-calc-review.md](../Reports/2026-04-09-A03-vertical-calc-review.md) | A03 竖式笔算审视报告 |
| [2026-04-17-pm-sync-check-retrospective.md](../Reports/2026-04-17-pm-sync-check-retrospective.md) | pm-sync-check 首轮回溯验证报告（v2.1→v2.2 实战用例；召回 2/2；L1+L2 收口） |
| [2026-04-18-phase3-umbrella-replan-history.md](../Reports/2026-04-18-phase3-umbrella-replan-history.md) | Phase 3 Umbrella 同日重排归档报告：把“为何最后只剩 Phase 3”的完整轨迹下沉出活跃计划 |

## 游戏化重设计（Specs/2026-04-10-gamification-redesign.md）

| 文件 | 内容 | 状态 |
|------|------|------|
| [2026-04-13-gamification-phase1-foundation-campaign.md](2026-04-13-gamification-phase1-foundation-campaign.md) | Phase 1：Foundation + 闯关系统（移除旧 XP 体系，新类型/Store/Repository，8 题型闯关地图，CampaignMap 页） | ✅ 开发完成，已浏览器验收 |
| [2026-04-15-gamification-phase2-implementation.md](2026-04-15-gamification-phase2-implementation.md) | Phase 2 进阶系统实施计划（T1-T15 + A1-A6 全部完成） | ✅ 完成 |

| Phase 2（完成）| 进阶系统（心→星，难度自动调配） | ✅ 开发 + 浏览器验收完成 |
| Phase 3（后移）| 段位赛系统（BO3/BO5/BO7），闯关+进阶体验稳定后再启动 | ⬜ 下阶段 |

## Phase 1 优化迭代

| 文件 | 内容 | 状态 |
|------|------|------|
| [2026-04-14-phase1-hotfix-and-iteration.md](2026-04-14-phase1-hotfix-and-iteration.md) | Phase 1 热修复 + 优化迭代（去年级区分、History入口、路线匹配修复、出题质量、难度标准） | ✅ 完成 |
| [2026-04-16-p1p2-fixes.md](2026-04-16-p1p2-fixes.md) | P1+P2 修复（试玩反馈 11 项：心数 bug / Boss 视觉与内容差异化 / 进阶引导 / 难度梯度 / 除法整除比例 / Practice UI / VerticalCalcBoard 焦点与退位提示） | ✅ 完成 |
| [2026-04-16-generator-difficulty-recalibration.md](2026-04-16-generator-difficulty-recalibration.md) | 生成器难度分档重审（基于题库边界 + 用户感知；为三档主规格重写提供证据与结论） | ✅ 完成 |
| [2026-04-16-open-backlog-consolidation.md](2026-04-16-open-backlog-consolidation.md) | **当前阶段主计划**——开放 backlog 统一整理；当前承接 Phase 3 主线与子计划 4 引用链 | 🟡 进行中 |
| [2026-04-17-generator-redesign-v2-implementation.md](2026-04-17-generator-redesign-v2-implementation.md) | 生成器题型设计 v2.2 实施计划（对应 Specs/2026-04-17-generator-redesign-v2.md；5 阶段 + 阶段 6 二轮修订已全部完成）| ✅ 完成 |
| [2026-04-17-campaign-advance-stabilization.md](2026-04-17-campaign-advance-stabilization.md) | **子计划 2.5（父=主计划 §四/§七）**——闯关+进阶模式稳定化：S1 阻塞级 / S2 重要 bug / S3 v2.2 深度体验 QA / S4 进阶专项验收 | ✅ 完成（2026-04-18）|
| [2026-04-18-ui-consistency-cleanup.md](2026-04-18-ui-consistency-cleanup.md) | **子计划 3（父=主计划 §四）**——UI 一致性与代码整洁清理：B1 硬编码色+类型整洁 / B2 a11y 教学细化 / B3 a11y 评估项；12 项 ISSUE 全部关闭或降级关闭 | ✅ 完成（2026-04-18）|
| [2026-04-18-subplan-4-next-stage-expansion.md](2026-04-18-subplan-4-next-stage-expansion.md) | **子计划 4 Umbrella（父=主计划 §四）**——下阶段扩展总纲；当前已收敛为单块 = Phase 3 段位赛 | 🟡 进行中 |
| [2026-04-18-rank-match-phase3-implementation.md](2026-04-18-rank-match-phase3-implementation.md) | **Phase 3 段位赛实施子子计划（父=子计划 4 Umbrella）**——按实施级规格落代码：M1 地基 → M2 抽题器 + 答题流驳接 → M3 UI → M4 验证 + 回写 | 🟡 等待 M1 领取 |
| [2026-04-17-pm-document-sync-mechanism.md](2026-04-17-pm-document-sync-mechanism.md) | 历史机制方案：记录文档同步机制首次设计、L1+L2 落地与回溯验证背景 | ✅ 历史记录 |
| [2026-04-19-pm-token-efficiency-optimization.md](2026-04-19-pm-token-efficiency-optimization.md) | 项目管理文档体系轻量化优化方案：以不牺牲可靠性为前提，重排 Overview / Plan / Spec / Issue 的角色分工，并收缩 `pm-sync-check` 触发范围 | ✅ 完成 |

## 设计规格新增

| 文件 | 内容 |
|------|------|
| [2026-04-14-difficulty-standard.md](../Specs/2026-04-14-difficulty-standard.md) | 难度基准文档（difficulty 1-10 各档定义 + 8 个生成器分档明细 + 校准记录） |
| [2026-04-16-generator-difficulty-tiering-spec.md](../Specs/2026-04-16-generator-difficulty-tiering-spec.md) | 三档难度主规格（题库边界 + 用户感知版） |
| [2026-04-16-generator-subtype-difficulty-buckets.md](../Specs/2026-04-16-generator-subtype-difficulty-buckets.md) | 旧版子题型级三档整理（实现导向，保留作参考） |
| [2026-04-14-ui-redesign-spec.md](../Specs/2026-04-14-ui-redesign-spec.md) | UI/UX 整体重设计规格（阳光版 v5 批准；含颜色 token、图标系统、组件规范、交互规则、hotfix 分类；v1 炼金书院草案已废弃） |
| [2026-04-14-ui-redesign-spec.md → 配套实施参考](./../.ui-design/design-system.md) | 设计系统参考文档（.ui-design/design-system.md）—— 实施级 token、SVG 图标说明、组件规格、Do/Don't |

## UI Hotfix 子计划

| 文件 | 内容 | 状态 |
|------|------|------|
| [2026-04-14-ui-hotfix-6-1.md](2026-04-14-ui-hotfix-6-1.md) | UI redesign spec §6.1 的独立 hotfix 执行计划 | ✅ 完成 |

## UI 整体重设计（阳光版 v5）

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase A | Token + 组件基础设施（BottomNav/ProgressBar/Hearts/LoadingScreen/Dialog）| ✅ 完成（2026-04-14）|
| Phase B | 全量页面级改造（Home/CampaignMap/Practice/Summary/WrongBook/Progress/Profile 等）| ✅ 完成（2026-04-14）|
| Phase C | 动效打磨（stagger 入场动画 + 推荐关卡跳动）| ✅ 完成（2026-04-15）|
| Design Review | 设计系统合规审查 + 修复（94% 合规）| ✅ 完成（2026-04-15）|
| WCAG AA 审查 | 无障碍审查 + 修复（CampaignMap 键盘/输入框 aria/skip-link 等）| ✅ 完成（2026-04-15）|
| 浏览器实测 | E2E 主路径验收（Playwright，0 JS 错误）| ✅ 完成（2026-04-15）|

## 视觉 QA 修复（Reports/2026-04-15-visual-qa-results.md）

| 文件 | 内容 | 状态 |
|------|------|------|
| [2026-04-15-visual-qa-fixes.md](2026-04-15-visual-qa-fixes.md) | 视觉 QA 修复（F2/VR-01/VR-02/VR-04/VR-05/F1，共 5 个文件改动）| ✅ 完成（2026-04-15）|

## 说明

- 当前阶段目标、当前主线、当前状态、下一步，统一看 [`../Overview.md`](../Overview.md)。
- 本文件只保留计划索引、模板入口和归档入口；不再复写项目活跃状态。
