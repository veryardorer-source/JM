"""
notion_project_v2.py
─────────────────────────────────────────────
현장 관리 시스템 v2 — 현장 하나 = 페이지 하나
포함 내용:
  1. 현장 목록 DB (메인 현황판용)
  2. 현장 템플릿 v2 (업체 견적서 DB + 구매제품 리스트 DB + 파일 자료실)
  3. 메인 허브 대시보드 업데이트 (진행중 현장 + 직원 업무)
"""

import urllib.request, json

TOKEN = "ntn_H23137511225x1Um9OQaYDJW1V7e0AGk3dAO7z2znnhewK"
HUB_ID = "376089e9-0a52-8015-ba56-f0837a19d29a"

# 기존 섹션 IDs (notion_final.py 에서 생성)
S = {
    "crm":        "376089e9-0a52-81c5-a945-d6ca14b09ee2",
    "project":    "376089e9-0a52-8109-a884-d78783514cc7",
    "task":       "376089e9-0a52-81f1-a6a7-d1b301ec0024",
    "material":   "376089e9-0a52-8101-be42-dd6f86b42ee1",
    "partner":    "376089e9-0a52-81bb-ab62-d204f6c0b904",
    "marketing":  "376089e9-0a52-8162-be4b-da3ec2e4f3a9",
    "archive":    "376089e9-0a52-81e4-8b74-f51dd3e04d67",
    "as":         "376089e9-0a52-816d-8f8b-deeb91860dca",
    "notice":     "376089e9-0a52-81b1-8299-e963c9dbb8e9",
    "company":    "376089e9-0a52-816f-8598-ec3beb2aaf77",
    "estimate":   "376089e9-0a52-8188-ad3a-cb3b2a059c4b",
    "finance":    "376089e9-0a52-8149-a37e-e6e5f3c1b805",
    "accounting": "376089e9-0a52-81ba-9ff3-e83a5e7530d5",
    "labor":      "376089e9-0a52-81de-bb0d-f2fb3f6cf4b9",
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
        print(f"  ERR: {err.get('message','')[:100]}")
        return err

def add(pid, blocks):
    return api("PATCH", f"/blocks/{pid}/children", {"children": blocks})

def clear(pid):
    bs = api("GET", f"/blocks/{pid}/children?page_size=100")
    for b in bs.get("results", []):
        api("DELETE", f"/blocks/{b['id']}")

def make_page(pid, title, emoji):
    return api("POST", "/pages", {
        "parent": {"type": "page_id", "page_id": pid},
        "icon": {"type": "emoji", "emoji": emoji},
        "properties": {"title": {"title": [{"text": {"content": title}}]}}
    })

def make_db(pid, title, emoji, props):
    return api("POST", "/databases", {
        "parent": {"type": "page_id", "page_id": pid},
        "icon": {"type": "emoji", "emoji": emoji},
        "is_inline": True,
        "title": [{"text": {"content": title}}],
        "properties": props
    })

# ── 블록 헬퍼 ──
def h1(t): return {"object":"block","type":"heading_1","heading_1":{"rich_text":[{"text":{"content":t}}],"is_toggleable":False}}
def h2(t): return {"object":"block","type":"heading_2","heading_2":{"rich_text":[{"text":{"content":t}}]}}
def h3(t): return {"object":"block","type":"heading_3","heading_3":{"rich_text":[{"text":{"content":t}}]}}
def para(t, color="default"): return {"object":"block","type":"paragraph","paragraph":{"rich_text":[{"text":{"content":t},"annotations":{"color":color}}]}}
def callout(t, e, color="gray_background"): return {"object":"block","type":"callout","callout":{"rich_text":[{"text":{"content":t}}],"icon":{"type":"emoji","emoji":e},"color":color}}
def bullet(t, color="default"): return {"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{"text":{"content":t},"annotations":{"color":color}}]}}
def todo(t, checked=False): return {"object":"block","type":"to_do","to_do":{"rich_text":[{"text":{"content":t}}],"checked":checked}}
def divider(): return {"object":"block","type":"divider","divider":{}}
def toggle(title, children, color="blue"): return {"object":"block","type":"toggle","toggle":{
    "rich_text":[{"text":{"content":title},"annotations":{"bold":True,"color":color}}],"children":children}}
def cols(c1, c2): return {"object":"block","type":"column_list","column_list":{"children":[
    {"object":"block","type":"column","column":{"children":c1}},
    {"object":"block","type":"column","column":{"children":c2}}]}}
def link_mention(pid, label): return {"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{
    "type":"mention","mention":{"type":"page","page":{"id":pid}},
    "plain_text":label,"href":f"https://notion.so/{pid.replace('-','')}"}]}}

# ══════════════════════════════════════════════════════════════
# STEP 1: 현장 관리 허브 페이지 신규 생성
# ══════════════════════════════════════════════════════════════
print("=" * 60)
print("STEP 1: 현장 관리 허브 생성")
print("=" * 60)

site_hub = make_page(HUB_ID, "🏗️ 현장 관리", "🏗️")
SITE_HUB_ID = site_hub["id"]
print(f"  현장 관리 허브 ID: {SITE_HUB_ID}")

# ── 현장 목록 DB (메인 현황판) ──
print("  현장 목록 DB 생성...")
site_list_db = make_db(SITE_HUB_ID, "현장 목록", "📋", {
    "현장명":       {"title": {}},
    "단계":         {"select": {"options": [
        {"name": "🔵 상담중",    "color": "blue"},
        {"name": "🟡 견적발송",  "color": "yellow"},
        {"name": "🟠 계약완료",  "color": "orange"},
        {"name": "🔨 시공중",    "color": "red"},
        {"name": "✅ 완공",      "color": "green"},
        {"name": "⏸️ 보류",      "color": "gray"},
    ]}},
    "고객명":       {"rich_text": {}},
    "고객연락처":   {"phone_number": {}},
    "현장주소":     {"rich_text": {}},
    "담당자":       {"rich_text": {}},
    "계약금액":     {"number": {"format": "won"}},
    "시작일":       {"date": {}},
    "완료예정일":   {"date": {}},
    "Drive폴더":    {"url": {}},
    "공유링크":     {"url": {}},
    "메모":         {"rich_text": {}},
})
SITE_LIST_DB_ID = site_list_db["id"]
print(f"    완료! DB ID: {SITE_LIST_DB_ID}")

# ── 현장 허브 안내 블록 ──
add(SITE_HUB_ID, [
    callout("현장 하나 = 페이지 하나. 아래 현장 목록에서 현장을 클릭하면 해당 현장의 모든 자료(도면·사진·견적서·업무)를 볼 수 있습니다.", "🏗️", "blue_background"),
    divider(),
    h2("📋 현장 목록"),
    callout("새 현장 시작 시: 아래 목록에 행 추가 → 현장 페이지 직접 생성 후 링크 → Drive 폴더 링크 연결", "✏️"),
    # site_list_db is inline so it appears here
    divider(),
    toggle("📁 현장 페이지 만드는 방법", [
        para("1. 위 목록에서 현장명 클릭 → 해당 현장 전용 페이지로 이동"),
        para("2. 또는 왼쪽 사이드바에서 + 버튼으로 이 페이지 하위에 새 페이지 추가"),
        para("3. 아래 [현장 템플릿] 페이지를 복제(Duplicate)해서 사용하면 편리함"),
        divider(),
        bullet("현장명 형식 권장: 2024_강남구_홍길동"),
        bullet("Google Drive 폴더 구조: JM현장 > 2024_강남구_홍길동 > 도면 / 사진 / 견적서"),
    ], "gray"),
])

# ══════════════════════════════════════════════════════════════
# STEP 2: 현장 템플릿 v2 (상세 구조)
# ══════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 2: 현장 템플릿 v2 생성")
print("=" * 60)

template = make_page(SITE_HUB_ID, "📌 현장 템플릿 (복제해서 사용)", "📌")
T = template["id"]
print(f"  템플릿 ID: {T}")

# ── 상단: 기본 정보 ──
add(T, [
    callout("이 페이지를 복제(우클릭 → Duplicate)해서 새 현장 페이지로 사용하세요.", "📌", "yellow_background"),
    divider(),
    h1("🏗️ [현장명] 현장 관리"),
    divider(),
])

# ── 기본 정보 (2컬럼) ──
add(T, [
    h2("📋 기본 정보"),
    cols(
        [
            callout("📍 현장 주소\n(주소 입력)", "📍"),
            callout("👤 고객명 / 연락처\n(이름) / (번호)", "👤"),
            callout("📅 계약일 / 완료예정일\n(날짜) ~ (날짜)", "📅"),
        ],
        [
            callout("💰 계약금액\n₩ (금액)", "💰"),
            callout("👷 담당자\n(이름)", "👷"),
            callout("📁 Drive 폴더\n(링크 입력)", "📁"),
        ]
    ),
    divider(),
])

# ── 파일 자료실 ──
print("  파일 자료실 섹션 추가...")
add(T, [
    h2("📁 파일 자료실 (Google Drive 연동)"),
    callout("대용량 파일(사진·CAD·3D)은 Google Drive에 저장하고 여기에 링크만 연결하세요.\n노션에는 5MB 이하 파일만 직접 업로드 권장.", "💡", "blue_background"),
    toggle("🗂️ Google Drive 폴더 구조 가이드 (클릭해서 보기)", [
        para("📂 JM현장/"),
        para("  └ 📂 2024_현장명_고객명/"),
        para("      ├ 📂 01_도면   (CAD, PDF 도면)"),
        para("      ├ 📂 02_사진   (착공전 / 시공중 / 완공)"),
        para("      ├ 📂 03_견적서 (업체별 견적 PDF)"),
        para("      ├ 📂 04_3D이미지  (렌더링, 투시도)"),
        para("      ├ 📂 05_고객자료  (고객이 보내준 레퍼런스·제품)"),
        para("      └ 📂 06_계약서   (계약서, 발주서)"),
        divider(),
        bullet("Google Drive 폴더 → 우클릭 → 링크 복사 → 아래 각 항목에 붙여넣기"),
        bullet("Drive 파일은 노션에서 /embed 로 임베드 가능 (PDF, 이미지 미리보기 됨)"),
    ], "gray"),
    toggle("📐 도면 (CAD / PDF)", [
        callout("Drive 링크를 아래에 붙여넣거나, /embed 로 PDF 직접 임베드하세요.", "📐"),
        para("▶ 평면도: (Drive 링크)"),
        para("▶ 천장도: (Drive 링크)"),
        para("▶ 입면도: (Drive 링크)"),
        para("▶ 전기설비도: (Drive 링크)"),
    ]),
    toggle("🎨 3D 이미지 / 렌더링", [
        callout("3D 이미지는 Drive에 저장 후 링크 연결. /embed 사용 시 이미지 미리보기 가능.", "🎨"),
        para("▶ Drive 폴더: (링크)"),
    ]),
    toggle("📸 현장 사진", [
        callout("사진은 Google Drive에 저장하고 링크만 연결하세요 (용량 절약).\n완공 사진은 마케팅 활용을 위해 고화질로 따로 보관하세요.", "📸"),
        para("▶ 착공 전 사진: (Drive 링크)"),
        para("▶ 시공 중 사진: (Drive 링크)"),
        para("▶ 완공 사진: (Drive 링크)"),
    ]),
    toggle("📄 고객 제공 자료 (레퍼런스·제품 이미지)", [
        callout("고객이 보내준 레퍼런스, 인스타 이미지, 원하는 제품 사진 등", "📄"),
        para("▶ Drive 폴더: (링크)"),
        para("▶ 주요 참고사항: (직접 메모)"),
    ]),
    divider(),
])

# ── 고객 전달사항 ──
print("  고객 전달사항 섹션 추가...")
add(T, [
    h2("💬 고객 전달사항"),
    callout("고객에게 받은 요청사항, 주의사항, 특이사항을 여기에 정리하세요. 모든 직원이 확인할 수 있습니다.", "💬", "yellow_background"),
    toggle("✅ 필수 요청사항", [
        todo("(요청사항 1)"),
        todo("(요청사항 2)"),
        todo("(요청사항 3)"),
    ]),
    toggle("⚠️ 주의사항 / 특이사항", [
        bullet("(주의사항 입력)"),
    ]),
    toggle("📞 미팅·통화 메모", [
        bullet("(날짜) - (내용)"),
    ]),
    divider(),
])

# ── 구매 제품 리스트 DB ──
print("  구매 제품 리스트 DB 생성...")
add(T, [h2("🛒 구매 제품 리스트")])
add(T, [callout("고객이 요청한 제품, 직접 구매 제품을 여기서 관리하세요. 납품 상태까지 추적 가능합니다.", "🛒")])

product_db = make_db(T, "구매 제품 리스트", "🛒", {
    "제품명":       {"title": {}},
    "카테고리":     {"select": {"options": [
        {"name": "조명",    "color": "yellow"},
        {"name": "타일·마루", "color": "orange"},
        {"name": "욕실·주방", "color": "blue"},
        {"name": "가구·가전", "color": "purple"},
        {"name": "도어·창호", "color": "green"},
        {"name": "도장·도배", "color": "pink"},
        {"name": "기타",    "color": "gray"},
    ]}},
    "브랜드":       {"rich_text": {}},
    "규격·색상":    {"rich_text": {}},
    "수량":         {"number": {}},
    "단가":         {"number": {"format": "won"}},
    "합계":         {"formula": {"expression": "prop(\"수량\") * prop(\"단가\")"}},
    "구매처":       {"rich_text": {}},
    "구매링크":     {"url": {}},
    "납품예정일":   {"date": {}},
    "상태":         {"select": {"options": [
        {"name": "주문전",   "color": "gray"},
        {"name": "주문완료", "color": "yellow"},
        {"name": "납품완료", "color": "green"},
        {"name": "반품",     "color": "red"},
    ]}},
    "고객요청":     {"checkbox": {}},
    "비고":         {"rich_text": {}},
})
print(f"    완료! DB ID: {product_db['id']}")

add(T, [divider()])

# ── 업체 견적서 DB ──
print("  업체 견적서 DB 생성...")
add(T, [
    h2("📊 업체 견적서 관리"),
    callout("업체에서 받은 견적서를 여기서 비교·관리하세요. 견적서 PDF는 Drive에 저장 후 링크 연결.", "📊"),
])

quote_db = make_db(T, "업체 견적서", "📊", {
    "업체명":       {"title": {}},
    "공종":         {"select": {"options": [
        {"name": "철거",     "color": "red"},
        {"name": "설비",     "color": "blue"},
        {"name": "전기",     "color": "yellow"},
        {"name": "목공",     "color": "orange"},
        {"name": "타일",     "color": "green"},
        {"name": "도장",     "color": "pink"},
        {"name": "도배",     "color": "purple"},
        {"name": "마루",     "color": "brown"},
        {"name": "가구",     "color": "default"},
        {"name": "조명",     "color": "yellow"},
        {"name": "욕실",     "color": "blue"},
        {"name": "주방",     "color": "green"},
        {"name": "기타",     "color": "gray"},
    ]}},
    "견적금액":     {"number": {"format": "won"}},
    "견적일":       {"date": {}},
    "견적서파일":   {"url": {}},
    "상태":         {"select": {"options": [
        {"name": "검토중",   "color": "yellow"},
        {"name": "계약완료", "color": "green"},
        {"name": "미채택",   "color": "gray"},
        {"name": "재견적요청", "color": "orange"},
    ]}},
    "담당자연락처": {"phone_number": {}},
    "비고":         {"rich_text": {}},
})
print(f"    완료! DB ID: {quote_db['id']}")

add(T, [divider()])

# ── 공정 체크리스트 ──
print("  공정 체크리스트 추가...")
add(T, [
    h2("✅ 공정 체크리스트"),
    callout("각 공정 완료 시 체크하세요. 담당 직원이 직접 체크 가능합니다.", "✅"),
    toggle("1️⃣ 철거 공사", [
        todo("현장 보양 작업"),
        todo("기존 철거 (벽·바닥·천장)"),
        todo("폐기물 처리"),
        todo("철거 완료 사진 촬영"),
    ]),
    toggle("2️⃣ 설비·전기", [
        todo("배관 위치 확인 및 변경"),
        todo("전기 배선 작업"),
        todo("분전함 점검"),
        todo("욕실 방수 작업"),
        todo("설비·전기 완료 확인"),
    ]),
    toggle("3️⃣ 목공 작업", [
        todo("경량 칸막이 설치"),
        todo("천장 틀 작업"),
        todo("목공 마감 확인"),
    ]),
    toggle("4️⃣ 타일·바닥", [
        todo("욕실 타일 작업"),
        todo("바닥재 (마루·타일) 시공"),
        todo("줄눈 마감"),
        todo("타일·바닥 완료 사진"),
    ]),
    toggle("5️⃣ 도장·도배", [
        todo("퍼티 작업"),
        todo("도장 (벽·천장)"),
        todo("도배 시공"),
        todo("도장·도배 완료 확인"),
    ]),
    toggle("6️⃣ 마감·준공", [
        todo("조명 설치"),
        todo("도어·창호 설치"),
        todo("욕실 기기 설치"),
        todo("주방 가구 설치"),
        todo("청소"),
        todo("완공 사진 촬영 (고화질)"),
        todo("고객 최종 확인"),
        todo("잔금 수령"),
        todo("하자보증서 전달"),
    ]),
    divider(),
])

# ── 직원 업무 배정 DB ──
print("  직원 업무 배정 DB 생성...")
add(T, [
    h2("👷 직원 업무 배정"),
    callout("이 현장에서 누가 어떤 업무를 하는지 여기서 관리하세요. 메인 페이지 현황판과 연동됩니다.", "👷"),
])

task_db = make_db(T, "현장 업무", "📝", {
    "업무내용":     {"title": {}},
    "담당자":       {"rich_text": {}},
    "공종":         {"select": {"options": [
        {"name": "현장감리",  "color": "blue"},
        {"name": "설비",      "color": "green"},
        {"name": "전기",      "color": "yellow"},
        {"name": "목공",      "color": "orange"},
        {"name": "타일",      "color": "red"},
        {"name": "도장",      "color": "pink"},
        {"name": "도배",      "color": "purple"},
        {"name": "자재발주",  "color": "default"},
        {"name": "기타",      "color": "gray"},
    ]}},
    "예정일":       {"date": {}},
    "완료여부":     {"checkbox": {}},
    "비고":         {"rich_text": {}},
})
print(f"    완료! DB ID: {task_db['id']}")

add(T, [divider()])

# ── 미팅 기록 DB ──
print("  미팅 기록 DB 생성...")
add(T, [h2("📞 미팅·통화 기록")])
meeting_db = make_db(T, "미팅 기록", "📞", {
    "날짜":         {"title": {}},
    "유형":         {"select": {"options": [
        {"name": "방문미팅",  "color": "blue"},
        {"name": "전화통화",  "color": "green"},
        {"name": "현장확인",  "color": "orange"},
        {"name": "카톡",      "color": "yellow"},
    ]}},
    "참석자":       {"rich_text": {}},
    "주요내용":     {"rich_text": {}},
    "결정사항":     {"rich_text": {}},
    "다음일정":     {"date": {}},
})
print(f"    완료!")

add(T, [divider()])

# ── A/S 이력 ──
add(T, [
    h2("🔧 A/S 이력"),
    callout("완공 후 A/S 요청 내용을 여기에 기록하세요.", "🔧"),
    toggle("A/S 기록", [
        para("(날짜) - (내용) - (처리결과)"),
    ]),
    divider(),
])

# ══════════════════════════════════════════════════════════════
# STEP 3: 샘플 현장 (작성 예시)
# ══════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 3: 샘플 현장 예시 생성")
print("=" * 60)

sample = make_page(SITE_HUB_ID, "예시_2024_마포구_김소연 (샘플)", "🔨")
SP = sample["id"]
print(f"  샘플 ID: {SP}")

add(SP, [
    callout("이 페이지는 작성 예시입니다. 실제 사용 시 템플릿을 복제하세요.", "📌", "yellow_background"),
    divider(),
    h1("🔨 마포구 김소연 현장 관리"),
    divider(),
    h2("📋 기본 정보"),
    cols(
        [
            callout("📍 현장 주소\n서울 마포구 합정동 123-45\n(아파트 101호)", "📍"),
            callout("👤 고객명 / 연락처\n김소연 / 010-1234-5678", "👤"),
            callout("📅 계약일 / 완료예정일\n2024.03.01 ~ 2024.04.15", "📅"),
        ],
        [
            callout("💰 계약금액\n₩ 35,000,000", "💰"),
            callout("👷 담당자\n홍길동 이사", "👷"),
            callout("📁 Drive 폴더\nhttps://drive.google.com/...", "📁"),
        ]
    ),
    divider(),
    h2("💬 고객 전달사항"),
    callout("주요 요청사항 요약 (예시)", "💬", "yellow_background"),
    toggle("✅ 필수 요청사항", [
        todo("침실 2개 합방 → 넓은 드레스룸으로 변경"),
        todo("주방 아일랜드 추가"),
        todo("욕실 전체 교체 (2개소)"),
        todo("포인트 타일 - 고객 직접 선택 (Drive 파일 참조)"),
    ]),
    toggle("⚠️ 주의사항", [
        bullet("층간소음 주의 — 아래 201호 민원 이력 있음"),
        bullet("기존 전기 배선이 노후화 — 전기공사 업체 확인 필요"),
    ]),
    divider(),
])

# 샘플 구매제품 입력
product_sample_db = make_db(SP, "구매 제품 리스트", "🛒", {
    "제품명":       {"title": {}},
    "카테고리":     {"select": {"options": [
        {"name": "조명","color":"yellow"},{"name": "타일·마루","color":"orange"},
        {"name": "욕실·주방","color":"blue"},{"name": "기타","color":"gray"},
    ]}},
    "수량":         {"number": {}},
    "단가":         {"number": {"format": "won"}},
    "합계":         {"formula": {"expression": "prop(\"수량\") * prop(\"단가\")"}},
    "구매처":       {"rich_text": {}},
    "상태":         {"select": {"options": [
        {"name":"주문전","color":"gray"},{"name":"주문완료","color":"yellow"},{"name":"납품완료","color":"green"},
    ]}},
    "고객요청":     {"checkbox": {}},
})
products = [
    ("포인트 타일 (욕실)", "욕실·주방", 30, 15000, "건자재마트"),
    ("LED 주방등", "조명", 2, 85000, "인터넷구매"),
    ("마루 (강마루 12mm)", "타일·마루", 40, 45000, "지정업체"),
]
for name, cat, qty, price, shop in products:
    api("POST", "/pages", {
        "parent": {"database_id": product_sample_db["id"]},
        "properties": {
            "제품명":   {"title": [{"text": {"content": name}}]},
            "카테고리": {"select": {"name": cat}},
            "수량":     {"number": qty},
            "단가":     {"number": price},
            "구매처":   {"rich_text": [{"text": {"content": shop}}]},
            "고객요청": {"checkbox": True},
        }
    })
print("  샘플 제품 입력 완료!")

# 샘플 견적서 DB
quote_sample_db = make_db(SP, "업체 견적서", "📊", {
    "업체명":       {"title": {}},
    "공종":         {"select": {"options": [
        {"name":"철거","color":"red"},{"name":"설비","color":"blue"},{"name":"전기","color":"yellow"},
        {"name":"목공","color":"orange"},{"name":"타일","color":"green"},{"name":"도장","color":"pink"},
    ]}},
    "견적금액":     {"number": {"format": "won"}},
    "상태":         {"select": {"options": [
        {"name":"검토중","color":"yellow"},{"name":"계약완료","color":"green"},{"name":"미채택","color":"gray"},
    ]}},
    "견적서파일":   {"url": {}},
})
quotes = [
    ("대성철거", "철거", 2500000, "계약완료"),
    ("한강설비", "설비", 4800000, "계약완료"),
    ("청수전기", "전기", 3200000, "검토중"),
    ("미래목공", "목공", 8500000, "계약완료"),
    ("강남타일", "타일", 5200000, "검토중"),
]
for firm, work, amt, status in quotes:
    api("POST", "/pages", {
        "parent": {"database_id": quote_sample_db["id"]},
        "properties": {
            "업체명":   {"title": [{"text": {"content": firm}}]},
            "공종":     {"select": {"name": work}},
            "견적금액": {"number": amt},
            "상태":     {"select": {"name": status}},
        }
    })
print("  샘플 견적서 입력 완료!")

# ══════════════════════════════════════════════════════════════
# STEP 4: 메인 허브 대시보드 업데이트
# ══════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 4: 메인 허브 대시보드 재구성")
print("=" * 60)

# 현장 현황판 DB (허브 인라인)
print("  현장 현황판 DB 생성...")
board = api("POST", "/databases", {
    "parent": {"type": "page_id", "page_id": HUB_ID},
    "icon": {"type": "emoji", "emoji": "📍"},
    "is_inline": True,
    "title": [{"text": {"content": "📍 현장 현황판"}}],
    "properties": {
        "현장명":     {"title": {}},
        "단계":       {"select": {"options": [
            {"name": "🔵 상담중",    "color": "blue"},
            {"name": "🟡 견적발송",  "color": "yellow"},
            {"name": "🟠 계약완료",  "color": "orange"},
            {"name": "🔨 시공중",    "color": "red"},
            {"name": "✅ 완공",      "color": "green"},
            {"name": "⏸️ 보류",      "color": "gray"},
        ]}},
        "담당자":     {"rich_text": {}},
        "고객명":     {"rich_text": {}},
        "완료예정일": {"date": {}},
        "현장페이지": {"url": {}},
        "메모":       {"rich_text": {}},
    }
})
BOARD_ID = board["id"]
print(f"  현황판 DB ID: {BOARD_ID}")

# 허브 재구성
print("  허브 메인 페이지 재구성...")
clear(HUB_ID)

add(HUB_ID, [
    # ① 업무 흐름 한줄
    h2("📈 업무 흐름"),
    para("고객문의 → 상담·견적 → 계약 → 시공 → 완공·잔금 → 아카이브·마케팅", "blue"),
    divider(),

    # ② 현장 현황판
    h2("📍 현장 현황판"),
    callout(
        "진행중인 현장을 여기에 입력하세요. '현장페이지' 칸에 해당 현장 페이지 링크를 넣으면 바로 이동 가능합니다.\n"
        "💡 팁: 위 목록 오른쪽 상단 [···] → 보기 변경 → 보드로 변경하면 단계별 칸반보드로 볼 수 있어요.",
        "📍"
    ),
    # board DB는 inline으로 여기 표시됨
    divider(),
])

# 직원 업무 현황 (인라인 DB)
print("  직원 업무 현황 DB 생성...")
staff_db = api("POST", "/databases", {
    "parent": {"type": "page_id", "page_id": HUB_ID},
    "icon": {"type": "emoji", "emoji": "👷"},
    "is_inline": True,
    "title": [{"text": {"content": "👷 직원 업무 현황"}}],
    "properties": {
        "업무내용":   {"title": {}},
        "담당자":     {"rich_text": {}},
        "현장명":     {"rich_text": {}},
        "공종":       {"select": {"options": [
            {"name": "현장감리", "color": "blue"},
            {"name": "설비·전기", "color": "yellow"},
            {"name": "목공", "color": "orange"},
            {"name": "타일·마루", "color": "green"},
            {"name": "도장·도배", "color": "pink"},
            {"name": "자재발주", "color": "purple"},
            {"name": "사무", "color": "gray"},
        ]}},
        "예정일":     {"date": {}},
        "완료":       {"checkbox": {}},
    }
})

add(HUB_ID, [
    h2("👷 직원 업무 현황"),
    callout(
        "각 직원이 오늘/이번 주 어떤 현장에서 무슨 일을 하는지 볼 수 있습니다.\n"
        "각 현장 페이지의 [현장 업무] DB에 입력한 내용을 여기에도 요약해서 입력하세요.",
        "👷"
    ),
    # staff_db 인라인으로 여기 표시됨
    divider(),
])

# 빠른 이동
add(HUB_ID, [
    h2("🗂️ 빠른 이동"),
    cols(
        [
            h3("🔵 전 직원"),
            link_mention(SITE_HUB_ID,    "🏗️ 현장 관리 (현장별 상세)"),
            link_mention(S["crm"],        "👥 고객 CRM"),
            link_mention(S["task"],       "👷 직원 업무"),
            link_mention(S["material"],   "🛒 자재·발주"),
            link_mention(S["partner"],    "🤝 협력업체"),
            link_mention(S["marketing"],  "📣 마케팅"),
            link_mention(S["archive"],    "📷 현장 아카이브"),
            link_mention(S["as"],         "🔧 A/S 관리"),
            link_mention(S["notice"],     "📢 공지사항"),
            link_mention(S["company"],    "🏢 회사 자료실"),
        ],
        [
            h3("🔴 대표·이사 전용"),
            link_mention(S["estimate"],   "📝 견적 관리"),
            link_mention(S["finance"],    "🔒 계약·재무"),
            link_mention(S["accounting"], "💰 회계 관리"),
            link_mention(S["labor"],      "📋 노무 관리"),
        ]
    ),
    divider(),

    # Google Drive 연동 안내
    toggle("📁 Google Drive 연동 방법 (클릭해서 보기)", [
        h3("현장 폴더 구조"),
        bullet("내 드라이브 > JM현장 > 2024_현장명 > 도면 / 사진 / 견적서"),
        divider(),
        h3("노션에 Drive 파일 삽입하는 방법"),
        bullet("방법 1: 노션에서 /embed → Drive 파일 URL 붙여넣기 (PDF, 이미지 미리보기)"),
        bullet("방법 2: /bookmark → Drive 폴더 URL → 폴더 링크 카드로 표시"),
        bullet("방법 3: Drive 파일 우클릭 → 링크 복사 → 노션 텍스트에 붙여넣기"),
        divider(),
        h3("사진 관리 추천 방법"),
        bullet("현장사진 → Google Drive 저장 → 노션에 폴더 링크만 연결"),
        bullet("완공 사진 (마케팅용) → Drive에서 '공유 가능한 링크' 설정 → 마케팅 담당자에게 전달"),
        bullet("노션에 직접 업로드: 5MB 이하 파일만 권장 (계약서, 작은 PDF 등)"),
    ], "gray"),
])

print("\n" + "=" * 60)
print("✅ 완료!")
print("=" * 60)
print(f"\n현장 관리 허브:  https://notion.so/{SITE_HUB_ID.replace('-','')}")
print(f"현장 템플릿:     https://notion.so/{T.replace('-','')}")
print(f"샘플 현장:       https://notion.so/{SP.replace('-','')}")
print(f"메인 허브:       https://notion.so/{HUB_ID.replace('-','')}")
print(f"\n현장 목록 DB:   {SITE_LIST_DB_ID}")
print(f"현황판 DB:       {BOARD_ID}")
print(f"직원현황 DB:     {staff_db['id']}")
print("\n📌 다음 단계:")
print("  1. 현장 템플릿 페이지를 복제해서 실제 현장 페이지로 사용")
print("  2. Google Drive에 현장별 폴더 생성 후 링크 연결")
print("  3. 현장 현황판에 진행중인 현장 입력")
print("  4. Plus 플랜 업그레이드 후 → DB Relation 연동으로 자동화 가능")
