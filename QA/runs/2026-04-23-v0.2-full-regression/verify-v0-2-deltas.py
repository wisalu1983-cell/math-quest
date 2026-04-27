import json
import os
import time

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:5173"
RUN_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(RUN_DIR, "artifacts", "delta")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

FIXED_TS = 1760860800000
USER = {
    "id": "v02-delta-qa",
    "nickname": "v0.2专项验收",
    "avatarSeed": "v02-delta-seed",
    "createdAt": FIXED_TS,
    "settings": {"soundEnabled": False, "hapticsEnabled": False},
}


def make_storage(completed_level_ids):
    game_progress = {
        "userId": USER["id"],
        "campaignProgress": {
            "number-sense": {
                "topicId": "number-sense",
                "completedLevels": [
                    {"levelId": level_id, "bestHearts": 3, "completedAt": FIXED_TS + index}
                    for index, level_id in enumerate(completed_level_ids)
                ],
                "campaignCompleted": False,
            }
        },
        "advanceProgress": {},
        "wrongQuestions": [],
        "totalQuestionsAttempted": 0,
        "totalQuestionsCorrect": 0,
        "rankProgress": {"currentTier": "apprentice", "history": []},
    }
    return {
        "user": json.dumps(USER, ensure_ascii=False),
        "progress": json.dumps(game_progress, ensure_ascii=False),
    }


def screenshot(page, name):
    path = os.path.join(ARTIFACTS_DIR, f"{name}.png")
    page.screenshot(path=path, full_page=False)
    return os.path.relpath(path, RUN_DIR).replace("\\", "/")


def inject_storage(page, completed_level_ids):
    payload = make_storage(completed_level_ids)
    page.evaluate(
        """(data) => {
            localStorage.clear();
            localStorage.setItem('mq_version', '3');
            localStorage.setItem('mq_user', data.user);
            localStorage.setItem('mq_game_progress', data.progress);
        }""",
        payload,
    )


def wait_for_app(page):
    page.wait_for_load_state("networkidle")
    time.sleep(0.4)


def get_prompt_locator(page):
    for selector in ["h2", "h3", ".font-black"]:
        locator = page.locator(selector)
        count = locator.count()
        for index in range(count):
            candidate = locator.nth(index)
            try:
                if candidate.is_visible():
                    text = candidate.inner_text(timeout=300).strip()
                    if len(text) > 3 and not text.startswith("✕"):
                        return candidate
            except PlaywrightTimeoutError:
                continue
    return None


def get_prompt_text(page):
    locator = get_prompt_locator(page)
    if locator is None:
        return ""
    return locator.inner_text(timeout=300).strip()


def measure_prompt(page):
    locator = get_prompt_locator(page)
    if locator is None:
        return {"found": False, "text": "", "scrollWidth": None, "clientWidth": None, "overflow": True}
    return locator.evaluate(
        """el => ({
            found: true,
            text: (el.textContent || '').trim(),
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            overflow: el.scrollWidth > el.clientWidth
        })"""
    )


def get_tip_text(page):
    for selector in ["p", "div", "span"]:
        locator = page.locator(selector)
        count = min(locator.count(), 60)
        for index in range(count):
            candidate = locator.nth(index)
            try:
                if candidate.is_visible():
                    text = candidate.inner_text(timeout=200).strip()
                    if text.startswith("💡"):
                        return text.replace("💡", "", 1).strip()
            except PlaywrightTimeoutError:
                continue
    return None


def click_first(locator):
    count = locator.count()
    if count <= 0:
        return False
    locator.first.click(timeout=3000, force=True)
    return True


def start_number_sense_session(page, completed_level_ids, case_id):
    page.goto(BASE_URL, wait_until="domcontentloaded")
    wait_for_app(page)
    inject_storage(page, completed_level_ids)
    page.reload(wait_until="domcontentloaded")
    wait_for_app(page)
    screenshot(page, f"{case_id}-home")

    if not click_first(page.get_by_text("数感估算", exact=False)):
        if not click_first(page.get_by_text("数感", exact=False)):
            raise RuntimeError("未找到数感主题入口")
    wait_for_app(page)
    screenshot(page, f"{case_id}-topic")

    if not click_first(page.locator(".animate-bounce-rec")):
        if not click_first(page.get_by_role("button", name="开始")):
            if not click_first(page.locator("button.bg-primary")):
                raise RuntimeError("未找到可点击关卡按钮")
    wait_for_app(page)
    screenshot(page, f"{case_id}-practice")


def advance_question(page):
    page.evaluate(
        """() => {
            const sessionStore = window.__MQ_SESSION__;
            const uiStore = window.__MQ_UI__;
            const state = sessionStore.getState();
            const question = state.currentQuestion;
            if (!question) return;

            const correctAnswer = () => {
                if (question.type === 'multi-select') {
                    return [...(question.solution.answers ?? [])].sort().join(',');
                }
                if (question.type === 'multi-blank') {
                    return (question.solution.blanks ?? []).join('|');
                }
                if (question.type === 'expression-input' || question.type === 'equation-input') {
                    return question.solution.standardExpression ?? String(question.solution.answer);
                }
                return String(question.solution.answer);
            };

            state.submitAnswer(correctAnswer());
            const after = sessionStore.getState();

            if (after.currentIndex >= after.totalQuestions) {
                after.endSession();
                uiStore.getState().setPage('summary');
                return;
            }

            after.nextQuestion();
        }"""
    )
    page.wait_for_load_state("networkidle")
    time.sleep(0.2)


def run_tip_case(page, case_id, title, completed_level_ids, expected_tip, max_questions, prompt_checker=None):
    start_number_sense_session(page, completed_level_ids, case_id)
    overflows = []
    seen_prompts = []

    for index in range(max_questions):
        prompt_text = get_prompt_text(page)
        measure = measure_prompt(page)
        seen_prompts.append(prompt_text)
        if measure["overflow"]:
            overflows.append(measure)

        tip_text = get_tip_text(page)
        if prompt_checker is not None and prompt_checker(prompt_text):
            screenshot(page, f"{case_id}-target-prompt")

        if tip_text and expected_tip in tip_text:
            evidence = [screenshot(page, f"{case_id}-pass")]
            return {
                "id": case_id,
                "title": title,
                "status": "PASS",
                "note": f"第 {index + 1} 题出现目标 tip；overflow={len(overflows)}",
                "tip": tip_text,
                "evidence": evidence,
                "overflows": overflows,
                "seen_prompts": seen_prompts,
            }

        advance_question(page)

    evidence = [screenshot(page, f"{case_id}-risk")]
    return {
        "id": case_id,
        "title": title,
        "status": "RISK",
        "note": f"{max_questions} 题内未命中目标 tip；overflow={len(overflows)}",
        "tip": None,
        "evidence": evidence,
        "overflows": overflows,
        "seen_prompts": seen_prompts,
    }


def run_estimate_case(page, completed_level_ids):
    case_id = "E-03"
    start_number_sense_session(page, completed_level_ids, case_id)

    old_format = 0
    new_format = 0
    overflows = []
    prompts = []

    for _ in range(10):
        prompt_text = get_prompt_text(page)
        prompts.append(prompt_text)
        measure = measure_prompt(page)
        if measure["overflow"]:
            overflows.append(measure)

        if "结果取整" in prompt_text:
            old_format += 1
        if "大约是多少" in prompt_text or ("估算" in prompt_text and "结果取整" not in prompt_text):
            new_format += 1

        advance_question(page)

    status = "PASS" if old_format == 0 and new_format > 0 else "FAIL" if old_format > 0 else "RISK"
    note = f"new_format={new_format}; old_format={old_format}; overflow={len(overflows)}"
    return {
        "id": case_id,
        "title": "estimate 新格式",
        "status": status,
        "note": note,
        "tip": None,
        "evidence": [screenshot(page, f"{case_id}-summary")],
        "overflows": overflows,
        "seen_prompts": prompts,
    }


def write_report(results):
    pass_count = sum(1 for item in results if item["status"] == "PASS")
    risk_count = sum(1 for item in results if item["status"] == "RISK")
    fail_count = sum(1 for item in results if item["status"] == "FAIL")
    overflow_cases = [item for item in results if item["overflows"]]

    lines = [
        "# v0.2 增量专项验收结果",
        "",
        "> 日期：2026-04-23",
        "> 范围：Tips / estimate 新格式 / 375px 题干无横向溢出补充复验",
        "",
        f"- PASS：{pass_count}",
        f"- RISK：{risk_count}",
        f"- FAIL：{fail_count}",
        f"- 发生横向溢出的用例：{len(overflow_cases)}",
        "",
        "| ID | 场景 | 状态 | 观察 | 证据 |",
        "|---|---|---|---|---|",
    ]

    for item in results:
        evidence = "<br>".join(item["evidence"]) if item["evidence"] else "-"
        lines.append(f"| {item['id']} | {item['title']} | {item['status']} | {item['note']} | {evidence} |")

    lines.extend([
        "",
        "## 题干不折行补充复验",
        "",
        "- 口径：本轮在 375px 视口下，对 4 个 v0.2 高风险数感专项场景逐题检查 `scrollWidth <= clientWidth`。",
        f"- 结果：{4 - len(overflow_cases)}/{4} 场景未观察到横向溢出。",
        "- 说明：E1 的 7 条代表题干原专项报告仍保留为基础证据，本轮重点复验的是 v0.2 后续改造仍可能影响的高风险数感题型。",
    ])

    with open(os.path.join(RUN_DIR, "delta-result.md"), "w", encoding="utf-8") as file:
        file.write("\n".join(lines) + "\n")


def main():
    prereqs_t03 = ["number-sense-S1-LA-L1"]
    prereqs_t02 = [
        "number-sense-S1-LA-L1",
        "number-sense-S1-LA-L2",
        "number-sense-S1-LB-L1",
        "number-sense-S1-LB-L2",
        "number-sense-S2-LA-L1",
        "number-sense-S2-LA-L2",
    ]
    prereqs_t01 = prereqs_t02 + ["number-sense-S2-LB-L1", "number-sense-S2-LB-L2"]
    prereqs_t04 = prereqs_t01 + [
        "number-sense-S2-LC-L1",
        "number-sense-S2-LC-L2",
        "number-sense-S3-LA-L1",
        "number-sense-S3-LA-L2",
        "number-sense-S3-LB-L1",
    ]

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812}, locale="zh-CN", color_scheme="light")
        page = context.new_page()
        results = [
            run_tip_case(
                page,
                "E-01",
                "reverse-round Tip",
                prereqs_t01,
                "找原数范围",
                20,
            ),
            run_tip_case(
                page,
                "E-02",
                "floor-ceil Tip",
                prereqs_t02,
                "至少/不够就补",
                20,
            ),
            run_estimate_case(page, prereqs_t03),
            run_tip_case(
                page,
                "E-04",
                "compare Tip",
                prereqs_t04,
                "遇到“一定”，先找反例",
                25,
            ),
        ]
        context.close()
        browser.close()

    write_report(results)


if __name__ == "__main__":
    main()
