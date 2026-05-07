const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, HeadingLevel, LevelFormat } = require("docx");

const NAS_PATH = "\\\\jm\\001_JM디자인\\2026.02.27_현대마린엔진 선주실\\010_마감사진";
const PHOTO_OUT = path.join(__dirname, "현대마린엔진_마감_사진");

// Images in publication order (매칭되는 HTML 순서)
const images = [
  { file: "KakaoTalk_20260415_112702870.jpg", caption: "▲ 입구 — 기존 레더 장식문 + 새 벽체 마감 조화" },
  { file: "KakaoTalk_20260415_112702870_01.jpg", caption: "▲ 회의 테이블 전체 뷰 — 입구 쪽에서 바라본 모습" },
  { file: "KakaoTalk_20260415_112702870_04.jpg", caption: "▲ 테이블 디테일 — 다크 상판에 우드 엣지 포인트" },
  { file: "KakaoTalk_20260415_144752765_02.jpg", caption: "▲ 안쪽에서 바라본 회의 공간 — 창호로 들어오는 자연광" },
  { file: "KakaoTalk_20260415_112702870_03.jpg", caption: "▲ 냉장고 + 수납장 배치 — 다크 톤으로 통일된 가구 라인" },
  { file: "KakaoTalk_20260415_112702870_12.jpg", caption: "▲ 반대편 뷰 — 냉장고와 수납장이 한 라인에 정렬" },
  { file: "KakaoTalk_20260415_144752765_04.jpg", caption: "▲ 다른 호실의 동일 가구 배치 — 3곳 모두 표준화 시공" },
  { file: "KakaoTalk_20260415_112702870_02.jpg", caption: "▲ TV 가벽 방향 — 콘크리트 패턴 포인트월과 레더 문 조화" },
  { file: "KakaoTalk_20260415_112702870_13.jpg", caption: "▲ 가벽 쪽에서 본 전체 공간" },
  { file: "KakaoTalk_20260415_112702870_05.jpg", caption: "▲ 회의 공간에서 본 탈의실 입구 — 다크 그레이 커튼" },
  { file: "KakaoTalk_20260415_112702870_07.jpg", caption: "▲ 커튼 디테일 — 차분한 다크 그레이 원단" },
  { file: "KakaoTalk_20260415_112702870_06.jpg", caption: "▲ 탈의실 입구 반대편 각도" },
  { file: "KakaoTalk_20260415_112702870_08.jpg", caption: "▲ 탈의실 내부 — 6칸 잠금형 로커 설치" },
  { file: "KakaoTalk_20260415_112702870_10.jpg", caption: "▲ 로커 정면 — 다크 그레이 매트 마감에 번호 라벨" },
  { file: "KakaoTalk_20260415_112702870_09.jpg", caption: "▲ 로커 클로즈업 — 개별 키 잠금 방식" },
  { file: "KakaoTalk_20260415_144752765.jpg", caption: "▲ 다른 호실의 로커 — 번호만 다르고 사양 동일" },
  { file: "KakaoTalk_20260415_112702870_14.jpg", caption: "▲ 천장 조명 — 부착형 LED 패널로 회의실 전체 균일 조명" },
  { file: "KakaoTalk_20260415_112702870_15.jpg", caption: "▲ 안쪽에서 조명 라인 확인 — 3개 라인으로 배치" },
  { file: "KakaoTalk_20260415_144752765_06.jpg", caption: "▲ 2호실 완성 모습 — 기본 구성은 동일" },
  { file: "KakaoTalk_20260415_144752765_08.jpg", caption: "▲ 다른 각도에서 본 2호실 — 화이트 벽 + 다크 가구 조합" },
  { file: "KakaoTalk_20260415_112702870_16.jpg", caption: "▲ 회의 테이블 중앙에서 바라본 최종 완성 모습" },
];

async function main() {
  if (!fs.existsSync(PHOTO_OUT)) fs.mkdirSync(PHOTO_OUT, { recursive: true });

  const imageMap = {};
  const imageSizes = {};
  let order = 1;
  for (const img of images) {
    const filePath = path.join(NAS_PATH, img.file);
    try {
      // 고품질 버전을 사진 폴더에 저장 (네이버 업로드용)
      const num = String(order).padStart(2, "0");
      const outHQ = path.join(PHOTO_OUT, `${num}_${img.file}`);
      await sharp(filePath)
        .rotate()
        .resize({ width: 1200, withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toFile(outHQ);

      // 압축 버전을 docx에 임베드 (파일 크기 최소화)
      const buffer = await sharp(filePath)
        .rotate()
        .resize({ width: 1000, withoutEnlargement: true })
        .jpeg({ quality: 75, mozjpeg: true })
        .toBuffer();
      const meta = await sharp(buffer).metadata();
      imageMap[img.file] = buffer;
      imageSizes[img.file] = { w: meta.width, h: meta.height };
      console.log("OK:", num, img.file, meta.width + "x" + meta.height, "→", Math.round(buffer.length / 1024), "KB");
      order++;
    } catch (e) {
      console.log("SKIP:", img.file, e.message);
    }
  }

  function makeImage(filename) {
    if (!imageMap[filename]) return [];
    const meta = imageSizes[filename];
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
      children: [new TextRun({ text: "창원 사무실 인테리어 완성 | 현대마린엔진 선주실 3곳 최종 마감 (Before & After)", bold: true, size: 32, font: "맑은 고딕" })],
    }),

    p(["안녕하세요, ", { text: "창원 사무실 인테리어", bold: true }, " 전문 ", { text: "제이엠건축인테리어", bold: true }, "입니다."]),
    p([
      "지난 편에서 ", { text: "창원 사무실 리모델링", bold: true },
      " 시공 과정을 보여드렸는데요, 오늘은 드디어 ",
      { text: "현대마린엔진 선주실 3곳 완성 마감", bold: true },
      " 모습을 공개합니다. 낡고 어두웠던 선주실이 어떻게 모던한 ",
      { text: "창원 기업 인테리어", bold: true },
      " 공간으로 변신했는지 Before & After로 비교해 드릴게요.",
    ]),
    p(["창원을 비롯해 김해, 진해, 마산 등 경남권에서 ", { text: "사무실 인테리어 업체", bold: true }, "를 찾고 계신 분들께 완성도 높은 기업 회의 공간이 어떻게 만들어지는지 참고가 되실 거예요."]),

    h2("프로젝트 요약"),
    bullet([{ text: "현장", bold: true }, ": 창원 현대마린엔진 선주실 3곳 (동일 사양 동시 진행)"]),
    bullet([{ text: "면적", bold: true }, ": 각 30㎡ (9평), 천장 높이 2700mm"]),
    bullet([{ text: "공사 기간", bold: true }, ": 약 2주 (2026.04.02 ~ 04.13)"]),
    bullet([{ text: "용도", bold: true }, ": 10인 회의실 + 작업자 탈의실 분리"]),
    bullet([{ text: "컨셉", bold: true }, ": 클린 모던 오피스 (화이트 + 다크 그레이 투톤)"]),

    h2("첫인상 — 입구 디테일"),
    p(["가장 먼저 눈에 들어오는 건 기존 ", { text: "빈티지한 레더 장식 출입문", bold: true }, "이에요. 이 문은 회사의 상징적인 요소라 그대로 유지하고, 주변 벽체만 리모델링했습니다."]),
    ...imgWithCaption("KakaoTalk_20260415_112702870.jpg", "▲ 입구 — 기존 레더 장식문 + 새 벽체 마감 조화"),
    p(["주변 벽은 ", { text: "콘크리트 패턴 데코타일 포인트월", bold: true }, "로 마감해서, 기존 문의 따뜻한 브라운 톤과 모던한 그레이 톤이 자연스럽게 어울리도록 했어요. 오래된 요소를 버리지 않고 살리면서 전체적인 무드를 업그레이드한 디테일입니다."]),

    h2("회의 공간 — 10인용 대형 테이블 중심"),
    p(["공간의 중심은 ", { text: "다크 상판 + 우드 엣지의 10인용 회의 테이블", bold: true }, "입니다."]),
    ...imgWithCaption("KakaoTalk_20260415_112702870_01.jpg", "▲ 회의 테이블 전체 뷰 — 입구 쪽에서 바라본 모습"),
    ...imgWithCaption("KakaoTalk_20260415_112702870_04.jpg", "▲ 테이블 디테일 — 다크 상판에 우드 엣지 포인트"),
    ...imgWithCaption("KakaoTalk_20260415_144752765_02.jpg", "▲ 안쪽에서 바라본 회의 공간 — 창호로 들어오는 자연광"),
    p(["테이블 상판은 무광 다크 그레이, 엣지는 우드 마감으로 포인트를 주었습니다. 회의실 분위기가 너무 딱딱하지 않도록 ", { text: "우드 엣지 한 줄", bold: true }, "로 따뜻함을 더한 디자인이에요."]),
    p(["의자는 ", { text: "블랙 메쉬 사무용 의자", bold: true }, " 10석으로 통일. 장시간 회의에도 피로감 적은 메쉬 타입을 선택했습니다."]),

    h2("가구 — 다크 그레이 톤으로 통일"),
    ...imgWithCaption("KakaoTalk_20260415_112702870_03.jpg", "▲ 냉장고 + 수납장 배치 — 다크 톤으로 통일된 가구 라인"),
    ...imgWithCaption("KakaoTalk_20260415_112702870_12.jpg", "▲ 반대편 뷰 — 냉장고와 수납장이 한 라인에 정렬"),
    ...imgWithCaption("KakaoTalk_20260415_144752765_04.jpg", "▲ 다른 호실의 동일 가구 배치 — 3곳 모두 표준화 시공"),
    p(["벽면을 따라 ", { text: "다크 그레이 잠금형 수납장", bold: true }, "과 ", { text: "다크 실버 대형 냉장고", bold: true }, "를 한 라인에 배치했습니다. 가구 색상을 통일하니 공간이 훨씬 정돈되어 보이죠."]),
    p(["수납장은 잠금 기능이 있어 중요한 서류나 개인 물품 보관이 가능하고, 냉장고는 회의 중 음료를 보관하는 용도입니다."]),

    h2("포인트 — TV 가벽과 데코타일 포인트월"),
    p(["이번 프로젝트의 핵심 디자인 포인트인 ", { text: "TV 가벽", bold: true }, "과 ", { text: "콘크리트 패턴 데코타일 포인트월", bold: true }, "입니다."]),
    ...imgWithCaption("KakaoTalk_20260415_112702870_02.jpg", "▲ TV 가벽 방향 — 콘크리트 패턴 포인트월과 레더 문 조화"),
    ...imgWithCaption("KakaoTalk_20260415_112702870_13.jpg", "▲ 가벽 쪽에서 본 전체 공간"),
    p(["TV가 걸릴 가벽은 탈의실과 회의공간을 분리하는 구조적 역할을 하면서, 동시에 모니터를 걸어 프레젠테이션/화상회의용으로 쓰입니다. ", { text: "한 벽이 두 가지 역할", bold: true }, "을 하는 효율적인 설계예요."]),
    p(["가벽 뒤쪽 벽면에는 ", { text: "콘크리트 패턴 데코타일", bold: true }, "을 포인트월로 시공해서, 화이트 톤 일색의 단조로움을 피하고 시선이 머무는 포인트를 만들었습니다."]),

    h2("탈의실 — 커튼으로 분리된 프라이빗 공간"),
    p(["우측 끝 공간은 ", { text: "커튼으로 분리된 탈의실", bold: true }, "입니다."]),
    ...imgWithCaption("KakaoTalk_20260415_112702870_05.jpg", "▲ 회의 공간에서 본 탈의실 입구 — 다크 그레이 커튼"),
    ...imgWithCaption("KakaoTalk_20260415_112702870_07.jpg", "▲ 커튼 디테일 — 차분한 다크 그레이 원단"),
    ...imgWithCaption("KakaoTalk_20260415_112702870_06.jpg", "▲ 탈의실 입구 반대편 각도"),
    p(["고급스러운 ", { text: "다크 그레이 톤 커튼", bold: true }, "으로 마감해서, 평소에는 회의 공간의 포인트 패브릭 역할을 하다가 탈의가 필요할 때는 빠르게 공간을 분리할 수 있어요. 문 방식보다 유연하고, 전체 인테리어 톤과도 잘 어우러집니다."]),

    h2("6칸 잠금형 로커 — 실용성과 디자인을 동시에"),
    ...imgWithCaption("KakaoTalk_20260415_112702870_08.jpg", "▲ 탈의실 내부 — 6칸 잠금형 로커 설치"),
    ...imgWithCaption("KakaoTalk_20260415_112702870_10.jpg", "▲ 로커 정면 — 다크 그레이 매트 마감에 번호 라벨"),
    ...imgWithCaption("KakaoTalk_20260415_112702870_09.jpg", "▲ 로커 클로즈업 — 개별 키 잠금 방식"),
    ...imgWithCaption("KakaoTalk_20260415_144752765.jpg", "▲ 다른 호실의 로커 — 번호만 다르고 사양 동일"),
    p(["탈의실에는 ", { text: "6칸 잠금형 철제 로커", bold: true }, "를 설치했습니다. 각 칸마다 독립된 키 잠금 시스템이 있어서 현장 작업자들이 개인 물품을 안전하게 보관할 수 있어요."]),
    p(["3곳 모두 동일한 로커를 설치했고, 번호 라벨만 호실별로 다릅니다. (1호실: 1~6번, 2호실: 7~12번, 3호실: 13~18번)"]),

    h2("조명 — 부착형 LED로 균일한 조도"),
    ...imgWithCaption("KakaoTalk_20260415_112702870_14.jpg", "▲ 천장 조명 — 부착형 LED 패널로 회의실 전체 균일 조명"),
    ...imgWithCaption("KakaoTalk_20260415_112702870_15.jpg", "▲ 안쪽에서 조명 라인 확인 — 3개 라인으로 배치"),
    p(["천장은 ", { text: "부착형 LED 패널 조명", bold: true }, "을 3라인으로 배치했습니다. 매입이 아닌 부착형을 선택한 이유는, 기존 텍스 천장 구조를 최소한으로 손대면서도 조도를 확보하기 위해서예요."]),
    p(["화상회의나 서류 작업에 충분한 밝기를 제공하면서도, 눈부심 없이 균일한 조명이 들어와요."]),

    h2("3곳 동시 완성 — 표준화의 힘"),
    ...imgWithCaption("KakaoTalk_20260415_144752765_06.jpg", "▲ 2호실 완성 모습 — 기본 구성은 동일"),
    ...imgWithCaption("KakaoTalk_20260415_144752765_08.jpg", "▲ 다른 각도에서 본 2호실 — 화이트 벽 + 다크 가구 조합"),
    ...imgWithCaption("KakaoTalk_20260415_112702870_16.jpg", "▲ 회의 테이블 중앙에서 바라본 최종 완성 모습"),
    p(["이번 ", { text: "창원 사무실 리모델링", bold: true }, " 프로젝트의 가장 큰 특징은 ", { text: "동일 사양 3곳을 동시에 진행", bold: true }, "했다는 점이에요."]),
    bullet(["자재/가구 ", { text: "일괄 발주", bold: true }, "로 원가 절감"]),
    bullet(["동일 공정 반복으로 ", { text: "시공 품질 일관성", bold: true }, " 확보"]),
    bullet(["한 곳에서 잡은 노하우로 나머지 두 곳 ", { text: "속도와 완성도 동시", bold: true }, " 확보"]),
    bullet(["3곳 사용자 모두 ", { text: "동일한 사용성 경험", bold: true }]),

    h2("Before & After 요약"),
    p([{ text: "천장", bold: true }, ": 낡은 텍스 + 갈색 몰딩  →  화이트 천장 + 부착형 LED 패널"]),
    p([{ text: "벽체", bold: true }, ": 낡은 벽지, 배관 노출  →  화이트 도배 + 콘크리트 포인트월"]),
    p([{ text: "바닥", bold: true }, ": 어두운 나무 바닥재 노후화  →  라이트 그레이 데코타일"]),
    p([{ text: "가구", bold: true }, ": 오래된 나무 테이블 + 낡은 의자  →  다크 그레이 대형 테이블 + 메쉬 의자 10석"]),
    p([{ text: "수납", bold: true }, ": 부족, 정리 안됨  →  잠금형 2단 수납장 + 6칸 로커"]),
    p([{ text: "탈의 공간", bold: true }, ": 없음 (회의실 겸용)  →  커튼 + 가벽으로 분리된 독립 공간"]),

    h2("마무리"),
    p([
      "이렇게 ", { text: "현대마린엔진 선주실 3곳 동시 리모델링", bold: true },
      " 프로젝트의 디자인부터 시공, 그리고 최종 마감까지 전 과정을 3편에 걸쳐 공유해 드렸습니다.",
    ]),
    p([
      "낡고 어두웠던 공간이 ", { text: "모던한 기업 회의 공간", bold: true },
      "으로 변신했고, 동일 사양 3곳을 동시에 진행하면서도 품질 일관성을 확보한 프로젝트였어요. 이런 대규모 ",
      { text: "창원 기업 인테리어", bold: true }, ", ",
      { text: "창원 공장 사무실 인테리어", bold: true },
      "가 필요하시다면 제이엠건축인테리어가 도와드리겠습니다.",
    ]),
    p(["이전 편도 함께 읽어보세요:"]),
    bullet([{ text: "1편", bold: true }, ": 창원 사무실 인테리어 | 현대마린엔진 선주실 3곳 디자인/설계 과정"]),
    bullet([{ text: "2편", bold: true }, ": 창원 사무실 리모델링 | 현대마린엔진 선주실 3곳 시공 과정"]),
    bullet([{ text: "3편", bold: true }, ": (이 글) 창원 사무실 인테리어 완성 | 현대마린엔진 선주실 3곳 최종 마감"]),
    p([
      { text: "창원 사무실 인테리어", bold: true }, ", ",
      { text: "창원 사무실 리모델링", bold: true },
      ", 기업 회의실/선주실 공사에 관심 있으시다면 편하게 문의 주세요. 창원을 비롯해 김해, 진해, 마산 등 경남권 ",
      { text: "사무실 인테리어 업체", bold: true },
      "를 찾고 계신다면 제이엠건축인테리어가 도와드리겠습니다.",
    ]),

    new Paragraph({ spacing: { before: 400 } }),
    p([{ text: "태그: ", bold: true }, "창원인테리어, 창원사무실인테리어, 창원사무실리모델링, 창원사무실공사, 창원기업인테리어, 창원상가인테리어, 창원회의실인테리어, 창원공장사무실인테리어, 김해사무실인테리어, 진해인테리어, 마산인테리어, 사무실인테리어업체, 사무실인테리어추천, BeforeAfter, 사무실인테리어마감, 데코타일, 포인트월, 기업회의실, 현대마린엔진, 제이엠건축인테리어"]),
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

  const outputPath = path.join(__dirname, "현대마린엔진_선주실_마감.docx");
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log("\nDONE:", outputPath, "→", Math.round(buffer.length / 1024), "KB");
  console.log("사진 폴더:", PHOTO_OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
