"""notion_site_body_template.py - add mobile-friendly site body sections.

Moves the workflow away from narrow database file properties and into each
site page body. It does not delete properties that contain existing files.
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

BODY_MARKER = "현장 자료"
PROPERTY_TO_REMOVE_IF_EMPTY = ["시공 사진", "완성 사진"]
PROPERTY_TO_KEEP_IF_USED = ["시공전 사진"]


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


def rich_text(text):
    return [{"type": "text", "text": {"content": text}}]


def heading_1(text):
    return {"type": "heading_1", "heading_1": {"rich_text": rich_text(text)}}


def heading_2(text):
    return {"type": "heading_2", "heading_2": {"rich_text": rich_text(text)}}


def paragraph(text):
    return {"type": "paragraph", "paragraph": {"rich_text": rich_text(text)}}


def callout(text, emoji="📌", color="gray_background"):
    return {
        "type": "callout",
        "callout": {
            "icon": {"type": "emoji", "emoji": emoji},
            "color": color,
            "rich_text": rich_text(text),
        },
    }


def divider():
    return {"type": "divider", "divider": {}}


def page_title(page):
    title_prop = next(
        (prop for prop in page.get("properties", {}).values() if prop.get("type") == "title"),
        None,
    )
    if not title_prop:
        return page["id"][:8]
    return "".join(part.get("plain_text", "") for part in title_prop.get("title", [])) or page["id"][:8]


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


def block_plain_text(block):
    block_type = block.get("type")
    rich = block.get(block_type, {}).get("rich_text", [])
    return "".join(item.get("plain_text", "") for item in rich)


def has_site_body(page_id):
    return any(
        BODY_MARKER in block_plain_text(block)
        for block in child_blocks(page_id)
        if block.get("type") in ("heading_1", "heading_2", "heading_3")
    )


def site_body_blocks(before_photo_count=0):
    existing_note = []
    if before_photo_count:
        existing_note = [
            callout(
                f"기존 시공전 사진 {before_photo_count}장은 아직 상단 속성에 남아 있습니다. 필요한 사진은 아래 '시공전 사진' 섹션으로 옮긴 뒤 속성 파일을 삭제하세요.",
                "⚠️",
                "yellow_background",
            )
        ]
    return [
        divider(),
        heading_1("현장 자료"),
        callout(
            "사진과 자료는 앞으로 이 본문 영역에 올립니다. 모바일에서 보기 쉽고, 잘못 올린 사진도 해당 섹션에서 바로 삭제할 수 있습니다.",
            "📱",
            "green_background",
        ),
        *existing_note,
        heading_2("시공전 사진"),
        paragraph("여기에 착공 전 사진을 업로드하세요."),
        heading_2("시공중 사진"),
        paragraph("공정별 시공 사진을 날짜 순서대로 올리세요."),
        heading_2("완성 사진"),
        paragraph("완공 후 사진과 포트폴리오용 사진을 올리세요."),
        heading_2("도면 / 3D"),
        paragraph("도면 PDF, 3D 이미지, 설계 참고 이미지를 올리세요."),
        heading_2("고객 자료"),
        paragraph("고객 제공 사진, 참고 자료, 요청사항을 정리하세요. 고객 연락처 등 민감정보는 관리자 전용 DB에만 기록하세요."),
        heading_2("미팅 정리"),
        paragraph("회의 내용, 결정사항, 다음 액션을 적으세요."),
        heading_2("공정 기록"),
        paragraph("현장 특이사항, 날짜별 진행 기록, 체크할 내용을 적으세요."),
        heading_2("자재 / 구매 링크"),
        paragraph("구매물품 링크, 발주 참고사항, 입고 메모를 정리하세요."),
    ]


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


def file_count(page, prop_name):
    prop = page.get("properties", {}).get(prop_name, {})
    return len(prop.get("files", [])) if prop.get("type") == "files" else 0


print("1. 현장 페이지 본문 템플릿 적용")
pages = query_all_pages(SITE)
for page in pages:
    title = page_title(page)
    if has_site_body(page["id"]):
        print(f"   건너뜀: {title} - 이미 본문 구조 있음")
        continue
    before_count = file_count(page, "시공전 사진")
    result = api("PATCH", "/blocks/" + page["id"] + "/children", {"children": site_body_blocks(before_count)})
    print(("   완료: " if "results" in result else "   실패: ") + title)

print("\n2. 비어 있는 사진 속성 제거")
fresh_pages = query_all_pages(SITE)
for prop_name in PROPERTY_TO_REMOVE_IF_EMPTY:
    total = sum(file_count(page, prop_name) for page in fresh_pages)
    if total:
        print(f"   보류: {prop_name} - 파일 {total}개 있음")
        continue
    result = api("PATCH", "/databases/" + SITE, {"properties": {prop_name: None}})
    print(("   제거: " if result.get("object") != "error" else "   실패: ") + prop_name)

for prop_name in PROPERTY_TO_KEEP_IF_USED:
    total = sum(file_count(page, prop_name) for page in fresh_pages)
    if total:
        print(f"   유지: {prop_name} - 기존 파일 {total}개 보호")

print("\n완료. 신규 사진은 현장 페이지 본문 섹션에 올리면 됩니다.")
