const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, HeadingLevel, LevelFormat } = require("docx");

const NAS_PATH = "\\\\jm\\001_JM디자인\\2026.02.27_현대마린엔진 선주실\\009_시공사진";

const images = [
  { file: "KakaoTalk_20260402_192116171.jpg", caption: "▲ 기존 수납장 해체 작업 진행 중" },
  { file: "KakaoTalk_20260402_192116171_01.jpg", caption: "▲ KNAUF 석고보드로 벽체 작업 시작 — 각재 세우고 석고보드 마감 진행" },
  { file: "KakaoTalk_20260402_192116171_03.jpg", caption: "▲ 석고보드 벽체 마감 진행 모습 — 바닥 콘크리트 노출 상태" },
  { file: "KakaoTalk_20260404_124742456.jpg", caption: "▲ 벽면 상단 몰딩 설치 작업 중" },
  { file: "KakaoTalk_20260404_124742456_02.jpg", caption: "▲ 출입문 주변 MDF 프레임 마감 — 문 상부와 양옆을 깔끔하게 감싸는 작업" },
  { file: "KakaoTalk_20260404_124742456_03.jpg", caption: "▲ 벽체 마감 후 전기 배선 작업 병행" },
  { file: "KakaoTalk_20260407_172841915_02.jpg", caption: "▲ 문틀 주변 마감 처리 — 도배 전 면을 정리하는 과정" },
  { file: "KakaoTalk_20260407_172841915_03.jpg", caption: "▲ 도배 작업 진행 중 — 화이트 벽지로 밝은 공간 연출" },
  { file: "KakaoTalk_20260410_192821301_02.jpg", caption: "▲ 데코타일 시공 중 — 접착제를 바르고 타일을 붙이는 작업" },
  { file: "KakaoTalk_20260410_192821301_04.jpg", caption: "▲ 한쪽 벽면 콘크리트 패턴 데코타일 포인트월 시공" },
  { file: "KakaoTalk_20260410_192821301_03.jpg", caption: "▲ 도배 완료 + 데코타일 진행 중인 전체 모습" },
  { file: "KakaoTalk_20260411_130234104.jpg", caption: "▲ 의자 반입 — 비닐 포장 상태로 배치 시작" },
  { file: "KakaoTalk_20260411_130234104_01.jpg", caption: "▲ 수납장 설치 — 보호필름 부착 상태" },
  { file: "KakaoTalk_20260411_130234104_03.jpg", caption: "▲ 탈의실 6칸 잠금형 로커(사물함) 클로즈업" },
  { file: "KakaoTalk_20260413_183246950.jpg", caption: "▲ 가구 배치 진행 중 — 수납장, 냉장고, 테이블, 의자 세팅" },
  { file: "KakaoTalk_20260413_183246950_02.jpg", caption: "▲ 거의 완성된 모습 — 테이블과 의자 배치 완료" },
  { file: "KakaoTalk_20260413_183246950_03.jpg", caption: "▲ 탈의실 — 6칸 잠금형 로커 설치 완료" },
  { file: "KakaoTalk_20260413_183246950_04.jpg", caption: "▲ 완성 — 수납장과 냉장고 배치 전경" },
];

async function main() {
  const imageMap = {};
  const imageSizes = {};
  const imageOrder = {}; // filename → order number (01, 02, ...)
  let order = 1;
  for (const img of images) {
    imageOrder[img.file] = String(order).padStart(2, "0");
    order++;
    const filePath = path.join(NAS_PATH, img.file);
    try {
      const resized = sharp(filePath)
        .rotate()
        .resize({ width: 1000, withoutEnlargement: true })
        .jpeg({ quality: 75, mozjpeg: true });
      const buffer = await resized.toBuffer();
      const meta = await sharp(buffer).metadata();
      imageMap[img.file] = buffer;
      imageSizes[img.file] = { w: meta.width, h: meta.height };
      console.log("OK:", img.file, meta.width + "x" + meta.height, "→", Math.round(buffer.length / 1024), "KB");
    } catch (e) {
      console.log("SKIP:", img.file, e.message);
    }
  }

  function makeImage(filename) {
    if (!imageMap[filename]) return [];
    const meta = imageSizes[filename];
    // Display at max 500px width, keep aspect ratio
    const displayW = 500;
    const displayH = Math.round((meta.h / meta.w) * displayW);
    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 0 },
        children: [
          new ImageRun({
            type: "jpg",
            data: imageMap[filename],
            transformation: { width: displayW, height: displayH },
            altText: { title: filename, description: filename, name: filename },
          }),
        ],
      }),
    ];
  }

  function makeCaption(text) {
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
      children: [new TextRun({ text, size: 18, color: "888888", font: "맑은 고딕" })],
    });
  }

  function h2(text) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text, bold: true, size: 28, font: "맑은 고딕" })],
    });
  }

  function p(runs) {
    return new Paragraph({
      spacing: { before: 100, after: 100 },
      children: runs.map(r =>
        typeof r === "string"
          ? new TextRun({ text: r, size: 22, font: "맑은 고딕" })
          : new TextRun({ text: r.text, bold: r.bold, size: 22, font: "맑은 고딕" })
      ),
    });
  }

  function bullet(runs) {
    return new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      spacing: { before: 60, after: 60 },
      children: runs.map(r =>
        typeof r === "string"
          ? new TextRun({ text: r, size: 22, font: "맑은 고딕" })
          : new TextRun({ text: r.text, bold: r.bold, size: 22, font: "맑은 고딕" })
      ),
    });
  }

  function imgWithCaption(filename, caption) {
    const captionWithFile = `[${filename}] ${caption}`;
    return [...makeImage(filename), makeCaption(captionWithFile)];
  }

  const children = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
      children: [new TextRun({ text: "창원 사무실 리모델링 | 현대마린엔진 선주실 3곳 시공 과정 (동시 진행)", bold: true, size: 36, font: "맑은 고딕" })],
    }),
    p(["안녕하세요, ", { text: "창원 사무실 인테리어", bold: true }, " 전문 ", { text: "제이엠건축인테리어", bold: true }, "입니다."]),
    p([
      "지난 편에서 ", { text: "현대마린엔진 선주실 리모델링", bold: true },
      "의 디자인/설계 과정을 소개해 드렸는데요, 오늘은 본격적인 ",
      { text: "창원 사무실 리모델링", bold: true },
      " 시공 과정을 공유하겠습니다. 이번 ",
      { text: "창원 사무실 공사", bold: true },
      "는 동일 사양 3곳을 동시에 진행한 대규모 프로젝트인 만큼, 공정별로 어떻게 효율적으로 작업했는지를 중심으로 보여드릴게요.",
    ]),
    p(["창원을 비롯해 김해, 진해, 마산 등 경남권에서 ", { text: "사무실 인테리어 업체", bold: true }, "를 찾고 계신 분들께 시공 프로세스를 이해하는 데 도움이 되실 거예요."]),

    h2("시공 일정 개요"),
    p(["전체 시공은 약 ", { text: "2주(4/2~4/13)", bold: true }, " 안에 마무리되었습니다. 공정 순서는 이렇습니다."]),
    bullet([{ text: "1단계", bold: true }, ": 기존 가구 철거 + 벽체 목공 (4/2)"]),
    bullet([{ text: "2단계", bold: true }, ": 몰딩 + 문틀 마감 (4/4)"]),
    bullet([{ text: "3단계", bold: true }, ": 도배 (4/7)"]),
    bullet([{ text: "4단계", bold: true }, ": 데코타일 시공 (4/10)"]),
    bullet([{ text: "5단계", bold: true }, ": 가구/비품 반입 및 배치 (4/11~4/13)"]),

    h2("1단계 — 철거 및 벽체 목공 (4/2)"),
    p(["첫날은 기존 가구 철거와 동시에 새로운 벽체 작업을 진행했습니다."]),
    ...imgWithCaption("KakaoTalk_20260402_192116171.jpg", "▲ 기존 수납장 해체 작업 진행 중"),
    ...imgWithCaption("KakaoTalk_20260402_192116171_01.jpg", "▲ KNAUF 석고보드로 벽체 작업 시작 — 각재 세우고 석고보드 마감 진행"),
    ...imgWithCaption("KakaoTalk_20260402_192116171_03.jpg", "▲ 석고보드 벽체 마감 진행 모습 — 바닥 콘크리트 노출 상태"),
    p([
      "기존 낡은 벽지와 몰딩을 걷어내고, ",
      { text: "각재로 골조를 세운 뒤 KNAUF 석고보드", bold: true },
      "를 붙여 새 벽체를 만들었습니다. 이 단계에서 TV 가벽도 함께 세워 회의공간과 탈의실을 분리하는 구조를 잡았어요.",
    ]),
    p([
      "사진을 보시면 ",
      { text: "부착형 LED 패널 조명", bold: true },
      "이 이미 설치되어 있는 것이 보이실 겁니다. 천장 작업과 조명 설치를 먼저 진행한 뒤 벽체 작업에 들어갔습니다.",
    ]),

    h2("2단계 — 몰딩 + 문틀 마감 (4/4)"),
    p(["벽체가 완성되면 디테일 마감 작업에 들어갑니다."]),
    ...imgWithCaption("KakaoTalk_20260404_124742456.jpg", "▲ 벽면 상단 몰딩 설치 작업 중"),
    ...imgWithCaption("KakaoTalk_20260404_124742456_02.jpg", "▲ 출입문 주변 MDF 프레임 마감 — 문 상부와 양옆을 깔끔하게 감싸는 작업"),
    ...imgWithCaption("KakaoTalk_20260404_124742456_03.jpg", "▲ 벽체 마감 후 전기 배선 작업 병행"),
    p([
      "몰딩은 벽과 천장이 만나는 부분을 깔끔하게 마감하는 역할을 합니다. 출입문 주변은 ",
      { text: "MDF 프레임", bold: true },
      "으로 감싸서 기존 문과 새 벽체가 자연스럽게 이어지도록 처리했습니다.",
    ]),
    p(["동시에 콘센트와 스위치 배선 작업도 함께 진행했습니다. 회의실 특성상 테이블 주변에 콘센트가 필요하거든요."]),

    h2("3단계 — 도배 (4/7)"),
    p(["벽체 골조와 몰딩이 끝나면 도배 작업을 진행합니다."]),
    ...imgWithCaption("KakaoTalk_20260407_172841915_02.jpg", "▲ 문틀 주변 마감 처리 — 도배 전 면을 정리하는 과정"),
    ...imgWithCaption("KakaoTalk_20260407_172841915_03.jpg", "▲ 도배 작업 진행 중 — 화이트 벽지로 밝은 공간 연출"),
    p([
      "석고보드 이음새와 나사 자국 부분을 메꿔 면을 고른 뒤, ",
      { text: "초배 → 정배", bold: true },
      " 순서로 도배를 진행했습니다. 이 하지 처리를 얼마나 꼼꼼히 하느냐에 따라 도배 마감의 완성도가 달라집니다.",
    ]),
    p(["벽지는 ", { text: "화이트", bold: true }, "로 진행하여 전체적으로 밝고 깔끔한 분위기를 만들었습니다."]),

    h2("4단계 — 데코타일 시공 (4/10)"),
    p(["도배가 끝나면 바닥과 포인트 벽면에 데코타일을 시공합니다."]),
    ...imgWithCaption("KakaoTalk_20260410_192821301_02.jpg", "▲ 데코타일 시공 중 — 접착제를 바르고 타일을 붙이는 작업"),
    ...imgWithCaption("KakaoTalk_20260410_192821301_04.jpg", "▲ 한쪽 벽면 콘크리트 패턴 데코타일 포인트월 시공"),
    ...imgWithCaption("KakaoTalk_20260410_192821301_03.jpg", "▲ 도배 완료 + 데코타일 진행 중인 전체 모습"),
    p([
      "이번 프로젝트에서 눈여겨볼 포인트가 바로 이 부분입니다. 바닥은 ",
      { text: "라이트 그레이 데코타일", bold: true },
      "로 깔끔하게 마감하고, 한쪽 긴 벽면에는 ",
      { text: "콘크리트 패턴 데코타일", bold: true },
      "을 포인트월로 시공했습니다.",
    ]),
    p(["화이트 도배 벽 + 그레이 데코타일 포인트월의 조합이 모던하면서도 차분한 분위기를 만들어주는데요, 기업 회의 공간에 딱 맞는 톤이에요."]),

    h2("5단계 — 가구/비품 반입 (4/11~4/13)"),
    p(["마감이 끝나면 가구와 비품을 반입하고 최종 배치합니다."]),
    ...imgWithCaption("KakaoTalk_20260411_130234104.jpg", "▲ 의자 반입 — 비닐 포장 상태로 배치 시작"),
    ...imgWithCaption("KakaoTalk_20260411_130234104_01.jpg", "▲ 수납장 설치 — 보호필름 부착 상태"),
    ...imgWithCaption("KakaoTalk_20260411_130234104_03.jpg", "▲ 탈의실 6칸 잠금형 로커(사물함) 클로즈업"),
    ...imgWithCaption("KakaoTalk_20260413_183246950.jpg", "▲ 가구 배치 진행 중 — 수납장, 냉장고, 테이블, 의자 세팅"),
    ...imgWithCaption("KakaoTalk_20260413_183246950_02.jpg", "▲ 거의 완성된 모습 — 테이블과 의자 배치 완료"),
    p([{ text: "다크 그레이 톤", bold: true }, "으로 가구를 통일했습니다."]),
    bullet([{ text: "회의 테이블", bold: true }, ": 다크 상판 + 우드 엣지의 10인용 대형 테이블"]),
    bullet([{ text: "의자", bold: true }, ": 블랙 메쉬 사무용 의자"]),
    bullet([{ text: "수납장", bold: true }, ": 다크 그레이 잠금형 2단 수납장"]),
    bullet([{ text: "냉장고", bold: true }, ": 다크 실버 대형 냉장고로 교체"]),
    p([
      "화이트 벽 + 그레이 데코타일 + 다크 가구의 조합이 ",
      { text: "모던하면서도 무게감 있는 기업 이미지", bold: true },
      "를 완성해줍니다.",
    ]),

    h2("탈의실 공간"),
    p(["TV 가벽으로 분리한 우측 공간에는 ", { text: "6칸 잠금형 로커(사물함)", bold: true }, "를 설치했습니다."]),
    ...imgWithCaption("KakaoTalk_20260413_183246950_03.jpg", "▲ 탈의실 — 6칸 잠금형 로커 설치 완료"),
    p(["현장 작업자분들이 개인 물품을 안전하게 보관할 수 있는 공간이에요. 가벽 덕분에 회의공간과 완전히 분리되어 프라이버시도 확보됩니다."]),

    h2("시공 과정 요약"),
    p(["이번 현대마린엔진 선주실 시공의 핵심을 정리하면 이렇습니다."]),
    bullet([{ text: "공사 기간", bold: true }, ": 약 2주 (4/2~4/13)"]),
    bullet([{ text: "공정 순서", bold: true }, ": 철거 → 목공(각재+석고보드) → 몰딩 → 도배 → 데코타일 → 가구 반입"]),
    bullet([{ text: "동시 진행", bold: true }, ": 3곳 동일 사양으로 표준화 시공 → 자재 일괄 발주, 공정 효율 극대화"]),
    bullet([{ text: "포인트", bold: true }, ": 콘크리트 패턴 데코타일 포인트월 + 다크 톤 가구 조합"]),

    h2("마무리"),
    p(["이렇게 현대마린엔진 선주실의 시공 과정을 공정별로 상세히 공유해 드렸습니다. 철거부터 가구 배치까지, 하나하나 단계를 밟아야 깔끔한 결과물이 나옵니다."]),
    p([
      "특히 이번 ",
      { text: "창원 사무실 리모델링", bold: true },
      " 프로젝트는 ",
      { text: "동일 사양 3곳 동시 시공", bold: true },
      "이었기 때문에, 한 곳에서 잡은 노하우를 나머지 두 곳에 바로 적용하면서 품질을 높여갈 수 있었습니다. 대규모 ",
      { text: "창원 기업 인테리어", bold: true },
      "나 공장 부지 사무실 인테리어도 저희 제이엠건축인테리어가 전문 영역입니다.",
    ]),
    p([{ text: "다음 편에서는 완성된 최종 마감 모습", bold: true }, "을 Before & After로 비교해 보여드리겠습니다. 기대해 주세요!"]),
    p(["이전 편 — ", { text: "디자인/설계 과정", bold: true }, "도 함께 읽어보시면 프로젝트의 전체 흐름을 이해하시기 좋습니다."]),
    p([
      { text: "창원 사무실 인테리어", bold: true }, ", ",
      { text: "창원 사무실 리모델링", bold: true },
      ", 기업 회의실/선주실 공사에 관심 있으시다면 편하게 문의 주세요. 창원을 비롯해 김해, 진해, 마산 등 경남권 ",
      { text: "사무실 인테리어 업체", bold: true },
      "를 찾고 계신다면 제이엠건축인테리어가 도와드리겠습니다.",
    ]),

    new Paragraph({ spacing: { before: 400 } }),
    p([{ text: "태그: ", bold: true }, "창원인테리어, 창원사무실인테리어, 창원사무실리모델링, 창원사무실공사, 창원기업인테리어, 창원상가인테리어, 창원회의실인테리어, 창원공장사무실인테리어, 김해사무실인테리어, 진해인테리어, 마산인테리어, 사무실인테리어업체, 사무실인테리어추천, 사무실시공과정, 목공사, 도배, 데코타일, 포인트월, 현대마린엔진, 제이엠건축인테리어"]),
  ];

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  const outputPath = path.join(__dirname, "현대마린엔진_선주실_시공_최종v2.docx");
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log("DONE:", outputPath, "→", Math.round(buffer.length / 1024), "KB");
}

main().catch(e => { console.error(e); process.exit(1); });
