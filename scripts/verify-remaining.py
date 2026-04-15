"""
verify-remaining.py — 验证 VR-01/02/04/05
已知：首页正常，底部 nav 文字是"进度", "学习"等
"""
import json, time, os, re
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5178"
OUT  = "test-results/fix-verify"
os.makedirs(OUT, exist_ok=True)

USER = {"id": "verify-test2", "nickname": "测试用户"}
GAME_PROGRESS = {
    "userId": "verify-test2",
    "campaignProgress": {},
    "advanceProgress": {},
    "wrongQuestions": [],
    "totalQuestionsAttempted": 5,
    "totalQuestionsCorrect": 3
}

def inject(page):
    page.evaluate(f"""() => {{
        localStorage.setItem('mq_version', '2');
        localStorage.setItem('mq_user', JSON.stringify({json.dumps(USER)}));
        localStorage.setItem('mq_game_progress', JSON.stringify({json.dumps(GAME_PROGRESS)}));
    }}""")

def snap(page, name):
    path = f"{OUT}/{name}.png"
    page.screenshot(path=path, full_page=False)
    print(f"  → {path}")
    return path

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 390, "height": 844})
    page = ctx.new_page()

    # 进入首页
    page.goto(BASE)
    inject(page)
    page.reload()
    page.wait_for_load_state("networkidle")
    time.sleep(0.6)
    snap(page, "r0-home")
    print("✅ 首页加载")

    # ─── VR-02：Progress 页 pb ───────────────────────────────
    print("\n[VR-02] Progress 页...")
    page.locator('text=进度').nth(0).click()   # 底部 nav 的"进度" tab
    page.wait_for_load_state("networkidle")
    time.sleep(0.5)
    snap(page, "r2-progress")

    pb = page.evaluate("""() => {
        const root = document.querySelector('.min-h-dvh.bg-bg');
        if (!root) return {error:'not found'};
        return {
            paddingBottom: window.getComputedStyle(root).paddingBottom,
            scrollHeight: root.scrollHeight
        };
    }""")
    print(f"  {pb}")
    pb_val = pb.get('paddingBottom', '')
    print(f"  padding-bottom={pb_val} → {'✅ PASS' if '120' in pb_val else '❌'}")

    # ─── VR-01/05/04：进入练习页 ─────────────────────────────
    # 回首页 → 点主题卡 → 进 TopicSelect → 开始练习
    print("\n[VR-01/05/04] 进入练习页...")
    page.locator('text=学习').nth(0).click()
    page.wait_for_load_state("networkidle")
    time.sleep(0.3)

    # 点第一个主题卡（任意，进 TopicSelect 即可）
    first_card = page.locator('button').filter(has_text="关").first
    first_card.click()
    page.wait_for_load_state("networkidle")
    time.sleep(0.3)
    snap(page, "r3-topic-or-map")

    # 可能进了 CampaignMap 或 TopicSelect，判断一下
    page_text = page.locator('body').text_content()
    if '闯关地图' in page_text:
        print("  进了 CampaignMap，点第一关")
        first_level = page.locator('button[aria-label*="第1关"]').first
        if first_level.count() == 0:
            first_level = page.locator('.grid button').first
        first_level.click()
        page.wait_for_load_state("networkidle")
        time.sleep(0.5)
    elif '开始练习' in page_text or '难度' in page_text:
        print("  在 TopicSelect，点开始")
        start = page.locator('button').filter(has_text="开始").first
        start.click()
        page.wait_for_load_state("networkidle")
        time.sleep(0.5)

    snap(page, "r4-practice-page")

    # VR-01：检查 justify-content
    print("\n[VR-01] Practice 居中...")
    layout = page.evaluate("""() => {
        const area = document.querySelector('.flex-1.flex.flex-col.items-center');
        if (!area) return {error: 'not found'};
        const s = window.getComputedStyle(area);
        const r = area.getBoundingClientRect();
        return {
            justifyContent: s.justifyContent,
            paddingTop: s.paddingTop,
            height: Math.round(r.height)
        };
    }""")
    print(f"  {layout}")
    jc = layout.get('justifyContent', '')
    print(f"  justify-content={jc} → {'✅ PASS' if 'center' in jc else '❌'}")

    # VR-05：填正确答案，看星星
    print("\n[VR-05] 答对星星...")
    try:
        inp = page.locator('input[type="text"]').first
        if inp.count() > 0 and inp.is_visible():
            prompt = page.locator('h2').first.text_content() or ""
            print(f"  题目: {prompt}")
            m = re.search(r'(\d+)\s*([+\-×÷])\s*(\d+)', prompt)
            if m:
                a,op,b = int(m.group(1)),m.group(2),int(m.group(3))
                ans = str({'+':a+b,'-':a-b,'×':a*b,'÷':a//b}.get(op,0))
            else:
                ans = "100"
            print(f"  答案: {ans}")
            inp.fill(ans)
            page.keyboard.press("Enter")
            time.sleep(0.7)
            snap(page, "r5-feedback")

            star_check = page.evaluate("""() => {
                const spans = Array.from(document.querySelectorAll('span'));
                const stars = spans.filter(s => s.textContent.trim() === '⭐');
                const greenPanel = document.querySelector('[class*="bg-success-lt"]');
                return {
                    starCount: stars.length,
                    hasGreenPanel: !!greenPanel
                };
            }""")
            print(f"  {star_check}")
            sc = star_check.get('starCount', 0)
            print(f"  ⭐ 数={sc} → {'✅ PASS' if sc == 3 else '❌ (期望3)'}")
        else:
            # 多选题或其他类型
            print("  非文字输入题，检查 feedback 结构")
            snap(page, "r5-practice-noinput")
    except Exception as e:
        print(f"  异常: {e}")

    # VR-04：退出弹窗
    print("\n[VR-04] 退出弹窗遮罩...")
    try:
        quit_btn = page.locator('button[aria-label="退出练习"]')
        if quit_btn.count() == 0:
            quit_btn = page.locator('button.bg-danger-lt, button.text-danger').first
        if quit_btn.count() > 0:
            quit_btn.click()
            time.sleep(0.4)
            snap(page, "r6-dialog")

            ov = page.evaluate("""() => {
                const el = document.querySelector('.fixed.inset-0.z-50');
                if (!el) return {err:'not found'};
                const s = window.getComputedStyle(el);
                return { bg: s.backgroundColor };
            }""")
            print(f"  {ov}")
            bg = ov.get('bg','')
            # rgba(0,0,0,0.651) → 65%
            print(f"  bg={bg}")
            alpha_m = re.search(r'rgba?\([^,]+,[^,]+,[^,]+,\s*([\d.]+)', bg)
            alpha = float(alpha_m.group(1)) if alpha_m else 0
            print(f"  alpha={alpha:.2f} → {'✅ PASS (≥0.6)' if alpha >= 0.6 else '❌'}")
        else:
            print("  未找到退出按钮")
    except Exception as e:
        print(f"  异常: {e}")

    browser.close()
print("\n验证完成，查看 test-results/fix-verify/")
