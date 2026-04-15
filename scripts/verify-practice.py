"""
verify-practice.py — 专门验证 VR-01/05/04（Practice 页相关）
"""
import json, time, os, re
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5178"
OUT  = "test-results/fix-verify"
os.makedirs(OUT, exist_ok=True)

USER = {"id": "verify-test3", "nickname": "测试用户"}
GAME_PROGRESS = {
    "userId": "verify-test3",
    "campaignProgress": {},
    "advanceProgress": {},
    "wrongQuestions": [],
    "totalQuestionsAttempted": 0,
    "totalQuestionsCorrect": 0
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
    print(f"  截图 → {path}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 390, "height": 844})
    page = ctx.new_page()

    page.goto(BASE)
    inject(page)
    page.reload()
    page.wait_for_load_state("networkidle")
    time.sleep(0.6)

    # 点第一个主题卡片进入 CampaignMap
    page.locator('button').filter(has_text="关").first.click()
    page.wait_for_load_state("networkidle")
    time.sleep(0.8)
    snap(page, "p1-campaign-map")

    # 用 force=True 点推荐关卡（因为它有弹跳动画）
    print("[1] 点推荐关卡...")
    try:
        page.locator('button.animate-bounce-rec').click(force=True, timeout=5000)
    except Exception:
        # fallback：直接点 primary 颜色的 button
        page.locator('button.bg-primary').first.click(force=True, timeout=5000)
    page.wait_for_load_state("networkidle")
    time.sleep(0.8)
    snap(page, "p2-practice-init")

    # ── VR-01：检查布局居中 ──────────────────────────────────
    print("\n[VR-01] 检查 Practice 布局居中...")
    layout = page.evaluate("""() => {
        const area = document.querySelector('.flex-1.flex.flex-col.items-center');
        if (!area) return {error: 'content area not found'};
        const s = window.getComputedStyle(area);
        const card = area.querySelector('.bg-card');
        const cardRect = card ? card.getBoundingClientRect() : null;
        const viewport = {w: window.innerWidth, h: window.innerHeight};
        return {
            justifyContent: s.justifyContent,
            paddingTop: s.paddingTop,
            cardTop: cardRect ? Math.round(cardRect.top) : null,
            cardBottom: cardRect ? Math.round(cardRect.bottom) : null,
            viewportH: viewport.h
        };
    }""")
    print(f"  {layout}")
    jc = layout.get('justifyContent', '')
    card_top = layout.get('cardTop') or 0
    viewport_h = layout.get('viewportH', 844)
    card_bottom = layout.get('cardBottom') or 0
    # 居中验证：题目卡上方空白 > 40px（不紧贴顶部）
    top_space = card_top
    bottom_space = viewport_h - card_bottom
    print(f"  justify-content={jc}, 卡片上方={top_space}px, 下方={bottom_space}px")
    print(f"  VR-01: justify-content → {'✅ center' if 'center' in jc else '❌'}")
    print(f"  VR-01: 上下空间比 {top_space}:{bottom_space} → {'✅ 均衡' if abs(top_space - bottom_space) < 100 else '⚠ 偏差较大'}")

    # ── VR-05：答对，看星星 ──────────────────────────────────
    print("\n[VR-05] 答对，检查星星...")
    try:
        inp = page.locator('input[type="text"]').first
        if inp.count() > 0 and inp.is_visible(timeout=3000):
            prompt = (page.locator('h2').first.text_content() or "").strip()
            print(f"  题目: {prompt}")
            m = re.search(r'(\d+)\s*([+\-×÷])\s*(\d+)', prompt)
            if m:
                a, op, b = int(m.group(1)), m.group(2), int(m.group(3))
                ans = str({'+': a+b, '-': a-b, '×': a*b, '÷': a//b}.get(op, 0))
            else:
                # 尝试解析 "? = X" 或其他格式
                nums = re.findall(r'\d+', prompt)
                ans = nums[-1] if nums else "10"
            print(f"  填入答案: {ans}")
            inp.fill(ans)
            page.keyboard.press("Enter")
            time.sleep(0.8)  # 等动画出现
            snap(page, "p3-feedback-correct")

            stars = page.evaluate("""() => {
                const all = Array.from(document.querySelectorAll('*'));
                const stars = all.filter(el =>
                    el.children.length === 0 &&
                    el.textContent.trim() === '⭐'
                );
                const panel = document.querySelector('[class*="bg-success-lt"]');
                return {
                    starCount: stars.length,
                    hasSuccessPanel: !!panel,
                    panelClass: panel ? panel.className.substring(0, 60) : null
                };
            }""")
            print(f"  {stars}")
            sc = stars.get('starCount', 0)
            has_panel = stars.get('hasSuccessPanel', False)
            print(f"  ⭐ 数量={sc} → {'✅ PASS' if sc == 3 else f'❌ (期望3, 实际{sc})'}")
            print(f"  绿色面板: {'✅' if has_panel else '❌'}")

            # ── VR-04：点退出 ────────────────────────────────
            print("\n[VR-04] 退出弹窗遮罩...")
            # 先点"下一题"继续
            page.locator('button.btn-flat').click(timeout=3000)
            time.sleep(0.3)
            # 然后点退出按钮
            quit_btn = page.locator('button[aria-label="退出练习"]')
            if quit_btn.count() == 0:
                quit_btn = page.locator('button.bg-danger-lt')
            quit_btn.first.click(force=True)
            time.sleep(0.4)
            snap(page, "p4-quit-dialog")

            ov = page.evaluate("""() => {
                const el = document.querySelector('.fixed.inset-0.z-50');
                if (!el) return {err: 'overlay not found'};
                return { bg: window.getComputedStyle(el).backgroundColor };
            }""")
            print(f"  {ov}")
            bg = ov.get('bg', '')
            m2 = re.search(r'rgba?\([^,]+,[^,]+,[^,]+,\s*([\d.]+)', bg)
            alpha = float(m2.group(1)) if m2 else 0
            print(f"  alpha={alpha:.3f} → {'✅ PASS (≥0.6)' if alpha >= 0.6 else '❌'}")
        else:
            print("  未找到文字输入框（可能是选择题），检查页面")
            snap(page, "p3-no-input")
            # 检查是否是选择题
            opts = page.locator('button.border-border.bg-card-2')
            if opts.count() > 0:
                print(f"  选择题选项数: {opts.count()}")
                opts.first.click()
                time.sleep(0.2)
                page.locator('button.btn-flat').click(timeout=3000)
                time.sleep(0.8)
                snap(page, "p3-feedback-mc")
    except Exception as e:
        print(f"  异常: {e}")

    browser.close()
print("\n✅ 验证完成")
