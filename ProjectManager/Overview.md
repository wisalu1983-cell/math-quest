# math-quest 项目概览

> 最后更新：2026-04-17（v2.2 生成器重写收口；**当前阶段主计划** = [`Plan/2026-04-16-open-backlog-consolidation.md`](Plan/2026-04-16-open-backlog-consolidation.md)；**进行中子计划** = [`Plan/2026-04-17-campaign-advance-stabilization.md`](Plan/2026-04-17-campaign-advance-stabilization.md) 闯关+进阶稳定化）

---

## 项目目标

**产品**：数学大冒险（math-quest）— 面向上海五年级学生的游戏化数学练习应用

**核心问题**：现有生成器纯算法生成，缺乏真实考试校准，与实际考试题型脱节；游戏化包装缺乏整体规划，体验碎片化

**解决方案**：
1. 构建真题参考库（525题）+ 逐主题校准生成器
2. 全面重新设计游戏化体系（三层：闯关→进阶→段位赛）

**成功标准**：
1. A01-A08 八个核心主题生成器全部校准完成 ✅
2. 真题参考库达到 525 题（当前 312/525，59%）
3. 游戏化重新设计完成并实施（Q1~Q10 全部确认，**Phase 1 CR+QA 验收通过**）
4. P0 问题全部修复（见待解决问题）

**范围**：当前聚焦 A 领域（A01-A08 数与运算）；A09 分数、B 几何、C 应用题、D 统计待后续排期

---

## 当前进展

### 游戏化重设计

| 阶段 | 内容 | 状态 |
|------|------|------|
| 设计 Q1~Q10 | 游戏化规格确认（闯关/进阶/段位赛体系，心数门槛，段位数值） | ✅ 完成 |
| Phase 1 开发 | Foundation + 闯关系统（15 个 Task，tsc 0 错误，91 测试通过） | ✅ 开发完成 |
| Phase 1 CR+QA | Code Review 修复 2 Bug + 浏览器全量测试 48/48 PASS | ✅ 验收通过 |
| Phase 1 热修复+迭代 | 去年级区分、History入口、路线匹配修复、出题质量、难度标准化 | ✅ [全部完成](Plan/2026-04-14-phase1-hotfix-and-iteration.md) |
| Phase 1 深度体验 QA Batch 1 | 解锁链 / 退出弹窗 / 竖式板交互拟真人工 QA（14 PASS / 1 RISK） | ✅ [已完成](Plan/2026-04-14-phase1-deep-experience-manual-qa.md) |
| Phase 2 开发 | 进阶系统（心→星，难度自动调配） | ✅ 开发完成 |
| Phase 2 CR+QA | Code Review 17项 + 冒烟107条 + 可信44条深度QA | ✅ [冒烟](Reports/2026-04-15-full-qa-results.md) + [可信](Reports/2026-04-15-credible-qa-results.md) |
| Bug 修复 | CR-002 竖式浮点 + 进阶结算页无限重渲染 | ✅ 已修复并验证 |
| 视觉全量 QA | 86 条：颜色/字体/尺寸/布局/交互/可访问性/截图审视 | ✅ [报告](Reports/2026-04-15-visual-qa-results.md)（82 PASS / 4 FAIL）|
| 视觉修复回归 | 6 项修复验证：关卡宽度/边框/Progress留白/答题居中/庆祝动画/弹窗遮罩 | ✅ [报告](Reports/2026-04-15-regression-visual-results.md)（6/6 PASS）|
| P1+P2 修复 QA | CR + Vitest 167/167 + Playwright 16/16 PASS，0 新缺陷 | ✅ [报告](../test-results/phase2-p1p2-fixes/qa-result.md) |
| Phase 2 浏览器验收 | 进阶系统 A1-A6 全量验收：Vitest 167/167 + Playwright 31 条 30 PASS / 拟真 QA 10 条 9 PASS，0 新缺陷 | ✅ [报告](../test-results/phase2-advance-acceptance/qa-result.md) |
| P1 UI/a11y 批量修复 | ISSUE-022~024/028/032/034/035 共 7 项关闭：Playwright 19/19 PASS | ✅ [报告](../test-results/p1-ui-a11y-batch/qa-result.md) |
| Phase 3 | 段位赛系统（BO3/BO5/BO7） | ⬜ 下阶段 |

### UI 重设计（阳光版 v5）

| 阶段 | 内容 | 状态 |
|------|------|------|
| 视觉方向 | 阳光版 v5 批准：暖色系/平面/SVG图标/鼓励情绪（5轮迭代） | ✅ 批准 |
| Phase A | Token 替换 + 5 个基础组件（BottomNav/ProgressBar/Hearts/LoadingScreen/Dialog） | ✅ 完成 |
| Phase B | 页面级改造（Home/CampaignMap/Practice/SessionSummary/WrongBook/Progress 等全量） | ✅ 完成 |
| Phase C | 动效打磨（stagger 入场动画 + 推荐关卡跳动） | ✅ 完成 |
| Design Review | 设计系统合规审查（94% 合规），修复 DecimalTrainingGrid/Hearts/card border 等 | ✅ 完成 |
| WCAG AA 审查 | 无障碍审查，修复 CampaignMap 键盘/输入框 aria/skip-link/focus-visible 等 | ✅ 完成 |
| 浏览器实测 | 主路径 E2E 验收（新 UI 首次在真实浏览器中测试） | ✅ **完成**（0 JS 错误，截图存档）|

### 生成器模块

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 0~3 | A01-A08 全主题 P0/P1/P2 改进 | ✅ 全部完成 |
| A03 块A/B | 小数支持 + 竖式组件重构 | ✅ 完成 |

**当前状态**：A01-A08 生成器能力已并入主线验证，当前总测试 225/225 通过，构建成功

### 真题参考库

| 主题 | F | A | 合计 |
|------|---|---|------|
| A01 基础计算 | 21 | 15 | 36 |
| A02 数感估算 | 15 | 12 | 27 |
| A03 竖式笔算 | 22 | 16 | 38 |
| A04 运算律 | 20 | 15 | 35 |
| A05 小数运算 | 30 | 30 | 60 |
| A06 括号变换 | 18 | 13 | 31 |
| A07 简便计算 | 24 | 21 | 45 |
| A08 方程等式 | 23 | 17 | 40 |
| **合计** | **173** | **139** | **312/525 (59%)** |

---

## 待解决问题

完整清单见 [`ISSUE_LIST.md`](ISSUE_LIST.md)

### P0 — 全部关闭 ✅

### P1 — 全部关闭 ✅

### P2 — 生成器增强 ✅ 全部关闭
- **ISSUE-008** ✅ 新增 58 条三档覆盖测试（difficulty-tiers.test.ts）
- **ISSUE-009** ✅ 降级关闭（hints 字段 UI 未使用，属死数据）
- **ISSUE-010** ✅ formatNum 提取到 utils.ts，消除 4 处重复

### UI / 无障碍开放项（待排期）
- **UI / 交互**：ISSUE-020、025、026、029~031 仍开放，涉及导航复用、token/字号统一、类型与代码整洁
- **a11y / 体验**：ISSUE-037、038、041~043、045 仍开放，涉及颜色语义、skip-link、焦点管理

### 2026-04-16 试玩反馈（全部已修复）
- **ISSUE-046** ✅ 结算面板心数不更新（store/index.ts submitAnswer 同步 heartsRemaining）
- **ISSUE-047** ✅ 除法整除比例异常（difficulty 6-7: 40% 有余数；8+: 30% 有余数）
- **ISSUE-048** ✅ Boss 关无视觉差异（CampaignMap 火焰横幅 + danger 配色 + 120px 按钮）
- **ISSUE-049** ✅ Boss 关内容与综合挑战关雷同（Boss diff→9 题数→25；S3-L3→8；S2-L3→6）
- **ISSUE-050** ✅ 进阶/段位赛对新用户不可见（Home 始终显示进阶入口，未解锁呈锁定态）
- **ISSUE-051** ✅ 关卡难度梯度缺失（并入 ISSUE-049 处理）
- **ISSUE-052** ✅ 进度圆点挤压心数（>15 题改为数字 N/M）
- **ISSUE-053** ✅ 关卡地图未自动滚到当前关（scrollIntoView + 300ms 延迟）
- **ISSUE-054** ✅ 算式折行（whitespace-nowrap + 动态字号）
- **ISSUE-055** ✅ 余数框获焦页面跳动（focus preventScroll: true）
- **ISSUE-017** ✅ 竖式退位提示（首次进入竖式题显示脉冲提示）

### UI / 无障碍审查跟踪

| 类别 | 条目 | 状态 |
|------|------|------|
| 已关闭 | ISSUE-018、019、021~024、027、028、032~036、039、040、044 | ✅ 已关闭 |
| 仍待处理 | ISSUE-020、025、026、029~031、037、038、041~043、045 | ⬜ 详见 ISSUE_LIST.md |

---

## 后续待办

**当前阶段主计划**：[`Plan/2026-04-16-open-backlog-consolidation.md`](Plan/2026-04-16-open-backlog-consolidation.md)（2026-04-17 刷新）  
**进行中子计划**：[`Plan/2026-04-17-campaign-advance-stabilization.md`](Plan/2026-04-17-campaign-advance-stabilization.md) — 闯关+进阶模式稳定化

### 当前阶段：闯关 + 进阶模式稳定化

| 优先级 | 事项 | 状态 |
|--------|------|------|
| ~~P1~~ | Phase 2 浏览器验收 | ✅ [报告](../test-results/phase2-advance-acceptance/qa-result.md) |
| ~~P1~~ | 高优先级 UI/a11y 修复 ISSUE-022~024/028/032/034/035 | ✅ [报告](../test-results/p1-ui-a11y-batch/qa-result.md) |
| ~~P1~~ | 生成器质量补强 ISSUE-008~010 | ✅ 已完成（2026-04-16）|
| ~~P1~~ | 生成器 v2.2 系统性重写 | ✅ 已完成（2026-04-17）|
| **P0** | **v2.2 稳定化 S1 阻塞级**：ISSUE-058（tsc 24 错误）+ BUG-v2-SMOKE-02（A05 指令丢失）| ✅ 代码完成（2026-04-17），浏览器截图回归待执行，见子计划 2.5 §S1 |
| **P1** | **v2.2 稳定化 S2 重要 bug**：SMOKE-01/03 + Q-057-F01/F02 | 🟡 进行中，见子计划 2.5 §S2 |
| **P1** | **v2.2 稳定化 S3 深度体验 QA**：梯度打分 / 新答题形式 / A08 陷阱 / 节奏+hearts | 🟡 进行中，见子计划 2.5 §S3 |
| **P1** | **v2.2 稳定化 S4 进阶专项**：压档后 buildAdvanceSlots + 进阶冒烟 + multi-blank 在进阶的表现 | 🟡 进行中，见子计划 2.5 §S4 |
| P2 | UI 一致性清理 | 子计划 3（未启动，稳定化后）|
| P2 | 真题参考库补充（312/525，差 213）| 可并行推进 |

### 下阶段：新功能扩展

| 优先级 | 事项 | 说明 |
|--------|------|------|
| P2 | **游戏化 Phase 3** | 段位赛系统（BO3/BO5/BO7），闯关+进阶稳定化完成后启动 |
| P3 | A03 块B Plus | 竖式题型深化（乘法部分积、除法试商） |
| P3 | A09 分数运算生成器 | 新题型开发 |
| P3 | B/C/D 领域开发 | 新领域内容扩展 |
