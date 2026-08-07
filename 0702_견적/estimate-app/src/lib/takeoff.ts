// 물량산출 — 산출 규칙은 단가표(price_book)의 자재별 산출방식(calc/params)을 따른다
import { EstimateSection, EstimateItem } from './estimate'

export type PriceRow = {
  id?: string
  trade: string | null
  name: string
  spec: string | null
  unit: string | null
  mat_price: number
  lab_price: number
  exp_price: number
  calc?: string | null                    // 없음 | 각재 | 판재 | 길이재 | 타일
  params?: Record<string, number | string> | null
}

// ── 단가표에서 산출 설정 구성 ─────────────────────────────

export type LumberOption = { size: number; spec: string; bundle: number; price: PriceRow }
export type PlateOption = { name: string; sheetArea: number; finishAfter: string; price: PriceRow }

export type TakeoffConfig = {
  lumbers: LumberOption[]   // 각재 규격 목록 (단당 개수 포함)
  plates: PlateOption[]     // 판재 목록 (석고/MDF/텍스 등 — 벽 마감 선택지)
  cutLen: number            // 걸레받이/몰딩 재단 길이 (mm)
}

// 단가표에 각재가 없을 때 기본값
const DEFAULT_LUMBERS: Array<[number, number]> = [[2400, 20], [2700, 20], [3000, 20], [3600, 12]]

export function buildConfig(prices: PriceRow[]): TakeoffConfig {
  const lumbers: LumberOption[] = []
  for (const p of (prices || [])) {
    if (p.calc !== '각재') continue
    const size = parseInt(String(p.spec || ''), 10)
    if (!size) continue
    lumbers.push({ size, spec: p.spec || '', bundle: Number(p.params?.bundle) || 20, price: p })
  }
  if (!lumbers.length) {
    for (const [size, bundle] of DEFAULT_LUMBERS) {
      lumbers.push({
        size, bundle, spec: `${size}*28*28`,
        price: { trade: '목작업', name: '각재', spec: `${size}*28*28`, unit: '단', mat_price: 0, lab_price: 0, exp_price: 0 },
      })
    }
  }
  lumbers.sort((a, b) => a.size - b.size)

  const plates: PlateOption[] = (prices || [])
    .filter(p => p.calc === '판재' && Number(p.params?.sheet_area))
    .map(p => ({
      name: p.name, sheetArea: Number(p.params!.sheet_area),
      finishAfter: String(p.params?.finish || ''), price: p,
    }))

  const cutRow = (prices || []).find(p => p.calc === '길이재')
  return { lumbers, plates, cutLen: Number(cutRow?.params?.cut_len) || 2400 }
}

// ── 입력 타입 ─────────────────────────────────────────────

export const LUMBER_SIZES = [2400, 2700, 3000, 3600] as const
export type LumberSize = number
export const LUMBER_BUNDLE: Record<number, number> = Object.fromEntries(DEFAULT_LUMBERS)

// 벽 마감: 기본(도배→석고+벽지, 필름/도장→MDF) + 단가표의 커스텀 판재 이름
export const FINISH_LIST = ['도배', '필름', '도장', '없음'] as const
export type WallFinish = string

export type Wall = {
  len: number        // 벽 길이 (mm)
  h: number          // 높이 (m)
  finish: WallFinish
  frame: boolean     // 신설 목틀(각재)
  reinforce: boolean // 합판 보강
  base: boolean      // 걸레받이/몰딩
}

export type Room = { name: string; walls: Wall[] }
export type FloorArea = {
  name: string
  type: '타일' | '데코타일'
  w: number; l: number     // 가로/세로 (mm)
  size: number             // 타일 한 변 (mm)
  perBox: number           // 한 박스 장수
}
export type CeilArea = { name: string; area: number }
export type Light = { name: string; spec: string; qty: number; unit: 'EA' | 'M' }

export const LIGHT_PRESETS: Array<{ label: string; name: string; spec: string; unit: 'EA' | 'M' }> = [
  { label: '다운라이트 3인치', name: '조명기구', spec: '3인치', unit: 'EA' },
  { label: '다운라이트 6인치', name: '조명기구', spec: '6인치', unit: 'EA' },
  { label: '다운라이트 8인치', name: '조명기구', spec: '8인치', unit: 'EA' },
  { label: 'T5 (길이)', name: '조명기구', spec: 'T5', unit: 'M' },
  { label: 'T7 (길이)', name: '조명기구', spec: 'T7', unit: 'M' },
  { label: '직접 입력', name: '', spec: '', unit: 'EA' },
]

export type Takeoff = {
  lumber: LumberSize
  defH: number
  rooms: Room[]
  floors: FloorArea[]
  ceils: CeilArea[]
  lights: Light[]
}

export const EMPTY_TAKEOFF: Takeoff = {
  lumber: 3600, defH: 3.5, rooms: [], floors: [], ceils: [], lights: [],
}

export function newWall(defH: number): Wall {
  return { len: 0, h: defH, finish: '도배', frame: true, reinforce: false, base: true }
}

export function defaultPerBox(type: FloorArea['type'], size: number): number {
  if (type === '데코타일') return size === 600 ? 9 : 16
  return size === 600 ? 4 : 6
}

export function floorSheets(f: FloorArea): number {
  if (!f.w || !f.l || !f.size) return 0
  return Math.ceil(f.w / f.size) * Math.ceil(f.l / f.size)
}

// ── 산출 ─────────────────────────────────────────────────

export type TakeoffResult = {
  lumberV: number
  lumberH: number
  lumberTotal: number     // 각재 총 개수
  lumberBundle: number    // 단당 개수
  lumberBundles: number   // 단 (올림 전)
  gypsum: number          // 석고보드 장수 (도배면)
  gypsumArea: number
  mdf: number             // MDF 장수 (필름·도장면)
  filmArea: number
  customPlates: Array<{ name: string; sheets: number }>  // 커스텀 판재별 장수
  plywood: number
  baseboard: number
  wallpaperRolls: number
  tileSheets: number; tileBoxes: number
  decoSheets: number; decoBoxes: number
}

export function calcTakeoff(t: Takeoff, cfg?: TakeoffConfig): TakeoffResult {
  const c = cfg || buildConfig([])
  const bundle = c.lumbers.find(l => l.size === t.lumber)?.bundle || LUMBER_BUNDLE[t.lumber] || 20
  const gypArea = c.plates.find(p => p.name === '석고보드')?.sheetArea || 1.62
  const mdfArea = c.plates.find(p => p.name === 'M.D.F')?.sheetArea || 2.88

  let lumberV = 0, lumberH = 0, gypsumArea = 0, filmArea = 0
  let gypsum = 0, mdf = 0, plywoodStrips = 0, baseboard = 0
  const custom: Record<string, number> = {}

  for (const room of t.rooms) {
    for (const w of room.walls) {
      if (!w.len || !w.h) continue
      const area = (w.len / 1000) * w.h
      if (w.frame) {
        lumberV += w.len / 450 + 1
        lumberH += (w.len / t.lumber) * 2
      }
      if (w.finish === '도배') {
        gypsum += Math.ceil(area / gypArea)
        gypsumArea += area
      } else if (w.finish === '필름' || w.finish === '도장') {
        mdf += Math.ceil(area / mdfArea)
        if (w.finish === '필름') filmArea += area
      } else if (w.finish !== '없음') {
        // 단가표의 커스텀 판재 (텍스, 흡음판 등)
        const plate = c.plates.find(p => p.name === w.finish)
        if (plate) {
          custom[plate.name] = (custom[plate.name] || 0) + Math.ceil(area / plate.sheetArea)
          if (plate.finishAfter === '도배') gypsumArea += area
          if (plate.finishAfter === '필름') filmArea += area
        }
      }
      if (w.reinforce) plywoodStrips += Math.ceil(w.len / 450)
      if (w.base) baseboard += Math.ceil(w.len / c.cutLen)
    }
  }

  const ceilArea = t.ceils.reduce((s, x) => s + (x.area || 0), 0)
  const wallpaperRolls = Math.ceil(((gypsumArea + ceilArea) * 0.3025) / 5)

  let tileSheets = 0, tileBoxes = 0, decoSheets = 0, decoBoxes = 0
  for (const f of t.floors) {
    const sheets = floorSheets(f)
    if (!sheets) continue
    const boxes = Math.ceil(sheets / (f.perBox || defaultPerBox(f.type, f.size)))
    if (f.type === '타일') { tileSheets += sheets; tileBoxes += boxes }
    else { decoSheets += sheets; decoBoxes += boxes }
  }

  const lumberTotal = Math.ceil(lumberV + lumberH)
  return {
    lumberV, lumberH, lumberTotal,
    lumberBundle: bundle,
    lumberBundles: lumberTotal / bundle,
    gypsum, gypsumArea, mdf, filmArea,
    customPlates: Object.entries(custom).map(([name, sheets]) => ({ name, sheets })),
    plywood: Math.ceil(plywoodStrips / 13),
    baseboard, wallpaperRolls,
    tileSheets, tileBoxes, decoSheets, decoBoxes,
  }
}

// ── 견적서 내역 생성 ──────────────────────────────────────

const LABOR_PER_PY: Record<string, number> = { 목작업: 0.66, 도배작업: 0.18, 타일작업: 0.22, 필름작업: 0.1 }

function findPrice(prices: PriceRow[], name: string, spec?: string) {
  return prices.find(p => p.name === name && (!spec || p.spec === spec))
    || prices.find(p => p.name === name)
}

function item(prices: PriceRow[], name: string, spec: string, unit: string, qty: number): EstimateItem {
  const p = findPrice(prices, name, spec)
  return {
    name, spec: spec || p?.spec || '', unit: p?.unit || unit, qty,
    mat: Number(p?.mat_price) || 0, lab: Number(p?.lab_price) || 0, exp: Number(p?.exp_price) || 0,
  }
}

function laborItem(prices: PriceRow[], qty: number): EstimateItem {
  const p = findPrice(prices, '노무비')
  return { name: '노무비', spec: '', unit: '인', qty, mat: 0, lab: Number(p?.lab_price) || 300000, exp: Number(p?.exp_price) || 0 }
}

export function takeoffToSections(t: Takeoff, prices: PriceRow[], areaPy: number | null): EstimateSection[] {
  const cfg = buildConfig(prices)
  const r = calcTakeoff(t, cfg)
  const out: EstimateSection[] = []
  const labor = (trade: string) =>
    areaPy && LABOR_PER_PY[trade] ? [laborItem(prices, Math.max(1, Math.round(areaPy * LABOR_PER_PY[trade])))] : []

  const wood: EstimateItem[] = []
  if (r.lumberTotal) {
    // 각재는 "단" 단위로 (단당 개수는 단가표 params.bundle)
    const lum = cfg.lumbers.find(l => l.size === t.lumber)
    const bundles = Math.ceil(r.lumberBundles)
    wood.push({
      name: '각재', spec: lum?.spec || `${t.lumber}*28*28`, unit: '단', qty: bundles,
      mat: Number(lum?.price.mat_price) || 0, lab: Number(lum?.price.lab_price) || 0, exp: Number(lum?.price.exp_price) || 0,
    })
  }
  if (r.gypsum) wood.push(item(prices, '석고보드', '900*1800*9T', 'EA', r.gypsum))
  if (r.mdf) wood.push(item(prices, 'M.D.F', '1220*2440*9T', 'EA', r.mdf))
  for (const cp of r.customPlates) {
    const p = cfg.plates.find(x => x.name === cp.name)
    wood.push(item(prices, cp.name, p?.price.spec || '', 'EA', cp.sheets))
  }
  if (r.plywood) wood.push(item(prices, '합판', '1220*2440*4.6T', 'EA', r.plywood))
  if (r.baseboard) wood.push(item(prices, '걸레받이/몰딩', String(cfg.cutLen), 'EA', r.baseboard))
  if (wood.length) out.push({ name: '목작업', items: [...wood, ...labor('목작업')] })

  if (r.wallpaperRolls) out.push({
    name: '도배작업',
    items: [item(prices, '벽지', '광폭합지', '롤', r.wallpaperRolls), ...labor('도배작업')],
  })
  if (r.filmArea) out.push({
    name: '필름작업',
    items: [item(prices, '필름', '', 'M2', Math.ceil(r.filmArea)), ...labor('필름작업')],
  })

  const bySize = (type: FloorArea['type']) => {
    const m = new Map<number, number>()
    for (const f of t.floors) {
      if (f.type !== type) continue
      const sheets = floorSheets(f)
      if (!sheets) continue
      const boxes = Math.ceil(sheets / (f.perBox || defaultPerBox(f.type, f.size)))
      m.set(f.size, (m.get(f.size) || 0) + boxes)
    }
    return [...m.entries()]
  }
  const tileRows = bySize('타일')
  if (tileRows.length) out.push({
    name: '타일작업',
    items: [
      ...tileRows.map(([size, boxes]) => item(prices, '포쉐린타일', `${size}*${size}`, 'BOX', boxes)),
      ...labor('타일작업'),
    ],
  })
  const decoRows = bySize('데코타일')
  if (decoRows.length) out.push({
    name: '데코타일작업',
    items: decoRows.map(([size, boxes]) => item(prices, '데코타일', `${size}*${size}`, 'BOX', boxes)),
  })

  const lights = t.lights.filter(l => l.name && l.qty > 0)
  if (lights.length) out.push({
    name: '조명',
    items: lights.map(l => {
      const it = item(prices, l.name, l.spec, l.unit || 'EA', l.qty)
      return { ...it, unit: l.unit || 'EA' }
    }),
  })
  return out
}
