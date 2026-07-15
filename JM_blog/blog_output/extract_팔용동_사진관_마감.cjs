const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const NAS_BASE = "\\\\jm\\003_JM도면n사진\\2026년\\2026.03.24_팔용동이담사진관(o)";
const OUT_DIR = path.join(__dirname, "팔용동_사진관_마감_사진");

// 사람/얼굴 없는 사진만 선정 (본문 등장 순서대로 번호 부여)
const images = [
  { folder: "010_마감사진", file: "KakaoTalk_20260505_160803523_11.jpg", order: "01", label: "입구 - 웨이브 미러와 아치 개구부" },
  { folder: "010_마감사진", file: "KakaoTalk_20260505_160803523_10.jpg", order: "02", label: "편집 데스크와 대기 벤치" },
  { folder: "010_마감사진", file: "KakaoTalk_20260505_160803523_12.jpg", order: "03", label: "편집실 전체 뷰" },
  { folder: "010_마감사진", file: "KakaoTalk_20260505_160803523.jpg", order: "04", label: "촬영 스튜디오 - 컬러 배경지 롤" },
  { folder: "010_마감사진", file: "KakaoTalk_20260505_160803523_03.jpg", order: "05", label: "촬영 스튜디오 다른 각도" },
  { folder: "010_마감사진", file: "KakaoTalk_20260505_160803523_07.jpg", order: "06", label: "스튜디오 넓은 뷰 - 프레임 LED 조명" },
  { folder: "010_마감사진", file: "KakaoTalk_20260505_160803523_08.jpg", order: "07", label: "스튜디오 안쪽 - 창문 자연광" },
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
