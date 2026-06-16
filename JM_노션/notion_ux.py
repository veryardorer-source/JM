import urllib.request
import json

from notion_auth import TOKEN
HUB_ID = "376089e9-0a52-8015-ba56-f0837a19d29a"

# 섹션 페이지 IDs
SECTION = {
    "crm":       "376089e9-0a52-81fe-8726-d5f7486d6239",
    "project":   "376089e9-0a52-810f-9f41-d04978f25c02",
    "task":      "376089e9-0a52-81c8-b924-c11c1d82c46d",
    "partner":   "376089e9-0a52-81b1-ab65-cbcc5841f9c3",
    "marketing": "376089e9-0a52-81b7-9a99-d3522c246e7a",
    "archive":   "376089e9-0a52-81fa-ac20-e449c3082d56",
    "as":        "376089e9-0a52-8167-a693-ea64f8e67ff9",
    "estimate":  "376089e9-0a52-8111-b14f-d019288d309f",
    "finance":   "376089e9-0a52-81a4-8ff0-f8dc7faa893c",
    "accounting":"376089e9-0a52-8165-81c7-fa8583b170ab",
    "labor":     "376089e9-0a52-8198-ad95-e976d01df894",
    "notice":    "376089e9-0a52-81f6-9c09-ef4bf9a4b972",
    "material":  "376089e9-0a52-81c0-89de-f16d3fa4b074",
    "company":   "376089e9-0a52-8114-9b65-efb77f467fa2",
}

DB = {
    "crm":       "376089e9-0a52-8197-8c7d-edbd4e41855c",
    "project":   "376089e9-0a52-8117-9f29-d82739c89408",
    "task":      "376089e9-0a52-810a-928c-c57e5baa6987",
    "partner":   "376089e9-0a52-811f-a34f-e7b4a0c8dcf6",
    "marketing": "376089e9-0a52-8185-bf3d-f04d32327f61",
    "archive":   "376089e9-0a52-81b4-8b76-d470c38a1921",
    "as":        "376089e9-0a52-81f7-8d55-fd6bf8390db2",
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
        print(f"  Error: {err.get('message','')[:100]}")
        return err

def clear(pid):
    blocks = api("GET", f"/blocks/{pid}/children?page_size=100")
    for b in blocks.get("results", []):
        api("DELETE", f"/blocks/{b['id']}")

def add(pid, blocks):
    return api("PATCH", f"/blocks/{pid}/children", {"children": blocks})

def make_db(parent_id, title, emoji, props):
    return api("POST", "/databases", {
        "parent": {"type": "page_id", "page_id": parent_id},
        "icon": {"type": "emoji", "emoji": emoji},
        "is_inline": True,
        "title": [{"text": {"content": title}}],
        "properties": props
    })

# 블록 헬퍼
def h1(t): return {"object":"block","type":"heading_1","heading_1":{"rich_text":[{"text":{"content":t}}],"is_toggleable":False}}
def h2(t): return {"object":"block","type":"heading_2","heading_2":{"rich_text":[{"text":{"content":t}}],"is_toggleable":False}}
def h3(t): return {"object":"block","type":"heading_3","heading_3":{"rich_text":[{"text":{"content":t}}],"is_toggleable":False}}
def para(t): return {"object":"block","type":"paragraph","paragraph":{"rich_text":[{"text":{"content":t}}]}}
def callout(t,e): return {"object":"block","type":"callout","callout":{"rich_text":[{"text":{"content":t}}],"icon":{"type":"emoji","emoji":e}}}
def bullet(t): return {"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{"text":{"content":t}}]}}
def numbered(t): return {"object":"block","type":"numbered_list_item","numbered_list_item":{"rich_text":[{"text":{"content":t}}]}}
def divider(): return {"object":"block","type":"divider","divider":{}}
def toggle(title, children):
    return {"object":"block","type":"toggle","toggle":{
        "rich_text":[{"text":{"content":title},"annotations":{"bold":True,"color":"blue"}}],
        "children": children}}
def link(pid, label):
    return {"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{
        "type":"mention","mention":{"type":"page","page":{"id":pid}},
        "plain_text":label,"href":f"https://notion.so/{pid.replace('-','')}"}]}}
def columns(col1_blocks, col2_blocks):
    return {"object":"block","type":"column_list","column_list":{"children":[
        {"object":"block","type":"column","column":{"children":col1_blocks}},
        {"object":"block","type":"column","column":{"children":col2_blocks}},
    ]}}


# ============================================================
# PART 1. 메인 허브 — 업무 흐름 시각화
# ============================================================
print("[ 1/3 ] 메인 허브 업무 흐름 구성 중...")
clear(HUB_ID)

add(HUB_ID, [
    # 헤더
    callout("JM건축인테리어 통합 업무 시스템  |  아래 흐름대로 업무를 진행하세요.", "🏠"),
    divider(),

    # ── 업무 전체 흐름도 ──
    h2("📈 업무 전체 흐름"),
    columns(
        # 왼쪽: 영업 흐름
        [
            callout("영업·계약 흐름", "💼"),
            para("① 고객 문의 접수"),
            para("         ↓"),
            para("② 👥 고객 CRM 등록"),
            para("         ↓"),
            para("③ 현장 방문 · 상담"),
            para("         ↓"),
            para("④ 📝 견적서 작성"),
            para("         ↓"),
            para("⑤ 🔒 계약 체결 · 계약금"),
        ],
        # 오른쪽: 시공 흐름
        [
            callout("시공·마감 흐름", "🏗️"),
            para("⑥ 📊 프로젝트 등록"),
            para("         ↓"),
            para("⑦ 👷 직원 업무 배정"),
            para("         ↓"),
            para("⑧ 🛒 자재 발주"),
            para("         ↓"),
            para("⑨ 시공 완료 · 잔금 수령"),
            para("         ↓"),
            para("⑩ 🏗️ 아카이브 · 📣 마케팅"),
        ]
    ),
    divider(),

    # ── 빠른 이동 ──
    h2("🔵 영업·고객"),
    link(SECTION["crm"],       "👥 고객 CRM — 문의→견적→계약→완공"),
    link(SECTION["as"],        "🔧 A/S 관리 — 하자·AS 접수·처리"),
    divider(),

    h2("🔵 현장·업무"),
    link(SECTION["project"],   "📊 프로젝트 관리 — 현장별 진행현황·일정"),
    link(SECTION["task"],      "👷 직원 업무 관리 — 업무 배정·완료 현황"),
    link(SECTION["material"],  "🛒 자재·발주 관리 — 현장별 자재 발주"),
    link(SECTION["partner"],   "🤝 협력업체 관리 — 외주·자재업체 연락처"),
    divider(),

    h2("🔵 마케팅·아카이브"),
    link(SECTION["marketing"], "📣 마케팅 콘텐츠 관리 — 블로그·SNS"),
    link(SECTION["archive"],   "🏗️ 현장 아카이브 — 마감·시공사진·도면"),
    divider(),

    h2("🔵 공통"),
    link(SECTION["notice"],    "📢 공지사항 — 직원 공지"),
    link(SECTION["company"],   "🏢 회사 자료실 — 기본정보·양식·연락처"),
    divider(),

    h2("🔴 대표·이사 전용"),
    link(SECTION["estimate"],   "📝 견적 관리 — 견적 발송·낙찰률"),
    link(SECTION["finance"],    "🔒 계약·재무 관리 — 계약금액·입금현황"),
    link(SECTION["accounting"], "💰 회계 관리 — 수입·지출·증빙"),
    link(SECTION["labor"],      "📋 노무 관리 — 직원정보·근태기록"),
    divider(),
])
print("  완료!")


# ============================================================
# PART 2. 각 섹션 페이지 재구성
#   구조: [사용방법 토글] + [DB 인라인]
#   → 페이지 열면 토글 펼쳐서 보면서 바로 DB 작성 가능
# ============================================================

SECTION_CONFIG = {
    "crm": {
        "title": "👥 고객 CRM",
        "desc": "문의 접수부터 완공까지 고객 여정 전체를 기록합니다.",
        "steps": [
            "새 고객 문의 시 → + 새로 만들기 클릭",
            "상담상태를 단계별로 업데이트",
            "유입경로 반드시 입력 (마케팅 효과 측정용)",
            "팔로업 예정일 설정으로 연락 놓치지 않기",
            "계약 완료 시 견적 관리와 연계",
        ],
        "tips": [
            "상담상태 '견적 발송' 필터 → 팔로업 필요 고객만 확인",
            "유입경로 통계 → 효과적인 마케팅 채널 파악",
            "메모란에 고객 선호 스타일, 예산, 특이사항 기록",
        ],
        "flow": "첫 문의 → 상담중 → 견적 발송 → 계약 완료 → 진행중 → 완공",
        "db_key": "crm",
        "emoji": "👥",
        "props": {
            "고객명": {"title": {}},
            "연락처": {"phone_number": {}},
            "이메일": {"email": {}},
            "유입경로": {"select": {"options": [
                {"name": "네이버 블로그", "color": "green"},{"name": "인스타그램", "color": "pink"},
                {"name": "지인 소개", "color": "yellow"},{"name": "직접 문의", "color": "blue"},
                {"name": "재계약", "color": "purple"},{"name": "기타", "color": "gray"}
            ]}},
            "상담상태": {"select": {"options": [
                {"name": "첫 문의", "color": "gray"},{"name": "상담중", "color": "blue"},
                {"name": "견적 발송", "color": "yellow"},{"name": "계약 완료", "color": "green"},
                {"name": "진행중", "color": "orange"},{"name": "완공", "color": "purple"},
                {"name": "취소", "color": "red"}
            ]}},
            "관심공종": {"multi_select": {"options": [
                {"name": "인테리어", "color": "purple"},{"name": "건축", "color": "orange"},
                {"name": "리모델링", "color": "pink"},{"name": "부분시공", "color": "brown"}
            ]}},
            "현장주소": {"rich_text": {}},
            "예산규모": {"select": {"options": [
                {"name": "1천만원 미만", "color": "gray"},{"name": "1천~3천만원", "color": "blue"},
                {"name": "3천~5천만원", "color": "green"},{"name": "5천만원~1억", "color": "yellow"},
                {"name": "1억 이상", "color": "orange"}
            ]}},
            "첫 문의일": {"date": {}},
            "마지막 연락일": {"date": {}},
            "팔로업 예정일": {"date": {}},
            "희망 완공일": {"date": {}},
            "계약일": {"date": {}},
            "담당자": {"people": {}},
            "메모": {"rich_text": {}}
        }
    },
    "project": {
        "title": "📊 프로젝트 관리",
        "desc": "진행 중인 모든 현장의 상태를 한눈에 파악합니다.",
        "steps": [
            "새 현장 수주 시 → + 새로 만들기, 담당자·일정 입력",
            "진행상태 주기적으로 업데이트",
            "각 현장 페이지 안에 시공일지·사진·메모 추가",
            "완료 후 현장 아카이브로 사진·도면 이동",
        ],
        "tips": [
            "진행률(%) 업데이트로 전체 현황 파악",
            "완료예정일 정렬 → 일정 충돌 사전 확인",
            "현장 페이지에 하도급 업체·자재 발주 현황 기록",
        ],
        "flow": "계약 전 → 진행중 → 완료 / 보류",
        "db_key": "project",
        "emoji": "📊",
        "props": {
            "현장명": {"title": {}},
            "상태": {"select": {"options": [
                {"name": "계약 전", "color": "gray"},{"name": "진행중", "color": "blue"},
                {"name": "완료", "color": "green"},{"name": "보류", "color": "yellow"}
            ]}},
            "우선순위": {"select": {"options": [
                {"name": "긴급", "color": "red"},{"name": "높음", "color": "orange"},
                {"name": "보통", "color": "yellow"},{"name": "낮음", "color": "gray"}
            ]}},
            "진행률(%)": {"number": {"format": "percent"}},
            "담당자": {"people": {}},
            "시작일": {"date": {}},
            "완료예정일": {"date": {}},
            "현장주소": {"rich_text": {}},
            "고객명": {"rich_text": {}},
            "고객연락처": {"phone_number": {}},
            "공종": {"multi_select": {"options": [
                {"name": "인테리어", "color": "purple"},{"name": "건축", "color": "orange"},
                {"name": "리모델링", "color": "pink"},{"name": "부분시공", "color": "brown"}
            ]}},
            "메모": {"rich_text": {}}
        }
    },
    "task": {
        "title": "👷 직원 업무 관리",
        "desc": "직원별 업무를 배정하고 진행 상황을 추적합니다.",
        "steps": [
            "대표·이사가 + 새로 만들기로 업무 추가, 담당자 지정",
            "직원은 본인 업무 확인 후 상태 업데이트",
            "완료 시 상태를 '완료'로 변경",
            "마감일 임박은 우선순위 '높음' 설정",
        ],
        "tips": [
            "담당자 필터 → 직원별 업무량 파악",
            "오늘 마감 필터 → 당일 처리 업무 확인",
            "매주 월요일 이 DB 기준으로 팀 업무 공유 권장",
        ],
        "flow": "대기 → 진행중 → 완료 / 보류",
        "db_key": "task",
        "emoji": "👷",
        "props": {
            "업무명": {"title": {}},
            "담당자": {"people": {}},
            "상태": {"select": {"options": [
                {"name": "대기", "color": "gray"},{"name": "진행중", "color": "blue"},
                {"name": "완료", "color": "green"},{"name": "보류", "color": "yellow"}
            ]}},
            "우선순위": {"select": {"options": [
                {"name": "높음", "color": "red"},{"name": "보통", "color": "yellow"},
                {"name": "낮음", "color": "green"}
            ]}},
            "현장명": {"rich_text": {}},
            "마감일": {"date": {}},
            "카테고리": {"select": {"options": [
                {"name": "현장", "color": "orange"},{"name": "사무", "color": "blue"},
                {"name": "영업", "color": "purple"},{"name": "기타", "color": "gray"}
            ]}},
            "메모": {"rich_text": {}}
        }
    },
    "partner": {
        "title": "🤝 협력업체 관리",
        "desc": "자주 거래하는 외주·자재업체 정보를 한 곳에서 관리합니다.",
        "steps": [
            "거래 업체 추가 시 업종·연락처·평점 입력",
            "단가표 파일 첨부",
            "거래 후 평점 업데이트",
            "거래 중단 업체는 삭제 대신 상태 '거래중단'으로 변경",
        ],
        "tips": [
            "★★★★★ 필터 → 신뢰 업체만 빠르게 조회",
            "업종 필터 → 필요한 업종 업체만 모아서 단가 비교",
            "각 업체 페이지에 시공 사례, 특이사항 기록 권장",
        ],
        "flow": "업체 등록 → 거래 → 평점 업데이트 → 주거래/거래중단",
        "db_key": "partner",
        "emoji": "🤝",
        "props": {
            "업체명": {"title": {}},
            "업종": {"select": {"options": [
                {"name": "전기", "color": "yellow"},{"name": "설비/배관", "color": "blue"},
                {"name": "타일", "color": "brown"},{"name": "목공", "color": "orange"},
                {"name": "도장", "color": "pink"},{"name": "철거", "color": "gray"},
                {"name": "창호", "color": "green"},{"name": "가구", "color": "purple"},
                {"name": "자재납품", "color": "red"},{"name": "기타", "color": "default"}
            ]}},
            "담당자명": {"rich_text": {}},
            "연락처": {"phone_number": {}},
            "거래상태": {"select": {"options": [
                {"name": "주거래", "color": "green"},{"name": "가끔 사용", "color": "yellow"},
                {"name": "비추천", "color": "red"},{"name": "거래중단", "color": "gray"}
            ]}},
            "단가표": {"files": {}},
            "계좌정보": {"rich_text": {}},
            "사업자번호": {"rich_text": {}},
            "평점": {"select": {"options": [
                {"name": "★★★★★", "color": "green"},{"name": "★★★★", "color": "blue"},
                {"name": "★★★", "color": "yellow"},{"name": "★★", "color": "orange"},
                {"name": "★", "color": "red"}
            ]}},
            "메모": {"rich_text": {}}
        }
    },
    "marketing": {
        "title": "📣 마케팅 콘텐츠 관리",
        "desc": "블로그·인스타 콘텐츠를 계획하고 발행 이력을 관리합니다.",
        "steps": [
            "콘텐츠 기획 시 제목·채널·발행예정일 입력",
            "현장 아카이브에서 올릴 현장 선택",
            "외부 업체 의뢰 시 담당 '외부업체'로 설정",
            "발행 완료 후 링크 입력, 상태 '발행완료'로 변경",
        ],
        "tips": [
            "주 3회 발행 목표: 월(블로그) / 수(인스타) / 금(블로그)",
            "발행예정일 캘린더 뷰 → 스케줄 한눈에 확인",
            "1현장 = 3포스팅: 디자인편 / 시공편 / 마감편",
        ],
        "flow": "기획중 → 작성중 → 검토중 → 발행완료",
        "db_key": "marketing",
        "emoji": "📣",
        "props": {
            "콘텐츠명": {"title": {}},
            "채널": {"select": {"options": [
                {"name": "네이버 블로그", "color": "green"},{"name": "인스타그램", "color": "pink"},
                {"name": "유튜브", "color": "red"},{"name": "카카오채널", "color": "yellow"}
            ]}},
            "상태": {"select": {"options": [
                {"name": "기획중", "color": "gray"},{"name": "작성중", "color": "blue"},
                {"name": "검토중", "color": "yellow"},{"name": "발행완료", "color": "green"}
            ]}},
            "담당": {"select": {"options": [
                {"name": "내부제작", "color": "blue"},{"name": "외부업체", "color": "purple"}
            ]}},
            "현장명": {"rich_text": {}},
            "발행예정일": {"date": {}},
            "발행일": {"date": {}},
            "링크": {"url": {}},
            "메모": {"rich_text": {}}
        }
    },
    "archive": {
        "title": "🏗️ 현장 아카이브",
        "desc": "완공된 현장의 사진·도면을 보관합니다. 마케팅·포트폴리오 자료로 활용됩니다.",
        "steps": [
            "현장 완공 후 바로 아카이브 추가",
            "마감사진·시공사진·도면 파일 첨부",
            "스타일태그 설정",
            "마케팅에 쓸 현장은 '마케팅활용' ✅ 체크",
        ],
        "tips": [
            "'마케팅활용 ✅' 필터 → 블로그용 현장만 조회",
            "스타일태그 필터 → 포트폴리오 제작 시 활용",
            "외부 마케팅 업체에 이 DB 링크 공유 → 자료 전달 대체",
        ],
        "flow": "현장 완공 → 사진·도면 업로드 → 태그 설정 → 마케팅 활용",
        "db_key": "archive",
        "emoji": "🏗️",
        "props": {
            "현장명": {"title": {}},
            "공종": {"multi_select": {"options": [
                {"name": "인테리어", "color": "purple"},{"name": "건축", "color": "orange"},{"name": "리모델링", "color": "pink"}
            ]}},
            "완공년도": {"select": {"options": [
                {"name": "2023", "color": "gray"},{"name": "2024", "color": "blue"},
                {"name": "2025", "color": "green"},{"name": "2026", "color": "yellow"}
            ]}},
            "면적": {"rich_text": {}},
            "위치": {"rich_text": {}},
            "마감사진": {"files": {}},
            "시공사진": {"files": {}},
            "도면": {"files": {}},
            "마케팅활용": {"checkbox": {}},
            "스타일태그": {"multi_select": {"options": [
                {"name": "모던", "color": "gray"},{"name": "클래식", "color": "brown"},
                {"name": "내추럴", "color": "green"},{"name": "미니멀", "color": "blue"},
                {"name": "상업공간", "color": "purple"},{"name": "주거공간", "color": "orange"},
                {"name": "럭셔리", "color": "red"}
            ]}},
            "설명": {"rich_text": {}}
        }
    },
    "as": {
        "title": "🔧 A/S 관리",
        "desc": "완공 후 하자·AS 요청을 기록하고 처리합니다. 분쟁 예방의 핵심입니다.",
        "steps": [
            "AS 접수 즉시 내용·고객연락처·접수일 입력",
            "담당자 지정 후 처리예정일 설정",
            "처리 완료 후 내용 기록, 상태 '처리완료'로 변경",
            "비용 발생 시 금액 입력",
        ],
        "tips": [
            "'접수·처리중' 필터 → 미처리 AS만 관리",
            "현장명 필터 → 특정 현장 AS 이력 전체 조회",
            "처리내용 상세히 기록 → 유사 상황 재발 시 참고",
        ],
        "flow": "접수 → 처리중 → 처리완료 / 보류",
        "db_key": "as",
        "emoji": "🔧",
        "props": {
            "AS내용": {"title": {}},
            "현장명": {"rich_text": {}},
            "고객명": {"rich_text": {}},
            "고객연락처": {"phone_number": {}},
            "AS유형": {"select": {"options": [
                {"name": "하자보수", "color": "red"},{"name": "단순AS", "color": "yellow"},
                {"name": "추가공사", "color": "blue"},{"name": "민원", "color": "orange"}
            ]}},
            "접수상태": {"select": {"options": [
                {"name": "접수", "color": "gray"},{"name": "처리중", "color": "blue"},
                {"name": "처리완료", "color": "green"},{"name": "보류", "color": "yellow"}
            ]}},
            "접수일": {"date": {}},
            "처리예정일": {"date": {}},
            "처리완료일": {"date": {}},
            "담당자": {"people": {}},
            "비용발생": {"checkbox": {}},
            "비용": {"number": {"format": "won"}},
            "처리내용": {"rich_text": {}},
            "사진": {"files": {}}
        }
    },
}

print("[ 2/3 ] 각 섹션 페이지 재구성 중...")
for key, cfg in SECTION_CONFIG.items():
    print(f"  [{key}] 재구성 중...")
    sid = SECTION[key]
    clear(sid)

    # 새 DB 생성 (인라인)
    new_db = make_db(sid, cfg["title"], cfg["emoji"], cfg["props"])
    if "id" not in new_db:
        print(f"    DB 생성 실패, 기존 DB 링크 사용")
        db_id = DB.get(key, "")
    else:
        db_id = new_db["id"]

    # 페이지 구성: 설명 callout + 사용방법 토글 + 구분선 + 인라인 DB
    page_blocks = [
        callout(cfg["desc"], cfg["emoji"]),
        divider(),
        toggle(f"📋 사용 방법 · 활용 팁 (클릭해서 펼치기)", [
            h3("✅ 작성 순서"),
            *[numbered(s) for s in cfg["steps"]],
            divider(),
            h3("💡 활용 팁"),
            *[bullet(t) for t in cfg["tips"]],
            divider(),
            h3("🔄 상태 흐름"),
            para(cfg["flow"]),
        ]),
        divider(),
    ]
    add(sid, page_blocks)
    print(f"    완료! DB ID: {db_id[:8]}...")

print("  모든 섹션 완료!")


# ============================================================
# PART 3. 대표·이사 전용 페이지도 동일하게 구성
# ============================================================
print("[ 3/3 ] 대표·이사 전용 페이지 사용방법 토글 추가...")

restricted = {
    "estimate": {
        "id": SECTION["estimate"],
        "steps": [
            "견적서 발송 시 현장명·고객명·견적금액·견적일 입력",
            "견적서 파일(PDF) 첨부",
            "결과에 따라 상태 업데이트",
            "미성사 시 사유 반드시 기록",
        ],
        "tips": [
            "월별 필터 → 견적 건수 vs 계약 건수 비교 (낙찰률 파악)",
            "미성사 사유 패턴 분석 → 가격/일정/경쟁사 등",
            "유효기간 설정으로 오래된 견적 자동 관리",
        ],
        "flow": "작성중 → 발송완료 → 협의중 → 계약성사 / 미성사",
    },
    "finance": {
        "id": SECTION["finance"],
        "steps": [
            "계약 체결 시 현장명·계약금액·계약일 입력",
            "각 단계 입금 확인 시 입금상태 업데이트",
            "미수금 발생 시 상태 '미수금'으로 변경 후 팔로업",
            "예상 마진 계산해서 입력",
        ],
        "tips": [
            "'미수금' 필터 → 받아야 할 돈 즉시 파악",
            "매월 말 계약금액 합계 → 매출 목표 대비 확인",
            "예상 마진 vs 실제 지출 비교 → 수익성 분석",
        ],
        "flow": "계약금 완료 → 중도금 완료 → 잔금 완료",
    },
    "accounting": {
        "id": SECTION["accounting"],
        "steps": [
            "수입·지출 발생 즉시 내용·금액·날짜 입력",
            "카테고리 정확히 분류",
            "영수증·세금계산서 파일 첨부",
            "현장명 입력 → 현장별 원가 집계 가능",
        ],
        "tips": [
            "구분 '수입' 합계 → 이달 매출 / '지출' 합계 → 이달 지출",
            "현장명 + 지출 필터 → 현장별 원가 파악",
            "월별 정리 후 세무사 자료 전달 시 내보내기 활용",
        ],
        "flow": "발생 즉시 입력 → 증빙 첨부 → 월별 정산",
    },
    "labor": {
        "id": SECTION["labor"],
        "steps": [
            "직원 입사 시 직원 정보 DB에 등록 및 계약서 첨부",
            "매일 근태 기록 DB에 출퇴근 시간 입력",
            "연차·반차 사용 시 근무유형 변경",
            "월말에 근태 확인 후 급여 계산",
        ],
        "tips": [
            "근무유형 '연차' 필터 → 월별 연차 사용 현황",
            "계약서·재직증명서 직원 페이지에 첨부 → 분실 방지",
            "알찬급여 프로그램과 병행 사용 권장",
        ],
        "flow": "출근 기록 → 업무 → 퇴근 기록 → 월말 급여 정산",
    },
}

for key, cfg in restricted.items():
    print(f"  [{key}] 토글 추가 중...")
    # 기존 경고 블록 유지하고 토글만 추가
    existing = api("GET", f"/blocks/{cfg['id']}/children?page_size=10")
    results = existing.get("results", [])
    # 경고 callout 뒤에 토글 추가
    add(cfg["id"], [
        toggle(f"📋 사용 방법 · 활용 팁 (클릭해서 펼치기)", [
            h3("✅ 작성 순서"),
            *[numbered(s) for s in cfg["steps"]],
            divider(),
            h3("💡 활용 팁"),
            *[bullet(t) for t in cfg["tips"]],
            divider(),
            h3("🔄 상태 흐름"),
            para(cfg["flow"]),
        ]),
        divider(),
    ])
    print(f"    완료!")

print("")
print("=" * 60)
print("  UX 개선 완료!")
print("=" * 60)
print("  메인 허브: 2컬럼 업무 흐름도 + 빠른 이동 링크")
print("  각 섹션: 사용방법 토글 + 인라인 DB (한 페이지에서 작성)")

