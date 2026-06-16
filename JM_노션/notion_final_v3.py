"""
notion_final_v3.py
─────────────────────────────────────────────
대화에서 결정한 내용 전체 반영 — 최종 재구성
  1. 옛 템플릿/샘플 보관처리(아카이브)
  2. 현장 템플릿 v3 (사진 외 전부 노션 업로드 + 도면·3D 외부공유용 분리)
  3. 출금방 권한 변경 (이사·대표·현장직 공유)
  4. ⚙️ 설정·권한 가이드 페이지 신설
  5. 메인 허브에 신규 페이지 링크 추가
"""

import urllib.request, json

from notion_auth import TOKEN
HUB_ID       = "376089e9-0a52-8015-ba56-f0837a19d29a"
SITE_HUB_ID  = "37d089e9-0a52-815d-a402-db252a8959a8"
OLD_TEMPLATE = "37d089e9-0a52-817c-8b07-ed490797f0c7"
OLD_SAMPLE   = "37d089e9-0a52-812a-af3b-c7b739666a20"
RECEIPT_PAGE = "37d089e9-0a52-81d2-a468-f4129ce32861"
PAYOUT_PAGE  = "37d089e9-0a52-81a1-8915-c279bf034c98"

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

def add(pid, blocks): return api("PATCH", f"/blocks/{pid}/children", {"children": blocks})
def archive_page(pid): return api("PATCH", f"/pages/{pid}", {"archived": True})

def make_page(pid, title, emoji):
    return api("POST", "/pages", {
        "parent": {"type": "page_id", "page_id": pid},
        "icon": {"type": "emoji", "emoji": emoji},
        "properties": {"title": {"title": [{"text": {"content": title}}]}}
    })

def child_page(pid, title, emoji, blocks):
    return api("POST", "/pages", {
        "parent": {"type": "page_id", "page_id": pid},
        "icon": {"type": "emoji", "emoji": emoji},
        "properties": {"title": {"title": [{"text": {"content": title}}]}},
        "children": blocks
    })

def make_db(pid, title, emoji, props):
    return api("POST", "/databases", {
        "parent": {"type": "page_id", "page_id": pid},
        "icon": {"type": "emoji", "emoji": emoji},
        "is_inline": True,
        "title": [{"text": {"content": title}}],
        "properties": props
    })

def h1(t): return {"object":"block","type":"heading_1","heading_1":{"rich_text":[{"text":{"content":t}}]}}
def h2(t): return {"object":"block","type":"heading_2","heading_2":{"rich_text":[{"text":{"content":t}}]}}
def h3(t): return {"object":"block","type":"heading_3","heading_3":{"rich_text":[{"text":{"content":t}}]}}
def para(t, color="default"): return {"object":"block","type":"paragraph","paragraph":{"rich_text":[{"text":{"content":t},"annotations":{"color":color}}]}}
def callout(t, e, color="gray_background"): return {"object":"block","type":"callout","callout":{"rich_text":[{"text":{"content":t}}],"icon":{"type":"emoji","emoji":e},"color":color}}
def bullet(t): return {"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{"text":{"content":t}}]}}
def num(t): return {"object":"block","type":"numbered_list_item","numbered_list_item":{"rich_text":[{"text":{"content":t}}]}}
def todo(t): return {"object":"block","type":"to_do","to_do":{"rich_text":[{"text":{"content":t}}],"checked":False}}
def divider(): return {"object":"block","type":"divider","divider":{}}
def toggle(title, children, color="blue"): return {"object":"block","type":"toggle","toggle":{
    "rich_text":[{"text":{"content":title},"annotations":{"bold":True,"color":color}}],"children":children}}
def cols(c1, c2): return {"object":"block","type":"column_list","column_list":{"children":[
    {"object":"block","type":"column","column":{"children":c1}},
    {"object":"block","type":"column","column":{"children":c2}}]}}
def page_link(pid, label): return {"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{
    "type":"mention","mention":{"type":"page","page":{"id":pid}},
    "plain_text":label,"href":f"https://notion.so/{pid.replace('-','')}"}]}}

# ══════════════════════════════════════════════════════════════
print("=" * 60)
print("STEP 1: 옛 템플릿/샘플 보관처리")
print("=" * 60)
archive_page(OLD_TEMPLATE)
archive_page(OLD_SAMPLE)
print("  옛 템플릿·샘플 아카이브 완료")

# ══════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 2: 현장 템플릿 v3 생성")
print("=" * 60)

tmpl = make_page(SITE_HUB_ID, "📌 현장 템플릿 (복제해서 사용) — v3", "📌")
T = tmpl["id"]
print(f"  템플릿 ID: {T}")

add(T, [
    callout("새 현장 시작 시 이 페이지를 우클릭 → 복제(Duplicate) → 현장명으로 이름 변경해서 사용하세요.", "📌", "yellow_background"),
    divider(),
    h1("🏗️ [현장명] 현장"),
    divider(),
    h2("📋 기본 정보"),
    cols(
        [
            callout("📍 현장 주소\n(주소)", "📍"),
            callout("👤 고객 / 연락처\n(이름) / (번호)", "👤"),
            callout("📅 계약일 ~ 완료예정일\n( ) ~ ( )", "📅"),
        ],
        [
            callout("💰 계약금액 (대표·이사만)\n₩ ( )", "💰"),
            callout("👷 담당자\n( )", "👷"),
            callout("🔵 진행단계\n상담/계약/시공/완공", "🔵"),
        ]
    ),
    divider(),
])

# ── 자료실: 사진 외 전부 노션 직접 업로드 ──
add(T, [
    h2("📁 자료실"),
    callout("도면·3D·고객자료·견적서는 노션에 직접 올리세요. (드래그&드롭 또는 / 입력 → 파일)\n사진만 용량이 커서 별도 관리(아래 사진 섹션 참고).", "💡", "blue_background"),
    toggle("📐 도면 (CAD·PDF) — 노션 직접 업로드", [
        callout("PDF는 노션에 올리면 페이지에서 바로 미리보기 됩니다. / 입력 → '파일' 또는 드래그&드롭.", "📐"),
        para("▶ 평면도: (여기에 PDF 업로드)"),
        para("▶ 천장도: (PDF 업로드)"),
        para("▶ 입면도: (PDF 업로드)"),
        para("▶ 전기설비도: (PDF 업로드)"),
    ]),
    toggle("🎨 3D 이미지·렌더링 — 노션 직접 업로드", [
        callout("이미지는 노션에 올리면 바로 크게 표시됩니다.", "🎨"),
        para("▶ (3D 이미지 업로드)"),
    ]),
    toggle("📄 고객 제공 자료 — 노션 직접 업로드", [
        callout("고객이 보내준 레퍼런스·제품 이미지·요청 문서", "📄"),
        para("▶ (파일·이미지 업로드)"),
        para("▶ 주요 참고사항: (메모)"),
    ]),
    toggle("📸 현장 사진", [
        callout("사진은 용량이 커서 — 플러스 플랜이면 노션에 직접 올려도 됨.\n무료 플랜이면 Google Drive 폴더 링크만 연결.", "📸"),
        para("▶ 착공 전: (사진 또는 Drive 링크)"),
        para("▶ 시공 중: (사진 또는 Drive 링크)"),
        para("▶ 완공: (고화질 — 마케팅용)"),
    ]),
    divider(),
])

# ── 도면·3D (외부 공유용) 하위 페이지 ──
print("  도면·3D 외부공유용 하위 페이지 생성...")
ext = child_page(T, "📐 도면·3D (외부 공유용)", "🔗", [
    callout("⚠️ 이 페이지만 따로 '웹에 게시'해서 거래처에 링크로 전달하세요.\n계약금액·고객정보는 위 본문에 두고, 여기엔 거래처가 봐도 되는 도면·3D만 올립니다.", "🔗", "orange_background"),
    divider(),
    h2("📐 전달용 도면"),
    para("(거래처에 보낼 평면도·상세도 PDF를 여기 업로드)"),
    divider(),
    h2("🎨 전달용 3D 이미지"),
    para("(렌더링·투시도 이미지를 여기 업로드)"),
    divider(),
    toggle("📤 거래처에 전달하는 방법", [
        num("이 페이지 우측 상단 [···] → '웹에 게시' 켜기 (최초 1번)"),
        num("'링크 복사' → 카톡으로 거래처에 전송"),
        num("거래처는 노션 가입 없이 링크 클릭만으로 보고 다운로드 가능"),
        divider(),
        bullet("게시 후엔 파일을 추가만 하면 같은 링크로 계속 공유됨"),
        bullet("전달 끝나면 '웹에 게시'를 꺼서 링크를 닫을 수도 있음"),
    ], "gray"),
])
print(f"    완료! 외부공유 페이지 ID: {ext['id']}")

add(T, [
    page_link(ext["id"], "📐 도면·3D (외부 공유용) — 거래처 전달은 여기서"),
    divider(),
])

# ── 고객 전달사항 ──
add(T, [
    h2("💬 고객 전달사항"),
    callout("고객 요청·주의사항을 정리. 전 직원이 확인합니다.", "💬", "yellow_background"),
    toggle("✅ 필수 요청사항", [todo("(요청 1)"), todo("(요청 2)"), todo("(요청 3)")]),
    toggle("⚠️ 주의사항", [bullet("(주의사항)")]),
    divider(),
])

# ── 구매 제품 리스트 ──
print("  구매 제품 DB...")
add(T, [h2("🛒 구매 제품 리스트"), callout("고객 요청·직접 구매 제품. 납품 상태까지 추적.", "🛒")])
make_db(T, "구매 제품 리스트", "🛒", {
    "제품명":   {"title": {}},
    "카테고리": {"select": {"options": [
        {"name":"조명","color":"yellow"},{"name":"타일·마루","color":"orange"},
        {"name":"욕실·주방","color":"blue"},{"name":"가구·가전","color":"purple"},
        {"name":"도어·창호","color":"green"},{"name":"기타","color":"gray"}]}},
    "수량":     {"number": {}},
    "단가":     {"number": {"format": "won"}},
    "합계":     {"formula": {"expression": "prop(\"수량\") * prop(\"단가\")"}},
    "구매처":   {"rich_text": {}},
    "구매링크": {"url": {}},
    "납품예정": {"date": {}},
    "상태":     {"select": {"options": [
        {"name":"주문전","color":"gray"},{"name":"주문완료","color":"yellow"},
        {"name":"납품완료","color":"green"},{"name":"반품","color":"red"}]}},
    "고객요청": {"checkbox": {}},
})
add(T, [divider()])

# ── 업체 견적서 ──
print("  업체 견적서 DB...")
add(T, [h2("📊 업체 견적서"), callout("업체 견적서 PDF는 여기 노션에 직접 업로드. 공종별 금액 비교.", "📊")])
make_db(T, "업체 견적서", "📊", {
    "업체명":   {"title": {}},
    "공종":     {"select": {"options": [
        {"name":"철거","color":"red"},{"name":"설비","color":"blue"},{"name":"전기","color":"yellow"},
        {"name":"목공","color":"orange"},{"name":"타일","color":"green"},{"name":"도장","color":"pink"},
        {"name":"도배","color":"purple"},{"name":"마루","color":"brown"},{"name":"기타","color":"gray"}]}},
    "견적금액": {"number": {"format": "won"}},
    "견적일":   {"date": {}},
    "견적서":   {"files": {}},
    "상태":     {"select": {"options": [
        {"name":"검토중","color":"yellow"},{"name":"계약완료","color":"green"},{"name":"미채택","color":"gray"}]}},
    "연락처":   {"phone_number": {}},
})
add(T, [divider()])

# ── 공정 체크리스트 ──
print("  공정 체크리스트...")
add(T, [
    h2("✅ 공정 체크리스트"),
    toggle("1️⃣ 철거", [todo("현장 보양"), todo("철거"), todo("폐기물 처리")]),
    toggle("2️⃣ 설비·전기", [todo("배관"), todo("전기 배선"), todo("방수")]),
    toggle("3️⃣ 목공", [todo("칸막이"), todo("천장 틀")]),
    toggle("4️⃣ 타일·바닥", [todo("욕실 타일"), todo("바닥재"), todo("줄눈")]),
    toggle("5️⃣ 도장·도배", [todo("퍼티"), todo("도장"), todo("도배")]),
    toggle("6️⃣ 마감·준공", [todo("조명"), todo("도어·창호"), todo("청소"), todo("완공 사진"), todo("고객 확인"), todo("잔금"), todo("하자보증서")]),
    divider(),
])

# ── 직원 업무 배정 ──
print("  직원 업무 DB...")
add(T, [h2("👷 직원 업무 배정"), callout("이 현장 담당 업무. 메인 허브 '직원 업무 현황'에도 요약 입력.", "👷")])
make_db(T, "현장 업무", "📝", {
    "업무내용": {"title": {}},
    "담당자":   {"rich_text": {}},
    "공종":     {"select": {"options": [
        {"name":"현장감리","color":"blue"},{"name":"설비·전기","color":"yellow"},{"name":"목공","color":"orange"},
        {"name":"타일·마루","color":"green"},{"name":"도장·도배","color":"pink"},{"name":"자재발주","color":"purple"}]}},
    "예정일":   {"date": {}},
    "완료":     {"checkbox": {}},
})
add(T, [divider()])

# ── 미팅 기록 ──
print("  미팅 기록 DB...")
add(T, [h2("📞 미팅·통화 기록")])
make_db(T, "미팅 기록", "📞", {
    "날짜":     {"title": {}},
    "유형":     {"select": {"options": [
        {"name":"방문미팅","color":"blue"},{"name":"전화","color":"green"},{"name":"현장확인","color":"orange"},{"name":"카톡","color":"yellow"}]}},
    "참석자":   {"rich_text": {}},
    "주요내용": {"rich_text": {}},
    "결정사항": {"rich_text": {}},
    "다음일정": {"date": {}},
})

# ══════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 3: 출금방 권한 변경 (이사·대표·현장직 공유)")
print("=" * 60)

# 제목 변경
api("PATCH", f"/pages/{PAYOUT_PAGE}", {
    "properties": {"title": {"title": [{"text": {"content": "💸 출금 요청 (이사·대표·현장 공유)"}}]}}
})
# 첫 콜아웃(빨강 경고) 교체
kids = api("GET", f"/blocks/{PAYOUT_PAGE}/children?page_size=10")
for b in kids.get("results", []):
    if b.get("type") == "callout":
        api("PATCH", f"/blocks/{b['id']}", {"callout": {
            "rich_text": [{"text": {"content":
                "이 방은 이사·대표·현장직이 함께 봅니다. 출금 요청을 여기 올리면 대표가 처리합니다.\n"
                "⚠️ 같은 페이지라 서로의 출금 금액·계좌가 보입니다. 민감한 계약·수익 정보는 [계약·재무] 페이지(대표·이사 전용)에 별도로 두세요."}}],
            "icon": {"type": "emoji", "emoji": "👥"},
            "color": "blue_background"}})
        break
print("  출금방 권한 안내 변경 완료")

# ══════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 4: ⚙️ 설정·권한 가이드 페이지 생성")
print("=" * 60)

guide = make_page(HUB_ID, "⚙️ 설정·권한 가이드", "⚙️")
G = guide["id"]
print(f"  가이드 ID: {G}")

add(G, [
    callout("처음 세팅할 때 이 페이지를 보면서 따라하세요. 한 번만 설정하면 됩니다.", "⚙️", "blue_background"),
    divider(),
    h2("🔑 권한 지도 — 누가 무엇을 보나"),
])

# 권한 지도 표 (토글)
add(G, [
    toggle("🔵 전 직원·현장직 (게스트 — 무료)", [
        page_link(SITE_HUB_ID,  "🏗️ 현장 관리 (담당 현장)"),
        page_link(RECEIPT_PAGE, "📸 현장 경비·영수증"),
        page_link(PAYOUT_PAGE,  "💸 출금 요청 (공유)"),
        para("→ 위 페이지들만 게스트로 초대. 나머지는 안 보임."),
    ], "blue"),
    toggle("🔴 대표·이사 전용 (유료 멤버)", [
        para("• 계약금액 · 계약·재무 · 회계 관리 · 노무 · 견적"),
        para("→ 이 페이지들엔 직원(게스트)을 초대하지 않음 → 자동으로 안 보임"),
    ], "red"),
    divider(),
])

# 게스트 초대 방법
add(G, [
    h2("👥 직원 초대 방법 (게스트 = 무료)"),
    toggle("게스트 초대하는 법", [
        num("초대할 페이지 열기 (예: 현장 관리, 경비·영수증)"),
        num("우측 상단 [공유] 클릭"),
        num("직원 이메일 입력 → 권한 '편집 가능' 선택 → 초대"),
        num("직원은 그 페이지만 보임 (다른 페이지는 안 보임)"),
        divider(),
        callout("플러스 플랜 기준 게스트 100명까지 무료. 멤버(유료)는 대표·이사만.", "💡"),
    ], "gray"),
    divider(),
])

# 영수증 올리기 (이사님용)
add(G, [
    h2("📸 영수증 쉽게 올리기 (이사·현장직)"),
    toggle("이사님 따라하기 — 타이핑 없이 사진만", [
        h3("준비: 폰 홈 화면에 바로가기 만들기 (1번만)"),
        num("폰 노션 앱에서 [📸 현장 경비·영수증] 페이지 열기"),
        num("우측 상단 [···] → '홈 화면에 추가' → 바탕화면에 아이콘 생김"),
        divider(),
        h3("매번: 영수증 올리기 (3동작)"),
        num("영수증에 펜으로 '현장명/용도' 적기"),
        num("폰 바탕화면 [📸영수증] 아이콘 누르기"),
        num("[+ 새로 만들기] → 영수증 칸에 사진 촬영 → 끝"),
        divider(),
        callout("손글씨로 적어두면 노션엔 사진만 올리면 됩니다. 금액만 숫자로 적으면 합계가 자동 계산돼요.", "✏️"),
        callout("부담되면: 그날은 사진만 폰에 찍어두고, 주 1회 몰아서 올려도 됩니다.", "💡"),
    ], "gray"),
    divider(),
])

# 갤러리 화면 설정
add(G, [
    h2("🖼️ 영수증을 '사진 카드'로 보기 (선택)"),
    toggle("갤러리 보기로 바꾸는 법", [
        num("[📸 현장 경비·영수증]의 표 위 [+ 보기 추가] 또는 표 이름 옆 [···]"),
        num("'갤러리' 선택 → 카드 미리보기를 '영수증'으로 설정"),
        num("→ 영수증 사진이 큼직한 카드로 보여 한눈에 확인"),
    ], "gray"),
    divider(),
])

# 거래처 도면 전달
add(G, [
    h2("🔗 거래처에 도면·3D 전달하기"),
    toggle("웹에 게시해서 링크로 보내는 법", [
        num("현장 페이지 안 [📐 도면·3D (외부 공유용)] 하위 페이지 열기"),
        num("거래처에 보낼 도면·3D만 그 페이지에 업로드"),
        num("우측 상단 [···] → '웹에 게시' 켜기"),
        num("'링크 복사' → 카톡으로 거래처 전송"),
        divider(),
        callout("거래처는 노션 가입 없이 링크만으로 보고 다운로드 가능. 계약·고객정보는 본문에 따로 두니 안전.", "🔗"),
    ], "gray"),
    divider(),
])

# 칸반보드
add(G, [
    h2("📋 현장 현황을 칸반보드로 보기 (선택)"),
    toggle("단계별 보드로 바꾸는 법", [
        num("메인 허브 [📍 현장 현황판] 표 옆 [···] → 보기 추가 → '보드'"),
        num("그룹 기준을 '단계'로 → 상담중/시공중/완공 칸으로 나뉨"),
        num("현장 카드를 드래그해서 단계 이동"),
    ], "gray"),
])

# ══════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 5: 메인 허브에 신규 링크 추가")
print("=" * 60)

add(HUB_ID, [
    divider(),
    h2("💰 경비·출금 & 설정"),
    cols(
        [
            page_link(RECEIPT_PAGE, "📸 현장 경비·영수증"),
            page_link(PAYOUT_PAGE,  "💸 출금 요청 (공유)"),
        ],
        [
            page_link(G, "⚙️ 설정·권한 가이드"),
        ]
    ),
])
print("  허브 링크 추가 완료")

print("\n" + "=" * 60)
print("✅ 전체 재구성 완료!")
print("=" * 60)
print(f"\n현장 템플릿 v3:   https://notion.so/{T.replace('-','')}")
print(f"도면 외부공유용:  https://notion.so/{ext['id'].replace('-','')}")
print(f"설정·권한 가이드: https://notion.so/{G.replace('-','')}")
print(f"메인 허브:        https://notion.so/{HUB_ID.replace('-','')}")

