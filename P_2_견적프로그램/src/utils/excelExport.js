import * as XLSX from 'xlsx'
import { calcSurfaceCost } from './surfaceCost.js'
import { calcLinearCombo } from './calculations.js'

const DIR_LABEL = { wallA: '벽A', wallB: '벽B', wallC: '벽C', wallD: '벽D', floor: '바닥', ceiling: '천장', wallExtra: '추가벽' }

function expandLightings(lightings) {
  const out = []
  for (const l of (lightings || [])) {
    if (!l.name) continue
    const isLine = l.name === '라인조명 T5' || l.name === '라인조명 T7'
    if (isLine && l.totalLengthMm > 0) {
      const combo = calcLinearCombo(l.totalLengthMm)
      combo.items.forEach(c => out.push({
        name: `${l.name} ${c.size}mm`, spec: l.spec || '',
        qty: c.count, unit: 'EA', unitPrice: l.unitPrice || 0, cost: c.count * (l.unitPrice || 0),
      }))
    } else if (l.qty > 0) {
      out.push({
        name: l.name, spec: l.spec || '',
        qty: l.qty, unit: 'EA', unitPrice: l.unitPrice || 0, cost: l.qty * (l.unitPrice || 0),
      })
    }
  }
  return out
}

function buildRoomRows(room, matOpts) {
  const rows = []
  const surfaceBlocks = []

  for (const sf of room.surfaces) {
    if (!sf.enabled || !sf.finishType) continue
    const result = calcSurfaceCost(room, sf, matOpts)
    if (!result || result.items.length === 0) continue
    surfaceBlocks.push({ sf, items: result.items })
  }

  surfaceBlocks.forEach(({ sf, items }) => {
    const sfName = DIR_LABEL[sf.direction] || sf.label
    items.forEach(item => {
      if (item.isFilm && item.sections?.length > 0) {
        item.sections.forEach((sec, i) => {
          rows.push({
            구분: sfName,
            항목: `${item.name} 구간${i + 1}`,
            규격: `폭${sec.widthMm}mm${sec.patternRepeatMm > 0 ? ` 패턴${sec.patternRepeatMm}` : ''}`,
            수량: sec.sectionM,
            단위: 'm',
            단가: sec.pricePerM || 0,
            금액: Math.round(sec.sectionCost || 0),
            비고: sec.lossM > 0 ? `로스${sec.lossM}m` : '',
          })
        })
      } else {
        rows.push({
          구분: sfName,
          항목: item.name,
          규격: item.spec || '',
          수량: item.qty || 0,
          단위: item.unit || '',
          단가: item.unitPrice || 0,
          금액: Math.round(item.cost || 0),
          비고: '',
        })
      }
    })
  })

  // 도어
  for (const d of (room.doors || [])) {
    if (!(d.qty > 0)) continue
    const unitPrice = d.unitPrice || 0
    rows.push({
      구분: '도어',
      항목: d.type,
      규격: `${Math.round(d.widthM * 1000)}×${Math.round(d.heightM * 1000)}mm${d.modelNo ? ` ${d.modelNo}` : ''}${d.color ? ` ${d.color}` : ''}`,
      수량: d.qty,
      단위: '짝',
      단가: unitPrice,
      금액: d.qty * unitPrice,
      비고: d.glass && d.glass !== '없음' ? `유리:${d.glass}` : '',
    })
  }

  // 조명
  expandLightings(room.lightings).forEach(l => {
    rows.push({
      구분: '조명',
      항목: l.name,
      규격: l.spec,
      수량: l.qty,
      단위: l.unit,
      단가: l.unitPrice,
      금액: Math.round(l.cost),
      비고: '',
    })
  })

  // 추가항목
  for (const e of (room.extras || [])) {
    if (!e.name || !(e.qty > 0)) continue
    const unitPrice = e.unitPrice || 0
    rows.push({
      구분: '추가',
      항목: e.name,
      규격: e.spec || '',
      수량: e.qty,
      단위: e.unit || 'EA',
      단가: unitPrice,
      금액: Math.round(e.qty * unitPrice),
      비고: '',
    })
  }

  return rows
}

function autoWidth(rows, headers) {
  return headers.map(h => {
    const maxLen = Math.max(
      h.length,
      ...rows.map(r => {
        const v = r[h]
        if (v == null) return 0
        return String(v).length
      })
    )
    // 한글은 대략 2배 너비
    const korChars = h.split('').filter(c => /[가-힯]/.test(c)).length
    return { wch: Math.min(40, maxLen + korChars + 2) }
  })
}

export function exportEstimateToExcel(rooms, matOpts, meta = {}) {
  const wb = XLSX.utils.book_new()

  const HEADERS = ['구분', '항목', '규격', '수량', '단위', '단가', '금액', '비고']
  let grandTotal = 0

  // 공간별 시트
  rooms.forEach((room, idx) => {
    const roomRows = buildRoomRows(room, matOpts)
    if (roomRows.length === 0) return

    const roomTotal = roomRows.reduce((s, r) => s + (Number(r.금액) || 0), 0)
    grandTotal += roomTotal

    const dims = (room.widthM > 0 && room.depthM > 0)
      ? `${Math.round(room.widthM * 1000)}×${Math.round(room.depthM * 1000)}×H${Math.round(room.heightM * 1000)}`
      : ''
    const titleRow = [[`${room.name}${dims ? ` (${dims})` : ''}`]]
    const emptyRow = [[]]

    const sheetData = [
      ...titleRow,
      emptyRow[0],
      HEADERS,
      ...roomRows.map(r => HEADERS.map(h => r[h])),
      emptyRow[0],
      ['', '', '', '', '', '합계', roomTotal, ''],
    ]
    const ws = XLSX.utils.aoa_to_sheet(sheetData)
    ws['!cols'] = autoWidth(roomRows, HEADERS)
    // 제목 셀 병합
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: HEADERS.length - 1 } }]
    // 시트명은 31자 제한 + 금지문자 제거
    const sheetName = (room.name || `공간${idx + 1}`).replace(/[\\/?*[\]:]/g, '').slice(0, 28) || `공간${idx + 1}`
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))
  })

  // 전체 요약 시트
  const summaryData = [
    [meta.projectName || '인테리어 견적서'],
    [],
    ['고객명', meta.clientName || ''],
    ['현장주소', meta.siteAddress || ''],
    ['작성일', meta.date || new Date().toISOString().slice(0, 10)],
    [],
    ['공간', '자재/공종 합계(원)'],
  ]
  rooms.forEach((room) => {
    const roomRows = buildRoomRows(room, matOpts)
    if (roomRows.length === 0) return
    const total = roomRows.reduce((s, r) => s + (Number(r.금액) || 0), 0)
    summaryData.push([room.name, total])
  })
  summaryData.push([])
  summaryData.push(['총합계(원)', grandTotal])
  if (meta.vatIncluded) {
    summaryData.push(['VAT(10%)', Math.round(grandTotal * 0.1)])
    summaryData.push(['VAT 포함 합계', grandTotal + Math.round(grandTotal * 0.1)])
  }

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
  summaryWs['!cols'] = [{ wch: 20 }, { wch: 22 }]
  summaryWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }]
  XLSX.utils.book_append_sheet(wb, summaryWs, '요약')

  // 파일명
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = meta.clientName || meta.projectName || '견적서'
  const filename = `${prefix}_${today}.xlsx`

  XLSX.writeFile(wb, filename)
}
