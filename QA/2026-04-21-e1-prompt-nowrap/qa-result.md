# E1 题干折行修复 · QA 报告

> 日期：2026-04-21  
> 范围：`v0.2-1-2(E1)` · Practice 页 375px 视口题干折行验证  
> 子计划：[`Plan/v0.2/subplans/2026-04-21-e1-题干折行修复.md`](../../ProjectManager/Plan/v0.2/subplans/2026-04-21-e1-题干折行修复.md)  
> 验证方式：Playwright DOM 度量 + 渲染截图  
> 总体结论：✅ **E1 修复通过**（算式不折行目标达成；长文本折行行为可接受）

---

## 测试环境

- 视口：375 × 812px（iPhone SE/13 mini）
- 可用内容宽：303px（375 - px-4×2 - px-5×2）
- 字体：`system-ui`（浏览器实际渲染）
- 度量方式：DOM `scrollWidth vs clientWidth`（无横向溢出 = PASS）

---

## 用例结果

| ID | 子题型 | 题干示例 | 字号 | DOM 度量 | 结论 |
|---|---|---|---|---|---|
| E1-01 | round-short | 将 680 四舍五入到十位 | 27px | scroll=client=299 | ✅ PASS |
| E1-02 | round-medium | 将 12,345 四舍五入到千位 | 23px | scroll=client=299 | ✅ PASS |
| E1-03 | estimate-long | 估算 492 + 435，结果取整十数 | 20px | scroll=client=299 | ✅ PASS |
| E1-04 | compare-longest | 不计算，比较大小: 4.5 × 3.2 ○ 4.5 × 1.2 | 14px | scroll=client=299 | ✅ PASS |
| E1-05 | floor-ceil | 用去尾法将 13.7 取近似到个位 | 20px | scroll=client=299 | ✅ PASS |
| E1-06 | reverse-round | 一个一位小数四舍五入到个位后是 8，这个数最大是多少？ | 14px | scroll=client=299 | ⚠️ RISK |
| E1-07 | reverse-round-2 | 一个两位小数四舍五入保留一位小数后得 3.5，这个数最大是多少？ | 14px | scroll=client=299 | ⚠️ RISK |

---

## RISK 说明（E1-06 / E1-07）

- **现象**：reverse-round 题干为纯中文长文本（28-32 字），在 14px 最小字号下折行至 2 行（见截图）
- **是否违反 E1 规格**：**否**。E1 规格为"题干中的**算式**禁止折行"；reverse-round 题干无算式，折行点在"大是多少？"处，无算式被切断
- **用户感知**：题干仍在卡片内清晰展示，无横向溢出，内容完整可读
- **建议**：无需修复。若未来教育设计层面要求 reverse-round 题干缩短，可在生成器侧优化措辞

---

## 截图证据

- [`01-all-prompts-375px.png`](01-all-prompts-375px.png)：7 种题干在 375px 视口的实际渲染，含 303px 刻度线

---

## 收尾标准核查

| 收尾条件 | 验证结果 |
|---|---|
| 算式题型在 375px 下题干不折行（E1-01 ~ E1-05） | ✅ 全部单行 |
| 无横向溢出（scrollWidth ≤ clientWidth） | ✅ 全部通过 |
| 字号下限 ≥ 11px | ✅ 最小 14px |
| 构建纯净 | ✅ npm run build 绿 |
| vitest 全量 | ✅ 503/503 |
