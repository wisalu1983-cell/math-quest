# Test Cases v1 · v0.5 Phase 4 BL-010 长除法 UI

## Functional Cases

| ID | 优先级 | 用例 | 预期 |
|---|---:|---|---|
| LD-ENG-01 | P0 | 936 ÷ 4 生成 3 轮长除法数据 | 每轮商位、乘积、余数 / 落位与标准过程一致 |
| LD-ENG-02 | P0 | 15.6 ÷ 0.24 生成扩倍字段 | 扩大 100 倍，转换后除数 24，转换后被除数 1560 |
| LD-ENG-03 | P0 | 8.5 ÷ 3 保留两位小数 | 后置结果字段为 `2.83`，label 为“保留两位小数” |
| LD-ENG-04 | P0 | 14 ÷ 135 循环小数 | 后置字段包含完整非循环部分 `0.1` 与循环节 `037` |
| LD-ENG-05 | P0 | 12.6 ÷ 3 小数被除数长除法 | 商的小数点位置与被除数对齐，过程轮次为 `4.2` |
| LD-ENG-06 | P0 | 824 ÷ 4 商中含 0 | 中间商位 `0` 作为可填写过程轮次保留 |
| LD-ENG-07 | P0 | 8 ÷ 4 单轮除法 | 仅生成一轮，最终余数格可填写且无落位字段 |
| LD-ENG-08 | P0 | 过程格与结构化结果同时错误 | 反馈同时记录过程错因类别与结构化字段错误值 |
| LD-ENG-09 | P1 | 长除法数值文本归一化 | engine 与 UI 共用同一 helper，比对时统一处理前导 0、尾随 0、空输入和非数字字符 |
| LD-GEN-01 | P0 | A03 除法生成器输出长除法题 | `type='vertical-fill'` 且 `data.longDivisionBoard` 存在 |
| LD-GEN-02 | P0 | A03 高档 `cyclic-div` 输出结构化循环小数长除法题 | `mode='cyclic'` 且结果字段包含非循环部分与循环节 |
| LD-UI-01 | P0 | 内置键盘按商、乘、余数与落位顺序输入 | 自动移动 active slot，最终正确提交 |
| LD-UI-02 | P0 | 过程格错误 | 统一反馈展示长除法过程错因类别，不展示中间正确值 |
| LD-UI-03 | P1 | 375px 手机视口 | 长除法板可见，键盘可操作 |
| LD-UI-04 | P1 | 390px 手机视口 | 长除法板可见，键盘可操作 |
| LD-UI-05 | P1 | 1024px 桌面视口 | 长除法板可见并有截图证据 |
| LD-DISP-01 | P0 | 缺少 detail 的长除法过程错误 fallback | 文案为“本题未通过：竖式过程有误。”，不落到进位 / 退位 |
| LD-REG-01 | P1 | Phase3 小数乘法训练格错误文案回归 | E2E 断言当前统一文案“本题未通过：小数训练格有误。” |

## Command Gates

| ID | 优先级 | 命令 | 预期 |
|---|---:|---|---|
| CMD-01 | P0 | `npm test` | 全量 Vitest PASS |
| CMD-02 | P0 | `npm run build` | TypeScript + Vite build PASS |
| CMD-03 | P0 | `npx playwright test --reporter=line` | 全量 E2E PASS |
| CMD-04 | P1 | scoped `npx eslint ...` | 变更范围 lint PASS |
| CMD-05 | P1 | `npm audit --audit-level=moderate` | 0 vulnerabilities |
| CMD-06 | P1 | `git diff --check` | 无空白错误 |
| CMD-07 | P1 | `npm run lint` | 记录全仓历史 baseline，不作为 Phase4 scoped pass 断言 |
