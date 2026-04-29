# V0.5 全量测试 · 自动化测试结果

> 创建：2026-04-29
> 关联：[execution-matrix.md](./execution-matrix.md) · [test-cases-v1.md](./test-cases-v1.md)

---

## 1. Vitest 单元测试

```
npm test (vitest run)
━━━━━━━━━━━━━━━━━━━━━━━━
Test Files  59 passed (59)
     Tests  743 passed (743)
  Start at  18:11:34
  Duration  3.16s (transform 6.39s, setup 0ms, import 28.78s, tests 1.90s, environment 32ms)
```

**结论**：PASS — 59 个测试文件、743 项测试全部通过。

### 关键覆盖文件

- `src/engine/generators/vertical-calc.phase3.test.ts`：BL-009 低档乘法过滤、D0 除法过滤、D2/D3 分布断言
- `src/engine/verticalMultiplicationErrors.test.ts`：ISSUE-067 多行乘法错因分类（最终答案错、过程格错、训练格错、同时错）
- `src/utils/practiceFailureDisplay.test.ts`：错因展示 helper、旧数据 fallback、空用户值展示
- `src/pages/practice-math-keyboard.test.ts`：键盘 reducer、slot state、按键集合、sanitize
- `src/pages/PracticeMathKeyboard.test.ts`：键盘组件渲染和 a11y
- `src/engine/vertical-calc-policy.test.ts`：三档过程格策略
- `src/engine/verticalMultiplication.test.ts`：单行/多行 partial 行为
- `src/store/index.test.ts`：failureDetail 存储
- `src/sync/merge.test.ts`：同步合并保留 failureDetail

---

## 2. Playwright E2E 测试

```
npx playwright test
━━━━━━━━━━━━━━━━━━━━━━━━
Running 23 tests using 9 workers
23 passed (13.9s)
```

**结论**：PASS — 23 项 E2E 测试全部通过。

### E2E 用例清单（9 个 spec 文件）

| Spec 文件 | Tests | 覆盖范围 |
|---|---|---|
| smoke.spec.ts | 1 | 首页加载与注册流程 |
| issue-065-vertical-operand-contrast.spec.ts | 1 | 单行竖式高对比回归 |
| issue-066-vertical-single-input.spec.ts | 3 | 单一输入入口、退位语义、软键盘删除 |
| issue-068-single-partial-multiplication.spec.ts | 2 | 单行过程积不展示重复行、填错处理 |
| phase3-decimal-training-failure.spec.ts | 1 | 小数训练格错因展示 |
| phase3-keyboard-autofocus.spec.ts | 8 | 内置键盘固定底部、legacy/乘法自动换格、商余数/multi-blank/训练格自动换格、右到左输入+Tab |
| phase4-carry-focus.spec.ts | 2 | 低档/中档进位格自动聚焦 |
| phase5-practice-input-reset.spec.ts | 3 | 换题重置、多空重建、退出弹窗 |
| v03-account-sync.spec.ts | 2 | 游客入口、离线段位门 |

---

## 3. 生产构建

```
npm run build (tsc -b && vite build)
━━━━━━━━━━━━━━━━━━━━━━━━
✓ 3312 modules transformed
✓ built in 624ms
index-BZRjcbch.js  1,809.15 kB │ gzip: 516.23 kB
index-8yGwnJzV.css    93.74 kB │ gzip:  19.43 kB
```

**结论**：PASS — TypeScript 编译和 Vite 构建成功。JS chunk 1809 kB 超过 500 kB warning 阈值，为非阻塞优化项。

---

## 4. 安全审计

```
npm audit --audit-level=high
━━━━━━━━━━━━━━━━━━━━━━━━
found 0 vulnerabilities
```

**结论**：PASS — 无 high/critical 级别依赖漏洞。

---

## 汇总

| 检查项 | 结果 | 备注 |
|---|---|---|
| Vitest 59/59 files, 743/743 tests | PASS | — |
| Playwright 23/23 tests | PASS | — |
| Production build | PASS | chunk size warning 为非阻塞 |
| npm audit | PASS | 0 vulnerabilities |
| **综合** | **PASS** | — |
