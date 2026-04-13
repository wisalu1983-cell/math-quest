# Math Quest 测试报告 - Bug 与优化清单

> 测试日期: 2026-04-07 | 测试方式: Playwright 自动化 + 代码审查 | 测试范围: 全功能回归

---

## 一、测试执行概况

| 指标 | 数据 |
|------|------|
| 自动化测试用例 | 28 组（覆盖 TC-01 ~ TC-28） |
| 执行结果 | ✅ 55 PASS / ❌ 3 FAIL(已修复选择器后全部通过) / ⚠️ 6 WARN |
| 控制台错误 | 0 |
| 覆盖主题 | 口算速算、运算律、竖式笔算（自动化）+ 其余主题（代码审查） |
| 覆盖页面 | Onboarding → Home → TopicSelect → Practice → Summary → Progress → History → SessionDetail → WrongBook → Profile（全部10个页面） |

---

## 二、Bug 清单

### BUG-01: 口算速算等大部分题型无倒计时限制 [中]

**现象**: 口算速算（mental-arithmetic）练习时，页面不显示倒计时条，用户可以无限时间作答。  
**原因**: 只有"数感估算"(number-sense) 生成器设置了 `timeLimit`（20s/15s/10s），其余 7 个题型生成器均未设置。  
**影响**: 
- "口算**速**算"名不副实，失去速度训练意义
- Practice.tsx 中 `timeFraction` 在无 timeLimit 时默认为 0.5，导致速度奖励计算不准确
- "闪电速答"(lightning) 和"极速达人"(speed-demon) 成就几乎无法触发  
**文件**: [mental-arithmetic.ts](src/engine/generators/mental-arithmetic.ts), [decimal-ops.ts](src/engine/generators/decimal-ops.ts), [multi-step.ts](src/engine/generators/multi-step.ts) 等  
**建议**: 为每个题型按难度设置合理的 timeLimit（如口算: 15s/10s/8s）

---

### BUG-02: 成就 "first-correct" 首次答对后未显示解锁提示 [低]

**现象**: 完成首次练习（9/10 正确）后，SessionSummary 页面未出现"🎖️ 新成就解锁！"区域。  
**分析**: 代码逻辑上 `endSession()` 在 `updateTopicStats()` 后调用 `checkAchievements()`，时序正确。可能原因：
1. 成就 ID 或 condition 匹配问题
2. `markAchievementSeen` 的 useEffect 竞态导致渲染前就标记为已读  
**文件**: [store/index.ts](src/store/index.ts) `checkAchievements()` 和 [SessionSummary.tsx](src/pages/SessionSummary.tsx)  
**建议**: 排查 checkAchievements 中 'first-correct' 的 condition 类型和阈值匹配

---

### BUG-03: localStorage 无错误处理 [低]

**现象**: `saveProgress()` 和 `saveSession()` 直接调用 `localStorage.setItem()`，无 try-catch。  
**风险**: 当 localStorage 配额耗尽时（通常 5-10MB），数据写入将静默失败，用户练习成绩丢失且无提示。  
**文件**: [repository/local.ts](src/repository/local.ts)  
**建议**: 添加 try-catch 并在写入失败时提示用户

---

### BUG-04: XP 速度奖励在无计时器题型中计算不一致 [低]

**现象**: `submitAnswer()` 中计算 `timeFraction = timeMs / (currentQuestion.timeLimit || timeMs * 2)`，当 timeLimit 为 undefined 时，`timeFraction` 恒为 0.5，永远不会触发速度奖励（< 0.3）。  
**影响**: 只有数感估算题可以获得 25% 速度奖励，其他题型不行。  
**文件**: [store/index.ts](src/store/index.ts) `submitAnswer()`  
**建议**: 统一设置 timeLimit 或修改速度奖励逻辑

---

## 三、UI/UX 优化建议

### OPT-01: 正确答案反馈信息过于单薄 [推荐]

**现象**: 答对时仅显示"🎉 正确！" + "下一题"按钮，没有展示：
- 用户的答案是什么
- 本题获得的 XP（虽然有浮动动画但很快消失）
- 解题思路/知识点  

**对比**: 答错时会展示正确答案 + 解析，信息丰富。  
**建议**: 正确时也显示答案确认和简要知识点，增强学习效果。

---

### OPT-02: 进度计数器 "0/10" 显示不直觉 [建议]

**现象**: 进入练习页后，进度条显示"0/10"。从用户角度看，正在做第1题，但显示0。  
**原因**: `currentIndex` 从 0 开始，在答题前显示。  
**建议**: 显示改为 `${currentIndex + 1}/${totalQuestions}` 或者 "第1题/共10题"

---

### OPT-03: 竖式笔算缺少位值标注 [建议]

**现象**: 竖式网格上方没有标注"个位、十位、百位"等位值提示，学生可能对格子对应的位值感到困惑。  
**建议**: 在结果行下方或上方添加位值标签（个/十/百/千）

---

### OPT-04: 运算律题型混合使用选择题和数字输入 [可选]

**现象**: 运算律根据子类型（交换律/结合律/分配律）分别使用选择题和数字输入，体验不一致。  
**分析**: 交换律用选择题（选择等价表达式），结合律/分配律用数字输入（计算结果）。  
**建议**: 考虑统一为选择题格式（选择简便计算过程），或在题目中明确提示不同的交互方式。

---

### OPT-05: Summary 页面信息密度高，建议分层 [建议]

**现象**: SessionSummary 在一个长页面中依次展示：表情+统计卡片+等级进度+成就+全部题目详情，滚动量大。  
**建议**: 
- 题目详情默认折叠，只展示错题
- 或分 Tab 展示"概览"和"详情"

---

### OPT-06: 首页每日目标环形进度过小 [建议]

**现象**: 每日目标的 SVG 圆环只有 32×32px (w-8 h-8)，中间的 XP 数字在手机上几乎看不清。  
**建议**: 增大到 48×48 或 64×64，或在下方增加文字说明。

---

### OPT-07: 错题本无"重新练习"功能 [推荐]

**现象**: 错题本展示了错题信息，但没有提供"针对错题重新练习"的入口。  
**建议**: 添加"错题复练"按钮，基于 wrongQuestions 生成专项练习。

---

### OPT-08: 练习中途退出无确认提示 [建议]

**现象**: 点击 ✕ 按钮直接退出练习进入 Summary，无二次确认。  
**风险**: 误触导致当前练习被中断。  
**建议**: 添加"确定退出吗？进度将被保存"的确认弹窗。

---

### OPT-09: 方程移项主题为空壳 [信息]

**现象**: "方程移项"(equation-transpose) 生成器为 stub，返回固定题目 "x + 3 = 7"。  
**影响**: 用户可选择该主题但所有题目完全相同。  
**建议**: 完善生成器或暂时在首页隐藏该主题。

---

### OPT-10: 键盘操作体验优化 [可选]

**现象**: 
- 数字输入题的 Enter 键提交在竖式题中被正确屏蔽
- 但在选择题中，选中选项后按 Enter 可能需要额外的焦点管理  
**建议**: 确保所有题型的键盘快捷键一致（Enter=确认, 1-4=选择选项）

---

## 四、性能与安全

| 项目 | 状态 | 说明 |
|------|------|------|
| 控制台错误 | ✅ 无 | 全流程无 JS 错误 |
| 页面加载 | ✅ 正常 | Vite HMR 响应迅速 |
| 构建产物大小 | ✅ 合理 | JS ~382KB, CSS ~29KB (gzip ~124KB) |
| 响应式布局 | ✅ 通过 | PC/iPad/Mobile 三种分辨率测试通过 |
| 数据持久化 | ✅ 基本正常 | 刷新后数据保持，但无错误处理（BUG-03） |
| XSS 风险 | ✅ 低 | React 自动转义，无 dangerouslySetInnerHTML |
| 依赖安全 | ⚠️ 1 high | `npm audit` 报告 1 个高危漏洞，需关注 |

---

## 五、优先级汇总

| 优先级 | 编号 | 描述 |
|--------|------|------|
| **P0 - 必修** | BUG-01 | 为口算速算等题型添加 timeLimit |
| **P1 - 重要** | OPT-01 | 正确答案反馈增强 |
| **P1 - 重要** | OPT-07 | 错题本添加重练功能 |
| **P1 - 重要** | OPT-09 | 方程移项完善或隐藏 |
| **P2 - 改进** | BUG-02 | 排查首次答题成就未触发 |
| **P2 - 改进** | BUG-04 | 统一速度奖励计算 |
| **P2 - 改进** | OPT-02 | 进度计数器从1开始 |
| **P2 - 改进** | OPT-05 | Summary 页面折叠优化 |
| **P2 - 改进** | OPT-08 | 退出确认弹窗 |
| **P3 - 锦上添花** | BUG-03 | localStorage 错误处理 |
| **P3 - 锦上添花** | OPT-03 | 竖式位值标注 |
| **P3 - 锦上添花** | OPT-04 | 运算律题型统一 |
| **P3 - 锦上添花** | OPT-06 | 每日目标环放大 |
| **P3 - 锦上添花** | OPT-10 | 键盘操作优化 |

---

## 六、测试截图索引

| 截图 | 描述 |
|------|------|
| 01_tc01_welcome.png | 欢迎页面 |
| 02_tc01_nickname.png | 昵称输入 |
| 03_tc01_grade.png | 年级选择 |
| 04_tc01_home_after.png | 注册后首页 |
| 102_tc03_topic_select_fixed.png | 难度选择页（口算速算） |
| 103_tc04_practice_start.png | 练习开始（第1题） |
| 104_tc04_q1_correct.png | 答对反馈 |
| 105_tc04_q7_wrong.png | 答错反馈（37+18=55） |
| 107_tc10_summary.png | 结果页（90% / +282 XP / 6连击） |
| 109_tc15_wrongbook.png | 错题本（显示1道错题） |
| 113_tc19_vertical_calc.png | 竖式笔算（526+815） |
| 112_tc20_operation_laws.png | 运算律（数字输入型） |
| 16_tc27_mobile.png | 手机端布局 |
| 17_tc27_ipad.png | iPad布局 |

---

*报告由 Playwright 自动化测试 + 人工代码审查生成*
