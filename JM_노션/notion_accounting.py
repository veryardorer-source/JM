import urllib.request, json

from notion_auth import TOKEN
HUB_ID = "376089e9-0a52-8015-ba56-f0837a19d29a"
ACCOUNTING_PAGE_ID = None  # 새로 생성

HEADERS = {"Authorization": f"Bearer {TOKEN}", "Notion-Version": "2022-06-28", "Content-Type": "application/json"}

def api(method, endpoint, data=None):
    url = f"https://api.notion.com/v1{endpoint}"
    body = json.dumps(data, ensure_ascii=False).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as r: return json.loads(r.read())
    except urllib.error.HTTPError as e:
        err = json.loads(e.read()); print(f"  ERR: {err.get('message','')[:80]}"); return err

def make_db(pid, title, emoji, props):
    return api("POST", "/databases", {
        "parent": {"type": "page_id", "page_id": pid},
        "icon": {"type": "emoji", "emoji": emoji},
        "is_inline": True,
        "title": [{"text": {"content": title}}],
        "properties": props
    })

def add(pid, blocks): return api("PATCH", f"/blocks/{pid}/children", {"children": blocks})
def clear(pid):
    bs = api("GET", f"/blocks/{pid}/children?page_size=100")
    for b in bs.get("results",[]): api("DELETE", f"/blocks/{b['id']}")

def h2(t): return {"object":"block","type":"heading_2","heading_2":{"rich_text":[{"text":{"content":t}}]}}
def h3(t): return {"object":"block","type":"heading_3","heading_3":{"rich_text":[{"text":{"content":t}}]}}
def para(t): return {"object":"block","type":"paragraph","paragraph":{"rich_text":[{"text":{"content":t}}]}}
def callout(t, e): return {"object":"block","type":"callout","callout":{"rich_text":[{"text":{"content":t}}],"icon":{"type":"emoji","emoji":e}}}
def bullet(t): return {"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{"text":{"content":t}}]}}
def num(t): return {"object":"block","type":"numbered_list_item","numbered_list_item":{"rich_text":[{"text":{"content":t}}]}}
def divider(): return {"object":"block","type":"divider","divider":{}}
def toggle(title, children): return {"object":"block","type":"toggle","toggle":{
    "rich_text":[{"text":{"content":title},"annotations":{"bold":True,"color":"blue"}}],"children":children}}

# ══════════════════════════════════════════════════════
# 기존 회계 페이지 내용 정리 후 재구성
# ══════════════════════════════════════════════════════
print("회계 관리 페이지 신규 생성 중...")
acct_page = api("POST", "/pages", {
    "parent": {"type": "page_id", "page_id": HUB_ID},
    "icon": {"type": "emoji", "emoji": "💰"},
    "properties": {"title": {"title": [{"text": {"content": "회계 관리 (대표·이사 전용)"}}]}}
})
ACCOUNTING_PAGE_ID = acct_page["id"]
print(f"  페이지 ID: {ACCOUNTING_PAGE_ID}")

# ── 상단 대시보드 안내 ──
add(ACCOUNTING_PAGE_ID, [
    callout("경리나라에서 상세 장부를 관리하고, 여기선 전체 흐름을 한눈에 확인합니다.", "💰"),
    divider(),
    h2("📊 이달 재무 요약"),
    callout("매월 초 아래 항목을 직접 업데이트하세요. 경리나라 숫자를 옮겨 적으면 됩니다.", "✏️"),
])

# ── DB 1: 월별 재무 요약 ──
print("  [1/3] 월별 재무 요약 DB 생성...")
monthly_db = make_db(ACCOUNTING_PAGE_ID, "월별 재무 요약", "📅", {
    "월":               {"title": {}},
    "매출 (입금 합계)": {"number": {"format": "won"}},
    "고정지출 합계":    {"number": {"format": "won"}},
    "인건비 합계":      {"number": {"format": "won"}},
    "현장 재료비":      {"number": {"format": "won"}},
    "기타 지출":        {"number": {"format": "won"}},
    "순이익":           {"formula": {
        "expression": "prop(\"매출 (입금 합계)\") - prop(\"고정지출 합계\") - prop(\"인건비 합계\") - prop(\"현장 재료비\") - prop(\"기타 지출\")"
    }},
    "비고":             {"rich_text": {}},
})
print(f"    완료!")

add(ACCOUNTING_PAGE_ID, [divider()])

# ── DB 2: 월별 고정지출 관리 ──
print("  [2/3] 월별 고정지출 DB 생성...")
add(ACCOUNTING_PAGE_ID, [
    h2("🔒 월별 고정지출 관리"),
    callout("매달 반드시 나가는 고정비용입니다. 항목 추가·변경 시 여기서 관리하세요.", "🔒"),
])
fixed_db = make_db(ACCOUNTING_PAGE_ID, "고정지출 항목", "🔒", {
    "항목명":     {"title": {}},
    "카테고리":   {"select": {"options": [
        {"name": "임대료",      "color": "red"},
        {"name": "인건비",      "color": "orange"},
        {"name": "4대보험",     "color": "yellow"},
        {"name": "차량유지비",  "color": "blue"},
        {"name": "통신비",      "color": "green"},
        {"name": "보험료",      "color": "purple"},
        {"name": "소프트웨어",  "color": "pink"},
        {"name": "기타",        "color": "gray"},
    ]}},
    "월 금액":    {"number": {"format": "won"}},
    "연 금액":    {"formula": {"expression": "prop(\"월 금액\") * 12"}},
    "결제일":     {"number": {}},
    "결제수단":   {"select": {"options": [
        {"name": "법인카드", "color": "blue"},
        {"name": "계좌이체", "color": "green"},
        {"name": "자동이체", "color": "yellow"},
    ]}},
    "비고":       {"rich_text": {}},
})
print(f"    완료!")

# 예시 고정지출 항목 입력
fixed_examples = [
    ("사무실 임대료", "임대료"),
    ("직원 급여", "인건비"),
    ("4대보험 (회사부담)", "4대보험"),
    ("차량 유지비", "차량유지비"),
    ("휴대폰 통신비", "통신비"),
    ("사무실 보험료", "보험료"),
    ("경리나라 구독료", "소프트웨어"),
    ("노션 구독료", "소프트웨어"),
]
for name, cat in fixed_examples:
    api("POST", "/pages", {
        "parent": {"database_id": fixed_db["id"]},
        "properties": {
            "항목명":   {"title": [{"text": {"content": name}}]},
            "카테고리": {"select": {"name": cat}},
        }
    })
print(f"    예시 항목 {len(fixed_examples)}개 입력 완료!")

add(ACCOUNTING_PAGE_ID, [divider()])

# ── DB 3: 현장별 수익 현황 ──
print("  [3/3] 현장별 수익 현황 DB 생성...")
add(ACCOUNTING_PAGE_ID, [
    h2("🏗️ 현장별 수익 현황"),
    callout("현장 완료 시 계약금액과 총 지출을 입력하면 잔액이 자동 계산됩니다.", "🏗️"),
])
project_income_db = make_db(ACCOUNTING_PAGE_ID, "현장별 수익 현황", "💹", {
    "현장명":       {"title": {}},
    "계약금액":     {"number": {"format": "won"}},
    "재료비":       {"number": {"format": "won"}},
    "외주비":       {"number": {"format": "won"}},
    "인건비(현장)": {"number": {"format": "won"}},
    "기타비용":     {"number": {"format": "won"}},
    "총 지출":      {"formula": {
        "expression": "prop(\"재료비\") + prop(\"외주비\") + prop(\"인건비(현장)\") + prop(\"기타비용\")"
    }},
    "수익":         {"formula": {
        "expression": "prop(\"계약금액\") - prop(\"재료비\") - prop(\"외주비\") - prop(\"인건비(현장)\") - prop(\"기타비용\")"
    }},
    "수익률(%)":    {"formula": {
        "expression": "if(prop(\"계약금액\") > 0, round(prop(\"수익\") / prop(\"계약금액\") * 100), 0)"
    }},
    "입금상태":     {"select": {"options": [
        {"name": "계약금 완료",  "color": "yellow"},
        {"name": "중도금 완료",  "color": "blue"},
        {"name": "잔금 완료",    "color": "green"},
        {"name": "미수금",       "color": "red"},
    ]}},
    "완공월":       {"date": {}},
    "메모":         {"rich_text": {}},
})
print(f"    완료!")

add(ACCOUNTING_PAGE_ID, [divider()])

# ── DB 4: 월별 인건비 현황 ──
print("  [4/4] 월별 인건비 현황 DB 생성...")
add(ACCOUNTING_PAGE_ID, [
    h2("👤 월별 인건비 현황"),
    callout("경리나라·알찬급여의 급여 확정 후 여기에 월별로 정리하세요.", "👤"),
])
labor_cost_db = make_db(ACCOUNTING_PAGE_ID, "월별 인건비", "👤", {
    "월":           {"title": {}},
    "직원 수":      {"number": {}},
    "기본급 합계":  {"number": {"format": "won"}},
    "4대보험(직원부담)": {"number": {"format": "won"}},
    "4대보험(회사부담)": {"number": {"format": "won"}},
    "실지급 합계":  {"number": {"format": "won"}},
    "일용직 비용":  {"number": {"format": "won"}},
    "인건비 총계":  {"formula": {
        "expression": "prop(\"실지급 합계\") + prop(\"4대보험(회사부담)\") + prop(\"일용직 비용\")"
    }},
    "비고":         {"rich_text": {}},
})
print(f"    완료!")

# ── 사용 방법 토글 ──
add(ACCOUNTING_PAGE_ID, [
    divider(),
    toggle("📋 사용 방법 (클릭해서 펼치기)", [
        h3("✅ 매월 업무 흐름"),
        num("경리나라에서 월 마감 후 → 월별 재무 요약 업데이트"),
        num("알찬급여에서 급여 확정 후 → 월별 인건비 입력"),
        num("현장 완료 시 → 현장별 수익 현황에 계약금액·지출 입력"),
        num("고정지출 변경 시 → 고정지출 항목 업데이트"),
        divider(),
        h3("💡 활용 팁"),
        bullet("월별 재무 요약 → 순이익이 자동 계산됨 (매출 - 고정지출 - 인건비 - 재료비 - 기타)"),
        bullet("현장별 수익률(%) → 어떤 공종이 수익성 높은지 파악"),
        bullet("고정지출 연 금액 → 연간 고정비 한눈에 파악"),
        bullet("경리나라의 상세 내역은 경리나라에서, 여기선 요약만 관리"),
    ]),
])

print("\n완료!")
print(f"회계 관리 URL: https://notion.so/{ACCOUNTING_PAGE_ID.replace('-','')}")

