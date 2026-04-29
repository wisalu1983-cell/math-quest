# Manual / Visual Result

**范围**：内置键盘固定底部与自动换格体验  
**日期**：2026-04-29  
**结果**：PASS，带 1 个体验观察 RISK

## Charter Results

| Charter | 用户预期 | 操作路径 | 实际观察 | 判定 |
|---|---|---|---|---|
| 手机竖屏固定底部 | 键盘固定在屏幕底部，不跟随题卡滚动 | 390x844 打开竖式题，滚动页面 | 键盘通过 portal 固定到视口底部；Playwright 检查滚动前后底边仍贴近视口底部 | PASS |
| 商余数 / 多空 / 训练格 | 填满当前格后自然进入下一格 | 使用内置键盘输入商、多空和训练字段 | active 样式跟随 slot 顺序移动；普通单答案和最终答案不被误跳 | PASS |
| 多行乘法 | 过程积从低位往高位写 | `90.8 × 5` 输入部分积 | 初始 active 在右侧低位格，输入后向左移动 | PASS |
| 桌面 Tab | Tab 顺序与可见输入顺序一致 | 1024x768 下使用 `Tab` / `Shift+Tab` | Tab 与内置键盘 slot 顺序一致，部分积行右到左 | PASS |
| 编辑回填 | 修改已填满格时不要明显打断 | 填满 A 自动到 B，返回 A 修改 | 初版仍按“再次填满即继续”自动到 B；未作为阻塞缺陷 | RISK |

## Case Traceability

| ID | 结果 | 记录 |
|---|---|---|
| U-MOB-01 | PASS | 手机竖屏固定底部 charter；补测矩阵见 [`execution-matrix.md`](./execution-matrix.md)。 |
| U-EDIT-01 | RISK | 编辑回填 charter；已补充 Playwright 当前行为观察，矩阵见 [`execution-matrix.md`](./execution-matrix.md)。 |

## Residual Risk

- 编辑回填的再次自动跳格是否会干扰学生修正答案，需要真实学生或更长时间拟真 QA 观察。
- 真实 Android Chrome / iOS Safari 设备证据仍沿 Phase 3 既有线上补验计划执行。
