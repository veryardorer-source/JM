import Anthropic from '@anthropic-ai/sdk'

const PROMPT = `이 인테리어 평면도를 분석해서 각 공간의 치수 정보를 추출해주세요.

다음 JSON 형식으로만 응답하세요 (설명 없이 JSON만):
{
  "rooms": [
    {
      "name": "공간 이름 (예: 거실, 침실1, 주방 등)",
      "widthMm": 가로 치수(mm 단위, 숫자만),
      "depthMm": 세로 치수(mm 단위, 숫자만),
      "heightMm": 천장 높이(mm, 없으면 2400),
      "note": "특이사항 (없으면 빈 문자열)"
    }
  ],
  "summary": "도면 전체 설명 한 줄"
}

주의사항:
- 치수선에 표기된 숫자를 mm 단위로 변환하세요 (예: 4.2m → 4200, 4200mm → 4200)
- 치수가 불명확한 경우 0으로 표기
- 도면에 없는 공간은 포함하지 마세요`

function parseResult(text) {
  const match = text.trim().match(/\{[\s\S]*\}/)
  if (!match) throw new Error('응답에서 JSON을 찾을 수 없습니다')
  return JSON.parse(match[0])
}

// llm-mux 기본 모델 (haiku가 유일하게 인식되는 모델)
const LLM_MUX_DEFAULT_MODEL = 'claude-3-5-haiku-20241022'

// 쿨다운 오류 파싱
function parseCooldownError(errText) {
  try {
    const outer = JSON.parse(errText)
    const inner = outer?.error?.message
    const innerJson = typeof inner === 'string' ? JSON.parse(inner) : inner
    if (innerJson?.error?.code === 'model_cooldown') {
      const { model, reset_time } = innerJson.error
      return `모델(${model}) 쿨다운 중 — ${reset_time} 후 사용 가능. 다른 모델을 선택하거나 잠시 후 다시 시도하세요.`
    }
  } catch (_) {}
  return null
}

// llm-mux: Anthropic 형식 (/v1/messages)
async function analyzeViaLlmMux(fileBase64, mediaType, baseURL, model) {
  model = model || LLM_MUX_DEFAULT_MODEL

  const contentBlock = mediaType === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } }
    : { type: 'image', source: { type: 'base64', media_type: mediaType, data: fileBase64 } }

  const res = await fetch(`${baseURL}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': 'llm-mux',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: PROMPT }] }],
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    const cooldown = parseCooldownError(errText)
    if (cooldown) throw new Error(cooldown)
    throw new Error(`llm-mux 오류 (${res.status}): ${errText}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text
  if (!text) throw new Error('llm-mux 응답이 비어 있습니다: ' + JSON.stringify(data))
  return parseResult(text)
}

// Anthropic SDK 직접 호출
async function analyzeViaDirect(apiKey, fileBase64, mediaType) {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  const isPdf = mediaType === 'application/pdf'
  const contentBlock = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } }
    : { type: 'image', source: { type: 'base64', media_type: mediaType, data: fileBase64 } }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: PROMPT }] }],
  })

  return parseResult(message.content[0].text)
}

// llm-mux 연결 확인
export async function checkLlmMux(baseURL) {
  const r = await fetch(`${baseURL}/v1/models`, {
    headers: { 'x-api-key': 'llm-mux', 'anthropic-version': '2023-06-01' },
  }).catch(() => null)

  if (r?.ok) {
    const data = await r.json()
    const list = data.data || data.models || (Array.isArray(data) ? data : [])
    return { data: list.length > 0 ? list : data }
  }

  const r2 = await fetch(`${baseURL}/`).catch(() => null)
  if (r2) return { data: [], note: '서버 응답 중, /v1/models 없음' }

  throw new Error('localhost:8317 에 연결할 수 없습니다. llm-mux가 실행 중인지 확인하세요.')
}

// 통합 진입점
export async function analyzeFloorPlan(apiKey, fileBase64, mediaType, baseURL = '', model = '') {
  if (baseURL) {
    return analyzeViaLlmMux(fileBase64, mediaType, baseURL, model)
  }
  return analyzeViaDirect(apiKey, fileBase64, mediaType)
}
