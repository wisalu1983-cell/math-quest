from playwright.sync_api import sync_playwright
import os

OUT = r"d:\01-工作\Garena\GI\ClaudeGameStudio\math-quest\test-screenshots"
os.makedirs(OUT, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto("http://localhost:5173")
    page.wait_for_load_state("networkidle")
    page.screenshot(path=f"{OUT}/00_recon_initial.png", full_page=True)

    # Print page content for selector discovery
    html = page.content()
    buttons = page.locator("button").all()
    print(f"Found {len(buttons)} buttons")
    for i, btn in enumerate(buttons):
        txt = btn.text_content()
        print(f"  Button {i}: '{txt}'")

    inputs = page.locator("input").all()
    print(f"Found {len(inputs)} inputs")
    for i, inp in enumerate(inputs):
        placeholder = inp.get_attribute("placeholder")
        print(f"  Input {i}: placeholder='{placeholder}'")

    # Check all text content
    body = page.locator("body").text_content()
    print(f"\nPage text (first 500 chars): {body[:500]}")

    browser.close()
