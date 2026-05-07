const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, HeadingLevel, LevelFormat } = require("docx");

const NAS_BASE = "\\\\jm\\001_JM디자인\\2026.03.06_린데코리아 사무실";
const PHOTO_OUT = path.join(__dirname, "린데코리아_시공_사진");

// {file, folder, caption} (folder relative to NAS_BASE)
const images = [
  { folder: "001_현장사진", file: "KakaoTalk_20260310_102906788.jpg", caption: "▲ 리모델링 전 외부 — 적벽돌 외관의 공장 부지 사무동" },
  { folder: "001_현장사진", file: "KakaoTalk_20260310_102906788_05.jpg", caption: "▲ 기존 바닥 — 오래된 데코타일과 매립 콘센트 박스" },
  { folder: "009_시공사진", file: "KakaoTalk_20260401_164205203.jpg", caption: "▲ 기존 바닥재 철거 직후 모습" },
  { folder: "009_시공사진", file: "KakaoTalk_20260401_164205203_05.jpg", caption: "▲ 콘크리트 그라인딩 작업 — 폴리셔로 바닥면 평탄화" },
  { folder: "009_시공사진", file: "KakaoTalk_20260401_164205203_10.jpg", caption: "▲ 그라인딩 진행 중 — 석고보드는 이미 적재 준비 완료" },
  { folder: "009_시공사진", file: "KakaoTalk_20260403_092502778.jpg", caption: "▲ 천장 골조 작업 시작 — 각재로 그리드 구성" },
  { folder: "009_시공사진", file: "KakaoTalk_20260407_171742193_05.jpg", caption: "▲ 회의실 영역 칸막이 골조 + 창호 위치 확인" },
  { folder: "009_시공사진", file: "KakaoTalk_20260408_163525557.jpg", caption: "▲ 사무공간 구획 칸막이 진행" },
  { folder: "009_시공사진", file: "KakaoTalk_20260409_161119481.jpg", caption: "▲ 천장 + 벽체 골조 동시 진행" },
  { folder: "009_시공사진", file: "KakaoTalk_20260410_184506048.jpg", caption: "▲ 골조 완성 단계 — 공간 분할 윤곽 확인" },
  { folder: "009_시공사진", file: "KakaoTalk_20260413_183243551_03.jpg", caption: "▲ 탕비실 입구 — 아치형 디테일 시공 진행" },
  { folder: "009_시공사진", file: "KakaoTalk_20260415_174214956.jpg", caption: "▲ 우드 패널 마감 진행 중 — 사무공간 영역" },
  { folder: "009_시공사진", file: "KakaoTalk_20260417_165457813_05.jpg", caption: "▲ 라이트 우드 패널 + 라인 홈 디테일 — 디자인 무드 살아나는 단계" },
  { folder: "009_시공사진", file: "KakaoTalk_20260418_161849000.jpg", caption: "▲ 우드 패널 시공 완료 — 따뜻한 톤의 마감 무드" },
  { folder: "009_시공사진", file: "KakaoTalk_20260420_143812534.jpg", caption: "▲ 석고보드 이음새 처리 + 면 고르기" },
  { folder: "009_시공사진", file: "KakaoTalk_20260420_144504692_03.jpg", caption: "▲ 도배/도장 하지 작업 — 우드 패널과 화이트 영역 경계" },
  { folder: "009_시공사진", file: "KakaoTalk_20260421_172052840.jpg", caption: "▲ 회의실 콘크리트 패턴 포인트월 시공 중" },
  { folder: "009_시공사진", file: "KakaoTalk_20260421_172052840_08.jpg", caption: "▲ 우드 패널 + 콘크리트 데코타일의 대비 — 두 가지 톤의 조화" },
  { folder: "009_시공사진", file: "KakaoTalk_20260421_172052840_13.jpg", caption: "▲ 회의실 전체 — 라인 LED 조명 부각" },
  { folder: "009_시공사진", file: "KakaoTalk_20260423_143151766.jpg", caption: "▲ 락커룸 — 다크 그레이 대형 사물함 설치" },
  { folder: "009_시공사진", file: "KakaoTalk_20260423_143151766_02.jpg", caption: "▲ 사물함 + 우드 패널 + 라인 LED의 조화 — 락커룸 전체 뷰" },
];

async function main() {
  if (!fs.existsSync(PHOTO_OUT)) fs.mkdirSync(PHOTO_OUT, { recursive: true });

  const imageMap = {};
  const imageSizes = {};
  let order = 1;
  for (const img of images) {
    const filePath = path.join(NAS_BASE, img.folder, img.file);
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
      children: [new TextRun({ text: "창원 공장 사무실 인테리어 | 린데코리아 사무공간 리모델링 시공 과정", bold: true, size: 32, font: "맑은 고딕" })],
    }),
    p(["안녕하세요, ", { text: "창원 사무실 인테리어", bold: true }, " 전문 ", { text: "제이엠건축인테리어", bold: true }, "입니다."]),
    p([
      "오늘은 산업가스 전문기업 ", { text: "린데코리아 사무실 리모델링", bold: true },
      " 시공 과정을 공유해 드립니다. 공장 부지 내 노후된 사무동을 모던한 ",
      { text: "창원 기업 인테리어", bold: true },
      "로 탈바꿈시킨 약 3주간의 대규모 프로젝트인데요, 일반 오피스 인테리어와 달리 산업 시설 부속 사무공간만의 특수한 시공 포인트가 있습니다.",
    ]),
    p([
      "창원을 비롯해 김해, 진해, 마산 등 경남권에서 ",
      { text: "공장 사무실 인테리어", bold: true }, "나 ",
      { text: "산업단지 사무공간 리모델링", bold: true },
      "을 계획 중이신 분들께 시공 흐름을 보여드릴게요.",
    ]),

    h2("현장 조건 — 공장 부지 노후 사무동"),
    ...ic("KakaoTalk_20260310_102906788.jpg", "▲ 리모델링 전 외부 — 적벽돌 외관의 공장 부지 사무동"),
    ...ic("KakaoTalk_20260310_102906788_05.jpg", "▲ 기존 바닥 — 오래된 데코타일과 매립 콘센트 박스"),
    p(["린데코리아 현장은 가스 충전 플랜트 부지 안에 위치한 사무동이에요. 적벽돌 외관에 내부는 천장 높이 4m가 넘는 큰 공간이었고, 바닥에는 매립형 전기/통신 박스가 곳곳에 있어 일반 사무공간보다 까다로운 조건이었습니다."]),
    bullet([{ text: "공간 규모", bold: true }, ": 천장 높이 4m+ 대형 사무동"]),
    bullet([{ text: "구획", bold: true }, ": 오픈 사무공간 + 회의실 + 탕비실 + 락커룸 다중 구획"]),
    bullet([{ text: "특수 조건", bold: true }, ": 매립 전기 박스, 노출 콘크리트 바닥, 산업 환경 인접"]),
    bullet([{ text: "공사 기간", bold: true }, ": 약 3주 (4/1 ~ 4/23)"]),

    h2("공정 순서"),
    bullet([{ text: "1단계", bold: true }, ": 기존 바닥 철거 + 콘크리트 그라인딩 (4/1)"]),
    bullet([{ text: "2단계", bold: true }, ": 천장 + 칸막이 목공 골조 (4/3 ~ 4/10)"]),
    bullet([{ text: "3단계", bold: true }, ": MDF/우드 패널 마감 + 아치형 입구 디테일 (4/13 ~ 4/17)"]),
    bullet([{ text: "4단계", bold: true }, ": 석고보드 + 도배/도장 하지 (4/18 ~ 4/20)"]),
    bullet([{ text: "5단계", bold: true }, ": 데코타일 포인트월 + 라인 LED 조명 (4/21)"]),
    bullet([{ text: "6단계", bold: true }, ": 가구/사물함 반입 + 최종 마감 (4/23)"]),

    h2("1단계 — 바닥 그라인딩 (4/1)"),
    p(["첫날은 기존 바닥재 철거와 동시에 ", { text: "콘크리트 그라인딩", bold: true }, " 작업을 진행했습니다."]),
    ...ic("KakaoTalk_20260401_164205203.jpg", "▲ 기존 바닥재 철거 직후 모습"),
    ...ic("KakaoTalk_20260401_164205203_05.jpg", "▲ 콘크리트 그라인딩 작업 — 폴리셔로 바닥면 평탄화"),
    ...ic("KakaoTalk_20260401_164205203_10.jpg", "▲ 그라인딩 진행 중 — 석고보드는 이미 적재 준비 완료"),
    p(["오래된 데코타일을 걷어낸 뒤 콘크리트 면이 거칠어서, ", { text: "대형 폴리셔로 바닥을 갈아 평탄화", bold: true }, "했습니다. 이렇게 면을 잡아야 새 바닥재를 깔았을 때 들뜸이나 단차가 생기지 않아요."]),
    p(["특히 매립형 콘센트 박스 주변은 더 꼼꼼히 작업해야 하는 부분입니다."]),

    h2("2단계 — 천장 + 칸막이 목공 (4/3 ~ 4/10)"),
    p(["높은 천장 공간을 활용하면서도 사무공간으로서 적정 천장고를 확보하기 위해 ", { text: "천장 골조 작업", bold: true }, "부터 시작했습니다."]),
    ...ic("KakaoTalk_20260403_092502778.jpg", "▲ 천장 골조 작업 시작 — 각재로 그리드 구성"),
    ...ic("KakaoTalk_20260407_171742193_05.jpg", "▲ 회의실 영역 칸막이 골조 + 창호 위치 확인"),
    ...ic("KakaoTalk_20260408_163525557.jpg", "▲ 사무공간 구획 칸막이 진행"),
    ...ic("KakaoTalk_20260409_161119481.jpg", "▲ 천장 + 벽체 골조 동시 진행"),
    ...ic("KakaoTalk_20260410_184506048.jpg", "▲ 골조 완성 단계 — 공간 분할 윤곽 확인"),
    p(["이번 프로젝트는 단일 공간이 아니라 ", { text: "오픈 사무공간 + 회의실 + 탕비실 + 락커룸", bold: true }, " 4개 영역을 분리해야 했어요. 각 공간의 동선과 채광을 고려해 칸막이 위치를 잡고, 각재 골조 위에 석고보드를 붙여 새 벽체를 만들었습니다."]),

    h2("3단계 — MDF/우드 패널 마감 (4/13 ~ 4/17)"),
    p(["이번 프로젝트의 디자인 포인트인 ", { text: "우드 패널 마감", bold: true }, " 단계입니다."]),
    ...ic("KakaoTalk_20260413_183243551_03.jpg", "▲ 탕비실 입구 — 아치형 디테일 시공 진행"),
    ...ic("KakaoTalk_20260415_174214956.jpg", "▲ 우드 패널 마감 진행 중 — 사무공간 영역"),
    ...ic("KakaoTalk_20260417_165457813_05.jpg", "▲ 라이트 우드 패널 + 라인 홈 디테일 — 디자인 무드 살아나는 단계"),
    ...ic("KakaoTalk_20260418_161849000.jpg", "▲ 우드 패널 시공 완료 — 따뜻한 톤의 마감 무드"),
    p(["벽체는 ", { text: "라이트 우드 패널", bold: true }, "로 마감했습니다. 일반 도배가 아닌 우드 패널을 선택한 이유는요:"]),
    bullet(["산업 시설 특유의 차가운 분위기를 ", { text: "따뜻한 톤으로 중화", bold: true }]),
    bullet(["패널 사이 ", { text: "라인 홈 디테일", bold: true }, "로 모던한 입체감 부여"]),
    bullet(["유지관리가 도배보다 쉽고 내구성 우수"]),
    p(["특히 탕비실 입구는 ", { text: "아치형 디테일", bold: true }, "로 공간에 부드러운 포인트를 더했습니다. 직선이 많은 사무공간에 곡선 요소를 넣어 시각적 리듬을 만든 디자인이에요."]),

    h2("4단계 — 도배/도장 하지 처리 (4/18 ~ 4/20)"),
    p(["우드 패널이 적용되지 않은 영역은 ", { text: "화이트 도배 + 도장", bold: true }, "으로 마감합니다."]),
    ...ic("KakaoTalk_20260420_143812534.jpg", "▲ 석고보드 이음새 처리 + 면 고르기"),
    ...ic("KakaoTalk_20260420_144504692_03.jpg", "▲ 도배/도장 하지 작업 — 우드 패널과 화이트 영역 경계"),
    p(["석고보드 이음새와 나사 자국 부분을 메꿔 면을 고른 뒤 초배/정배 순서로 진행했습니다. 우드 패널과 화이트 도배 영역의 ", { text: "경계 라인을 깔끔하게 잡는 것", bold: true }, "이 핵심 디테일이에요. 두 마감재의 두께 차이를 흑색 라인으로 처리해 의도된 디자인처럼 보이도록 했습니다."]),

    h2("5단계 — 데코타일 포인트월 + 라인 LED (4/21)"),
    p(["이번 프로젝트의 두 번째 디자인 포인트, ", { text: "콘크리트 패턴 데코타일 포인트월", bold: true }, "과 ", { text: "라인 LED 조명", bold: true }, "입니다."]),
    ...ic("KakaoTalk_20260421_172052840.jpg", "▲ 회의실 콘크리트 패턴 포인트월 시공 중"),
    ...ic("KakaoTalk_20260421_172052840_08.jpg", "▲ 우드 패널 + 콘크리트 데코타일의 대비 — 두 가지 톤의 조화"),
    ...ic("KakaoTalk_20260421_172052840_13.jpg", "▲ 회의실 전체 — 라인 LED 조명 부각"),
    p(["한쪽 벽면에는 ", { text: "콘크리트 패턴 데코타일", bold: true }, "을 시공해 인더스트리얼 무드를 살렸습니다. 산업가스 기업이라는 클라이언트 정체성과도 어울리는 마감재 선택이었어요."]),
    p(["천장에는 ", { text: "라인 LED 조명", bold: true }, "을 격자형으로 배치했습니다. 일반 패널 LED와 달리 라인 조명은:"]),
    bullet(["높은 천장 공간에 ", { text: "입체감", bold: true }, "을 부여"]),
    bullet(["전체 공간에 ", { text: "균일한 확산광", bold: true }, " 제공"]),
    bullet(["모던한 사무공간 디자인에 ", { text: "시각적 임팩트", bold: true }, " 추가"]),

    h2("6단계 — 가구/사물함 반입 (4/23)"),
    ...ic("KakaoTalk_20260423_143151766.jpg", "▲ 락커룸 — 다크 그레이 대형 사물함 설치"),
    ...ic("KakaoTalk_20260423_143151766_02.jpg", "▲ 사물함 + 우드 패널 + 라인 LED의 조화 — 락커룸 전체 뷰"),
    p(["마감이 끝난 뒤 가구를 반입했습니다. 락커룸에는 ", { text: "대형 다크 그레이 사물함", bold: true }, "을 설치했고, 사무공간에는 cubicle 책상과 회의 테이블이 들어갈 예정이에요."]),
    p(["사물함 색상은 ", { text: "다크 그레이 매트 마감", bold: true }, "으로, 라이트 우드 패널 벽과 강한 대비를 이루며 공간에 무게감을 더해줍니다."]),

    h2("시공 핵심 포인트 정리"),
    bullet([{ text: "공사 기간", bold: true }, ": 약 3주 (4/1 ~ 4/23)"]),
    bullet([{ text: "공정", bold: true }, ": 바닥 그라인딩 → 천장/칸막이 목공 → 우드 패널/MDF 마감 → 도배/도장 → 데코타일/조명 → 가구 반입"]),
    bullet([{ text: "특수 조건", bold: true }, ": 매립 콘센트 박스 처리, 4m+ 천장 활용, 4개 영역 동시 시공"]),
    bullet([{ text: "디자인 포인트", bold: true }, ": 라이트 우드 패널 + 콘크리트 데코타일 + 라인 LED + 아치형 입구"]),

    h2("마무리"),
    p([
      "이번 ", { text: "린데코리아 사무실 리모델링", bold: true },
      "은 일반 오피스보다 까다로운 ",
      { text: "공장 부지 사무공간", bold: true },
      "이라는 특수성이 있었어요. 매립 박스 처리, 높은 천장 활용, 산업 환경에 어울리는 톤 매치까지 — 디테일 하나하나가 중요한 프로젝트였습니다.",
    ]),
    p([
      { text: "창원 공장 사무실 인테리어", bold: true }, ", ",
      { text: "산업단지 사무공간 리모델링", bold: true },
      "처럼 일반 오피스와는 조건이 다른 공간을 계획 중이시라면, 산업 환경 시공 경험이 있는 업체가 필요해요. 제이엠건축인테리어가 도와드리겠습니다.",
    ]),
    p([{ text: "다음 편에서는 완성된 최종 마감 모습", bold: true }, "을 Before & After로 공개하겠습니다. 노후된 적벽돌 사무동이 어떻게 모던한 기업 사무공간으로 변신했는지 기대해 주세요!"]),
    p([
      { text: "창원 사무실 인테리어", bold: true }, ", ",
      { text: "창원 사무실 리모델링", bold: true }, ", ",
      { text: "창원 공장 사무실 인테리어", bold: true },
      "에 관심 있으시다면 편하게 문의 주세요. 창원을 비롯해 김해, 진해, 마산 등 경남권 ",
      { text: "사무실 인테리어 업체", bold: true },
      "를 찾고 계신다면 제이엠건축인테리어가 도와드리겠습니다.",
    ]),

    new Paragraph({ spacing: { before: 400 } }),
    p([{ text: "태그: ", bold: true }, "창원인테리어, 창원사무실인테리어, 창원사무실리모델링, 창원사무실공사, 창원기업인테리어, 창원공장사무실인테리어, 창원산업단지인테리어, 창원오피스인테리어, 김해사무실인테리어, 진해인테리어, 마산인테리어, 사무실인테리어업체, 사무실인테리어추천, 우드패널인테리어, 라인LED, 데코타일포인트월, 콘크리트인테리어, 인더스트리얼인테리어, 린데코리아, 제이엠건축인테리어"]),
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

  const outputPath = path.join(__dirname, "린데코리아_사무실_시공.docx");
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log("\nDONE:", outputPath, "→", Math.round(buffer.length / 1024), "KB");
  console.log("사진 폴더:", PHOTO_OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
