const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, HeadingLevel, LevelFormat } = require("docx");

const NAS_PATH = "\\\\jm\\001_JM디자인\\2026.03.06_린데코리아 사무실\\010_마감사진";
const PHOTO_OUT = path.join(__dirname, "린데코리아_마감_사진");

const images = [
  { file: "KakaoTalk_20260429_120648798.jpg", caption: "▲ 라인 LED 조명 — 5라인 평행 배치로 입체감 있는 천장" },
  { file: "KakaoTalk_20260429_120648798_03.jpg", caption: "▲ 전체 뷰 — 라인 LED + 우드 패널 + 다크 사물함의 조화" },
  { file: "KakaoTalk_20260429_120648798_07.jpg", caption: "▲ 라이트 우드 패널 벽 — 라인 홈 디테일이 입체감 부여" },
  { file: "KakaoTalk_20260429_120648798_08.jpg", caption: "▲ 우드 패널 + 화이트보드 + 창문 블라인드의 조합" },
  { file: "KakaoTalk_20260429_120648798_11.jpg", caption: "▲ 락커룸 영역 — 대형 다크 그레이 사물함 풀 월" },
  { file: "KakaoTalk_20260429_120648798_05.jpg", caption: "▲ 메인 월 — 대형 모니터 + 천장형 시스템 디스플레이" },
];

async function main() {
  if (!fs.existsSync(PHOTO_OUT)) fs.mkdirSync(PHOTO_OUT, { recursive: true });

  const imageMap = {};
  const imageSizes = {};
  let order = 1;
  for (const img of images) {
    const filePath = path.join(NAS_PATH, img.file);
    try {
      const num = String(order).padStart(2, "0");
      const outHQ = path.join(PHOTO_OUT, `${num}_${img.file}`);
      await sharp(filePath)
        .rotate()
        .resize({ width: 1200, withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toFile(outHQ);

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

  const make = (filename, displayW = 500) => {
    if (!imageMap[filename]) return [];
    const meta = imageSizes[filename];
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
  };
  const cap = (text) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
      children: [new TextRun({ text, size: 18, color: "888888", font: "맑은 고딕" })],
    });
  const h2 = (text) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text, bold: true, size: 28, font: "맑은 고딕" })],
    });
  const p = (runs) =>
    new Paragraph({
      spacing: { before: 100, after: 100 },
      children: runs.map(r =>
        typeof r === "string"
          ? new TextRun({ text: r, size: 22, font: "맑은 고딕" })
          : new TextRun({ text: r.text, bold: r.bold, size: 22, font: "맑은 고딕" })
      ),
    });
  const bullet = (runs) =>
    new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      spacing: { before: 60, after: 60 },
      children: runs.map(r =>
        typeof r === "string"
          ? new TextRun({ text: r, size: 22, font: "맑은 고딕" })
          : new TextRun({ text: r.text, bold: r.bold, size: 22, font: "맑은 고딕" })
      ),
    });
  const ic = (filename, caption) => [...make(filename), cap(`[${filename}] ${caption}`)];

  const children = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
      children: [new TextRun({ text: "창원 공장 사무실 인테리어 완성 | 린데코리아 사무공간 최종 마감 (Before & After)", bold: true, size: 30, font: "맑은 고딕" })],
    }),
    p(["안녕하세요, ", { text: "창원 사무실 인테리어", bold: true }, " 전문 ", { text: "제이엠건축인테리어", bold: true }, "입니다."]),
    p([
      "지난 편에서 ", { text: "린데코리아 사무실 리모델링", bold: true },
      " 시공 과정을 단계별로 보여드렸는데요, 오늘은 드디어 ",
      { text: "완성된 최종 마감", bold: true },
      " 모습을 공개합니다. 노후된 적벽돌 사무동이 어떻게 모던한 ",
      { text: "창원 기업 인테리어", bold: true },
      " 공간으로 변신했는지 Before & After로 비교해 드릴게요.",
    ]),
    p(["창원을 비롯해 김해, 진해, 마산 등 경남권에서 ", { text: "공장 사무실 인테리어", bold: true }, "나 ", { text: "산업단지 사무공간 리모델링", bold: true }, "을 검토 중이시라면 완성도 높은 결과물을 참고하시기 좋아요."]),

    h2("프로젝트 요약"),
    bullet([{ text: "현장", bold: true }, ": 창원 린데코리아 사무동 (산업가스 플랜트 부지)"]),
    bullet([{ text: "구성", bold: true }, ": 오픈 사무공간 + 회의실 + 탕비실 + 락커룸"]),
    bullet([{ text: "공사 기간", bold: true }, ": 약 3주 (4/1 ~ 4/23)"]),
    bullet([{ text: "컨셉", bold: true }, ": 따뜻한 인더스트리얼 (라이트 우드 + 다크 그레이 + 라인 LED)"]),

    h2("첫인상 — 라인 LED 조명이 만드는 임팩트"),
    p(["완성된 사무공간에 들어서면 가장 먼저 시선을 끄는 건 천장의 ", { text: "라인 LED 조명 패턴", bold: true }, "입니다."]),
    ...ic("KakaoTalk_20260429_120648798.jpg", "▲ 라인 LED 조명 — 5라인 평행 배치로 입체감 있는 천장"),
    ...ic("KakaoTalk_20260429_120648798_03.jpg", "▲ 전체 뷰 — 라인 LED + 우드 패널 + 다크 사물함의 조화"),
    p(["일반적인 패널 LED가 아니라 ", { text: "긴 라인 형태의 LED 조명", bold: true }, "을 5~6개 평행으로 배치했습니다. 이 디자인의 효과는요:"]),
    bullet(["높은 천장 공간에 ", { text: "리듬과 입체감", bold: true }, " 부여"]),
    bullet(["전체 공간에 ", { text: "균일한 확산광", bold: true }, " 제공으로 그림자 최소화"]),
    bullet(["모던하고 미래지향적인 ", { text: "기업 이미지", bold: true }, " 연출"]),
    bullet(["화상회의/교육 시 화면 반사 적은 ", { text: "간접 조명 효과", bold: true }]),

    h2("우드 패널 벽 — 따뜻한 톤의 마감"),
    ...ic("KakaoTalk_20260429_120648798_07.jpg", "▲ 라이트 우드 패널 벽 — 라인 홈 디테일이 입체감 부여"),
    ...ic("KakaoTalk_20260429_120648798_08.jpg", "▲ 우드 패널 + 화이트보드 + 창문 블라인드의 조합"),
    p(["벽면은 ", { text: "라이트 우드 패널", bold: true }, "로 마감해 산업 시설 특유의 차가운 분위기를 따뜻하게 중화했습니다. 패널 사이에 들어간 ", { text: "라인 홈 디테일", bold: true }, "이 단조롭지 않은 입체감을 만들어주고, 자연광이 들어올 때 결의 음영이 살아나는 마감재예요."]),
    p(["벽면 한쪽에는 ", { text: "대형 화이트보드", bold: true }, "를 매립형으로 설치해 회의나 교육 시 활용도를 높였습니다."]),

    h2("다크 그레이 사물함 — 공간의 무게중심"),
    ...ic("KakaoTalk_20260429_120648798_11.jpg", "▲ 락커룸 영역 — 대형 다크 그레이 사물함 풀 월"),
    p(["한쪽 벽 전체를 채운 ", { text: "대형 다크 그레이 사물함", bold: true }, "이 공간의 무게중심 역할을 합니다. 라이트 우드 톤이 가벼워질 수 있는 공간에 ", { text: "강한 대비", bold: true }, "를 만들어 인테리어가 단조롭지 않게 잡아주는 핵심 요소예요."]),
    p(["사물함은:"]),
    bullet([{ text: "매트 다크 그레이 도장", bold: true }, "으로 고급스러운 무광 마감"]),
    bullet(["각 칸 ", { text: "독립 잠금 시스템", bold: true }, "으로 보안성 확보"]),
    bullet(["벽 전체 길이로 시공해 ", { text: "대량 수납", bold: true }, " 가능"]),

    h2("회의/교육 공간 — 모니터와 시스템 가구"),
    ...ic("KakaoTalk_20260429_120648798_05.jpg", "▲ 메인 월 — 대형 모니터 + 천장형 시스템 디스플레이"),
    p(["회의 및 교육 발표용으로 ", { text: "대형 모니터", bold: true }, "를 메인 월 중앙에 설치했습니다. 그 위로는 ", { text: "천장 매다는 시스템형 디스플레이/스피커", bold: true }, "가 추가로 배치되어, 다양한 회의/교육 시나리오에 대응 가능해요."]),
    p(["창문에는 ", { text: "슬라트 블라인드", bold: true }, "를 설치해 외부 채광량을 자유롭게 조절할 수 있도록 했습니다. 산업가스 플랜트 부지라는 특성상 외부 시야를 차단할 필요가 있을 때 유용한 디테일이에요."]),

    h2("Before & After 요약"),
    p([{ text: "외관", bold: true }, ": 노후된 적벽돌 사무동  →  (외관은 유지, 내부 전면 리모델링)"]),
    p([{ text: "천장", bold: true }, ": 노후 마감 + 일반 형광등  →  화이트 천장 + 라인 LED 5~6라인"]),
    p([{ text: "벽체", bold: true }, ": 낡은 벽지, 단조로운 흰벽  →  라이트 우드 패널 + 콘크리트 데코타일 포인트월"]),
    p([{ text: "바닥", bold: true }, ": 노후 데코타일, 매립 박스 노출  →  평탄화 콘크리트 + 새 마감재"]),
    p([{ text: "구획", bold: true }, ": 단일 큰 공간  →  사무공간 + 회의실 + 탕비실 + 락커룸 4구획"]),
    p([{ text: "수납", bold: true }, ": 없음/부족  →  대형 다크 그레이 사물함 풀 월"]),
    p([{ text: "회의 인프라", bold: true }, ": 없음  →  대형 모니터 + 매립 화이트보드 + 시스템 스피커"]),

    h2("핵심 디자인 포인트 정리"),
    bullet([{ text: "라인 LED 조명", bold: true }, " — 평면적 천장에 입체감 부여, 모던한 기업 이미지"]),
    bullet([{ text: "라이트 우드 패널", bold: true }, " — 산업 시설 차가운 톤을 따뜻하게 중화"]),
    bullet([{ text: "다크 그레이 사물함", bold: true }, " — 공간의 무게중심, 시각적 대비"]),
    bullet([{ text: "아치형 입구", bold: true }, " — 직선적 공간에 곡선 포인트 (탕비실)"]),
    bullet([{ text: "매립 화이트보드 + 모니터", bold: true }, " — 회의/교육 인프라 풀세팅"]),

    h2("마무리"),
    p([
      "이렇게 ", { text: "린데코리아 사무실 리모델링", bold: true },
      " 프로젝트의 시공 과정과 최종 마감까지 2편에 걸쳐 공유해 드렸습니다.",
    ]),
    p([
      "일반 오피스가 아닌 ", { text: "산업가스 플랜트 부지 사무공간", bold: true },
      "이라는 특수한 조건에서, 따뜻한 우드 톤과 모던한 라인 조명으로 풀어낸 프로젝트였어요. 차가운 산업 환경에 모던하면서도 인간적인 사무공간이 들어선 느낌입니다.",
    ]),
    p(["이전 편도 함께 읽어보세요:"]),
    bullet([{ text: "1편", bold: true }, ": 창원 공장 사무실 인테리어 | 린데코리아 사무공간 리모델링 시공 과정"]),
    bullet([{ text: "2편", bold: true }, ": (이 글) 창원 공장 사무실 인테리어 완성 | 린데코리아 사무공간 최종 마감 (Before & After)"]),
    p([
      { text: "창원 공장 사무실 인테리어", bold: true }, ", ",
      { text: "창원 산업단지 사무공간 리모델링", bold: true }, ", ",
      { text: "창원 기업 인테리어", bold: true },
      "에 관심 있으시다면 편하게 문의 주세요. 창원을 비롯해 김해, 진해, 마산 등 경남권 ",
      { text: "사무실 인테리어 업체", bold: true },
      "를 찾고 계신다면 제이엠건축인테리어가 도와드리겠습니다.",
    ]),

    new Paragraph({ spacing: { before: 400 } }),
    p([{ text: "태그: ", bold: true }, "창원인테리어, 창원사무실인테리어, 창원사무실리모델링, 창원사무실공사, 창원기업인테리어, 창원공장사무실인테리어, 창원산업단지인테리어, 창원오피스인테리어, 김해사무실인테리어, 진해인테리어, 마산인테리어, 사무실인테리어업체, 사무실인테리어추천, 우드패널인테리어, 라인LED, 인더스트리얼인테리어, BeforeAfter, 사무실인테리어마감, 린데코리아, 제이엠건축인테리어"]),
  ];

  const doc = new Document({
    numbering: {
      config: [{
        reference: "bullets",
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      }],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children,
    }],
  });

  const outputPath = path.join(__dirname, "린데코리아_사무실_마감.docx");
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log("\nDONE:", outputPath, "→", Math.round(buffer.length / 1024), "KB");
  console.log("사진 폴더:", PHOTO_OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
