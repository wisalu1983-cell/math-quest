# v0.5 Phase 3 BL-011 自动换格统一化 QA 方法

**执行日期**：2026-04-29  
**QA 深度**：L2 Professional  
**范围**：内置计算键盘固定底部、统一自动换格、多行乘法右到左输入顺序、桌面 Tab 顺序  
**目标用户画像**：上海五年级学生，数学能力中等，移动端触摸输入为主，桌面端保留实体键盘输入。

## Test Basis

- `ProjectManager/Plan/v0.5/subplans/2026-04-29-v05-phase3-BL-011-自动换格统一化.md`
- `ProjectManager/Plan/v0.5/subplans/2026-04-29-v05-phase3-BL-011-计算输入内置键盘.md`
- `ProjectManager/Specs/a03-vertical-calc/current.md`
- `QA/capability-registry.md`
- 关键代码入口：`src/pages/practice-math-keyboard.ts`、`src/pages/PracticeMathKeyboard.tsx`、`src/pages/Practice.tsx`、`src/components/MultiplicationVerticalBoard.tsx`

## Risk Model

| Risk ID | 风险 | 影响 | 可能性 | 优先级 | 覆盖 |
|---|---|---|---|---|---|
| R1 | 键盘固定底部后遮挡题干、格子或提交按钮 | 高 | 中 | P0 | E2E / 视觉拟真 |
| R2 | 通用自动换格误伤普通答案、表达式或删除操作 | 高 | 中 | P0 | 单测 / E2E |
| R3 | 商余数、多空、训练格缺少答案长度来源导致跳错 | 中 | 中 | P1 | E2E / Code Review |
| R4 | 多行乘法部分积 / 总积仍按左到右，违背笔算顺序 | 高 | 高 | P0 | E2E / 手工路径 |
| R5 | 桌面 Tab 顺序与内置键盘 slot 顺序分叉 | 中 | 中 | P1 | E2E |
| R6 | 编辑回填再次自动换格干扰修正答案 | 中 | 中 | P2 | 拟真观察 / Residual Risk |

## Coverage Strategy

- **单测**：锁住键盘纯逻辑，验证默认不跳、`delete` 不跳、满足 `shouldAutoAdvance` 才跳、末尾不越界。
- **Playwright**：覆盖真实 Practice / Vertical board DOM、移动视口固定底部、多题型自动换格和桌面 Tab。
- **Code Review**：确认键盘层不写题型语义，答案长度由题型 slot 闭包捕获。
- **拟真 / 视觉**：以 390x844 手机视口和 1024x768 桌面视口观察输入路径、遮挡和焦点提示。

## Exit Criteria

- P0/P1 用例全部 PASS。
- 自动化失败不得写成 PASS；若发现回归，先修复并复跑。
- 固定底部键盘必须相对视口，而不是题卡或滚动容器。
- 残余体验风险必须进入 summary，不静默关闭。
