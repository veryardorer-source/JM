import urllib.request
import json

TOKEN = "ntn_H23137511225x1Um9OQaYDJW1V7e0AGk3dAO7z2znnhewK"
HUB_ID = "376089e9-0a52-8015-ba56-f0837a19d29a"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

# 기존 DB IDs (rebuild에서 생성됨)
OLD = {
    "crm":       "376089e9-0a52-8197-8c7d-edbd4e41855c",
    "project":   "376089e9-0a52-8117-9f29-d82739c89408",
    "task":      "376089e9-0a52-810a-928c-c57e5baa6987",
    "partner":   "376089e9-0a52-811f-a34f-e7b4a0c8dcf6",
    "marketing": "376089e9-0a52-8185-bf3d-f04d32327f61",
    "archive":   "376089e9-0a52-81b4-8b76-d470c38a1921",
    "as":        "376089e9-0a52-81f7-8d55-fd6bf8390db2",
    "estimate_page":   "376089e9-0a52-8111-b14f-d019288d309f",
    "finance_page":    "376089e9-0a52-81a4-8ff0-f8dc7faa893c",
    "accounting_page": "376089e9-0a52-8165-81c7-fa8583b170ab",
    "labor_page":      "376089e9-0a52-8198-ad95-e976d01df894",
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

def add(page_id, blocks):
    return api("PATCH", f"/blocks/{page_id}/children", {"children": blocks})

def h2(t): return {"object":"block","type":"heading_2","heading_2":{"rich_text":[{"text":{"content":t}}]}}
def h3(t): return {"object":"block","type":"heading_3","heading_3":{"rich_text":[{"text":{"content":t}}]}}
def para(t): return {"object":"block","type":"paragraph","paragraph":{"rich_text":[{"text":{"content":t}}]}}
def callout(t, e): return {"object":"block","type":"callout","callout":{"rich_text":[{"text":{"content":t}}],"icon":{"type":"emoji","emoji":e}}}
def bullet(t): return {"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{"text":{"content":t}}]}}
def numbered(t): return {"object":"block","type":"numbered_list_item","numbered_list_item":{"rich_text":[{"text":{"content":t}}]}}
def divider(): return {"object":"block","type":"divider","divider":{}}
def warn(): return callout("이 페이지는 대표·이사만 접근합니다. 직원 초대 시 공유하지 마세요.", "⚠️")
def db_link(db_id, label):
    return {"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{
        "type":"mention","mention":{"type":"page","page":{"id":db_id}},
        "plain_text":label,"href":f"https://notion.so/{db_id.replace('-','')}"}]}}

# ============================================================
# 각 DB에 대한 섹션 데이터 정의
# ============================================================
SECTIONS = {
    "crm": {
        "title": "고객 CRM",
        "emoji": "👥",
        "desc": "고객의 첫 문의부터 완공까지 전체 여정을 한 곳에서 관리합니다.",
        "blocks": [
            h2("📋 사용 방법"),
            numbered("새 고객 문의 시 + 새로 만들기로 고객 추가"),
            numbered("상담상태를 단계별로 업데이트"),
            numbered("유입경로 꼭 기록 → 효과적인 마케팅 채널 파악"),
            numbered("계약 완료 시 견적 관리와 연계하여 금액 관리"),
            divider(),
            h2("🔄 상태 흐름"),
            para("첫 문의  →  상담중  →  견적 발송  →  계약 완료  →  진행중  →  완공"),
            divider(),
            h2("💡 활용 팁"),
            bullet("'견적 발송' 필터로 팔로업 필요 고객만 관리"),
            bullet("유입경로 통계로 마케팅 효과 측정"),
            bullet("예산규모 미리 파악해두면 견적 준비에 도움"),
            bullet("메모란에 고객 선호 스타일, 특이사항 기록 권장"),
        ]
    },
    "project": {
        "title": "프로젝트 관리",
        "emoji": "📊",
        "desc": "진행 중인 모든 현장의 상태를 한눈에 파악합니다. 계약금액은 계약·재무 페이지에서 관리됩니다.",
        "blocks": [
            h2("📋 사용 방법"),
            numbered("새 현장 수주 시 현장 추가, 담당자·일정 입력"),
            numbered("진행상태 주기적으로 업데이트"),
            numbered("현장 페이지 내부에 일지·사진·메모 추가"),
            numbered("완료 후 현장 아카이브로 사진·도면 이동"),
            divider(),
            h2("📌 상태 기준"),
            bullet("계약 전 — 견적 발송, 계약 미체결"),
            bullet("진행중 — 계약 완료, 시공 중"),
            bullet("완료 — 준공 및 잔금 수령 완료"),
            bullet("보류 — 일시 중단 또는 연기"),
            divider(),
            h2("💡 활용 팁"),
            bullet("현장 페이지에 시공일지·사진·고객요청사항 정리"),
            bullet("완료예정일 기준 정렬로 일정 관리"),
            bullet("하도급 업체·자재 발주 현황도 현장 페이지에 기록"),
        ]
    },
    "task": {
        "title": "직원 업무 관리",
        "emoji": "👷",
        "desc": "직원별 업무를 배정하고 진행 상황을 추적합니다. 매일 아침 업무 확인 용도로 활용하세요.",
        "blocks": [
            h2("📋 사용 방법"),
            numbered("대표·이사가 업무 추가 후 담당자 지정"),
            numbered("직원은 본인 업무 상태 업데이트 (대기→진행중→완료)"),
            numbered("마감일 임박 업무는 우선순위 '높음' 설정"),
            numbered("완료된 업무는 상태를 '완료'로 변경"),
            divider(),
            h2("📌 우선순위 기준"),
            bullet("높음 🔴 — 당일 또는 내일까지 처리"),
            bullet("보통 🟡 — 이번 주 내 처리"),
            bullet("낮음 🟢 — 여유 있게 처리"),
            divider(),
            h2("💡 활용 팁"),
            bullet("담당자 필터로 직원별 업무량 파악"),
            bullet("카테고리 '현장' 필터로 현장 업무만 모아서 확인"),
            bullet("매주 월요일 미팅 때 이 DB 기준으로 업무 공유 권장"),
        ]
    },
    "partner": {
        "title": "협력업체 관리",
        "emoji": "🤝",
        "desc": "자주 거래하는 외주·자재업체 정보를 한 곳에서 관리합니다. 급하게 연락할 때 바로 찾을 수 있어요.",
        "blocks": [
            h2("📋 사용 방법"),
            numbered("거래 업체 추가 시 업종·연락처·평점 필수 입력"),
            numbered("단가표 파일이 있으면 첨부"),
            numbered("거래 후 평점 업데이트"),
            numbered("거래 중단 업체는 삭제 대신 상태를 '거래중단'으로 변경"),
            divider(),
            h2("📌 업종 분류"),
            bullet("전기 / 설비·배관 / 타일 / 목공 / 도장"),
            bullet("철거 / 창호 / 가구 / 자재납품"),
            divider(),
            h2("💡 활용 팁"),
            bullet("★★★★★ 필터로 신뢰 업체만 빠르게 조회"),
            bullet("업종 필터로 단가 비교"),
            bullet("계좌정보 저장 → 세금계산서 발행 시 편리"),
            bullet("각 업체 페이지에 시공 사례, 특이사항 메모 추천"),
        ]
    },
    "marketing": {
        "title": "마케팅 콘텐츠 관리",
        "emoji": "📣",
        "desc": "블로그·인스타·유튜브 콘텐츠를 계획하고 발행 이력을 관리합니다. 외부 업체 의뢰 시에도 여기서 진행 상황 확인.",
        "blocks": [
            h2("📋 사용 방법"),
            numbered("콘텐츠 기획 시 제목·채널·발행예정일 입력"),
            numbered("현장 아카이브 사진 참고해서 어떤 현장 올릴지 결정"),
            numbered("외부 업체 의뢰 시 담당을 '외부업체'로 설정"),
            numbered("발행 완료 후 링크 입력 및 상태 '발행완료'로 변경"),
            divider(),
            h2("📌 채널별 특성"),
            bullet("네이버 블로그 — 검색 유입 핵심 (현장 소개, 시공사례)"),
            bullet("인스타그램 — 비주얼 중심 (완공 사진, 분위기 컷)"),
            bullet("유튜브 — 시공 과정 영상"),
            bullet("카카오채널 — 기존 고객 리텐션, 이벤트 안내"),
            divider(),
            h2("💡 활용 팁"),
            bullet("주 3회 발행 목표 — 월(블로그) / 수(인스타) / 금(블로그)"),
            bullet("현장 아카이브 '마케팅활용 ✅' 현장 우선 활용"),
            bullet("발행예정일 캘린더 뷰로 스케줄 관리"),
            bullet("각 콘텐츠별 포스팅 — 디자인편 / 시공편 / 마감편"),
        ]
    },
    "archive": {
        "title": "현장 아카이브",
        "emoji": "🏗️",
        "desc": "완공된 현장의 사진·도면을 체계적으로 보관합니다. 마케팅 자료 및 포트폴리오로 활용됩니다.",
        "blocks": [
            h2("📋 사용 방법"),
            numbered("현장 완공 후 바로 아카이브에 추가"),
            numbered("마감사진·시공사진·도면 파일 첨부"),
            numbered("스타일태그 설정 (모던, 미니멀, 상업공간 등)"),
            numbered("마케팅에 쓸 현장은 '마케팅활용' ✅ 체크"),
            divider(),
            h2("📸 사진 분류 기준"),
            bullet("마감사진 — 완공 후 전체·포인트 컷 (마케팅 메인)"),
            bullet("시공사진 — 철거·골조·마감 각 단계 과정 사진"),
            bullet("도면 — 평면도·천장도·입면도 등 설계 파일"),
            divider(),
            h2("💡 활용 팁"),
            bullet("스타일태그 필터로 '모던' 현장만 모아 포트폴리오 제작"),
            bullet("'마케팅활용 ✅' 필터로 블로그용 현장만 빠르게 조회"),
            bullet("외부 마케팅 업체에 이 DB 링크 공유 → 자료 전달 불필요"),
            bullet("각 현장 페이지에 Before/After 사진, 고객 후기 추가 권장"),
        ]
    },
    "as": {
        "title": "A/S 관리",
        "emoji": "🔧",
        "desc": "완공 후 하자보수 및 AS 요청을 빠짐없이 기록하고 처리합니다. 분쟁 예방과 고객 신뢰 유지에 핵심입니다.",
        "blocks": [
            h2("📋 사용 방법"),
            numbered("AS 접수 즉시 내용·고객연락처·접수일 입력"),
            numbered("담당자 지정 후 처리예정일 설정"),
            numbered("처리 완료 후 내용 기록 및 상태 '처리완료' 변경"),
            numbered("비용 발생 시 체크박스 ✅ 및 금액 입력"),
            divider(),
            h2("📌 AS 유형"),
            bullet("하자보수 — 시공 불량으로 인한 수리 (무상)"),
            bullet("단순AS — 사용법 안내, 소모품 교체 등"),
            bullet("추가공사 — 고객 요청 추가 작업 (유상)"),
            bullet("민원 — 분쟁 또는 불만 사항"),
            divider(),
            h2("💡 활용 팁"),
            bullet("'접수·처리중' 필터로 미처리 AS만 관리"),
            bullet("현장명 필터로 특정 현장 AS 이력 전체 조회"),
            bullet("처리내용 상세히 기록 → 유사 상황 재발 시 참고"),
            callout("처리완료 전까지 반드시 상태를 관리하세요. 연락 없으면 고객 불만으로 이어집니다.", "⚠️"),
        ]
    },
}

# ============================================================
# STEP 1: 기존 허브 DB들을 감싸는 섹션 페이지 생성
# ============================================================
new_ids = {}

for key, sec in SECTIONS.items():
    print(f"  [{key}] 섹션 페이지 생성 중...")
    # 섹션 페이지 생성 (설명 + DB 링크 포함)
    section_page = make_page(HUB_ID, sec["title"], sec["emoji"])
    sid = section_page["id"]
    new_ids[key] = sid

    # 설명 블록 추가
    content = [callout(sec["desc"], sec["emoji"]), divider()] + sec["blocks"] + [
        divider(),
        h2("📁 데이터베이스"),
        db_link(OLD[key], f"{sec['emoji']} {sec['title']} DB 열기"),
    ]
    add(sid, content)
    print(f"    완료! 페이지 ID: {sid}")

# 대표·이사 전용은 기존 페이지 그대로 사용
new_ids["estimate_page"]   = OLD["estimate_page"]
new_ids["finance_page"]    = OLD["finance_page"]
new_ids["accounting_page"] = OLD["accounting_page"]
new_ids["labor_page"]      = OLD["labor_page"]

# ============================================================
# STEP 2: 허브 대시보드 링크를 새 섹션 페이지로 업데이트
# ============================================================
print("\n  허브 대시보드 링크 업데이트 중...")
# 기존 블록 삭제
blocks = api("GET", f"/blocks/{HUB_ID}/children?page_size=100")
for b in blocks.get("results", []):
    api("DELETE", f"/blocks/{b['id']}")

# 새 링크로 재작성
def link(pid, label):
    return {"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{
        "type":"mention","mention":{"type":"page","page":{"id":pid}},
        "plain_text":label,"href":f"https://notion.so/{pid.replace('-','')}"}]}}

add(HUB_ID, [
    callout("JM건축인테리어 통합 업무 관리 시스템  |  아래 항목을 클릭해서 바로 이동하세요.", "🏠"),
    divider(),
    h2("🔵 전 직원 공개"),
    link(new_ids["crm"],       "👥 고객 CRM — 문의→견적→계약→완공"),
    link(new_ids["project"],   "📊 프로젝트 관리 — 현장별 진행현황·일정"),
    link(new_ids["task"],      "👷 직원 업무 관리 — 업무 배정·완료 현황"),
    link(new_ids["partner"],   "🤝 협력업체 관리 — 외주·자재업체 연락처"),
    link(new_ids["archive"],   "🏗️ 현장 아카이브 — 마감·시공사진·도면"),
    link(new_ids["marketing"], "📣 마케팅 콘텐츠 관리 — 블로그·SNS"),
    link(new_ids["as"],        "🔧 A/S 관리 — 하자·AS 접수·처리"),
    divider(),
    h2("🔴 대표·이사 전용"),
    link(new_ids["estimate_page"],   "📝 견적 관리 — 견적 발송·낙찰률"),
    link(new_ids["finance_page"],    "🔒 계약·재무 관리 — 계약금액·입금현황"),
    link(new_ids["accounting_page"], "💰 회계 관리 — 수입·지출·증빙"),
    link(new_ids["labor_page"],      "📋 노무 관리 — 직원정보·근태기록"),
    divider(),
])
print("  완료!")

print("\n" + "=" * 55)
print("  섹션 페이지 + 내용 구성 완료!")
print("=" * 55)
for k, v in new_ids.items():
    print(f"  {k:20} | {v}")
