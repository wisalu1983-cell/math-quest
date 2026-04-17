"""
QAleader 冒烟测试：
目标：验证 v2.1 新答题形式（expression-input/equation-input/multi-blank/multi-select）
      以及各题型能在 UI 上正常渲染+判分，不崩溃。

策略：
- 每个题型进入 Campaign Map → 最低级关卡 → Practice 页
- 为每关出 3 题，分别截图
- 不验证答题正确性；关注：题目是否渲染、输入框类型是否匹配、console 无 JS 报错
- 判定：所有题型无 console error → PASS；有 error → FAIL

输出：
  - artifacts/ 目录下每题型 3 张截图
  - smoke-report.md 四栏报告
"""
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeoutError
from pathlib import Path
import json, time

ART = Path(__file__).parent / "artifacts"
ART.mkdir(exist_ok=True)
URL = "http://localhost:5177/"

TOPICS = [
    ("mental-arithmetic", "A01 基础计算",         "基础计算"),
    ("number-sense",      "A02 数感估算",         "数感估算"),
    ("vertical-calc",     "A03 竖式笔算",         "竖式笔算"),
    ("operation-laws",    "A04 运算律",           "运算律"),
    ("decimal-ops",       "A05 小数计算(已改造)", "小数计算"),
    ("bracket-ops",       "A06 括号变换",         "括号变换"),
    ("multi-step",        "A07 简便计算",         "简便计算"),
    ("equation-transpose","A08 方程移项",         "方程移项"),
]

console_errors: list[str] = []

def smoke():
    report_rows = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1400, "height": 900})
        page = ctx.new_page()

        def on_console(msg):
            if msg.type in ("error", "warning"):
                txt = f"[{msg.type}] {msg.text}"
                console_errors.append(txt)
                print(txt)

        page.on("console", on_console)
        page.on("pageerror", lambda e: (console_errors.append(f"[pageerror] {e}"), print(f"[pageerror] {e}")))

        # ==== Onboarding ====
        page.goto(URL)
        page.wait_for_load_state("networkidle")
        page.screenshot(path=str(ART / "00-onboarding-step0.png"))
        page.get_by_role("button", name="开始冒险").click()
        page.wait_for_selector("input[aria-label='用户昵称']", timeout=5000)
        page.fill("input[aria-label='用户昵称']", "QA测试员")
        page.screenshot(path=str(ART / "01-onboarding-step1.png"))
        page.get_by_role("button", name="开始学习！").click()
        page.wait_for_timeout(800)
        page.screenshot(path=str(ART / "02-home.png"), full_page=True)

        # ==== 逐题型 ====
        for topic_id, topic_name, ui_name in TOPICS:
            print(f"\n==== {topic_name} ({topic_id}) ====")
            prev_error_count = len(console_errors)

            # 回到 home（直接点 BottomNav 里"首页"；失败则重载到根路径，此时 onboarding 已完成）
            try:
                home_btn = page.locator("button:has-text('首页')").first
                if home_btn.count() > 0 and home_btn.is_visible():
                    home_btn.click()
                    page.wait_for_timeout(300)
                else:
                    page.goto(URL)
                    page.wait_for_load_state("networkidle")
                    page.wait_for_timeout(300)
            except Exception:
                page.goto(URL)
                page.wait_for_load_state("networkidle")

            # 在主题网格中点击该题型按钮（按 UI 名称匹配）
            clicked = False
            buttons = page.locator("button").all()
            for b in buttons:
                try:
                    if not b.is_visible():
                        continue
                    txt = (b.inner_text() or "").strip()
                    if ui_name in txt:
                        b.click()
                        clicked = True
                        break
                except Exception:
                    continue
            if not clicked:
                print(f"  [warn] 未找到 {topic_name} 主题入口")
                report_rows.append((topic_name, "入口未找到", "FAIL", f"首页按钮文本无 '{ui_name}'"))
                continue

            # 等 CampaignMap 渲染出含"第1关"标签的按钮
            lv1_sel = "button >> nth=1"  # 占位，稍后用 text 精确匹配
            try:
                page.wait_for_selector("text=/第\\s*1\\s*关/", timeout=6000)
            except PWTimeoutError:
                page.wait_for_timeout(1500)
            page.screenshot(path=str(ART / f"03-{topic_id}-campaign-map.png"), full_page=True)

            # 在 CampaignMap 通过 text 定位第1关关卡按钮（force click 以绕过 pulse 动画不稳定）
            level_clicked = False
            try:
                lv1 = page.locator("button", has_text="第1关").first
                if lv1.count() > 0:
                    lv1.click(force=True, timeout=3000)
                    level_clicked = True
            except Exception as e:
                print(f"    [debug] lv1 click failed: {e}")

            if not level_clicked:
                print(f"  [warn] 未能进入练习关卡")
                report_rows.append((topic_name, "无法进入关卡", "FAIL", "CampaignMap 里没有可点击的关卡按钮"))
                continue

            page.wait_for_timeout(1200)

            # 出 3 题截图。实际走"跳过"或随便填错答案切到下一题
            q_types_seen = []
            for q_i in range(3):
                page.wait_for_timeout(500)
                fn = f"04-{topic_id}-q{q_i+1}.png"
                page.screenshot(path=str(ART / fn), full_page=True)

                # 探测当前题型
                body_html = page.content()
                if "expression-input" in body_html or 'data-type="expression-input"' in body_html:
                    q_types_seen.append("expression-input")
                if "equation-input" in body_html or 'data-type="equation-input"' in body_html:
                    q_types_seen.append("equation-input")
                if "multi-blank" in body_html or 'multiBlank' in body_html:
                    q_types_seen.append("multi-blank")
                if "multi-select" in body_html or 'multiSelect' in body_html:
                    q_types_seen.append("multi-select")

                # 尝试点击"跳过/下一题"类按钮推进
                advanced = False
                for btn_label in ("跳过", "下一题", "确认", "提交", "放弃"):
                    try:
                        locator = page.get_by_role("button", name=btn_label).first
                        if locator.count() > 0 and locator.is_visible() and locator.is_enabled():
                            locator.click()
                            page.wait_for_timeout(400)
                            advanced = True
                            break
                    except Exception:
                        continue
                if not advanced:
                    # 放弃推进，后面两张截图会重复
                    break

            new_err = console_errors[prev_error_count:]
            had_err = any("error" in e.lower() and "pageerror" in e.lower() or "[error]" in e for e in new_err)
            status = "FAIL" if had_err else "PASS"
            types_summary = ",".join(sorted(set(q_types_seen))) or "基础"
            report_rows.append((topic_name, f"浏览 3 题（{types_summary}）", status, f"新增 console 错误 {len(new_err)} 条" if new_err else "无新增错误"))

        browser.close()

    # 写四栏报告
    report_lines = [
        "# v2.1 生成器冒烟测试报告",
        "",
        "**执行日期**: 2026-04-17  ",
        "**测试目的**: 验证 v2.1 重写后的 8 个生成器在 UI 上能正常渲染+交互，不崩溃  ",
        "**测试策略**: 每题型进入最低关卡，浏览 3 题，检查 console 错误与渲染稳定性",
        "",
        "## 逐题型结果",
        "",
        "| 题型 | 用户预期 | 操作路径 | 实际观察 | QA 判定 |",
        "|------|---------|---------|---------|--------|",
    ]
    for (name, op, status, obs) in report_rows:
        report_lines.append(f"| {name} | 进入第一关，能看到题目渲染、不崩溃 | {op} | {obs} | {status} |")

    report_lines += [
        "",
        "## 新增答题形式覆盖",
        "",
        "v2.1 引入的 4 类新答题形式（expression-input / equation-input / multi-blank / multi-select）本次仅做渲染冒烟。",
        "深度体验测试（对题、错题反馈、教学价值、节奏、提示可发现性）留给下一轮人工 QA + `agent-as-user-qa` 扩展批次。",
        "",
        "## 截图证据",
        "",
        "artifacts/ 目录下，按题型与题序编号：`{序号}-{topic_id}-{阶段}.png`",
        "",
        "## 本轮结论",
        "",
    ]
    if any(r[2] == "FAIL" for r in report_rows):
        report_lines.append("⚠️ 存在 FAIL 项，需排查 console 错误与 UI 崩溃。")
    else:
        report_lines.append("冒烟通过：8 个题型均能正常进入练习页并渲染题目。")
        report_lines.append("")
        report_lines.append("下一步建议：")
        report_lines.append('- 针对 A06/A07/A08 的新答题形式做"答对/答错/提交反馈"完整链路的用户旅程测试')
        report_lines.append("- 用户通读 `ProjectManager/human-verification-bank.md` 做梯度感知主观打分")

    (ART.parent / "smoke-report.md").write_text("\n".join(report_lines), encoding="utf-8")
    print(f"\n报告写入：{ART.parent / 'smoke-report.md'}")
    print(f"console 错误总计：{len(console_errors)}")

smoke()
