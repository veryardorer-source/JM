const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const NAS_BASE = "\\\\jm\\001_JM디자인\\2026.04.07_롯데캐슬 미용실";
const OUT_DIR = path.join(__dirname, "롯데캐슬_디자인_사진");

// PNG 3D 이미지만 sharp로 처리 (PDF는 사용자가 NAS에서 직접 가져가야 함)
const images = [
  { folder: "005_3D이미지\\0515_1", file: "Enscape_2026-05-15-17-19-08_장면 1.png", order: "01", label: "로비에서 약장실 방향" },
  { folder: "005_3D이미지\\0515_1", file: "Enscape_2026-05-15-17-19-08_장면 6.png", order: "02", label: "카운터에서 홀 방향" },
  { folder: "005_3D이미지\\0515_1", file: "Enscape_2026-05-15-17-19-08_장면 2.png", order: "03", label: "경대의자와 캡슐형 거울" },
  { folder: "005_3D이미지\\0515_1", file: "Enscape_2026-05-15-17-19-08_장면 4.png", order: "04", label: "샴푸실" },
];

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const img of images) {
    const src = path.join(NAS_BASE, img.folder, img.file);
    const dst = path.join(OUT_DIR, `${img.order}_${img.label}.png`);
    try {
      await sharp(src)
        .rotate()
        .resize({ width: 1200, withoutEnlargement: true })
        .png({ quality: 90, compressionLevel: 8 })
        .toFile(dst);
      const size = fs.statSync(dst).size;
      console.log("OK:", img.order, img.file, "→", Math.round(size / 1024), "KB");
    } catch (e) {
      console.log("SKIP:", img.file, e.message);
    }
  }

  // 평면도 PDF는 그대로 복사
  const planSrc = path.join(NAS_BASE, "006_도면PDF\\0515_2", "001.pdf");
  const planDst = path.join(OUT_DIR, "00_평면도.pdf");
  try {
    fs.copyFileSync(planSrc, planDst);
    console.log("OK: 00_평면도.pdf 복사 완료");
  } catch (e) {
    console.log("SKIP: 평면도", e.message);
  }

  console.log("\n저장 위치:", OUT_DIR);
}

main().catch(e => { console.error(e); process.exit(1); });
