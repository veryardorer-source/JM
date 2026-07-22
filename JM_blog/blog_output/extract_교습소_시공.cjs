const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const NAS_BASE = "\\\\jm\\003_JM도면n사진\\2026년\\2026.04.06_롯데캐슬 교습소(o)";
const OUT_DIR = path.join(__dirname, "롯데캐슬_교습소_시공_사진");

// 사람 없는 시공 진행 컷만 (날짜순 = 공정순)
const images = [
  { folder: "009_시공사진", file: "KakaoTalk_20260411_130312497.jpg",    order: "01", label: "목공 - 아치 매입 책장 MDF 재단" },
  { folder: "009_시공사진", file: "KakaoTalk_20260411_130312497_01.jpg", order: "02", label: "목공 시작 - 도구와 자재 세팅" },
  { folder: "009_시공사진", file: "KakaoTalk_20260416_173759248_02.jpg", order: "03", label: "석고보드 마감 후 콘센트 매립 준비" },
  { folder: "009_시공사진", file: "KakaoTalk_20260421_164512161_02.jpg", order: "04", label: "매입 선반 시공 + 도배 하지 작업" },
  { folder: "009_시공사진", file: "KakaoTalk_20260422_175846965_01.jpg", order: "05", label: "실크 도배 마감 진행" },
  { folder: "009_시공사진", file: "KakaoTalk_20260424_152250409_03.jpg", order: "06", label: "유리 창호 - 도장 교체 전 블랙 프레임" },
  { folder: "009_시공사진", file: "KakaoTalk_20260424_152250409_07.jpg", order: "07", label: "유리 파티션 반투명 시트 시공 완료" },
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
