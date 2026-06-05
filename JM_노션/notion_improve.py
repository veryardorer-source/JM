import urllib.request
import json

TOKEN = "ntn_H23137511225x1Um9OQaYDJW1V7e0AGk3dAO7z2znnhewK"
HUB_ID = "376089e9-0a52-8015-ba56-f0837a19d29a"

# 기존 섹션 페이지 IDs (wrap.py 결과)
SECTION = {
    "crm":       "376089e9-0a52-81fe-8726-d5f7486d6239",
    "project":   "376089e9-0a52-810f-9f41-d04978f25c02",
    "task":      "376089e9-0a52-81c8-b924-c11c1d82c46d",
    "partner":   "376089e9-0a52-81b1-ab65-cbcc5841f9c3",
    "marketing": "376089e9-0a52-81b7-9a99-d3522c246e7a",
    "archive":   "376089e9-0a52-81fa-ac20-e449c3082d56",
    "as":        "376089e9-0a52-8167-a693-ea64f8e67ff9",
    "estimate":  "376089e9-0a52-8111-b14f-d019288d309f",
    "finance":   "376089e9-0a52-81a4-8ff0-f8dc7faa893c",
    "accounting":"376089e9-0a52-8165-81c7-fa8583b170ab",
    "labor":     "376089e9-0a52-8198-ad95-e976d01df894",
}

# 기존 DB IDs (rebuild.py 결과)
DB = {
    "crm":       "376089e9-0a52-8197-8c7d-edbd4e41855c",
    "project":   "376089e9-0a52-8117-9f29-d82739c89408",
    "task":      "376089e9-0a52-810a-928c-c57e5baa6987",
    "partner":   "376089e9-0a52-811f-a34f-e7b4a0c8dcf6",
    "marketing": "376089e9-0a52-8185-bf3d-f04d32327f61",
    "archive":   "376089e9-0a52-81b4-8b76-d470c38a1921",
    "as":        "376089e9-0a52-81f7-8d55-fd6bf8390db2",
}

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

def api(method, endpoint, data=None):
    url = f"https://api.notion.com/v1{endpoint}"
    body = json.dumps(data, ensure_ascii=False).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        err = json.loads(e.read())
        print(f"  Error: {err.get('message','')[:80]}")
        return err

def make_page(parent_id, title, emoji, children=None):
    body = {
        "parent": {"type": "page_id", "page_id": parent_id},
        "icon": {"type": "emoji", "emoji": emoji},
        "properties": {"title": {"title": [{"text": {"content": title}}]}}
    }
    if children:
        body["children"] = children
    return api("POST", "/pages", body)

def make_db(parent_id, title, emoji, props):
    return api("POST", "/databases", {
        "parent": {"type": "page_id", "page_id": parent_id},
        "icon": {"type": "emoji", "emoji": emoji},
        "is_inline": False,
        "title": [{"text": {"content": title}}],
        "properties": props
    })

def add(pid, blocks):
    return api("PATCH", f"/blocks/{pid}/children", {"children": blocks})

def h2(t): return {"object":"block","type":"heading_2","heading_2":{"rich_text":[{"text":{"content":t}}]}}
def h3(t): return {"object":"block","type":"heading_3","heading_3":{"rich_text":[{"text":{"content":t}}]}}
def para(t): return {"object":"block","type":"paragraph","paragraph":{"rich_text":[{"text":{"content":t}}]}}
def callout(t,e): return {"object":"block","type":"callout","callout":{"rich_text":[{"text":{"content":t}}],"icon":{"type":"emoji","emoji":e}}}
def bullet(t): return {"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{"text":{"content":t}}]}}
def numbered(t): return {"object":"block","type":"numbered_list_item","numbered_list_item":{"rich_text":[{"text":{"content":t}}]}}
def divider(): return {"object":"block","type":"divider","divider":{}}
def link(pid, label):
    return {"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{
        "type":"mention","mention":{"type":"page","page":{"id":pid}},
        "plain_text":label,"href":f"https://notion.so/{pid.replace('-','')}"}]}}
def warn(): return callout("이 페이지는 대표·이사만 접근합니다.", "⚠️")

# ============================================================
# 1. 프로젝트 관리 DB — 진행률·우선순위 필드 추가
# ============================================================
print("[ 1/6 ] 프로젝트 관리 DB 필드 추가...")
api("PATCH", f"/databases/{DB['project']}", {
    "properties": {
        "진행률(%)": {"number": {"format": "percent"}},
        "우선순위": {"select": {"options": [
            {"name": "긴급", "color": "red"},
            {"name": "높음", "color": "orange"},
            {"name": "보통", "color": "yellow"},
            {"name": "낮음", "color": "gray"}
        ]}},
    }
})
print("  완료!")

# ============================================================
# 2. 고객 CRM DB — 마지막 연락일·팔로업 필드 추가
# ============================================================
print("[ 2/6 ] 고객 CRM DB 필드 추가...")
api("PATCH", f"/databases/{DB['crm']}", {
    "properties": {
        "마지막 연락일": {"date": {}},
        "팔로업 예정일": {"date": {}},
        "희망 완공일": {"date": {}},
    }
})
print("  완료!")

# ============================================================
# 3. 공지사항 DB 생성 (허브 직속, 전 직원 공개)
# ============================================================
print("[ 3/6 ] 공지사항 페이지 생성...")
notice_section = make_page(HUB_ID, "공지사항", "📢", [
    callout("대표·이사가 직원들에게 전달할 공지를 올리는 곳입니다. 새 공지가 올라오면 꼭 확인하세요.", "📢"),
    divider(),
])
notice_id = notice_section["id"]

notice_db = make_db(notice_id, "공지사항", "📋", {
    "제목": {"title": {}},
    "중요도": {"select": {"options": [
        {"name": "긴급 🔴", "color": "red"},
        {"name": "중요 🟡", "color": "yellow"},
        {"name": "일반 🟢", "color": "green"}
    ]}},
    "대상": {"multi_select": {"options": [
        {"name": "전 직원", "color": "blue"},
        {"name": "현장팀", "color": "orange"},
        {"name": "사무팀", "color": "purple"},
        {"name": "이사", "color": "red"}
    ]}},
    "작성자": {"people": {}},
    "공지일": {"date": {}},
    "확인여부": {"checkbox": {}},
    "내용": {"rich_text": {}}
})

add(notice_id, [
    divider(),
    link(notice_db["id"], "📋 공지사항 DB 열기"),
])
print(f"  완료! ID: {notice_id}")

# ============================================================
# 4. 자재·발주 관리 DB 생성 (전 직원 공개)
# ============================================================
print("[ 4/6 ] 자재·발주 관리 페이지 생성...")
material_section = make_page(HUB_ID, "자재·발주 관리", "🛒", [
    callout("현장별 자재 발주 현황을 관리합니다. 발주 누락이나 납기 지연을 사전에 방지하세요.", "🛒"),
    divider(),
    h2("📋 사용 방법"),
    numbered("자재 발주 시 품목·수량·현장명·납기일 입력"),
    numbered("발주업체에 발주 후 상태 '발주완료'로 변경"),
    numbered("자재 입고 확인 후 '입고완료'로 변경"),
    numbered("단가는 협력업체 관리 DB와 비교해서 확인"),
    divider(),
    h2("💡 활용 팁"),
    bullet("현장명 필터로 특정 현장 발주 내역만 조회"),
    bullet("상태 '발주완료' 필터로 아직 안 온 자재 파악"),
    bullet("납기일 기준 정렬로 급한 발주 우선 관리"),
    bullet("단가 기록으로 다음 견적 시 원가 산정에 활용"),
    divider(),
])
mat_id = material_section["id"]

material_db = make_db(mat_id, "자재·발주 내역", "📦", {
    "품목명": {"title": {}},
    "현장명": {"rich_text": {}},
    "카테고리": {"select": {"options": [
        {"name": "타일", "color": "brown"},
        {"name": "목재", "color": "orange"},
        {"name": "도장재", "color": "yellow"},
        {"name": "전기자재", "color": "blue"},
        {"name": "설비자재", "color": "purple"},
        {"name": "창호", "color": "green"},
        {"name": "가구·가전", "color": "pink"},
        {"name": "철물·하드웨어", "color": "gray"},
        {"name": "기타", "color": "default"}
    ]}},
    "수량": {"number": {}},
    "단위": {"select": {"options": [
        {"name": "EA", "color": "gray"},
        {"name": "m²", "color": "blue"},
        {"name": "m", "color": "green"},
        {"name": "BOX", "color": "orange"},
        {"name": "세트", "color": "purple"},
        {"name": "식", "color": "yellow"}
    ]}},
    "단가": {"number": {"format": "won"}},
    "금액": {"formula": {"expression": "prop(\"수량\") * prop(\"단가\")"}},
    "발주업체": {"rich_text": {}},
    "상태": {"select": {"options": [
        {"name": "발주 전", "color": "gray"},
        {"name": "발주완료", "color": "blue"},
        {"name": "입고완료", "color": "green"},
        {"name": "반품", "color": "red"}
    ]}},
    "발주일": {"date": {}},
    "납기일": {"date": {}},
    "담당자": {"people": {}},
    "메모": {"rich_text": {}}
})

add(mat_id, [
    divider(),
    link(material_db["id"], "📦 자재·발주 내역 DB 열기"),
])
print(f"  완료! ID: {mat_id}")

# ============================================================
# 5. 회사 자료실 페이지 생성 (전 직원 공개)
# ============================================================
print("[ 5/6 ] 회사 자료실 페이지 생성...")
company_page = make_page(HUB_ID, "회사 자료실", "🏢", [
    callout("자주 쓰는 회사 정보와 양식을 모아둔 곳입니다. 견적·계약 업무 시 참고하세요.", "🏢"),
    divider(),
    h2("🏢 회사 기본 정보"),
    bullet("상호명: JM건축인테리어"),
    bullet("사업자번호: (직접 입력하세요)"),
    bullet("대표자: (직접 입력하세요)"),
    bullet("사업장 주소: (직접 입력하세요)"),
    bullet("대표 연락처: (직접 입력하세요)"),
    bullet("이메일: (직접 입력하세요)"),
    divider(),
    h2("🏦 계좌 정보"),
    bullet("은행명: (직접 입력하세요)"),
    bullet("계좌번호: (직접 입력하세요)"),
    bullet("예금주: (직접 입력하세요)"),
    divider(),
    h2("📄 자주 쓰는 양식"),
    bullet("표준 도급 계약서 — (파일 첨부)"),
    bullet("표준 견적서 양식 — (파일 첨부)"),
    bullet("하도급 계약서 — (파일 첨부)"),
    bullet("입금 확인서 — (파일 첨부)"),
    bullet("준공 확인서 — (파일 첨부)"),
    divider(),
    h2("🔗 자주 쓰는 사이트"),
    bullet("건설이앤씨 (건설업 면허 조회)"),
    bullet("국민건강보험공단"),
    bullet("4대사회보험 정보연계센터"),
    bullet("국세청 홈택스"),
    bullet("건축물대장 열람 — 정부24"),
    divider(),
    h2("📌 업무 주요 연락처"),
    bullet("세무사: (직접 입력하세요)"),
    bullet("노무사: (직접 입력하세요)"),
    bullet("법무사: (직접 입력하세요)"),
    bullet("건축사: (직접 입력하세요)"),
])
print(f"  완료! ID: {company_page['id']}")

# ============================================================
# 6. 허브 대시보드 전체 업데이트
# ============================================================
print("[ 6/6 ] 허브 대시보드 최종 업데이트...")

# 기존 블록 삭제
blocks = api("GET", f"/blocks/{HUB_ID}/children?page_size=100")
for b in blocks.get("results", []):
    api("DELETE", f"/blocks/{b['id']}")

add(HUB_ID, [
    callout("JM건축인테리어 통합 업무 관리 시스템  |  아래 항목을 클릭해서 바로 이동하세요.", "🏠"),
    divider(),

    # 전 직원 공개
    h2("🔵 영업·고객"),
    link(SECTION["crm"],       "👥 고객 CRM — 문의→견적→계약→완공"),
    link(SECTION["as"],        "🔧 A/S 관리 — 하자·AS 접수·처리"),
    divider(),

    h2("🔵 현장·업무"),
    link(SECTION["project"],   "📊 프로젝트 관리 — 현장별 진행현황·일정"),
    link(SECTION["task"],      "👷 직원 업무 관리 — 업무 배정·완료 현황"),
    link(mat_id,               "🛒 자재·발주 관리 — 현장별 자재 발주 추적"),
    link(SECTION["partner"],   "🤝 협력업체 관리 — 외주·자재업체 연락처"),
    divider(),

    h2("🔵 마케팅·아카이브"),
    link(SECTION["marketing"], "📣 마케팅 콘텐츠 관리 — 블로그·SNS"),
    link(SECTION["archive"],   "🏗️ 현장 아카이브 — 마감·시공사진·도면"),
    divider(),

    h2("🔵 공통"),
    link(notice_id,            "📢 공지사항 — 직원 공지"),
    link(company_page["id"],   "🏢 회사 자료실 — 기본정보·양식·연락처"),
    divider(),

    # 대표·이사 전용
    h2("🔴 대표·이사 전용"),
    link(SECTION["estimate"],   "📝 견적 관리 — 견적 발송·낙찰률"),
    link(SECTION["finance"],    "🔒 계약·재무 관리 — 계약금액·입금현황"),
    link(SECTION["accounting"], "💰 회계 관리 — 수입·지출·증빙"),
    link(SECTION["labor"],      "📋 노무 관리 — 직원정보·근태기록"),
    divider(),
])
print("  완료!")

print("")
print("=" * 60)
print("  검토 및 개선 완료!")
print("=" * 60)
print("  추가된 항목:")
print("  📢 공지사항 DB (직원 공지 전달 창구)")
print("  🛒 자재·발주 관리 DB (현장별 자재 발주)")
print("  🏢 회사 자료실 (기본정보·양식·연락처)")
print("")
print("  필드 개선:")
print("  📊 프로젝트 관리 — 진행률(%), 우선순위 추가")
print("  👥 고객 CRM — 마지막연락일, 팔로업예정일, 희망완공일 추가")
print("")
print("  허브 구조 재편: 영업·현장·마케팅·공통·대표전용")
