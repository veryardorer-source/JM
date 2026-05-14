const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemma-4-31b-it:free';

async function callAPI(messages) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.choices[0].message.content;
}

// 429 rate limit 자동 재시도 (1회, 15초 대기)
export async function callWithRetry(messages) {
  try {
    return await callAPI(messages);
  } catch (e) {
    if (e.message.includes('429') || e.message.includes('rate')) {
      await new Promise(r => setTimeout(r, 15000));
      return await callAPI(messages);
    }
    throw e;
  }
}

// 이미지를 Canvas로 최대 1024px 리사이즈 후 base64 반환
export function resizeImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1024;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// 이미지 base64로 재료 추출
export async function analyzeIngredients(base64DataUrl) {
  const content = await callWithRetry([
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: '이 냉장고 사진에서 보이는 식재료를 모두 찾아주세요. 반드시 아래 JSON 형식으로만 답하고, 다른 설명은 절대 하지 마세요.\n{"ingredients": ["재료1", "재료2"]}',
        },
        {
          type: 'image_url',
          image_url: { url: base64DataUrl },
        },
      ],
    },
  ]);

  // JSON 파싱 (마크다운 코드블록 제거 포함)
  const clean = content.replace(/```[a-z]*\n?/g, '').trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) return [];
  const parsed = JSON.parse(match[0]);
  return Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
}
