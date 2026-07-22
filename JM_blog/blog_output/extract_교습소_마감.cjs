const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const NAS_BASE = "\\\\jm\\003_JM도면n사진\\2026년\\2026.04.06_롯데캐슬 교습소(o)";
const OUT_DIR = path.join(__dirname, "롯데캐슬_교습소_마감_사진");

// 사람 없는 사진만 선정
const images = [
  { folder: "010_마감사진", file: "KakaoTalk_20260602_105401021_06.jpg", order: "01", label: "입구 - 유리도어와 로고" },
  { folder: "010_마감사진", file: "KakaoTalk_20260602_105401021_08.jpg", order: "02", label: "진열 코너 - 가벽 선반 디자인" },
  { folder: "010_마감사진", file: "ChatGPT Image 2026년 6월 8일 오후 03_46_41.png", order: "03", label: "교실 오버뷰 - 아치 매입 책장" },
  { folder: "010_마감사진", file: "KakaoTalk_20260602_105401021_05.jpg", order: "04", label: "아치 매입 책장 클로즈업" },
  { folder: "010_마감사진", file: "KakaoTalk_20260602_105401021_03.jpg", order: "05", label: "교실 - 매입 선반과 화이트 벽" },
  { folder: "010_마감사진", file: "KakaoTalk_20260602_105401021_04.jpg", order: "06", label: "교실 다른 각도" },
  { folder: "010_마감사진", file: "KakaoTalk_20260602_105401021_02.jpg", order: "07", label: "상담실 - 유리 파티션 도어" },
  { folder: "010_마감사진", file: "KakaoTalk_20260602_105401021_01.jpg", order: "08", label: "탕비 공간 - 붙박이 하부장과 세면대" },
];

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const img of images) {
    const src = path.join(NAS_BASE, img.folder, img.file);
    const dst = path.join(OUT_DIR, `${img.order}_${img.label}.jpg`);
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
