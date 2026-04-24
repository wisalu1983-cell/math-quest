"""
QAleader 冒烟测试 · 侦查阶段：
- 首次访问应用，完成必要的 onboarding
- 识别主要按钮/路由入口
- 输出渲染后的 DOM 片段和截图，供后续脚本确定选择器
"""
from playwright.sync_api import sync_playwright
from pathlib import Path

ART = Path(__file__).parent / "artifacts"
ART.mkdir(exist_ok=True)
URL = "http://localhost:5177/"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1400, "height": 900})
    page = ctx.new_page()
    page.on("console", lambda m: print(f"[console {m.type}] {m.text}"))
    page.on("pageerror", lambda e: print(f"[pageerror] {e}"))

    page.goto(URL)
    page.wait_for_load_state("networkidle", timeout=15000)
    page.screenshot(path=str(ART / "00-landing.png"), full_page=True)

    # 输出当前页面主标题与可见按钮
    title = page.title()
    print(f"[title] {title}")

    buttons = page.locator("button").all()
    print(f"[buttons count] {len(buttons)}")
    for i, b in enumerate(buttons[:20]):
        try:
            txt = (b.inner_text() or "").strip().replace("\n", " ")
            visible = b.is_visible()
            print(f"  [{i}] visible={visible} text={txt[:80]}")
        except Exception as e:
            print(f"  [{i}] err {e}")

    # 尝试导出 store 状态
    store_state = page.evaluate(
        """() => {
          const keys = Object.keys(window).filter(k => k.toLowerCase().includes('store'));
          return { keys };
        }"""
    )
    print(f"[window stores] {store_state}")

    browser.close()
