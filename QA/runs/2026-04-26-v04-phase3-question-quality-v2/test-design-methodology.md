# v0.4 Phase 3 专业测试设计方法

**执行日期**: 2026-04-26
**适用范围**: v0.4 Phase 3 题目质量与生成器诊断
**结论**: 本轮采用“风险驱动 + 规格追踪 + 组合/边界/统计抽样 + 用户体验 oracle”的混合测试设计，而不是单纯列功能点。

## 1. 为什么 Phase 3 不能只写简单功能用例

MathQuest 当前不是纯页面 CRUD，而是“教育游戏 + 程序化题目生成 + 多模式练习闭环”。Phase 3 的主要风险不在按钮能否点击，而在：

- **生成分布是否符合教学梯度**：例如 A03 d4/d5 只允许少量 `2位数 × 2位数`，不能全量拔高。
- **题目 oracle 不是单一答案**：题目是否“值得竖式”、compare 是否“需要二步思考”、explanation 是否具备教学反馈，都是质量 oracle。
- **随机生成需要统计抽样**：单题样本无法证明分布；需要固定 seed / 大样本 / 置信带。
- **session 体验风险跨模块传播**：T5 的 bounded retry 同时影响 campaign、advance、rank-match 三条路径。
- **当前版本状态已接近阶段收口**：QA 应证明 Phase 3 可作为 Phase 4 的稳定前置，而不只是证明新增单测绿。

## 2. 采用的外部测试设计依据

| 来源 | 本轮采用点 | 在本项目中的落地 |
|---|---|---|
| ISTQB Glossary | test case 应包含输入、前置条件、预期结果、后置条件，并服务具体 test condition | 用例表新增 test basis、risk、technique、oracle、pre/post-condition |
| ISTQB Foundation Level black-box techniques | 等价类、边界值、决策表、状态迁移是常用黑盒设计技术 | A03 数字范围用边界/等价类；T5 session lifecycle 用状态迁移；signature policy 用决策表 |
| ISO/IEC/IEEE 29119 series | 测试标准覆盖测试文档、测试过程、测试技术，支持功能/非功能、手工/自动化、脚本化/非脚本化测试 | 产物拆成 methodology、test cases、review、automated、manual、summary；同时保留探索式拟真人工 QA |
| Risk-based testing | 测试选择和优先级应按风险类型与风险等级决定 | P0 覆盖“错误教学梯度、误杀题型、重复题体验、发布回归”；P1/P2 覆盖观测与扩池建议 |

参考链接：

- ISTQB Glossary: https://istqb-glossary.page/
- ASTQB / ISTQB black-box techniques: https://astqb.org/4-2-black-box-test-techniques/
- IEEE/ISO/IEC 29119 overview: https://standards.ieee.org/ieee/29119-1/10779/

## 3. 项目内测试基准

| Test Basis ID | 文档 / 代码 | 覆盖内容 |
|---|---|---|
| TB-P3 | `ProjectManager/Plan/v0.4/phases/phase-3.md` | Phase 3 目标、范围、收尾条件 |
| TB-P3-MAIN | `ProjectManager/Plan/v0.4/subplans/2026-04-25-phase3-题目质量诊断与实施拆解.md` | T0-T5 总体拆解、诊断指标、验收门 |
| TB-T2 | `2026-04-25-T2-A03乘法两位数乘两位数分布.md` | A03 d4/d5 int-mul 分布与 UI board 约束 |
| TB-T3 | `2026-04-25-T3-A03除法样本池治理.md` | A03 短除禁用、有限小数、approximate 除法样本 |
| TB-T4 | `2026-04-25-T4-A02compare质量优化.md` | A02 compare d7/d8 质量 oracle |
| TB-T5 | `2026-04-25-T5-session内完全重复治理.md` | duplicate signature、bounded retry、三模式接入 |
| TB-GEN | `ProjectManager/Specs/2026-04-17-generator-redesign-v2.md` | A02/A03 生成器定位和教学边界 |
| TB-DIFF | `ProjectManager/Specs/2026-04-16-generator-difficulty-tiering-spec.md` | 低/中/高档用户体感定义 |
| TB-ADV | `ProjectManager/Specs/2026-04-15-gamification-phase2-advance-spec.md` | advance 星级权重和 3★ 语义 |
| TB-RANK | `ProjectManager/Specs/2026-04-18-rank-match-phase3-implementation-spec.md` | rank-match 抽题器与 session 结构 |

## 4. 风险模型

| Risk ID | 风险 | 影响 | 可能性 | 优先级 | 对应用例族 |
|---|---|---|---|---|---|
| R1 | A03 d4/d5 乘法全是旧题或过度拔高 | 教学梯度失真 | 中 | P0 | F-MUL |
| R2 | `2位数 × 2位数` 未走现有竖式 board | UI/答题形态断裂 | 中 | P0 | F-MUL |
| R3 | A03 3★ 仍混入口算级短除 | 进阶体验不可信 | 高 | P0 | F-DIV |
| R4 | T3 禁用短除误伤小数除法 | 能力覆盖倒退 | 中 | P0 | F-DIV |
| R5 | A02 d7 compare 仍是一眼判断 | 高档缺少思考价值 | 高 | P0 | H-CMP |
| R6 | A02 d8 二选一题池小或 explanation 无教学价值 | 猜题感和重复感高 | 高 | P0 | H-CMP |
| R7 | duplicate signature 误判开放/闭合题干 | 误杀正常题或放过重复题 | 高 | P0 | D-DED |
| R8 | bounded retry 跨 campaign/advance/rank-match 接入不一致 | 用户路径质量不一致 | 中 | P0 | D-DED |
| R9 | 小模板池 retry exhausted 被误判为机制失败 | 后续决策错误 | 中 | P1 | D-DED / U |
| R10 | Phase 3 回归破坏既有构建/PM 状态 | 阻塞 Phase 4 | 中 | P0 | A-GATE |

## 5. 测试设计技术映射

| Technique | 用法 |
|---|---|
| 需求追踪矩阵 | 每条用例绑定 TB/Risk/Task，避免“看起来测了很多但漏了任务”。 |
| 等价类划分 | 将 A03 操作数、A02 compare 模板、signature policy 分成有效/无效/边界等价类。 |
| 边界值分析 | 检查 d=3/4/5/6/7/8、两位/三位、除数一位/两位、retry=0/1/5/耗尽。 |
| 决策表 | T5 signature policy：闭合题干、开放题干、options 顺序变体、空白归一化。 |
| 状态迁移 | session duplicate set 在 start/next/end/abandon/resume/rank bucket 之间的生命周期。 |
| 组合覆盖 | campaign / advance / rank-match × closed/open signature × retry success/exhausted。 |
| 统计抽样 | 对随机分布用固定 seed 和样本量验证占比，不用单样本断言分布。 |
| 探索式测试 charter | 对“题感”“教学解释”“重复感”用目标用户画像进行拟真人工判定。 |

## 6. 退出准则

P0 用例必须全部 PASS；P1 可有 RISK，但必须进入 summary 的“后续观察 / backlog 建议”。若出现以下任一情况，本轮 QA 不通过：

- A03 d4/d5 `2位数 × 2位数` 不在 10%-20% 验收带。
- A03 advance 3★ 短除候选不为 0。
- A02 d7 缺少任一高档模板族，或答案集合不含 `>` / `<` / `=`。
- A02 d8 statement 池小于 24，或 explanation 完整性不达标。
- campaign / advance / rank-match 任一路径未接入 session 内 bounded retry。
- 全量 Vitest 或 build 失败。
