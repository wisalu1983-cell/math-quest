# Phase 1 热修复 + 优化迭代计划

> **编写日期**：2026-04-14  
> **编写依据**：Phase 1 v2 全量测试报告（137 条用例）+ 用户新需求  
> **父计划**：`2026-04-13-gamification-phase1-foundation-campaign.md`  
> **状态**：✅ 全部完成（2026-04-14）

---

## 问题来源汇总

| 来源 | 问题数 | 说明 |
|------|--------|------|
| v2 测试报告 — 新发现缺陷 | 2 | BUG-NEW-1 初始进度未持久化、BUG-NEW-2 History 不可达 |
| v2 测试报告 — 已知缺陷确认 | 9 | G-06~G-14 题目路线不匹配（需架构修复） |
| v2 测试报告 — 用例文档修正 | 1 | B-03 关卡数预期值 4 处与代码不符 |
| 用户新需求 | 1 | 去掉年级区分，统一以上海五年级小升初标准为基准 |
| 既有 ISSUE_LIST P0 | 1 | ISSUE-003 A08 只有 2 选项 |
| 既有 ISSUE_LIST P1 | 4 | ISSUE-004~007 |

---

## 一、任务清单

### 第一批：快速热修复（1-2 小时）

解决所有不涉及架构改动的问题，可立即执行。

| # | 任务 | 来源 | 优先级 | 工作量 | 涉及文件 |
|---|------|------|--------|--------|---------|
| 1.1 | **去掉年级选择，简化注册流程** | 新需求 | P0 | 小 | 见下方详细说明 |
| 1.2 | **初始 GameProgress 持久化** | BUG-NEW-1 | P1 | 极小 | `store/gamification.ts` |
| 1.3 | **添加 History 页面入口** | BUG-NEW-2 | P1 | 小 | `pages/Progress.tsx` 或 `pages/Profile.tsx` |
| 1.4 | **A08 MC 选项从 2→4** | ISSUE-003 | P0 | 小 | `generators/equation-transpose.ts` |
| 1.5 | **修正测试用例文档 B-03** | 文档 | P2 | 极小 | `test-cases-v2.md` |
| 1.6 | **清理 Question 类型残留字段** | 代码质量 | P2 | 小 | `types/index.ts`（`timeLimit`、`xpBase`） |

#### 1.1 去掉年级选择 — 详细说明

**当前状态**：
- `Onboarding.tsx` step=2 让用户选 5 年级或 6 年级
- `User` 类型有 `grade: 5 | 6` 字段
- `grade` 仅在 `Profile.tsx` 展示，**不参与出题/难度/解锁任何逻辑**

**变更内容**：
1. `types/index.ts`：`User.grade` 字段改为 `grade?: number`（保留兼容旧数据，新用户不再写入）
2. `Onboarding.tsx`：**删除 step=2（年级选择）**，从 step=1（昵称）直接调用 `handleStart()`。注册流程简化为 2 步：欢迎→昵称→完成
3. `Profile.tsx`：年级显示区域改为固定文案 `"五年级 · 数学大冒险"` 或直接去掉年级行
4. `CLAUDE.md`：更新难度标准说明

**设计原则**：
> 所有题目难度以 **上海市五年级小学毕业生小升初** 的标准能力要求为「普通档」基准。  
> 当前 8 个题型（A01-A08）覆盖的就是沪教版五年级知识点，无需区分年级。

#### 1.2 初始 GameProgress 持久化

在 `gamification.ts` 的 `loadGameProgress` 末尾增加：
```typescript
repository.saveGameProgress(gp);
```

#### 1.3 添加 History 页面入口

在进度页（`Progress.tsx`）底部总体统计区域新增按钮：
```
"查看练习记录 →" → setPage('history')
```

---

### 第二批：题目路线匹配架构修复（核心，3-5 小时）

解决 G-06~G-14 共 9 项路线不匹配缺陷。这是 Phase 1 最大的系统性问题。

| # | 任务 | 工作量 | 涉及文件 |
|---|------|--------|---------|
| 2.1 | **设计 subtypeFilter 类型体系** | 小 | `types/gamification.ts` |
| 2.2 | **扩展 GeneratorParams 接口** | 小 | `engine/index.ts` |
| 2.3 | **为 44 条路线配置 subtypeFilter** | 中 | `constants/campaign.ts` |
| 2.4 | **8 个生成器增加过滤逻辑** | 大 | `generators/*.ts` × 8 |
| 2.5 | **调用层传递参数** | 小 | `store/index.ts` |
| 2.6 | **全题型出题验证** | 中 | 新增测试用例 |

#### 2.1 subtypeFilter 设计

为每个 topicId 定义其子题型枚举，然后在 `CampaignLane`（或 `CampaignLevel`）上挂一个可选的 `subtypeFilter` 字段：

```typescript
// types/gamification.ts 新增
export type SubtypeFilter = string[];  // 如 ['add', 'sub'] 或 ['estimate'] 或 ['distributive']

// CampaignLevel 扩展
export interface CampaignLevel {
  levelId: string;
  difficulty: number;
  questionCount: number;
  subtypeFilter?: SubtypeFilter;  // 新增：限定此关卡允许的子题型
}
```

#### 2.4 生成器改造原则

每个生成器内部已有子题型分发逻辑（通常是概率表）。改造方式：
1. 接收 `subtypeFilter` 参数
2. 若 `subtypeFilter` 存在，从概率表中**过滤掉不在列表中的子题型**
3. 在剩余子题型中**重新归一化概率**
4. 若过滤后为空，回退到全量随机（防御性编程）

#### 2.6 验证标准

对 G-06~G-14 涉及的 9 条路线，各生成 50 题，统计子题型分布：
- 专项路线（如"加减主路"）：目标子题型占比 ≥ 90%
- 综合/Boss 路线：保持混合分布

---

### 第三批：出题质量修复（2-3 小时）

解决 ISSUE_LIST 中的 P1 问题。

| # | 任务 | 来源 | 工作量 | 涉及文件 |
|---|------|------|--------|---------|
| 3.1 | **浮点精度修复** | ISSUE-004 | 小 | `generators/number-sense.ts` |
| 3.2 | **MC 干扰项质量提升** | ISSUE-005 | 中 | `generators/mental-arithmetic.ts` |
| 3.3 | **compareSize b=1 概率调低** | ISSUE-006 | 小 | `generators/decimal-ops.ts` + `number-sense.ts` |
| 3.4 | **删除死代码** | ISSUE-007 | 小 | `generators/multi-step.ts` |

---

### 第四批：难度标准文档化 + 校准确认（1-2 小时）

将"上海五年级小升初标准"落地为可执行的难度定义。

| # | 任务 | 工作量 |
|---|------|--------|
| 4.1 | **编写难度基准文档**：明确 difficulty 1-10 各档对应的上海五年级知识点范围和计算复杂度 | 中 |
| 4.2 | **校准现有 campaign 关卡 difficulty 值**：对照基准文档，检查 44 条路线的 difficulty 是否合理 | 中 |
| 4.3 | **更新 constants/index.ts 的 DIFFICULTY_TIERS**：当前 3 档名称「普通/困难/魔王」是否需要调整 | 小 |

#### 4.1 难度基准定义（草案）

| Difficulty | 对标水平 | 举例 |
|-----------|---------|------|
| 1-3 | 四年级下～五年级上基础 | 两位数加减、一位乘法、基础小数 |
| **4-5** | **五年级毕业标准（小升初普通题）** | 多步混合运算、小数四则、简便计算、一步方程 |
| 6-7 | 小升初提高题 | 复杂运算律应用、多步方程、竖式高难度 |
| 8-10 | 竞赛/超纲 | 多层嵌套、特殊技巧、极端数值 |

> **核心原则**：difficulty=5 就是一个上海五年级毕业生在正常考试中应该能做对的题。

---

## 二、执行顺序与依赖关系

```
第一批（热修复） ──→ 第二批（路线匹配） ──→ 第三批（出题质量）
      │                                            │
      └────→ 第四批（难度文档） ←────────────────────┘
```

- 第一批无依赖，可立即开始
- 第二批依赖 2.1 的类型设计完成后才能开始 2.3-2.5
- 第三批与第二批可并行（不同文件）
- 第四批建议在二、三批之后做，因为需要基于修复后的出题效果来校准

---

## 三、完成标准

| 批次 | 验收标准 |
|------|---------|
| 第一批 | `npm run build` 通过 + 浏览器手工验证注册流程（2步）、History入口、A08 4选项 |
| 第二批 | G-06~G-14 全量重测 PASS（每路线 50 题统计子题型分布 ≥ 90% 匹配） |
| 第三批 | ISSUE-004~007 对应测试通过 |
| 第四批 | 难度基准文档评审通过 + campaign difficulty 校准记录 |

---

## 四、对项目文档的影响

完成后需同步更新：
- `ProjectManager/Overview.md`：Phase 1 状态从"CR+QA 验收通过"改为"热修复+优化完成"
- `ProjectManager/ISSUE_LIST.md`：ISSUE-003~007 标记完成，新增 ISSUE-011（路线匹配，第二批关闭）、ISSUE-012（History入口，第一批关闭）
- `ProjectManager/Plan/README.md`：添加本计划索引
- `CLAUDE.md`：更新架构说明（移除年级、新增 subtypeFilter）、更新难度标准
- `test-cases-v2.md`：修正 B-03 数据，更新 A-01~A-06 去掉年级步骤
