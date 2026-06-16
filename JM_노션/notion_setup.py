import urllib.request
import json

from notion_auth import TOKEN
PARENT_PAGE_ID = "376089e9-0a52-8015-ba56-f0837a19d29a"

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
        print(f"  HTTP Error: {err.get('message','')}")
        return err

def make_page(parent_id, title, emoji, content_blocks=None):
    body = {
        "parent": {"type": "page_id", "page_id": parent_id},
        "icon": {"type": "emoji", "emoji": emoji},
        "properties": {
            "title": {"title": [{"text": {"content": title}}]}
        }
    }
    if content_blocks:
        body["children"] = content_blocks
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

def bullet(text):
    return {"object": "block", "type": "bulleted_list_item",
            "bulleted_list_item": {"rich_text": [{"text": {"content": text}}]}}

def heading(text, level=2):
    return {"object": "block", "type": f"heading_{level}",
            f"heading_{level}": {"rich_text": [{"text": {"content": text}}]}}

# ============================================================
# 1. 메인 허브 페이지 설정
# ============================================================
print("[ 1/8 ] 메인 허브 설정 중...")
hub_id = PARENT_PAGE_ID
api("PATCH", f"/pages/{hub_id}", {
    "icon": {"type": "emoji", "emoji": "🏠"},
    "properties": {"title": {"title": [{"text": {"content": "JM건축인테리어 허브"}}]}}
})
api("PATCH", f"/blocks/{hub_id}/children", {"children": [
    callout("JM건축인테리어 통합 업무 관리 시스템  |  각 메뉴를 클릭해 업무를 관리하세요.", "🏠"),
    divider(),
    heading("전 직원 공개", 2),
    bullet("📊 프로젝트 관리"),
    bullet("👷 직원 업무 관리"),
    bullet("📣 마케팅 콘텐츠 관리"),
    bullet("🏗️ 현장 아카이브"),
    divider(),
    heading("대표·이사 전용", 2),
    bullet("🔒 계약·재무 관리"),
    bullet("💰 회계 관리"),
    bullet("📋 노무 관리"),
    divider(),
]})
print("  완료!")

# ============================================================
# 2. 프로젝트 관리 DB (전 직원 공개)
# ============================================================
print("[ 2/8 ] 프로젝트 관리 DB 생성 중...")
proj_db = make_db(hub_id, "프로젝트 관리", "📊", {
    "현장명": {"title": {}},
    "상태": {"select": {"options": [
        {"name": "계약 전", "color": "gray"},
        {"name": "진행중", "color": "blue"},
        {"name": "완료", "color": "green"},
        {"name": "보류", "color": "yellow"}
    ]}},
    "담당자": {"people": {}},
    "시작일": {"date": {}},
    "완료예정일": {"date": {}},
    "현장주소": {"rich_text": {}},
    "고객명": {"rich_text": {}},
    "고객연락처": {"phone_number": {}},
    "공종": {"multi_select": {"options": [
        {"name": "인테리어", "color": "purple"},
        {"name": "건축", "color": "orange"},
        {"name": "리모델링", "color": "pink"},
        {"name": "부분시공", "color": "brown"}
    ]}},
    "메모": {"rich_text": {}}
})
print(f"  완료!")

# ============================================================
# 3. 직원 업무 관리 DB (전 직원 공개)
# ============================================================
print("[ 3/8 ] 직원 업무 관리 DB 생성 중...")
task_db = make_db(hub_id, "직원 업무 관리", "👷", {
    "업무명": {"title": {}},
    "담당자": {"people": {}},
    "상태": {"select": {"options": [
        {"name": "대기", "color": "gray"},
        {"name": "진행중", "color": "blue"},
        {"name": "완료", "color": "green"},
        {"name": "보류", "color": "yellow"}
    ]}},
    "우선순위": {"select": {"options": [
        {"name": "높음", "color": "red"},
        {"name": "보통", "color": "yellow"},
        {"name": "낮음", "color": "green"}
    ]}},
    "현장명": {"rich_text": {}},
    "마감일": {"date": {}},
    "카테고리": {"select": {"options": [
        {"name": "현장", "color": "orange"},
        {"name": "사무", "color": "blue"},
        {"name": "영업", "color": "purple"},
        {"name": "기타", "color": "gray"}
    ]}},
    "메모": {"rich_text": {}}
})
print(f"  완료!")

# ============================================================
# 4. 마케팅 콘텐츠 관리 DB (전 직원 공개)
# ============================================================
print("[ 4/8 ] 마케팅 DB 생성 중...")
mkt_db = make_db(hub_id, "마케팅 콘텐츠 관리", "📣", {
    "콘텐츠명": {"title": {}},
    "채널": {"select": {"options": [
        {"name": "네이버 블로그", "color": "green"},
        {"name": "인스타그램", "color": "pink"},
        {"name": "유튜브", "color": "red"},
        {"name": "카카오채널", "color": "yellow"}
    ]}},
    "상태": {"select": {"options": [
        {"name": "기획중", "color": "gray"},
        {"name": "작성중", "color": "blue"},
        {"name": "검토중", "color": "yellow"},
        {"name": "발행완료", "color": "green"}
    ]}},
    "담당": {"select": {"options": [
        {"name": "내부제작", "color": "blue"},
        {"name": "외부업체", "color": "purple"}
    ]}},
    "현장명": {"rich_text": {}},
    "발행예정일": {"date": {}},
    "발행일": {"date": {}},
    "링크": {"url": {}},
    "메모": {"rich_text": {}}
})
print(f"  완료!")

# ============================================================
# 5. 현장 아카이브 DB (전 직원 공개)
# ============================================================
print("[ 5/8 ] 현장 아카이브 DB 생성 중...")
archive_db = make_db(hub_id, "현장 아카이브", "🏗️", {
    "현장명": {"title": {}},
    "공종": {"multi_select": {"options": [
        {"name": "인테리어", "color": "purple"},
        {"name": "건축", "color": "orange"},
        {"name": "리모델링", "color": "pink"}
    ]}},
    "완공년도": {"select": {"options": [
        {"name": "2023", "color": "gray"},
        {"name": "2024", "color": "blue"},
        {"name": "2025", "color": "green"},
        {"name": "2026", "color": "yellow"}
    ]}},
    "면적": {"rich_text": {}},
    "위치": {"rich_text": {}},
    "마감사진": {"files": {}},
    "시공사진": {"files": {}},
    "도면": {"files": {}},
    "마케팅활용": {"checkbox": {}},
    "스타일태그": {"multi_select": {"options": [
        {"name": "모던", "color": "gray"},
        {"name": "클래식", "color": "brown"},
        {"name": "내추럴", "color": "green"},
        {"name": "미니멀", "color": "blue"},
        {"name": "상업공간", "color": "purple"},
        {"name": "주거공간", "color": "orange"},
        {"name": "럭셔리", "color": "red"}
    ]}},
    "설명": {"rich_text": {}}
})
print(f"  완료!")

# ============================================================
# 6. 계약·재무 관리 (대표·이사 전용)
# ============================================================
print("[ 6/8 ] 계약·재무 관리 페이지 생성 중...")
finance_page = make_page(hub_id, "계약·재무 관리 (대표·이사 전용)", "🔒", [
    callout("이 페이지는 대표·이사만 접근합니다. 직원 초대 시 이 페이지는 공유하지 마세요.", "⚠️"),
    divider(),
])
finance_id = finance_page["id"]
make_db(finance_id, "계약·재무 현황", "💼", {
    "현장명": {"title": {}},
    "계약금액": {"number": {"format": "won"}},
    "계약금": {"number": {"format": "won"}},
    "중도금": {"number": {"format": "won"}},
    "잔금": {"number": {"format": "won"}},
    "미수금": {"number": {"format": "won"}},
    "입금상태": {"select": {"options": [
        {"name": "계약금 완료", "color": "yellow"},
        {"name": "중도금 완료", "color": "blue"},
        {"name": "잔금 완료", "color": "green"},
        {"name": "미수금", "color": "red"}
    ]}},
    "계약일": {"date": {}},
    "예상 마진": {"number": {"format": "won"}},
    "비고": {"rich_text": {}}
})
print(f"  완료!")

# ============================================================
# 7. 회계 관리 (대표·이사 전용)
# ============================================================
print("[ 7/8 ] 회계 관리 페이지 생성 중...")
acct_page = make_page(hub_id, "회계 관리 (대표·이사 전용)", "💰", [
    callout("이 페이지는 대표·이사만 접근합니다. 직원 초대 시 이 페이지는 공유하지 마세요.", "⚠️"),
    divider(),
])
acct_id = acct_page["id"]
make_db(acct_id, "수입·지출 내역", "📒", {
    "내용": {"title": {}},
    "구분": {"select": {"options": [
        {"name": "수입", "color": "green"},
        {"name": "지출", "color": "red"},
        {"name": "대출/차입", "color": "yellow"}
    ]}},
    "카테고리": {"select": {"options": [
        {"name": "공사대금", "color": "blue"},
        {"name": "자재비", "color": "orange"},
        {"name": "인건비", "color": "purple"},
        {"name": "외주비", "color": "pink"},
        {"name": "운영비", "color": "gray"},
        {"name": "기타", "color": "brown"}
    ]}},
    "금액": {"number": {"format": "won"}},
    "날짜": {"date": {}},
    "현장명": {"rich_text": {}},
    "결제수단": {"select": {"options": [
        {"name": "법인카드", "color": "blue"},
        {"name": "계좌이체", "color": "green"},
        {"name": "현금", "color": "yellow"}
    ]}},
    "증빙": {"files": {}},
    "메모": {"rich_text": {}}
})
print(f"  완료!")

# ============================================================
# 8. 노무 관리 (대표·이사 전용)
# ============================================================
print("[ 8/8 ] 노무 관리 페이지 생성 중...")
labor_page = make_page(hub_id, "노무 관리 (대표·이사 전용)", "📋", [
    callout("이 페이지는 대표·이사만 접근합니다. 직원 초대 시 이 페이지는 공유하지 마세요.", "⚠️"),
    divider(),
])
labor_id = labor_page["id"]
make_db(labor_id, "직원 정보", "👤", {
    "직원명": {"title": {}},
    "직책": {"select": {"options": [
        {"name": "대표", "color": "red"},
        {"name": "이사", "color": "orange"},
        {"name": "팀장", "color": "yellow"},
        {"name": "사원", "color": "blue"}
    ]}},
    "입사일": {"date": {}},
    "기본급": {"number": {"format": "won"}},
    "연락처": {"phone_number": {}},
    "계약형태": {"select": {"options": [
        {"name": "정규직", "color": "green"},
        {"name": "계약직", "color": "yellow"},
        {"name": "일용직", "color": "gray"}
    ]}},
    "계약서": {"files": {}},
    "메모": {"rich_text": {}}
})
make_db(labor_id, "근태 기록", "🕐", {
    "직원명": {"title": {}},
    "날짜": {"date": {}},
    "출근시간": {"rich_text": {}},
    "퇴근시간": {"rich_text": {}},
    "근무유형": {"select": {"options": [
        {"name": "정상", "color": "green"},
        {"name": "반차", "color": "yellow"},
        {"name": "연차", "color": "orange"},
        {"name": "결근", "color": "red"},
        {"name": "출장", "color": "blue"}
    ]}},
    "메모": {"rich_text": {}}
})
print(f"  완료!")

print("")
print("=" * 55)
print("  JM건축인테리어 업무 시스템 생성 완료!")
print("=" * 55)
print(f"  허브 URL: https://notion.so/{hub_id.replace('-','')}")
print("")
print("  [전 직원 공개]  📊 👷 📣 🏗️")
print("  [대표·이사 전용]  🔒 💰 📋")

