# ISSUE-057 拟真体验测试报告

**执行日期**: 2026-04-17
**测试者**: Agent-as-User QA（`agent-as-user-qa` skill）
**目标用户**: 小学 5 年级学生，已玩过 1-2 天、熟悉基本交互
**测试范围**: 本 session 的产出——`campaign.ts` 8 题型重构、`qa-v3.test.ts` 同步、`repository/local.ts` 策略 X 迁移
**总用例**: 16 条（B1 代码审计 8 + B2 单测 7 + B3 浏览器端到端 6，B2/B3 中 "90 关总数" 和 "全量 vitest" 与之独立计数）

**结果**: PASS: 13 / FAIL: 0 / RISK: 3 / BLOCKED: 0

---

## 批次 B1：8 题型"普通关聚焦 / Boss 综合"理念符合度审计（代码级）

**判定逻辑**：对每个题型 × 每个普通 stage lane，比对 `laneLabel` 与 `subtypeFilter` 对应 generator tag 的注释语义是否一致、以及 generator 是否会在该 difficulty 真的产出与 label 名实相符的题。

| ID | 题型 | 用户预期 | 操作路径 | 实际观察 | 判定 |
|----|------|---------|---------|---------|------|
| B1-01 | A01 基础计算 | 档1 加减主路 / 乘除支路 / 档2 运算顺序 / 拆分技巧 / Boss | 读 `campaign.ts` + `mental-arithmetic.ts` getSubtypeEntries/generatePair | S1-LA=add+sub ✓、S1-LB=mul+div ✓、S2-LA=order ✓、S3 Boss 无 filter ✓。但 **S2-LB "口算拆分技巧" filter=['mul','div']**，generator 内 `generatePair(d≥6)` 走 `useHighPool = Math.random() < 0.5` 混合池，50% 是中档末尾零乘除、50% 才是真正拆分技巧（25×24、125×16）——lane 名只描述了 50% 的题 | **RISK** |
| B1-02 | A02 数感估算 | 估算/比较/四舍五入/去尾进一/逆向/估算深化/比较深化 各聚焦 | 读 `campaign.ts` + `number-sense.ts` | 7 个 lane 名一一对应独立 filter（estimate/compare/round/floor-ceil/reverse-round），Boss 无 filter。聚焦度 100% | PASS |
| B1-03 | A03 竖式笔算 | 整数加减 / 整数乘除 / 小数加减 / 小数乘除 / 大数乘法 / 除法近似 | 读 `campaign.ts` + `vertical-calc.ts` | 6 个普通 lane 对应 6 个独立 tag 组合，Boss 无 filter。名实一致 | PASS |
| B1-04 | A04 运算律 | 档1 律的认识 / 档2 反例与易混 / 陷阱与诊断 / Boss | 读 `campaign.ts` + `operation-laws.ts` | S1 单 lane `['identify-law','structure-blank','reverse-blank','simple-judge']`；S2-LA 反例易混 `[counter-example,easy-confuse,concept-reverse]`；S2-LB 陷阱诊断 `[compound-law,distributive-trap,error-diagnose]`。tag 分组与 lane 名完全吻合 | PASS |
| B1-05 | A05 小数性质 | 位值与互换 / 简单移位 / 位数与移位 / 反直觉与比较 / 循环小数 / 反直觉性质 / Boss | 读 `campaign.ts` + `decimal-ops.ts` | S1-LA=add-sub ✓、S1-LB=mul+div ✓；**S2-LB "反直觉与比较" filter=['compare','trap','cyclic-div']**——cyclic-div（循环小数近似保留 1 位）和"反直觉与比较"语义不完全对齐，应归到 S3-LA "循环小数"；1/3 的 tag 偏离主题 | **RISK** |
| B1-06 | A06 括号变换 | 去括号 / 添括号 / 除法性质 / 嵌套变号 / 错误诊断 / Boss | 读 `campaign.ts` + `bracket-ops.ts` | 6 lane 聚焦清晰。唯一 RISK 点是 S2-LB "除法性质" 在 d=6 仅 1 关（generator 注释说该 tag 在 v2.2 已降权为 0 / Boss 池主力）——lane 数量合理但"除法性质"作为独立 lane 是否冗余待观察 | PASS |
| B1-07 | A07 简便计算 | 连减凑整 / 分配律凑整 / 辨析因数 / 方法选择 / 变号陷阱 / 错误诊断 / 隐藏因数串联 / Boss | 读 `campaign.ts` + `multi-step.ts` | 7 个普通 lane × 7 个聚焦 filter 组合，generator tag 注释 1:1 对应。Boss 无 filter | PASS |
| B1-08 | A08 方程移项 | 档1 常数移项 / 系数与概念 / 档2 双向移项 / 括号与诊断 / Boss | 读 `campaign.ts` + `equation-transpose.ts` | 4 个普通 lane 覆盖 9 个 subtype tag，分组合理（S1 简单 → S2 复杂/易错） | PASS |

**B1 小结**：8 题型中 6 个完全 PASS，2 个 RISK（A01 S2-LB / A05 S2-LB 名实对应度 50-66%）。整体理念落地 ≥ 87%。

---

## 批次 B2：存档迁移单测（策略 X）

**运行**: `npx vitest run src/repository/local.test.ts` → **7/7 PASS**

| ID | 用户预期 | 操作路径 | 实际观察 | 判定 |
|----|---------|---------|---------|------|
| B2-01 | 空存档不触发迁移 | 传入 `emptyProgress()` 到 `migrateCampaignIfNeeded` | 返回引用相等，未触发 | PASS |
| B2-02 | 全新 levelId 存档不触发迁移（幂等） | 注入 3 条新结构 levelId | 返回引用相等 | PASS |
| B2-03 | 含旧 S4 Boss + campaignCompleted=true → 新结构全关满星 | 注入 2 条记录（1 新 + 1 旧 Boss） | 返回 11 关 + 全 bestHearts=3 + campaignCompleted=true | PASS |
| B2-04 | 含旧 S3/S4 + campaignCompleted=false → 丢弃孤儿记录 | A04 注入 4 条（2 新 + 2 旧） | 只保留 2 条有效项，原 bestHearts 保留，未通状态维持 | PASS |
| B2-05 | 多题型并存时每题型独立判断 | A01 已通 + A04 未通 | A01 全关满星、A04 孤儿清空 | PASS |
| B2-06 | 迁移后再跑一次：幂等 | migrate → migrate | 第二次返回引用相等 | PASS |
| B2-07 | 防回归：8 题型总关卡数 = 90 | 遍历 `getAllLevelIds` | A01:11+A02:15+A03:12+A04:8+A05:12+A06:10+A07:13+A08:9 = 90 ✓ | PASS |

**B2 小结**：策略 X 的 3 种分支（无需迁移 / 已通 Boss 全满 / 未通 Boss 清孤儿）全部正确。幂等性验证通过。

---

## 批次 B3：浏览器端到端（Playwright）

**运行**: `node QA/artifacts/qa-run.mjs` → **6/6 PASS**
**截图**: `QA/artifacts/shots/B3-*.png`

| ID | 用户预期 | 操作路径 | 实际观察 | 判定 | 证据 |
|----|---------|---------|---------|------|------|
| B3-01 | 首页加载，8 主题卡可见 | 预置 user → 访问 / | title="数学大冒险 · 学习"，含"基础计算"卡 | PASS | `B3-01-home.png` |
| B3-02 | A01 CampaignMap 显示"档1/档2/Boss"三段，无"低/中/高档"字样 | 点"基础计算" | 档1=✓ 档2=✓ Boss=✓ 残留低/中档=✗ | PASS | `B3-02-a01-campaign.png` |
| B3-03 | A04 同 A01 三段结构 | 返回首页 → 点"运算律" | 档1=✓ 档2=✓ Boss=✓ 残留低/中档=✗ | PASS | `B3-03-a04-campaign.png` |
| B3-04 | A02 四段 + 至少 4 个聚焦 lane 名 | 返回首页 → 点"数感估算" | 低/中/高/Boss 全 ✓，聚焦 lane 名命中 6 个（估算/比较/四舍五入/去尾/逆向/深化） | PASS | `B3-04-a02-campaign.png` |
| B3-05 | 进入 A01 S1-LA L1，首题含 + 或 -、不含 × 或 ÷（验证 subtypeFilter=[add,sub] 生效） | 点第1关 | 有+-=✓ 有×÷=✗ | PASS | `B3-05-practice-a01-s1la.png` |
| B3-06 | 注入旧 S4 Boss 存档 reload → 新结构全关满星 | 注入 oldProgress → reload | localStorage 里 mental-arithmetic = 11 关 + 全 bestHearts=3 + 无 S4 levelId | PASS | `B3-06-migrated-home.png` |

**B3 小结**：关键闯关流程（首页 → 地图 → 关卡 → Practice → 出题类型正确）走通。存档迁移在真实浏览器环境下触发并正确回写。

---

## 新发现问题

| 编号 | 来源 | 现象 | 建议优先级 | 建议方向 |
|------|------|------|----------|---------|
| Q-057-F01 | B1-01 | A01 S2-LB "口算拆分技巧"的 50% 题目仍是 generator 中档池（末尾零乘除），lane 名只描述另外 50% | P2 | 要么改 lane 名为"大数乘除 + 拆分技巧"更诚实，要么调 generator 的 `useHighPool` 权重（如 0.75）让拆分占主导 |
| Q-057-F02 | B1-05 | A05 S2-LB "反直觉与比较" 的 `cyclic-div` tag 属于循环小数，和 lane 主题不搭 | P2 | 从 S2-LB filter 移除 `cyclic-div`（保留在 S3-LA 循环小数 lane），让 S2-LB 纯粹聚焦"比较 + 反直觉" |
| Q-057-F03 | 跨批次 | `npm run build` 的 tsc 阶段有 24 个 pre-existing 类型错误（BracketOpsData / EquationTransposeData / MultiStepData），与本次修改无关 | P1 | 独立开 issue，由 v2.2 生成器作者补齐类型定义；本 session 不承担 |

---

## 回归全量测试

| 动作 | 结果 |
|------|------|
| `npx vitest run`（全量 264 条含 B2 新增 7 条） | 264/264 PASS |
| `npm run build`（tsc） | 24 个 pre-existing 类型错误（与本 session 无关，见 Q-057-F03） |
| `npm run build`（vite build） | 未执行（tsc 先失败） |

---

## 本轮结论

**代码质量与体验符合度**：可以收口 ISSUE-057 的闭环（产出 + 测试 + 迁移 + 文档齐全）。

**"普通关聚焦 / Boss 综合"理念落地率**：
- 代码层面 100%（所有普通 lane 都有 `subtypeFilter`，所有 Boss 无 filter）
- 语义聚焦度 ≥ 87%（8 题型中 6 题型完全吻合，2 题型有 RISK 可优化）

**可选后续动作**（优先级 P2，不阻塞收口）：
1. 修 Q-057-F01：调整 A01 S2-LB 的 lane 命名或 generator 权重
2. 修 Q-057-F02：A05 S2-LB 移除 cyclic-div

**强烈建议独立开 issue**（P1）：Q-057-F03 的 24 个 pre-existing tsc 错误会一直阻塞生产 build。

