#!/usr/bin/env python3 -u
"""
21cnjy.com 沪教版五年级数学资源完整抓取脚本

策略：
1. 从章节页和分类列表页收集所有文档URL
2. 去重后逐个抓取文档详情页
3. 提取文本内容保存为Markdown
"""

import re
import json
import time
import random
import os
import sys
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://mip.21cnjy.com"
OUTPUT_DIR = Path(__file__).parent.parent / "sources" / "scraped"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
}

# 五年级上章节ID
GRADE5_UPPER_CHAPTERS = {
    "1.1 符号表示数": 66476,
    "1.2 小数": 66477,
    "2.1 小数乘整数": 66481,
    "2.2 小数乘小数": 66482,
    "2.3 运算定律推广": 66484,
    "2.4 循环小数": 66487,
    "3.1 平均数": 66491,
    "3.2 平均数的计算": 66492,
    "4.1 用字母表示数": 66497,
    "4.2 方程": 181251,
    "5.1 平行四边形": 181254,
    "5.2 三角形的面积": 66505,
    "5.3 梯形": 181255,
    "5.4 组合图形的面积": 181257,
    "6.1 小数四则混合运算": 66510,
    "6.2 编码": 66515,
}

# 五年级下章节ID
GRADE5_LOWER_CHAPTERS = {
    "1 复习与提高": 73695,
    "2 正数和负数": 73696,
    "3 简易方程(二)": 73697,
    "4 几何小实践": 73698,
    "5 可能性": 73699,
    "6 总复习": 73718,
}

# 分类列表页的类型ID
TYPE_IDS = [3, 4, 7, 8]  # 课件/试卷/学案/教案
GRADE_IDS = {
    "五年级上": 66223,
    "五年级下": 66224,
}
MAX_LIST_PAGES = 30  # 每种类型最多翻30页


def fetch_page(url, retries=3):
    """带重试和限流的页面获取"""
    for attempt in range(retries):
        try:
            time.sleep(random.uniform(0.8, 1.5))
            resp = requests.get(url, headers=HEADERS, timeout=15)
            if resp.status_code == 200:
                resp.encoding = resp.apparent_encoding or 'utf-8'
                return resp.text
            elif resp.status_code in (429, 403):
                wait = 30 * (attempt + 1)
                print(f"  [限流] {resp.status_code}, 等待{wait}秒...")
                time.sleep(wait)
            elif resp.status_code == 404:
                return None
            else:
                print(f"  [警告] {url} 返回 {resp.status_code}")
                return None
        except Exception as e:
            print(f"  [错误] {url}: {e}")
            time.sleep(5)
    return None


def extract_doc_ids(html):
    """从HTML中提取所有 /P/{id}.html 链接的ID"""
    if not html:
        return set()
    ids = set()
    # 匹配 /P/数字.html 模式
    for m in re.finditer(r'/P/(\d+)\.html', html):
        ids.add(int(m.group(1)))
    return ids


def extract_doc_content(html, doc_id):
    """从文档详情页提取标题和文本内容"""
    if not html:
        return None

    soup = BeautifulSoup(html, 'html.parser')

    # 提取标题 - 从 title 标签
    title = ""
    title_tag = soup.find('title')
    if title_tag:
        title = title_tag.get_text(strip=True)
        title = re.sub(r'[-_—]\s*(21世纪|二一|教育网|mip|下载).*$', '', title).strip()

    # 从 center__bd 提取全文（这是该站的主内容容器）
    content = ""
    main_div = soup.find('div', class_='center__bd')
    if not main_div:
        main_div = soup.find('div', class_='main-wrapper')

    if main_div:
        full_text = main_div.get_text(separator='\n', strip=True)

        # 关键：提取"文档简介"之后的内容
        marker = '文档简介'
        idx = full_text.find(marker)
        if idx >= 0:
            content = full_text[idx + len(marker):].strip()
            # 清理尾部的导航/推荐内容
            for end_marker in ['同课章节目录', '推荐资源', '相关资源', '猜你喜欢', '21世纪教育网']:
                end_idx = content.find(end_marker)
                if end_idx > 0:
                    content = content[:end_idx].strip()
        else:
            # 没有"文档简介"标记，尝试从"文档属性"后截取
            marker2 = '点击下载'
            idx2 = full_text.find(marker2)
            if idx2 >= 0:
                content = full_text[idx2 + len(marker2):].strip()
                for end_marker in ['同课章节目录', '推荐资源', '相关资源']:
                    end_idx = content.find(end_marker)
                    if end_idx > 0:
                        content = content[:end_idx].strip()

    # 如果以上都失败，尝试 meta description
    if not content or len(content) < 30:
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            desc = meta_desc['content'].strip()
            if len(desc) > 30:
                content = desc

    if not title and not content:
        return None

    return {
        'id': doc_id,
        'title': title,
        'content': content,
    }


def phase1_collect_urls():
    """第1阶段：收集所有文档URL"""
    all_doc_ids = set()

    # 1a. 从章节页收集
    print("=== 从章节页收集文档URL ===")
    all_chapters = {**GRADE5_UPPER_CHAPTERS, **GRADE5_LOWER_CHAPTERS}
    for name, chapter_id in all_chapters.items():
        url = f"{BASE_URL}/mulu/{chapter_id}.html"
        print(f"  章节 {name} ({chapter_id})...", end=" ")
        html = fetch_page(url)
        ids = extract_doc_ids(html)
        all_doc_ids.update(ids)
        print(f"找到 {len(ids)} 个文档")

    print(f"\n章节页共找到: {len(all_doc_ids)} 个唯一文档")

    # 1b. 从分类列表页收集
    print("\n=== 从分类列表页收集文档URL ===")
    for grade_name, grade_id in GRADE_IDS.items():
        for type_id in TYPE_IDS:
            empty_count = 0
            for page in range(1, MAX_LIST_PAGES + 1):
                url = f"{BASE_URL}/mulu/{type_id}/{grade_id}-{page}.html"
                html = fetch_page(url)
                if html is None:
                    empty_count += 1
                    if empty_count >= 3:  # 连续3页空 → 该类型翻完了
                        break
                    continue
                ids = extract_doc_ids(html)
                if not ids:
                    empty_count += 1
                    if empty_count >= 3:
                        break
                    continue
                empty_count = 0
                before = len(all_doc_ids)
                all_doc_ids.update(ids)
                new = len(all_doc_ids) - before
                print(f"  {grade_name} type={type_id} page={page}: +{new} 新文档 (总计 {len(all_doc_ids)})")

    # 1c. 从年级首页收集
    print("\n=== 从年级首页收集 ===")
    for grade_name, grade_id in GRADE_IDS.items():
        url = f"{BASE_URL}/mulu/{grade_id}.html"
        html = fetch_page(url)
        ids = extract_doc_ids(html)
        before = len(all_doc_ids)
        all_doc_ids.update(ids)
        print(f"  {grade_name}: +{len(all_doc_ids) - before} 新文档")

    print(f"\n=== 第1阶段完成: 共 {len(all_doc_ids)} 个唯一文档URL ===")

    # 保存URL列表
    url_file = OUTPUT_DIR / "doc_ids.json"
    with open(url_file, 'w') as f:
        json.dump(sorted(all_doc_ids), f)
    print(f"URL列表已保存到 {url_file}")

    return sorted(all_doc_ids)


def phase2_fetch_docs(doc_ids):
    """第2阶段：抓取文档内容"""
    print(f"\n=== 第2阶段：抓取 {len(doc_ids)} 个文档内容 ===")

    # 检查已有进度
    progress_file = OUTPUT_DIR / "progress.json"
    fetched = {}
    if progress_file.exists():
        with open(progress_file, 'r', encoding='utf-8') as f:
            fetched = json.load(f)
        print(f"  已有进度: {len(fetched)} 个文档已抓取")

    results = []
    failed = []

    for i, doc_id in enumerate(doc_ids):
        str_id = str(doc_id)
        if str_id in fetched:
            results.append(fetched[str_id])
            continue

        url = f"{BASE_URL}/P/{doc_id}.html"
        print(f"  [{i+1}/{len(doc_ids)}] P/{doc_id}.html ...", end=" ")

        html = fetch_page(url)
        if html is None:
            print("失败")
            failed.append(doc_id)
            continue

        doc = extract_doc_content(html, doc_id)
        if doc and (doc['title'] or doc['content']):
            results.append(doc)
            fetched[str_id] = doc
            content_len = len(doc['content'])
            print(f"✓ {doc['title'][:40]}... ({content_len}字)")
        else:
            print("无内容")
            failed.append(doc_id)

        # 每50个保存一次进度
        if (i + 1) % 50 == 0:
            with open(progress_file, 'w', encoding='utf-8') as f:
                json.dump(fetched, f, ensure_ascii=False)
            print(f"  --- 进度已保存 ({len(fetched)}/{len(doc_ids)}) ---")

    # 最终保存进度
    with open(progress_file, 'w', encoding='utf-8') as f:
        json.dump(fetched, f, ensure_ascii=False)

    print(f"\n=== 第2阶段完成: 成功 {len(results)}, 失败 {len(failed)} ===")
    if failed:
        print(f"  失败ID: {failed[:20]}{'...' if len(failed) > 20 else ''}")

    return results


def phase3_save_markdown(results):
    """第3阶段：按单元+类型分文件保存"""
    print(f"\n=== 第3阶段：将 {len(results)} 个文档按单元分类保存 ===")

    # 单元关键词 → 目录名映射
    UPPER_UNITS = [
        ("U1-复习与提高",    ["符号表示数", "复习与提高", "1.1", "1.2"]),
        ("U2-小数乘除法",    ["小数乘", "小数除", "乘整数", "乘小数", "连乘", "乘加", "乘减", "运算定律推广", "除数是整数", "除数是小数", "循环小数", "计算器", "积.*凑整", "商.*凑整", "2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8", "2.9", "2.10"]),
        ("U3-统计",          ["平均数", "统计", "3.1", "3.2", "3.3"]),
        ("U4-简易方程",      ["字母表示", "化简.*求值", "方程", "等量关系", "4.1", "4.2", "4.3", "4.4"]),
        ("U5-几何小实践",    ["平行四边形", "三角形.*面积", "梯形", "组合图形", "几何小实践", "5.1", "5.2", "5.3", "5.4", "5.5", "5.6"]),
        ("U6-整理与提高",    ["四则混合运算", "水.*电.*天然气", "费用", "编码", "时间.*计算", "6.1", "6.2", "6.3", "6.4", "6.5", "6.6"]),
    ]
    LOWER_UNITS = [
        ("U1-复习与提高",    ["复习与提高", "面积.*估测", "自然数", "1.1", "1.2", "1.3", "1.4"]),
        ("U2-正数和负数",    ["正数", "负数", "数轴", "2.1", "2.2"]),
        ("U3-简易方程二",    ["列方程.*解决", "列方程.*应用", "方程.*二", "3.1", "3.2"]),
        ("U4-几何小实践",    ["体积", "立方", "长方体", "正方体", "展开图", "表面积", "容积", "重量", "4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "4.9", "4.10", "4.11"]),
        ("U5-可能性",        ["可能性", "可能情况", "5.1", "5.2", "5.3"]),
        ("U6-总复习",        ["总复习", "数与运算", "方程与代数", "图形与几何", "统计初步", "6.1", "6.2", "6.3", "6.4"]),
    ]

    # 资源类型关键词
    def classify_type(title):
        t = title.lower()
        if any(k in t for k in ['试卷', '试题', '测试', '练习', '检测', '模拟', '真题', '期末', '期中', '一课一练', '同步练习', '单元测试', '培优', '密押']):
            return '试卷练习'
        elif any(k in t for k in ['教案', '教学设计', '导学', '学案']):
            return '教案学案'
        else:
            return '课件其他'

    def classify_unit(title, units):
        for unit_name, keywords in units:
            for kw in keywords:
                if re.search(kw, title):
                    return unit_name
        return None

    # 分类所有文档
    classified = {}  # {grade/unit/type: [docs]}

    for doc in results:
        title = doc.get('title', '')
        content = doc.get('content', '')
        if not content and not title:
            continue

        # 判断年级
        if '五年级上' in title or '上册' in title or '第一学期' in title:
            grade = 'grade5-upper'
            unit = classify_unit(title, UPPER_UNITS)
        elif '五年级下' in title or '下册' in title or '第二学期' in title:
            grade = 'grade5-lower'
            unit = classify_unit(title, LOWER_UNITS)
        else:
            grade = 'other'
            unit = None

        if unit is None:
            # 尝试从内容中判断单元
            combined = title + ' ' + content[:200]
            if grade == 'grade5-upper':
                unit = classify_unit(combined, UPPER_UNITS) or '综合'
            elif grade == 'grade5-lower':
                unit = classify_unit(combined, LOWER_UNITS) or '综合'
            else:
                unit = '未分类'

        rtype = classify_type(title)
        key = (grade, unit, rtype)
        classified.setdefault(key, []).append(doc)

    # 写入文件
    def write_unit_md(docs, filepath, heading):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        # 按内容长度降序排列，有内容的优先
        docs_sorted = sorted(docs, key=lambda d: len(d.get('content', '')), reverse=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(f"# {heading}\n\n")
            f.write(f"> 来源: mip.21cnjy.com | 自动抓取 | {time.strftime('%Y-%m-%d')}\n")
            f.write(f"> 文档数: {len(docs_sorted)}\n\n---\n\n")
            for doc in docs_sorted:
                f.write(f"## [{doc['id']}] {doc.get('title', '无标题')}\n\n")
                if doc.get('content'):
                    f.write(doc['content'])
                    f.write('\n')
                f.write('\n---\n\n')

    file_count = 0
    for (grade, unit, rtype), docs in sorted(classified.items()):
        grade_dir = OUTPUT_DIR / grade
        safe_unit = re.sub(r'[<>:"/\\|?*]', '', unit)
        filename = f"{safe_unit}-{rtype}.md"
        filepath = grade_dir / filename
        heading = f"{grade} / {unit} / {rtype}"
        write_unit_md(docs, filepath, heading)
        file_count += 1
        print(f"  {filepath.relative_to(OUTPUT_DIR)} ({len(docs)} 文档)")

    # 保存索引
    index = [{'id': d['id'], 'title': d.get('title', ''), 'content_len': len(d.get('content', ''))} for d in results]
    index_file = OUTPUT_DIR / "doc-index.json"
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    # 统计
    total_chars = sum(len(d.get('content', '')) for d in results)
    with_content = sum(1 for d in results if len(d.get('content', '')) > 100)
    print(f"\n=== 最终统计 ===")
    print(f"  总文档数: {len(results)}")
    print(f"  生成文件: {file_count} 个")
    print(f"  有实质内容(>100字): {with_content}")
    print(f"  总字符数: {total_chars:,}")


def main():
    print("=" * 60)
    print("21cnjy.com 沪教版五年级数学 - 完整内容抓取")
    print("=" * 60)

    # --phase3-only: 仅从progress.json重新生成分类文件
    if '--phase3-only' in sys.argv:
        progress_file = OUTPUT_DIR / "progress.json"
        if not progress_file.exists():
            print("错误: progress.json 不存在")
            return
        print(f"\n仅运行第3阶段（从 progress.json 重新生成分类文件）")
        with open(progress_file, 'r', encoding='utf-8') as f:
            fetched = json.load(f)
        results = list(fetched.values())
        print(f"  加载了 {len(results)} 个文档")
        phase3_save_markdown(results)
        print("\n完成!")
        return

    # 检查是否有已保存的URL列表
    url_file = OUTPUT_DIR / "doc_ids.json"
    if url_file.exists() and '--force-urls' not in sys.argv:
        print(f"\n发现已有URL列表: {url_file}")
        with open(url_file, 'r') as f:
            doc_ids = json.load(f)
        print(f"  包含 {len(doc_ids)} 个文档URL")

        if '--skip-urls' not in sys.argv:
            # 仍然运行第1阶段以发现新URL
            new_ids = phase1_collect_urls()
            merged = sorted(set(doc_ids) | set(new_ids))
            if len(merged) > len(doc_ids):
                print(f"  合并后: {len(merged)} (+{len(merged) - len(doc_ids)} 新增)")
                doc_ids = merged
    else:
        doc_ids = phase1_collect_urls()

    if not doc_ids:
        print("没有找到任何文档URL，退出")
        return

    # 第2阶段
    results = phase2_fetch_docs(doc_ids)

    # 第3阶段
    if results:
        phase3_save_markdown(results)

    print("\n完成!")


if __name__ == '__main__':
    main()
