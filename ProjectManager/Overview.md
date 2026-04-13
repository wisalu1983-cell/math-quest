# math-quest 项目概览

> 最后更新：2026-04-13（游戏化 Phase 1 CR+QA 验收通过；删除全部倒计时逻辑）

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

**当前状态**：91 测试通过，构建成功（446KB）

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

完整清单见 [`docs/ISSUE_LIST.md`](../docs/ISSUE_LIST.md)

### P0 — 必须修复
- **ISSUE-001** ✅ 随 Phase 1 关闭（速度奖励系统已删除）
- **ISSUE-002** ✅ Phase 1 内含修复（normalize 函数已改进）
- **ISSUE-003** A08 `generateMoveConstant` 只有 2 个选项 → 50% 蒙对率

### P1 — 重要
- **ISSUE-004** `generateReverseRound` 浮点精度问题
- **ISSUE-005** `generateOperationOrder` MC 干扰项质量差
- **ISSUE-006** `generateCompareSize` b=1 概率 33%（应降到 10-15%）
- **ISSUE-007** `generateTwoStep/ThreeStep` 是死代码

### P2 — 增强
- **ISSUE-008** 约 40% 子函数无直接测试覆盖
- **ISSUE-009** 提示文本质量不一致
- **ISSUE-010** 答案格式不统一
