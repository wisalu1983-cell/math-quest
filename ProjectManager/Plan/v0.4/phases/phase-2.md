# Phase 2：A04/A06 断联并入 A07

> 所属：v0.4-2
> 状态：✅ 已完成（2026-04-25）
> 来源：2026-04-25 题型 IA 决策 / `BL-006` / `BL-007` 局部
> 子计划：[`../subplans/2026-04-25-a04-a06-断联并入A07简便计算.md`](../subplans/2026-04-25-a04-a06-断联并入A07简便计算.md)
> 样题模拟：[`2026-04-25-a07-新地图完整模拟题目清单.md`](./2026-04-25-a07-新地图完整模拟题目清单.md)

---

## 目标

取消玩家体验层的「运算律」「括号变换」两个独立大题型，把 A07 会用到的相关能力迁入 A07「简便计算」低档知识点 lane。原 A04/A06 的所有子题型仍保留训练价值，但 A04/A06 作为大题型从新主链路彻底断联，不再作为玩家可见题型、独立星级、进阶入口、统计入口或段位赛主轴。

## 范围

| 子项 | 内容 | 备注 |
|---|---|---|
| 2.1 | 玩家可见题型从 8 个收敛为 6 个 | A04/A06 仅保留 legacy 数据兼容 |
| 2.2 | A07 低档新增「运算律」「括号变换」知识点 lane，并保留原 A07 低档基础应用 lane | A04/A06 lane 覆盖原子题型；原 A07 `bracket-normal` / `extract-factor` 不整体后移 |
| 2.3 | `multi-step` 生成器直接拥有运算律 / 括号变换能力 | 按 A07 lane / level 重写 A07-owned knowledge modules；新题 `topicId` 与 `data.kind` 均归属 `multi-step` |
| 2.4 | 运算律 lane 收口 `BL-006` 槽位误导和操作说明 | 原独立 A04 UX 问题随断联并入一起解决 |
| 2.5 | A04/A06 相关选项题处理 3~4 个有效干扰项 | `BL-007` 中与本迁移直接相关的部分 |
| 2.6 | 进阶 / 段位赛 / 历史错题 / 存档兼容 | A07 进阶保留原 A07 分配；段位赛条件移除 A04/A06；旧进度不折算；旧错题/历史不参与新段位复习；存档版本升级到 v5 |

## 不纳入本 Phase

| 子项 | 去向 |
|---|---|
| A03 竖式难度排查与 `difficulty=4-5` 的 `2位数 × 2位数` 档位分布 | Phase 3 |
| 其他题型的选项干扰项扩容 | Phase 3 |
| `BL-008` 重复题目诊断 | Phase 3 |
| `BL-005.2` 进位格三档规则 | Phase 4 |
| `BL-003` compare tip 补证 | Phase 4 |
| Practice 状态重置 | Phase 5 / 已完成 |

## 进入条件

- 读 [`../subplans/2026-04-25-a04-a06-断联并入A07简便计算.md`](../subplans/2026-04-25-a04-a06-断联并入A07简便计算.md)
- 读 `generator-redesign-v2.md` 中 A04/A06/A07 的旧边界，确认本 Phase 是玩家可见 IA 改动，不是删除能力
- 读 `gamification-phase2-advance-spec.md` 与 `rank-match-phase3-implementation-spec.md`，确认隐藏题型后星级和段位赛范围如何同步
- 读 `repository/local.ts` 存档版本迁移原则，确认不使用 `clearAll()`
- 开工前确认子计划 §七 D1-D5：生成器 ownership、`PlayerVisibleTopicId`、v5 迁移、Campaign 三 lane 验收、subtype namespace 已进入实现任务

## 收尾条件

- [x] Home / Campaign / Advance / Profile / WrongBook / History / SessionSummary / Rank 相关入口均不再把 A04/A06 作为玩家独立题型展示
- [x] A07 低档能进入「运算律」「括号变换」lane，且覆盖原 A04/A06 全部子题型
- [x] 原 A07 低档基础应用子题型仍留在低档
- [x] A07 进阶模式保留原 A07 子题型分配，不混入 A04/A06 知识点复盘池
- [x] 段位赛入场条件、资格缺口提示、主考排程和复习范围均不再要求或展示 A04/A06
- [x] 新生成的知识点题 `topicId` 与 `data.kind` 均归属「简便计算」
- [x] `CURRENT_VERSION` 递增到 5，`migrateV4ToV5` 保留 legacy 数据并作废含 A04/A06 隐藏题型的未完成段位赛 / 可恢复赛局
- [x] A07 吸收的原 A04/A06 子题型全部使用 `law-*` / `bracket-*` namespace；A07 自身诊断题使用 `simplify-error-diagnose`，不出现裸 `error-diagnose`
- [x] 旧 A04/A06 历史数据不丢失，启动不清空存档
- [x] 旧 A04/A06 进度不折算到 A07 lane；旧 A04/A06 错题 / 历史不参与新段位赛复习
- [x] A07 S1 三条 lane 通过真实游戏流的桌面与手机竖屏视觉 QA
- [x] `npm test -- --run` 和 `npm run build` 通过
- [x] QAleader 三层 QA 完成；QA run 原始产物不入库，只在本 Phase / 子计划记录结论

## 验收结论（2026-04-25）

- 自动化：Phase2 定向测试 5/5 files、27/27 tests 通过；采纳 review 后定向回归 3/3 files、120/120 tests 通过；全量 Vitest 48/48 files、672/672 tests 通过。
- 构建：`npm run build` 通过。
- 静态检查：新增 Phase2 文件 `eslint` 通过；仓库全量 `npm run lint` 仍有既有 lint 债（React hooks 规则、旧测试 `any` 等），不属于本 Phase 新增阻塞。
- 浏览器拟真：本地 `http://127.0.0.1:5174/` 正式游戏流通过；首页展示 6 个玩家可见题型；A07「简便计算」地图展示「运算律 / 括号变换 / 基础简便应用」三条低档 lane；第一关可生成 A07 归属的运算律题，console error 为 0。
