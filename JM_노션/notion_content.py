import urllib.request
import json

from notion_auth import TOKEN
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

# 이전 rebuild에서 생성된 ID
IDS = {
    "hub":              "376089e9-0a52-8015-ba56-f0837a19d29a",
    "crm":              "376089e9-0a52-8197-8c7d-edbd4e41855c",
    "project":          "376089e9-0a52-8117-9f29-d82739c89408",
    "task":             "376089e9-0a52-810a-928c-c57e5baa6987",
    "partner":          "376089e9-0a52-811f-a34f-e7b4a0c8dcf6",
    "marketing":        "376089e9-0a52-8185-bf3d-f04d32327f61",
    "archive":          "376089e9-0a52-81b4-8b76-d470c38a1921",
    "as":               "376089e9-0a52-81f7-8d55-fd6bf8390db2",
    "estimate_page":    "376089e9-0a52-8111-b14f-d019288d309f",
    "finance_page":     "376089e9-0a52-81a4-8ff0-f8dc7faa893c",
    "accounting_page":  "376089e9-0a52-8165-81c7-fa8583b170ab",
    "labor_page":       "376089e9-0a52-8198-ad95-e976d01df894",
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

def add_blocks(page_id, blocks):
    return api("PATCH", f"/blocks/{page_id}/children", {"children": blocks})

def h1(text):
    return {"object":"block","type":"heading_1","heading_1":{"rich_text":[{"text":{"content":text}}]}}

def h2(text):
    return {"object":"block","type":"heading_2","heading_2":{"rich_text":[{"text":{"content":text}}]}}

def h3(text):
    return {"object":"block","type":"heading_3","heading_3":{"rich_text":[{"text":{"content":text}}]}}

def para(text):
    return {"object":"block","type":"paragraph","paragraph":{"rich_text":[{"text":{"content":text}}]}}

def callout(text, emoji):
    return {"object":"block","type":"callout","callout":{
        "rich_text":[{"text":{"content":text}}],
        "icon":{"type":"emoji","emoji":emoji}}}

def bullet(text, bold=False):
    rt = [{"text":{"content":text},"annotations":{"bold":bold}}]
    return {"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":rt}}

def numbered(text):
    return {"object":"block","type":"numbered_list_item","numbered_list_item":{"rich_text":[{"text":{"content":text}}]}}

def divider():
    return {"object":"block","type":"divider","divider":{}}

def toggle(title, children):
    return {"object":"block","type":"toggle","toggle":{
        "rich_text":[{"text":{"content":title}}],
        "children": children}}

# ============================================================
# 1. 고객 CRM
# ============================================================
print("[ 1/11 ] 고객 CRM 내용 추가...")
add_blocks(IDS["crm"], [
    callout("고객의 첫 문의부터 완공까지 전체 여정을 한 곳에서 관리합니다.", "👥"),
    divider(),
    h2("📋 사용 방법"),
    numbered("새 고객이 문의하면 + 새로 만들기로 고객 추가"),
    numbered("상담상태를 단계별로 업데이트 (첫 문의 → 상담중 → 견적 발송 → 계약 완료)"),
    numbered("유입경로를 꼭 기록 → 어떤 채널이 효과적인지 파악 가능"),
    numbered("계약 완료 시 견적 관리 DB와 연계하여 금액 관리"),
    divider(),
    h2("💡 활용 팁"),
    bullet("상담상태 필터로 '견적 발송' 고객만 모아서 팔로업 관리"),
    bullet("유입경로 통계로 마케팅 효과 측정 가능"),
    bullet("예산규모 미리 파악해두면 견적 준비에 도움"),
    bullet("메모란에 고객 특이사항, 선호 스타일 기록 권장"),
    divider(),
    h2("🔄 고객 상태 흐름"),
    para("첫 문의  →  상담중  →  견적 발송  →  계약 완료  →  진행중  →  완공"),
])
print("  완료!")

# ============================================================
# 2. 프로젝트 관리
# ============================================================
print("[ 2/11 ] 프로젝트 관리 내용 추가...")
add_blocks(IDS["project"], [
    callout("진행 중인 모든 현장의 상태를 한눈에 파악합니다. 계약금액은 별도 페이지(계약·재무)에서 관리됩니다.", "📊"),
    divider(),
    h2("📋 사용 방법"),
    numbered("새 현장 수주 시 + 새로 만들기로 현장 추가"),
    numbered("담당자 지정 및 시작일·완료예정일 입력"),
    numbered("진행상태를 주기적으로 업데이트"),
    numbered("현장 페이지 내부에 일지, 사진, 메모 자유롭게 추가"),
    divider(),
    h2("📌 상태 기준"),
    bullet("계약 전 — 견적 발송했지만 계약 미체결"),
    bullet("진행중 — 계약 완료 후 시공 중"),
    bullet("완료 — 준공 및 잔금 수령 완료"),
    bullet("보류 — 일시 중단 또는 연기"),
    divider(),
    h2("💡 활용 팁"),
    bullet("현장별 페이지 열어서 시공일지, 사진, 메모 정리"),
    bullet("완료예정일 기준으로 정렬하면 일정 관리 편리"),
    bullet("완료된 현장은 현장 아카이브로 사진·도면 이동"),
    divider(),
    toggle("📎 현장 페이지에 추가하면 좋은 것들", [
        bullet("현장 사진 (착공 전 / 시공 중 / 완공)"),
        bullet("고객 요청사항 및 변경사항 기록"),
        bullet("하도급 업체 목록 및 연락처"),
        bullet("자재 발주 현황"),
        bullet("검측 일정 및 결과"),
    ])
])
print("  완료!")

# ============================================================
# 3. 직원 업무 관리
# ============================================================
print("[ 3/11 ] 직원 업무 관리 내용 추가...")
add_blocks(IDS["task"], [
    callout("직원별 업무를 배정하고 진행 상황을 추적합니다. 매일 아침 업무 확인 용도로 활용하세요.", "👷"),
    divider(),
    h2("📋 사용 방법"),
    numbered("대표·이사가 업무 추가 후 담당자 지정"),
    numbered("직원은 본인 업무 확인 후 상태 업데이트 (대기 → 진행중 → 완료)"),
    numbered("마감일 임박 업무는 우선순위 '높음'으로 설정"),
    numbered("완료된 업무는 상태를 '완료'로 변경"),
    divider(),
    h2("📌 우선순위 기준"),
    bullet("높음 🔴 — 당일 또는 내일까지 처리 필요"),
    bullet("보통 🟡 — 이번 주 내 처리"),
    bullet("낮음 🟢 — 여유 있게 처리"),
    divider(),
    h2("💡 활용 팁"),
    bullet("담당자 필터로 직원별 업무량 파악"),
    bullet("카테고리 '현장'으로 필터하면 현장 관련 업무만 모아서 확인"),
    bullet("매주 월요일 팀 미팅 때 이 DB 기준으로 업무 공유 권장"),
    bullet("완료 업무는 주별로 묶어서 성과 확인 가능"),
])
print("  완료!")

# ============================================================
# 4. 협력업체 관리
# ============================================================
print("[ 4/11 ] 협력업체 관리 내용 추가...")
add_blocks(IDS["partner"], [
    callout("자주 거래하는 외주업체·자재업체 정보를 한 곳에서 관리합니다. 급하게 연락할 때 바로 찾을 수 있어요.", "🤝"),
    divider(),
    h2("📋 사용 방법"),
    numbered("거래 업체 추가 시 업종·연락처·평점 필수 입력"),
    numbered("단가표 파일이 있으면 첨부"),
    numbered("거래 경험 후 평점 업데이트"),
    numbered("거래 중단 업체는 상태를 '거래중단'으로 변경 (삭제 대신)"),
    divider(),
    h2("📌 업종 분류"),
    bullet("전기 / 설비·배관 / 타일 / 목공 / 도장"),
    bullet("철거 / 창호 / 가구 / 자재납품"),
    divider(),
    h2("💡 활용 팁"),
    bullet("평점 ★★★★★ 필터로 신뢰 업체만 빠르게 조회"),
    bullet("업종별 필터로 '타일' 업체만 모아서 단가 비교"),
    bullet("계좌정보 여기 저장해두면 세금계산서 발행 시 편리"),
        bullet("각 업체 페이지에 과거 시공 사례, 특이사항 메모 추천"),
    divider(),
    toggle("📝 업체 페이지에 기록하면 좋은 것들", [
        bullet("과거 시공 현장명 및 퀄리티 평가"),
        bullet("특기사항 (잘하는 것 / 못하는 것)"),
        bullet("결제 조건 (현금/카드/어음)"),
        bullet("하자 이력"),
    ])
])
print("  완료!")

# ============================================================
# 5. 마케팅 콘텐츠 관리
# ============================================================
print("[ 5/11 ] 마케팅 내용 추가...")
add_blocks(IDS["marketing"], [
    callout("블로그·인스타·유튜브 콘텐츠를 계획하고 발행 이력을 관리합니다. 외부 업체에 의뢰할 때도 여기서 진행 상황을 확인하세요.", "📣"),
    divider(),
    h2("📋 사용 방법"),
    numbered("콘텐츠 기획 시 제목·채널·발행예정일 입력"),
    numbered("현장 아카이브의 사진을 참고해서 어떤 현장 올릴지 결정"),
    numbered("외부 업체 의뢰 시 담당을 '외부업체'로 설정"),
    numbered("발행 완료 후 링크 입력 및 상태 '발행완료'로 변경"),
    divider(),
    h2("📌 채널별 특성"),
    bullet("네이버 블로그 — 검색 유입 핵심 (현장 소개, 시공사례)"),
    bullet("인스타그램 — 비주얼 중심 (완공 사진, 분위기 컷)"),
    bullet("유튜브 — 시공 과정 영상, 인테리어 팁"),
    bullet("카카오채널 — 기존 고객 리텐션, 이벤트 안내"),
    divider(),
    h2("💡 활용 팁"),
    bullet("주 3회 발행 목표 — 월(블로그) / 수(인스타) / 금(블로그)"),
    bullet("현장 아카이브에서 '마케팅활용 ✅' 체크된 현장 우선 활용"),
    bullet("발행예정일 캘린더 뷰로 보면 스케줄 관리 편리"),
    bullet("외부업체 의뢰 시 현장 아카이브 링크 공유하면 자료 전달 편리"),
    divider(),
    h2("🗓️ 권장 콘텐츠 계획"),
    bullet("현장 디자인편 — 인테리어 콘셉트 및 도면 소개"),
    bullet("현장 시공편 — 착공~시공 과정"),
    bullet("현장 마감편 — 완공 사진 및 총 리뷰"),
])
print("  완료!")

# ============================================================
# 6. 현장 아카이브
# ============================================================
print("[ 6/11 ] 현장 아카이브 내용 추가...")
add_blocks(IDS["archive"], [
    callout("완공된 현장의 사진·도면을 체계적으로 보관합니다. 마케팅 자료 및 포트폴리오로 활용됩니다.", "🏗️"),
    divider(),
    h2("📋 사용 방법"),
    numbered("현장 완공 후 바로 아카이브에 추가"),
    numbered("마감사진·시공사진·도면 파일 첨부"),
    numbered("스타일태그 설정 (모던, 미니멀, 상업공간 등)"),
    numbered("마케팅에 쓸 현장은 '마케팅활용' 체크박스 ✅ 표시"),
    divider(),
    h2("📸 사진 분류 기준"),
    bullet("마감사진 — 완공 후 전체·포인트 컷 (마케팅 메인 사진)"),
    bullet("시공사진 — 철거·골조·마감 각 단계별 과정 사진"),
    bullet("도면 — 평면도·천장도·입면도 등 설계 파일"),
    divider(),
    h2("💡 활용 팁"),
    bullet("스타일태그 필터로 '모던' 현장만 모아서 포트폴리오 제작 가능"),
    bullet("마케팅활용 ✅ 필터로 블로그·인스타에 올릴 현장만 빠르게 조회"),
    bullet("외부 마케팅 업체에 이 DB 링크 공유하면 자료 전달 불필요"),
    bullet("공종·완공년도 필터 조합으로 원하는 레퍼런스 즉시 검색"),
    divider(),
    toggle("📂 각 현장 페이지에 추가 권장 사항", [
        bullet("Before / After 비교 사진"),
        bullet("고객 후기 (허락 받은 경우)"),
        bullet("사용된 주요 자재·브랜드"),
        bullet("시공 면적 및 기간"),
        bullet("특이사항 및 시공 포인트"),
    ])
])
print("  완료!")

# ============================================================
# 7. A/S 관리
# ============================================================
print("[ 7/11 ] A/S 관리 내용 추가...")
add_blocks(IDS["as"], [
    callout("완공 후 하자보수 및 AS 요청을 빠짐없이 기록하고 처리합니다. 분쟁 예방과 고객 신뢰 유지에 핵심입니다.", "🔧"),
    divider(),
    h2("📋 사용 방법"),
    numbered("AS 접수 즉시 내용·고객연락처·접수일 입력"),
    numbered("담당자 지정 후 처리예정일 설정"),
    numbered("처리 완료 후 처리내용 기록 및 상태 '처리완료' 변경"),
    numbered("비용이 발생한 경우 체크박스 표시 및 금액 입력"),
    divider(),
    h2("📌 AS 유형 기준"),
    bullet("하자보수 — 시공 불량으로 인한 수리 (무상)"),
    bullet("단순AS — 사용법 안내, 소모품 교체 등"),
    bullet("추가공사 — 고객 요청 추가 작업 (유상)"),
    bullet("민원 — 분쟁 또는 불만 사항"),
    divider(),
    h2("💡 활용 팁"),
    bullet("접수상태 '접수·처리중' 필터로 미처리 AS만 모아서 관리"),
    bullet("현장명으로 필터하면 특정 현장의 AS 이력 전체 조회"),
    bullet("하자보수가 반복되는 현장은 협력업체 평점 하향 조정"),
    bullet("처리내용 상세히 기록 → 유사 상황 재발 시 참고"),
    divider(),
    callout("처리완료 전까지 반드시 상태를 관리하세요. 접수 후 연락 없으면 고객 불만으로 이어집니다.", "⚠️"),
])
print("  완료!")

# ============================================================
# 8. 견적 관리 (대표·이사 전용)
# ============================================================
print("[ 8/11 ] 견적 관리 내용 추가...")
add_blocks(IDS["estimate_page"], [
    callout("모든 견적 발송 이력을 기록합니다. 낙찰률과 미성사 사유를 분석해 영업 전략을 개선하세요.", "📝"),
    divider(),
    h2("📋 사용 방법"),
    numbered("견적서 발송 시 현장명·고객명·견적금액·견적일 입력"),
    numbered("견적서 파일 첨부 (PDF 권장)"),
    numbered("결과에 따라 상태 업데이트"),
    numbered("미성사 시 사유 반드시 기록 → 패턴 파악 가능"),
    divider(),
    h2("📌 견적 상태 흐름"),
    para("작성중  →  발송완료  →  협의중  →  계약성사 / 미성사"),
    divider(),
    h2("💡 활용 팁"),
    bullet("월별로 필터해서 견적 건수 vs 계약 건수 비교 → 낙찰률 계산"),
    bullet("미성사 사유 분류: 가격/일정/다른업체선택/연락두절"),
    bullet("견적금액 범위별로 낙찰률 차이 분석"),
    bullet("유효기간 설정으로 오래된 견적 자동 관리"),
])
print("  완료!")

# ============================================================
# 9. 계약·재무 관리 (대표·이사 전용)
# ============================================================
print("[ 9/11 ] 계약·재무 관리 내용 추가...")
add_blocks(IDS["finance_page"], [
    callout("현장별 계약금액 및 입금 현황을 관리합니다. 미수금을 놓치지 않도록 주기적으로 확인하세요.", "🔒"),
    divider(),
    h2("📋 사용 방법"),
    numbered("계약 체결 시 현장명·계약금액·계약금·중도금·잔금 입력"),
    numbered("각 단계 입금 확인 시 입금상태 업데이트"),
    numbered("미수금 발생 시 상태를 '미수금'으로 변경 후 팔로업"),
    numbered("예상 마진 계산해서 입력 (계약금액 - 예상원가)"),
    divider(),
    h2("📌 입금 단계"),
    bullet("계약금 — 계약 체결 시 (보통 계약금액의 10~30%)"),
    bullet("중도금 — 공사 중간 (계약에 따라 상이)"),
    bullet("잔금 — 준공 후 최종 수령"),
    divider(),
    h2("💡 활용 팁"),
    bullet("입금상태 '미수금' 필터로 받아야 할 돈 즉시 파악"),
    bullet("매월 말 전체 현장 계약금액 합계 → 매출 목표 대비 확인"),
    bullet("예상 마진 vs 실제 지출(회계DB) 비교로 수익성 분석"),
        bullet("잔금 미수 현장은 완료예정일 지나도 '완료' 처리 금지"),
])
print("  완료!")

# ============================================================
# 10. 회계 관리 (대표·이사 전용)
# ============================================================
print("[ 10/11 ] 회계 관리 내용 추가...")
add_blocks(IDS["accounting_page"], [
    callout("회사의 모든 수입과 지출을 기록합니다. 증빙 서류는 반드시 첨부해두세요.", "💰"),
    divider(),
    h2("📋 사용 방법"),
    numbered("수입·지출 발생 즉시 내용·금액·날짜 입력"),
    numbered("카테고리 정확히 분류 (자재비/인건비/외주비 등)"),
    numbered("영수증·세금계산서 파일 첨부"),
    numbered("현장명 입력 → 현장별 원가 집계 가능"),
    divider(),
    h2("📌 카테고리 기준"),
    bullet("공사대금 — 고객으로부터 받은 수입"),
    bullet("자재비 — 타일·목재·도장재 등 직접 구매"),
    bullet("인건비 — 직원 급여, 일용직 노무비"),
    bullet("외주비 — 하도급 협력업체 지급"),
    bullet("운영비 — 사무실 임대료, 차량, 통신비 등"),
    divider(),
    h2("💡 활용 팁"),
    bullet("구분 '수입' 필터 합계 → 이달 매출 확인"),
    bullet("구분 '지출' 필터 합계 → 이달 지출 확인"),
    bullet("현장명 + 지출 필터 → 현장별 원가 파악"),
    bullet("월별 정리 후 세무사에게 자료 전달 시 내보내기 활용"),
    divider(),
    callout("증빙 없는 지출은 세무 리스크가 있습니다. 영수증·세금계산서를 반드시 첨부하세요.", "⚠️"),
])
print("  완료!")

# ============================================================
# 11. 노무 관리 (대표·이사 전용)
# ============================================================
print("[ 11/11 ] 노무 관리 내용 추가...")
add_blocks(IDS["labor_page"], [
    callout("직원 정보와 근태를 관리합니다. 계약서, 급여 내역 등 중요 서류는 모두 여기 보관하세요.", "📋"),
    divider(),
    h2("👤 직원 정보 DB"),
    bullet("직원 입사 시 정보 등록 및 계약서 파일 첨부"),
    bullet("기본급 변경 시 즉시 업데이트"),
    bullet("퇴사 직원은 삭제 말고 메모에 '퇴사일' 기록 후 보관"),
    divider(),
    h2("🕐 근태 기록 DB"),
    numbered("매일 출퇴근 시간 기록 (직원이 직접 입력 or 대표 입력)"),
    numbered("연차·반차 사용 시 근무유형 변경"),
    numbered("월말에 월간 근태 현황 확인 후 급여 계산"),
    divider(),
    h2("💡 활용 팁"),
    bullet("근무유형 '연차' 필터로 월별 연차 사용 현황 파악"),
    bullet("직원명 필터로 개인별 근태 이력 조회"),
    bullet("계약서·재직증명서 파일 이 DB에 첨부 → 분실 방지"),
    bullet("4대보험 가입 내역도 직원 페이지에 메모 권장"),
    divider(),
    h2("📌 관련 법규 주의사항"),
    bullet("연차: 1년 미만 매월 1일 발생, 1년 이상 15일"),
    bullet("주휴수당: 주 15시간 이상 근무 시 발생"),
    bullet("근로계약서: 입사 후 즉시 작성·교부 의무"),
    callout("노무 관련 분쟁 예방을 위해 근태 기록은 꼭 보관하세요. 알찬급여 프로그램과 함께 사용하면 더 효율적입니다.", "⚠️"),
])
print("  완료!")

print("")
print("=" * 55)
print("  모든 항목 내용 추가 완료!")
print("=" * 55)

