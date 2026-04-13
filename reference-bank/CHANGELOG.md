# 真题库变更日志

## 2026-04-09 (真题提取完成)

### 真题提取：A01-A08 全部完成

- A01 基础计算: 36题 (F21 + A15)
- A02 数感与估算: 27题 (F15 + A12)
- A03 竖式笔算: 38题 (F22 + A16)
- A04 运算律: 35题 (F20 + A15)
- A05 小数运算: 60题 (F30 + A30)
- A06 括号变换: 31题 (F18 + A13)
- A07 简便计算: 45题 (F24 + A21)
- A08 方程与等式: 40题 (F23 + A17)
- 总计: 312题

### P0-P3 新增子函数覆盖

本次提取确保覆盖了 P0-P3 新增的 15 个子函数：
- A01: generateOperationOrder (运算顺序)
- A02: generateCompare, generateFloorCeil, generateReverseRound
- A03: generateDecimalAddSub, generateDecimalMul, generateDecimalDiv, generateApproximate
- A04: generateLawIdentification
- A05: generateCompareSize, generateCyclicDivision
- A06: generateDivisionProperty
- A08: generateBracketEquation, generateDivisionEquation, generateEquationConcept

### 素材覆盖缺口
- A05 循环小数: 从教案素材中补充了 3 道参考题
- A08 含括号方程: 从方程章节素材中找到并提取了 8 道覆盖题

---

## 2026-04-08 (阶段 1)

### 真题提取：A01-A08

从原始试卷素材（4.6MB，634 份试卷）中提取精选真题，逐主题串行处理。

- A01 整数口算与速算: 30 题 (foundation 18 + advanced 12)
- A02 数感与估算: 25 题 (foundation 15 + advanced 10)
- A03 竖式笔算: 35 题 (foundation 20 + advanced 15)
- A04 运算律: 35 题 (foundation 20 + advanced 15)
- A05 小数运算: 45 题 (foundation 25 + advanced 20)
- A06 括号变换: 30 题 (foundation 18 + advanced 12)
- A07 多步混合运算: 45 题 (从 15 题种子扩充，foundation 24 + advanced 21)
- A08 方程与等式: 35 题 (foundation 20 + advanced 15)
- 总计: 280 题 (foundation 160 + advanced 120)，占总目标 525 题的 53%

### 统计
- 素材扫描: 10 个文件，约 4MB
- 生成器子函数覆盖: 全部 8 个生成器的所有子函数均已有映射真题
- 发现的生成器盲区:
  - A05: 循环小数除法、大小比较判断题
  - A07: 隐藏公因数（需小数点变换才能识别）
  - A08: 含括号方程、除法型方程、概念判断题
  - A02: 近似数逆向推理、四舍五入与去尾法对比

---

## 2026-04-08

### 初始化
- 创建 reference-bank/ 目录结构（4 领域 × 14 主题 × 2 难度档 = 28 文件）
- 编写 README.md（题库总览）
- 编写 CONTRIBUTING.md（录入规范）
- 保存沪教版一至五年级共10册完整课程目录 + 六年级参考（curriculum/all-grades.md）
- 保存沪教版五年级上下册详细目录并标注主题映射（curriculum/grade5-upper.md, grade5-lower.md）
- 建立 21cnjy.com 资源索引（sources/21cnjy-index.md）
- 汇总 20+ 个真题资源来源（sources/exam-sources.md），含免费和付费分类
- 录入 A07 multi-step 种子题 15 题（foundation 8 题 + advanced 7 题），来源为代码中已有真题注释
- 更新 CLAUDE.md 架构说明
- 发现关键信息：沪教版五四制六年级已属初中，小学毕业考范围为一至五年级

### 阶段 0 交付统计
- 文件总数: 36 个 Markdown 文件
- 题目模板: 28 个（14 主题 × 2 难度）
- 种子题目: 15 题（A07 多步混合运算）
- 课程目录: 12 册（一至六年级上下册）
- 资源来源: 20+ 个网站/平台
