import urllib.request, json

from notion_auth import TOKEN
HUB_ID = "376089e9-0a52-8015-ba56-f0837a19d29a"

HEADERS = {"Authorization": f"Bearer {TOKEN}", "Notion-Version": "2022-06-28", "Content-Type": "application/json"}

def api(method, ep, data=None):
    url = f"https://api.notion.com/v1{ep}"
    body = json.dumps(data, ensure_ascii=False).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as r: return json.loads(r.read())
    except urllib.error.HTTPError as e:
        err = json.loads(e.read()); print(f"ERR: {err.get('message','')[:80]}"); return err

def add(pid, blocks): return api("PATCH", f"/blocks/{pid}/children", {"children": blocks})

def make_page(pid, title, emoji, children=None):
    b = {"parent": {"type": "page_id", "page_id": pid},
         "icon": {"type": "emoji", "emoji": emoji},
         "properties": {"title": {"title": [{"text": {"content": title}}]}}}
    if children: b["children"] = children
    return api("POST", "/pages", b)

def make_db(pid, title, emoji, props):
    return api("POST", "/databases", {
        "parent": {"type": "page_id", "page_id": pid},
        "icon": {"type": "emoji", "emoji": emoji},
        "is_inline": True,
        "title": [{"text": {"content": title}}],
        "properties": props
    })

# 블록 헬퍼
def h1(t): return {"object":"block","type":"heading_1","heading_1":{"rich_text":[{"text":{"content":t}}]}}
def h2(t): return {"object":"block","type":"heading_2","heading_2":{"rich_text":[{"text":{"content":t}}]}}
def h3(t): return {"object":"block","type":"heading_3","heading_3":{"rich_text":[{"text":{"content":t}}]}}
def para(t, color="default"): return {"object":"block","type":"paragraph","paragraph":{"rich_text":[{"text":{"content":t},"annotations":{"color":color}}]}}
def callout(t, e, color="gray_background"): return {"object":"block","type":"callout","callout":{"rich_text":[{"text":{"content":t}}],"icon":{"type":"emoji","emoji":e},"color":color}}
def bullet(t): return {"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{"text":{"content":t}}]}}
def todo(t, checked=False): return {"object":"block","type":"to_do","to_do":{"rich_text":[{"text":{"content":t}}],"checked":checked}}
def divider(): return {"object":"block","type":"divider","divider":{}}
def toggle(title, children, color="blue"): return {"object":"block","type":"toggle","toggle":{
    "rich_text":[{"text":{"content":title},"annotations":{"bold":True,"color":color}}],"children":children}}
def cols(c1, c2): return {"object":"block","type":"column_list","column_list":{"children":[
    {"object":"block","type":"column","column":{"children":c1}},
    {"object":"block","type":"column","column":{"children":c2}}]}}


# ══════════════════════════════════════════════════════════════
# 1. 현장 관리 허브 페이지 생성
# ══════════════════════════════════════════════════════════════
print("현장 관리 페이지 생성 중...")
site_hub = make_page(HUB_ID, "현장 관리", "🏗️", [
    callout("각 현장을 클릭해서 도면·사진·미팅내용을 관리하세요. 새 현장은 '📋 현장 템플릿'을 복제해서 사용하세요.", "🏗️"),
    divider(),
])
SITE_HUB_ID = site_hub["id"]
print(f"  완료! ID: {SITE_HUB_ID}")

# ══════════════════════════════════════════════════════════════
# 2. 현장 목록 DB (현장 허브에 인라인)
# ══════════════════════════════════════════════════════════════
print("현장 목록 DB 생성 중...")
site_list_db = make_db(SITE_HUB_ID, "현장 목록", "📋", {
    "현장명":     {"title": {}},
    "단계":       {"select": {"options": [
        {"name": "🔵 상담중",    "color": "blue"},
        {"name": "🟡 견적발송",  "color": "yellow"},
        {"name": "🟠 계약완료",  "color": "orange"},
        {"name": "🔨 시공중",    "color": "red"},
        {"name": "✅ 완공",      "color": "green"},
        {"name": "⏸️ 보류",      "color": "gray"},
    ]}},
    "담당자":     {"people": {}},
    "고객명":     {"rich_text": {}},
    "고객연락처": {"phone_number": {}},
    "현장주소":   {"rich_text": {}},
    "시작일":     {"date": {}},
    "완료예정일": {"date": {}},
    "공유링크":   {"url": {}},
})
print(f"  완료!")

add(SITE_HUB_ID, [divider()])

# ══════════════════════════════════════════════════════════════
# 3. 현장 템플릿 페이지 (복제해서 새 현장에 사용)
# ══════════════════════════════════════════════════════════════
print("현장 템플릿 페이지 생성 중...")
template = make_page(SITE_HUB_ID, "📋 현장 템플릿 (새 현장 시 복제)", "📋")
T = template["id"]

# ── 상단: 현장 기본 정보 ──
add(T, [
    callout("새 현장 생길 때마다 이 페이지를 복제(Duplicate)해서 현장명으로 이름 바꾸세요.", "💡", "yellow_background"),
    divider(),
    h1("🏗️ [현장명을 여기에 입력]"),
    divider(),
])

# 기본 정보 (2컬럼)
add(T, [
    h2("📌 기본 정보"),
    cols(
        [
            callout("고객명: \n연락처: \n현장주소: \n계약일: \n완료예정일: ", "👤"),
        ],
        [
            callout("담당 직원: \n계약금액: \n현재 단계: \n비고: ", "📊"),
        ]
    ),
    divider(),
])

# ── 도면 섹션 ──
add(T, [
    h2("📐 도면"),
    callout("PDF 도면, 이미지 파일을 여기에 첨부하세요. 카톡 공유 시 이 페이지 링크를 보내면 됩니다.", "📎"),
    toggle("▶ 평면도", [
        para("파일을 드래그하거나 /파일 입력해서 첨부하세요."),
    ]),
    toggle("▶ 천장도", [
        para("파일을 드래그하거나 /파일 입력해서 첨부하세요."),
    ]),
    toggle("▶ 입면도 · 상세도", [
        para("파일을 드래그하거나 /파일 입력해서 첨부하세요."),
    ]),
    toggle("▶ 전기 · 설비 도면", [
        para("파일을 드래그하거나 /파일 입력해서 첨부하세요."),
    ]),
    divider(),
])

# ── 현장 사진 섹션 ──
add(T, [
    h2("📸 현장 사진"),
    toggle("▶ 착공 전 (Before)", [
        para("착공 전 현장 사진을 첨부하세요."),
    ]),
    toggle("▶ 시공 중", [
        para("시공 과정 사진을 첨부하세요."),
    ]),
    toggle("▶ 완공 (After)", [
        para("완공 후 사진을 첨부하세요. 마케팅 활용 예정 사진 포함."),
    ]),
    divider(),
])

# ── 고객 미팅 기록 ──
print("  미팅 기록 DB 생성 중...")
add(T, [h2("📝 고객 미팅 기록")])
meeting_db = make_db(T, "미팅 기록", "📝", {
    "미팅 제목":  {"title": {}},
    "날짜":       {"date": {}},
    "참석자":     {"rich_text": {}},
    "미팅 유형":  {"select": {"options": [
        {"name": "현장 방문",   "color": "blue"},
        {"name": "화상 미팅",   "color": "green"},
        {"name": "전화 상담",   "color": "yellow"},
        {"name": "사무실 방문", "color": "purple"},
    ]}},
    "주요 내용":  {"rich_text": {}},
    "결정 사항":  {"rich_text": {}},
    "다음 일정":  {"date": {}},
})
add(T, [divider()])

# ── 공정 체크리스트 ──
add(T, [
    h2("✅ 공정 체크리스트"),
    callout("공정 완료 시 체크하세요. 직원들이 현장에서 모바일로 확인·체크 가능합니다.", "✅"),
    toggle("▶ 철거", [
        todo("철거 범위 확인"),
        todo("철거 완료"),
        todo("폐기물 반출"),
    ]),
    toggle("▶ 설비 · 전기", [
        todo("설비 배관 작업"),
        todo("전기 배선 작업"),
        todo("분전반 작업"),
        todo("검측 완료"),
    ]),
    toggle("▶ 목공", [
        todo("경량 칸막이"),
        todo("천장 틀 작업"),
        todo("목공 마감"),
    ]),
    toggle("▶ 타일 · 바닥", [
        todo("타일 작업"),
        todo("바닥재 시공"),
    ]),
    toggle("▶ 도장 · 도배", [
        todo("도장 작업"),
        todo("도배 작업"),
    ]),
    toggle("▶ 마감 · 준공", [
        todo("조명 설치"),
        todo("위생도기 설치"),
        todo("가구 설치"),
        todo("청소"),
        todo("하자 점검"),
        todo("고객 인수인계"),
        todo("잔금 수령"),
    ]),
    divider(),
])

# ── 전달사항 ──
add(T, [
    h2("💬 전달사항"),
    toggle("▶ 협력업체 전달사항", [
        para("협력업체에게 전달할 내용을 여기에 작성하세요."),
    ]),
    toggle("▶ 직원 전달사항", [
        para("담당 직원에게 전달할 내용을 여기에 작성하세요."),
    ]),
    toggle("▶ 고객 요청사항", [
        para("고객이 요청한 변경사항, 특이사항을 기록하세요."),
    ]),
    divider(),
])

# ── 공유 링크 안내 ──
add(T, [
    h2("🔗 외부 공유 방법"),
    callout("이 페이지를 고객·협력업체와 공유하는 방법", "🔗", "blue_background"),
    bullet("오른쪽 상단 '공유' 클릭 → '웹에 게시' 켜기"),
    bullet("생성된 링크 복사 → 카톡으로 전송"),
    bullet("상대방은 노션 계정 없이 브라우저에서 바로 열람 가능"),
    bullet("수정은 불가, 열람만 가능 (보안 유지)"),
    divider(),
])

print(f"  템플릿 완료! ID: {T}")

# ══════════════════════════════════════════════════════════════
# 4. 샘플 현장 페이지 1개 생성 (사용 예시)
# ══════════════════════════════════════════════════════════════
print("샘플 현장 페이지 생성 중...")
sample = make_page(SITE_HUB_ID, "예시) 강남구 OO오피스 인테리어", "🔨")
S = sample["id"]

add(S, [
    callout("← 이런 식으로 현장별 페이지를 만들어서 관리하세요. 이 페이지는 예시입니다.", "💡", "yellow_background"),
    divider(),
    h1("🔨 강남구 OO오피스 인테리어"),
    divider(),
    h2("📌 기본 정보"),
    cols(
        [callout("고객명: 홍길동 대표\n연락처: 010-1234-5678\n현장주소: 서울 강남구 테헤란로 OO\n계약일: 2026-06-01\n완료예정일: 2026-07-31", "👤")],
        [callout("담당 직원: 이소연\n계약금액: 85,000,000원\n현재 단계: 🔨 시공중\n비고: 오피스 전체 리모델링", "📊")]
    ),
    divider(),
    h2("📐 도면"),
    callout("PDF 도면·이미지를 아래 토글 안에 첨부하세요.", "📎"),
    toggle("▶ 평면도", [para("평면도_v3.pdf  ← 파일 첨부 위치")]),
    toggle("▶ 천장도", [para("천장도_최종.pdf  ← 파일 첨부 위치")]),
    divider(),
    h2("📸 현장 사진"),
    toggle("▶ 착공 전 (Before)", [para("착공 전 사진 첨부")]),
    toggle("▶ 시공 중",          [para("시공 과정 사진 첨부")]),
    toggle("▶ 완공 (After)",     [para("완공 사진 첨부")]),
    divider(),
    h2("📝 고객 미팅 기록"),
])
make_db(S, "미팅 기록", "📝", {
    "미팅 제목":  {"title": {}},
    "날짜":       {"date": {}},
    "참석자":     {"rich_text": {}},
    "미팅 유형":  {"select": {"options": [
        {"name": "현장 방문",   "color": "blue"},
        {"name": "화상 미팅",   "color": "green"},
        {"name": "전화 상담",   "color": "yellow"},
        {"name": "사무실 방문", "color": "purple"},
    ]}},
    "주요 내용":  {"rich_text": {}},
    "결정 사항":  {"rich_text": {}},
    "다음 일정":  {"date": {}},
})

add(S, [
    divider(),
    h2("✅ 공정 체크리스트"),
    toggle("▶ 철거", [
        todo("철거 범위 확인", True),
        todo("철거 완료", True),
        todo("폐기물 반출", True),
    ]),
    toggle("▶ 설비 · 전기", [
        todo("설비 배관 작업", True),
        todo("전기 배선 작업", True),
        todo("분전반 작업"),
        todo("검측 완료"),
    ]),
    toggle("▶ 목공", [
        todo("경량 칸막이"),
        todo("천장 틀 작업"),
        todo("목공 마감"),
    ]),
    toggle("▶ 타일 · 바닥", [todo("타일 작업"), todo("바닥재 시공")]),
    toggle("▶ 도장 · 도배", [todo("도장 작업"), todo("도배 작업")]),
    toggle("▶ 마감 · 준공",  [
        todo("조명 설치"), todo("위생도기 설치"),
        todo("가구 설치"), todo("청소"),
        todo("하자 점검"), todo("고객 인수인계"), todo("잔금 수령"),
    ]),
    divider(),
    h2("💬 전달사항"),
    toggle("▶ 협력업체 전달사항", [para("6/15 목공팀: 천장 틀 작업 시 600×600 그리드 유지")]),
    toggle("▶ 고객 요청사항",    [para("6/10 요청: 대표실 도어 교체 추가, 단가 협의 중")]),
    divider(),
    h2("🔗 외부 공유 방법"),
    callout("공유 → 웹에 게시 → 링크 복사 → 카톡 전송", "🔗", "blue_background"),
    bullet("상대방은 노션 계정 없이 브라우저에서 바로 열람 가능"),
    bullet("수정 불가, 열람만 가능"),
])

print(f"  샘플 완료! ID: {S}")

# ══════════════════════════════════════════════════════════════
# 5. 현장 관리 허브 링크 업데이트
# ══════════════════════════════════════════════════════════════
print("현장 관리 허브 링크 업데이트...")
def link(pid, label): return {"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{
    "type":"mention","mention":{"type":"page","page":{"id":pid}},
    "plain_text":label,"href":f"https://notion.so/{pid.replace('-','')}"}]}}

add(SITE_HUB_ID, [
    h2("📁 현장 목록"),
    link(T, "📋 현장 템플릿 (새 현장 시 복제)"),
    link(S, "🔨 예시) 강남구 OO오피스 인테리어"),
    para("← 새 현장은 템플릿을 복제(우클릭 → Duplicate)해서 사용하세요."),
])
print("  완료!")

print(f"""
{'='*60}
  현장 관리 시스템 완성!
{'='*60}
  현장 관리 허브:  https://notion.so/{SITE_HUB_ID.replace('-','')}
  현장 템플릿:     https://notion.so/{T.replace('-','')}
  샘플 현장:       https://notion.so/{S.replace('-','')}

  사용법:
  1. 새 현장 → 템플릿 우클릭 → Duplicate → 현장명으로 변경
  2. 도면·사진 → 해당 토글 안에 파일 첨부
  3. 외부 공유 → 오른쪽 상단 '공유' → '웹에 게시' → 링크 카톡 전송
""")

