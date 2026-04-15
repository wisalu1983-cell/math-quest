# UI/UX 整体重设计规格

**Spec ID:** 2026-04-14-ui-redesign-spec  
**日期:** 2026-04-14  
**最后修订:** 2026-04-15（字号下限上调为 11px；关卡卡片改为固定高度 96px）  
**状态:** ✅ 视觉方向已批准（阳光版 v5）；待进入实施  
**范围:** 全产品视觉语言 + 交互模式 + 组件规范  
**不改变:** 产品功能逻辑、题目生成引擎、数据结构  
**参考预览:** `.ui-design/preview/redesign-v5.html`（批准版）

---

## 迭代记录

| 版本 | 方向名 | 状态 | 否决原因 |
|------|--------|------|---------|
| v1（草案） | 炼金书院（深色） | ❌ 否决 | 配色太重；与"降低抵触、轻松欢乐"的产品目标不符 |
| v2 | 阳光版（暖橙 + 圆形关卡） | ❌ 否决 | 关卡圆圈与卡片风格不统一；首页头部色块太重 |
| v3 | 阳光版（统一暖色系） | ❌ 否决 | 内容太小，图标占地面积相对空白区域失衡 |
| v4 | 阳光版（内容放大 + emoji图标） | ❌ 否决 | emoji 图标风格与整体 UI 不匹配 |
| **v5** | **阳光版（定制 SVG 图标）** | ✅ **批准** | — |

---

## 一、整体设计方向

### 1.1 设计命题

当前产品是 Duolingo 视觉复刻品（深灰黑 + 亮绿 + 物理按钮），核心问题：
1. 无品牌辨识度
2. 色彩系统语义混乱（绿色同时承担品牌色/成功色/主操作色）
3. 可访问性失败（绿底白字对比度 2.09:1）

**批准方向：阳光版**

> 数学练习应该是一件让人期待的事，不是负担。  
> 这个应用的情绪基调是：轻松、欢乐、每一次答对都值得庆祝。

### 1.2 视觉关键词

| 维度 | 当前（Duolingo 仿制） | 目标（阳光版） |
|------|------|------|
| 背景 | 深灰黑 #131f24 | 暖白 #FFF8F3 |
| 主色 | Duolingo 绿 #58cc02 | 珊瑚橙 #FF6B35（全局唯一主色）|
| 气质 | 打卡工具 | 轻松冒险 |
| 情绪基调 | 完成任务 | 鼓励 + 庆祝 |
| 设计风格 | 半物理感（3D 阴影按钮）| 平面（flat）|
| 图标 | emoji | 定制 SVG（描边 + 轻填充）|

### 1.3 颜色体系（Design Token）

**关键原则：三个页面共用同一套 token，不因页面/主题不同切换主色。**

```css
/* ── 主色：全局唯一，三页一致 ── */
--orange:     #FF6B35;   /* 主操作、进度、推荐关卡 */
--orange-dk:  #D4521A;   /* 渐变深端、悬停 */
--orange-lt:  #FFF0EB;   /* 轻填充背景（打卡条、芯片、卡片） */
--orange-mid: #FFCDB8;   /* 边框、进度轨道 */

/* ── 功能色 ── */
--green:      #3DBF6E;   /* 答对反馈、已完成关卡 */
--green-lt:   #EAF9F0;
--green-mid:  #B6EDD0;
--yellow:     #FFD43B;   /* 答错鼓励底色（非惩罚红）*/
--yellow-lt:  #FFF9DB;
--red:        #FF6B6B;   /* 仅用于退出按钮等极小范围 */
--red-lt:     #FFF5F5;

/* ── 背景 / 卡片 ── */
--bg:         #FFF8F3;   /* 全局应用背景，三页一致 */
--card:       #FFFFFF;
--card-2:     #FFFAF7;   /* 次级卡片（拾遗输入区） */

/* ── 文字 ── */
--text:       #181818;
--text-2:     #7A7A7A;
--text-3:     #C8C8C8;   /* 禁用/占位 */

/* ── 边框 ── */
--border:     #EED9CC;   /* 主要卡片边框 */
--border-2:   #F5EDE8;   /* 次要边框、分隔线 */
```

**主题颜色（仅用于主题卡片图标和进度条，不影响页面主色）：**

| 主题 | 颜色 | 用途 |
|------|------|------|
| 基础计算 | `#FF6B35` | 图标色、进度条 |
| 数感估算 | `#3DBF6E` | 同上 |
| 竖式笔算 | `#FF922B` | 同上 |
| 运算律 | `#9B59B6` | 同上 |
| 小数计算 | `#E74C3C` | 同上 |
| 括号变换 | `#E6AC00` | 同上 |
| 简便计算 | `#2980B9` | 同上 |
| 方程移项 | `#1ABC9C` | 同上 |

### 1.4 对比度说明（WCAG AA）

| 组合 | 对比度 | 状态 |
|------|--------|------|
| `--text` (#181818) on `--card` (#FFF) | 18.1:1 | ✅ |
| `--text-2` (#7A7A7A) on `--card` (#FFF) | 4.6:1 | ✅ |
| `--text` on `--bg` (#FFF8F3) | 17.5:1 | ✅ |
| 白字 on `--orange` (#FF6B35) | 2.82:1 | ⚠️ 未达 AA（见下注）|
| `--orange` (#FF6B35) on `--bg` | 3.22:1 | ✅ 大字通过 |

> ✅ **按钮文字颜色已决策（2026-04-14）：保留白字**。对比度 2.82:1，低于 WCAG AA，但与主流游戏化 App（Duolingo 等）保持一致取舍，视觉效果优先。

### 1.5 字体规范

```css
font-family: 'Nunito', 'PingFang SC', 'Microsoft YaHei UI', sans-serif;
/* Nunito via Google Fonts：wght@400;600;700;800;900 */
```

| 层级 | 大小 / 字重 | 用途 |
|------|------------|------|
| display | 24px / 900 | 页面大标题（问候语） |
| title | 20px / 900 | 模块标题（关卡地图名） |
| subtitle | 17px / 900 | 卡片主标题 |
| body-strong | 15px / 900 | 主题名称、按钮文字 |
| body | 13px / 700 | 正文说明 |
| caption | 12px / 700-800 | 关卡标签、进度文字 |
| mini | 11-12px / 800 | 徽章、关卡序号、底栏标签 |
| **禁止** | < 11px | 任何场景禁止低于 11px（面向小学生，视力保护）|

### 1.6 图标系统

**图标规格：** SVG 24×24 viewBox，stroke-width 2，stroke-linecap round，带轻填充（fill-opacity 0.1–0.2）

**8 个主题图标：**

| 主题 | 图标概念 | SVG 路径关键元素 |
|------|---------|----------------|
| 基础计算 | + 在圆圈里 | circle r=9 + cross |
| 数感估算 | ≈ 双波浪线 | 两条 sinusoidal path |
| 竖式笔算 | 叠放数字栏 + 粗横线 | 3 rect + line |
| 运算律 | 两个循环箭头 | 两段 arc + polyline 箭头 |
| 小数计算 | 左框 · 圆点 · 右框 | 2 rect + circle |
| 括号变换 | ( ) 两弧线 | 两段 cubic bezier |
| 简便计算 | 闪电形 | polygon path |
| 方程移项 | 天平（梁+两盘）| line + 2 rect + 支撑线 |

**4 个导航图标：** 学习（房子）、进度（柱状图）、错题（书+对勾）、我的（人形）

**3 个关卡状态图标：** done（粗✓）、play（实心三角）、lock（挂锁）

> 所有图标 SVG 代码见 `.ui-design/preview/redesign-v5.html` 的 `TOPIC_ICONS` / `NAV_ICONS` / `LVL_ICONS` JavaScript 常量。

### 1.7 视觉材质语言

- **背景：** `--bg` 暖白，无纹理（移除旧版六边形图案）
- **卡片：** 纯白 + `box-shadow: 0 2px 10px rgba(0,0,0,.09)`，边框 `--border-2`
- **装饰圆：** 主题卡片右上角叠加同色半透明圆形（opacity .1），增加层次感
- **渐变：** 仅用于进度条填充（`linear-gradient(90deg, --orange-dk, --orange)`）

### 1.8 动效规范

```css
--ease-s: cubic-bezier(.34, 1.56, .64, 1);   /* 弹性（反馈、按钮弹入）*/
--ease-e: cubic-bezier(.4, 0, .2, 1);          /* 平滑（状态切换）*/

/* 页面元素进入 */
@keyframes up-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
/* 时长 0.3s，子元素按 50ms 递增 stagger */

/* 推荐关卡跳动 */
animation: bounce 2.2s ease-in-out infinite;
/* translateY 0 → -5px → 0 */
```

**禁止：**
- 无意义的装饰性循环动画（除推荐关卡跳动外）
- 超过 600ms 的 loading 动画
- 未加 `prefers-reduced-motion` 保护的动画（已在 §6.1 hotfix 中实施）

---

## 二、导航和信息层级

（与原草案相同，结构不变）

**Tab 命名：**
- "首页" → **"学习"**（主动性更强）
- 答题流程期间（CampaignMap / Practice / Summary）**隐藏**底部导航

**三层层级：**
```
一级（底部 Tab）: 学习 / 进度 / 错题 / 我的
二级（主内容区跳转）: 主题列表 → 关卡地图 | 进度 → 历史记录
三级（全屏沉浸，隐藏底部导航）: 关卡 → 答题 → 结算
```

**History 归属：** 作为 Progress 的子级，activeTab 传 `'progress'`。

---

## 三、页面级改造原则

### 3.1 首页

- 顶部：白色 logo 栏 + 头像，无大色块
- 问候语：直接在 `--bg` 背景上，字号 24px/900
- 打卡条：橙色轻填充卡片（`--orange-lt` 背景）
- 推荐卡（Hero card）：左侧 5px 橙色边框，52px 主题 SVG 图标，平面橙色按钮
- 主题网格：2 列，42px SVG 图标，15px/900 名称，7px 进度条，右上角装饰圆

### 3.2 关卡地图

- 顶部：同首页一致的白卡片风格（**不切换为蓝色/冷色**）
- 进度条：橙色填充（与全站一致）
- 关卡按钮：**圆角矩形**（border-radius 18px），height 96px（固定），三行布局（序号/图标/标签）
- 状态：已完成（绿色轻填充 + ✓）、推荐（橙色实心 + 跳动 + NEW 徽章）、可玩（橙色轻填充 + ▶）、锁定（灰色 + 🔒）
- 状态区分维度：颜色 + 图标形状 + 动画三维（解决色盲可访问性）

### 3.3 答题页

- 进度：8 个圆点（done/current/pending），无底部导航
- 反馈情绪设计：
  - ✅ 答对：绿色面板滑入 + ⭐⭐⭐动画 + 彩色纸屑 + "太棒了！🎉"
  - ❌ 答错：**暖黄色面板**（非红色惩罚）+ "没关系，继续加油！💪" + 显示正确答案

---

## 四、通用组件规范

### 4.1 按钮（btn-flat）

```css
.btn-flat {
  background: var(--orange);
  color: #fff;          /* ⚠️ 待定：可改为深棕色以满足 WCAG AA */
  font-size: 15px; font-weight: 900;
  border-radius: 14px;
  padding: 13px;
  box-shadow: 0 1px 5px rgba(0,0,0,.07);  /* 平面风格，无 3D */
}
```

### 4.2 主题卡片（tcard）

```
padding: 16px 14px 14px
icon: 42×42px SVG（color = 主题色）
name: 15px / 900
progress track: height 7px, 圆角 4px
completion label: 12px / 800（颜色 = 主题色，未开始时用 --text-3）
右上角装饰圆: 52×52px, 主题色, opacity .1
```

### 4.3 关卡按钮（lvl）

```
border-radius: 18px; border: 2.5px solid;
height: 96px;          ← 固定高度（2026-04-15 由 min-height:92 改为固定值，
                            确保不同 lane/stage 的独立 grid 容器中卡片高度完全一致）
布局: flex column, space-between, leading-none
  ↳ 第N关 (12px/800, opacity .6)
  ↳ 36×36px SVG 图标
  ↳ 星级/题数 label (12px/800)
NEW 徽章: 11px/900, absolute 定位右上角
```

### 4.4 底部导航（bnav）

```
height: 68px
icon: 24×24px SVG (currentColor)
激活高亮: 38×34px 圆角矩形, --orange-lt 背景
```

### 4.5 BottomNav 组件提取（解决 ISSUE-020）

提取为 `<BottomNav activeTab={...} />` 统一组件，History 页传 `activeTab="progress"`。

### 4.6 进度条（progressbar）

```
height: 7px（主要）/ 8px（关卡地图）
fill: linear-gradient(90deg, --orange-dk, --orange)
border-radius: 4px
```

附加 ARIA：`role="progressbar" aria-valuenow aria-valuemin aria-valuemax aria-valuetext`

### 4.7 加载状态（LoadingScreen）

替换所有 `return null` 黑屏，改为居中文字 + 主背景色占位，解决 ISSUE-024。

### 4.8 对话框（Dialog）

`role="dialog"` + `aria-modal="true"` + 焦点陷阱 + ESC 关闭，解决 ISSUE-034。

---

## 五、交互反馈与状态设计规则

### 5.1 答题反馈状态机

```
idle → submitting → correct / wrong → next_question
```

| 状态 | 视觉 | 动效 | ARIA |
|------|------|------|------|
| correct | 绿色面板滑入（height 0→230px）| ⭐×3 弹入 + 纸屑撒落 | aria-live "回答正确！太棒了！" |
| wrong | 暖黄面板滑入（height 0→215px）| 无惩罚动画 | aria-live "回答错误，正确答案是 X，加油！" |

### 5.2 关卡状态视觉规则

三维区分（颜色 + 图标形状 + 动画）：

| 状态 | 颜色 | 图标 | 动画 |
|------|------|------|------|
| 已完成 | 绿色（--green）实心 | SVG ✓ | 无 |
| 推荐 | 橙色（--orange）实心 | SVG ▶ | 上下跳动 2.2s 循环 |
| 可玩 | 橙色轻填充 | SVG ▶ | 无 |
| 锁定 | 灰色，opacity .55 | SVG 挂锁 | 无 |

### 5.3 页面进入动画

```css
/* 每个页面的子元素按 stagger 顺序入场 */
animation: up-in 0.3s ease-spring 0.04s forwards;
/* 每个子元素延迟 +50ms */
```

### 5.4 动态 document.title（解决 ISSUE-042/A-N03）

```ts
const PAGE_TITLES = {
  home:     '数学大冒险 · 学习',
  campaign: '数学大冒险 · 闯关',
  practice: '数学大冒险 · 答题中',
  summary:  '数学大冒险 · 练习结果',
  progress: '数学大冒险 · 进度',
  history:  '数学大冒险 · 记录',
  'wrong-book': '数学大冒险 · 错题本',
  profile:  '数学大冒险 · 个人中心',
};
```

---

## 六、立即修复 vs 并入改版

### 6.1 已落地 hotfix（§6.1，见 Plan/2026-04-14-ui-hotfix-6-1.md）

| Issue | 描述 | 状态 |
|-------|------|------|
| ISSUE-018 | bg-error/10 → bg-danger/10 | ✅ 已修 |
| ISSUE-019 | setPage 移入 useEffect | ✅ 已修 |
| ISSUE-033/A-C02 | 移除 user-scalable=no | ✅ 已修 |
| ISSUE-027/A-N03 | 动态 document.title | ✅ 已修 |
| ISSUE-039/A-M04 | prefers-reduced-motion CSS | ✅ 已修 |
| ISSUE-036/A-S04 | aria-live 答题反馈 | ✅ 已修 |
| ISSUE-040/A-M03 | 心数 aria-label | ✅ 已修 |
| N-03 | 移除硬编码"五年级" | ✅ 已修 |

### 6.2 并入改版（阳光版实施时一起处理）

| Issue | 改版中如何解决 |
|-------|-------------|
| ISSUE-032/A-C01 | 按钮文字对比度：实施时确认深色文字方案 |
| ISSUE-020/M-01 | 提取 `<BottomNav>` 组件（消灭5份重复）|
| N-02（text-[10px]）| 按新字号规范全局替换，无低于 10px |
| ISSUE-037/A-M02 | DecimalTrainingGrid 改用应用 token |
| ISSUE-028/A-S01 | 图标按钮统一加 aria-label |
| ISSUE-034/A-S02 | 退出弹窗实现 Dialog 规范 |
| ISSUE-035/A-S03 | 进度条加 ARIA |
| ISSUE-022/M-03 | 关卡按钮按新规范（min-height 92px）|
| ISSUE-023/M-04 | 错题本全量展示 |
| ISSUE-024/M-05 | 替换 return null 为 LoadingScreen |
| ISSUE-021/M-02 | 统一 useGameProgressStore 导入来源 |

### 6.3 改版实施顺序

```
Phase A — Token + 组件基础设施（2-3天）
  ├── 替换 globals.css Token（dark → light）
  ├── 提取 BottomNav / ProgressBar / LoadingScreen / Dialog 组件
  ├── 引入 Nunito 字体（已在项目中，确认版本）
  └── 全局 aria / prefers-reduced-motion 设施

Phase B — 页面级改造（4-6天）
  ├── Home（打卡条、Hero 卡、主题网格 SVG 图标）
  ├── CampaignMap（关卡按钮圆角矩形 + SVG 图标）
  ├── Practice（点状进度、黄色鼓励反馈）
  └── WrongBook 全量展示

Phase C — 打磨（1-2天）
  ├── 页面进入 stagger 动画
  ├── 推荐关卡跳动动画
  └── 按钮文字对比度最终决策落地
```
