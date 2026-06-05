import urllib.request, json

TOKEN = "ntn_H23137511225x1Um9OQaYDJW1V7e0AGk3dAO7z2znnhewK"
HUB_ID = "376089e9-0a52-8015-ba56-f0837a19d29a"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Notion-Version": "2022-06-28", "Content-Type": "application/json"}

def api(method, endpoint, data=None):
    url = f"https://api.notion.com/v1{endpoint}"
    body = json.dumps(data, ensure_ascii=False).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as r: return json.loads(r.read())
    except urllib.error.HTTPError as e:
        err = json.loads(e.read()); print(f"  ERR: {err.get('message','')[:80]}"); return err

def make_page(pid, title, emoji, children=None):
    b = {"parent":{"type":"page_id","page_id":pid},"icon":{"type":"emoji","emoji":emoji},
         "properties":{"title":{"title":[{"text":{"content":title}}]}}}
    if children: b["children"] = children
    return api("POST", "/pages", b)

def make_db(pid, title, emoji, props):
    return api("POST", "/databases", {"parent":{"type":"page_id","page_id":pid},
        "icon":{"type":"emoji","emoji":emoji},"is_inline":True,
        "title":[{"text":{"content":title}}],"properties":props})

def add(pid, blocks): return api("PATCH", f"/blocks/{pid}/children", {"children": blocks})
def clear(pid):
    bs = api("GET", f"/blocks/{pid}/children?page_size=100")
    for b in bs.get("results",[]): api("DELETE", f"/blocks/{b['id']}")

def h2(t): return {"object":"block","type":"heading_2","heading_2":{"rich_text":[{"text":{"content":t}}]}}
def h3(t): return {"object":"block","type":"heading_3","heading_3":{"rich_text":[{"text":{"content":t}}]}}
def para(t): return {"object":"block","type":"paragraph","paragraph":{"rich_text":[{"text":{"content":t}}]}}
def callout(t,e): return {"object":"block","type":"callout","callout":{"rich_text":[{"text":{"content":t}}],"icon":{"type":"emoji","emoji":e}}}
def bullet(t): return {"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{"text":{"content":t}}]}}
def num(t): return {"object":"block","type":"numbered_list_item","numbered_list_item":{"rich_text":[{"text":{"content":t}}]}}
def divider(): return {"object":"block","type":"divider","divider":{}}
def toggle(title, children): return {"object":"block","type":"toggle","toggle":{
    "rich_text":[{"text":{"content":title},"annotations":{"bold":True,"color":"blue"}}],"children":children}}
def cols(c1, c2): return {"object":"block","type":"column_list","column_list":{"children":[
    {"object":"block","type":"column","column":{"children":c1}},
    {"object":"block","type":"column","column":{"children":c2}}]}}
def link(pid, label): return {"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{
    "type":"mention","mention":{"type":"page","page":{"id":pid}},"plain_text":label,
    "href":f"https://notion.so/{pid.replace('-','')}"}]}}
def warn(): return callout("대표·이사만 접근합니다. 직원 초대 시 이 페이지는 공유하지 마세요.", "⚠️")

IDS = {}

# ──────────────────────────────────────────────
# 공통 섹션 빌더
# ──────────────────────────────────────────────
def build_section(hub_id, title, emoji, desc, steps, tips, flow, props):
    page = make_page(hub_id, title, emoji)
    pid = page["id"]
    db = make_db(pid, title, emoji, props)
    add(pid, [
        callout(desc, emoji),
        divider(),
        toggle("📋 사용 방법 · 활용 팁  ▶ 클릭해서 펼치기", [
            h3("✅ 작성 순서"),
            *[num(s) for s in steps],
            divider(),
            h3("💡 활용 팁"),
            *[bullet(t) for t in tips],
            divider(),
            h3("🔄 상태 흐름"),
            para(flow),
        ]),
        divider(),
    ])
    return pid, db["id"]

def build_restricted(hub_id, title, emoji, steps, tips, flow, children_blocks):
    page = make_page(hub_id, title, emoji, [warn(), divider()])
    pid = page["id"]
    add(pid, [
        toggle("📋 사용 방법 · 활용 팁  ▶ 클릭해서 펼치기", [
            h3("✅ 작성 순서"),
            *[num(s) for s in steps],
            divider(),
            h3("💡 활용 팁"),
            *[bullet(t) for t in tips],
            divider(),
            h3("🔄 상태 흐름"),
            para(flow),
        ]),
        divider(),
    ])
    # DB 생성
    for db_title, db_emoji, db_props in children_blocks:
        make_db(pid, db_title, db_emoji, db_props)
    return pid

# ══════════════════════════════════════════════
# 1. 고객 CRM
# ══════════════════════════════════════════════
print("[ 1/13] 고객 CRM...")
IDS["crm"], _ = build_section(HUB_ID, "고객 CRM", "👥",
    "고객 문의부터 완공까지 전체 여정을 기록합니다.",
    ["새 고객 문의 시 → + 새로 만들기 클릭",
     "상담상태를 단계별로 업데이트 (첫 문의→상담중→견적발송→계약완료→완공)",
     "유입경로 반드시 입력 (마케팅 효과 측정용)",
     "팔로업 예정일 설정으로 연락 놓치지 않기",
     "계약 완료 시 견적 관리 DB와 연계"],
    ["'견적 발송' 필터 → 팔로업 필요 고객만 확인",
     "유입경로 통계로 효과적인 마케팅 채널 파악",
     "메모란에 고객 선호 스타일·예산·특이사항 기록"],
    "첫 문의 → 상담중 → 견적 발송 → 계약 완료 → 진행중 → 완공",
    {"고객명":{"title":{}}, "연락처":{"phone_number":{}}, "이메일":{"email":{}},
     "유입경로":{"select":{"options":[{"name":"네이버 블로그","color":"green"},{"name":"인스타그램","color":"pink"},
         {"name":"지인 소개","color":"yellow"},{"name":"직접 문의","color":"blue"},{"name":"재계약","color":"purple"},{"name":"기타","color":"gray"}]}},
     "상담상태":{"select":{"options":[{"name":"첫 문의","color":"gray"},{"name":"상담중","color":"blue"},
         {"name":"견적 발송","color":"yellow"},{"name":"계약 완료","color":"green"},
         {"name":"진행중","color":"orange"},{"name":"완공","color":"purple"},{"name":"취소","color":"red"}]}},
     "관심공종":{"multi_select":{"options":[{"name":"인테리어","color":"purple"},{"name":"건축","color":"orange"},
         {"name":"리모델링","color":"pink"},{"name":"부분시공","color":"brown"}]}},
     "현장주소":{"rich_text":{}}, "예산규모":{"select":{"options":[
         {"name":"1천만원 미만","color":"gray"},{"name":"1천~3천만원","color":"blue"},
         {"name":"3천~5천만원","color":"green"},{"name":"5천만원~1억","color":"yellow"},{"name":"1억 이상","color":"orange"}]}},
     "첫 문의일":{"date":{}}, "마지막 연락일":{"date":{}}, "팔로업 예정일":{"date":{}},
     "희망 완공일":{"date":{}}, "계약일":{"date":{}}, "담당자":{"people":{}}, "메모":{"rich_text":{}}})
print("  완료!")

# ══════════════════════════════════════════════
# 2. 프로젝트 관리
# ══════════════════════════════════════════════
print("[ 2/13] 프로젝트 관리...")
IDS["project"], _ = build_section(HUB_ID, "프로젝트 관리", "📊",
    "진행 중인 모든 현장의 상태를 한눈에 파악합니다.",
    ["새 현장 수주 시 → + 새로 만들기, 담당자·일정 입력",
     "진행률(%) 주기적으로 업데이트",
     "각 현장 페이지 안에 시공일지·사진·메모 추가",
     "완료 후 현장 아카이브로 사진·도면 이동"],
    ["진행률(%) 업데이트로 전체 현황 파악",
     "완료예정일 정렬 → 일정 충돌 사전 확인",
     "현장 페이지에 하도급 업체·자재 발주 현황 기록"],
    "계약 전 → 진행중 → 완료 / 보류",
    {"현장명":{"title":{}},
     "상태":{"select":{"options":[{"name":"계약 전","color":"gray"},{"name":"진행중","color":"blue"},
         {"name":"완료","color":"green"},{"name":"보류","color":"yellow"}]}},
     "우선순위":{"select":{"options":[{"name":"긴급","color":"red"},{"name":"높음","color":"orange"},
         {"name":"보통","color":"yellow"},{"name":"낮음","color":"gray"}]}},
     "진행률(%)":{"number":{"format":"percent"}},
     "담당자":{"people":{}}, "시작일":{"date":{}}, "완료예정일":{"date":{}},
     "현장주소":{"rich_text":{}}, "고객명":{"rich_text":{}}, "고객연락처":{"phone_number":{}},
     "공종":{"multi_select":{"options":[{"name":"인테리어","color":"purple"},{"name":"건축","color":"orange"},
         {"name":"리모델링","color":"pink"},{"name":"부분시공","color":"brown"}]}},
     "메모":{"rich_text":{}}})
print("  완료!")

# ══════════════════════════════════════════════
# 3. 직원 업무 관리
# ══════════════════════════════════════════════
print("[ 3/13] 직원 업무 관리...")
IDS["task"], _ = build_section(HUB_ID, "직원 업무 관리", "👷",
    "직원별 업무를 배정하고 진행 상황을 추적합니다.",
    ["대표·이사가 + 새로 만들기로 업무 추가, 담당자 지정",
     "직원은 본인 업무 확인 후 상태 업데이트 (대기→진행중→완료)",
     "완료 시 상태 '완료'로 변경",
     "마감일 임박은 우선순위 '높음' 설정"],
    ["담당자 필터 → 직원별 업무량 파악",
     "오늘 마감 기준 필터 → 당일 처리 업무 확인",
     "매주 월요일 이 DB 기준으로 팀 업무 공유 권장"],
    "대기 → 진행중 → 완료 / 보류",
    {"업무명":{"title":{}}, "담당자":{"people":{}},
     "상태":{"select":{"options":[{"name":"대기","color":"gray"},{"name":"진행중","color":"blue"},
         {"name":"완료","color":"green"},{"name":"보류","color":"yellow"}]}},
     "우선순위":{"select":{"options":[{"name":"높음","color":"red"},{"name":"보통","color":"yellow"},{"name":"낮음","color":"green"}]}},
     "현장명":{"rich_text":{}}, "마감일":{"date":{}},
     "카테고리":{"select":{"options":[{"name":"현장","color":"orange"},{"name":"사무","color":"blue"},
         {"name":"영업","color":"purple"},{"name":"기타","color":"gray"}]}},
     "메모":{"rich_text":{}}})
print("  완료!")

# ══════════════════════════════════════════════
# 4. 협력업체 관리
# ══════════════════════════════════════════════
print("[ 4/13] 협력업체 관리...")
IDS["partner"], _ = build_section(HUB_ID, "협력업체 관리", "🤝",
    "자주 거래하는 외주·자재업체 정보를 한 곳에서 관리합니다.",
    ["거래 업체 추가 시 업종·연락처·평점 입력",
     "단가표 파일 첨부",
     "거래 후 평점 업데이트",
     "거래 중단 업체는 삭제 대신 상태 '거래중단' 변경"],
    ["★★★★★ 필터 → 신뢰 업체만 빠르게 조회",
     "업종 필터 → 단가 비교",
     "각 업체 페이지에 시공 사례, 특이사항 기록 권장"],
    "업체 등록 → 거래 → 평점 업데이트 → 주거래 / 거래중단",
    {"업체명":{"title":{}},
     "업종":{"select":{"options":[{"name":"전기","color":"yellow"},{"name":"설비/배관","color":"blue"},
         {"name":"타일","color":"brown"},{"name":"목공","color":"orange"},{"name":"도장","color":"pink"},
         {"name":"철거","color":"gray"},{"name":"창호","color":"green"},{"name":"가구","color":"purple"},
         {"name":"자재납품","color":"red"},{"name":"기타","color":"default"}]}},
     "담당자명":{"rich_text":{}}, "연락처":{"phone_number":{}},
     "거래상태":{"select":{"options":[{"name":"주거래","color":"green"},{"name":"가끔 사용","color":"yellow"},
         {"name":"비추천","color":"red"},{"name":"거래중단","color":"gray"}]}},
     "단가표":{"files":{}}, "계좌정보":{"rich_text":{}}, "사업자번호":{"rich_text":{}},
     "평점":{"select":{"options":[{"name":"★★★★★","color":"green"},{"name":"★★★★","color":"blue"},
         {"name":"★★★","color":"yellow"},{"name":"★★","color":"orange"},{"name":"★","color":"red"}]}},
     "메모":{"rich_text":{}}})
print("  완료!")

# ══════════════════════════════════════════════
# 5. 마케팅 콘텐츠 관리
# ══════════════════════════════════════════════
print("[ 5/13] 마케팅...")
IDS["marketing"], _ = build_section(HUB_ID, "마케팅 콘텐츠 관리", "📣",
    "블로그·인스타 콘텐츠를 계획하고 발행 이력을 관리합니다.",
    ["콘텐츠 기획 시 제목·채널·발행예정일 입력",
     "현장 아카이브에서 올릴 현장 선택",
     "외부 업체 의뢰 시 담당 '외부업체'로 설정",
     "발행 완료 후 링크 입력, 상태 '발행완료'로 변경"],
    ["주 3회 발행 목표: 월(블로그) / 수(인스타) / 금(블로그)",
     "1현장 3포스팅: 디자인편 / 시공편 / 마감편",
     "발행예정일 캘린더 뷰 → 스케줄 한눈에 확인"],
    "기획중 → 작성중 → 검토중 → 발행완료",
    {"콘텐츠명":{"title":{}},
     "채널":{"select":{"options":[{"name":"네이버 블로그","color":"green"},{"name":"인스타그램","color":"pink"},
         {"name":"유튜브","color":"red"},{"name":"카카오채널","color":"yellow"}]}},
     "상태":{"select":{"options":[{"name":"기획중","color":"gray"},{"name":"작성중","color":"blue"},
         {"name":"검토중","color":"yellow"},{"name":"발행완료","color":"green"}]}},
     "담당":{"select":{"options":[{"name":"내부제작","color":"blue"},{"name":"외부업체","color":"purple"}]}},
     "현장명":{"rich_text":{}}, "발행예정일":{"date":{}}, "발행일":{"date":{}},
     "링크":{"url":{}}, "메모":{"rich_text":{}}})
print("  완료!")

# ══════════════════════════════════════════════
# 6. 현장 아카이브
# ══════════════════════════════════════════════
print("[ 6/13] 현장 아카이브...")
IDS["archive"], _ = build_section(HUB_ID, "현장 아카이브", "🏗️",
    "완공된 현장의 사진·도면을 보관합니다. 마케팅·포트폴리오 자료로 활용됩니다.",
    ["현장 완공 후 바로 아카이브에 추가",
     "마감사진·시공사진·도면 파일 첨부",
     "스타일태그 설정 (모던, 미니멀 등)",
     "마케팅에 쓸 현장은 '마케팅활용' ✅ 체크"],
    ["'마케팅활용 ✅' 필터 → 블로그용 현장만 조회",
     "스타일태그 필터 → 포트폴리오 제작 시 활용",
     "외부 마케팅 업체에 이 DB 링크 공유 → 자료 전달 대체"],
    "현장 완공 → 사진·도면 업로드 → 태그 설정 → 마케팅 활용",
    {"현장명":{"title":{}},
     "공종":{"multi_select":{"options":[{"name":"인테리어","color":"purple"},{"name":"건축","color":"orange"},{"name":"리모델링","color":"pink"}]}},
     "완공년도":{"select":{"options":[{"name":"2023","color":"gray"},{"name":"2024","color":"blue"},
         {"name":"2025","color":"green"},{"name":"2026","color":"yellow"}]}},
     "면적":{"rich_text":{}}, "위치":{"rich_text":{}},
     "마감사진":{"files":{}}, "시공사진":{"files":{}}, "도면":{"files":{}},
     "마케팅활용":{"checkbox":{}},
     "스타일태그":{"multi_select":{"options":[{"name":"모던","color":"gray"},{"name":"클래식","color":"brown"},
         {"name":"내추럴","color":"green"},{"name":"미니멀","color":"blue"},{"name":"상업공간","color":"purple"},
         {"name":"주거공간","color":"orange"},{"name":"럭셔리","color":"red"}]}},
     "설명":{"rich_text":{}}})
print("  완료!")

# ══════════════════════════════════════════════
# 7. A/S 관리
# ══════════════════════════════════════════════
print("[ 7/13] A/S 관리...")
IDS["as"], _ = build_section(HUB_ID, "A/S 관리", "🔧",
    "완공 후 하자·AS 요청을 기록하고 처리합니다. 분쟁 예방의 핵심입니다.",
    ["AS 접수 즉시 내용·고객연락처·접수일 입력",
     "담당자 지정 후 처리예정일 설정",
     "처리 완료 후 내용 기록, 상태 '처리완료'로 변경",
     "비용 발생 시 금액 입력"],
    ["'접수·처리중' 필터 → 미처리 AS만 관리",
     "현장명 필터 → 특정 현장 AS 이력 전체 조회",
     "처리내용 상세 기록 → 유사 상황 재발 시 참고"],
    "접수 → 처리중 → 처리완료 / 보류",
    {"AS내용":{"title":{}}, "현장명":{"rich_text":{}}, "고객명":{"rich_text":{}},
     "고객연락처":{"phone_number":{}},
     "AS유형":{"select":{"options":[{"name":"하자보수","color":"red"},{"name":"단순AS","color":"yellow"},
         {"name":"추가공사","color":"blue"},{"name":"민원","color":"orange"}]}},
     "접수상태":{"select":{"options":[{"name":"접수","color":"gray"},{"name":"처리중","color":"blue"},
         {"name":"처리완료","color":"green"},{"name":"보류","color":"yellow"}]}},
     "접수일":{"date":{}}, "처리예정일":{"date":{}}, "처리완료일":{"date":{}},
     "담당자":{"people":{}}, "비용발생":{"checkbox":{}}, "비용":{"number":{"format":"won"}},
     "처리내용":{"rich_text":{}}, "사진":{"files":{}}})
print("  완료!")

# ══════════════════════════════════════════════
# 8. 자재·발주 관리
# ══════════════════════════════════════════════
print("[ 8/13] 자재·발주 관리...")
IDS["material"], _ = build_section(HUB_ID, "자재·발주 관리", "🛒",
    "현장별 자재 발주 현황을 관리합니다. 납기 지연을 사전에 방지하세요.",
    ["자재 발주 시 품목·수량·현장명·납기일 입력",
     "발주 후 상태 '발주완료'로 변경",
     "자재 입고 확인 후 '입고완료'로 변경",
     "단가는 협력업체 DB와 비교 확인"],
    ["현장명 필터 → 특정 현장 발주 내역만 조회",
     "'발주완료' 필터 → 아직 안 온 자재 파악",
     "납기일 정렬 → 급한 발주 우선 관리"],
    "발주 전 → 발주완료 → 입고완료 / 반품",
    {"품목명":{"title":{}}, "현장명":{"rich_text":{}},
     "카테고리":{"select":{"options":[{"name":"타일","color":"brown"},{"name":"목재","color":"orange"},
         {"name":"도장재","color":"yellow"},{"name":"전기자재","color":"blue"},{"name":"설비자재","color":"purple"},
         {"name":"창호","color":"green"},{"name":"가구·가전","color":"pink"},{"name":"철물","color":"gray"},{"name":"기타","color":"default"}]}},
     "수량":{"number":{}},
     "단위":{"select":{"options":[{"name":"EA","color":"gray"},{"name":"m²","color":"blue"},
         {"name":"m","color":"green"},{"name":"BOX","color":"orange"},{"name":"세트","color":"purple"},{"name":"식","color":"yellow"}]}},
     "단가":{"number":{"format":"won"}},
     "발주업체":{"rich_text":{}},
     "상태":{"select":{"options":[{"name":"발주 전","color":"gray"},{"name":"발주완료","color":"blue"},
         {"name":"입고완료","color":"green"},{"name":"반품","color":"red"}]}},
     "발주일":{"date":{}}, "납기일":{"date":{}},
     "담당자":{"people":{}}, "메모":{"rich_text":{}}})
print("  완료!")

# ══════════════════════════════════════════════
# 9. 공지사항
# ══════════════════════════════════════════════
print("[ 9/13] 공지사항...")
IDS["notice"], _ = build_section(HUB_ID, "공지사항", "📢",
    "대표·이사가 직원들에게 전달할 공지를 올리는 곳입니다.",
    ["+ 새로 만들기로 공지 작성",
     "중요도·대상 설정",
     "직원은 확인 후 '확인여부' ✅ 체크"],
    ["'긴급 🔴' 필터 → 즉시 확인 필요 공지만 조회",
     "대상 필터 → 해당 팀 공지만 확인"],
    "작성 → 공지 → 직원 확인",
    {"제목":{"title":{}},
     "중요도":{"select":{"options":[{"name":"긴급 🔴","color":"red"},{"name":"중요 🟡","color":"yellow"},{"name":"일반 🟢","color":"green"}]}},
     "대상":{"multi_select":{"options":[{"name":"전 직원","color":"blue"},{"name":"현장팀","color":"orange"},
         {"name":"사무팀","color":"purple"},{"name":"이사","color":"red"}]}},
     "작성자":{"people":{}}, "공지일":{"date":{}},
     "확인여부":{"checkbox":{}}, "내용":{"rich_text":{}}})
print("  완료!")

# ══════════════════════════════════════════════
# 10. 회사 자료실
# ══════════════════════════════════════════════
print("[10/13] 회사 자료실...")
company = make_page(HUB_ID, "회사 자료실", "🏢", [
    callout("자주 쓰는 회사 정보와 양식을 모아둔 곳입니다.", "🏢"), divider(),
    h2("🏢 회사 기본 정보"),
    bullet("상호명: JM건축인테리어"),
    bullet("사업자번호: (입력)"), bullet("대표자: (입력)"),
    bullet("사업장 주소: (입력)"), bullet("대표 연락처: (입력)"), bullet("이메일: (입력)"),
    divider(), h2("🏦 계좌 정보"),
    bullet("은행명: (입력)"), bullet("계좌번호: (입력)"), bullet("예금주: (입력)"),
    divider(), h2("📄 자주 쓰는 양식"),
    bullet("표준 도급 계약서 (파일 첨부)"), bullet("표준 견적서 양식 (파일 첨부)"),
    bullet("하도급 계약서 (파일 첨부)"), bullet("준공 확인서 (파일 첨부)"),
    divider(), h2("📌 주요 연락처"),
    bullet("세무사: (입력)"), bullet("노무사: (입력)"), bullet("법무사: (입력)"),
])
IDS["company"] = company["id"]
print("  완료!")

# ══════════════════════════════════════════════
# 11. 견적 관리 (대표·이사 전용)
# ══════════════════════════════════════════════
print("[11/13] 견적 관리...")
IDS["estimate"] = build_restricted(HUB_ID, "견적 관리 (대표·이사 전용)", "📝",
    ["견적서 발송 시 현장명·고객명·견적금액·견적일 입력",
     "견적서 파일(PDF) 첨부",
     "결과에 따라 상태 업데이트",
     "미성사 시 사유 반드시 기록"],
    ["월별 필터 → 견적 건수 vs 계약 건수 비교 (낙찰률)",
     "미성사 사유 패턴 분석 → 가격/일정/경쟁사 등",
     "유효기간 설정으로 오래된 견적 관리"],
    "작성중 → 발송완료 → 협의중 → 계약성사 / 미성사",
    [("견적 현황", "📝", {
        "현장명":{"title":{}}, "고객명":{"rich_text":{}},
        "견적금액":{"number":{"format":"won"}},
        "견적상태":{"select":{"options":[{"name":"작성중","color":"gray"},{"name":"발송완료","color":"blue"},
            {"name":"협의중","color":"yellow"},{"name":"계약성사","color":"green"},{"name":"미성사","color":"red"}]}},
        "견적일":{"date":{}}, "유효기간":{"date":{}},
        "공종":{"multi_select":{"options":[{"name":"인테리어","color":"purple"},{"name":"건축","color":"orange"},{"name":"리모델링","color":"pink"}]}},
        "면적":{"rich_text":{}}, "견적서파일":{"files":{}},
        "담당자":{"people":{}}, "미성사사유":{"rich_text":{}}, "메모":{"rich_text":{}}})])
print("  완료!")

# ══════════════════════════════════════════════
# 12. 계약·재무 관리 (대표·이사 전용)
# ══════════════════════════════════════════════
print("[12/13] 계약·재무...")
IDS["finance"] = build_restricted(HUB_ID, "계약·재무 관리 (대표·이사 전용)", "🔒",
    ["계약 체결 시 현장명·계약금액·계약일 입력",
     "각 단계 입금 확인 시 입금상태 업데이트",
     "미수금 발생 시 상태 '미수금'으로 변경 후 팔로업",
     "예상 마진 계산해서 입력"],
    ["'미수금' 필터 → 받아야 할 돈 즉시 파악",
     "매월 말 계약금액 합계 → 매출 목표 대비 확인",
     "예상 마진 vs 실제 지출 비교 → 수익성 분석"],
    "계약금 완료 → 중도금 완료 → 잔금 완료",
    [("계약·재무 현황", "💼", {
        "현장명":{"title":{}}, "계약금액":{"number":{"format":"won"}},
        "계약금":{"number":{"format":"won"}}, "중도금":{"number":{"format":"won"}},
        "잔금":{"number":{"format":"won"}}, "미수금":{"number":{"format":"won"}},
        "입금상태":{"select":{"options":[{"name":"계약금 완료","color":"yellow"},{"name":"중도금 완료","color":"blue"},
            {"name":"잔금 완료","color":"green"},{"name":"미수금","color":"red"}]}},
        "계약일":{"date":{}}, "예상 마진":{"number":{"format":"won"}}, "비고":{"rich_text":{}}})])
print("  완료!")

# ══════════════════════════════════════════════
# 13. 회계·노무 (대표·이사 전용)
# ══════════════════════════════════════════════
print("[13/13] 회계·노무...")
IDS["accounting"] = build_restricted(HUB_ID, "회계 관리 (대표·이사 전용)", "💰",
    ["수입·지출 발생 즉시 내용·금액·날짜 입력",
     "카테고리 정확히 분류",
     "영수증·세금계산서 파일 첨부",
     "현장명 입력 → 현장별 원가 집계 가능"],
    ["'수입' 합계 → 이달 매출 / '지출' 합계 → 이달 지출",
     "현장명 + 지출 필터 → 현장별 원가 파악",
     "월별 정리 후 세무사 자료 전달 시 내보내기 활용"],
    "발생 즉시 입력 → 증빙 첨부 → 월별 정산",
    [("수입·지출 내역", "📒", {
        "내용":{"title":{}},
        "구분":{"select":{"options":[{"name":"수입","color":"green"},{"name":"지출","color":"red"},{"name":"대출/차입","color":"yellow"}]}},
        "카테고리":{"select":{"options":[{"name":"공사대금","color":"blue"},{"name":"자재비","color":"orange"},
            {"name":"인건비","color":"purple"},{"name":"외주비","color":"pink"},{"name":"운영비","color":"gray"},{"name":"기타","color":"brown"}]}},
        "금액":{"number":{"format":"won"}}, "날짜":{"date":{}}, "현장명":{"rich_text":{}},
        "결제수단":{"select":{"options":[{"name":"법인카드","color":"blue"},{"name":"계좌이체","color":"green"},{"name":"현금","color":"yellow"}]}},
        "증빙":{"files":{}}, "메모":{"rich_text":{}}})])

IDS["labor"] = build_restricted(HUB_ID, "노무 관리 (대표·이사 전용)", "📋",
    ["직원 입사 시 직원 정보 DB에 등록 및 계약서 첨부",
     "매일 근태 기록 DB에 출퇴근 시간 입력",
     "연차·반차 사용 시 근무유형 변경",
     "월말에 근태 확인 후 급여 계산"],
    ["근무유형 '연차' 필터 → 월별 연차 사용 현황",
     "계약서·재직증명서 직원 페이지에 첨부 → 분실 방지",
     "알찬급여 프로그램과 병행 사용 권장"],
    "출근 기록 → 업무 → 퇴근 기록 → 월말 급여 정산",
    [("직원 정보", "👤", {
        "직원명":{"title":{}},
        "직책":{"select":{"options":[{"name":"대표","color":"red"},{"name":"이사","color":"orange"},
            {"name":"팀장","color":"yellow"},{"name":"사원","color":"blue"}]}},
        "입사일":{"date":{}}, "기본급":{"number":{"format":"won"}},
        "연락처":{"phone_number":{}},
        "계약형태":{"select":{"options":[{"name":"정규직","color":"green"},{"name":"계약직","color":"yellow"},{"name":"일용직","color":"gray"}]}},
        "계약서":{"files":{}}, "메모":{"rich_text":{}}}),
     ("근태 기록", "🕐", {
        "직원명":{"title":{}}, "날짜":{"date":{}},
        "출근시간":{"rich_text":{}}, "퇴근시간":{"rich_text":{}},
        "근무유형":{"select":{"options":[{"name":"정상","color":"green"},{"name":"반차","color":"yellow"},
            {"name":"연차","color":"orange"},{"name":"결근","color":"red"},{"name":"출장","color":"blue"}]}},
        "메모":{"rich_text":{}}})])
print("  완료!")

# ══════════════════════════════════════════════
# 허브 최종 업데이트
# ══════════════════════════════════════════════
print("\n[허브] 메인 대시보드 최종 업데이트...")
clear(HUB_ID)
add(HUB_ID, [
    callout("JM건축인테리어 통합 업무 시스템  |  아래 흐름을 보고, 항목을 클릭해서 업무를 시작하세요.", "🏠"),
    divider(),

    h2("📈 업무 전체 흐름"),
    cols(
        [callout("💼 영업·계약", "💼"),
         para("① 고객 문의 접수"),
         para("         ↓"),
         para("② 고객 CRM 등록"),
         para("         ↓"),
         para("③ 현장 방문 · 상담"),
         para("         ↓"),
         para("④ 견적서 작성"),
         para("         ↓"),
         para("⑤ 계약 체결 · 계약금 입금"),],
        [callout("🏗️ 시공·마감", "🏗️"),
         para("⑥ 프로젝트 등록"),
         para("         ↓"),
         para("⑦ 직원 업무 배정"),
         para("         ↓"),
         para("⑧ 자재 발주"),
         para("         ↓"),
         para("⑨ 시공 완료 · 잔금 수령"),
         para("         ↓"),
         para("⑩ 아카이브 등록 · 마케팅"),]
    ),
    divider(),

    h2("🔵 영업·고객"),
    link(IDS["crm"],       "👥 고객 CRM"),
    link(IDS["as"],        "🔧 A/S 관리"),
    divider(),

    h2("🔵 현장·업무"),
    link(IDS["project"],   "📊 프로젝트 관리"),
    link(IDS["task"],      "👷 직원 업무 관리"),
    link(IDS["material"],  "🛒 자재·발주 관리"),
    link(IDS["partner"],   "🤝 협력업체 관리"),
    divider(),

    h2("🔵 마케팅·아카이브"),
    link(IDS["marketing"], "📣 마케팅 콘텐츠 관리"),
    link(IDS["archive"],   "🏗️ 현장 아카이브"),
    divider(),

    h2("🔵 공통"),
    link(IDS["notice"],    "📢 공지사항"),
    link(IDS["company"],   "🏢 회사 자료실"),
    divider(),

    h2("🔴 대표·이사 전용"),
    link(IDS["estimate"],   "📝 견적 관리"),
    link(IDS["finance"],    "🔒 계약·재무 관리"),
    link(IDS["accounting"], "💰 회계 관리"),
    link(IDS["labor"],      "📋 노무 관리"),
    divider(),
])
print("  완료!")

print("\n" + "="*60)
print("  전체 시스템 완성!")
print("="*60)
for k,v in IDS.items(): print(f"  {k:15} | {v}")
