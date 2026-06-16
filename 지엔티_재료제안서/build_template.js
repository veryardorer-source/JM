// 지엔티 재료제안서 PPTX 템플릿 생성기
// 빈칸 양식 — 자재 정보 채우기 전 단계

const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";       // 10" x 5.625"
pres.title = "지엔티 재료제안서";
pres.author = "JM";

// ─────────────────────────────────────────────
// 컬러 팔레트 (Warm Interior Neutral)
// ─────────────────────────────────────────────
const C = {
  ink:       "2B2B2B",   // 본문 진한 색
  inkSub:    "6A6A6A",   // 보조 텍스트
  brown:     "8A7D63",   // 메인 액센트 (브라운)
  brownDk:   "4A4030",   // 진한 브라운
  beige:     "C2B393",   // 밝은 베이지
  cream:     "F7F5F1",   // 배경 크림
  panel:     "EFE9DB",   // 패널 베이지
  line:      "D8D2C5",   // 라인
  white:     "FFFFFF",
  hint:      "B5AE9E",   // 빈칸 안내 텍스트
  imgBox:    "E8E2D2",   // 이미지 자리 배경
};

const FONT = "Malgun Gothic";

// ─────────────────────────────────────────────
// 공통 유틸
// ─────────────────────────────────────────────
function addFooter(slide, pageNo, total) {
  // 하단 얇은 라인
  slide.addShape(pres.shapes.LINE, {
    x: 0.5, y: 5.25, w: 9.0, h: 0,
    line: { color: C.line, width: 0.5 },
  });
  // 좌측: 회사
  slide.addText("JM INTERIOR  ·  MATERIAL PROPOSAL", {
    x: 0.5, y: 5.32, w: 6, h: 0.25,
    fontFace: FONT, fontSize: 8, color: C.inkSub,
    charSpacing: 2,
  });
  // 우측: 페이지
  slide.addText(`${String(pageNo).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, {
    x: 7.5, y: 5.32, w: 2, h: 0.25,
    fontFace: FONT, fontSize: 8, color: C.inkSub,
    align: "right", charSpacing: 2,
  });
}

function addTopTag(slide, tag) {
  slide.addText(tag, {
    x: 0.5, y: 0.32, w: 6, h: 0.3,
    fontFace: FONT, fontSize: 9, color: C.brown,
    bold: true, charSpacing: 4,
  });
}

function addSectionTitle(slide, kor, eng) {
  slide.addText(kor, {
    x: 0.5, y: 0.65, w: 9, h: 0.55,
    fontFace: FONT, fontSize: 24, color: C.ink, bold: true,
    margin: 0,
  });
  if (eng) {
    slide.addText(eng, {
      x: 0.5, y: 1.20, w: 9, h: 0.3,
      fontFace: FONT, fontSize: 10, color: C.inkSub, italic: true,
      margin: 0,
    });
  }
  // 짧은 액센트 라인
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.55, w: 0.5, h: 0.04,
    fill: { color: C.brown }, line: { color: C.brown, width: 0 },
  });
}

// 빈칸 입력 행 (라벨 + 밑줄)
function addFieldRow(slide, x, y, w, label, opts = {}) {
  const labelW = opts.labelW || 1.3;
  const valueX = x + labelW;
  const valueW = w - labelW;

  slide.addText(label, {
    x, y, w: labelW, h: 0.32,
    fontFace: FONT, fontSize: 10, color: C.brownDk, bold: true,
    valign: "middle", margin: 0,
  });
  // 안내 placeholder
  slide.addText(opts.placeholder || "여기에 입력", {
    x: valueX, y, w: valueW, h: 0.32,
    fontFace: FONT, fontSize: 10, color: C.hint, italic: true,
    valign: "middle", margin: 0,
  });
  // 밑줄
  slide.addShape(pres.shapes.LINE, {
    x: valueX, y: y + 0.30, w: valueW - 0.05, h: 0,
    line: { color: C.line, width: 0.75 },
  });
}

const TOTAL = 11;

// ═════════════════════════════════════════════
// SLIDE 1 : 표지
// ═════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.cream };

  // 좌측 큰 색 블록
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 3.5, h: 5.625,
    fill: { color: C.brownDk }, line: { color: C.brownDk, width: 0 },
  });

  // 좌측 상단 영문 태그
  s.addText("MATERIAL\nPROPOSAL", {
    x: 0.5, y: 0.6, w: 3, h: 1.0,
    fontFace: FONT, fontSize: 11, color: C.beige, bold: true,
    charSpacing: 6, lineSpacingMultiple: 1.4,
  });

  // 좌측 하단 영문 부제
  s.addText("Interior\nMaterial\nReference", {
    x: 0.5, y: 3.4, w: 3, h: 1.6,
    fontFace: FONT, fontSize: 22, color: C.white, italic: true,
    lineSpacingMultiple: 1.15,
  });

  // 우측 본문 영역
  // 액센트 라인
  s.addShape(pres.shapes.RECTANGLE, {
    x: 4.3, y: 1.0, w: 0.6, h: 0.04,
    fill: { color: C.brown }, line: { color: C.brown, width: 0 },
  });

  // 메인 타이틀 (큰 한글)
  s.addText("재료 제안서", {
    x: 4.3, y: 1.25, w: 5.5, h: 1.0,
    fontFace: FONT, fontSize: 44, color: C.ink, bold: true,
    margin: 0,
  });

  // 서브
  s.addText("벽지 · 알판 · 사무용가구 · 붙박이가구", {
    x: 4.3, y: 2.25, w: 5.5, h: 0.4,
    fontFace: FONT, fontSize: 13, color: C.brownDk,
    charSpacing: 2, margin: 0,
  });

  // 구분선
  s.addShape(pres.shapes.LINE, {
    x: 4.3, y: 3.1, w: 4.5, h: 0,
    line: { color: C.line, width: 0.75 },
  });

  // 메타 정보 (빈칸)
  const metaY = 3.35;
  const labelOpt = {
    fontFace: FONT, fontSize: 9, color: C.brown, bold: true,
    charSpacing: 3, margin: 0,
  };
  const valueOpt = {
    fontFace: FONT, fontSize: 11, color: C.hint, italic: true, margin: 0,
  };

  s.addText("CLIENT", { x: 4.3, y: metaY, w: 2, h: 0.25, ...labelOpt });
  s.addText("고객사명을 입력하세요", { x: 4.3, y: metaY + 0.25, w: 5, h: 0.3, ...valueOpt });

  s.addText("SCOPE", { x: 4.3, y: metaY + 0.7, w: 2, h: 0.25, ...labelOpt });
  s.addText("사무공간 인테리어 자재 제안", { x: 4.3, y: metaY + 0.95, w: 5, h: 0.3, ...valueOpt });

  s.addText("ISSUED", { x: 4.3, y: metaY + 1.4, w: 2, h: 0.25, ...labelOpt });
  s.addText("YYYY. MM. DD", { x: 4.3, y: metaY + 1.65, w: 5, h: 0.3, ...valueOpt });

  // 하단 회사 표기
  s.addText("JM INTERIOR", {
    x: 4.3, y: 5.20, w: 5, h: 0.3,
    fontFace: FONT, fontSize: 9, color: C.brown, bold: true,
    charSpacing: 5,
  });
}

// ═════════════════════════════════════════════
// SLIDE 2 : 안내 / 목차
// ═════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };

  addTopTag(s, "INTRO");
  addSectionTitle(s, "제안서 구성", "Overview");

  // 설명 (빈칸 가능)
  s.addText(
    "본 제안서는 사무공간 인테리어에 사용되는 주요 자재의\n제조사·브랜드·재질·마감·색상 정보를 정리한 자료입니다.",
    {
      x: 0.5, y: 1.85, w: 9, h: 0.8,
      fontFace: FONT, fontSize: 11, color: C.inkSub,
      lineSpacingMultiple: 1.4, margin: 0,
    }
  );

  // 4개 카테고리 카드
  const cats = [
    { no: "01", kor: "벽지",       eng: "WALLCOVERING" },
    { no: "02", kor: "알판",       eng: "PANEL" },
    { no: "03", kor: "사무용가구", eng: "OFFICE FURNITURE" },
    { no: "04", kor: "붙박이가구", eng: "BUILT-IN FURNITURE" },
  ];

  const cardY = 3.0, cardH = 1.9, cardW = 2.10, gap = 0.18;
  const startX = (10 - (cardW * 4 + gap * 3)) / 2;

  cats.forEach((c, i) => {
    const x = startX + i * (cardW + gap);

    // 카드 배경
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: cardY, w: cardW, h: cardH,
      fill: { color: C.cream }, line: { color: C.line, width: 0.5 },
    });
    // 상단 액센트 바
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: cardY, w: cardW, h: 0.08,
      fill: { color: C.brown }, line: { color: C.brown, width: 0 },
    });
    // 번호
    s.addText(c.no, {
      x: x + 0.15, y: cardY + 0.25, w: 1, h: 0.4,
      fontFace: FONT, fontSize: 22, color: C.beige, bold: true, italic: true,
      margin: 0,
    });
    // 한글명
    s.addText(c.kor, {
      x: x + 0.15, y: cardY + 0.85, w: cardW - 0.3, h: 0.5,
      fontFace: FONT, fontSize: 18, color: C.ink, bold: true,
      margin: 0,
    });
    // 영문
    s.addText(c.eng, {
      x: x + 0.15, y: cardY + 1.4, w: cardW - 0.3, h: 0.3,
      fontFace: FONT, fontSize: 8, color: C.brown, charSpacing: 3,
      margin: 0,
    });
  });

  addFooter(s, 2, TOTAL);
}

// ═════════════════════════════════════════════
// 섹션 디바이더 슬라이드 헬퍼
// ═════════════════════════════════════════════
function addSectionDivider(no, kor, eng, descPlaceholder) {
  const s = pres.addSlide();
  s.background = { color: C.cream };

  // 좌측 큰 컬러 블록
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 4.0, h: 5.625,
    fill: { color: C.brownDk }, line: { color: C.brownDk, width: 0 },
  });

  // 큰 번호
  s.addText(no, {
    x: 0.5, y: 1.3, w: 3, h: 2.4,
    fontFace: FONT, fontSize: 130, color: C.brown, bold: true, italic: true,
    margin: 0,
  });

  // 영문 라벨
  s.addText("CATEGORY", {
    x: 0.5, y: 4.1, w: 3, h: 0.3,
    fontFace: FONT, fontSize: 9, color: C.beige, bold: true, charSpacing: 5,
  });
  // 영문 타이틀
  s.addText(eng, {
    x: 0.5, y: 4.4, w: 3, h: 0.4,
    fontFace: FONT, fontSize: 14, color: C.white, charSpacing: 2, bold: true,
  });

  // 우측 영역
  // 액센트 라인
  s.addShape(pres.shapes.RECTANGLE, {
    x: 4.8, y: 1.4, w: 0.5, h: 0.04,
    fill: { color: C.brown }, line: { color: C.brown, width: 0 },
  });

  // 카테고리 한글명
  s.addText(kor, {
    x: 4.8, y: 1.65, w: 5, h: 1.0,
    fontFace: FONT, fontSize: 40, color: C.ink, bold: true,
    margin: 0,
  });

  // 설명 라벨
  s.addText("DESCRIPTION", {
    x: 4.8, y: 3.0, w: 4, h: 0.3,
    fontFace: FONT, fontSize: 9, color: C.brown, bold: true, charSpacing: 4,
  });
  // 설명 빈칸
  s.addText(descPlaceholder, {
    x: 4.8, y: 3.3, w: 4.7, h: 1.4,
    fontFace: FONT, fontSize: 11, color: C.hint, italic: true,
    lineSpacingMultiple: 1.5, margin: 0,
  });

  return s;
}

// ═════════════════════════════════════════════
// 자재 상세 카드 슬라이드 헬퍼
// ═════════════════════════════════════════════
function addDetailSlide(no, catKor, catEng, pageNo) {
  const s = pres.addSlide();
  s.background = { color: C.white };

  // 상단 카테고리 태그
  addTopTag(s, `${no}  ·  ${catEng}`);

  // 타이틀
  s.addText(catKor, {
    x: 0.5, y: 0.65, w: 5, h: 0.55,
    fontFace: FONT, fontSize: 22, color: C.ink, bold: true,
    margin: 0,
  });
  s.addText("자재 상세 / Material Detail", {
    x: 0.5, y: 1.20, w: 5, h: 0.3,
    fontFace: FONT, fontSize: 10, color: C.inkSub, italic: true,
    margin: 0,
  });
  // 액센트
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.55, w: 0.5, h: 0.04,
    fill: { color: C.brown }, line: { color: C.brown, width: 0 },
  });

  // 우측 상단 안내
  s.addText("※ 자재 1건 / 슬라이드.  추가 자재는 본 슬라이드 복제 후 작성", {
    x: 5.5, y: 1.20, w: 4, h: 0.3,
    fontFace: FONT, fontSize: 8.5, color: C.brown, italic: true,
    align: "right", margin: 0,
  });

  // ── 좌측: 이미지 영역 ─────────────────────
  const imgX = 0.5, imgY = 1.85, imgW = 4.0, imgH = 2.7;

  s.addShape(pres.shapes.RECTANGLE, {
    x: imgX, y: imgY, w: imgW, h: imgH,
    fill: { color: C.imgBox }, line: { color: C.brown, width: 0.5, dashType: "dash" },
  });
  // 가운데 안내 텍스트
  s.addText("이미지 영역", {
    x: imgX, y: imgY + imgH/2 - 0.35, w: imgW, h: 0.4,
    fontFace: FONT, fontSize: 14, color: C.brownDk, bold: true,
    align: "center", margin: 0,
  });
  s.addText("(자재 사진 / 컬러칩 / 카탈로그 컷)", {
    x: imgX, y: imgY + imgH/2 + 0.05, w: imgW, h: 0.3,
    fontFace: FONT, fontSize: 9, color: C.inkSub, italic: true,
    align: "center", margin: 0,
  });

  // 이미지 캡션 영역 (빈칸)
  const capY = imgY + imgH + 0.12;
  s.addText("CAPTION", {
    x: imgX, y: capY, w: 2, h: 0.20,
    fontFace: FONT, fontSize: 8, color: C.brown, bold: true, charSpacing: 3,
  });
  s.addText("사진 캡션 / 출처 입력", {
    x: imgX, y: capY + 0.22, w: imgW, h: 0.22,
    fontFace: FONT, fontSize: 9, color: C.hint, italic: true,
    margin: 0,
  });

  // ── 우측: 스펙 입력 영역 ────────────────────
  const specX = 5.0, specY = 1.85, specW = 4.5, specH = 3.30;

  // 우측 배경 패널
  s.addShape(pres.shapes.RECTANGLE, {
    x: specX, y: specY, w: specW, h: specH,
    fill: { color: C.cream }, line: { color: C.line, width: 0.5 },
  });

  // SPEC 라벨
  s.addText("SPECIFICATION", {
    x: specX + 0.25, y: specY + 0.18, w: 3, h: 0.25,
    fontFace: FONT, fontSize: 9, color: C.brown, bold: true, charSpacing: 4,
  });

  // 필드들 (7개 — 비고 포함)
  const fieldsX = specX + 0.25, fieldsW = specW - 0.5;
  let fy = specY + 0.52;
  const rowH = 0.38;

  const fields = [
    ["제조사",       "예) LX하우시스"],
    ["브랜드/시리즈", "예) 지인(Z:IN) 베스띠"],
    ["모델명",       "예) BST-1234"],
    ["재질",         "예) 실크벽지 (PVC 코팅)"],
    ["마감",         "예) 무광 솔리드"],
    ["색상",         "예) 웜 화이트 / WH-01"],
    ["비고",         "적용 위치 / 등급 / 단가 / 납기"],
  ];

  fields.forEach(([label, ph]) => {
    addFieldRow(s, fieldsX, fy, fieldsW, label, { labelW: 1.2, placeholder: ph });
    fy += rowH;
  });

  addFooter(s, pageNo, TOTAL);
  return s;
}

// ═════════════════════════════════════════════
// SLIDE 3,4 : 벽지
// ═════════════════════════════════════════════
{
  const s = addSectionDivider(
    "01", "벽지", "WALLCOVERING",
    "벽지는 사무공간에서 가장 넓은 면적을 차지하는 마감재입니다.\n실크 / 합지 / 친환경 등급 / 기능성(방염·항균·흡음)\n구분으로 정리해 주세요."
  );
  addFooter(s, 3, TOTAL);
}
addDetailSlide("01", "벽지", "WALLCOVERING", 4);

// ═════════════════════════════════════════════
// SLIDE 5,6 : 알판
// ═════════════════════════════════════════════
{
  const s = addSectionDivider(
    "02", "알판", "PANEL",
    "알판은 가구 도어·몸체·벽체 마감에 사용되는 판상 자재입니다.\n코어(PB·MDF·합판) + 마감(LPM·HPL·PET·UV·멤브레인·무늬목)\n구조로 정리해 주세요."
  );
  addFooter(s, 5, TOTAL);
}
addDetailSlide("02", "알판", "PANEL", 6);

// ═════════════════════════════════════════════
// SLIDE 7,8 : 사무용가구
// ═════════════════════════════════════════════
{
  const s = addSectionDivider(
    "03", "사무용가구", "OFFICE FURNITURE",
    "사무용 책상·의자·수납장 중심으로 정리합니다.\n주요 제조사: 퍼시스 / 코아스 / 한샘 / 시디즈 / 일룸 / 리바트.\n품목별 모델·재질·치수·색상을 입력해 주세요."
  );
  addFooter(s, 7, TOTAL);
}
addDetailSlide("03", "사무용가구", "OFFICE FURNITURE", 8);

// ═════════════════════════════════════════════
// SLIDE 9,10 : 붙박이가구
// ═════════════════════════════════════════════
{
  const s = addSectionDivider(
    "04", "붙박이가구", "BUILT-IN FURNITURE",
    "현장 치수 맞춤 제작 가구.\n몸체(PB/MDF) + 도어 마감(멤브레인·UV·PET·무늬목·도장)\n+ 하드웨어(Blum·Hettich·Hafele) 구분으로 정리해 주세요."
  );
  addFooter(s, 9, TOTAL);
}
addDetailSlide("04", "붙박이가구", "BUILT-IN FURNITURE", 10);

// ═════════════════════════════════════════════
// SLIDE 11 : 맺음 / 문의
// ═════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.cream };

  // 하단 컬러 블록 (살짝 줄임)
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

  // 회사 마크 (크림 배경에 배치 — 가독성 보장)
  s.addText("JM INTERIOR", {
    x: 0.5, y: 2.65, w: 9, h: 0.35,
    fontFace: FONT, fontSize: 14, color: C.brownDk, bold: true,
    charSpacing: 6,
  });
  s.addText("Material Proposal · 재료 제안서", {
    x: 0.5, y: 3.05, w: 9, h: 0.25,
    fontFace: FONT, fontSize: 9.5, color: C.inkSub, italic: true,
  });

  // 연락처 빈칸 카드들 (다크 밴드 안에)
  const contacts = [
    { label: "담당",     placeholder: "담당자명 / 직책" },
    { label: "연락처",   placeholder: "010-0000-0000" },
    { label: "이메일",   placeholder: "email@domain.com" },
  ];

  const cW = 2.9, cH = 0.85, gap = 0.15;
  const startX = (10 - (cW * 3 + gap * 2)) / 2;
  const cY = 4.45;

  contacts.forEach((c, i) => {
    const x = startX + i * (cW + gap);
    // 카드
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: cY, w: cW, h: cH,
      fill: { color: C.brown }, line: { color: C.beige, width: 0.5 },
    });
    // 라벨
    s.addText(c.label, {
      x: x + 0.2, y: cY + 0.10, w: cW - 0.4, h: 0.22,
      fontFace: FONT, fontSize: 9, color: C.cream, bold: true, charSpacing: 4,
      margin: 0,
    });
    // 값 (빈칸)
    s.addText(c.placeholder, {
      x: x + 0.2, y: cY + 0.35, w: cW - 0.4, h: 0.4,
      fontFace: FONT, fontSize: 12.5, color: C.white, italic: true,
      margin: 0, valign: "top",
    });
  });

  // 하단 페이지 표기 (다크 밴드 바닥)
  s.addText("11 / 11", {
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
  fileName: "C:/Users/Administrator/Desktop/JM_클로드/지엔티_재료제안서/지엔티_재료제안서_템플릿.pptx"
}).then(fileName => {
  console.log("Saved:", fileName);
});
