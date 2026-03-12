import { useStore } from '../store/useStore.js'
import { calcSurfaceCost } from '../utils/surfaceCost.js'
import { generatePDF } from '../utils/pdfGenerator.js'

export default function Summary() {
  const { project, rooms } = useStore()

  const materialMap = {}   // 일반 자재
  const filmRows = []      // 필름 면별 집계
  let grandTotal = 0

  rooms.forEach(room => {
    room.surfaces.forEach(sf => {
      const result = calcSurfaceCost(room, sf)
      if (!result) return

      result.items.forEach(item => {
        if (item.isFilm) {
          // 필름은 별도 집계
          filmRows.push({
            roomName: room.name,
            surfaceLabel: item.surfaceLabel,
            sections: item.sections || [],
            totalM: item.qty,
            pricePerM: item.unitPrice,
            cost: item.cost,
          })
        } else {
          const key = `${item.name}||${item.unit}`
          if (!materialMap[key]) {
            materialMap[key] = { name: item.name, unit: item.unit, qty: 0, cost: 0 }
          }
          materialMap[key].qty  += item.qty  || 0
          materialMap[key].cost += item.cost || 0
        }
      })
      grandTotal += result.total
    })
  })

  const materialList = Object.values(materialMap).sort((a, b) => b.cost - a.cost)
  const filmTotalM   = Math.round(filmRows.reduce((s, r) => s + r.totalM, 0) * 10) / 10
  const filmTotalCost = filmRows.reduce((s, r) => s + r.cost, 0)
  const hasFilm = filmRows.length > 0

  return (
    <div style={s.card}>
      <div style={s.header}>
        <h2 style={s.title}>견적 합계</h2>
        <button onClick={() => generatePDF(project, rooms)} style={s.pdfBtn}>PDF 출력</button>
      </div>

      {materialList.length === 0 && !hasFilm ? (
        <p style={s.empty}>실을 추가하고 마감재를 선택하면 견적이 계산됩니다.</p>
      ) : (
        <>
          {/* ── 일반 자재 테이블 ── */}
          {materialList.length > 0 && (
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>자재명</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>수량</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>단위</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>금액(원)</th>
                </tr>
              </thead>
              <tbody>
                {materialList.map(m => (
                  <tr key={`${m.name}||${m.unit}`} style={s.tr}>
                    <td style={s.td}>{m.name}</td>
                    <td style={{ ...s.td, textAlign: 'right', fontWeight: 600, color: '#1e4078' }}>
                      {fmtQty(m.qty, m.unit)}
                    </td>
                    <td style={{ ...s.td, textAlign: 'center', color: '#888' }}>{m.unit}</td>
                    <td style={{ ...s.td, textAlign: 'right' }}>{Math.round(m.cost).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ── 인테리어필름 전용 섹션 ── */}
          {hasFilm && (
            <div style={s.filmSection}>
              <div style={s.filmTitle}>인테리어필름</div>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={s.th}>실 / 면</th>
                    <th style={{ ...s.th, textAlign: 'right' }}>구간수</th>
                    <th style={{ ...s.th, textAlign: 'right' }}>소요(m)</th>
                    <th style={{ ...s.th, textAlign: 'right' }}>금액(원)</th>
                  </tr>
                </thead>
                <tbody>
                  {filmRows.map((row, i) => (
                    <tr key={i} style={s.tr}>
                      <td style={s.td}>
                        <span style={s.roomBadge}>{row.roomName}</span>
                        {row.surfaceLabel}
                      </td>
                      <td style={{ ...s.td, textAlign: 'right', color: '#888' }}>
                        {row.sections.length}개
                      </td>
                      <td style={{ ...s.td, textAlign: 'right', fontWeight: 600, color: '#1e4078' }}>
                        {row.totalM.toFixed(1)}m
                      </td>
                      <td style={{ ...s.td, textAlign: 'right' }}>
                        {Math.round(row.cost).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={s.filmFoot}>
                    <td style={s.td} colSpan={2}>필름 전체 합계</td>
                    <td style={{ ...s.td, textAlign: 'right', fontWeight: 800, fontSize: 14, color: '#1e4078' }}>
                      {filmTotalM.toFixed(1)}m
                    </td>
                    <td style={{ ...s.td, textAlign: 'right', fontWeight: 700 }}>
                      {Math.round(filmTotalCost).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* ── 총 합계 ── */}
          <div style={s.total}>
            <span>총 합계 (자재비)</span>
            <span style={s.totalNum}>{Math.round(grandTotal).toLocaleString()} 원</span>
          </div>
        </>
      )}
    </div>
  )
}

function fmtQty(qty, unit) {
  if (!qty || qty === 0) return '-'
  if (unit === 'm')  return (Math.round(qty * 10) / 10).toFixed(1)
  if (unit === '㎡') return (Math.round(qty * 100) / 100).toFixed(2)
  return Math.round(qty)
}

const s = {
  card:    { background: '#fff', borderRadius: 8, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '2px solid #1e4078', paddingBottom: 6 },
  title:   { fontSize: 14, fontWeight: 700, color: '#1e4078' },
  pdfBtn:  { fontSize: 12, padding: '6px 14px', background: '#1e4078', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 600 },
  empty:   { color: '#aaa', fontSize: 13, textAlign: 'center', padding: 24 },
  table:   { width: '100%', borderCollapse: 'collapse', marginBottom: 8 },
  thead:   { background: '#f0f4fa' },
  th:      { padding: '6px 8px', fontSize: 11, fontWeight: 700, color: '#1e4078', textAlign: 'left', borderBottom: '1px solid #dde4f0' },
  tr:      { borderBottom: '1px solid #f5f5f5' },
  td:      { padding: '5px 8px', fontSize: 12, color: '#333' },
  // 필름 전용
  filmSection: { marginTop: 10, marginBottom: 4, border: '1px solid #c8d8f0', borderRadius: 6, overflow: 'hidden' },
  filmTitle:   { background: '#1e4078', color: '#fff', fontSize: 12, fontWeight: 700, padding: '5px 10px' },
  filmFoot:    { background: '#dde8f8', borderTop: '2px solid #1e4078' },
  roomBadge:   { fontSize: 10, background: '#eef2f8', color: '#1e4078', borderRadius: 3, padding: '1px 5px', marginRight: 5 },
  // 합계
  total:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#eef2f8', borderRadius: 6, fontWeight: 700, fontSize: 14, color: '#1e4078', marginTop: 8 },
  totalNum: { fontSize: 18 },
}
