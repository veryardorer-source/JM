"""notion_site_album_pages.py - make compact site pages with album subpages.

The site page stays short on mobile. Photos and bulky files go into child pages:
시공전 사진첩, 시공중 사진첩, 완성 사진첩, 도면·3D, 고객 자료.
"""
import io
import json
import sys
import urllib.request
import urllib.error

from notion_auth import TOKEN

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

SITE = "381089e9-0a52-8197-9ffc-dc38e1265436"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}

ALBUMS = [
    ("시공전 사진첩", "📷", "착공 전 사진을 여기에 올립니다. 메인 현장 카드에는 사진을 직접 올리지 않습니다."),
    ("시공중 사진첩", "🏗️", "공정별 시공 사진을 날짜 순서대로 올립니다."),
    ("완성 사진첩", "✅", "완공 사진과 포트폴리오용 사진을 올립니다."),
    ("도면·3D", "📐", "도면 PDF, 3D 이미지, 설계 참고 이미지를 올립니다."),
    ("고객 자료", "📎", "고객 제공 사진과 참고자료를 올립니다. 고객 연락처 등 민감정보는 관리자 DB에만 기록합니다."),
]


def api(method, endpoint, data=None):
    body = json.dumps(data, ensure_ascii=False).encode() if data else None
    request = urllib.request.Request(
        "https://api.notion.com/v1" + endpoint,
        data=body,
        headers=HEADERS,
        method=method,
    )
    try:
        with urllib.request.urlopen(request) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as ex:
        try:
            return json.loads(ex.read())
        except json.JSONDecodeError:
            return {"object": "error", "message": str(ex)}


def rich(text):
    return [{"type": "text", "text": {"content": text}}]


def heading(text):
    return {"type": "heading_1", "heading_1": {"rich_text": rich(text)}}


def heading2(text):
    return {"type": "heading_2", "heading_2": {"rich_text": rich(text)}}


def paragraph(text):
    return {"type": "paragraph", "paragraph": {"rich_text": rich(text)}}


def callout(text, emoji="📌", color="green_background"):
    return {
        "type": "callout",
        "callout": {
            "icon": {"type": "emoji", "emoji": emoji},
            "color": color,
            "rich_text": rich(text),
        },
    }


def link_to_page(page_id):
    return {"type": "link_to_page", "link_to_page": {"type": "page_id", "page_id": page_id}}


def child_blocks(block_id):
    results = []
    cursor = None
    while True:
        endpoint = f"/blocks/{block_id}/children?page_size=100"
        if cursor:
            endpoint += "&start_cursor=" + cursor
        response = api("GET", endpoint)
        results.extend(response.get("results", []))
        if not response.get("has_more"):
            return results
        cursor = response.get("next_cursor")


def block_text(block):
    block_type = block.get("type")
    rich_text = block.get(block_type, {}).get("rich_text", [])
    return "".join(item.get("plain_text", "") for item in rich_text)


def page_title(page):
    title_prop = next((prop for prop in page.get("properties", {}).values() if prop.get("type") == "title"), None)
    if not title_prop:
        return page["id"][:8]
    return "".join(item.get("plain_text", "") for item in title_prop.get("title", [])) or page["id"][:8]


def query_all_pages(database_id):
    pages = []
    cursor = None
    while True:
        payload = {"page_size": 100}
        if cursor:
            payload["start_cursor"] = cursor
        response = api("POST", "/databases/" + database_id + "/query", payload)
        pages.extend(response.get("results", []))
        if not response.get("has_more"):
            return pages
        cursor = response.get("next_cursor")


def existing_child_pages(page_id):
    return {
        block["child_page"]["title"]: block["id"]
        for block in child_blocks(page_id)
        if block.get("type") == "child_page"
    }


def create_album_page(parent_id, title, emoji, guide):
    result = api(
        "POST",
        "/pages",
        {
            "parent": {"type": "page_id", "page_id": parent_id},
            "icon": {"type": "emoji", "emoji": emoji},
            "properties": {"title": {"title": [{"text": {"content": title}}]}},
            "children": [
                callout(guide, emoji, "blue_background"),
                paragraph("사진은 이 아래에 올리세요."),
            ],
        },
    )
    return result.get("id")


def has_compact_section(page_id):
    return any("현장 자료 바로가기" in block_text(block) for block in child_blocks(page_id))


def archive_old_body_section(page_id):
    blocks = child_blocks(page_id)
    start = None
    for index, block in enumerate(blocks):
        if block.get("type") in ("heading_1", "heading_2", "heading_3") and block_text(block).strip() == "현장 자료":
            start = index
            break
    if start is None:
        return 0

    archived = 0
    for block in blocks[start:]:
        if block.get("type") == "child_page":
            continue
        if block.get("type") == "image":
            continue
        api("PATCH", "/blocks/" + block["id"], {"archived": True})
        archived += 1
    return archived


print("현장 카드 사진첩 구조 적용\n")
for page in query_all_pages(SITE):
    page_id = page["id"]
    title = page_title(page)
    children = existing_child_pages(page_id)
    album_ids = []
    for album_title, emoji, guide in ALBUMS:
        album_id = children.get(album_title)
        if not album_id:
            album_id = create_album_page(page_id, album_title, emoji, guide)
        if album_id:
            album_ids.append(album_id)

    if has_compact_section(page_id):
        print(f"건너뜀: {title} - 이미 바로가기 구조 있음")
        continue

    archived = archive_old_body_section(page_id)
    blocks = [
        heading("현장 자료 바로가기"),
        callout("사진은 아래 사진첩에 올립니다. 메인 현장 카드에는 사진을 직접 올리지 않아 모바일 스크롤을 짧게 유지합니다.", "📱"),
        *[link_to_page(album_id) for album_id in album_ids],
        heading2("미팅 정리"),
        paragraph("회의 내용, 결정사항, 다음 액션을 적으세요."),
        heading2("공정 기록"),
        paragraph("현장 특이사항, 날짜별 진행 기록, 체크할 내용을 적으세요."),
        heading2("자재 / 구매 링크"),
        paragraph("구매물품 링크, 발주 참고사항, 입고 메모를 정리하세요."),
    ]
    result = api("PATCH", "/blocks/" + page_id + "/children", {"children": blocks})
    print(("완료: " if "results" in result else "실패: ") + f"{title} (기존 안내 블록 {archived}개 정리)")

print("\n완료. 이제 사진은 각 사진첩 하위 페이지에 올리면 됩니다.")
