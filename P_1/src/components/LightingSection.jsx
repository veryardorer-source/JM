import { useStore } from '../store/useStore.js'
import { LIGHTING_TYPES } from '../data/materials.js'
import { calcLinearCombo } from '../utils/calculations.js'

function LightingRow({ roomId, l, updateLighting, deleteLighting }) {
  const isLinear = l.type.startsWith('T5') || l.type.startsWith('T7')
  const totalMm = l.totalLengthMm || 0
  const prefix = l.type.startsWith('T5') ? 'T5' : 'T7'
  const combo = isLinear && totalMm > 0 ? calcLinearCombo(totalMm) : null

  return (
    <div style={s.rowWrap}>
      <div style={s.row}>
        <select
          value={l.type}
          onChange={e => updateLighting(roomId, l.id, { type: e.target.value })}
          style={{ ...s.input, flex: 2 }}
        >
          {LIGHTING_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <input
          value={l.spec}
          onChange={e => updateLighting(roomId, l.id, { spec: e.target.value })}
          placeholder="규격 입력"
          style={{ ...s.input, flex: 2 }}
        />
        <input
          type="number" min="0" value={l.qty}
          onChange={e => updateLighting(roomId, l.id, { qty: Number(e.target.value) })}
          style={{ ...s.input, width: 55, textAlign: 'center' }}
        />
        {isLinear ? (
          <label style={s.mmLabel}>
            <span style={s.mmHint}>총길이(mm)</span>
            <input
              type="number" min="0" step="1"
              value={totalMm || ''}
              placeholder="예) 7800"
              onChange={e => {
                const mm = Number(e.target.value)
                const c = calcLinearCombo(mm)
                const autoQty = c ? c.items.reduce((s, i) => s + i.count, 0) : 0
                updateLighting(roomId, l.id, { totalLengthMm: mm, lengthM: mm / 1000, qty: autoQty || 1 })
              }}
              style={{ ...s.input, width: 80, textAlign: 'center', borderColor: '#1e4078', background: '#f0f4ff' }}
            />
          </label>
        ) : (
          <input
            type="number" min="0" step="0.1" value={l.lengthM || ''}
            placeholder="0"
            onChange={e => updateLighting(roomId, l.id, { lengthM: Number(e.target.value) })}
            style={{ ...s.input, width: 65, textAlign: 'center' }}
          />
        )}
        <button onClick={() => deleteLighting(roomId, l.id)} style={s.delBtn}>✕</button>
      </div>

      {combo && combo.items.length > 0 && (
        <div style={s.comboRow}>
          <span style={s.comboLabel}>{prefix} 조합</span>
          {combo.items.map(({ size, count }) => (
            <span key={size} style={s.comboBadge}>{size}mm × {count}</span>
          ))}
          {combo.remaining > 0 && (
            <span style={s.comboWarn}>⚠ {combo.remaining}mm 나머지</span>
          )}
          <span style={s.comboTotal}>= {totalMm}mm</span>
        </div>
      )}
    </div>
  )
}

export default function LightingSection({ room }) {
  const { addLighting, updateLighting, deleteLighting } = useStore()
  const lightings = room.lightings || []

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <span style={s.title}>조명</span>
        <button onClick={() => addLighting(room.id)} style={s.addBtn}>+ 추가</button>
      </div>
      {lightings.length > 0 && (
        <div style={s.tableWrap}>
          <div style={s.thead}>
            <span style={{ flex: 2 }}>종류</span>
            <span style={{ flex: 2 }}>규격/모델</span>
            <span style={{ width: 55, textAlign: 'center' }}>수량(EA)</span>
            <span style={{ width: 80, textAlign: 'center' }}>길이(m/mm)</span>
            <span style={{ width: 24 }}></span>
          </div>
          {lightings.map(l => (
            <LightingRow key={l.id} roomId={room.id} l={l}
              updateLighting={updateLighting} deleteLighting={deleteLighting} />
          ))}
        </div>
      )}
    </div>
  )
}

const s = {
  wrap: { marginTop: 8, borderTop: '1px dashed #dde4f0', paddingTop: 8 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  title: { fontSize: 12, fontWeight: 700, color: '#555' },
  addBtn: { fontSize: 11, padding: '3px 10px', background: '#f0f4fa', border: '1px solid #c8d4e8', borderRadius: 4, cursor: 'pointer', color: '#1e4078', fontWeight: 600 },
  tableWrap: { display: 'flex', flexDirection: 'column', gap: 4 },
  thead: { display: 'flex', gap: 6, alignItems: 'center', fontSize: 10, color: '#aaa', fontWeight: 600, padding: '0 0 3px' },
  rowWrap: { display: 'flex', flexDirection: 'column', gap: 3 },
  row: { display: 'flex', gap: 6, alignItems: 'center' },
  input: { border: '1px solid #d0d7e3', borderRadius: 4, padding: '4px 5px', fontSize: 12 },
  delBtn: { fontSize: 10, padding: '2px 5px', background: '#fee', border: '1px solid #fcc', borderRadius: 3, cursor: 'pointer', color: '#c00', flexShrink: 0 },
  comboRow: {
    display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap',
    padding: '4px 8px', background: '#e8f0fe', borderRadius: 4,
    borderLeft: '3px solid #1e4078',
  },
  comboLabel: { fontSize: 10, color: '#1e4078', fontWeight: 700 },
  comboBadge: { fontSize: 11, background: '#1e4078', color: '#fff', borderRadius: 3, padding: '1px 8px', fontWeight: 700 },
  comboWarn: { fontSize: 11, color: '#c44000', fontWeight: 700 },
  comboTotal: { fontSize: 10, color: '#888', marginLeft: 4 },
  mmLabel: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 },
  mmHint: { fontSize: 9, color: '#1e4078', fontWeight: 700 },
}
