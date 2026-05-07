const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const NAS_PATH = "\\\\jm\\001_JM디자인\\2026.02.27_현대마린엔진 선주실\\009_시공사진";
const OUT_DIR = path.join(__dirname, "현대마린엔진_시공_사진");

// Images in publication order with numbered prefix
const images = [
  { file: "KakaoTalk_20260402_192116171.jpg", order: "01" },
  { file: "KakaoTalk_20260402_192116171_01.jpg", order: "02" },
  { file: "KakaoTalk_20260402_192116171_03.jpg", order: "03" },
  { file: "KakaoTalk_20260404_124742456.jpg", order: "04" },
  { file: "KakaoTalk_20260404_124742456_02.jpg", order: "05" },
  { file: "KakaoTalk_20260404_124742456_03.jpg", order: "06" },
  { file: "KakaoTalk_20260407_172841915_02.jpg", order: "07" },
  { file: "KakaoTalk_20260407_172841915_03.jpg", order: "08" },
  { file: "KakaoTalk_20260410_192821301_02.jpg", order: "09" },
  { file: "KakaoTalk_20260410_192821301_04.jpg", order: "10" },
  { file: "KakaoTalk_20260410_192821301_03.jpg", order: "11" },
  { file: "KakaoTalk_20260411_130234104.jpg", order: "12" },
  { file: "KakaoTalk_20260411_130234104_01.jpg", order: "13" },
  { file: "KakaoTalk_20260411_130234104_03.jpg", order: "14" },
  { file: "KakaoTalk_20260413_183246950.jpg", order: "15" },
  { file: "KakaoTalk_20260413_183246950_02.jpg", order: "16" },
  { file: "KakaoTalk_20260413_183246950_03.jpg", order: "17" },
  { file: "KakaoTalk_20260413_183246950_04.jpg", order: "18" },
];

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const img of images) {
    const src = path.join(NAS_PATH, img.file);
    const dst = path.join(OUT_DIR, `${img.order}_${img.file}`);
    try {
      await sharp(src)
        .rotate()
        .resize({ width: 1200, withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toFile(dst);
      const size = fs.statSync(dst).size;
      console.log("OK:", img.order, img.file, "→", Math.round(size / 1024), "KB");
    } catch (e) {
      console.log("SKIP:", img.file, e.message);
    }
  }
  console.log("\n저장 위치:", OUT_DIR);
}

main().catch(e => { console.error(e); process.exit(1); });
