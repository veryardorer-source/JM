import urllib.request
import json

from notion_auth import TOKEN
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

def link_block(page_id, label):
    """실제 클릭 가능한 페이지 링크 블록"""
    return {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {
            "rich_text": [{
                "type": "mention",
                "mention": {"type": "page", "page": {"id": page_id}},
                "plain_text": label,
                "href": f"https://notion.so/{page_id.replace('-','')}"
            }]
        }
    }

def heading(text, level=2):
    return {"object": "block", "type": f"heading_{level}",
            f"heading_{level}": {"rich_text": [{"text": {"content": text}}]}}

def divider():
    return {"object": "block", "type": "divider", "divider": {}}

def callout(text, emoji):
    return {"object": "block", "type": "callout",
            "callout": {"rich_text": [{"text": {"content": text}}],
                        "icon": {"type": "emoji", "emoji": emoji}}}

def warn_block():
    return callout("이 페이지는 대표·이사만 접근합니다. 직원 초대 시 이 페이지는 공유하지 마세요.", "⚠️")

# ============================================================
# STEP 1: 기존 허브 블록 전부 삭제
# ============================================================
print("기존 허브 블록 정리 중...")
blocks = api("GET", f"/blocks/{HUB_ID}/children?page_size=100")
for b in blocks.get("results", []):
    api("DELETE", f"/blocks/{b['id']}")
print(f"  {len(blocks.get('results',[]))}개 삭제 완료")

# ============================================================
# STEP 2: 모든 DB/페이지 새로 생성하며 ID 수집
# ============================================================
ids = {}

print("[ 1/7 ] 고객 CRM 생성...")
r = make_db(HUB_ID, "고객 CRM", "👥", {
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
ids["crm"] = r["id"]; print(f"  완료!")

print("[ 2/7 ] 프로젝트 관리 생성...")
r = make_db(HUB_ID, "프로젝트 관리", "📊", {
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
ids["project"] = r["id"]; print(f"  완료!")

print("[ 3/7 ] 직원 업무 관리 생성...")
r = make_db(HUB_ID, "직원 업무 관리", "👷", {
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
ids["task"] = r["id"]; print(f"  완료!")

print("[ 4/7 ] 협력업체 관리 생성...")
r = make_db(HUB_ID, "협력업체 관리", "🤝", {
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
ids["partner"] = r["id"]; print(f"  완료!")

print("[ 5/7 ] 마케팅 + 현장 아카이브 + A/S 생성...")
r = make_db(HUB_ID, "마케팅 콘텐츠 관리", "📣", {
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
ids["marketing"] = r["id"]

r = make_db(HUB_ID, "현장 아카이브", "🏗️", {
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
ids["archive"] = r["id"]

r = make_db(HUB_ID, "A/S 관리", "🔧", {
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
ids["as"] = r["id"]
print(f"  완료!")

print("[ 6/7 ] 대표·이사 전용 페이지 생성...")
# 견적 관리 페이지
est_page = make_page(HUB_ID, "견적 관리 (대표·이사 전용)", "📝", [warn_block(), divider()])
ids["estimate_page"] = est_page["id"]
r = make_db(est_page["id"], "견적 현황", "📝", {
    "현장명": {"title": {}},
    "고객명": {"rich_text": {}},
    "견적금액": {"number": {"format": "won"}},
    "견적상태": {"select": {"options": [
        {"name": "작성중", "color": "gray"},
        {"name": "발송완료", "color": "blue"},
        {"name": "협의중", "color": "yellow"},
        {"name": "계약성사", "color": "green"},
        {"name": "미성사", "color": "red"}
    ]}},
    "견적일": {"date": {}},
    "유효기간": {"date": {}},
    "공종": {"multi_select": {"options": [
        {"name": "인테리어", "color": "purple"},
        {"name": "건축", "color": "orange"},
        {"name": "리모델링", "color": "pink"}
    ]}},
    "면적": {"rich_text": {}},
    "견적서파일": {"files": {}},
    "담당자": {"people": {}},
    "메모": {"rich_text": {}}
})

# 계약·재무 페이지
fin_page = make_page(HUB_ID, "계약·재무 관리 (대표·이사 전용)", "🔒", [warn_block(), divider()])
ids["finance_page"] = fin_page["id"]
make_db(fin_page["id"], "계약·재무 현황", "💼", {
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

# 회계 페이지
acct_page = make_page(HUB_ID, "회계 관리 (대표·이사 전용)", "💰", [warn_block(), divider()])
ids["accounting_page"] = acct_page["id"]
make_db(acct_page["id"], "수입·지출 내역", "📒", {
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

# 노무 페이지
labor_page = make_page(HUB_ID, "노무 관리 (대표·이사 전용)", "📋", [warn_block(), divider()])
ids["labor_page"] = labor_page["id"]
make_db(labor_page["id"], "직원 정보", "👤", {
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
make_db(labor_page["id"], "근태 기록", "🕐", {
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

# ============================================================
# STEP 3: 허브 대시보드를 클릭 가능한 링크로 재작성
# ============================================================
print("[ 7/7 ] 허브 대시보드 링크 연결 중...")
api("PATCH", f"/blocks/{HUB_ID}/children", {"children": [
    callout("JM건축인테리어 통합 업무 관리 시스템  |  아래 항목을 클릭해서 바로 이동하세요.", "🏠"),
    divider(),
    heading("🔵 전 직원 공개", 2),
    link_block(ids["crm"],       "👥 고객 CRM — 문의→견적→계약→완공"),
    link_block(ids["project"],   "📊 프로젝트 관리 — 현장별 진행현황·일정"),
    link_block(ids["task"],      "👷 직원 업무 관리 — 업무 배정·완료 현황"),
    link_block(ids["partner"],   "🤝 협력업체 관리 — 외주·자재업체 연락처"),
    link_block(ids["archive"],   "🏗️ 현장 아카이브 — 마감·시공사진·도면"),
    link_block(ids["marketing"], "📣 마케팅 콘텐츠 관리 — 블로그·SNS"),
    link_block(ids["as"],        "🔧 A/S 관리 — 하자·AS 접수·처리"),
    divider(),
    heading("🔴 대표·이사 전용", 2),
    link_block(ids["estimate_page"],   "📝 견적 관리 — 견적 발송·낙찰률"),
    link_block(ids["finance_page"],    "🔒 계약·재무 관리 — 계약금액·입금현황"),
    link_block(ids["accounting_page"], "💰 회계 관리 — 수입·지출·증빙"),
    link_block(ids["labor_page"],      "📋 노무 관리 — 직원정보·근태기록"),
    divider(),
]})
print(f"  완료!")

print("")
print("=" * 55)
print("  허브 링크 연결 완료! 이제 클릭하면 이동돼요!")
print("=" * 55)
for k, v in ids.items():
    print(f"  {k:20} | {v}")

