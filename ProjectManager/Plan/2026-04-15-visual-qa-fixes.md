# Visual QA 修复计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复视觉 QA 报告中识别的 7 个 UI 问题（1 个 P1、3 个 P2、3 个 P3）。

**Architecture:** 逐文件修改，不引入新架构；VR-05 庆祝动画新增 `ConfettiEffect.tsx` 组件，通过 Framer Motion 实现星星弹入 + 纸屑撒落。

**Tech Stack:** React 19, TypeScript, TailwindCSS v4, Framer Motion

---

## 文件修改清单

| 文件 | 操作 | 涉及问题 |
|------|------|---------|
| `src/pages/CampaignMap.tsx` | 修改 `btnClass`：加 `w-full`，`border-[2.5px]` → `border-2` | F2(P1), F1(P3) |
| `src/pages/Progress.tsx` | 修改 `pb-[88px]` → `pb-[120px]` | VR-02(P2) |
| `src/pages/Practice.tsx` | 修改问题区容器为居中布局；在 feedback panel 加星星 + 触发纸屑 | VR-01(P2), VR-05(P2) |
| `src/components/Dialog.tsx` | `bg-black/50` → `bg-black/65` | VR-04(P3) |
| `src/components/ConfettiEffect.tsx` | **新建** 纸屑动效组件 | VR-05(P2) |

---

## Task 1: 修复 CampaignMap 关卡宽度不一致 + 边框规范 (F2/P1 + F1/P3)

**Files:**
- Modify: `src/pages/CampaignMap.tsx:178`

**根因：** `<button>` 在 CSS grid 中不像 `<div>` 一样自动伸展至列宽，缺少 `w-full`。

- [ ] **Step 1: 修改 btnClass 定义**

将 `CampaignMap.tsx` 第 178 行：
```tsx
// 旧
let btnClass = 'rounded-[18px] border-[2.5px] flex flex-col items-center justify-between transition-all active:scale-95';
```
改为：
```tsx
// 新：加 w-full 解决 button 宽度问题；border-2 与浏览器实际渲染对齐
let btnClass = 'w-full rounded-[18px] border-2 flex flex-col items-center justify-between transition-all active:scale-95';
```

- [ ] **Step 2: 验证（目视）**

启动 dev 服务器，进入任意主题的闯关地图，确认：
- locked（灰色锁图标）和 playable（彩色可点）关卡宽度一致
- 三列网格整齐对齐

---

## Task 2: 修复 Progress 页内容被底部导航遮挡 (VR-02/P2)

**Files:**
- Modify: `src/pages/Progress.tsx:14`

- [ ] **Step 1: 增大 padding-bottom**

将第 14 行：
```tsx
<div className="min-h-dvh bg-bg pb-[88px] safe-top">
```
改为：
```tsx
<div className="min-h-dvh bg-bg pb-[120px] safe-top">
```

- [ ] **Step 2: 验证**

进入进度页，滚动到底部，确认"总体统计"卡片和"查看练习记录"按钮完全可见，未被底部导航遮挡。

---

## Task 3: 修复答题页下方 60% 留白 (VR-01/P2)

**Files:**
- Modify: `src/pages/Practice.tsx:170`

**根因：** `flex-1 flex flex-col items-center pt-8` 默认 `justify-start`，内容顶对齐留下大量空白。

- [ ] **Step 1: 改为居中布局**

将第 170 行：
```tsx
<div className="flex-1 flex flex-col items-center pt-8 pb-4 px-4 max-w-lg mx-auto w-full relative">
```
改为：
```tsx
<div className="flex-1 flex flex-col items-center justify-center py-6 px-4 max-w-lg mx-auto w-full relative">
```
（`pt-8 pb-4` → `py-6`，加 `justify-center`）

- [ ] **Step 2: 验证**

进入任意主题练习，检查：
- 题目卡 + 输入框 + 确认按钮整体居中显示
- feedback 面板出现时也保持居中

---

## Task 4: 实现答对庆祝动画 (VR-05/P2)

**Files:**
- Create: `src/components/ConfettiEffect.tsx`
- Modify: `src/pages/Practice.tsx`

**设计规范（来自 interaction-design skill）：**
- 星星弹入：300-400ms，`cubic-bezier(0.34, 1.56, 0.64, 1)`（弹性），stagger 100ms
- 纸屑下落：1000-1200ms，随机水平漂移
- `prefers-reduced-motion`：跳过动画，直接显示最终态
- 语义：传达"反馈"，告知用户答对了

### Step 4a: 新建 ConfettiEffect 组件

- [ ] **Step 1: 创建 `src/components/ConfettiEffect.tsx`**

```tsx
// src/components/ConfettiEffect.tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;       // vw 起始位置（0-100）
  color: string;
  size: number;     // px
  delay: number;    // ms
  duration: number; // ms
  drift: number;    // px 水平漂移
}

const COLORS = [
  '#FF6B35', // primary orange
  '#22C55E', // success green
  '#FBBF24', // warning yellow
  '#A78BFA', // purple
  '#F472B6', // pink
  '#34D399', // emerald
];

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 90 + 5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 6 + 5,
    delay: Math.random() * 400,
    duration: Math.random() * 400 + 900,
    drift: (Math.random() - 0.5) * 120,
  }));
}

interface ConfettiEffectProps {
  active: boolean;
}

export default function ConfettiEffect({ active }: ConfettiEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (active) {
      setParticles(makeParticles(22));
    } else {
      setParticles([]);
    }
  }, [active]);

  return (
    <AnimatePresence>
      {active && particles.map(p => (
        <motion.div
          key={p.id}
          aria-hidden="true"
          className="fixed pointer-events-none z-40 rounded-full"
          style={{
            left: `${p.x}vw`,
            top: 0,
            width: p.size,
            height: p.size,
            background: p.color,
          }}
          initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: '105vh', x: p.drift, opacity: 0, rotate: 360 }}
          transition={{
            duration: p.duration / 1000,
            delay: p.delay / 1000,
            ease: 'easeIn',
          }}
          exit={{}}
        />
      ))}
    </AnimatePresence>
  );
}
```

### Step 4b: 修改 Practice.tsx

- [ ] **Step 2: 在 Practice.tsx 顶部添加 import**

在第 1 行（import 区域）中追加：
```tsx
import ConfettiEffect from '@/components/ConfettiEffect';
import { motion } from 'framer-motion';
```

- [ ] **Step 3: 添加 showConfetti 状态**

在 `const [showQuitConfirm, setShowQuitConfirm] = useState(false);`（第 29 行）后追加：
```tsx
const [showConfetti, setShowConfetti] = useState(false);
```

- [ ] **Step 4: 答对时触发纸屑**

在 `handleSubmit` 的 `if (result.correct)` 分支（第 73-74 行），将空注释改为：
```tsx
if (result.correct) {
  setShowConfetti(true);
  setTimeout(() => setShowConfetti(false), 1600);
}
```

- [ ] **Step 5: 替换 feedback panel 为带星星动画的版本**

将 Practice.tsx 中 feedback panel（约第 288-325 行）的 `{showFeedback && ...}` 部分替换：

原代码（找到这段）：
```tsx
        ) : (
          /* Feedback panel */
          <div className={`w-full p-6 rounded-2xl border-2 ${
            lastAnswerCorrect
              ? 'border-success-mid bg-success-lt'
              : 'border-warning bg-warning-lt'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{lastAnswerCorrect ? '🎉' : '😅'}</span>
              <span className={`text-xl font-black ${lastAnswerCorrect ? 'text-success' : ''}`}
                    style={!lastAnswerCorrect ? { color: '#7A5C00' } : undefined}>
                {lastAnswerCorrect ? '太棒了！' : '没关系，继续加油！💪'}
              </span>
            </div>
```

改为：
```tsx
        ) : (
          /* Feedback panel */
          <div className={`w-full p-6 rounded-2xl border-2 ${
            lastAnswerCorrect
              ? 'border-success-mid bg-success-lt'
              : 'border-warning bg-warning-lt'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              {lastAnswerCorrect ? (
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.span
                      key={i}
                      className="text-2xl"
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: i * 0.1,
                        duration: 0.4,
                        ease: [0.34, 1.56, 0.64, 1],
                      }}
                    >
                      ⭐
                    </motion.span>
                  ))}
                </div>
              ) : (
                <span className="text-3xl">😅</span>
              )}
              <span className={`text-xl font-black ${lastAnswerCorrect ? 'text-success' : ''}`}
                    style={!lastAnswerCorrect ? { color: '#7A5C00' } : undefined}>
                {lastAnswerCorrect ? '太棒了！' : '没关系，继续加油！💪'}
              </span>
            </div>
```

- [ ] **Step 6: 在 Practice 根节点添加 ConfettiEffect**

在 `return (` 内最外层 `<div>` 的末尾（`</Dialog>` 之后，`</div>` 之前）加入：
```tsx
      <ConfettiEffect active={showConfetti} />
```

- [ ] **Step 7: 验证**

进入练习，答对一题，确认：
- 三颗星星依次弹入（0ms, 100ms, 200ms 延迟）
- 彩色纸屑从屏幕顶部撒落
- 1.6 秒后纸屑消失
- 答错时无纸屑

---

## Task 5: 加深退出弹窗遮罩 (VR-04/P3)

**Files:**
- Modify: `src/components/Dialog.tsx:61`

- [ ] **Step 1: 加深遮罩**

将第 61 行：
```tsx
className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
```
改为：
```tsx
className="fixed inset-0 z-50 flex items-center justify-center bg-black/65"
```

- [ ] **Step 2: 验证**

在答题中点击退出，确认弹窗背后内容明显模糊/变暗，不分散注意力。

---

## 优先级执行顺序

1. Task 1（P1，立即可见的布局错误）
2. Task 2（P2，内容遮挡）
3. Task 3（P2，留白体验）
4. Task 4（P2，缺失动效）
5. Task 5（P3，细节打磨）

---

_Plan created: 2026-04-15 | Based on: Reports/2026-04-15-visual-qa-results.md_
