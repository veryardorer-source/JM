import urllib.request, json

from notion_auth import TOKEN
HUB_ID = "376089e9-0a52-8015-ba56-f0837a19d29a"

# notion_final.py 에서 생성된 섹션 IDs
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

HEADERS = {"Authorization": f"Bearer {TOKEN}", "Notion-Version": "2022-06-28", "Content-Type": "application/json"}

def api(method, endpoint, data=None):
    url = f"https://api.notion.com/v1{endpoint}"
    body = json.dumps(data, ensure_ascii=False).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as r: return json.loads(r.read())
    except urllib.error.HTTPError as e:
        err = json.loads(e.read()); print(f"  ERR: {err.get('message','')[:80]}"); return err

def add(pid, blocks): return api("PATCH", f"/blocks/{pid}/children", {"children": blocks})
def clear(pid):
    bs = api("GET", f"/blocks/{pid}/children?page_size=100")
    for b in bs.get("results",[]): api("DELETE", f"/blocks/{b['id']}")

def h2(t): return {"object":"block","type":"heading_2","heading_2":{"rich_text":[{"text":{"content":t}}]}}
def h3(t): return {"object":"block","type":"heading_3","heading_3":{"rich_text":[{"text":{"content":t}}]}}
def para(t, color="default"): return {"object":"block","type":"paragraph","paragraph":{"rich_text":[{"text":{"content":t},"annotations":{"color":color}}]}}
def callout(t, e): return {"object":"block","type":"callout","callout":{"rich_text":[{"text":{"content":t}}],"icon":{"type":"emoji","emoji":e}}}
def bullet(t): return {"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{"text":{"content":t}}]}}
def divider(): return {"object":"block","type":"divider","divider":{}}
def link(pid, label):
    return {"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{
        "type":"mention","mention":{"type":"page","page":{"id":pid}},
        "plain_text":label,"href":f"https://notion.so/{pid.replace('-','')}"}]}}
def cols(c1, c2):
    return {"object":"block","type":"column_list","column_list":{"children":[
        {"object":"block","type":"column","column":{"children":c1}},
        {"object":"block","type":"column","column":{"children":c2}}]}}

# ──────────────────────────────────────────────
# 현장 현황판 DB (허브에 인라인으로 삽입)
# ──────────────────────────────────────────────
print("현장 현황판 DB 생성 중...")
board = api("POST", "/databases", {
    "parent": {"type": "page_id", "page_id": HUB_ID},
    "icon": {"type": "emoji", "emoji": "📍"},
    "is_inline": True,
    "title": [{"text": {"content": "현장 현황판"}}],
    "properties": {
        "현장명":     {"title": {}},
        "단계": {"select": {"options": [
            {"name": "🔵 상담중",    "color": "blue"},
            {"name": "🟡 견적발송",  "color": "yellow"},
            {"name": "🟠 계약완료",  "color": "orange"},
            {"name": "🔨 시공중",    "color": "red"},
            {"name": "✅ 완공",      "color": "green"},
            {"name": "⏸️ 보류",      "color": "gray"},
        ]}},
        "담당자":     {"people": {}},
        "완료예정일": {"date": {}},
        "고객명":     {"rich_text": {}},
        "메모":       {"rich_text": {}},
    }
})
board_id = board["id"]
print(f"  완료! ID: {board_id}")

# ──────────────────────────────────────────────
# 허브 페이지 재작성
# ──────────────────────────────────────────────
print("허브 메인 페이지 재구성 중...")
clear(HUB_ID)

add(HUB_ID, [

    # ① 업무 흐름 — 한 줄 요약
    h2("📈 업무 흐름"),
    para("고객 문의  →  상담·견적  →  계약 체결  →  시공  →  완공·잔금  →  아카이브·마케팅", "blue"),
    divider(),

    # ② 현장 현황판 — 실제 현장 데이터
    h2("📍 현장 현황판"),
    callout("현재 진행 중인 현장을 여기에 입력하세요. 단계별로 관리할 수 있어요.", "📍"),
    # board DB는 이미 생성되어 허브 하위 페이지로 존재 → 여기서 inline으로 보임
    divider(),

    # ③ 빠른 이동
    h2("🗂️ 빠른 이동"),
    cols(
        [   # 왼쪽: 전 직원 공개
            h3("🔵 전 직원"),
            link(S["crm"],       "👥 고객 CRM"),
            link(S["project"],   "📊 프로젝트 관리"),
            link(S["task"],      "👷 직원 업무"),
            link(S["material"],  "🛒 자재·발주"),
            link(S["partner"],   "🤝 협력업체"),
            link(S["marketing"], "📣 마케팅"),
            link(S["archive"],   "🏗️ 현장 아카이브"),
            link(S["as"],        "🔧 A/S 관리"),
            link(S["notice"],    "📢 공지사항"),
            link(S["company"],   "🏢 회사 자료실"),
        ],
        [   # 오른쪽: 대표·이사 전용
            h3("🔴 대표·이사 전용"),
            link(S["estimate"],   "📝 견적 관리"),
            link(S["finance"],    "🔒 계약·재무"),
            link(S["accounting"], "💰 회계 관리"),
            link(S["labor"],      "📋 노무 관리"),
        ]
    ),
    divider(),
])

print("  완료!")
print(f"\n현장 현황판 URL: https://notion.so/{board_id.replace('-','')}")

