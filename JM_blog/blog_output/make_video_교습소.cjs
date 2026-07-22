const fs = require("fs");
const path = require("path");
const ffmpegPath = require("ffmpeg-static");
const ffmpeg = require("fluent-ffmpeg");

ffmpeg.setFfmpegPath(ffmpegPath);

const PHOTO_DIR = path.join(__dirname, "롯데캐슬_교습소_마감_사진");
const OUT_VIDEO = path.join(__dirname, "롯데캐슬_교습소_마감_동영상.mp4");

// 각 사진 3초씩 슬라이드쇼, 크로스페이드 트랜지션
const SECONDS_PER_IMAGE = 3;
const FADE_DURATION = 0.5;
const WIDTH = 1280;
const HEIGHT = 720;

async function main() {
  const files = fs.readdirSync(PHOTO_DIR)
    .filter(f => f.endsWith(".jpg") || f.endsWith(".png"))
    .sort();

  console.log(`사진 ${files.length}장으로 동영상 생성 중...`);

  const cmd = ffmpeg();

  // 각 이미지를 loop 입력으로 추가
  files.forEach(f => {
    cmd.input(path.join(PHOTO_DIR, f))
       .inputOptions([`-loop 1`, `-t ${SECONDS_PER_IMAGE}`]);
  });

  // 필터: 각 이미지를 1280x720으로 스케일 + 패딩, xfade로 연결
  const scaleFilters = files.map((_, i) =>
    `[${i}:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease,pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1,fps=30[v${i}]`
  ).join(';');

  // xfade 체인 (n-1 transitions)
  let xfadeChain = '';
  let lastOutput = 'v0';
  for (let i = 1; i < files.length; i++) {
    const offset = (SECONDS_PER_IMAGE - FADE_DURATION) * i;
    const outLabel = i === files.length - 1 ? 'vout' : `x${i}`;
    xfadeChain += `;[${lastOutput}][v${i}]xfade=transition=fade:duration=${FADE_DURATION}:offset=${offset}[${outLabel}]`;
    lastOutput = outLabel;
  }

  const complexFilter = scaleFilters + xfadeChain;

  cmd.complexFilter(complexFilter)
     .outputOptions([
       '-map', '[vout]',
       '-c:v', 'libx264',
       '-pix_fmt', 'yuv420p',
       '-r', '30',
       '-preset', 'medium',
       '-crf', '23',
     ])
     .on('start', c => console.log("실행:", c.substring(0, 200) + "..."))
     .on('progress', p => {
       if (p.percent) console.log(`진행: ${Math.round(p.percent)}%`);
     })
     .on('end', () => {
       const size = fs.statSync(OUT_VIDEO).size;
       console.log(`\n✅ 완료: ${OUT_VIDEO}`);
       console.log(`용량: ${Math.round(size / 1024)} KB`);
       console.log(`재생 시간: ${files.length * SECONDS_PER_IMAGE - (files.length - 1) * FADE_DURATION}초`);
     })
     .on('error', e => {
       console.error("❌ 에러:", e.message);
     })
     .save(OUT_VIDEO);
}

main();
