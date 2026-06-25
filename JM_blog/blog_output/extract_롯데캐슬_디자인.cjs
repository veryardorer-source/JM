const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const NAS_BASE = "\\\\jm\\001_JM디자인\\2026.04.07_롯데캐슬 미용실";
const OUT_DIR = path.join(__dirname, "롯데캐슬_디자인_사진");

// 본문 등장 순서대로 번호 부여
const images = [
  // 01. Before
  { folder: "001_현장사진", file: "KakaoTalk_20260512_172627486_04.jpg", order: "01", label: "Before - 기존 부동산 내부" },

  // 02. 평면도 (PDF는 아래 별도)

  // 03~04. 단면도
  { folder: "005_3D이미지\\0515_1", file: "Enscape_2026-05-15-17-19-08_단면 1.png", order: "03", label: "단면도 1 - 약장실→로비 길이방향" },
  { folder: "005_3D이미지\\0515_1", file: "Enscape_2026-05-15-17-19-08_단면 2.png", order: "04", label: "단면도 2 - 샴푸실과 대기공간" },

  // 05~06. ISO 탑뷰
  { folder: "005_3D이미지\\0515_1", file: "Enscape_2026-05-15-17-19-08_ISO 1.png", order: "05", label: "ISO 탑뷰 1 - 평면 구성" },
  { folder: "005_3D이미지\\0515_1", file: "Enscape_2026-05-15-17-19-08_ISO 2.png", order: "06", label: "ISO 탑뷰 2 - 다른 각도" },

  // 07. 천장도 (PDF는 아래 별도)

  // 08~14. 3D 투시도
  { folder: "005_3D이미지\\0515_1", file: "Enscape_2026-05-15-17-19-08_장면 1.png", order: "08", label: "로비에서 약장실 방향" },
  { folder: "005_3D이미지\\0515_1", file: "Enscape_2026-05-15-17-19-08_장면 7.png", order: "09", label: "입구쪽에서 본 카운터와 대기공간" },
  { folder: "005_3D이미지\\0515_1", file: "Enscape_2026-05-15-17-19-08_장면 6.png", order: "10", label: "카운터에서 홀 방향" },
  { folder: "005_3D이미지\\0515_1", file: "Enscape_2026-05-15-17-19-08_장면 2.png", order: "11", label: "경대의자와 캡슐형 거울" },
  { folder: "005_3D이미지\\0515_1", file: "Enscape_2026-05-15-17-19-08_장면 3.png", order: "12", label: "홀 안쪽에서 본 약장실 입구" },
  { folder: "005_3D이미지\\0515_1", file: "Enscape_2026-05-15-17-19-08_장면 5.png", order: "13", label: "약장실 내부 - 싱크와 수납" },
  { folder: "005_3D이미지\\0515_1", file: "Enscape_2026-05-15-17-19-08_장면 4.png", order: "14", label: "샴푸실" },
];

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const img of images) {
    const src = path.join(NAS_BASE, img.folder, img.file);
    const ext = path.extname(img.file).toLowerCase();
    const isJpg = ext === ".jpg" || ext === ".jpeg";
    const dst = path.join(OUT_DIR, `${img.order}_${img.label}${isJpg ? ".jpg" : ".png"}`);
    try {
      let pipeline = sharp(src).rotate().resize({ width: 1200, withoutEnlargement: true });
      if (isJpg) {
        pipeline = pipeline.jpeg({ quality: 85, mozjpeg: true });
      } else {
        pipeline = pipeline.png({ quality: 90, compressionLevel: 8 });
      }
      await pipeline.toFile(dst);
      const size = fs.statSync(dst).size;
      console.log("OK:", img.order, img.file, "→", Math.round(size / 1024), "KB");
    } catch (e) {
      console.log("SKIP:", img.file, e.message);
    }
  }

  // PDF — 평면도 02, 천장도 07
  const pdfs = [
    { src: "006_도면PDF\\0515_2\\001.pdf", out: "02_평면도.pdf" },
    { src: "006_도면PDF\\0515_2\\004.pdf", out: "07_천장도.pdf" },
  ];
  for (const p of pdfs) {
    try {
      fs.copyFileSync(path.join(NAS_BASE, p.src), path.join(OUT_DIR, p.out));
      console.log("OK:", p.out, "복사 완료");
    } catch (e) {
      console.log("SKIP:", p.out, e.message);
    }
  }

  console.log("\n저장 위치:", OUT_DIR);
}

main().catch(e => { console.error(e); process.exit(1); });
