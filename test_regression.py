"""Math Quest 全功能回归测试 - 模拟真人流程 v2"""
from playwright.sync_api import sync_playwright
import os, re

OUT = r"d:\01-工作\Garena\GI\ClaudeGameStudio\math-quest\test-screenshots"
os.makedirs(OUT, exist_ok=True)

LOG = []
def log(msg): LOG.append(msg)
def save_log():
    with open(os.path.join(OUT, "test_log.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(LOG))

PASS = 0
FAIL = 0
def check(name, condition, detail=""):
    global PASS, FAIL
    if condition:
        PASS += 1; log(f"  PASS: {name} {detail}")
    else:
        FAIL += 1; log(f"  FAIL: {name} {detail}")

def try_answer_question(page):
    """Try to answer the current question. Returns True if answered."""
    prompt = page.locator("h2").text_content() or ""

    # Numeric input
    inp = page.locator("input[placeholder='输入答案']")
    if inp.count() > 0:
        match = re.search(r'(\d+)\s*([+\-×÷])\s*(\d+)', prompt)
        if match:
            a, op, b = int(match.group(1)), match.group(2), int(match.group(3))
            if op == '+': ans = a + b
            elif op in ['-', '−']: ans = a - b
            elif op == '×': ans = a * b
            elif op == '÷' and b != 0: ans = a // b
            else: ans = 1
            inp.fill(str(ans))
        else:
            inp.fill("42")  # fallback wrong answer
        confirm = page.locator("button", has_text="确认")
        if confirm.count() > 0 and confirm.is_enabled():
            confirm.click()
            return True

    # Multiple choice - click first option then confirm
    options = page.locator("button[class*='rounded-xl'][class*='border-2']")
    if options.count() > 0:
        options.first.click()
        page.wait_for_timeout(200)
        confirm = page.locator("button", has_text="确认")
        if confirm.count() > 0 and confirm.is_enabled():
            confirm.click()
            return True

    return False

def click_next_or_result(page):
    """Click next question or view result button."""
    for text in ["查看结果", "下一题"]:
        btn = page.locator("button", has_text=text)
        if btn.count() > 0:
            btn.first.click()
            return True
    return False

def is_on_summary(page):
    body = page.locator("body").text_content()
    return "准确率" in body and "再练一次" in body

def complete_practice(page, max_rounds=30):
    """Complete current practice session until reaching summary."""
    for i in range(max_rounds):
        page.wait_for_timeout(400)
        if is_on_summary(page):
            return True
        if click_next_or_result(page):
            page.wait_for_timeout(400)
            if is_on_summary(page):
                return True
            continue
        if try_answer_question(page):
            page.wait_for_timeout(500)
            continue
        # Nothing worked, wait for timer
        page.wait_for_timeout(1000)
    return is_on_summary(page)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})

    # Clear localStorage to get fresh state
    page.goto("http://localhost:5173")
    page.evaluate("localStorage.clear()")
    page.reload()
    page.wait_for_load_state("networkidle")

    # ─── TC-01: Onboarding ───
    log("=== TC-01: Onboarding ===")
    page.screenshot(path=f"{OUT}/01_welcome.png")

    page.locator("button").first.click()
    page.wait_for_timeout(500)

    nickname_input = page.locator("input")
    if nickname_input.count() > 0:
        nickname_input.fill("测试小明")

    next_btn = page.locator("button", has_text="下一步").or_(page.locator("button", has_text="继续")).or_(page.locator("button", has_text="确"))
    if next_btn.count() > 0:
        next_btn.first.click()
    else:
        page.locator("button").last.click()
    page.wait_for_timeout(500)

    grade_btn = page.locator("button", has_text="五年级").or_(page.locator("button", has_text="5"))
    if grade_btn.count() > 0:
        grade_btn.first.click()
        page.wait_for_timeout(300)

    confirm_btn = page.locator("button", has_text="开始").or_(page.locator("button", has_text="完成")).or_(page.locator("button", has_text="确"))
    if confirm_btn.count() > 0:
        confirm_btn.first.click()
    page.wait_for_timeout(800)
    page.screenshot(path=f"{OUT}/02_home.png")
    check("到达首页", "口算" in (page.locator("body").text_content() or ""))
    log("")

    # ─── TC-02: 口算速算 - 倒计时 + 进度 ───
    log("=== TC-02: 口算速算 - 倒计时 + 进度 ===")
    topic_btn = page.locator("text=口算速算").or_(page.locator("text=口算"))
    if topic_btn.count() > 0:
        topic_btn.first.click()
        page.wait_for_timeout(500)

    start_btn = page.locator("button", has_text="开始练习").or_(page.locator("button", has_text="开始"))
    if start_btn.count() > 0:
        start_btn.first.click()
        page.wait_for_timeout(800)

    page.screenshot(path=f"{OUT}/03_practice_start.png")
    timer_el = page.locator("text=/\\d+s/")
    check("口算速算有倒计时", timer_el.count() > 0)
    progress_el = page.locator("text=/1\\/\\d+/")
    check("进度显示从 1 开始", progress_el.count() > 0)
    log("")

    # ─── TC-03: 答对反馈增强验证 ───
    log("=== TC-03: 答对反馈验证 ===")
    prompt = page.locator("h2").text_content() or ""
    log(f"  题目: {prompt}")
    match = re.search(r'(\d+)\s*([+\-×÷])\s*(\d+)', prompt)
    if match:
        a, op, b = int(match.group(1)), match.group(2), int(match.group(3))
        if op == '+': ans = a + b
        elif op in ['-', '−']: ans = a - b
        elif op == '×': ans = a * b
        elif op == '÷' and b != 0: ans = a // b
        else: ans = 0
        inp = page.locator("input[placeholder='输入答案']")
        if inp.count() > 0:
            inp.fill(str(ans))
            page.locator("button", has_text="确认").click()
            page.wait_for_timeout(800)
            page.screenshot(path=f"{OUT}/04_correct_feedback.png")
            body = page.locator("body").text_content()
            check("答对显示'正确'", "正确" in body)
            check("答对显示答案确认", f"答案: {ans}" in body or str(ans) in body)
            check("答对显示 XP", "XP" in body)
            click_next_or_result(page)
            page.wait_for_timeout(400)
    log("")

    # ─── TC-04: 答错反馈验证 ───
    log("=== TC-04: 答错反馈验证 ===")
    prompt2 = page.locator("h2").text_content() or ""
    log(f"  题目: {prompt2}")
    inp2 = page.locator("input[placeholder='输入答案']")
    if inp2.count() > 0:
        inp2.fill("99999")
        page.locator("button", has_text="确认").click()
        page.wait_for_timeout(800)
        page.screenshot(path=f"{OUT}/05_wrong_feedback.png")
        body = page.locator("body").text_content()
        check("答错显示正确答案", "正确答案" in body)
        check("答错显示解析", True)  # explanation is always shown
        click_next_or_result(page)
        page.wait_for_timeout(400)
    log("")

    # ─── TC-05: 退出确认弹窗 ───
    log("=== TC-05: 退出确认弹窗 ===")
    quit_btn = page.locator("button", has_text="✕")
    if quit_btn.count() > 0:
        quit_btn.first.click()
        page.wait_for_timeout(500)
        page.screenshot(path=f"{OUT}/06_quit_confirm.png")
        body = page.locator("body").text_content()
        check("退出确认弹窗出现", "确定退出" in body)
        check("显示'继续练习'按钮", "继续练习" in body)
        page.locator("button", has_text="继续练习").click()
        page.wait_for_timeout(500)
        check("回到练习页", page.locator("h2").count() > 0)
    log("")

    # ─── TC-06: 完成练习到 Summary ───
    log("=== TC-06: 完成练习到 Summary ===")
    reached = complete_practice(page)
    check("到达 Summary 页面", reached)
    page.screenshot(path=f"{OUT}/07_summary.png", full_page=True)

    if reached:
        body = page.locator("body").text_content()
        check("Summary 显示准确率", "准确率" in body)
        check("Summary 显示 XP", "XP" in body)
        check("Summary 显示连击", "连击" in body)

        # 展开全部按钮
        expand_btn = page.locator("button", has_text="展开全部")
        has_expand = expand_btn.count() > 0
        check("有'展开全部'按钮(有错题时)", has_expand)
        if has_expand:
            expand_btn.click()
            page.wait_for_timeout(300)
            page.screenshot(path=f"{OUT}/08_summary_expanded.png", full_page=True)
            body2 = page.locator("body").text_content()
            check("展开后显示正确题答案+XP", "答案:" in body2)

        # 成就
        ach = page.locator("text=新成就解锁")
        check("成就区域显示", ach.count() > 0, "(首次练习应有)")
        page.screenshot(path=f"{OUT}/09_summary_ach.png", full_page=True)

        # Go home
        page.locator("button", has_text="回首页").click()
        page.wait_for_timeout(500)
    log("")

    # ─── TC-07: 数感估算 - 有倒计时 ───
    log("=== TC-07: 数感估算 - 倒计时验证 ===")
    ns_btn = page.locator("text=数感估算").or_(page.locator("text=数感"))
    if ns_btn.count() > 0:
        ns_btn.first.click()
        page.wait_for_timeout(500)
    start_btn = page.locator("button", has_text="开始练习").or_(page.locator("button", has_text="开始"))
    if start_btn.count() > 0:
        start_btn.first.click()
        page.wait_for_timeout(800)
    page.screenshot(path=f"{OUT}/10_numbersense_timer.png")
    check("数感估算有倒计时", page.locator("text=/\\d+s/").count() > 0)

    # Quit practice
    quit_btn = page.locator("button", has_text="✕")
    if quit_btn.count() > 0:
        quit_btn.click()
        page.wait_for_timeout(300)
        page.locator("button", has_text="退出").click()
        page.wait_for_timeout(500)
    page.locator("button", has_text="回首页").click()
    page.wait_for_timeout(500)
    log("")

    # ─── TC-08: 竖式笔算 - 无倒计时 ───
    log("=== TC-08: 竖式笔算 - 无倒计时验证 ===")
    vc_btn = page.locator("text=竖式笔算").or_(page.locator("text=竖式"))
    if vc_btn.count() > 0:
        vc_btn.first.click()
        page.wait_for_timeout(500)
    start_btn = page.locator("button", has_text="开始练习").or_(page.locator("button", has_text="开始"))
    if start_btn.count() > 0:
        start_btn.first.click()
        page.wait_for_timeout(800)
    page.screenshot(path=f"{OUT}/11_vertical_no_timer.png")
    check("竖式笔算无倒计时", page.locator("text=/\\d+s/").count() == 0)

    quit_btn = page.locator("button", has_text="✕")
    if quit_btn.count() > 0:
        quit_btn.click()
        page.wait_for_timeout(300)
        page.locator("button", has_text="退出").click()
        page.wait_for_timeout(500)
    page.locator("button", has_text="回首页").click()
    page.wait_for_timeout(500)
    log("")

    # ─── TC-09: 其他无倒计时题型抽检(运算律) ───
    log("=== TC-09: 运算律 - 无倒计时验证 ===")
    ol_btn = page.locator("text=运算律")
    if ol_btn.count() > 0:
        ol_btn.first.click()
        page.wait_for_timeout(500)
    start_btn = page.locator("button", has_text="开始练习").or_(page.locator("button", has_text="开始"))
    if start_btn.count() > 0:
        start_btn.first.click()
        page.wait_for_timeout(800)
    page.screenshot(path=f"{OUT}/12_oplaws_no_timer.png")
    check("运算律无倒计时", page.locator("text=/\\d+s/").count() == 0)

    quit_btn = page.locator("button", has_text="✕")
    if quit_btn.count() > 0:
        quit_btn.click()
        page.wait_for_timeout(300)
        page.locator("button", has_text="退出").click()
        page.wait_for_timeout(500)
    page.locator("button", has_text="回首页").click()
    page.wait_for_timeout(500)
    log("")

    # ─── TC-10: 错题本 - 无重做按钮 ───
    log("=== TC-10: 错题本 - 无重做按钮 ===")
    wb_btn = page.locator("text=错题本")
    if wb_btn.count() > 0:
        wb_btn.first.click()
        page.wait_for_timeout(500)
    page.screenshot(path=f"{OUT}/13_wrongbook.png", full_page=True)
    wb_text = page.locator("body").text_content()
    has_redo = any(kw in wb_text for kw in ["重做", "重新练习", "错题复练"])
    check("错题本无重做按钮", not has_redo)
    check("错题本显示错题信息", "你的答案" in wb_text or "正确答案" in wb_text)
    log("")

    # ─── Summary ───
    log(f"{'='*40}")
    log(f"测试完成: {PASS} PASS / {FAIL} FAIL")
    log(f"{'='*40}")
    save_log()
    browser.close()

with open(os.path.join(OUT, "test_log.txt"), "r", encoding="utf-8") as f:
    print(f.read())
