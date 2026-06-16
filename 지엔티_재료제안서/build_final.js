// 지엔티 마감재 제안서 — 최종본 (고객 전달용)
// 브랜드: 제이엠건축인테리어 / CLIENT: 지엔티 / 날짜 제거
// 자재 슬라이드: 참조 PPT(재료 정리.pptx)의 실제 이미지·텍스트 채움

const pptxgen = require("pptxgenjs");
const path = require("path");
const fs = require("fs");

// 종횡비 맵 - 여러 폴더의 dim 파일을 통합
function loadDim(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf-8")); }
  catch (e) { return {}; }
}
const USER_DIM       = loadDim("C:/Users/Administrator/Desktop/JM_클로드/지엔티_재료제안서/_user_imgs/img_dim.json");
const EXTRACTED2_DIM = loadDim("C:/Users/Administrator/Desktop/JM_클로드/지엔티_재료제안서/_extracted2/img_dim.json");

let EXTRACTED_DIM = {};
try {
  const EXTRACTED = JSON.parse(fs.readFileSync(
    "C:/Users/Administrator/Desktop/JM_클로드/지엔티_재료제안서/_extracted/data.json",
    "utf-8"
  ));
  EXTRACTED.forEach(slide => {
    (slide.images || []).forEach(im => {
      EXTRACTED_DIM[im.file] = { w: im.w_in, h: im.h_in };
    });
  });
} catch (e) { /* optional */ }

// 통합 종횡비 맵 (USER 최우선, EXTRACTED2, EXTRACTED 순서)
const IMG_DIM = { ...EXTRACTED_DIM, ...EXTRACTED2_DIM, ...USER_DIM };

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "지엔티 마감재제안서";
pres.author = "제이엠건축인테리어";

// ─────────────────────────────────────────────
// 컬러
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
  // 색상 칩
  swatchMilkWhite: "F0EBE3",   // SM-02 매트 밀크화이트
};

const FONT = "Malgun Gothic";
const TOTAL = 20;

// 페이지 자동 카운터 (표지 = 1, 다음 슬라이드부터 자동 증가)
let _page = 1;
function P() { return ++_page; }
const IMG_DIRS = [
  "C:/Users/Administrator/Desktop/JM_클로드/지엔티_재료제안서/_user_imgs",
  "C:/Users/Administrator/Desktop/JM_클로드/지엔티_재료제안서/_extracted2",
  "C:/Users/Administrator/Desktop/JM_클로드/지엔티_재료제안서/_extracted",
];
// 파일명을 두 폴더에서 자동 검색해 절대경로 반환
function imgPath(filename) {
  for (const dir of IMG_DIRS) {
    const p = path.join(dir, filename);
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`Image not found: ${filename}`);
}
const COMPANY = "제이엠건축인테리어";

// ═════════════════════════════════════════════
// 공통 유틸
// ═════════════════════════════════════════════
function addFooter(slide, page) {
  slide.addShape(pres.shapes.LINE, {
    x: 0.5, y: 5.25, w: 9.0, h: 0,
    line: { color: C.line, width: 0.5 },
  });
  slide.addText(`${COMPANY}  ·  지엔티 마감재 제안서`, {
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

// 헤더: 카테고리 + (제조사)
function addContentHeader(slide, opts) {
  const { sectionNo, category, categoryEng, maker } = opts;

  // 섹션 번호 원
  slide.addShape(pres.shapes.OVAL, {
    x: 0.5, y: 0.42, w: 0.40, h: 0.40,
    fill: { color: C.brown }, line: { color: C.brown, width: 0 },
  });
  slide.addText(sectionNo, {
    x: 0.5, y: 0.42, w: 0.40, h: 0.40,
    fontFace: FONT, fontSize: 10, color: C.white, bold: true,
    align: "center", valign: "middle", margin: 0,
  });

  // 영문 라벨
  slide.addText(categoryEng, {
    x: 1.05, y: 0.36, w: 7, h: 0.22,
    fontFace: FONT, fontSize: 9, color: C.brown, bold: true,
    charSpacing: 4, margin: 0,
  });

  // 카테고리 + 제조사
  if (maker) {
    slide.addText([
      { text: category, options: { color: C.ink, bold: true } },
      { text: "  :  ",   options: { color: C.inkMute } },
      { text: maker,     options: { color: C.inkSub } },
    ], {
      x: 1.05, y: 0.58, w: 8.5, h: 0.38,
      fontFace: FONT, fontSize: 18, margin: 0, valign: "top",
    });
  } else {
    slide.addText(category, {
      x: 1.05, y: 0.58, w: 8.5, h: 0.38,
      fontFace: FONT, fontSize: 18, color: C.ink, bold: true,
      margin: 0, valign: "top",
    });
  }

  // 액센트 라인
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.08, w: 0.4, h: 0.03,
    fill: { color: C.brown }, line: { color: C.brown, width: 0 },
  });
}

// ─────────────────────────────────────────────
// 슬롯: 이미지(또는 컬러칩) + 라벨
// opts: { image, swatchColor, labels: [{text, style}] }
//   style: 'title' (bold, 진한색) | 'sub' (보통, 회색)
// ─────────────────────────────────────────────
function addSlot(slide, x, y, w, h, opts = {}) {
  const labels = opts.labels || [];
  const labelLines = labels.length;
  const labelH = labelLines === 0 ? 0 : (0.30 * labelLines + 0.10);
  const imgH = h - labelH;

  // 이미지 / 컬러칩 / 빈 placeholder
  if (opts.image) {
    // 종횡비 직접 계산하여 박스 안에 contain 방식으로 중앙 배치
    const dim = IMG_DIM[opts.image] || { w: w, h: imgH };
    const imgAR = dim.w / dim.h;     // 원본 종횡비
    const slotAR = w / imgH;          // 슬롯 종횡비
    let drawW, drawH;
    if (imgAR > slotAR) {
      // 이미지가 가로로 더 김 → 폭에 맞춤
      drawW = w;
      drawH = w / imgAR;
    } else {
      // 이미지가 세로로 더 김 (또는 정사각) → 높이에 맞춤
      drawH = imgH;
      drawW = imgH * imgAR;
    }
    const drawX = x + (w - drawW) / 2;     // 가로 중앙
    const drawY = y + (imgH - drawH) / 2;  // 세로 중앙
    slide.addImage({
      path: imgPath(opts.image),
      x: drawX, y: drawY, w: drawW, h: drawH,
    });
  } else if (opts.swatchColor) {
    // 단색 컬러칩 (예: SM-02 매트 밀크화이트)
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h: imgH,
      fill: { color: opts.swatchColor },
      line: { color: C.imgLine, width: 0.5 },
    });
  } else {
    // placeholder (이미지 미삽입 시) — 점선 박스 + 안내 텍스트
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h: imgH,
      fill: { color: C.imgBox },
      line: { color: C.imgLine, width: 0.75, dashType: "dash" },
    });
    slide.addText("이미지 영역", {
      x, y: y + imgH/2 - 0.25, w, h: 0.32,
      fontFace: FONT, fontSize: 12, color: C.brownDk, italic: true,
      align: "center", margin: 0,
    });
    slide.addText("(사진 삽입)", {
      x, y: y + imgH/2 + 0.05, w, h: 0.25,
      fontFace: FONT, fontSize: 9, color: C.inkMute, italic: true,
      align: "center", margin: 0,
    });
  }

  // 라벨들
  let ly = y + imgH + 0.10;
  labels.forEach((lab, i) => {
    const isTitle = lab.style === "title";
    slide.addText(lab.text, {
      x, y: ly, w, h: 0.28,
      fontFace: FONT,
      fontSize: isTitle ? 10.5 : 10,
      color: isTitle ? C.ink : C.inkSub,
      bold: isTitle,
      italic: false,
      align: "center", margin: 0,
    });
    ly += 0.30;
  });
}

// ─────────────────────────────────────────────
// 컨텐츠 슬라이드: N개 슬롯 자동 배치
// ─────────────────────────────────────────────
function buildContent(opts) {
  const s = pres.addSlide();
  s.background = { color: C.white };
  addContentHeader(s, opts);

  const slots = opts.slots;
  const n = slots.length;
  const areaX = 0.5, areaY = 1.30, areaW = 9.0, areaH = 3.80;

  let gap = (n === 1) ? 0 : (n === 2) ? 0.6 : (n === 3) ? 0.4 : 0.3;
  const slotW = (areaW - gap * (n - 1)) / n;
  const slotH = areaH;

  slots.forEach((slot, i) => {
    const x = areaX + i * (slotW + gap);
    addSlot(s, x, areaY, slotW, slotH, slot);
  });

  addFooter(s, opts.page);
  return s;
}

// 사이드 레이아웃 — 좌측 이미지 + 우측 텍스트 (단일 슬롯)
function buildSideLayout(opts) {
  const s = pres.addSlide();
  s.background = { color: C.white };
  addContentHeader(s, opts);

  const slot = opts.slot;
  // 좌측 이미지 영역
  const imgX = 0.5, imgY = 1.30, imgW = 4.5, imgH = 3.80;

  if (slot.image) {
    const dim = IMG_DIM[slot.image] || { w: imgW, h: imgH };
    const imgAR = dim.w / dim.h;
    const slotAR = imgW / imgH;
    let drawW, drawH;
    if (imgAR > slotAR) {
      drawW = imgW; drawH = imgW / imgAR;
    } else {
      drawH = imgH; drawW = imgH * imgAR;
    }
    const drawX = imgX + (imgW - drawW) / 2;
    const drawY = imgY + (imgH - drawH) / 2;
    s.addImage({
      path: imgPath(slot.image),
      x: drawX, y: drawY, w: drawW, h: drawH,
    });
  } else {
    // placeholder
    s.addShape(pres.shapes.RECTANGLE, {
      x: imgX, y: imgY, w: imgW, h: imgH,
      fill: { color: C.imgBox },
      line: { color: C.imgLine, width: 0.75, dashType: "dash" },
    });
    s.addText("이미지 영역", {
      x: imgX, y: imgY + imgH/2 - 0.25, w: imgW, h: 0.32,
      fontFace: FONT, fontSize: 12, color: C.brownDk, italic: true,
      align: "center", margin: 0,
    });
    s.addText("(사진 삽입)", {
      x: imgX, y: imgY + imgH/2 + 0.05, w: imgW, h: 0.25,
      fontFace: FONT, fontSize: 9, color: C.inkMute, italic: true,
      align: "center", margin: 0,
    });
  }

  // 우측 텍스트 영역 — 세로 중앙 정렬
  const textX = 5.4, textW = 4.1;
  const labels = slot.labels;
  const titleH = 0.50, subH = 0.40;
  let totalH = 0;
  labels.forEach(l => { totalH += (l.style === "title") ? titleH : subH; });
  let ty = imgY + (imgH - totalH) / 2;

  labels.forEach(lab => {
    const isTitle = lab.style === "title";
    const lh = isTitle ? titleH : subH;
    s.addText(lab.text, {
      x: textX, y: ty, w: textW, h: lh,
      fontFace: FONT,
      fontSize: isTitle ? 16 : 12,
      color: isTitle ? C.ink : C.inkSub,
      bold: isTitle,
      align: "center", valign: "middle", margin: 0,
    });
    ty += lh;
  });

  addFooter(s, opts.page);
  return s;
}

// 페어 슬라이드 (붙박이가구 하이그로시 2×2) — 모든 박스 동일 크기(정사각)
function buildPairSlide(opts) {
  const s = pres.addSlide();
  s.background = { color: C.white };
  addContentHeader(s, opts);

  const pairs = opts.pairs;

  // 고정 박스 크기 — 4개 슬롯 모두 동일 정사각
  const FRAME = 1.30;           // 박스 1.3 × 1.3 정사각
  const LABEL_H_TOTAL = 0.60;   // 2개 라벨 (title 0.30 + sub 0.30)
  const ROW_H = FRAME + LABEL_H_TOTAL;  // 1.90
  const ROW_GAP = 0.20;
  const PLUS_W = 0.5;

  const pairContentW = FRAME * 2 + PLUS_W;          // 3.10
  const startX = (10 - pairContentW) / 2;            // 3.45 (가운데 정렬)
  const totalH = ROW_H * pairs.length + ROW_GAP * (pairs.length - 1);
  const startY = 1.30 + (3.80 - totalH) / 2;

  pairs.forEach((pair, p) => {
    const y = startY + p * (ROW_H + ROW_GAP);
    const leftX  = startX;
    const rightX = startX + FRAME + PLUS_W;

    addFixedSlot(s, leftX,  y, FRAME, FRAME, LABEL_H_TOTAL, pair.left);
    s.addText("+", {
      x: startX + FRAME, y: y + FRAME/2 - 0.30, w: PLUS_W, h: 0.6,
      fontFace: FONT, fontSize: 22, color: C.brown, bold: true,
      align: "center", valign: "middle", margin: 0,
    });
    addFixedSlot(s, rightX, y, FRAME, FRAME, LABEL_H_TOTAL, pair.right);
  });

  addFooter(s, opts.page);
  return s;
}

// 고정 크기 슬롯 (페어용) — 박스는 정확히 frameW × frameH, 이미지는 박스를 가득 채움
function addFixedSlot(slide, x, y, frameW, frameH, labelAreaH, slot) {
  // 박스 (이미지 또는 swatch)
  if (slot.image) {
    // 정사각 박스에 정사각 이미지를 그대로 끼움 (이미 정사각으로 크롭됨)
    slide.addImage({
      path: imgPath(slot.image),
      x, y, w: frameW, h: frameH,
    });
  } else if (slot.swatchColor) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: frameW, h: frameH,
      fill: { color: slot.swatchColor },
      line: { color: C.imgLine, width: 0.5 },
    });
  }

  // 라벨
  let ly = y + frameH + 0.10;
  const labels = slot.labels || [];
  labels.forEach((lab) => {
    const isTitle = lab.style === "title";
    slide.addText(lab.text, {
      x: x - 0.5, y: ly, w: frameW + 1.0, h: 0.28,   // 박스보다 약간 넓은 영역에 중앙정렬
      fontFace: FONT,
      fontSize: isTitle ? 10.5 : 10,
      color: isTitle ? C.ink : C.inkSub,
      bold: isTitle,
      align: "center", margin: 0,
    });
    ly += 0.30;
  });
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

  // 우측 액센트
  s.addShape(pres.shapes.RECTANGLE, {
    x: 4.3, y: 1.0, w: 0.6, h: 0.04,
    fill: { color: C.brown }, line: { color: C.brown, width: 0 },
  });

  // 메인 타이틀
  s.addText("마감재 제안서", {
    x: 4.3, y: 1.25, w: 5.5, h: 1.0,
    fontFace: FONT, fontSize: 44, color: C.ink, bold: true,
    margin: 0,
  });
  // (서브타이틀 라인 제거)

  // 구분선
  s.addShape(pres.shapes.LINE, {
    x: 4.3, y: 3.1, w: 4.5, h: 0,
    line: { color: C.line, width: 0.75 },
  });

  // 메타 — CLIENT, SCOPE만 (날짜 제외)
  const lbl = { fontFace: FONT, fontSize: 9, color: C.brown, bold: true, charSpacing: 3, margin: 0 };
  const val = { fontFace: FONT, fontSize: 13, color: C.ink, margin: 0, bold: true };

  s.addText("CLIENT", { x: 4.3, y: 3.45, w: 2, h: 0.25, ...lbl });
  s.addText("지엔티 (GNT)", { x: 4.3, y: 3.72, w: 5, h: 0.4, ...val });

  s.addText("SCOPE", { x: 4.3, y: 4.30, w: 2, h: 0.25, ...lbl });
  s.addText("사무공간 인테리어 마감재 제안", {
    x: 4.3, y: 4.57, w: 5, h: 0.4,
    fontFace: FONT, fontSize: 11.5, color: C.inkSub, margin: 0,
  });

  // 회사 마크
  s.addText("PROPOSED BY", {
    x: 4.3, y: 5.05, w: 5, h: 0.2,
    fontFace: FONT, fontSize: 8, color: C.brown, bold: true, charSpacing: 4,
  });
  s.addText(COMPANY, {
    x: 4.3, y: 5.25, w: 5, h: 0.3,
    fontFace: FONT, fontSize: 13, color: C.brownDk, bold: true,
    charSpacing: 2,
  });
}

// ═════════════════════════════════════════════
// SLIDE 2 : 목차
// ═════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };

  s.addText("INDEX", {
    x: 0.5, y: 0.42, w: 5, h: 0.3,
    fontFace: FONT, fontSize: 10, color: C.brown, bold: true, charSpacing: 5,
  });
  s.addText("목차", {
    x: 0.5, y: 0.7, w: 9, h: 0.6,
    fontFace: FONT, fontSize: 28, color: C.ink, bold: true, margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.40, w: 0.5, h: 0.04,
    fill: { color: C.brown }, line: { color: C.brown, width: 0 },
  });

  const cats = [
    { no: "01", kor: "벽지",        eng: "WALLCOVERING",       items: "방염벽지 · KCC 신한벽지" },
    { no: "02", kor: "랩핑평판",    eng: "WRAPPING PANEL",     items: "대성몰딩 · 600 × 2400" },
    { no: "03", kor: "붙박이가구",  eng: "BUILT-IN FURNITURE", items: "예림 하이그로시 · 인조대리석 상판" },
    { no: "04", kor: "사무용가구",  eng: "OFFICE FURNITURE",   items: "책상 · 의자 · 스크린 · 회의가구 · 휴게가구 · 캐비넷" },
    { no: "05", kor: "조명",        eng: "LIGHTING",           items: "LED 평판조명" },
    { no: "06", kor: "가전 · 영상", eng: "APPLIANCE  ·  AV",   items: "빔프로젝트 · 스피커 · 앰프 · 도어락" },
    { no: "07", kor: "창호",        eng: "WINDOW",             items: "블라인드" },
  ];

  const rowY0 = 1.45, rowH = 0.52;
  cats.forEach((c, i) => {
    const y = rowY0 + i * rowH;
    s.addText(c.no, { x: 0.5, y, w: 0.8, h: rowH - 0.1, fontFace: FONT, fontSize: 18, color: C.brown, bold: true, italic: true, valign: "middle", margin: 0 });
    s.addText(c.kor, { x: 1.4, y, w: 2.5, h: rowH - 0.1, fontFace: FONT, fontSize: 16, color: C.ink, bold: true, valign: "middle", margin: 0 });
    s.addText(c.eng, { x: 3.9, y, w: 2.5, h: rowH - 0.1, fontFace: FONT, fontSize: 9, color: C.brown, charSpacing: 3, valign: "middle", margin: 0 });
    s.addText(c.items, { x: 6.4, y, w: 3.2, h: rowH - 0.1, fontFace: FONT, fontSize: 9.5, color: C.inkSub, italic: true, valign: "middle", align: "right", margin: 0 });
    s.addShape(pres.shapes.LINE, { x: 0.5, y: y + rowH - 0.05, w: 9.0, h: 0, line: { color: C.line, width: 0.5 } });
  });

  addFooter(s, P());
}

// 도우미: 라벨 생성
const T = (text) => ({ text, style: "title" });
const S = (text) => ({ text, style: "sub" });

// ═════════════════════════════════════════════
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
    { image: "s02-img1.jpg", labels: [T("크림베이지"), S("600 × 2400 × 9T")] },
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
    { swatchColor: C.swatchMilkWhite, labels: [T("매트 밀크화이트  ·  SM-02"), S("두께 18T")] },
    { image: "s03-img1.jpg",           labels: [T("프렌치 오크  ·  PW-21"),    S("두께 18T")] },
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
    { image: "s08-img1.png", labels: [T("연결회의용탁자"), S("상석 1400 × 600 × 720 (2EA)  ·  일반 1400 × 600 × 720 (4EA)")] },
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
    { image: "s14-img1.png", labels: [T("AMC-WFR  ·  White"), S("1100 × 540 × 1825  (선반 3개)")] },
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
    { image: "s12-img1.png", labels: [T("LED 평판조명")] },
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
    { image: "p18-1.jpeg", labels: [T("빔프로젝트  ·  EL-YLK606"),    S("3LCD LASER 4K UHD · HDR/HLG · 1.6X ZOOM · 16W 스피커")] },
    { image: "p18-2.jpeg", labels: [T("빔스크린 (성지 울트라 매트 전동 매립 스크린)"), S("120\" (2400 × 1800)")] },
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
    { image: "blind-crop.jpg", labels: [T("블라인드"), S("콤비 블라인드")] },
  ],
});

// ═════════════════════════════════════════════
// SLIDE : 마무리 페이지
// ═════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.cream };

  // 우측 다크 블록 (표지의 좌측 블록과 대칭 — 책을 덮는 느낌)
  s.addShape(pres.shapes.RECTANGLE, {
    x: 6.5, y: 0, w: 3.5, h: 5.625,
    fill: { color: C.brownDk }, line: { color: C.brownDk, width: 0 },
  });

  // 다크 블록 상단 — 영문 태그
  s.addText("MATERIAL\nPROPOSAL", {
    x: 7.0, y: 0.6, w: 3, h: 1.0,
    fontFace: FONT, fontSize: 11, color: C.beige, bold: true,
    charSpacing: 6, lineSpacingMultiple: 1.4,
  });

  // 다크 블록 하단 — END 표기
  s.addText("END  OF  DOCUMENT", {
    x: 7.0, y: 4.85, w: 3, h: 0.3,
    fontFace: FONT, fontSize: 9, color: C.beige, bold: true,
    charSpacing: 5,
  });

  // 좌측 크림 영역 — 중앙 정렬 마무리 메시지
  // 작은 영문 태그
  s.addText("THANK  YOU", {
    x: 0.5, y: 1.9, w: 6, h: 0.35,
    fontFace: FONT, fontSize: 11, color: C.brown, bold: true,
    charSpacing: 8,
  });

  // 한글 메인 카피
  s.addText("감사합니다", {
    x: 0.5, y: 2.30, w: 6, h: 1.0,
    fontFace: FONT, fontSize: 48, color: C.ink, bold: true,
    margin: 0,
  });

  // 액센트 라인
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 3.35, w: 0.6, h: 0.04,
    fill: { color: C.brown }, line: { color: C.brown, width: 0 },
  });

  // 회사 마크 (작게)
  s.addText("PROPOSED BY", {
    x: 0.5, y: 3.65, w: 6, h: 0.25,
    fontFace: FONT, fontSize: 8.5, color: C.brown, bold: true, charSpacing: 4,
  });
  s.addText(COMPANY, {
    x: 0.5, y: 3.90, w: 6, h: 0.35,
    fontFace: FONT, fontSize: 14, color: C.brownDk, bold: true, charSpacing: 2,
  });

  // 푸터 (좌측 크림 영역에만)
  slide_footer_thanks: {
    s.addShape(pres.shapes.LINE, {
      x: 0.5, y: 5.25, w: 5.7, h: 0,
      line: { color: C.line, width: 0.5 },
    });
    s.addText(`${COMPANY}  ·  지엔티 마감재 제안서`, {
      x: 0.5, y: 5.32, w: 5, h: 0.22,
      fontFace: FONT, fontSize: 8, color: C.inkMute,
      charSpacing: 2, margin: 0,
    });
    s.addText("20 / 20", {
      x: 5.4, y: 5.32, w: 0.9, h: 0.22,
      fontFace: FONT, fontSize: 8, color: C.inkMute,
      align: "right", charSpacing: 2, margin: 0,
    });
  }
}

// 저장
pres.writeFile({
  fileName: "C:/Users/Administrator/Desktop/JM_클로드/지엔티_재료제안서/지엔티_마감재제안서_최종_v22.pptx"
}).then(fileName => {
  console.log("Saved:", fileName);
});
