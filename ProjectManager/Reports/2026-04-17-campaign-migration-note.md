# 闯关结构重构存档迁移说明

> 创建：2026-04-17  
> 关联 issue：`ISSUE-057`（游戏化结构/P1）  
> 关联代码：`src/constants/campaign.ts`、`src/repository/local.ts`

---

## 1. 背景

ISSUE-057 的初始范围只是把 A01/A04/A08 三个 2 档题型的关卡分段对齐（去掉原"高档关"）。审计过程中发现 8 个题型里有 7 个存在同一个系统性问题：

- 原设计中，除 A06 外的所有题型最后一段普通关（S3 综合/高阶）**没有任何 `subtypeFilter`**，实质上只是"Boss 的弱化版"，违反了"普通关聚焦知识点、Boss 关综合考察"的设计理念。
- 且 A04 S2 的 `subtypeFilter`（`split-path-*`）指向 v2.2 生成器已废弃的 tag，当场失效。

用户确认理念后扩范围：**8 个题型全部按"普通关聚焦 + 唯一 Boss 综合"原则重划**。

---

## 2. 新旧结构差异速览

| 题型 | 旧结构 | 新结构 | 关卡数变化 |
|------|--------|--------|-----------|
| A01 mental-arithmetic   | 低/中/高 + Boss (4段, 12关) | 档1/档2 + Boss (3段, 11关)  | 12 → 11 |
| A02 number-sense        | 低/中/高 + Boss (4段, 15关) | 低/中/高 + Boss (4段, 15关) | 15 → 15（S3 综合→聚焦估算+比较深化）|
| A03 vertical-calc       | 低/中/高 + Boss (4段, 12关) | 低/中/高 + Boss (4段, 12关) | 12 → 12（S3 综合→大数乘法+除法近似）|
| A04 operation-laws      | 低/中/高 + Boss (4段, 10关) | 档1/档2 + Boss (3段, 8关)   | 10 → 8 |
| A05 decimal-ops         | 低/中/高 + Boss (4段, 12关) | 低/中/高 + Boss (4段, 12关) | 12 → 12（S3 综合→循环小数+反直觉）|
| A06 bracket-ops         | 低/中/高 + Boss (4段, 10关) | 低/中/高 + Boss (4段, 10关) | 10 → 10（S3 原 division-property 已在 v2.2 降权为 0，调整为嵌套+错误诊断）|
| A07 multi-step          | 低/中/高 + Boss (4段, 14关) | 低/中/高 + Boss (4段, 13关) | 14 → 13（S3 综合→错误诊断+隐藏因数）|
| A08 equation-transpose  | 低/中/高 + Boss (4段, 11关) | 档1/档2 + Boss (3段, 9关)   | 11 → 9 |

**总 lane 数**：旧 ~54 → 新 **50**（对应 `qa-v3.test.ts` A-24 的期望值）

所有新普通关都有 `subtypeFilter`，所有 Boss 关都无 `subtypeFilter`（见 `campaign.ts` 头部注释）。

---

## 3. 迁移策略 X（已实施）

### 3.1 问题

旧 levelId（例如 `mental-arithmetic-S4-LA-L1` 老 Boss）在新结构里不存在；玩家 `GameProgress.campaignProgress.<topic>.completedLevels` 不处理就会留下孤儿记录，UI 无法正确显示已通关星星。

### 3.2 规则

实现位于 `src/repository/local.ts` 的 `migrateCampaignIfNeeded()`，在 `getGameProgress()` 读取时一次性执行并回写：

1. 遍历每个 topic 的 `completedLevels`，判断是否含"不在新 `getAllLevelIds()` 结果中的 levelId"。
2. 不含 → 不动（幂等）。
3. 含且 `campaignCompleted === true`（旧 Boss 已通） → **全关直接标记通关**，每关 `bestHearts: 3`、`completedAt = Date.now()`。
4. 含但旧 Boss 未通 → **丢弃所有无效记录**，保留仍属于新结构的 levelId；玩家从新结构里第一个未完成关继续。

### 3.3 幂等性

迁移一次后，所有 levelId 都属于新结构，后续 `getGameProgress` 调用都不会再触发。`advanceProgress` 不受影响（进阶数值由 `GameProgress.advanceProgress` 独立维护）。

### 3.4 不做的事

- 不做旧"中档关 → 新 S2" 这类精细映射（收益低、边界条件多）。
- 不改 `CURRENT_VERSION`（改了会被老 schema migration 整体清空，反而丢失 advance 等进阶数据）。
- 不广播"结构已更新"通知（前端 UI 重新渲染时自然显示新分段）。

---

## 4. 对其他系统的影响

| 系统 | 影响 | 处置 |
|------|------|------|
| `TOPIC_STAR_CAP`（A01/A04/A08=3, 其余=5） | 每关最多 3★，一题型总星数由关卡数决定。新结构下所有题型每关仍 ≤3★，单题型总星数仍 ≤TOPIC_STAR_CAP | 无需改数值 |
| Phase 2 进阶（Star/Rank 门槛） | 总星数门槛用的是 `TOPIC_STAR_CAP`，不依赖具体关卡数 | 无需改 |
| 出题分档（生成器 v2.2） | `subtypeFilter` 已全部对齐生成器现有 tag | 无需改生成器 |

---

## 5. 验证

- 单测：`npx vitest run` → 263/263 通过（含 B-09 关卡数字典、A-24 总 lane 数）。
- 浏览器验收：后续在 CampaignMap → 关卡 → Practice → 完关路径上抽样 1-2 条即可。

---

## 6. 已知限制

- `npm run build` 的 tsc 阶段有 24 个 **pre-existing** 类型错误（`BracketOpsData`/`EquationTransposeData`/`MultiStepData` 等类型字段不全），属 v2.2 生成器重构遗留，**与本次 ISSUE-057 无关**。建议单独开 issue 收口。

