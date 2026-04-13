# math-quest CLAUDE.md

项目专属指引。

---

## 项目管理规则（每次必须执行）

### ProjectManager 目录结构

所有项目管理文档统一存放于 `ProjectManager/`：

```
ProjectManager/
├── Overview.md        # 项目概览：目标 + 进展概况 + Issue 清单（四要素入口）
├── ISSUE_LIST.md      # 待解决问题清单（完整版）
├── Plan/
│   ├── README.md      # 计划汇总索引（含所有计划状态）
│   └── *.md           # 各阶段实施计划
├── Specs/
│   └── *.md           # 设计规格文档（计划的前置设计）
└── Reports/
    └── *.md           # 调研/审视报告
```

### 更新机制

**新 session 开始时：** 读取 `ProjectManager/Overview.md`，了解当前目标、进展和待解决问题。

**完成任务后立即更新（不能等 session 结束）：**

| 发生什么 | 更新哪里 |
|---------|---------|
| 完成一个计划/阶段 | `Plan/README.md` 对应条目状态改为 ✅ |
| 发现新问题 | `ISSUE_LIST.md` 追加条目，同步到 `Overview.md` |
| 关闭一个 Issue | `ISSUE_LIST.md` 标记，`Overview.md` 更新清单 |
| 新建设计规格 | 放入 `Specs/`，在 `Plan/README.md` 添加索引 |
| 新建实施计划 | 放入 `Plan/`，在 `Plan/README.md` 添加索引 |
| 真题库题数变化 | `Overview.md` 更新进展表格 |

---

## 技术栈

- React 19 + TypeScript 5.9 + Vite 8
- 状态管理: Zustand 5
- 样式: TailwindCSS v4（通过 @tailwindcss/vite 插件）
- 数学渲染: KaTeX
- 动画: Framer Motion
- 音频: Howler.js
- 图表: Recharts
- 数据持久化: localStorage（通过 `src/repository/local.ts`）
- 路径别名: `@/` → `src/`

---

## 常用命令

```bash
# 开发
npm run dev          # 启动开发服务器 (localhost:5173)
npm run build        # TypeScript 编译 + Vite 构建 (tsc -b && vite build)
npm run lint         # ESLint 检查
npm run preview      # 预览生产构建

# 测试
npx vitest           # 运行单元测试
npx vitest run       # 单次运行（不 watch）
npx vitest run src/engine/generators/generators.test.ts  # 运行单个测试文件

# Playwright（首次需安装浏览器）
python -m playwright install chromium
```

---

## 架构

```
src/
├── App.tsx              # 根组件，基于 useUIStore 的页面状态路由（非 react-router）
├── main.tsx             # 入口
├── types/index.ts       # 所有类型定义（Question, TopicId, UserProgress, Achievement 等）
├── constants/index.ts   # 等级定义、成就列表、XP 计算公式、主题元数据
├── store/index.ts       # Zustand stores（useUserStore, useProgressStore, useUIStore, useSessionStore）
├── repository/local.ts  # localStorage CRUD 封装
├── engine/              # 题目生成引擎
│   ├── index.ts         # generateQuestion() / generateMixedQuestions() 分发器
│   └── generators/      # 8 个主题生成器（每个主题一个文件）
│       ├── mental-arithmetic.ts   # 基础计算（口算 + 运算顺序）
│       ├── number-sense.ts        # 数感估算
│       ├── vertical-calc.ts       # 竖式笔算
│       ├── operation-laws.ts      # 运算律
│       ├── decimal-ops.ts         # 小数计算
│       ├── bracket-ops.ts         # 括号变换
│       ├── multi-step.ts          # 简便计算
│       └── equation-transpose.ts  # 方程移项
├── components/
│   ├── VerticalCalcBoard.tsx     # 竖式计算交互组件（支持小数点列）
│   └── DecimalTrainingGrid.tsx   # 小数乘除法训练格（难度分级反馈）
└── pages/               # 10 个页面组件
    ├── Onboarding.tsx    # 首次注册（昵称 + 年级）
    ├── Home.tsx          # 首页（主题列表 + 每日目标）
    ├── TopicSelect.tsx   # 难度与题数选择
    ├── Practice.tsx      # 答题页面（核心交互）
    ├── SessionSummary.tsx # 练习结算
    ├── Progress.tsx      # 学习进度总览
    ├── History.tsx       # 练习历史
    ├── SessionDetail.tsx # 单次练习详情
    ├── WrongBook.tsx     # 错题本
    └── Profile.tsx       # 个人资料与设置
```

---

## 真题参考库

```
reference-bank/
├── README.md              # 题库总览（14主题 × 2难度档，目标 525 题）
├── CONTRIBUTING.md        # 录入格式规范
├── CHANGELOG.md           # 变更日志
├── 题库-五年级上/          # 试卷/练习/真题（按教材单元）
├── 题库-五年级下/          # 试卷/练习/真题（按教材单元）
├── 题库-其他/              # 未分类试卷
├── curriculum/            # 沪教版课程目录（1-6年级完整）
├── sources/               # 数据来源索引 + 原始抓取数据
├── A-numbers-and-operations/  # 领域A：数与运算（A01-A09）
├── B-geometry/                # 领域B：图形与几何（B01-B02）
├── C-word-problems/           # 领域C：应用题（C01-C02）
└── D-statistics/              # 领域D：统计（D01）
```

- `题库-*`：从 21cnjy.com 抓取的试卷原文，按教材单元分文件
- `A-*` ~ `D-*`：按主题整理的精选真题，含生成器参照标注
- 题库定位：**设计参考资料**，用于校准生成器，不直接供用户出题
- 当前提取进展见 `ProjectManager/Overview.md`

---

## 关键设计决策

- 页面路由用 Zustand `useUIStore.currentPage` 状态驱动，不使用 react-router-dom（虽然已安装）
- 题目生成是纯函数（`engine/generators/`），接受 `{difficulty, id}` 返回 `Question` 对象
- 难度值 1-10，映射到三档：普通(1-5)、困难(6-7)、魔王(8-10)
- XP 系统：基础 XP + 连击加成 + 速度奖励 + 全对奖励
- 已知问题和待办事项见 `ProjectManager/Overview.md`
