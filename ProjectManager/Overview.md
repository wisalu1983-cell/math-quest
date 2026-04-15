# math-quest 项目概览

> 最后更新：2026-04-15（视觉全量 QA：86 条用例 82 PASS / 4 FAIL，1 个 P1 布局 Bug（关卡宽度不一致），颜色/字体/尺寸/可访问性全面达标；5 个截图审视发现）

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
| Phase 3 | 段位赛系统（BO3/BO5/BO7） | ⬜ 待开始 |

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

**当前状态**：88 测试通过，构建成功

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

### P2 — 增强（待解决）
- **ISSUE-008** 约 40% 子函数无直接测试覆盖
- **ISSUE-009** 提示文本质量不一致
- **ISSUE-010** 答案格式不统一
- **ISSUE-017** 竖式减法退位提示可发现性偏弱

### UI 问题（已关闭）

| Issue | 描述 | 状态 |
|-------|------|------|
| ISSUE-018 | bg-error → bg-danger | ✅ 关闭 |
| ISSUE-019 | setPage 移入 useEffect | ✅ 关闭 |
| ISSUE-020 | BottomNav 5 份重复代码 | ✅ 关闭（提取为组件）|
| ISSUE-021 | useGameProgressStore 导入路径统一 | ✅ 关闭（统一改为 @/store barrel import）|
| ISSUE-022 | 关卡按钮触控区偏小 | ✅ 关闭（min-height 92px）|
| ISSUE-023 | 错题本仅展 5 题 | ✅ 关闭（移除限制）|
| ISSUE-024 | 页面加载无 Loading 状态 | ✅ 关闭（LoadingScreen 组件）|
| ISSUE-025~031 | Minor UI 问题 | ⚠️ 部分关闭，详见 ISSUE_LIST.md |
| ISSUE-027 | 动态 document.title | ✅ 关闭 |
| ISSUE-028 | 图标按钮缺 aria-label | ✅ 关闭 |
| ISSUE-032 | 主按钮白字对比度 | ✅ 关闭（产品决策：保留白字）|
| ISSUE-033 | user-scalable=no | ✅ 关闭 |
| ISSUE-034 | 退出弹窗缺 dialog 规范 | ✅ 关闭（Dialog 组件）|
| ISSUE-035 | 进度条无 ARIA | ✅ 关闭（ProgressBar 组件）|
| ISSUE-036 | aria-live 答题反馈 | ✅ 关闭 |
| ISSUE-037 | DecimalTrainingGrid 颜色 | ✅ 关闭（设计 token 替换）|
| ISSUE-039 | prefers-reduced-motion | ✅ 关闭 |
| ISSUE-040 | 心数 aria-label | ✅ 关闭（Hearts 组件）|

---

## 后续待办

### 近期（建议排期）

| 优先级 | 事项 | 说明 |
|--------|------|------|
| P1 | **Phase 2 浏览器验收** | 进阶系统首次在真实浏览器中测试（AdvanceSelect/进阶答题/结算视图/星级进度） |
| P1 | **游戏化 Phase 3** | 段位赛系统（BO3/BO5/BO7），先写规格再开发 |

### 中期

| 优先级 | 事项 | 说明 |
|--------|------|------|
| P2 | 真题参考库补充 | 目标 525，当前 312，差 213 题 |
| P2 | ISSUE-025~031 Minor UI | 部分仍开放，详见 ISSUE_LIST.md |
| P3 | ISSUE-008~010/017 | 生成器测试覆盖、提示文本、答案格式、竖式退位提示 |
