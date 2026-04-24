"""
verify-qa-fixes-v2.py — 精准验证 5 个修复点
"""

import json, time, os
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5178"
OUT  = os.environ.get("QA_OUT_DIR", "QA/artifacts/fix-verify")
os.makedirs(OUT, exist_ok=True)

USER = {"id": "verify-test", "nickname": "测试用户"}
GAME_PROGRESS = {
    "userId": "verify-test",
    "campaignProgress": {
        "mental-arithmetic": {
            "topicId": "mental-arithmetic",
            "completedLevels": [
                {"levelId": "ma-b1-l1", "bestHearts": 3, "completedAt": "2026-04-15T00:00:00Z"},
            ],
            "campaignCompleted": False
        }
    },
    "advanceProgress": {},
    "wrongQuestions": [],
    "totalQuestionsAttempted": 20,
    "totalQuestionsCorrect": 16
}

def inject_user(page):
    page.evaluate(f"""() => {{
        localStorage.setItem('mq_version', '2');
        localStorage.setItem('mq_user', JSON.stringify({json.dumps(USER)}));
        localStorage.setItem('mq_game_progress', JSON.stringify({json.dumps(GAME_PROGRESS)}));
    }}""")

def wait_for_page(page, text, timeout=5000):
    page.wait_for_selector(f"text={text}", timeout=timeout)

def snap(page, name):
    path = f"{OUT}/{name}.png"
    page.screenshot(path=path, full_page=False)
    print(f"  截图 → {path}")
    return path

results = {}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 390, "height": 844})  # iPhone 14

    # ─── 准备：加载首页并注入用户 ────────────────────────────────
    page = ctx.new_page()
    page.goto(BASE)
    inject_user(page)
    page.reload()
    page.wait_for_load_state("networkidle")
    time.sleep(0.5)

    # 确认在首页
    try:
        page.wait_for_selector("text=每日目标", timeout=4000)
        print("✅ 已进入首页")
        snap(page, "00-home")
    except Exception:
        print("⚠ 未找到首页元素，截图看状态")
        snap(page, "00-debug")

    # ══════════════════════════════════════════════════════
    # [1] F2/F1：CampaignMap 关卡宽度
    # ══════════════════════════════════════════════════════
    print("\n[1/5] CampaignMap 关卡宽度...")
    # 点击第一个主题卡（口算）进入 CampaignMap
    try:
        # 首页 TopicCard 按钮
        first_topic = page.locator("button").filter(has_text="口算")
        if first_topic.count() == 0:
            first_topic = page.locator("button").first
        first_topic.click()
        page.wait_for_load_state("networkidle")
        time.sleep(0.5)
        snap(page, "01-campaign-map")

        widths = page.evaluate("""() => {
            const items = document.querySelectorAll('.grid .relative > button, .grid .relative > div[role="img"]');
            return Array.from(items).slice(0, 6).map(el => ({
                tag: el.tagName,
                width: Math.round(el.getBoundingClientRect().width),
                border: window.getComputedStyle(el).borderWidth
            }));
        }""")
        print(f"  元素: {widths}")
        results['F2'] = widths
        if widths:
            ws = [w['width'] for w in widths]
            diff = max(ws) - min(ws)
            results['F2_diff'] = diff
            print(f"  宽度差: {diff}px → {'✅ PASS' if diff < 5 else '❌ FAIL'}")
        else:
            print("  未找到关卡元素")
    except Exception as e:
        print(f"  异常: {e}")
        results['F2'] = {'error': str(e)}

    # ══════════════════════════════════════════════════════
    # [2] VR-02：Progress 页 padding-bottom
    # ══════════════════════════════════════════════════════
    print("\n[2/5] Progress 页 padding-bottom...")
    # 返回首页再点底部导航的进度 tab
    page.go_back()
    page.wait_for_load_state("networkidle")
    time.sleep(0.3)

    try:
        # BottomNav: 找 aria-label="进度" 的 button
        nav_progress = page.locator('button[aria-label="进度"]')
        if nav_progress.count() == 0:
            nav_progress = page.locator('nav button').nth(1)  # 第2个 nav button
        nav_progress.click()
        time.sleep(0.5)
        page.wait_for_load_state("networkidle")
        snap(page, "02-progress-full")

        pb = page.evaluate("""() => {
            // 找 min-h-dvh 的根 div
            const root = document.querySelector('div.min-h-dvh.bg-bg');
            if (!root) return {error: 'not found'};
            const style = window.getComputedStyle(root);
            const lastCard = root.lastElementChild;
            const rootBottom = root.getBoundingClientRect().bottom;
            const navHeight = document.querySelector('nav')
                ? document.querySelector('nav').getBoundingClientRect().height : 0;
            return {
                paddingBottom: style.paddingBottom,
                scrollHeight: root.scrollHeight,
                navHeight: navHeight
            };
        }""")
        print(f"  padding info: {pb}")
        results['VR02'] = pb
        pb_val = pb.get('paddingBottom', '0px')
        print(f"  padding-bottom: {pb_val} → {'✅ PASS (≥120px)' if '120' in pb_val else '❓ 检查值'}")
    except Exception as e:
        print(f"  异常: {e}")
        results['VR02'] = {'error': str(e)}

    # ══════════════════════════════════════════════════════
    # [3] VR-01：Practice 页居中
    # ══════════════════════════════════════════════════════
    print("\n[3/5] Practice 页布局居中...")
    # 从 Progress 返回首页
    try:
        nav_home = page.locator('button[aria-label="首页"]')
        if nav_home.count() == 0:
            nav_home = page.locator('nav button').first
        nav_home.click()
        time.sleep(0.3)
    except Exception:
        pass

    # 点击主题进入 TopicSelect，再开始练习
    try:
        # 点任意主题卡
        topic_btn = page.locator('button').filter(has_text="口算").first
        if topic_btn.count() == 0:
            # 用 grid 里的第一个按钮
            topic_btn = page.locator('.grid button').first
        topic_btn.click()
        page.wait_for_load_state("networkidle")
        time.sleep(0.3)

        # 在 TopicSelect 页，找"开始练习"之类的按钮
        start_btn = page.locator('button').filter(has_text="开始").first
        if start_btn.count() > 0:
            start_btn.click()
            page.wait_for_load_state("networkidle")
            time.sleep(0.5)
        else:
            # 找 btn-flat
            page.locator('.btn-flat').first.click()
            page.wait_for_load_state("networkidle")
            time.sleep(0.5)

        snap(page, "03-practice-layout")

        layout = page.evaluate("""() => {
            // Practice 页的主内容区域（flex-1 区）
            const main = document.querySelector('.min-h-dvh.bg-bg.flex.flex-col');
            if (!main) return {error: 'main not found'};

            // 找 flex-1 的容器（题目 + 输入 + 按钮的外层）
            const contentArea = main.querySelector('.flex-1.flex.flex-col');
            if (!contentArea) return {error: 'content area not found'};
            const style = window.getComputedStyle(contentArea);

            // 找题目卡
            const questionCard = contentArea.querySelector('.bg-card.rounded-\\\\[20px\\\\]');
            const cardRect = questionCard ? questionCard.getBoundingClientRect() : null;

            // 页面高度 和 内容卡位置
            const mainRect = main.getBoundingClientRect();
            return {
                justifyContent: style.justifyContent,
                paddingTop: style.paddingTop,
                mainHeight: Math.round(mainRect.height),
                cardTop: cardRect ? Math.round(cardRect.top) : null,
                cardHeight: cardRect ? Math.round(cardRect.height) : null
            };
        }""")
        print(f"  布局: {layout}")
        results['VR01'] = layout
        jc = layout.get('justifyContent', '')
        print(f"  justify-content: {jc} → {'✅ PASS' if 'center' in jc else '❌ FAIL'}")
    except Exception as e:
        print(f"  异常: {e}")
        results['VR01'] = {'error': str(e)}
        snap(page, "03-debug")

    # ══════════════════════════════════════════════════════
    # [4] VR-05：答对显示星星
    # ══════════════════════════════════════════════════════
    print("\n[4/5] 答对反馈星星...")
    try:
        # 现在应该在 Practice 页，找输入框
        inp = page.locator('input[placeholder="输入答案"]')
        if inp.count() == 0:
            inp = page.locator('input[type="text"]').first

        if inp.count() > 0:
            # 读题目
            prompt_el = page.locator('h2').first
            prompt = prompt_el.text_content() if prompt_el.count() > 0 else "?"
            print(f"  题目: {prompt}")

            # 用 JS 解析答案（题目格式 "X + Y = ?"，直接 eval 计算）
            import re
            m = re.search(r'(\d+)\s*([+\-×÷])\s*(\d+)', prompt)
            if m:
                a, op, b = int(m.group(1)), m.group(2), int(m.group(3))
                if op == '+': ans = str(a + b)
                elif op == '-': ans = str(a - b)
                elif op == '×': ans = str(a * b)
                elif op == '÷': ans = str(a // b)
                else: ans = "0"
            else:
                ans = "0"
            print(f"  答案: {ans}")

            inp.fill(ans)
            page.keyboard.press("Enter")
            time.sleep(0.6)

            snap(page, "04-feedback-correct")

            stars_info = page.evaluate("""() => {
                // 找 motion.span 星星（text-2xl 内含 ⭐）
                const allSpans = Array.from(document.querySelectorAll('span'));
                const stars = allSpans.filter(s => s.textContent.trim() === '⭐');
                const feedbackDiv = document.querySelector('[class*="bg-success-lt"]');
                return {
                    starCount: stars.length,
                    hasFeedbackPanel: !!feedbackDiv,
                    feedbackClasses: feedbackDiv ? feedbackDiv.className.substring(0, 80) : null
                };
            }""")
            print(f"  星星数: {stars_info}")
            results['VR05'] = stars_info
            sc = stars_info.get('starCount', 0)
            print(f"  ⭐ 数量: {sc} → {'✅ PASS (=3)' if sc == 3 else '❌ FAIL'}")
        else:
            print("  未找到输入框")
            results['VR05'] = {'skipped': True}
            snap(page, "04-no-input")
    except Exception as e:
        print(f"  异常: {e}")
        results['VR05'] = {'error': str(e)}

    # ══════════════════════════════════════════════════════
    # [5] VR-04：退出弹窗遮罩
    # ══════════════════════════════════════════════════════
    print("\n[5/5] 退出弹窗遮罩...")
    try:
        # 找退出按钮
        quit_btn = page.locator('button[aria-label="退出练习"]')
        if quit_btn.count() == 0:
            quit_btn = page.locator('button').filter(has_text="✕").first

        if quit_btn.count() > 0:
            quit_btn.click()
            time.sleep(0.3)
            snap(page, "05-quit-dialog")

            overlay = page.evaluate("""() => {
                const overlay = document.querySelector('.fixed.inset-0.z-50');
                if (!overlay) return {error: 'overlay not found'};
                const style = window.getComputedStyle(overlay);
                return {
                    backgroundColor: style.backgroundColor,
                    backdrop: overlay.className
                };
            }""")
            print(f"  遮罩: {overlay}")
            results['VR04'] = overlay
            # bg-black/65 → rgba(0,0,0,0.647...)
            bg = overlay.get('backgroundColor', '')
            print(f"  颜色: {bg} → {'✅ 约65%不透明' if '0.6' in bg or '165' in bg or '166' in bg else '❓ 检查'}")
        else:
            print("  未找到退出按钮，跳过")
            results['VR04'] = {'skipped': True}
    except Exception as e:
        print(f"  异常: {e}")
        results['VR04'] = {'error': str(e)}

    browser.close()

# ── 最终结论 ────────────────────────────────────────────
print("\n" + "="*60)
print("最终验证结论")
print("="*60)

def check(label, condition, detail=""):
    status = "✅ PASS" if condition else "❌ FAIL"
    print(f"  {label}: {status}  {detail}")

f2 = results.get('F2_diff', 999)
check("F2/F1 关卡宽度", f2 < 5, f"宽度差={f2}px")

pb = results.get('VR02', {}).get('paddingBottom', '')
check("VR-02 Progress pb", '120' in str(pb), f"pb={pb}")

jc = results.get('VR01', {}).get('justifyContent', '')
check("VR-01 Practice居中", 'center' in str(jc), f"justify-content={jc}")

sc = results.get('VR05', {}).get('starCount', 0)
check("VR-05 星星动画", sc == 3, f"star count={sc}")

bg = results.get('VR04', {}).get('backgroundColor', '')
check("VR-04 遮罩颜色", '0.6' in bg or '165' in bg or '166' in bg, f"bg={bg}")

print(f"\n截图: {OUT}/")
