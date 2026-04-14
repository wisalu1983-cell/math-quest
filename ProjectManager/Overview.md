# math-quest 项目概览

> 最后更新：2026-04-14（Phase 1 热修复 + 优化迭代完成；深度体验 QA Batch 1 已执行；UI 设计审查 + WCAG AA 无障碍审查已完成，ISSUE-018~045 已录入；UI/UX 整体重设计规格已制定，见 Specs/2026-04-14-ui-redesign-spec.md）

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
| Phase 1 深度体验 QA Batch 1 | 解锁链 / 退出弹窗 / 竖式板交互拟真人工 QA（经产品分流后：14 PASS / 1 RISK） | ✅ [已完成](Plan/2026-04-14-phase1-deep-experience-manual-qa.md) |
| Phase 2 | 进阶系统（心→星，难度自动调配） | ⬜ 待开始 |
| Phase 3 | 段位赛系统（BO3/BO5/BO7） | ⬜ 待开始 |

**Phase 1 主要改动：**
- 移除旧体系：XP/40级/38成就/连击/连续打卡/速度奖励
- 新增：`src/types/gamification.ts`（新类型）、`src/constants/campaign.ts`（8题型闯关地图）、`src/store/gamification.ts`（GameProgressStore）
- 重构：store/index.ts（三心制 SessionStore）、repository/local.ts（版本升至 v2）
- 重写页面：Home、CampaignMap（新）、SessionSummary、Progress
- 改造页面：Practice（移除XP/连击，心归零立即结算）
- 清理：Onboarding/Profile/History/SessionDetail/WrongBook
- **2026-04-13 补充**：从 mental-arithmetic.ts / number-sense.ts 删除所有 `timeLimit` 字段（共 7 处），从 Practice.tsx 删除倒计时 state、3 个 useEffect、进度条 UI —— 彻底移除倒计时功能

### 生成器模块

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 0 | 分类调整（A01升级/A07纯化/A03审视） | ✅ 完成 |
| Phase 1 | P0 高频考点（比较/循环小数/括号方程/除法方程） | ✅ 完成 |
| Phase 2 | P1 参数扩展（左移/特殊值/四项/除法性质/隐藏因数） | ✅ 完成 |
| Phase 3 | P2 题型扩展（运算律识别/概念判断/去尾法/逆向推理） | ✅ 完成 |
| A03 块A | 生成器小数支持 | ✅ 完成 |
| A03 块B | 组件重构（小数点列 + 训练格） | ✅ 完成 |

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

### 计划文件

→ 详见 [Plan/](Plan/) 目录

---

## 待解决问题

完整清单见 [`ISSUE_LIST.md`](ISSUE_LIST.md)

### P0 — 必须修复
- **ISSUE-001** ✅ 随 Phase 1 关闭（速度奖励系统已删除）
- **ISSUE-002** ✅ Phase 1 内含修复（normalize 函数已改进）
- **ISSUE-003** ✅ A08 MC 选项已扩充至 4 个（热修复 1.4）
- **ISSUE-011** ✅ subtypeFilter 架构修复，44 路线全部配置（热修复第二批）
- **ISSUE-014** ✅ 去掉年级选择，统一难度基准并文档化（热修复 1.1 + 第四批）

### P1 — 重要
- **ISSUE-004** ✅ 浮点精度用纯整数运算修复（热修复 3.1）
- **ISSUE-005** ✅ MC 干扰项改为从表达式子组合生成（热修复 3.2）
- **ISSUE-006** ✅ b=1 概率从 33% 降至 15%（热修复 3.3）
- **ISSUE-007** ✅ 死代码已删除（热修复 3.4）
- **ISSUE-012** ✅ Progress 页面新增 History 入口按钮（热修复 1.3）
- **ISSUE-013** ✅ loadGameProgress 后立即持久化（热修复 1.2）

### P2 — 增强（待解决）
- **ISSUE-008** 约 40% 子函数无直接测试覆盖
- **ISSUE-009** 提示文本质量不一致
- **ISSUE-010** 答案格式不统一
- **ISSUE-017** 竖式减法退位提示可发现性偏弱（可考虑在有进位/退位辅助格的题型上提供可点开的 Tips 说明）

### UI 设计审查（2026-04-14，待修复）
> 完整报告: [.ui-design/reviews/mathquest_20260414_full.md](.ui-design/reviews/mathquest_20260414_full.md)

| 等级 | Issue | 描述 |
|------|-------|------|
| Critical | ISSUE-018 | SessionSummary 使用无效 CSS token `bg-error/10` |
| Critical | ISSUE-019 | SessionSummary render 中调用 setPage（React 反模式） |
| Major | ISSUE-020 | 底部导航栏5份重复代码 |
| Major | ISSUE-021 | useGameProgressStore 导入来源不一致 |
| Major | ISSUE-022 | CampaignMap 关卡按钮触控区域偏小 |
| Major | ISSUE-023 | 错题本每主题仅展5题无"查看全部" |
| Major | ISSUE-024 | 页面加载无 Loading 状态 |
| Minor | ISSUE-025~031 | 详见 ISSUE_LIST.md |

### WCAG AA 无障碍审查（2026-04-14，待修复）
> 完整报告: [.ui-design/audits/mathquest_a11y_20260414_AA.md](.ui-design/audits/mathquest_a11y_20260414_AA.md)

| 等级 | Issue | 描述 |
|------|-------|------|
| Critical | ISSUE-032 | 主按钮白字对比度仅 2.09:1（WCAG 1.4.3） |
| Critical | ISSUE-033 | viewport user-scalable=no 阻止文字缩放（WCAG 1.4.4） |
| Serious | ISSUE-028 | 图标按钮缺 aria-label（WCAG 4.1.2） |
| Serious | ISSUE-034 | 退出弹窗缺 dialog 语义和焦点陷阱 |
| Serious | ISSUE-035 | 进度条无 ARIA 角色与属性 |
| Serious | ISSUE-036 | 答题反馈无 aria-live 区域（WCAG 4.1.3） |
| Moderate | ISSUE-037~041 | 对比度/动画/颜色区分等，详见 ISSUE_LIST.md |
| Minor | ISSUE-042~045 | 详见 ISSUE_LIST.md |
