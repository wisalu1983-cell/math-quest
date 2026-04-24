"""
verify-qa-fixes.py — 验证视觉 QA 修复效果
逐一截图并用 JS 测量关键属性，确认 5 个修复点
"""

import json, os, time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5178"
OUT  = os.environ.get("QA_OUT_DIR", "QA/artifacts/fix-verify")

os.makedirs(OUT, exist_ok=True)

# 注入 localStorage 让 App 跳过 onboarding，直接进首页
USER = {"id": "verify-test", "nickname": "测试用户"}
GAME_PROGRESS = {
    "userId": "verify-test",
    "campaignProgress": {
        "mental-arithmetic": {
            "topicId": "mental-arithmetic",
            "completedLevels": [
                {"levelId": "ma-b1-l1", "bestHearts": 3, "completedAt": "2026-04-15T00:00:00Z"},
                {"levelId": "ma-b1-l2", "bestHearts": 2, "completedAt": "2026-04-15T00:00:00Z"},
            ],
            "campaignCompleted": False
        }
    },
    "advanceProgress": {},
    "wrongQuestions": [],
    "totalQuestionsAttempted": 15,
    "totalQuestionsCorrect": 12
}

def setup_storage(page):
    page.evaluate(f"""() => {{
        localStorage.setItem('mq_version', '2');
        localStorage.setItem('mq_user', JSON.stringify({json.dumps(USER)}));
        localStorage.setItem('mq_game_progress', JSON.stringify({json.dumps(GAME_PROGRESS)}));
    }}""")

results = {}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # ── 移动端视口（375×812，iPhone SE 尺寸）────────────────────────────
    ctx = browser.new_context(viewport={"width": 375, "height": 812})

    # ══════════════════════════════════════════════════════
    # Fix 1 & 2：CampaignMap — 关卡宽度 + 边框（F2/P1, F1/P3）
    # ══════════════════════════════════════════════════════
    print("\n[1/5] 验证 CampaignMap 关卡宽度...")
    page = ctx.new_page()
    page.goto(BASE)
    setup_storage(page)
    # 刷新让 App 读取 localStorage
    page.reload()
    page.wait_for_load_state("networkidle")
    time.sleep(0.5)

    # 从首页导航到 mental-arithmetic 关卡地图
    # 点击第一个主题卡片
    try:
        page.click("text=口算练习", timeout=3000)
    except Exception:
        try:
            page.click(".grid button:first-child", timeout=3000)
        except Exception:
            # 直接通过 JS 设置 UI store 页面
            page.evaluate("""() => {
                // 通过 zustand store 设置页面
                const event = new CustomEvent('test-navigate', {detail: 'campaign-map'});
                window.dispatchEvent(event);
            }""")

    page.wait_for_load_state("networkidle")
    time.sleep(0.8)
    page.screenshot(path=f"{OUT}/fix1-campaign-map.png", full_page=True)

    # 测量关卡卡片宽度
    widths = page.evaluate("""() => {
        const buttons = document.querySelectorAll('.grid .relative button, .grid .relative div[role="img"]');
        return Array.from(buttons).slice(0, 6).map(el => ({
            tag: el.tagName,
            width: el.getBoundingClientRect().width,
            borderWidth: window.getComputedStyle(el).borderWidth,
            classList: el.className.substring(0, 60)
        }));
    }""")
    print(f"  关卡元素: {json.dumps(widths, ensure_ascii=False, indent=2)}")
    results['campaign-map-widths'] = widths

    # ══════════════════════════════════════════════════════
    # Fix 2：Progress 页 padding-bottom（VR-02）
    # ══════════════════════════════════════════════════════
    print("\n[2/5] 验证 Progress 页 padding-bottom...")
    try:
        # 找底部 nav 的进度 tab
        page.click("text=进度", timeout=3000)
    except Exception:
        page.evaluate("window.history.pushState({}, '', '/')")
        page.reload()
        setup_storage(page)
        page.reload()
        page.wait_for_load_state("networkidle")
        page.click("text=进度", timeout=5000)

    page.wait_for_load_state("networkidle")
    time.sleep(0.5)
    page.screenshot(path=f"{OUT}/fix2-progress-page.png", full_page=True)

    # 测量 pb 值
    pb_info = page.evaluate("""() => {
        const root = document.querySelector('.min-h-dvh.bg-bg');
        if (!root) return null;
        const style = window.getComputedStyle(root);
        return {
            paddingBottom: style.paddingBottom,
            scrollHeight: root.scrollHeight,
            clientHeight: root.clientHeight
        };
    }""")
    print(f"  Progress root: {pb_info}")
    results['progress-padding'] = pb_info

    # ══════════════════════════════════════════════════════
    # Fix 3：Practice 页垂直居中（VR-01）
    # ══════════════════════════════════════════════════════
    print("\n[3/5] 验证 Practice 页布局居中...")
    # 进入答题页：先选一个主题练习
    page.reload()
    setup_storage(page)
    page.reload()
    page.wait_for_load_state("networkidle")
    time.sleep(0.3)

    # 通过 localStorage 直接设置 session 状态，然后注入 UI store 导航到 practice
    # 或者直接用 Zustand store 导航
    page.evaluate("""() => {
        // 模拟一个最简 session store 状态，让 practice 页渲染一个题目
        const sessionData = {
            state: {
                session: { sessionMode: 'practice', topicId: 'mental-arithmetic' },
                questions: [{
                    id: 'q1', type: 'numeric-input', topicId: 'mental-arithmetic',
                    prompt: '12 + 34 = ?', difficulty: 3,
                    data: { operator: '+', operands: [12, 34] },
                    solution: { answer: 46, explanation: '12 + 34 = 46' }
                }],
                currentIndex: 0,
                totalQuestions: 5,
                hearts: 3,
                showFeedback: false,
                lastAnswerCorrect: false
            },
            version: 0
        };
        localStorage.setItem('session-store', JSON.stringify(sessionData));
    }""")

    # 改为通过 UI：点首页 → 主题 → 选难度 → 开始
    try:
        page.click("text=口算练习", timeout=3000)
        page.wait_for_load_state("networkidle")
        time.sleep(0.3)
        # 在 TopicSelect 选择开始
        page.click("text=开始练习", timeout=3000)
        page.wait_for_load_state("networkidle")
        time.sleep(0.5)
    except Exception as e:
        print(f"  导航到练习页失败: {e}")

    practice_shot = f"{OUT}/fix3-practice-layout.png"
    page.screenshot(path=practice_shot, full_page=False)

    # 测量题目区域的垂直布局
    layout_info = page.evaluate("""() => {
        const container = document.querySelector('.flex-1.flex.flex-col');
        if (!container) return {error: 'container not found'};
        const style = window.getComputedStyle(container);
        const rect = container.getBoundingClientRect();
        return {
            justifyContent: style.justifyContent,
            paddingTop: style.paddingTop,
            paddingBottom: style.paddingBottom,
            containerTop: rect.top,
            containerHeight: rect.height,
            classList: container.className.substring(0, 100)
        };
    }""")
    print(f"  Practice container: {layout_info}")
    results['practice-layout'] = layout_info

    # ══════════════════════════════════════════════════════
    # Fix 4：答对后的 feedback panel 星星（VR-05）
    # ══════════════════════════════════════════════════════
    print("\n[4/5] 验证答对反馈面板（星星）...")
    # 尝试在 practice 页答题
    try:
        inp = page.locator('input[placeholder="输入答案"]')
        if inp.count() > 0:
            # 先读题目
            prompt = page.locator('h2').first.text_content()
            print(f"  题目: {prompt}")
            # 注入正确答案（通过 JS 直接调用 submitAnswer）
            page.evaluate("""() => {
                // 用 Zustand store 直接提交答案
                const stores = Object.keys(window).filter(k => k.startsWith('__zustand'));
                // 找到 session store 并直接 submitAnswer
            }""")
            # 实际填写数字
            # 先截 feedback 截图：直接用 JS 触发 showFeedback=true + lastAnswerCorrect=true
            page.evaluate("""() => {
                // Zustand devtools 不一定暴露，改为直接用 DOM 验证
                // 模拟答对状态：设置 zustand 状态
                // React 状态无法直接从外部注入，只能填正确答案
            }""")
            inp.fill("46")
            page.keyboard.press("Enter")
            time.sleep(0.5)
            page.screenshot(path=f"{OUT}/fix4-feedback-correct.png", full_page=False)

            # 检查是否有星星 span
            stars = page.evaluate("""() => {
                const stars = document.querySelectorAll('.feedback-panel span, [class*="feedback"] span');
                const motionSpans = document.querySelectorAll('span.text-2xl');
                return {
                    motionSpanCount: motionSpans.length,
                    motionSpanTexts: Array.from(motionSpans).map(s => s.textContent).slice(0, 5),
                    hasFeedback: !!document.querySelector('[class*="bg-success"]')
                };
            }""")
            print(f"  Feedback 星星: {stars}")
            results['feedback-stars'] = stars
        else:
            print("  未找到输入框，跳过")
            results['feedback-stars'] = {'skipped': True}
    except Exception as e:
        print(f"  答题验证异常: {e}")
        results['feedback-stars'] = {'error': str(e)}

    # ══════════════════════════════════════════════════════
    # Fix 5：退出弹窗遮罩（VR-04）
    # ══════════════════════════════════════════════════════
    print("\n[5/5] 验证退出弹窗遮罩...")
    try:
        quit_btn = page.locator('button[aria-label="退出练习"]')
        if quit_btn.count() > 0:
            quit_btn.click()
            time.sleep(0.3)
            page.screenshot(path=f"{OUT}/fix5-quit-dialog.png", full_page=False)

            overlay_info = page.evaluate("""() => {
                const overlay = document.querySelector('.fixed.inset-0.z-50');
                if (!overlay) return {error: 'overlay not found'};
                const style = window.getComputedStyle(overlay);
                return {
                    backgroundColor: style.backgroundColor,
                    classList: overlay.className
                };
            }""")
            print(f"  遮罩样式: {overlay_info}")
            results['dialog-overlay'] = overlay_info
        else:
            print("  未找到退出按钮，跳过")
            results['dialog-overlay'] = {'skipped': True}
    except Exception as e:
        print(f"  弹窗验证异常: {e}")
        results['dialog-overlay'] = {'error': str(e)}

    browser.close()

# 输出汇总
print("\n" + "="*60)
print("验证结果汇总")
print("="*60)

# F2: 关卡宽度
widths_data = results.get('campaign-map-widths', [])
if widths_data:
    tags_widths = [(w['tag'], round(w['width'], 1)) for w in widths_data]
    print(f"\n[F2] 关卡元素宽度: {tags_widths}")
    if widths_data:
        all_widths = [w['width'] for w in widths_data if w['width'] > 0]
        if all_widths:
            diff = max(all_widths) - min(all_widths)
            print(f"     宽度差: {diff:.1f}px  {'✅ 通过（<10px）' if diff < 10 else '❌ 仍有差异'}")

# VR-02: padding-bottom
pb = results.get('progress-padding', {})
if pb:
    print(f"\n[VR-02] Progress padding-bottom: {pb.get('paddingBottom', '?')}  {'✅' if '120' in str(pb.get('paddingBottom','')) else '❓'}")

# VR-01: justify-content
layout = results.get('practice-layout', {})
jc = layout.get('justifyContent', '?')
print(f"\n[VR-01] Practice justify-content: {jc}  {'✅ center' if 'center' in jc else '❓'}")

# VR-05: stars
stars = results.get('feedback-stars', {})
print(f"\n[VR-05] Feedback 星星: {stars}")

# VR-04: overlay
overlay = results.get('dialog-overlay', {})
bg = overlay.get('backgroundColor', '?')
print(f"\n[VR-04] 遮罩颜色: {bg}")

print(f"\n截图已保存到 {OUT}/")
