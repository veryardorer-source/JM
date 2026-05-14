import { readFileSync } from 'fs';
import { deflateSync } from 'zlib';

// .env 수동 파싱
const env = readFileSync('.env', 'utf-8');
const API_KEY = env.match(/OPENROUTER_API_KEY=(.+)/)[1].trim();

const MODEL = 'google/gemma-4-31b-it:free';
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callAPI(messages) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.choices[0].message.content;
}

async function callWithRetry(messages, maxRetries = 3, delayMs = 15000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callAPI(messages);
    } catch (e) {
      if (e.message.includes('429') && i < maxRetries - 1) {
        console.log(`  Rate limit. ${delayMs / 1000}초 후 재시도... (${i + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delayMs));
      } else {
        throw e;
      }
    }
  }
}

// Node.js zlib로 실제 유효한 10x10 컬러 PNG 생성
function makeTestPng() {
  const W = 10, H = 10;
  // 각 row: 필터바이트(0) + RGBA * W
  const raw = Buffer.alloc(H * (1 + W * 4));
  for (let y = 0; y < H; y++) {
    const rowStart = y * (1 + W * 4);
    raw[rowStart] = 0; // filter type None
    for (let x = 0; x < W; x++) {
      const i = rowStart + 1 + x * 4;
      raw[i]   = x < 5 ? 255 : 0;   // R (왼쪽 빨강)
      raw[i+1] = x >= 5 ? 255 : 0;  // G (오른쪽 초록)
      raw[i+2] = 0;
      raw[i+3] = 255;               // A
    }
  }
  const compressed = deflateSync(raw);

  function crc32(buf) {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
    let c = 0xffffffff;
    for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function chunk(type, data) {
    const typeBytes = Buffer.from(type);
    const buf = Buffer.concat([typeBytes, data]);
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(buf));
    return Buffer.concat([len, typeBytes, data, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8bit RGBA
  const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
  return png.toString('base64');
}

// ─────────────────────────────────
// 1. 텍스트 테스트
// ─────────────────────────────────
console.log('=== [1] 텍스트 테스트 ===');
try {
  const result = await callWithRetry([
    { role: 'user', content: '안녕하세요! 한국어로 짧게 자기소개 해주세요.' }
  ]);
  console.log('응답:', result);
} catch (e) {
  console.error('실패:', e.message);
}

// ─────────────────────────────────
// 2. 이미지 테스트 (30초 대기)
// ─────────────────────────────────
console.log('\n=== [2] 이미지 테스트 ===');
console.log('  rate limit 여유를 위해 30초 대기...');
await new Promise(r => setTimeout(r, 30000));

try {
  const pngBase64 = makeTestPng();
  console.log('  PNG 생성 완료, API 호출 중...');
  const result = await callWithRetry([
    {
      role: 'user',
      content: [
        { type: 'text', text: '이 이미지를 보고 보이는 색상과 형태를 한국어로 설명해주세요.' },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${pngBase64}` } }
      ]
    }
  ]);
  console.log('응답:', result);
} catch (e) {
  console.error('실패:', e.message);
}
