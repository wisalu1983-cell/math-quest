# 闯关 + 进阶模式稳定化（子计划 2.5）

> 创建：2026-04-17  
> 父计划：[`Plan/2026-04-16-open-backlog-consolidation.md`](2026-04-16-open-backlog-consolidation.md)（当前阶段主计划）  
> 父任务：原 §四 子计划 2 收尾 + 原 §四 子计划 1 在 v2.2 后的延伸验收  
> 设计规格：多份，详见下方"前置相关规格"  
> 状态：🟡 进行中

---

## 一、背景

### 前置相关规格（开工前必读）

> 📑 规格索引：[`ProjectManager/Specs/_index.md`](../Specs/_index.md)

| 规格 | 本计划从中继承的硬约束 |
|------|--------------------|
| [`Specs/2026-04-17-generator-redesign-v2.md`](../Specs/2026-04-17-generator-redesign-v2.md) v2.2 | 8 题型档位分布、答题形式、陷阱策略；A01/A04/A08 压 2 档 |
| [`Specs/2026-04-15-gamification-phase2-advance-spec.md`](../Specs/2026-04-15-gamification-phase2-advance-spec.md) | `TOPIC_STAR_CAP`——A01/A04/A08 仅 2 梯度（3★），其余 3 梯度（5★）；进阶 20 题 SWOR 选子题型 |
| [`Specs/2026-04-13-star-rank-numerical-design.md`](../Specs/2026-04-13-star-rank-numerical-design.md) | 星级体系、心数门槛 |
| [`Specs/2026-04-16-generator-difficulty-tiering-spec.md`](../Specs/2026-04-16-generator-difficulty-tiering-spec.md) | 三档难度认知定义（基础/提高/挑战）|
| [`Specs/2026-04-14-ui-redesign-spec.md`](../Specs/2026-04-14-ui-redesign-spec.md) | Practice 页卡片渲染的尺寸/字号约束 |

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

v2.2 生成器系统性重写（[`Plan/2026-04-17-generator-redesign-v2-implementation.md`](2026-04-17-generator-redesign-v2-implementation.md)）在 2026-04-17 收口，阶段 1-6 全部完成。收口时通过两轮 QA 暴露出若干遗留：

1. **`ISSUE-058`**：v2.2 生成器新增的 subtype 字面量 / data 字段没同步进 `src/types/`，`tsc -b` 报 24 个类型错误，`npm run build` 生产构建无法产出部署包。
2. **冒烟 smoke-report 遗留**（`Plan/2026-04-17-generator-redesign-v2-implementation.md` §阶段 5）：
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
| S1-T2 | 修 `BUG-v2-SMOKE-02`：A05 分数题指令丢失 | `Plan/2026-04-17-generator-redesign-v2-implementation.md` §阶段 5 | `src/pages/Practice.tsx:229-235`（有 promptLatex 时仍需渲染 prompt 文本）| 进入 A05 低档"分数↔小数互换"题，能看到完整指令 + 分数渲染；回归 v2.2 smoke artifacts 截图对比 |

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
2. [x] 本文件 — 创建
3. [x] 父主计划 `Plan/2026-04-16-open-backlog-consolidation.md` §七 — 已加子计划入口
4. [ ] `ISSUE_LIST.md` — 每个 S1/S2 事项完成时回写对应 ISSUE 状态；如新增问题则开 ISSUE-059+
5. [ ] `Overview.md` — 收口时在"当前进展"补一行"v2.2 稳定化收口 ✅"

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

（未开始）

### S3 执行结果

（未开始）

### S4 执行结果

（未开始）

---

## 九、Session 交接清单（按 Plan/README.md 规则 6）

每次 session 中断或交接前，必须按以下清单扫一遍：

- [ ] 本 session 是否改动跨系统维度（题型输出 / Practice 渲染 / 进阶分槽 / tsc 类型）？改动了就扫兄弟规格
- [ ] 是否跑了 `npx tsx scripts/pm-sync-check.ts`（pre-flight + post-flight）？
- [ ] 是否把结果、阻塞、下一步写回本文件 §八 对应分组？
- [ ] 是否在 `ISSUE_LIST.md` 对应 issue 条目同步状态？
- [ ] 如本 session 发现新问题但未处理，是否已在 `ISSUE_LIST.md` 登记？
