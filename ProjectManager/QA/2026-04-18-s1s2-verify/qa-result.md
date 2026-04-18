# 闯关+进阶稳定化 S1 尾+S2 全组 回归执行报告

**执行日期**：2026-04-18
**关联子计划**：[`Plan/2026-04-17-campaign-advance-stabilization.md`](../../Plan/2026-04-17-campaign-advance-stabilization.md) §S1 + §S2
**用例范围**：S1-T2 截图回归（A05 分数题 / A08 方程题）+ S2-T1/T2/T3/T4 代码修复的浏览器+单测混合验证
**目标用户画像**：上海五年级小学生（10-11 岁），数学能力中等，第一次进入关卡
**总计**：6 条
**结果**：PASS: 6 / FAIL: 0 / RISK: 0 / BLOCKED: 0

---

## 测试环境

- 浏览器：Cursor-IDE-Browser（Chromium 内核），视口 1024×972（浏览器窗口 resize 调用 API 仅改外层 window，不影响渲染布局；答题卡片 container 走 `max-w-lg mx-auto` = 512px 上限，实测实际卡宽 ~320px）
- 前端版本：v2.2 生成器 + S1/S2 代码修复后（`tsc -b` 0 错、`vitest` 271/271 PASS）
- Dev server：`npm run dev` → localhost:5173

---

## 逐条结果

| ID | 用例名称 | 用户预期 | 操作路径 | 实际观察 | 判定 | 证据 |
|----|---------|---------|---------|---------|------|------|
| QA-S1T2-A05 | A05 低档「分数→小数互换」指令恢复 | 看到上方完整文字指令 +下方大号 LaTeX 分数渲染，两者都清晰可读 | 首页→输入昵称→小数计算→第1关→遇到分数题 | 卡片上方灰色指令文字「把分数 17/50 化成小数（书写时请用小数形式）」完整显示；下方大号 LaTeX 分数 `17/50` 居中渲染；指令未被 `promptLatex` 短路吞掉 | PASS：指令和 LaTeX 并存，v2.2 收口时 BUG-v2-SMOKE-02 已清 | `artifacts/QA-S1T2-A05-evidence.png` |
| QA-S1T2-A08 | A08 方程题 PROMPT_TRANSPOSE 指令不丢 | 看到「对该方程移项，写出移项后的完整等式」+下方方程 LaTeX | 首页→方程移项→第1关 | 卡片上方指令「对该方程移项，写出移项后的完整等式（不要算出 x 的值）：」完整折为 2 行显示；下方大号 LaTeX `46 − x = 18` 居中渲染 | PASS：指令前缀 `PROMPT_TRANSPOSE` 未丢 | `artifacts/QA-S1T2-A08-and-S2T2-evidence.png` |
| QA-S2T1 | A04/A06/A07 长题面不截断 | 长题完整可见，折行点在空格/运算符边界，不拆开数字或运算符 | 首页→简便计算→第3关（A07 S1-LB L1，difficulty=4，凑整法题） | 65 字超长题「用凑整法把 271 + 997 拆成更好算的形式。按顺序填入两个空（不要算出最后得数）：271 + 997 = 271 + ___ - ___」在卡片内自然折为 3 行；所有数字和 `+ = ___` 均未被拆开；字号走 `text-[20px]`（length > 25 分支）| PASS：`whitespace-nowrap overflow-x-auto` 改为 `whitespace-normal break-words` 后截断消失、表达式未断裂 | `artifacts/QA-S2T1-evidence.png` |
| QA-S2T2 | A08 equation-input placeholder 情境化 | 点击输入框时 placeholder 不再是「例：4x = 20」 | 首页→方程移项→第1关→观察输入框 | placeholder 显示「写出移项后的完整等式」，与题面指令一致，不再是写死的「例：4x = 20」 | PASS：同场景一图双验 | `artifacts/QA-S1T2-A08-and-S2T2-evidence.png` |
| QA-S2T4 | A05 S2-LB「反直觉与比较」无循环小数题 | 进入 A05 S2-LB 连跑 3-4 题，不出现循环小数 | 代码级验证（S2-LB 需先通关 S1 两 lane，浏览器端成本高；改用代码+单测证据） | `src/constants/campaign.ts` grep `cyclic-div` 在全项目仅剩一处 = 第 420 行 `decimal-ops-S3-LA`（设计意图保留）；`decimal-ops-S2-LB:404` 的 filter 已改为 `['compare', 'trap']`；`pickSubtype` 仅从 filter 抽；271/271 单测 PASS | PASS（代码级）：配置变更 + 单测护航已充分排除 S2-LB 出现 `cyclic-div` 的可能 | `src/constants/campaign.ts:404` 源码 + `vitest run` 271/271 |
| QA-S2T3 | A01 S2-LB 乘除 d≥6 高档技巧题占比 ≥ 65% | `useHighPool` 权重从 0.5 → 0.75 后，「末尾 0 / 25·50·75·125 凑整 / 拆分」类技巧题真正占主导，lane 名「口算拆分技巧」名实对齐 | 单测级验证（权重差异 0.5→0.75 体感弱，单次 playtest 难判定；改用统计断言）：新增 `qa-v3.test.ts` §A-20 批量生成 400 道 `mental-arithmetic/d=7/mul+div`，统计 operand 命中 `{25,50,75,125}` 或末尾 0 的占比 | 统计占比稳定 > 65%（理论期望 0.75，实测跨多次运行均 PASS，未观察到边界抖动）；`tsc -b` 0 错、`vitest run` 271/271 全绿 | PASS（单测级）：权重调整生效，高档池在 d≥6 下确实占主导；**lane 整体观感**挂到 S3 拟真 QA 复核 | `src/engine/generators/mental-arithmetic.ts:239` + `qa-v3.test.ts` §A-20 + `vitest run` 271/271 |

---

## 新发现问题

无。

---

## 本轮结论

S1 分组（§一 S1-T1/T2）全绿收口 —— tsc 0 错、vitest 271/271、浏览器端 A05 分数题 + A08 方程题指令可见，BUG-v2-SMOKE-02 正式关闭。

S2 分组 4 项代码修复全部完成：
- S2-T1（BUG-v2-SMOKE-01 A04/A06 长题面截断）→ PASS（浏览器端），修复方式是 `Practice.tsx:236` 的 `whitespace-nowrap overflow-x-auto` → `whitespace-normal break-words`
- S2-T2（BUG-v2-SMOKE-03 A08 placeholder）→ PASS（浏览器端），修复方式是 `Practice.tsx:405` placeholder 文案改为情境化通用提示
- S2-T3（Q-057-F01 A01 S2-LB 名实对齐）→ PASS（单测级，用户决策方案 B），修复方式是 `mental-arithmetic.ts:239` `useHighPool` 权重 0.5→0.75，新增 `qa-v3.test.ts` §A-20 统计断言护航
- S2-T4（Q-057-F02 A05 S2-LB 语义聚焦）→ PASS（代码级），修复方式是 `campaign.ts:404` 的 subtypeFilter 移除 `cyclic-div`

**S2 整组关闭**，子计划 M2 里程碑达成，下一步进入 S3 深度体验 QA。

### 遗留与后续

- **S2-T4 浏览器端终极验证**：未来如果遇到为 S2 分组收尾的整体回归，可在某个已通关 A05 S1 的 session 中附带连跑 4-5 题 S2-LB 作为最终确证；本轮以代码+单测为证据 PASS。
- **S2-T3 lane 整体观感**：权重调整是概率分布调整，单测保证"技巧题占比 ≥ 65%"，但"一局里真有口算拆分训练感"需 S3 拟真 QA 补一次主观判定。
- **S3/S4**：本轮后开放，S3-T1 梯度打分需用户亲自试玩；S4 进阶冒烟可走代码+单测+浏览器混合路径。
