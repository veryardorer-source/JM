const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SRC_DIR = path.join(__dirname, "현대크랭크샤프트_강당_A_도면");
const OUT_DIR = path.join(__dirname, "현대크랭크샤프트_강당_A_도면_블로그용");

// A안 최종 크롭 (원본 2977x2105 기준)
// 오른쪽 타이틀블록 제거 + 큰 외곽 치수 최대한 제거
// (벽 옆 작은 레벨 표시 ±150은 남을 수 있음)
const CROP = {
  left: 280,
  top: 730,
  width: 1980,   // right = 2260
  height: 820,   // bottom = 1550
};

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith(".png")).sort();

  for (const f of files) {
    const src = path.join(SRC_DIR, f);
    const dst = path.join(OUT_DIR, f.replace(".png", "_blog.png"));

    try {
      const meta = await sharp(src).metadata();
      const ratioX = meta.width / 2977;
      const ratioY = meta.height / 2105;
      const cropRegion = {
        left: Math.round(CROP.left * ratioX),
        top: Math.round(CROP.top * ratioY),
        width: Math.round(CROP.width * ratioX),
        height: Math.round(CROP.height * ratioY),
      };

      await sharp(src)
        .extract(cropRegion)
        .png({ quality: 90, compressionLevel: 8 })
        .toFile(dst);

      const size = fs.statSync(dst).size;
      console.log("OK:", f, `→ ${cropRegion.width}×${cropRegion.height}`, Math.round(size / 1024) + "KB");
    } catch (e) {
      console.log("SKIP:", f, e.message);
    }
  }

  console.log("\n저장 위치:", OUT_DIR);
}

main().catch(e => { console.error(e); process.exit(1); });
