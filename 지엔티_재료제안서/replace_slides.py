"""build_final.js에서 슬라이드 자재 호출 부분을 새 구성으로 교체."""
import io

FILE = r"C:\Users\Administrator\Desktop\JM_클로드\지엔티_재료제안서\build_final.js"

with io.open(FILE, "r", encoding="utf-8") as f:
    lines = f.readlines()

# 시작 라인: "// SLIDE 3 : 벽지 #1 — F15130 시리즈" 가 포함된 라인
# 끝 라인: 도어락 슬라이드의 닫는 `});` (도어락 라벨 다음 2번째 줄)

start_idx = None
end_idx = None
for i, ln in enumerate(lines):
    if start_idx is None and "SLIDE 3 : 벽지" in ln:
        start_idx = i - 1  # 위 구분선 포함
    if start_idx is not None and "// SLIDE : 마무리 페이지" in ln:
        end_idx = i - 1  # 위 빈줄 포함
        break

if start_idx is None or end_idx is None:
    raise Exception(f"start={start_idx}, end={end_idx}")

print(f"교체 범위: line {start_idx+1} ~ line {end_idx}")

NEW_BLOCK = r'''// ═════════════════════════════════════════════
// SLIDE : 벽지 — KCC 신한벽지 (F15128-1 페블스톤)
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "01", category: "벽지", categoryEng: "WALLCOVERING",
  maker: "KCC 신한벽지",
  page: P(),
  slots: [
    { image: "s01-img1.jpg", labels: [T("방염벽지"), S("F15128-1  페블스톤")] },
  ],
});

// ═════════════════════════════════════════════
// SLIDE : 랩핑평판 — 대성몰딩
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "02", category: "랩핑평판", categoryEng: "WRAPPING PANEL",
  maker: "대성몰딩",
  page: P(),
  slots: [
    { image: "s02-img1.jpg", labels: [T("랩핑평판"), S("600 × 2400 × 9T")] },
  ],
});

// ═════════════════════════════════════════════
// SLIDE : 붙박이가구 (하이그로시) — 예림 하이그로시
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "03", category: "붙박이가구  ·  하이그로시", categoryEng: "BUILT-IN  ·  HIGH GLOSSY",
  maker: "예림 하이그로시",
  page: P(),
  slots: [
    { image: "s03-img1.jpg", labels: [T("매트 밀크화이트 · SM-02  /  프렌치 오크 · PW-21"), S("두께 18T")] },
  ],
});

// ═════════════════════════════════════════════
// SLIDE : 붙박이가구 (인조대리석 상판) — 다이몬드 크리스탈
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "03", category: "붙박이가구  ·  인조대리석 상판", categoryEng: "BUILT-IN  ·  COUNTERTOP",
  maker: null,
  page: P(),
  slots: [
    { image: "s04-img1.jpg", labels: [T("다이몬드 크리스탈"), S("두께 12T")] },
  ],
});

// ═════════════════════════════════════════════
// SLIDE : 사무용책상 (덕트형 책상 5구)
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "04", category: "사무용책상", categoryEng: "OFFICE  ·  DESK",
  maker: null,
  page: P(),
  slots: [
    { image: "s05-img1.png", labels: [T("덕트형 책상 5구"), S("1400 × 800 × 720")] },
    { image: "s05-img2.png", labels: [T("배선 매립 덕트"), S("넓은 배선 공간 · 매립형")] },
  ],
});

// ═════════════════════════════════════════════
// SLIDE : 사무용 의자
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "04", category: "사무용 의자", categoryEng: "OFFICE  ·  TASK CHAIR",
  maker: null,
  page: P(),
  slots: [
    { image: "s06-img1.png", labels: [T("사무용 의자"), S("메쉬 / 헤드레스트")] },
  ],
});

// ═════════════════════════════════════════════
// SLIDE : 책상 스크린
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "04", category: "책상 스크린", categoryEng: "OFFICE  ·  DESK SCREEN",
  maker: null,
  page: P(),
  slots: [
    { image: "s07-img1.png", labels: [T("책상 스크린"), S("패브릭 마감")] },
  ],
});

// ═════════════════════════════════════════════
// SLIDE : 회의테이블 (연결회의용탁자)
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "04", category: "회의테이블", categoryEng: "OFFICE  ·  CONFERENCE TABLE",
  maker: null,
  page: P(),
  slots: [
    { image: "s08-img1.png", labels: [T("연결회의용탁자"), S("상석 1400 × 600 × 720 (4EA)  ·  일반 1400 × 600 × 720 (2EA)")] },
  ],
});

// ═════════════════════════════════════════════
// SLIDE : 회의의자 (팔걸이)
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "04", category: "회의의자", categoryEng: "OFFICE  ·  CONFERENCE CHAIR",
  maker: null,
  page: P(),
  slots: [
    { image: "s09-img1.png", labels: [T("회의의자 (팔걸이)"), S("605 × 520 × 850")] },
  ],
});

// ═════════════════════════════════════════════
// SLIDE : 휴게실 테이블
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "04", category: "휴게실 테이블", categoryEng: "OFFICE  ·  LOUNGE TABLE",
  maker: null,
  page: P(),
  slots: [
    { image: "s10-img1.png", labels: [T("휴게실 테이블"), S("지름 700 × 720")] },
  ],
});

// ═════════════════════════════════════════════
// SLIDE : 휴게실 의자
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "04", category: "휴게실 의자", categoryEng: "OFFICE  ·  LOUNGE CHAIR",
  maker: null,
  page: P(),
  slots: [
    { image: "s11-img1.png", labels: [T("휴게실 의자"), S("우드백 / 패브릭")] },
  ],
});

// ═════════════════════════════════════════════
// SLIDE : 철제 캐비넷 (사무용가구 섹션 끝)
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "04", category: "철제 캐비넷", categoryEng: "OFFICE  ·  STEEL CABINET",
  maker: null,
  page: P(),
  slots: [
    { image: "s14-img1.png", labels: [T("AMC-WFR  ·  White"), S("1100 × 540 × 1825  (도어 3개)")] },
  ],
});

// ═════════════════════════════════════════════
// SLIDE : LED 평판조명
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "05", category: "LED 평판조명", categoryEng: "LIGHTING  ·  LED PANEL",
  maker: null,
  page: P(),
  slots: [
    { image: "s12-img1.png", labels: [T("LED 평판조명"), S("천장 매립형")] },
  ],
});

// ═════════════════════════════════════════════
// SLIDE : 빔프로젝트 · 빔스크린 (통합)
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "06", category: "빔프로젝트  ·  빔스크린", categoryEng: "AV  ·  PROJECTOR & SCREEN",
  maker: "EFUN  /  성지",
  page: P(),
  slots: [
    { image: "s13-img1.png", labels: [T("EL-YLK606  ·  성지 울트라 매트 전동 매립 스크린"), S("3LCD LASER 4K UHD · HDR/HLG  /  120\" (2400 × 1800)")] },
  ],
});

// ═════════════════════════════════════════════
// SLIDE : 스피커 · 파워앰프 (AEPEL)
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "06", category: "스피커  ·  파워앰프", categoryEng: "AV  ·  SPEAKER & AMP",
  maker: null,
  page: P(),
  slots: [
    { image: "s15-img1.png", labels: [T("스피커  ·  FA-530N"),    S("5.25인치  ·  70W")] },
    { image: "s15-img2.png", labels: [T("파워앰프  ·  EMA-200N"), S("2CH  ·  200W")] },
  ],
});

// ═════════════════════════════════════════════
// SLIDE : 도어락
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "06", category: "도어락", categoryEng: "APPLIANCE  ·  DOOR LOCK",
  maker: null,
  page: P(),
  slots: [
    { image: "s16-img1.png", labels: [T("도어락"), S("*해당제품 방수커버는 별도 제작 필요")] },
  ],
});

// ═════════════════════════════════════════════
// SLIDE : 블라인드 (NEW)
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "07", category: "블라인드", categoryEng: "WINDOW  ·  BLIND",
  maker: null,
  page: P(),
  slots: [
    { image: "s17-img1.jpg", labels: [T("블라인드"), S("콤비 블라인드")] },
  ],
});

'''

# 교체
new_lines = lines[:start_idx] + [NEW_BLOCK] + lines[end_idx:]

with io.open(FILE, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print(f"교체 완료. 새 라인 수: {len(new_lines)}")
