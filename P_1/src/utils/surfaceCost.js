// ─────────────────────────────────────────────
// 면(surface) 하나의 전체 비용 계산
// ─────────────────────────────────────────────
import {
  GAKJAE, SEOKGO, MDF, WALLPAPER, TILE, FLOORING, LUBA, TEX,
} from '../data/materials.js'
import {
  calcGakjae, calcGakjaeCost,
  calcSeokgo, calcBoard,
  calcWallpaper, calcTile, calcFlooring, calcLuba, calcFilmSections,
  netAreaSqm,
} from './calculations.js'

// 면의 치수 반환 (방향에 따라 가로/높이 결정)
export function getSurfaceDimensions(room, sf) {
  const { widthM, depthM, heightM } = room
  switch (sf.direction) {
    case 'floor':   return { widthMm: widthM * 1000, heightMm: depthM * 1000, areaSqm: widthM * depthM }
    case 'ceiling': return { widthMm: widthM * 1000, heightMm: depthM * 1000, areaSqm: widthM * depthM }
    case 'wallN':
    case 'wallS':   return { widthMm: widthM * 1000, heightMm: heightM * 1000, areaSqm: widthM * heightM }
    case 'wallE':
    case 'wallW':   return { widthMm: depthM * 1000, heightMm: heightM * 1000, areaSqm: depthM * heightM }
    default:        return { widthMm: 0, heightMm: 0, areaSqm: 0 }
  }
}

export function calcSurfaceCost(room, sf) {
  if (!sf.enabled || sf.finishType === 'none' || !sf.finishType) return { items: [], total: 0 }

  const { widthMm, heightMm, areaSqm } = getSurfaceDimensions(room, sf)
  if (areaSqm <= 0) return { items: [], total: 0 }

  const netArea = netAreaSqm(widthMm / 1000, heightMm / 1000, sf.openings)
  const items = []

  // ── 각재 (바닥재 제외) ──────────────────────────
  if (sf.finishType !== 'flooring') {
    const { breakdown } = calcGakjae(widthMm, heightMm)
    const cost = calcGakjaeCost(breakdown)
    breakdown.forEach(({ length, count }) => {
      const gak = GAKJAE.find(g => g.length === length)
      if (!gak || count === 0) return
      const dan = Math.ceil(count / gak.countPerDan)
      items.push({
        name: `각재 28×28×${length}`,
        spec: `${dan}단 (${count}본)`,
        qty: dan,
        unit: '단',
        unitPrice: gak.pricePerDan,
        cost: dan * gak.pricePerDan,
      })
    })
  }

  // ── 석고보드 ─────────────────────────────────────
  const needsSeokgo = ['wallpaper', 'paint', 'film', 'luba', 'tile'].includes(sf.finishType)
  // 텍스는 각재 위에 직접 시공 (석고보드 없음)
  if (needsSeokgo) {
    const layers = sf.finishType === 'paint' ? 2 : 1
    const seokgoType = sf.finishType === 'tile' ? 'sg_waterproof' : sf.seokgoType
    const sg = SEOKGO.find(s => s.id === seokgoType) || SEOKGO[0]
    const { sheets, cost } = calcSeokgo(netArea, layers, sg.pricePerSheet)
    items.push({
      name: sg.name,
      spec: layers > 1 ? `${layers}겹` : '',
      qty: sheets,
      unit: '장',
      unitPrice: sg.pricePerSheet,
      cost,
    })
  }

  // ── MDF (인테리어필름) ───────────────────────────
  if (sf.finishType === 'film') {
    const mdf = MDF.find(m => m.id === sf.mdfId) || MDF.find(m => m.id === 'mdf_9')
    const { sheets, cost } = calcBoard(netArea, mdf.areaPerSheet, mdf.pricePerSheet)
    items.push({
      name: mdf.name,
      spec: '',
      qty: sheets,
      unit: '장',
      unitPrice: mdf.pricePerSheet,
      cost,
    })
  }

  // ── 마감재 ───────────────────────────────────────
  switch (sf.finishType) {
    case 'wallpaper': {
      const wp = WALLPAPER.find(w => w.id === sf.finishMaterialId) || WALLPAPER[0]
      const { rolls, cost } = calcWallpaper(netArea, wp.pricePerRoll, wp.pyungPerRoll)
      items.push({ name: wp.name, spec: `${rolls}롤`, qty: rolls, unit: '롤', unitPrice: wp.pricePerRoll, cost })
      break
    }
    case 'paint': {
      items.push({
        name: '도장(페인트)',
        spec: `${Math.round(netArea * 10) / 10}㎡`,
        qty: Math.round(netArea * 10) / 10,
        unit: '㎡',
        unitPrice: sf.paintPricePerSqm || 0,
        cost: (sf.paintPricePerSqm || 0) * netArea,
      })
      break
    }
    case 'tile': {
      const tile = TILE.find(t => t.id === sf.finishMaterialId) || TILE[0]
      const { boxes, cost } = calcTile(netArea, tile.areaPerBox, tile.pricePerBox)
      items.push({ name: tile.name, spec: `${boxes}BOX`, qty: boxes, unit: 'BOX', unitPrice: tile.pricePerBox, cost })
      break
    }
    case 'flooring': {
      const fl = FLOORING.find(f => f.id === sf.finishMaterialId) || FLOORING[0]
      const { units, cost } = calcFlooring(areaSqm, fl.areaPerUnit, fl.pricePerUnit, fl.unit)
      items.push({ name: fl.name, spec: '', qty: units, unit: fl.unit, unitPrice: fl.pricePerUnit, cost })
      break
    }
    case 'luba': {
      const lu = LUBA[0]
      const { packs, cost } = calcLuba(netArea, lu.areaPerPack, lu.pricePerPack)
      items.push({ name: lu.name, spec: `${packs}팩`, qty: packs, unit: '팩', unitPrice: lu.pricePerPack, cost })
      break
    }
    case 'tex': {
      const tex = TEX.find(t => t.id === sf.finishMaterialId) || TEX[0]
      const pricePerBox = sf.texPricePerBox || 0
      const boxes = Math.ceil((netArea / tex.areaPerBox) * 1.1)
      const cost = boxes * pricePerBox
      items.push({ name: tex.name, spec: `${boxes}BOX`, qty: boxes, unit: 'BOX', unitPrice: pricePerBox, cost })
      break
    }
    case 'film': {
      const pricePerM = sf.filmPricePerM || 0
      const { sectionResults, totalM, cost } = calcFilmSections(
        sf.filmSections || [],
        heightMm,
        pricePerM
      )
      // 면별 1개 항목 (구간 상세는 SurfaceRow에서 표시)
      // isFilm 플래그로 Summary에서 별도 집계
      items.push({
        name: '인테리어필름',
        spec: sf.label,                        // 면 이름 (벽(북) 등)
        surfaceLabel: sf.label,
        sections: sectionResults,
        qty: totalM,
        unit: 'm',
        unitPrice: pricePerM,
        cost,
        isFilm: true,
      })
      break
    }
    default:
      break
  }

  const total = items.reduce((s, i) => s + i.cost, 0)
  return { items, total }
}
