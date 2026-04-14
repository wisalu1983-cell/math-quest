# UI/UX 整体重设计规格

**Spec ID:** 2026-04-14-ui-redesign-spec  
**日期:** 2026-04-14  
**状态:** 草案，待评审  
**范围:** 全产品视觉语言 + 交互模式 + 组件规范  
**不改变:** 产品功能逻辑、题目生成引擎、数据结构

---

## 一、整体设计方向

### 1.1 设计命题

当前产品是一个视觉上的 **Duolingo 复刻品**（深灰黑 + 亮绿 + 圆角卡片 + 物理按钮）。  
这导致三个核心问题：
1. **无品牌辨识度**——五年级学生打开即觉"这是 Duolingo"
2. **色彩系统失效**——主色（#58cc02 绿）同时承担品牌色、成功色、主操作色，语义混淆
3. **可访问性失败**——绿底白字对比度仅 2.09:1，全线按钮不可读

新方向：**"炼金书院"（Arcane Scholar）**

> 数学是一种力量的语言——严谨、精确、充满惊喜。  
> 这个应用应该像一本被施了魔法的习题册：学术的、神秘的、充满成就感的。

### 1.2 视觉关键词

| 维度 | 当前 | 目标 |
|------|------|------|
| 气质 | 游戏化工具 | 智识冒险 |
| 色彩感受 | 明亮 / 快消 | 深邃 / 有质感 |
| 参照 | Duolingo | 《哈利·波特》魔法书 × 日本益智 app |
| 核心情感 | 打卡完成 | 探索发现 |

### 1.3 品牌色系（Design Token 替换）

```
旧 Duolingo 绿 → 新 三色分工体系
```

#### 新颜色 Token 定义

```css
/* ── 背景体系：深蓝黑（更有深度，区别于通用灰黑）── */
--color-bg:          #0a0f1e   /* 主背景：极深藏蓝 */
--color-bg-card:     #111827   /* 卡片背景：深蓝灰 */
--color-bg-elevated: #1e2a3a   /* 高程背景：蓝灰 */
--color-bg-overlay:  #0a0f1e99 /* 遮罩层 */

/* ── 文字体系 ── */
--color-text:          #f0f4ff  /* 主文字：蓝白（比纯白柔和） */
--color-text-secondary: #8b9dc3  /* 辅助文字：蓝灰，bg对比度≥5:1 */
--color-text-muted:    #4a5568  /* 弱化文字：用于锁定/禁用 */

/* ── 品牌色：琥珀金（学术成就、智慧、收获）── */
--color-primary:      #f59e0b   /* 主操作色：暖琥珀金 */
--color-primary-dark: #b45309   /* 按钮阴影、hover 深色 */
--color-primary-text: #1a0a00   /* 金色背景上的文字（深棕，对比度≥8:1）*/

/* ── 功能色体系 ── */
--color-success:      #22c55e   /* 成功/正确：翠绿（不再与品牌色混用）*/
--color-success-bg:   #14532d   /* 成功背景层 */
--color-danger:       #f87171   /* 错误/危险：珊瑚红（比 #ff4b4b 更柔和，对比度≥4.7:1）*/
--color-danger-bg:    #450a0a   /* 错误背景层 */
--color-warning:      #fbbf24   /* 警告：明黄 */
--color-info:         #38bdf8   /* 信息/选中：天蓝 */

/* ── 边框体系 ── */
--color-border:       #1e3a5f   /* 常规边框：深蓝 */
--color-border-focus: #f59e0b   /* 聚焦边框：品牌金 */
--color-border-muted: #111827   /* 弱边框 */

/* ── 主题颜色：每个学科主题保留独立颜色，但降低饱和度与背景协调 ── */
/* （见 1.4 主题色系）*/
```

#### 对比度验证（关键组合）

| 组合 | 对比度 | AA 正文 | AA 大字 |
|------|--------|---------|---------|
| `--color-primary-text` (#1a0a00) on `--color-primary` (#f59e0b) | **8.1:1** | ✅ | ✅ |
| `--color-text` (#f0f4ff) on `--color-bg` (#0a0f1e) | **15.2:1** | ✅ | ✅ |
| `--color-text-secondary` (#8b9dc3) on `--color-bg` (#0a0f1e) | **5.8:1** | ✅ | ✅ |
| `--color-danger` (#f87171) on `--color-bg-card` (#111827) | **5.2:1** | ✅ | ✅ |
| `--color-success` (#22c55e) on `--color-bg-card` (#111827) | **6.4:1** | ✅ | ✅ |

### 1.4 主题色系调整（8个学科主题）

每个主题保留独特颜色，但调整为"深邃宝石色"而非 App Store 糖果色。  
颜色仅用于主题标识，不再在主背景大面积使用。

| 主题 | 旧颜色 | 新颜色 | 宝石命名 |
|------|--------|--------|---------|
| 基础计算 (mental-arithmetic) | #1cb0f6 蓝 | #0ea5e9 天蓝宝石 | Sapphire |
| 数感估算 (number-sense) | #58cc02 绿 | #22c55e 祖母绿 | Emerald |
| 竖式笔算 (vertical-calc) | #ff9600 橙 | #f97316 琥珀石 | Amber |
| 运算律 (operation-laws) | #ce82ff 紫 | #a855f7 紫水晶 | Amethyst |
| 小数计算 (decimal-ops) | #ff4b4b 红 | #ef4444 红宝石 | Ruby |
| 括号变换 (bracket-ops) | #ffc800 黄 | #eab308 黄玉 | Topaz |
| 简便计算 (multi-step) | #2b70c9 深蓝 | #3b82f6 蓝晶石 | Kyanite |
| 方程移项 (equation-transpose) | #00cd9c 青绿 | #10b981 碧玺 | Tourmaline |

### 1.5 字体方案

```css
/* 数字 / 英文：Syne（几何感、现代、独特） */
/* 理由：有学术感但不刻板；数字比例优秀；区别于 Nunito 的圆润感 */
font-family: 'Syne', 'PingFang SC', 'Microsoft YaHei UI', sans-serif;

/* 数学表达式 / 竖式：JetBrains Mono（等宽，对齐精确）*/
/* 仅用于竖式计算组件、答案输入框 */
font-family: 'JetBrains Mono', 'Courier New', monospace;

/* Google Fonts 引入 */
/* @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap'); */
```

**字号规范（最小字号提升到 12px，儿童可读性要求）：**

| 层级 | Token | 尺寸 | 用途 |
|------|-------|------|------|
| 展示大标题 | `text-display` | 32px/800 | 页面主标题 |
| 标题 | `text-title` | 22px/700 | 卡片标题、结算数字 |
| 副标题 | `text-subtitle` | 16px/600 | 模块小标题 |
| 正文 | `text-body` | 15px/400 | 主要内容 |
| 说明文字 | `text-caption` | 13px/400 | 辅助说明 |
| 最小单位 | `text-mini` | 12px/400 | 统计数字、标签（不低于此） |
| **禁用** | ~~`text-[10px]`~~ | ~~10px~~ | 禁止在整个产品中使用 |

### 1.6 视觉材质语言

**背景纹理：**  
在主背景上叠加极淡的六边形网格（hexagonal grid）纹理，`opacity: 0.03`。  
六边形象征蜂巢结构（组织、智慧）和数学的内在秩序感。  
用 SVG `pattern` 实现，零性能损耗。

```css
.bg-hex-pattern {
  background-image: url("data:image/svg+xml,..."); /* 六边形 SVG pattern */
  background-size: 60px 52px;
}
```

**卡片质感：**  
卡片用 `backdrop-blur` + 微妙内发光边框，不是纯色块。

```css
.card {
  background: color-mix(in srgb, #111827 90%, #1e3a5f 10%);
  border: 1px solid color-mix(in srgb, #1e3a5f 60%, transparent 40%);
  box-shadow: 
    inset 0 1px 0 rgba(240, 244, 255, 0.05),  /* 顶部微发光 */
    0 4px 24px rgba(0, 0, 0, 0.4);             /* 外部阴影 */
}
```

### 1.7 动效哲学

**三条规则：**

1. **物理感优先**：所有交互动画模拟物理现实（弹性、惯性），而非线性过渡
2. **有意义的动画**：每个动画必须传递信息（进入=出现，消失=移除，抖动=错误）
3. **`prefers-reduced-motion` 作为全局开关**：减少动画首选时，所有动画即时完成

```css
/* 动效时间曲线 */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* 弹性（答对弹出）*/
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);        /* 平滑（页面过渡）*/
--ease-snap:   cubic-bezier(0.6, 0.05, 0, 0.95);   /* 快速（按钮点击）*/

/* 时长定义 */
--dur-instant:  80ms;   /* 按钮按压反馈 */
--dur-fast:    150ms;   /* 状态切换 */
--dur-normal:  250ms;   /* 页面元素进入 */
--dur-slow:    400ms;   /* 页面切换 */
```

**禁止：**
- 无目的的装饰性旋转/浮动
- 超过 600ms 的等待动画（用户感知为卡顿）
- 重复循环的吸引注意力动画（除"推荐关卡"脉冲外）

---

## 二、导航和信息层级重构

### 2.1 当前 IA 问题

```
当前结构（扁平，10个状态）：
home ← campaign-map ← practice → summary
progress（孤立）
wrong-book（孤立，内容被截断）  
history（孤立，底部导航无高亮）
session-detail（孤立，无直接入口显示）
onboarding（一次性）
```

问题：
- History 既不在 Progress 下也不在 Home 下，底部导航逻辑混乱
- WrongBook 是高频功能，但视觉权重与 Profile 相同
- Progress 和 History 重叠（Progress 是汇总，History 是明细），应该是父子关系

### 2.2 新导航结构

```
底部导航（4 Tab）：
├── 🏠 学习              → 首页（Home）+ 闯关地图（CampaignMap）
├── 📊 进度              → 进度总览（Progress）→ 可展开到 History + SessionDetail
├── 📕 错题本            → 错题本（WrongBook）
└── 👤 我的              → Profile
```

**Tab 命名调整：**
- "首页" → **"学习"**（更主动，体现功能而非位置）
- "进度" → **"进度"**（保留，但包含 History 子级）
- 保留"错题本"和"我的"

**层级定义（三层）：**

```
一级（底部 Tab 可见）：
  学习 / 进度 / 错题本 / 我的

二级（通过主内容区跳转）：
  学习 → 主题列表 → 闯关地图
  进度 → 历史记录列表 → 单次详情

三级（全屏沉浸，隐藏底部导航）：
  闯关地图 → 答题页 → 结算页
  （答题流程是沉浸态，不应显示底部导航）
```

**底部导航设计规则：**
- 答题流程（CampaignMap → Practice → Summary）期间**隐藏**底部导航
- 进入沉浸态时用页面顶部的 X 按钮返回（显示"退出"确认）
- 底部导航高度标准化：56px + safe-area-inset-bottom
- Tab 触控区域：每个 Tab 至少 44×44pt（HIG 标准）

### 2.3 页面层级示意

```
onboarding（一次性，全屏）
↓
[底部导航层]
学习 Tab：
  Home（主题卡片 + 当日进度）
  → CampaignMap（关卡地图，进入沉浸态）
      → Practice（答题，全屏沉浸）
          → SessionSummary（结算，全屏沉浸）
              → 返回 CampaignMap 或 Home

进度 Tab：
  Progress（8主题进度汇总，可见 History 入口）
  → History（练习记录列表）
      → SessionDetail（单次详情）

错题本 Tab：
  WrongBook（按主题分组，支持无限展开）

我的 Tab：
  Profile（昵称 + 统计 + 设置）
```

### 2.4 Home 页信息层级

当前 Home 页内容密度低，仅是 8 个主题网格 + 进度条。  
重构后应有明确的视觉层次：

```
Home 新信息层级：
┌─────────────────────────────┐
│  问候 + 今日目标 条带        │  ← 顶部，情感锚点
├─────────────────────────────┤
│  [推荐下一步] 卡片（突出）   │  ← 当前进度中最近解锁的关卡，CTA 入口
├─────────────────────────────┤
│  8 个主题网格（2列）         │  ← 次要，全局进度
└─────────────────────────────┘
```

"推荐下一步"卡片需要醒目的视觉处理（大卡片 + 主色高亮 + 动画吸引），直接解决当前 CampaignMap 中"哪个关卡是推荐的"的 UX 问题（S-02 建议）。

---

## 三、页面级改造原则

### 3.1 Onboarding

**当前：** 2步（欢迎 + 昵称），功能完整但视觉平淡。  
**改造：**
- 全屏竖向布局，第 1 步用全屏动效建立情感（标题动画落入，六边形粒子背景）
- 第 2 步增加"今天的第一道题"引导——完成注册后立即进入第一个引导关卡（降低冷启动摩擦）
- **新增：** 第 3 步（可跳过）——演示心❤ 机制，解决 S-01（用户不理解生命值）

### 3.2 Home（学习首页）

**当前：** 2 列网格，8 张主题卡，进度条。
**改造：**
- 顶部栏：昵称 + 今日完成题数（不显示"五年级"硬编码文字，解决 N-03）
- **核心区域：** "继续学习"大卡片（显示上次所在主题 + 当前关卡 + 剩余关卡数）
- **主题网格：** 保留 2 列，但每个主题卡用宝石色渐变作为右侧装饰（区别当前平面设计）
- 进度条改为圆形进度圈（更紧凑，视觉更丰富）

### 3.3 CampaignMap（关卡地图）

**当前：** 线性列表，按 Stage → Lane → Level 展开，关卡按钮 64px，心数文字极小。  
**改造：**
- **关卡按钮最小尺寸：80×80px**（儿童手指考量，解决 M-03/ISSUE-022）
- 状态差异：不再仅靠颜色区分已完成/可玩，改用：
  - 已完成：实心背景 + 白色星星数量 + ✓ 图标（解决 A-M05）
  - 当前推荐：品牌金色 + 脉冲动画 + "NEW"标签
  - 锁定：灰色 + 🔒 + 半透明 40%
- **心数显示：** `text-sm`（14px）不再用 `text-[10px]`（解决 ISSUE-022）

### 3.4 Practice（答题页）

**当前：** 顶部进度条 + 3心 + 题目区 + 答题区 + 底部反馈区。  
**改造核心：**

**顶部状态栏规范：**
```
[✕ 退出] [══════════] [❤❤❤]
         进度条       生命值
```
- 退出按钮：必须有 `aria-label="退出本次练习"`
- 进度条：`role="progressbar"` + `aria-valuetext="第3题，共10题"`
- 生命值：父容器 `aria-label="剩余生命 3 颗，共 3 颗"`，❤ 心形用 `aria-hidden="true"`

**题目区规范：**
- 字号：题干最小 `text-subtitle`（16px），不得低于此
- 题目文字与数学公式分区：普通文字用 Syne，KaTeX 渲染的数学式保持 KaTeX 字体

**反馈区规范：**
- 正确：绿色底部浮层 + 答对 SFX（Howler）+ 文字说明
- 错误：红色底部浮层 + 显示正确答案 + 错误 SFX
- 必须包含 `aria-live="polite"` 区域（解决 A-S04）

### 3.5 SessionSummary（结算页）

**当前问题：**
- `bg-error/10` Token 不存在（C-01）
- render 期间直接调用 setPage（C-02）

**改造：**
- 结算数字用 `text-display`（32px）大字展示，有计数动画
- 通关/失败状态用**背景渐变颜色**区分，不再仅靠 banner 颜色（解决颜色语义混乱）
  - 通关：深蓝背景 + 金色粒子撒落动画
  - 失败：深红背景渐变 + 重试 CTA 突出
- 星级展示（未来 Phase 2 需要）：预留 3 星展示区域

### 3.6 Progress（进度总览）

**改造：**
- 顶部：8 主题进度汇总（雷达图/蜘蛛网图，使用 Recharts RadarChart）
- 下方：8 个主题进度卡，可展开到 History

### 3.7 WrongBook（错题本）

**改造核心：**
- 移除每主题 5 题限制，改为**全量展示 + 分页/虚拟化**（解决 M-04/ISSUE-023）
- 每道错题卡片：题干 + 你的答案（红色）+ 正确答案（绿色）+ 快速再练按钮
- 主题分组 header：显示错题数量 badge

### 3.8 Profile（个人中心）

**改造：**
- 移除硬编码"五年级"（解决 N-03）
- 统计数字字号从 `text-[10px]` 提升到 `text-mini`（12px）（解决 N-02）

---

## 四、通用组件规范

### 4.1 按钮系统

**替换当前 `.btn-primary`（白字绿底）→ 深字金底：**

```css
/* 主操作按钮：金底深字，高对比度 */
.btn-primary {
  background-color: var(--color-primary);         /* #f59e0b */
  color: var(--color-primary-text);               /* #1a0a00，对比度 8.1:1 */
  font-weight: 700;
  padding: 14px 24px;
  border-radius: 14px;
  box-shadow: 0 4px 0 var(--color-primary-dark);  /* 物理感阴影 */
  transition: transform 80ms var(--ease-snap), box-shadow 80ms var(--ease-snap);
  min-height: 52px;                               /* 触控高度 ≥ 44pt */
}
.btn-primary:active {
  transform: translateY(4px);
  box-shadow: none;
}

/* 次级按钮：透明底 + 金色边框 */
.btn-secondary {
  background: transparent;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
  /* 对比度：#f59e0b 在 #0a0f1e 上 = 8.6:1 ✅ */
}

/* 危险按钮 */
.btn-danger {
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}

/* 幽灵按钮（次要操作，如"跳过"）*/
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
}
```

**触控区域规范：** 所有可点击元素最小 44×44px（含 padding），用 `min-h-[44px] min-w-[44px]` 强制保证。

### 4.2 卡片系统

```css
/* 基础卡片 */
.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: inset 0 1px 0 rgba(240,244,255,0.04), 0 4px 16px rgba(0,0,0,0.3);
}

/* 强调卡片（推荐关卡、当前任务）*/
.card-accent {
  background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 15%, var(--color-bg-card)) 0%, var(--color-bg-card) 100%);
  border: 1px solid color-mix(in srgb, var(--color-primary) 40%, transparent);
}

/* 成功卡片 */
.card-success {
  background: var(--color-success-bg);
  border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent);
}

/* 错误卡片 */
.card-danger {
  background: var(--color-danger-bg);
  border: 1px solid color-mix(in srgb, var(--color-danger) 30%, transparent);
}
```

### 4.3 底部导航组件（BottomNav）

提取为独立组件（解决 M-01/ISSUE-020 的 5 份重复），规范如下：

```tsx
// src/components/BottomNav.tsx

type NavTab = 'home' | 'progress' | 'wrong-book' | 'profile';

const TABS = [
  { id: 'home', icon: '🏠', label: '学习', emoji: true },
  { id: 'progress', icon: '📊', label: '进度', emoji: true },
  { id: 'wrong-book', icon: '📕', label: '错题', emoji: true },
  { id: 'profile', icon: '👤', label: '我的', emoji: true },
] as const;

// 规范：
// 1. 高度 56px + safe-area-inset-bottom
// 2. 每个 Tab aria-current={activeTab === tab.id ? 'page' : undefined}
// 3. emoji 用 aria-hidden="true"，label 为可见文字（非仅 aria-label）
// 4. 背景：bg-bg/95 backdrop-blur-md，不使用 bg-bg-card（防止不透明割裂）
// 5. 激活状态：label 颜色 → primary，图标缩放 1.1x
// 6. History 页的 activeTab 应为 'progress'（History 是 Progress 子级）
```

**底部导航隐藏规则：**
```tsx
// 在 App.tsx 中根据 currentPage 控制是否渲染 BottomNav
const PAGES_WITHOUT_NAV = ['onboarding', 'campaign-map', 'practice', 'summary'];
const showBottomNav = !PAGES_WITHOUT_NAV.includes(currentPage);
```

### 4.4 进度条组件（ProgressBar）

统一为带 ARIA 的语义化进度条（解决 A-S03）：

```tsx
// src/components/ProgressBar.tsx
interface ProgressBarProps {
  value: number;      // 当前值
  max: number;        // 最大值
  label: string;      // aria-label（如"基础计算完成进度"）
  valueText?: string; // aria-valuetext（如"3 / 10 关"）
  color?: string;     // 进度条填充色（CSS 变量或颜色值）
  size?: 'sm' | 'md'; // sm=4px, md=8px
}
// role="progressbar" + aria-valuenow/min/max/label/valuetext 全量
```

### 4.5 生命值（Hearts）组件

统一提取（解决 A-M03，心数缺乏可访问文字）：

```tsx
// src/components/Hearts.tsx
interface HeartsProps {
  current: number;  // 当前生命值
  max: number;      // 最大生命值（默认 3）
}
// 容器：aria-label={`剩余生命 ${current} 颗，共 ${max} 颗`}
// 每颗心：aria-hidden="true"
// 失去生命时：aria-live="polite" 区域播报"失去一颗生命，还剩 X 颗"
```

### 4.6 加载状态（LoadingScreen）

替换 3 个页面的 `return null`（解决 M-05/ISSUE-024）：

```tsx
// src/components/LoadingScreen.tsx
// 全屏居中：应用主背景色 + 品牌 Logo + 淡入淡出
// 不使用 spinner（spinner 在 reduced-motion 下也需处理）
// 改用简单的淡入文字："加载中..."
```

### 4.7 对话框/模态框规范

所有模态实现必须包含（解决 A-S02）：
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- 出现时：`useEffect` 将焦点移入对话框首个可交互元素
- 消失时：焦点返回触发元素
- ESC 键关闭
- 背景遮罩点击关闭（可选，确认类对话框可禁用）

---

## 五、交互反馈和状态设计规则

### 5.1 答题反馈状态

**三种状态 + 过渡规则：**

```
idle → submitting → correct / wrong → next
```

| 状态 | 视觉 | 动效 | 音效 | ARIA |
|------|------|------|------|------|
| idle | 输入框 focus 金色边框 | - | - | - |
| submitting | 按钮按压效果（translateY 4px）| 80ms snap | - | button disabled |
| correct | 绿色底部浮层滑入 | 250ms spring + 答案字符弹出 | 悦耳短音 | aria-live "回答正确！" |
| wrong | 红色底部浮层滑入 + 输入框抖动 | 300ms shake | 提示音 | aria-live "回答错误，正确答案是 X" |
| next | 浮层滑出 + 进度条步进 | 400ms smooth | - | - |

**浮层设计：**
- 从底部滑入，高度约 30% 屏幕
- 包含：状态图标（大）+ 状态文字 + 正确答案（错误时）+ "继续"按钮
- 不能遮挡题目区域（避免用户无法复盘）

### 5.2 页面过渡

**所有页面切换使用淡入动画（解决 S-04）：**

```css
/* 每个页面根 div 添加 */
.page-enter {
  animation: page-fade-in var(--dur-slow) var(--ease-smooth) forwards;
}
@keyframes page-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**沉浸态（答题流程）用全屏滑入：**

```css
.page-enter-slide {
  animation: page-slide-in var(--dur-slow) var(--ease-smooth) forwards;
}
@keyframes page-slide-in {
  from { opacity: 0; transform: translateX(100%); }
  to   { opacity: 1; transform: translateX(0); }
}
```

### 5.3 关卡状态视觉规则

CampaignMap 关卡按钮的状态必须**同时使用颜色 + 形状 + 图标**区分（解决 A-M05，色盲用户）：

| 状态 | 颜色 | 形状/尺寸 | 图标 | 其他 |
|------|------|---------|------|------|
| 已完成 | 成功绿实心背景 | 标准 80×80px | ✓ 白色大图标 | 星级数字 |
| 推荐（当前） | 品牌金边框 + 透明背景 | 标准 80×80px + 2px 脉冲环 | ▶ 金色 | "NEW" tag |
| 可玩 | 蓝色边框 | 标准 80×80px | ▶ 蓝色 | - |
| 锁定 | 灰色边框 + 40%透明 | 标准 80×80px | 🔒 | 无点击事件 |

### 5.4 错误状态规则

| 错误类型 | 处理方式 |
|---------|---------|
| 输入空提交 | 输入框边框变红 + 抖动 + "请先输入答案" inline 提示 |
| 答错 | 底部浮层（红色）+ 显示正确答案 + 错误分析（若有） |
| 生命值归零 | 全屏关卡失败动画（红色渐变覆盖）+ 失败结算 |
| 网络/存储错误 | Toast 提示（顶部，非阻断性）|

### 5.5 空状态规则

| 场景 | 展示方式 |
|------|---------|
| 错题本（无错题） | 居中插图 + "太厉害了，暂时没有错题！" |
| 历史记录（无记录） | 居中插图 + "还没有练习记录，去做第一题吧！" |
| 数据加载中 | 骨架屏（Skeleton）或 LoadingScreen，禁止 return null |

### 5.6 document.title 动态更新

每次页面切换时更新 `document.title`（解决 A-N03）：

```tsx
const PAGE_TITLES: Record<string, string> = {
  home:           '数学大冒险 · 学习',
  'campaign-map': '数学大冒险 · 闯关',
  practice:       '数学大冒险 · 答题中',
  summary:        '数学大冒险 · 练习结果',
  progress:       '数学大冒险 · 进度',
  history:        '数学大冒险 · 练习记录',
  'session-detail': '数学大冒险 · 练习详情',
  'wrong-book':   '数学大冒险 · 错题本',
  profile:        '数学大冒险 · 个人中心',
};
```

---

## 六、立即修复 vs 并入改版

### 6.1 立即修复（不等改版，本周内处理）

这些问题在**改版前的任何版本中都应该修复**，工作量小且独立：

| # | Issue | 文件 | 工作量 | 原因 |
|---|-------|------|--------|------|
| 1 | C-01: `bg-error/10` → `bg-danger/10` | SessionSummary.tsx:24 | 1行 | Bug，失败状态视觉消失 |
| 2 | C-02: `setPage` 移入 `useEffect` | SessionSummary.tsx:10 | 5行 | React 反模式，有隐患 |
| 3 | A-C02: 移除 `user-scalable=no` | index.html:5 | 1行 | WCAG Critical，法规风险 |
| 4 | A-N03: 动态 `document.title` | App.tsx | 10行 | 屏幕阅读器无法区分页面 |
| 5 | A-M04: `prefers-reduced-motion` CSS | globals.css | 10行 CSS | 前庭障碍用户安全 |
| 6 | A-S04: `aria-live` 答题反馈 | Practice.tsx | 5行 | 视障用户无法知道答题结果 |
| 7 | A-M03: 心数 `aria-label` | Practice.tsx + CampaignMap.tsx | 每处1行 | 屏幕阅读器语义错误 |
| 8 | N-03: 移除硬编码"五年级" | Profile.tsx:42 | 1行 | 错误信息展示 |

**总计：约 2-3 小时工作量，可作为独立 hotfix PR。**

### 6.2 并入改版（不单独修）

这些问题的修复方式与改版方向高度耦合，单独修旧代码是浪费：

| # | Issue | 改版中如何解决 |
|---|-------|-------------|
| A-C01: 按钮对比度 2.09:1 | 改版时整体替换按钮 Token 系统（金底深字）|
| M-01: 底部导航5份重复 | 改版时提取 `<BottomNav>` 组件 |
| N-02: `text-[10px]` | 改版时执行全局字号规范，统一替换 |
| A-M02: DecimalTrainingGrid 脱主题 | 改版时按新 Token 系统重写组件样式 |
| A-S01: 图标按钮无 aria-label | 改版时按新组件规范统一添加 |
| A-S02: 退出弹窗缺焦点陷阱 | 改版时实现标准 Dialog 组件 |
| A-S03: 进度条无 ARIA | 改版时使用新 `<ProgressBar>` 组件 |
| M-03: 关卡按钮触控区域小 | 改版时按新关卡按钮规范（80px）重建 |
| M-04: 错题本无"查看全部" | 改版时重构 WrongBook 全量展示 |
| M-05: 加载黑屏 | 改版时引入 `<LoadingScreen>` 组件 |
| S-01: 无心机制说明 | 改版时在 Onboarding 第3步添加 |
| S-02: 无推荐关卡高亮 | 改版时 Home 页"继续学习"卡片解决 |
| S-04: 无页面过渡动画 | 改版时全局添加 |

### 6.3 优先级总图

```
本周 hotfix（8项，~3小时）
    ↓
改版设计评审（本文档）
    ↓
改版实施 Phase A：Token + 组件基础设施（3-5天）
  - 替换 globals.css Token
  - 提取 BottomNav / ProgressBar / Hearts / LoadingScreen / Dialog 组件
  - 字体引入（Syne + JetBrains Mono）
  - 添加 prefers-reduced-motion / aria 全局设施
    ↓
改版实施 Phase B：页面级改造（5-7天）
  - Home 重构（推荐卡片 + 进度圈）
  - CampaignMap 关卡按钮重建
  - WrongBook 全量展示
  - SessionSummary 修复 + 结算动效
  - Onboarding 第3步 + 心机制说明
    ↓
改版实施 Phase C：细节打磨（2-3天）
  - 六边形背景纹理
  - 页面过渡动画
  - 答题反馈浮层
  - 关卡状态动画（推荐关卡脉冲）
```

---

## 附录：关键问题-解决方案对照

| Issue ID | 问题 | 本方案中的解决位置 |
|----------|------|------------------|
| ISSUE-018/C-01 | bg-error/10 不存在 | § 6.1 立即修复 #1 |
| ISSUE-019/C-02 | render 期间 setPage | § 6.1 立即修复 #2 |
| ISSUE-020/M-01 | 底部导航5份重复 | § 四·4.3 + § 6.2 并入改版 |
| ISSUE-022/M-03 | 关卡按钮触控区小 | § 三·3.3 80px 规范 |
| ISSUE-023/M-04 | 错题本无查看全部 | § 三·3.7 WrongBook 改造 |
| ISSUE-024/M-05 | 加载黑屏 | § 四·4.6 LoadingScreen |
| ISSUE-032/A-C01 | 按钮白字对比度2.09 | § 一·1.3 金底深字方案 |
| ISSUE-033/A-C02 | user-scalable=no | § 6.1 立即修复 #3 |
| ISSUE-034/A-S02 | 弹窗缺焦点陷阱 | § 四·4.7 Dialog 规范 |
| ISSUE-035/A-S03 | 进度条无ARIA | § 四·4.4 ProgressBar 组件 |
| ISSUE-036/A-S04 | 反馈无aria-live | § 6.1 立即修复 #6 |
| ISSUE-037/A-M02 | DecimalGrid脱主题 | § 6.2 并入改版 |
| ISSUE-038/A-M03 | 心数无文字描述 | § 四·4.5 Hearts 组件 |
| ISSUE-039/A-M04 | 无reduced-motion | § 6.1 立即修复 #5 |
| ISSUE-040/A-M05 | 关卡状态仅靠颜色 | § 五·5.3 多维度状态规范 |
| ISSUE-041/A-N03 | 图标按钮无aria-label | § 6.2 并入改版 |
| N-02 | text-[10px]字号 | § 一·1.5 字号规范 |
| N-03 | 硬编码"五年级" | § 6.1 立即修复 #8 |
| N-05 | History底部导航无激活 | § 四·4.3 BottomNav activeTab 规则 |
| S-01 | 无心机制说明 | § 三·3.1 Onboarding第3步 |
| S-02 | 无推荐关卡高亮 | § 二·2.4 Home推荐卡片 |
| S-04 | 无页面过渡动画 | § 五·5.2 页面过渡规则 |
