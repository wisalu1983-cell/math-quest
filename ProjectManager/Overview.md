# math-quest 项目概览

> 最后更新：2026-04-22（Phase 4 收口：补齐 4-4 子计划入口，同步主线/索引状态）
> 角色：**活跃控制面 / 总管**。本文件只保留项目背景、版本轴、当前阶段目标、当前主线、当前状态、下一步和入口链接；细节下放到对应专人文档或版本归档。

---

## 项目背景

**产品**：数学大冒险（math-quest），面向上海五年级学生的游戏化数学练习应用。

**长期问题**：

- 题目生成不能只靠算法随机，需要用真实考试材料校准
- 游戏化不能只做 UI 包装，需要形成完整的长期练习闭环

**长期路线**：

1. 用真题参考库校准生成器质量
2. 完成三层游戏化闭环：闯关 → 进阶 → 段位赛
3. 基于真实用户反馈持续打磨体验与能力训练设计

**当前范围**：聚焦 A 领域（A01-A08 数与运算）；A09、B、C、D 暂不在本阶段范围内。

---

## 版本轴

| 阶段 | 版本 | 状态 | 入口 |
|---|---|---|---|
| **当前版本** | **v0.2** | 🟡 进行中（Phase 1~4 已完成，Phase 5 待启动） | [Plan/v0.2/](Plan/v0.2/) |
| 上一版本 | v0.1 | ✅ 已发布（2026-04-19 收口，三层游戏化闭环完成） | [Plan/v0.1/](Plan/v0.1/) |

> 版本命名与归档规则见 [Plan/README.md](Plan/README.md) §版本归档规则。本文件只呈现当前版本活跃信息；历史版本请进入对应 `Plan/vX.Y/` 目录。

---

## 当前阶段（v0.2）

**阶段目标**：把 2026-04-20 收到的一批深度体验反馈（13 条）整体作为主线，从"清现网可感知体验问题"、"回到题型教育设计层面重梳理"、"补齐游戏化反馈与长期回顾能力"三个方向推进，并顺带建一套可用的开发者工具栏降低人工验证成本。

**当前主线**：用户反馈驱动主线（5 个 Phase：Phase 1 效率基建+低成本修复 → Phase 2 三项合并短诊断 → Phase 3 诊断结论执行 → Phase 4 题型教育设计重梳理 → Phase 5 历史答题记录）。

**当前状态**：

- ✅ **`v0.2-1-1` F3 开发者工具栏** 实施+QA 全部通过（2026-04-21）
  - 单测 501/501 全绿（含新增 22 条）；双构建纯净度 grep 验证通过；用户人工 QA 确认注入项有效性
  - 子计划详见：[`Plan/v0.2/subplans/2026-04-20-dev-tool-panel.md`](Plan/v0.2/subplans/2026-04-20-dev-tool-panel.md)
  - QA 报告：[`QA/runs/2026-04-20-f3-dev-tool-unit-test/qa-result.md`](../QA/runs/2026-04-20-f3-dev-tool-unit-test/qa-result.md)
- ✅ **`v0.2-1-2` B1 生成器退化题 + E1 题干折行** 实施+QA 全部通过（2026-04-21）
  - vitest 503/503；E1 Playwright DOM 度量全通过；算式题型全部单行
  - B1 子计划：[`Plan/v0.2/subplans/2026-04-21-b1-生成器退化题修复.md`](Plan/v0.2/subplans/2026-04-21-b1-生成器退化题修复.md)
  - E1 子计划 + QA 报告：[`Plan/v0.2/subplans/2026-04-21-e1-题干折行修复.md`](Plan/v0.2/subplans/2026-04-21-e1-题干折行修复.md) · [`QA/runs/2026-04-21-e1-prompt-nowrap/qa-result.md`](../QA/runs/2026-04-21-e1-prompt-nowrap/qa-result.md)
- ✅ **Phase 2 联合诊断报告** 用户确认（2026-04-21）
  - B2：数值设计问题 → Phase 3，采用方向 A（权重表整体上调）
  - C1：设计问题 → Phase 4 A3 子议题
  - D：实现问题 → Phase 3（结算 UI 动效重构）
  - 报告：[`Reports/2026-04-21-phase-2-diagnosis.md`](Reports/2026-04-21-phase-2-diagnosis.md)
- ✅ **Phase 3 全部完成**（2026-04-22）
  - ✅ `v0.2-3-1` B2 权重表：常量调整 + 单测更新，F3 验证通过
  - ✅ `v0.2-3-2` D 结算UI重构 v2：心逐颗飞入进度条动效 + 升星链 + 紧凑横排 Banner，vitest 503/503，build ✓
  - B2 子计划：[`Plan/v0.2/subplans/2026-04-21-b2-进阶权重表调整.md`](Plan/v0.2/subplans/2026-04-21-b2-进阶权重表调整.md)
  - D 子计划：[`Plan/v0.2/subplans/2026-04-21-d-进阶结算UI重构.md`](Plan/v0.2/subplans/2026-04-21-d-进阶结算UI重构.md)
- ✅ **Phase 4 全部完成**（2026-04-22）：
  - ✅ **`v0.2-4-C1` 档内梯度规范化** 完成（2026-04-22）：5条Lane从三关缩为两关 + 8个生成器档内子梯度改造，vitest 504/504，人工QA 3题型验证通过
    - 子计划：[`Plan/v0.2/subplans/2026-04-22-c1-档内梯度规范化.md`](Plan/v0.2/subplans/2026-04-22-c1-档内梯度规范化.md)
  - ✅ **`4-1` A3 审题原则总则** 完成（2026-04-22）：经结构化思考对话产出，规格文档入仓，A02 情景题库从 12 道扩至 22 道，vitest 504/504
    - 规格：[`Specs/2026-04-22-审题原则总则.md`](Specs/2026-04-22-审题原则总则.md)
  - ✅ **`4-2` A1估算+A2基础技巧类排查** 完成（2026-04-22）：题型-技巧映射表产出，estimate-basic 重设计（去精度指定+±15%容忍范围），floor-ceil-basic 决策删除
    - 规格：[`Specs/2026-04-22-估算能力与基础技巧类排查.md`](Specs/2026-04-22-估算能力与基础技巧类排查.md)
  - ✅ **`4-3` A4 逆向推理验证** 完成（2026-04-22）：A3 总则机制一回验成立；5 组 reverse-round 模板 + hints 改进方向
    - 规格：[`Specs/2026-04-22-逆向推理A3回验.md`](Specs/2026-04-22-逆向推理A3回验.md)
  - ✅ **`4-4` F1 方法 Tips 库落地** 完成（2026-04-22）：4 个子题型 Tip 文案落地，`getMethodTip()` 纯函数 + 18 条专项测试，Practice.tsx 题干卡片与答题框之间静态展示，vitest 523/523
    - 触发规则：最低档次（d≤5）展示；compare 概念题 d≤8（Boss d=9 不展示）
    - 子计划：[`Plan/v0.2/subplans/2026-04-22-4-4-method-tips.md`](Plan/v0.2/subplans/2026-04-22-4-4-method-tips.md)
    - 新增文件：`src/utils/method-tips.ts`、`src/utils/method-tips.test.ts`
  - ✅ **Phase 4 生成器改造补完** 完成（2026-04-22）：
    - `4-2A` estimate-basic 重设计（新 prompt 格式 + ±15% 容忍验证）vitest 523/523
    - `4-2B` floor-ceil-basic 删除 + context 20道分层（d=4~5 简单/d≥6 两层）
    - `4-3` reverse-round 5模板 + hints 方向性改进
    - 子计划：[`Plan/v0.2/subplans/2026-04-22-4-2a-estimate-basic重设计.md`](Plan/v0.2/subplans/2026-04-22-4-2a-estimate-basic重设计.md) · [`Plan/v0.2/subplans/2026-04-22-4-2b-floor-ceil重构.md`](Plan/v0.2/subplans/2026-04-22-4-2b-floor-ceil重构.md) · [`Plan/v0.2/subplans/2026-04-22-4-3-reverse-round模板扩充.md`](Plan/v0.2/subplans/2026-04-22-4-3-reverse-round模板扩充.md)
  - ✅ **Phase 4 全量浏览器验收** 通过（2026-04-22）：4/4 PASS
    - T01 reverse-round tip ✅、T02 floor-ceil tip ✅、T03 estimate 新格式 ✅、T04 compare tip ✅
    - QA 报告：[`QA/runs/2026-04-22-4-tips-ui-qa/qa-result.md`](../QA/runs/2026-04-22-4-tips-ui-qa/qa-result.md)

**下一步**：启动 Phase 5 `5-1`（F2 本地版：数据模型 + 存档 + UI）。入口：[`Plan/v0.2/phases/phase-5.md`](Plan/v0.2/phases/phase-5.md)

---

## 权威入口

### 版本活跃入口

- 当前版本根目录：[Plan/v0.2/](Plan/v0.2/)
- 当前主线概览：[Plan/v0.2/00-overview.md](Plan/v0.2/00-overview.md)
- 当前反馈目录：[Plan/v0.2/01-feedback-catalog.md](Plan/v0.2/01-feedback-catalog.md)
- 当前 Phase 计划：[Plan/v0.2/03-phase-plan.md](Plan/v0.2/03-phase-plan.md)
- 当前执行纪律：[Plan/v0.2/04-execution-discipline.md](Plan/v0.2/04-execution-discipline.md)
- Phase 4 收口详表：[Plan/v0.2/phases/phase-4.md](Plan/v0.2/phases/phase-4.md)
- 下一步入口：[Plan/v0.2/phases/phase-5.md](Plan/v0.2/phases/phase-5.md)

### 全局管理入口

- 开放问题权威源：[ISSUE_LIST.md](ISSUE_LIST.md)
- 未激活候选 / 延期条目：[Backlog.md](Backlog.md)
- 计划索引 / 模板 / 版本归档规则：[Plan/README.md](Plan/README.md)
- 规格导航总索引：[Specs/_index.md](Specs/_index.md)
- 复盘 / 历史机制记录：[Reports/](Reports/)

### 历史版本

- v0.1 版本归档：[Plan/v0.1/](Plan/v0.1/)（[README](Plan/v0.1/README.md) · [收口快照](Plan/v0.1/00-overview.md) · [已关闭 issue](Plan/v0.1/issues-closed.md)）

### 低频扩展

- 人工验证题库：[human-verification-bank-v2.md](human-verification-bank-v2.md)
- QA 产物：[QA/](QA/)
- 真题参考库：[../reference-bank/README.md](../reference-bank/README.md)
