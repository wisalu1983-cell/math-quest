# 真题库提取设计：A01-A08 主题精选真题

> **日期**: 2026-04-08
> **目标**: 从 4MB+ 原始试卷素材中，提取 280 道精选真题到 A01-A08 主题目录
> **方法**: Claude 自动提取 + 人工抽样审核，逐主题串行处理

---

## 1. 范围与目标

### 1.1 本次范围

提取 A01-A08 共 8 个已有生成器的主题，目标 280 道题：

| 主题 | TopicId | 目标题数 | foundation | advanced |
|------|---------|---------|-----------|---------|
| A01 整数口算与速算 | `mental-arithmetic` | 30 | ~18 | ~12 |
| A02 数感与估算 | `number-sense` | 25 | ~15 | ~10 |
| A03 竖式笔算 | `vertical-calc` | 35 | ~20 | ~15 |
| A04 运算律 | `operation-laws` | 35 | ~20 | ~15 |
| A05 小数运算 | `decimal-ops` | 45 | ~25 | ~20 |
| A06 括号变换 | `bracket-ops` | 30 | ~18 | ~12 |
| A07 多步混合运算 | `multi-step` | 30 (已有15) | ~16 | ~14 |
| A08 方程与等式 | `equation-transpose` | 35 | ~20 | ~15 |

### 1.2 不含范围

- A09 分数运算, B01-B02 几何, C01-C02 应用题, D01 统计（待建主题，后续批次）
- 纯文字概念题、需要图片的题目、应用题/文字题

---

## 2. 素材源

### 2.1 素材策略

**主力**：`题库-五年级上/` + `题库-五年级下/`（试卷练习，4.6MB）
**补充**：`sources/scraped/` 中的教案学案文件（按需查阅，用于补充解题步骤）

### 2.2 主题 → 素材映射（经实际扫描验证）

| 主题 | 首选素材（高产出） | 次选素材（补充） |
|------|-------------------|-----------------|
| A01 整数口算 | 下U1(多), 下U2(多) | 上U6(中), 未分类(中) |
| A02 数感估算 | 上U2(多), 上U1(中) | 上U6(中), 下U1(中) |
| A03 竖式笔算 | 上U2(多) | 上U1(中), 上U6(中), 下U1(中) |
| A04 运算律 | 上U2(多), 下U1(多) | 上U1(中), 上U6(中), 未分类(多) |
| A05 小数运算 | 上U2(多, 1.5MB主力) | 上U1(多), 上U6(多), 下U1(多) |
| A06 括号变换 | 下U1(中), 上U2(中) | 上U6(少), 下综合(中) |
| A07 多步混合 | 上U2(多), 下U1(多) | 上U1(中), 上U6(多), 下U2(多) |
| A08 方程等式 | 上U4(多), 下U3(多) | 下U1(多), 下综合(多), 未分类(多) |

### 2.3 可跳过的素材文件

以下文件对 A01-A08 几乎无贡献：
- 上U3-统计 (159KB) — 纯统计/平均数
- 上U5-几何小实践 (305KB) — 纯几何面积
- 下U4-几何小实践 (207KB) — 纯几何体积
- 下U5-可能性 (186KB) — 纯概率
- 下U6-总复习 (71KB) — 太小且杂

---

## 3. 单题提取流程

```
原始素材文本
  ↓ 识别候选题
  ↓ 分类（主题 + 难度）
  ↓ 格式化（CONTRIBUTING.md 规范）
  ↓ 填写生成器参照
  ↓ 验算答案
  ↓ 去重检查
  ↓ 写入 foundation.md / advanced.md
```

### 3.1 候选题识别标准

**选入**：
- 独立的计算题（有明确的数学表达式和数值答案）
- 计算类填空题（如"直接写得数"）
- 计算类选择题（选出正确答案/等价变换）
- 计算类判断题（判断等式/计算是否正确）

**排除**：
- 纯文字概念填空（"小数的性质是..."）
- 需要图片的题目（HYPERLINK 引用、几何图形描述不清）
- 应用题/文字题（属于 C01-C02 范畴）
- 统计/概率题（属于 D01 范畴）
- 几何面积/体积题（属于 B01-B02 范畴）

### 3.2 难度分级依据

**Foundation (1-5)**：
- 教材课本例题和课后练习水平
- 单一知识点、常规数值
- 学生应当全部掌握的核心内容

**Advanced (6-10)**：
- 期末考试中等偏难题、竞赛基础题
- 至少含一个进阶要素：多步骤、非常规数值、易错陷阱、多知识点交叉

### 3.3 生成器参照填写

对应 8 个生成器的完整子函数清单：

**A01 `mental-arithmetic`**: `generateMentalArithmetic`
**A02 `number-sense`**: `generateEstimate`, `generateRound`
**A03 `vertical-calc`**: `generateAdditionSteps`, `generateSubtractionSteps`, `generateMultiplicationSteps`, `generateMultiDigitMult`, `generateDivision`
**A04 `operation-laws`**: `generateCommutative`, `generateAssociative`, `generateDistributive`
**A05 `decimal-ops`**: `generateNormalAddSub`, `generateNormalMulInt`, `generateNormalDivInt`, `generateHardMulDecimal`, `generateHardDivDecimal`, `generateHardMixedAddSub`, `generateHardShift`, `generateHardTrap`, `generateDemonMulDecimal`, `generateDemonDivDecimal`
**A06 `bracket-ops`**: `generateRemoveBracketPlus`, `generateRemoveBracketMinus`, `generateAddBracket`, `generateNestedBracket`
**A07 `multi-step`**: `generateTwoStep`, `generateThreeStep`, `generateDecimalTwoStep`, `generateDecimalMultiStep`, `generateDecimalChain`, `generateReduceSubtract`, `generateDistributeRound`, `generateNearRound`, `generateBracketNormal`, `generateTrapAddBracket`, `generateTrapExpandPlus`, `generateTrapExpandMinus`, `generateSimplifySubtract`, `generateExtractFactor`, `generateBracketHard`, `generateTrapDistributeMissed`, `generateTrapDivisionDistribute`, `generateBracketDemon`
**A08 `equation-transpose`**: `generateMoveConstant`, `generateMoveFromLinear`, `generateMoveBothSides`, `generateSolveAfterTranspose`

填写规则：
- 能映射到具体子函数的：写函数名 + 参数模式 + 差异说明
- 不能映射到任何子函数的：标注"与生成器差异: 生成器缺少此题型，建议新增 XXX 子函数"

### 3.4 去重规则

- 同一计算式（数值和运算符完全相同）只录入一次
- 结构相同但数值不同的题目（如都是"两位数×一位数"），保留 2-3 道有代表性的
- 优先保留有明确来源标注的版本

---

## 4. 执行计划

### 4.1 处理顺序（按素材丰富度排序）

| 批次 | 主题 | 目标题数 | 首选素材 | 检查点 |
|------|------|---------|----------|--------|
| 1 | A05 小数运算 | 45 | 上U2 | 完成后暂停审核 |
| 2 | A07 多步混合 | 30 | 上U2 + 下U1 | 完成后暂停审核 |
| 3 | A04 运算律 | 35 | 上U2 + 下U1 | 完成后暂停审核 |
| 4 | A03 竖式笔算 | 35 | 上U2 | 完成后暂停审核 |
| 5 | A08 方程等式 | 35 | 上U4 + 下U3 | 完成后暂停审核 |
| 6 | A01 整数口算 | 30 | 下U1 + 下U2 | 完成后暂停审核 |
| 7 | A02 数感估算 | 25 | 上U2 + 上U1 | 完成后暂停审核 |
| 8 | A06 括号变换 | 30 | 下U1 + 上U2 | 完成后暂停审核 |

### 4.2 每批次工作流

1. 读取该主题的首选素材文件
2. 从素材中识别并提取候选题
3. 按 CONTRIBUTING.md 格式录入
4. 填写生成器参照（对照子函数清单）
5. 验算所有答案
6. 去重检查
7. 写入 `foundation.md` 和 `advanced.md`
8. **暂停** — 等待用户抽检 3-5 题

### 4.3 审核检查清单

每批次暂停时，用户可检查：
- [ ] 题号格式正确（Q-A05-F-001）
- [ ] 答案已验算正确
- [ ] 解题步骤完整清晰
- [ ] 来源已标注
- [ ] 生成器参照精确到子函数
- [ ] foundation 题确实是基础水平
- [ ] advanced 题确实含进阶要素
- [ ] 无重复题目

---

## 5. 质量标准

| 维度 | 标准 |
|------|------|
| 答案正确性 | 100% — 每道题必须验算 |
| 格式规范 | 严格遵循 CONTRIBUTING.md |
| 生成器参照 | 精确到子函数名，不能只写 TopicId |
| 去重 | 同一计算式不重复；结构相同的保留 2-3 道 |
| 代表性 | 优先高频考点和典型题型 |
| 难度均衡 | foundation:advanced ≈ 60:40 |
| 来源追溯 | 每题标注出自哪个素材文件 |

---

## 6. 产出物

- 16 个更新的 Markdown 文件（8 主题 × 2 难度）
- 更新 `README.md` 的统计概览表
- 更新 `CHANGELOG.md`
