"""
notion_expense.py
─────────────────────────────────────────────
경비·출금 관리 시스템
  1. 📸 현장 경비·영수증 DB  — 현장직이 모바일로 직접 올림 (게스트 공유 가능)
  2. 💸 출금 요청 관리 DB    — 이사님→대표 출금 요청 (대표·이사 전용)
"""

import urllib.request, json

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
        print(f"  ERR: {err.get('message','')[:100]}")
        return err

def add(pid, blocks):
    return api("PATCH", f"/blocks/{pid}/children", {"children": blocks})

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

def h2(t): return {"object":"block","type":"heading_2","heading_2":{"rich_text":[{"text":{"content":t}}]}}
def h3(t): return {"object":"block","type":"heading_3","heading_3":{"rich_text":[{"text":{"content":t}}]}}
def para(t, color="default"): return {"object":"block","type":"paragraph","paragraph":{"rich_text":[{"text":{"content":t},"annotations":{"color":color}}]}}
def callout(t, e, color="gray_background"): return {"object":"block","type":"callout","callout":{"rich_text":[{"text":{"content":t}}],"icon":{"type":"emoji","emoji":e},"color":color}}
def bullet(t): return {"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{"text":{"content":t}}]}}
def num(t): return {"object":"block","type":"numbered_list_item","numbered_list_item":{"rich_text":[{"text":{"content":t}}]}}
def divider(): return {"object":"block","type":"divider","divider":{}}
def toggle(title, children, color="blue"): return {"object":"block","type":"toggle","toggle":{
    "rich_text":[{"text":{"content":title},"annotations":{"bold":True,"color":color}}],"children":children}}

# ══════════════════════════════════════════════════════════════
# 1. 현장 경비·영수증 (현장직 제출용 — 게스트 공유 가능)
# ══════════════════════════════════════════════════════════════
print("=" * 60)
print("1. 현장 경비·영수증 페이지 생성")
print("=" * 60)

receipt_page = make_page(HUB_ID, "📸 현장 경비·영수증", "📸")
RP = receipt_page["id"]
print(f"  페이지 ID: {RP}")

add(RP, [
    callout(
        "현장에서 쓴 비용은 영수증을 받은 그 자리에서 사진 찍어 올리세요!\n"
        "더 이상 서랍에 영수증 모을 필요 없어요. 분실 걱정 끝.",
        "📸", "green_background"
    ),
    divider(),
    h2("✏️ 입력 방법 (현장직)"),
    callout("노션 모바일 앱에서 → 아래 표 맨 아래 [+ 새로 만들기] → 영수증 사진 첨부 + 금액·현장 입력", "📱"),
    divider(),
])

print("  경비 영수증 DB 생성...")
receipt_db = make_db(RP, "현장 경비·영수증", "🧾", {
    "항목":       {"title": {}},
    "사용일":     {"date": {}},
    "사용자":     {"rich_text": {}},
    "현장":       {"rich_text": {}},
    "금액":       {"number": {"format": "won"}},
    "사용처":     {"rich_text": {}},
    "결제수단":   {"select": {"options": [
        {"name": "개인카드",  "color": "blue"},
        {"name": "개인현금",  "color": "green"},
        {"name": "법인카드",  "color": "purple"},
    ]}},
    "영수증":     {"files": {}},
    "정산상태":   {"select": {"options": [
        {"name": "🔴 미정산",  "color": "red"},
        {"name": "🟡 확인중",  "color": "yellow"},
        {"name": "🟢 정산완료", "color": "green"},
    ]}},
    "정산일":     {"date": {}},
    "비고":       {"rich_text": {}},
})
RECEIPT_DB_ID = receipt_db["id"]
print(f"    완료! DB ID: {RECEIPT_DB_ID}")

# 샘플 영수증 입력
samples = [
    ("철물점 - 실리콘/피스 외", "마포 김소연", 38000, "현대철물", "개인현금", "🔴 미정산"),
    ("주차비", "강남 박이사", 12000, "공영주차장", "개인카드", "🔴 미정산"),
    ("점심 식대 (현장팀 3명)", "마포 김소연", 27000, "백반집", "법인카드", "🟢 정산완료"),
]
for item, site, amt, shop, pay, status in samples:
    api("POST", "/pages", {
        "parent": {"database_id": RECEIPT_DB_ID},
        "properties": {
            "항목":     {"title": [{"text": {"content": item}}]},
            "현장":     {"rich_text": [{"text": {"content": site}}]},
            "금액":     {"number": amt},
            "사용처":   {"rich_text": [{"text": {"content": shop}}]},
            "결제수단": {"select": {"name": pay}},
            "정산상태": {"select": {"name": status}},
        }
    })
print(f"    샘플 {len(samples)}건 입력 완료!")

add(RP, [
    divider(),
    toggle("📋 사용 방법 (자세히 보기)", [
        h3("👷 현장직"),
        num("영수증 받으면 → 노션 앱 → [📸 현장 경비·영수증] 열기"),
        num("표 아래 [+ 새로 만들기] → 영수증 칸에 사진 촬영/첨부"),
        num("항목·금액·현장·결제수단 입력 → 끝"),
        divider(),
        h3("👔 대표 (정산)"),
        num("월말 또는 수시로 → 정산상태 '🔴 미정산'만 필터"),
        num("확인 후 정산 → '🟢 정산완료'로 변경 + 정산일 입력"),
        bullet("현장별·사용자별로 자동 합계 → 어느 현장에 경비 많이 쓰는지 파악"),
        bullet("개인카드/현금은 직원에게 환급, 법인카드는 회계 처리"),
    ], "gray"),
])

# ══════════════════════════════════════════════════════════════
# 2. 출금 요청 관리 (대표·이사 전용)
# ══════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("2. 출금 요청 관리 페이지 생성 (대표·이사 전용)")
print("=" * 60)

payout_page = make_page(HUB_ID, "💸 출금 요청 관리 (대표·이사 전용)", "💸")
PP = payout_page["id"]
print(f"  페이지 ID: {PP}")

add(PP, [
    callout(
        "⚠️ 대표·이사 전용입니다. 직원(게스트)은 이 페이지에 초대하지 마세요.",
        "🔒", "red_background"
    ),
    divider(),
    callout(
        "이사님이 출금이 필요한 건을 표에 올리면(🔴요청), 대표님이 확인 후 출금하고 🟢완료로 변경합니다.\n"
        "잔디 채팅으로 주고받던 출금내역을 여기서 누락 없이 관리하세요.",
        "💸", "blue_background"
    ),
    divider(),
    h2("💸 출금 요청 목록"),
])

print("  출금 요청 DB 생성...")
payout_db = make_db(PP, "출금 요청 관리", "💸", {
    "항목":       {"title": {}},
    "유형":       {"select": {"options": [
        {"name": "일용직 임금",  "color": "orange"},
        {"name": "자재비",      "color": "blue"},
        {"name": "외주비",      "color": "purple"},
        {"name": "경비 환급",   "color": "green"},
        {"name": "기타",        "color": "gray"},
    ]}},
    "금액":       {"number": {"format": "won"}},
    "수령인":     {"rich_text": {}},
    "계좌번호":   {"rich_text": {}},
    "현장":       {"rich_text": {}},
    "요청일":     {"date": {}},
    "요청자":     {"rich_text": {}},
    "증빙":       {"files": {}},
    "상태":       {"select": {"options": [
        {"name": "🔴 요청",     "color": "red"},
        {"name": "🟡 확인중",   "color": "yellow"},
        {"name": "🟢 출금완료", "color": "green"},
    ]}},
    "출금일":     {"date": {}},
    "비고":       {"rich_text": {}},
})
PAYOUT_DB_ID = payout_db["id"]
print(f"    완료! DB ID: {PAYOUT_DB_ID}")

# 샘플 출금 요청
payout_samples = [
    ("일용직 임금 (3명)", "일용직 임금", 450000, "김씨 외 2명", "마포 김소연", "🔴 요청", "홍길동 이사"),
    ("타일 자재비", "자재비", 1200000, "강남타일", "마포 김소연", "🟢 출금완료", "홍길동 이사"),
    ("전기 외주비", "외주비", 3200000, "청수전기", "강남 박이사", "🔴 요청", "홍길동 이사"),
]
for item, typ, amt, payee, site, status, req in payout_samples:
    api("POST", "/pages", {
        "parent": {"database_id": PAYOUT_DB_ID},
        "properties": {
            "항목":   {"title": [{"text": {"content": item}}]},
            "유형":   {"select": {"name": typ}},
            "금액":   {"number": amt},
            "수령인": {"rich_text": [{"text": {"content": payee}}]},
            "현장":   {"rich_text": [{"text": {"content": site}}]},
            "상태":   {"select": {"name": status}},
            "요청자": {"rich_text": [{"text": {"content": req}}]},
        }
    })
print(f"    샘플 {len(payout_samples)}건 입력 완료!")

add(PP, [
    divider(),
    toggle("📋 사용 방법 (자세히 보기)", [
        h3("👔 이사님 (요청)"),
        num("출금 필요 건 발생 → 표에 [+ 새로 만들기]"),
        num("항목·금액·수령인·계좌·현장 입력 → 상태 '🔴 요청'"),
        num("증빙(견적서·영수증) 있으면 파일 첨부"),
        divider(),
        h3("👑 대표님 (출금 처리)"),
        num("상태 '🔴 요청'만 필터 → 확인"),
        num("은행에서 직접 출금 진행"),
        num("출금 후 → 상태 '🟢 출금완료' + 출금일 입력"),
        divider(),
        h3("💡 활용 팁"),
        bullet("'🔴 요청' 필터 = 아직 줄 돈 → 한눈에 파악, 누락 0건"),
        bullet("현장별 합계 → 회계(현장별 수익 현황)에 그대로 반영"),
        bullet("월별 그룹 → 경리나라 입력 시 그대로 복사"),
    ], "gray"),
    divider(),
    callout("실제 송금은 은행에서 대표님이 직접 하세요. 노션은 기록·정리·누락방지용입니다.", "⚠️", "yellow_background"),
])

print("\n" + "=" * 60)
print("✅ 완료!")
print("=" * 60)
print(f"\n현장 경비·영수증:  https://notion.so/{RP.replace('-','')}")
print(f"출금 요청 관리:    https://notion.so/{PP.replace('-','')}")
print(f"\n영수증 DB:  {RECEIPT_DB_ID}")
print(f"출금 DB:    {PAYOUT_DB_ID}")

