const fs = require("fs");
const path = require("path");
const { pdf } = require("pdf-to-img");

const OUT_DIR = path.join(__dirname, "롯데캐슬_디자인_사진");

const pdfs = [
  { src: path.join(OUT_DIR, "02_평면도.pdf"), out: "02_평면도.png" },
  { src: path.join(OUT_DIR, "07_천장도.pdf"), out: "07_천장도.png" },
];

async function main() {
  for (const p of pdfs) {
    try {
      const document = await pdf(p.src, { scale: 2.0 });
      let pageNum = 0;
      for await (const image of document) {
        pageNum++;
        const dst = path.join(OUT_DIR, pageNum === 1 ? p.out : p.out.replace(".png", `_${pageNum}.png`));
        fs.writeFileSync(dst, image);
        const size = fs.statSync(dst).size;
        console.log("OK:", path.basename(dst), "→", Math.round(size / 1024), "KB");
      }
    } catch (e) {
      console.log("SKIP:", p.out, e.message);
    }
  }
  console.log("\n완료");
}

main().catch(e => { console.error(e); process.exit(1); });
