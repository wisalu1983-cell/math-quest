# 计划目录

> 所有项目管理文档统一存放于 `ProjectManager/` 下：
> - `Plan/` — 实施计划
> - `Specs/` — 设计规格（计划的前置设计文档）
> - `Reports/` — 调研/审视报告
> - `ISSUE_LIST.md` — 待解决问题清单
> - `Overview.md` — 项目概览（四要素）

---

## 计划维护规则

为避免“代码/验收已变化，但计划文档仍停留在旧口径”的情况，后续统一遵守：

1. **行为改了，就回写计划**  
   如果后续 hotfix / 优化改变了某个仍在活跃计划中的行为、入口、状态机或验收口径，必须同步更新对应计划文件，不能只改 `Overview.md` 或 `ISSUE_LIST.md`。

2. **实现状态和验收状态分开写**  
   计划文件中要显式区分“实现任务已完成”和“真实浏览器 / QA 验收待执行”，避免全部任务都打勾后，看不出其实还没验收。

3. **同一轮收口至少同步 4 处**  
   对用户可见行为有影响的修复或优化，在收口时至少检查并按需同步：
   - 对应 `Plan/*.md`
   - `ISSUE_LIST.md`
   - `Overview.md`
   - `Plan/README.md`

4. **对齐更新要写来源**  
   如果计划口径因后续优化而变化，在原计划中新增“对齐更新”段，注明来源 issue / 计划 / 日期，避免后来阅读的人不知道为什么计划描述变了。

5. **（2026-04-17 新增）开工前必扫 `Specs/_index.md`**  
   任何新 Plan 启动前，必须先读 [`Specs/_index.md`](../Specs/_index.md) 规格矩阵，按"我要做的事属于哪个维度"找到所有**生效**的兄弟规格，把它们的**关键硬约束**（特别是跨系统约束，如 `TOPIC_STAR_CAP`、难度锚点、UI 卡片尺寸等）抄进 Plan 的"前置相关规格"栏。  
   教训：2026-04-17 的 v2.1 生成器改造因漏检 `2026-04-15 进阶规格` 的 `TOPIC_STAR_CAP`，导致 A01/A04/A08 三个题型反复在"三档梯度拉不开"上踩坑。

6. **（2026-04-17 新增）session 续航交接清单**  
   session 结束 / 交接 / 中断前，除了把结果、阻塞、下一步写回项目内长期记录，还必须完成这一条**跨规格扫描**：  
   - 列出本 session 改动了哪些**跨系统维度**（难度 / 档位 / 星级 / 关卡结构 / UI 尺寸 / 答题形式 等）  
   - 对每个命中的维度，检查 `Specs/_index.md` 里同维度**其他生效规格**是否仍保持一致；若不一致，说明是"我改了但对方没改"，必须当场挂 issue 或同步改，不能默认视为已收口。  

7. **（2026-04-17 新增）开工前必跑 `pm-sync-check`（L2 钩子 A — pre-flight）**  
   任何新 session / 新 Plan 开工前，执行：
   ```bash
   npx tsx scripts/pm-sync-check.ts
   ```
   这是规则 5、6 的**脚本兜底版**——把"靠自觉扫描兄弟规格"升级为"脚本硬性清单"。Agent 在开工第一批工具调用里必须包含这一步，且：
   - 若输出 `✅ 全绿`：可以直接开工；
   - 若有**错误（❌）**：必须先处理或显式降级——"我知道这里不一致，本次不动，因为 XXX"（写进本次 Plan 的"前置相关规格"栏）；
   - 若有**警告（⚠️）**：由 agent 判断是否相关；相关就处理，不相关就在 Plan 里显式标注跳过原因。
   
   脚本覆盖的 6 项检查（详见 `Plan/2026-04-17-pm-document-sync-mechanism.md` §4.1）：`_index.md` 完整性 / Specs 版本号一致 / ISSUE 状态一致（启发式）/ Plan→Spec 引用存在 / `TOPIC_STAR_CAP` 一致 / human-bank 档位一致。

   **自动化兜底**：本规则由 `.cursor/rules/pm-sync-check.mdc`（`alwaysApply:true`）在每个 session 的系统提示里注入，降低 agent "忘记读规则"的概率。但注入 ≠ 强制，agent 仍可能判断任务无关而跳过；如观察到跳过率高，再升级为 Cursor Hooks 硬阻塞（B 档，当前未启用）。

8. **（2026-04-17 新增）session 收尾必跑 `pm-sync-check`（L2 钩子 B — post-flight）**  
   session 结束 / 交接 / 要求总结时，除了按规则 6 做跨规格扫描，还必须再跑一次：
   ```bash
   npx tsx scripts/pm-sync-check.ts
   ```
   并保证：
   - **本 session 改动引入的新增不一致必须当场修掉**（或降级为已挂的 ISSUE）；
   - 若收尾时存在开工前就有的存量不一致，本 Plan 没动它们，至少要在回写段里显式说明"本 session 未处理的存量不一致：XXX，原因：YYY"；
   - 如果 L1 脚本本身漏检了某个"本 session 实际改动但未同步"的地方，应在 `Plan/2026-04-17-pm-document-sync-mechanism.md` 或其子 issue 里补录检查规则。

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
| [2026-04-10-gamification-redesign.md](../Specs/2026-04-10-gamification-redesign.md) | 游戏化重新设计规格（三层体系：闯关→进阶→段位赛） |
| [2026-04-13-star-rank-numerical-design.md](../Specs/2026-04-13-star-rank-numerical-design.md) | 统一星级与段位数值设计（星级体系、心数门槛、段位门槛、时间节奏） |
| [2026-04-16-generator-difficulty-tiering-spec.md](../Specs/2026-04-16-generator-difficulty-tiering-spec.md) | 生成器三档难度定义规范（题库边界 + 用户感知版；主规格之一） |
| [2026-04-16-generator-subtype-difficulty-buckets.md](../Specs/2026-04-16-generator-subtype-difficulty-buckets.md) | 生成器子题型三档难度设计（旧实现导向整理，保留作测试/实现参考） |
| [2026-04-17-generator-redesign-v2.md](../Specs/2026-04-17-generator-redesign-v2.md) | 生成器题型优化设计 **v2.2**（去重 + 陷阱体系 + 答题形式重做；A01/A04/A08 压 2 档对齐进阶规格；实施中）|

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
| [2026-04-16-open-backlog-consolidation.md](2026-04-16-open-backlog-consolidation.md) | **当前阶段主计划**——开放 backlog 统一整理；A/B/C 段完成，子计划 1/2/2.5/3 全部关闭，子计划 4（下阶段扩展）待启动 | 🟡 进行中 |
| [2026-04-17-generator-redesign-v2-implementation.md](2026-04-17-generator-redesign-v2-implementation.md) | 生成器题型设计 v2.2 实施计划（对应 Specs/2026-04-17-generator-redesign-v2.md；5 阶段 + 阶段 6 二轮修订已全部完成）| ✅ 完成 |
| [2026-04-17-campaign-advance-stabilization.md](2026-04-17-campaign-advance-stabilization.md) | **子计划 2.5（父=主计划 §四/§七）**——闯关+进阶模式稳定化：S1 阻塞级 / S2 重要 bug / S3 v2.2 深度体验 QA / S4 进阶专项验收 | ✅ 完成（2026-04-18）|
| [2026-04-18-ui-consistency-cleanup.md](2026-04-18-ui-consistency-cleanup.md) | **子计划 3（父=主计划 §四）**——UI 一致性与代码整洁清理：B1 硬编码色+类型整洁 / B2 a11y 教学细化 / B3 a11y 评估项；12 项 ISSUE 全部关闭或降级关闭 | ✅ 完成（2026-04-18）|
| [2026-04-18-subplan-4-next-stage-expansion.md](2026-04-18-subplan-4-next-stage-expansion.md) | **子计划 4 Umbrella（父=主计划 §四）**——下阶段扩展总纲（2026-04-18 重排后收敛为三块）：A03 块B Plus / A09 分数 / Phase 3 段位赛；推荐切入 = A03 块B Plus（顺位 1）；各块实施子子计划各自单立；B/C/D 已移出，后续作子计划 5 roadmap | 🟡 Umbrella 落盘并重排，等待首个实施子子计划领取（2026-04-18）|
| [2026-04-17-pm-document-sync-mechanism.md](2026-04-17-pm-document-sync-mechanism.md) | 全局文档同步机制设计（方案 6；pm-sync-check 静态校验 L1 + Plan/README 规则 7/8 钩子 L2；v2.1→v2.2 回溯验证召回 2/2）| ✅ L1+L2 落地，L3 暂不启动 |

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

## 待排期

> **当前阶段方针**（2026-04-18 刷新 + 同日重排）：主计划 = `2026-04-16-open-backlog-consolidation.md`；A/B/C 段全部完成，**子计划 4 Umbrella 已落盘并重排**（[`2026-04-18-subplan-4-next-stage-expansion.md`](2026-04-18-subplan-4-next-stage-expansion.md)），推荐从 **A03 块B Plus** 起步，切入顺序 = A03+ → A09 → Phase 3 段位赛（段位赛最后）。B/C/D 已从子计划 4 移出，后续作**子计划 5 领域扩展 roadmap**（待立）。**真题参考库补充不再作为独立并行任务**：A09 归子计划 4 开工 Step 0；B/C/D 归未来子计划 5 各主题 Step 0，详见主计划 §三 D 段"合流说明"。

| 内容 | 优先级 | 阶段 | 挂靠 |
|------|--------|------|------|
| ~~Phase 2 浏览器验收（A1-A6）~~ | ~~高~~ | ✅ 完成（2026-04-16） | 子计划 1 |
| ~~高优先级 UI/a11y 修复（ISSUE-022~024、028、032、034、035）~~ | ~~高~~ | ✅ 完成（2026-04-16） | 子计划 1 |
| ~~生成器质量补强（ISSUE-008~010）~~ | ~~高~~ | ✅ 完成（2026-04-16） | 子计划 2 |
| ~~生成器 v2.2 系统性重写~~ | ~~高~~ | ✅ 完成（2026-04-17） | 子计划 2 扩展 |
| ~~闯关+进阶稳定化~~ | ~~高~~ | ✅ 完成（2026-04-18） | [子计划 2.5](2026-04-17-campaign-advance-stabilization.md) |
| ~~UI 一致性 / 代码整洁（ISSUE-020、025、026、029~031、037、038、041~045）~~ | ~~中~~ | ✅ 完成（2026-04-18） | [子计划 3](2026-04-18-ui-consistency-cleanup.md) |
| ~~真题参考库补充~~ | ~~中~~ | **暂缓（2026-04-18）** | A09 合流到子计划 4 Step 0；B/C/D 合流到子计划 5 Step 0 |
| **A03 块B Plus 设计级 / 实施级规格 + 子子计划**（顺位 1）| 中 | **下一步** | [子计划 4 Umbrella](2026-04-18-subplan-4-next-stage-expansion.md) |
| A09 分数运算生成器（顺位 2）| 低 | 等顺位 1 闭环 | [子计划 4 Umbrella](2026-04-18-subplan-4-next-stage-expansion.md) |
| Phase 3 段位赛（顺位 3，BO3/BO5/BO7）| 低 | 等顺位 2 闭环 | [子计划 4 Umbrella](2026-04-18-subplan-4-next-stage-expansion.md) |
| B/C/D 领域开发 | 低 | 已从子计划 4 移出；多季度 roadmap | 子计划 5（待立）|
