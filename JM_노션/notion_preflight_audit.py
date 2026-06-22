"""notion_preflight_audit.py - JM Notion read-only safety audit.

Checks the current "JM 업무 시스템" before inviting staff or running edit scripts.
This script does not modify Notion.
"""
import io
import json
import sys
import urllib.request

from notion_auth import TOKEN

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ROOT = "381089e9-0a52-81b5-83a3-c42ce799c0d6"
NOTION_VERSION = "2022-06-28"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
}

EXPECTED_DBS = {
    "진행중인 현장": "site",
    "공정 일정": "schedule",
    "업무 현황": "task",
    "현장 경비·영수증": "expense",
    "출금 요청 관리": "withdraw",
    "직원 명부": "employee",
    "근태 기록": "attendance",
    "수입·지출 내역": "accounting",
    "현장별 재무": "finance",
    "고객 CRM": "crm",
    "견적 현황": "quote",
    "공사 아카이브": "archive",
    "SNS·블로그 발행": "sns",
    "자재·발주 관리": "materials",
    "A/S 관리": "as",
    "협력업체 관리": "vendor",
    "공지사항": "notice",
}

SENSITIVE_SITE_PROPS = {
    "고객명",
    "고객 연락처",
    "고객연락처",
    "계약금액",
    "경비합계",
    "출금합계",
    "총지출",
    "수익",
    "계좌번호",
    "재무",
    "수입",
    "지출",
    "회계",
}

REQUIRED_SITE_ALBUM_PAGES = {"시공전 사진첩", "시공중 사진첩", "완성 사진첩", "도면·3D", "고객 자료"}
OLD_SITE_FILE_PROPS = {"비포 사진", "시공 사진", "완성 사진", "📷 현장 사진"}
LEGACY_FILE_PROPS = {"시공전 사진"}
SENSITIVE_RELATION_DBS = {"expense", "withdraw", "finance", "accounting"}


def api(method, endpoint, data=None):
    body = json.dumps(data, ensure_ascii=False).encode() if data else None
    req = urllib.request.Request(
        "https://api.notion.com/v1" + endpoint,
        data=body,
        headers=HEADERS,
        method=method,
    )
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as ex:
        try:
            return json.loads(ex.read())
        except json.JSONDecodeError:
            return {"object": "error", "message": str(ex)}


def child_blocks(block_id):
    results = []
    start_cursor = None
    while True:
        endpoint = f"/blocks/{block_id}/children?page_size=100"
        if start_cursor:
            endpoint += "&start_cursor=" + start_cursor
        response = api("GET", endpoint)
        results.extend(response.get("results", []))
        if not response.get("has_more"):
            return results
        start_cursor = response.get("next_cursor")


def collect_databases(block_id, depth=0, max_depth=5):
    found = {}
    if depth > max_depth:
        return found
    for block in child_blocks(block_id):
        block_type = block["type"]
        if block_type == "child_database":
            found[block["child_database"]["title"]] = block["id"]
        elif block_type == "child_page" and block.get("has_children"):
            found.update(collect_databases(block["id"], depth + 1, max_depth))
    return found


def block_plain_text(block):
    block_type = block.get("type")
    rich = block.get(block_type, {}).get("rich_text", [])
    return "".join(item.get("plain_text", "") for item in rich)


def page_child_pages(page_id):
    titles = set()
    for block in child_blocks(page_id):
        if block.get("type") == "child_page":
            titles.add(block["child_page"]["title"])
    return titles


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


def relation_type(prop):
    relation = prop.get("relation", {})
    return relation.get("type", "unknown")


def print_result(ok, label, detail=""):
    mark = "OK" if ok else "CHECK"
    print(f"[{mark}] {label}" + (f" - {detail}" if detail else ""))


def print_info(label, detail=""):
    print(f"[INFO] {label}" + (f" - {detail}" if detail else ""))


def main():
    print("JM Notion preflight audit (read-only)\n")
    db_ids = collect_databases(ROOT)

    missing = [name for name in EXPECTED_DBS if name not in db_ids]
    print_result(not missing, "필수 DB 존재", ", ".join(missing) if missing else "모두 확인")

    if "진행중인 현장" not in db_ids:
        print("\n진행중인 현장 DB를 찾지 못해 세부 점검을 중단합니다.")
        return

    db_schemas = {}
    for name, db_id in db_ids.items():
        schema = api("GET", "/databases/" + db_id)
        if schema.get("object") != "error":
            db_schemas[name] = schema

    site = db_schemas["진행중인 현장"]
    site_props = site.get("properties", {})
    prop_names = set(site_props)

    found_sensitive = sorted(
        name for name in prop_names if name in SENSITIVE_SITE_PROPS or any(key in name for key in SENSITIVE_SITE_PROPS)
    )
    print_result(not found_sensitive, "전 직원 현장 DB 민감 열 없음", ", ".join(found_sensitive) if found_sensitive else "")

    old_file_props = sorted(prop_names & OLD_SITE_FILE_PROPS)
    print_result(not old_file_props, "현장 DB 사진 속성 정리", ", ".join(old_file_props) if old_file_props else "본문 관리 기준")

    legacy_props = sorted(prop_names & LEGACY_FILE_PROPS)
    if legacy_props:
        print_info("보호 중인 기존 사진 속성", ", ".join(legacy_props))
    else:
        print_result(True, "보호 중인 기존 사진 속성 없음")

    site_pages = query_all_pages(db_ids["진행중인 현장"])
    missing_albums = []
    for page in site_pages:
        title_prop = next((prop for prop in page.get("properties", {}).values() if prop.get("type") == "title"), None)
        title = "".join(part.get("plain_text", "") for part in title_prop.get("title", [])) if title_prop else page["id"][:8]
        missing = REQUIRED_SITE_ALBUM_PAGES - page_child_pages(page["id"])
        if missing:
            missing_albums.append(f"{title}: {', '.join(sorted(missing))}")
    print_result(not missing_albums, "현장 페이지 사진첩 하위 페이지", "; ".join(missing_albums) if missing_albums else "시공전/시공중/완성/도면·3D/고객 자료")

    print("\n민감 DB relation 방향")
    for db_name, key in EXPECTED_DBS.items():
        if key not in SENSITIVE_RELATION_DBS or db_name not in db_schemas:
            continue
        props = db_schemas[db_name].get("properties", {})
        site_relations = [
            (prop_name, relation_type(prop))
            for prop_name, prop in props.items()
            if prop.get("type") == "relation"
            and prop.get("relation", {}).get("database_id", "").replace("-", "")
            == db_ids["진행중인 현장"].replace("-", "")
        ]
        ok = bool(site_relations) and all(rel_type == "single_property" for _, rel_type in site_relations)
        detail = ", ".join(f"{name}:{rel_type}" for name, rel_type in site_relations) if site_relations else "현장 relation 없음"
        print_result(ok, db_name, detail)

    finance = db_schemas.get("현장별 재무", {}).get("properties", {})
    total_type = finance.get("총지출", {}).get("type")
    profit_type = finance.get("수익", {}).get("type")
    print("\n관리자 재무")
    print_result(total_type == "number", "총지출 직접 입력", f"type={total_type}")
    print_result(profit_type == "formula", "수익 공식", f"type={profit_type}")

    print("\n완료. CHECK 항목이 있으면 직원 초대 전에 수정하세요.")


if __name__ == "__main__":
    main()
