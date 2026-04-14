# Design Review: math-quest 全产品 UI 审查

**Review ID:** mathquest_20260414_full  
**审查日期:** 2026-04-14  
**目标:** `src/` 全产品（10个页面 + 2个核心组件）  
**重点:** 视觉设计 / 可用性 / 代码质量 / 性能  
**平台:** 响应式（移动优先）

---

## 总结

产品整体设计风格统一、配色系统清晰，Duolingo 风格的暗色主题执行一致。  
核心答题页（Practice）交互逻辑完善，竖式计算组件技术含量高。  
主要问题集中在：**组件重复（底部导航5份拷贝）**、**两个严重的 React 反模式/CSS Bug**，以及针对儿童用户的可达性细节。

**问题总数:** 18

| 严重等级 | 数量 |
|---------|------|
| 严重（Critical） | 2 |
| 重要（Major） | 5 |
| 次要（Minor） | 7 |
| 建议（Suggestion） | 4 |

---

## 严重问题（Critical）

### C-01：SessionSummary 失败状态使用了不存在的 CSS Token

**严重等级:** Critical  
**位置:** [src/pages/SessionSummary.tsx:24](src/pages/SessionSummary.tsx#L24)  
**类别:** 视觉设计 / Bug

**问题:**  
`bg-error/10` 在设计系统中未定义，颜色 token 名称为 `--color-danger`（对应 Tailwind 类 `bg-danger`），无 `error` token。  
这导致答题失败后的 Banner 背景色不生效，失败状态视觉上与通关状态难以区分。

**影响:**  
儿童用户无法通过颜色快速感知"失败"反馈，削弱游戏化的情感响应。

**修复方案:**
```tsx
// Before
<div className={`py-6 rounded-3xl ${passed ? 'bg-success/10' : 'bg-error/10'}`}>

// After
<div className={`py-6 rounded-3xl ${passed ? 'bg-success/10' : 'bg-danger/10'}`}>
```

---

### C-02：SessionSummary 在渲染期间调用 setPage（React 反模式）

**严重等级:** Critical  
**位置:** [src/pages/SessionSummary.tsx:10-12](src/pages/SessionSummary.tsx#L10)  
**类别:** 代码质量 / Bug

**问题:**  
当 `lastSession` 为 null 时，组件在渲染函数主体中直接调用 `setPage('home')`。  
在 React 严格模式和并发模式下，渲染期间的状态更新会触发警告，并可能造成无限重渲染循环。

**影响:**  
在某些 React 版本/模式下可能导致白屏或性能问题；违反 React 渲染纯函数原则。

**修复方案:**
```tsx
// Before（渲染期间直接调用）
if (!lastSession) {
  setPage('home');
  return null;
}

// After（用 useEffect 处理副作用）
useEffect(() => {
  if (!lastSession) setPage('home');
}, [lastSession, setPage]);

if (!lastSession) return null;
```

---

## 重要问题（Major）

### M-01：底部导航栏重复 5 份（DRY 严重违反）

**严重等级:** Major  
**位置:** Home.tsx:96-115, Progress.tsx:94-113, WrongBook.tsx:83-102, Profile.tsx:117-136, History.tsx:97-116  
**类别:** 代码质量

**问题:**  
完全相同的底部导航 JSX（约 20 行）被复制到 5 个页面中，仅 `activeTab` 判断条件不同。  
任何样式/结构变更须同步修改 5 处。History 页面甚至忘记高亮任何 tab（没有 active 状态）。

**影响:**  
- 维护成本高：修改一处需改 5 处，容易漏改  
- History 页底部导航无高亮（视觉 bug）  
- 代码体积多余约 80 行

**修复方案:**  
提取为 `<BottomNav activeTab={...} />` 组件：

```tsx
// src/components/BottomNav.tsx
type NavPage = 'home' | 'progress' | 'wrong-book' | 'profile';
interface Props { activeTab: NavPage; }

export default function BottomNav({ activeTab }: Props) {
  const setPage = useUIStore(s => s.setPage);
  const tabs = [
    { page: 'home' as const, icon: '🏠', label: '首页' },
    { page: 'progress' as const, icon: '📊', label: '进度' },
    { page: 'wrong-book' as const, icon: '📕', label: '错题本' },
    { page: 'profile' as const, icon: '👤', label: '我的' },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg/90 backdrop-blur-md border-t border-border safe-bottom">
      <div className="max-w-lg mx-auto flex">
        {tabs.map(item => (
          <button
            key={item.page}
            onClick={() => setPage(item.page)}
            aria-label={item.label}
            aria-current={item.page === activeTab ? 'page' : undefined}
            className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors
              ${item.page === activeTab ? 'text-primary' : 'text-text-secondary hover:text-text'}`}
          >
            <span className="text-xl" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
```

---

### M-02：useGameProgressStore 导入来源不一致

**严重等级:** Major  
**位置:** WrongBook.tsx:1, Profile.tsx:1 vs Home.tsx:3, Progress.tsx:2  
**类别:** 代码质量

**问题:**  
- WrongBook、Profile 从 `@/store` 导入 `useGameProgressStore`  
- Home、Progress、CampaignMap 从 `@/store/gamification` 导入  

如果 `@/store` 中的 `useGameProgressStore` 是不同的 store（或未正确 re-export），  
WrongBook 和 Profile 拿到的数据可能与其他页面不同，导致数据不一致。

**影响:**  
潜在的数据不一致 bug；代码可读性差，新开发者容易混淆。

**修复方案:**  
统一所有页面从 `@/store/gamification` 导入，或在 `@/store/index.ts` 明确 re-export 并注释说明。

---

### M-03：CampaignMap 关卡按钮触控区域过小

**严重等级:** Major  
**位置:** [src/pages/CampaignMap.tsx:114-134](src/pages/CampaignMap.tsx#L114)  
**类别:** 可用性

**问题:**  
关卡按钮固定为 `w-16 h-16`（64px × 64px），内部还要显示图标 + 题目数 + 心心（3行信息），  
视觉上内容拥挤。Apple HIG 推荐最小触控区域 44pt，Google Material 推荐 48dp。  
64px 本身勉强达标，但考虑到按钮间有 `gap-3`（12px），实际可点击区域边缘较小。  
更严重的是，已完成关卡的心心用 `text-[10px]`（极小字体）展示，在移动设备上几乎看不清。

**影响:**  
儿童用户手指较粗，小触控区域容易误触或点击失败，影响挫败感。

**修复方案:**
```tsx
// Before
<button className={`w-16 h-16 rounded-2xl border-2 ...`}>
  <span className="text-lg">...</span>
  <span className="text-[10px]">{level.questionCount}题</span>
  {renderHearts(hearts)}
</button>

// After：增大尺寸，心心改用稍大字号
<button className={`w-18 h-18 min-w-[72px] min-h-[72px] rounded-2xl border-2 ...`}>
  <span className="text-xl">...</span>
  <span className="text-xs">{level.questionCount}题</span>
  {renderHearts(hearts)}
</button>
// renderHearts 内 text-[10px] → text-xs
```

---

### M-04：错题本每主题仅展示5题且无"查看全部"入口

**严重等级:** Major  
**位置:** [src/pages/WrongBook.tsx:54-71](src/pages/WrongBook.tsx#L54)  
**类别:** 可用性

**问题:**  
每个主题最多显示 5 道错题，超出部分仅显示"还有 X 题..."文字，但没有任何按钮或交互能看到剩余题目。  
用户的错题被隐藏，无法复习。

**影响:**  
错题本核心功能受损——错题超过5题后，用户无法查看、复习后续错题。

**修复方案:**
```tsx
// 在"还有 X 题"提示下方增加展开按钮
// 或为每个主题增加 expandedTopics 状态，点击后展示所有
{questions.length > 5 && (
  <button
    onClick={() => toggleExpand(topicId)}
    className="w-full py-2 text-xs text-primary font-bold text-center"
  >
    {expanded ? '收起' : `查看全部 ${questions.length} 题 ↓`}
  </button>
)}
```

---

### M-05：页面加载时无骨架屏/Loading 状态

**严重等级:** Major  
**位置:** Home.tsx:13, WrongBook.tsx:9, Profile.tsx:9  
**类别:** 可用性 / 视觉设计

**问题:**  
当 `user` 或 `gameProgress` 为 null 时，这些页面直接 `return null`，导致白屏（实际上是黑色背景闪烁）。  
即使加载很快，在低端设备上也会有明显空白帧。

**影响:**  
用户体验跳跃感强；首次加载和页面切换都会出现短暂黑屏。

**修复方案:**
```tsx
// 最简单：加一个居中的加载占位
if (!user || !gameProgress) {
  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center">
      <div className="text-text-secondary text-sm">加载中...</div>
    </div>
  );
}
```

---

## 次要问题（Minor）

### N-01：硬编码颜色值混入设计 token 系统

**严重等级:** Minor  
**位置:** VerticalCalcBoard.tsx:302, 398, 421; Home.tsx:83; Progress.tsx:57  
**类别:** 视觉设计

**问题:**  
- VerticalCalcBoard 中小数点颜色 `color: '#e53935'` 为硬编码值（实为 `--color-danger: #ff4b4b`，但值不一致）  
- Home/Progress 进度条颜色 `backgroundColor: '#58cc02'` 硬编码（等同于 `--color-primary`）  

硬编码颜色绕过了设计 token 系统，未来修改主题色需要在多处查找替换。

**修复方案:** 改用 CSS 变量或 Tailwind token 类：
```tsx
// VerticalCalcBoard 小数点
style={{ color: 'var(--color-danger)', ... }}

// 进度条
style={{ backgroundColor: allDone ? 'var(--color-success)' : topic.color }}
```

---

### N-02：多处使用 text-[10px]，低于儿童最小可读字号

**严重等级:** Minor  
**位置:** Profile.tsx:49,52,55; SessionDetail.tsx:67,71,76; VerticalCalcBoard.tsx（通过 CSS class）  
**类别:** 视觉设计 / 可用性

**问题:**  
`text-[10px]` 在多处统计数字标签使用，10px 字体对于儿童用户（目标为小学五年级）视力负担较大。  
W3C 建议正文最小 16px，辅助文字最小 12px。

**修复方案:**  
将 `text-[10px]` 统一替换为 `text-xs`（12px）。可通过全局搜索替换。

---

### N-03：Profile 页昵称下方硬编码"五年级"

**严重等级:** Minor  
**位置:** [src/pages/Profile.tsx:42](src/pages/Profile.tsx#L42)  
**类别:** 可用性

**问题:**
```tsx
<p className="text-sm text-text-secondary mt-1">五年级 · 数学大冒险</p>
```
写死"五年级"，即便将来产品扩展到其他年级，或者 `User.grade` 字段有值也不会显示。

**修复方案:**
```tsx
<p className="text-sm text-text-secondary mt-1">数学大冒险</p>
// 或读取 user.grade（若字段存在）
```

---

### N-04：图标按钮缺少 aria-label，无障碍性差

**严重等级:** Minor  
**位置:** 所有页面的返回按钮（←）、Practice.tsx 的退出按钮（✕）  
**类别:** 可用性 / 无障碍

**问题:**  
所有使用 emoji 或符号文字的按钮均未设置 `aria-label`，屏幕阅读器无法识别按钮功能。

```tsx
// Before
<button onClick={() => setPage('home')} className="text-2xl">←</button>

// After
<button onClick={() => setPage('home')} aria-label="返回首页" className="text-2xl" aria-hidden="false">←</button>
```

---

### N-05：History 底部导航无激活状态

**严重等级:** Minor  
**位置:** [src/pages/History.tsx:105-112](src/pages/History.tsx#L105)  
**类别:** 视觉设计

**问题:**  
History 页面的底部导航没有高亮任何 tab（所有 tab 都用 `text-text-secondary`），  
用户无法感知当前所在位置。"进度"理论上应该高亮（History 是 Progress 的子页面）。

**修复方案:**  
在提取底部导航为组件后（见 M-01），给 History 传 `activeTab="progress"`。

---

### N-06：Practice 页 VerticalCalcBoard 的 handleSubmit 引用顺序问题

**严重等级:** Minor  
**位置:** [src/components/VerticalCalcBoard.tsx:186](src/components/VerticalCalcBoard.tsx#L186)  
**类别:** 代码质量

**问题:**  
`handleSubmit` 函数（定义在第 174 行）内部引用了 `highestNonZeroCol`（由 `useMemo` 定义在第 342 行，即函数体之后）。  
JavaScript 提升使其在运行时正常工作，但这种"向下引用"违反了常见的编码规范，会让代码难以阅读和维护。

**修复方案:**  
将 `highestNonZeroCol` 的 useMemo 移到 `handleSubmit` 定义之前。

---

### N-07：Practice 中多处 `as any` 类型断言

**严重等级:** Minor  
**位置:** [src/pages/Practice.tsx:46,205](src/pages/Practice.tsx#L46)  
**类别:** 代码质量

**问题:**
```tsx
(currentQuestion.data as any).trainingFields
```
使用 `as any` 绕过了类型系统，丢失类型安全性。  
实际上 `trainingFields` 存在于特定 question type 的 data 中，应使用判别联合类型（discriminated union）。

---

## 建议（Suggestion）

### S-01：为新用户增加心机制说明

**类别:** 可用性

Onboarding 流程（只有欢迎+昵称2步）未介绍心❤的机制。  
第一次进入 Practice，用户突然看到3颗心，不知道"失去心数"意味着什么（关卡失败？）。  
建议在首次进入第一个关卡前，用一个简短 tooltip 或首次引导卡片解释心的意义。

---

### S-02：CampaignMap 高亮"当前推荐关卡"

**类别:** 可用性

所有可玩但未完成的关卡外观相同（绿色描边 + ▶ 图标）。  
建议标记出"下一个推荐关卡"（即最新解锁的关卡）——加一个脉冲动画或 "NEW" 标签，  
帮助用户快速定位从哪里继续。

---

### S-03：Practice 页增加实时答题计时显示

**类别:** 可用性

答题时间已被记录（在 History 中展示）但练习中不显示。  
一个轻量的时间显示（如顶部栏显示当题用时）可以增加挑战感，  
对于速算练习类应用尤其有价值。

---

### S-04：页面切换增加淡入过渡动画

**类别:** 视觉设计

App.tsx 采用硬切换（直接替换组件），没有任何页面过渡动画。  
全局已定义 `animate-fade-in`，将其应用到所有页面的根元素即可：
```tsx
// 每个页面根 div 添加
<div className="min-h-dvh bg-bg animate-fade-in ...">
```

---

## 亮点（值得保留）

- **设计 token 系统完善：** globals.css 中 CSS 变量定义清晰，颜色语义明确（primary/danger/success/warning）
- **响应式安全区处理：** `safe-bottom` / `safe-top` utility class 处理了 iOS 刘海屏适配，考虑周到
- **VerticalCalcBoard 技术实现：** 竖式计算组件处理了进位/借位、小数点列、键盘输入、自动跳格等复杂交互，设计优秀
- **btn-primary 按压效果：** `active:translate-y-1 active:shadow-none` 实现了 Duolingo 风格的物理按钮感
- **统一的 max-w-lg 约束：** 所有内容区域限制最大宽度，在平板上也有良好布局
- **overscroll-behavior: none：** 防止了移动端上下弹性滚动，适合游戏类应用
- **user-select: none：** 防止儿童误触时选中文本，体验细节到位

---

## 优先修复顺序

1. **C-01** — SessionSummary `bg-error/10` → `bg-danger/10`（1行，立刻改）
2. **C-02** — SessionSummary `setPage` 移入 useEffect（5行，立刻改）
3. **M-01** — 提取 `<BottomNav>` 组件（消除5处重复，顺带修复 N-05）
4. **M-04** — 错题本"查看全部"入口
5. **M-05** — 加载状态 Loading 占位
6. **M-02** — 统一 useGameProgressStore 导入来源
7. **M-03** — 关卡按钮增大 / 心心字号
8. **N-01~N-07** — 按需处理

---

*由 /ui-design:design-review 生成。修复后可再次运行 `/ui-design:design-review` 复审。*
