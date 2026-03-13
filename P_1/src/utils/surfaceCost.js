// ─────────────────────────────────────────────
// 면(surface) 하나의 전체 비용 계산
// ─────────────────────────────────────────────
import {
  GAKJAE, SEOKGO, MDF, HAPAN, WALLPAPER, TILE, FLOORING, LUBA, TEX, INSULATION,
} from '../data/materials.js'
import {
  calcGakjae, calcGakjaeCost, calcCeilingGakjae,
  calcSeokgo, calcBoard,
  calcWallpaper, calcTile, calcFlooring, calcLuba, calcFilmSections,
} from './calculations.js'

// 면의 치수 반환 (방향에 따라 가로/높이 결정)
export function getSurfaceDimensions(room, sf) {
  const { widthM, depthM, heightM } = room
  switch (sf.direction) {
    case 'floor':   return { widthMm: widthM * 1000, heightMm: depthM * 1000, areaSqm: widthM * depthM }
    case 'ceiling': return { widthMm: widthM * 1000, heightMm: depthM * 1000, areaSqm: widthM * depthM }
    case 'wallA': case 'wallB':
    case 'wallN': case 'wallS':  // 구버전 호환
      return { widthMm: widthM * 1000, heightMm: heightM * 1000, areaSqm: widthM * heightM }
    case 'wallC': case 'wallD':
    case 'wallE': case 'wallW':  // 구버전 호환
      return { widthMm: depthM * 1000, heightMm: heightM * 1000, areaSqm: depthM * heightM }
    case 'wallExtra': {
      const w = (sf.extraWidthM || 0) * 1000
      const h = (sf.extraHeightM || heightM) * 1000
      return { widthMm: w, heightMm: h, areaSqm: (sf.extraWidthM || 0) * (sf.extraHeightM || heightM) }
    }
    default:        return { widthMm: 0, heightMm: 0, areaSqm: 0 }
  }
}

export function calcSurfaceCost(room, sf) {
  if (!sf.enabled || sf.finishType === 'none' || !sf.finishType) return { items: [], total: 0 }

  const { widthMm, heightMm, areaSqm } = getSurfaceDimensions(room, sf)
  if (areaSqm <= 0) return { items: [], total: 0 }

  // 개구부 차감 없이 전체 면적 사용
  const area = areaSqm
  const items = []

  const isWall = !['floor', 'ceiling'].includes(sf.direction)

  // ── 각재 (바닥, 바닥재, 텍스 제외) ────────────────────
  if (sf.direction !== 'floor' && sf.finishType !== 'flooring' && sf.finishType !== 'tex') {
    if (sf.direction === 'ceiling') {
      // 천장: 트러스 구조 계산 (짧은 면 1000mm / 긴 면 450mm)
      // 스터드 높이 = 슬라브 - 마감 (slabHeightM 미입력 시 room.heightM 사용)
      const studHeightM = (room.slabHeightM && room.slabHeightM > room.heightM)
        ? room.slabHeightM - room.heightM
        : room.heightM
      const { breakdown, mainCount, subCount, supportHapanSheets, pieceHeightMm } =
        calcCeilingGakjae(widthMm, heightMm, studHeightM, room.heightM * 1000)
      breakdown.forEach(({ length, count }) => {
        const gak = GAKJAE.find(g => g.length === length)
        if (!gak || count === 0) return
        const dan = Math.ceil(count / gak.countPerDan)
        items.push({
          name: `각재 28×28×${length}`,
          spec: `주${mainCount}본/부${subCount}본 트러스`,
          qty: dan,
          unit: '단',
          unitPrice: gak.pricePerDan,
          cost: dan * gak.pricePerDan,
        })
      })
      // 지지 합판 (4.6T 기준, 재단 높이 = 천장 높이)
      if (supportHapanSheets > 0) {
        const hapan = HAPAN.find(h => h.id === 'hp_normal_4') || HAPAN[0]
        items.push({
          name: hapan.name,
          spec: `천장스터드지지 ${Math.round(pieceHeightMm)}mm재단 (${mainCount}×${subCount}=${mainCount * subCount}점)`,
          qty: supportHapanSheets,
          unit: '장',
          unitPrice: hapan.pricePerSheet,
          cost: supportHapanSheets * hapan.pricePerSheet,
        })
      }
    } else {
      // 벽면: 세로상 450mm 간격, 가로상 단수(2 or 3) 적용
      const { breakdown, rowCount } = calcGakjae(widthMm, heightMm, sf.gakjaeRows ?? null)
      breakdown.forEach(({ length, count }) => {
        const gak = GAKJAE.find(g => g.length === length)
        if (!gak || count === 0) return
        const dan = Math.ceil(count / gak.countPerDan)
        items.push({
          name: `각재 28×28×${length}`,
          spec: `세로 450간격 / 가로 ${rowCount}단`,
          qty: dan,
          unit: '단',
          unitPrice: gak.pricePerDan,
          cost: dan * gak.pricePerDan,
        })
      })
    }
  }

  // ── M-BAR (텍스 천장) ────────────────────────────
  if (sf.finishType === 'tex') {
    items.push({
      name: 'M-BAR',
      qty: area,
      unit: '㎡',
      unitPrice: 0,
      cost: 0,
    })
  }

  // ── 합판 (칸막이벽) ─────────────────────────────
  if (isWall && sf.wallType === 'partition') {
    const hapan = HAPAN.find(h => h.id === sf.hapanId) || HAPAN.find(h => h.id === 'hp_normal_11')
    const { sheets, cost } = calcBoard(area, hapan.areaPerSheet, hapan.pricePerSheet)
    items.push({
      name: hapan.name,
      spec: '',
      qty: sheets,
      unit: '장',
      unitPrice: hapan.pricePerSheet,
      cost,
    })
  }

  // ── 흡음재 ──────────────────────────────────────
  if (sf.insulationType && sf.insulationType !== 'none') {
    const ins = INSULATION.find(i => i.id === sf.insulationType)
    if (ins) {
      const qty = Math.ceil(area * 1.05)
      const cost = qty * ins.pricePerSqm
      items.push({ name: ins.name, qty, unit: '㎡', unitPrice: ins.pricePerSqm, cost })
    }
  }

  // ── 석고보드 (바닥 제외) ─────────────────────────────
  const needsSeokgo = sf.direction !== 'floor' && ['wallpaper', 'paint', 'film', 'luba', 'tile'].includes(sf.finishType)
  if (needsSeokgo) {
    const layers = sf.finishType === 'paint' ? 2 : 1
    const seokgoType = sf.finishType === 'tile' ? 'sg_waterproof' : sf.seokgoType
    const sg = SEOKGO.find(s => s.id === seokgoType) || SEOKGO[0]
    const { sheets, cost } = calcSeokgo(area, layers, sg.pricePerSheet)
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
    const { sheets, cost } = calcBoard(area, mdf.areaPerSheet, mdf.pricePerSheet)
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
      const { rolls, cost } = calcWallpaper(area, wp.pricePerRoll, wp.pyungPerRoll)
      items.push({ name: wp.name, spec: `${rolls}롤`, qty: rolls, unit: '롤', unitPrice: wp.pricePerRoll, cost })
      break
    }
    case 'paint': {
      items.push({
        name: '도장(페인트)',
        spec: `${Math.round(area * 10) / 10}㎡`,
        qty: Math.round(area * 10) / 10,
        unit: '㎡',
        unitPrice: sf.paintPricePerSqm || 0,
        cost: (sf.paintPricePerSqm || 0) * area,
      })
      break
    }
    case 'tile': {
      const tile = TILE.find(t => t.id === sf.finishMaterialId) || TILE[0]
      const { boxes, cost } = calcTile(widthMm, heightMm, tile)
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
      const { packs, cost } = calcLuba(area, lu.areaPerPack, lu.pricePerPack)
      items.push({ name: lu.name, spec: `${packs}팩`, qty: packs, unit: '팩', unitPrice: lu.pricePerPack, cost })
      break
    }
    case 'tex': {
      const tex = TEX.find(t => t.id === sf.finishMaterialId) || TEX[0]
      const pricePerBox = sf.texPricePerBox || 0
      const boxes = Math.ceil((area / tex.areaPerBox) * 1.1)
      const cost = boxes * pricePerBox
      items.push({ name: tex.name, spec: `${boxes}BOX`, qty: boxes, unit: 'BOX', unitPrice: pricePerBox, cost })
      break
    }
    case 'film': {
      const defaultPricePerM = sf.filmPricePerM || 0
      const { sectionResults, totalM, cost } = calcFilmSections(
        sf.filmSections || [],
        heightMm,
        defaultPricePerM
      )
      // 필름 종류(filmName)별로 그룹화 → 종류가 다르면 별도 항목
      const filmGroups = {}
      sectionResults.forEach(sec => {
        const key = sec.filmName || '인테리어필름'
        if (!filmGroups[key]) {
          filmGroups[key] = { filmName: key, sections: [], totalM: 0, cost: 0, pricePerM: sec.pricePerM }
        }
        filmGroups[key].sections.push(sec)
        filmGroups[key].totalM = Math.round((filmGroups[key].totalM + sec.sectionM) * 10) / 10
        filmGroups[key].cost += sec.sectionCost
      })
      Object.values(filmGroups).forEach(group => {
        items.push({
          name: group.filmName,
          spec: sf.label,
          surfaceLabel: sf.label,
          sections: group.sections,
          qty: group.totalM,
          unit: 'm',
          unitPrice: group.pricePerM,
          cost: group.cost,
          isFilm: true,
        })
      })
      // 섹션이 없는 경우 빈 항목
      if (sectionResults.length === 0) {
        items.push({
          name: '인테리어필름',
          spec: sf.label,
          surfaceLabel: sf.label,
          sections: [],
          qty: 0,
          unit: 'm',
          unitPrice: defaultPricePerM,
          cost: 0,
          isFilm: true,
        })
      }
      break
    }
    default:
      break
  }

  const total = items.reduce((s, i) => s + i.cost, 0)
  return { items, total }
}
