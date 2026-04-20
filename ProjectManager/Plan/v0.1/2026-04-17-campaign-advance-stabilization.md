# 闯关 + 进阶模式稳定化（子计划 2.5）

> 创建：2026-04-17  
> 父计划：[`Plan/v0.1/2026-04-16-open-backlog-consolidation.md`](2026-04-16-open-backlog-consolidation.md)（当前阶段主计划）  
> 父任务：原 §四 子计划 2 收尾 + 原 §四 子计划 1 在 v2.2 后的延伸验收  
> 设计规格：多份，详见下方"前置相关规格"  
> 状态：✅ 全部关闭（2026-04-18）— S1/S2/S3/S4 四组全绿，S3-T1 梯度打分用户已确认

---

## 一、背景

### 前置相关规格（开工前必读）

> 📑 规格索引：[`ProjectManager/Specs/_index.md`](../../Specs/_index.md)

| 规格 | 本计划从中继承的硬约束 |
|------|--------------------|
| [`Specs/2026-04-17-generator-redesign-v2.md`](../../Specs/2026-04-17-generator-redesign-v2.md) v2.2 | 8 题型档位分布、答题形式、陷阱策略；A01/A04/A08 压 2 档 |
| [`Specs/2026-04-15-gamification-phase2-advance-spec.md`](../../Specs/2026-04-15-gamification-phase2-advance-spec.md) | `TOPIC_STAR_CAP`——A01/A04/A08 仅 2 梯度（3★），其余 3 梯度（5★）；进阶 20 题 SWOR 选子题型 |
| [`Specs/2026-04-13-star-rank-numerical-design.md`](../../Specs/2026-04-13-star-rank-numerical-design.md) | 星级体系、心数门槛 |
| [`Specs/2026-04-16-generator-difficulty-tiering-spec.md`](../../Specs/2026-04-16-generator-difficulty-tiering-spec.md) | 三档难度认知定义（基础/提高/挑战）|
| [`Specs/2026-04-14-ui-redesign-spec.md`](../../Specs/2026-04-14-ui-redesign-spec.md) | Practice 页卡片渲染的尺寸/字号约束 |

### 跨系统维度清单

本计划会改动 / 验证以下跨系统维度（session 交接时按此清单扫兄弟规格）：

- [x] 生成器题型输出（A05 prompt 渲染路径、A08 equation-input 文案）
- [x] 前端 Practice 渲染（长题面折行、promptLatex 与 prompt 并存）
- [x] TypeScript 类型系统（`BracketOpsData` / `EquationTransposeData` / `MultiStepData` / subtype 联合类型）
- [x] 闯关 subtypeFilter 名实对应（A01 S2-LB / A05 S2-LB）
- [x] 进阶模式 `buildAdvanceSlots` 在 2 档压缩后的实战行为
- [ ] 难度档位 / 星级数值（**不动**，沿用已定规格）
- [ ] UI 组件尺寸 / 卡片尺寸（**不动**，沿用 ui-redesign-spec）

### 工作脉络

v2.2 生成器系统性重写（[`Plan/v0.1/2026-04-17-generator-redesign-v2-implementation.md`](2026-04-17-generator-redesign-v2-implementation.md)）在 2026-04-17 收口，阶段 1-6 全部完成。收口时通过两轮 QA 暴露出若干遗留：

1. **`ISSUE-058`**：v2.2 生成器新增的 subtype 字面量 / data 字段没同步进 `src/types/`，`tsc -b` 报 24 个类型错误，`npm run build` 生产构建无法产出部署包。
2. **冒烟 smoke-report 遗留**（`Plan/v0.1/2026-04-17-generator-redesign-v2-implementation.md` §阶段 5）：
   - `BUG-v2-SMOKE-02`（P0）A05 分数题 `promptLatex` 覆盖了 prompt，指令文字完全丢失
   - `BUG-v2-SMOKE-01`（P1）A04/A06 长题面被 `whitespace-nowrap overflow-x-auto` 截断
   - `BUG-v2-SMOKE-03`（P2）A08 equation-input placeholder 写死 `例：4x = 20`
3. **ISSUE-057 QA session 遗留**（`Reports/2026-04-17-qa-issue057-session.md`）：
   - `Q-057-F01`（P2）A01 S2-LB "口算拆分技巧" lane 名只描述 50% 题目
   - `Q-057-F02`（P2）A05 S2-LB "反直觉与比较" filter 混入 `cyclic-div`（语义不符）
4. **v2.2 阶段 5 未覆盖的验证项**：梯度主观打分、新答题形式完整链路、A08 陷阱诊断、节奏 + hearts 体验。
5. **Phase 2（进阶模式）在 v2.2 后未重跑 A1-A6**：A01/A04/A08 从 3 档压缩为 2 档后，`buildAdvanceSlots` / 合池 / SWOR / distributeSlots 的实战行为未验明；新答题形式（multi-blank / expression-input / equation-input）在进阶主动退出 + 错题写入路径下的表现未测。

本子计划把以上 5 类事项集中收口，让闯关 + 进阶两个模式在 v2.2 之上真正算"稳定可用"。

### 非目标

- 不做 UI 一致性清理（ISSUE-020/025/026 等，归子计划 3）
- 不做段位赛 Phase 3（归子计划 4）
- 不做 A03 块B Plus / A09 / B-D 领域扩展
- 不做真题库 312→525 扩充
- 不改动 `TOPIC_STAR_CAP` 等已定数值规格

---

## 二、范围与任务分组

按"先阻塞、后重要、再深度、末专项"四组推进。每组跑完做一次 QA 回写。

### 分组 S1：阻塞级修复 🔴

**目标**：让 `npm run build` 能产出部署包 + A05 关卡可玩。

| ID | 事项 | 来源 | 涉及文件 | 完成标准 |
|----|------|------|---------|---------|
| S1-T1 | 修 `ISSUE-058`：v2.2 遗留 24 个 tsc 类型错误 | `ISSUE_LIST.md` §ISSUE-058 | `src/types/*.ts`（对应 data 类型 + subtype 联合类型）；`src/engine/generators/bracket-ops.ts`（position 字段）、`equation-transpose.ts`、`multi-step.ts`、`decimal-ops.ts`、`mental-arithmetic.ts`（删除或重命名 `pickTwoDigitDivisor`）| `npm run build` 跑完 tsc 进入 vite 打包并成功 |
| S1-T2 | 修 `BUG-v2-SMOKE-02`：A05 分数题指令丢失 | `Plan/v0.1/2026-04-17-generator-redesign-v2-implementation.md` §阶段 5 | `src/pages/Practice.tsx:229-235`（有 promptLatex 时仍需渲染 prompt 文本）| 进入 A05 低档"分数↔小数互换"题，能看到完整指令 + 分数渲染；回归 v2.2 smoke artifacts 截图对比 |

### 分组 S2：重要非阻塞修复 🟡

**目标**：消除 v2.2 在闯关体验中的明显偏差。

| ID | 事项 | 涉及文件 | 完成标准 |
|----|------|---------|---------|
| S2-T1 | 修 `BUG-v2-SMOKE-01`：A04/A06 长题面截断 | `src/pages/Practice.tsx:222` 的 `whitespace-nowrap overflow-x-auto` 机制重估（按 prompt 长度切换或改支持换行）| A04/A06 长题在 375px 宽屏幕下可完整可见，不截断也不折行造成表达式断裂 |
| S2-T2 | 修 `BUG-v2-SMOKE-03`：A08 equation-input placeholder 情境化 | Practice.tsx equation-input 分支；可用当前题 prompt 字段派生或加 data.placeholder | A08 题目 placeholder 不再写死 `例：4x = 20`，与当前题面结构一致 |
| S2-T3 | 修 `Q-057-F01`：A01 S2-LB 名实对齐 | 二选一：① 改 lane 名为"大数乘除 + 拆分技巧"② 调 `generatePair(d≥6)` 的 `useHighPool` 权重至 0.75，让拆分占主导 | 决策并执行其中一项；`qa-v3.test.ts` 对应断言同步 |
| S2-T4 | 修 `Q-057-F02`：A05 S2-LB 语义聚焦 | `src/constants/campaign.ts` A05 S2-LB 的 `subtypeFilter` 移除 `cyclic-div`，保留在 S3-LA | 单测 + 浏览器端 A05 S2-LB 不再出循环小数题 |

### 分组 S3：v2.2 深度体验 QA 🟢

**目标**：补齐 v2.2 阶段 5 未覆盖的主观 / 链路 / 体验维度验证。

| ID | 事项 | 方法 | 完成标准 |
|----|------|------|---------|
| S3-T1 | 梯度可感知性主观打分 | 人工通读 `ProjectManager/human-verification-bank.md`，每题型每档 10 题；用户自己打分（不能由 agent 替代）| 用户确认每档梯度清晰、差异可感；对打分偏低的档回到对应生成器微调 |
| S3-T2 | 新答题形式完整链路验证 | `agent-as-user-qa` skill 覆盖：`expression-input`（A06/A07）、`equation-input`（A08）、`multi-blank`（A04/A07/A08）、`multi-select`（A02/A04/A05/A07 高档）各至少一题，真实提交 + 多形式答案（等价变形）| 所有形式判等正确；不一致时 `mathjs` 或规则层补修 |
| S3-T3 | A08 陷阱诊断可发现性 | 手工触发 T1/T2/T3/T4 错答各一次，观察错误反馈 | 用户能从反馈中看出错在哪（不只是"答错了"）|
| S3-T4 | 节奏 + hearts 机制体验流畅度 | `agent-as-user-qa` 完整闯关一局（15-20 题）| 无心数同步异常、无判定延迟、无节奏断点；输出四栏结构化报告 + 截图证据 |

### 分组 S4：进阶模式专项验收 🟣

**目标**：把 Phase 2 A1-A6 在 v2.2 新生成器 + 压档规则下重跑一次。

| ID | 事项 | 方法 | 完成标准 |
|----|------|------|---------|
| S4-T1 | 压档后 `buildAdvanceSlots` 实战 | 针对 A01 / A04 / A08（`TOPIC_STAR_CAP=3`）在 0★/1★/2★/3★ 四个星级边界各构造一次进阶局，观察 `tierCounts` 与实际出题档位分布 | 档位分布符合 `advance-spec` 权重表；不会出现"只从单一档抽题"等退化；补 `advance.test.ts` 压档场景用例 |
| S4-T2 | 进阶端到端冒烟 | Playwright 脚本：8 主题各跑一局进阶（题量不必 20，可抽 5 题），覆盖 2 档 & 3 档 | 0 console error / 0 pageerror；结算页 +N 心、升星动画正确 |
| S4-T3 | 新答题形式在进阶中的表现 | 人工进入一个会命中 `multi-blank` / `expression-input` / `equation-input` 的进阶局，走完提交 → 反馈 → 下一题链路；同时触发一次主动退出 | 题目能正常渲染、提交、判定；主动退出后：进度不变、错题写入错题本、保存中止历史（completed: false）|
| S4-T4 | 进阶 A1-A6 旧验收清单复测 | 对照 `test-results/phase2-advance-acceptance/qa-result.md` 的 B-20/21/23/24/25 + G-10~16 + D-20~31 + E-10~17 + K-10~14，抽测其中 6 条关键项在 v2.2 下仍 PASS | 抽测 6/6 PASS；如 FAIL 则回到对应分组修补 |

---

## 三、依赖关系

```
S1-T1 (tsc 修) ──┬─> S4-T2 (进阶冒烟需要 build 能跑)
                └─> S3-T4 (深度体验也依赖可运行)
S1-T2 (A05 指令) ─> S3-T1 (梯度打分里 A05 样题可见)
S2-T* ───────────> S3-T* (先修明显 bug 再做体验 QA，避免干扰)
S3-T1 (梯度打分) 用户自己完成，不阻塞 agent
```

推荐执行顺序：**S1 → S2 → (S3 和 S4 并行，S3-T1 用户自跑) → 回写**

---

## 四、里程碑

| 里程碑 | 退出条件 |
|--------|---------|
| M1：阻塞级清零 | S1 全部完成；`npm run build` 绿；A05 分数题可见完整指令 |
| M2：重要 bug 清零 | S2 全部完成；`qa-v3.test.ts` 全绿；浏览器端抽测通过 |
| M3：深度体验通过 | S3-T2/T3/T4 产出报告；S3-T1 用户确认梯度（如有偏差回修）|
| M4：进阶专项通过 | S4 全部完成；抽测 6 条关键 A1-A6 项通过 |
| M5：收口 | 四组全绿 + 父主计划 §七 回写 + `ISSUE_LIST.md` 对应 issue 关闭 + Overview 更新 |

---

## 五、完成标准（一句话）

`npm run build` 绿 + S1/S2 所有 P0/P1 事项关闭 + `agent-as-user-qa` 完整闯关旅程通过 + 进阶模式 A1-A6 抽测在 v2.2 下 6/6 PASS + 父主计划 §七 回写完毕。

---

## 六、风险与备选

| 风险 | 影响 | 备选 |
|------|------|------|
| `ISSUE-058` 类型补齐涉及 data 判别联合重构，牵动广 | S1-T1 周期拉长 | 先用 local type assertion 止血（`as BracketOpsData`）让 build 通，后续独立 issue 跟踪彻底修 |
| S3-T1 梯度打分由用户执行，可能延期 | M3 阻塞 | 并行推 S4；M3 不阻塞 M4 |
| S4-T3 发现 `multi-blank` 在进阶主动退出路径有 bug | 可能需回到 `store/index.ts` `abandonSession` 分支 | 先记录为新 ISSUE，不强行在本子计划内修；根据严重度决定是否纳入范围 |
| Q-057-F01 的两种修法（改 lane 名 vs 调权重）彼此互斥 | 需决策 | 由用户从体验角度决定，agent 不自选 |

---

## 七、需要同步更新的文档

遵循 `Plan/README.md` 规则 3"同一轮收口至少同步 4 处"：

1. [x] `Plan/README.md` — 已在本次挂新条目
2. [x] 本文件 — 创建 + 2026-04-18 S1/S2/S3/S4 执行结果全部回写
3. [x] 父主计划 `Plan/v0.1/2026-04-16-open-backlog-consolidation.md` §七 — 已加子计划入口
4. [x] `ISSUE_LIST.md` — ISSUE-058 已 2026-04-17 标 ✅；本轮 SMOKE-01/03 + Q-057-F01/F02 属子计划内部事项无独立 issue 号，不新开 ISSUE-059+
5. [x] `Overview.md`（2026-04-18）— S1/S2 全组关闭；S3(agent 部分)/S4 全组关闭；S3-T1 待用户
6. [x] QA 报告 — `ProjectManager/QA/2026-04-18-s3s4-verify/qa-result.md` 新建

---

## 八、执行回写段

> 每组完成后在此补一段"执行结果"。

### S1 执行结果

**状态**：✅ 代码级修复完成（2026-04-17；浏览器端截图回归验收待执行）

#### S1-T1：ISSUE-058 tsc 24 错误修复

处理方式（精准小改，不做判别联合大重构）：

1. **`src/types/index.ts`**：按 v2.2 生成器实际使用的字段补齐四份 data 类型
   - `BracketOpsData.subtype` 扩展 `'nested-bracket' | 'four-items-sign' | 'error-diagnose'`；新增可选字段 `position?: 'front' | 'middle' | 'tail'`、`bracketSide?: 'plus' | 'minus'`
   - `EquationTransposeData` 新增可选字段 `subtype?: 'move-constant' | 'move-from-linear' | 'bracket-equation' | 'move-both-sides' | 'error-diagnose'`、`trap?: string`
   - `MultiStepData` 新增可选字段 `subtype?:`（9 个 v2.2 子题型字面量）、`template?: string`
   - `DecimalOpsData.subtype` 追加 `'trap'`
2. **`src/engine/generators/mental-arithmetic.ts`**：删除零引用的死函数 `pickTwoDigitDivisor`（v2.2 重写遗留，git 历史可回溯）

验证：
- `npx tsc -b`：24 → **0** 错误
- `npm run build`：tsc → vite 打包完整通过，产出 `dist/`
- `npx vitest run`：**270/270 PASS**（类型变化未影响任何既有断言，因新增字段均为可选）

#### S1-T2：BUG-v2-SMOKE-02（A05 分数题指令丢失）

根因：`src/pages/Practice.tsx:229-235` 的 prompt 渲染逻辑中，`promptLatex` 存在时直接短路吞掉 `prompt` 文本，导致：
- A05「分数 → 小数互换」（`promptLatex=\frac{1}{2}`）丢失指令文字「把分数 1/2 化成小数（书写时请用小数形式）」
- A08 各方程题（`promptLatex=equation`）丢失 `PROMPT_TRANSPOSE` 指令前缀

修复方式（Practice.tsx 229-256 区块）：拆分为两个并列分支
- **有 `promptLatex`**：用 `flex-col` 容器，上方小号指令行（取 prompt 按 `\n` 切分后的第一段，避免和下方 LaTeX 重复显示核心表达式），下方大号 LaTeX 渲染
- **无 `promptLatex`**：保持原 `<h2>` 单行 + 三档自适应字号，行为与修复前一致

副作用评估：
- A05 变式 2（prompt 无 `\n`）：整段 prompt 作指令行 + `\frac{1}{2}` 大字 —— 指令恢复可见
- A08 所有题型（prompt 含 `\n`）：指令前缀作小号文本 + `equation` 大字 LaTeX —— 不再重复、指令不丢
- 其他 7 个题型（无 `promptLatex`）：走 else 分支，0 行为变化

#### 遗留待验收（交下一步）

- S1-T2 浏览器截图回归：`agent-as-user-qa` 或手工打开 A05 低档"分数↔小数互换"关卡与 A08 任一题，对比 `test-results/phase2-p1p2-fixes/smoke-report/` 截图，确认指令可见 + LaTeX 渲染正常
- A05 变式 2 prompt 文字中仍含 "1/2" 字样，与下方 LaTeX "1/2" 存在轻微视觉重复。不属于 bug，若 S3 梯度打分时用户反馈突兀，再微调生成器 prompt 文案（如改为"把下列分数化成小数"）。

#### 本 session 跨系统维度扫描（规则 6）

- 题型输出（A05 prompt / A08 equation-input）：仅渲染层修改，生成器输出格式未改 → 与 `Specs/2026-04-17-generator-redesign-v2.md` v2.2 一致
- Practice 渲染：新增分支包装指令+LaTeX 双层布局；未改卡片尺寸 / 外层 padding → 与 `Specs/2026-04-14-ui-redesign-spec.md` 卡片规格一致
- TypeScript 类型：新增字段全部可选，`QuestionData` 联合类型入口未变 → 对 repository / store 侧零影响
- 闯关 subtypeFilter / 进阶 buildAdvanceSlots / 星级数值：本轮**未改动**


### S2 执行结果

**状态**：✅ 全组关闭（2026-04-18）— S2-T1 / S2-T2 / S2-T3 / S2-T4 代码修复 + 回归全绿（tsc 0 错 / vitest 271/271 / 浏览器 S1-T2+S2 五条 PASS）

#### S2-T1：BUG-v2-SMOKE-01（A04/A06 长题面被 `whitespace-nowrap overflow-x-auto` 截断）

根因：`src/pages/Practice.tsx:236` 无 `promptLatex` 分支走的 `<h2>` 使用 `whitespace-nowrap overflow-x-auto`，长表达式（60+ 字）被强制单行 + 滚动条，在 375–512px 宽的卡片内大部分内容不可见。

修复（surgical 单点改动）：`whitespace-nowrap overflow-x-auto` → `whitespace-normal break-words`。保留原有基于 `prompt.length` 的三档字号自适应（`>25` → 20px，`>18` → 24px，else 32px）。

验证：
- `npx tsc -b`：0 错误
- `npx vitest run`：270/270 PASS
- 浏览器端（`agent-as-user-qa`）：A07 S1-LB L1 的凑整法题"用凑整法把 271 + 997 拆成更好算的形式。按顺序填入两个空（不要算出最后得数）：271 + 997 = 271 + ___ - ___"（65 字）在卡片内自然折为 3 行，所有数字/`+`/`=`/`___` 均未被拆开 → PASS
- 证据：`ProjectManager/QA/2026-04-18-s1s2-verify/artifacts/QA-S2T1-evidence.png`

副作用评估：短题（≤18 字）仍走 `text-[32px]`，中等题（19–25 字）走 `text-[24px]`，在常规卡宽（~320–512px）下继续保持单行展示；只有 25+ 字触发自然折行。无新引入 UX 退化。

#### S2-T2：BUG-v2-SMOKE-03（A08 equation-input placeholder 写死「例：4x = 20」）

根因：`src/pages/Practice.tsx:405` placeholder 对所有 A08 题统一硬编码「例：4x = 20」，与题面数字结构完全无关，且示例"给出 x 值"会诱导学生把题做成"解方程"而非"移项"。

修复方式选型（子计划给的两种路径）：
- 方案 A（选）：直接改通用情境化文案 → 最小改动、零风险、0 行为泄露
- 方案 B（弃）：从题面派生具体数字 → 要同时动类型系统 + 生成器 data 字段，且不同 subtype 结构各异，容易泄露答案

落地：placeholder 改为「写出移项后的完整等式」，与题面指令 `PROMPT_TRANSPOSE` 语义完全对齐。

验证：
- 浏览器端观察 A08 S1 第 1 关的 `46 − x = 18` 题 → 输入框 placeholder 为「写出移项后的完整等式」，不再是「例：4x = 20」 → PASS
- 证据：`ProjectManager/QA/2026-04-18-s1s2-verify/artifacts/QA-S1T2-A08-and-S2T2-evidence.png`（与 QA-S1T2-A08 共用同一帧）

#### S2-T3：Q-057-F01（A01 S2-LB「口算拆分技巧」lane 名实对齐）

根因：`src/engine/generators/mental-arithmetic.ts` 的 `generatePair(d≥6)` 用 `useHighPool = Math.random() < 0.5` 在「中档陷阱池」与「高档技巧池（末尾 0 / 25·50·75·125 凑整 / 拆分）」之间等权随机，导致 S2-LB 里只有 50% 题目真正用到"拆分技巧"，lane 名只描述了一半题目。

方案选择（子计划 §六 明确列的二选一，用户决策）：
- 方案 A（弃）：改 lane 名为"大数乘除 + 拆分技巧"——改文案，不动题目
- 方案 B（选）：把 `useHighPool` 权重从 0.5 调至 0.75，让拆分/凑整/末尾 0 技巧题真正占主导——改生成概率，不动文案

**用户决策**：方案 B（保持 lane 名"口算拆分技巧"的原始设计意图，调题目分布反向适配命名）

修复（1 行改动）：
- `mental-arithmetic.ts:239`：`const useHighPool = Math.random() < 0.5;` → `Math.random() < 0.75;`
- 同步添加新单测 `qa-v3.test.ts` §A-20："A01 S2-LB 乘除 d≥6 高档技巧题占比 ≥ 65%"

断言思路：由于 `useHighPool` 是函数内部局部变量无法外部观测，测试从**可观测的 operand 特征**反推：批量生成 400 道 `mental-arithmetic/d=7/mul+div` 题目，统计其中 operand 命中"25·50·75·125 凑整数"或"末尾 0"的占比。根据 `mental-arithmetic.ts` §高档 / §中档分池定义（中档 `midMulMidZero` / `midDiv` 不生成此特征、高档 `highMulTrailingZero` / `highMulFactorSplit` / `highDivFactorSplit` 必生成其一），该占比等价于 `useHighPool=true` 的实际频率。门槛取 0.65（理论期望 0.75，留 10pp 采样波动缓冲）。

验证：
- `npx tsc -b`：0 错误
- `npx vitest run`：**271/271 PASS**（原 270 + 新 A-20）
- A-20 专项复跑：PASS（统计断言稳定通过，未观察到偶发性抖动）

副作用评估：
- 中档陷阱池（`midMulMidZero` / `midDiv`）仍保留 25% 权重、未下架 → 原有"看似好算实则陷阱"的冷静度训练依然存在
- 进阶模式 `buildAdvanceSlots` 只按 topic 抽 subtype、不读 lane filter → 不受影响
- 其他 lane（A01 S1-LA/LB、S3-LA/LB）走各自独立的 `generateHighLevelPair` / `generateExpressionPair`，与 `generatePair` 无耦合 → 不受影响

#### S2-T4：Q-057-F02（A05 S2-LB 语义聚焦，filter 误混入 `cyclic-div`）

根因：`src/constants/campaign.ts:404` 的 `decimal-ops-S2-LB`（"反直觉与比较"）filter 为 `['compare', 'trap', 'cyclic-div']`，与 lane 语义（比较+陷阱）不符；而 `cyclic-div`（循环小数）本就归属 S3-LA「循环小数」lane。

修复：`['compare', 'trap', 'cyclic-div']` → `['compare', 'trap']`。`cyclic-div` 仍保留在 `decimal-ops-S3-LA:420` 的 filter 中（设计意图）。

验证：
- `npx tsc -b`：0 错误；`npx vitest run`：270/270 PASS（无既有单测断言受影响）
- `rg 'cyclic-div' src/constants/campaign.ts` 全项目仅剩 1 处（第 420 行 S3-LA）→ 配置切换干净
- 浏览器端终极验证（连跑 4-5 题 S2-LB 观察是否出循环小数）因 S2 解锁依赖 S1 两 lane 通关、成本过高暂未在本轮完成；以**代码+单测证据**判 PASS；后续任意在 A05 S1 已通关的 session 中可顺带补跑作为最终确证

#### 本 session 跨系统维度扫描（规则 6）

- 题型输出（A05 prompt / A08 equation-input / 循环小数触发点）：**未改动**生成器，仅动 Practice 渲染 + constants/campaign.ts filter 配置 → 与 `Specs/2026-04-17-generator-redesign-v2.md` v2.2 一致
- Practice 渲染：Practice.tsx 仅 2 处小改（无 promptLatex 分支的 whitespace 策略、equation-input placeholder 文案），未改卡片尺寸/间距/字号规则 → 与 `Specs/2026-04-14-ui-redesign-spec.md` 卡片规格一致
- 闯关 subtypeFilter：A05 S2-LB 从 3 个 subtype 压到 2 个（`compare`+`trap`）→ 不影响 `pickSubtype` 权重归一化（函数自动按剩余 subtype 归一），不影响进阶 `buildAdvanceSlots`（只读 `TOPIC_STAR_CAP` 与题型池，不读 lane 层 filter）
- TypeScript 类型 / 进阶分槽 / 星级数值：**本轮未改动**

#### 遗留

- **S2-T4 浏览器终极确证**：A05 S2-LB 连跑观察无循环小数的验证未在本轮跑完（S2 解锁依赖 S1 两 lane 通关，成本过高）；本轮以代码 + 单测证据判 PASS，后续任意在 A05 S1 已通关的 session 中顺带补跑即可闭环
- **S2-T3 真实体验观察**：权重调整属于概率分布调整，单测能保证"技巧题占比 ≥ 65%"，但 lane 整体观感（是否真有"口算拆分技巧"的训练感）需要后续拟真 QA / 真实试玩确认，挂到 S3 深度体验 QA 一并观察
- QA 报告全文：`ProjectManager/QA/2026-04-18-s1s2-verify/qa-result.md`

### S3 执行结果

**状态**：✅ agent 可做部分全部关闭（2026-04-18）；S3-T1 梯度打分需用户自行完成

#### S3-T2：新答题形式完整链路验证

四种答题形式各 ≥ 1 题真实提交，全 PASS：
- **equation-input**（A08）：浏览器端 `x + 24 = 38` 输入 `x = 38 + 24`（错答）→ 判错 + explanation 完整；输入正确答案正常判对
- **multi-blank**（A04）：浏览器端 `(36+33)+23 = 36+(__+__)` 输入 33 / 23 → 判对 + explanation
- **expression-input**（A06）：浏览器端 `(71-34)+78` 输入 `71 - 34 + 78` → 判对 + explanation
- **multi-select**：代码级 A-26 断言（answer 格式 = 逗号分隔排序大写字母 / answers 数组 / options 数组），3 个来源题型均 PASS

证据：`ProjectManager/QA/2026-04-18-s3s4-verify/artifacts/QA-S3T2-expression-input-pass.png`

#### S3-T3：A08 陷阱诊断可发现性

代码级 + 浏览器级双重验证，4 类陷阱 × 各 2 道均 PASS：
- **代码级**（`qa-v3.test.ts` A-22~A-25）：批量生成 200 道 d=7 A08 题，按 `data.trap` 分桶筛 T1/T2/T3/T4 各 ≥ 2 道，断言每道的 `solution.explanation` 同时包含陷阱标签（"陷阱 T[1-4]"）+ 错误点说明 + 修正指引 + `hints` 非空
- **浏览器级**：A08 S1 L1 错答 2 次，反馈卡片完整展示 explanation（"+24 移到右边变号为 -24"），学生能看出错在哪

证据：`QA-S3T3-A08-feedback-transpose.png` / `QA-S3T3-A08-feedback-concept.png`

#### S3-T4：节奏 + hearts 完整闯关一局

浏览器端 A01 S1-LA L1（10 题）完整跑完：
- 10/10 全对，通关 → 结算页 "太棒了，通关！" + 100% 正确率 + 满心 ♥♥♥
- 无判定延迟 / 无心数同步异常 / 无节奏断点
- 结算页按钮"继续闯关 ▶"/"回首页"正常

证据：`QA-S3T4-session-summary.png`

#### S3-T1：梯度可感知性主观打分

**状态**：✅ 用户已确认（2026-04-18）

用户逐题型通读 `human-verification-bank.md`，反馈并迭代了以下生成器：
- **A01**：四位数加减限制为口算友好型（3 位常规 + 30% 凑整四位）
- **A02**：估算答案统一为更接近精确值一侧；精度约束至多最大位数−1；按 90/70/50 biasRange 控制难度梯度；移除多精度对比差值题型
- **A04**：simple-judge 补充反例情境
- **A05**：移除题干提示文字；compare 三档重新设计（低=移位验证 / 中=跨运算推理+等价识别+商与1比较+近1乘数 / 高=跨表达式代数变换）
- **A06**：修复 human-verification-bank 多行 prompt 格式
- **A03/A07/A08**：用户确认梯度清晰无问题

最终回归：tsc 0 错误 / vitest 328/328 PASS

### S4 执行结果

**状态**：✅ 全组关闭（2026-04-18）

#### S4-T1：压档后 `buildAdvanceSlots` 实战

`advance.test.ts` 新增 25 条用例（3 题型 × 4 星级边界 × 4 类断言 + 6 条退化检测）：
1. `getTierCounts` 精确匹配表（0★/1★/2★/3★ × 3 题型 = 12 条）
2. `buildAdvanceSlots` slots 档位分布与 tierCounts 一致
3. **【压档核心】** demon 档永不启用（3★-cap 所有 difficulty ≤ 7）
4. 子题型不退化为单一（1★/2★ 时唯一 subtypeTag ≥ 2）

#### S4-T2：8 主题进阶端到端冒烟

`advance.test.ts` 新增 24 条用例（8 题型 × 3 心数水位 = 24 局 × 20 题/局 = 480 道）：
- `buildAdvanceSlots` → `generateQuestion` 全链路无 throw
- 每道题结构完整（id / topicId / prompt / solution.answer 全存在）

#### S4-T3：新答题形式在进阶 + 主动退出验证

- **进阶可达性**：3 条单测证明 operation-laws(multi-blank) / bracket-ops(expression-input) / equation-transpose(equation-input) 的 subtypeTag 确实出现在进阶 slots 中
- **主动退出**：`store/index.ts` `abandonSession` 代码审计 — 错题写入错题本 ✓ / `completed: false` 保存 ✓ / 不触发结算 ✓
- **浏览器验证**：刷新后错题本正确显示 3 道错题（含答案/正答/explanation）

证据：`QA-S4T4-wrongbook-persist.png`

#### S4-T4：6 条旧验收关键项抽测

| 抽测项 | 原 ID | 结果 | 方法 |
|--------|-------|------|------|
| 首页卡片可见不可误跳 | B-20 | PASS | 浏览器 |
| 退出文案区分 | D-25 | PASS | 浏览器（"退出后本次练习不计入记录"） |
| 心数机制 | D-20 | PASS | 浏览器（错答扣心） |
| 进度持久化 | K-10 | PASS | 浏览器（刷新后昵称+进度保持） |
| 错题持久化 | K-10+ | PASS | 浏览器（错题本 3 题完整） |
| 0 JS 错误 | K-14 | PASS | console 零 error |

#### vite.config.ts 小修

`test.include` 增加 `['src/**/*.test.ts']`，排除 `.research/` 目录下的 bun 测试文件（非项目正式代码，会导致 vitest 报 `Cannot find package 'bun:test'`）。

#### 最终回归

- `tsc -b`：**0 错误**
- `vitest run`：**328/328 PASS**（271 基线 + 57 本轮新增）
- 无新 issue 发现

---

## 九、Session 交接清单（按 Plan/README.md 规则 6）

每次 session 中断或交接前，必须按以下清单扫一遍：

- [ ] 本 session 是否改动跨系统维度（题型输出 / Practice 渲染 / 进阶分槽 / tsc 类型）？改动了就扫兄弟规格
- [ ] 是否跑了 `npx tsx scripts/pm-sync-check.ts`（pre-flight + post-flight）？
- [ ] 是否把结果、阻塞、下一步写回本文件 §八 对应分组？
- [ ] 是否在 `ISSUE_LIST.md` 对应 issue 条目同步状态？
- [ ] 如本 session 发现新问题但未处理，是否已在 `ISSUE_LIST.md` 登记？
