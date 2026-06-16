// 지엔티 재료제안서 PPTX 템플릿 v2
// 참조 PPT (재료 정리.pptx) 14장 구조 반영 — 미니멀 빈칸 양식

const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";   // 10" x 5.625"
pres.title = "지엔티 재료제안서";
pres.author = "JM";

// ─────────────────────────────────────────────
// 색상 (미니멀 — 거의 흑백)
// ─────────────────────────────────────────────
const C = {
  ink:       "1A1A1A",
  inkSub:    "555555",
  inkMute:   "888888",
  hint:      "B5B5B5",   // 빈칸 회색 hint
  line:      "DDDDDD",
  boxBg:     "F7F7F5",   // 이미지 자리 옅은 회색
  boxLn:     "BBBBBB",   // 이미지 자리 점선
  accent:    "8A7D63",   // 작은 액센트(타이틀 콜론 옆 점)
  white:     "FFFFFF",
};

const FONT = "Malgun Gothic";

// ─────────────────────────────────────────────
// 헤더: 좌측 상단 "카테고리 : 제조사" 표기
// ─────────────────────────────────────────────
function addHeader(slide, categoryHint, makerHint) {
  // "[카테고리]" 진한 텍스트
  slide.addText(categoryHint, {
    x: 0.5, y: 0.42, w: 3, h: 0.35,
    fontFace: FONT, fontSize: 14, color: C.ink, bold: true,
    margin: 0, valign: "middle",
  });
  // 콜론
  slide.addText(":", {
    x: 0.5, y: 0.42, w: 4, h: 0.35,
    fontFace: FONT, fontSize: 14, color: C.inkMute, bold: true,
    margin: 0, valign: "middle",
    align: "left",
  });
  // 콜론과 회사명 영역을 잘 분리하기 위해 별도 텍스트로 처리
  // 위의 콜론 텍스트는 사실상 카테고리 텍스트와 겹쳐 안 좋음 → 다시 작성
}

// 위 함수는 너무 복잡 — 새로 단순화한 헤더로 교체
function addHeaderV2(slide, category, maker, opts = {}) {
  // 한 줄에 "벽지 : KCC 신한벽지" 형태
  // 카테고리는 진한색, 회사명은 옅은 회색(빈칸일 때 hint)
  const arr = [
    { text: category || "카테고리", options: {
        color: category ? C.ink : C.hint,
        italic: !category, bold: !!category,
      }
    },
    { text: "  :  ", options: { color: C.inkMute } },
    { text: maker || "제조사 / 시리즈명을 입력하세요", options: {
        color: maker ? C.inkSub : C.hint,
        italic: !maker,
      }
    },
  ];
  slide.addText(arr, {
    x: 0.5, y: 0.4, w: 9, h: 0.4,
    fontFace: FONT, fontSize: 14,
    margin: 0, valign: "middle",
  });
  // 짧은 액센트
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.85, w: 0.4, h: 0.03,
    fill: { color: C.accent }, line: { color: C.accent, width: 0 },
  });
}

// ─────────────────────────────────────────────
// 푸터: 페이지번호 + 회사 약식
// ─────────────────────────────────────────────
function addFooter(slide, page, total) {
  slide.addShape(pres.shapes.LINE, {
    x: 0.5, y: 5.25, w: 9.0, h: 0,
    line: { color: C.line, width: 0.5 },
  });
  slide.addText("JM INTERIOR  ·  지엔티 재료제안서", {
    x: 0.5, y: 5.32, w: 6, h: 0.22,
    fontFace: FONT, fontSize: 8, color: C.inkMute,
    charSpacing: 2, margin: 0,
  });
  slide.addText(`${String(page).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, {
    x: 7.5, y: 5.32, w: 2, h: 0.22,
    fontFace: FONT, fontSize: 8, color: C.inkMute,
    align: "right", charSpacing: 2, margin: 0,
  });
}

// ─────────────────────────────────────────────
// 제품 슬롯: 이미지 + 라벨 (kind / model / size)
// ─────────────────────────────────────────────
function addSlot(slide, x, y, w, h, opts = {}) {
  // 라벨 영역 높이
  const labelLines = opts.labels || 2;          // 2 또는 3 라인
  const labelH = 0.28 * labelLines + 0.10;       // 패딩 포함
  const imgH = h - labelH;

  // 이미지 영역 (점선 박스)
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h: imgH,
    fill: { color: C.boxBg },
    line: { color: C.boxLn, width: 0.75, dashType: "dash" },
  });
  // 가운데 안내
  slide.addText("이미지 영역", {
    x, y: y + imgH/2 - 0.22, w, h: 0.3,
    fontFace: FONT, fontSize: 11, color: C.hint, italic: true,
    align: "center", margin: 0,
  });
  slide.addText("(사진 / 컬러칩 삽입)", {
    x, y: y + imgH/2 + 0.05, w, h: 0.25,
    fontFace: FONT, fontSize: 8, color: C.hint, italic: true,
    align: "center", margin: 0,
  });

  // 라벨들 (이미지 아래)
  const labels = opts.labelTexts || ["종류 입력", "모델명 입력"];
  let ly = y + imgH + 0.10;
  labels.forEach((txt, i) => {
    const isTitle = i === 0;
    slide.addText(txt, {
      x, y: ly, w, h: 0.28,
      fontFace: FONT, fontSize: isTitle ? 10 : 10,
      color: C.hint, italic: true,
      align: opts.align || "center",
      margin: 0,
    });
    ly += 0.28;
  });
}

// ─────────────────────────────────────────────
// 슬라이드 빌더: N개 슬롯 그리드 자동 배치
// ─────────────────────────────────────────────
function buildSlide({ category, maker, page, total, slotCount, slotLabels, customLabels }) {
  const s = pres.addSlide();
  s.background = { color: C.white };

  addHeaderV2(s, category, maker);

  // 슬롯 영역: y=1.10 ~ 5.10 (h=4.0)
  const areaX = 0.5, areaY = 1.10, areaW = 9.0, areaH = 4.0;

  // 슬롯 폭/간격 계산
  let cols = slotCount;
  let gap = 0.4;
  if (slotCount === 1) { cols = 1; gap = 0; }
  if (slotCount === 2) { cols = 2; gap = 0.6; }
  if (slotCount === 3) { cols = 3; gap = 0.4; }
  if (slotCount === 4) { cols = 4; gap = 0.3; }

  const slotW = (areaW - gap * (cols - 1)) / cols;
  // 슬롯 높이: 라벨 줄 수에 따라
  const lines = slotLabels || 2;
  const slotH = areaH * 0.92;

  for (let i = 0; i < slotCount; i++) {
    const x = areaX + i * (slotW + gap);
    const labels = (customLabels && customLabels[i]) || undefined;
    addSlot(s, x, areaY, slotW, slotH, {
      labels: lines,
      labelTexts: labels,
    });
  }

  if (page && total) addFooter(s, page, total);
  return s;
}

// 슬라이드 페어 빌더 (예: 하이그로시 색상+텍스처 매칭)
function buildPairSlide({ category, maker, page, total, pairCount }) {
  const s = pres.addSlide();
  s.background = { color: C.white };
  addHeaderV2(s, category, maker);

  // 페어 영역
  const areaY = 1.20;
  const rowH = (4.0 - 0.3) / pairCount;  // 각 페어 행 높이
  const pairW = 8.5;
  const pairX = (10 - pairW) / 2;

  for (let p = 0; p < pairCount; p++) {
    const y = areaY + p * (rowH + 0.15);
    const slotW = (pairW - 0.6) / 2;   // 두 슬롯 + 가운데 + 표시

    // 왼쪽 슬롯
    addSlot(s, pairX, y, slotW, rowH, { labels: 2 });
    // 가운데 + 기호
    s.addText("+", {
      x: pairX + slotW, y: y + rowH/2 - 0.3, w: 0.6, h: 0.6,
      fontFace: FONT, fontSize: 24, color: C.accent, bold: true,
      align: "center", valign: "middle", margin: 0,
    });
    // 오른쪽 슬롯
    addSlot(s, pairX + slotW + 0.6, y, slotW, rowH, { labels: 2 });
  }

  if (page && total) addFooter(s, page, total);
  return s;
}

const TOTAL = 14;

// ═════════════════════════════════════════════
// SLIDE 1 : 벽지 (3 슬롯)
// ═════════════════════════════════════════════
buildSlide({
  category: "벽지", maker: "예) KCC / 신한벽지 / LX하우시스 등",
  page: 1, total: TOTAL, slotCount: 3, slotLabels: 2,
});

// ═════════════════════════════════════════════
// SLIDE 2 : 벽지 (2 슬롯)
// ═════════════════════════════════════════════
buildSlide({
  category: "벽지", maker: "예) KCC / 신한벽지 / LX하우시스 등",
  page: 2, total: TOTAL, slotCount: 2, slotLabels: 2,
});

// ═════════════════════════════════════════════
// SLIDE 3 : 알판 / 래핑평판 (3 슬롯)
// ═════════════════════════════════════════════
buildSlide({
  category: "알판 (래핑평판)", maker: "예) 대성몰딩 / LX하우시스 / 한솔홈데코",
  page: 3, total: TOTAL, slotCount: 3, slotLabels: 2,
});

// ═════════════════════════════════════════════
// SLIDE 4 : 붙박이가구 - 하이그로시 (색상 페어 2조)
// ═════════════════════════════════════════════
buildPairSlide({
  category: "붙박이가구", maker: "예) 예림 하이그로시",
  page: 4, total: TOTAL, pairCount: 2,
});

// ═════════════════════════════════════════════
// SLIDE 5 : 붙박이가구 - 인조대리석 상판 (3 슬롯)
// ═════════════════════════════════════════════
buildSlide({
  category: "붙박이가구  ·  인조대리석 상판", maker: "예) LG칸스톤 / 한화칸스톤 / 현대L&C",
  page: 5, total: TOTAL, slotCount: 3, slotLabels: 2,
});

// ═════════════════════════════════════════════
// SLIDE 6 : 사무용책상 (3 슬롯, 사이즈 포함)
// ═════════════════════════════════════════════
buildSlide({
  category: "사무용책상", maker: "예) 퍼시스 / 코아스 / 한샘",
  page: 6, total: TOTAL, slotCount: 3, slotLabels: 3,
  customLabels: [
    ["품명 입력 (예: 덕트형 책상 5구)", "모델명 입력", "사이즈 입력 (예: 1400*800*720)"],
    ["품명 입력", "모델명 입력", "사이즈 입력"],
    ["품명 입력", "모델명 입력", "사이즈 입력"],
  ],
});

// ═════════════════════════════════════════════
// SLIDE 7 : 3단 이동서랍 (2 슬롯)
// ═════════════════════════════════════════════
buildSlide({
  category: "3단 이동서랍", maker: "제조사 / 시리즈명",
  page: 7, total: TOTAL, slotCount: 2, slotLabels: 3,
  customLabels: [
    ["품명 입력 (예: 3단 이동서랍)", "모델명 입력", "사이즈 입력"],
    ["품명 입력", "모델명 입력", "사이즈 입력"],
  ],
});

// ═════════════════════════════════════════════
// SLIDE 8 : 사무용 의자 (2 슬롯)
// ═════════════════════════════════════════════
buildSlide({
  category: "사무용 의자", maker: "예) 시디즈 / 퍼시스",
  page: 8, total: TOTAL, slotCount: 2, slotLabels: 3,
  customLabels: [
    ["품명 입력", "모델명 입력", "사양 입력 (메쉬 / 헤드레스트 등)"],
    ["품명 입력", "모델명 입력", "사양 입력"],
  ],
});

// ═════════════════════════════════════════════
// SLIDE 9 : 파티션 / 스크린 (2 슬롯)
// ═════════════════════════════════════════════
buildSlide({
  category: "파티션 / 책상 스크린", maker: "제조사 / 시리즈명",
  page: 9, total: TOTAL, slotCount: 2, slotLabels: 3,
  customLabels: [
    ["품명 입력 (예: 자립형 파티션)", "모델명 입력", "사이즈 입력"],
    ["품명 입력 (예: 책상 스크린)", "모델명 입력", "사이즈 입력"],
  ],
});

// ═════════════════════════════════════════════
// SLIDE 10 : 회의테이블 (2 슬롯, 사양 포함)
// ═════════════════════════════════════════════
buildSlide({
  category: "회의테이블", maker: "제조사 / 시리즈명",
  page: 10, total: TOTAL, slotCount: 2, slotLabels: 3,
  customLabels: [
    ["품명 입력 (예: 덕트형 회의테이블)", "모델명 입력", "사이즈 / 사양 입력 (예: 4000*1200*715, 4구 2LAN)"],
    ["품명 입력", "모델명 입력", "사이즈 / 사양 입력"],
  ],
});

// ═════════════════════════════════════════════
// SLIDE 11 : 회의의자 (2 슬롯)
// ═════════════════════════════════════════════
buildSlide({
  category: "회의의자 (팔걸이)", maker: "제조사 / 시리즈명",
  page: 11, total: TOTAL, slotCount: 2, slotLabels: 3,
  customLabels: [
    ["품명 입력", "모델명 입력", "사이즈 입력 (예: 605*520*850)"],
    ["품명 입력", "모델명 입력", "사이즈 입력"],
  ],
});

// ═════════════════════════════════════════════
// SLIDE 12 : 휴게실 테이블 (2 슬롯)
// ═════════════════════════════════════════════
buildSlide({
  category: "휴게실 테이블", maker: "제조사 / 시리즈명",
  page: 12, total: TOTAL, slotCount: 2, slotLabels: 3,
  customLabels: [
    ["품명 입력", "모델명 입력", "사이즈 입력 (예: 지름 700 * 720)"],
    ["품명 입력", "모델명 입력", "사이즈 입력"],
  ],
});

// ═════════════════════════════════════════════
// SLIDE 13 : 휴게/카페 의자 (2 슬롯)
// ═════════════════════════════════════════════
buildSlide({
  category: "휴게실 의자", maker: "제조사 / 시리즈명",
  page: 13, total: TOTAL, slotCount: 2, slotLabels: 3,
  customLabels: [
    ["품명 입력", "모델명 입력", "재질 / 컬러 입력"],
    ["품명 입력", "모델명 입력", "재질 / 컬러 입력"],
  ],
});

// ═════════════════════════════════════════════
// SLIDE 14 : LED 평판조명 (1 슬롯, 큰 이미지)
// ═════════════════════════════════════════════
buildSlide({
  category: "LED 평판조명", maker: "제조사 / 시리즈명",
  page: 14, total: TOTAL, slotCount: 1, slotLabels: 3,
  customLabels: [
    ["품명 입력 (예: LED 평판조명)", "모델명 입력", "사이즈 / W / 색온도 입력"],
  ],
});

// ─────────────────────────────────────────────
// 저장
// ─────────────────────────────────────────────
pres.writeFile({
  fileName: "C:/Users/Administrator/Desktop/JM_클로드/지엔티_재료제안서/지엔티_재료제안서_템플릿_v2.pptx"
}).then(fileName => {
  console.log("Saved:", fileName);
});
