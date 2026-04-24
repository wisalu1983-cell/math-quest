# 闯关+进阶稳定化 S3 深度体验 + S4 进阶专项 执行报告

**执行日期**：2026-04-18
**关联子计划**：[`Plan/v0.1/2026-04-17-campaign-advance-stabilization.md`](../../ProjectManager/Plan/v0.1/2026-04-17-campaign-advance-stabilization.md) §S3 + §S4
**用例范围**：S3-T2/T3/T4 浏览器+代码混合验证 + S4-T1/T2/T3/T4 代码+浏览器混合验证
**目标用户画像**：上海五年级小学生（10-11 岁），数学能力中等
**总计**：7 项（S3-T1 待用户不计）
**结果**：PASS: 7 / FAIL: 0 / RISK: 0 / BLOCKED: 0

---

## 测试环境

- 浏览器：Cursor-IDE-Browser（Chromium 内核），视口 1024×972
- 前端版本：v2.2 生成器 + S1/S2/S3/S4 修复后（`tsc -b` 0 错、`vitest` 328/328 PASS）
- Dev server：`npm run dev` → localhost:5173

---

## 逐项结果

### S3-T2：新答题形式完整链路

| 形式 | 方法 | 题目 | 结果 | 证据 |
|------|------|------|------|------|
| equation-input | 浏览器 | `x + 24 = 38` → `x = 38 + 24`(错) / `x = 38 - 24`(展示) | PASS：判错 + explanation | S3-T3 截图复用 |
| multi-blank | 浏览器 | `(36+33)+23 = 36+(__+__)` → 33/23 | PASS：判对 + explanation | `QA-S3T2-expression-input-pass.png` 同场景 |
| expression-input | 浏览器 | `(71-34)+78` → `71 - 34 + 78` | PASS：判对 + explanation | `QA-S3T2-expression-input-pass.png` |
| multi-select | 代码级 | qa-v3.test.ts A-26（3 来源题型） | PASS：answer 格式/排序/数组 | vitest 328/328 |

### S3-T3：A08 四类陷阱反馈质量

| 陷阱 | 方法 | 样本 | 结果 | 证据 |
|------|------|------|------|------|
| T1 减号后 x 丢负号 | 代码级 A-22 | ≥2 道 | PASS：explanation 含标签+错误点+修正指引 | vitest |
| T2 同侧多常数漏移 | 代码级 A-23 | ≥2 道 | PASS | vitest |
| T3 括号展开漏乘 | 代码级 A-24 | ≥2 道 | PASS | vitest |
| T4 双向移项变号 | 代码级 A-25 | ≥2 道 | PASS | vitest |
| 浏览器端反馈链路 | 浏览器 | 2 道错答 | PASS：explanation 完整展示 | `QA-S3T3-A08-feedback-transpose.png` / `QA-S3T3-A08-feedback-concept.png` |

### S3-T4：节奏 + hearts 完整闯关

A01 S1-LA L1（10 题）完整跑完：10/10 全对，通关。结算页 "太棒了，通关！" + 100% + 满心 ♥♥♥。无判定延迟 / 无心数同步异常 / 无节奏断点。

证据：`QA-S3T4-session-summary.png`

### S4-T1：3★-cap 压档用例

advance.test.ts 新增 25 条用例（A01/A04/A08 × 4 星级边界 × 4 类断言 + 退化检测）全 PASS。压档核心：demon 档永不启用。

### S4-T2：8 主题进阶端到端冒烟

advance.test.ts 新增 24 条用例（8 题型 × 3 心数水位 × 20 题/局 = 480 道）：`buildAdvanceSlots → generateQuestion` 全链路无 throw、结构完整。

### S4-T3：新答题形式在进阶 + 主动退出

- 进阶可达性：3 条单测证明 multi-blank / expression-input / equation-input 对应 subtypeTag 出现在进阶 slots 中
- `abandonSession` 代码审计：错题写入 ✓ / `completed: false` ✓ / 不触发结算 ✓
- 浏览器验证：错题本正确记录 3 道错题

证据：`QA-S4T4-wrongbook-persist.png`

### S4-T4：6 条旧验收关键项

| 原 ID | 项目 | 结果 |
|-------|------|------|
| B-20 | 首页卡片可见不可误跳 | PASS |
| D-25 | 退出文案区分 | PASS |
| D-20 | 心数机制 | PASS |
| K-10 | 进度持久化 | PASS |
| K-10+ | 错题持久化 | PASS |
| K-14 | 0 JS 错误 | PASS |

---

## 新发现问题

无。

---

## 本轮结论

S3 agent 可做部分（S3-T2/T3/T4）全部 PASS。S4 全组（S4-T1/T2/T3/T4）全部 PASS。

**S3-T1 梯度打分**仍需用户本人完成，不阻塞其他里程碑。

### 最终回归

- `tsc -b`：0 错误
- `vitest run`：328/328 PASS（271 基线 + 57 本轮新增）
- `pm-sync-check`：待跑

### 遗留

- **S3-T1**：用户完成后回写本子计划 §八 S3 段，标记 M3 关闭
- **vite.config.ts**：增加 `test.include: ['src/**/*.test.ts']` 排除 `.research/` 目录 bun 测试
