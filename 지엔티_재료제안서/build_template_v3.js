// 지엔티 마감재제안서 PPTX v3 (조합본)
// v1 디자인(표지·목차·문의·웜브라운 톤) + v2 콘텐츠 흐름(참조 PPT 14자재) 결합

const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";   // 10" x 5.625"
pres.title = "지엔티 마감재제안서";
pres.author = "JM";

// ─────────────────────────────────────────────
// 컬러 (Warm Interior Neutral)
// ─────────────────────────────────────────────
const C = {
  ink:       "1F1F1F",
  inkSub:    "555555",
  inkMute:   "888888",
  brown:     "8A7D63",
  brownDk:   "4A4030",
  beige:     "C2B393",
  cream:     "F7F5F1",
  panel:     "F0EBE0",
  line:      "D8D2C5",
  hint:      "B5AE9E",
  imgBox:    "EFEAE0",
  imgLine:   "BBB39E",
  white:     "FFFFFF",
};

const FONT = "Malgun Gothic";
const TOTAL = 17;

// ═════════════════════════════════════════════
// 공통 유틸
// ═════════════════════════════════════════════
function addFooter(slide, page) {
  slide.addShape(pres.shapes.LINE, {
    x: 0.5, y: 5.25, w: 9.0, h: 0,
    line: { color: C.line, width: 0.5 },
  });
  slide.addText("JM INTERIOR  ·  지엔티 마감재제안서", {
    x: 0.5, y: 5.32, w: 6, h: 0.22,
    fontFace: FONT, fontSize: 8, color: C.inkMute,
    charSpacing: 2, margin: 0,
  });
  slide.addText(`${String(page).padStart(2,"0")} / ${String(TOTAL).padStart(2,"0")}`, {
    x: 7.5, y: 5.32, w: 2, h: 0.22,
    fontFace: FONT, fontSize: 8, color: C.inkMute,
    align: "right", charSpacing: 2, margin: 0,
  });
}

// 콘텐츠 슬라이드 헤더 — 카테고리/제조사 + 섹션 번호 + 영문 라벨
function addContentHeader(slide, opts) {
  const { sectionNo, category, categoryEng, maker } = opts;

  // 좌측: 섹션 번호 (작은 원)
  slide.addShape(pres.shapes.OVAL, {
    x: 0.5, y: 0.42, w: 0.40, h: 0.40,
    fill: { color: C.brown }, line: { color: C.brown, width: 0 },
  });
  slide.addText(sectionNo, {
    x: 0.5, y: 0.42, w: 0.40, h: 0.40,
    fontFace: FONT, fontSize: 10, color: C.white, bold: true,
    align: "center", valign: "middle", margin: 0,
  });

  // 영문 라벨 (작은 글씨)
  slide.addText(categoryEng, {
    x: 1.05, y: 0.36, w: 6, h: 0.22,
    fontFace: FONT, fontSize: 9, color: C.brown, bold: true,
    charSpacing: 4, margin: 0,
  });

  // 카테고리 + 콜론 + 제조사 (한 줄)
  slide.addText([
    { text: category, options: { color: C.ink, bold: true } },
    { text: "  :  ", options: { color: C.inkMute, bold: false } },
    { text: maker, options: {
        color: C.hint, italic: true, bold: false,
      }
    },
  ], {
    x: 1.05, y: 0.58, w: 8.5, h: 0.38,
    fontFace: FONT, fontSize: 18,
    margin: 0, valign: "top",
  });

  // 액센트 라인
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.08, w: 0.4, h: 0.03,
    fill: { color: C.brown }, line: { color: C.brown, width: 0 },
  });
}

// ─────────────────────────────────────────────
// 제품 슬롯: 이미지 박스 + 라벨
// ─────────────────────────────────────────────
function addSlot(slide, x, y, w, h, labels) {
  // 라벨 영역 (이미지 아래 라인 수에 따라 가변)
  const labelLines = labels.length;
  const labelH = 0.30 * labelLines + 0.12;
  const imgH = h - labelH;

  // 이미지 점선 박스 (베이지 톤)
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h: imgH,
    fill: { color: C.imgBox },
    line: { color: C.imgLine, width: 0.75, dashType: "dash" },
  });
  // 안내
  slide.addText("이미지 영역", {
    x, y: y + imgH/2 - 0.25, w, h: 0.32,
    fontFace: FONT, fontSize: 12, color: C.brownDk, italic: true,
    align: "center", margin: 0,
  });
  slide.addText("(사진 / 컬러칩 삽입)", {
    x, y: y + imgH/2 + 0.05, w, h: 0.25,
    fontFace: FONT, fontSize: 8.5, color: C.inkMute, italic: true,
    align: "center", margin: 0,
  });

  // 라벨들
  let ly = y + imgH + 0.10;
  labels.forEach((txt, i) => {
    const isFirst = i === 0;
    slide.addText(txt, {
      x, y: ly, w, h: 0.28,
      fontFace: FONT,
      fontSize: isFirst ? 10.5 : 10,
      color: isFirst ? C.inkSub : C.hint,
      italic: true,
      bold: isFirst,
      align: "center",
      margin: 0,
    });
    ly += 0.30;
  });
}

// ─────────────────────────────────────────────
// 콘텐츠 슬라이드 빌더: N개 슬롯 자동 배치
// ─────────────────────────────────────────────
function buildContent(opts) {
  const s = pres.addSlide();
  s.background = { color: C.white };

  addContentHeader(s, opts);

  const slots = opts.slots;
  const n = slots.length;

  // 그리드 영역: y=1.30 ~ 5.10 (h=3.80)
  const areaX = 0.5, areaY = 1.30, areaW = 9.0, areaH = 3.80;

  let gap;
  if (n === 1) gap = 0;
  else if (n === 2) gap = 0.6;
  else if (n === 3) gap = 0.4;
  else gap = 0.3;

  const slotW = (areaW - gap * (n - 1)) / n;
  const slotH = areaH;

  slots.forEach((labels, i) => {
    const x = areaX + i * (slotW + gap);
    addSlot(s, x, areaY, slotW, slotH, labels);
  });

  addFooter(s, opts.page);
  return s;
}

// 페어 슬라이드 (붙박이가구 하이그로시: 색상 + 텍스처 매칭)
function buildPairSlide(opts) {
  const s = pres.addSlide();
  s.background = { color: C.white };

  addContentHeader(s, opts);

  const pairCount = opts.pairCount || 2;
  const areaY = 1.30, areaH = 3.80;
  const rowGap = 0.18;
  const rowH = (areaH - rowGap * (pairCount - 1)) / pairCount;
  const pairW = 9.0;
  const pairX = 0.5;
  const plusW = 0.5;
  const slotW = (pairW - plusW) / 2;

  for (let p = 0; p < pairCount; p++) {
    const y = areaY + p * (rowH + rowGap);

    addSlot(s, pairX, y, slotW, rowH, ["종류 입력", "모델명 입력"]);
    s.addText("+", {
      x: pairX + slotW, y: y + rowH/2 - 0.3, w: plusW, h: 0.6,
      fontFace: FONT, fontSize: 22, color: C.brown, bold: true,
      align: "center", valign: "middle", margin: 0,
    });
    addSlot(s, pairX + slotW + plusW, y, slotW, rowH, ["종류 입력", "모델명 입력"]);
  }

  addFooter(s, opts.page);
  return s;
}

// ═════════════════════════════════════════════
// SLIDE 1 : 표지
// ═════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.cream };

  // 좌측 다크 블록
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 3.5, h: 5.625,
    fill: { color: C.brownDk }, line: { color: C.brownDk, width: 0 },
  });

  s.addText("MATERIAL\nPROPOSAL", {
    x: 0.5, y: 0.6, w: 3, h: 1.0,
    fontFace: FONT, fontSize: 11, color: C.beige, bold: true,
    charSpacing: 6, lineSpacingMultiple: 1.4,
  });

  s.addText("Interior\nMaterial\nReference", {
    x: 0.5, y: 3.4, w: 3, h: 1.6,
    fontFace: FONT, fontSize: 22, color: C.white, italic: true,
    lineSpacingMultiple: 1.15,
  });

  // 우측 액센트 라인
  s.addShape(pres.shapes.RECTANGLE, {
    x: 4.3, y: 1.0, w: 0.6, h: 0.04,
    fill: { color: C.brown }, line: { color: C.brown, width: 0 },
  });

  s.addText("마감재 제안서", {
    x: 4.3, y: 1.25, w: 5.5, h: 1.0,
    fontFace: FONT, fontSize: 44, color: C.ink, bold: true,
    margin: 0,
  });

  s.addText("벽지 · 알판 · 붙박이가구 · 사무용가구 · 조명", {
    x: 4.3, y: 2.25, w: 5.5, h: 0.4,
    fontFace: FONT, fontSize: 12, color: C.brownDk,
    charSpacing: 2, margin: 0,
  });

  // 구분선
  s.addShape(pres.shapes.LINE, {
    x: 4.3, y: 3.1, w: 4.5, h: 0,
    line: { color: C.line, width: 0.75 },
  });

  // 메타 (빈칸)
  const metaY = 3.35;
  const lbl = { fontFace: FONT, fontSize: 9, color: C.brown, bold: true, charSpacing: 3, margin: 0 };
  const val = { fontFace: FONT, fontSize: 11, color: C.hint, italic: true, margin: 0 };

  s.addText("CLIENT",  { x: 4.3, y: metaY,        w: 2, h: 0.25, ...lbl });
  s.addText("고객사명을 입력하세요", { x: 4.3, y: metaY + 0.25, w: 5, h: 0.3, ...val });

  s.addText("SCOPE",   { x: 4.3, y: metaY + 0.70, w: 2, h: 0.25, ...lbl });
  s.addText("사무공간 인테리어 자재 제안", { x: 4.3, y: metaY + 0.95, w: 5, h: 0.3, ...val });

  s.addText("ISSUED",  { x: 4.3, y: metaY + 1.40, w: 2, h: 0.25, ...lbl });
  s.addText("YYYY. MM. DD", { x: 4.3, y: metaY + 1.65, w: 5, h: 0.3, ...val });

  s.addText("JM INTERIOR", {
    x: 4.3, y: 5.20, w: 5, h: 0.3,
    fontFace: FONT, fontSize: 9, color: C.brown, bold: true, charSpacing: 5,
  });
}

// ═════════════════════════════════════════════
// SLIDE 2 : 목차
// ═════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };

  // 상단 태그
  s.addText("INDEX", {
    x: 0.5, y: 0.42, w: 5, h: 0.3,
    fontFace: FONT, fontSize: 10, color: C.brown, bold: true, charSpacing: 5,
  });
  // 타이틀
  s.addText("목차", {
    x: 0.5, y: 0.7, w: 9, h: 0.6,
    fontFace: FONT, fontSize: 28, color: C.ink, bold: true, margin: 0,
  });
  // 액센트
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.40, w: 0.5, h: 0.04,
    fill: { color: C.brown }, line: { color: C.brown, width: 0 },
  });

  // 5개 카테고리 행
  const cats = [
    { no: "01", kor: "벽지",         eng: "WALLCOVERING",        items: "방염벽지 · 실크 · 합지 · 친환경" },
    { no: "02", kor: "알판",         eng: "PANEL",                items: "래핑평판 · LPM · HPL · PET · UV" },
    { no: "03", kor: "붙박이가구",   eng: "BUILT-IN FURNITURE",  items: "하이그로시 · 인조대리석 상판 · 도어" },
    { no: "04", kor: "사무용가구",   eng: "OFFICE FURNITURE",    items: "책상 · 의자 · 서랍 · 파티션 · 회의가구 · 휴게가구" },
    { no: "05", kor: "조명",         eng: "LIGHTING",            items: "LED 평판조명 · 다운라이트" },
  ];

  const rowY0 = 1.85;
  const rowH = 0.62;
  cats.forEach((c, i) => {
    const y = rowY0 + i * rowH;

    // 번호
    s.addText(c.no, {
      x: 0.5, y, w: 0.8, h: rowH - 0.1,
      fontFace: FONT, fontSize: 18, color: C.brown, bold: true, italic: true,
      valign: "middle", margin: 0,
    });
    // 한글명
    s.addText(c.kor, {
      x: 1.4, y, w: 2.5, h: rowH - 0.1,
      fontFace: FONT, fontSize: 16, color: C.ink, bold: true,
      valign: "middle", margin: 0,
    });
    // 영문
    s.addText(c.eng, {
      x: 3.9, y, w: 2.5, h: rowH - 0.1,
      fontFace: FONT, fontSize: 9, color: C.brown, charSpacing: 3,
      valign: "middle", margin: 0,
    });
    // 세부 항목
    s.addText(c.items, {
      x: 6.4, y, w: 3.2, h: rowH - 0.1,
      fontFace: FONT, fontSize: 9.5, color: C.inkSub, italic: true,
      valign: "middle", align: "right", margin: 0,
    });
    // 행 구분선
    s.addShape(pres.shapes.LINE, {
      x: 0.5, y: y + rowH - 0.05, w: 9.0, h: 0,
      line: { color: C.line, width: 0.5 },
    });
  });

  addFooter(s, 2);
}

// ═════════════════════════════════════════════
// SLIDE 3-4 : 벽지
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "01", category: "벽지", categoryEng: "WALLCOVERING",
  maker: "예) KCC / 신한벽지 / LX하우시스 등",
  page: 3,
  slots: [
    ["방염벽지", "모델명 입력 (예: F15130-1 매트 피니쉬)"],
    ["방염벽지", "모델명 입력"],
    ["방염벽지", "모델명 입력"],
  ],
});
buildContent({
  sectionNo: "01", category: "벽지", categoryEng: "WALLCOVERING",
  maker: "예) KCC / 신한벽지 / LX하우시스 등",
  page: 4,
  slots: [
    ["방염벽지", "모델명 입력 (예: F15128-2 페블스톤)"],
    ["방염벽지", "모델명 입력"],
  ],
});

// ═════════════════════════════════════════════
// SLIDE 5 : 알판
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "02", category: "알판 (래핑평판)", categoryEng: "PANEL",
  maker: "예) 대성몰딩 / LX하우시스 / 한솔홈데코",
  page: 5,
  slots: [
    ["종류 입력", "모델명 입력"],
    ["종류 입력", "모델명 입력"],
    ["종류 입력", "모델명 입력"],
  ],
});

// ═════════════════════════════════════════════
// SLIDE 6-7 : 붙박이가구
// ═════════════════════════════════════════════
buildPairSlide({
  sectionNo: "03", category: "붙박이가구", categoryEng: "BUILT-IN  ·  HIGH GLOSSY",
  maker: "예) 예림 하이그로시",
  page: 6, pairCount: 2,
});
buildContent({
  sectionNo: "03", category: "붙박이가구  ·  인조대리석 상판", categoryEng: "BUILT-IN  ·  COUNTERTOP",
  maker: "예) LG칸스톤 / 한화L&C / 현대L&C",
  page: 7,
  slots: [
    ["종류 입력", "모델명 입력 (예: 스틸콘크리트 G555)"],
    ["종류 입력", "모델명 입력"],
    ["종류 입력", "모델명 입력"],
  ],
});

// ═════════════════════════════════════════════
// SLIDE 8 : 사무용책상
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "04", category: "사무용책상", categoryEng: "OFFICE  ·  DESK",
  maker: "예) 퍼시스 / 코아스 / 한샘",
  page: 8,
  slots: [
    ["품명 입력 (예: 덕트형 책상 5구)", "모델명 입력", "사이즈 입력 (예: 1400*800*720)"],
    ["품명 입력", "모델명 입력", "사이즈 입력"],
    ["품명 입력", "모델명 입력", "사이즈 입력"],
  ],
});

// ═════════════════════════════════════════════
// SLIDE 9 : 3단 이동서랍
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "04", category: "3단 이동서랍", categoryEng: "OFFICE  ·  MOBILE DRAWER",
  maker: "제조사 / 시리즈명",
  page: 9,
  slots: [
    ["품명 입력 (예: 3단 이동서랍)", "모델명 입력", "사이즈 입력"],
    ["품명 입력", "모델명 입력", "사이즈 입력"],
  ],
});

// ═════════════════════════════════════════════
// SLIDE 10 : 사무용 의자
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "04", category: "사무용 의자", categoryEng: "OFFICE  ·  TASK CHAIR",
  maker: "예) 시디즈 / 퍼시스 / 코아스",
  page: 10,
  slots: [
    ["품명 입력", "모델명 입력 (예: 시디즈 T50)", "사양 입력 (메쉬 / 헤드레스트 등)"],
    ["품명 입력", "모델명 입력", "사양 입력"],
  ],
});

// ═════════════════════════════════════════════
// SLIDE 11 : 파티션 / 스크린
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "04", category: "파티션 / 책상 스크린", categoryEng: "OFFICE  ·  PARTITION",
  maker: "제조사 / 시리즈명",
  page: 11,
  slots: [
    ["품명 입력 (예: 자립형 파티션)", "모델명 입력", "사이즈 입력"],
    ["품명 입력 (예: 책상 스크린)", "모델명 입력", "사이즈 입력"],
  ],
});

// ═════════════════════════════════════════════
// SLIDE 12 : 회의테이블
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "04", category: "회의테이블", categoryEng: "OFFICE  ·  CONFERENCE TABLE",
  maker: "제조사 / 시리즈명",
  page: 12,
  slots: [
    ["품명 입력 (예: 덕트형 회의테이블)", "모델명 입력", "사이즈 / 사양 입력 (예: 4000*1200*715, 4구 2LAN)"],
    ["품명 입력", "모델명 입력", "사이즈 / 사양 입력"],
  ],
});

// ═════════════════════════════════════════════
// SLIDE 13 : 회의의자
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "04", category: "회의의자 (팔걸이)", categoryEng: "OFFICE  ·  CONFERENCE CHAIR",
  maker: "제조사 / 시리즈명",
  page: 13,
  slots: [
    ["품명 입력", "모델명 입력", "사이즈 입력 (예: 605*520*850)"],
    ["품명 입력", "모델명 입력", "사이즈 입력"],
  ],
});

// ═════════════════════════════════════════════
// SLIDE 14 : 휴게실 테이블
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "04", category: "휴게실 테이블", categoryEng: "OFFICE  ·  LOUNGE TABLE",
  maker: "제조사 / 시리즈명",
  page: 14,
  slots: [
    ["품명 입력", "모델명 입력", "사이즈 입력 (예: 지름 700 * 720)"],
    ["품명 입력", "모델명 입력", "사이즈 입력"],
  ],
});

// ═════════════════════════════════════════════
// SLIDE 15 : 휴게실 의자
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "04", category: "휴게실 의자", categoryEng: "OFFICE  ·  LOUNGE CHAIR",
  maker: "제조사 / 시리즈명",
  page: 15,
  slots: [
    ["품명 입력", "모델명 입력", "재질 / 컬러 입력"],
    ["품명 입력", "모델명 입력", "재질 / 컬러 입력"],
  ],
});

// ═════════════════════════════════════════════
// SLIDE 16 : LED 평판조명
// ═════════════════════════════════════════════
buildContent({
  sectionNo: "05", category: "LED 평판조명", categoryEng: "LIGHTING  ·  LED PANEL",
  maker: "제조사 / 시리즈명",
  page: 16,
  slots: [
    ["품명 입력 (예: LED 평판조명)", "모델명 입력", "사이즈 / W / 색온도 입력"],
  ],
});

// ═════════════════════════════════════════════
// SLIDE 17 : 맺음 / 문의
// ═════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.cream };

  // 하단 컬러 블록
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 4.20, w: 10, h: 1.425,
    fill: { color: C.brownDk }, line: { color: C.brownDk, width: 0 },
  });

  // 상단 태그
  s.addText("CONTACT", {
    x: 0.5, y: 0.55, w: 9, h: 0.3,
    fontFace: FONT, fontSize: 9, color: C.brown, bold: true, charSpacing: 5,
  });

  // 메인 카피
  s.addText("자재에 관한 문의는 언제든\n담당자에게 연락 주십시오.", {
    x: 0.5, y: 1.0, w: 9, h: 1.4,
    fontFace: FONT, fontSize: 28, color: C.ink, bold: true,
    lineSpacingMultiple: 1.3, margin: 0,
  });

  // 액센트 라인
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 2.45, w: 0.5, h: 0.04,
    fill: { color: C.brown }, line: { color: C.brown, width: 0 },
  });

  // 회사 마크
  s.addText("JM INTERIOR", {
    x: 0.5, y: 2.65, w: 9, h: 0.35,
    fontFace: FONT, fontSize: 14, color: C.brownDk, bold: true, charSpacing: 6,
  });
  s.addText("Material Proposal · 마감재 제안서", {
    x: 0.5, y: 3.05, w: 9, h: 0.25,
    fontFace: FONT, fontSize: 9.5, color: C.inkSub, italic: true,
  });

  // 연락처 카드
  const contacts = [
    { label: "담당",   placeholder: "담당자명 / 직책" },
    { label: "연락처", placeholder: "010-0000-0000" },
    { label: "이메일", placeholder: "email@domain.com" },
  ];
  const cW = 2.9, cH = 0.85, gap = 0.15;
  const startX = (10 - (cW * 3 + gap * 2)) / 2;
  const cY = 4.45;
  contacts.forEach((c, i) => {
    const x = startX + i * (cW + gap);
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: cY, w: cW, h: cH,
      fill: { color: C.brown }, line: { color: C.beige, width: 0.5 },
    });
    s.addText(c.label, {
      x: x + 0.2, y: cY + 0.10, w: cW - 0.4, h: 0.22,
      fontFace: FONT, fontSize: 9, color: C.cream, bold: true, charSpacing: 4, margin: 0,
    });
    s.addText(c.placeholder, {
      x: x + 0.2, y: cY + 0.35, w: cW - 0.4, h: 0.4,
      fontFace: FONT, fontSize: 12.5, color: C.white, italic: true,
      margin: 0, valign: "top",
    });
  });

  // 하단 푸터
  s.addText("17 / 17", {
    x: 7.5, y: 5.40, w: 2, h: 0.2,
    fontFace: FONT, fontSize: 8, color: C.beige,
    align: "right", charSpacing: 2,
  });
  s.addText("JM INTERIOR  ·  MATERIAL PROPOSAL", {
    x: 0.5, y: 5.40, w: 6, h: 0.2,
    fontFace: FONT, fontSize: 8, color: C.beige, charSpacing: 2,
  });
}

// ─────────────────────────────────────────────
// 저장
// ─────────────────────────────────────────────
pres.writeFile({
  fileName: "C:/Users/Administrator/Desktop/JM_클로드/지엔티_재료제안서/지엔티_마감재제안서_템플릿.pptx"
}).then(fileName => {
  console.log("Saved:", fileName);
});
