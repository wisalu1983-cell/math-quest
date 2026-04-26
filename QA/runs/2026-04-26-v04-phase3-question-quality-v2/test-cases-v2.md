# v0.4 Phase 3 题目质量 QA 用例表 v2

**执行日期**: 2026-04-26
**设计方法**: 见 `test-design-methodology.md`
**范围**: T2-T5 开发文档对应的题目质量、生成器、session 去重和阶段回归。
**目标用户画像**: 上海五年级学生；已完成部分闯关/进阶；对题目是否“值得练”、难度是否递进、重复是否明显敏感。

## Traceability Summary

| Task | 开发文档 | 用例族 | 覆盖目标 |
|---|---|---|---|
| T2 | A03 乘法两位数乘两位数分布 | F-MUL | 分布、边界、board、低档隔离、回归 |
| T3 | A03 除法样本池治理 | F-DIV | 短除禁用、有限小数、approximate、dec-div 防误伤、advance 3★ |
| T4 | A02 compare 质量优化 | H-CMP | d7 三模板、三答案、非一步题、d8 池规模/解释/均衡 |
| T5 | session 内完全重复治理 | D-DED | signature 决策表、retry 边界、store 生命周期、rank bucket |
| T0/T1/收口 | 总子计划 | A-GATE / U | 基线、诊断、PM 同步、拟真人工题感 |

## A-GATE：阶段门禁与回归

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| A-GATE-01 | Phase 3 targeted tests pass | TB-P3-MAIN | R10 | Regression selection | P0 | `master` 含 Phase 3 merge | 运行 Phase 3 相关 test files | A02/A03/dedupe/store/rank tests 全部通过 | 新增质量规则可被快速回归验证 | 自动化 |
| A-GATE-02 | Full unit regression pass | TB-P3 | R10 | Regression suite | P0 | 依赖安装完成 | `npm test -- --run` | 53 files / 687 tests 通过 | 既有玩法不因 Phase 3 破裂 | 自动化 |
| A-GATE-03 | Production build pass | TB-P3 | R10 | Build verification | P0 | 测试通过后 | `npm run build` | TypeScript 与 Vite build 通过；仅允许既有 chunk warning | 可继续发布/进入 Phase 4 | 自动化 |
| A-GATE-04 | PM state consistency | TB-P3 / TB-P3-MAIN | R10 | Static consistency | P1 | PM 回写完成 | `npx tsx scripts/pm-sync-check.ts` | 全绿 | 项目入口不会误导下一阶段 | 自动化 |
| A-GATE-05 | Scoped lint gate | TB-P3-MAIN | R10 | Static analysis | P1 | Phase 3 touched files 已知 | 对 touched files 运行 ESLint | scoped lint 通过 | 当前改动清洁；历史债务单独处理 | 自动化 |
| A-GATE-06 | Full lint debt classification | TB-P3-MAIN | R10 | Risk classification | P2 | scoped lint 通过 | 运行 `npm run lint` 并归因 | 若失败，必须归因为历史债务或 `.worktrees/` 扫描，不得新增 Phase 3 touched-file error | QA 结论可信，不把旧债算作本轮失败 | 自动化 |

## F-MUL：T2 A03 乘法分布

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| F-MUL-01 | d4 int-mul 分布进入验收带 | TB-T2 / TB-DIFF | R1 | Statistical sampling | P0 | 固定 seed 诊断脚本 | 抽样 500 道 d4 int-mul | `2d×2d` 占比 10%-20%，主体仍为 `3d×1d` | 第四关开始有挑战但不过载 | 自动化 |
| F-MUL-02 | d5 int-mul 分布进入验收带 | TB-T2 / TB-DIFF | R1 | Statistical sampling | P0 | 同上 | 抽样 500 道 d5 int-mul | `2d×2d` 占比 10%-20%，主体仍为 `3d×1d` | 第五关延续渐进挑战 | 自动化 |
| F-MUL-03 | d3 不出现两位数乘两位数 | TB-T2 | R1 | Boundary value | P0 | generator 可抽样 | 抽样 difficulty<=3 int-mul | 不出现 `2d×2d` | 低档不被提前拔高 | 自动化 |
| F-MUL-04 | d4/d5 生成的 `2d×2d` 操作数边界 | TB-T2 | R1 | Equivalence + boundary | P0 | 可定位 `2d×2d` 样本 | 校验操作数范围 | 两个操作数均为 12-99，且不为整十数 | 题目不是退化的乘整十快题 | 自动化 |
| F-MUL-05 | `2d×2d` 使用整数乘法竖式 board | TB-T2 / TB-GEN | R2 | Structural oracle | P0 | 抽到 `2d×2d` 样本 | 检查 `multiplicationBoard` | `mode='integer'`，`operandInputMode='static'`，operands 与题干一致 | 学生看到的是多行部分积竖式训练 | 自动化 + Code Review |
| F-MUL-06 | T2 不修改 campaign/advance/rank 权重 | TB-T2 / TB-ADV / TB-RANK | R1 | Impact analysis | P1 | Code review | 检查改动 ownership | 分布规则只在 generator，非上层插题补丁 | 上层玩法语义稳定 | Code Review |
| F-MUL-07 | 随机分布测试抗波动 | TB-T2 | R1 | Test robustness | P1 | 测试用例存在 | 检查测试样本量和验收带 | 使用足够样本量和 10%-20% 宽验收带，不用单次样本断言 | QA 不因随机抖动产生误报 | Code Review |

## F-DIV：T3 A03 除法样本池

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| F-DIV-01 | 全难度 `int-div` 禁止两位整数除以一位整数短除 | TB-T3 / TB-DIFF | R3 | Equivalence partition | P0 | generator 可抽样 | 抽样 d2-d10 int-div | 不存在整数 `10-99 ÷ 1-9` | 竖式题不会退化成口算题 | 自动化 |
| F-DIV-02 | 低档整数整除仍保留但被除数至少三位 | TB-T3 | R4 | Boundary value | P0 | d<=5 int-div | 抽样低档整除题 | 允许整数商，但 dividend >=100 | 低档仍练竖式，不被删空能力点 | 自动化 |
| F-DIV-03 | d6/d7 `int-div` 生成有限小数 | TB-T3 | R3/R4 | Equivalence partition | P0 | d6/d7 int-div | 抽样并检查答案 | quotient 非整数，最多 3 位小数，1-2 位为主 | 中高档除法有明确“继续除”训练 | 自动化 |
| F-DIV-04 | `int-div` 除数范围符合 4-19 | TB-T3 | R3 | Boundary value | P0 | d6/d7 int-div | 检查 divisor | divisor 在 4-19 | 避免过小除数导致心算化 | 自动化 |
| F-DIV-05 | `approximate` 替换固定小整数题池 | TB-T3 | R3 | Defect-based | P0 | d>=8 approximate | 抽样 approximate | 不出现 `7÷3`、`22÷7`、`25÷7` 等小固定样本 | 估算近似题不再像背固定答案 | 自动化 |
| F-DIV-06 | `approximate` 使用三位数被除数和不可整除除法 | TB-T3 | R3 | Boundary + oracle | P0 | d>=8 approximate | 抽样 approximate | dividend 为三位数，divisor 4-19，不能整除 | 高档近似题有真实试商/估算价值 | 自动化 |
| F-DIV-07 | 小数除法不被短除口径误伤 | TB-T3 / TB-GEN | R4 | Negative testing | P0 | dec-div 可抽样 | 抽样 d6/d7 dec-div | 小数除法仍生成；短除候选只统计整数两位/一位 | 修复不牺牲 A03 小数能力 | 自动化 |
| F-DIV-08 | advance 3★ 真实路径短除候选为 0 | TB-T3 / TB-ADV | R3 | Scenario sampling | P0 | 诊断脚本覆盖 advance | 抽样 1600 advance questions | A03 division sample 中 `shortDivisionCandidates=0` | 进阶 3★ 难度可信 | 自动化 + 拟真人工 |
| F-DIV-09 | T3 不改变 `TOPIC_STAR_CAP` 和上层权重 | TB-T3 / TB-ADV | R4 | Impact analysis | P1 | Code review | 检查上层文件 | 不改星级上限和 advance 权重表 | 只修题质，不重排玩法系统 | Code Review |

## H-CMP：T4 A02 compare 质量

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| H-CMP-01 | d7 compare 不再是一眼一步比较主力 | TB-T4 / TB-DIFF | R5 | Defect-based | P0 | d7 compare 可抽样 | 抽样 prompt 分类 | 不匹配旧一步主力结构；应落入高级模板族 | 学生需要先识别结构再比较 | 自动化 + 拟真人工 |
| H-CMP-02 | d7 覆盖等价变形伪装比较 | TB-T4 | R5 | Equivalence partition | P0 | 诊断脚本 | 统计 d7 pattern | `equivalent-transform` 出现且样本有效 | 学生练“等价转化”而非硬算 | 自动化 |
| H-CMP-03 | d7 覆盖净倍率判断比较 | TB-T4 | R5 | Equivalence partition | P0 | 同上 | 统计 d7 pattern | `net-multiplier` 出现且样本有效 | 学生练整体倍率判断 | 自动化 |
| H-CMP-04 | d7 覆盖合并同类结构比较 | TB-T4 | R5 | Equivalence partition | P0 | 同上 | 统计 d7 pattern | `combine-like-terms` 出现且样本有效 | 学生练结构合并 | 自动化 |
| H-CMP-05 | d7 答案集合覆盖 `>` / `<` / `=` | TB-T4 | R5 | Coverage criterion | P0 | d7 抽样 | 统计答案分布 | 三类答案均出现，不单边倾斜到只有一种 | 题目不是套路猜测 | 自动化 |
| H-CMP-06 | d7 不要求具体算出长小数结果 | TB-T4 | R5 | Usability oracle | P1 | 查看样本 | 评估解法路径 | 可通过等价/倍率/合并判断，不依赖精算小数 | 思考负担是结构而非繁琐计算 | 拟真人工 |
| H-CMP-07 | d8 保留 `对/错` 但 statement 池 >=24 | TB-T4 | R6 | Boundary + coverage | P0 | d8 compare | 抽样/检查池规模 | unique statements >=24 | 二选一不再小池重复 | 自动化 |
| H-CMP-08 | d8 对错比例大致均衡 | TB-T4 | R6 | Statistical sampling | P0 | d8 compare | 抽样统计 | `对/错` 数量差在可接受范围内 | 不能靠“多数选错”套路 | 自动化 |
| H-CMP-09 | d8 explanation 完整性 | TB-T4 | R6 | Checklist-based | P0 | d8 compare | 检查 explanation | 每条包含规则、条件、边界或反例 | 答后反馈有教学价值 | 自动化 + 拟真人工 |
| H-CMP-10 | d8 不跨入 estimate/round/floor-ceil 能力边界 | TB-T4 / TB-GEN | R6 | Scope control | P1 | 抽样 d8 statement | 检查题干能力点 | 只扩 compare 同类陈述 | A02 子题型职责清楚 | Code Review + 拟真人工 |
| H-CMP-11 | 二选一候选诊断不再误报 A02 compare | TB-T4 | R6 | Diagnostic oracle | P1 | 诊断脚本 | 查看 two-choice section | 除 accepted A02 compare judges 外无问题候选 | QA 诊断口径与产品决策一致 | 自动化 |

## D-DED：T5 session 内完全重复治理

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| D-DED-01 | 闭合题干签名只用 normalized prompt | TB-T5 | R7 | Decision table | P0 | helper 单测 | 构造同 prompt 不同 options | signature 相同 | 具体题目不会因换选项而重复出现 | 自动化 |
| D-DED-02 | 开放题干签名使用 prompt + canonical options | TB-T5 | R7 | Decision table | P0 | helper 单测 | 构造同 prompt 不同 options | signature 不同 | 题干模板相同但选项实例不同可保留 | 自动化 |
| D-DED-03 | options 顺序差异归一 | TB-T5 | R7 | Equivalence partition | P0 | helper 单测 | 同 options 不同顺序 | signature 相同 | 防止洗牌绕过重复治理 | 自动化 |
| D-DED-04 | 空白差异归一 | TB-T5 | R7 | Equivalence partition | P1 | helper 单测 | prompt/options 加空白差异 | signature 相同 | 文案格式不会影响重复判断 | 自动化 |
| D-DED-05 | retry 第一次重复第二次不同 | TB-T5 | R8 | Boundary value | P0 | mocked generator | generate sequence: duplicate -> unique | 返回 unique，seen 更新 | 用户不会看到刚出过的完全重复题 | 自动化 |
| D-DED-06 | retry 5 次耗尽不死循环 | TB-T5 | R8/R9 | Boundary value | P0 | mocked generator | 连续重复超过上限 | 返回当前题，最多 5 次重试 | 小题池不会卡死 session | 自动化 |
| D-DED-07 | campaign session 共享 seen set | TB-T5 | R8 | State transition | P0 | store session test | start campaign → nextQuestion 多次 | 同一 session 内复用 set；end/abandon 清理 | 闯关一局内重复感下降 | 自动化 |
| D-DED-08 | advance session 共享 seen set | TB-T5 / TB-ADV | R8 | State transition | P0 | store session test | start advance → nextQuestion 多次 | 同一 session 内复用 set；结束清理 | 进阶 15 题不浪费在重复题上 | 自动化 |
| D-DED-09 | rank-match primary/nonPrimary/review 共用 seen set | TB-T5 / TB-RANK | R8 | Integration + combination | P0 | rank picker test | 生成整局题序 | 三桶跨 bucket 不重复 | 段位赛整局更像完整挑战 | 自动化 |
| D-DED-10 | rank-match 题池不足不死循环 | TB-T5 / TB-RANK | R8/R9 | Boundary value | P0 | mocked small pool | 强制小池生成 | 有 bounded fallback，无无限循环 | 极端题池也能安全结束 | 自动化 |
| D-DED-11 | 诊断输出 baseline vs simulated retry | TB-T5 | R9 | Diagnostic coverage | P1 | 诊断脚本 | 查看 campaign duplicate hotspots | 输出 baseline、retry、drop、retryExhausted | 后续能判断是机制问题还是题池容量问题 | 自动化 |
| D-DED-12 | rank-match production retry summary 为 0 | TB-T5 / TB-RANK | R8 | Scenario sampling | P0 | 诊断脚本 | 30 局 × 四段位 | rookie/pro/expert/master duplicate games 均 0/30 | 段位赛不会明显重复 | 自动化 + 拟真人工 |
| D-DED-13 | signature set 不持久化 | TB-T5 | R8 | Architecture review | P1 | Code review | 检查 store/repository/types | 不写入 PracticeSession / repository / localStorage | 去重体验不污染存档 schema | Code Review |

## U：拟真人工 / 教学体验 Charters

| ID | Charter | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| U-01 | A03 d4/d5 “少量新挑战”题感 | TB-T2 / TB-DIFF | R1 | Exploratory charter | P1 | 诊断样本可查 | 查看乘法样本和比例 | 新结构可感知但不是主导 | 像进入高一点的竖式关卡 | 模拟人工 |
| U-02 | A03 3★ 除法题感 | TB-T3 / TB-ADV | R3 | Exploratory charter | P0 | 诊断样本可查 | 查看 advance 除法样本 | 没有两位÷一位心算题 | 3★ 有训练价值 | 模拟人工 |
| U-03 | T3 防误伤小数除法 | TB-T3 | R4 | Exploratory charter | P1 | 小数除法样本可查 | 查看 dec-div 和 int-div 分工 | 小数能力仍存在 | 修复不显得“删题” | 模拟人工 |
| U-04 | A02 d7 compare 思考路径 | TB-T4 | R5 | Cognitive walkthrough | P0 | d7 样本可查 | 对三类模板各挑样本走解题路径 | 不需精算，可通过结构判断 | 学生会感觉“先看结构” | 模拟人工 |
| U-05 | A02 d8 explanation 教学价值 | TB-T4 | R6 | Checklist + user oracle | P0 | d8 explanation 可查 | 检查对/错样本解释 | 错题有反例或条件；对题有规则边界 | 答后能学到为什么 | 模拟人工 |
| U-06 | 完全重复 vs 结构重复区分 | TB-T5 | R7/R9 | Exploratory charter | P1 | 诊断热点可查 | 对比 retry 后仍有热点 | 机制解决完全重复；小模板池作为扩池观察 | 不把“题型结构相似”误判成 bug | 模拟人工 |
| U-07 | campaign / advance / rank-match 一致性 | TB-T5 | R8 | Scenario walkthrough | P1 | 代码与诊断可查 | 比较三路径接入点 | 三路径都有去重策略，rank-match 最强 | 主要练习路径质量一致 | 模拟人工 |
| U-08 | QA 结论可解释性 | TB-P3-MAIN | R10 | Review checklist | P1 | 所有报告已写 | 检查 summary 是否说明 full lint 非阻塞原因 | 通过/非阻塞边界清楚 | PM 决策不被含糊报告误导 | 模拟人工 |

## Coverage Matrix

| Risk | Covered By |
|---|---|
| R1 | F-MUL-01, F-MUL-02, F-MUL-03, F-MUL-04, F-MUL-06, U-01 |
| R2 | F-MUL-05 |
| R3 | F-DIV-01, F-DIV-02, F-DIV-03, F-DIV-04, F-DIV-05, F-DIV-06, F-DIV-08, U-02 |
| R4 | F-DIV-07, F-DIV-09, U-03 |
| R5 | H-CMP-01 to H-CMP-06, U-04 |
| R6 | H-CMP-07 to H-CMP-11, U-05 |
| R7 | D-DED-01 to D-DED-04, U-06 |
| R8 | D-DED-05 to D-DED-10, D-DED-12, D-DED-13, U-07 |
| R9 | D-DED-06, D-DED-11, U-06 |
| R10 | A-GATE-01 to A-GATE-06, U-08 |
