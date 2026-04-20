# 全局文档同步机制设计（方案 6 初稿）

> 创建：2026-04-17
> 父计划：`2026-04-17-generator-redesign-v2-implementation.md` §6.1 复盘教训（改进 6）
> 设计规格：（本文件即规格草案，待评审后拆出正式 Spec）
> 状态：✅ L1+L2 完成（2026-04-17 session 收口，回溯召回 2/2）；L3 暂不启动，待 L1+L2 跑一段时间后再评估

---

## 一、背景

### 1.1 触发

2026-04-17 晚，v2.1 生成器改造二轮修订期间暴露了一个**流程漏洞**：

> A01 / A04 / A08 应为 2 档（由 `Specs/2026-04-15-gamification-phase2-advance-spec.md` 的 `TOPIC_STAR_CAP` 确定），但 v2.1 开工时**漏读此规格**，按 3 档设计，导致这三个题型反复在"三档梯度拉不开"上被用户指出问题。

当下的修补（r1-r5）是打补丁式的：

- 建立 `Specs/_index.md` 规格矩阵
- 在 `Plan/README.md` 加"开工前必扫兄弟规格"规则
- 在 Plan 模板里加"前置相关规格"栏和"跨系统维度清单"

但**这些补丁都依赖 agent 每次开工时"记得读"**。人一忘，漏检就会再发生一次。用户要求的是一个**结构性机制**——让文档在"设计/开发/计划"任何一处变动后，都能**被机制推着**同步到所有相关文档，而不是靠 agent 的自律。

### 1.2 本轮第一个检验用例

本次 v2.1 → v2.2 的修订是**正好一个现成的实战**：

- 起因：生成器代码结构改变（A04 完全重写、A01/A08 压 2 档等）
- 涉及的跨系统文档：
  - `Specs/2026-04-17-generator-redesign-v2.md` v2.1 → v2.2
  - `Specs/_index.md`（新建，要把改动反映到规格矩阵里）
  - `Plan/v0.1/2026-04-17-generator-redesign-v2-implementation.md`（加阶段 6）
  - `Plan/README.md`（模板 + 规则更新）
  - `ISSUE_LIST.md`（ISSUE-056 状态变更 + 新建 ISSUE-057）
  - `human-verification-bank.md`（重新生成）
- 实际同步情况：**本轮全部已手工同步**（r0-r5 + r12），但同步靠的是 agent 和用户在对话里反复来回确认。

这一过程暴露两个问题：

1. **没有自动校验**——哪些文档"应该"被同步是靠人记忆
2. **没有预警**——如果 agent 没想到要同步某处，不会有任何人/机制提醒

## 二、现状诊断

### 2.1 已有的治理手段

| 手段 | 强制性 | 局限 |
|------|------|------|
| `Plan/README.md` 维护规则（1-6 条）| 靠自觉 | 规则越多越没人看；session 切换后失忆 |
| `Specs/_index.md` 规格矩阵 | 靠自觉扫描 | 要求 agent 自己想"我改的维度属于哪些规格" |
| Plan 文件模板 | 开工时填一次 | session 中途修改后不会回头更新模板里的清单 |
| user rules 里的 planning workflow | 靠自觉 | 同上 |

### 2.2 根本问题

这些都是**文档式治理**（写进某个 .md 文件，期望下个 session 的 agent 会读到）。问题是：

1. **文档不会主动提醒**——agent 不主动去读就没用
2. **session 边界**——每个新 session 都要重新"找到"这些文档，失败率非零
3. **覆盖不全**——规格矩阵只能覆盖 Specs，Plan 间的交叉引用、ISSUE_LIST 的状态同步、生成脚本和代码之间的一致性全都靠人

### 2.3 我们想要的

一套**自动化 / 半自动化的"同步检查机制"**，使：

- 任何一类文档变动 → 机制能识别"这类变动涉及哪些关联文档"
- 如果关联文档没被同步 → 机制主动报警（而不是等用户下次 review 时发现）
- 日常开发不需要 agent 每次都主动"想"这件事，而是在工作流自然的断点处被推着执行

---

## 三、设计原则

借鉴 user rules 的"实事求是 / 抓主要矛盾"，本方案的设计基本盘：

1. **主要矛盾是"忘记同步"，不是"格式不规范"**
   → 优先设计检测与预警机制，而不是更复杂的模板/约定
2. **机制要嵌入 agent 的自然工作流断点**
   → 比如 session 结束时、commit 前、Plan 状态切换时
3. **分层设计**：
   - **L1 静态校验**（检索型）：扫描文档之间的引用一致性
   - **L2 工作流钩子**（流程型）：在 session 收尾/交接/开工时强制触发检查
   - **L3 变更溯源**（可选）：commit message / changelog 里关联规格 ID

---

## 四、机制设计

### 4.1 L1 静态校验：`pm-sync-check` 脚本

在 `math-quest/scripts/` 下新建一个 Node 脚本，能被手动运行 / CI 调用：

```bash
npx tsx scripts/pm-sync-check.ts
```

它检查以下**机械可验证的同步项**（不需要语义理解）：

| 检查项 | 覆盖文档 | 失败示例 |
|--------|---------|---------|
| Specs 版本号一致性 | `Specs/*.md` + `Plan/README.md` 引用表 + 引用它的 Plan 头部 | v2.1 升到 v2.2，但 `Plan/README.md` 表格里还写 v2.1 |
| ISSUE 状态一致性 | `ISSUE_LIST.md` + 引用 ISSUE-XXX 的 Plan | Plan 里说"ISSUE-056 已完成"但 `ISSUE_LIST.md` 里状态还是"进行中" |
| Plan 引用的 Specs 都存在 | `Plan/*.md` 头部"设计规格"字段 + `Specs/_index.md` | Plan 引用了一个不存在的 Spec 文件 |
| `Specs/_index.md` 完整性 | `Specs/*.md` + `Specs/_index.md` | 新 Spec 加进 Specs/ 但没加进 _index.md |
| `TOPIC_STAR_CAP`（及其他硬约束）一致性 | `src/constants/advance.ts`（TOPIC_STAR_CAP 权威定义）+ `scripts/generate-human-bank.ts`（tiers 档数）+ `Specs/*.md` 里所有提到 `TOPIC_STAR_CAP` 的地方 | 代码里改了值但规格没跟上 |
| human-bank 与生成器档位一致性 | `scripts/generate-human-bank.ts` + 生成器源文件 | 脚本里 A01 显示 3 档，但生成器只出 2 档 |

失败时输出一个清单，比如：

```
❌ SYNC-CHECK FAILED (3 issues):
  1. Specs/2026-04-17-generator-redesign-v2.md declares v2.2, but Plan/README.md references v2.1
  2. ISSUE-056 status mismatch: ISSUE_LIST.md says 🟡 but Plan says ✅
  3. src/constants/advance.ts TOPIC_STAR_CAP['equation-transpose'] = 3 → 生成器应出 2 档，但 scripts/generate-human-bank.ts 的 equation-transpose tiers 仍为 3 档
```

**不做**的事：

- 不尝试用 LLM 去"猜"是否语义一致（不可靠，保留给人审）
- 不阻塞 commit（仅作预警，是否阻塞由用户开关决定）

### 4.2 L2 工作流钩子：session 节点强制触发

在 agent 的工作流里嵌入两个强制触发点。**不依赖文档记忆**，而是让 agent 在这两个点**必须调用**（或用户必须确认）。

#### 钩子 A：**session 开工前 "pre-flight"**

触发条件：新 session / 新 Plan 开工前。

动作：
1. 自动运行 `pm-sync-check`，把当前不一致列表展示给 agent 和用户
2. 要求 agent 在 Plan 头部"前置相关规格"里**至少列出本次改动所属维度的所有同维度 Spec**（由 `_index.md` 机械查出）
3. 如果 agent 要启动的任务**涉及任何当前已不一致的文档**，必须先处理或显式降级（写在 Plan 里"我知道这里不一致，本次不动，因为 XXX"）

技术落地方式：可以做成一个"开工提醒 skill"或 `Plan/README.md` 里一段 agent 必须执行的脚本步骤。

#### 钩子 B：**session 收尾 "post-flight"**

触发条件：session 结束 / 交接 / 要求 agent 总结时。

动作：
1. 自动运行 `pm-sync-check`，如果有**本 session 新增**的不一致，必须当场处理
2. 要求 agent 按照 Plan 里的"跨系统维度清单"**逐项打钩**：
   - 本次改动是否影响了该维度？
   - 如果影响了，同维度的兄弟规格/Plan/ISSUE 是否都同步了？
3. 输出一个**本轮同步动作清单**，展示给用户确认

这一步是现有 `Plan/README.md` 第 6 条"session 续航交接清单"的**强化执行版**——把"靠自觉"改成"有 pm-sync-check 兜底 + 结构化输出清单"。

### 4.3 L3 变更溯源：commit / changelog 关联（可选）

如果 L1+L2 仍嫌不够结构化，进一步要求：

- 代码 commit message 里带规格引用标签，如 `[spec:v2.2/A04]`
- Specs 本身采用 SemVer（v2.2.0 → v2.3.0 / v2.2.1 等），每次变更有变更日志
- 做一个月度/季度的"同步审计报告"，扫所有 .md 生成差异表

**本方案的保守判断**：L3 对当前 1 人+1 agent 的规模偏重。先做 L1+L2，跑一段时间看 L3 是否真的有必要。

### 4.4 第四节复核（2026-04-17 本 session 开工前）

开工实施前再审一遍第四节，结论：

- **L1 + L2 的拆分仍合理**：L1 是"机械可验证 → 脚本兜底"，L2 是"流程断点 → 钩子触发"，二者互补。
- **L3 继续保持"可选"不做**：1 人 + 1 agent 的规模下，commit message 规范化的边际收益低于 L1+L2 的投入产出。
- **L1 六项检查的实施顺序**按价值密度重排为：
  1. `_index.md` 完整性（最机械、最高频、最容易漏）
  2. Specs 版本号一致性（本轮 v2.1→v2.2 正是此类漏）
  3. ISSUE 状态一致性（跨 Plan/ISSUE_LIST 最常见）
  4. Plan→Spec 引用存在性（防坏链）
  5. `TOPIC_STAR_CAP` 一致性（本轮漏检的根因，但实现稍复杂）
  6. human-bank 档位与 `TOPIC_STAR_CAP` 一致性（最专一的硬约束，附属于 5）

- **小修正（已回写本文件 §4.1）**：原表格把 `TOPIC_STAR_CAP` 权威来源写成 `src/data/campaign.ts`，实际定义在 `src/constants/advance.ts`（`campaign.ts` 只是关卡表数据）。本 session 实施按修正后执行。
- **降低 ISSUE 状态检查的期望**：Plan 内描述 ISSUE 状态的自然语言不统一（"已完成/✅/🟡/进行中/待排期"等），精确比对不现实。降级为**启发式检查**——仅检查 ISSUE 标识附近出现的状态关键词是否与 `ISSUE_LIST.md` 权威状态直接冲突（宁可漏报不误报）。

---

## 五、与现有规则的关系

| 现有规则 | 本方案如何承接 / 替代 |
|---------|-----------------|
| `Plan/README.md` 维护规则 1-4（2026-04-16 起）| 保留；本方案属于第 7、第 8 条（待加） |
| `Plan/README.md` 维护规则 5（开工前必扫 _index）| L2 钩子 A 自动执行 |
| `Plan/README.md` 维护规则 6（session 续航清单）| L2 钩子 B 自动执行 |
| Plan 文件模板的"前置相关规格" / "跨系统维度清单"栏 | 钩子 A 自动填充第一版；钩子 B 验证完整性 |
| user rules 的 planning workflow discipline | 保持；本方案是落地到项目工具层的实现 |

---

## 六、实施拆解

如果用户确认此方向，拆成独立子计划执行：

### 阶段 1：L1 静态校验原型

1. 调研 8 项检查项的机械可验证性（第 4.1 节的表）
2. 实现最小可用版本（先做 3-4 项最高价值的检查：Specs 版本、ISSUE 状态、_index 完整性）
3. 作为 `npm run pm:check` 集成进项目

**产出**：`scripts/pm-sync-check.ts` + `package.json` 脚本 + 一份 README

**工作量估算**：半天-1 天（取决于检查项的实现细节）

### 阶段 2：L2 工作流钩子

1. 在 `Plan/README.md` 加第 7、8 条：强制"开工前/收尾时跑 pm-sync-check"
2. 设计"开工前提示语"和"收尾清单"的标准文案
3. （可选）做一个 agent skill，把钩子封装成可调用的命令

**产出**：`Plan/README.md` 更新 + 可选 skill 文件

**工作量估算**：半天

### 阶段 3：用 v2.1 → v2.2 本轮改动做回溯验证（第一个检验用例）

1. 对 `2026-04-17-generator-redesign-v2-implementation.md` 阶段 6 已完成的同步工作，手工对照 pm-sync-check 的输出
2. 如果 pm-sync-check 漏掉了某些"本轮实际改动但未同步"的地方（假设有），补到检查清单里
3. 如果 pm-sync-check 误报了一些实际上不该同步的项（假设有），修掉规则

**产出**：一份回溯验证报告，说明 pm-sync-check 在本轮实战用例里的准确率

**工作量估算**：半天

### 阶段 3 执行结果（2026-04-17 回写）

**✅ 完成**。回溯报告：[`Reports/2026-04-17-pm-sync-check-retrospective.md`](../Reports/2026-04-17-pm-sync-check-retrospective.md)

**关键数字**：

| 指标 | 值 |
|------|----|
| 脚本首次扫描发现的不一致 | 3 错 1 警 |
| 其中真实漏同步 | 2（均为 v2.1→v2.2 时的版本号漂移） |
| 误报 | 1 错 1 警（已通过启发式规则修正，降到 0） |
| 调优后最终召回 | 2/2（100%） |
| 调优后最终精确率 | 100%（0 误报） |

**捕获的 2 条真实漏同步**（已在本 session 顺手修复）：

1. `Plan/v0.1/2026-04-17-generator-redesign-v2-implementation.md` 头部"设计规格"字段 v2.1 → v2.2；标题 + 状态一并收口
2. `Plan/v0.1/2026-04-16-open-backlog-consolidation.md:121` 子计划 2 扩展描述引用版本 v2.1 → v2.2

**两条启发式修正**（已写进 `scripts/pm-sync-check.ts` 注释）：

- spec-version 检查：同一行出现 ≥2 个不同 `vX.Y` 视为"对比/过渡"语境，跳过
- issue-status 检查：先剥掉行内圆括号（含中文括号）里的排除语境，再判状态

**脚本当前覆盖的 6 项检查**（对应 §4.1）：

1. `Specs/_index.md` 完整性（Specs 目录实际文件 ↔ _index 登记）
2. Specs 版本号一致性（Spec 头部版本 ↔ Plan/README + 引用方）
3. ISSUE 状态一致性（启发式；ISSUE_LIST 权威 ↔ Plan 单行描述）
4. Plan 引用的 Spec 存在性（头部"设计规格"字段 ↔ 实际文件）
5. TOPIC_STAR_CAP 一致性（`src/constants/advance.ts` ↔ `scripts/generate-human-bank.ts` tiers 档数）
6. human-bank tiers 档数 vs TOPIC_STAR_CAP 映射规则（CAP=3→2 档、CAP=5→3 档）

**已识别但暂不纳入 L1 的同步面**（见报告 §四）：

- Plan 中 ISSUE 状态的自然语言描述（表达形式太多样）
- `campaign.ts` 关卡分段 vs TOPIC_STAR_CAP 实际梯度数（需 TS AST 解析；已挂 ISSUE-057）
- 生成器实际产出档数 vs human-bank tiers（需真跑生成器，非静态可验证；由单元测试兜底）
- `Reports/*.md` 里对 Spec 版本号的引用（低风险，未来按需扩展）

**决策**：L1 + L2 已达到"可当班"标准，L3 暂不启动（见报告 §四）。本阶段收口。

### 阶段 4（可选）：L3 变更溯源

视阶段 3 的验证结果决定是否启动。如果 L1+L2 已能覆盖 ~90% 的漏同步，L3 可以延后。

---

## 七、风险与取舍

| 风险 | 应对 |
|------|------|
| 检查规则本身要维护（新加 Spec 要更新脚本）| 把规则放在数据文件里（如 `scripts/pm-sync-rules.json`），改规则不需要改代码 |
| 误报导致疲劳 | 先做严格的 3-4 项，宁可漏报也不误报；用户可白名单 |
| agent 忘记跑 pm-sync-check | L2 钩子要写进 agent 的**标准操作流程**，不是可选项；session 开工 prompt 里自动提示 |
| 本方案本身是一个"规则"，还是靠自觉 | 无法完全规避；但把靠自觉的粒度从"每次改动"降到"每个 session 至少跑一次脚本"已是大幅降权 |

---

## 八、决策回写（2026-04-17 session）

原草案的 4 条待决策在本 session 执行过程中均已落地，对齐事实如下：

| # | 原问题 | 实际决策 |
|---|-------|---------|
| 1 | 优先级：P0 立刻做，还是 P1 等 v2.2 稳定后？ | **P0 立刻做**，本 session 同步完成 L1+L2 实施与回溯验证 |
| 2 | 范围：先做 L1+L2，还是一并含 L3？ | **只做 L1+L2**；L3（commit 标签 / SemVer）按风险表评估在当前 1 人+1 agent 规模下投入产出不划算，保持挂起待观察期结束后再评估 |
| 3 | 谁来验证：用户人工对照，还是 agent 自跑+报告？ | **agent 自跑 + 回溯报告**，结论写进 `Reports/2026-04-17-pm-sync-check-retrospective.md`；用户审阅报告即可 |
| 4 | 和 ISSUE-057（campaign.ts 关卡重划）的先后 | **并行、互不阻塞**。本方案只动文档同步机制与脚本，不碰 `src/data/campaign.ts`；ISSUE-057 作为独立排期项保留 |

补加的一条新决策：

| # | 问题 | 实际决策 |
|---|------|---------|
| 5 | L2 钩子怎么防"agent 忘记跑"？ | A 档已落地：`.cursor/rules/pm-sync-check.mdc`（`alwaysApply:true`）把规则注入每个 session 的系统提示。B 档（Cursor Hooks 硬阻塞）暂不启动，观察 A 档跳过率再评估 |

---

## 九、本草案的元说明

- 本文件**本身就是一个跨系统维度的文档**（同时关联 `Plan/README.md`、`Specs/_index.md`、`user rules` 里的 planning workflow、所有 Plan 模板）
- 如果本方案被批准，它应该**用自己检验过一遍**：产出 L1 脚本后，拿它扫自己，看看本草案里的引用是否和目标文档一致
- 这个"自举验证"是方案健壮性的第一层保障

