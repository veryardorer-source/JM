import urllib.request
import json

TOKEN = "ntn_H23137511225x1Um9OQaYDJW1V7e0AGk3dAO7z2znnhewK"
HUB_ID = "376089e9-0a52-8015-ba56-f0837a19d29a"

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
        print(f"  Error: {err.get('message','')}")
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

def callout(text, emoji):
    return {"object": "block", "type": "callout",
            "callout": {"rich_text": [{"text": {"content": text}}],
                        "icon": {"type": "emoji", "emoji": emoji}}}

def divider():
    return {"object": "block", "type": "divider", "divider": {}}

def heading(text, level=2):
    return {"object": "block", "type": f"heading_{level}",
            f"heading_{level}": {"rich_text": [{"text": {"content": text}}]}}

def bullet(text):
    return {"object": "block", "type": "bulleted_list_item",
            "bulleted_list_item": {"rich_text": [{"text": {"content": text}}]}}

# ============================================================
# 1. 고객 CRM (전 직원 공개)
#    문의 → 견적 → 계약 → 완공 전체 고객 흐름 추적
# ============================================================
print("[ 1/5 ] 고객 CRM DB 생성 중...")
crm_db = make_db(HUB_ID, "고객 CRM", "👥", {
    "고객명": {"title": {}},
    "연락처": {"phone_number": {}},
    "이메일": {"email": {}},
    "유입경로": {"select": {"options": [
        {"name": "네이버 블로그", "color": "green"},
        {"name": "인스타그램", "color": "pink"},
        {"name": "지인 소개", "color": "yellow"},
        {"name": "직접 문의", "color": "blue"},
        {"name": "재계약", "color": "purple"},
        {"name": "기타", "color": "gray"}
    ]}},
    "상담상태": {"select": {"options": [
        {"name": "첫 문의", "color": "gray"},
        {"name": "상담중", "color": "blue"},
        {"name": "견적 발송", "color": "yellow"},
        {"name": "계약 완료", "color": "green"},
        {"name": "진행중", "color": "orange"},
        {"name": "완공", "color": "purple"},
        {"name": "취소", "color": "red"}
    ]}},
    "관심공종": {"multi_select": {"options": [
        {"name": "인테리어", "color": "purple"},
        {"name": "건축", "color": "orange"},
        {"name": "리모델링", "color": "pink"},
        {"name": "부분시공", "color": "brown"}
    ]}},
    "현장주소": {"rich_text": {}},
    "예산규모": {"select": {"options": [
        {"name": "1천만원 미만", "color": "gray"},
        {"name": "1천~3천만원", "color": "blue"},
        {"name": "3천~5천만원", "color": "green"},
        {"name": "5천만원~1억", "color": "yellow"},
        {"name": "1억 이상", "color": "orange"}
    ]}},
    "첫 문의일": {"date": {}},
    "계약일": {"date": {}},
    "담당자": {"people": {}},
    "메모": {"rich_text": {}}
})
print(f"  완료!")

# ============================================================
# 2. 견적 관리 (대표·이사 전용)
#    견적서 발송 이력 및 낙찰률 추적
# ============================================================
print("[ 2/5 ] 견적 관리 페이지 생성 중...")
estimate_page = make_page(HUB_ID, "견적 관리 (대표·이사 전용)", "📝", [
    callout("이 페이지는 대표·이사만 접근합니다. 직원 초대 시 공유하지 마세요.", "⚠️"),
    divider(),
])
estimate_id = estimate_page["id"]

make_db(estimate_id, "견적 현황", "📝", {
    "현장명": {"title": {}},
    "고객명": {"rich_text": {}},
    "견적금액": {"number": {"format": "won"}},
    "견적상태": {"select": {"options": [
        {"name": "작성중", "color": "gray"},
        {"name": "발송완료", "color": "blue"},
        {"name": "협의중", "color": "yellow"},
        {"name": "계약성사", "color": "green"},
        {"name": "미성사", "color": "red"},
        {"name": "보류", "color": "orange"}
    ]}},
    "견적일": {"date": {}},
    "유효기간": {"date": {}},
    "공종": {"multi_select": {"options": [
        {"name": "인테리어", "color": "purple"},
        {"name": "건축", "color": "orange"},
        {"name": "리모델링", "color": "pink"},
        {"name": "부분시공", "color": "brown"}
    ]}},
    "면적": {"rich_text": {}},
    "견적서파일": {"files": {}},
    "담당자": {"people": {}},
    "미성사사유": {"rich_text": {}},
    "메모": {"rich_text": {}}
})
print(f"  완료!")

# ============================================================
# 3. 협력업체 관리 (전 직원 공개)
#    자주 쓰는 외주업체·자재업체 연락처 및 단가 정리
# ============================================================
print("[ 3/5 ] 협력업체 관리 DB 생성 중...")
partner_db = make_db(HUB_ID, "협력업체 관리", "🤝", {
    "업체명": {"title": {}},
    "업종": {"select": {"options": [
        {"name": "전기", "color": "yellow"},
        {"name": "설비/배관", "color": "blue"},
        {"name": "타일", "color": "brown"},
        {"name": "목공", "color": "orange"},
        {"name": "도장", "color": "pink"},
        {"name": "철거", "color": "gray"},
        {"name": "창호", "color": "green"},
        {"name": "가구", "color": "purple"},
        {"name": "자재납품", "color": "red"},
        {"name": "기타", "color": "default"}
    ]}},
    "담당자명": {"rich_text": {}},
    "연락처": {"phone_number": {}},
    "거래상태": {"select": {"options": [
        {"name": "주거래", "color": "green"},
        {"name": "가끔 사용", "color": "yellow"},
        {"name": "비추천", "color": "red"},
        {"name": "거래중단", "color": "gray"}
    ]}},
    "단가표": {"files": {}},
    "계좌정보": {"rich_text": {}},
    "사업자번호": {"rich_text": {}},
    "평점": {"select": {"options": [
        {"name": "★★★★★", "color": "green"},
        {"name": "★★★★", "color": "blue"},
        {"name": "★★★", "color": "yellow"},
        {"name": "★★", "color": "orange"},
        {"name": "★", "color": "red"}
    ]}},
    "메모": {"rich_text": {}}
})
print(f"  완료!")

# ============================================================
# 4. A/S 관리 (전 직원 공개)
#    완공 후 하자·AS 요청 추적 및 처리 이력
# ============================================================
print("[ 4/5 ] A/S 관리 DB 생성 중...")
as_db = make_db(HUB_ID, "A/S 관리", "🔧", {
    "AS내용": {"title": {}},
    "현장명": {"rich_text": {}},
    "고객명": {"rich_text": {}},
    "고객연락처": {"phone_number": {}},
    "AS유형": {"select": {"options": [
        {"name": "하자보수", "color": "red"},
        {"name": "단순AS", "color": "yellow"},
        {"name": "추가공사", "color": "blue"},
        {"name": "민원", "color": "orange"}
    ]}},
    "접수상태": {"select": {"options": [
        {"name": "접수", "color": "gray"},
        {"name": "처리중", "color": "blue"},
        {"name": "처리완료", "color": "green"},
        {"name": "보류", "color": "yellow"}
    ]}},
    "접수일": {"date": {}},
    "처리예정일": {"date": {}},
    "처리완료일": {"date": {}},
    "담당자": {"people": {}},
    "비용발생": {"checkbox": {}},
    "비용": {"number": {"format": "won"}},
    "처리내용": {"rich_text": {}},
    "사진": {"files": {}}
})
print(f"  완료!")

# ============================================================
# 5. 허브 대시보드 내용 보강
#    새로 추가된 메뉴 반영
# ============================================================
print("[ 5/5 ] 허브 대시보드 업데이트 중...")

# 기존 블록 가져오기
blocks = api("GET", f"/blocks/{HUB_ID}/children")
# 기존 블록 전체 삭제 후 재작성
for block in blocks.get("results", []):
    api("DELETE", f"/blocks/{block['id']}")

api("PATCH", f"/blocks/{HUB_ID}/children", {"children": [
    callout("JM건축인테리어 통합 업무 관리 시스템  |  각 메뉴를 클릭해 업무를 관리하세요.", "🏠"),
    divider(),
    heading("영업·고객 관리", 2),
    bullet("👥 고객 CRM — 문의→견적→계약→완공 전체 흐름"),
    bullet("🔧 A/S 관리 — 완공 후 하자·AS 요청 처리"),
    divider(),
    heading("현장 관리", 2),
    bullet("📊 프로젝트 관리 — 현장별 진행현황·일정·담당자"),
    bullet("👷 직원 업무 관리 — 일일 업무 배정·완료 현황"),
    bullet("🤝 협력업체 관리 — 외주업체·자재업체 연락처·단가"),
    bullet("🏗️ 현장 아카이브 — 마감·시공사진·도면 보관"),
    divider(),
    heading("마케팅", 2),
    bullet("📣 마케팅 콘텐츠 관리 — 블로그·SNS 콘텐츠 캘린더"),
    divider(),
    heading("대표·이사 전용", 2),
    bullet("📝 견적 관리 — 견적 발송 이력·낙찰률"),
    bullet("🔒 계약·재무 관리 — 계약금액·입금현황"),
    bullet("💰 회계 관리 — 수입·지출·증빙"),
    bullet("📋 노무 관리 — 직원정보·근태기록"),
    divider(),
]})
print(f"  완료!")

print("")
print("=" * 55)
print("  추가 시스템 생성 완료!")
print("=" * 55)
print("  추가된 항목:")
print("  👥 고객 CRM")
print("  📝 견적 관리 (대표·이사 전용)")
print("  🤝 협력업체 관리")
print("  🔧 A/S 관리")
print("  🏠 허브 대시보드 업데이트")
