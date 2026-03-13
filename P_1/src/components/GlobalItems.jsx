import { useStore } from '../store/useStore.js'
import { useState } from 'react'

const TRADE_OPTIONS = ['가설작업', '설비작업', '전기통신작업', '소방작업', '목작업', '수장작업', '창호작업', '가구', '기타']

export default function GlobalItems() {
  const { globalItems, addGlobalItem, updateGlobalItem, deleteGlobalItem } = useStore()
  const [collapsed, setCollapsed] = useState(false)

  // 공종별 그룹
  const grouped = TRADE_OPTIONS.reduce((acc, t) => {
    acc[t] = globalItems.filter(gi => gi.trade === t)
    return acc
  }, {})

  const upd = (id, fields) => updateGlobalItem(id, fields)

  return (
    <div style={s.card}>
      <div style={s.header} onClick={() => setCollapsed(!collapsed)}>
        <span style={s.collapseIcon}>{collapsed ? '▶' : '▼'}</span>
        <h2 style={s.title}>전체 항목 (실 외 공통)</h2>
        <span style={s.hint}>가설/설비/전기/소방 등 현장 공통 공종</span>
      </div>

      {!collapsed && (
        <div style={s.body}>
          {TRADE_OPTIONS.map(trade => {
            const items = grouped[trade] || []
            if (items.length === 0) return null
            return (
              <div key={trade} style={s.tradeBlock}>
                <div style={s.tradeTitle}>{trade}</div>
                <div style={s.tableHead}>
                  <span style={s.chk}></span>
                  <span style={s.colName}>품명</span>
                  <span style={s.colSpec}>규격/비고</span>
                  <span style={s.colUnit}>단위</span>
                  <span style={s.colQty}>수량</span>
                  <span style={s.colPrice}>재료비단가</span>
                  <span style={s.colPrice}>노무비단가</span>
                  <span style={s.colPrice}>경비단가</span>
                  <span style={s.colTotal}>합계금액</span>
                  <span style={s.colDel}></span>
                </div>
                {items.map(gi => {
                  const total = (gi.matUnitPrice + gi.labUnitPrice + gi.expUnitPrice) * gi.qty
                  return (
                    <div key={gi.id} style={{ ...s.row, opacity: gi.enabled ? 1 : 0.4 }}>
                      <span style={s.chk}>
                        <input type="checkbox" checked={gi.enabled}
                          onChange={e => upd(gi.id, { enabled: e.target.checked })} />
                      </span>
                      <span style={s.colName}>
                        <input value={gi.name}
                          onChange={e => upd(gi.id, { name: e.target.value })}
                          style={s.inputFull} placeholder="품명" />
                      </span>
                      <span style={s.colSpec}>
                        <input value={gi.spec || ''}
                          onChange={e => upd(gi.id, { spec: e.target.value })}
                          style={s.inputFull} placeholder="규격/비고" />
                      </span>
                      <span style={s.colUnit}>
                        <input value={gi.unit}
                          onChange={e => upd(gi.id, { unit: e.target.value })}
                          style={s.inputUnit} />
                      </span>
                      <span style={s.colQty}>
                        <input type="number" min="0" value={gi.qty || ''}
                          onChange={e => upd(gi.id, { qty: Number(e.target.value) })}
                          style={s.inputNum} />
                      </span>
                      <span style={s.colPrice}>
                        <input type="number" min="0" value={gi.matUnitPrice || ''}
                          placeholder="0"
                          onChange={e => upd(gi.id, { matUnitPrice: Number(e.target.value) })}
                          style={s.inputNum} />
                      </span>
                      <span style={s.colPrice}>
                        <input type="number" min="0" value={gi.labUnitPrice || ''}
                          placeholder="0"
                          onChange={e => upd(gi.id, { labUnitPrice: Number(e.target.value) })}
                          style={s.inputNum} />
                      </span>
                      <span style={s.colPrice}>
                        <input type="number" min="0" value={gi.expUnitPrice || ''}
                          placeholder="0"
                          onChange={e => upd(gi.id, { expUnitPrice: Number(e.target.value) })}
                          style={s.inputNum} />
                      </span>
                      <span style={{ ...s.colTotal, textAlign: 'right', fontWeight: 700, color: '#1e4078' }}>
                        {total > 0 ? total.toLocaleString() : '-'}
                      </span>
                      <span style={s.colDel}>
                        <button onClick={() => deleteGlobalItem(gi.id)} style={s.btnDel}>✕</button>
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}

          <div style={s.addRow}>
            <button onClick={addGlobalItem} style={s.btnAdd}>+ 항목 추가</button>
            <span style={s.addHint}>추가된 항목의 공종은 직접 선택하세요</span>
          </div>

          {/* 공종 선택 (커스텀 항목용) */}
          {globalItems.filter(gi => gi.trade === '기타' || !TRADE_OPTIONS.slice(0, -1).includes(gi.trade)).map(gi => (
            <div key={gi.id + '_trade'} style={{ display: 'none' }}>
              {/* trade 선택은 품명 옆에서 처리 */}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const s = {
  card: { background: '#fff', borderRadius: 8, marginBottom: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.09)', overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#2d5499', cursor: 'pointer', userSelect: 'none' },
  collapseIcon: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  title: { fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 },
  hint: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginLeft: 6 },
  body: { padding: '10px 12px' },
  tradeBlock: { marginBottom: 12, border: '1px solid #e0e8f4', borderRadius: 5, overflow: 'hidden' },
  tradeTitle: { padding: '5px 10px', background: '#dde8f8', fontSize: 12, fontWeight: 700, color: '#1e4078', borderBottom: '1px solid #c8d4e8' },

  tableHead: { display: 'flex', gap: 4, padding: '4px 8px', background: '#f5f8ff', fontSize: 10, color: '#888', fontWeight: 700, alignItems: 'center' },
  row: { display: 'flex', gap: 4, padding: '4px 8px', alignItems: 'center', borderBottom: '1px solid #f0f2f5' },

  chk:      { width: 18, flexShrink: 0 },
  colName:  { flex: 2.5 },
  colSpec:  { flex: 1.5 },
  colUnit:  { width: 42, flexShrink: 0 },
  colQty:   { width: 50, flexShrink: 0 },
  colPrice: { width: 80, flexShrink: 0 },
  colTotal: { width: 80, flexShrink: 0, fontSize: 11 },
  colDel:   { width: 22, flexShrink: 0 },

  inputFull: { width: '100%', border: '1px solid #d0d7e3', borderRadius: 3, padding: '3px 5px', fontSize: 11 },
  inputUnit: { width: 40, border: '1px solid #d0d7e3', borderRadius: 3, padding: '3px 4px', fontSize: 11, textAlign: 'center' },
  inputNum:  { width: '100%', border: '1px solid #d0d7e3', borderRadius: 3, padding: '3px 4px', fontSize: 11, textAlign: 'right' },

  addRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px' },
  addHint: { fontSize: 10, color: '#aaa' },
  btnAdd: { fontSize: 11, padding: '4px 14px', background: '#2d5499', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 },
  btnDel: { fontSize: 10, padding: '1px 5px', background: '#fee', border: '1px solid #fcc', borderRadius: 3, cursor: 'pointer', color: '#c00' },
}
