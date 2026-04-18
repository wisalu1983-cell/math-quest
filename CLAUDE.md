# math-quest CLAUDE.md

项目专属指引。渐进式披露：主文件只放高频约束，低频细节走索引。

---

## Session 启动检查清单

1. 读 `ProjectManager/Overview.md`，确认当前主计划/子计划与待解决问题
2. 若任务涉及 `ProjectManager/**.md`、生成器源码、`src/constants/advance.ts`、规格/档位/难度/关卡等跨系统维度 → **开工前 + 收尾前必跑** `pm-sync-check`
3. 纯闲聊、纯查阅代码、纯样式微调可豁免（完整豁免规则见 `.cursor/rules/pm-sync-check.mdc`）

---

## ProjectManager 更新机制（硬约束）

目录入口：`ProjectManager/Overview.md`（进展总览）、`ProjectManager/ISSUE_LIST.md`（完整 Issue 清单）、`ProjectManager/Plan/README.md`（计划索引）、`ProjectManager/Specs/_index.md`（规格索引）、`ProjectManager/Reports/`、`ProjectManager/QA/<date>-<tag>/`。

**完成任务后立即更新（不能等 session 结束）：**

| 发生什么 | 更新哪里 |
|---------|---------|
| 完成一个计划/阶段 | `Plan/README.md` 对应条目状态改为 ✅ |
| 发现新问题 | `ISSUE_LIST.md` 追加条目，同步到 `Overview.md` |
| 关闭一个 Issue | `ISSUE_LIST.md` 标记，`Overview.md` 更新清单 |
| 新建设计规格 | 放入 `Specs/`，在 `_index.md` 和 `Plan/README.md` 添加索引 |
| 新建实施计划 | 放入 `Plan/`，在 `Plan/README.md` 添加索引 |
| 真题库题数变化 | `Overview.md` 更新进展表格 |
| 新建 QA 运行产物 | 放入 `QA/<date>-<tag>/`，在对应 Plan 或 Reports 里引用 |

---

## 技术栈与核心约束

- React 19 + TypeScript 5.9 + Vite 8 + TailwindCSS v4（`@tailwindcss/vite` 插件）
- 状态管理：Zustand 5，**拆两文件**：
  - `src/store/index.ts` → `useUserStore` / `useSessionStore` / `useUIStore`
  - `src/store/gamification.ts` → `useGameProgressStore`
  - 注意：没有 `useProgressStore`（旧名，已废弃）
- 路径别名：`@/` → `src/`
- 数学渲染 KaTeX；表达式/等价性判定 mathjs；动画 Framer Motion；图表 Recharts；音频 Howler；ID nanoid；日期 date-fns
- 持久化：localStorage（`src/repository/local.ts`）
- `react-router-dom` 已安装但**禁用**，页面路由统一用 `useUIStore.currentPage` 驱动

---

## 常用命令

```bash
# 开发
npm run dev          # 启动开发服务器 (localhost:5173)
npm run build        # tsc -b && vite build
npm run lint         # ESLint
npm run preview

# 测试
npx vitest                                                # watch
npx vitest run                                            # 单次
npx vitest run src/engine/generators/generators.test.ts   # 单文件

# 项目管理文档一致性校验（开工/收尾前必跑）
npx tsx scripts/pm-sync-check.ts

# Playwright（首次需安装）
python -m playwright install chromium
```

---

## 架构速查

实时文件清单用 `ls`/Glob 查，这里只列层级语义和**容易踩坑的事实**。

```
src/
├── App.tsx              根组件，按 useUIStore.currentPage 切页（非 react-router）
├── types/               核心类型 + gamification 类型（CampaignMap / AdvanceSlot / GameSessionMode）
├── constants/           TOPICS / DIFFICULTY_TIERS / CAMPAIGN_MAX_HEARTS / campaign 地图 / advance 常量
├── store/               拆两文件（见技术栈）
├── repository/local.ts  localStorage CRUD
├── utils/               a11y 等共享工具
├── engine/              题目生成与校验三块：
│   ├── index.ts             generateQuestion / generateMixedQuestions / pickSubtype
│   ├── advance.ts           buildAdvanceSlots / 心→星映射
│   ├── answerValidation.ts  数值/多选/多空/表达式/方程等价性
│   └── generators/          8 个 A 领域生成器（v2.2 已全部重写）
├── components/          UI 组件库（VerticalCalcBoard / DecimalTrainingGrid 是核心交互）
└── pages/               页面组件
```

**踩坑提醒：**
- `src/pages/TopicSelect.tsx` 是**空壳**（已被 `CampaignMap` 替代），不要往里加逻辑
- `User.grade`、`Question.xpBase` 是**已废弃字段**，新代码不要依赖
- 生成器是纯函数，签名 `{ difficulty, id?, subtypeFilter? } → Question`，不要引入副作用
- 子题型过滤走 `CampaignLane.subtypeFilter` + `pickSubtype()`，会重新归一化权重

---

## 关键设计决策

### 难度体系
- 难度值 1-10，映射三档：普通 (1-5) / 困难 (6-7) / 魔王 (8-10)
- **基准：上海市五年级小学毕业生小升初标准 = 普通档**，`difficulty=5` 对应毕业考试水平
- 不区分年级

### 游戏化三层（`GameSessionMode`）
- `campaign` — **闯关**（当前主力）：stage / lane / level 结构，心数固定 3（`CAMPAIGN_MAX_HEARTS`），含 Boss 关
- `advance` — **进阶**（Phase 2 已上线）：闯关全通后解锁，session 开始时预生成 20 道题槽位，心→星累积，受 `TOPIC_STAR_CAP` 封顶
- `rank-match` — **段位赛**（Phase 3 未启动）
- 额外：`wrong-review` 错题本复习
- 进度统一走 `GameProgress`（`useGameProgressStore`），旧 `UserProgress` 已废弃

---

## 扩展阅读（低频索引）

| 想了解 | 去哪里 |
|---|---|
| 当前主计划 / 子计划 / Issue 全貌 | `ProjectManager/Overview.md` + `ProjectManager/ISSUE_LIST.md` |
| 历史计划与设计规格 | `ProjectManager/Plan/README.md` · `ProjectManager/Specs/_index.md` |
| pm-sync-check 6 项检查细节与使用约束 | `.cursor/rules/pm-sync-check.mdc` |
| 真题参考库（525 题目标、录入规范、主题划分） | `reference-bank/README.md` · `reference-bank/CONTRIBUTING.md` |
| 生成器 v2.2 规格 / 难度档位 / 子题型桶 | `ProjectManager/Specs/` 下 `2026-04-17-generator-redesign-v2.md` 等 |
| QA 流程规范 / 自检 / 原始产物 | `QA/qa-leader-canonical.md` · `.qa-artifacts/` · `ProjectManager/QA/` |
| 人工验证题库（当前 v2） | `ProjectManager/human-verification-bank-v2.md` |
| UI 审计与设计评审 | `.ui-design/audits/` · `.ui-design/reviews/` |
| 用户手册 / 对外测试报告 | `MANUAL.md` · `TEST_CASES.md` · `TEST_REPORT.md` |
